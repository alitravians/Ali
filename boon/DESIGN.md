# BOON — Design Notes

This document records the design decisions behind BOON v0.1.0.

The user explicitly asked for BOON to feel **close to Vencord** (familiar
sidebar, plugin cards, Updater tab) — but with BOON's own identity:

- **Arabic-first** UI (the entire interface is in Arabic; only the brand
  name "BOON" stays in English)
- **Cyber-green #00FF88** accent colour everywhere (toggles, headings,
  buttons, hover states)
- **Command palette** (Ctrl+K) on top of the sidebar — a BOON-only
  productivity layer
- **Activity log** + **Profiles** as built-in features (Vencord doesn't
  ship these out of the box)
- **Built-in plugin APIs** (DataStore / ContextMenu / MessageAccessories /
  ChatButton) that mirror Vencord's so external plugin authors feel at home

---

## ١. Layout — Vencord-style sidebar

The settings window is a modal opened with `Ctrl+Shift+B`. The left side
is a fixed sidebar with seven items, the right side renders the active
section.

```
┌── BOON ─────────────────────────────────────────────────────  [×]
│ ┌──────────────┐ ┌────────────────────────────────────────┐
│ │  BOON        │ │                                        │
│ │  الإضافات    │ │   (selected section renders here)      │
│ │  الثيمات     │ │                                        │
│ │  التحديثات   │ │                                        │
│ │  الملفات     │ │                                        │
│ │  السجل       │ │                                        │
│ │  نسخ احتياطي │ │                                        │
│ └──────────────┘ └────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────
```

Every label is in Arabic. The selected sidebar item is highlighted with
cyber-green (`#00FF88`) on the left edge and a slightly lighter
background.

---

## ٢. Colour palette (cyber-green theme)

| Token | Value | Where it's used |
|-------|-------|-----------------|
| `--boon-accent` | `#00FF88` | Toggle "on", selected sidebar item, primary buttons, link colour |
| `--boon-accent-dim` | `#00cc6e` | Hover state for buttons / focused inputs |
| `--boon-accent-soft` | `rgba(0,255,136,0.12)` | Backgrounds for selected plugin cards, accessory blocks |
| `--boon-bg` | `var(--background-primary)` | Main panel background (matches Discord theme) |
| `--boon-bg-elevated` | `var(--background-secondary)` | Sidebar, plugin cards |
| `--boon-text` | `var(--text-normal)` | Body text |
| `--boon-text-dim` | `var(--text-muted)` | Descriptions, timestamps |
| `--boon-border` | `var(--background-modifier-accent)` | Card outlines, sidebar divider |

BOON inherits Discord's `--background-*` and `--text-*` variables so it
respects whatever Discord theme the user has selected (light / dark /
custom). Only the **accent** is BOON's own.

---

## ٣. Why "close to Vencord" instead of original?

The user explicitly chose familiarity over novelty:

> الاداة استاذ ديفن لازم تكون قريبه من اداة Vencord
> ("BOON must be close to Vencord")

This makes sense because:
1. Most BOON users will be Discord power users who already know Vencord.
2. A familiar sidebar reduces the learning curve to zero.
3. Plugin authors who write for Vencord can port plugins to BOON with
   minimal changes (same APIs, same ctx shape, same lifecycle).

What we **kept** from Vencord:
- Sidebar layout with named tabs
- Per-plugin cards with toggle + settings button
- `Plugins` / `Themes` / `Updater` / `Backup & Restore` tabs
- `definePlugin({ manifest, onStart, onStop })` API shape
- `..command` chat prefix system
- Updater reads GitHub Releases

