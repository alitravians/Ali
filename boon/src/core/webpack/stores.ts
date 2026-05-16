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

import { findStore } from "./modules.js";
import type {
    ChannelStore,
    GuildMemberStore,
    GuildStore,
    PermissionStore,
    TypingStore,
    UserStore,
} from "./types.js";

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
 */
export function getChannelStore(): ChannelStore | null {
    const store = findStore("ChannelStore");
    if (!hasFn(store, "getChannel", "addChangeListener", "removeChangeListener")) return null;
    return store as ChannelStore;
}

/**
 * Discord's `PermissionStore`. `can(permissionBits, channel)` is the
 * authoritative answer for "is the current user allowed permissionBits on
 * channel?". The bits arg is a `bigint` on modern Discord builds.
 */
export function getPermissionStore(): PermissionStore | null {
    const store = findStore("PermissionStore");
    if (!hasFn(store, "can", "addChangeListener", "removeChangeListener")) return null;
    return store as PermissionStore;
}

export function getGuildStore(): GuildStore | null {
    const store = findStore("GuildStore");
    if (!hasFn(store, "getGuild", "addChangeListener", "removeChangeListener")) return null;
    return store as GuildStore;
}

export function getUserStore(): UserStore | null {
    const store = findStore("UserStore");
    if (!hasFn(store, "getCurrentUser", "getUser", "addChangeListener", "removeChangeListener")) return null;
    return store as UserStore;
}

export function getGuildMemberStore(): GuildMemberStore | null {
    const store = findStore("GuildMemberStore");
    if (!hasFn(store, "getMember", "addChangeListener", "removeChangeListener")) return null;
    return store as GuildMemberStore;
}
