/*
 * alitravians — Settings UI
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * A floating modal panel reachable from anywhere with `Ctrl+Shift+B`. Layout
 * mirrors Vencord's familiar sidebar so users coming from there feel at home,
 * but the visual identity is alitravians's: cyber-green accent (#00FF88), Arabic
 * (RTL) labels, alitravians-branded chrome.
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
import * as chatButton from "./chatButton.js";
import * as pm from "./pluginManager.js";
import * as profiles from "./profiles.js";
import { exportState, importState, resetPlugin } from "./settings.js";
import { getCounters, getLastUsed } from "./stats.js";
import { toast } from "./toast.js";
import * as updater from "./updater.js";
import { DEV_AVATAR_DATA_URI } from "./devAvatar.js";
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
.boon-new-badge {
    display: inline-block;
    background: rgba(0,255,136,0.18);
    color: ${ACCENT};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 1px 7px;
    border-radius: 999px;
    border: 1px solid ${ACCENT_DIM};
}

/* plugins toolbar (search / status / tag / sort) */
.boon-plugin-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 12px;
    align-items: center;
}
.boon-plugin-search {
    flex: 1 1 200px;
    min-width: 0;
    background: ${BG_2};
    border: 1px solid ${BORDER};
    border-radius: 8px;
    color: ${TEXT_0};
    font-size: 13px;
    padding: 7px 10px;
    outline: none;
    transition: border-color 0.15s;
}
.boon-plugin-search:focus { border-color: ${ACCENT_DIM}; }
.boon-plugin-search::placeholder { color: ${TEXT_2}; }
.boon-plugin-select {
    background: ${BG_2};
    border: 1px solid ${BORDER};
    border-radius: 8px;
    color: ${TEXT_0};
    font-size: 13px;
    padding: 7px 10px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
}
.boon-plugin-select:focus { border-color: ${ACCENT_DIM}; }
.boon-plugin-grid-host { display: block; }

/* "Manage UI elements" entry card */
.boon-ui-manager-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    background: ${BG_2};
    border: 1px solid ${BORDER};
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 12px;
}
.boon-ui-manager-card-body h4 {
    margin: 0 0 2px;
    font-size: 14px;
    font-weight: 700;
    color: ${TEXT_0};
}
.boon-ui-manager-card-body p {
    margin: 0;
    font-size: 12px;
    color: ${TEXT_2};
    line-height: 1.4;
}
.boon-ui-manager-card-button {
    background: ${ACCENT_DIM};
    color: ${ACCENT};
    border: 1px solid ${ACCENT};
    border-radius: 8px;
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
}
.boon-ui-manager-card-button:hover { background: ${ACCENT}; color: ${BG_1}; }

/* "Manage UI elements" sub-page */
.boon-section-title {
    margin: 16px 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: ${TEXT_2};
    text-transform: uppercase;
    letter-spacing: 0.6px;
}
.boon-ui-buttons-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.boon-ui-buttons-group {
    background: ${BG_2};
    border: 1px solid ${BORDER};
    border-radius: 10px;
    padding: 12px 14px;
}
.boon-ui-buttons-group h5 {
    margin: 0 0 8px;
    font-size: 13px;
    color: ${ACCENT};
    font-weight: 700;
}
.boon-ui-button-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 4px;
    border-top: 1px solid ${BORDER};
}
.boon-ui-button-row:first-of-type { border-top: 0; }
.boon-ui-button-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${BG_3};
    border-radius: 6px;
    font-size: 16px;
}
.boon-ui-button-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
}
.boon-ui-button-info strong {
    color: ${TEXT_0};
    font-size: 13px;
    font-weight: 600;
}
.boon-ui-button-id {
    color: ${TEXT_2};
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
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

/* ── Releases modal (popup on "Check for Updates") ────────────────────────── */
.boon-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483700;
    background: rgba(0,0,0,0.78);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    direction: rtl;
    font-family: var(--font-primary, "gg sans", "Noto Sans", "Segoe UI", sans-serif);
    color: ${TEXT_0};
    padding: 24px;
}
.boon-modal {
    width: min(720px, 100%);
    max-height: 88vh;
    background: ${BG_1};
    border: 1px solid ${BORDER};
    border-radius: 14px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,136,0.12);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.boon-modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid ${BORDER};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: ${BG_0};
}
.boon-modal-header h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: ${TEXT_0};
}
.boon-modal-header .boon-modal-sub {
    margin-top: 4px;
    font-size: 12px;
    color: ${TEXT_2};
}
.boon-modal-body {
    padding: 18px 20px;
    overflow-y: auto;
    flex: 1;
}
.boon-modal-footer {
    padding: 14px 20px;
    border-top: 1px solid ${BORDER};
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-end;
    background: ${BG_0};
    flex-wrap: wrap;
}
.boon-modal-footer .boon-modal-status {
    margin-inline-end: auto;
    font-size: 12px;
    color: ${TEXT_2};
    min-height: 16px;
}
.boon-modal-close {
    appearance: none;
    background: transparent;
    border: 0;
    color: ${TEXT_2};
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    padding: 4px 8px;
}
.boon-modal-close:hover { color: ${TEXT_0}; }
.boon-release {
    border: 1px solid ${BORDER};
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 12px;
    background: ${BG_2};
}
.boon-release.is-current { border-color: ${ACCENT}; box-shadow: 0 0 0 1px rgba(0,255,136,0.25) inset; }
.boon-release-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
}
.boon-release-tag {
    font-weight: 700;
    color: ${ACCENT};
    font-size: 14px;
}
.boon-release-date {
    font-size: 12px;
    color: ${TEXT_2};
}
.boon-release-badge {
    margin-inline-start: auto;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
}
.boon-release-badge.is-new { background: rgba(0,255,136,0.18); color: ${ACCENT}; }
.boon-release-badge.is-current { background: ${BG_3}; color: ${TEXT_1}; }
.boon-release-notes {
    margin: 0;
    padding: 0;
    list-style: none;
    color: ${TEXT_0};
    font-size: 13px;
    line-height: 1.6;
}
.boon-release-notes li {
    padding: 3px 0;
    display: flex;
    gap: 8px;
}
.boon-release-notes .boon-note-emoji { flex-shrink: 0; }
.boon-release-empty { color: ${TEXT_2}; font-size: 13px; margin: 4px 0 0; }

