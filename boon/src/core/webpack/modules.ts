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
 * Locate a Flux store whose `getName()` returns the given storeName.
 *
 * Discord's stores all share a common shape: they're class instances with
 * `getName()` returning a stable name like `"TypingStore"`, plus the
 * `addChangeListener` / `removeChangeListener` pair from `Flux.Store`.
 *
 * Note: some Discord stores live on `.default` of their module export, so we
 * follow the same `.default` / `.Z` probe as `findModule`.
 */
export function findStore(storeName: string): unknown {
    return findModule(exp => {
        if (!exp || typeof exp !== "object") return false;
        const o = exp as Record<string, unknown>;
        if (typeof o.getName !== "function") return false;
        if (typeof o.addChangeListener !== "function") return false;
        try {
            return (o.getName as () => string)() === storeName;
        } catch {
            return false;
        }
    });
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
