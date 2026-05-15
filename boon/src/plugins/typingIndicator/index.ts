/*
 * BOON Plugin: TypingIndicator
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's TypingIndicator plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/typingIndicator
 *
 * Shows a small animated "…" badge next to channels in the sidebar that have
 * users currently typing — even if you're not viewing that channel.
 *
 * Architecture (BOON-specific) — defense-in-depth on event ingestion:
 *   - PRIMARY: subscribes to the raw Discord gateway WebSocket via
 *     `onGatewayEvent('TYPING_START', ...)`. This works regardless of how
 *     Discord mangles its internal webpack bundle because the gateway
 *     protocol is public and stable.
 *   - SECONDARY (defence-in-depth): also subscribes to Discord's Flux
 *     `TYPING_START`/`TYPING_STOP` actions via the webpack subsystem.
 *     Either source wins; duplicate events are absorbed by the per-channel
 *     `Map<userId, lastSeenEpochMs>` (latest timestamp wins).
 *   - Maintains an in-memory map of `channelId → Set<userId>` with per-entry
 *     timestamps. Entries auto-expire after `EXPIRY_MS` since the gateway
 *     does NOT emit a TYPING_STOP event.
 *   - On every change, schedules a paint via `requestAnimationFrame` so we
 *     don't thrash the DOM if a burst of TYPING_START events comes in.
 *   - Paint walks the channel sidebar (`a[data-list-item-id^="channels___"]`)
 *     and toggles a `.boon-typing-dot` element per channel link based on the
 *     current map.
 *
 * Settings:
 *   - `enabled` — master switch surfaced as a normal plugin toggle.
 *   - `ignoreSelf` — don't show the badge for *your* typing.
 *   - `expiryMs` — how long after the last TYPING_START to keep the badge.
 *
 * Cleanup: a single global cleanup fn unsubscribes both Flux handlers,
 * detaches the sidebar MutationObserver, clears the expiry timer, and
 * removes every injected `.boon-typing-dot` from the DOM. Stored on
 * `globalThis.__BOON_TYPING_INDICATOR_CLEANUP__` so `onStop` only needs to
 * invoke it.
 */

import { onGatewayEvent } from "../../core/gateway/index.js";
import { definePlugin, type SettingsSchema } from "../../core/types.js";
import { isWebpackReady, subscribeToAction } from "../../core/webpack/index.js";

const SCHEMA = {
    ignoreSelf: {
        type: "boolean",
        label: "تجاهل كتابتي أنا",
        description: "لا تعرض النقاط لما تكون أنت اللي يكتب.",
        default: true,
    },
    expiryMs: {
        type: "number",
        label: "مدة الإبقاء (مللي ثانية)",
        description: "كم ثانية يبقى البادج بعد آخر إشارة كتابة. Discord ما يضمن إرسال TYPING_STOP لكل بدء.",
        default: 8000,
        min: 2000,
        max: 30000,
    },
    showInDMs: {
        type: "boolean",
        label: "إظهار في الرسائل الخاصة",
        description: "يطبّق نفس البادج على قنوات DM في الشريط الجانبي.",
        default: true,
    },
} as const satisfies SettingsSchema;

interface TypingStartAction {
    readonly type: "TYPING_START";
    readonly channelId: string;
    readonly userId: string;
    readonly [key: string]: unknown;
}

interface TypingStopAction {
    readonly type: "TYPING_STOP";
    readonly channelId: string;
    readonly userId: string;
    readonly [key: string]: unknown;
}

const DOT_CLASS = "boon-typing-dot";
const STYLE_ID = "boon-typing-indicator-style";

/**
 * Per-channel typing state. Value is `Map<userId, lastSeenEpochMs>`. Using
 * timestamps lets us prune stale users without needing a TYPING_STOP from
 * Discord (which isn't guaranteed).
 */
const typingByChannel = new Map<string, Map<string, number>>();

function recordStart(channelId: string, userId: string): void {
    let users = typingByChannel.get(channelId);
    if (!users) {
        users = new Map();
        typingByChannel.set(channelId, users);
    }
    users.set(userId, Date.now());
}

function recordStop(channelId: string, userId: string): void {
    const users = typingByChannel.get(channelId);
    if (!users) return;
    users.delete(userId);
    if (users.size === 0) typingByChannel.delete(channelId);
}

function pruneExpired(expiryMs: number): void {
    const cutoff = Date.now() - expiryMs;
    for (const [channelId, users] of typingByChannel) {
        for (const [userId, ts] of users) {
            if (ts < cutoff) users.delete(userId);
        }
        if (users.size === 0) typingByChannel.delete(channelId);
    }
}