/* ─── developer card (Home tab) ─────────────────────────────────────────── */
/* Designed as a small "calling card" so the dev attribution feels like a
 * polished signature rather than a footer footnote: gradient ring, animated
 * name, pulsing online dot, and a row of subtle social/tech links. */
.boon-dev-card {
    background: linear-gradient(135deg, ${BG_2} 0%, ${BG_1} 100%);
    border: 1px solid ${BORDER};
    border-radius: 14px;
    padding: 20px 22px;
    margin-top: 12px;
    position: relative;
    overflow: hidden;
}
.boon-dev-card::before {
    /* faint scan-line glow in the corner — cyber/hacker vibe */
    content: "";
    position: absolute;
    top: -40%;
    right: -10%;
    width: 220px; height: 220px;
    background: radial-gradient(closest-side, rgba(0,255,136,0.10), transparent 70%);
    pointer-events: none;
}
.boon-dev-card h3 {
    margin: 0 0 14px;
    font-size: 14px;
    font-weight: 700;
    color: ${TEXT_1};
    display: flex; align-items: center; gap: 8px;
}
.boon-dev-card h3::before {
    content: "✦";
    color: ${ACCENT};
    font-size: 12px;
}
.boon-dev-head {
    display: flex;
    align-items: center;
    gap: 14px;
}
.boon-dev-avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: linear-gradient(135deg, ${ACCENT} 0%, #00b3ff 100%);
    box-shadow: 0 0 0 2px ${BG_1}, 0 0 0 4px rgba(0,255,136,0.35);
    animation: boon-dev-avatar-glow 4s ease-in-out infinite;
}
@keyframes boon-dev-avatar-glow {
    0%, 100% { box-shadow: 0 0 0 2px ${BG_1}, 0 0 0 4px rgba(0,255,136,0.35), 0 0 18px rgba(0,255,136,0.25); }
    50%      { box-shadow: 0 0 0 2px ${BG_1}, 0 0 0 4px rgba(0,179,255,0.55), 0 0 22px rgba(0,179,255,0.45), 0 0 26px rgba(0,179,255,0.35); }
}
.boon-dev-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}
.boon-dev-label {
    font-size: 11px;
    color: ${TEXT_2};
    letter-spacing: 0.04em;
}
/* The animated name itself: combines a sliding gradient ("shimmer") with
 * actual positional movement (translateY oscillation + slight wobble) so the
 * attribution feels alive — Arabic users expect movement, not just color. */
.boon-dev-name {
    font-size: 26px;
    font-weight: 900;
    line-height: 1;
    background: linear-gradient(90deg, #00ff88 0%, #00e0ff 25%, #00ff88 50%, #00e0ff 75%, #00ff88 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    display: inline-block;
    animation:
        boon-dev-shimmer 3.2s linear infinite,
        boon-dev-bob 2.8s ease-in-out infinite;
    transform-origin: center bottom;
    cursor: default;
    user-select: text;
    will-change: transform, background-position;
}
.boon-dev-name:hover {
    /* Speed everything up + add a hand-tap bounce on hover. */
    animation:
        boon-dev-shimmer 1.4s linear infinite,
        boon-dev-hop 0.55s ease-in-out infinite;
}
@keyframes boon-dev-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
}
/* Combined float + wobble in a single keyframe — multiple animations on
 * the same transform property would otherwise overwrite each other. */
