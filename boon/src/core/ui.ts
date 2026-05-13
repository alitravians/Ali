/*
 * BOON — Settings UI
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * A floating modal panel reachable from anywhere with `Ctrl+Shift+B`. Layout
 * mirrors Vencord's familiar sidebar so users coming from there feel at home,
 * but the visual identity is BOON's: cyber-green accent (#00FF88), Arabic
 * (RTL) labels, BOON-branded chrome.
 *
 * Sections (sidebar order):
 *   1. BOON          — overview + about + global toggles
 *   2. Plugins       — grid of plugin cards with toggles + cog
 *   3. Themes        — preset chips + live editor (handled by AliThemes plugin)
 *   4. Updater       — GitHub Releases changelog + check-for-updates
 *   5. Profiles      — named state snapshots (save/switch/export/import)
 *   6. Activity      — live event log
 *   7. Backup        — export/import full state JSON
 *
 * Two extra surfaces:
 *   - Plugin detail dialog (cog icon on a card)
 *   - Command palette (Ctrl+K), implemented separately in commandPalette.ts
 *     but mounted by this module.
 */

import { subscribe as subscribeActivity, snapshot as activitySnapshot } from "./activity.js";
import * as palette from "./commandPalette.js";
import { emit, on } from "./events.js";
import { rootLogger } from "./logger.js";
import * as pm from "./pluginManager.js";
import * as profiles from "./profiles.js";
import { exportState, importState, resetPlugin } from "./settings.js";
import { getCounters, getLastUsed } from "./stats.js";
import { toast } from "./toast.js";
import * as updater from "./updater.js";
import type {
    ActivityEntry,
    PluginDefinition,
    SettingDefinition,
    SettingsSchema,
} from "./types.js";
import { VERSION } from "./version.js";

const STYLE_ID = "boon-ui-styles";
const ROOT_ID = "boon-ui-root";

const ACCENT = "#00ff88";
const ACCENT_DIM = "#00cc6e";
const BG_0 = "#0a0e0c";
const BG_1 = "#11171a";
const BG_2 = "#19232a";
const BG_3 = "#22303a";
const TEXT_0 = "#eafff0";
const TEXT_1 = "#a8b3b8";
const TEXT_2 = "#6a7d85";
const BORDER = "#1f2d36";

