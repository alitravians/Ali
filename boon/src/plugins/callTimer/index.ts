/*
 * BOON Plugin: CallTimer
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's CallTimer plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/callTimer
 *
 * Shows elapsed time since you joined the current voice channel. We detect
 * voice connection by watching for the bottom-left voice indicator
 * ("Voice Connected") and start a timer when it first appears.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    format: {
        type: "select",
        label: "تنسيق العرض",
        default: "auto",
        options: [
            { label: "تلقائي (HH:MM:SS أو MM:SS)", value: "auto" },
            { label: "HH:MM:SS دائماً", value: "hms" },
            { label: "MM:SS فقط", value: "ms" },
        ],
    },
} as const satisfies SettingsSchema;

const TIMER_ID = "boon-call-timer";
const VOICE_PANEL_SELECTOR =
    '[class*="rtcConnectionStatus"], [aria-label*="voice connect" i], ' +
    'section[class*="container_"] [class*="connection_"]';

function pad(n: number): string {
    return String(Math.floor(n)).padStart(2, "0");
}

function formatElapsed(ms: number, mode: "auto" | "hms" | "ms"): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (mode === "ms") {
        const mm = h * 60 + m;
        return `${pad(mm)}:${pad(s)}`;
    }
    if (mode === "hms" || h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
}

export default definePlugin({
    manifest: {
        id: "callTimer",
        name: "CallTimer",
        description: "يعرض مدة الاتصال الصوتي بشكل مستمر.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["UX", "Vencord-inspired"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        let startedAt: number | null = null;
        let interval: number | null = null;

        const removeBadge = (): void => {
            document.getElementById(TIMER_ID)?.remove();
        };

        const ensureBadge = (): HTMLElement | null => {
            let badge = document.getElementById(TIMER_ID);
            if (badge) return badge;
            const panel = document.querySelector<HTMLElement>(VOICE_PANEL_SELECTOR);
            if (!panel) return null;
            badge = document.createElement("div");
            badge.id = TIMER_ID;
            badge.style.cssText = [
                "padding:2px 6px", "margin:2px 0",
                "background:rgba(35,165,90,0.18)",
                "color:#23a55a",
                "border-radius:4px",
                "font-size:11px", "font-weight:600",
                "font-variant-numeric:tabular-nums",
                "text-align:center",
            ].join(";");
            badge.setAttribute("dir", "auto");
            panel.appendChild(badge);
            return badge;
        };

        const tick = (): void => {
            const badge = ensureBadge();
            if (!badge || startedAt === null) return;
            badge.textContent = `⏱ ${formatElapsed(Date.now() - startedAt, ctx.settings.format)}`;
        };

        const watch = (): void => {
            const inCall = !!document.querySelector(VOICE_PANEL_SELECTOR);
            if (inCall && startedAt === null) {
                startedAt = Date.now();
                tick();
                interval = window.setInterval(tick, 1000);
                ctx.stats.bump("calls_tracked");
                ctx.logger.info("call started");
            } else if (!inCall && startedAt !== null) {
                if (interval !== null) window.clearInterval(interval);
                interval = null;
                startedAt = null;
                removeBadge();
                ctx.logger.info("call ended");
            }
        };

        // Debounce via rAF — see CONTRIBUTING.md §4. A busy guild fires dozens
        // of mutations per second; we only need a single watch() per frame.
        let watchScheduled = false;
        const observer = new MutationObserver(() => {
            if (watchScheduled) return;
            watchScheduled = true;
            requestAnimationFrame(() => {
                watchScheduled = false;
                watch();
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        watch();

        const g = globalThis as unknown as { __BOON_CALLTIMER_CLEANUP__?: () => void };
        g.__BOON_CALLTIMER_CLEANUP__ = () => {
            observer.disconnect();
            if (interval !== null) window.clearInterval(interval);
            removeBadge();
        };
        ctx.logger.info("active");
    },
    onStop(ctx) {
        const g = globalThis as unknown as { __BOON_CALLTIMER_CLEANUP__?: () => void };
        g.__BOON_CALLTIMER_CLEANUP__?.();
        delete g.__BOON_CALLTIMER_CLEANUP__;
        ctx.logger.info("stopped");
    },
});