@keyframes boon-dev-bob {
    0%   { transform: translateY(0)    rotate(-1.5deg); }
    25%  { transform: translateY(-3px) rotate(0deg); }
    50%  { transform: translateY(-5px) rotate(1.5deg); }
    75%  { transform: translateY(-3px) rotate(0deg); }
    100% { transform: translateY(0)    rotate(-1.5deg); }
}
@keyframes boon-dev-hop {
    0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
    40%      { transform: translateY(-8px) scale(1.05) rotate(-3deg); }
    60%      { transform: translateY(-8px) scale(1.05) rotate(3deg); }
    80%      { transform: translateY(-2px) scale(1.02) rotate(0deg); }
}
.boon-dev-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: ${ACCENT};
    margin-top: 4px;
}
.boon-dev-status .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: ${ACCENT};
    box-shadow: 0 0 0 0 rgba(0,255,136,0.55);
    animation: boon-dev-pulse 1.6s ease-out infinite;
}
@keyframes boon-dev-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(0,255,136,0.55); transform: scale(1); }
    70%  { box-shadow: 0 0 0 10px rgba(0,255,136,0); transform: scale(1.15); }
    100% { box-shadow: 0 0 0 0 rgba(0,255,136,0); transform: scale(1); }
}
.boon-dev-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 14px;
}
.boon-dev-tag {
    background: ${BG_3};
    color: ${TEXT_1};
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid ${BORDER};
}
.boon-dev-links {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid ${BORDER};
}
.boon-dev-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: ${TEXT_1};
    text-decoration: none;
    padding: 5px 10px;
    border-radius: 8px;
    background: ${BG_2};
    border: 1px solid ${BORDER};
    transition: border-color 0.15s, color 0.15s, transform 0.15s;
}
.boon-dev-link:hover {
    border-color: ${ACCENT};
    color: ${ACCENT};
    transform: translateY(-1px);
}
.boon-dev-tagline {
    margin: 12px 0 0;
    font-size: 12.5px;
    color: ${TEXT_2};
    line-height: 1.55;
    font-style: italic;
}

/* Respect users who opted out of motion at the OS level. */
@media (prefers-reduced-motion: reduce) {
    .boon-dev-name,
    .boon-dev-name:hover,
    .boon-dev-avatar,
    .boon-dev-status .dot {
        animation: none;
    }
}
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

type PluginStatusFilter = "all" | "enabled" | "disabled" | "new" | "unused";
type PluginSortMode = "smart" | "recent" | "name";

interface UIState {
    view: ViewId;
    pluginDetailId: string | null;
    pluginSearch: string;
    pluginStatus: PluginStatusFilter;
    pluginTag: string;
    pluginSort: PluginSortMode;
    /** When true, show the dedicated "Manage UI elements" sub-page inside
     *  the Plugins tab (lets users hide individual chat-bar buttons). */
    pluginUiManagerOpen: boolean;
}

const state: UIState = {
    view: "home",
    pluginDetailId: null,
    pluginSearch: "",
    pluginStatus: "all",
    pluginTag: "",
    pluginSort: "smart",
    pluginUiManagerOpen: false,
};

// ─── "new" plugin badge tracking ────────────────────────────────────────────
//
// Mark a plugin as new for 7 days from the first time alitravians ever saw
// it. The mapping lives in localStorage so it survives Discord restarts but
// doesn't bloat the per-plugin dataStore. The `bootstrapped` flag separates
// "plugins that existed when the user first upgraded" (no badge) from
// "plugins that genuinely appeared later" (badge for 7 days).
const FIRST_SEEN_STORAGE_KEY = "alitravians:plugin:first-seen";
const NEW_BADGE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

interface FirstSeenStore {
    /** Set on the first call to `seedFirstSeen` after install/upgrade. While
     *  false, every plugin observed via `firstSeenFor` is treated as
     *  pre-existing (stamped epoch-zero) so it never receives the badge. */
    bootstrapped: boolean;
    map: Record<string, number>;
}

function loadFirstSeenStore(): FirstSeenStore {
    try {
        const raw = localStorage.getItem(FIRST_SEEN_STORAGE_KEY);
        if (!raw) return { bootstrapped: false, map: {} };
        const parsed: unknown = JSON.parse(raw);
        // Legacy schema (v0.1.8): plain Record<string, number>. Treat as
        // already bootstrapped to avoid showing the badge for everything on
        // upgrade. The legacy timestamps don't matter once bootstrapped is
        // true — they just won't match the "new" window anyway.
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, unknown>;
            if (typeof obj.bootstrapped === "boolean" && obj.map && typeof obj.map === "object") {
                const map: Record<string, number> = {};
                for (const [k, v] of Object.entries(obj.map as Record<string, unknown>)) {
                    if (typeof v === "number" && Number.isFinite(v)) map[k] = v;
                }
                return { bootstrapped: obj.bootstrapped, map };
            }
            // Legacy plain-map: migrate.
            const map: Record<string, number> = {};
            for (const [k, v] of Object.entries(obj)) {
                if (typeof v === "number" && Number.isFinite(v)) map[k] = v;
            }
            return { bootstrapped: true, map };
        }
    } catch { /* ignore */ }
    return { bootstrapped: false, map: {} };
}

function persistFirstSeenStore(store: FirstSeenStore): void {
    try {
        localStorage.setItem(FIRST_SEEN_STORAGE_KEY, JSON.stringify(store));
    } catch { /* ignore */ }
}

/**
 * One-shot snapshot of the first-seen map used during a single render pass.
 * Avoids the per-card `loadFirstSeenMap` cost that Devin Review flagged.
 */
let firstSeenCache: FirstSeenStore | null = null;
function firstSeenCacheGet(): FirstSeenStore {
    if (!firstSeenCache) firstSeenCache = loadFirstSeenStore();
    return firstSeenCache;
}
function firstSeenCacheInvalidate(): void {
    firstSeenCache = null;
}

