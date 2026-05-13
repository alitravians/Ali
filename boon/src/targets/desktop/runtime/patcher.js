/*
 * BOON Desktop Patcher
 *
 * Runs in Electron's main process. The installer patches Discord's app.asar so
 * that this file is `require()`d at startup. We then:
 *   1. Re-resolve the original Discord asar (renamed by the installer to
 *      `_app.asar`) and re-point `require.main.filename` + `app.setAppPath`
 *      at it so Discord boots normally afterwards.
 *   2. Maintain a writable copy of `renderer.js` in BOON's data dir so
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

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");

console.log("[BOON] patcher loading…");

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
    console.error("[BOON] cannot find original Discord package.json at", asarPath, err);
    throw err;
}

require.main.filename = path.join(asarPath, discordPkg.main);
// `setAppPath` is private but stable. Vencord uses it for the same reason.
app.setAppPath(asarPath);

// ─── BOON runtime dir layout ─────────────────────────────────────────────────
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
    // Cheap sanity check: must contain BOON's boot marker and be reasonably
    // sized. Stops us from writing GitHub error HTML or an empty file.
    if (!code || code.length < 10000) return false;
    return code.indexOf("[BOON]") !== -1 && code.indexOf("VERSION") !== -1;
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
            console.error("[BOON] staged renderer failed validation, discarding");
            try { fs.unlinkSync(stagedRendererPath); } catch (_) {}
            return null;
        }
        // writeFile is atomic on a single FS in practice (man 2 rename).
        fs.writeFileSync(activeRendererPath, staged);
        fs.unlinkSync(stagedRendererPath);
        const v = extractVersion(staged);
        console.log("[BOON] promoted staged renderer" + (v ? " → v" + v : ""));
        return v;
    } catch (err) {
        console.error("[BOON] failed to promote staged renderer:", err);
        return null;
    }
}

const promotedVersion = promoteStagedUpdate();

// ─── Load renderer ───────────────────────────────────────────────────────────
let rendererCode = null;
try {
    rendererCode = fs.readFileSync(activeRendererPath, "utf8");
} catch (err) {
    console.error("[BOON] failed to read renderer.js at", activeRendererPath, err);
}

const currentVersion = rendererCode ? extractVersion(rendererCode) : null;
console.log(
    "[BOON] renderer loaded — path=" + activeRendererPath +
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
        console.error("[BOON] failed to write state file:", err);
    }
    return next;
}

if (promotedVersion) {
    writeState({ lastPromotedVersion: promotedVersion, lastPromotedAt: Date.now() });
}

// ─── IPC bridge ──────────────────────────────────────────────────────────────
// The renderer calls these to drive the in-app updater.
ipcMain.handle("BOON_GET_BOOT_INFO", () => ({
    currentVersion: currentVersion,
    rendererBytes: rendererCode ? rendererCode.length : 0,
    state: readState(),
    dataDir: dataDir,
}));

ipcMain.handle("BOON_STAGE_UPDATE", (_evt, payload) => {
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
});

ipcMain.handle("BOON_RELAUNCH", () => {
    // Defer so the renderer can show a "restarting…" UI frame first.
    setTimeout(() => {
        try {
            app.relaunch();
            app.exit(0);
        } catch (err) {
            console.error("[BOON] relaunch failed:", err);
        }
    }, 150);
    return { ok: true };
});

ipcMain.handle("BOON_LIST_INSTALLED", () => {
    return {
        active: fs.existsSync(activeRendererPath),
        staged: fs.existsSync(stagedRendererPath),
        currentVersion: currentVersion,
        dataDir: dataDir,
    };
});

// ─── Inject into every Discord window ─────────────────────────────────────────
// We only want BOON in the real Discord renderer (discord.com / discordapp.com).
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
                console.error("[BOON] failed to lock " + name + ":", e);
            }
        };
        if (needsLS) lock("localStorage", fw.localStorage);
        if (needsSS) lock("sessionStorage", fw.sessionStorage);
    } catch (e) {
        console.error("[BOON] storage shim failed:", e);
    }
})();
`;

function buildBootBridge() {
    const boot = {
        currentVersion: currentVersion,
        dataDir: dataDir,
        lastPromotedVersion: readState().lastPromotedVersion || null,
        ipc: true,
    };
    // Stringify safely — no embedded user input in this object, so JSON.stringify
    // is sufficient. We also wrap in try/catch so a broken bridge can't crash
    // Discord's renderer.
    // Note: the comment-style backticks in the original inline code broke
    // template-literal parsing. We keep the inner script ASCII-only.
    return "\n(() => {\n" +
        "    try {\n" +
        "        const boot = " + JSON.stringify(boot) + ";\n" +
        "        let ipcRenderer = null;\n" +
        "        try { ipcRenderer = require(\"electron\").ipcRenderer; } catch (_) {}\n" +
        "        boot.invoke = ipcRenderer\n" +
        "            ? (channel, payload) => ipcRenderer.invoke(channel, payload)\n" +
        "            : () => Promise.reject(new Error(\"ipc-unavailable\"));\n" +
        "        Object.defineProperty(globalThis, \"__BOON__\", {\n" +
        "            value: boot, writable: false, configurable: false, enumerable: false,\n" +
        "        });\n" +
        "    } catch (e) {\n" +
        "        console.error(\"[BOON] failed to install boot bridge:\", e);\n" +
        "    }\n" +
        "})();\n";
}

function injectInto(webContents) {
    if (!rendererCode) return;
    if (webContents.__boonInjected) return;
    if (!shouldInject(webContents)) return;
    webContents.__boonInjected = true;
    const code = RESTORE_STORAGE_APIS + "\n" + buildBootBridge() + "\n" + rendererCode;
    webContents
        .executeJavaScript(code, true)
        .catch(err => console.error("[BOON] renderer injection failed:", err));
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

console.log("[BOON] patcher ready — loading original Discord");
require(require.main.filename);
