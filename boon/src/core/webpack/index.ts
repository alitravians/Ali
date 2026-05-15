/*
 * BOON — Webpack subsystem barrel
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Public surface of the webpack subsystem. Plugins import from this barrel
 * rather than reaching into individual files. Re-exports are intentionally
 * narrow — anything not re-exported here is internal.
 */

export { installChunkInterceptor } from "./chunkInterceptor.js";
export {
    findByProps,
    findModule,
    findStore,
    isWebpackReady,
    moduleCount,
    whenWebpackReady,
} from "./modules.js";
export { getDispatcher, subscribeToAction } from "./dispatcher.js";
export { getTypingStore } from "./stores.js";
export type {
    FluxAction,
    FluxActionHandler,
    FluxDispatcher,
    FluxStoreBase,
    ModuleFilter,
    TypingStore,
    WebpackChunk,
    WebpackModuleFn,
    WebpackModuleId,
    WebpackRequire,
} from "./types.js";
