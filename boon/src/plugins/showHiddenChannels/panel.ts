/*
 * BOON Plugin: ShowHiddenChannels — panel UI
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Renders the launcher button in the sidebar header and the modal panel
 * (list + details views). All DOM is namespaced under `.boon-shc-*` and
 * created via `document.createElement` + `textContent` — never `innerHTML`
 * — so user-controlled strings (channel name, topic, role name, etc.) can't
 * escape into HTML.
 *
 * Sole exception: `buildLockNode()` parses a fixed `LOCK_SVG` string
 * literal via a `<template>` element. The string is compile-time constant
 * with zero user input, so it can never become an XSS vector; the
 * `<template>` route is just less code than ~20 lines of
 * `createElementNS` calls for the decorative padlock illustration.
 */

import { lookupRole, scanGuild } from "./discovery.js";
import type { DiscoveredChannel, DiscoveredOverwrite, DiscoveryResult } from "./discovery.js";
import { findByProps, getGuildMemberStore, getUserStore } from "../../core/webpack/index.js";
import type { DiscordRoleLite } from "../../core/webpack/types.js";

// ─── Filter/sort state ──────────────────────────────────────────────────────

export type FilterKind = "all" | "text" | "voice" | "stage" | "forum" | "announcement" | "media" | "category";
export type SortKey = "position" | "name" | "activity";

interface PanelState {
    guildId: string | null;
    result: DiscoveryResult | null;
    query: string;
    filter: FilterKind;
    sort: SortKey;
    nsfwFiltered: boolean;
    /** When non-null, panel shows the details view for that channel. */
    drilldownId: string | null;
    /** Flat list (raw order) vs grouped under category headers. */
    groupingMode: "flat" | "byCategory";
    /**
     * MRU list of channel ids the user drilled into. Surfaced at the top
     * of the list view so frequently-checked channels are a click away.
     * Capped to 6 entries — anything older silently rolls off.
     */
    recentlyViewed: string[];
}

const RECENT_CAP = 6;

const state: PanelState = {
    guildId: null,
    result: null,
    query: "",
    filter: "all",
    sort: "position",
    nsfwFiltered: false,
    drilldownId: null,
    groupingMode: "byCategory",
    recentlyViewed: [],
};

// ─── Element ids/classes ────────────────────────────────────────────────────

const LAUNCH_ID = "boon-shc-launch";
const BACKDROP_ID = "boon-shc-backdrop";

// ─── Helpers ────────────────────────────────────────────────────────────────

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    cls?: string,
    text?: string,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

function iconFor(kind: DiscoveredChannel["kind"]): string {
    switch (kind) {
        case "voice": return "🔊";
        case "stage": return "🎙️";
        case "forum": return "💬";
        case "announcement": return "📣";
        case "media": return "🖼️";
        case "category": return "📁";
        case "text": return "#";
        default: return "•";
    }
}

function labelFor(kind: FilterKind): string {
    switch (kind) {
        case "all": return "الكل";
        case "text": return "نصية";
        case "voice": return "صوتية";
        case "stage": return "مسرح";
        case "forum": return "منتدى";
        case "announcement": return "إعلانات";
        case "media": return "ميديا";
        case "category": return "فئات";
    }
}

function labelForSort(key: SortKey): string {
    switch (key) {
        case "position": return "حسب الموضع";
        case "name": return "حسب الاسم";
        case "activity": return "حسب آخر نشاط";
    }
}

function labelForKind(kind: DiscoveredChannel["kind"]): string {
    switch (kind) {
        case "text": return "نصية";
        case "voice": return "صوتية";
        case "stage": return "مسرح";
        case "forum": return "منتدى";
        case "announcement": return "إعلانات";
        case "media": return "ميديا";
        case "category": return "فئة";
        default: return "أخرى";
    }
}

function formatTimeAgo(ms: number): string {
    const now = Date.now();
    const delta = Math.max(0, now - ms);
    const min = Math.floor(delta / 60000);
    if (min < 1) return "الآن";
    if (min < 60) return `قبل ${min} د`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `قبل ${hr} س`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `قبل ${day} يوم`;
    const mon = Math.floor(day / 30);
    // 12 months covers days 360–364 too — without this, those values fall
    // through to `Math.floor(day / 365) === 0` and we'd render "قبل 0 سنة".
    if (mon < 13) return `قبل ${mon} شهر`;
    const yr = Math.floor(day / 365);
    return `قبل ${yr} سنة`;
}

function formatSlowmode(s: number): string {
    if (s < 60) return `${s} ث`;
    if (s < 3600) return `${Math.round(s / 60)} د`;
    return `${Math.round(s / 3600)} س`;
}

/**
 * Arabic-formatted absolute timestamp ("15 مايو 2026 · 2:24 م").
 *
 * We intentionally avoid `toLocaleString("ar")` because it produces
 * Eastern-Arabic-Indic digits which look out of place inside a Discord
 * client where the rest of the chrome uses Western digits. Mixing both
 * is worse than picking one; we picked Western. Discord itself does the
 * same for timestamps in the chat scroller.
 */
