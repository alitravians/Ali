# BOON Desktop Target

BOON's desktop target runs BOON inside the Discord Desktop client (Electron). It
is built **on top of** [Vencord](https://github.com/Vendicated/Vencord)'s
Webpack patcher and Electron injection — Vencord is GPL-3.0-or-later, the same
license as BOON, so this is permitted with attribution.

There are two installation paths:

## Path A — Vesktop with BOON plugins (recommended)

[Vesktop](https://github.com/Vencord/Vesktop) is a standalone Electron wrapper
that ships Discord + Vencord pre-bundled. It is the cleanest way to use BOON on
Linux/macOS because it does not modify the official Discord install.

1. Install Vesktop from <https://vesktop.app>.
2. Clone BOON next to your Vencord source checkout.
3. From the Vencord checkout, link BOON's plugins as userplugins:
   ```bash
   cd Vencord/src
   ln -s ../../boon/src/plugins userplugins
   pnpm install
   pnpm build
   ```
4. Launch Vesktop. Open `Settings → Vencord → Plugins` and enable
   `aliThemes`, `serverTools`, `autoTranslate`, `musicPlayer`, `noNitroAds`.

> The Vencord Settings sidebar will still say "Vencord" in this path. For full
> "BOON" rebranding, follow Path B.

## Path B — Forked Vencord build with BOON rebrand

This builds Vencord from source with all UI strings replaced by "BOON". The
result is a single user-installable client mod where `Settings → BOON →
Plugins/Themes/Updater/Cloud/Backup & Restore` replaces the Vencord menu.

1. Clone Vencord:
   ```bash
   git clone https://github.com/Vendicated/Vencord.git boon-desktop
   cd boon-desktop
   ```
2. Apply BOON's rebrand by running the prepared script (see
   `rebrand.mjs` in this directory). It performs string replacements only,
   leaving Vencord's GPL-3 attribution intact in source headers.
   ```bash
   node ../../boon/src/targets/desktop/rebrand.mjs .
   ```
3. Copy BOON's plugins into `src/userplugins`:
   ```bash
   cp -r ../../boon/src/plugins src/userplugins
   ```
4. Build and inject:
   ```bash
   pnpm install
   pnpm build
   pnpm inject
   ```

After restarting Discord, the User Settings sidebar will show:

```
BOON Settings
  - BOON
  - Plugins
  - Themes
  - Updater
  - Cloud
  - Backup & Restore
  - Startup Timings
```

## License compatibility

Vencord and BOON are both GPL-3.0-or-later. The BOON desktop target's reuse of
Vencord's injector is therefore compliant. Any rebuilt binary must continue to
distribute its source under GPL-3 and credit Vencord's original authors. See
`LICENSE-NOTICE.md` in this directory for the exact attribution text BOON ships.
