/*
 * BOON — Webpack subsystem types
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Type-only declarations describing Discord's webpack 5 chunk format and the
 * shapes of stores we touch from BOON. Everything is `readonly` by default
 * because we never mutate Discord's internals.
 *
 * Discord ships webpack with `chunkLoadingGlobal === "webpackChunkdiscord_app"`,
 * so the chunk array lives at `window.webpackChunkdiscord_app`. New chunks are
 * registered by calling `.push([chunkIds, modules, runtime?])` on that array,
 * which is how we splice in our interception.
 *
 * References (Vencord & BetterDiscord conventions, reverse-engineered):
 *   - Chunk format:   [chunkIds: any[], modules: Record<id, ModuleFn>, runtime?]
 *   - Module fn sig:  (module, exports, require) => void
 *   - Flux dispatcher symbol exists on every Store instance.
 */

export type WebpackModuleId = string | number;

/**
 * A webpack module's factory. When invoked, it should assign the module's
 * public surface onto `module.exports` (commonly via the wrapped `exports`
 * parameter for backwards compat).
 */
export type WebpackModuleFn = (
    module: { exports: unknown },
    exports: unknown,
    require: WebpackRequire,
) => void;

/**
 * The `require` function passed into every module factory. We attach a few
 * sniffed sub-properties (`c` — the module cache, `m` — the module registry)
 * once we've successfully observed at least one chunk push.
 */
export interface WebpackRequire {
    (id: WebpackModuleId): unknown;
    /** Module cache. Keys are module IDs; values are loaded module records. */
    c?: Record<WebpackModuleId, { id: WebpackModuleId; exports: unknown }>;
    /** Module registry. Keys are module IDs; values are factory functions. */
    m?: Record<WebpackModuleId, WebpackModuleFn>;
}

/**
 * A chunk entry pushed onto `window.webpackChunkdiscord_app`. The first two
 * fields are mandatory; the third is the optional runtime callback the
 * webpack runtime invokes once dependencies are satisfied.
 */
export type WebpackChunk = [
    chunkIds: ReadonlyArray<WebpackModuleId>,
    modules: Record<WebpackModuleId, WebpackModuleFn>,
    runtime?: (require: WebpackRequire) => void,
];

/** Predicate used to locate a single loaded module. */
export type ModuleFilter = (exports: unknown, id: WebpackModuleId) => boolean;

// ─── Flux dispatcher ────────────────────────────────────────────────────────

export interface FluxAction {
    readonly type: string;
    readonly [key: string]: unknown;
}

export type FluxActionHandler<A extends FluxAction = FluxAction> = (action: A) => void;

export interface FluxDispatcher {
    subscribe(actionType: string, handler: FluxActionHandler): void;
    unsubscribe(actionType: string, handler: FluxActionHandler): void;
    dispatch(action: FluxAction): void | Promise<void>;
    /** Internal Discord field — not used directly. */
    _actionHandlers?: unknown;
}

// ─── Stores we touch ────────────────────────────────────────────────────────

/**
 * Subset of Discord's `TypingStore` that we depend on. The real store has
 * additional methods we don't need (`getTypingUserIds`, etc.).
 *
 * `getTypingUsers(channelId)` returns a `Record<userId, timestamp>` where the
 * timestamp is the ms-epoch the user last sent a TYPING_START in that channel.
 */
export interface TypingStore {
    getName(): string;
    getTypingUsers(channelId: string): Record<string, number>;
    addChangeListener(listener: () => void): void;
    removeChangeListener(listener: () => void): void;
}

/** Generic Flux store base — every Discord store implements at least these. */
export interface FluxStoreBase {
    getName(): string;
    addChangeListener(listener: () => void): void;
    removeChangeListener(listener: () => void): void;
    emitChange?(): void;
}

// ─── Channel / Permission / Guild / User stores (read-only) ──────────────────

/**
 * Discord permission overwrite entry. `allow`/`deny` arrive as either a
 * stringified bigint (REST/gateway) or a real `bigint` (newer client builds).
 * BOON consumers should always normalise via `BigInt(value)` before
 * bitwise-anding with a permission bit.
 */
