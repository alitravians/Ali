/*
 * BOON — Webpack module finder
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Maintains a cache of every module's exports as we observe them via the
 * chunk interceptor, and exposes synchronous + async finders that consumers
 * use to locate Discord's internal modules by predicate.
 *
 * The cache covers two sources:
 *   (1) Exports we observe live from our wrapped module factory (filled
 *       eagerly when factories run).
 *   (2) Anything already in `require.c` once we have a reference to webpack's
 *       require — drained lazily on first finder call.
 *
 * Finders never patch Discord's internals — they only read. Anything that
 * needs to keep up with future modules registers itself via `onceReady` and
 * waits for the next finder call (typical Discord boot completes within a
 * few hundred ms).
 */

import { createLogger } from "../logger.js";
import type { ModuleFilter, WebpackModuleId, WebpackRequire } from "./types.js";

const log = createLogger("webpack:modules");

/** All exports we've seen, keyed by webpack module id. */
const exportsById = new Map<WebpackModuleId, unknown>();

/** Captured `require` reference (used for lazy cache drain). */
let webpackRequire: WebpackRequire | null = null;

let cacheDrained = false;
let readyResolve: (() => void) | null = null;
const readyPromise = new Promise<void>(r => { readyResolve = r; });

/**
 * Called from the chunk interceptor whenever a factory runs. Caches the
 * module's exports under its id. Safe to call repeatedly with the same id —
 * later writes win (Discord's webpack doesn't redefine modules in practice,
 * but defensive overwrite is harmless).
 */
export function storeModuleExports(id: WebpackModuleId, exp: unknown): void {
    exportsById.set(id, exp);
}

/**
 * Called from the chunk interceptor to stash webpack's `require`. We only
 * need one reference; subsequent calls are ignored to avoid swapping
 * mid-flight.
 */
export function rememberRequire(req: WebpackRequire): void {
    if (webpackRequire) return;
    webpackRequire = req;
    log.info("captured webpack require");
    // Now that we have require, the cache is technically reachable. We don't
    // drain eagerly — `findModule` does it lazily so we don't pay the cost
    // unless a consumer actually asks for something.
    if (readyResolve) {
        readyResolve();
        readyResolve = null;
    }
}

/**
 * Pulls every cached export from `require.c` into our own map. Idempotent;
 * later calls re-scan only modules we don't already have (cheap).
 */
function drainModuleCache(): void {
    if (!webpackRequire?.c) return;
    const cache = webpackRequire.c;
    let added = 0;
    for (const id of Object.keys(cache)) {
        if (exportsById.has(id)) continue;
        try {
            const entry = cache[id];
            if (entry && "exports" in entry) {
                exportsById.set(id, entry.exports);
                added++;
            }
        } catch {
            // Some modules throw on access during teardown; ignore.
        }
    }
    if (added > 0) {
        log.debug(`drained ${added} additional modules from require.c`);
    }
    cacheDrained = true;
}

/**
 * Run a predicate against every loaded export and return the first match.
 * Triggers a lazy cache drain on first call so consumers always see modules
 * that loaded before BOON booted.
 */
export function findModule(filter: ModuleFilter): unknown {
    if (!cacheDrained && webpackRequire) {
        drainModuleCache();
    }
    for (const [id, exp] of exportsById) {
        try {
            if (filter(exp, id)) return exp;
            // Many Discord modules export the real surface on `.default` or
            // `.Z` (CJS interop). Probe these conventional shapes too.
            if (typeof exp === "object" && exp !== null) {
                const o = exp as Record<string, unknown>;
                if ("default" in o && filter(o.default, id)) return o.default;
                if ("Z" in o && filter(o.Z, id)) return o.Z;
            }
        } catch {
            // Predicate threw — skip this module.
        }
    }
    return null;
}

/**
 * Convenience finder: locate an export object that contains ALL of the named
 * props (either at the top level or on `.default`). Used to grab modules like
 * the Flux dispatcher, which exposes `subscribe`, `unsubscribe`, `dispatch`.
 */
