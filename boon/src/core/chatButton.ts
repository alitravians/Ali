/*
 * BOON — ChatButton API
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Adds buttons to Discord's chat input toolbar (next to gift/emoji/sticker).
 * Without webpack patching, we observe the composer DOM and inject into the
 * right cluster.
 *
 * Plugins register via `ctx.chatButton.add(button)` which returns an
 * unregister function tracked by the framework.
 */

import { rootLogger } from "./logger.js";

const BUTTON_CLASS = "boon-chat-button";
const HOST_SELECTOR = '[class*="buttons_"]'; // Discord's composer button cluster
const HIDDEN_STORAGE_KEY = "alitravians:ui-elements:chat-button:hidden";

export interface ChatButton {
    id: string;
    label: string;          // accessible label (tooltip)
    icon: string;           // text or single emoji shown inside the button
    onClick: () => void;
    /** Plugin id that owns this button. Used by the UI-elements manager to
     *  group buttons by their plugin and to keep the hidden-state stable
     *  across plugin reloads. Falls back to `id` when omitted. */
    ownerPluginId?: string;
}

const buttons = new Map<string, ChatButton>();
const hiddenButtonIds = new Set<string>(loadHiddenSet());
const listeners = new Set<() => void>();

function loadHiddenSet(): string[] {
    try {
        const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.filter((x): x is string => typeof x === "string");
        }
    } catch (err) {
        rootLogger.warn("chatButton: failed to load hidden set", err);
    }
    return [];
}

function persistHiddenSet(): void {
    try {
        localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify([...hiddenButtonIds]));
    } catch (err) {
        rootLogger.warn("chatButton: failed to persist hidden set", err);
    }
}

function notify(): void {
    for (const l of listeners) {
        try { l(); } catch (err) { rootLogger.warn("chatButton listener threw", err); }
    }
}

function renderButton(btn: ChatButton): HTMLButtonElement {
    const node = document.createElement("button");
    node.type = "button";
    node.className = BUTTON_CLASS;
    node.dataset.boonBtnId = btn.id;
    node.setAttribute("aria-label", btn.label);
    node.title = btn.label;
    node.textContent = btn.icon;
    node.style.cssText = `
        background:transparent;border:none;cursor:pointer;
        font-size:18px;line-height:1;
        padding:6px;
        color:var(--interactive-normal,#b5bac1);
        border-radius:4px;
        display:flex;align-items:center;justify-content:center;
    `.replace(/\s+/g, " ");
    node.addEventListener("mouseenter", () => {
        node.style.color = "#00ff88";
        node.style.background = "rgba(0,255,136,0.08)";
    });
    node.addEventListener("mouseleave", () => {
        node.style.color = "var(--interactive-normal,#b5bac1)";
        node.style.background = "transparent";
    });
    node.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        try {
            btn.onClick();
        } catch (err) {
            rootLogger.warn(`chat button "${btn.id}" threw`, err);
        }
    });
    return node;
}

function injectInto(host: HTMLElement): void {
    for (const btn of buttons.values()) {
        const existing = host.querySelector<HTMLElement>(`[data-boon-btn-id="${btn.id}"]`);
        if (hiddenButtonIds.has(btn.id)) {
            existing?.remove();
            continue;
        }
        if (existing) continue;
        host.insertBefore(renderButton(btn), host.firstChild);
    }
}

function reinjectAll(): void {
    const hosts = document.querySelectorAll<HTMLElement>(HOST_SELECTOR);
    hosts.forEach(injectInto);
}

let observer: MutationObserver | null = null;
let installed = false;

export function init(): void {
    if (installed) return;
    installed = true;
    reinjectAll();
    observer = new MutationObserver(() => reinjectAll());
    observer.observe(document.body, { childList: true, subtree: true });
}

export function teardown(): void {
    observer?.disconnect();
    observer = null;
    installed = false;
    for (const el of document.querySelectorAll<HTMLElement>(`.${BUTTON_CLASS}`)) el.remove();
}

// ─── Public API for plugins ──────────────────────────────────────────────────

export interface ChatButtonApi {
    /** Register a button. Returns an unregister function. */
    add(button: ChatButton): () => void;
    /** Manually remove a button by id. */
    remove(id: string): void;
}

export function createApi(ownerPluginId?: string): ChatButtonApi {
    return {
        add(button) {
            buttons.set(button.id, { ...button, ownerPluginId: button.ownerPluginId ?? ownerPluginId });
            reinjectAll();
            notify();
            return () => {
                buttons.delete(button.id);
                for (const el of document.querySelectorAll<HTMLElement>(
                    `.${BUTTON_CLASS}[data-boon-btn-id="${button.id}"]`,
                )) {
                    el.remove();
                }
                notify();
            };
        },
        remove(id) {
            buttons.delete(id);
            for (const el of document.querySelectorAll<HTMLElement>(
                `.${BUTTON_CLASS}[data-boon-btn-id="${id}"]`,
            )) {
                el.remove();
            }
            notify();
        },
    };
}

// ─── Public API for the UI-elements manager ────────────────────────────────

export interface RegisteredButton {
    id: string;
    label: string;
    icon: string;
    ownerPluginId: string | null;
    hidden: boolean;
}

/** Snapshot of every chat button currently registered, in insertion order. */
export function list(): RegisteredButton[] {
    return [...buttons.values()].map(b => ({
        id: b.id,
        label: b.label,
        icon: b.icon,
        ownerPluginId: b.ownerPluginId ?? null,
        hidden: hiddenButtonIds.has(b.id),
    }));
}

/** Set the user-controlled visibility of a button. Returns the new state. */
export function setHidden(id: string, hidden: boolean): boolean {
    if (hidden) hiddenButtonIds.add(id);
    else hiddenButtonIds.delete(id);
    persistHiddenSet();
    // Re-render: either remove the button from the DOM, or re-inject it.
    reinjectAll();
    notify();
    return hidden;
}

/** Subscribe to registry/visibility changes. Returns an unsubscribe fn. */
export function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
