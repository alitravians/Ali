/*
 * BOON — Webpack chunk interceptor
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Hooks Discord's webpack chunk array so we observe every module Discord loads
 * — both chunks that have already been pushed before BOON booted (drained
 * synchronously) and chunks pushed later (intercepted via a property
 * descriptor on `.push`).
 *
 * Discord's chunk array is at `window.webpackChunkdiscord_app`. We:
 *   1. Wait for it to exist (Discord sets it before any chunk is pushed).
 *   2. Drain any already-pushed chunks by replaying their module factories
 *      through our wrapped factory.
 *   3. Override `.push` so all future chunks route through our wrapper.
 *
 * The wrapper wraps every module factory so we can capture the resulting
 * `module.exports` into our own cache without breaking Discord's runtime.
 *
 * Design note: we MUST NOT delay the chunk push (Discord assumes synchronous
 * registration). Our wrapper synchronously invokes the original factory and
 * only caches the exports afterwards.
 *
 * Defensive: every callback is wrapped in try/catch. If anything throws, we
 * log and fall back to the un-wrapped factory so Discord keeps working even
 * if our interceptor misbehaves.
 */

import { createLogger } from "../logger.js";
import { rememberRequire, storeModuleExports } from "./modules.js";
import type { WebpackChunk, WebpackModuleFn, WebpackRequire } from "./types.js";

const log = createLogger("webpack:chunk");
const CHUNK_GLOBAL = "webpackChunkdiscord_app";

let installed = false;

/**
 * Type guard for a freshly-pushed chunk. Discord occasionally pushes "ping"
 * arrays without a modules object during HMR-like flows; we ignore those.
 */
function isRealChunk(value: unknown): value is WebpackChunk {
    if (!Array.isArray(value)) return false;
    if (value.length < 2) return false;
    const modules = value[1];
    return typeof modules === "object" && modules !== null;
}

/**
 * Wraps a single module factory so we capture its exports into our cache
 * after it runs. If the original factory throws, we re-throw so Discord's
 * runtime sees the failure unchanged.
 */
function wrapFactory(id: string | number, fn: WebpackModuleFn): WebpackModuleFn {
    return function wrappedFactory(module, exports, require) {
        rememberRequire(require);
        try {
            fn(module, exports, require);
        } finally {
            try {
                storeModuleExports(id, module.exports);
            } catch (err) {
                log.warn(`failed to cache exports for module ${id}`, err);
            }
        }
    };
}

/**
 * Walks a chunk's modules object and replaces every factory with our wrapped
 * version. Mutates the chunk in place — webpack only reads the modules object
 * once during push, so mutating it is safe.
 */
function wrapChunk(chunk: WebpackChunk): void {
    const modules = chunk[1];
    for (const id of Object.keys(modules)) {
        const original = modules[id];
        if (typeof original !== "function") continue;
        modules[id] = wrapFactory(id, original);
    }
}

/**
 * Captures a `require` reference even before any module factory runs — Discord
 * passes `require` to the optional runtime callback (third tuple element).
 */
function captureRuntimeRequire(chunk: WebpackChunk): void {
    const original = chunk[2];
    if (typeof original !== "function") return;
    chunk[2] = (require: WebpackRequire): void => {
        rememberRequire(require);
        original(require);
    };
}

/**
 * Drains any chunks that were pushed BEFORE we got around to installing the
 * interceptor. We rebuild each module factory through `wrapFactory` and
 * re-invoke it inside the existing module cache so the exports get captured.
 *
 * We never push a NEW chunk for the drained modules — webpack already ran
 * them. We just need to re-discover their exports by reading from the module
 * cache once it's available. The cache becomes reachable as soon as any
 * factory we wrap is invoked (since we stash `require` from the factory's
 * 3rd argument).
 *
 * For pre-existing chunks where wrapping is too late to capture exports
 * during the original run, we lazy-walk `require.c` once the cache is
 * available and copy the cached exports into our own store keyed by id.
 */
