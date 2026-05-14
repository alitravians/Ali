/*
 * BOON — ContextMenu API
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Mimics Vencord's `ContextMenu` API but works without webpack patches by
 * observing the DOM for Discord's context menu container and injecting
 * items into it when a matching menu opens.
 *
 * Plugins register patches that target a menu *kind*:
 *   - "message"  → right-click on a message
 *   - "user"     → right-click on a user (member list or message header)
 *   - "channel"  → right-click on a channel in the channel list
 *   - "guild"    → right-click on a server in the server list
 *
 * A patch receives a `MenuContext` with metadata (e.g. `messageId`,
 * `channelId`, `userId`) and an `addItem(item)` helper. Items appear as
 * native-styled rows alongside Discord's built-in options.
 *
 * Effects are auto-cleaned via the standard PluginContext lifecycle
 * (`ctx.contextMenu.patch(...)` returns an unregister function that the
 * framework tracks).
 */

import { rootLogger } from "./logger.js";

export type ContextMenuKind = "message" | "user" | "channel" | "guild" | "unknown";

export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: string;            // single character / emoji shown before the label
    danger?: boolean;          // red text + hover
    disabled?: boolean;
    onClick: (ctx: MenuContext) => void | Promise<void>;
}

export interface MenuContext {
    kind: ContextMenuKind;
    messageId?: string;
    channelId?: string;
    guildId?: string;
    userId?: string;
    /** Reference to the live Discord context menu element. */
    menuEl: HTMLElement;
    /** Original right-click target that opened the menu. */
    target: HTMLElement | null;
}

type MenuPatch = (ctx: MenuContext, addItem: (item: ContextMenuItem) => void) => void;

const patches = new Map<ContextMenuKind | "any", Set<MenuPatch>>();

function registerPatch(kind: ContextMenuKind | "any", patch: MenuPatch): () => void {
    let bucket = patches.get(kind);
    if (!bucket) {
        bucket = new Set();
        patches.set(kind, bucket);
    }
    bucket.add(patch);
    return () => bucket?.delete(patch);
}

function detectKind(target: HTMLElement | null): { kind: ContextMenuKind; meta: Omit<MenuContext, "kind" | "menuEl" | "target"> } {
    if (!target) return { kind: "unknown", meta: {} };

    const msgEl = target.closest<HTMLElement>('li[id^="chat-messages-"]');
    if (msgEl) {
        const id = msgEl.id; // chat-messages-<channel>-<message>
        const parts = id.split("-");
        const messageId = parts[parts.length - 1];
        const channelId = parts[parts.length - 2];
        return { kind: "message", meta: { messageId, channelId } };
    }

    const userEl = target.closest<HTMLElement>(
        '[data-list-item-id^="members-"], [class*="memberInner"], [class*="username_"]',
    );
    if (userEl) {
        const attr = userEl.getAttribute("data-list-item-id") ?? "";
        const userId = attr.split("-").pop();
        return { kind: "user", meta: { userId } };
    }

    const channelEl = target.closest<HTMLElement>('[data-list-item-id^="channels___"], a[href^="/channels/"]');
    if (channelEl) {
        const href = (channelEl as HTMLAnchorElement).getAttribute("href") ?? "";
        const m = href.match(/\/channels\/(\d+)\/(\d+)/);
        if (m) return { kind: "channel", meta: { guildId: m[1], channelId: m[2] } };
    }

    const guildEl = target.closest<HTMLElement>('[data-list-item-id^="guildsnav___"]');
    if (guildEl) {
        const attr = guildEl.getAttribute("data-list-item-id") ?? "";
        const guildId = attr.split("___").pop();
        return { kind: "guild", meta: { guildId } };
    }

    return { kind: "unknown", meta: {} };
}

function findItemList(menuEl: HTMLElement): HTMLElement | null {
    return (
        menuEl.querySelector<HTMLElement>('[role="menu"] [class*="scroller_"]') ??
        menuEl.querySelector<HTMLElement>('[role="menu"]') ??
        menuEl
    );
}

function renderItem(item: ContextMenuItem, ctx: MenuContext): HTMLElement {
    const row = document.createElement("div");
    row.setAttribute("role", "menuitem");
    row.setAttribute("data-boon-item", item.id);
    row.dataset.danger = item.danger ? "1" : "0";
    row.dataset.disabled = item.disabled ? "1" : "0";
    row.className = "boon-context-item";
    row.style.cssText = `
        display:flex;align-items:center;gap:8px;
        padding:6px 8px;margin:0 8px;
        font-size:14px;cursor:${item.disabled ? "not-allowed" : "pointer"};
        color:${item.danger ? "#f23f42" : "var(--interactive-normal, #dbdee1)"};
        opacity:${item.disabled ? "0.4" : "1"};
        border-radius:4px;
        font-family:inherit;
        direction:rtl;
    `.replace(/\s+/g, " ");
    if (item.icon) {
        const icon = document.createElement("span");
        icon.textContent = item.icon;
        icon.style.cssText = "width:16px;text-align:center;";
        row.appendChild(icon);
    }
    const label = document.createElement("span");
    label.textContent = item.label;
    label.style.cssText = "flex:1;text-align:start;";
    row.appendChild(label);

    if (!item.disabled) {
        row.addEventListener("mouseenter", () => {
            row.style.background = item.danger
                ? "rgba(242,63,66,0.12)"
                : "rgba(0,255,136,0.10)";
        });
        row.addEventListener("mouseleave", () => {
            row.style.background = "transparent";
        });
        row.addEventListener("click", e => {
            e.stopPropagation();
            try {
                const result = item.onClick(ctx);
                if (result instanceof Promise) {
                    result.catch(err => rootLogger.warn(`context item "${item.id}" rejected`, err));
                }
            } catch (err) {
                rootLogger.warn(`context item "${item.id}" threw`, err);
            }
            // Close the menu by dispatching a click outside it.
            document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 1, clientY: 1 }));
        });
    }
    return row;
}

