/*
 * BOON Plugin: MemberCount
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's MemberCount plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/memberCount
 *
 * Shows online and total member counts in a small badge in the channel
 * header. Reads counts from Discord's existing member-list sidebar
 * ("ONLINE — N" and "MEMBERS — N" section headers) rather than via
 * webpack/store access.
 *
 * Note: Total member count for large servers is not always rendered
 * verbatim by Discord (they show "1,250" → 1.2K). We parse k/K/M suffixes.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    showInHeader: { type: "boolean", label: "إظهار العدّاد في رأس القناة", default: true },
    pollMs: { type: "number", label: "زمن التحديث (مللي ثانية)", default: 3000, min: 500, max: 30000 },
} as const satisfies SettingsSchema;

function parseCount(text: string): number {
    const m = text.match(/([\d,.]+)\s*([kKmM]?)/);
    if (!m) return 0;
    const raw = parseFloat(m[1].replace(/,/g, ""));
    if (isNaN(raw)) return 0;
    const suffix = m[2].toLowerCase();
    if (suffix === "k") return Math.round(raw * 1000);
    if (suffix === "m") return Math.round(raw * 1_000_000);
    return Math.round(raw);
}

interface Counts {
    online: number | null;
    total: number | null;
}

function readMemberListCounts(): Counts {
    const onlineHeader = Array.from(document.querySelectorAll<HTMLElement>(
        '[class*="membersGroup"], [aria-label*="member" i]'
    )).find(h => /online|متصل/i.test(h.textContent ?? ""));

    let online: number | null = null;
    if (onlineHeader) {
        const t = onlineHeader.textContent ?? "";
        const m = t.match(/(\d[\d,.]*\s*[kKmM]?)/);
        if (m) online = parseCount(m[1]);
    }

    // Total: membersGroup with "offline" plus online, or member-list aria-label
    const memberList = document.querySelector<HTMLElement>('[aria-label*="member" i][class*="members"]');
    let total: number | null = null;
    if (memberList) {
        const label = memberList.getAttribute("aria-label") ?? "";
        const m = label.match(/(\d[\d,.]*\s*[kKmM]?)/);
        if (m) total = parseCount(m[1]);
    }

    return { online, total };
}

function format(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${(n / 1000).toFixed(0)}K`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
}

const BADGE_ID = "boon-member-count-badge";

function ensureBadge(): HTMLElement | null {
    let badge = document.getElementById(BADGE_ID);
    if (badge) return badge;
    const header = document.querySelector<HTMLElement>(
        '[class*="title_"][class*="header"], section[aria-label*="channel header" i], [class*="topic_"]'
    )
    ?? document.querySelector<HTMLElement>('header[class*="container"]');
    if (!header) return null;
    badge = document.createElement("div");
    badge.id = BADGE_ID;
    badge.style.cssText = [
        "display:inline-flex", "align-items:center", "gap:6px",
        "margin:0 8px", "padding:2px 8px",
        "background:var(--background-modifier-accent,#3f4147)",
        "color:var(--text-normal,#dbdee1)",
        "border-radius:10px", "font-size:12px", "font-weight:500",
        "user-select:none", "vertical-align:middle",
    ].join(";");
    badge.setAttribute("dir", "auto");
    header.appendChild(badge);
    return badge;
}

export default definePlugin({
    manifest: {
        id: "memberCount",
        name: "MemberCount",
        description: "يعرض عدد الأعضاء المتصلين والإجمالي في رأس القناة.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["UX", "Vencord-inspired"],
        enabledByDefault: false,
    },
    settings: SCHEMA,
    onStart(ctx) {
        const update = (): void => {
            if (!ctx.settings.showInHeader) {
                document.getElementById(BADGE_ID)?.remove();
                return;
            }
            const badge = ensureBadge();
            if (!badge) return;
            const { online, total } = readMemberListCounts();
            const parts: string[] = [];
            if (online !== null) parts.push(`🟢 ${format(online)}`);
            if (total !== null) parts.push(`👥 ${format(total)}`);
            if (parts.length === 0) {
                badge.style.display = "none";
                return;
            }
            badge.style.display = "inline-flex";
            badge.textContent = parts.join(" · ");
        };

        update();
        const interval = window.setInterval(update, ctx.settings.pollMs);

        const g = globalThis as unknown as { __BOON_MEMBERCOUNT_CLEANUP__?: () => void };
        g.__BOON_MEMBERCOUNT_CLEANUP__ = () => {
            window.clearInterval(interval);
            document.getElementById(BADGE_ID)?.remove();
        };
        ctx.logger.info("active");
    },
    onStop(ctx) {
        const g = globalThis as unknown as { __BOON_MEMBERCOUNT_CLEANUP__?: () => void };
        g.__BOON_MEMBERCOUNT_CLEANUP__?.();
        delete g.__BOON_MEMBERCOUNT_CLEANUP__;
        ctx.logger.info("stopped");
    },
});
