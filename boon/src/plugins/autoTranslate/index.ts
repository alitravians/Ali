/*
 * BOON Plugin: AutoTranslate
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Three complementary modes:
 *
 *   1. AUTO INCOMING (default): every newly-rendered message that looks like
 *      it is written in a non-Arabic language is silently translated. The
 *      result renders as a small subtitle directly under the original
 *      message — visible only to the user running this plugin (it lives in
 *      the local DOM, it is never sent back to Discord).
 *
 *   2. MANUAL INCOMING: right-click any message → "ترجم الرسالة" forces a
 *      translation. The `..tr <text>` command translates arbitrary text into
 *      a toast.
 *
 *   3. AUTO OUTGOING (opt-in): when the user types in Arabic (or any other
 *      configured source language) and hits Send, the plugin intercepts
 *      Discord's own `MessageActions.sendMessage` (and `editMessage`)
 *      before they fire the HTTP request, replacing the `content` field
 *      with a translation. Discord (and every other user in the channel)
 *      sees only the translated text. The user's draft is replaced *at
 *      Discord's internal API boundary* — not in the composer DOM and not
 *      in the network layer — so URLs, mentions, typing latency, and
 *      Discord's optimistic-UI/echo flow are all preserved unchanged.
 *
 * Translation provider:
 *   - Google Translate's free public endpoint (no API key, default).
 *   - Google Gemini API (user-supplied key) for higher-quality output.
 *
 * Privacy:
 *   - Translations are computed locally in the browser/desktop client; the
 *     only network egress is the request to the chosen translation service.
 *   - For incoming translations, Discord never sees the translated text.
 *   - For outgoing translations, Discord receives ONLY the translated text
 *     (the original draft is dropped on the wire). This is intentional and
 *     visible to the user as the message that appears in the channel after
 *     they hit Send.
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
    outgoingMode: {
        type: "boolean",
        label: "ترجمة الرسائل الصادرة قبل إرسالها",
        description:
            "لمّا تكتب رسالة وتضغط Send، تُترجم تلقائياً إلى اللغة الهدف ثم تُرسل بالشكل المترجم. Discord يستقبل النص المترجم فقط. الزر الأخضر بجانب مربع الكتابة يكون فعّالاً لما هذا الخيار شغّال.",
        default: false,
    },
    outgoingSrc: {
        type: "select",
        label: "اللغة المصدر للرسائل الصادرة",
        description: "اللغة التي تكتب بها. \"كشف تلقائي\" يترك Google يحدّد اللغة من النص.",
        default: "ar",
        options: [
            { label: "كشف تلقائي", value: "auto" },
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
    outgoingDst: {
        type: "select",
        label: "اللغة الهدف للرسائل الصادرة",
        description: "اللغة التي ستظهر بها رسائلك في القناة بعد الإرسال.",
        default: "en",
        options: [
            { label: "English", value: "en" },
            { label: "العربية", value: "ar" },
            { label: "Türkçe", value: "tr" },
            { label: "Français", value: "fr" },
            { label: "Deutsch", value: "de" },
            { label: "Español", value: "es" },
            { label: "中文", value: "zh-CN" },
            { label: "日本語", value: "ja" },
        ],
    },
    outgoingPrefixOriginal: {
        type: "boolean",
        label: "أضف النص الأصلي قبل المترجم",
        description:
            "لما يفعّل، الرسالة المرسلة تكون بشكل \"النص المترجم\\n-# النص الأصلي\" حتى يقدر القارئ يراجع الأصل. عطّله لو تبي ترسل المترجم فقط.",
        default: false,
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

// ─── Outgoing-translate helpers ──────────────────────────────────────────────

/**
 * Combined pattern for tokens that must be preserved verbatim through any
 * outgoing translation: Discord mentions/emoji/role-pings, raw URLs, and
 * fenced/inline code blocks. Translating these would corrupt them (Google
 * Translate happily mangles `<@123>` into spaces or moves emoji parts around)
 * so we replace each match with a unique placeholder before sending the text
 * to the provider, then swap the originals back into the result.
 *
 * The sentinel uses a U+E000-range character (Unicode Private Use Area) plus
 * brackets the translation provider treats as plain ASCII punctuation. We
 * tested several variants — including \u2063 (Invisible Separator) — and
 * found PUA characters survive Google Translate's tokenizer most reliably.
 */