function formatAbsoluteDate(ms: number): string {
    const d = new Date(ms);
    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "م" : "ص";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${day} ${month} ${year} · ${hours}:${minutes} ${period}`;
}

/**
 * Discord roles expose `colorString` ("#5865F2") on modern builds and a
 * decimal `color` field on older ones. `color === 0` means "no custom
 * colour, render with default text" — we return null in that case so
 * callers can fall back to the brand-neutral pill styling.
 */
function roleColorHex(role: DiscordRoleLite): string | null {
    if (role.colorString) return role.colorString;
    if (typeof role.color === "number" && role.color > 0) {
        return "#" + role.color.toString(16).padStart(6, "0");
    }
    return null;
}

/**
 * Light-vs-dark contrast picker for the pill foreground.
 *
 * The pill background is the role's own colour, so we need a foreground
 * that stays legible whether the role is `#FAFAFA` or `#1A1A1A`. We use
 * the YIQ luma formula (Rec. 601) because it matches how the eye weighs
 * RGB channels and is the de-facto contrast heuristic used by Bootstrap,
 * Material, etc.
 */
function readableForeground(hex: string): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return "#fff";
    const r = parseInt(m[1].slice(0, 2), 16);
    const g = parseInt(m[1].slice(2, 4), 16);
    const b = parseInt(m[1].slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#1e1f22" : "#ffffff";
}

/**
 * Count how many access-granting overwrites a channel has, split by
 * role/member. Cheap O(overwrites.length) summary used by list rows
 * to surface "n أدوار · m أعضاء لديهم صلاحية" without joining against
 * the (potentially huge) member store.
 */
function accessSummary(channel: DiscoveredChannel): { roles: number; members: number } {
    let roles = 0;
    let members = 0;
    for (const ow of channel.overwrites) {
        if (!ow.grantsView) continue;
        if (ow.kind === "role") roles++;
        else members++;
    }
    return { roles, members };
}

interface DiscordRouter {
    transitionTo(path: string): void;
}

let routerCache: DiscordRouter | null = null;

/**
 * Resolve Discord's React-Router-style navigation helper. Webpack mangles
 * its module path on every build, but the public surface (`transitionTo`
 * + one of `replaceWith` / `back`) stays stable. We memoise so the lookup
 * is paid at most once per session.
 */
function getDiscordRouter(): DiscordRouter | null {
    if (routerCache) return routerCache;
    const candidates = [
        findByProps("transitionTo", "replaceWith"),
        findByProps("transitionTo", "back", "forward"),
        findByProps("transitionTo"),
    ];
    for (const c of candidates) {
        if (c && typeof (c as Record<string, unknown>).transitionTo === "function") {
            routerCache = c as DiscordRouter;
            return routerCache;
        }
    }
    return null;
}

/**
 * Navigate Discord's client to the given hidden channel so the user lands
 * on Discord's own "this channel is hidden" view. We try the webpack
 * router first; if that's not reachable (very early in startup, or
 * Discord's module shape changed), we fall back to a synthetic anchor
 * click which Discord's link interceptor picks up.
 */
function navigateToChannel(guildId: string, channelId: string): boolean {
    const router = getDiscordRouter();
    if (router) {
        try {
            router.transitionTo(`/channels/${guildId}/${channelId}`);
            return true;
        } catch {
            // fall through to anchor click
        }
    }
    try {
        const a = document.createElement("a");
        a.href = `/channels/${guildId}/${channelId}`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        a.remove();
        return true;
    } catch {
        return false;
    }
}

/**
 * Push a channel id to the front of the recently-viewed MRU list. Dedupes
 * so re-opening the same channel just bumps it; trims to RECENT_CAP so
 * memory usage stays bounded.
 */
function recordRecent(channelId: string): void {
    const filtered = state.recentlyViewed.filter(id => id !== channelId);
    filtered.unshift(channelId);
    state.recentlyViewed = filtered.slice(0, RECENT_CAP);
}

function findGuildId(): string | null {
    // Trailing slash is optional: Discord usually navigates to
    // `/channels/<guildId>/<channelId>` but occasionally lands on the bare
    // guild URL (`/channels/<guildId>`, no trailing slash) before redirect.
    const match = location.pathname.match(/\/channels\/(\d+)(?:\/|$)/);
    return match ? match[1] : null;
}

// ─── Launcher button (in the channel-list header) ───────────────────────────

interface LauncherLogger {
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
}

interface LauncherHooks {
    onOpen(): void;
    /** Optional logger used for placement diagnostics. */
    logger?: LauncherLogger;
}

let launchHooks: LauncherHooks | null = null;
let placementObserver: MutationObserver | null = null;
let placementRetry: number | null = null;
let lastGuildSeen: string | null = null;
let onCloseCallback: (() => void) | null = null;
/**
 * Exposed by `placeLauncher` so the settings:changed handler (and any
 * future caller that mutates `state` directly) can ask for an immediate
 * reconcile instead of waiting up to 15s for the next interval tick.
 */
let requestReconcileFn: (() => void) | null = null;

/**
 * Last successful placement strategy. Logged once per change so the
 * console shows e.g. `placed via "nav-channels-header"` exactly when
 * Discord swaps its DOM under us (navigation, theme change, A/B test
 * rollout, …) — instead of every reconcile tick. Reset to null on
 * teardown so the first probe after a re-enable still emits its log.
 */
let lastPlacementStrategy: string | null = null;

/**
 * When Strategy D (sidebar-floating) activates we flip
 * `sidebar.style.position` to `relative` so the absolute-positioned
 * launcher anchors to the sidebar. We capture the previous inline
 * value here so teardown can restore it cleanly — important when the
 * user disables the plugin without navigating away, since otherwise
 * Discord's sidebar would keep the inline override forever.
 */
let floatingSidebarMutation: { element: HTMLElement; originalPosition: string } | null = null;

interface PlacementProbeResult {
    mount: HTMLElement;
    /** Human-readable strategy id used to label what worked. */
    strategy: string;
    /**
     * True when the launcher should render as an absolutely-positioned
     * floating button (anchored to the channel sidebar). Used when no
     * proper header element is reachable so the button still appears
     * somewhere visible instead of silently failing.
     */
    floating: boolean;
}

function isVisibleNode(node: Element | null): node is HTMLElement {
    if (!node || !(node instanceof HTMLElement)) return false;
    if (!node.isConnected) return false;
    const rect = node.getBoundingClientRect();
    // A 0×0 element either isn't laid out yet or is hidden via display:none.
    // Either way it's not a useful mount point for a visible button.
    return rect.width > 0 && rect.height > 0;
}

/**
 * Restore the sidebar inline `position` we may have flipped for
 * Strategy D, then drop the mutation memo. Called every time the probe
 * lands on a non-floating strategy so a transient floating mount
 * doesn't leave Discord's sidebar carrying a stale `position: relative`
 * override forever.
 */
function restoreFloatingMutation(): void {
    if (!floatingSidebarMutation) return;
    if (floatingSidebarMutation.element.isConnected) {
        floatingSidebarMutation.element.style.position = floatingSidebarMutation.originalPosition;
    }
    floatingSidebarMutation = null;
}

/**
 * Discord renames its CSS classes on every build, but the sidebar
 * structure stays remarkably stable: a `nav` labelled "Channels" wraps
 * an inner `header` element that holds the guild name + dropdown. We
 * try a handful of independent strategies in order of preference so a
 * single rename can't take the launcher offline.
 */
function probeChannelListMount(): PlacementProbeResult | null {
    // Strategy A — the canonical channel-list nav.
    //   Discord exposes its sidebar list as either `nav[aria-label="Channels"]`
    //   (modern client) or `nav[aria-label*="channel" i]` (older builds,
    //   localized strings). The first child that's an actual `header` is
    //   where the guild name lives; that's where the launcher belongs.
    const channelNavs = document.querySelectorAll<HTMLElement>(
        'nav[aria-label="Channels"], nav[aria-label*="channel" i], nav[aria-label*="القنوات"]',
    );
    for (const nav of channelNavs) {
        const header = nav.querySelector<HTMLElement>("header");
        if (isVisibleNode(header)) {
            restoreFloatingMutation();
            return { mount: header, strategy: "nav-channels-header", floating: false };
        }
    }

    // Strategy B — anchored on the guild header element directly. Discord
    // tags this with `class*="container_"` + `class*="header_"` on most
    // builds. Match the `header` tag explicitly to avoid catching unrelated
    // container divs.
    const taggedHeader = document.querySelector<HTMLElement>(
        'header[class*="container_"][class*="header_"]',
    );
    if (isVisibleNode(taggedHeader)) {
        restoreFloatingMutation();
        return { mount: taggedHeader, strategy: "tagged-header", floating: false };
    }

    // Strategy C — sidebar wrapper that holds the channel list. Discord
    // labels the column with `class*="sidebar_"` (and historically
    // `class*="channels_"`). Mount inside whatever first `header` it
    // contains; if no header exists we still resolve the sidebar itself
    // as a floating-mode anchor below.
    const sidebar = document.querySelector<HTMLElement>(
        '[class*="sidebar_"], [class*="sidebarList_"], [class*="channelList_"], [class*="channels_"]',
    );
    if (sidebar) {
        const innerHeader = sidebar.querySelector<HTMLElement>("header, [class*=\"header_\"]");
        if (isVisibleNode(innerHeader)) {
            restoreFloatingMutation();
            return { mount: innerHeader, strategy: "sidebar-inner-header", floating: false };
        }
        // Strategy D — floating button anchored to the sidebar so the
        // user always sees the launcher even when the header probe
        // fails. position: relative is asserted on the sidebar so the
        // absolute-positioned child anchors correctly.
        if (isVisibleNode(sidebar)) {
            // Force a positioning context. Capture the previous inline
            // value so teardown can restore it; this also avoids
            // re-overwriting it across reconcile ticks once we've
            // already established the anchor.
            //
            // We read the *computed* position (not just the inline
            // `style.position`) so a stylesheet-driven `sticky` /
            // `absolute` on Discord's sidebar isn't trampled. Reading
            // computed style flushes layout, but Strategy D is the
            // rarely-used fallback (Strategies A/B/C cover the common
            // case), so the reflow cost is paid at most once per probe
            // and only when we're already in a degraded DOM state.
            const computedPosition = getComputedStyle(sidebar).position;
            if (computedPosition === "" || computedPosition === "static") {
                if (!floatingSidebarMutation || floatingSidebarMutation.element !== sidebar) {
                    floatingSidebarMutation = {
                        element: sidebar,
                        originalPosition: sidebar.style.position,
                    };
                }
                sidebar.style.position = "relative";
            }
            return { mount: sidebar, strategy: "sidebar-floating", floating: true };
        }
    }

    return null;
}

function buildLauncher(count: number, floating: boolean): HTMLElement {
    const btn = el("button", "boon-shc-launch");
    btn.id = LAUNCH_ID;
    btn.type = "button";
    btn.setAttribute("dir", "rtl");
    btn.setAttribute("aria-label", "عرض القنوات المخفية");
    btn.setAttribute("data-count", String(count));
    if (floating) btn.classList.add("boon-shc-launch--floating");
    btn.title = `القنوات المخفية (${count})`;

    btn.appendChild(el("span", "boon-shc-launch-icon", "🔒"));
    btn.appendChild(el("span", undefined, "خفي"));
    btn.appendChild(el("span", "boon-shc-launch-count", String(count)));

    btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        launchHooks?.onOpen();
    });
    return btn;
}

