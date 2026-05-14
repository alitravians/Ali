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

import { extractMessageInfo, observeMessages, readMessageBodyText } from "./discord.js";
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

// Track the source-text snapshot the last accessory render saw, keyed by
// the message element. When Discord edits a message in-place we compare
// the new source to this snapshot and invalidate the cached accessories
// only if the text actually changed. Avoids triggering full re-renders on
// every cosmetic mutation (timestamp tooltip updates, reaction adds, etc.)
// that don't actually change the translatable content.
const lastSourceSnapshot = new WeakMap<HTMLElement, string>();

function sourceSnapshot(el: HTMLElement): string {
    // Combine the reply preview (if any) with the message body — the same
    // surface plugins like autoTranslate care about. Cosmetic re-renders
    // (reactions, edited-badge tooltip flicker) don't touch either node, so
    // this snapshot stays stable across them.
    //
    // The body read MUST exclude ``.boon-accessory-host`` descendants —
    // otherwise inserting an accessory flips the snapshot, which then
    // invalidates that same accessory, infinite-looping until the async
    // translation lands on a detached placeholder. ``readMessageBodyText``
    // in core/discord.ts encapsulates that exclusion for all consumers.
    const reply = el.querySelector<HTMLElement>(
        '[class*="repliedTextContent"], [class*="repliedTextPreview"]',
    );
    return `${reply?.textContent ?? ""}\u0000${readMessageBodyText(el)}`;
}

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
    const host = ensureHost(messageEl);
    if (!host) return;
    // Detect in-place edits / lazy text-fill races: if the source text the
    // last render saw differs from the current snapshot, wipe stale
    // accessories so factories get re-invoked with fresh content.
    const snapshot = sourceSnapshot(messageEl);
    const previous = lastSourceSnapshot.get(messageEl);
    if (previous !== undefined && previous !== snapshot) {
        for (const stale of Array.from(
            host.querySelectorAll<HTMLElement>(`.${ACCESSORY_CLASS}`),
        )) {
            stale.remove();
        }
    }
    lastSourceSnapshot.set(messageEl, snapshot);
    const info = infoFor(messageEl);
    for (const acc of accessories) {
        // Source-of-truth dedup: skip if this accessory already produced a
        // node for this message. A previous design used a per-message Set,
        // but that incorrectly marked the accessory as "handled" even when
        // the factory returned null (e.g. because the text node hadn't yet
        // rendered when the MutationObserver fired) — silently and
        // permanently dropping the translation. The DOM-presence check
        // self-heals: a null return today still lets a future scan retry.
        if (host.querySelector(`[data-boon-acc-id="${acc.id}"]`)) continue;
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
