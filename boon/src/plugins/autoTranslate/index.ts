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

import { readMessageBodyText } from "../../core/discord.js";
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
        description:
            "الرسائل الأقصر من هذا (بعد إزالة الإيموجي والروابط) لا تُترجم. القيمة 1 = ترجم كل رسالة فيها أي حرف.",
        default: 1,
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

// Discord's renderer CSP blocks `fetch()` to translate.googleapis.com and
// generativelanguage.googleapis.com (only discord.* hosts are in connect-src).
// When running inside patched Discord (desktop) we route through the patcher's
// BOON_FETCH IPC handler — the same channel the updater uses to reach GitHub.
// Userscript and extension targets don't have a bridge but also aren't subject
// to Discord's CSP, so they fall through to a direct fetch.
interface BridgeFetchInit {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    accept?: string;
}

interface BridgeFetchResult {
    ok: boolean;
    status: number;
    body: string;
    error?: string;
}

interface BoonBoot {
    invoke<T = unknown>(channel: string, payload?: unknown): Promise<T>;
    readonly ipc?: boolean;
}

function boonBoot(): BoonBoot | null {
    const b = (globalThis as { __BOON__?: BoonBoot }).__BOON__;
    if (!b || typeof b.invoke !== "function" || !b.ipc) return null;
    return b;
}

async function bridgedFetch(url: string, init?: BridgeFetchInit): Promise<BridgeFetchResult> {
    const boot = boonBoot();
    if (boot) {
        try {
            const res = await boot.invoke<BridgeFetchResult>("BOON_FETCH", {
                url,
                method: init?.method,
                headers: init?.headers,
                body: init?.body,
                accept: init?.accept,
            });
            return {
                ok: !!res?.ok,
                status: res?.status ?? 0,
                body: res?.body ?? "",
                error: res?.error,
            };
        } catch (err) {
            return {
                ok: false,
                status: 0,
                body: "",
                error: err instanceof Error ? err.message : String(err),
            };
        }
    }
    // Userscript / extension / dev environments — no CSP issue, direct fetch.
    // Merge `accept` into headers (same as the IPC path does on the main side)
    // so callers don't have to set it twice. An explicit Accept in
    // init.headers wins over the convenience init.accept.
    try {
        const headers: Record<string, string> = { ...(init?.headers ?? {}) };
        if (init?.accept && !Object.keys(headers).some(k => k.toLowerCase() === "accept")) {
            headers["Accept"] = init.accept;
        }
        const r = await fetch(url, {
            method: init?.method ?? "GET",
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            body: init?.body,
        });
        const text = await r.text();
        return { ok: r.ok, status: r.status, body: text };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            body: "",
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

async function translateGoogle(text: string, target: string): Promise<TranslationResult> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        target,
    )}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await bridgedFetch(url, { accept: "application/json" });
    if (!res.ok) {
        throw new Error(res.error || `Google Translate HTTP ${res.status}`);
    }
    let data: [Array<[string, string]>, ...unknown[]];
    try {
        data = JSON.parse(res.body) as [Array<[string, string]>, ...unknown[]];
    } catch (err) {
        throw new Error(
            `Google Translate تعذّر تحليل الرد: ${err instanceof Error ? err.message : String(err)}`,
        );
    }
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
    const res = await bridgedFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
            method: "POST",
            headers: { "content-type": "application/json" },
            accept: "application/json",
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
    if (!res.ok) throw new Error(res.error || `Gemini HTTP ${res.status}`);
    let data: {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    try {
        data = JSON.parse(res.body);
    } catch (err) {
        throw new Error(
            `Gemini تعذّر تحليل الرد: ${err instanceof Error ? err.message : String(err)}`,
        );
    }
    const out = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!out) throw new Error("استجابة Gemini فارغة");
    return { text: out };
}

// ─── Heuristics for auto mode ────────────────────────────────────────────────

