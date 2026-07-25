---
name: testing-boon-desktop
description: Live end-to-end testing of the alitravians (boon) Discord Desktop mod. Use when testing changes to the desktop patcher, renderer, plugins, settings UI, or anything that affects Discord-Desktop runtime behavior. Covers install / re-install / version checking / Ctrl+R reload reproduction.
---

# Testing alitravians on Discord Desktop

## What this mod is

alitravians (formerly BOON) is an Electron-side modification of Discord
Desktop. The desktop installer renames Discord's `app.asar` to
`_app.asar` and writes a tiny stub `app.asar` whose `index.js` does
`require("/home/<user>/.config/alitravians/patcher.js")`. When Discord
starts, the stub loads the main-process `patcher.js`, which then runs
the renderer-side `renderer.js` inside the Discord window via
`executeJavaScript`.

Two independent versions matter:
- `PATCHER_VERSION` — main-process code (rarely changes)
- renderer/UI version — UX, plugins, settings (changes often)

## File map

| Path | Role |
|------|------|
| `boon/src/targets/desktop/runtime/patcher.js` | Main-process loader. Sets `PATCHER_VERSION`, the `injectInto` hook, IPC allowlist, self-update receiver `BOON_STAGE_PATCHER`. |
| `boon/src/core/version.ts` + `boon/package.json` | User-facing UI version. |
| `boon/dist/desktop/{patcher.js,renderer.js}` | Output of `npm run build:desktop`. Pickup target for `BOON_LOCAL_BUILD_DIR`. |
| `boon-installer/` | Go CLI that patches Discord. `cli.go` has `-cli -patch -yes` / `-cli -unpatch -yes`. |
| `boon-installer/runtime_embed.go` | Reads `BOON_LOCAL_BUILD_DIR` to skip the embedded blobs and pick up freshly-built dist files. |
| `~/.config/alitravians/patcher.js` | Currently-installed patcher (the thing Discord actually loads). |
| `~/.config/alitravians/renderer.js` | Currently-installed renderer. |
| `~/.config/alitravians/state.json` | Tracks lastDownloadedVersion / lastPromotedVersion for the self-update pipeline. |
| `~/.config/discord/app-<ver>/resources/app.asar` | After patching: tiny stub that requires patcher.js. Before patching / after Discord auto-update: vanilla Discord asar. |
| `~/.config/discord/app-<ver>/resources/_app.asar` | Backup of Discord's original asar (present only on patched installs). |

## Quick health check

```bash
grep PATCHER_VERSION ~/.config/alitravians/patcher.js
cat ~/.config/alitravians/state.json
ls -la ~/.config/discord/app-*/resources/
pgrep -fa /home/ubuntu/.config/discord/app   # check which Discord version is running
```

If `resources/` contains only `app.asar` (no `_app.asar`) the install is
vanilla — Discord likely auto-updated and overwrote the patched stub.
Re-patch before testing.

## Re-patching after Discord auto-update

Discord silently auto-updates to a new versioned folder
(e.g. `app-1.0.137` → `app-1.0.138`) and the new version has a vanilla
asar. The mod is then absent on next launch — this looks identical to
the "Ctrl+R wiped it" bug but is a different root cause.

Re-patch with the freshly-built local dist:

```bash
cd /home/ubuntu/repos/Ali/boon && npm run typecheck && npm run build:desktop
cd /home/ubuntu/repos/Ali/boon-installer && \
  BOON_LOCAL_BUILD_DIR=/home/ubuntu/repos/Ali/boon/dist/desktop \
  go run -tags cliOnly . -cli -patch -yes
```

The `-tags cliOnly` build is GUI-free (no GTK / X11 prereqs needed) and
is what CI uses. The installer auto-launches Discord after patching.

## Discord login on a fresh launch

Every cold start can require re-login. Required secrets:

- `DISCORD_TEST_EMAIL_V2` — primary login email/phone
- `DISCORD_TEST_PASSWORD_V2` — password
- `_2FA_DISCORD_TEST_V2` — TOTP secret (optional; current test accounts
  don't require 2FA)

Devin Secrets are env vars, but `computer.act` `type` does not expand
shell variables — it types literally. Use the shell exec route instead:

```bash
xdotool windowactivate <discord_window_id>
xdotool type --delay 30 -- "$DISCORD_TEST_EMAIL_V2"
xdotool key Tab
xdotool type --delay 30 -- "$DISCORD_TEST_PASSWORD_V2"
```

Discord sometimes shows hCaptcha on new fingerprints — this is a hard
blocker for automated login. If it appears, ask the user to log in once
manually, or warm up the session before killing/restarting Discord.

## Verifying the mod is actually loaded

The most reliable visual signal is the **alitravians** group in the
left sidebar of User Settings (Ctrl+,). It sits between the Billing
group and the Experience group and contains: Home, Plugins, Themes,
Updates, Profiles, Activity, Backup.

For a machine-checkable signal, open DevTools (Ctrl+Shift+I) → Console.
After a fresh page load (cold start or Ctrl+R) the renderer prints lines
like:

```
[alitravians] core native settings: observer installed
[alitravians] aliThemes started
[alitravians] autoTranslate started
[alitravians] core ready — open Discord User Settings to find BOON, …
```

If you see zero `[alitravians]` lines in a fresh console, the renderer
did not inject and you should not trust any other observation.

## Self-update pipeline (how users get fixes)

Users don't re-run the installer for ordinary updates. The running
patcher periodically calls `boon/src/core/updater.ts` which:

1. Fetches the latest GitHub Release tag (`boon-vX.Y.Z`).
2. Downloads `patcher.js` + `renderer.js` to `~/.config/alitravians/`.
3. If the downloaded `PATCHER_VERSION` is newer than the running
   patcher's version, calls `BOON_STAGE_PATCHER` (main-process IPC).
   That writes `patcher.next.js` and the next Discord launch swaps it
   in over `patcher.js`.
4. `state.json` records `lastDownloadedVersion` and
   `lastPromotedVersion`.

So a renderer-only change ships on next Discord launch after the
release workflow finishes. A patcher change takes one extra launch
(stage → promote). Discord auto-update wiping the asar requires a full
re-install — that's an installer-level concern, not a runtime concern.

## Common testing patterns

### Pattern: prove a runtime fix

1. Reproduce the bug on the *currently installed* (pre-fix) version.
   Capture screenshots / console output as the "control".
2. Either:
   - copy the freshly-built `patcher.js` / `renderer.js` directly over
     `~/.config/alitravians/{patcher,renderer}.js` (renderer-only
     changes — Ctrl+R picks them up) **or**
   - re-run the installer with `BOON_LOCAL_BUILD_DIR` (patcher changes
     — Discord must fully restart to pick them up).
3. Repeat the exact same reproduction steps. Diff the results.

### Pattern: verify the install path

1. `go run -tags cliOnly . -cli -patch -yes` from `boon-installer/`
   with `BOON_LOCAL_BUILD_DIR` set.
2. Check `resources/` contains both `app.asar` (stub) and `_app.asar`
   (backup).
3. Launch Discord, log in, open User Settings, look for alitravians
   group.

### Pattern: regression-test Ctrl+R

1. Verify alitravians visible in User Settings → Esc.
2. Ctrl+R, wait ~3s.
3. Re-open User Settings. The alitravians group must still be there.
4. Optional adversarial step: open DevTools, Ctrl+R again, watch the
   full `[alitravians]` boot log appear in the fresh console session.

## Recording tips

- Maximize Discord first:
  `sudo apt-get install -y wmctrl 2>/dev/null; wmctrl -i -r <id> -b add,maximized_vert,maximized_horz`
- Always include the precondition state in the recording (alitravians
  visible BEFORE the action you're testing). A test that only shows
  "after" state is not adversarial — a broken mod also has no
  alitravians group.
- Annotate each test_start with an `It should …` style name and
  annotate the precondition + final result as separate assertions.

## Out of scope for this skill

- Web-extension targets (`boon/src/targets/extension/`) — different
  runtime, different injection path.
- Server-side / boon-community-bot — entirely separate codebase.
- AutoTranslate API behavior — covered by Eclipse server / DM with
  alitravians live testing, not by this skill.

## Devin Secrets needed

- `DISCORD_TEST_EMAIL_V2` (user scope)
- `DISCORD_TEST_PASSWORD_V2` (user scope)
- `_2FA_DISCORD_TEST_V2` (user scope, optional)