/**
 * Mark every currently-known plugin id as "already existed" so the badge
 * never appears for pre-upgrade plugins. Subsequent plugins discovered via
 * an update will not be in the map and will receive `Date.now()` the first
 * time `firstSeenFor` is asked about them.
 */
function seedFirstSeen(existingIds: ReadonlyArray<string>): void {
    const store = loadFirstSeenStore();
    if (store.bootstrapped) return;
    for (const id of existingIds) {
        // Use epoch-zero so `Date.now() - 0 >> NEW_BADGE_WINDOW_MS` → no badge.
        if (typeof store.map[id] !== "number") store.map[id] = 0;
    }
    store.bootstrapped = true;
    persistFirstSeenStore(store);
    firstSeenCacheInvalidate();
}

function firstSeenFor(pluginId: string): number {
    const store = firstSeenCacheGet();
    if (typeof store.map[pluginId] === "number") return store.map[pluginId];
    // Only stamp when we're past bootstrap — otherwise the seeding path is
    // responsible for filling in the map.
    const stamp = store.bootstrapped ? Date.now() : 0;
    store.map[pluginId] = stamp;
    persistFirstSeenStore(store);
    return stamp;
}

function isNewlyInstalled(pluginId: string): boolean {
    return Date.now() - firstSeenFor(pluginId) < NEW_BADGE_WINDOW_MS;
}

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
                else if (state.pluginUiManagerOpen) renderUiElementsManager(host);
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
                el("h2", {}, "alitravians"),
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
                el("span", { className: "boon-row-label" }, "فتح/إغلاق alitravians"),
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

    main.appendChild(renderDeveloperCard());
}

/**
 * The "About the developer" card. Rendered on the Home tab.
 *
 * Design intent: a polished signature block — gradient-ringed avatar, the
 * developer name animated with both a sliding colour shimmer AND a small
 * floating motion (Arabic users explicitly expect positional movement, not
 * just colour shifts), a pulsing "online" indicator, tech-stack tags and a
 * row of subtle outbound links. Click/hover on the name triggers a larger
 * hop animation. Honors `prefers-reduced-motion` via CSS.
 */
