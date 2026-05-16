/*
 * BOON Plugin: ShowHiddenChannels — panel UI
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Renders the launcher button in the sidebar header and the modal panel
 * (list + details views). All DOM is namespaced under `.boon-shc-*` and
 * created via `document.createElement` + `textContent` — never `innerHTML`
 * — so user-controlled strings (channel name, topic, role name, etc.) can't
 * escape into HTML.
 */

import { lookupRole, scanGuild } from "./discovery.js";
import type { DiscoveredChannel, DiscoveredOverwrite, DiscoveryResult } from "./discovery.js";
import { getGuildMemberStore, getUserStore } from "../../core/webpack/index.js";

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
}

const state: PanelState = {
    guildId: null,
    result: null,
    query: "",
    filter: "all",
    sort: "position",
    nsfwFiltered: false,
    drilldownId: null,
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

function findGuildId(): string | null {
    // Trailing slash is optional: Discord usually navigates to
    // `/channels/<guildId>/<channelId>` but occasionally lands on the bare
    // guild URL (`/channels/<guildId>`, no trailing slash) before redirect.
    const match = location.pathname.match(/\/channels\/(\d+)(?:\/|$)/);
    return match ? match[1] : null;
}

// ─── Launcher button (in the channel-list header) ───────────────────────────

interface LauncherHooks {
    onOpen(): void;
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

function findChannelListHeader(): HTMLElement | null {
    return document.querySelector<HTMLElement>(
        'header[class*="header_"][class*="container_"], nav[aria-label*="server" i] header, [class*="sidebar_"] header',
    );
}

function buildLauncher(count: number): HTMLElement {
    const btn = el("button", "boon-shc-launch");
    btn.id = LAUNCH_ID;
    btn.type = "button";
    btn.setAttribute("dir", "rtl");
    btn.setAttribute("aria-label", "عرض القنوات المخفية");
    btn.setAttribute("data-count", String(count));
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

    if (!guildId) {
        existing?.remove();
        return;
    }

    if (count === 0 && !existing) return;

    if (existing) {
        existing.setAttribute("data-count", String(count));
        existing.title = `القنوات المخفية (${count})`;
        const countEl = existing.querySelector<HTMLElement>(".boon-shc-launch-count");
        if (countEl) countEl.textContent = String(count);
        return;
    }

    const header = findChannelListHeader();
    if (!header) return;
    header.appendChild(buildLauncher(count));
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

function renderChannelRow(channel: DiscoveredChannel): HTMLElement {
    const row = el("div", "boon-shc-row");
    row.setAttribute("role", "button");
    row.tabIndex = 0;
    row.setAttribute("data-channel-id", channel.id);

    row.appendChild(el("span", "boon-shc-row-icon", iconFor(channel.kind)));
    row.appendChild(el("span", "boon-shc-row-name", channel.name));

    if (channel.nsfw) {
        row.appendChild(el("span", "boon-shc-row-badge", "NSFW"));
    }
    if (channel.lastActivityMs) {
        row.appendChild(el("span", "boon-shc-row-meta", formatTimeAgo(channel.lastActivityMs)));
    }

    const open = (): void => {
        state.drilldownId = channel.id;
        renderPanel();
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
        }
    });
    return row;
}

function renderEmpty(reason: string): HTMLElement {
    return el("div", "boon-shc-empty", reason);
}

function renderListBody(result: DiscoveryResult): HTMLElement {
    const body = el("div", "boon-shc-body");

    if (result.degraded) {
        body.appendChild(el("div", "boon-shc-degraded", result.degradedReason ?? "وضع محدود"));
    }

    const filtered = applyFiltersAndSort(result.hidden);
    if (filtered.length === 0) {
        body.appendChild(renderEmpty(
            result.hidden.length === 0
                ? "ما فيه قنوات مخفية في هذا السيرفر — أنت تشوف كل شي."
                : "ما فيه نتائج توافق البحث الحالي.",
        ));
        return body;
    }

    for (const group of groupByCategory(filtered)) {
        body.appendChild(el("div", "boon-shc-category-header", `${group.name} (${group.items.length})`));
        for (const c of group.items) body.appendChild(renderChannelRow(c));
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
    if (ow.kind === "role") {
        const role = lookupRole(guildId, ow.id);
        if (role) label = role.name === "@everyone" ? "@everyone" : `@${role.name}`;
        else label = `@role(${ow.id.slice(-4)})`;
    } else {
        const ms = getGuildMemberStore();
        const us = getUserStore();
        const member = ms?.getMember(guildId, ow.id);
        const user = us?.getUser(ow.id);
        if (member?.nick) label = `@${member.nick}`;
        else if (user) label = `@${user.globalName ?? user.username}`;
        else label = `@user(${ow.id.slice(-4)})`;
    }

    const kind: "allow" | "deny" = ow.grantsView ? "allow" : "deny";

    const pill = el("span", "boon-shc-pill", label);
    pill.setAttribute("data-kind", kind);
    pill.title = ow.grantsView
        ? "يمنح صلاحية رؤية القناة"
        : "يمنع رؤية القناة";

    const dot = el("span", "boon-shc-pill-dot");
    pill.insertBefore(dot, pill.firstChild);
    return pill;
}

function detailsSection(label: string, valueNode: Node): HTMLElement {
    const section = el("div", "boon-shc-details-section");
    section.appendChild(el("div", "boon-shc-details-label", label));
    const value = el("div", "boon-shc-details-value");
    value.appendChild(valueNode);
    section.appendChild(value);
    return section;
}

function copyButton(text: string, ctxToast: (msg: string) => void): HTMLElement {
    const btn = el("button", "boon-shc-copy", "نسخ");
    btn.type = "button";
    btn.addEventListener("click", () => {
        navigator.clipboard.writeText(text).then(
            () => ctxToast("تم النسخ"),
            () => ctxToast("فشل النسخ"),
        );
    });
    return btn;
}

function renderDetailsBody(
    result: DiscoveryResult,
    channelId: string,
    ctxToast: (msg: string) => void,
): HTMLElement {
    const body = el("div", "boon-shc-body");
    const channel = result.hidden.find(c => c.id === channelId);
    if (!channel) {
        body.appendChild(renderEmpty("القناة لم تعد متاحة. ربما الصلاحيات تغيّرت."));
        return body;
    }

    const wrap = el("div", "boon-shc-details");

    const h3 = el("h3");
    h3.appendChild(document.createTextNode(`${iconFor(channel.kind)} `));
    h3.appendChild(document.createTextNode(channel.name));
    if (channel.nsfw) {
        const tag = el("span", "boon-shc-row-badge", "NSFW");
        h3.appendChild(tag);
    }
    wrap.appendChild(h3);

    const meta: string[] = [];
    meta.push(`النوع: ${labelForKind(channel.kind)}`);
    if (channel.parentName) meta.push(`الفئة: ${channel.parentName}`);
    meta.push(`الموضع: #${channel.position}`);
    if (channel.lastActivityMs) meta.push(`آخر نشاط: ${formatTimeAgo(channel.lastActivityMs)}`);
    const metaLine = el("div", "boon-shc-row-meta", meta.join("  ·  "));
    wrap.appendChild(metaLine);

    if (channel.topic) {
        wrap.appendChild(detailsSection("الموضوع", document.createTextNode(channel.topic)));
    }

    if (channel.rateLimitPerUser > 0) {
        wrap.appendChild(detailsSection(
            "الوضع البطيء",
            document.createTextNode(formatSlowmode(channel.rateLimitPerUser)),
        ));
    }

    if (channel.kind === "voice" || channel.kind === "stage") {
        const voiceLines: string[] = [];
        if (channel.bitrate != null) voiceLines.push(`Bitrate: ${Math.round(channel.bitrate / 1000)} kbps`);
        if (channel.userLimit != null && channel.userLimit > 0) voiceLines.push(`الحد الأقصى: ${channel.userLimit}`);
        if (channel.rtcRegion) voiceLines.push(`المنطقة: ${channel.rtcRegion}`);
        if (voiceLines.length > 0) {
            wrap.appendChild(detailsSection("خصائص الصوت", document.createTextNode(voiceLines.join(" · "))));
        }
    }

    if (channel.overwrites.length > 0) {
        const allowed = el("div", "boon-shc-pill-row");
        const denied = el("div", "boon-shc-pill-row");
        let hasAllowed = false;
        let hasDenied = false;
        for (const ow of channel.overwrites) {
            const pill = pillForOverwrite(result.guildId, ow);
            if (!pill) continue;
            if (ow.grantsView) {
                allowed.appendChild(pill);
                hasAllowed = true;
            } else if (ow.deniesView) {
                denied.appendChild(pill);
                hasDenied = true;
            }
        }
        if (hasAllowed) wrap.appendChild(detailsSection("مسموح لهم بالمشاهدة", allowed));
        if (hasDenied) wrap.appendChild(detailsSection("ممنوعون من المشاهدة", denied));
        if (!hasAllowed && !hasDenied) {
            wrap.appendChild(detailsSection(
                "الصلاحيات",
                document.createTextNode("لا توجد تعديلات صلاحية صريحة على القناة (تعتمد على إعدادات السيرفر العامة)."),
            ));
        }
    }

    const idRow = el("div");
    idRow.style.display = "flex";
    idRow.style.alignItems = "center";
    idRow.style.gap = "8px";
    idRow.appendChild(el("span", undefined, channel.id));
    idRow.appendChild(copyButton(channel.id, ctxToast));
    wrap.appendChild(detailsSection("معرّف القناة", idRow));

    const linkRow = el("div");
    linkRow.style.display = "flex";
    linkRow.style.alignItems = "center";
    linkRow.style.gap = "8px";
    const url = `https://discord.com/channels/${result.guildId}/${channel.id}`;
    linkRow.appendChild(el("span", undefined, url));
    linkRow.appendChild(copyButton(url, ctxToast));
    wrap.appendChild(detailsSection("الرابط", linkRow));

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

    const search = el("input", "boon-shc-search");
    search.type = "search";
    search.placeholder = "ابحث بالاسم، الموضوع، أو الفئة…";
    search.value = state.query;
    search.setAttribute("dir", "auto");
    search.addEventListener("input", () => {
        state.query = search.value;
        renderPanel({ preserveFocus: "search" });
    });
    toolbar.appendChild(search);

    const sort = el("select", "boon-shc-sort");
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
            closePanel();
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
