/*
 * BOON Plugin: ShowHiddenChannels — discovery
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Enumerates every channel of a guild via Discord's `ChannelStore` and
 * partitions them into "visible" vs "hidden" using `PermissionStore.can`
 * with the VIEW_CHANNEL bit. Returns a denormalised list of metadata that
 * the panel UI renders.
 *
 * The discovery layer has zero DOM dependencies — it's pure functions over
 * webpack stores. That makes it cheap to call repeatedly (the panel
 * re-scans on every open and on a slow timer) and trivial to test in
 * isolation if we ever add a unit-test target.
 */

import {
    dumpStoresForDiagnostic,
    getChannelStore,
    getGuildStore,
    getPermissionStore,
    iterateStoreShapedExports,
    probeWebpackForDiagnostic,
} from "../../core/webpack/index.js";

/**
 * One-shot guard so we don't spam Discord's console every time the panel
 * re-renders. When `getChannelStore()` returns null we want a single dump
 * we can inspect in DevTools to figure out which build-specific method the
 * channel records actually live behind.
 */
let didDumpStoresOnce = false;

/**
 * Per-candidate probe attempt captured by `findChannelStoreBrute`. Surfaces
 * exactly what each candidate's `getMutableGuildChannelsForGuild(guildId)`
 * returned, so when the brute-force fails we can see whether the response
 * was empty, the wrong shape, or threw.
 */
interface ChannelProbeAttempt {
    /** Which lookup method we called. */
    method: string;
    /** `typeof` the return value. */
    resultType: string;
    /** Constructor name of the probe response itself. */
    ctorName: string | null;
    /** Whether the call threw (and if so, the message). */
    threw: string | null;
    /** Length we managed to extract via {@link extractRecordValues}. */
    extractedCount: number;
    /** Enumerable-own keys of the probe response (capped at 8). */
    probeOwnKeys: string[];
    /** Enumerable-own keys of `values[0]` (capped at 8). */
    firstValueKeys: string[];
    /** `typeof values[0]` so we can detect string-returning wrappers. */
    firstValueType: string;
    /** Constructor name of `values[0]`. */
    firstValueCtor: string | null;
    /** Own property names of `values[0]` including non-enumerable (capped at 8). */
    firstValueOwnPropertyNames: string[];
    /** JSON.stringify(values[0]) truncated to 200 chars; null if stringify failed. */
    firstValueSample: string | null;
    /** Did the result pass {@link looksLikeChannelRecord}? */
    shapeMatched: boolean;
}

let lastChannelProbeAttempts: ChannelProbeAttempt[] = [];
let lastI18nProxiesSkipped = 0;

/**
 * Snapshot the webpack subsystem when a store lookup fails and stash it on a
 * window global so we can inspect it from DevTools without redeploying. The
 * panel still renders a short Arabic message — we don't pollute the UI with
 * jargon — but anyone debugging on a user's machine can paste
 * `window.__alitraviansShcDebug` into the console.
 */
function publishProbe(reasonKey: string): void {
    try {
        const p = probeWebpackForDiagnostic("getMutableGuildChannelsForGuild");
        const detail = {
            at: new Date().toISOString(),
            reason: reasonKey,
            cachedExportsCount: p.cachedExportsCount,
            hasModuleRegistry: p.hasModuleRegistry,
            hasModuleCache: p.hasModuleCache,
            moduleRegistryKeyCount: p.moduleRegistryKeyCount,
            factoriesWithMarker: p.factoriesWithMarker,
            storeShapedExports: p.storeShapedExports,
            storeNames: p.storeNames,
            unnamedStoreSamples: p.unnamedStoreSamples,
            // How many store-shaped candidates we rejected as the i18n
            // MessagesStore Proxy before they entered the probe loop. On
            // modern Discord builds the Proxy fakes every method and is
            // duplicated across many cached exports, so this number is
            // typically large (20+).
            i18nProxiesSkipped: lastI18nProxiesSkipped,
            // Surfaces the per-candidate brute-force probe results so we can
            // see exactly why every candidate was rejected (empty/threw/bad
            // shape) and adjust the validator in a follow-up release.
            channelProbeAttempts: lastChannelProbeAttempts,
        };
        (window as unknown as Record<string, unknown>).__alitraviansShcDebug = detail;
        // Also write to console once so it's visible without manual probing.
        // eslint-disable-next-line no-console
        console.warn("[alitravians] showHiddenChannels store lookup failed:", detail);
    } catch {
        // Diagnostics must never throw.
    }
}

