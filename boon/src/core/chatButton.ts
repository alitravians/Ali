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

export interface ChatButton {
    id: string;
    label: string;          // accessible label (tooltip)
    icon: string;           // text or single emoji shown inside the button
    onClick: () => void;
}

const buttons = new Map<string, ChatButton>();

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
        if (host.querySelector(`[data-boon-btn-id="${btn.id}"]`)) continue;
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

export function createApi(): ChatButtonApi {
    return {
        add(button) {
            buttons.set(button.id, button);
            reinjectAll();
            return () => {
                buttons.delete(button.id);
                for (const el of document.querySelectorAll<HTMLElement>(
                    `.${BUTTON_CLASS}[data-boon-btn-id="${button.id}"]`,
                )) {
                    el.remove();
                }
            };
        },
        remove(id) {
            buttons.delete(id);
            for (const el of document.querySelectorAll<HTMLElement>(
                `.${BUTTON_CLASS}[data-boon-btn-id="${id}"]`,
            )) {
                el.remove();
            }
        },
    };
}