What we **added** that Vencord doesn't have:
- Sidebar items: **الملفات الشخصية** (Profiles), **السجل المباشر** (Activity)
- **Command palette** (`Ctrl+K`) — searches plugins/commands/settings
- **Per-plugin live stats** on each card (counters + last-used timestamp)
- **Cyber-green** accent (Vencord uses Discord's blurple `#5865F2`)
- **Arabic-first** every label and toast

What we **changed** intentionally:
- No "Cloud" tab (no cloud sync — BOON is local-first by design)
- No "Startup Timings" tab (replaced by Activity which is much more useful)

---

## ٤. Plugin API design

BOON ships four plugin APIs that match Vencord's surface in name and shape
but use DOM observation instead of webpack patches. This lets the same
plugin run in **all three targets** (userscript / extension / desktop)
unchanged.

### DataStore
Per-plugin IndexedDB namespace. Async key/value store. Used by
`autoTranslate` to cache translations indefinitely.

### ContextMenu
Right-click patcher. Detects message/user/channel/guild context via DOM
traversal (`closest()` on `[id^="chat-messages-"]`, `[class*="member"]`,
etc.) and injects items into Discord's native context menu element with
the same hover styling.

### MessageAccessories
Hooks each new chat message via MutationObserver and lets plugins render
DOM nodes below the message content (where Discord's own embeds appear).
Used by `autoTranslate` so translations look like a native embed.

### ChatButton
Injects a toolbar button into Discord's composer (next to the
emoji/gif/sticker buttons). Used by `musicPlayer` so users can toggle
the player without typing `..music`.

These four APIs are documented with full TypeScript types in
`src/core/types.ts` and runnable examples in `DEVELOPER.md`.

### Effect tracking

Every effect a plugin acquires (event handler, injected style, registered
command, context menu patch, message accessory, chat button) is pushed
onto a per-plugin cleanup stack. When `onStop` is called (or when the
plugin crashes during `onStart`), every effect is reversed automatically.
**Plugins cannot leak listeners or DOM nodes.**

---

## ٥. Storage layout

BOON does not run a server. Everything is local:

| Storage | Used for | Lives in |
|---------|---------|---------|
| `localStorage` `BOON:settings` | Plugin enable/disable + per-plugin settings | Browser/Electron |
| `localStorage` `BOON:profiles` | Named snapshots of settings+enabled | Browser/Electron |
| `localStorage` `BOON:lastVersion` | Updater's "last seen" version | Browser/Electron |
| `IndexedDB` `BOON-DataStore` | Per-plugin DataStore (translations cache, playlists, …) | Browser/Electron |
| `dist/boon.user.js` (userscript) | Tampermonkey reads `@updateURL` and auto-pulls latest | Tampermonkey storage |

Vencord uses the same approach (`Vencord.Settings`, IndexedDB-backed
`DataStore`). We follow the same convention so users porting from
Vencord don't have to re-learn storage.

---

## ٦. Update mechanism

BOON does not host its own update server. Distribution flows through
GitHub:

```
┌─────────────────────────────────────────────────┐
│  GitHub: alitravians/Ali  (the only origin)     │
│  ├── boon/dist/boon.user.js   ← userscript     │
│  ├── boon/dist/extension/*    ← extension zip   │
│  ├── boon/dist/desktop/*      ← desktop bundle  │
│  └── Releases → tags + changelog                │
└──────────────────┬──────────────────────────────┘
                   │  HTTPS only, no auth
                   ▼
            ┌──────────────┐
            │     BOON     │  reads /releases/latest
            │  (on device) │  every 6 hours
            └──────────────┘
```

- **Userscript**: Tampermonkey reads the `@updateURL` header in
  `boon.user.js` every 24h.
- **Extension**: When published to a store, the store handles updates.
  Off-store, the Updater tab polls `GET /repos/.../releases/latest`.
- **Desktop**: Updater tab provides a "Check now" + "Update now" button
  that downloads the latest release asset and triggers a relaunch.

---

## ٧. Why no central server?

- **Privacy**: Per-user settings stay on the user's device. No telemetry,
  no analytics, no shadow profiles.
- **Cost**: GitHub Pages + Releases is free for an unlimited number of
  users.
- **Reliability**: No single point of failure outside GitHub itself.
- **Compliance**: Discord ToS makes user-token use a grey area; running
  a central server would centralise risk. Local-only means each user
  controls their own data.

If a user wants to sync profiles between devices, they export the
profile JSON (which is just text) and import it on another device.
v0.3 may add an opt-in GitHub Gist sync, but never a BOON-operated
server.

---

## ٨. Security boundaries

Each plugin runs inside a try/catch boundary in `pluginManager.ts`:

```
┌─ pluginManager
│  for (plugin of plugins) {
│      try {
│          plugin.onStart(ctx);            // ← isolated
│      } catch (err) {
│          plugin.crashed = true;          // ← won't start again
│          logger.error("plugin failed", err);
│      }
│  }
└──
```

A crashing plugin **never** brings down BOON. The Activity log records
the failure with a stack trace so the user can disable the offending
plugin.

Strict TypeScript catches the rest: no `any`, no implicit casts, no
unchecked optional access.

---

## ٩. Non-goals (explicit)

- **Not** a Vencord fork. We don't share code with Vencord (apart from
  the GPL-3 Electron patcher reference in Desktop target, with credits).
- **Not** a Discord bot — BOON modifies the **client**, not the server.
- **Not** a hosted service. No accounts, no cloud, no analytics.
- **Not** "selfbot automation". BOON does not auto-respond, auto-react,
  or simulate human behaviour. It only acts on explicit user input.
