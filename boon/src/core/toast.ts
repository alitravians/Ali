/*
 * BOON — Discord Client Modification Framework
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Lightweight in-page toast notifications. Avoids relying on Discord's internal
 * toast module which moves around between updates.
 */

const STYLE_ID = "boon-toast-styles";
const CONTAINER_ID = "boon-toast-container";

const STYLE = `
#${CONTAINER_ID} {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    font-family: var(--font-primary, "gg sans", "Noto Sans", sans-serif);
}
.boon-toast {
    pointer-events: auto;
    background: #1e1f22;
    color: #f2f3f5;
    padding: 12px 16px;
    border-radius: 8px;
    border-left: 4px solid #00ff88;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    max-width: 360px;
    font-size: 14px;
    line-height: 1.4;
    animation: boon-toast-in 0.2s ease-out;
}
.boon-toast.boon-toast-success { border-left-color: #23a55a; }
.boon-toast.boon-toast-error   { border-left-color: #f23f43; }
@keyframes boon-toast-in {
    from { transform: translateX(20px); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
}
@keyframes boon-toast-out {
    to { transform: translateX(20px); opacity: 0; }
}
`;

function ensureContainer(): HTMLElement {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = STYLE;
        document.head.appendChild(style);
    }
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
        container = document.createElement("div");
        container.id = CONTAINER_ID;
        document.body.appendChild(container);
    }
    return container;
}

export function toast(message: string, type: "info" | "success" | "error" = "info"): void {
    const container = ensureContainer();
    const el = document.createElement("div");
    el.className = `boon-toast boon-toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    window.setTimeout(() => {
        el.style.animation = "boon-toast-out 0.2s ease-in forwards";
        window.setTimeout(() => el.remove(), 220);
    }, 3200);
}
