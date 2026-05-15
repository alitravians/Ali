/*
 * BOON Plugin: ViewRaw
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's ViewRaw plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/viewRaw
 *
 * Right-click a message → "عرض الخام" → modal shows the message's visible data
 * (id, author, channel, timestamp, content, attachments, links).
 *
 * BOON works via DOM only — we can't access Discord's store JSON, so the modal
 * shows DOM-extracted data instead of the gateway payload. For most workflows
 * (debugging hidden chars, copy-paste IDs, inspecting attachments) this is
 * exactly as useful.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";
import { readMessageBodyText } from "../../core/discord.js";

const SCHEMA = {} as const satisfies SettingsSchema;

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

interface RawData {
    messageId: string | null;
    channelId: string | null;
    authorId: string | null;
    authorName: string | null;
    timestamp: string | null;
    content: string;
    attachments: string[];
    embeds: number;
    reactions: { emoji: string; count: string }[];
}

function extract(li: HTMLElement): RawData {
    const id = li.id; // chat-messages-<channel>-<message>
    const parts = id.split("-");
    const messageId = parts[parts.length - 1] ?? null;
    const channelId = parts[parts.length - 2] ?? null;

    const avatar = li.querySelector<HTMLImageElement>('img[src*="/avatars/"]');
    const authorMatch = avatar?.src.match(/\/avatars\/(\d+)\//);
    const authorId = authorMatch ? authorMatch[1] : null;

    const usernameEl = li.querySelector<HTMLElement>('[id^="message-username-"] span, h3 span');
    const authorName = usernameEl?.textContent?.trim() ?? null;

    const timeEl = li.querySelector<HTMLElement>("time");
    const timestamp = timeEl?.getAttribute("datetime") ?? null;

    const content = readMessageBodyText(li);

    const attachmentLinks: string[] = [];
    li.querySelectorAll<HTMLAnchorElement>('a[href*="cdn.discordapp.com/attachments/"], a[href*="media.discordapp.net/attachments/"]')
        .forEach(a => attachmentLinks.push(a.href));
    li.querySelectorAll<HTMLImageElement>('img[src*="cdn.discordapp.com/attachments/"]')
        .forEach(img => {
            if (!attachmentLinks.includes(img.src)) attachmentLinks.push(img.src);
        });

    const embeds = li.querySelectorAll('[class*="embedWrapper"], article[class*="embed"]').length;

    const reactions: { emoji: string; count: string }[] = [];
    li.querySelectorAll<HTMLElement>('[class*="reaction"][class*="reactionInner"], [aria-label*="reaction" i]')
        .forEach(r => {
            const img = r.querySelector<HTMLImageElement>("img");
            const emoji = img?.alt?.trim() || img?.getAttribute("aria-label") || "?";
            const countEl = r.querySelector<HTMLElement>('[class*="reactionCount"]');
            const count = countEl?.textContent?.trim() || "?";
            reactions.push({ emoji, count });
        });

    return { messageId, channelId, authorId, authorName, timestamp, content, attachments: attachmentLinks, embeds, reactions };
}

function buildJson(data: RawData): string {
    return JSON.stringify(data, null, 2);
}

function openModal(data: RawData, toast: (msg: string, kind: "info" | "success" | "error") => void): void {
    const existing = document.getElementById("boon-viewraw-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "boon-viewraw-modal";
    overlay.setAttribute("dir", "rtl");
    overlay.style.cssText = [
        "position:fixed", "inset:0", "z-index:100000",
        "background:rgba(0,0,0,0.6)", "display:flex",
        "align-items:center", "justify-content:center",
        "font-family:var(--font-primary,system-ui)",
    ].join(";");

    const panel = document.createElement("div");
    panel.style.cssText = [
        "background:var(--background-secondary,#2b2d31)",
        "color:var(--text-normal,#dbdee1)",
        "border-radius:8px", "padding:20px",
        "min-width:480px", "max-width:80vw", "max-height:80vh",
        "display:flex", "flex-direction:column", "gap:12px",
        "box-shadow:0 8px 32px rgba(0,0,0,0.5)",
    ].join(";");

    const json = buildJson(data);

    panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
            <h2 style="margin:0;font-size:18px;font-weight:600">عرض الرسالة الخام</h2>
            <button id="boon-viewraw-close" aria-label="إغلاق" style="background:transparent;border:0;color:inherit;font-size:24px;cursor:pointer;padding:0 8px">✕</button>
        </div>
        <pre id="boon-viewraw-pre" dir="ltr" style="margin:0;padding:12px;background:var(--background-tertiary,#1e1f22);border-radius:4px;overflow:auto;max-height:55vh;font-family:var(--font-code,monospace);font-size:12px;line-height:1.5;text-align:left;white-space:pre-wrap;word-break:break-word">${escapeHtml(json)}</pre>
        <div style="display:flex;gap:8px;justify-content:flex-end">
            <button id="boon-viewraw-copy" style="padding:6px 16px;background:var(--brand-experiment,#5865f2);color:#fff;border:0;border-radius:4px;cursor:pointer;font-size:14px">نسخ JSON</button>
            <button id="boon-viewraw-copy-id" style="padding:6px 16px;background:var(--background-modifier-accent,#3f4147);color:inherit;border:0;border-radius:4px;cursor:pointer;font-size:14px">نسخ المعرّف</button>
        </div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const close = (): void => overlay.remove();
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    panel.querySelector("#boon-viewraw-close")?.addEventListener("click", close);

    const copyText = async (text: string, label: string): Promise<void> => {
        try {
            await navigator.clipboard.writeText(text);
            toast(label, "success");
        } catch {
            toast("فشل النسخ", "error");
        }
    };

    panel.querySelector("#boon-viewraw-copy")?.addEventListener("click", () => {
        void copyText(json, "تم نسخ JSON");
    });
    panel.querySelector("#boon-viewraw-copy-id")?.addEventListener("click", () => {
        if (data.messageId) void copyText(data.messageId, "تم نسخ المعرّف");
        else toast("لا يوجد معرّف", "error");
    });

    const onKey = (e: KeyboardEvent): void => {
        if (e.key === "Escape") {
            close();
            document.removeEventListener("keydown", onKey);
        }
    };
    document.addEventListener("keydown", onKey);
}

export default definePlugin({
    manifest: {
        id: "viewRaw",
        name: "ViewRaw",
        description: "عرض البيانات الخام لأي رسالة (المعرّف، المرسل، المحتوى، المرفقات).",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["مطوّرون", "Vencord-inspired"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        ctx.contextMenu.patch("message", (menuCtx, addItem) => {
            if (!menuCtx.target) return;
            const li = menuCtx.target.closest<HTMLElement>('li[id^="chat-messages-"]');
            if (!li) return;
            addItem({
                id: "viewRaw:show",
                label: "عرض الرسالة الخام",
                icon: "📋",
                onClick() {
                    const data = extract(li);
                    openModal(data, (msg, kind) => ctx.toast(msg, kind));
                    ctx.stats.bump("opened");
                },
            });
        });
        ctx.logger.info("active");
    },
    onStop(ctx) {
        ctx.logger.info("stopped");
    },
});
