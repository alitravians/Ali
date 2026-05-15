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

/**
 * Parse a strictly-formatted member-count token, e.g. `"4"`, `"1,234"`,
 * `"1.2K"`, `"4M"`. The pattern is fully anchored so loose tokens like
 * `"4 members"` (a digit followed by whitespace and an English word that
 * happens to start with `m`) can NEVER be misinterpreted as `4_000_000`.
 *
 * Returns `null` on any parse failure so callers can fall back instead of
 * silently producing nonsense counts.
 */
function parseCount(text: string): number | null {
    const m = text.match(/^(\d[\d,]*(?:\.\d+)?)([kKmM])?$/);
    if (!m) return null;
    const raw = parseFloat(m[1].replace(/,/g, ""));
    if (isNaN(raw)) return null;
    const suffix = (m[2] ?? "").toLowerCase();
    if (suffix === "k") return Math.round(raw * 1000);
    if (suffix === "m") return Math.round(raw * 1_000_000);
    return Math.round(raw);
}

interface Counts {
    online: number | null;
    total: number | null;
}

/**
 * Read online + total counts from Discord's member-list group headers.
 *
 * The member-list panel renders one header per status bucket using the
 * pattern `Label — Count` (em dash, en dash, or hyphen as separator):
 *   - `Online — 4`
 *   - `Idle — 1`
 *   - `Offline — 12`
 *
 * We target the specific group-header element (`[class*="membersGroupHeader"]`)
 * — NOT broader containers — so we never read concatenated text like
 * `"Online, 4 membersOnline — 4alitravians..."` that mixes counts with
 * surrounding member-name text. That broader read used to misparse the
 * leading `"4 members"` substring as `"4M"` (because `\s*[kKmM]?` greedily
 * consumed the space and the `m` from `members`) and report 4,000,000
 * online users in a 4-member server.
 *
 * Total = sum of every parsed group header. If no group headers are
 * present (member list collapsed, or Discord's class names changed),
 * both fields are `null` and the badge is hidden.
 */
function readMemberListCounts(): Counts {
    const groupHeaders = Array.from(document.querySelectorAll<HTMLElement>(
        '[class*="membersGroupHeader"]',
    ));

    let online: number | null = null;
    let totalAccum = 0;
    let foundAnyGroup = false;

    for (const h of groupHeaders) {
        const text = (h.textContent ?? "").trim();
        // Pattern: "Label — Count". Accept em dash (—), en dash (–), and
        // hyphen-minus (-) as separators. Count must be a numeric token
        // valid for `parseCount` (digits, optional commas/decimal, optional
        // K/M suffix).
        const match = text.match(/^(.+?)\s*[—–\-]\s*([\d,]+(?:\.\d+)?[kKmM]?)\s*$/);
        if (!match) continue;
        const label = match[1].trim();
        const count = parseCount(match[2]);
        if (count === null) continue;
        foundAnyGroup = true;
        totalAccum += count;
        if (/^online\b|^متصل/i.test(label)) online = count;
    }

    return {
        online,
        total: foundAnyGroup ? totalAccum : null,
    };
}

/**
 * Format a count for the badge. Numbers < 10K render verbatim ("4",
 * "857", "9999"). Numbers in the thousands render with one decimal
 * ("1.2K"), and numbers ≥ 10K drop the decimal ("12K", "1.2M").
 */
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
