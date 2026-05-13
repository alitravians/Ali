/*
 * BOON Browser Extension content script — injects the BOON userscript bundle
 * into the page context (so it can read Discord's `window.localStorage` /
 * `fetch` with cookies, which an isolated-world content script can't).
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

(function injectBoon(): void {
    if (document.getElementById("__boon-injected")) return;
    const script = document.createElement("script");
    script.id = "__boon-injected";
    script.src = chrome.runtime.getURL("boon.userscript.js");
    script.type = "text/javascript";
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
})();