/**
 * Method names Discord has historically used for the "give me every channel
 * in this guild" lookup. The first one is the long-standing public API; the
 * second is the newer GuildChannelStore variant that some builds expose; the
 * third is what some experimental builds carry. We try each in order against
 * every cached Flux-shaped object, with the real `guildId` as the probe,
 * because a behavioural probe is the only reliable way to distinguish the
 * real channel store from Discord's i18n `MessagesStore` Proxy (which fakes
 * a function for *every* property access).
 */
const CHANNEL_LOOKUP_METHODS = [
    "getMutableGuildChannelsForGuild",
    "getMutableBasicGuildChannelsForGuild",
    "getChannels",
] as const;

/**
 * The canonical method-name signature of a Discord ChannelStore. A candidate
 * that exposes ALL of these as functions is structurally a ChannelStore even
 * if behavioural probing fails (e.g. when the guild's channel data isn't
 * cached yet, the lookup returns an empty record but the candidate is still
 * the right store).
 */
const CHANNEL_STORE_SIGNATURE = [
    "getChannel",
    "getMutableGuildChannelsForGuild",
] as const;

/** Per-strategy soft cap. Generous headroom over Discord's 500-channel limit. */
const EXTRACTION_CAP = 4096;

/**
 * A value looks like a Discord channel record if it carries an `id` (string
 * or number) AND a `type` / `kind` numeric field. We accept multiple field
 * names because Discord has been known to rename `type` → `kind` in
 * experimental builds. Properties may be non-enumerable (defined via
 * `Object.defineProperty` or class getters) — we use direct access so
 * getters / prototype chain are honoured.
 */
function looksLikeChannelRecord(v: unknown): boolean {
    if (!v || typeof v !== "object") return false;
    try {
        const c = v as Record<string, unknown>;
        const hasId = typeof c.id === "string" || typeof c.id === "number" || typeof c.id === "bigint";
        if (!hasId) return false;
        const hasType = typeof c.type === "number" || typeof c.kind === "number";
        return hasType;
    } catch {
        return false;
    }
}

/**
 * Run all four shape-specific extraction strategies on `probe` and return
 * every non-empty result. Strategies tried:
 *   1. `Object.values` for plain records (historical Discord shape).
 *   2. `.values()` iterator for ES `Map` / ImmutableJS `Map`.
 *   3. `.toJS()` materialisation for ImmutableJS containers.
 *   4. `Symbol.iterator` for anything else iterable.
 * Each strategy is independent — a successful strategy does not short-circuit
 * the others. The caller picks the strategy whose output is channel-shaped.
 */
function collectExtractionCandidates(probe: unknown): unknown[][] {
    if (probe == null || typeof probe !== "object") return [];
    const out: unknown[][] = [];
    // Strategy 1: plain object (Object.values).
    try {
        const vals = Object.values(probe as Record<string, unknown>);
        if (vals.length > 0) out.push(vals);
    } catch { /* swallow */ }
    // Strategy 2: ES Map / ImmutableJS Map (anything with a custom `values()`
    // iterator). Object.prototype has no `.values` member, so the typeof check
    // alone is enough — any object exposing `.values()` is a custom container.
    try {
        const p = probe as { values?: () => Iterable<unknown> };
        if (typeof p.values === "function") {
            const acc: unknown[] = [];
            for (const v of p.values()) {
                acc.push(v);
                if (acc.length >= EXTRACTION_CAP) break;
            }
            if (acc.length > 0) out.push(acc);
        }
    } catch { /* swallow */ }
    // Strategy 3: ImmutableJS — `.toJS()` materialises to a plain object.
    try {
        const p = probe as { toJS?: () => unknown };
        if (typeof p.toJS === "function") {
            const js = p.toJS();
            if (js && typeof js === "object") {
                const vals = Object.values(js as Record<string, unknown>);
                if (vals.length > 0) out.push(vals);
            }
        }
    } catch { /* swallow */ }
    // Strategy 4: any iterable (Symbol.iterator).
    try {
        const p = probe as { [Symbol.iterator]?: () => Iterator<unknown> };
        if (typeof p[Symbol.iterator] === "function") {
            const acc: unknown[] = [];
            for (const v of probe as Iterable<unknown>) {
                acc.push(v);
                if (acc.length >= EXTRACTION_CAP) break;
            }
            if (acc.length > 0) out.push(acc);
        }
    } catch { /* swallow */ }
    return out;
}

