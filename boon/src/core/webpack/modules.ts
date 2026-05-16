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
import type { ModuleFilter, WebpackModuleFn, WebpackModuleId, WebpackRequire } from "./types.js";

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
        const hit = probeExportShape(exp, id, filter);
        if (hit !== undefined) return hit;
    }
    return null;
}

/**
 * Iterator variant of `findModule`: yields every export (top-level, `.default`,
 * `.Z`, OR any named-key value) whose value satisfies the predicate.
 *
 * Used by `resolveStore` so a caller-supplied validator can pick the right
 * candidate when more than one module passes the shallow shape test (e.g.
 * Discord's i18n `MessagesStore` fakes a function for every property access
 * and so passes coarse `typeof o[m] === "function"` filters for any method
 * fingerprint we throw at it).
 */
export function* findAllModules(filter: ModuleFilter): IterableIterator<unknown> {
    if (!cacheDrained && webpackRequire) {
        drainModuleCache();
    }
    for (const [id, exp] of exportsById) {
        yield* probeExportShapeAll(exp, id, filter);
    }
}

/**
 * Probe every conventional location an export may live at and return the
 * first hit, or `undefined` if none match. The locations covered:
 *
 *   1. The export itself.
 *   2. `.default` (CJS → ESM interop shape used by Babel / TS).
 *   3. `.Z` (legacy Discord-bundled CJS-style export).
 *   4. Every other enumerable own key on the export object — modern
 *      Webpack splits `Flux.connectStores`-style exports across multiple
 *      named properties (e.g. `{ ChannelStore: ..., GuildChannelStore: ... }`)
 *      and the only way to discover the right one is to iterate.
 */
function probeExportShape(exp: unknown, id: WebpackModuleId, filter: ModuleFilter): unknown {
    try {
        if (filter(exp, id)) return exp;
    } catch {
        // Predicate threw — skip.
    }
    if (!exp || typeof exp !== "object") return undefined;
    const o = exp as Record<string, unknown>;
    return probeOwnKeys(o, id, filter);
}

function* probeExportShapeAll(exp: unknown, id: WebpackModuleId, filter: ModuleFilter): IterableIterator<unknown> {
    try {
        if (filter(exp, id)) yield exp;
    } catch { /* skip */ }
    if (!exp || typeof exp !== "object") return;
    yield* probeOwnKeysAll(exp as Record<string, unknown>, id, filter);
}

function probeOwnKeys(o: Record<string, unknown>, id: WebpackModuleId, filter: ModuleFilter): unknown {
    let keys: string[];
    try {
        keys = Object.keys(o);
    } catch {
        return undefined;
    }
    for (const key of keys) {
        let value: unknown;
        try { value = o[key]; } catch { continue; }
        try {
            if (filter(value, id)) return value;
        } catch {
            // Predicate threw — skip.
        }
    }
    return undefined;
}

function* probeOwnKeysAll(o: Record<string, unknown>, id: WebpackModuleId, filter: ModuleFilter): IterableIterator<unknown> {
    let keys: string[];
    try {
        keys = Object.keys(o);
    } catch {
        return;
    }
    for (const key of keys) {
        let value: unknown;
        try { value = o[key]; } catch { continue; }
        try {
            if (filter(value, id)) yield value;
        } catch { /* skip */ }
    }
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
    return findModule(exp => storeMatchesMethods(exp, methods));
}

/**
 * Iterator variant of `findStoreByMethods`: yields every store-shaped export
 * that exposes the named methods. Used by `resolveStore` so a caller-supplied
 * validator can drop false positives (e.g. Discord's i18n MessagesStore,
 * which fakes a function for *every* property access and so passes the
 * shallow `typeof o[m] === "function"` test for any fingerprint we throw at
 * it).
 */
export function findAllStoresByMethods(...methods: ReadonlyArray<string>): IterableIterator<unknown> {
    if (methods.length === 0) return [].values();
    return findAllModules(exp => storeMatchesMethods(exp, methods));
}

