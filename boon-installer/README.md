# BOON Desktop Installer

Cross-platform **GUI** installer that patches the official Discord Desktop
client so BOON loads on startup. Works on Windows, macOS, and Linux.

> **Architecture credit**: This installer is adapted from
> [VencordInstaller](https://github.com/Vencord/Installer) (© Vendicated and
> contributors, GPL-3.0). See `../boon/src/targets/desktop/LICENSE-NOTICE.md`.

## What it does

1. Opens a window listing every Discord branch detected on the machine
   (Stable / PTB / Canary / Development).
2. The user picks a branch and clicks one of three buttons:
   - **Install** — patches a vanilla Discord install with BOON.
   - **Repair / Reinstall** — re-writes the stub asar and refreshes BOON's
     runtime files (useful after a BOON upgrade or a broken patch).
   - **Uninstall** — restores the original `app.asar` byte-for-byte.
3. Before patching, the installer **terminates any running Discord process**
   for the selected branch (taskkill on Windows, pkill on Unix), so the
   `app.asar` swap never collides with file locks.
4. After a successful patch / unpatch, the installer **relaunches Discord**
   automatically. The user sees the result immediately — no extra steps.

The patcher itself works exactly like before: a tiny stub `app.asar` that
`require()`s BOON's `patcher.js`, which boots vanilla Discord then injects
`renderer.js` into every Discord window.

## Embedded runtime

The installer binary now **embeds `patcher.js` + `renderer.js` directly**
(see [`runtime_embed.go`](runtime_embed.go) and [`runtime/`](runtime/)) via
Go's `//go:embed`. No network calls happen during install, so users are not
affected by GitHub API rate-limits (which produced HTTP 403 in earlier
versions).

The release CI workflow copies the freshly-built runtime files into
`boon-installer/runtime/` before invoking `go build`.

## Usage

The default build is the GUI. Pass `-cli` to force the terminal flow (useful
for scripted / headless installs):

```bash
./boon-installer                  # opens the GUI window
./boon-installer -cli -list       # list detected installs and exit
./boon-installer -cli -patch -yes
./boon-installer -cli -unpatch -yes
```

Environment variables:
- `BOON_DATA_DIR` — override where runtime files are written
  (defaults to `%APPDATA%/BOON`, `~/Library/Application Support/BOON`,
  `~/.config/BOON`).
- `BOON_LOCAL_BUILD_DIR` — copy `patcher.js`/`renderer.js` from this local
  directory instead of using the embedded copy (useful during development
  when you want to iterate on BOON's runtime without rebuilding the
  installer). Point it at `boon/dist/desktop`.

## Build from source

```bash
# 1. Build BOON's runtime so it's available to embed.
cd boon && npm ci && npm run build
mkdir -p ../boon-installer/runtime
cp dist/desktop/patcher.js  ../boon-installer/runtime/
cp dist/desktop/renderer.js ../boon-installer/runtime/

# 2. Build the installer (requires CGO + an OpenGL/X11 toolchain).
cd ../boon-installer
go build -o boon-installer .
```

Cross-compiling the GUI binary requires the matching native toolchain
because giu / imgui-go link against C++ and OpenGL:

| Target            | Toolchain                                                     |
|-------------------|---------------------------------------------------------------|
| `linux/amd64`     | host `gcc` + `libgl1-mesa-dev libx{cursor,inerama,randr,i}-dev` |
| `windows/amd64`   | `gcc-mingw-w64-x86-64 g++-mingw-w64-x86-64`, build with `-ldflags "-H windowsgui"` |
| `darwin/{amd64,arm64}` | Apple Clang (provided by `macos-latest` GitHub runner)    |

The release pipeline at `.github/workflows/boon-release.yml` automates this
for all four (OS × arch) combinations whenever a tag matching `boon-v*` is
pushed, and uploads the binaries plus the runtime files (`patcher.js`,
`renderer.js`, `boon.user.js`) to the GitHub Release.

For a CGO-free CI sanity-check build (no GUI), add `-tags cliOnly`:

```bash
go build -tags cliOnly -o boon-installer-cli .
```

## Disclaimers

- Modifying Discord's client may violate Discord's Terms of Service. Use at
  your own risk.
- This installer ships **without code-signing certificates** because BOON is a
  zero-budget project. On first run:
  - **Windows** shows a SmartScreen warning (click `More info` → `Run anyway`,
    once).
  - **macOS** requires `Right-click → Open` (once).
  - **Linux** has no warning.
- All edits are reversible: click `Uninstall` (or run `./boon-installer -cli
  -unpatch -yes`) to restore Discord's original `app.asar` byte-for-byte.

## License

GPL-3.0-or-later. See repository root `LICENSE` and
`boon/src/targets/desktop/LICENSE-NOTICE.md` for attribution.