const STYLE = `
#${ROOT_ID} {
    position: fixed;
    inset: 0;
    z-index: 2147483600;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: none;
    align-items: center;
    justify-content: center;
    font-family: var(--font-primary, "gg sans", "Noto Sans", "Segoe UI", sans-serif);
    color: ${TEXT_0};
}
#${ROOT_ID}.boon-open { display: flex; }
#${ROOT_ID} *, #${ROOT_ID} *::before, #${ROOT_ID} *::after { box-sizing: border-box; }
.boon-embedded { font-family: var(--font-primary, "gg sans", "Noto Sans", "Segoe UI", sans-serif); color: ${TEXT_0}; direction: rtl; padding: 60px 40px 20px; box-sizing: border-box; }
.boon-embedded *, .boon-embedded *::before, .boon-embedded *::after { box-sizing: border-box; }
.boon-embedded .boon-close { display: none; }
.boon-panel {
    width: min(1080px, 92vw);
    height: min(720px, 88vh);
    background: ${BG_1};
    border: 1px solid ${BORDER};
    border-radius: 14px;
    display: grid;
    grid-template-columns: 240px 1fr;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.08);
    direction: rtl;
}
.boon-sidebar {
    background: ${BG_0};
    border-left: 1px solid ${BORDER};
    padding: 16px 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
}
.boon-brand {
    padding: 4px 18px 16px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.boon-brand-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${ACCENT};
    box-shadow: 0 0 12px ${ACCENT};
}
.boon-brand small {
    margin-right: auto;
    font-size: 11px;
    color: ${TEXT_2};
    font-weight: 500;
    letter-spacing: 0;
}
.boon-nav {
    padding: 0 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.boon-nav-section {
    color: ${TEXT_2};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 14px 10px 6px;
}
.boon-nav-item {
    background: transparent;
    border: 0;
    color: ${TEXT_1};
    font: inherit;
    font-size: 14px;
    text-align: right;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
}
.boon-nav-item:hover { background: ${BG_2}; color: ${TEXT_0}; }
.boon-nav-item.is-active {
    background: ${BG_2};
    color: ${ACCENT};
    box-shadow: inset 3px 0 0 ${ACCENT};
}
.boon-nav-item .boon-nav-badge {
    margin-right: auto;
    background: ${BG_3};
    color: ${TEXT_1};
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 999px;
}
.boon-main {
    overflow-y: auto;
    padding: 28px 32px;
    background: ${BG_1};
}
.boon-main-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
}
.boon-main-header h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
}
.boon-main-header p {
    margin: 0;
    color: ${TEXT_1};
    font-size: 13px;
}
.boon-close {
    margin-right: auto;
    width: 32px;
    height: 32px;
    border: 0;
    background: transparent;
    color: ${TEXT_1};
    font-size: 18px;
    border-radius: 6px;
    cursor: pointer;
}
.boon-close:hover { background: ${BG_2}; color: ${TEXT_0}; }
.boon-card {
    background: ${BG_2};
    border: 1px solid ${BORDER};
    border-radius: 10px;
    padding: 16px;
}
.boon-card + .boon-card { margin-top: 12px; }
.boon-card h3 {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 700;
}
.boon-card .boon-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid ${BORDER};
}
.boon-card .boon-row:last-child { border-bottom: 0; }
.boon-card .boon-row-label {
    color: ${TEXT_1};
    font-size: 13px;
}

/* plugin grid */
.boon-plugin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
}
.boon-plugin-card {
    background: ${BG_2};
    border: 1px solid ${BORDER};
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    transition: border-color 0.15s, transform 0.15s;
}
.boon-plugin-card:hover {
    border-color: ${ACCENT_DIM};
    transform: translateY(-1px);
}
.boon-plugin-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
}
.boon-plugin-card-head h4 { margin: 0; font-size: 15px; font-weight: 700; }
.boon-plugin-card-head .boon-cog {
    margin-right: auto;
    background: transparent;
    border: 0;
    color: ${TEXT_2};
    width: 26px;
    height: 26px;
    border-radius: 6px;
    cursor: pointer;
}
.boon-plugin-card-head .boon-cog:hover { background: ${BG_3}; color: ${TEXT_0}; }
.boon-plugin-desc {
    color: ${TEXT_1};
    font-size: 12.5px;
    line-height: 1.4;
    min-height: 36px;
}
.boon-plugin-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: ${TEXT_2};
    font-size: 11px;
    padding-top: 6px;
    border-top: 1px solid ${BORDER};
}
.boon-tag {
    display: inline-block;
    background: ${BG_3};
    color: ${TEXT_1};
    font-size: 10px;
    padding: 1px 7px;
    border-radius: 999px;
    margin-left: 4px;
}
.boon-crash {
    display: inline-block;
    background: rgba(242,63,67,0.15);
    color: #ff8189;
    font-size: 10px;
    padding: 1px 7px;
    border-radius: 999px;
}

/* toggle switch */
.boon-switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    flex: 0 0 36px;
}
.boon-switch input { opacity: 0; width: 0; height: 0; }
.boon-switch .boon-slider {
    position: absolute;
    inset: 0;
    background: ${BG_3};
    border-radius: 999px;
    transition: background 0.15s;
    cursor: pointer;
}
.boon-switch .boon-slider::before {
    content: "";
    position: absolute;
    width: 16px; height: 16px;
    right: 2px; top: 2px;
    background: ${TEXT_1};
    border-radius: 50%;
    transition: transform 0.15s, background 0.15s;
}
.boon-switch input:checked + .boon-slider { background: ${ACCENT}; }
.boon-switch input:checked + .boon-slider::before {
    transform: translateX(-16px);
    background: ${BG_0};
}

/* forms */
.boon-field { margin: 14px 0; }
.boon-field label.boon-field-label {
    display: block;
    font-size: 13px;
    color: ${TEXT_0};
    margin-bottom: 4px;
    font-weight: 600;
}
.boon-field .boon-field-desc {
    color: ${TEXT_2};
    font-size: 12px;
    margin-bottom: 6px;
}
.boon-input, .boon-select, .boon-textarea {
    width: 100%;
    background: ${BG_1};
    color: ${TEXT_0};
    border: 1px solid ${BORDER};
    border-radius: 6px;
    padding: 8px 10px;
    font: inherit;
    font-size: 13px;
    direction: rtl;
}
.boon-textarea { min-height: 120px; resize: vertical; direction: ltr; font-family: ui-monospace, monospace; }
.boon-input[type="color"] { padding: 2px; height: 36px; cursor: pointer; }
.boon-input:focus, .boon-select:focus, .boon-textarea:focus {
    outline: 0;
    border-color: ${ACCENT};
    box-shadow: 0 0 0 2px rgba(0,255,136,0.18);
}
.boon-btn {
    background: ${ACCENT};
    color: ${BG_0};
    border: 0;
    border-radius: 6px;
    padding: 8px 16px;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}
.boon-btn:hover { background: ${ACCENT_DIM}; }
.boon-btn.boon-btn-ghost {
    background: transparent;
    color: ${TEXT_0};
    border: 1px solid ${BORDER};
}
.boon-btn.boon-btn-ghost:hover { border-color: ${ACCENT}; color: ${ACCENT}; }
.boon-btn.boon-btn-danger {
    background: #f23f43;
    color: #fff;
}

/* activity */
.boon-activity {
    background: ${BG_0};
    border: 1px solid ${BORDER};
    border-radius: 10px;
    padding: 10px;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    direction: ltr;
    max-height: 60vh;
    overflow-y: auto;
}
.boon-activity-row { padding: 2px 6px; display: flex; gap: 8px; }
.boon-activity-row .ts { color: ${TEXT_2}; }
.boon-activity-row .src { color: ${ACCENT}; min-width: 130px; }
.boon-activity-row.level-warn .src { color: #f7b500; }
.boon-activity-row.level-error .src { color: #f23f43; }

/* changelog */
.boon-release {
    background: ${BG_2};
    border: 1px solid ${BORDER};
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 12px;
}
.boon-release h3 { margin: 0 0 10px; font-size: 16px; }
.boon-release .boon-release-date { color: ${TEXT_2}; font-size: 11px; font-weight: 400; }
.boon-release section { margin-top: 10px; }
.boon-release section h4 {
    margin: 0 0 6px;
    font-size: 13px;
    color: ${ACCENT};
    font-weight: 700;
}
.boon-release section.added h4 { color: ${ACCENT}; }
.boon-release section.fixed h4 { color: #f7b500; }
.boon-release section.improved h4 { color: #5ec1ff; }
.boon-release ul {
    margin: 0; padding: 0; list-style: none;
}
.boon-release li {
    padding: 3px 0;
    color: ${TEXT_1};
    font-size: 13px;
    line-height: 1.5;
    padding-right: 14px;
    position: relative;
}
.boon-release li::before {
    content: "•";
    color: ${ACCENT};
    position: absolute;
    right: 0;
}

/* palette */
#boon-palette {
    position: fixed;
    inset: 0;
    z-index: 2147483601;
    background: rgba(0,0,0,0.55);
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding-top: 18vh;
}
#boon-palette.boon-open { display: flex; }
.boon-palette-panel {
    width: min(640px, 92vw);
    background: ${BG_1};
    border: 1px solid ${BORDER};
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
    direction: rtl;
}
.boon-palette-input {
    width: 100%;
    background: transparent;
    color: ${TEXT_0};
    border: 0;
    padding: 16px 18px;
    font-size: 16px;
    border-bottom: 1px solid ${BORDER};
    direction: rtl;
}
.boon-palette-input:focus { outline: 0; }
.boon-palette-list {
    max-height: 50vh;
    overflow-y: auto;
}
.boon-palette-item {
    padding: 10px 18px;
    cursor: pointer;
    border-bottom: 1px solid ${BORDER};
}
.boon-palette-item:last-child { border-bottom: 0; }
.boon-palette-item.is-active { background: ${BG_2}; }
.boon-palette-item .t { font-size: 14px; color: ${TEXT_0}; font-weight: 600; }
.boon-palette-item .s { font-size: 12px; color: ${TEXT_2}; margin-top: 2px; }
.boon-empty { padding: 20px; text-align: center; color: ${TEXT_2}; font-size: 13px; }
`;

