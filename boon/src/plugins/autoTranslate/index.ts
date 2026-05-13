/*
 * BOON Plugin: AutoTranslate
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Translate a message via either:
 *   1. Google Translate's free public endpoint (no API key, default)
 *   2. Google Gemini API (user-supplied key)
 *
 * Trigger:
 *   - Right-click a message → "ترجم الرسالة" via BOON ContextMenu API.
 *   - The `..tr <text>` command translates arbitrary text.
 *
 * Results render as a MessageAccessory under the original message so they
 * follow Discord's own embed layout and survive re-renders.
 *
 * Translations are cached in the per-plugin DataStore (IndexedDB) keyed by
 * `<service>:<targetLang>:<sourceText>` so repeated translations are instant.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    service: {
        type: "select",
        label: "خدمة الترجمة",
        description: "Google = مجاني بدون مفتاح، Gemini = يحتاج API key.",
        default: "google",
        options: [
            { label: "Google Translate (مجاني)", value: "google" },
            { label: "Gemini (يحتاج مفتاح)", value: "gemini" },
        ],
    },
    targetLang: {
        type: "select",
        label: "اللغة الهدف",
        default: "ar",
        options: [
            { label: "العربية", value: "ar" },
            { label: "English", value: "en" },
            { label: "Türkçe", value: "tr" },
            { label: "Français", value: "fr" },
            { label: "Deutsch", value: "de" },
            { label: "Español", value: "es" },
            { label: "中文", value: "zh-CN" },
            { label: "日本語", value: "ja" },
        ],
    },
    geminiApiKey: {
        type: "string",
        label: "Gemini API Key",
        description: "مطلوب فقط لو اخترت Gemini.",
        default: "",
        placeholder: "AIza...",
    },
    cacheTranslations: {
        type: "boolean",
        label: "احفظ الترجمات في الذاكرة المحلية",
        description: "نفس النص لا يُترجم مرتين — يأخذ من IndexedDB.",
        default: true,
    },
} as const satisfies SettingsSchema;

interface TranslationResult {
    text: string;
    sourceLang?: string;
}

async function translateGoogle(text: string, target: string): Promise<TranslationResult> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        target,
    )}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
    const data = (await res.json()) as [Array<[string, string]>, ...unknown[]];
    const sentences = data[0] || [];
    return {
        text: sentences.map(s => s[0]).join(""),
        sourceLang: (data[2] as string | undefined) ?? undefined,
    };
}

async function translateGemini(
    text: string,
    target: string,
    apiKey: string,
): Promise<TranslationResult> {
    if (!apiKey) throw new Error("لم تضع Gemini API key في الإعدادات");
    const labels: Record<string, string> = {
        ar: "Arabic",
        en: "English",
        tr: "Turkish",
        fr: "French",
        de: "German",
        es: "Spanish",
        "zh-CN": "Simplified Chinese",
        ja: "Japanese",
    };
    const targetLabel = labels[target] ?? target;
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `Translate the following message into ${targetLabel}. Reply with ONLY the translation, no quotes or commentary:\n\n${text}`,
                            },
                        ],
                    },
                ],
            }),
        },
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const out = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!out) throw new Error("استجابة Gemini فارغة");
    return { text: out };
}

function buildTranslationNode(translation: string, sourceLang?: string): HTMLElement {
    const node = document.createElement("div");
    node.style.cssText =
        "padding:8px 10px;border-radius:6px;background:rgba(0,255,136,0.10);border-inline-start:3px solid #00ff88;font-size:0.95em;color:var(--text-normal,#dbdee1);direction:auto;";
    const header = document.createElement("small");
    header.style.cssText = "opacity:0.65;display:block;margin-bottom:2px;";
    header.textContent = sourceLang ? `🌐 ${sourceLang} → الترجمة` : "🌐 الترجمة";
    const body = document.createElement("div");
    body.textContent = translation;
    node.appendChild(header);
    node.appendChild(body);
    return node;
}

export default definePlugin({
    manifest: {
        id: "autoTranslate",
        name: "AutoTranslate",
        description:
            "ترجمة الرسائل عبر القائمة (الزر الأيمن) — Google أو Gemini. النتائج تظهر تحت الرسالة وتُحفظ في الذاكرة.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["ترجمة", "AI"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        const pendingTranslations = new Map<string, string>();

        async function translate(text: string): Promise<TranslationResult> {
            const service = ctx.settings.service;
            const target = ctx.settings.targetLang;
            const cacheKey = `${service}:${target}:${text}`;
            if (ctx.settings.cacheTranslations) {
                const cached = await ctx.dataStore.get<TranslationResult>(cacheKey);
                if (cached) return cached;
            }
            const result =
                service === "gemini"
                    ? await translateGemini(text, target, ctx.settings.geminiApiKey)
                    : await translateGoogle(text, target);
            if (ctx.settings.cacheTranslations) {
                await ctx.dataStore.set(cacheKey, result);
            }
            return result;
        }

        // Context menu item — opens on right-click of a message.
        ctx.contextMenu.patch("message", (menuCtx, addItem) => {
            if (!menuCtx.messageId) return;
            addItem({
                id: "autoTranslate:translate",
                label: "ترجم الرسالة",
                icon: "🌐",
                async onClick() {
                    const msgEl = document.getElementById(
                        `chat-messages-${menuCtx.channelId}-${menuCtx.messageId}`,
                    ) as HTMLElement | null;
                    if (!msgEl || !menuCtx.messageId) return;
                    const contentEl = msgEl.querySelector<HTMLElement>('div[id^="message-content-"]');
                    const text = contentEl?.textContent?.trim() ?? "";
                    if (!text) {
                        ctx.toast("الرسالة فارغة", "error");
                        return;
                    }
                    ctx.toast("جاري الترجمة…", "info");
                    try {
                        const result = await translate(text);
                        pendingTranslations.set(menuCtx.messageId, JSON.stringify(result));
                        ctx.messageAccessories.remove("autoTranslate");
                        // Force re-add for this specific message:
                        const accessory = buildTranslationNode(result.text, result.sourceLang);
                        accessory.classList.add("boon-accessory");
                        accessory.dataset.boonAccId = "autoTranslate";
                        const host =
                            msgEl.querySelector<HTMLElement>(".boon-accessory-host") ??
                            (() => {
                                const parent = msgEl.querySelector<HTMLElement>(
                                    'div[id^="message-content-"]',
                                );
                                if (!parent) return null;
                                const h = document.createElement("div");
                                h.className = "boon-accessory-host";
                                h.style.cssText = "display:flex;flex-direction:column;gap:4px;margin-top:4px;";
                                parent.appendChild(h);
                                return h;
                            })();
                        host?.querySelector('[data-boon-acc-id="autoTranslate"]')?.remove();
                        host?.appendChild(accessory);
                        ctx.stats.bump("messages_translated");
                    } catch (err) {
                        ctx.logger.error("translation failed", err);
                        ctx.toast(`فشل: ${(err as Error).message}`, "error");
                    }
                },
            });
        });

        ctx.registerCommand({
            name: "tr",
            description: "ترجم نصاً مباشرة.",
            args: [{ name: "text", required: true }],
            async execute(args) {
                const text = args.join(" ");
                if (!text) {
                    ctx.toast("..tr <نص>", "error");
                    return;
                }
                try {
                    const result = await translate(text);
                    ctx.toast(result.text, "success");
                    ctx.stats.bump("messages_translated");
                } catch (err) {
                    ctx.toast(`فشل: ${(err as Error).message}`, "error");
                }
            },
        });

        ctx.registerCommand({
            name: "tr-clear-cache",
            description: "امسح ذاكرة الترجمات.",
            hidden: false,
            async execute() {
                await ctx.dataStore.clear();
                ctx.toast("تم مسح ذاكرة الترجمات", "success");
            },
        });

        ctx.logger.info("ready — right-click any message");
    },
    onStop(ctx) {
        ctx.messageAccessories.remove("autoTranslate");
        ctx.logger.info("stopped");
    },
});