/**
 * Pull channel-record values out of whatever shape Discord's lookup methods
 * decided to return. Tries every extraction strategy at the top level first;
 * if none yield channel-shaped data, descends one level into each candidate's
 * values to handle wrapped responses (e.g. `{ records: Map, meta: {} }` or
 * `{ 0: textChannelMap, 2: voiceChannelMap }` where channels are grouped by
 * type).
 *
 * Returns the first strategy / descent whose first value passes
 * {@link looksLikeChannelRecord}. If no strategy at any depth produces
 * channel-shaped data, returns the top-level Strategy-1 output so the
 * caller's diagnostic can publish the actual response shape.
 */
function extractRecordValues(probe: unknown, depth: number = 2): unknown[] {
    if (probe == null || typeof probe !== "object" || depth < 0) return [];
    const candidates = collectExtractionCandidates(probe);
    // Prefer the first strategy whose first value looks like a channel record.
    for (const vals of candidates) {
        if (looksLikeChannelRecord(vals[0])) return vals;
    }
    // Top-level didn't yield channel records. Descend one level into each
    // candidate's values; flatten all channel-shaped descents into one list.
    if (depth > 0) {
        for (const vals of candidates) {
            const flat: unknown[] = [];
            for (const inner of vals) {
                const innerVals = extractRecordValues(inner, depth - 1);
                if (innerVals.length > 0 && looksLikeChannelRecord(innerVals[0])) {
                    for (const r of innerVals) {
                        flat.push(r);
                        if (flat.length >= EXTRACTION_CAP) break;
                    }
                    if (flat.length >= EXTRACTION_CAP) break;
                }
            }
            if (flat.length > 0) return flat;
        }
    }
    // Best-effort: surface the top-level Strategy-1 output so diagnostic shows
    // the wrapping shape that defeated extraction.
    return candidates[0] ?? [];
}

/**
 * Detects responses produced by Discord's i18n `MessagesStore` Proxy. The
 * Proxy traps every property access and, when called, returns one of two
 * shapes:
 *   - a bare translation `string` (legacy behaviour), or
 *   - a compiled `{ locale: string, ast: ... }` AST object (current
 *     builds use this so `<FormattedMessage>` can re-render with variables).
 * A real ChannelStore.getChannel(id) returns `undefined` for an unknown id
 * or a channel record with `id` + `type` — never an i18n AST.
 */
function looksLikeI18nResponse(r: unknown): boolean {
    if (typeof r === "string") return true;
    if (r != null && typeof r === "object") {
        const ro = r as Record<string, unknown>;
        if (typeof ro.locale === "string" && "ast" in ro) return true;
    }
    return false;
}

/**
 * Returns true when `candidate` is the i18n MessagesStore Proxy masquerading
 * as a Flux store. The Proxy fakes every method, so structural method-name
 * checks (`getChannel`, `getMutableGuildChannelsForGuild`, etc.) pass for it.
 * We smoke-test via `getChannel('0')` and reject responses that look like
 * i18n output — string or `{ locale, ast }` AST. On modern Discord builds
 * this Proxy is referenced from dozens of cached exports; without an early
 * filter, the brute-force loop hits its per-attempt cap probing Proxy
 * duplicates and never reaches the real ChannelStore.
 */
function isI18nProxyImpostor(candidate: unknown): boolean {
    if (!candidate || typeof candidate !== "object") return false;
    const o = candidate as Record<string, unknown>;
    if (typeof o.getChannel !== "function") return false;
    try {
        const r = (o.getChannel as (id: string) => unknown).call(candidate, "0");
        return looksLikeI18nResponse(r);
    } catch {
        // Real ChannelStore.getChannel may throw on a bad-id input on some
        // builds; throwing is not Proxy behaviour, so it's *not* an impostor.
        return false;
    }
}

