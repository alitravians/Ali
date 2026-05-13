# BOON Desktop — third-party attribution

BOON's desktop target is built on top of [Vencord](https://github.com/Vendicated/Vencord)
by Vendicated and contributors. Vencord is distributed under
[GPL-3.0-or-later](https://www.gnu.org/licenses/gpl-3.0.html), which permits
modification and redistribution provided the same license terms are kept and
attribution is preserved.

BOON is licensed under GPL-3.0-or-later — see `boon/LICENSE` (in the repo root).

## What BOON reuses from Vencord

The desktop target reuses Vencord's:

- Electron injector (`src/main.ts`, `scripts/inject/*`)
- Webpack patcher (`src/webpack/*`)
- Plugin/Settings UI shell (`src/components/PluginSettings/*`)
- Updater & Cloud sync code (`src/plugins/_core/*`)

These files retain their original copyright headers. The BOON rebrand applies
only to user-facing strings (window title, settings sidebar labels, badges,
modal titles) — it does not alter any code logic.

## Vencord copyright notice (reproduced)

```
Vencord, a Discord client mod
Copyright (c) 2022-2026 Vendicated and contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
```
