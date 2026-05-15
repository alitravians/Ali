/*
 * BOON Desktop renderer entry — bundled into `dist/desktop/renderer.js` and
 * `executeJavaScript`-injected into every Discord BrowserWindow by patcher.js.
 *
 * No host gate here: we are already running inside Discord Desktop's renderer
 * process, which loads `discord.com` content from its own protocol.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { installGatewayInterceptor } from "../../core/gateway/index.js";
import { boot } from "../../core/index.js";

// CRITICAL: install the gateway WebSocket interceptor as the first line of
// renderer code, BEFORE we even import the plugin barrel via `boot`. The
// interceptor wraps `window.WebSocket` so it observes Discord's gateway
// connection from the moment it opens. Any later install risks missing
// the cold-start gateway handshake (and therefore the first burst of
// TYPING_START events).
installGatewayInterceptor();

void boot("desktop");