const LETTER_RE = /\p{L}/gu;
// Map of target language → regex matching letters that *belong to that
// language's script*. Used by `looksForeign` to decide whether a message is
// already in the target language (and therefore doesn't need translation).
const TARGET_SCRIPT_RE: Readonly<Record<string, RegExp>> = {
    ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
    en: /[A-Za-z]/g,
    tr: /[A-Za-z]/g,
    fr: /[A-Za-z]/g,
    de: /[A-Za-z]/g,
    es: /[A-Za-z]/g,
    "zh-CN": /[\u4E00-\u9FFF]/g,
    ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g,
};
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
 * Returns true if the stripped text contains ANY letter that does NOT belong
 * to the target language's script. The policy is mandatory translation —
 * if even one foreign-script letter is present (e.g. one Latin letter in an
 * Arabic message), translate the whole message. Mixed-language messages are
 * common in Arabic Discord communities ("hello شلونك") and the user wants
 * those rendered fully in Arabic underneath.
 *
 * For Latin-script targets (en/tr/fr/de/es) the heuristic only filters out
 * messages that already use Latin script — it cannot distinguish between
 * different Latin-script languages, which is an accepted v0.2.0 limitation
 * (the equality-check fallback in the async path removes self-translations).
 */
function looksForeign(stripped: string, targetLang: string): boolean {
    const letters = stripped.match(LETTER_RE) ?? [];
    if (letters.length === 0) return false;
    const scriptRe = TARGET_SCRIPT_RE[targetLang];
    if (!scriptRe) {
        // Unknown target: be conservative and translate.
        return true;
    }
    const targetCount = (stripped.match(scriptRe) ?? []).length;
    // Translate as long as ANY non-target-script letter is present. Previous
    // 20% threshold silently skipped Latin-heavy mixed messages when most of
    // the text happened to be in the target script.
    return targetCount < letters.length;
}

/**
 * Pull every translatable text fragment out of a Discord message element:
 * the main content, plus the reply preview (the gray quoted line above the
 * message body when someone replies). Discord does NOT include the reply
 * preview inside ``message-content-*`` — it lives in its own subtree — so
 * the core ``extractMessageInfo`` helper misses it. We pick it up here so
 * the auto-translator covers the full conversational context the reader
 * sees, not just the most recent author's line.
 */
function gatherTranslatableText(el: HTMLElement, includeEmbeds: boolean): string {
    const parts: string[] = [];
    // Reply preview ("X said: Y" line above the message body). Discord names
    // these classes ``repliedTextContent`` / ``repliedTextPreview`` depending
    // on the build, so we match either.
    const replyPreview = el.querySelector<HTMLElement>(
        '[class*="repliedTextContent"], [class*="repliedTextPreview"]',
    );
    const replyText = replyPreview?.textContent?.trim() ?? "";
    if (replyText) parts.push(replyText);
    // Main message body — ``readMessageBodyText`` in core/discord.ts skips
    // our own ``.boon-accessory-host`` descendants. Without that exclusion,
    // a naive textContent read would loop the translation subtitle's own
    // text back into the translation input and into the framework's
    // snapshot dedup, infinite-looping the accessory render. See
    // ``sourceSnapshot`` in messageAccessories.ts for the partner read.
    const body = readMessageBodyText(el).trim();
    if (body) parts.push(body);
    // Optional embed text — gated behind the existing setting so high-volume
    // bot channels don't blow through the translation budget.
    if (includeEmbeds) {
        const embedText = Array.from(
            el.querySelectorAll<HTMLElement>(
                '[class*="embedDescription"], [class*="embedTitle"], [class*="embedFieldValue"]',
            ),
        )
            .map(n => n.textContent ?? "")
            .join("\n")
            .trim();
        if (embedText) parts.push(embedText);
    }
    return parts.join("\n");
}