/**
 * Returns true if the candidate exposes the canonical ChannelStore method
 * signature AND is not Discord's i18n `MessagesStore` Proxy in disguise.
 *
 * Used as a structural-fallback signal when the behavioural probe fails on
 * every candidate (e.g. Discord lazy-loaded the guild's channels after our
 * scan ran).
 */
function hasChannelStoreSignature(candidate: unknown): boolean {
    if (!candidate || typeof candidate !== "object") return false;
    const o = candidate as Record<string, unknown>;
    for (const m of CHANNEL_STORE_SIGNATURE) {
        if (typeof o[m] !== "function") return false;
    }
    return !isI18nProxyImpostor(candidate);
}

/**
 * Brute-force last-resort: iterate every Flux-shaped export we've cached,
 * probe each one with every plausible channel-lookup method using the real
 * `guildId`, and return the first store whose response shape matches a real
 * channel map. Falls back to the first structurally-matching candidate when
 * behavioural probing fails everywhere — better to return an empty hidden
 * list than a hard "ChannelStore not found" error.
 *
 * This is the path that finally rescues the panel on modern Discord builds
 * where ChannelStore's `displayName`, `getName()`, *and* method-name source
 * literals are all mangled simultaneously — so neither the name-based,
 * shape-based, nor source-code-based lookups can pin it.
 */
function findChannelStoreBrute(guildId: string): ChannelStore | null {
    let structuralFallback: unknown = null;
    let proxiesSkipped = 0;
    const attempts: ChannelProbeAttempt[] = [];
    for (const candidate of iterateStoreShapedExports()) {
        // Skip the i18n MessagesStore Proxy before it pollutes the probe loop.
        // On modern Discord builds this Proxy is referenced from dozens of
        // cached exports; without this filter the 60-attempt diagnostic cap
        // fills up with Proxy duplicates and we never reach the real
        // ChannelStore deeper in the iterator.
        if (isI18nProxyImpostor(candidate)) {
            proxiesSkipped++;
            continue;
        }
        const o = candidate as Record<string, unknown>;
        // Remember the first candidate that exposes the canonical method
        // signature, so we can return it if no behavioural probe matches.
        if (!structuralFallback && hasChannelStoreSignature(candidate)) {
            structuralFallback = candidate;
        }
        for (const method of CHANNEL_LOOKUP_METHODS) {
            const fn = o[method];
            if (typeof fn !== "function") continue;
            let probe: unknown;
            let threw: string | null = null;
            try {
                probe = (fn as (id: string) => unknown).call(candidate, guildId);
            } catch (e) {
                threw = e instanceof Error ? e.message : String(e);
            }
            // Extract once and reuse for both the diagnostic capture and the
            // shape check. Avoids running extractRecordValues twice on a
            // probe that's about to be accepted.
            const values = threw ? [] : extractRecordValues(probe);
            const shapeOk = values.length > 0 && looksLikeChannelRecord(values[0]);
            // Capture a per-attempt diagnostic so when the panel reports a
            // store-lookup failure we know exactly what shape was returned.
            // Capped at 60 entries to keep `window.__alitraviansShcDebug`
            // small enough to paste into a chat message.
            if (attempts.length < 60) {
                attempts.push(buildProbeAttempt(method, probe, threw, values, shapeOk));
            }
            if (threw) continue;
            if (shapeOk) {
                lastChannelProbeAttempts = attempts;
                lastI18nProxiesSkipped = proxiesSkipped;
                return candidate as ChannelStore;
            }
        }
    }
    lastChannelProbeAttempts = attempts;
    lastI18nProxiesSkipped = proxiesSkipped;
    return (structuralFallback as ChannelStore) ?? null;
}

/**
 * Build a single {@link ChannelProbeAttempt} entry capturing the shape of
 * the probe response and `values[0]`. All field access is guarded —
 * diagnostics must never throw, since they run from the failure path.
 */
