/*
 * BOON Desktop bootstrap — the contents of the patched `app.asar` index.js.
 *
 * The installer writes this file (substituting %PATCHER_PATH% with the absolute
 * path to BOON's `patcher.js` on disk) into a freshly-built `app.asar` that
 * replaces Discord's original. Electron loads it on startup, which `require()`s
 * the real patcher and from there the original Discord asar.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
require("%PATCHER_PATH%");
