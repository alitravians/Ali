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
function injectInto(webContents) {
    if (!rendererCode) return;
    webContents.executeJavaScript(rendererCode, true).catch(err => {
        console.error("[BOON] renderer injection failed:", err);
    });
}

app.on("browser-window-created", (_event, win) => {
    win.webContents.on("dom-ready", () => {
        injectInto(win.webContents);
    });
    // For windows that finish loading between `browser-window-created` and our
    // `dom-ready` listener wiring (rare race), also hook `did-finish-load`.
    win.webContents.once("did-finish-load", () => {
        if (!win.webContents.__boonInjected) {
            win.webContents.__boonInjected = true;
            injectInto(win.webContents);
        }
    });
});

// Discord's main entrypoint relies on certain command-line flags being set
// early. Mirror the subset Vencord uses to avoid renderer backgrounding bugs.
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

console.log("[BOON] patcher ready — loading original Discord");
require(require.main.filename);
