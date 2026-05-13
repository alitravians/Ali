/*
 * BOON — MessageAccessories API
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Lets plugins attach arbitrary DOM nodes directly under a Discord message,
 * styled to match Discord's own accessory rows (embeds, attachments, …).
 *
 * Without webpack patching, we implement this as:
 *   1. A MutationObserver watching for new chat-messages-<id> <li> elements.
 *   2. For each new message, every registered accessory factory is called
 *      with a MessageInfo describing the message; if it returns a node,
 *      that node is inserted into a dedicated container under the message
 *      content.
 *
 * Re-rendering Discord messages (edit, jump-to, etc.) is handled by
 * re-scanning: a per-message WeakSet ensures factories aren't double-invoked.
 *
 * Plugins register via `ctx.messageAccessories.add(id, factory)` which
 * returns an unregister function tracked by the framework.
 */

import { extractMessageInfo, observeMessages } from "./discord.js";
import { rootLogger } from "./logger.js";

const ACCESSORY_HOST_CLASS = "boon-accessory-host";
const ACCESSORY_CLASS = "boon-accessory";

export interface MessageInfo {
    id: string;
    channelId: string | null;
    author: string;
    content: string;
    el: HTMLElement;
}

export type AccessoryFactory = (info: MessageInfo) => HTMLElement | null;

interface RegisteredAccessory {
    id: string;
    factory: AccessoryFactory;
}

const accessories = new Set<RegisteredAccessory>();
const seenMessages = new WeakMap<HTMLElement, Set<string>>();

function ensureHost(messageEl: HTMLElement): HTMLElement | null {
    const existing = messageEl.querySelector<HTMLElement>(`.${ACCESSORY_HOST_CLASS}`);
    if (existing) return existing;
    const contentParent = messageEl.querySelector<HTMLElement>('div[id^="message-content-"]');
    if (!contentParent) return null;
    const host = document.createElement("div");
    host.className = ACCESSORY_HOST_CLASS;
    host.style.cssText = "display:flex;flex-direction:column;gap:4px;margin-top:4px;";
    contentParent.appendChild(host);
    return host;
}

function infoFor(messageEl: HTMLElement): MessageInfo {
    const base = extractMessageInfo(messageEl);
    const id = messageEl.id.split("-").pop() ?? "";
    // Derive channel id from URL (Discord SPA puts /channels/<guild>/<channel>).
    const channelMatch = location.pathname.match(/\/channels\/[^/]+\/(\d+)/);
    return {
        id,
        channelId: channelMatch ? channelMatch[1] : null,
        author: base.authorId ?? "",
        content: base.content,
        el: messageEl,
    };
}

function scan(messageEl: HTMLElement): void {
    let seen = seenMessages.get(messageEl);
    if (!seen) {
        seen = new Set();
        seenMessages.set(messageEl, seen);
    }
    const host = ensureHost(messageEl);
    if (!host) return;
    const info = infoFor(messageEl);
    for (const acc of accessories) {
        if (seen.has(acc.id)) continue;
        seen.add(acc.id);
        try {
            const node = acc.factory(info);
            if (node) {
                node.classList.add(ACCESSORY_CLASS);
                node.dataset.boonAccId = acc.id;
                host.appendChild(node);
            }
        } catch (err) {
            rootLogger.warn(`accessory "${acc.id}" threw`, err);
        }
    }
}

let stopObserver: (() => void) | null = null;
let installed = false;

export function init(): void {
    if (installed) return;
    installed = true;
    stopObserver = observeMessages(scan);
}

export function teardown(): void {
    stopObserver?.();
    stopObserver = null;
    installed = false;
    for (const el of document.querySelectorAll<HTMLElement>(`.${ACCESSORY_HOST_CLASS}`)) el.remove();
}

// ─── Public API for plugins ──────────────────────────────────────────────────

export interface MessageAccessoriesApi {
    /**
     * Register a factory to produce accessory nodes for every message.
     * Returns an unregister function. The framework tracks this so it
     * fires automatically on plugin stop.
     */
    add(id: string, factory: AccessoryFactory): () => void;
    /** Remove all accessories previously added with this id from the DOM. */
    remove(id: string): void;
}

export function createApi(): MessageAccessoriesApi {
    return {
        add(id, factory) {
            const entry: RegisteredAccessory = { id, factory };
            accessories.add(entry);
            return () => {
                accessories.delete(entry);
                for (const el of document.querySelectorAll<HTMLElement>(
                    `.${ACCESSORY_CLASS}[data-boon-acc-id="${id}"]`,
                )) {
                    el.remove();
                }
            };
        },
        remove(id) {
            for (const el of document.querySelectorAll<HTMLElement>(
                `.${ACCESSORY_CLASS}[data-boon-acc-id="${id}"]`,
            )) {
                el.remove();
            }
        },
    };
}