// ─── helpers ────────────────────────────────────────────────────────────────

type ElAttrs = {
    className?: string;
    style?: Partial<CSSStyleDeclaration>;
    [key: string]: unknown;
};

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: ElAttrs = {},
    ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined) continue;
        if (k === "className") node.className = String(v);
        else if (k === "style") Object.assign(node.style, v as object);
        else if (k.startsWith("on") && typeof v === "function") {
            node.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
        } else {
            (node as unknown as Record<string, unknown>)[k] =
                typeof v === "number" ? String(v) : v;
        }
    }
    for (const child of children) {
        if (child == null) continue;
        node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
}

function relativeTime(ts: number): string {
    if (!ts) return "—";
    const diff = Date.now() - ts;
    const sec = Math.round(diff / 1000);
    if (sec < 60) return `قبل ${sec} ثانية`;
    const min = Math.round(sec / 60);
    if (min < 60) return `قبل ${min} دقيقة`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `قبل ${hr} ساعة`;
    const day = Math.round(hr / 24);
    return `قبل ${day} يوم`;
}

function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString();
}

// ─── views ──────────────────────────────────────────────────────────────────

type ViewId = "home" | "plugins" | "themes" | "updater" | "profiles" | "activity" | "backup";

interface UIState {
    view: ViewId;
    pluginDetailId: string | null;
}

const state: UIState = { view: "home", pluginDetailId: null };

// When BOON is rendered inside Discord's User Settings (instead of the
// floating overlay) we keep a reference to the host element so internal
// re-renders (plugin toggle, back button, reset, etc.) hit the same node
// instead of looking for a non-existent overlay.
let embeddedHost: HTMLElement | null = null;

/**
 * Re-render the current view in whichever mode is active (floating overlay
 * or embedded inside Discord's User Settings). All in-page state changes —
 * toggles, navigation, plugin-detail back button — should go through here so
 * the right host gets updated.
 */
function rerender(): void {
    if (embeddedHost) {
        const host = embeddedHost;
        host.innerHTML = "";
        switch (state.view) {
            case "home": renderHome(host); break;
            case "plugins":
                if (state.pluginDetailId) openPluginDetail();
                else renderPlugins(host);
                break;
            case "themes": renderThemes(host); break;
            case "updater": void renderUpdater(host); break;
            case "profiles": renderProfiles(host); break;
            case "activity": renderActivity(host); break;
            case "backup": renderBackup(host); break;
        }
    } else {
        render();
    }
}

function renderHome(main: HTMLElement): void {
    const plugins = pm.list();
    const active = plugins.filter(p => p.enabled).length;
    const crashed = plugins.filter(p => p.crashed).length;

    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "BOON"),
                el("p", {}, "إطار عمل لتعديل عميل Discord — نظيف، شفّاف، عربي بالكامل."),
            ),
            el("button", {
                className: "boon-close",
                title: "إغلاق",
                onclick: () => close(),
            }, "✕"),
        ),
    );

    main.appendChild(
        el("div", { className: "boon-card" },
            el("h3", {}, "نظرة عامة"),
            el("div", { className: "boon-row" },
                el("span", { className: "boon-row-label" }, "الإصدار"),
                el("span", {}, `v${VERSION}`),
            ),
            el("div", { className: "boon-row" },
                el("span", { className: "boon-row-label" }, "الهدف الحالي"),
                el("span", {}, pm.getTarget()),
            ),
            el("div", { className: "boon-row" },
                el("span", { className: "boon-row-label" }, "الإضافات"),
                el("span", {}, `${active} نشطة / ${plugins.length} إجمالاً`),
            ),
            crashed > 0
                ? el("div", { className: "boon-row" },
                    el("span", { className: "boon-row-label" }, "متعطّلة"),
                    el("span", { style: { color: "#ff8189" } }, `${crashed}`),
                )
                : document.createTextNode(""),
        ),
    );

    main.appendChild(
        el("div", { className: "boon-card" },
            el("h3", {}, "اختصارات سريعة"),
            el("div", { className: "boon-row" },
                el("span", { className: "boon-row-label" }, "فتح/إغلاق BOON"),
                el("kbd", {}, "Ctrl + Shift + B"),
            ),
            el("div", { className: "boon-row" },
                el("span", { className: "boon-row-label" }, "لوحة الأوامر"),
                el("kbd", {}, "Ctrl + K"),
            ),
            el("div", { className: "boon-row" },
                el("span", { className: "boon-row-label" }, "بادئة الأوامر النصّية"),
                el("kbd", {}, ".."),
            ),
        ),
    );

    main.appendChild(
        el("div", { className: "boon-card" },
            el("h3", {}, "روابط"),
            el("div", { className: "boon-row" },
                el("span", { className: "boon-row-label" }, "المصدر"),
                el("a", { href: "https://github.com/alitravians/Ali", target: "_blank", rel: "noopener", style: { color: ACCENT } }, "github.com/alitravians/Ali"),
            ),
            el("div", { className: "boon-row" },
                el("span", { className: "boon-row-label" }, "الترخيص"),
                el("span", {}, "GPL-3.0-or-later"),
            ),
        ),
    );
}

