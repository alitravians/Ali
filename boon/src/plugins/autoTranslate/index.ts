/*
 * BOON Plugin: AutoTranslate
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Two complementary modes:
 *
 *   1. AUTO (default): every newly-rendered message that looks like it is
 *      written in a non-Arabic language is silently translated. The result
 *      renders as a small subtitle directly under the original message —
 *      visible only to the user running this plugin (it lives in the local
 *      DOM, it is never sent back to Discord).
 *
 *   2. MANUAL: right-click any message → "ترجم الرسالة" forces a translation.
 *      The `..tr <text>` command translates arbitrary text into a toast.
 *
 * Translation provider:
 *   - Google Translate's free public endpoint (no API key, default).
 *   - Google Gemini API (user-supplied key) for higher-quality output.
 *
 * Privacy:
 *   - Translations are computed locally in the browser/desktop client; the
 *     only network egress is the request to the chosen translation service.
 *   - Discord never sees the translated text — it never leaves this client.
 *
 * Performance:
 *   - Results are cached in the per-plugin DataStore (IndexedDB) keyed by
 *     `<service>:<targetLang>:<sourceText>` so the same sentence is never
 *     re-translated.
 *   - Short messages, code blocks, URLs, mentions and emoji-only messages
 *     are skipped before any network request happens.
 *
 * Scoping:
 *   - Per-server and per-channel whitelist/blacklist. Defaults to "everywhere".
 *   - "skip authors" list for users you never want translated (e.g. yourself).
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    autoMode: {
        type: "boolean",
        label: "ترجمة تلقائية للرسائل الأجنبية",
        description:
            "كل رسالة واردة بلغة غير عربية تُترجم تلقائياً وتظهر تحتها بالعربية. التعطيل يُبقي الترجمة اليدوية (الزر الأيمن) فقط.",
        default: true,
    },
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
    minLength: {
        type: "number",
        label: "أقل عدد أحرف للترجمة",
        description: "الرسائل الأقصر من هذا (بعد إزالة الإيموجي والروابط) لا تُترجم.",
        default: 3,
        min: 1,
        max: 50,
        step: 1,
    },
    translateEmbeds: {
        type: "boolean",
        label: "ترجمة محتوى البوتات (embeds)",
        description: "يترجم النصوص داخل embeds رسائل البوتات الأجنبية. عطّله لو يبطئ القنوات الكثيفة.",
        default: false,
    },
    serverScope: {
        type: "select",
        label: "نطاق السيرفرات",
        default: "all",
        options: [
            { label: "كل السيرفرات", value: "all" },
            { label: "فقط السيرفرات في القائمة (whitelist)", value: "whitelist" },
            { label: "كل السيرفرات ما عدا في القائمة (blacklist)", value: "blacklist" },
        ],
    },
    serverList: {
        type: "textarea",
        label: "قائمة السيرفرات",
        description:
            "معرّفات السيرفرات (Server IDs) — واحد بكل سطر أو مفصولة بفاصلة. مطلوب فقط مع whitelist/blacklist.",
        default: "",
        placeholder: "1504074526974017609\n…",
    },
    channelScope: {
        type: "select",
        label: "نطاق القنوات",
        default: "all",
        options: [
            { label: "كل القنوات", value: "all" },
            { label: "فقط القنوات في القائمة (whitelist)", value: "whitelist" },
            { label: "كل القنوات ما عدا في القائمة (blacklist)", value: "blacklist" },
        ],
    },
    channelList: {
        type: "textarea",
        label: "قائمة القنوات",
        description: "معرّفات القنوات (Channel IDs) — واحد بكل سطر أو مفصولة بفاصلة.",
        default: "",
        placeholder: "1504082461565648986\n…",
    },
    skipAuthorIds: {
        type: "textarea",
        label: "تجاهل هؤلاء المستخدمين",
        description:
            "معرّفات المستخدمين الذين لا تُترجم رسائلهم أبداً (مثل معرّفك أنت). واحد بكل سطر أو مفصولة بفاصلة.",
        default: "",
        placeholder: "123456789012345678\n…",
    },
    cacheTranslations: {
        type: "boolean",
        label: "احفظ الترجمات في الذاكرة المحلية",
        description: "نفس النص لا يُترجم مرتين — يأخذ من IndexedDB.",
        default: true,
    },
} as const satisfies SettingsSchema;

// ─── Translation providers ───────────────────────────────────────────────────

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

// ─── Heuristics for auto mode ────────────────────────────────────────────────

const ARABIC_RANGE_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LETTER_RE = /\p{L}/gu;
const CODE_BLOCK_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`]*`/g;
const URL_RE = /https?:\/\/\S+/g;
const DISCORD_LINK_RE = /<#\d+>|<@!?\d+>|<@&\d+>|<:\w+:\d+>|<a:\w+:\d+>/g;

/**
 * Strip everything that should NOT be translated and return the remaining
 * "natural language" portion of the message.
 */