function renderDeveloperCard(): HTMLElement {
    const avatar = el("img", {
        className: "boon-dev-avatar",
        src: DEV_AVATAR_DATA_URI,
        alt: "alitravians",
        title: "alitravians",
        loading: "eager",
        draggable: "false",
    });

    const name = el("div", {
        className: "boon-dev-name",
        title: "alitravians",
    }, "alitravians");

    const status = el("div", { className: "boon-dev-status" },
        el("span", { className: "dot" }),
        el("span", {}, "متّصل ويطوّر بنشاط"),
    );

    const info = el("div", { className: "boon-dev-info" },
        el("div", { className: "boon-dev-label" }, "صُمِّم وطُوِّر بواسطة"),
        name,
        status,
    );

    const head = el("div", { className: "boon-dev-head" }, avatar, info);

    const tagline = el("p", { className: "boon-dev-tagline" },
        "أداة عربية بالكامل لتعديل عميل Discord — مفتوحة المصدر، شفّافة، تُحدَّث من داخل التطبيق دون إعادة تثبيت.",
    );

    const tags = el("div", { className: "boon-dev-tags" },
        el("span", { className: "boon-dev-tag" }, "TypeScript"),
        el("span", { className: "boon-dev-tag" }, "Electron"),
        el("span", { className: "boon-dev-tag" }, "Go"),
        el("span", { className: "boon-dev-tag" }, "Arabic-first"),
        el("span", { className: "boon-dev-tag" }, "GPL-3.0"),
    );

    const links = el("div", { className: "boon-dev-links" },
        el("a", {
            className: "boon-dev-link",
            href: "https://github.com/alitravians/Ali",
            target: "_blank",
            rel: "noopener",
        }, "GitHub"),
        el("a", {
            className: "boon-dev-link",
            href: "https://github.com/alitravians/Ali/releases",
            target: "_blank",
            rel: "noopener",
        }, "الإصدارات"),
        el("a", {
            className: "boon-dev-link",
            href: "https://github.com/alitravians/Ali/issues/new",
            target: "_blank",
            rel: "noopener",
        }, "تقرير مشكلة"),
    );

    return el("div", { className: "boon-dev-card" },
        el("h3", {}, "عن المطوّر"),
        head,
        tagline,
        tags,
        links,
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

    const all = pm.list();

    // ── toolbar: search + status + tag + sort ──
    const search = el("input", {
        type: "text",
        className: "boon-plugin-search",
        placeholder: "ابحث عن إضافة…",
        value: state.pluginSearch,
    }) as HTMLInputElement;
    search.addEventListener("input", () => {
        state.pluginSearch = search.value;
        renderFilteredGrid();
    });

    const status = el("select", { className: "boon-plugin-select" }) as HTMLSelectElement;
    const statusOptions: { value: PluginStatusFilter; label: string }[] = [
        { value: "all", label: "عرض الكل" },
        { value: "enabled", label: "المفعّلة فقط" },
        { value: "disabled", label: "المعطّلة فقط" },
        { value: "new", label: "الإضافات الجديدة" },
        { value: "unused", label: "لم تُستخدم بعد" },
    ];
    for (const o of statusOptions) {
        const opt = el("option", { value: o.value }, o.label) as HTMLOptionElement;
        if (o.value === state.pluginStatus) opt.selected = true;
        status.appendChild(opt);
    }
    status.addEventListener("change", () => {
        state.pluginStatus = status.value as PluginStatusFilter;
        renderFilteredGrid();
    });

    const allTags = new Set<string>();
    for (const p of all) for (const t of p.tags) allTags.add(t);
    const tagSelect = el("select", { className: "boon-plugin-select" }) as HTMLSelectElement;
    tagSelect.appendChild(el("option", { value: "" }, "كل الوسوم"));
    for (const t of [...allTags].sort()) {
        const opt = el("option", { value: t }, t) as HTMLOptionElement;
        if (t === state.pluginTag) opt.selected = true;
        tagSelect.appendChild(opt);
    }
    tagSelect.addEventListener("change", () => {
        state.pluginTag = tagSelect.value;
        renderFilteredGrid();
    });

    const sort = el("select", { className: "boon-plugin-select" }) as HTMLSelectElement;
    const sortOptions: { value: PluginSortMode; label: string }[] = [
        { value: "smart", label: "الترتيب الذكي (المفعّلة أوّلًا)" },
        { value: "recent", label: "الأحدث استخدامًا" },
        { value: "name", label: "حسب الاسم" },
    ];
    for (const o of sortOptions) {
        const opt = el("option", { value: o.value }, o.label) as HTMLOptionElement;
        if (o.value === state.pluginSort) opt.selected = true;
        sort.appendChild(opt);
    }
    sort.addEventListener("change", () => {
        state.pluginSort = sort.value as PluginSortMode;
        renderFilteredGrid();
    });

    const toolbar = el("div", { className: "boon-plugin-toolbar" },
        search, status, tagSelect, sort,
    );
    main.appendChild(toolbar);

    // ── "Manage UI elements" entry card ──
    const uiMgrCard = el("div", { className: "boon-ui-manager-card" },
        el("div", { className: "boon-ui-manager-card-body" },
            el("h4", {}, "إدارة عناصر الواجهة"),
            el("p", {}, "إخفاء الأزرار التي تضيفها الإضافات إلى شريط الكتابة بدون تعطيل الإضافة كاملة."),
        ),
        el("button", {
            className: "boon-ui-manager-card-button",
            onclick: () => {
                state.pluginUiManagerOpen = true;
                rerender();
            },
        }, "فتح ›"),
    );
    main.appendChild(uiMgrCard);

    // ── grid container (replaced on filter change) ──
    const gridHost = el("div", { className: "boon-plugin-grid-host" });
    main.appendChild(gridHost);

    function renderFilteredGrid(): void {
        gridHost.innerHTML = "";
        const q = state.pluginSearch.trim().toLowerCase();
        const tagFilter = state.pluginTag;

        const visible = all.filter(info => {
            if (q) {
                const hay = `${info.name} ${info.description} ${info.id}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (tagFilter && !info.tags.includes(tagFilter)) return false;
            switch (state.pluginStatus) {
                case "enabled":  if (!info.enabled) return false; break;
                case "disabled": if (info.enabled) return false; break;
                case "new":      if (!isNewlyInstalled(info.id)) return false; break;
                case "unused":   if (getLastUsed(info.id) !== 0) return false; break;
                case "all":      break;
            }
            return true;
        });

        visible.sort((a, b) => {
            switch (state.pluginSort) {
                case "name":
                    return a.name.localeCompare(b.name, "ar");
                case "recent": {
                    const aU = getLastUsed(a.id);
                    const bU = getLastUsed(b.id);
                    return bU - aU;
                }
                case "smart":
                default: {
                    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
                    const aU = getLastUsed(a.id);
                    const bU = getLastUsed(b.id);
                    if (aU !== bU) return bU - aU;
                    return a.name.localeCompare(b.name, "ar");
                }
            }
        });

        if (visible.length === 0) {
            gridHost.appendChild(
                el("div", { className: "boon-empty" }, "لا توجد إضافات تطابق الفلتر الحالي."),
            );
            return;
        }

        const grid = el("div", { className: "boon-plugin-grid" });
        for (const info of visible) {
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

            const headChildren: Node[] = [
                el("h4", {}, info.name),
            ];
            if (isNewlyInstalled(info.id)) {
                headChildren.push(el("span", { className: "boon-new-badge" }, "جديد"));
            }
            if (info.crashed) {
                headChildren.push(el("span", { className: "boon-crash" }, "متعطّلة"));
            }
            headChildren.push(
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
            );
            card.appendChild(el("div", { className: "boon-plugin-card-head" }, ...headChildren));
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
        gridHost.appendChild(grid);
    }

    // On first run after install/upgrade, mark every currently-known plugin
    // as pre-existing (epoch-zero) so the "new" badge does NOT appear for
    // plugins that simply shipped with alitravians. Future plugins added by
    // a later update will get the badge for 7 days from their first sighting.
    seedFirstSeen(all.map(p => p.id));

    // Refresh the snapshot used by isNewlyInstalled for this render pass.
    firstSeenCacheInvalidate();
    renderFilteredGrid();
    // Drop the per-render cache so plugin toggles that re-enter renderPlugins
    // see the freshest store (in case it was mutated by another tab/window).
    firstSeenCacheInvalidate();
}

function renderUiElementsManager(main: HTMLElement): void {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "إدارة عناصر الواجهة"),
                el("p", {}, "يمكنك إخفاء أزرار شريط الكتابة التي تضيفها الإضافات. لن يتم تعطيل الإضافة، فقط الزر يُخفى."),
            ),
            el("button", {
                className: "boon-close",
                onclick: () => {
                    state.pluginUiManagerOpen = false;
                    rerender();
                },
                title: "عودة",
            }, "←"),
        ),
    );

    const buttons = chatButton.list();
    if (buttons.length === 0) {
        main.appendChild(
            el("div", { className: "boon-empty" },
                "لا توجد أزرار مسجّلة حالياً من أيّ إضافة. شغّل إضافة تضيف أزرارًا لشريط الكتابة لرؤيتها هنا.",
            ),
        );
        return;
    }

    main.appendChild(el("h3", { className: "boon-section-title" }, "أزرار شريط الكتابة"));

    const list = el("div", { className: "boon-ui-buttons-list" });

    // Group by owner plugin so users can see which plugin contributed which button.
    const grouped = new Map<string, typeof buttons>();
    for (const b of buttons) {
        const owner = b.ownerPluginId ?? "unknown";
        if (!grouped.has(owner)) grouped.set(owner, []);
        grouped.get(owner)!.push(b);
    }

    const pluginNameFor = (id: string): string => {
        const info = pm.list().find(p => p.id === id);
        return info?.name ?? id;
    };

    for (const [owner, btns] of grouped) {
        const group = el("div", { className: "boon-ui-buttons-group" });
        group.appendChild(el("h5", {}, pluginNameFor(owner)));

        for (const b of btns) {
            const row = el("div", { className: "boon-ui-button-row" });
            row.appendChild(
                el("span", { className: "boon-ui-button-icon" }, b.icon || "•"),
            );
            row.appendChild(
                el("div", { className: "boon-ui-button-info" },
                    el("strong", {}, b.label),
                    el("span", { className: "boon-ui-button-id" }, b.id),
                ),
            );

            const visibleInput = el("input", {
                type: "checkbox",
                checked: !b.hidden,
            }) as HTMLInputElement;
            visibleInput.addEventListener("change", () => {
                chatButton.setHidden(b.id, !visibleInput.checked);
                rerender();
            });
            const toggleLabel = el("label", { className: "boon-switch" },
                visibleInput,
                el("span", { className: "boon-slider" }),
            );
            row.appendChild(toggleLabel);
            group.appendChild(row);
        }
        list.appendChild(group);
    }

    main.appendChild(list);
}

function renderActivity(main: HTMLElement): void {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "السجل المباشر"),
                el("p", {}, "أحداث alitravians والإضافات. السجل في الذاكرة فقط (آخر ٥٠٠ حدث)."),
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

/**
 * Modal popup displayed when the user clicks "التحقق من التحديثات". Shows
 * every release fetched from GitHub as a card with parsed changelog
 * sections (added/fixed/improved/other) and an Install + Restart pair for
 * the latest tag when it's newer than the running build.
 *
 * The modal owns its own fetch lifecycle and never throws — the inline
 * Updates tab still renders the same data as a fallback for users who
 * prefer it.
 */
function showReleasesModal(onAfterAction?: () => void): void {
    // If a previous modal is still attached, dispose it before re-opening.
    document.querySelectorAll(".boon-modal-overlay").forEach(n => n.remove());

    const overlay = el("div", { className: "boon-modal-overlay" });
    const modal = el("div", { className: "boon-modal" });
    overlay.appendChild(modal);

    const headerLeft = el("div", {},
        el("h2", {}, "التحديثات والإضافات"),
        el("div", { className: "boon-modal-sub" }, `الإصدار الحالي: v${VERSION}`),
    );
    const closeBtn = el("button", {
        className: "boon-modal-close",
        title: "إغلاق",
        onclick: () => overlay.remove(),
    }, "✕") as HTMLButtonElement;
    modal.appendChild(el("div", { className: "boon-modal-header" }, headerLeft, closeBtn));

    const body = el("div", { className: "boon-modal-body" });
    const loading = el("div", { className: "boon-empty" }, "جاري جلب الإصدارات من GitHub…");
    body.appendChild(loading);
    modal.appendChild(body);

    const footer = el("div", { className: "boon-modal-footer" });
    const status = el("div", { className: "boon-modal-status" }, "");
    footer.appendChild(status);
    const ghLink = el("a", {
        href: updater.RELEASES_URL,
        target: "_blank",
        rel: "noopener",
        className: "boon-btn boon-btn-ghost",
        style: { textDecoration: "none" },
    }, "فتح صفحة GitHub");
    footer.appendChild(ghLink);
    const closeFooterBtn = el("button", {
        className: "boon-btn boon-btn-ghost",
        onclick: () => overlay.remove(),
    }, "إغلاق") as HTMLButtonElement;
    footer.appendChild(closeFooterBtn);
    modal.appendChild(footer);

    overlay.addEventListener("click", (ev) => {
        if (ev.target === overlay) overlay.remove();
    });
    const onKey = (ev: KeyboardEvent): void => {
        if (ev.key === "Escape") {
            overlay.remove();
            document.removeEventListener("keydown", onKey);
        }
    };
    document.addEventListener("keydown", onKey);

    (document.body || document.documentElement).appendChild(overlay);

    const KIND_META: Record<updater.ChangelogSectionKind, { emoji: string; label: string }> = {
        added: { emoji: "🧩", label: "إضافات" },
        fixed: { emoji: "🐛", label: "إصلاحات" },
        improved: { emoji: "✨", label: "تحسينات" },
        other: { emoji: "📝", label: "ملاحظات" },
    };

    const renderReleaseCard = (r: updater.Release, isCurrent: boolean, isNewerThanCurrent: boolean): HTMLElement => {
        const card = el("div", { className: "boon-release" + (isCurrent ? " is-current" : "") });
        const head = el("div", { className: "boon-release-head" });
        head.appendChild(el("span", { className: "boon-release-tag" }, r.tag));
        head.appendChild(el("span", { className: "boon-release-date" }, new Date(r.publishedAt).toLocaleDateString("ar")));
        if (isNewerThanCurrent) {
            head.appendChild(el("span", { className: "boon-release-badge is-new" }, "جديد"));
        } else if (isCurrent) {
            head.appendChild(el("span", { className: "boon-release-badge is-current" }, "الحالي"));
        }
        card.appendChild(head);

        if (r.sections.length === 0) {
            card.appendChild(el("p", { className: "boon-release-empty" }, "(لا توجد ملاحظات منسّقة لهذا الإصدار — افتح GitHub لقراءة التفاصيل.)"));
        } else {
            const ul = el("ul", { className: "boon-release-notes" });
            for (const sec of r.sections) {
                const meta = KIND_META[sec.kind] ?? KIND_META.other;
                for (const item of sec.items) {
                    const li = el("li", {},
                        el("span", { className: "boon-note-emoji", title: meta.label }, meta.emoji),
                        el("span", {}, item),
                    );
                    ul.appendChild(li);
                }
            }
            card.appendChild(ul);
        }
        return card;
    };

    const setStatus = (text: string, color: string): void => {
        status.textContent = text;
        status.setAttribute("style", `color: ${color}; font-size: 12px; min-height: 16px; margin-inline-end: auto;`);
    };

    void (async (): Promise<void> => {
        let result: updater.FetchResult;
        try {
            result = await updater.fetchReleasesResult(10);
        } catch (err) {
            result = { releases: [], error: "network" };
            // eslint-disable-next-line no-console
            console.error("[alitravians] modal fetch threw:", err);
        }
        body.innerHTML = "";

        if (result.releases.length === 0) {
            let reason = "لا توجد إصدارات بعد، أو حدث خطأ في الاتصال.";
            if (result.error === "rate-limited") {
                reason = "تجاوز GitHub الحدّ المسموح من الطلبات (HTTP " +
                    (result.httpStatus ?? 403) +
                    "). جرّب لاحقاً، أو افتح صفحة الإصدارات يدوياً.";
            } else if (result.error === "network") {
                reason = "تعذّر الاتصال بـ GitHub — تأكد من اتصالك بالإنترنت.";
            } else if (result.error === "http") {
                reason = "ردّ GitHub بخطأ HTTP " + (result.httpStatus ?? "غير معروف") + ".";
            }
            setStatus("لم نتمكّن من الجلب", "#ff8189");
            body.appendChild(el("p", { className: "boon-release-empty" }, reason));
            return;
        }

        const latest = result.releases[0];
        const hasUpdate = updater.isNewer(latest.tag, VERSION);

        if (hasUpdate) {
            setStatus(`الإصدار الأحدث: ${latest.tag} — تحديث متوفّر`, ACCENT);

            const boot = (globalThis as { __BOON__?: { ipc: boolean } }).__BOON__;
            const hasIpc = !!boot?.ipc;
            if (hasIpc) {
                const installBtn = el("button", { className: "boon-btn" }, `تثبيت ${latest.tag}`) as HTMLButtonElement;
                const restartBtn = el("button", {
                    className: "boon-btn boon-btn-ghost",
                    disabled: true,
                }, "أعد تشغيل Discord") as HTMLButtonElement;
                installBtn.addEventListener("click", async () => {
                    installBtn.disabled = true;
                    installBtn.textContent = "جاري التنزيل…";
                    setStatus(`تنزيل renderer.js من ${latest.tag}…`, TEXT_1);
                    try {
                        const staged = await updater.stageUpdate(latest.tag);
                        installBtn.textContent = `تم التنزيل — v${staged.version ?? latest.tag}`;
                        setStatus("التحديث جاهز. اضغط \"أعد تشغيل Discord\" لتطبيقه.", ACCENT);
                        restartBtn.disabled = false;
                        onAfterAction?.();
                    } catch (err) {
                        installBtn.disabled = false;
                        installBtn.textContent = `تثبيت ${latest.tag}`;
                        setStatus("فشل التنزيل: " + (err instanceof Error ? err.message : String(err)), "#ff8189");
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
                        setStatus("تعذّر إعادة التشغيل: " +
                            (err instanceof Error ? err.message : String(err)), "#ff8189");
                    }
                });
                // Re-insert install/restart at the front of the footer.
                footer.insertBefore(installBtn, ghLink);
                footer.insertBefore(restartBtn, ghLink);
            } else {
                const openLatest = el("a", {
                    href: latest.htmlUrl,
                    target: "_blank",
                    rel: "noopener",
                    className: "boon-btn",
                    style: { textDecoration: "none" },
                }, `فتح ${latest.tag}`);
                footer.insertBefore(openLatest, ghLink);
            }
        } else {
            setStatus(`أنت على آخر إصدار: v${VERSION}`, ACCENT);
        }

        // Filter releases: by default only show the actionable ones (newer
        // than the installed version). When there is nothing newer, show a
        // single clear "لا توجد تحديثات" message instead of dumping the
        // entire history into the modal — that was the confusing UX the
        // user wanted gone. A small toggle lets curious users expand the
        // full history on demand.
        const newerReleases = result.releases.filter(r => updater.isNewer(r.tag, VERSION));
        const olderReleases = result.releases.filter(r => !updater.isNewer(r.tag, VERSION));

        if (newerReleases.length > 0) {
            for (const r of newerReleases) {
                body.appendChild(renderReleaseCard(r, false, true));
            }
        } else {
            body.appendChild(
                el("div", {
                    style: {
                        padding: "32px 16px",
                        textAlign: "center",
                        color: TEXT_1,
                        fontSize: "14px",
                    },
                },
                    el("div", { style: { fontSize: "28px", marginBottom: "8px" } }, "✓"),
                    el("div", {}, "لا توجد تحديثات"),
                    el("div", { style: { color: TEXT_2, fontSize: "12px", marginTop: "6px" } }, `أنت على آخر إصدار — v${VERSION}`),
                ),
            );
        }

        // Optional: expandable history of older releases for the curious.
        if (olderReleases.length > 0) {
            const histWrap = el("div", { style: { marginTop: "12px" } });
            const histBtn = el("button", {
                className: "boon-btn boon-btn-ghost",
                style: { width: "100%" },
            }, `عرض الإصدارات السابقة (${olderReleases.length})`) as HTMLButtonElement;
            const histList = el("div", { style: { marginTop: "10px", display: "none" } });
            for (const r of olderReleases) {
                const isCurrent = r.tag === `boon-v${VERSION}` || r.tag === `v${VERSION}` || r.tag === VERSION;
                histList.appendChild(renderReleaseCard(r, isCurrent, false));
            }
            let open = false;
            histBtn.addEventListener("click", () => {
                open = !open;
                histList.setAttribute("style", `margin-top: 10px; display: ${open ? "block" : "none"}`);
                histBtn.textContent = open
                    ? "إخفاء الإصدارات السابقة"
                    : `عرض الإصدارات السابقة (${olderReleases.length})`;
            });
            histWrap.appendChild(histBtn);
            histWrap.appendChild(histList);
            body.appendChild(histWrap);
        }
    })();
}

async function renderUpdater(main: HTMLElement): Promise<void> {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "التحديثات"),
                el("p", {}, "تحديثات alitravians موزّعة عبر GitHub Releases — لا خادم، لا تسجيل."),
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

        // Defensive: every error path inside fetchReleasesResult should
        // return a structured FetchResult, but the UI must not get wedged
        // in "loading" if anything below the bridge throws unexpectedly.
        // We reset the button + status no matter what happens.
        let result: updater.FetchResult;
        try {
            result = await updater.fetchReleasesResult(10);
        } catch (err) {
            result = {
                releases: [],
                error: "network",
            };
            // eslint-disable-next-line no-console
            console.error("[alitravians] fetchReleasesResult threw:", err);
        }
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

    // Primary action: open a popup modal listing all releases. The inline
    // list keeps rendering as a secondary mirror after the modal closes so
    // users who scroll the Updates tab still see the same data.
    checkBtn.addEventListener("click", () => {
        showReleasesModal(() => { void runFetch(); });
    });
    await runFetch();
}

function renderBackup(main: HTMLElement): void {
    main.appendChild(
        el("div", { className: "boon-main-header" },
            el("div", {},
                el("h2", {}, "نسخ احتياطي / استعادة"),
                el("p", {}, "تصدير كامل حالة alitravians إلى ملف JSON، أو استعادة من ملف."),
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
            }, "تصدير حالة alitravians"),
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
    { id: "home", label: "alitravians" },
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
            "alitravians",
            el("small", {}, `v${VERSION}`),
        ),
    );

    const nav = el("nav", { className: "boon-nav" });
    for (const item of NAV) {
        const btn = el(
            "button",
            {
                className: `boon-nav-item${state.view === item.id ? " is-active" : ""}`,
                onclick: () => {
                    state.view = item.id;
                    state.pluginDetailId = null;
                    state.pluginUiManagerOpen = false;
                    render();
                },
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
            else if (state.pluginUiManagerOpen) renderUiElementsManager(main);
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
    state.pluginUiManagerOpen = false;
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
