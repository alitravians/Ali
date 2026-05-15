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
