/*
 * BOON Desktop Patcher
 *
 * Runs in Electron's main process. The installer patches Discord's app.asar so
 * that this file is `require()`d at startup. We then:
 *   1. Re-resolve the original Discord asar (renamed by the installer to
 *      `_app.asar`) and re-point `require.main.filename` + `app.setAppPath`
 *      at it so Discord boots normally afterwards.
 *   2. Hook `browser-window-created` and inject our renderer payload into
 *      every Discord window once its DOM is ready.
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

// ─── Read renderer payload once ───────────────────────────────────────────────
const rendererPath = path.join(__dirname, "renderer.js");
let rendererCode;
try {
    rendererCode = fs.readFileSync(rendererPath, "utf8");
    console.log("[BOON] renderer payload loaded (" + rendererCode.length + " bytes)");
} catch (err) {
    console.error("[BOON] failed to read renderer.js:", err);
    rendererCode = null;
}

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

function injectInto(webContents) {
    if (!rendererCode) return;
    if (webContents.__boonInjected) return;
    if (!shouldInject(webContents)) return;
    webContents.__boonInjected = true;
    webContents
        .executeJavaScript(RESTORE_STORAGE_APIS + "\n" + rendererCode, true)
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
