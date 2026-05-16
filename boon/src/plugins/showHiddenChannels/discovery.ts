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
    getChannelStore,
    getGuildStore,
    getPermissionStore,
} from "../../core/webpack/index.js";
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
    if (typeof channelStore.getMutableGuildChannelsForGuild === "function") {
        try {
            const record = channelStore.getMutableGuildChannelsForGuild(guildId);
            if (record && typeof record === "object") {
                return Object.values(record);
            }
        } catch {
            // Surface as "degraded" in scanGuild — caller decides UX.
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
    const channelStore = getChannelStore();
    const permissionStore = getPermissionStore();
    const guildStore = getGuildStore();

    const guild: DiscordGuildLite | null = guildStore?.getGuild(guildId) ?? null;
    const guildName = guild?.name ?? guildId;

    if (!channelStore || !permissionStore) {
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