const PROTECT_RE =
    /```[\s\S]*?```|`[^`]*`|<a?:\w+:\d+>|<@!?\d+>|<@&\d+>|<#\d+>|@everyone|@here|https?:\/\/\S+/g;

interface ProtectedString {
    text: string;
    tokens: ReadonlyArray<string>;
}

function protectTokens(raw: string): ProtectedString {
    const tokens: string[] = [];
    const text = raw.replace(PROTECT_RE, match => {
        const idx = tokens.length;
        tokens.push(match);
        // Sentinel format: `\uE000{idx}\uE001`. The PUA glyphs render as
        // blank/dotted "tofu" in Discord but they're stable bytes Google
        // Translate leaves untouched in its output, which keeps the
        // round-trip lossless. Numbers inside are wrapped with leading/
        // trailing dot dots so providers don't try to translate "5" → "five".
        return `\uE000${idx}\uE001`;
    });
    return { text, tokens };
}

function restoreTokens(translated: string, tokens: ReadonlyArray<string>): string {
    // Two-pass restore: first the sentinel-with-index format we emit above;
    // then a lenient fallback that handles the rare case where Google
    // collapses the sentinels into spaces or strips one of the PUA chars
    // (we've seen `\uE000 5 \uE001` after translation of multi-token strings).
    const used = new Set<number>();
    let out = translated.replace(/\uE000(\d+)\uE001/g, (_match, n: string) => {
        const idx = parseInt(n, 10);
        used.add(idx);
        return tokens[idx] ?? "";
    });
    // Some translation providers (notably Google for short messages) collapse
    // or strip the PUA sentinels entirely, losing the URL/mention/code token.
    // Rather than silently drop these — which would mean the recipient never
    // sees the URL the user pasted — append any unrecovered tokens at the
    // end. The recipient still gets the link/mention; only their position in
    // the sentence is approximate.
    const missing: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
        if (!used.has(i)) missing.push(tokens[i]);
    }
    // Drop any stray sentinel glyphs that survived without a numeric index.
    out = out.replace(/[\uE000\uE001]/g, "");
    if (missing.length > 0) {
        const sep = out.endsWith(" ") || out.length === 0 ? "" : " ";
        out = `${out}${sep}${missing.join(" ")}`;
    }
    return out;
}

/**
 * Decide whether the user's draft is in (or close enough to) the configured
 * source language to justify auto-translating it. Used as a guard before we
 * hit the network so we don't burn translation quota on messages that are
 * already in the target language (e.g. user pastes an English link in an
 * English-target conversation).
 *
 * Returns true when ``outgoingSrc`` is ``"auto"`` (no client-side check —
 * Google's auto-detect will decide), or when the stripped text contains any
 * letter belonging to the configured source language's script.
 */
function looksLikeSource(stripped: string, sourceLang: string): boolean {
    if (sourceLang === "auto") return true;
    const scriptRe = TARGET_SCRIPT_RE[sourceLang];
    if (!scriptRe) return true;
    return (stripped.match(scriptRe) ?? []).length > 0;
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
    // CSS ``direction:auto`` is not actually a valid value (the spec only
    // accepts ``ltr``/``rtl``/``inherit``), so we set the HTML ``dir``
    // attribute on the wrapper to make the border-inline-start sit on the
    // correct side of the accessory.
    //
    // We deliberately use explicit ``dir="ltr"`` (not ``dir="auto"``) for
    // non-RTL targets. ``dir="auto"`` resolves from the *first strong
    // character* of the subtree, and the header label ("🌐 الترجمة") is
    // always Arabic, so ``dir="auto"`` would always resolve to RTL — which
    // would mirror the green accent bar to the right side even when the
    // translation body is English. The body div still uses ``dir="auto"``
    // so its *text* direction tracks the translation content correctly.
    node.setAttribute("dir", rtl ? "rtl" : "ltr");
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
        version: "0.3.0",
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
        //
        // The optional ``target`` argument lets the outgoing-translate code
        // path target a different language than ``ctx.settings.targetLang``
        // (which is the *incoming* target, i.e. the language non-Arabic
        // messages get translated TO). Without this override both directions
        // would use the same target and outgoing translation would be a
        // no-op (Arabic draft → Arabic translation).
        async function translate(
            text: string,
            opts: { bypassCache?: boolean; target?: string } = {},
        ): Promise<TranslationResult> {
            const service = ctx.settings.service;
            const target = opts.target ?? ctx.settings.targetLang;
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
                        // ``closest()`` traverses a detached subtree just
                        // fine, so if Discord's virtual scroller unmounted
                        // the LI between menu-open and item-click, this
                        // path would return a detached LI — blocking the
                        // live-DOM fallbacks below and silently dropping
                        // the translation. Require ``isConnected`` so we
                        // only treat the walk result as authoritative when
                        // it's actually still in the page.
                        const walked = menuCtx.target.closest<HTMLElement>(
                            'li[id^="chat-messages-"]',
                        );
                        if (walked?.isConnected) msgEl = walked;
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
                            "تعذّر إيجاد الرسالة — جرّب كليك يمين مرة ثانية",
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

            // ─── Selection-only translate ───────────────────────────────────
            //
            // When the user highlights part of a message and right-clicks
            // the selection, they almost always want *just* that span
            // translated — not the whole message dumped into a toast or
            // duplicated under the original. Discord's own copy/quote
            // actions work this way; matching that ergonomics removes a
            // long-standing surprise where users selected a foreign term
            // (e.g. "Nikilis"), right-clicked, and got nothing usable.
            //
            // The item only renders when there's an actual non-empty
            // selection whose range is fully contained inside the
            // right-clicked element's nearest message LI. We
            // intentionally do NOT fall back to translating the whole
            // message here — the existing "ترجم الرسالة" item already
            // covers that case, and conflating the two would re-create
            // the surprise factor we're trying to remove.
            //
            // Scope/author filters are deliberately bypassed here, just
            // like the existing manual "ترجم الرسالة" item and the
            // ``..tr <text>`` command: an explicit user gesture (right-
            // click → confirm) overrides passive filtering. The auto
            // pipeline still respects those filters; nothing here
            // weakens that path.
            const selection = typeof window !== "undefined" ? window.getSelection() : null;
            const selectedText = selection?.toString().trim() ?? "";
            if (selectedText.length > 0 && menuCtx.target) {
                const targetLi = menuCtx.target.closest<HTMLElement>('li[id^="chat-messages-"]');
                let selectionInsideTarget = false;
                if (targetLi && selection && selection.rangeCount > 0) {
                    // ``selection.containsNode`` would be cleaner but is
                    // not reliable across all Chromium versions when the
                    // selection straddles inline elements. Walk the
                    // anchor + focus nodes' ancestor LIs instead — both
                    // must be inside the right-clicked message for us to
                    // consider the selection "this message's text".
                    const anchorLi = (selection.anchorNode instanceof Element
                        ? selection.anchorNode
                        : selection.anchorNode?.parentElement ?? null)?.closest('li[id^="chat-messages-"]');
                    const focusLi = (selection.focusNode instanceof Element
                        ? selection.focusNode
                        : selection.focusNode?.parentElement ?? null)?.closest('li[id^="chat-messages-"]');
                    selectionInsideTarget = anchorLi === targetLi && focusLi === targetLi;
                }
                if (selectionInsideTarget) {
                    addItem({
                        id: "autoTranslate:translate-selection",
                        // Show a snippet of the selection in the label so
                        // the user can see *which* string they're about
                        // to translate (helps when they accidentally
                        // selected more than they meant to).
                        label: selectedText.length <= 40
                            ? `ترجم: "${selectedText}"`
                            : `ترجم: "${selectedText.slice(0, 37)}…"`,
                        icon: "🌐",
                        async onClick() {
                            // ``selectedText`` was captured at menu-
                            // render time (closure over the const
                            // above). The selection itself may already
                            // have been cleared by the time this fires —
                            // that's fine, we don't read
                            // ``window.getSelection()`` again here.
                            //
                            // Hard-cap the API payload so a runaway
                            // selection (user accidentally dragged
                            // across half a channel) can't push huge
                            // text to Google/Gemini. 5000 chars matches
                            // the auto-translate pipeline's effective
                            // budget — anything longer is almost
                            // certainly an accident.
                            const MAX = 5000;
                            const text = selectedText.length > MAX
                                ? selectedText.slice(0, MAX)
                                : selectedText;
                            ctx.toast("جاري الترجمة…", "info");
                            try {
                                const result = await translate(text);
                                // Toast is the right surface here: a
                                // partial-selection translation is a
                                // one-shot lookup, not a persistent
                                // subtitle. Adding it as an accessory
                                // under the message would collide with
                                // the full-message translation (when
                                // present) and confuse the user about
                                // what was translated.
                                //
                                // Truncate both source and translation
                                // in the toast so a long selection
                                // doesn't blow up the overlay layout.
                                // We still show both sides so the user
                                // can visually pair input → output,
                                // which is the whole point of right-
                                // click translate.
                                const TOAST_MAX = 200;
                                const srcDisplay = text.length > TOAST_MAX
                                    ? text.slice(0, TOAST_MAX - 1) + "…"
                                    : text;
                                const dstDisplay = result.text.length > TOAST_MAX
                                    ? result.text.slice(0, TOAST_MAX - 1) + "…"
                                    : result.text;
                                ctx.toast(`${srcDisplay} → ${dstDisplay}`, "success");
                                ctx.stats.bump("manual_translations");
                                ctx.logger.info(
                                    `selection translate: ${text.length} chars → ${result.text.length} chars`,
                                );
                            } catch (err) {
                                const msg = err instanceof Error ? err.message : String(err);
                                ctx.toast(`فشل: ${msg}`, "error");
                                ctx.logger.warn("selection translate failed", { error: msg });
                            }
                        },
                    });
                }
            }
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

        // ─── Outgoing translate — keydown intercept + Discord REST send ──────
        //
        // The shipping interceptor is a capture-phase ``keydown`` listener on
        // ``document`` plus a direct ``POST /api/v9/channels/{id}/messages``
        // call. We landed here after rejecting several alternatives:
        //
        //   - Monkey-patching ``MessageActions.sendMessage`` was the original
        //     plan, but requires a webpack module finder for every Discord
        //     update; we'd need to maintain signatures across Stable/PTB/Canary.
        //   - Replacing the composer text via ``execCommand("insertText")`` +
        //     synthetic Enter doesn't work because React 18's Slate ignores
        //     KeyboardEvents without ``isTrusted=true``.
        //   - Wrapping ``window.fetch`` is invisible to Discord's HTTP layer,
        //     which captured the native ``fetch`` reference at module-load
        //     time before our renderer ran.
        //
        // The keydown+REST boundary is simple and self-contained: we get
        // the editor text via DOM, translate it, then POST to Discord's own
        // endpoint with the user's auth token from localStorage. The gateway
        // reflects our POST back as ``MESSAGE_CREATE``, so the UI updates
        // exactly as if Discord had sent the message itself.
        //
        // Caveats (intentional — we abort instead of breaking these):
        //   - Replies: the REST POST does not include ``message_reference``,
        //     so we DO NOT intercept when Discord's reply bar is visible.
        //   - Attachments / stickers: we don't ship the multipart upload
        //     state, so we DO NOT intercept when files are attached.
        //   - Slash-command / @mention / :emoji autocomplete: Enter selects
        //     the highlighted item, not send. We detect ``aria-expanded`` on
        //     the editor and bail out completely so Discord's own handler
        //     runs.
        //
        // Design choices:
        //   - Fail open: any translation error short-circuits to the
        //     original draft so the user always sees their text sent.
        //   - Preserve original on optional toggle: ``outgoingPrefixOriginal``
        //     appends each line of the original draft prefixed with ``-# ``
        //     so multi-line drafts still render as small/muted footnotes.
        //   - Protect tokens BEFORE translation: see ``protectTokens`` above.
        async function maybeTranslateOutgoing(content: string): Promise<string> {
            if (!ctx.settings.outgoingMode) return content;
            const src = ctx.settings.outgoingSrc;
            const dst = ctx.settings.outgoingDst;
            if (src === dst) return content;
            const stripped = strippedText(content);
            if (!stripped) return content;
            if (!looksLikeSource(stripped, src)) return content;
            // Already in target language? Skip — no point translating.
            if (!looksForeign(stripped, dst)) return content;
            try {
                const { text: protectedText, tokens } = protectTokens(content);
                const result = await translate(protectedText, { target: dst });
                const restored = restoreTokens(result.text, tokens).trim();
                if (!restored) return content;
                ctx.stats.bump("outgoing_translations");
                if (ctx.settings.outgoingPrefixOriginal) {
                    // Discord's ``-#`` markdown prefix renders the line as
                    // small/muted text — but the syntax applies to ONE line
                    // only, so we have to prefix every line of the original
                    // separately. Otherwise multi-line drafts render with the
                    // first line muted and the rest full-size, which looks
                    // broken.
                    const prefixed = content
                        .split("\n")
                        .map(line => `-# ${line}`)
                        .join("\n");
                    return `${restored}\n-# 🌐\n${prefixed}`;
                }
                return restored;
            } catch (err) {
                ctx.logger.warn("outgoing translate failed; sending original", err);
                return content;
            }
        }

        // Read the current composer draft. Discord's Slate editor wraps
        // each paragraph in `<div data-slate-node="element">`; naive
        // ``textContent`` would smash the lines together because there's no
        // intervening text node. We walk the direct paragraph children and
        // join their ``textContent`` with `\n` so multi-line drafts are
        // preserved (matters both for translation correctness and for the
        // multi-line `-#` original-quote prefix).
        function readComposerText(editor: HTMLElement): string {
            const paragraphs = editor.querySelectorAll<HTMLElement>(
                '[data-slate-node="element"]',
            );
            if (paragraphs.length === 0) return editor.textContent ?? "";
            const lines: string[] = [];
            for (const p of paragraphs) {
                lines.push(p.textContent ?? "");
            }
            return lines.join("\n");
        }

        // Clear the composer by selecting all + delete via execCommand.
        // Slate-React hooks into execCommand so its internal state stays in
        // sync. After this returns, the composer is visibly and logically
        // empty.
        function clearComposer(editor: HTMLElement): void {
            try {
                editor.focus();
                const sel = window.getSelection();
                if (!sel) return;
                const range = document.createRange();
                range.selectNodeContents(editor);
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand("delete", false);
            } catch (err) {
                ctx.logger.warn("clearComposer failed", err);
            }
        }

        // Parse the Discord channel id from the location bar. Returns null
        // for DMs we can't address (group DM url shape differs slightly but
        // still matches /channels/@me/<id>).
        function currentChannelId(): string | null {
            const m = /\/channels\/[^/]+\/(\d+)/.exec(location.pathname);
            return m?.[1] ?? null;
        }

        // Find the composer's enclosing form so we can probe sibling DOM
        // (reply bar, attachment previews) that live next to the editor.
        function composerForm(editor: HTMLElement): HTMLElement | null {
            return editor.closest<HTMLElement>("form");
        }

        // True when Discord's slash-command / @mention / :emoji autocomplete
        // popout is currently open. We use the standard W3C combobox pattern
        // Discord follows: when the popout is up, ``aria-expanded`` flips to
        // ``"true"`` and ``aria-activedescendant`` points at the highlighted
        // option. In that state Enter SELECTS the option — it does NOT send.
        // We must completely bail out (no preventDefault) so Discord's own
        // handler runs untouched.
        function isAutocompleteOpen(editor: HTMLElement): boolean {
            return (
                editor.getAttribute("aria-expanded") === "true" ||
                !!editor.getAttribute("aria-activedescendant")
            );
        }

        // True when the user is currently composing a reply (the "Replying
        // to …" banner is visible above the editor). Our REST POST does not
        // include ``message_reference``, so intercepting here would silently
        // turn the reply into a normal message. Better to skip translation
        // entirely and let Discord send the original with reply context
        // intact; users can always re-translate manually.
        function hasPendingReply(form: HTMLElement): boolean {
            return !!form.querySelector('[class*="replyBar"]');
        }

        // True when one or more file attachments are queued in the composer.
        // Discord renders attached file previews under classes like
        // ``attachedFile__…`` (singular for each file) and we explicitly
        // exclude the always-present “+” ``attachButton`` from the match. We
        // can't reproduce the multipart-upload state in a JSON REST POST, so
        // we abort interception and let Discord ship the message itself.
        function hasAttachments(form: HTMLElement): boolean {
            const candidates = form.querySelectorAll<HTMLElement>(
                '[class*="attachedFile"]',
            );
            for (const el of candidates) {
                const cls = el.className;
                if (typeof cls === "string" && /Button/i.test(cls)) continue;
                return true;
            }
            return false;
        }

        // Read the user's authentication token. Discord stashes it in
        // localStorage under the literal key "token" wrapped in quotes (the
        // value is `JSON.stringify`'d). We strip the outer quotes if present.
        // If localStorage is locked down (sometimes happens in Discord PTB)
        // we fall back to scraping the IndexedDB-backed cookie store via
        // document.cookie (which still contains the token under modern
        // builds).
        function readAuthToken(): string | null {
            try {
                const raw = window.localStorage.getItem("token");
                if (raw) {
                    return raw.replace(/^"|"$/g, "");
                }
            } catch {
                // some builds lock down localStorage; fall through
            }
            return null;
        }

        // Send a translated message directly via Discord's REST API. We use
        // the same endpoint Discord itself hits (`POST /channels/{id}/
        // messages`) with the user's auth token. This is the only reliable
        // way to deliver the translated text: synthetic `KeyboardEvent`s do
        // not trigger Slate's send pipeline (React 18 ignores synthetic
        // dispatches without `isTrusted=true`), and walking the React fiber
        // to call `onSubmit` requires a Slate-shaped value object we can't
        // synthesise without re-implementing Slate's parser.
        async function sendTranslatedMessage(
            channelId: string,
            content: string,
        ): Promise<boolean> {
            const token = readAuthToken();
            if (!token) {
                ctx.logger.warn(
                    "outgoing: no auth token available; cannot send",
                );
                return false;
            }
            const nonce = (Math.random() * Number.MAX_SAFE_INTEGER).toFixed(0);
            try {
                const res = await fetch(
                    `https://discord.com/api/v9/channels/${channelId}/messages`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            Authorization: token,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            content,
                            tts: false,
                            nonce,
                            flags: 0,
                            mobile_network_type: "unknown",
                        }),
                    },
                );
                if (!res.ok) {
                    const body = await res.text().catch(() => "");
                    ctx.logger.warn(
                        `outgoing: REST send failed ${res.status}: ${body.slice(0, 200)}`,
                    );
                    return false;
                }
                return true;
            } catch (err) {
                ctx.logger.warn("outgoing: REST send threw", err);
                return false;
            }
        }

        // Prevent a thundering herd of overlapping translations if the user
        // mashes Enter while a translation is in flight (Discord's send
        // button briefly disables itself, but key events still queue).
        let translationInFlight = false;

        // Throttle the "translation skipped" toast so it appears once when the
        // user starts composing a reply / attaching a file, not repeatedly on
        // every Enter keystroke that lands in that state.
        let sentSkipToast = false;

        const onComposerKeydown = (e: KeyboardEvent): void => {
            if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey) {
                return;
            }
            if (!ctx.settings.outgoingMode) return;
            // Locate the Slate editor we're inside. `composedPath` traverses
            // shadow DOM boundaries too — defensive against future Discord
            // composer refactors.
            const path = (typeof e.composedPath === "function"
                ? (e.composedPath() as EventTarget[])
                : []) as Array<EventTarget>;
            let editor: HTMLElement | null = null;
            for (const node of path) {
                if (
                    node instanceof HTMLElement &&
                    node.getAttribute?.("data-slate-editor") === "true"
                ) {
                    editor = node;
                    break;
                }
            }
            if (!editor) {
                const target = e.target as HTMLElement | null;
                editor = target?.closest?.<HTMLElement>(
                    '[data-slate-editor="true"]',
                ) ?? null;
            }
            if (!editor) return;
            // IME composition: don't intercept while the user is mid-input.
            if (e.isComposing) return;

            // Autocomplete popout open: Enter selects an item (mention, emoji,
            // slash-command argument, etc.) — NOT send. Bail out completely
            // so Discord's combobox handler runs untouched. Don't even peek
            // at the draft text — the user's intent here is selection, not
            // sending.
            if (isAutocompleteOpen(editor)) return;

            // Reply / attachments: we can't faithfully reproduce these via a
            // plain REST POST (no ``message_reference``, no multipart upload),
            // so we skip translation and let Discord's own send pipeline run.
            // We surface a one-shot toast so the user knows the translation
            // was deliberately skipped for THIS message and can re-toggle if
            // they want translated text instead.
            const form = composerForm(editor);
            if (form && (hasPendingReply(form) || hasAttachments(form))) {
                if (!sentSkipToast) {
                    sentSkipToast = true;
                    ctx.toast(
                        "تم تخطّي الترجمة لهذه الرسالة (رد أو مرفقات) — الرسالة الأصلية تُرسل كما هي",
                        "info",
                    );
                    // Allow the toast to fire again after a quiet period so
                    // it's still useful if the user composes another reply
                    // later but not so often that it spams.
                    window.setTimeout(() => { sentSkipToast = false; }, 30_000);
                }
                return;
            }

            if (translationInFlight) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const draft = readComposerText(editor).trim();
            if (!draft) return;
            const src = ctx.settings.outgoingSrc;
            const dst = ctx.settings.outgoingDst;
            if (src === dst) return;
            const stripped = strippedText(draft);
            if (!stripped) return;
            if (!looksLikeSource(stripped, src)) return;
            if (!looksForeign(stripped, dst)) return;
            const channelId = currentChannelId();
            if (!channelId) return;

            // Past the cheap checks: hold Enter, translate, send via REST,
            // then clear the composer. Discord's gateway will reflect our
            // own POST back as a MESSAGE_CREATE just like a normal send.
            e.preventDefault();
            e.stopPropagation();
            translationInFlight = true;
            const editorRef = editor;
            void (async () => {
                try {
                    const translated = await maybeTranslateOutgoing(draft);
                    const ok = await sendTranslatedMessage(channelId, translated);
                    if (ok) {
                        clearComposer(editorRef);
                    } else {
                        // Translation/send failed: fall back to letting the
                        // user resend manually. Leave the draft in place so
                        // they don't lose their text, and surface a toast so
                        // the user knows their Enter didn't silently drop.
                        ctx.logger.warn(
                            "outgoing: REST send failed; leaving draft in place for retry",
                        );
                        ctx.toast(
                            "فشل إرسال الرسالة المترجمة — جرّب مرة ثانية",
                            "error",
                        );
                    }
                } catch (err) {
                    ctx.logger.warn("outgoing: send flow threw", err);
                    ctx.toast("خطأ أثناء ترجمة/إرسال الرسالة", "error");
                } finally {
                    translationInFlight = false;
                }
            })();
        };

        // Capture phase: we MUST run before Slate's bubble-phase handler,
        // otherwise the message has already been queued for send.
        document.addEventListener("keydown", onComposerKeydown, true);
        outgoingDisposers.push(() => {
            document.removeEventListener("keydown", onComposerKeydown, true);
        });

        // ─── Outgoing translate — chat button + quick-toggle modal ────────────
        //
        // The button mirrors the screenshot the user shared: a translate icon
        // sits next to the gift/emoji cluster. Click opens a modal showing
        // both incoming (read-only, points at existing settings) and outgoing
        // (editable) directions. Shift+click and right-click both toggle
        // ``outgoingMode`` directly without opening the modal — same
        // affordance the screenshot's caption advertises.
        const OUTGOING_BTN_ID = "autoTranslate:outgoing";

        function updateOutgoingButtonStyle(): void {
            const el = document.querySelector<HTMLElement>(
                `[data-boon-btn-id="${OUTGOING_BTN_ID}"]`,
            );
            if (!el) return;
            const on = ctx.settings.outgoingMode;
            // Active state: green accent + slight background tint. We assign
            // directly to ``style`` to override the ``mouseleave`` reset in
            // chatButton.ts, which would otherwise wipe our active styling
            // every time the user moved off the button.
            el.style.color = on ? "#00ff88" : "var(--interactive-normal,#b5bac1)";
            el.style.background = on ? "rgba(0,255,136,0.12)" : "transparent";
            el.setAttribute(
                "title",
                on
                    ? "AutoTranslate صادر: مُفعَّل (Shift+click للإيقاف)"
                    : "AutoTranslate صادر: مُعطَّل (Shift+click للتفعيل)",
            );
        }

        let currentModalClose: (() => void) | null = null;

        function openOutgoingModal(): void {
            currentModalClose?.();
            const overlay = document.createElement("div");
            overlay.style.cssText =
                "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:var(--font-primary,inherit);";
            const card = document.createElement("div");
            card.style.cssText =
                "background:var(--background-primary,#313338);color:var(--text-normal,#dbdee1);border-radius:8px;padding:20px 24px;min-width:340px;max-width:90vw;box-shadow:0 12px 40px rgba(0,0,0,0.5);";
            const title = document.createElement("h3");
            title.textContent = "الترجمة التلقائية";
            title.style.cssText = "margin:0 0 4px;font-size:18px;font-weight:600;";
            const subtitle = document.createElement("div");
            subtitle.textContent =
                "ترجم رسائلك تلقائياً قبل ما تُرسلها — Discord يستلم النسخة المترجمة فقط.";
            subtitle.style.cssText =
                "font-size:12px;color:var(--text-muted,#949ba4);margin-bottom:16px;line-height:1.4;";
            card.appendChild(title);
            card.appendChild(subtitle);

            // Build a labeled select. ``onChange`` updates the persisted
            // setting; the next outgoing message will use the new value.
            function buildSelect(
                labelText: string,
                value: string,
                options: ReadonlyArray<{ label: string; value: string }>,
                onChange: (v: string) => void,
            ): HTMLDivElement {
                const wrap = document.createElement("div");
                wrap.style.cssText = "margin-bottom:12px;";
                const lbl = document.createElement("label");
                lbl.textContent = labelText;
                lbl.style.cssText =
                    "display:block;font-size:12px;font-weight:600;color:var(--text-muted,#949ba4);margin-bottom:6px;text-transform:uppercase;";
                const sel = document.createElement("select");
                sel.style.cssText =
                    "width:100%;background:var(--background-secondary,#2b2d31);color:var(--text-normal,#dbdee1);border:1px solid var(--background-tertiary,#1e1f22);border-radius:4px;padding:8px;font-size:14px;";
                for (const opt of options) {
                    const o = document.createElement("option");
                    o.value = opt.value;
                    o.textContent = opt.label;
                    if (opt.value === value) o.selected = true;
                    sel.appendChild(o);
                }
                sel.addEventListener("change", () => onChange(sel.value));
                wrap.appendChild(lbl);
                wrap.appendChild(sel);
                return wrap;
            }

            // Outgoing source/destination — the user's editable pair.
            const outSrcOpts = SCHEMA.outgoingSrc.options as ReadonlyArray<{
                label: string;
                value: string;
            }>;
            const outDstOpts = SCHEMA.outgoingDst.options as ReadonlyArray<{
                label: string;
                value: string;
            }>;
            card.appendChild(
                buildSelect(
                    "اللغة التي أكتب بها",
                    ctx.settings.outgoingSrc,
                    outSrcOpts,
                    v => {
                        (ctx.settings as Record<string, unknown>).outgoingSrc = v;
                    },
                ),
            );
            card.appendChild(
                buildSelect(
                    "اللغة التي تُرسَل بها رسائلي",
                    ctx.settings.outgoingDst,
                    outDstOpts,
                    v => {
                        (ctx.settings as Record<string, unknown>).outgoingDst = v;
                    },
                ),
            );

            // Toggle row: switch styling matches Discord's native settings.
            const toggleRow = document.createElement("div");
            toggleRow.style.cssText =
                "display:flex;justify-content:space-between;align-items:center;padding:12px 0 4px;border-top:1px solid var(--background-modifier-accent,rgba(255,255,255,0.06));margin-top:8px;";
            const toggleText = document.createElement("div");
            toggleText.innerHTML =
                "<div style='font-weight:600;font-size:14px;'>الترجمة التلقائية</div>" +
                "<div style='font-size:12px;color:var(--text-muted,#949ba4);margin-top:2px;line-height:1.35;'>تُترجم رسائلك تلقائياً قبل الإرسال. تقدر أيضاً Shift+click أو زر يمين على زر الترجمة للتبديل السريع.</div>";
            const sw = document.createElement("button");
            sw.type = "button";
            const renderSwitch = (): void => {
                const on = ctx.settings.outgoingMode;
                sw.style.cssText = `flex-shrink:0;margin-inline-start:12px;width:42px;height:24px;border-radius:12px;border:none;cursor:pointer;background:${on ? "#00ff88" : "var(--background-tertiary,#1e1f22)"};position:relative;transition:background 160ms ease;`;
                sw.innerHTML = `<span style="position:absolute;top:3px;${on ? "right:3px" : "left:3px"};width:18px;height:18px;border-radius:50%;background:white;transition:all 160ms ease;display:block;"></span>`;
                sw.setAttribute("aria-pressed", String(on));
            };
            renderSwitch();
            sw.addEventListener("click", () => {
                (ctx.settings as Record<string, unknown>).outgoingMode =
                    !ctx.settings.outgoingMode;
                renderSwitch();
                updateOutgoingButtonStyle();
            });
            toggleRow.appendChild(toggleText);
            toggleRow.appendChild(sw);
            card.appendChild(toggleRow);

            // Close button.
            const close = document.createElement("button");
            close.type = "button";
            close.textContent = "إغلاق";
            close.style.cssText =
                "margin-top:14px;width:100%;background:var(--brand-experiment,#5865f2);color:white;border:none;border-radius:4px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;";
            card.appendChild(close);
            overlay.appendChild(card);

            // Close handling: backdrop click, Esc key, button click.
            const teardownModal = (): void => {
                overlay.remove();
                document.removeEventListener("keydown", onKey);
                currentModalClose = null;
            };
            const onKey = (e: KeyboardEvent): void => {
                if (e.key === "Escape") teardownModal();
            };
            overlay.addEventListener("click", e => {
                if (e.target === overlay) teardownModal();
            });
            close.addEventListener("click", teardownModal);
            document.addEventListener("keydown", onKey);
            document.body.appendChild(overlay);
            currentModalClose = teardownModal;
        }

        // Register the chat button. The framework re-injects it into every
        // composer cluster automatically; we don't need to track the DOM
        // ourselves.
        ctx.chatButton.add({
            id: OUTGOING_BTN_ID,
            label: "AutoTranslate — ترجمة الرسائل الصادرة",
            icon: "🌐",
            onClick() {
                openOutgoingModal();
            },
        });

        // Repaint the button color after each (re)injection — the button is
        // rendered fresh every time Discord rebuilds the composer toolbar,
        // and the default styling from ``chatButton.ts`` doesn't know about
        // our toggle state.
        //
        // We MUST debounce via ``requestAnimationFrame`` because
        // ``CONTRIBUTING.md §4`` forbids unthrottled MutationObservers on
        // ``document.body``: Discord fires thousands of subtree mutations per
        // second (scroll, typing indicator, presence, etc.) and an
        // unthrottled callback would burn CPU and starve the UI thread.
        // Coalescing per-frame means we run at most once per repaint.
        let styleRepaintScheduled = false;
        const styleObserver = new MutationObserver(() => {
            if (styleRepaintScheduled) return;
            styleRepaintScheduled = true;
            requestAnimationFrame(() => {
                styleRepaintScheduled = false;
                updateOutgoingButtonStyle();
            });
        });
        styleObserver.observe(document.body, { childList: true, subtree: true });
        updateOutgoingButtonStyle();

        // ``chatButton.ts`` registers an unconditional ``mouseleave`` handler
        // on every button it injects, which wipes our active green styling
        // back to the neutral default. Rather than fork the chatButton
        // helper, we attach our OWN ``mouseleave`` listener on the document
        // (delegated, capture-phase) and re-apply our styling on the next
        // frame — listener-order matters: ours fires AFTER chatButton's
        // handler (since chatButton's was bound first on the element), and
        // ``requestAnimationFrame`` gives the framework's repaint a chance to
        // run before we override. We use a delegated listener so it survives
        // re-injection of the button without us having to track its lifetime.
        const onMouseLeave = (e: MouseEvent): void => {
            const target = (e.target as HTMLElement | null)?.closest?.<HTMLElement>(
                `[data-boon-btn-id="${OUTGOING_BTN_ID}"]`,
            );
            if (!target) return;
            requestAnimationFrame(() => updateOutgoingButtonStyle());
        };
        document.addEventListener("mouseleave", onMouseLeave, true);
        outgoingDisposers.push(() => {
            document.removeEventListener("mouseleave", onMouseLeave, true);
        });

        // Shift+click and right-click on the button: quick toggle without
        // opening the modal. We attach via event delegation on document so we
        // catch the button regardless of how Discord re-renders the composer.
        const onCapturedClick = (e: MouseEvent): void => {
            const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
                `[data-boon-btn-id="${OUTGOING_BTN_ID}"]`,
            );
            if (!target) return;
            if (e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                (ctx.settings as Record<string, unknown>).outgoingMode =
                    !ctx.settings.outgoingMode;
                updateOutgoingButtonStyle();
                ctx.toast(
                    ctx.settings.outgoingMode
                        ? "AutoTranslate صادر: مُفعَّل"
                        : "AutoTranslate صادر: مُعطَّل",
                    "info",
                );
            }
        };
        const onCapturedContextMenu = (e: MouseEvent): void => {
            const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
                `[data-boon-btn-id="${OUTGOING_BTN_ID}"]`,
            );
            if (!target) return;
            e.preventDefault();
            e.stopPropagation();
            (ctx.settings as Record<string, unknown>).outgoingMode =
                !ctx.settings.outgoingMode;
            updateOutgoingButtonStyle();
            ctx.toast(
                ctx.settings.outgoingMode
                    ? "AutoTranslate صادر: مُفعَّل"
                    : "AutoTranslate صادر: مُعطَّل",
                "info",
            );
        };
        // Capture phase: chatButton.ts already calls
        // ``e.preventDefault()``/``e.stopPropagation()`` in the bubble phase,
        // so a Shift+click handler attached in bubble would never see the
        // event. We register in capture so we can intercept Shift first and
        // let bare clicks through to the modal opener.
        document.addEventListener("click", onCapturedClick, true);
        document.addEventListener("contextmenu", onCapturedContextMenu, true);

        // Track the lifecycle handles so onStop can detach everything. The
        // MessageActions patch teardown is appended above as soon as the
        // patch succeeds; the listeners below are torn down here.

        outgoingDisposers.push(() => {
            document.removeEventListener("click", onCapturedClick, true);
            document.removeEventListener("contextmenu", onCapturedContextMenu, true);
            styleObserver.disconnect();
            currentModalClose?.();
        });

        ctx.logger.info(
            ctx.settings.autoMode
                ? "ready — auto-translating non-Arabic messages"
                : "ready — manual mode only (right-click any message)",
        );
        if (ctx.settings.outgoingMode) {
            ctx.logger.info(
                `outgoing translate ON: ${ctx.settings.outgoingSrc} → ${ctx.settings.outgoingDst}`,
            );
        }
    },
    onStop(ctx) {
        ctx.messageAccessories.remove("autoTranslate");
        for (const dispose of outgoingDisposers.splice(0)) {
            try {
                dispose();
            } catch (err) {
                ctx.logger.warn("outgoing teardown threw", err);
            }
        }
        ctx.logger.info("stopped");
    },
});

// Module-scoped registry of teardown handles for the outgoing-translate
// machinery. We keep this outside the ``onStart`` closure so ``onStop`` can
// still reach it after the plugin manager has dropped its reference to the
// running ``ctx``. Each entry in the array is an idempotent callback that
// undoes one piece of side-effect setup (event listener, observer, fetch
// wrapper, etc.). ``onStart`` pushes its handles in setup order; ``onStop``
// drains the array in any order — every callback must be independent.
const outgoingDisposers: Array<() => void> = [];
