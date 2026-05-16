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

import { bootstrapWebpackRequire } from "./chunkInterceptor.js";
import { findAllByCode, findAllStoresByMethods, findStore, moduleCount } from "./modules.js";
import type {
    ChannelStore,
    DiscordChannelLite,
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
 *
 * `validate` is an optional final check that lets the caller probe the
 * candidate for the *behaviour* it expects (e.g. "calling this method with
 * a sentinel argument returns a real channel record, not an i18n fallback
 * string"). The fingerprint path iterates every match, so a misbehaving
 * candidate is skipped instead of being returned.
 */
let didBootstrap = false;
function ensureBootstrapped(): void {
    if (didBootstrap) return;
    if (moduleCount() > 0) { didBootstrap = true; return; }
    // Force webpack to hand us a require — vital on builds where our chunk
    // interceptor lost the race against Discord's own webpack runtime or
    // never got a chance to wrap `.push`. The bootstrap is idempotent and
    // its only side-effect is one `rememberRequire(require)` call, after
    // which `findAllByCode` / module-cache traversal both work.
    try {
        if (bootstrapWebpackRequire()) didBootstrap = true;
    } catch {
        // Bootstrap is best-effort; lookup paths handle absent require.
    }
}

function resolveStore(
    storeName: string,
    requiredMethods: ReadonlyArray<string>,
    fingerprint: ReadonlyArray<string>,
    validate?: (store: unknown) => boolean,
    codeMarkers?: ReadonlyArray<string>,
): unknown {
    ensureBootstrapped();
    const byName = findStore(storeName);
    if (hasFn(byName, ...requiredMethods) && (!validate || validate(byName))) return byName;
    for (const candidate of findAllStoresByMethods(...fingerprint)) {
        if (!hasFn(candidate, ...requiredMethods)) continue;
        if (validate && !validate(candidate)) continue;
        return candidate;
    }
    // Last-resort: scan webpack module factories by source-text fingerprint.
    // Discord's modern bundles mangle constructor names but preserve the
    // literal method-name and dispatcher-handler strings inside each factory,
    // so a substring match is a reliable way to pin a store whose identity
    // we lost via the name- and shape-based paths.
    if (codeMarkers && codeMarkers.length > 0) {
        for (const exp of findAllByCode(codeMarkers)) {
            const candidate = pickStoreFromExports(exp, requiredMethods);
            if (!candidate) continue;
            if (validate && !validate(candidate)) continue;
            return candidate;
        }
    }
    return null;
}

/**
 * From a module's `exports` object (which may itself be the store, or a
 * `{ default: Store }` / `{ Z: Store }` / `{ ChannelStore: Store, ... }`
 * wrapper), pull out the actual Flux store instance that satisfies the
 * required-method shape.
 */
function pickStoreFromExports(exp: unknown, requiredMethods: ReadonlyArray<string>): unknown {
    if (hasFn(exp, ...requiredMethods)) return exp;
    if (!exp || typeof exp !== "object") return null;
    const o = exp as Record<string, unknown>;
    let keys: string[];
    try { keys = Object.keys(o); } catch { return null; }
    for (const key of keys) {
        let value: unknown;
        try { value = o[key]; } catch { continue; }
        if (hasFn(value, ...requiredMethods)) return value;
    }
    return null;
}

/**
 * Discord's `TypingStore` tracks which users are currently typing in each
 * channel. The map is updated by the `TYPING_START` and `TYPING_STOP`
 * actions, so plugins typically subscribe to those AND read the store on
 * each tick rather than maintaining their own mirror.
 *
 * Fingerprint: `getTypingUsers` is exclusive to TypingStore across the Flux
 * store set, so a shape-based fallback is safe.
 */
export function getTypingStore(): TypingStore | null {
    const store = resolveStore(
        "TypingStore",
        ["getTypingUsers", "addChangeListener", "removeChangeListener"],
        ["getTypingUsers"],
    );
    return store ? (store as TypingStore) : null;
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
        looksLikeChannelStore,
        // `getMutableGuildChannelsForGuild` is the cheapest unique marker:
        // Vencord uses it for the same reason. Discord's i18n MessagesStore
        // fakes a function for *every* property access at runtime but its
        // factory source doesn't contain this literal string, so a code
        // search ignores it cleanly.
        ["getMutableGuildChannelsForGuild"],
    );
    return store ? (store as ChannelStore) : null;
}

/**
 * Behavioural check: a candidate is a real `ChannelStore` if and only if
 * `getMutableGuildChannelsForGuild("0")` returns either a falsy value
 * (no data for that fake guild — the legitimate response) or an object
 * whose values — if any — carry the channel-record shape (`{ id, type }`).
 *
 * Discord's i18n `MessagesStore` answers every method call with whatever
 * `getMessage(...)` returns; that value is *also* object-like and *also*
 * non-empty, but the values never have a numeric `type` field, so this
 * probe rejects it cleanly.
 */
function looksLikeChannelStore(store: unknown): boolean {
    if (!store || typeof store !== "object") return false;
    const fn = (store as Record<string, unknown>).getMutableGuildChannelsForGuild;
    if (typeof fn !== "function") return false;
    let probe: unknown;
    try {
        probe = (fn as (id: string) => unknown).call(store, "0");
    } catch {
        return false;
    }
    if (probe == null) return true;
    if (typeof probe !== "object") return false;
    const values = Object.values(probe as Record<string, unknown>);
    if (values.length === 0) return true;
    // First value must look like a Discord channel record.
    const first = values[0] as Partial<DiscordChannelLite> | null | undefined;
    if (!first || typeof first !== "object") return false;
    return typeof first.id === "string" && typeof first.type === "number";
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
        undefined,
        ["getChannelPermissions", "computePermissions"],
    );
    return store ? (store as PermissionStore) : null;
}

export function getGuildStore(): GuildStore | null {
    const store = resolveStore(
        "GuildStore",
        ["getGuild", "addChangeListener", "removeChangeListener"],
        ["getGuild", "getGuilds"],
        undefined,
        ["getGuildCount", "getGuild"],
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
