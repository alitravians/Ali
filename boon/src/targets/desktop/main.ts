/*
 * BOON Desktop renderer entry — bundled into `dist/desktop/renderer.js` and
 * `executeJavaScript`-injected into every Discord BrowserWindow by patcher.js.
 *
 * No host gate here: we are already running inside Discord Desktop's renderer
 * process, which loads `discord.com` content from its own protocol.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { boot } from "../../core/index.js";

void boot("desktop");
