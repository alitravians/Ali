/*
 * BOON Userscript entry — runs on https://discord.com via Tampermonkey/Violentmonkey
 * or as the page-script payload of the browser extension. Pure DOM, no GM_* APIs.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { boot } from "../../core/index.js";

/**
 * Strict host match — we deliberately do not use `endsWith("discord.com")`
 * because that would also match `evil-discord.com`. Discord's real hosts are
 * the bare domains and their subdomains under them.
 */
function isDiscordHost(host: string): boolean {
    return (
        host === "discord.com" ||
        host.endsWith(".discord.com") ||
        host === "discordapp.com" ||
        host.endsWith(".discordapp.com")
    );
}

if (isDiscordHost(location.host)) {
    void boot("userscript");
} else {
    // eslint-disable-next-line no-console
    console.warn("[BOON] not on discord.com — bailing out");
}
