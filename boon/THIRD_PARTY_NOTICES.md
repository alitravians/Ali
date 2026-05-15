# Third-Party Notices

BOON is licensed under **GPL-3.0-or-later**. The following projects influenced
the design of BOON plugins and are credited here per their license terms.

---

## Vencord — GPL-3.0

Several BOON plugins are **inspired by** Vencord plugins. We did not copy any
Vencord source code; instead we re-implemented equivalent functionality from
scratch against BOON's own architecture (DOM-driven, no webpack patches),
following Vencord's plugin design as a reference.

- **Project:** Vencord
- **Repository:** https://github.com/Vendicated/Vencord
- **License:** GNU General Public License v3.0
- **Copyright:** (c) 2022 Vendicated and contributors

### Vencord-inspired BOON plugins

| BOON plugin | Vencord original | Notes |
|---|---|---|
| `copyLinks` | `copyUserURLs` | Right-click copy user/channel/server URLs. |
| `viewRaw` | `viewRaw` | View raw message data in a modal. DOM-extracted (no store JSON). |
| `messageLogger` | `messageLogger` / `messageLoggerEnhanced` | Track deleted/edited messages. **In-memory only**, no persistence. |
| `imageZoom` | `imageZoom` | Mouse-wheel zoom lens on lightbox images. |
| `memberCount` | `memberCount` | Online/total counters in channel header. DOM-scraped. |
| `callTimer` | `callTimer` | Elapsed-time display while in a voice call. |
| `quickCss` | `quickCss` (Monaco panel) | Custom CSS editor. Plain `<textarea>` (no Monaco). |
| `platformIndicators` | `platformIndicators` | Device icon next to users. Coverage limited without webpack patcher. |
| `whoReacted` | `whoReacted` | Hover tooltip on reactions. Partial vs Vencord (no reactor avatars). |

GPL-3.0 → GPL-3.0-or-later is forward-compatible: any code derived from
Vencord remains licensed under GPL-3.0 or later. BOON itself is GPL-3.0-or-later,
so the combined work is GPL-3.0-or-later. Anyone redistributing BOON must
preserve this notice file and the per-plugin header comments that name
Vencord as the inspiration.

### Acknowledgement

Vencord, by Vendicated and contributors, is the reference implementation in
the Discord-client-modification space. Studying its plugin catalogue informed
the prioritisation and feature shape of the BOON plugins listed above. We
recommend Vencord to users who want the full suite of mods, especially those
that require deep webpack patching.

---

## Other libraries

BOON's runtime depends only on the browser DOM and `fetch`. No third-party
runtime libraries are bundled.

Build-time dependencies (esbuild, TypeScript, rimraf, @types/node) are
declared in `boon/package.json` under `devDependencies` and are not included
in the distributed `boon.user.js` bundle.