// Memoize id-list parsing keyed by the raw setting string. The accessory
// factory runs on every rendered message so allocating a fresh Set per call
// is wasteful; keying by the raw string means cache invalidates implicitly
// when the setting changes.
const ID_LIST_CACHE = new Map<string, Set<string>>();
function parseIdList(raw: string): Set<string> {
    let cached = ID_LIST_CACHE.get(raw);
    if (cached) return cached;
    cached = new Set(
        raw
            .split(/[\s,]+/)
            .map(s => s.trim())
            .filter(s => /^\d+$/.test(s)),
    );
    ID_LIST_CACHE.set(raw, cached);
    return cached;
}

// ─── Subtitle DOM ────────────────────────────────────────────────────────────

const LOADING_LABEL = "🌐 جاري الترجمة…";

// Languages whose script is right-to-left. The plugin's ``targetLang`` setting
// currently exposes only Arabic from this set, but listing the full Unicode
// RTL language family here keeps the rendering correct if/when more are
// added without needing to revisit this helper.
const RTL_LANGS = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi", "ckb"]);

function isRtlLang(lang: string): boolean {
    // Normalise BCP-47 tags like ``ar-SA`` / ``he-IL`` down to the primary
    // subtag before lookup. Google's response sometimes echoes a regioned
    // variant in ``sourceLang``; the user-facing ``targetLang`` setting is
    // always a primary subtag but we accept either here.
    return RTL_LANGS.has(lang.toLowerCase().split("-")[0]);
}

function buildTranslationNode(
    translation: string,
    targetLang: string,
    sourceLang?: string,
): HTMLElement {
    const rtl = isRtlLang(targetLang);
    const node = document.createElement("div");
    // Direction is tied to the target language: Arabic / Hebrew / Persian /
    // Urdu translations render RTL with right-alignment so embedded Latin
    // proper nouns (Discord usernames, game/tool names) stay grammatically
    // ordered. Non-RTL targets (English, Turkish, French, German, Spanish,
    // Chinese, Japanese) keep ``direction:auto`` per CONTRIBUTING.md so the
    // browser picks the natural directionality.
    //
    // ``unicode-bidi:plaintext`` (RTL path only) lets each paragraph segment
    // resolve directionality from its own first strong character, so an
    // Arabic translation containing an English link still renders the link
    // as LTR within the otherwise-RTL block. This is what fixes the
    // "interleaved letters" rendering the user reported on Eclipse
    // #announcements without forcing right-alignment on LTR target users.
    const dirCss = rtl
        ? "direction:rtl;text-align:right;unicode-bidi:plaintext;"
        : "direction:auto;";
    node.style.cssText =
        `padding:8px 10px;border-radius:6px;background:rgba(0,255,136,0.10);border-inline-start:3px solid #00ff88;font-size:0.95em;color:var(--text-normal,#dbdee1);${dirCss}transition:background 240ms ease-out,border-inline-start-color 240ms ease-out;`;
    const header = document.createElement("small");
    // Header label is always Arabic ("🌐 الترجمة") regardless of target
    // language — the UI of the plugin itself is Arabic-first — so it always
    // gets RTL alignment.
    header.style.cssText =
        "opacity:0.65;display:block;margin-bottom:2px;direction:rtl;text-align:right;";
    header.textContent = sourceLang ? `🌐 ${sourceLang} → الترجمة` : "🌐 الترجمة";
    const body = document.createElement("div");
    body.style.cssText = dirCss;
    if (!rtl) body.setAttribute("dir", "auto");
    body.textContent = translation;
    node.appendChild(header);
    node.appendChild(body);
    return node;
}

// Briefly flash a translation node so a manual click on an already-translated
// message produces a *visible* response. Without this, the cached-translation
// path completes synchronously enough that the user sees the toast "جاري
// الترجمة…" appear and disappear with no detectable change to the message —
// indistinguishable from a broken button.
function flashAttention(node: HTMLElement): void {
    const baseBg = "rgba(0,255,136,0.10)";
    const baseBorder = "#00ff88";
    const flashBg = "rgba(0,255,136,0.30)";
    const flashBorder = "#22ff99";
    node.style.background = flashBg;
    node.style.borderInlineStartColor = flashBorder;
    setTimeout(() => {
        if (!node.isConnected) return;
        node.style.background = baseBg;
        node.style.borderInlineStartColor = baseBorder;
    }, 480);
}