export function findByProps(...props: ReadonlyArray<string>): unknown {
    return findModule(exp => {
        if (!exp || typeof exp !== "object") return false;
        const o = exp as Record<string, unknown>;
        for (const p of props) {
            if (!(p in o)) return false;
        }
        return true;
    });
}

/**
 * Locate a Flux store whose name (under any of the conventions Discord has
 * used over the years) equals `storeName`.
 *
 * Discord's stores are class instances that inherit `addChangeListener` /
 * `removeChangeListener` from `Flux.Store`. The way Discord identifies the
 * store name has drifted across builds:
 *
 *   1. Legacy builds expose a `getName()` instance method that returns the
 *      string literal name. We try this first because it's authoritative
 *      when present.
 *   2. More recent builds rely on `constructor.displayName` (set by terser's
 *      mangler-preserve pass) — `getName()` may still exist on the prototype
 *      but is no longer enumerable / no longer hits via the same code path.
 *   3. As a last resort we fall back to the non-mangled `constructor.name`
 *      so dev builds (which keep symbol names) still work.
 *
 * Modules that are obviously not Flux stores (no `addChangeListener`) short-
 * circuit out before we touch their `getName`, which keeps us from triggering
 * Discord's i18n module's spurious "Requested message getName" warnings.
 *
 * `findModule` walks `.default` / `.Z` shapes for us, so a store exported as
 * `module.exports.default = new ChannelStore(...)` still matches.
 */
export function findStore(storeName: string): unknown {
    return findModule(exp => storeMatchesName(exp, storeName));
}

/**
 * Locate a Flux store by the *shape* of its method set, ignoring its name.
 *
 * Used as a defensive fallback for `findStore` — if Discord renames a store
 * (or wraps it through a HOC that drops the prototype identity) we can still
 * resolve the right object as long as its method surface is intact. The
 * caller passes a tuple of methods that should be unique to the target store
 * (e.g. `getMutableGuildChannelsForGuild` is exclusive to `ChannelStore`).
 *
 * Returns the first matching store-shaped export. Returns `null` if nothing
 * matches — call sites decide whether that's fatal.
 */
export function findStoreByMethods(...methods: ReadonlyArray<string>): unknown {
    if (methods.length === 0) return null;
    return findModule(exp => {
        if (!exp || typeof exp !== "object") return false;
        const o = exp as Record<string, unknown>;
        if (typeof o.addChangeListener !== "function") return false;
        for (const m of methods) {
            if (typeof o[m] !== "function") return false;
        }
        return true;
    });
}

function storeMatchesName(exp: unknown, storeName: string): boolean {
    if (!exp || typeof exp !== "object") return false;
    const o = exp as Record<string, unknown>;
    if (typeof o.addChangeListener !== "function") return false;
    if (typeof o.getName === "function") {
        try {
            if ((o.getName as () => string)() === storeName) return true;
        } catch {
            // Some prototype-mangled stores throw when `getName` is invoked
            // before the instance is fully wired. Fall through to the
            // constructor-based probes — they don't depend on `this`.
        }
    }
    const ctor = (o as { constructor?: { displayName?: unknown; name?: unknown } }).constructor;
    if (ctor) {
        if (typeof ctor.displayName === "string" && ctor.displayName === storeName) return true;
        if (typeof ctor.name === "string" && ctor.name === storeName) return true;
    }
    return false;
}

/**
 * Awaitable handle that resolves once we've captured webpack's `require` —
 * i.e. the module cache is reachable. Useful for plugins that want to
 * synchronously read a store on first use without missing modules that loaded
 * before BOON booted.
 */
export function whenWebpackReady(): Promise<void> {
    return webpackRequire ? Promise.resolve() : readyPromise;
}

/** True if we've successfully captured webpack's `require`. */
export function isWebpackReady(): boolean {
    return webpackRequire !== null;
}

/** Number of modules we currently know about. Useful for diagnostics. */
export function moduleCount(): number {
    return exportsById.size;
}