/**
 * Look up the current Discord user's id from any sidebar avatar element that
 * carries the `data-user-id` attribute. Falls back to scraping the user
 * panel at the bottom of the channel list. Returns `null` if neither is
 * available — in that case `ignoreSelf` simply won't apply yet.
 */
function readSelfUserId(): string | null {
    // The user panel at the bottom of the channel list always shows the
    // current user once Discord has booted; its avatar carries data-user-id.
    const avatar = document.querySelector<HTMLElement>(
        'section[aria-label*="user area" i] [data-user-id], [class*="panels_"] [data-user-id]',
    );
    return avatar?.getAttribute("data-user-id") ?? null;
}

/**
 * Extract a channel id from a sidebar anchor. Discord uses
 * `data-list-item-id="channels___<channelId>"` on every channel link, and
 * `dm___<channelId>` for direct messages.
 */
function channelIdFromAnchor(anchor: HTMLElement): string | null {
    const listId = anchor.getAttribute("data-list-item-id");
    if (!listId) return null;
    const idx = listId.lastIndexOf("___");
    if (idx === -1) return null;
    return listId.slice(idx + 3);
}

function injectStyleOnce(): () => void {
    if (document.getElementById(STYLE_ID)) return () => { /* shared style — leave it */ };
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        /*
         * Channel anchors render as flex columns (icon row on top, content
         * row below). Appending the dot as an anchor child would push it to
         * a third row and stretch it to fill the anchor width — useless.
         * Position absolutely against the anchor (which Discord renders
         * with position: relative) so the dot floats in the top-right
         * corner, regardless of channel name length or sidebar width.
         */
        .${DOT_CLASS} {
            position: absolute;
            top: 50%;
            inset-inline-end: 10px;
            transform: translateY(-50%);
            display: inline-flex;
            align-items: center;
            gap: 3px;
            pointer-events: none;
            z-index: 2;
        }
        .${DOT_CLASS} span {
            width: 5px; height: 5px; border-radius: 50%;
            background: var(--text-positive, #23a55a);
            opacity: 0.55;
            animation: boon-typing-bounce 1.2s infinite ease-in-out;
        }
        .${DOT_CLASS} span:nth-child(2) { animation-delay: 0.15s; }
        .${DOT_CLASS} span:nth-child(3) { animation-delay: 0.30s; }
        @keyframes boon-typing-bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.55; }
            30% { transform: translateY(-2px); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    return () => style.remove();
}

function buildDot(): HTMLElement {
    const wrap = document.createElement("span");
    wrap.className = DOT_CLASS;
    wrap.setAttribute("aria-label", "أحد يكتب الآن");
    wrap.setAttribute("dir", "auto");
    for (let i = 0; i < 3; i++) wrap.appendChild(document.createElement("span"));
    return wrap;
}

/**
 * Reconcile DOM state against `typingByChannel`. Adds/removes one
 * `.boon-typing-dot` per channel anchor. Idempotent — calling repeatedly is
 * safe and cheap.
 */
function paint(showInDMs: boolean): void {
    const selector = showInDMs
        ? 'a[data-list-item-id^="channels___"], a[data-list-item-id^="dm___"]'
        : 'a[data-list-item-id^="channels___"]';

    const seen = new Set<string>();
    document.querySelectorAll<HTMLElement>(selector).forEach(anchor => {
        const channelId = channelIdFromAnchor(anchor);
        if (!channelId) return;
        seen.add(channelId);

        const users = typingByChannel.get(channelId);
        const wants = !!users && users.size > 0;
        const existing = anchor.querySelector<HTMLElement>(`.${DOT_CLASS}`);
        if (wants && !existing) {
            anchor.appendChild(buildDot());
        } else if (!wants && existing) {
            existing.remove();
        }
    });

    // Any channels we no longer have anchors for but still hold typing state
    // for: leave the state alone (the channel might be in a collapsed
    // category). The next paint will re-attach the dot when it scrolls in.
    void seen;
}

export default definePlugin({
    manifest: {
        id: "typingIndicator",
        name: "TypingIndicator",
        description: "نقاط متحرّكة بجانب اسم القناة في الشريط الجانبي لما أحد يكتب فيها — حتى لو ما فاتح القناة.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["شريط جانبي", "Vencord-inspired", "webpack"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        if (!isWebpackReady()) {
            // The webpack subsystem hooks during boot — if it hasn't captured
            // require yet, our subscriptions still queue and attach as soon
            // as the dispatcher appears. Log it so users can correlate any
            // first-load delay.
            ctx.logger.info("webpack not ready yet; subscriptions will queue");
        }

        const removeStyle = injectStyleOnce();
        let selfId: string | null = readSelfUserId();

        // ── Flux subscriptions ───────────────────────────────────────────
        let paintScheduled = false;
        const schedulePaint = (): void => {
            if (paintScheduled) return;
            paintScheduled = true;
            requestAnimationFrame(() => {
                paintScheduled = false;
                pruneExpired(ctx.settings.expiryMs);
                paint(ctx.settings.showInDMs);
            });
        };

        // ── PRIMARY: Discord gateway WebSocket ──────────────────────────
        // Gateway events use snake_case (channel_id / user_id), unlike Flux
        // dispatcher actions which use camelCase. We normalise here.
        const unsubGateway = onGatewayEvent("TYPING_START", payload => {
            const channelId = payload.channel_id;
            const userId = payload.user_id;
            if (!channelId || !userId) return;
            if (ctx.settings.ignoreSelf) {
                if (!selfId) selfId = readSelfUserId();
                if (selfId && userId === selfId) return;
            }
            recordStart(channelId, userId);
            ctx.stats.bump("typing_start_gateway");
            schedulePaint();
        });

        // ── SECONDARY: Flux dispatcher (defence in depth) ──────────────
        // If webpack discovery fails (heavily-obfuscated bundles), these
        // simply never fire — the gateway path still feeds typingByChannel.
        const unsubStart = subscribeToAction<TypingStartAction>("TYPING_START", action => {
            if (!action.channelId || !action.userId) return;
            if (ctx.settings.ignoreSelf) {
                if (!selfId) selfId = readSelfUserId();
                if (selfId && action.userId === selfId) return;
            }
            recordStart(action.channelId, action.userId);
            ctx.stats.bump("typing_start_flux");
            schedulePaint();
        });

        const unsubStop = subscribeToAction<TypingStopAction>("TYPING_STOP", action => {
            if (!action.channelId || !action.userId) return;
            recordStop(action.channelId, action.userId);
            ctx.stats.bump("typing_stop_flux");
            schedulePaint();
        });

        // ── Sidebar MutationObserver ────────────────────────────────────
        // Discord virtualises the channel list — when categories collapse or
        // the user scrolls a long list, anchors come and go. Re-paint on any
        // sidebar change so dots reattach to freshly-mounted anchors.
        let observerScheduled = false;
        const observer = new MutationObserver(() => {
            if (observerScheduled) return;
            observerScheduled = true;
            requestAnimationFrame(() => {
                observerScheduled = false;
                paint(ctx.settings.showInDMs);
            });
        });
        const sidebar = document.querySelector('nav[class*="sidebar_"], nav[aria-label*="server" i]')
            ?? document.body;
        observer.observe(sidebar, { childList: true, subtree: true });

        // ── Expiry sweep ─────────────────────────────────────────────────
        // The sweep handles channels we never get a TYPING_STOP for. Runs at
        // half the configured expiry so a typing user disappears within at
        // most 1.5× expiry.
        const sweep = window.setInterval(() => {
            pruneExpired(ctx.settings.expiryMs);
            paint(ctx.settings.showInDMs);
        }, Math.max(1000, Math.floor(ctx.settings.expiryMs / 2)));

        // ── Re-paint on settings change ─────────────────────────────────
        const unsubSettings = ctx.on("settings:changed", ({ pluginId }) => {
            if (pluginId !== "typingIndicator") return;
            selfId = readSelfUserId();
            schedulePaint();
        });

        // Initial paint covers the case where TYPING_START fired before our
        // subscription attached (rare but possible during dispatcher
        // discovery).
        schedulePaint();

        ctx.logger.info("active");

        const g = globalThis as unknown as { __BOON_TYPING_INDICATOR_CLEANUP__?: () => void };
        g.__BOON_TYPING_INDICATOR_CLEANUP__ = () => {
            unsubGateway();
            unsubStart();
            unsubStop();
            unsubSettings();
            observer.disconnect();
            window.clearInterval(sweep);
            typingByChannel.clear();
            document.querySelectorAll(`.${DOT_CLASS}`).forEach(el => el.remove());
            removeStyle();
        };
    },
    onStop(ctx) {
        const g = globalThis as unknown as { __BOON_TYPING_INDICATOR_CLEANUP__?: () => void };
        g.__BOON_TYPING_INDICATOR_CLEANUP__?.();
        delete g.__BOON_TYPING_INDICATOR_CLEANUP__;
        ctx.logger.info("stopped");
    },
});