function updateLauncher(count: number): void {
    const existing = document.getElementById(LAUNCH_ID);
    const guildId = findGuildId();
    const logger = launchHooks?.logger;

    if (!guildId) {
        existing?.remove();
        return;
    }

    // Always render the launcher when we're inside a guild — even when
    // `count === 0`. A visible-but-dimmed button (the CSS opacity rule
    // for `data-count="0"`) is *much* better UX than a silent no-op:
    // users immediately see the plugin is alive, and they can still
    // open the panel to confirm "no hidden channels here" rather than
    // wondering whether the feature is broken.

    // If the existing launcher is in *floating* mode, treat it as a
    // provisional placement and re-probe every reconcile. Strategy D
    // is a fallback used when Discord hasn't finished rendering the
    // channel-list header yet; the moment a proper header becomes
    // reachable we want to graduate the launcher to its preferred
    // mount instead of leaving it stuck against the sidebar forever.
    // (Non-floating launchers, by contrast, are stable and only need
    // their count/title updated — the MutationObserver in
    // `placeLauncher` handles re-mounting after Discord subtree
    // swaps via the `!getElementById(LAUNCH_ID)` branch.)
    const existingFloating = existing?.classList.contains("boon-shc-launch--floating") ?? false;

    if (existing && !existingFloating) {
        existing.setAttribute("data-count", String(count));
        existing.title = `القنوات المخفية (${count})`;
        const countEl = existing.querySelector<HTMLElement>(".boon-shc-launch-count");
        if (countEl) countEl.textContent = String(count);
        return;
    }

    const probe = probeChannelListMount();
    // Floating-button graduation: keep the existing floating launcher
    // in place when the probe still resolves to floating (no header
    // available yet) or fails entirely (transient DOM rebuild) — yanking
    // it on every reconcile while we wait for Discord would cause a
    // visible flicker. Only swap it out once a non-floating strategy
    // becomes reachable, at which point `restoreFloatingMutation()` has
    // already been called inside the probe.
    if (existing && existingFloating) {
        if (!probe || probe.floating) {
            existing.setAttribute("data-count", String(count));
            existing.title = `القنوات المخفية (${count})`;
            const countEl = existing.querySelector<HTMLElement>(".boon-shc-launch-count");
            if (countEl) countEl.textContent = String(count);
            return;
        }
        // A header strategy won — drop the floating button and fall
        // through to the creation path so the next block mounts a
        // fresh, non-floating launcher inside the real header.
        existing.remove();
    }
    if (!probe) {
        if (lastPlacementStrategy !== "none") {
            lastPlacementStrategy = "none";
            logger?.warn("launcher placement failed — no channel-list mount found yet");
        }
        return;
    }

    const btn = buildLauncher(count, probe.floating);
    probe.mount.appendChild(btn);

    if (lastPlacementStrategy !== probe.strategy) {
        lastPlacementStrategy = probe.strategy;
        logger?.info(`launcher placed via "${probe.strategy}" (count=${count}, floating=${probe.floating})`);
    }
}

export function placeLauncher(hooks: LauncherHooks): () => void {
    launchHooks = hooks;
    // `disposed` guards against pending rAF callbacks (queued by
    // scheduleReconcile or the MutationObserver) that would otherwise fire
    // *after* teardown has emptied the closure state — re-appending the
    // launcher as an orphan whose click handler is a no-op.
    let disposed = false;

    /**
     * Compute the badge count the user actually expects to see in the panel.
     * `state.hidden.length` ignores `hideNsfw`, so the launcher would say
     * "🔒 خفي (10)" while the panel header / tabs read "8". Keep the
     * launcher in lockstep with the rest of the UI.
     */
    const launcherCountFor = (result: DiscoveryResult): number =>
        state.nsfwFiltered
            ? result.hidden.reduce((n, c) => (c.nsfw ? n : n + 1), 0)
            : result.hidden.length;

    const reconcile = (): void => {
        if (disposed) return;
        const guildId = findGuildId();
        if (guildId !== lastGuildSeen) {
            lastGuildSeen = guildId;
            state.guildId = guildId;
            state.drilldownId = null;
            // Reset the search box too: a query meaningful for guild A
            // (e.g. "general") would otherwise silently filter guild B's
            // hidden channels and could falsely look like "empty".
            state.query = "";
        }
        if (!guildId) {
            document.getElementById(LAUNCH_ID)?.remove();
            // If the panel is still open when we transition off a guild
            // (e.g. the user navigated to DMs while browsing hidden
            // channels), close it instead of leaving the modal sitting
            // on stale data from the previous guild.
            if (document.getElementById(BACKDROP_ID)) closePanel();
            return;
        }
        const result = scanGuild(guildId);
        state.result = result;
        updateLauncher(launcherCountFor(result));

        const backdrop = document.getElementById(BACKDROP_ID);
        if (backdrop) renderPanel();
    };

    // rAF-coalesce reconciles so a burst of mutations triggers at most one
    // scan per frame. Matches the pattern enforced by CONTRIBUTING.md
    // (§ الأداء — "لا تستخدم MutationObserver على document.body بدون debounce")
    // and used by contextMenu / callTimer / platformIndicators / autoTranslate.
    let reconcileScheduled = false;
    const scheduleReconcile = (): void => {
        if (reconcileScheduled || disposed) return;
        reconcileScheduled = true;
        requestAnimationFrame(() => {
            reconcileScheduled = false;
            if (disposed) return;
            reconcile();
        });
    };

    // Publish the scheduler so callers outside this closure (e.g. the
    // settings:changed handler that flips `state.nsfwFiltered`) can ask
    // for an immediate badge refresh instead of waiting up to 15s for
    // the next interval tick.
    requestReconcileFn = scheduleReconcile;

    reconcile();
    // 15s cadence is enough to catch role/permission changes pushed through
    // gateway events without re-walking every webpack module four times a
    // minute. The mutation observer below still picks up DOM swaps caused by
    // navigation in between ticks.
    placementRetry = window.setInterval(scheduleReconcile, 15000);

    placementObserver = new MutationObserver(() => {
        if (disposed) return;
        if (!document.getElementById(LAUNCH_ID)) scheduleReconcile();
    });
    placementObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
        disposed = true;
        if (placementRetry !== null) {
            window.clearInterval(placementRetry);
            placementRetry = null;
        }
        placementObserver?.disconnect();
        placementObserver = null;
        document.getElementById(LAUNCH_ID)?.remove();
        launchHooks = null;
        requestReconcileFn = null;
        // Drop the module-level guild memo so a re-enable on the same guild
        // re-initializes `state.query` / `state.drilldownId` from scratch.
        lastGuildSeen = null;
        // Reset the strategy memo so the *next* successful probe still
        // emits its diagnostic log — without this, a disable→re-enable
        // cycle that happens to land on the same strategy would be
        // invisible in DevTools.
        lastPlacementStrategy = null;
        // Restore the inline `position` we may have flipped on Discord's
        // sidebar for floating mode. If the user disables the plugin
        // without navigating, this leaves Discord's DOM in the exact
        // state we found it in.
        restoreFloatingMutation();
    };
}

