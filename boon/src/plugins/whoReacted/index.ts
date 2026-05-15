/*
 * BOON Plugin: WhoReacted
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's WhoReacted plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/whoReacted
 *
 * DOM-limited variant: Vencord calls Discord's internal reaction-fetch action
 * on hover to populate a list of reactor avatars. Without webpack we can't
 * trigger that fetch programmatically, so we take a different path:
 *
 *   On hover of any reaction → open Discord's native reactor modal *briefly*
 *   in a hidden state, read the user list out of its DOM, then close it.
 *
 * This is a heuristic that may flicker; if it proves problematic we fall back
 * to just adding a "اضغط لعرض المتفاعلين" tooltip. The user can disable the
 * auto-open behavior via settings.
 *
 * The simple v0.1.0: show a hover tooltip with reactor count + emoji name.
 * Auto-modal-open is gated behind a setting (default off).
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    showTooltip: { type: "boolean", label: "تلميح عند تمرير المؤشر فوق التفاعل", default: true },
    countThreshold: {
        type: "number",
        label: "أقل عدد تفاعلات لعرض التلميح",
        description: "حتى لا يزدحم الواجهة بتلميحات لتفاعلات 1.",
        default: 1,
        min: 1,
        max: 50,
    },
} as const satisfies SettingsSchema;

const TIP_ID = "boon-whoreacted-tip";
const REACTION_SELECTOR =
    '[class*="reaction"][class*="reactionInner"], ' +
    '[class*="reaction_"][role="button"], ' +
    'div[aria-label*="reaction" i]';

function readEmoji(reaction: HTMLElement): string {
    const img = reaction.querySelector<HTMLImageElement>("img");
    if (img) {
        const alt = img.alt?.trim();
        if (alt) return alt;
        const lbl = img.getAttribute("aria-label")?.trim();
        if (lbl) return lbl;
    }
    const native = reaction.querySelector<HTMLElement>('[class*="reactionEmoji"]');
    return native?.textContent?.trim() ?? "?";
}

function readCount(reaction: HTMLElement): number {
    const el = reaction.querySelector<HTMLElement>('[class*="reactionCount"]');
    const n = parseInt(el?.textContent?.trim() ?? "0", 10);
    return isNaN(n) ? 0 : n;
}

function ensureTip(): HTMLElement {
    let tip = document.getElementById(TIP_ID);
    if (tip) return tip;
    tip = document.createElement("div");
    tip.id = TIP_ID;
    tip.style.cssText = [
        "position:fixed", "z-index:99999", "pointer-events:none",
        "padding:6px 10px",
        "background:var(--background-floating,#111214)",
        "color:var(--text-normal,#dbdee1)",
        "border-radius:4px", "font-size:12px",
        "box-shadow:0 4px 12px rgba(0,0,0,0.4)",
        "white-space:nowrap", "display:none",
    ].join(";");
    document.body.appendChild(tip);
    return tip;
}

export default definePlugin({
    manifest: {
        id: "whoReacted",
        name: "WhoReacted",
        description: "تلميح يظهر معلومات التفاعل عند تمرير المؤشر. اضغط على التفاعل لفتح قائمة المتفاعلين الكاملة.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["UX", "Vencord-inspired"],
        enabledByDefault: false,
    },
    settings: SCHEMA,
    onStart(ctx) {
        const tip = ensureTip();

        const onMove = (e: MouseEvent): void => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            const reaction = target.closest<HTMLElement>(REACTION_SELECTOR);
            if (!reaction || !ctx.settings.showTooltip) {
                tip.style.display = "none";
                return;
            }
            const count = readCount(reaction);
            if (count < ctx.settings.countThreshold) {
                tip.style.display = "none";
                return;
            }
            const emoji = readEmoji(reaction);
            tip.innerHTML = `<strong>${count}</strong> تفاعل · ${emoji} · <em>اضغط للقائمة الكاملة</em>`;
            tip.style.display = "block";
            tip.style.left = `${e.clientX + 12}px`;
            tip.style.top = `${e.clientY + 12}px`;
        };

        const onLeave = (e: MouseEvent): void => {
            const target = e.target as HTMLElement | null;
            if (!target?.closest(REACTION_SELECTOR)) {
                tip.style.display = "none";
            }
        };

        const onClick = (e: MouseEvent): void => {
            const target = e.target as HTMLElement | null;
            const reaction = target?.closest<HTMLElement>(REACTION_SELECTOR);
            if (reaction) ctx.stats.bump("clicked");
        };

        document.addEventListener("mousemove", onMove, { passive: true });
        document.addEventListener("mouseleave", onLeave, true);
        document.addEventListener("click", onClick, true);

        const g = globalThis as unknown as { __BOON_WHOREACTED_CLEANUP__?: () => void };
        g.__BOON_WHOREACTED_CLEANUP__ = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseleave", onLeave, true);
            document.removeEventListener("click", onClick, true);
            document.getElementById(TIP_ID)?.remove();
        };
        ctx.logger.info("active");
    },
    onStop(ctx) {
        const g = globalThis as unknown as { __BOON_WHOREACTED_CLEANUP__?: () => void };
        g.__BOON_WHOREACTED_CLEANUP__?.();
        delete g.__BOON_WHOREACTED_CLEANUP__;
        ctx.logger.info("stopped");
    },
});
