/*
 * BOON Plugin: ShowHiddenChannels — styles
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Single exported `STYLE` string injected via `ctx.injectStyle` on plugin
 * start. All selectors are namespaced with `boon-shc-` so they can't leak
 * into Discord's stylesheet rules.
 */

export const STYLE_ID = "boon-shc-style";

export const STYLE = `
    /* ─── Floating launcher button (top of channel list) ───────────────── */
    .boon-shc-launch {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin: 0 8px;
        padding: 4px 10px;
        background: var(--background-modifier-accent, #3f4147);
        color: var(--text-normal, #dbdee1);
        border: 1px solid transparent;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        user-select: none;
        transition: background 120ms ease, transform 80ms ease;
    }
    .boon-shc-launch:hover {
        background: var(--background-modifier-hover, #4e5058);
        border-color: var(--background-modifier-selected, #5d5f66);
    }
    .boon-shc-launch:active { transform: scale(0.97); }
    .boon-shc-launch[data-count="0"] { opacity: 0.45; }
    .boon-shc-launch-icon { font-size: 13px; }
    .boon-shc-launch-count {
        font-variant-numeric: tabular-nums;
        background: var(--brand-experiment, #5865f2);
        color: #fff;
        border-radius: 999px;
        padding: 0 6px;
        min-width: 16px;
        text-align: center;
    }
    .boon-shc-launch[data-count="0"] .boon-shc-launch-count { display: none; }

    /* ─── Floating fallback ────────────────────────────────────────────── */
    /* Used when no proper channel-list header is reachable (Discord DOM
       reshuffles, new A/B build, etc.). Anchored to the sidebar's
       top-right corner so it's always discoverable. */
    .boon-shc-launch.boon-shc-launch--floating {
        /* Reset the 0 8px margin the base style applies; in floating mode
           the launcher is absolutely positioned, so any margin would add
           to the explicit top/right offsets and push the button further
           from the sidebar edge than we intended. */
        margin: 0;
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 50;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    }

    /* ─── Modal backdrop + container ───────────────────────────────────── */
    .boon-shc-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99998;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: boon-shc-fade-in 120ms ease both;
    }
    @keyframes boon-shc-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    .boon-shc-modal {
        width: min(720px, 92vw);
        max-height: min(720px, 88vh);
        display: flex;
        flex-direction: column;
        background: var(--background-primary, #313338);
        color: var(--text-normal, #dbdee1);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        direction: rtl;
        font-family: var(--font-primary, "gg sans"), system-ui, sans-serif;
        animation: boon-shc-pop 140ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    @keyframes boon-shc-pop {
        from { transform: translateY(8px) scale(0.98); opacity: 0; }
        to   { transform: translateY(0)    scale(1);    opacity: 1; }
    }

    /* ─── Header ───────────────────────────────────────────────────────── */
    .boon-shc-header {
        padding: 14px 18px;
        background: var(--background-secondary, #2b2d31);
        border-bottom: 1px solid var(--background-tertiary, #1e1f22);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .boon-shc-header h2 {
        flex: 1;
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--header-primary, #f2f3f5);
    }
    .boon-shc-header .boon-shc-subtitle {
        font-size: 12px;
        color: var(--text-muted, #949ba4);
        margin-top: 2px;
    }
    .boon-shc-close {
        appearance: none;
        background: transparent;
        border: 0;
        color: var(--interactive-normal, #b5bac1);
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        font-size: 18px;
        line-height: 1;
    }
    .boon-shc-close:hover {
        background: var(--background-modifier-hover, #4e5058);
        color: var(--interactive-hover, #dbdee1);
    }
    .boon-shc-back {
        appearance: none;
        background: transparent;
        border: 0;
        color: var(--text-link, #00a8fc);
        cursor: pointer;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 13px;
    }
    .boon-shc-back:hover { background: var(--background-modifier-hover, #4e5058); }

    /* ─── Toolbar (search + filters + sort) ────────────────────────────── */
    .boon-shc-toolbar {
        display: flex;
        gap: 8px;
        padding: 10px 14px;
        background: var(--background-secondary-alt, #232428);
        border-bottom: 1px solid var(--background-tertiary, #1e1f22);
        flex-wrap: wrap;
    }
    .boon-shc-search {
        flex: 1;
        min-width: 160px;
        padding: 6px 10px;
        background: var(--input-background, #1e1f22);
        color: var(--text-normal, #dbdee1);
        border: 1px solid transparent;
        border-radius: 4px;
        font-size: 13px;
        outline: none;
    }
    .boon-shc-search:focus { border-color: var(--brand-experiment, #5865f2); }
    .boon-shc-sort {
        padding: 6px 8px;
        background: var(--input-background, #1e1f22);
        color: var(--text-normal, #dbdee1);
        border: 1px solid transparent;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
    }
    .boon-shc-tabs {
        display: flex;
        gap: 4px;
        padding: 0 14px 8px;
        background: var(--background-secondary-alt, #232428);
        border-bottom: 1px solid var(--background-tertiary, #1e1f22);
        overflow-x: auto;
    }
    .boon-shc-tab {
        appearance: none;
        background: transparent;
        color: var(--interactive-normal, #b5bac1);
        border: 0;
        padding: 5px 12px;
        font-size: 12px;
        border-radius: 999px;
        cursor: pointer;
        white-space: nowrap;
    }
    .boon-shc-tab:hover { color: var(--interactive-hover, #dbdee1); background: var(--background-modifier-hover, #4e5058); }
    .boon-shc-tab[aria-selected="true"] {
        background: var(--brand-experiment, #5865f2);
        color: #fff;
    }

    /* ─── List ─────────────────────────────────────────────────────────── */
    .boon-shc-body {
        flex: 1;
        overflow-y: auto;
        padding: 6px 0;
    }
    .boon-shc-empty {
        padding: 32px 18px;
        text-align: center;
        color: var(--text-muted, #949ba4);
        font-size: 13px;
        line-height: 1.6;
    }
    .boon-shc-degraded {
        margin: 12px 14px;
        padding: 10px 12px;
        background: var(--status-warning-background, rgba(248, 165, 78, 0.1));
        color: var(--status-warning, #f8a54e);
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid var(--status-warning, #f8a54e);
    }
    .boon-shc-category-header {
        padding: 8px 18px 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--channels-default, #949ba4);
        letter-spacing: 0.02em;
    }
    .boon-shc-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 18px;
        cursor: pointer;
        font-size: 14px;
        color: var(--channels-default, #949ba4);
        border-inline-start: 3px solid transparent;
    }
    .boon-shc-row:hover {
        background: var(--background-modifier-hover, #4e5058);
        color: var(--interactive-hover, #dbdee1);
        border-inline-start-color: var(--brand-experiment, #5865f2);
    }
    .boon-shc-row-icon {
        width: 18px;
        text-align: center;
        font-size: 12px;
        opacity: 0.75;
    }
    .boon-shc-row-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .boon-shc-row-meta {
        font-size: 11px;
        color: var(--text-muted, #6d6f78);
        font-variant-numeric: tabular-nums;
    }
    .boon-shc-row-badge {
        background: var(--status-danger, #f23f43);
        color: #fff;
        font-size: 9px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 3px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    /* ─── Details view ─────────────────────────────────────────────────── */
    .boon-shc-details {
        padding: 16px 18px;
        font-size: 13px;
        line-height: 1.55;
    }
    .boon-shc-details h3 {
        margin: 0 0 6px;
        font-size: 18px;
        font-weight: 600;
        color: var(--header-primary, #f2f3f5);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .boon-shc-details-section {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--background-tertiary, #1e1f22);
    }
    .boon-shc-details-section:first-of-type { border-top: 0; padding-top: 0; margin-top: 8px; }
    .boon-shc-details-label {
        font-size: 11px;
        text-transform: uppercase;
        color: var(--text-muted, #949ba4);
        font-weight: 600;
        letter-spacing: 0.04em;
        margin-bottom: 4px;
    }
    .boon-shc-details-value {
        color: var(--text-normal, #dbdee1);
        word-break: break-word;
    }
    .boon-shc-pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
    }
    .boon-shc-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: var(--background-modifier-accent, #3f4147);
        border-radius: 999px;
        font-size: 12px;
    }
    .boon-shc-pill[data-kind="allow"]  { background: rgba(35, 165, 90, 0.18); color: #4ade80; }
    .boon-shc-pill[data-kind="deny"]   { background: rgba(242, 63, 67, 0.18); color: #f87171; }
    .boon-shc-pill[data-kind="member"] { background: rgba(88, 101, 242, 0.18); color: #a5b4fc; }
    .boon-shc-pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.7;
    }
    .boon-shc-copy {
        appearance: none;
        background: transparent;
        border: 1px solid var(--background-modifier-accent, #3f4147);
        color: var(--interactive-normal, #b5bac1);
        padding: 3px 8px;
        font-size: 11px;
        border-radius: 4px;
        cursor: pointer;
    }
    .boon-shc-copy:hover { background: var(--background-modifier-hover, #4e5058); color: var(--interactive-hover, #dbdee1); }
`;