/**
 * Ask the active launcher to reconcile on the next animation frame.
 * No-op when the launcher isn't running (settings show launcher disabled,
 * or plugin not started). Used by `index.ts` after settings flips that
 * affect what's rendered — currently only `hideNsfw`, since `defaultFilter`
 * / `defaultSort` only change panel state that the user actively sees.
 */
export function requestReconcile(): void {
    requestReconcileFn?.();
}

// ─── Modal ──────────────────────────────────────────────────────────────────

function applyFiltersAndSort(channels: ReadonlyArray<DiscoveredChannel>): DiscoveredChannel[] {
    const q = state.query.trim().toLowerCase();
    let list = channels.slice();

    if (state.filter !== "all") {
        list = list.filter(c => c.kind === state.filter);
    }
    if (state.nsfwFiltered) {
        list = list.filter(c => !c.nsfw);
    }
    if (q) {
        list = list.filter(c => {
            const inName = c.name.toLowerCase().includes(q);
            const inTopic = (c.topic ?? "").toLowerCase().includes(q);
            const inParent = (c.parentName ?? "").toLowerCase().includes(q);
            return inName || inTopic || inParent;
        });
    }

    switch (state.sort) {
        case "name":
            list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
            break;
        case "activity":
            list.sort((a, b) => (b.lastActivityMs ?? 0) - (a.lastActivityMs ?? 0));
            break;
        case "position":
        default:
            list.sort((a, b) => a.position - b.position);
            break;
    }

    return list;
}

function groupByCategory(channels: DiscoveredChannel[]): Array<{ name: string; items: DiscoveredChannel[] }> {
    const groups = new Map<string, { name: string; items: DiscoveredChannel[] }>();
    const NO_PARENT = "__no_parent__";

    for (const c of channels) {
        const key = c.parentId ?? NO_PARENT;
        const label = c.parentName ?? "بدون فئة";
        let bucket = groups.get(key);
        if (!bucket) {
            bucket = { name: label, items: [] };
            groups.set(key, bucket);
        }
        bucket.items.push(c);
    }

    const ordered = Array.from(groups.values());
    ordered.sort((a, b) => {
        if (a.name === "بدون فئة") return -1;
        if (b.name === "بدون فئة") return 1;
        return a.name.localeCompare(b.name, "ar");
    });
    return ordered;
}

// ─── Visual: brand padlock illustration ─────────────────────────────────────

/**
 * Custom-designed padlock illustration used as the hero artwork in the
 * details view and as a friendly element in the empty state. The "eye"
 * shape inside the keyhole is a signature touch that hints at the
 * plugin's purpose: not just locking, but seeing what's locked.
 *
 * The markup is a fixed string literal with zero user input — safe to
 * funnel through a `<template>` element rather than building 20 lines
 * of `createElementNS` calls. We never accept user content into this
 * path.
 */
const LOCK_SVG = `
<svg viewBox="0 0 120 140" width="76" height="88" xmlns="http://www.w3.org/2000/svg" class="boon-shc-lock-svg" aria-hidden="true">
  <defs>
    <linearGradient id="boon-shc-lock-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#5865f2"/>
    </linearGradient>
    <linearGradient id="boon-shc-lock-shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.45)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <path d="M32 60 V40 a28 28 0 0 1 56 0 V60" fill="none" stroke="url(#boon-shc-lock-grad)" stroke-width="10" stroke-linecap="round"/>
  <rect x="15" y="58" width="90" height="78" rx="16" fill="url(#boon-shc-lock-grad)"/>
  <rect x="18" y="60" width="84" height="38" rx="12" fill="url(#boon-shc-lock-shine)"/>
  <circle cx="60" cy="94" r="13" fill="#1a1b1f"/>
  <ellipse cx="60" cy="94" rx="6" ry="9" fill="#ffffff"/>
  <circle cx="60" cy="94" r="3.5" fill="#1a1b1f"/>
  <circle cx="62" cy="91.5" r="1.4" fill="#ffffff"/>
  <rect x="56" y="108" width="8" height="14" rx="3" fill="#1a1b1f"/>
</svg>`.trim();

function buildLockNode(): Node {
    const template = document.createElement("template");
    template.innerHTML = LOCK_SVG;
    return template.content.firstChild!.cloneNode(true);
}

// ─── List view ──────────────────────────────────────────────────────────────

