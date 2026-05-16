/*
 * BOON — Typed lazy accessors for Discord stores
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Thin wrappers around `findStore(...)` that return strongly-typed handles
 * for the stores BOON currently consumes. Each accessor returns `null` if
 * the store can't be located, leaving the call-site to decide whether that's
 * a fatal error or a soft fail.
 *
 * Add new accessors here as more plugins start consuming webpack-backed data.
 * Keep the file small — each entry should be a couple of lines plus a stable
 * Discord store name.
 */

import { findStore, findStoreByMethods } from "./modules.js";
import type {
    ChannelStore,
    GuildMemberStore,
    GuildStore,
    PermissionStore,
    TypingStore,
    UserStore,
} from "./types.js";

/**
 * Resolve a Flux store by name first, then by a tuple of methods that
 * uniquely identifies it. The name-based path is authoritative when it
 * works; the method-based path is the safety net for builds where Discord
 * has dropped / renamed the `getName()` / `displayName` identification but
 * still exposes the same method surface.
 *
 * `requiredMethods` is also used to validate the shape of whichever object
 * we end up returning — that way the callers can trust the returned handle
 * has every method they're about to invoke.
 */
function resolveStore(
    storeName: string,
    requiredMethods: ReadonlyArray<string>,
    fingerprint: ReadonlyArray<string>,
): unknown {
    const byName = findStore(storeName);
    if (hasFn(byName, ...requiredMethods)) return byName;
    const byMethods = findStoreByMethods(...fingerprint);
    if (hasFn(byMethods, ...requiredMethods)) return byMethods;
    return null;
}

/**
 * Discord's `TypingStore` tracks which users are currently typing in each
 * channel. The map is updated by the `TYPING_START` and `TYPING_STOP`
 * actions, so plugins typically subscribe to those AND read the store on
 * each tick rather than maintaining their own mirror.
 */
export function getTypingStore(): TypingStore | null {
    const store = findStore("TypingStore");
    if (!isTypingStore(store)) return null;
    return store;
}

function isTypingStore(value: unknown): value is TypingStore {
    if (!value || typeof value !== "object") return false;
    const o = value as Record<string, unknown>;
    return typeof o.getTypingUsers === "function"
        && typeof o.addChangeListener === "function"
        && typeof o.removeChangeListener === "function";
}

function hasFn(value: unknown, ...names: ReadonlyArray<string>): boolean {
    if (!value || typeof value !== "object") return false;
    const o = value as Record<string, unknown>;
    for (const n of names) {
        if (typeof o[n] !== "function") return false;
    }
    return true;
}

/**
 * Discord's `ChannelStore`. Used by the showHiddenChannels plugin to
 * enumerate every channel in a guild — including ones the user can't view.
 * The optional `getMutableGuildChannelsForGuild` method is the cheap path;
 * plugins should fall back to per-id lookups if it's missing.
 *
 * Fingerprint: `getMutableGuildChannelsForGuild` is essentially exclusive
 * to ChannelStore across Discord's Flux stores, so when the name-based
 * lookup misses we can still resolve the right object by method shape.
 */
export function getChannelStore(): ChannelStore | null {
    const store = resolveStore(
        "ChannelStore",
        ["getChannel", "addChangeListener", "removeChangeListener"],
        ["getChannel", "getMutableGuildChannelsForGuild"],
    );
    return store ? (store as ChannelStore) : null;
}

/**
 * Discord's `PermissionStore`. `can(permissionBits, channel)` is the
 * authoritative answer for "is the current user allowed permissionBits on
 * channel?". The bits arg is a `bigint` on modern Discord builds.
 *
 * Fingerprint: pairing `can` with `getChannelPermissions` is unique to
 * PermissionStore across Discord's stores.
 */
export function getPermissionStore(): PermissionStore | null {
    const store = resolveStore(
        "PermissionStore",
        ["can", "addChangeListener", "removeChangeListener"],
        ["can", "getChannelPermissions"],
    );
    return store ? (store as PermissionStore) : null;
}

export function getGuildStore(): GuildStore | null {
    const store = resolveStore(
        "GuildStore",
        ["getGuild", "addChangeListener", "removeChangeListener"],
        ["getGuild", "getGuilds"],
    );
    return store ? (store as GuildStore) : null;
}

export function getUserStore(): UserStore | null {
    const store = resolveStore(
        "UserStore",
        ["getCurrentUser", "getUser", "addChangeListener", "removeChangeListener"],
        ["getCurrentUser", "getUser"],
    );
    return store ? (store as UserStore) : null;
}

export function getGuildMemberStore(): GuildMemberStore | null {
    const store = resolveStore(
        "GuildMemberStore",
        ["getMember", "addChangeListener", "removeChangeListener"],
        ["getMember", "getMembers"],
    );
    return store ? (store as GuildMemberStore) : null;
}