function renderPlugins(main: HTMLElement): void {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "الإضافات"),
                el("p", {}, "كل إضافة لها بطاقة. الزر الأخضر يفعّل، أيقونة الترس تفتح الإعدادات."),
            ),
            el("button", { className: "boon-close", onclick: () => close() }, "✕"),
        ),
    );

    const grid = el("div", { className: "boon-plugin-grid" });
    for (const info of pm.list()) {
        const counters = getCounters(info.id);
        const lastUsed = getLastUsed(info.id);
        const counterText = Object.entries(counters)
            .map(([k, v]) => `${v} ${k}`)
            .join(" · ") || "—";

        const card = el("div", { className: "boon-plugin-card" });

        const switchInput = el("input", { type: "checkbox", checked: info.enabled }) as HTMLInputElement;
        switchInput.addEventListener("change", async ev => {
            ev.stopPropagation();
            await pm.toggle(info.id);
            rerender();
        });
        const switchLabel = el(
            "label",
            { className: "boon-switch", onclick: (e: Event) => e.stopPropagation() },
            switchInput,
            el("span", { className: "boon-slider" }),
        );

        card.appendChild(
            el("div", { className: "boon-plugin-card-head" },
                el("h4", {}, info.name),
                info.crashed ? el("span", { className: "boon-crash" }, "متعطّلة") : document.createTextNode(""),
                el("button", {
                    className: "boon-cog",
                    title: "إعدادات",
                    onclick: (ev: Event) => {
                        ev.stopPropagation();
                        state.pluginDetailId = info.id;
                        openPluginDetail();
                    },
                }, "⚙"),
                switchLabel,
            ),
        );
        card.appendChild(el("p", { className: "boon-plugin-desc" }, info.description));
        card.appendChild(
            el("div", { className: "boon-plugin-meta" },
                el("span", {}, counterText),
                el("span", {}, `آخر استخدام: ${relativeTime(lastUsed)}`),
            ),
        );

        if (info.tags.length > 0) {
            const tagRow = el("div", { style: { marginTop: "4px" } });
            for (const t of info.tags) tagRow.appendChild(el("span", { className: "boon-tag" }, t));
            card.appendChild(tagRow);
        }

        card.addEventListener("click", () => {
            state.pluginDetailId = info.id;
            openPluginDetail();
        });
        grid.appendChild(card);
    }
    main.appendChild(grid);
}

function renderActivity(main: HTMLElement): void {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "السجل المباشر"),
                el("p", {}, "أحداث BOON والإضافات. السجل في الذاكرة فقط (آخر ٥٠٠ حدث)."),
            ),
            el("button", { className: "boon-close", onclick: () => close() }, "✕"),
        ),
    );

    const list = el("div", { className: "boon-activity" });
    main.appendChild(list);

    const renderEntry = (e: ActivityEntry): void => {
        const row = el(
            "div",
            { className: `boon-activity-row level-${e.level}` },
            el("span", { className: "ts" }, fmtTime(e.timestamp)),
            el("span", { className: "src" }, e.source),
            el("span", {}, e.message),
        );
        list.appendChild(row);
        list.scrollTop = list.scrollHeight;
    };

    for (const e of activitySnapshot()) renderEntry(e);
    const off = subscribeActivity(renderEntry);
    // Cleanup when view changes
    list.addEventListener("DOMNodeRemovedFromDocument", off);
}

function renderProfiles(main: HTMLElement): void {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "الملفات الشخصية"),
                el("p", {}, "احفظ إعداداتك كاملة باسم، وبدّل بين الإعدادات بضغطة واحدة."),
            ),
            el("button", { className: "boon-close", onclick: () => close() }, "✕"),
        ),
    );

    const items = profiles.list();
    const list = el("div", { className: "boon-card" });
    list.appendChild(el("h3", {}, "ملفاتك المحفوظة"));

    if (items.length === 0) {
        list.appendChild(el("p", { style: { color: TEXT_2, fontSize: "13px", padding: "8px 0" } }, "لا توجد ملفات بعد — احفظ الإعدادات الحالية بالأسفل."));
    } else {
        for (const p of items) {
            const row = el("div", { className: "boon-row" });
            row.appendChild(el("span", {}, `${p.name}${p.active ? " (نشط)" : ""}`));
            const actions = el("span", { style: { display: "flex", gap: "8px" } });
            actions.appendChild(el("button", {
                className: "boon-btn boon-btn-ghost",
                onclick: () => { profiles.activate(p.id); toast(`تم تفعيل: ${p.name}`, "success"); render(); },
            }, "تفعيل"));
            actions.appendChild(el("button", {
                className: "boon-btn boon-btn-ghost",
                onclick: () => {
                    const data = profiles.exportProfile(p.id);
                    if (!data) return;
                    const blob = new Blob([data], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = el("a", { href: url, download: `${p.name}.boon-profile.json` });
                    a.click();
                    URL.revokeObjectURL(url);
                },
            }, "تصدير"));
            actions.appendChild(el("button", {
                className: "boon-btn boon-btn-danger",
                onclick: () => { if (confirm(`حذف "${p.name}"؟`)) { profiles.remove(p.id); render(); } },
            }, "حذف"));
            row.appendChild(actions);
            list.appendChild(row);
        }
    }
    main.appendChild(list);

    const savePanel = el("div", { className: "boon-card" });
    savePanel.appendChild(el("h3", {}, "حفظ الإعدادات الحالية"));
    const input = el("input", {
        className: "boon-input",
        placeholder: "اسم الملف الشخصي (مثلاً: Gaming)",
    }) as HTMLInputElement;
    const btn = el("button", {
        className: "boon-btn",
        onclick: () => {
            const name = input.value.trim();
            if (!name) { toast("أدخل اسماً", "error"); return; }
            profiles.save(name);
            input.value = "";
            toast(`تم الحفظ: ${name}`, "success");
            render();
        },
    }, "حفظ");
    savePanel.appendChild(el("div", { className: "boon-field" }, input));
    savePanel.appendChild(btn);
    main.appendChild(savePanel);
}

