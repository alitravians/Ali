# BOON Desktop Installer

CLI installer that patches the official Discord Desktop client so BOON loads
on startup. Works on Windows, macOS, and Linux (incl. Flatpak).

> **Architecture credit**: This installer is adapted from
> [VencordInstaller](https://github.com/Vencord/Installer) (© Vendicated and
> contributors, GPL-3.0). See `../boon/src/targets/desktop/LICENSE-NOTICE.md`.

## What it does

1. Detects every Discord install on the machine (Stable / PTB / Canary /
   Development; Windows / macOS / Linux; native / Flatpak).
2. Backs up Discord's `resources/app.asar` to `resources/_app.asar`.
3. Writes a tiny stub `app.asar` whose only contents are
   `index.js → require("/path/to/BOON/patcher.js")`.
4. Downloads BOON's runtime (`patcher.js` + `renderer.js`) into
   `~/.config/BOON/` (or `%APPDATA%/BOON` on Windows, `~/Library/Application
   Support/BOON` on macOS) — only if not already present.

When Discord starts after a patch:
- `patcher.js` (main process) re-points `require.main.filename` at the original
  `_app.asar` so vanilla Discord boots normally, then registers a
  `browser-window-created` hook that runs `renderer.js` inside every Discord
  window's renderer process via `webContents.executeJavaScript`.
- `renderer.js` is the same BOON bundle the userscript target produces (boot →
  plugin manager → settings UI), minus the discord.com host gate (we're
  already inside Discord).

## Usage

```bash
./boon-installer            # interactive menu: patch / unpatch / quit
./boon-installer -list      # just list detected Discord installs
./boon-installer -patch -yes
./boon-installer -unpatch -yes
```

Environment variables:
- `BOON_DATA_DIR` — override where runtime files are stored.
- `BOON_LOCAL_BUILD_DIR` — copy `patcher.js`/`renderer.js` from this local
  directory instead of downloading from GitHub Releases. Useful for development
  (point at `boon/dist/desktop`).

## Build from source

```bash
cd boon-installer
go build -o boon-installer .
```

Cross-compilation works out of the box because we don't use cgo:

```bash
GOOS=windows GOARCH=amd64 go build -o boon-installer-windows-amd64.exe .
GOOS=darwin  GOARCH=arm64 go build -o boon-installer-macos-arm64 .
GOOS=linux   GOARCH=amd64 go build -o boon-installer-linux-amd64 .
```

The release pipeline at `.github/workflows/boon-release.yml` automates this
for all six (OS × arch) combinations whenever a tag matching `boon-v*` is
pushed, and uploads the binaries plus the runtime files (`patcher.js`,
`renderer.js`, `boon.user.js`) to the GitHub Release.

## Disclaimers

- Modifying Discord's client may violate Discord's Terms of Service. Use at
  your own risk.
- This installer ships **without code-signing certificates** because BOON is a
  zero-budget project. On first run:
  - **Windows** shows a SmartScreen warning (click `More info` → `Run anyway`,
    once).
  - **macOS** requires `Right-click → Open` (once).
  - **Linux** has no warning.
- All edits are reversible: `boon-installer -unpatch` restores Discord's
  original `app.asar` byte-for-byte.

## License

GPL-3.0-or-later. See repository root `LICENSE` and
`boon/src/targets/desktop/LICENSE-NOTICE.md` for attribution.
