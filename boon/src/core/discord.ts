/*
 * BOON — Discord Client Modification Framework
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Lightweight, defensive helpers for reading Discord runtime state from the page.
 *
 * Note: BOON intentionally avoids deep webpack patching in the userscript/extension
 * targets — those approaches are brittle and break on every Discord deploy. Instead
 * we read state via DOM observation and `location.pathname`, and send messages via
 * the user-visible composer textbox. The desktop target *can* opt into webpack
 * access via Vencord's loader; see `src/targets/desktop/README.md`.
 */

import { emit } from "./events.js";
import { rootLogger } from "./logger.js";

const URL_RE = /^\/channels\/(@me|\d+)\/(\d+)/;

let lastChannelId: string | null = null;
let lastGuildId: string | null = null;

function readRouteIds(): { channelId: string | null; guildId: string | null } {
    const m = location.pathname.match(URL_RE);
    if (!m) return { channelId: null, guildId: null };
    return {
        channelId: m[2],
        guildId: m[1] === "@me" ? null : m[1],
    };
}

export function getCurrentChannelId(): string | null {
    return readRouteIds().channelId;
}

export function getCurrentGuildId(): string | null {
    return readRouteIds().guildId;
}

export function startRouteObserver(): () => void {
    const tick = (): void => {
        const { channelId, guildId } = readRouteIds();
        if (channelId !== lastChannelId || guildId !== lastGuildId) {
            lastChannelId = channelId;
            lastGuildId = guildId;
            emit("channel:switch", { channelId, guildId });
        }
    };
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
}

/**
 * Find Discord's message composer textbox (Slate.js contenteditable div).
 */
export function getComposer(): HTMLElement | null {
    return document.querySelector<HTMLElement>(
        'div[role="textbox"][data-slate-editor="true"]',
    );
}

/**
 * Programmatically type text into Discord's composer and submit it.
 * Uses `execCommand` + InputEvent so the Slate editor's controlled state stays consistent.
 */
export async function sendMessage(text: string): Promise<boolean> {
    const composer = getComposer();
    if (!composer) {
        rootLogger.warn("sendMessage: composer not found");
        return false;
    }
    composer.focus();
    try {
        const dt = new DataTransfer();
        dt.setData("text/plain", text);
        composer.dispatchEvent(
            new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }),
        );
    } catch {
        document.execCommand("insertText", false, text);
    }
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    composer.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
        }),
    );
    return true;
}

/**
 * Observe the chat scroller for newly-appended message DOM nodes.
 * Calls `handler` with the new message element.
 */
export function observeMessages(handler: (el: HTMLElement) => void): () => void {
    const root = document.body;
    const observer = new MutationObserver(records => {
        for (const r of records) {
            r.addedNodes.forEach(node => {
                if (!(node instanceof HTMLElement)) return;
                if (node.matches('li[id^="chat-messages-"]')) {
                    handler(node);
                    return;
                }
                node.querySelectorAll<HTMLElement>('li[id^="chat-messages-"]').forEach(handler);
            });
        }
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
}

export function extractMessageInfo(el: HTMLElement): {
    messageId: string | null;
    authorId: string | null;
    content: string;
} {
    const messageId = el.id.replace("chat-messages-", "").split("-").pop() ?? null;
    const contentEl = el.querySelector<HTMLElement>('div[id^="message-content-"]');
    const content = contentEl?.textContent ?? "";
    const avatar = el.querySelector<HTMLImageElement>('img[src*="/avatars/"]');
    const authorMatch = avatar?.src.match(/\/avatars\/(\d+)\//);
    const authorId = authorMatch ? authorMatch[1] : null;
    return { messageId, authorId, content };
}

/**
 * Wait for the Discord app shell to mount before declaring BOON "ready".
 */
export function whenAppReady(): Promise<void> {
    return new Promise(resolve => {
        const check = (): boolean => {
            if (document.querySelector('[class*="appMount"], [class*="app-"][class*="-"]')) {
                resolve();
                return true;
            }
            return false;
        };
        if (check()) return;
        const observer = new MutationObserver(() => {
            if (check()) observer.disconnect();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    });
}