function renderChannelRow(channel: DiscoveredChannel, guildId: string): HTMLElement {
    const card = el("div", "boon-shc-card");
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    card.setAttribute("data-channel-id", channel.id);

    const head = el("div", "boon-shc-card-head");
    head.appendChild(el("span", "boon-shc-card-icon", iconFor(channel.kind)));

    const nameWrap = el("div", "boon-shc-card-name-wrap");
    nameWrap.appendChild(el("span", "boon-shc-card-name", channel.name));
    if (channel.parentName) {
        nameWrap.appendChild(el("span", "boon-shc-card-parent", `في ${channel.parentName}`));
    }
    head.appendChild(nameWrap);

    const tags = el("div", "boon-shc-card-tags");
    tags.appendChild(el("span", "boon-shc-tag boon-shc-tag--kind", labelForKind(channel.kind)));
    if (channel.nsfw) tags.appendChild(el("span", "boon-shc-tag boon-shc-tag--nsfw", "NSFW"));
    if (channel.rateLimitPerUser > 0) {
        tags.appendChild(el(
            "span",
            "boon-shc-tag boon-shc-tag--slow",
            `بطيء ${formatSlowmode(channel.rateLimitPerUser)}`,
        ));
    }
    head.appendChild(tags);
    card.appendChild(head);

    const meta = el("div", "boon-shc-card-meta");
    if (channel.lastActivityMs) {
        const time = el("span", "boon-shc-card-time", `آخر نشاط ${formatTimeAgo(channel.lastActivityMs)}`);
        time.title = formatAbsoluteDate(channel.lastActivityMs);
        meta.appendChild(time);
    }
    const access = accessSummary(channel);
    if (access.roles > 0 || access.members > 0) {
        const parts: string[] = [];
        if (access.roles > 0) parts.push(`${access.roles} دور`);
        if (access.members > 0) parts.push(`${access.members} عضو`);
        meta.appendChild(el("span", "boon-shc-card-access", `${parts.join(" + ")} لهم صلاحية`));
    }
    if (meta.children.length > 0) card.appendChild(meta);

    // Surface up to N role pills inline so the card communicates "who can
    // see this" at a glance. Capping is important: a server-wide
    // moderator role + 6 specialised access roles would otherwise wrap
    // the card to three lines.
    const allowedRoles = channel.overwrites.filter(o => o.grantsView && o.kind === "role");
    if (allowedRoles.length > 0) {
        const pillRow = el("div", "boon-shc-card-pills");
        const VISIBLE = 4;
        for (const ow of allowedRoles.slice(0, VISIBLE)) {
            const pill = pillForOverwrite(guildId, ow);
            if (pill) {
                pill.classList.add("boon-shc-pill--compact");
                pillRow.appendChild(pill);
            }
        }
        const more = allowedRoles.length - VISIBLE;
        if (more > 0) {
            pillRow.appendChild(el(
                "span",
                "boon-shc-pill boon-shc-pill--more boon-shc-pill--compact",
                `+${more}`,
            ));
        }
        card.appendChild(pillRow);
    }

    const open = (): void => {
        recordRecent(channel.id);
        state.drilldownId = channel.id;
        renderPanel();
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
        }
    });
    return card;
}

function renderEmpty(reason: string): HTMLElement {
    const wrap = el("div", "boon-shc-empty");
    const art = el("div", "boon-shc-empty-art");
    art.appendChild(buildLockNode());
    wrap.appendChild(art);
    wrap.appendChild(el("div", "boon-shc-empty-text", reason));
    return wrap;
}

// Type chips deliberately use the narrower `FilterKind` (sans "all") so
// that clicking a chip can directly drive `state.filter` without an
// unsafe cast. `DiscoveredChannel["kind"]` includes "other" which the
// filter UI doesn't surface — channels with unknown kinds only appear
// under the "all" tab.
type FilterableKind = Exclude<FilterKind, "all">;

interface TypeChipDef {
    readonly kind: FilterableKind;
    readonly label: string;
    readonly icon: string;
}

const TYPE_CHIPS: ReadonlyArray<TypeChipDef> = [
    { kind: "text",         label: "نصية",    icon: "#"   },
    { kind: "voice",        label: "صوتية",   icon: "🔊"  },
    { kind: "stage",        label: "مسرح",    icon: "🎙️" },
    { kind: "forum",        label: "منتدى",   icon: "💬"  },
    { kind: "announcement", label: "إعلانات", icon: "📣"  },
    { kind: "media",        label: "ميديا",   icon: "🖼️" },
    { kind: "category",     label: "فئات",    icon: "📁"  },
];

function renderServerOverview(result: DiscoveryResult): HTMLElement {
    const base = state.nsfwFiltered ? result.hidden.filter(c => !c.nsfw) : result.hidden;
    const chips = el("div", "boon-shc-overview-chips");

    for (const def of TYPE_CHIPS) {
        const count = base.filter(c => c.kind === def.kind).length;
        if (count === 0) continue;
        const chip = el("button", "boon-shc-chip");
        chip.type = "button";
        chip.appendChild(el("span", "boon-shc-chip-icon", def.icon));
        chip.appendChild(el("span", "boon-shc-chip-label", def.label));
        chip.appendChild(el("span", "boon-shc-chip-count", String(count)));
        if (state.filter === def.kind) chip.setAttribute("data-active", "true");
        chip.title = `صفِّ حسب: ${def.label}`;
        chip.addEventListener("click", () => {
            state.filter = state.filter === def.kind ? "all" : def.kind;
            renderPanel();
        });
        chips.appendChild(chip);
    }

    if (chips.children.length === 0) return el("div", "boon-shc-overview boon-shc-overview--empty");

    const wrap = el("div", "boon-shc-overview");
    wrap.appendChild(chips);
    return wrap;
}

function renderRecentlyViewed(result: DiscoveryResult): HTMLElement | null {
    if (state.recentlyViewed.length === 0) return null;
    // Filter out ids that no longer correspond to a hidden channel (e.g.
    // the user's permissions changed since they last drilled in, or
    // they navigated to a different guild). The MRU memory is keyed
    // by id, not by guild, so a stale id won't crash anything — it just
    // wouldn't render — but cleaning the list keeps the strip tidy.
    //
    // We also honour `state.nsfwFiltered` here so that the "إخفاء قنوات
    // +18" setting holds across every list-view rendering path, including
    // this MRU strip. Otherwise a user that drilled into an NSFW channel
    // before flipping the filter on would still see its name leak into
    // the chrome of their next panel open.
    const items: DiscoveredChannel[] = [];
    for (const id of state.recentlyViewed) {
        const c = result.hidden.find(h => h.id === id);
        if (!c) continue;
        if (state.nsfwFiltered && c.nsfw) continue;
        items.push(c);
    }
    if (items.length === 0) return null;

    const wrap = el("div", "boon-shc-recents");
    const title = el("div", "boon-shc-recents-title");
    title.appendChild(el("span", "boon-shc-recents-title-icon", "🕘"));
    title.appendChild(document.createTextNode("شوهد مؤخراً"));
    wrap.appendChild(title);

    const strip = el("div", "boon-shc-recents-strip");
    for (const c of items) {
        const chip = el("button", "boon-shc-recent");
        chip.type = "button";
        chip.appendChild(el("span", "boon-shc-recent-icon", iconFor(c.kind)));
        chip.appendChild(el("span", "boon-shc-recent-name", c.name));
        chip.addEventListener("click", () => {
            recordRecent(c.id);
            state.drilldownId = c.id;
            renderPanel();
        });
        strip.appendChild(chip);
    }
    wrap.appendChild(strip);
    return wrap;
}

/**
 * Visible banner when a discovery scan came back degraded (a webpack store
 * couldn't be resolved, or the guild simply has no enumerable channels). We
 * give the user a "Retry" button that re-runs `scanGuild` against the same
 * guild id so they can recover without closing the panel — useful when the
 * scan ran before Discord had finished hydrating its stores.
 */
function renderDegradedBanner(result: DiscoveryResult): HTMLElement {
    const banner = el("div", "boon-shc-degraded");
    banner.appendChild(el(
        "div",
        "boon-shc-degraded-text",
        result.degradedReason ?? "وضع محدود — تعذّر قراءة بيانات السيرفر.",
    ));
    const retry = el("button", "boon-shc-degraded-retry", "إعادة المحاولة") as HTMLButtonElement;
    retry.type = "button";
    retry.addEventListener("click", () => {
        if (!state.guildId) return;
        state.result = scanGuild(state.guildId);
        renderPanel();
        // The launcher badge reads its count from a separate reconcile pass
        // (interval + MutationObserver), so without prodding it here a
        // successful retry can leave the launcher showing the stale "0"
        // count for up to 15 seconds. Ask the launcher to recount now.
        requestReconcile();
    });
    banner.appendChild(retry);
    return banner;
}