function strippedText(raw: string): string {
    return raw
        .replace(CODE_BLOCK_RE, " ")
        .replace(INLINE_CODE_RE, " ")
        .replace(URL_RE, " ")
        .replace(DISCORD_LINK_RE, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Cheap heuristic: returns true if the stripped text is mostly non-Arabic
 * letters (i.e. worth translating to Arabic).
 */
function looksForeign(stripped: string, targetIsArabic: boolean): boolean {
    if (!targetIsArabic) {
        // For any non-Arabic target, fall back to "translate everything with letters".
        return (stripped.match(LETTER_RE) ?? []).length > 0;
    }
    const letters = stripped.match(LETTER_RE) ?? [];
    if (letters.length === 0) return false;
    const arabicCount = (stripped.match(ARABIC_RANGE_RE) ?? []).length;
    // If less than 20% of the letters are Arabic, treat the message as foreign.
    return arabicCount / letters.length < 0.2;
}

function parseIdList(raw: string): Set<string> {
    return new Set(
        raw
            .split(/[\s,]+/)
            .map(s => s.trim())
            .filter(s => /^\d+$/.test(s)),
    );
}

// ─── Subtitle DOM ────────────────────────────────────────────────────────────

const LOADING_LABEL = "🌐 جاري الترجمة…";

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

function buildPlaceholderNode(): HTMLElement {
    const node = document.createElement("div");
    node.style.cssText =
        "padding:8px 10px;border-radius:6px;background:rgba(0,255,136,0.06);border-inline-start:3px solid rgba(0,255,136,0.5);font-size:0.92em;color:var(--text-muted,#949ba4);font-style:italic;";
    node.textContent = LOADING_LABEL;
    return node;
}

function replaceInPlace(placeholder: HTMLElement, replacement: HTMLElement): void {
    // Preserve the framework-applied classes/dataset attributes so the
    // accessory bookkeeping (and removal on unload) keeps working.
    for (const cls of Array.from(placeholder.classList)) replacement.classList.add(cls);
    for (const [k, v] of Object.entries(placeholder.dataset)) replacement.dataset[k] = v;
    placeholder.replaceWith(replacement);
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export default definePlugin({
    manifest: {
        id: "autoTranslate",
        name: "AutoTranslate",
        description:
            "ترجمة تلقائية لرسائل الأجانب في أي سيرفر إلى العربية — تظهر فقط عندك، لا تُرسل لـ Discord.",
        authors: [{ name: "ali" }],
        version: "0.2.0",
        tags: ["ترجمة", "AI", "تلقائي"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        // ─── translate() — service routing + cache ─────────────────────────────
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

        // ─── Scope filter ───────────────────────────────────────────────────────
        function isScopedOut(channelId: string | null): boolean {
            // Channel filter
            const channelScope = ctx.settings.channelScope;
            if (channelScope !== "all" && channelId) {
                const list = parseIdList(ctx.settings.channelList);
                const inList = list.has(channelId);
                if (channelScope === "whitelist" && !inList) return true;
                if (channelScope === "blacklist" && inList) return true;
            }
            // Server filter — server id is on the URL right next to channel id
            const serverScope = ctx.settings.serverScope;
            if (serverScope !== "all") {
                const m = location.pathname.match(/\/channels\/(\d+)\/\d+/);
                const guildId = m?.[1];
                if (guildId) {
                    const list = parseIdList(ctx.settings.serverList);
                    const inList = list.has(guildId);
                    if (serverScope === "whitelist" && !inList) return true;
                    if (serverScope === "blacklist" && inList) return true;
                }
            }
            return false;
        }

        // ─── Auto accessory factory ─────────────────────────────────────────────
        ctx.messageAccessories.add("autoTranslate", info => {
            if (!ctx.settings.autoMode) return null;

            // Skip configured authors (your own id, bots, etc.)
            if (info.author) {
                const skip = parseIdList(ctx.settings.skipAuthorIds);
                if (skip.has(info.author)) return null;
            }

            if (isScopedOut(info.channelId)) return null;

            // Gather candidate text: message content, plus embed text if enabled.
            let candidate = info.content;
            if (ctx.settings.translateEmbeds) {
                const embedText = Array.from(
                    info.el.querySelectorAll<HTMLElement>('[class*="embedDescription"], [class*="embedTitle"], [class*="embedFieldValue"]'),
                )
                    .map(n => n.textContent ?? "")
                    .join("\n")
                    .trim();
                if (embedText && !candidate) candidate = embedText;
                else if (embedText) candidate = `${candidate}\n${embedText}`;
            }

            const cleaned = strippedText(candidate);
            const minLen = Math.max(1, Math.floor(ctx.settings.minLength));
            if (cleaned.length < minLen) return null;

            const targetIsArabic = ctx.settings.targetLang === "ar";
            if (!looksForeign(cleaned, targetIsArabic)) return null;

            // Synchronously return a placeholder; replace it once translation lands.
            const placeholder = buildPlaceholderNode();
            (async () => {
                try {
                    const result = await translate(candidate.trim());
                    if (!placeholder.isConnected) return; // user scrolled away / message removed
                    if (result.text.trim() === candidate.trim()) {
                        // Translation == source ⇒ language guess was wrong; remove subtitle.
                        placeholder.remove();
                        return;
                    }
                    const finalNode = buildTranslationNode(result.text, result.sourceLang);
                    replaceInPlace(placeholder, finalNode);
                    ctx.stats.bump("auto_translations");
                } catch (err) {
                    ctx.logger.warn("auto-translate failed:", err);
                    if (placeholder.isConnected) {
                        placeholder.textContent = "🌐 تعذّر الترجمة";
                        placeholder.style.opacity = "0.5";
                    }
                }
            })();
            return placeholder;
        });

        // ─── Right-click manual fallback (preserved from v0.1.0) ────────────────
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
                        const accessory = buildTranslationNode(result.text, result.sourceLang);
                        accessory.classList.add("boon-accessory");
                        accessory.dataset.boonAccId = "autoTranslate";
                        host?.appendChild(accessory);
                        ctx.stats.bump("manual_translations");
                    } catch (err) {
                        ctx.logger.error("translation failed", err);
                        ctx.toast(`فشل: ${(err as Error).message}`, "error");
                    }
                },
            });
        });

        // ─── Commands ───────────────────────────────────────────────────────────
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
                    ctx.stats.bump("manual_translations");
                } catch (err) {
                    ctx.toast(`فشل: ${(err as Error).message}`, "error");
                }
            },
        });

        ctx.registerCommand({
            name: "tr-clear-cache",
            description: "امسح ذاكرة الترجمات.",
            async execute() {
                await ctx.dataStore.clear();
                ctx.toast("تم مسح ذاكرة الترجمات", "success");
            },
        });

        ctx.logger.info(
            ctx.settings.autoMode
                ? "ready — auto-translating non-Arabic messages"
                : "ready — manual mode only (right-click any message)",
        );
    },
    onStop(ctx) {
        ctx.messageAccessories.remove("autoTranslate");
        ctx.logger.info("stopped");
    },
});