function buildProbeAttempt(
    method: string,
    probe: unknown,
    threw: string | null,
    values: unknown[],
    shapeMatched: boolean,
): ChannelProbeAttempt {
    const ctorName = safeCtorName(probe);
    const probeOwnKeys = safeEnumerableKeys(probe, 8);
    const v0 = values[0];
    const firstValueType = typeof v0;
    const firstValueCtor = safeCtorName(v0);
    const firstValueKeys = safeEnumerableKeys(v0, 8);
    const firstValueOwnPropertyNames = safeOwnPropertyNames(v0, 8);
    const firstValueSample = safeStringify(v0, 200);
    return {
        method,
        resultType: typeof probe,
        ctorName,
        threw,
        extractedCount: values.length,
        probeOwnKeys,
        firstValueKeys,
        firstValueType,
        firstValueCtor,
        firstValueOwnPropertyNames,
        firstValueSample,
        shapeMatched,
    };
}

function safeCtorName(v: unknown): string | null {
    try {
        const cn = (v as { constructor?: { name?: unknown } } | null | undefined)?.constructor?.name;
        return typeof cn === "string" ? cn : null;
    } catch {
        return null;
    }
}

function safeEnumerableKeys(v: unknown, max: number): string[] {
    const out: string[] = [];
    if (!v || typeof v !== "object") return out;
    try {
        for (const k of Object.keys(v as Record<string, unknown>)) {
            out.push(k);
            if (out.length >= max) break;
        }
    } catch { /* skip */ }
    return out;
}

function safeOwnPropertyNames(v: unknown, max: number): string[] {
    const out: string[] = [];
    if (!v || typeof v !== "object") return out;
    try {
        for (const k of Object.getOwnPropertyNames(v as object)) {
            out.push(k);
            if (out.length >= max) break;
        }
    } catch { /* skip */ }
    return out;
}

function safeStringify(v: unknown, max: number): string | null {
    if (v === undefined) return null;
    try {
        const s = JSON.stringify(v);
        if (typeof s !== "string") return null;
        return s.length > max ? s.slice(0, max) + "…" : s;
    } catch {
        // Cyclic / non-serialisable. Fall back to a coarse description.
        try {
            const s = String(v);
            return s.length > max ? s.slice(0, max) + "…" : s;
        } catch {
            return null;
        }
    }
}

/**
 * Method names that, when present together with `can`, are highly distinctive
 * to PermissionStore among Discord's *non-Proxy* Flux stores. The i18n
 * `MessagesStore` Proxy fakes a function for every property access and would
 * pass this gate too — it's rejected downstream by the `typeof result ===
 * "boolean"` check, because its synthetic `can()` returns a string from the
 * i18n table, not a boolean.
 */
const PERMISSION_STORE_COMPANION_METHODS = [
    "getChannelPermissions",
    "getGuildPermissions",
    "computeBasicPermissions",
    "computePermissions",
    "canBasicChannel",
    "canManageUser",
    "canWithPartialContext",
] as const;

/**
 * Brute-force last-resort for PermissionStore. The minimum signal is that the
 * candidate has a `can(bigint, channelRecord) => boolean` method that doesn't
 * throw for a real channel record. But "any store whose `can()` returns a
 * boolean" is too loose — a hypothetical experiments/feature-flag store with
 * a `can(...) => boolean` signature would silently win. So we also require
 * at least ONE of the {@link PERMISSION_STORE_COMPANION_METHODS} names to be
 * present as a function: the combination of `can` + any of those is unique
 * to PermissionStore in Discord's store graph.
 */
function findPermissionStoreBrute(referenceChannel: DiscordChannelLite | null): PermissionStore | null {
    if (!referenceChannel) return null;
    for (const candidate of iterateStoreShapedExports()) {
        const o = candidate as Record<string, unknown>;
        const can = o.can;
        if (typeof can !== "function") continue;
        // Companion-method gate: must have at least one PermissionStore-specific
        // function alongside `can`. This rejects coincidental boolean-returning
        // `can()` methods on unrelated Flux stores.
        let hasCompanion = false;
        for (const m of PERMISSION_STORE_COMPANION_METHODS) {
            if (typeof o[m] === "function") { hasCompanion = true; break; }
        }
        if (!hasCompanion) continue;
        let result: unknown;
        try {
            result = (can as (bits: bigint, ch: unknown) => unknown).call(candidate, VIEW_CHANNEL_BIT, referenceChannel);
        } catch {
            continue;
        }
        if (typeof result === "boolean") {
            return candidate as PermissionStore;
        }
    }
    return null;
}
import type {
    ChannelStore,
    DiscordChannelLite,
    DiscordGuildLite,
    DiscordPermissionOverwrite,
    DiscordRoleLite,
    PermissionStore,
} from "../../core/webpack/types.js";

