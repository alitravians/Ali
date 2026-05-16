/*
 * BOON Plugin: ShowHiddenChannels — styles
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Single exported `STYLE` string injected via `ctx.injectStyle` on plugin
 * start. All selectors are namespaced with `boon-shc-` so they can't leak
 * into Discord's stylesheet rules. Theming pulls from Discord's CSS
 * custom properties (`--background-primary`, `--brand-experiment`, …)
 * with hard-coded fallbacks so the panel still looks right when injected
 * before Discord's stylesheets finish loading.
 *
 * Design system tokens (all `--boon-shc-*`) sit at the top so themers
 * can override one variable to retint the whole panel.
 */

export const STYLE_ID = "boon-shc-style";

export const STYLE = `
    .boon-shc-backdrop {
        /* Design tokens — single source of truth for the panel's look. */
        --boon-shc-brand:        #5865f2;
        --boon-shc-brand-soft:   rgba(88, 101, 242, 0.18);
        --boon-shc-brand-strong: #4752c4;
        --boon-shc-accent:       #a78bfa;
        --boon-shc-surface-0:    var(--background-primary, #313338);
        --boon-shc-surface-1:    var(--background-secondary, #2b2d31);
        --boon-shc-surface-2:    var(--background-secondary-alt, #232428);
        --boon-shc-surface-3:    var(--background-tertiary, #1e1f22);
        --boon-shc-text:         var(--text-normal, #dbdee1);
        --boon-shc-text-strong:  var(--header-primary, #f2f3f5);
        --boon-shc-text-muted:   var(--text-muted, #949ba4);
        --boon-shc-text-faint:   var(--channels-default, #80848e);
        --boon-shc-border:       rgba(255, 255, 255, 0.06);
        --boon-shc-border-strong:rgba(255, 255, 255, 0.12);
        --boon-shc-allow:        #23a55a;
        --boon-shc-deny:         #f23f43;
        --boon-shc-warning:      #f8a54e;
        --boon-shc-radius-sm:    6px;
        --boon-shc-radius-md:    10px;
        --boon-shc-radius-lg:    14px;
        --boon-shc-shadow-card:  0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 1px 2px rgba(0, 0, 0, 0.25);
        --boon-shc-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    /* ─── Launcher button (top of channel list) ────────────────────────── */
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
        transition: background 120ms ease, transform 80ms ease, border-color 120ms ease;
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
        background: #5865f2;
        color: #fff;
        border-radius: 999px;
        padding: 0 6px;
        min-width: 16px;
        text-align: center;
    }
    .boon-shc-launch[data-count="0"] .boon-shc-launch-count { display: none; }
    .boon-shc-launch.boon-shc-launch--floating {
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
        background: rgba(0, 0, 0, 0.62);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: boon-shc-fade-in 140ms ease both;
    }
    @keyframes boon-shc-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    .boon-shc-modal {
        width: min(780px, 94vw);
        max-height: min(780px, 90vh);
        display: flex;
        flex-direction: column;
        background: var(--boon-shc-surface-0);
        color: var(--boon-shc-text);
        border-radius: var(--boon-shc-radius-lg);
        box-shadow:
            0 0 0 1px var(--boon-shc-border),
            0 24px 48px -12px rgba(0, 0, 0, 0.55),
            0 8px 24px rgba(0, 0, 0, 0.35);
        overflow: hidden;
        direction: rtl;
        font-family: var(--font-primary, "gg sans"), system-ui, sans-serif;
        animation: boon-shc-pop 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    @keyframes boon-shc-pop {
        from { transform: translateY(12px) scale(0.97); opacity: 0; }
        to   { transform: translateY(0)    scale(1);    opacity: 1; }
    }

    /* ─── Header ───────────────────────────────────────────────────────── */
    .boon-shc-header {
        padding: 14px 18px;
        background: var(--boon-shc-surface-1);
        border-bottom: 1px solid var(--boon-shc-border);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .boon-shc-header h2 {
        flex: 1;
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        color: var(--boon-shc-text-strong);
        letter-spacing: -0.01em;
    }
    .boon-shc-header .boon-shc-subtitle {
        font-size: 12px;
        color: var(--boon-shc-text-muted);
        margin-top: 3px;
    }
    .boon-shc-close {
        appearance: none;
        background: transparent;
        border: 0;
        color: var(--interactive-normal, #b5bac1);
        cursor: pointer;
        width: 30px;
        height: 30px;
        border-radius: var(--boon-shc-radius-sm);
        font-size: 18px;
        line-height: 1;
        transition: background 120ms ease;
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
        padding: 4px 10px;
        border-radius: var(--boon-shc-radius-sm);
        font-size: 13px;
        font-weight: 500;
        transition: background 120ms ease;
    }
    .boon-shc-back:hover { background: var(--background-modifier-hover, #4e5058); }

    /* ─── Toolbar (search + filters + sort) ────────────────────────────── */
    .boon-shc-toolbar {
        display: flex;
        gap: 8px;
        padding: 12px 14px;
        background: var(--boon-shc-surface-2);
        border-bottom: 1px solid var(--boon-shc-border);
        flex-wrap: wrap;
        align-items: center;
    }
    .boon-shc-search-wrap {
        flex: 1;
        min-width: 200px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        background: var(--input-background, #1e1f22);
        border: 1px solid transparent;
        border-radius: var(--boon-shc-radius-sm);
        transition: border-color 140ms ease, box-shadow 140ms ease;
    }
    .boon-shc-search-wrap:focus-within {
        border-color: var(--boon-shc-brand);
        box-shadow: 0 0 0 3px var(--boon-shc-brand-soft);
    }
    .boon-shc-search-icon {
        font-size: 13px;
        color: var(--boon-shc-text-faint);
        flex-shrink: 0;
    }
    .boon-shc-search {
        flex: 1;
        padding: 8px 0;
        background: transparent;
        color: var(--boon-shc-text);
        border: 0;
        font-size: 13px;
        outline: none;
    }
    .boon-shc-search::placeholder { color: var(--boon-shc-text-faint); }
    .boon-shc-search-kbd {
        font-family: var(--font-code, "Source Code Pro"), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 600;
        color: var(--boon-shc-text-faint);
        background: var(--boon-shc-surface-3);
        border: 1px solid var(--boon-shc-border);
        border-radius: 3px;
        padding: 1px 5px;
        line-height: 1;
        flex-shrink: 0;
    }
    .boon-shc-search-wrap:focus-within .boon-shc-search-kbd { display: none; }

    .boon-shc-sort {
        padding: 7px 10px;
        background: var(--input-background, #1e1f22);
        color: var(--boon-shc-text);
        border: 1px solid transparent;
        border-radius: var(--boon-shc-radius-sm);
        font-size: 13px;
        cursor: pointer;
        transition: border-color 140ms ease;
    }
    .boon-shc-sort:hover { border-color: var(--boon-shc-border-strong); }
    .boon-shc-sort:focus { outline: none; border-color: var(--boon-shc-brand); }

    .boon-shc-icon-btn {
        appearance: none;
        width: 34px;
        height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--input-background, #1e1f22);
        color: var(--boon-shc-text-muted);
        border: 1px solid transparent;
        border-radius: var(--boon-shc-radius-sm);
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
    }
    .boon-shc-icon-btn:hover {
        border-color: var(--boon-shc-border-strong);
        color: var(--boon-shc-text);
    }
    .boon-shc-icon-btn[data-active="true"] {
        background: var(--boon-shc-brand-soft);
        color: var(--boon-shc-accent);
        border-color: rgba(167, 139, 250, 0.4);
    }
    .boon-shc-icon-btn-glyph { font-size: 18px; line-height: 1; }

    /* ─── Tabs ─────────────────────────────────────────────────────────── */
    .boon-shc-tabs {
        display: flex;
        gap: 4px;
        padding: 0 14px 10px;
        background: var(--boon-shc-surface-2);
        border-bottom: 1px solid var(--boon-shc-border);
        overflow-x: auto;
        scrollbar-width: thin;
    }
    .boon-shc-tab {
        appearance: none;
        background: transparent;
        color: var(--interactive-normal, #b5bac1);
        border: 0;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 500;
        border-radius: 999px;
        cursor: pointer;
        white-space: nowrap;
        transition: background 120ms ease, color 120ms ease;
    }
    .boon-shc-tab:hover {
        color: var(--interactive-hover, #dbdee1);
        background: var(--background-modifier-hover, #4e5058);
    }
    .boon-shc-tab[aria-selected="true"] {
        background: var(--boon-shc-brand);
        color: #fff;
    }

    /* ─── Body ─────────────────────────────────────────────────────────── */
    .boon-shc-body {
        flex: 1;
        overflow-y: auto;
        padding: 14px 14px 18px;
        scrollbar-width: thin;
    }
    .boon-shc-body--details { padding-top: 0; }
    .boon-shc-body::-webkit-scrollbar { width: 8px; }
    .boon-shc-body::-webkit-scrollbar-thumb {
        background: var(--boon-shc-border-strong);
        border-radius: 4px;
    }
    .boon-shc-body::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.18); }

    .boon-shc-degraded {
        margin: 0 0 12px;
        padding: 10px 12px;
        background: rgba(248, 165, 78, 0.1);
        color: var(--boon-shc-warning);
        border-radius: var(--boon-shc-radius-sm);
        font-size: 12px;
        border: 1px solid rgba(248, 165, 78, 0.5);
    }

    /* ─── Server overview (type chips strip) ───────────────────────────── */
    .boon-shc-overview { margin-bottom: 14px; }
    .boon-shc-overview-chips {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    .boon-shc-chip {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px 6px 10px;
        background: var(--boon-shc-surface-2);
        color: var(--boon-shc-text);
        border: 1px solid var(--boon-shc-border);
        border-radius: var(--boon-shc-radius-md);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: background 140ms ease, border-color 140ms ease, transform 80ms ease;
    }
    .boon-shc-chip:hover {
        background: var(--boon-shc-surface-1);
        border-color: var(--boon-shc-border-strong);
    }
    .boon-shc-chip:active { transform: translateY(1px); }
    .boon-shc-chip[data-active="true"] {
        background: var(--boon-shc-brand-soft);
        border-color: rgba(88, 101, 242, 0.5);
        color: #c7d2fe;
    }
    .boon-shc-chip-icon { font-size: 13px; opacity: 0.85; }
    .boon-shc-chip-label { letter-spacing: -0.01em; }
    .boon-shc-chip-count {
        font-variant-numeric: tabular-nums;
        background: var(--boon-shc-surface-3);
        color: var(--boon-shc-text-muted);
        padding: 1px 7px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
    }
    .boon-shc-chip[data-active="true"] .boon-shc-chip-count {
        background: rgba(88, 101, 242, 0.35);
        color: #fff;
    }

    /* ─── Recently viewed strip ────────────────────────────────────────── */
    .boon-shc-recents { margin-bottom: 14px; }
    .boon-shc-recents-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--boon-shc-text-muted);
        margin-bottom: 6px;
    }
    .boon-shc-recents-title-icon { font-size: 12px; }
    .boon-shc-recents-strip {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    .boon-shc-recent {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        background: var(--boon-shc-surface-2);
        color: var(--boon-shc-text);
        border: 1px solid var(--boon-shc-border);
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
        max-width: 220px;
        transition: background 140ms ease, border-color 140ms ease;
    }
    .boon-shc-recent:hover {
        background: var(--boon-shc-surface-1);
        border-color: var(--boon-shc-brand);
    }
    .boon-shc-recent-icon { font-size: 11px; opacity: 0.7; }
    .boon-shc-recent-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* ─── Category headers + channel cards ─────────────────────────────── */
    .boon-shc-category-header {
        padding: 14px 4px 6px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--boon-shc-text-muted);
        letter-spacing: 0.06em;
    }
    .boon-shc-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .boon-shc-card {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px 12px;
        background: var(--boon-shc-surface-1);
        border: 1px solid var(--boon-shc-border);
        border-radius: var(--boon-shc-radius-md);
        cursor: pointer;
        outline: none;
        transition: background 120ms ease, border-color 120ms ease, transform 80ms ease, box-shadow 140ms ease;
        box-shadow: var(--boon-shc-shadow-card);
    }
    .boon-shc-card:hover {
        background: var(--boon-shc-surface-2);
        border-color: var(--boon-shc-brand);
        box-shadow: var(--boon-shc-shadow-hover);
    }
    .boon-shc-card:focus-visible {
        border-color: var(--boon-shc-brand);
        box-shadow: 0 0 0 3px var(--boon-shc-brand-soft);
    }
    .boon-shc-card:active { transform: translateY(1px); }
    .boon-shc-card-head {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .boon-shc-card-icon {
        width: 22px;
        text-align: center;
        font-size: 13px;
        opacity: 0.75;
        color: var(--boon-shc-text-faint);
        flex-shrink: 0;
    }
    .boon-shc-card-name-wrap {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .boon-shc-card-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--boon-shc-text-strong);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .boon-shc-card-parent {
        font-size: 11px;
        color: var(--boon-shc-text-faint);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .boon-shc-card-tags {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
        flex-wrap: wrap;
        justify-content: flex-end;
    }
    .boon-shc-card-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 11px;
        color: var(--boon-shc-text-muted);
        font-variant-numeric: tabular-nums;
        padding-inline-start: 32px;
        flex-wrap: wrap;
    }
    .boon-shc-card-time::before { content: "🕐  "; opacity: 0.7; }
    .boon-shc-card-access::before { content: "🔑  "; opacity: 0.7; }
    .boon-shc-card-pills {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        padding-inline-start: 32px;
    }

    /* ─── Tags (kind/NSFW/slow) ────────────────────────────────────────── */
    .boon-shc-tag {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        font-size: 10px;
        font-weight: 600;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        line-height: 1.4;
    }
    .boon-shc-tag--kind {
        background: var(--boon-shc-surface-3);
        color: var(--boon-shc-text-muted);
        border: 1px solid var(--boon-shc-border);
    }
    .boon-shc-tag--nsfw {
        background: rgba(242, 63, 67, 0.18);
        color: #fca5a5;
        border: 1px solid rgba(242, 63, 67, 0.4);
    }
    .boon-shc-tag--slow {
        background: rgba(248, 165, 78, 0.12);
        color: var(--boon-shc-warning);
        border: 1px solid rgba(248, 165, 78, 0.3);
        text-transform: none;
    }

    /* ─── Empty state ──────────────────────────────────────────────────── */
    .boon-shc-empty {
        padding: 36px 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        color: var(--boon-shc-text-muted);
        font-size: 13px;
        line-height: 1.6;
        text-align: center;
    }
    .boon-shc-empty-art {
        opacity: 0.55;
        filter: saturate(0.7);
    }
    .boon-shc-empty-text { max-width: 320px; }
    .boon-shc-lock-svg {
        display: block;
        filter: drop-shadow(0 6px 20px rgba(88, 101, 242, 0.25));
    }

    /* ─── Details view ─────────────────────────────────────────────────── */
    .boon-shc-details {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 16px 0 0;
    }

    /* Hero — gradient card with the channel's identity + jump button */
    .boon-shc-hero {
        position: relative;
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 20px 22px;
        background:
            radial-gradient(circle at 100% 0%, rgba(167, 139, 250, 0.25) 0%, transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(88, 101, 242, 0.22) 0%, transparent 55%),
            linear-gradient(135deg, #2b2d31 0%, #232428 100%);
        border: 1px solid var(--boon-shc-border-strong);
        border-radius: var(--boon-shc-radius-lg);
        overflow: hidden;
    }
    .boon-shc-hero::before {
        /* subtle diagonal sheen so the hero feels lit */
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%);
        pointer-events: none;
    }
    .boon-shc-hero-art {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .boon-shc-hero-meat {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: relative;
    }
    .boon-shc-hero-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }
    .boon-shc-hero-icon {
        font-size: 16px;
        color: var(--boon-shc-text-muted);
    }
    .boon-shc-hero-name {
        font-size: 22px;
        font-weight: 700;
        color: var(--boon-shc-text-strong);
        letter-spacing: -0.015em;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .boon-shc-hero-sub {
        font-size: 13px;
        color: var(--boon-shc-text);
        opacity: 0.85;
    }
    .boon-shc-hero-time {
        font-size: 12px;
        color: var(--boon-shc-text-muted);
        font-variant-numeric: tabular-nums;
    }
    .boon-shc-hero-time strong {
        color: var(--boon-shc-text);
        font-weight: 600;
    }
    .boon-shc-hero-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    /* Buttons */
    .boon-shc-btn {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        border-radius: var(--boon-shc-radius-sm);
        cursor: pointer;
        border: 1px solid transparent;
        transition: background 140ms ease, transform 80ms ease, box-shadow 140ms ease;
    }
    .boon-shc-btn:active { transform: translateY(1px); }
    .boon-shc-btn--primary {
        background: linear-gradient(135deg, #5865f2 0%, #4752c4 100%);
        color: #fff;
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.15) inset, 0 2px 8px rgba(88, 101, 242, 0.35);
    }
    .boon-shc-btn--primary:hover {
        background: linear-gradient(135deg, #6975f5 0%, #535fd1 100%);
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.18) inset, 0 4px 14px rgba(88, 101, 242, 0.5);
    }
    .boon-shc-btn-icon { font-size: 12px; }

    /* Info grid (type/category/position/activity) */
    .boon-shc-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 8px;
    }
    .boon-shc-info-cell {
        padding: 10px 12px;
        background: var(--boon-shc-surface-1);
        border: 1px solid var(--boon-shc-border);
        border-radius: var(--boon-shc-radius-sm);
    }
    .boon-shc-info-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--boon-shc-text-faint);
        margin-bottom: 4px;
    }
    .boon-shc-info-value {
        font-size: 13px;
        color: var(--boon-shc-text-strong);
        font-weight: 500;
        word-break: break-word;
    }

    /* Panes (topic / allowed / denied / IDs) */
    .boon-shc-pane {
        background: var(--boon-shc-surface-1);
        border: 1px solid var(--boon-shc-border);
        border-radius: var(--boon-shc-radius-md);
        overflow: hidden;
    }
    .boon-shc-pane-title {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 11px 14px;
        font-size: 13px;
        font-weight: 600;
        color: var(--boon-shc-text-strong);
        border-bottom: 1px solid var(--boon-shc-border);
        background: rgba(255, 255, 255, 0.015);
    }
    .boon-shc-pane-icon { font-size: 14px; line-height: 1; }
    .boon-shc-pane-icon--allow { color: var(--boon-shc-allow); }
    .boon-shc-pane-icon--deny  { color: var(--boon-shc-deny); }
    .boon-shc-pane-count {
        margin-inline-start: auto;
        font-size: 11px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        background: var(--boon-shc-surface-3);
        color: var(--boon-shc-text-muted);
        padding: 1px 8px;
        border-radius: 999px;
    }
    .boon-shc-pane-body {
        padding: 12px 14px;
        font-size: 13px;
        color: var(--boon-shc-text);
        line-height: 1.6;
        word-break: break-word;
    }
    .boon-shc-pane--allow {
        border-color: rgba(35, 165, 90, 0.32);
        box-shadow: inset 4px 0 0 0 rgba(35, 165, 90, 0.55);
    }
    .boon-shc-pane--allow .boon-shc-pane-title {
        background: rgba(35, 165, 90, 0.08);
        border-bottom-color: rgba(35, 165, 90, 0.22);
    }
    .boon-shc-pane--deny {
        border-color: rgba(242, 63, 67, 0.32);
        box-shadow: inset 4px 0 0 0 rgba(242, 63, 67, 0.55);
    }
    .boon-shc-pane--deny .boon-shc-pane-title {
        background: rgba(242, 63, 67, 0.08);
        border-bottom-color: rgba(242, 63, 67, 0.22);
    }
    .boon-shc-access-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 10px;
    }

    /* Permission pills */
    .boon-shc-pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 10px 14px;
    }
    .boon-shc-pane--allow .boon-shc-pill-row,
    .boon-shc-pane--deny  .boon-shc-pill-row { padding-top: 12px; }
    .boon-shc-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: var(--boon-shc-surface-3);
        color: var(--boon-shc-text);
        border: 1px solid var(--boon-shc-border-strong);
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    /* Pill colouring fallback when no inline role-colour was applied. The
     * :not([style*=background]) clause keeps inline-styled (real role
     * colour) pills untouched, and the data-kind selectors must be
     * specific enough to win over data-owner so that a deny pill stays
     * red whether it points at a role or a member. We pair each member
     * variant with its kind explicitly to avoid a cascade tie where the
     * generic member rule would otherwise paint deny pills blue. */
    .boon-shc-pill[data-kind="allow"]:not([style*="background"]) {
        background: rgba(35, 165, 90, 0.18);
        color: #4ade80;
        border-color: rgba(35, 165, 90, 0.38);
    }
    .boon-shc-pill[data-kind="deny"]:not([style*="background"]) {
        background: rgba(242, 63, 67, 0.18);
        color: #f87171;
        border-color: rgba(242, 63, 67, 0.38);
    }
    .boon-shc-pill[data-owner="member"][data-kind="allow"]:not([style*="background"]) {
        background: rgba(88, 101, 242, 0.18);
        color: #c7d2fe;
        border-color: rgba(88, 101, 242, 0.42);
    }
    .boon-shc-pill[data-owner="member"][data-kind="deny"]:not([style*="background"]) {
        background: rgba(242, 63, 67, 0.18);
        color: #fda4af;
        border-color: rgba(242, 63, 67, 0.42);
    }
    .boon-shc-pill--compact {
        padding: 3px 8px;
        font-size: 11px;
    }
    .boon-shc-pill--more {
        background: transparent !important;
        border-style: dashed;
        color: var(--boon-shc-text-faint) !important;
        font-variant-numeric: tabular-nums;
    }
    .boon-shc-pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.85;
        flex-shrink: 0;
    }

    /* Copy rows (IDs / link) */
    .boon-shc-copy-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
    }
    .boon-shc-copy-row + .boon-shc-copy-row {
        border-top: 1px solid var(--boon-shc-border);
    }
    .boon-shc-copy-row-label {
        flex-shrink: 0;
        width: 110px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--boon-shc-text-faint);
    }
    .boon-shc-copy-row-body {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .boon-shc-copy-row-value {
        flex: 1;
        min-width: 0;
        font-family: var(--font-code, "Source Code Pro"), ui-monospace, monospace;
        font-size: 12px;
        color: var(--boon-shc-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        direction: ltr;
        text-align: start;
    }
    .boon-shc-copy {
        appearance: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: var(--boon-shc-surface-3);
        border: 1px solid var(--boon-shc-border-strong);
        color: var(--boon-shc-text-muted);
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 500;
        border-radius: var(--boon-shc-radius-sm);
        cursor: pointer;
        flex-shrink: 0;
        transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
    }
    .boon-shc-copy:hover {
        background: var(--boon-shc-brand-soft);
        color: #c7d2fe;
        border-color: var(--boon-shc-brand);
    }
    .boon-shc-copy-icon { font-size: 13px; line-height: 1; }
`;