function buildPlaceholderNode(): HTMLElement {
    // The placeholder text ("🌐 جاري الترجمة…") is Arabic regardless of
    // target language — it's a UI string of the plugin itself — so the
    // placeholder is always RTL.
    const node = document.createElement("div");
    node.style.cssText =
        "padding:8px 10px;border-radius:6px;background:rgba(0,255,136,0.06);border-inline-start:3px solid rgba(0,255,136,0.5);font-size:0.92em;color:var(--text-muted,#949ba4);font-style:italic;direction:rtl;text-align:right;";
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
        version: "0.2.9",
        tags: ["ترجمة", "AI", "تلقائي"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        // ─── Manual force-translate overrides ──────────────────────────────────
        //
        // When a user right-clicks → "ترجم الرسالة" on a message the auto
        // factory skipped (typically because ``looksForeign`` returned false,
        // e.g. very short tokens, mixed-script edge cases, or a server/channel
        // explicitly out of scope), they want this *specific* message
        // translated *and* the translation to persist across the inevitable
        // React re-renders Discord triggers (reactions, hover, edits, etc.).
        //
        // Direct DOM injection from the right-click handler is one-shot —
        // when React re-renders the ``message-content-*`` div, our injected
        // accessory disappears with it, and the auto factory won't re-create
        // it because the same filters that skipped the message originally
        // still apply. The toast says "جاري الترجمة…" once, the translation
        // briefly appears, then a re-render wipes it and we never put it back.
        //
        // The fix is to record the override in a map keyed by message id and
        // pre-empt the auto factory's gating logic when an override exists.
        // The auto factory becomes the single source of truth for *what*
        // renders under each message, and the manual handler becomes a way
        // to *tell* that factory "please translate this one even if your
        // heuristics say no". After the override is recorded we re-scan the
        // visible chat so the accessory appears immediately without waiting
        // for the next Discord mutation.
        //
        // The cache (``ctx.dataStore``) still handles the API-call dedup —
        // a manual override that hits a cached translation completes without
        // any network roundtrip. The override map is in-memory only because
        // it is per-session UI state: if Discord restarts and the user wants
        // the same message translated again, the cache will already have the
        // result and ``looksForeign`` doesn't need to be bypassed because
        // they'd manual-translate again anyway.
        //
        // Map values track whether this override has already been counted in
        // the ``manual_translations`` stat. Without this, every React
        // re-render rescans the message, the factory re-runs (cache hit, no
        // network), and the counter inflates. We bump exactly once per
        // user-initiated click by transitioning ``"pending" → "counted"`` on
        // the first successful translate after the click.
        const manualOverrides = new Map<string, "pending" | "counted">();

        // ─── translate() — service routing + cache ─────────────────────────────
        async function translate(
            text: string,
            opts: { bypassCache?: boolean } = {},
        ): Promise<TranslationResult> {
            const service = ctx.settings.service;
            const target = ctx.settings.targetLang;
            const cacheKey = `${service}:${target}:${text}`;
            // Manual right-click forces fresh translations: the user has
            // explicitly asked, so we trust the API over a possibly-stale
            // cached value. Without bypass, manual re-translation of an
            // already-translated message is a no-op against the cache —
            // indistinguishable from a broken button from the user's POV.
            if (ctx.settings.cacheTranslations && !opts.bypassCache) {
                // Tolerate IndexedDB version drift ("VersionError: requested
                // version (1) is less than existing version (2)") by treating
                // any read failure as a cache miss rather than letting it
                // abort the whole translation. The data store helper logs
                // the underlying error, so we don't need to re-emit it here.
                try {
                    const cached = await ctx.dataStore.get<TranslationResult>(cacheKey);
                    if (cached) return cached;
                } catch {
                    // fall through to network fetch
                }
            }
            const result =
                service === "gemini"
                    ? await translateGemini(text, target, ctx.settings.geminiApiKey)
                    : await translateGoogle(text, target);
            if (ctx.settings.cacheTranslations) {
                // Same defensive try/catch — a failed cache write must not
                // bubble up and discard a perfectly good translation.
                try {
                    await ctx.dataStore.set(cacheKey, result);
                } catch {
                    // ignore cache-write failures; result is still returned
                }
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
            const forced = manualOverrides.has(info.id);

            if (!forced) {
                if (!ctx.settings.autoMode) return null;

                // Skip configured authors (your own id, bots, etc.)
                if (info.author) {
                    const skip = parseIdList(ctx.settings.skipAuthorIds);
                    if (skip.has(info.author)) return null;
                }

                if (isScopedOut(info.channelId)) return null;
            }

            // Gather candidate text: reply preview + message body + optional
            // embed text. ``info.content`` from the framework only covers the
            // message body, so we re-derive from ``info.el`` to pick up the
            // reply preview the framework strips out.
            const candidate = gatherTranslatableText(info.el, ctx.settings.translateEmbeds);
            if (!candidate) {
                if (forced) {
                    // The user explicitly asked. We refuse silently in the
                    // auto path (other accessories may run), but in the
                    // forced path the user is owed a visible reason. Drop
                    // the override so React re-renders don't keep retrying.
                    ctx.toast("لا يوجد نص قابل للترجمة في الرسالة", "error");
                    manualOverrides.delete(info.id);
                }
                return null;
            }

            const cleaned = strippedText(candidate);
            if (!forced) {
                const minLen = Math.max(1, Math.floor(ctx.settings.minLength));
                if (cleaned.length < minLen) return null;

                if (!looksForeign(cleaned, ctx.settings.targetLang)) return null;
            } else if (cleaned.length === 0) {
                // Manual override but no translatable text after stripping
                // code blocks / URLs / mentions / emoji. Surface a toast so
                // the click never becomes invisible — the silent return
                // here was a load-bearing cause of "the button does
                // nothing" complaints.
                ctx.toast("الرسالة كلها روابط/منشن — لا نص للترجمة", "error");
                manualOverrides.delete(info.id);
                return null;
            }

            // Synchronously return a placeholder; replace it once translation lands.
            const placeholder = buildPlaceholderNode();
            (async () => {
                try {
                    // Forced (manual) clicks bypass the cache: the user
                    // explicitly asked for a translation *now* and a silent
                    // cache hit (same text in → same text out, no visible
                    // change) is the dominant cause of "the button does
                    // nothing" reports. Auto path keeps the cache.
                    const result = await translate(candidate.trim(), {
                        bypassCache: forced,
                    });
                    if (!placeholder.isConnected) return; // user scrolled away / message removed
                    if (result.text.trim() === candidate.trim()) {
                        // Translation == source ⇒ language guess was wrong
                        // (typically the message is already in the user's
                        // target language). Auto path: silently drop the
                        // subtitle — we never wanted same-language anyway.
                        // Manual path: tell the user *why* nothing visible
                        // happened. The toast is the user-visible signal
                        // that distinguishes "button worked, no translation
                        // needed" from "button is broken".
                        placeholder.remove();
                        if (forced) {
                            manualOverrides.delete(info.id);
                            ctx.toast(
                                "النص بالعربية بالفعل — لا حاجة للترجمة",
                                "info",
                            );
                        }
                        return;
                    }
                    const finalNode = buildTranslationNode(
                        result.text,
                        ctx.settings.targetLang,
                        result.sourceLang,
                    );
                    replaceInPlace(placeholder, finalNode);
                    // Manual clicks: flash the translation node so the user
                    // sees a *visible* response even when the result text
                    // happens to match what was previously rendered. Without
                    // this flash, a manual click on an already-translated
                    // message is indistinguishable from a no-op.
                    if (forced) flashAttention(finalNode);
                    // Conditionally bump the correct counter so manual forces
                    // don't double-count into ``auto_translations``. The auto
                    // bump is naturally one-shot because the framework's
                    // ``[data-boon-acc-id="autoTranslate"]`` dedup prevents
                    // the factory from re-running for an already-translated
                    // message. The manual bump needs explicit single-shot
                    // tracking via the ``pending``/``counted`` state because
                    // ``manualOverrides`` keeps re-firing the factory on
                    // every React re-render to keep the translation visible.
                    if (forced) {
                        if (manualOverrides.get(info.id) === "pending") {
                            ctx.stats.bump("manual_translations");
                            manualOverrides.set(info.id, "counted");
                        }
                    } else {
                        ctx.stats.bump("auto_translations");
                    }
                } catch (err) {
                    ctx.logger.warn("auto-translate failed:", err);
                    if (forced) {
                        // Drop the failed accessory + override so React
                        // re-renders don't loop the factory back into the
                        // same failure (burning API quota on every hover).
                        // Surface a toast as the user-visible signal — the
                        // old code's inline "تعذّر الترجمة" sentinel can't
                        // be reused here because we explicitly want the
                        // override gone, so the toast is the right surface.
                        if (placeholder.isConnected) placeholder.remove();
                        manualOverrides.delete(info.id);
                        const errMsg = (err as Error)?.message ?? String(err);
                        ctx.toast(`فشل الترجمة: ${errMsg}`, "error");
                    } else if (placeholder.isConnected) {
                        // Auto path: keep the placeholder in the DOM as the
                        // framework's dedup sentinel (its data-boon-acc-id
                        // attribute prevents the factory from re-running on
                        // future scans). Without this the factory would fire
                        // again on every hover/reaction/sibling mutation,
                        // re-hit the same API failure, and spam warnings.
                        // Match the pre-v0.2.5 visual: muted "تعذّر الترجمة".
                        placeholder.textContent = "🌐 تعذّر الترجمة";
                        placeholder.style.opacity = "0.5";
                    }
                }
            })();
            return placeholder;
        });

        // ─── Right-click manual fallback (preserved from v0.1.0) ────────────────
        //
        // Records the message id in ``manualOverrides`` and triggers a re-scan
        // of the message via the framework. The auto factory then handles
        // *everything* — translation, placeholder insertion, async swap, error
        // toast on failure — exactly as it does for messages that pass the
        // normal heuristic. This is what makes manual translations survive
        // React re-renders: the override is recorded in JS state, not just
        // injected into the DOM, so the next time the framework re-creates
        // the host (after Discord destroys/recreates the message-content div
        // on reactions, hover, edited timestamps, etc.) the factory sees the
        // override flag still set and re-renders the translation.
        ctx.contextMenu.patch("message", (menuCtx, addItem) => {
            // The menu-render check is permissive — we only bail when we have
            // absolutely no way to identify the target message. If we have
            // *either* a messageId from the LI id parse *or* a live target
            // element we can closest-walk, the click handler will resolve
            // it. Refusing to render the item just because messageId is
            // missing was wrong on Discord PTB builds where the LI id parse
            // landed on a non-snowflake suffix and ``messageId`` ended up
            // as the channel id, blanking the menu item.
            if (!menuCtx.messageId && !menuCtx.target) return;
            addItem({
                id: "autoTranslate:translate",
                label: "ترجم الرسالة",
                icon: "🌐",
                onClick() {
                    // Bulletproof message-element lookup. The previous flow
                    // built ``chat-messages-${channelId}-${messageId}`` and
                    // ``getElementById``'d it — fast, but fragile to two
                    // edge cases hit on Discord PTB:
                    //
                    //   1. The LI id-parse in contextMenu.detectKind treated
                    //      a snowflake-with-suffix LI id as if it were a
                    //      plain ``chat-messages-<channel>-<message>`` and
                    //      pulled the wrong tail as ``messageId``.
                    //   2. Virtual-scroller unmounts: between the user
                    //      opening the menu and clicking the item, Discord
                    //      unmounted the LI; the rebuilt id no longer
                    //      matched anything in the DOM.
                    //
                    // We now try four strategies in order, *each* with a
                    // visible toast on miss so the click never produces
                    // silent failure (the dominant complaint on Eclipse
                    // #announcements before this fix):
                    //   (a) closest-walk from the live right-click target,
                    //   (b) document.getElementById on the rebuilt id,
                    //   (c) querySelector by message-id suffix,
                    //   (d) targetless mode (DM messages with empty LI).
                    let msgEl: HTMLElement | null = null;
                    let resolvedId = menuCtx.messageId ?? "";
                    if (menuCtx.target) {
                        msgEl = menuCtx.target.closest<HTMLElement>(
                            'li[id^="chat-messages-"]',
                        );
                    }
                    if (!msgEl && menuCtx.channelId && menuCtx.messageId) {
                        msgEl = document.getElementById(
                            `chat-messages-${menuCtx.channelId}-${menuCtx.messageId}`,
                        );
                    }
                    if (!msgEl && menuCtx.messageId) {
                        msgEl = document.querySelector<HTMLElement>(
                            `li[id$="-${CSS.escape(menuCtx.messageId)}"]`,
                        );
                    }
                    if (msgEl && !resolvedId) {
                        // Walk-from-target succeeded but the id parse
                        // earlier failed — recover the message id from the
                        // live LI now that we have it. Snowflakes are
                        // 17-19 digit integers; extract by regex rather
                        // than ``split("-").pop()`` so trailing suffixes
                        // (e.g. ``chat-messages-A-B-reactions``) don't
                        // pollute the override key.
                        const snowflakes = msgEl.id.match(/\d{17,20}/g);
                        if (snowflakes && snowflakes.length > 0) {
                            resolvedId = snowflakes[snowflakes.length - 1];
                        }
                    }
                    if (!msgEl || !resolvedId) {
                        ctx.toast(
                            "تعذّر إيجاد الرسالة — جرّب right-click مرة ثانية",
                            "error",
                        );
                        ctx.logger.warn(
                            "manual translate: no msgEl/id",
                            { messageId: menuCtx.messageId, channelId: menuCtx.channelId, hasTarget: !!menuCtx.target },
                        );
                        return;
                    }
                    // Sanity check: refuse force-translate on a message with
                    // no readable text at all (image-only, sticker-only).
                    const bodyText = readMessageBodyText(msgEl).trim();
                    const replyPreview = msgEl.querySelector<HTMLElement>(
                        '[class*="repliedTextContent"], [class*="repliedTextPreview"]',
                    );
                    const replyText = replyPreview?.textContent?.trim() ?? "";
                    if (!bodyText && !replyText) {
                        ctx.toast("الرسالة فارغة — لا نص للترجمة", "error");
                        return;
                    }
                    manualOverrides.set(resolvedId, "pending");
                    // Wipe any prior accessory so the framework's dedup check
                    // re-runs the factory cleanly with the override in effect.
                    const host = msgEl.querySelector<HTMLElement>(".boon-accessory-host");
                    host?.querySelector('[data-boon-acc-id="autoTranslate"]')?.remove();
                    ctx.toast("جاري الترجمة…", "info");
                    ctx.logger.info(
                        `manual translate fired for ${resolvedId} (${bodyText.length + replyText.length} chars)`,
                    );
                    // Force-re-render via the public API. The framework's
                    // scan does a host.querySelector check that we just
                    // cleared above, so the factory will run on this message.
                    // ``manual_translations`` is bumped inside the factory's
                    // success path so it only increments on a real translation,
                    // never on a failure or self-cancellation.
                    ctx.messageAccessories.rescan(msgEl);
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
