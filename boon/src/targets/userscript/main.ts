/*
 * BOON Userscript entry — runs on https://discord.com via Tampermonkey/Violentmonkey
 * or as the page-script payload of the browser extension. Pure DOM, no GM_* APIs.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { boot } from "../../core/index.js";

if (location.host.endsWith("discord.com") || location.host.endsWith("discordapp.com")) {
    void boot("userscript");
} else {
    // eslint-disable-next-line no-console
    console.warn("[BOON] not on discord.com — bailing out");
}