async function renderUpdater(main: HTMLElement): Promise<void> {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "التحديثات"),
                el("p", {}, "تحديثات BOON موزّعة عبر GitHub Releases — لا خادم، لا تسجيل."),
            ),
            el("button", { className: "boon-close", onclick: () => close() }, "✕"),
        ),
    );

    const summary = el("div", { className: "boon-card" });
    summary.appendChild(el("h3", {}, "حالة التحديث"));
    summary.appendChild(
        el("div", { className: "boon-row" },
            el("span", { className: "boon-row-label" }, "الإصدار الحالي"),
            el("span", {}, `v${VERSION}`),
        ),
    );
    const latestRow = el("div", { className: "boon-row" });
    latestRow.appendChild(el("span", { className: "boon-row-label" }, "الإصدار الأحدث"));
    const latestValue = el("span", {}, "—");
    latestRow.appendChild(latestValue);
    summary.appendChild(latestRow);

    const actionRow = el("div", { className: "boon-row", style: { gap: "8px", flexWrap: "wrap" } });
    const checkBtn = el("button", { className: "boon-btn" }, "التحقق من التحديثات") as HTMLButtonElement;
    const openReleasesBtn = el("a", {
        href: updater.RELEASES_URL,
        target: "_blank",
        rel: "noopener",
        className: "boon-btn boon-btn-ghost",
        style: { textDecoration: "none", textAlign: "center" },
    }, "فتح صفحة الإصدارات");
    actionRow.appendChild(checkBtn);
    actionRow.appendChild(openReleasesBtn);
    summary.appendChild(actionRow);

    main.appendChild(summary);

    const list = el("div");
    main.appendChild(list);

    const setStatus = (text: string, color: string): void => {
        latestValue.textContent = text;
        latestValue.setAttribute("style", `color: ${color}`);
    };

    const runFetch = async (): Promise<void> => {
        checkBtn.disabled = true;
        checkBtn.textContent = "جاري الجلب…";
        setStatus("جاري الجلب…", TEXT_2);
        list.innerHTML = "";
        list.appendChild(el("p", { style: { color: TEXT_2, fontSize: "13px" } }, "جاري جلب سجل الإصدارات…"));

        const result = await updater.fetchReleasesResult(10);
        list.innerHTML = "";
        checkBtn.disabled = false;
        checkBtn.textContent = "التحقق مرة أخرى";

        if (result.releases.length === 0) {
            let reason = "لا توجد إصدارات بعد، أو حدث خطأ في الاتصال.";
            if (result.error === "rate-limited") {
                reason = "تجاوز GitHub الحدّ المسموح من الطلبات (HTTP " +
                    (result.httpStatus ?? 403) +
                    "). جرّب لاحقاً، أو افتح صفحة الإصدارات يدوياً من الزر أعلاه.";
            } else if (result.error === "network") {
                reason = "تعذّر الاتصال بـ GitHub — تأكد من اتصالك بالإنترنت.";
            } else if (result.error === "http") {
                reason = "ردّ GitHub بخطأ HTTP " + (result.httpStatus ?? "غير معروف") + ". جرّب التحقق مرة أخرى.";
            }
            setStatus("لم نتمكّن من الجلب", "#ff8189");
            list.appendChild(el("p", { style: { color: TEXT_2, fontSize: "13px" } }, reason));
            return;
        }

        const latest = result.releases[0];
        const hasUpdate = updater.isNewer(latest.tag, VERSION);
        setStatus(
            `${latest.tag}${hasUpdate ? " — تحديث متوفّر" : " — أنت على أحدث نسخة"}`,
            hasUpdate ? ACCENT : TEXT_1,
        );

        // Remove any previously rendered install/restart UI before re-adding.
        summary.querySelectorAll<HTMLElement>("[data-boon-update-cta]").forEach(n => n.remove());
        if (hasUpdate) {
            const ctaRow = el("div", { className: "boon-row", style: { gap: "8px", flexWrap: "wrap" } });
            ctaRow.setAttribute("data-boon-update-cta", "true");

            const boot = (globalThis as { __BOON__?: { ipc: boolean } }).__BOON__;
            const hasIpc = !!boot?.ipc;

            if (hasIpc) {
                // Desktop client — drive the install via the patcher.
                const installBtn = el("button", { className: "boon-btn" }, `تثبيت ${latest.tag}`) as HTMLButtonElement;
                const restartBtn = el("button", {
                    className: "boon-btn boon-btn-ghost",
                    disabled: true,
                    style: { textAlign: "center" },
                }, "أعد تشغيل Discord") as HTMLButtonElement;
                const statusLine = el("span", { style: { color: TEXT_2, fontSize: "12px", flexBasis: "100%" } }, "");

                installBtn.addEventListener("click", async () => {
                    installBtn.disabled = true;
                    installBtn.textContent = "جاري التنزيل…";
                    statusLine.textContent = "تنزيل renderer.js من " + latest.tag + "…";
                    statusLine.setAttribute("style", `color: ${TEXT_2}; font-size: 12px; flex-basis: 100%`);
                    try {
                        const staged = await updater.stageUpdate(latest.tag);
                        installBtn.textContent = `تم التنزيل — ${staged.version ? "v" + staged.version : latest.tag}`;
                        statusLine.textContent = "التحديث جاهز. اضغط \"أعد تشغيل Discord\" لتطبيقه.";
                        statusLine.setAttribute("style", `color: ${ACCENT}; font-size: 12px; flex-basis: 100%`);
                        restartBtn.disabled = false;
                    } catch (err) {
                        installBtn.disabled = false;
                        installBtn.textContent = `تثبيت ${latest.tag}`;
                        statusLine.textContent = "فشل التنزيل: " + (err instanceof Error ? err.message : String(err)) +
                            ". جرّب مرة أخرى أو افتح صفحة الإصدارات.";
                        statusLine.setAttribute("style", `color: #ff8189; font-size: 12px; flex-basis: 100%`);
                    }
                });
                restartBtn.addEventListener("click", async () => {
                    restartBtn.disabled = true;
                    restartBtn.textContent = "جاري إعادة التشغيل…";
                    try {
                        await updater.relaunchDiscord();
                    } catch (err) {
                        restartBtn.disabled = false;
                        restartBtn.textContent = "أعد تشغيل Discord";
                        statusLine.textContent = "تعذّر إعادة التشغيل: " +
                            (err instanceof Error ? err.message : String(err)) +
                            ". أغلق Discord افتحه يدوياً لتطبيق التحديث.";
                        statusLine.setAttribute("style", `color: #ff8189; font-size: 12px; flex-basis: 100%`);
                    }
                });

                ctaRow.appendChild(installBtn);
                ctaRow.appendChild(restartBtn);
                ctaRow.appendChild(statusLine);
            } else {
                // Non-desktop target (extension / userscript) — fall back to
                // the github.com release page.
                ctaRow.appendChild(
                    el("a", {
                        href: latest.htmlUrl,
                        target: "_blank",
                        rel: "noopener",
                        className: "boon-btn",
                        style: { textDecoration: "none", textAlign: "center" },
                    }, `فتح ${latest.tag} على GitHub`),
                );
            }
            summary.appendChild(ctaRow);
        }

        for (const r of result.releases) {
            const block = el("div", { className: "boon-release" });
            block.appendChild(
                el("h3", {},
                    document.createTextNode(`${r.name} `),
                    el("span", { className: "boon-release-date" }, new Date(r.publishedAt).toLocaleDateString("ar")),
                ),
            );
            if (r.sections.length === 0) {
                block.appendChild(el("p", { style: { color: TEXT_2, fontSize: "12px" } }, "(لا يوجد سجل تغييرات منسّق لهذا الإصدار)"));
            } else {
                for (const sec of r.sections) {
                    const section = el("section", { className: sec.kind });
                    section.appendChild(el("h4", {}, sec.title));
                    const ul = el("ul");
                    for (const item of sec.items) ul.appendChild(el("li", {}, item));
                    section.appendChild(ul);
                    block.appendChild(section);
                }
            }
            list.appendChild(block);
        }
    };

    checkBtn.addEventListener("click", () => { void runFetch(); });
    await runFetch();
}