/** VIEW_CHANNEL = 1 << 10 — the bit Discord uses to gate channel visibility. */
export const VIEW_CHANNEL_BIT = 1n << 10n;

/** Discord channel type constants. Values from Discord's API docs. */
export const CHANNEL_TYPE = {
    GUILD_TEXT: 0,
    GUILD_VOICE: 2,
    GUILD_CATEGORY: 4,
    GUILD_ANNOUNCEMENT: 5,
    GUILD_STAGE_VOICE: 13,
    GUILD_DIRECTORY: 14,
    GUILD_FORUM: 15,
    GUILD_MEDIA: 16,
} as const;

export type ChannelKind = "text" | "voice" | "stage" | "forum" | "announcement" | "media" | "category" | "other";

export function classifyChannel(type: number): ChannelKind {
    switch (type) {
        case CHANNEL_TYPE.GUILD_TEXT: return "text";
        case CHANNEL_TYPE.GUILD_VOICE: return "voice";
        case CHANNEL_TYPE.GUILD_STAGE_VOICE: return "stage";
        case CHANNEL_TYPE.GUILD_FORUM: return "forum";
        case CHANNEL_TYPE.GUILD_ANNOUNCEMENT: return "announcement";
        case CHANNEL_TYPE.GUILD_MEDIA: return "media";
        case CHANNEL_TYPE.GUILD_CATEGORY: return "category";
        default: return "other";
    }
}

export interface DiscoveredOverwrite {
    readonly id: string;
    readonly kind: "role" | "member";
    readonly allow: bigint;
    readonly deny: bigint;
    readonly grantsView: boolean;
    readonly deniesView: boolean;
}

export interface DiscoveredChannel {
    readonly id: string;
    readonly type: number;
    readonly kind: ChannelKind;
    readonly name: string;
    readonly topic: string | null;
    readonly nsfw: boolean;
    readonly parentId: string | null;
    readonly parentName: string | null;
    readonly position: number;
    readonly rateLimitPerUser: number;
    readonly bitrate: number | null;
    readonly userLimit: number | null;
    readonly rtcRegion: string | null;
    readonly lastMessageId: string | null;
    /** ms since unix epoch, or null when no last message. */
    readonly lastActivityMs: number | null;
    readonly overwrites: ReadonlyArray<DiscoveredOverwrite>;
}

export interface DiscoveryResult {
    readonly guildId: string;
    readonly guildName: string;
    readonly hidden: ReadonlyArray<DiscoveredChannel>;
    readonly visibleCount: number;
    readonly totalCount: number;
    /** True if PermissionStore or ChannelStore aren't ready yet. */
    readonly degraded: boolean;
    /** Human-readable note for the panel when degraded. */
    readonly degradedReason: string | null;
}

/** Coerce a permission field (string from REST, bigint from new client) to bigint. */
function permBits(value: unknown): bigint {
    if (typeof value === "bigint") return value;
    if (typeof value === "string") {
        try { return BigInt(value); } catch { return 0n; }
    }
    if (typeof value === "number") return BigInt(value);
    return 0n;
}

/** Snowflake → unix ms. Returns null on parse failure. */
export function snowflakeToMs(snowflake: string | null | undefined): number | null {
    if (!snowflake) return null;
    try {
        const id = BigInt(snowflake);
        return Number(id >> 22n) + 1420070400000;
    } catch {
        return null;
    }
}

function isOverwriteShape(value: unknown): value is DiscordPermissionOverwrite {
    if (!value || typeof value !== "object") return false;
    const o = value as Record<string, unknown>;
    return typeof o.id === "string" && (o.type === 0 || o.type === 1);
}

