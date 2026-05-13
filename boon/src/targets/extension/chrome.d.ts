/*
 * Minimal Chrome / WebExtensions API surface used by BOON's extension target.
 * Sharing one declaration file avoids duplicate-identifier conflicts when both
 * content.ts and background.ts compile against the same global.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
declare const chrome: {
    runtime: {
        readonly id: string;
        getURL(path: string): string;
        onInstalled: { addListener(cb: () => void): void };
    };
    action?: {
        setBadgeText(details: { text: string }): void;
    };
};