function renderBackup(main: HTMLElement): void {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "نسخ احتياطي / استعادة"),
                el("p", {}, "تصدير كامل حالة BOON إلى ملف JSON، أو استعادة من ملف."),
            ),
            el("button", { className: "boon-close", onclick: () => close() }, "✕"),
        ),
    );

    main.appendChild(
        el("div", { className: "boon-card" },
            el("h3", {}, "تصدير"),
            el("p", { style: { color: TEXT_1, fontSize: "13px", margin: "0 0 12px" } },
                "ينزّل ملف JSON يحوي كل التفعيلات والإعدادات. آمن للمشاركة (لا يحوي توكنات)."),
            el("button", {
                className: "boon-btn",
                onclick: () => {
                    const data = JSON.stringify(exportState(), null, 2);
                    const blob = new Blob([data], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = el("a", { href: url, download: `boon-backup-${Date.now()}.json` });
                    a.click();
                    URL.revokeObjectURL(url);
                    toast("تم التصدير", "success");
                },
            }, "تصدير حالة BOON"),
        ),
    );

    const fileInput = el("input", { type: "file", accept: ".json", style: { display: "none" } }) as HTMLInputElement;
    fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(String(reader.result));
                importState(data);
                toast("تم الاستيراد — أعد التحميل لتطبيق الإعدادات", "success");
                render();
            } catch (err) {
                rootLogger.error("import failed", err);
                toast("الملف غير صالح", "error");
            }
        };
        reader.readAsText(file);
    });
    main.appendChild(
        el("div", { className: "boon-card" },
            el("h3", {}, "استيراد"),
            el("p", { style: { color: TEXT_1, fontSize: "13px", margin: "0 0 12px" } },
                "اختر ملف backup سابق. سيتم استبدال إعداداتك الحالية."),
            el("button", {
                className: "boon-btn boon-btn-ghost",
                onclick: () => fileInput.click(),
            }, "اختر ملف JSON"),
            fileInput,
        ),
    );
}

// ─── plugin detail dialog ───────────────────────────────────────────────────

function buildField(pluginId: string, key: string, def: SettingDefinition): HTMLElement {
    const field = el("div", { className: "boon-field" });
    field.appendChild(el("label", { className: "boon-field-label" }, def.label));
    if (def.description) field.appendChild(el("div", { className: "boon-field-desc" }, def.description));

    const entry = pm.get(pluginId);
    if (!entry) return field;
    const settingsBag = entry.ctx.settings as Record<string, unknown>;

    let control: HTMLElement;
    switch (def.type) {
        case "boolean": {
            const input = el("input", { type: "checkbox", checked: Boolean(settingsBag[key]) }) as HTMLInputElement;
            input.addEventListener("change", () => { settingsBag[key] = input.checked; });
            control = el("label", { className: "boon-switch" }, input, el("span", { className: "boon-slider" }));
            break;
        }
        case "number": {
            const input = el("input", {
                className: "boon-input",
                type: "number",
                value: String(settingsBag[key] ?? def.default),
                min: def.min,
                max: def.max,
                step: def.step ?? 1,
            }) as HTMLInputElement;
            input.addEventListener("change", () => {
                const v = Number(input.value);
                if (Number.isFinite(v)) settingsBag[key] = v;
            });
            control = input;
            break;
        }
        case "select": {
            const sel = el("select", { className: "boon-select" }) as HTMLSelectElement;
            for (const opt of def.options) {
                const o = el("option", { value: opt.value }, opt.label);
                if (settingsBag[key] === opt.value) o.selected = true;
                sel.appendChild(o);
            }
            sel.addEventListener("change", () => { settingsBag[key] = sel.value; });
            control = sel;
            break;
        }
        case "color": {
            const input = el("input", { className: "boon-input", type: "color", value: String(settingsBag[key] ?? def.default) }) as HTMLInputElement;
            input.addEventListener("change", () => { settingsBag[key] = input.value; });
            control = input;
            break;
        }
        case "textarea": {
            const input = el("textarea", { className: "boon-textarea", placeholder: def.placeholder ?? "" }) as HTMLTextAreaElement;
            input.value = String(settingsBag[key] ?? def.default);
            input.addEventListener("change", () => { settingsBag[key] = input.value; });
            control = input;
            break;
        }
        case "string":
        default: {
            const input = el("input", {
                className: "boon-input",
                type: "text",
                value: String(settingsBag[key] ?? def.default),
                placeholder: "placeholder" in def ? (def.placeholder ?? "") : "",
            }) as HTMLInputElement;
            input.addEventListener("change", () => { settingsBag[key] = input.value; });
            control = input;
            break;
        }
    }
    field.appendChild(control);
    return field;
}