function renderListBody(result: DiscoveryResult): HTMLElement {
    const body = el("div", "boon-shc-body");

    if (result.degraded) {
        body.appendChild(renderDegradedBanner(result));
    }

    const overview = renderServerOverview(result);
    if (overview.children.length > 0) body.appendChild(overview);

    const recents = renderRecentlyViewed(result);
    if (recents) body.appendChild(recents);

    const filtered = applyFiltersAndSort(result.hidden);
    if (filtered.length === 0) {
        body.appendChild(renderEmpty(
            result.hidden.length === 0
                ? "ما فيه قنوات مخفية في هذا السيرفر — أنت تشوف كل شي."
                : "ما فيه نتائج توافق البحث الحالي.",
        ));
        return body;
    }

    if (state.groupingMode === "flat") {
        const list = el("div", "boon-shc-list");
        for (const c of filtered) list.appendChild(renderChannelRow(c, result.guildId));
        body.appendChild(list);
    } else {
        for (const group of groupByCategory(filtered)) {
            body.appendChild(el(
                "div",
                "boon-shc-category-header",
                `${group.name} (${group.items.length})`,
            ));
            const list = el("div", "boon-shc-list");
            for (const c of group.items) list.appendChild(renderChannelRow(c, result.guildId));
            body.appendChild(list);
        }
    }
    return body;
}

// ─── Details view ───────────────────────────────────────────────────────────

function pillForOverwrite(guildId: string, ow: DiscoveredOverwrite): HTMLElement | null {
    // Bail early on overwrites that don't touch VIEW_CHANNEL — a channel
    // can have dozens of overwrites that only mutate SEND_MESSAGES /
    // ATTACH_FILES / etc, and there's no point resolving role/member
    // labels for entries we're about to discard.
    if (!ow.grantsView && !ow.deniesView) return null;

    let label = ow.id;
    let color: string | null = null;

    if (ow.kind === "role") {
        const role = lookupRole(guildId, ow.id);
        if (role) {
            label = role.name === "@everyone" ? "@everyone" : `@${role.name}`;
            color = roleColorHex(role);
        } else {
            label = `@role(${ow.id.slice(-4)})`;
        }
    } else {
        const ms = getGuildMemberStore();
        const us = getUserStore();
        const member = ms?.getMember(guildId, ow.id);
        const user = us?.getUser(ow.id);
        if (member?.nick) label = `@${member.nick}`;
        else if (user) label = `@${user.globalName ?? user.username}`;
        else label = `@user(${ow.id.slice(-4)})`;
        // Members inherit the colour of their highest hoisted role; Discord
        // pre-computes this and exposes it on the member record as
        // `colorString`. We re-use it so a pill for `@admin-bob` paints
        // in the admin role's red just like Discord's chat scroller.
        if (member?.colorString) color = member.colorString;
    }

    const pill = el("span", "boon-shc-pill");
    pill.setAttribute("data-kind", ow.grantsView ? "allow" : "deny");
    pill.setAttribute("data-owner", ow.kind);

    const dot = el("span", "boon-shc-pill-dot");
    if (color) {
        dot.style.background = color;
        pill.style.borderColor = color;
        pill.style.color = readableForeground(color);
        // 33 = 20% alpha in hex. Lets the role colour bleed through as
        // a tint without overwhelming the modal's dark surface.
        pill.style.background = `${color}33`;
    }
    pill.appendChild(dot);
    pill.appendChild(document.createTextNode(label));

    pill.title = ow.grantsView
        ? "يمنح صلاحية رؤية القناة"
        : "يمنع رؤية القناة";

    return pill;
}

function copyButton(text: string, ctxToast: (msg: string) => void): HTMLElement {
    const btn = el("button", "boon-shc-copy");
    btn.type = "button";
    btn.appendChild(el("span", "boon-shc-copy-icon", "⎘"));
    btn.appendChild(el("span", undefined, "نسخ"));
    btn.addEventListener("click", () => {
        navigator.clipboard.writeText(text).then(
            () => ctxToast("تم النسخ"),
            () => ctxToast("فشل النسخ"),
        );
    });
    return btn;
}

function infoCell(label: string, value: string, titleAttr?: string): HTMLElement {
    const cell = el("div", "boon-shc-info-cell");
    cell.appendChild(el("div", "boon-shc-info-label", label));
    const v = el("div", "boon-shc-info-value", value);
    if (titleAttr) v.title = titleAttr;
    cell.appendChild(v);
    return cell;
}

function renderAccessPane(
    guildId: string,
    items: ReadonlyArray<DiscoveredOverwrite>,
    kind: "allow" | "deny",
): HTMLElement {
    const pane = el("div", `boon-shc-pane boon-shc-pane--${kind}`);
    const title = el("div", "boon-shc-pane-title");
    title.appendChild(el(
        "span",
        `boon-shc-pane-icon boon-shc-pane-icon--${kind}`,
        kind === "allow" ? "✓" : "✕",
    ));
    title.appendChild(document.createTextNode(
        kind === "allow" ? "مسموح لهم بالمشاهدة" : "ممنوعون من المشاهدة",
    ));
    title.appendChild(el("span", "boon-shc-pane-count", String(items.length)));
    pane.appendChild(title);

    const list = el("div", "boon-shc-pill-row");
    for (const ow of items) {
        const pill = pillForOverwrite(guildId, ow);
        if (pill) list.appendChild(pill);
    }
    pane.appendChild(list);
    return pane;
}

function renderCopyRow(label: string, text: string, ctxToast: (msg: string) => void): HTMLElement {
    const row = el("div", "boon-shc-copy-row");
    row.appendChild(el("div", "boon-shc-copy-row-label", label));
    const body = el("div", "boon-shc-copy-row-body");
    body.appendChild(el("div", "boon-shc-copy-row-value", text));
    body.appendChild(copyButton(text, ctxToast));
    row.appendChild(body);
    return row;
}

function renderDetailsHero(
    result: DiscoveryResult,
    channel: DiscoveredChannel,
): HTMLElement {
    const hero = el("div", "boon-shc-hero");

    const art = el("div", "boon-shc-hero-art");
    art.appendChild(buildLockNode());
    hero.appendChild(art);

    const meat = el("div", "boon-shc-hero-meat");

    const nameRow = el("div", "boon-shc-hero-name-row");
    nameRow.appendChild(el("span", "boon-shc-hero-icon", iconFor(channel.kind)));
    nameRow.appendChild(el("span", "boon-shc-hero-name", channel.name));
    if (channel.nsfw) nameRow.appendChild(el("span", "boon-shc-tag boon-shc-tag--nsfw", "NSFW"));
    meat.appendChild(nameRow);

    const sub = el("div", "boon-shc-hero-sub");
    const access = accessSummary(channel);
    const parts: string[] = [];
    if (access.roles > 0) parts.push(`${access.roles} دور`);
    if (access.members > 0) parts.push(`${access.members} عضو`);
    sub.appendChild(document.createTextNode(
        parts.length > 0
            ? `${parts.join(" + ")} لهم صلاحية الرؤية`
            : "ما فيه أحد محدد بصلاحية رؤية صريحة على القناة",
    ));
    meat.appendChild(sub);

    if (channel.lastActivityMs) {
        const time = el("div", "boon-shc-hero-time");
        time.appendChild(document.createTextNode("آخر نشاط "));
        time.appendChild(el("strong", undefined, formatTimeAgo(channel.lastActivityMs)));
        time.appendChild(document.createTextNode(` · ${formatAbsoluteDate(channel.lastActivityMs)}`));
        meat.appendChild(time);
    }

    const actions = el("div", "boon-shc-hero-actions");
    const jump = el("button", "boon-shc-btn boon-shc-btn--primary");
    jump.type = "button";
    jump.title = "افتح القناة في واجهة Discord الأصلية";
    jump.appendChild(el("span", "boon-shc-btn-icon", "➤"));
    jump.appendChild(el("span", undefined, "اذهب إلى القناة"));
    jump.addEventListener("click", () => {
        const ok = navigateToChannel(result.guildId, channel.id);
        if (ok) closePanel();
    });
    actions.appendChild(jump);
    meat.appendChild(actions);

    hero.appendChild(meat);
    return hero;
}

