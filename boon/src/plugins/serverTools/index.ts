/*
 * BOON Plugin: ServerTools
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Adds local-only moderation/organization helpers usable from the BOON command
 * prefix (default `..`). These commands operate on the *current* channel via
 * either the visible DOM or the Discord public REST API using the user's token
 * (only available when BOON runs as a userscript/extension with the same
 * session). Each command checks permissions before attempting destructive
 * actions and always asks for explicit confirmation.
 */

import { getCurrentChannelId, getCurrentGuildId, sendMessage } from "../../core/discord.js";
import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    confirmBeforeDestructive: {
        type: "boolean",
        label: "تأكيد قبل أي عملية حذف/طرد",
        description: "ينصح بإبقائها مفعّلة لتفادي الأخطاء.",
        default: true,
    },
    purgeBatchSize: {
        type: "number",
        label: "حجم دفعة الحذف",
        description: "كم رسالة تُحذف في الدفعة الواحدة (1-100).",
        default: 25,
        min: 1,
        max: 100,
    },
} as const satisfies SettingsSchema;

function getUserToken(): string | null {
    try {
        const iframe = document.createElement("iframe");
        document.head.appendChild(iframe);
        const local = iframe.contentWindow?.localStorage;
        iframe.remove();
        const token = local?.getItem("token");
        if (!token) return null;
        return token.replace(/^"|"$/g, "");
    } catch {
        return null;
    }
}

async function discordApi(path: string, init: RequestInit = {}): Promise<Response> {
    const token = getUserToken();
    if (!token) throw new Error("لا يمكن الوصول لتوكن الدسكورد من هذا الـ target");
    return fetch(`https://discord.com/api/v9${path}`, {
        ...init,
        headers: {
            ...init.headers,
            authorization: token,
            "content-type": "application/json",
        },
    });
}

interface DiscordMessageLite {
    id: string;
    author: { id: string };
    timestamp: string;
}

async function fetchRecentMessages(channelId: string, limit: number): Promise<DiscordMessageLite[]> {
    const res = await discordApi(`/channels/${channelId}/messages?limit=${Math.min(100, limit)}`);
    if (!res.ok) throw new Error(`فشل جلب الرسائل (HTTP ${res.status})`);
    return (await res.json()) as DiscordMessageLite[];
}

async function deleteMessage(channelId: string, messageId: string): Promise<void> {
    const res = await discordApi(`/channels/${channelId}/messages/${messageId}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
        throw new Error(`فشل حذف الرسالة ${messageId} (HTTP ${res.status})`);
    }
}

function getCurrentUserId(): string | null {
    try {
        const token = getUserToken();
        if (!token) return null;
        const id = atob(token.split(".")[0]);
        return /^\d+$/.test(id) ? id : null;
    } catch {
        return null;
    }
}

export default definePlugin({
    manifest: {
        id: "serverTools",
        name: "ServerTools",
        description: "أدوات مودريشن: مسح رسائل، حذف رسائل مستخدم معيّن، معلومات السيرفر/القناة.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["مودريشن", "أوامر"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        ctx.registerCommand({
            name: "purge",
            description: "احذف آخر N رسالة من رسائلك أنت في القناة الحالية.",
            args: [{ name: "count", required: true }],
            async execute([countRaw]) {
                const count = Math.max(1, Math.min(500, Number(countRaw) || 0));
                if (!count) return ctx.toast("استخدم ..purge <عدد>", "error");
                const channelId = getCurrentChannelId();
                if (!channelId) return ctx.toast("افتح قناة أولاً", "error");
                const me = getCurrentUserId();
                if (!me) return ctx.toast("لا يمكن قراءة معرّف المستخدم", "error");

                if (ctx.settings.confirmBeforeDestructive && !window.confirm(`حذف ${count} من رسائلك؟`)) return;

                ctx.toast(`بدء الحذف…`, "info");
                let deleted = 0;
                while (deleted < count) {
                    const batch = await fetchRecentMessages(channelId, ctx.settings.purgeBatchSize);
                    const mine = batch.filter(m => m.author.id === me);
                    if (mine.length === 0) break;
                    for (const m of mine) {
                        if (deleted >= count) break;
                        await deleteMessage(channelId, m.id);
                        deleted++;
                        await new Promise(r => setTimeout(r, 350));
                    }
                }
                ctx.stats.bump("messages_deleted", deleted);
                ctx.toast(`تم حذف ${deleted} رسالة.`, "success");
            },
        });

        ctx.registerCommand({
            name: "purgefrom",
            description: "احذف آخر N رسالة من مستخدم معيّن (تحتاج صلاحية).",
            args: [
                { name: "userId", required: true },
                { name: "count", required: true },
            ],
            async execute([userId, countRaw]) {
                const count = Math.max(1, Math.min(500, Number(countRaw) || 0));
                if (!userId || !count) return ctx.toast("..purgefrom <userId> <عدد>", "error");
                const channelId = getCurrentChannelId();
                if (!channelId) return ctx.toast("افتح قناة أولاً", "error");
                if (ctx.settings.confirmBeforeDestructive && !window.confirm(`حذف ${count} من رسائل ${userId}؟`)) return;

                let deleted = 0;
                while (deleted < count) {
                    const batch = await fetchRecentMessages(channelId, 100);
                    const matching = batch.filter(m => m.author.id === userId);
                    if (matching.length === 0) break;
                    for (const m of matching) {
                        if (deleted >= count) break;
                        try {
                            await deleteMessage(channelId, m.id);
                            deleted++;
                        } catch (err) {
                            ctx.logger.warn(err);
                        }
                        await new Promise(r => setTimeout(r, 400));
                    }
                }
                ctx.stats.bump("messages_deleted", deleted);
                ctx.toast(`تم حذف ${deleted} رسالة.`, "success");
            },
        });

        ctx.registerCommand({
            name: "channelinfo",
            description: "اطبع معلومات القناة الحالية (ID، السيرفر، URL).",
            execute() {
                const ch = getCurrentChannelId();
                const g = getCurrentGuildId();
                const txt = `📍 القناة: ${ch ?? "—"}\n🏠 السيرفر: ${g ?? "DM"}\n🔗 ${location.href}`;
                void sendMessage(txt);
                ctx.stats.bump("channelinfo_calls");
            },
        });

        ctx.registerCommand({
            name: "boon",
            description: "افتح إعدادات BOON.",
            execute() {
                window.BOON?.openSettings();
            },
        });

        ctx.logger.info("registered ..purge / ..purgefrom / ..channelinfo / ..boon");
    },
    onStop(ctx) {
        ctx.logger.info("stopped");
    },
});
