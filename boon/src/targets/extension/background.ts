/*
 * BOON Browser Extension service worker.
 * Opens the popup when the extension icon is clicked; nothing else is needed.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

chrome.runtime.onInstalled.addListener(() => {
    chrome.action?.setBadgeText({ text: "" });
});