function storeMatchesMethods(exp: unknown, methods: ReadonlyArray<string>): boolean {
    if (!exp || typeof exp !== "object") return false;
    const o = exp as Record<string, unknown>;
    if (typeof o.addChangeListener !== "function") return false;
    for (const m of methods) {
        if (typeof o[m] !== "function") return false;
    }
    return true;
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

/**
 * Snapshot of the webpack subsystem for diagnostic surfacing in plugin UI.
 *
 * Used by the showHiddenChannels panel: when `getChannelStore()` fails on a
 * production build we don't have console access on, embedding these numbers
 * in the "degraded" banner gives us a one-shot view of what's available and
 * what isn't (cache drained? module registry exposed? do any factories
 * contain the marker substring we expect?). Strictly read-only.
 */
export interface WebpackProbeSnapshot {
    cachedExportsCount: number;
    hasModuleRegistry: boolean;
    hasModuleCache: boolean;
    moduleRegistryKeyCount: number;
    factoriesWithMarker: number;
    storeShapedExports: number;
    storeNames: string[];
}

export function probeWebpackForDiagnostic(marker: string): WebpackProbeSnapshot {
    if (!cacheDrained && webpackRequire) drainModuleCache();
    let factoriesWithMarker = 0;
    let moduleRegistryKeyCount = 0;
    const hasModuleRegistry = !!webpackRequire?.m;
    if (webpackRequire?.m) {
        try {
            for (const id of Object.keys(webpackRequire.m)) {
                moduleRegistryKeyCount++;
                const fn = webpackRequire.m[id];
                if (typeof fn !== "function") continue;
                let src: string;
                try { src = Function.prototype.toString.call(fn); } catch { continue; }
                if (src.includes(marker)) factoriesWithMarker++;
            }
        } catch { /* best-effort */ }
    }
    let storeShapedExports = 0;
    const storeNames: string[] = [];
    for (const [, exp] of exportsById) {
        const candidates: unknown[] = [exp];
        if (exp && typeof exp === "object") {
            const o = exp as Record<string, unknown>;
            try {
                for (const k of Object.keys(o)) {
                    try { candidates.push(o[k]); } catch { /* skip */ }
                }
            } catch { /* skip */ }
        }
        for (const c of candidates) {
            if (!c || typeof c !== "object") continue;
            const o2 = c as Record<string, unknown>;
            if (typeof o2.addChangeListener !== "function") continue;
            storeShapedExports++;
            try {
                const dn = (o2 as { constructor?: { displayName?: unknown } }).constructor?.displayName;
                if (typeof dn === "string" && dn.length > 0 && storeNames.length < 40) storeNames.push(dn);
                else if (typeof o2.getName === "function" && storeNames.length < 40) {
                    const n = (o2.getName as () => unknown)();
                    if (typeof n === "string" && n.length > 0) storeNames.push(n);
                }
            } catch { /* skip */ }
        }
    }
    return {
        cachedExportsCount: exportsById.size,
        hasModuleRegistry,
        hasModuleCache: !!webpackRequire?.c,
        moduleRegistryKeyCount,
        factoriesWithMarker,
        storeShapedExports,
        storeNames,
    };
}

/**
 * Locate a webpack module whose factory source contains every supplied
 * substring, then return that module's exports.
 *
 * This is the same trick Vencord / BetterDiscord use to pin internal stores
 * on modern Discord builds: even when the store's identifying `getName` /
 * `displayName` is mangled and the public method surface overlaps with the
 * i18n MessagesStore (which fakes a function for *every* property access),
 * the original source text still contains the literal method names and
 * action constants the store handles. Searching for one of those literals
 * is a stable way to pin the real module without false positives.
 *
 * Returns `null` if no factory matches every substring or if webpack's
 * module registry isn't available yet.
 */
export function findByCode(...substrings: ReadonlyArray<string>): unknown {
    for (const exp of findAllByCode(substrings)) {
        return exp;
    }
    return null;
}

/**
 * Iterator variant of {@link findByCode}: yields the exports of every module
 * whose factory source contains every supplied substring. Used to pick the
 * right candidate when the substring is too generic to be unique.
 */
export function* findAllByCode(substrings: ReadonlyArray<string>): IterableIterator<unknown> {
    if (substrings.length === 0) return;
    if (!webpackRequire?.m) return;
    const registry = webpackRequire.m;
    for (const id of Object.keys(registry)) {
        const factory: WebpackModuleFn | undefined = registry[id];
        if (typeof factory !== "function") continue;
        let src: string;
        try { src = Function.prototype.toString.call(factory); } catch { continue; }
        let allFound = true;
        for (const s of substrings) {
            if (!src.includes(s)) { allFound = false; break; }
        }
        if (!allFound) continue;
        // Prefer cached exports so we don't trigger a fresh factory run with
        // its boot side effects. Fall back to invoking `require(id)` only if
        // the module hasn't been loaded yet — in practice it always has been
        // by the time a plugin asks for it, but we keep this as a safety net.
        try {
            const cached = webpackRequire.c?.[id];
            if (cached && "exports" in cached) {
                yield cached.exports;
                continue;
            }
            yield webpackRequire(id);
        } catch (err) {
            log.warn(`findByCode: failed to load module ${id}`, err);
        }
    }
}

/**
 * Convenience: find a Flux-shaped store inside a module whose factory source
 * contains every supplied substring. The returned value is the actual store
 * instance (extracted from the module's exports via the standard
 * `default`/`Z`/named-key walk), not the raw export wrapper.
 */
export function findStoreByCode(...substrings: ReadonlyArray<string>): unknown {
    for (const exp of findAllByCode(substrings)) {
        const hit = probeExportShape(exp, "<by-code>", v => {
            if (!v || typeof v !== "object") return false;
            return typeof (v as Record<string, unknown>).addChangeListener === "function";
        });
        if (hit !== undefined) return hit;
    }
    return null;
}

/**
 * Diagnostic helper: emit a single console group describing every Flux-shaped
 * module we know about (anything with `addChangeListener`), with its name
 * hints and the subset of method names that match a /channel|guild/i regex.
 *
 * Call this when a store accessor returns `null` and you need to know why.
 * Output goes to Discord's renderer console (visible under DevTools) so the
 * user can screenshot it back to us without us shipping a build that logs
 * every render.
 */
export function dumpStoresForDiagnostic(tag: string): void {
    if (!cacheDrained && webpackRequire) {
        drainModuleCache();
    }
    const dumped: Array<Record<string, unknown>> = [];
    for (const [id, exp] of exportsById) {
        const targets: Array<{ from: string; obj: unknown }> = [{ from: "root", obj: exp }];
        if (exp && typeof exp === "object") {
            const o = exp as Record<string, unknown>;
            if ("default" in o) targets.push({ from: "default", obj: o.default });
            if ("Z" in o) targets.push({ from: "Z", obj: o.Z });
        }
        for (const { from, obj } of targets) {
            if (!obj || typeof obj !== "object") continue;
            const t = obj as Record<string, unknown>;
            if (typeof t.addChangeListener !== "function") continue;
            const info: Record<string, unknown> = { id, from };
            try {
                info.displayName = (t as { constructor?: { displayName?: unknown } }).constructor?.displayName ?? null;
            } catch { info.displayName = "<threw>"; }
            try {
                info.ctorName = (t as { constructor?: { name?: unknown } }).constructor?.name ?? null;
            } catch { info.ctorName = "<threw>"; }
            try {
                if (typeof t.getName === "function") {
                    info.getName = (t.getName as () => unknown)();
                }
            } catch { info.getName = "<threw>"; }
            const methods: string[] = [];
            try {
                for (const key of Object.getOwnPropertyNames(t)) {
                    if (typeof t[key] === "function" && /channel|guild/i.test(key)) methods.push(key);
                }
                const proto = Object.getPrototypeOf(t);
                if (proto) {
                    for (const key of Object.getOwnPropertyNames(proto)) {
                        if (key === "constructor") continue;
                        try {
                            if (typeof (t as Record<string, unknown>)[key] === "function" && /channel|guild/i.test(key)) {
                                if (!methods.includes(key)) methods.push(key);
                            }
                        } catch {
                            // Some getters throw — skip.
                        }
                    }
                }
            } catch {
                // ignore
            }
            info.channelGuildMethods = methods;
            dumped.push(info);
        }
    }
    // Use console.warn so it survives Discord's log-level filters in production.
    // eslint-disable-next-line no-console
    console.warn(`[alitravians:storeDiag:${tag}] Flux-shaped exports: ${dumped.length}`);
    for (const row of dumped) {
        // eslint-disable-next-line no-console
        console.warn(`[alitravians:storeDiag:${tag}]`, row);
    }
}
