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
    dumpStoresForDiagnostic,
    findAllByCode,
    findAllModules,
    findAllStoresByMethods,
    findByCode,
    findByProps,
    findModule,
    findStore,
    findStoreByCode,
    findStoreByMethods,
    isWebpackReady,
    moduleCount,
    probeWebpackForDiagnostic,
    whenWebpackReady,
} from "./modules.js";
export type { WebpackProbeSnapshot } from "./modules.js";
export { getDispatcher, subscribeToAction } from "./dispatcher.js";
export {
    getChannelStore,
    getGuildMemberStore,
    getGuildStore,
    getPermissionStore,
    getTypingStore,
    getUserStore,
} from "./stores.js";
export type {
    ChannelStore,
    DiscordChannelLite,
    DiscordForumTag,
    DiscordGuildLite,
    DiscordGuildMemberLite,
    DiscordPermissionOverwrite,
    DiscordRoleLite,
    DiscordUserLite,
    FluxAction,
    FluxActionHandler,
    FluxDispatcher,
    FluxStoreBase,
    GuildMemberStore,
    GuildStore,
    ModuleFilter,
    PermissionStore,
    TypingStore,
    UserStore,
    WebpackChunk,
    WebpackModuleFn,
    WebpackModuleId,
    WebpackRequire,
} from "./types.js";
