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
 * Observe the chat scroller for newly-appended message DOM nodes AND for
 * in-place text mutations on existing messages (so accessory factories get
 * re-invoked after Discord edits a message or fills in text it rendered
 * empty the first time around).
 *
 * The handler is called with the affected `<li>` element. The accessory
 * layer is responsible for snapshotting source text and skipping work when
 * nothing changed — this observer fires generously and lets that layer
 * decide.
 *
 * Mutations inside an accessory's own DOM (the `.boon-accessory-host`
 * subtree) are filtered out so the translation node updating its own text
 * does not feed back into another scan.
 */
export function observeMessages(handler: (el: HTMLElement) => void): () => void {
    const root = document.body;
    const observer = new MutationObserver(records => {
        // Within a single MutationObserver batch we may receive dozens of
        // mutations targeting the same <li> (Discord edits a message → text
        // node mutation + edited-badge insertion + tooltip flicker). Coalesce
        // so the handler runs at most once per li per batch — the accessory
        // layer is idempotent but redundant calls still cost DOM queries.
        const dirty = new Set<HTMLElement>();
        for (const r of records) {
            // New <li> wrappers (or batches that include them).
            r.addedNodes.forEach(node => {
                if (!(node instanceof HTMLElement)) return;
                if (node.matches('li[id^="chat-messages-"]')) {
                    dirty.add(node);
                    return;
                }
                node.querySelectorAll<HTMLElement>('li[id^="chat-messages-"]').forEach(li => {
                    dirty.add(li);
                });
            });
            // In-place text mutations (edits, lazy-fill, virtualization recycle).
            const target = r.target;
            if (!(target instanceof Node)) continue;
            const ancestor = target instanceof HTMLElement ? target : target.parentElement;
            if (!ancestor) continue;
            // Ignore mutations originating inside an accessory's own DOM —
            // that's the translation node redrawing itself, not a source-text
            // change. Without this guard we'd infinite-loop.
            if (ancestor.closest(".boon-accessory-host")) continue;
            const li = ancestor.closest<HTMLElement>('li[id^="chat-messages-"]');
            if (li) dirty.add(li);
        }
        for (const li of dirty) handler(li);
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
}

/**
 * Read the natural-language text of a Discord message element, skipping any
 * descendant inside our own accessory host (`.boon-accessory-host`).
 *
 * The accessory host lives INSIDE `div[id^="message-content-"]`, so a naive
 * `textContent` read would loop the translation subtitle's own text back
 * into anything that walks the message body (snapshot dedup, translation
 * input, etc.). This shared helper guarantees every consumer sees the same
 * "source only, no accessory pollution" view of the message text.
 */
export function readMessageBodyText(messageEl: HTMLElement): string {
    const content = messageEl.querySelector<HTMLElement>('div[id^="message-content-"]');
    if (!content) return "";
    let result = "";
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            // Text nodes are leaves so SKIP and REJECT are equivalent here;
            // SKIP reads more naturally ("skip this node") than REJECT
            // ("reject this node and its descendants").
            const parent = node.parentElement;
            if (parent?.closest(".boon-accessory-host")) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    let n: Node | null;
    while ((n = walker.nextNode())) result += n.nodeValue ?? "";
    return result;
}

export function extractMessageInfo(el: HTMLElement): {
    messageId: string | null;
    authorId: string | null;
    content: string;
} {
    const messageId = el.id.replace("chat-messages-", "").split("-").pop() ?? null;
    const content = readMessageBodyText(el);
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