export interface DiscordPermissionOverwrite {
    readonly id: string;
    /** 0 = role overwrite, 1 = member overwrite. */
    readonly type: 0 | 1;
    readonly allow: string | bigint;
    readonly deny: string | bigint;
}

export interface DiscordForumTag {
    readonly id: string;
    readonly name: string;
    readonly emojiId?: string | null;
    readonly emojiName?: string | null;
    readonly moderated?: boolean;
}

/**
 * Subset of Discord's channel record that BOON reads. Discord exposes far
 * more fields, but every field below is stable across recent client builds.
 * All fields are read-only — BOON never mutates Discord's internal state.
 */
export interface DiscordChannelLite {
    readonly id: string;
    readonly type: number;
    readonly name?: string;
    readonly topic?: string | null;
    readonly nsfw?: boolean;
    readonly parent_id?: string | null;
    readonly position?: number;
    readonly guild_id?: string;
    readonly last_message_id?: string | null;
    readonly last_pin_timestamp?: string | null;
    readonly rate_limit_per_user?: number;
    readonly default_thread_rate_limit_per_user?: number;
    readonly bitrate?: number;
    readonly user_limit?: number;
    readonly rtc_region?: string | null;
    readonly video_quality_mode?: number;
    readonly permissionOverwrites?: Record<string, DiscordPermissionOverwrite>;
    readonly available_tags?: ReadonlyArray<DiscordForumTag>;
    readonly flags?: number;
    readonly default_auto_archive_duration?: number;
    readonly default_forum_layout?: number;
    readonly default_sort_order?: number | null;
}

export interface DiscordRoleLite {
    readonly id: string;
    readonly name: string;
    readonly color?: number;
    readonly colorString?: string | null;
    readonly hoist?: boolean;
    readonly position?: number;
    readonly mentionable?: boolean;
}

export interface DiscordGuildLite {
    readonly id: string;
    readonly name: string;
    readonly icon?: string | null;
    readonly ownerId?: string;
    readonly roles?: Record<string, DiscordRoleLite>;
}

export interface DiscordUserLite {
    readonly id: string;
    readonly username: string;
    readonly globalName?: string | null;
    readonly avatar?: string | null;
    readonly discriminator?: string;
}

/**
 * Discord's ChannelStore. We rely on three methods:
 *  - `getChannel(channelId)` — stable since forever.
 *  - `getMutableGuildChannelsForGuild(guildId)` — returns the full channel
 *    record for a guild, including channels the user can't view. Present on
 *    modern desktop builds; if absent, the showHiddenChannels plugin falls
 *    back to enumerating via `getChannel` over every known channel id.
 */
export interface ChannelStore extends FluxStoreBase {
    getChannel(channelId: string): DiscordChannelLite | null | undefined;
    getMutableGuildChannelsForGuild?(guildId: string): Record<string, DiscordChannelLite>;
}

/**
 * Discord's PermissionStore. `can(permissionBits, channel)` returns whether
 * the current user is allowed `permissionBits` on `channel`. The bits arg
 * is a `bigint` on modern builds; some older builds accept a `number`.
 */
export interface PermissionStore extends FluxStoreBase {
    can(permissionBits: bigint, context: DiscordChannelLite, overrideUser?: DiscordUserLite): boolean;
    getChannelPermissions?(channelId: string): bigint;
}

export interface GuildStore extends FluxStoreBase {
    getGuild(guildId: string): DiscordGuildLite | null | undefined;
    getRoles?(guildId: string): Record<string, DiscordRoleLite>;
}

export interface UserStore extends FluxStoreBase {
    getCurrentUser(): DiscordUserLite | null | undefined;
    getUser(userId: string): DiscordUserLite | null | undefined;
}

export interface GuildMemberStore extends FluxStoreBase {
    getMember(guildId: string, userId: string): DiscordGuildMemberLite | null | undefined;
    getNick?(guildId: string, userId: string): string | null;
}

export interface DiscordGuildMemberLite {
    readonly userId: string;
    readonly guildId?: string;
    readonly nick?: string | null;
    readonly roles?: ReadonlyArray<string>;
    readonly colorString?: string | null;
}