function applyPatches(menuEl: HTMLElement, target: HTMLElement | null): void {
    const { kind, meta } = detectKind(target);
    const ctx: MenuContext = { kind, menuEl, target, ...meta };

    const list = findItemList(menuEl);
    if (!list) return;

    const sep = document.createElement("div");
    sep.setAttribute("role", "separator");
    sep.style.cssText = "height:1px;background:var(--background-modifier-accent,#3f4147);margin:4px 8px;";

    const added: HTMLElement[] = [];
    const addItem = (item: ContextMenuItem): void => {
        const node = renderItem(item, ctx);
        added.push(node);
    };

    for (const patch of patches.get(kind) ?? []) {
        try {
            patch(ctx, addItem);
        } catch (err) {
            rootLogger.warn("context patch failed", err);
        }
    }
    for (const patch of patches.get("any") ?? []) {
        try {
            patch(ctx, addItem);
        } catch (err) {
            rootLogger.warn("context patch failed", err);
        }
    }

    if (added.length === 0) return;
    list.appendChild(sep);
    for (const node of added) list.appendChild(node);
}

let lastTarget: HTMLElement | null = null;
let installed = false;

// Menus we've already patched in this open-cycle. Discord re-renders the
// menu inside the same layer container on each open, so a dedup keyed by
// the live ``[role="menu"]`` element prevents double-injection when the
// observer fires multiple times for the same menu (e.g. when Discord
// streams the menu's items in over several frames after the first open).
const patchedMenus = new WeakSet<HTMLElement>();

function tryPatchMenu(menuEl: HTMLElement): void {
    if (patchedMenus.has(menuEl)) return;
    patchedMenus.add(menuEl);
    applyPatches(menuEl, lastTarget);
}

function scanForMenus(root: HTMLElement): void {
    if (root.getAttribute("role") === "menu") {
        tryPatchMenu(root);
        return;
    }
    const nested = root.querySelectorAll<HTMLElement>('[role="menu"]');
    for (const m of Array.from(nested)) tryPatchMenu(m);
}

export function init(): void {
    if (installed) return;
    installed = true;

    document.addEventListener(
        "contextmenu",
        e => {
            lastTarget = e.target as HTMLElement | null;
        },
        true,
    );

    // Discord renders context menus inside a deeply-nested layer container
    // (``<div class="layerContainer-...">`` → ``<div class="layer-...">``
    // → ``<div role="menu">``), and modern Discord builds re-use that
    // layer for every menu — only its children are swapped. Observing the
    // body with ``subtree: false`` only fires for direct-child additions,
    // so we miss the menu entirely on those builds. ``subtree: true`` plus
    // a per-menu WeakSet dedup is the architecturally-correct fix — we
    // catch the menu wherever it lands and only patch each instance once.
    //
    // CONTRIBUTING.md forbids ``subtree: true`` on document.body without
    // debounce (typing indicators / presence / reactions all fire dozens
    // of mutations per second on a busy guild). We coalesce additions into
    // a single buffer drained on the next animation frame, so the cost
    // collapses to at most one ``querySelectorAll`` per frame regardless
    // of how many child mutations Discord emits per batch.
    let pendingNodes: HTMLElement[] = [];
    let drainScheduled = false;
    const drain = (): void => {
        drainScheduled = false;
        const batch = pendingNodes;
        pendingNodes = [];
        for (const node of batch) {
            if (!node.isConnected) continue;
            scanForMenus(node);
        }
    };
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of Array.from(m.addedNodes)) {
                if (!(node instanceof HTMLElement)) continue;
                pendingNodes.push(node);
            }
        }
        if (!drainScheduled && pendingNodes.length > 0) {
            drainScheduled = true;
            requestAnimationFrame(drain);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// ─── Public API for plugins ──────────────────────────────────────────────────

export interface ContextMenuApi {
    patch(kind: ContextMenuKind | "any", patch: MenuPatch): () => void;
}

export function createApi(): ContextMenuApi {
    return {
        patch(kind, fn) {
            return registerPatch(kind, fn);
        },
    };
}