function mapOverwrites(raw: Record<string, unknown> | undefined): DiscoveredOverwrite[] {
    if (!raw) return [];
    const out: DiscoveredOverwrite[] = [];
    for (const v of Object.values(raw)) {
        if (!isOverwriteShape(v)) continue;
        const allow = permBits(v.allow);
        const deny = permBits(v.deny);
        out.push({
            id: v.id,
            kind: v.type === 0 ? "role" : "member",
            allow,
            deny,
            grantsView: (allow & VIEW_CHANNEL_BIT) !== 0n,
            deniesView: (deny & VIEW_CHANNEL_BIT) !== 0n,
        });
    }
    return out;
}

/**
 * Enumerate channels for a guild via `ChannelStore.getMutableGuildChannelsForGuild`.
 *
 * Returns an empty array — and lets `scanGuild` mark the result as degraded —
 * if the store method is absent (very old Discord build) or throws. We
 * intentionally do not fall back to walking the webpack module cache for
 * channels: that path is brittle, expensive, and the modern Discord client
 * has exposed this method for years.
 */
function enumerateGuildChannels(
    channelStore: ChannelStore,
    guildId: string,
): DiscordChannelLite[] {
    // Try each historical method name in order. The store we resolved may be
    // the brute-force candidate (which had any one of these return real
    // data), so we re-probe to use whichever method is actually wired up.
    const o = channelStore as unknown as Record<string, unknown>;
    for (const method of CHANNEL_LOOKUP_METHODS) {
        const fn = o[method];
        if (typeof fn !== "function") continue;
        try {
            const record = (fn as (id: string) => unknown).call(channelStore, guildId);
            const values = extractRecordValues(record);
            if (values.length === 0) continue;
            // Validate the first record looks like a Discord channel before
            // returning — guards against the i18n proxy slipping through if
            // we ever resolve it as ChannelStore by accident.
            if (looksLikeChannelRecord(values[0])) {
                return values as DiscordChannelLite[];
            }
        } catch {
            // Try the next method name.
        }
    }
    return [];
}

function canView(ps: PermissionStore, channel: DiscordChannelLite): boolean {
    try {
        return ps.can(VIEW_CHANNEL_BIT, channel);
    } catch {
        // Older builds occasionally throw if the channel record lacks
        // permissionOverwrites — treat as hidden (conservative).
        return false;
    }
}

function nameFor(channel: DiscordChannelLite): string {
    return channel.name ?? `channel-${channel.id}`;
}

/**
 * Read a channel field that Discord exposes under two names \u2014 the modern
 * camelCase ChannelRecord accessor (`parentId`) and the legacy snake_case
 * gateway field (`parent_id`). On every modern desktop build the camelCase
 * value is populated; the fallback keeps us safe on older / REST-shaped
 * records and inside the unit-test scaffolding.
 */
function readChannel<T>(
    ch: DiscordChannelLite,
    camel: keyof DiscordChannelLite,
    snake: keyof DiscordChannelLite,
): T | undefined {
    const c = ch[camel];
    if (c !== undefined && c !== null) return c as T;
    const s = ch[snake];
    if (s !== undefined && s !== null) return s as T;
    return undefined;
}

/**
 * Public entry: scan a guild for hidden channels.
 */