function renderDetailsBody(
    result: DiscoveryResult,
    channelId: string,
    ctxToast: (msg: string) => void,
): HTMLElement {
    const body = el("div", "boon-shc-body boon-shc-body--details");
    const channel = result.hidden.find(c => c.id === channelId);
    if (!channel) {
        body.appendChild(renderEmpty("القناة لم تعد متاحة. ربما الصلاحيات تغيّرت."));
        return body;
    }

    const wrap = el("div", "boon-shc-details");
    wrap.appendChild(renderDetailsHero(result, channel));

    const info = el("div", "boon-shc-info-grid");
    info.appendChild(infoCell("النوع", labelForKind(channel.kind)));
    if (channel.parentName) info.appendChild(infoCell("الفئة", channel.parentName));
    info.appendChild(infoCell("الموضع", `#${channel.position}`));
    if (channel.lastActivityMs) {
        info.appendChild(infoCell(
            "آخر نشاط",
            formatTimeAgo(channel.lastActivityMs),
            formatAbsoluteDate(channel.lastActivityMs),
        ));
    }
    if (channel.rateLimitPerUser > 0) {
        info.appendChild(infoCell("الوضع البطيء", formatSlowmode(channel.rateLimitPerUser)));
    }
    if (channel.kind === "voice" || channel.kind === "stage") {
        if (channel.bitrate != null) {
            info.appendChild(infoCell("Bitrate", `${Math.round(channel.bitrate / 1000)} kbps`));
        }
        if (channel.userLimit != null && channel.userLimit > 0) {
            info.appendChild(infoCell("الحد الأقصى", String(channel.userLimit)));
        }
        if (channel.rtcRegion) info.appendChild(infoCell("المنطقة", channel.rtcRegion));
    }
    wrap.appendChild(info);

    if (channel.topic) {
        const topicCard = el("div", "boon-shc-pane");
        const t = el("div", "boon-shc-pane-title");
        t.appendChild(el("span", "boon-shc-pane-icon", "📌"));
        t.appendChild(document.createTextNode("الموضوع"));
        topicCard.appendChild(t);
        topicCard.appendChild(el("div", "boon-shc-pane-body", channel.topic));
        wrap.appendChild(topicCard);
    }

    const allowedItems = channel.overwrites.filter(ow => ow.grantsView);
    const deniedItems = channel.overwrites.filter(ow => ow.deniesView);

    if (allowedItems.length === 0 && deniedItems.length === 0) {
        const pane = el("div", "boon-shc-pane");
        const t = el("div", "boon-shc-pane-title");
        t.appendChild(el("span", "boon-shc-pane-icon", "🔐"));
        t.appendChild(document.createTextNode("الصلاحيات"));
        pane.appendChild(t);
        pane.appendChild(el(
            "div",
            "boon-shc-pane-body",
            "لا توجد تعديلات صلاحية صريحة على القناة (تعتمد على إعدادات السيرفر العامة).",
        ));
        wrap.appendChild(pane);
    } else {
        const grid = el("div", "boon-shc-access-grid");
        if (allowedItems.length > 0) {
            grid.appendChild(renderAccessPane(result.guildId, allowedItems, "allow"));
        }
        if (deniedItems.length > 0) {
            grid.appendChild(renderAccessPane(result.guildId, deniedItems, "deny"));
        }
        wrap.appendChild(grid);
    }

    const idsCard = el("div", "boon-shc-pane");
    const idsTitle = el("div", "boon-shc-pane-title");
    idsTitle.appendChild(el("span", "boon-shc-pane-icon", "🔗"));
    idsTitle.appendChild(document.createTextNode("الروابط والمعرّفات"));
    idsCard.appendChild(idsTitle);
    const idsBody = el("div", "boon-shc-pane-body");
    idsBody.appendChild(renderCopyRow("معرّف القناة", channel.id, ctxToast));
    idsBody.appendChild(renderCopyRow(
        "الرابط",
        `https://discord.com/channels/${result.guildId}/${channel.id}`,
        ctxToast,
    ));
    idsCard.appendChild(idsBody);
    wrap.appendChild(idsCard);

    body.appendChild(wrap);
    return body;
}

// ─── Top-level render ───────────────────────────────────────────────────────

let toastFn: (msg: string) => void = () => { /* set on open */ };

function renderHeader(result: DiscoveryResult, drilldown: DiscoveredChannel | null): HTMLElement {
    const header = el("div", "boon-shc-header");

    if (drilldown) {
        const back = el("button", "boon-shc-back", "→ رجوع");
        back.type = "button";
        back.addEventListener("click", () => {
            state.drilldownId = null;
            renderPanel();
        });
        header.appendChild(back);
    }

    const titleWrap = el("div");
    (titleWrap as HTMLElement).style.flex = "1";
    const title = el("h2", undefined, drilldown ? drilldown.name : "القنوات المخفية");
    titleWrap.appendChild(title);
    // Header / tab counts respect the NSFW preference so that the badge
    // never claims more channels than the user will actually see in the
    // list. Search query is deliberately ignored here — like Gmail tabs,
    // search narrows _within_ a tab rather than re-labelling it.
    const visibleHidden = state.nsfwFiltered
        ? result.hidden.filter(c => !c.nsfw)
        : result.hidden;
    const sub = el("div", "boon-shc-subtitle", drilldown
        ? `في ${result.guildName}`
        : `${visibleHidden.length} قناة من أصل ${result.totalCount} في ${result.guildName}`);
    titleWrap.appendChild(sub);
    header.appendChild(titleWrap);

    const close = el("button", "boon-shc-close", "✕");
    close.type = "button";
    close.setAttribute("aria-label", "إغلاق");
    close.addEventListener("click", () => closePanel());
    header.appendChild(close);
    return header;
}

