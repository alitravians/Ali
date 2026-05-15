/*
 * BOON Plugin: CopyLinks
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's CopyUserURLs plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/copyUserURLs
 *
 * Adds right-click "نسخ الرابط" entries for users, channels, and servers.
 * Discord's native UI buries this under Profile → Share → Copy User URL,
 * which takes 3 clicks. Here it's a single right-click action.
 *
 * No webpack patches — relies on BOON's DOM-driven contextMenu API.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    onUsers: { type: "boolean", label: "نسخ رابط المستخدم", default: true },
    onChannels: { type: "boolean", label: "نسخ رابط القناة", default: true },
    onGuilds: { type: "boolean", label: "نسخ رابط السيرفر", default: true },
} as const satisfies SettingsSchema;

async function copy(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } finally { ta.remove(); }
    }
}

export default definePlugin({
    manifest: {
        id: "copyLinks",
        name: "CopyLinks",
        description: "نسخ سريع لروابط المستخدم/القناة/السيرفر من قائمة الزر الأيمن.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["UX", "Vencord-inspired"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        const userPatch = ctx.contextMenu.patch("user", (menuCtx, addItem) => {
            if (!ctx.settings.onUsers || !menuCtx.userId) return;
            addItem({
                id: "copyLinks:user",
                label: "نسخ رابط المستخدم",
                icon: "🔗",
                async onClick() {
                    const url = `https://discord.com/users/${menuCtx.userId}`;
                    await copy(url);
                    ctx.toast("تم نسخ رابط المستخدم", "success");
                    ctx.stats.bump("copied_user");
                },
            });
        });

        const channelPatch = ctx.contextMenu.patch("channel", (menuCtx, addItem) => {
            if (!ctx.settings.onChannels || !menuCtx.channelId || !menuCtx.guildId) return;
            addItem({
                id: "copyLinks:channel",
                label: "نسخ رابط القناة",
                icon: "🔗",
                async onClick() {
                    const url = `https://discord.com/channels/${menuCtx.guildId}/${menuCtx.channelId}`;
                    await copy(url);
                    ctx.toast("تم نسخ رابط القناة", "success");
                    ctx.stats.bump("copied_channel");
                },
            });
        });

        const guildPatch = ctx.contextMenu.patch("guild", (menuCtx, addItem) => {
            if (!ctx.settings.onGuilds || !menuCtx.guildId) return;
            addItem({
                id: "copyLinks:guild",
                label: "نسخ رابط السيرفر",
                icon: "🔗",
                async onClick() {
                    const url = `https://discord.com/channels/${menuCtx.guildId}`;
                    await copy(url);
                    ctx.toast("تم نسخ رابط السيرفر", "success");
                    ctx.stats.bump("copied_guild");
                },
            });
        });

        void userPatch; void channelPatch; void guildPatch;
        ctx.logger.info("active");
    },
    onStop(ctx) {
        ctx.logger.info("stopped");
    },
});