function openPluginDetail(): void {
    const id = state.pluginDetailId;
    if (!id) return;
    const entry = pm.get(id);
    if (!entry) return;
    const def = entry.def as PluginDefinition<SettingsSchema>;

    // Resolve where to draw the detail panel. In embedded mode we paint into
    // the host `renderEmbedded` was given; in floating-overlay mode we look
    // up the overlay's `.boon-main` content area.
    let main: HTMLElement | null = null;
    if (embeddedHost) {
        main = embeddedHost;
    } else {
        const overlay = document.getElementById(ROOT_ID);
        if (!overlay) return;
        main = overlay.querySelector<HTMLElement>(".boon-main");
    }
    if (!main) return;
    main.innerHTML = "";

    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, def.manifest.name),
                el("p", {}, def.manifest.description),
            ),
            el("button", {
                className: "boon-btn boon-btn-ghost",
                onclick: () => { state.pluginDetailId = null; state.view = "plugins"; rerender(); },
            }, "→ الإضافات"),
        ),
    );

    const meta = el("div", { className: "boon-card" });
    meta.appendChild(el("h3", {}, "معلومات"));
    meta.appendChild(el("div", { className: "boon-row" },
        el("span", { className: "boon-row-label" }, "المعرّف"),
        el("span", {}, def.manifest.id),
    ));
    meta.appendChild(el("div", { className: "boon-row" },
        el("span", { className: "boon-row-label" }, "الإصدار"),
        el("span", {}, `v${def.manifest.version}`),
    ));
    meta.appendChild(el("div", { className: "boon-row" },
        el("span", { className: "boon-row-label" }, "المؤلّفون"),
        el("span", {}, def.manifest.authors.map(a => a.name).join("، ")),
    ));
    const toggleRow = el("div", { className: "boon-row" });
    toggleRow.appendChild(el("span", { className: "boon-row-label" }, "مفعّلة"));
    const tInput = el("input", { type: "checkbox", checked: entry.enabled }) as HTMLInputElement;
    tInput.addEventListener("change", async () => { await pm.toggle(id); rerender(); });
    toggleRow.appendChild(el("label", { className: "boon-switch" }, tInput, el("span", { className: "boon-slider" })));
    meta.appendChild(toggleRow);
    main.appendChild(meta);

    if (def.settings && Object.keys(def.settings).length > 0) {
        const settingsBox = el("div", { className: "boon-card" });
        settingsBox.appendChild(el("h3", {}, "الإعدادات"));
        for (const [key, sdef] of Object.entries(def.settings)) {
            settingsBox.appendChild(buildField(id, key, sdef));
        }
        main.appendChild(settingsBox);
    }

    const dangerBox = el("div", { className: "boon-card" });
    dangerBox.appendChild(el("h3", {}, "إعادة تعيين"));
    dangerBox.appendChild(el("p", { style: { color: TEXT_1, fontSize: "13px", margin: "0 0 12px" } }, "حذف كل إعدادات هذه الإضافة وإرجاعها للقيم الافتراضية."));
    dangerBox.appendChild(el("button", {
        className: "boon-btn boon-btn-danger",
        onclick: () => {
            if (!confirm("متأكد؟")) return;
            resetPlugin(id);
            toast("تم إعادة التعيين", "success");
            rerender();
        },
    }, "إعادة تعيين"));
    main.appendChild(dangerBox);
}

// ─── command palette UI ─────────────────────────────────────────────────────

let paletteRoot: HTMLElement | null = null;
let paletteActiveIndex = 0;
let paletteFiltered: ReturnType<typeof palette.search> = [];

function buildPalette(): HTMLElement {
    const root = el("div", { id: "boon-palette" });
    const panel = el("div", { className: "boon-palette-panel" });
    const input = el("input", {
        className: "boon-palette-input",
        placeholder: "اكتب أمراً أو ابحث…",
    }) as HTMLInputElement;
    const list = el("div", { className: "boon-palette-list" });
    panel.appendChild(input);
    panel.appendChild(list);
    root.appendChild(panel);

    const refresh = (): void => {
        paletteFiltered = palette.search(input.value);
        list.innerHTML = "";
        if (paletteFiltered.length === 0) {
            list.appendChild(el("div", { className: "boon-empty" }, "لا توجد نتائج"));
            return;
        }
        paletteActiveIndex = 0;
        paletteFiltered.forEach((a, i) => {
            const item = el(
                "div",
                {
                    className: `boon-palette-item${i === paletteActiveIndex ? " is-active" : ""}`,
                    onclick: () => { void a.run(); closePalette(); },
                },
                el("div", { className: "t" }, a.title),
                a.subtitle ? el("div", { className: "s" }, a.subtitle) : document.createTextNode(""),
            );
            list.appendChild(item);
        });
    };

    input.addEventListener("input", refresh);
    input.addEventListener("keydown", e => {
        const items = list.querySelectorAll<HTMLElement>(".boon-palette-item");
        if (e.key === "ArrowDown") {
            paletteActiveIndex = Math.min(paletteActiveIndex + 1, items.length - 1);
            items.forEach((n, i) => n.classList.toggle("is-active", i === paletteActiveIndex));
            items[paletteActiveIndex]?.scrollIntoView({ block: "nearest" });
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            paletteActiveIndex = Math.max(paletteActiveIndex - 1, 0);
            items.forEach((n, i) => n.classList.toggle("is-active", i === paletteActiveIndex));
            items[paletteActiveIndex]?.scrollIntoView({ block: "nearest" });
            e.preventDefault();
        } else if (e.key === "Enter") {
            const a = paletteFiltered[paletteActiveIndex];
            if (a) { void a.run(); closePalette(); }
            e.preventDefault();
        } else if (e.key === "Escape") {
            closePalette();
            e.preventDefault();
        }
    });

    root.addEventListener("click", e => {
        if (e.target === root) closePalette();
    });

    // initial population
    setTimeout(refresh, 0);
    return root;
}

function openPalette(): void {
    if (!paletteRoot) paletteRoot = buildPalette();
    if (!paletteRoot.parentElement) document.body.appendChild(paletteRoot);
    paletteRoot.classList.add("boon-open");
    const input = paletteRoot.querySelector<HTMLInputElement>(".boon-palette-input");
    if (input) {
        input.value = "";
        input.focus();
        input.dispatchEvent(new Event("input"));
    }
}

function closePalette(): void {
    paletteRoot?.classList.remove("boon-open");
}

function togglePalette(): void {
    if (paletteRoot?.classList.contains("boon-open")) closePalette();
    else openPalette();
}

// ─── root render ────────────────────────────────────────────────────────────