export function scanGuild(guildId: string): DiscoveryResult {
    // Fast path: name- / shape- / code-based resolution from stores.ts.
    let channelStore = getChannelStore();
    let permissionStore = getPermissionStore();
    const guildStore = getGuildStore();

    const guild: DiscordGuildLite | null = guildStore?.getGuild(guildId) ?? null;
    const guildName = guild?.name ?? guildId;

    // Brute-force fallback: when the standard paths failed, iterate every
    // cached Flux-shaped export and probe with the real guildId. This is the
    // only path that works on builds where every store identifier is mangled
    // (constructor name, getName(), AND method-name source literals).
    let channelStoreFromBrute = false;
    if (!channelStore) {
        channelStore = findChannelStoreBrute(guildId);
        channelStoreFromBrute = channelStore !== null;
    }

    // Compute the channel list once and reuse it for the PermissionStore
    // brute-force seed and the main enumeration below.
    //
    // For brute-force resolutions specifically: if the structural fallback
    // matched a candidate that doesn't produce channels, downgrade
    // channelStore back to null so the user sees the accurate "ChannelStore
    // not found" message. We *do not* apply this downgrade to the standard
    // resolution path — there, an empty channel list legitimately means
    // "guild not loaded yet" and should produce the dedicated empty-guild
    // message at the bottom of this function, not consume the one-shot
    // store-dump diagnostic flag.
    let earlyChannels: DiscordChannelLite[] = [];
    if (channelStore) {
        earlyChannels = enumerateGuildChannels(channelStore, guildId);
        if (earlyChannels.length === 0 && channelStoreFromBrute) {
            channelStore = null;
        }
    }

    if (!permissionStore && channelStore) {
        // For PermissionStore brute-force we need a reference channel record
        // to feed `can(bits, channel)` — pick the first channel from the
        // guild we now have access to.
        permissionStore = findPermissionStoreBrute(earlyChannels[0] ?? null);
    }

    if (!channelStore || !permissionStore) {
        const missing = !channelStore ? "ChannelStore" : "PermissionStore";
        if (!didDumpStoresOnce) {
            didDumpStoresOnce = true;
            try { dumpStoresForDiagnostic(missing); } catch { /* diagnostics must not throw */ }
            publishProbe(missing);
        }
        return {
            guildId,
            guildName,
            hidden: [],
            visibleCount: 0,
            totalCount: 0,
            degraded: true,
            degradedReason: !channelStore
                ? "تعذّر إيجاد ChannelStore (لم يكتمل تحميل Discord بعد)"
                : "تعذّر إيجاد PermissionStore (لم يكتمل تحميل Discord بعد)",
        };
    }

    // Reuse the channel list computed earlier; if we somehow got here without
    // populating it, fall back to a fresh enumeration (defensive).
    const channels = earlyChannels.length > 0
        ? earlyChannels
        : enumerateGuildChannels(channelStore, guildId);
    if (channels.length === 0) {
        return {
            guildId,
            guildName,
            hidden: [],
            visibleCount: 0,
            totalCount: 0,
            degraded: true,
            degradedReason: "هذا السيرفر لا يكشف قنواته (إصدار Discord قديم؟). جرّب الفتح من جهاز آخر.",
        };
    }

    const idToName = new Map<string, string>();
    for (const ch of channels) idToName.set(ch.id, nameFor(ch));

    const hidden: DiscoveredChannel[] = [];
    let visibleCount = 0;

    for (const ch of channels) {
        if (canView(permissionStore, ch)) {
            visibleCount++;
            continue;
        }
        const parentId = readChannel<string>(ch, "parentId", "parent_id") ?? null;
        const lastMessageId = readChannel<string>(ch, "lastMessageId", "last_message_id") ?? null;
        hidden.push({
            id: ch.id,
            type: ch.type,
            kind: classifyChannel(ch.type),
            name: nameFor(ch),
            topic: ch.topic ?? null,
            nsfw: ch.nsfw ?? false,
            parentId,
            parentName: parentId ? (idToName.get(parentId) ?? null) : null,
            position: ch.position ?? 0,
            rateLimitPerUser: readChannel<number>(ch, "rateLimitPerUser", "rate_limit_per_user") ?? 0,
            bitrate: ch.bitrate ?? null,
            userLimit: readChannel<number>(ch, "userLimit", "user_limit") ?? null,
            rtcRegion: readChannel<string>(ch, "rtcRegion", "rtc_region") ?? null,
            lastMessageId,
            lastActivityMs: snowflakeToMs(lastMessageId),
            overwrites: mapOverwrites(ch.permissionOverwrites as Record<string, unknown> | undefined),
        });
    }

    return {
        guildId,
        guildName,
        hidden,
        visibleCount,
        totalCount: channels.length,
        degraded: false,
        degradedReason: null,
    };
}

/** Resolve a role-id → DiscordRoleLite via GuildStore. Returns null if missing. */
export function lookupRole(guildId: string, roleId: string): DiscordRoleLite | null {
    const gs = getGuildStore();
    if (!gs) return null;
    const guild = gs.getGuild(guildId);
    const role = guild?.roles?.[roleId];
    return role ?? null;
}
