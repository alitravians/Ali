/*
 * alitravians Desktop Patcher
 *
 * Runs in Electron's main process. The installer patches Discord's app.asar so
 * that this file is `require()`d at startup. We then:
 *   1. Re-resolve the original Discord asar (renamed by the installer to
 *      `_app.asar`) and re-point `require.main.filename` + `app.setAppPath`
 *      at it so Discord boots normally afterwards.
 *   2. Maintain a writable copy of `renderer.js` in alitravians's data dir so
 *      bugfixes/plugins/improvements can ship via the in-app updater without
 *      requiring the user to re-run the installer.
 *   3. Register IPC handlers that let the renderer download a fresh
 *      `renderer.js` from GitHub Releases, stage it as `renderer.next.js`,
 *      and trigger an Electron relaunch to apply it.
 *   4. Hook `browser-window-created` and inject our renderer payload into
 *      every Discord window once its DOM is ready, with a `globalThis.__BOON__`
 *      bootstrap object the renderer reads for version/update state.
 *
 * Architecture is adapted from Vencord's main/patcher.ts (GPL-3.0-or-later,
 * (c) Vendicated and contributors). See ../../../../LICENSE-NOTICE.md.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

"use strict";

const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");

console.log("[alitravians] patcher loading…");

// ─── Resolve & boot the original Discord app.asar ─────────────────────────────
const injectorPath = require.main.filename;
// On some Linux distros (e.g. discord_arch_electron) the parent dir's name is
// `app.asar` rather than `_app.asar`; mirror Vencord's detection.
const asarName = require.main.path.endsWith("app.asar") ? "_app.asar" : "app.asar";
const asarPath = path.join(path.dirname(injectorPath), "..", asarName);

let discordPkg;
try {
    discordPkg = require(path.join(asarPath, "package.json"));
} catch (err) {
    console.error("[alitravians] cannot find original Discord package.json at", asarPath, err);
    throw err;
}

require.main.filename = path.join(asarPath, discordPkg.main);
// `setAppPath` is private but stable. Vencord uses it for the same reason.
app.setAppPath(asarPath);

// ─── alitravians runtime dir layout ──────────────────────────────────────────
// The installer drops `patcher.js` + `renderer.js` together into a writable
// directory. The patcher then maintains the same dir as its update store:
//   <dataDir>/patcher.js         ← installed by installer, never overwritten
//   <dataDir>/renderer.js        ← installed by installer, replaced by updates
//   <dataDir>/renderer.next.js   ← staged update, atomically promoted on boot
//   <dataDir>/state.json         ← {lastPromotedVersion, lastCheck, …}
//
// `__dirname` resolves to that directory because the patched asar `require`s
// us by absolute path. We deliberately do NOT split "embedded" vs "data dir":
// the installer always installs both files together, and there's no separate
// read-only copy to fall back on. If renderer.js disappears, that's a user
// action and the installer is the recovery path.
const dataDir = __dirname;
const activeRendererPath = path.join(dataDir, "renderer.js");
const stagedRendererPath = path.join(dataDir, "renderer.next.js");
const stateFile = path.join(dataDir, "state.json");

function looksLikeRenderer(code) {
    // Cheap sanity check: must contain our boot marker and be reasonably
    // sized. Stops us from writing GitHub error HTML or an empty file.
    // We accept both the legacy `[BOON]` marker (used by renderers <= v0.1.5)
    // and the new `[alitravians]` marker so a rebranded patcher still
    // validates an older renderer staged before the rebrand.
    if (!code || code.length < 10000) return false;
    const hasMarker = code.indexOf("[alitravians]") !== -1 || code.indexOf("[BOON]") !== -1;
    return hasMarker && code.indexOf("VERSION") !== -1;
}

function extractVersion(code) {
    // Renderer code declares `var VERSION = "x.y.z"` near the top after
    // esbuild bundling. We don't care if minified — the literal survives.
    const m = /VERSION\s*=\s*"(\d+\.\d+\.\d+)"/.exec(code);
    return m ? m[1] : null;
}

// ─── Promote staged update (if any) ──────────────────────────────────────────
function promoteStagedUpdate() {
    if (!fs.existsSync(stagedRendererPath)) return null;
    try {
        const staged = fs.readFileSync(stagedRendererPath, "utf8");
        if (!looksLikeRenderer(staged)) {
            console.error("[alitravians] staged renderer failed validation, discarding");
            try { fs.unlinkSync(stagedRendererPath); } catch (_) {}
            return null;
        }
        // writeFile is atomic on a single FS in practice (man 2 rename).
        fs.writeFileSync(activeRendererPath, staged);
        fs.unlinkSync(stagedRendererPath);
        const v = extractVersion(staged);
        console.log("[alitravians] promoted staged renderer" + (v ? " → v" + v : ""));
        return v;
    } catch (err) {
        console.error("[alitravians] failed to promote staged renderer:", err);
        return null;
    }
}

const promotedVersion = promoteStagedUpdate();

// ─── Load renderer ───────────────────────────────────────────────────────────
let rendererCode = null;
try {
    rendererCode = fs.readFileSync(activeRendererPath, "utf8");
} catch (err) {
    console.error("[alitravians] failed to read renderer.js at", activeRendererPath, err);
}

const currentVersion = rendererCode ? extractVersion(rendererCode) : null;
console.log(
    "[alitravians] renderer loaded — path=" + activeRendererPath +
    (currentVersion ? ", version=v" + currentVersion : "") +
    (rendererCode ? ", bytes=" + rendererCode.length : "")
);

// ─── State file (last check timestamp, etc.) ─────────────────────────────────
function readState() {
    try {
        return JSON.parse(fs.readFileSync(stateFile, "utf8"));
    } catch (_) {
        return {};
    }
}

function writeState(patch) {
    const cur = readState();
    const next = Object.assign({}, cur, patch);
    try {
        fs.writeFileSync(stateFile, JSON.stringify(next, null, 2));
    } catch (err) {
        console.error("[alitravians] failed to write state file:", err);
    }
    return next;
}

if (promotedVersion) {
    writeState({ lastPromotedVersion: promotedVersion, lastPromotedAt: Date.now() });
}

// ─── GitHub fetch helper (used by IPC_HANDLERS.BOON_FETCH further down) ─────
// NOTE: IPC channel names keep their `BOON_*` prefix because they are
// internal protocol identifiers — changing them would break renderers that
// might still talk to a freshly-rebranded patcher during the transition.
//
// Discord's CSP only whitelists discord.com / discordapp.com / discord.media
// for connect-src. Any fetch() from the renderer to api.github.com or
// objects.githubusercontent.com is blocked outright. We work around that the
// same way Vencord / BetterDiscord do: the renderer asks main to perform
// the request, and main responds with the raw body. Only requests to a
// hard-coded allow-list of hosts are honored — we don't want a future bug
// turning this into an open proxy.
const FETCH_ALLOWED_HOSTS = new Set([
    "api.github.com",
    "github.com",
    "objects.githubusercontent.com",
    "release-assets.githubusercontent.com",
    "raw.githubusercontent.com",
]);

function ipcFetch(rawUrl, opts) {
    return new Promise((resolve) => {
        let parsed;
        try {
            parsed = new URL(rawUrl);
        } catch (_) {
            resolve({ ok: false, status: 0, error: "invalid-url" });
            return;
        }
        if (parsed.protocol !== "https:") {
            resolve({ ok: false, status: 0, error: "non-https" });
            return;
        }
        if (!FETCH_ALLOWED_HOSTS.has(parsed.hostname)) {
            resolve({ ok: false, status: 0, error: "host-not-allowed:" + parsed.hostname });
            return;
        }

        const headers = {
            // GitHub API requires a User-Agent on every request and returns
            // 403 with no body otherwise.
            "User-Agent": "alitravians-Updater/" + (currentVersion || "0") + " (+https://github.com/alitravians/Ali)",
            "Accept": (opts && opts.accept) || "application/vnd.github+json",
        };

        const req = https.get(
            {
                hostname: parsed.hostname,
                path: parsed.pathname + parsed.search,
                headers: headers,
                timeout: 15000,
            },
            (res) => {
                // Follow redirects to githubusercontent.com (release asset
                // downloads). 3 hops is plenty.
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    const hops = (opts && opts.hops) || 0;
                    if (hops < 3) {
                        res.resume();
                        ipcFetch(res.headers.location, Object.assign({}, opts, { hops: hops + 1 })).then(resolve);
                        return;
                    }
                }
                let buf = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => { buf += chunk; });
                res.on("end", () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        body: buf,
                        headers: {
                            "x-ratelimit-remaining": res.headers["x-ratelimit-remaining"] || null,
                            "x-ratelimit-reset": res.headers["x-ratelimit-reset"] || null,
                        },
                    });
                });
                res.on("error", (err) => {
                    resolve({ ok: false, status: 0, error: "stream:" + (err.code || err.message) });
                });
            }
        );
        req.on("error", (err) => {
            resolve({ ok: false, status: 0, error: "request:" + (err.code || err.message) });
        });
        req.on("timeout", () => {
            req.destroy();
            resolve({ ok: false, status: 0, error: "timeout" });
        });
    });
}

// ─── Inject into every Discord window ─────────────────────────────────────────
// We only want alitravians in the real Discord renderer (discord.com / discordapp.com).
// Discord's splash screen loads a local file:// page that has no localStorage,
// no IndexedDB and a different DOM — injecting there produces noisy
// `ReferenceError: localStorage is not defined` and serves no purpose.
function shouldInject(webContents) {
    try {
        const url = webContents.getURL() || "";
        if (!url) return false;
        const u = new URL(url);
        return (
            u.hostname === "discord.com" ||
            u.hostname === "discordapp.com" ||
            u.hostname === "canary.discord.com" ||
            u.hostname === "ptb.discord.com"
        );
    } catch (_) {
        return false;
    }
}

// Discord deletes `window.localStorage` and `window.sessionStorage` in the
// renderer as an anti-token-theft measure (see https://stackoverflow.com/q/49788079).
// We restore them the same way Vencord does: grab a fresh reference from an
// iframe and re-attach it as a *non-configurable* property on the page's
// window, so Discord's later `delete` / redefine attempts silently fail.
// `indexedDB` is left untouched by Discord, so we don't need to shim it.
const RESTORE_STORAGE_APIS = `
(() => {
    try {
        if (typeof window === "undefined") return;
        const needsLS = typeof window.localStorage === "undefined" ||
                        typeof window.localStorage.setItem !== "function";
        const needsSS = typeof window.sessionStorage === "undefined" ||
                        typeof window.sessionStorage.setItem !== "function";
        if (!needsLS && !needsSS) return;
        const frame = document.createElement("iframe");
        frame.style.display = "none";
        (document.head || document.documentElement).appendChild(frame);
        const fw = frame.contentWindow;
        // We deliberately leave the iframe parked in <head>: removing it
        // invalidates \`contentWindow\` and breaks the captured references.
        const lock = (name, value) => {
            try {
                Object.defineProperty(window, name, {
                    configurable: false,
                    enumerable: true,
                    get() { return value; },
                });
            } catch (e) {
                console.error("[alitravians] failed to lock " + name + ":", e);
            }
        };
        if (needsLS) lock("localStorage", fw.localStorage);
        if (needsSS) lock("sessionStorage", fw.sessionStorage);
    } catch (e) {
        console.error("[alitravians] storage shim failed:", e);
    }
})();
`;

// ─── Renderer IPC bridge ─────────────────────────────────────────────────────
// We can't use Electron's `ipcRenderer.invoke` from the renderer because
// `webContents.executeJavaScript` injects into an isolated world where
// `require` is undefined and `process` is not exposed. We learned this the
// hard way when v0.1.4 shipped a bridge that silently rejected every call
// with `ipc-unavailable` (the user saw the Updates tab stuck on "جاري
// الجلب…" forever).
//
// Workaround: encode every renderer→main call as a `console.log` with a
// well-known prefix. Electron's `webContents.on('console-message', …)`
// fires for every console call from the renderer, including injected
// code, so main can parse the line, run the actual handler, and ship the
// result back via `executeJavaScript`. This is the same trick used by
// browser extensions that need to talk to their background page without
// a content-script preload.
//
// Wire format (renderer → main):
//   console.log("[BOON_IPC]:" + JSON.stringify({ id, channel, payload }))
// Wire format (main → renderer):
//   window.__BOON__._resolve(id, value) | __BOON__._reject(id, msg)
const IPC_PREFIX = "[BOON_IPC]:";

const IPC_HANDLERS = {
    BOON_GET_BOOT_INFO: () => ({
        currentVersion: currentVersion,
        rendererBytes: rendererCode ? rendererCode.length : 0,
        state: readState(),
        dataDir: dataDir,
    }),
    BOON_LIST_INSTALLED: () => ({
        active: fs.existsSync(activeRendererPath),
        staged: fs.existsSync(stagedRendererPath),
        currentVersion: currentVersion,
        dataDir: dataDir,
    }),
    BOON_STAGE_UPDATE: (payload) => {
        if (!payload || typeof payload.code !== "string") {
            return { ok: false, error: "missing-code" };
        }
        if (!looksLikeRenderer(payload.code)) {
            return { ok: false, error: "invalid-renderer" };
        }
        const v = extractVersion(payload.code);
        try {
            fs.writeFileSync(stagedRendererPath, payload.code);
            const state = writeState({
                lastDownloadAt: Date.now(),
                lastDownloadedVersion: v,
                lastDownloadedTag: payload.tag || null,
            });
            return { ok: true, version: v, state: state };
        } catch (err) {
            return { ok: false, error: "write-failed", detail: String(err) };
        }
    },
    BOON_RELAUNCH: () => {
        setTimeout(() => {
            try {
                app.relaunch();
                app.exit(0);
            } catch (err) {
                console.error("[alitravians] relaunch failed:", err);
            }
        }, 150);
        return { ok: true };
    },
    BOON_FETCH: (payload) => {
        if (!payload || typeof payload.url !== "string") {
            return { ok: false, status: 0, error: "missing-url" };
        }
        return ipcFetch(payload.url, { accept: payload.accept });
    },
};

function dispatchConsoleIpc(webContents, raw) {
    let msg;
    try {
        msg = JSON.parse(raw);
    } catch (err) {
        console.error("[alitravians] bad console-IPC payload:", err);
        return;
    }
    const { id, channel, payload } = msg || {};
    if (typeof id !== "string" || typeof channel !== "string") {
        console.error("[alitravians] console-IPC missing id/channel");
        return;
    }
    const handler = IPC_HANDLERS[channel];
    const work = handler
        ? Promise.resolve()
              .then(() => handler(payload))
              .catch(err => Promise.reject(err))
        : Promise.reject(new Error("no-handler:" + channel));
    work.then(
        (result) => {
            // Stringify on the main side and ship the literal back so the
            // renderer doesn't have to parse arbitrary JSON manually.
            const code =
                "window.__BOON__ && window.__BOON__._resolve && " +
                "window.__BOON__._resolve(" + JSON.stringify(id) + ", " +
                JSON.stringify(result == null ? null : result) + ");";
            webContents.executeJavaScript(code, true).catch(() => {});
        },
        (err) => {
            const message = (err && err.message) ? err.message : String(err);
            const code =
                "window.__BOON__ && window.__BOON__._reject && " +
                "window.__BOON__._reject(" + JSON.stringify(id) + ", " +
                JSON.stringify(message) + ");";
            webContents.executeJavaScript(code, true).catch(() => {});
        }
    );
}

function buildBootBridge() {
    const boot = {
        currentVersion: currentVersion,
        dataDir: dataDir,
        lastPromotedVersion: readState().lastPromotedVersion || null,
        // Always true now: even if console-IPC fails for some pathological
        // reason, the renderer-side updater will surface a real timeout
        // (`ipc-timeout`) instead of pretending the bridge is missing.
        ipc: true,
    };
    // Build the bridge as a plain ASCII string (no template literals, no
    // backticks) so embedding it inside another `executeJavaScript` payload
    // can't break parsing. We seal __BOON__ with a non-configurable,
    // non-writable descriptor so plugins can rely on its identity.
    return "\n(() => {\n" +
        "    try {\n" +
        "        const boot = " + JSON.stringify(boot) + ";\n" +
        "        const pending = new Map();\n" +
        "        boot._resolve = function(id, value) {\n" +
        "            const p = pending.get(id);\n" +
        "            if (!p) return;\n" +
        "            pending.delete(id);\n" +
        "            p.resolve(value);\n" +
        "        };\n" +
        "        boot._reject = function(id, message) {\n" +
        "            const p = pending.get(id);\n" +
        "            if (!p) return;\n" +
        "            pending.delete(id);\n" +
        "            p.reject(new Error(message || \"ipc-error\"));\n" +
        "        };\n" +
        "        boot.invoke = function(channel, payload) {\n" +
        "            return new Promise(function(resolve, reject) {\n" +
        "                const id = Math.random().toString(36).slice(2) + Date.now().toString(36);\n" +
        "                pending.set(id, { resolve: resolve, reject: reject });\n" +
        "                setTimeout(function() {\n" +
        "                    if (pending.has(id)) {\n" +
        "                        pending.delete(id);\n" +
        "                        reject(new Error(\"ipc-timeout:\" + channel));\n" +
        "                    }\n" +
        "                }, 30000);\n" +
        "                try {\n" +
        "                    console.log(" + JSON.stringify(IPC_PREFIX) + " + JSON.stringify({\n" +
        "                        id: id, channel: channel, payload: payload == null ? null : payload,\n" +
        "                    }));\n" +
        "                } catch (e) {\n" +
        "                    pending.delete(id);\n" +
        "                    reject(e);\n" +
        "                }\n" +
        "            });\n" +
        "        };\n" +
        "        Object.defineProperty(globalThis, \"__BOON__\", {\n" +
        "            value: boot, writable: false, configurable: false, enumerable: false,\n" +
        "        });\n" +
        "    } catch (e) {\n" +
        "        console.error(\"[alitravians] failed to install boot bridge:\", e);\n" +
        "    }\n" +
        "})();\n";
}

function attachConsoleIpc(webContents) {
    if (webContents.__boonConsoleIpcAttached) return;
    webContents.__boonConsoleIpcAttached = true;
    // Electron 28+ passes a `details` object; older versions pass positional
    // (event, level, message, …). We handle both signatures defensively so
    // BOON keeps working across Discord's Electron upgrades.
    const handler = (...args) => {
        let text = "";
        if (args.length === 1 && args[0] && typeof args[0].message === "string") {
            text = args[0].message;
        } else if (typeof args[2] === "string") {
            text = args[2];
        } else if (typeof args[1] === "string") {
            text = args[1];
        }
        if (typeof text !== "string" || text.indexOf(IPC_PREFIX) !== 0) return;
        dispatchConsoleIpc(webContents, text.slice(IPC_PREFIX.length));
    };
    webContents.on("console-message", handler);
}

function injectInto(webContents) {
    if (!rendererCode) return;
    if (webContents.__boonInjected) return;
    if (!shouldInject(webContents)) return;
    webContents.__boonInjected = true;
    attachConsoleIpc(webContents);
    const code = RESTORE_STORAGE_APIS + "\n" + buildBootBridge() + "\n" + rendererCode;
    webContents
        .executeJavaScript(code, true)
        .catch(err => console.error("[alitravians] renderer injection failed:", err));
}

app.on("browser-window-created", (_event, win) => {
    // `dom-ready` fires for every navigation (including the splash → main
    // transition). We re-evaluate `shouldInject` each time so the renderer
    // runs exactly once per window, the first time it lands on discord.com.
    win.webContents.on("dom-ready", () => injectInto(win.webContents));
    win.webContents.on("did-finish-load", () => injectInto(win.webContents));
});

// Discord's main entrypoint relies on certain command-line flags being set
// early. Mirror the subset Vencord uses to avoid renderer backgrounding bugs.
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

console.log("[alitravians] patcher ready — loading original Discord");
require(require.main.filename);
