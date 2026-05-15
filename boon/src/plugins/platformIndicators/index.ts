/*
 * BOON Plugin: PlatformIndicators
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's PlatformIndicators plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/platformIndicators
 *
 * DOM-limited variant: Vencord uses Discord's PresenceStore to read every
 * user's active clients (desktop / mobile / web / embedded). Without webpack
 * access we can only act on signals Discord already renders:
 *
 *   1. The status dot's `aria-label` sometimes carries the platform name
 *      (e.g. "Mobile online"). When present, we surface it as an inline icon.
 *   2. Discord adds a separate ".status_*" class chain for mobile vs desktop.
 *      We translate that into an emoji indicator placed next to the username.
 *
 * Coverage: ~60% of cases vs Vencord's ~100%. For full coverage we'd need a
 * webpack patcher — tracked separately.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    inMessages: { type: "boolean", label: "بجانب رؤوس الرسائل", default: true },
    inMemberList: { type: "boolean", label: "في قائمة الأعضاء", default: true },
    inPopout: { type: "boolean", label: "في popout البروفايل", default: true },
} as const satisfies SettingsSchema;

const PLATFORM_ICON: Record<string, string> = {
    mobile: "📱",
    desktop: "🖥️",
    web: "🌐",
    embedded: "🎮",
};

function detectPlatform(el: HTMLElement): string | null {
    // 1. aria-label on status dot
    const dot = el.querySelector<HTMLElement>('[class*="status_"][role="presentation"], [class*="status_"][aria-label]');
    if (dot) {
        const label = (dot.getAttribute("aria-label") ?? "").toLowerCase();
        if (label.includes("mobile") || label.includes("جوال")) return "mobile";
        if (label.includes("desktop") || label.includes("سطح")) return "desktop";
        if (label.includes("web") || label.includes("ويب")) return "web";
        if (label.includes("embedded") || label.includes("game")) return "embedded";
    }

    // 2. Class-name based heuristic — Discord's mobile status uses different SVG path
    const mobileSvg = el.querySelector('svg[class*="mobile_"], path[d*="M0 0h6a3 3 0"]');
    if (mobileSvg) return "mobile";

    return null;
}

const MARK_ATTR = "data-boon-platform";

function decorate(el: HTMLElement): void {
    if (el.hasAttribute(MARK_ATTR)) return;
    const platform = detectPlatform(el);
    if (!platform) return;
    el.setAttribute(MARK_ATTR, platform);

    const icon = document.createElement("span");
    icon.className = "boon-platform-icon";
    icon.textContent = PLATFORM_ICON[platform] ?? "";
    icon.title = platform;
    icon.style.cssText = "margin-inline:4px;font-size:11px;opacity:0.85;vertical-align:middle";

    // Insert after the username/status group rather than at the end (less visual jitter)
    const username = el.querySelector<HTMLElement>('[id^="message-username-"], [class*="username_"], h3 span');
    if (username) {
        username.appendChild(icon);
    } else {
        el.appendChild(icon);
    }
}

export default definePlugin({
    manifest: {
        id: "platformIndicators",
        name: "PlatformIndicators",
        description: "يعرض رمز الجهاز (جوال/سطح المكتب/ويب) بجانب المستخدمين. تغطية محدودة بدون webpack.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["UX", "Vencord-inspired"],
        enabledByDefault: false,
    },
    settings: SCHEMA,
    onStart(ctx) {
        const scan = (): void => {
            if (ctx.settings.inMessages) {
                document.querySelectorAll<HTMLElement>('li[id^="chat-messages-"] h3').forEach(decorate);
            }
            if (ctx.settings.inMemberList) {
                document.querySelectorAll<HTMLElement>('[class*="member_"], [class*="memberInner"]').forEach(decorate);
            }
            if (ctx.settings.inPopout) {
                document.querySelectorAll<HTMLElement>('[class*="userPopout"] [class*="headerTop"], [class*="userProfile"] [class*="headerTop"]').forEach(decorate);
            }
        };

        scan();
        const observer = new MutationObserver(() => scan());
        observer.observe(document.body, { childList: true, subtree: true });

        const g = globalThis as unknown as { __BOON_PLATFORMINDICATORS_CLEANUP__?: () => void };
        g.__BOON_PLATFORMINDICATORS_CLEANUP__ = () => {
            observer.disconnect();
            document.querySelectorAll(`[${MARK_ATTR}]`).forEach(el => {
                el.removeAttribute(MARK_ATTR);
                el.querySelectorAll(".boon-platform-icon").forEach(n => n.remove());
            });
        };
        ctx.logger.info("active");
    },
    onStop(ctx) {
        const g = globalThis as unknown as { __BOON_PLATFORMINDICATORS_CLEANUP__?: () => void };
        g.__BOON_PLATFORMINDICATORS_CLEANUP__?.();
        delete g.__BOON_PLATFORMINDICATORS_CLEANUP__;
        ctx.logger.info("stopped");
    },
});