const NAV: ReadonlyArray<{ id: ViewId; label: string }> = [
    { id: "home", label: "BOON" },
    { id: "plugins", label: "الإضافات" },
    { id: "themes", label: "الثيمات" },
    { id: "updater", label: "التحديثات" },
    { id: "profiles", label: "الملفات الشخصية" },
    { id: "activity", label: "السجل المباشر" },
    { id: "backup", label: "نسخ احتياطي" },
];

function ensureStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = el("style", { id: STYLE_ID }, STYLE);
    document.head.appendChild(style);
}

function ensureRoot(): HTMLElement {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;

    root = el("div", { id: ROOT_ID });
    const panel = el("div", { className: "boon-panel" });
    const sidebar = el("aside", { className: "boon-sidebar" });
    const main = el("main", { className: "boon-main" });
    panel.appendChild(sidebar);
    panel.appendChild(main);
    root.appendChild(panel);
    document.body.appendChild(root);

    root.addEventListener("click", e => {
        if (e.target === root) close();
    });

    return root;
}

function render(): void {
    ensureStyles();
    const root = ensureRoot();
    const sidebar = root.querySelector<HTMLElement>(".boon-sidebar");
    const main = root.querySelector<HTMLElement>(".boon-main");
    if (!sidebar || !main) return;

    sidebar.innerHTML = "";
    main.innerHTML = "";

    sidebar.appendChild(
        el("div", { className: "boon-brand" },
            el("span", { className: "boon-brand-dot" }),
            "BOON",
            el("small", {}, `v${VERSION}`),
        ),
    );

    const nav = el("nav", { className: "boon-nav" });
    for (const item of NAV) {
        const btn = el(
            "button",
            {
                className: `boon-nav-item${state.view === item.id ? " is-active" : ""}`,
                onclick: () => { state.view = item.id; state.pluginDetailId = null; render(); },
            },
            item.label,
        );
        if (item.id === "plugins") {
            const total = pm.list().length;
            const active = pm.list().filter(p => p.enabled).length;
            btn.appendChild(el("span", { className: "boon-nav-badge" }, `${active}/${total}`));
        }
        nav.appendChild(btn);
    }
    sidebar.appendChild(nav);

    switch (state.view) {
        case "home": renderHome(main); break;
        case "plugins":
            if (state.pluginDetailId) openPluginDetail();
            else renderPlugins(main);
            break;
        case "themes":
            renderThemes(main); break;
        case "updater": void renderUpdater(main); break;
        case "profiles": renderProfiles(main); break;
        case "activity": renderActivity(main); break;
        case "backup": renderBackup(main); break;
    }
}

function renderThemes(main: HTMLElement): void {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "الثيمات"),
                el("p", {}, "إعدادات الثيمات الكاملة موجودة في إضافة AliThemes — اضغط لفتحها."),
            ),
            el("button", { className: "boon-close", onclick: () => close() }, "✕"),
        ),
    );
    const themePlugin = pm.list().find(p => p.id === "aliThemes");
    if (!themePlugin) {
        main.appendChild(el("div", { className: "boon-card" }, "إضافة AliThemes غير موجودة."));
        return;
    }
    const card = el("div", { className: "boon-card" });
    card.appendChild(el("h3", {}, themePlugin.name));
    card.appendChild(el("p", { style: { color: TEXT_1, fontSize: "13px" } }, themePlugin.description));
    card.appendChild(el("button", {
        className: "boon-btn",
        onclick: () => { state.pluginDetailId = "aliThemes"; state.view = "plugins"; rerender(); },
    }, "افتح إعدادات AliThemes"));
    main.appendChild(card);
}

// ─── public API ─────────────────────────────────────────────────────────────

export function open(): void {
    ensureStyles();
    const root = ensureRoot();
    render();
    root.classList.add("boon-open");
}

export function close(): void {
    document.getElementById(ROOT_ID)?.classList.remove("boon-open");
    closePalette();
}

export function toggle(): void {
    const root = document.getElementById(ROOT_ID);
    if (root?.classList.contains("boon-open")) close();
    else open();
}

/**
 * Render a BOON view directly into an arbitrary host element (e.g. Discord's
 * User Settings content region). Used by `userSettingsIntegration` to embed
 * BOON inside Discord's native settings dialog without the floating modal.
 */
export function renderEmbedded(host: HTMLElement, view: ViewId = "home"): void {
    ensureStyles();
    embeddedHost = host;
    host.innerHTML = "";
    host.classList.add("boon-embedded");
    state.view = view;
    state.pluginDetailId = null;
    switch (view) {
        case "home": renderHome(host); break;
        case "plugins": renderPlugins(host); break;
        case "themes": renderThemes(host); break;
        case "updater": void renderUpdater(host); break;
        case "profiles": renderProfiles(host); break;
        case "activity": renderActivity(host); break;
        case "backup": renderBackup(host); break;
    }
}

/**
 * Called by `userSettingsIntegration` when the user clicks a non-BOON row in
 * the Discord settings sidebar so Discord can take its content area back.
 * Clearing the embedded host pointer makes any subsequent floating-overlay
 * re-render hit the overlay path again.
 */
export function clearEmbedded(): void {
    embeddedHost = null;
}

export type { ViewId };

export function init(): void {
    ensureStyles();
    palette.bindToggle(togglePalette);
    palette.installShortcut();

    // Esc closes the modal if it's open. Ctrl+Shift+B is owned by
    // userSettingsIntegration so the shortcut opens native User Settings → BOON.
    function onKey(e: KeyboardEvent): void {
        if (e.key === "Escape") {
            const root = document.getElementById(ROOT_ID);
            if (root?.classList.contains("boon-open")) close();
        }
    }
    window.addEventListener("keydown", onKey, true);

    // Re-render when plugins toggle from other surfaces (palette/window.BOON).
    on("plugin:enabled", () => { if (document.getElementById(ROOT_ID)?.classList.contains("boon-open")) render(); });
    on("plugin:disabled", () => { if (document.getElementById(ROOT_ID)?.classList.contains("boon-open")) render(); });
    on("profile:switched", () => { if (document.getElementById(ROOT_ID)?.classList.contains("boon-open")) render(); });

    emit("boon:ready", {});
}