function drainAlreadyPushedChunks(arr: WebpackChunk[]): void {
    if (!arr.length) return;
    log.info(`draining ${arr.length} pre-pushed chunk(s)`);
    for (const chunk of arr) {
        if (!isRealChunk(chunk)) continue;
        wrapChunk(chunk);
        captureRuntimeRequire(chunk);
    }
}

/**
 * Install the interceptor on `window[CHUNK_GLOBAL]`.
 *
 * Two cases:
 *   (a) the array doesn't exist yet — install a setter on `window` so we
 *       catch the moment Discord creates it.
 *   (b) the array already exists — drain it and wrap `.push` immediately.
 *
 * Idempotent: calling twice is a no-op.
 */
export function installChunkInterceptor(): void {
    if (installed) return;
    installed = true;

    const win = window as unknown as Record<string, WebpackChunk[] | undefined>;
    const existing = win[CHUNK_GLOBAL];

    /**
     * Build a `.push` wrapper closing over the *current* underlying push fn.
     *
     * We can't bake `originalPush` in once because on the setter-path
     * (array created AFTER our hook fires) webpack overwrites `.push` with
     * its own `webpackJsonpCallback` synchronously right after Discord sets
     * the global. If we hardcoded `Array.prototype.push.bind(arr)` we'd
     * silently lose webpack's own bookkeeping when chunks fire.
     *
     * Instead we re-wrap whatever fn webpack puts in `.push` via the
     * accessor below — that way our wrapper always delegates to the
     * latest underlying push, while still observing every chunk that
     * flows through.
     */
    const buildWrapper = (delegate: (...chunks: WebpackChunk[]) => number) =>
        (...chunks: WebpackChunk[]): number => {
            for (const chunk of chunks) {
                if (!isRealChunk(chunk)) continue;
                try {
                    wrapChunk(chunk);
                    captureRuntimeRequire(chunk);
                } catch (err) {
                    log.warn("wrapChunk failed; passing through unwrapped", err);
                }
            }
            return delegate(...chunks);
        };

    const onArrayReady = (arr: WebpackChunk[]): void => {
        try {
            drainAlreadyPushedChunks(arr);
        } catch (err) {
            log.error("drain failed", err);
        }

        // `underlying` holds the *real* push fn currently in effect. Starts
        // out as the array's own prototype-bound push; webpack may later
        // replace it with `webpackJsonpCallback`, which the setter below
        // captures and re-wraps without dropping our wrapper.
        let underlying: (...chunks: WebpackChunk[]) => number = arr.push.bind(arr);
        const installedWrapper = buildWrapper((...chunks) => underlying(...chunks));

        Object.defineProperty(arr, "push", {
            configurable: true,
            get(): typeof installedWrapper {
                return installedWrapper;
            },
            set(next: (...chunks: WebpackChunk[]) => number) {
                // Webpack (or any other consumer) is trying to overwrite our
                // wrapper. Accept the new fn as the underlying delegate but
                // keep our wrapper installed so we keep observing chunks.
                if (typeof next === "function") {
                    underlying = next;
                    log.info("captured new underlying push fn (webpackJsonpCallback?)");
                }
            },
        });
        log.info("interceptor active on webpackChunkdiscord_app.push");
    };

    if (existing) {
        onArrayReady(existing);
        return;
    }

    // The array doesn't exist yet — install a property descriptor that fires
    // when Discord creates it. Discord assigns the array synchronously during
    // its bundle init, so this setter triggers exactly once.
    let pending: WebpackChunk[] | undefined;
    Object.defineProperty(win, CHUNK_GLOBAL, {
        configurable: true,
        get(): WebpackChunk[] | undefined {
            return pending;
        },
        set(value: WebpackChunk[]) {
            pending = value;
            // Discord's webpack runtime sets the global and immediately starts
            // pushing chunks onto it, so we have to wrap synchronously here.
            onArrayReady(value);
        },
    });
    log.info("waiting for webpackChunkdiscord_app to appear");
}
