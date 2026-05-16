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
 * A returned record from any of the channel-lookup methods is acceptable iff
 * its first value carries the standard `{ id: string, type: number }` shape
 * of a Discord channel record. The i18n `MessagesStore` returns strings for
 * every property access — its values never pass this shape check.
 */
function looksLikeRealChannelMap(probe: unknown): boolean {
    if (probe == null) return false;
    if (typeof probe !== "object") return false;
    const values = Object.values(probe as Record<string, unknown>);
    if (values.length === 0) return false;
    const first = values[0] as { id?: unknown; type?: unknown } | null | undefined;
    if (!first || typeof first !== "object") return false;
    return typeof first.id === "string" && typeof first.type === "number";
}

/**
 * Brute-force last-resort: iterate every Flux-shaped export we've cached,
 * probe each one with every plausible channel-lookup method using the real
 * `guildId`, and return the first store whose response shape matches a real
 * channel map. Returns `null` if no candidate matches.
 *
 * This is the path that finally rescues the panel on modern Discord builds
 * where ChannelStore's `displayName`, `getName()`, *and* method-name source
 * literals are all mangled simultaneously — so neither the name-based,
 * shape-based, nor source-code-based lookups can pin it.
 */
function findChannelStoreBrute(guildId: string): ChannelStore | null {
    for (const candidate of iterateStoreShapedExports()) {
        const o = candidate as Record<string, unknown>;
        for (const method of CHANNEL_LOOKUP_METHODS) {
            const fn = o[method];
            if (typeof fn !== "function") continue;
            let probe: unknown;
            try {
                probe = (fn as (id: string) => unknown).call(candidate, guildId);
            } catch {
                continue;
            }
            if (looksLikeRealChannelMap(probe)) {
                return candidate as ChannelStore;
            }
        }
    }
    return null;
}

/**
 * Method names that, when present together with `can`, are highly distinctive
 * to PermissionStore. Any one of these is enough to rule out a coincidental
 * match — Discord doesn't ship another Flux store carrying a method-set
 * shaped like this.
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
            if (record && typeof record === "object") {
                const values = Object.values(record as Record<string, unknown>);
                if (values.length === 0) continue;
                // Validate the first record looks like a Discord channel
                // before returning — guards against the i18n proxy slipping
                // through if we ever resolve it as ChannelStore by accident.
                const first = values[0] as { id?: unknown; type?: unknown } | null | undefined;
                if (first && typeof first === "object" && typeof first.id === "string" && typeof first.type === "number") {
                    return values as DiscordChannelLite[];
                }
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
    if (!channelStore) {
        channelStore = findChannelStoreBrute(guildId);
    }

    if (!permissionStore && channelStore) {
        // For PermissionStore brute-force we need a reference channel record
        // to feed `can(bits, channel)` — pick the first channel from the
        // guild we now have access to.
        const probeChannels = enumerateGuildChannels(channelStore, guildId);
        permissionStore = findPermissionStoreBrute(probeChannels[0] ?? null);
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

    const channels = enumerateGuildChannels(channelStore, guildId);
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