function renderToolbar(): HTMLElement {
    const toolbar = el("div", "boon-shc-toolbar");

    const searchWrap = el("div", "boon-shc-search-wrap");
    searchWrap.appendChild(el("span", "boon-shc-search-icon", "\u{1F50D}"));
    const search = el("input", "boon-shc-search");
    search.type = "search";
    search.placeholder = "ابحث بالاسم، الموضوع، أو الفئة…";
    search.value = state.query;
    search.setAttribute("dir", "auto");
    search.setAttribute("aria-label", "البحث");
    search.addEventListener("input", () => {
        state.query = search.value;
        renderPanel({ preserveFocus: "search" });
    });
    searchWrap.appendChild(search);
    // Subtle keyboard-shortcut hint baked into the search well. Mirrors
    // GitHub / Notion / VSCode — if the user knows the convention they
    // can type `/` to focus search from anywhere in the panel; if they
    // don't, the badge silently disappears the moment they start typing.
    searchWrap.appendChild(el("kbd", "boon-shc-search-kbd", "/"));
    toolbar.appendChild(searchWrap);

    const sort = el("select", "boon-shc-sort");
    sort.setAttribute("aria-label", "الترتيب");
    const sorts: SortKey[] = ["position", "name", "activity"];
    for (const k of sorts) {
        const opt = el("option", undefined, labelForSort(k));
        opt.value = k;
        if (state.sort === k) opt.selected = true;
        sort.appendChild(opt);
    }
    sort.addEventListener("change", () => {
        state.sort = sort.value as SortKey;
        renderPanel();
    });
    toolbar.appendChild(sort);

    const groupBtn = el("button", "boon-shc-icon-btn");
    groupBtn.type = "button";
    groupBtn.setAttribute(
        "data-active",
        state.groupingMode === "byCategory" ? "true" : "false",
    );
    groupBtn.title = state.groupingMode === "byCategory"
        ? "تجميع حسب الفئة (تفعيل / تعطيل)"
        : "عرض مسطّح (اضغط للتجميع حسب الفئة)";
    groupBtn.setAttribute(
        "aria-label",
        state.groupingMode === "byCategory" ? "التجميع حسب الفئة مفعّل" : "عرض مسطّح",
    );
    groupBtn.appendChild(el(
        "span",
        "boon-shc-icon-btn-glyph",
        state.groupingMode === "byCategory" ? "≡" : "⋮",
    ));
    groupBtn.addEventListener("click", () => {
        state.groupingMode = state.groupingMode === "byCategory" ? "flat" : "byCategory";
        renderPanel();
    });
    toolbar.appendChild(groupBtn);

    return toolbar;
}

function renderTabs(result: DiscoveryResult): HTMLElement {
    const tabs = el("div", "boon-shc-tabs");
    const filters: FilterKind[] = ["all", "text", "voice", "stage", "forum", "announcement", "media", "category"];

    // Same NSFW-aware base list as renderHeader. Without this, the badge
    // could read "نصية (5)" while the body only renders 3 rows.
    const base = state.nsfwFiltered
        ? result.hidden.filter(c => !c.nsfw)
        : result.hidden;

    const countFor = (kind: FilterKind): number =>
        kind === "all"
            ? base.length
            : base.filter(c => c.kind === kind).length;

    for (const f of filters) {
        const c = countFor(f);
        if (f !== "all" && c === 0) continue;
        const tab = el("button", "boon-shc-tab", `${labelFor(f)} (${c})`);
        tab.type = "button";
        tab.setAttribute("aria-selected", state.filter === f ? "true" : "false");
        tab.addEventListener("click", () => {
            state.filter = f;
            renderPanel();
        });
        tabs.appendChild(tab);
    }
    return tabs;
}

interface RenderOptions {
    preserveFocus?: "search";
}

function renderPanel(opts: RenderOptions = {}): void {
    const backdrop = document.getElementById(BACKDROP_ID);
    if (!backdrop) return;
    const result = state.result;
    if (!result) {
        backdrop.replaceChildren();
        return;
    }

    const focusSelector = opts.preserveFocus === "search" ? ".boon-shc-search" : null;
    const caret = focusSelector
        ? (document.activeElement instanceof HTMLInputElement
            ? document.activeElement.selectionStart
            : null)
        : null;

    const modal = el("div", "boon-shc-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const drilldown = state.drilldownId
        ? (result.hidden.find(c => c.id === state.drilldownId) ?? null)
        : null;

    modal.appendChild(renderHeader(result, drilldown));

    if (!drilldown) {
        modal.appendChild(renderToolbar());
        modal.appendChild(renderTabs(result));
        modal.appendChild(renderListBody(result));
    } else {
        modal.appendChild(renderDetailsBody(result, drilldown.id, toastFn));
    }

    backdrop.replaceChildren(modal);

    if (focusSelector) {
        const refocus = backdrop.querySelector<HTMLInputElement>(focusSelector);
        refocus?.focus();
        if (refocus && caret !== null) {
            try { refocus.setSelectionRange(caret, caret); } catch { /* noop */ }
        }
    }
}

// ─── Open / close ───────────────────────────────────────────────────────────

export function openPanel(opts: { toast: (msg: string) => void; onClose?: () => void }): void {
    toastFn = opts.toast;
    onCloseCallback = opts.onClose ?? null;

    const guildId = findGuildId();
    if (!guildId) {
        opts.toast("افتح سيرفراً أولاً");
        return;
    }
    state.guildId = guildId;
    state.result = scanGuild(guildId);
    state.drilldownId = null;
    state.query = "";

    document.getElementById(BACKDROP_ID)?.remove();
    const backdrop = el("div", "boon-shc-backdrop");
    backdrop.id = BACKDROP_ID;
    backdrop.addEventListener("click", e => {
        if (e.target === backdrop) closePanel();
    });
    backdrop.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            e.stopPropagation();
            // One Escape backs out of the details view to the list;
            // a second Escape closes the panel entirely. Matches the
            // mental model of "undo one level of drill-down".
            if (state.drilldownId) {
                state.drilldownId = null;
                renderPanel();
            } else {
                closePanel();
            }
            return;
        }
        // `/` jumps focus to the search input — a convention popularised by
        // GitHub and Notion. We only intercept it when the user isn't
        // already typing into a text field, otherwise we'd swallow `/`
        // inside their search query.
        if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
            const search = backdrop.querySelector<HTMLInputElement>(".boon-shc-search");
            if (search) {
                e.preventDefault();
                search.focus();
                search.select();
            }
        }
    });
    document.body.appendChild(backdrop);
    renderPanel();

    const focusInitial = backdrop.querySelector<HTMLInputElement>(".boon-shc-search");
    focusInitial?.focus();
}

export function closePanel(): void {
    document.getElementById(BACKDROP_ID)?.remove();
    state.drilldownId = null;
    onCloseCallback?.();
    onCloseCallback = null;
}

export function isPanelOpen(): boolean {
    return document.getElementById(BACKDROP_ID) !== null;
}

// ─── Settings hooks ─────────────────────────────────────────────────────────

export interface PanelDefaults {
    defaultFilter: FilterKind;
    defaultSort: SortKey;
    hideNsfw: boolean;
}

/**
 * Push user-configured defaults into the panel's runtime state.
 *
 * Individual fields are guarded by an `apply` argument so that the
 * `settings:changed` handler in `index.ts` can ask, e.g., "only re-apply the
 * filter — the user just toggled `showLauncher`, don't reset their tab to
 * 'all'". When called without an `apply` set, all three fields are written
 * (used on plugin start).
 */
export function applyDefaults(
    defaults: PanelDefaults,
    apply?: { filter?: boolean; sort?: boolean; nsfw?: boolean },
): void {
    const all = apply === undefined;
    if (all || apply?.filter) state.filter = defaults.defaultFilter;
    if (all || apply?.sort) state.sort = defaults.defaultSort;
    if (all || apply?.nsfw) state.nsfwFiltered = defaults.hideNsfw;
}
