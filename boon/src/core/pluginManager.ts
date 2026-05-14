/*
 * BOON — plugin lifecycle manager
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Owns the registered plugin list, persists which are enabled, and wires each
 * plugin's `PluginContext`. Every effect a plugin acquires via the context
 * (event subscription, registered command, injected style) is pushed onto a
 * cleanup stack and torn down on `stop()` so plugins cannot leak state.
 *
 * Error boundaries:
 *   - `onLoad`, `onStart`, `onStop`, and individual cleanup callbacks are all
 *     wrapped in try/catch. A throwing plugin can never break BOON itself or
 *     prevent other plugins from running.
 *   - Errors are routed through the plugin's namespaced logger which writes
 *     to both the browser console and the Activity log.
 */

import * as chatButtonApi from "./chatButton.js";
import * as commands from "./commands.js";
import * as contextMenuApi from "./contextMenu.js";
import { createPluginStore } from "./dataStore.js";
import { emit, on } from "./events.js";
import { createLogger } from "./logger.js";
import * as messageAccessoriesApi from "./messageAccessories.js";
import { bindSettings, isEnabled, setEnabled } from "./settings.js";
import { createStats } from "./stats.js";
import { injectStyle } from "./styles.js";
import { toast as showToast } from "./toast.js";
import type {
    AnyPlugin,
    BoonCommand,
    BoonEventMap,
    BoonTarget,
    ChatButtonApi,
    ChatButtonSpec,
    ContextMenuApi,
    ContextMenuItem,
    MessageAccessoriesApi,
    PluginContext,
    PluginDataStore,
    SettingsSchema,
} from "./types.js";

interface RegisteredPlugin {
    def: AnyPlugin;
    ctx: PluginContext<SettingsSchema>;
    cleanups: Array<() => void>;
    enabled: boolean;
    /** Set when a fatal error during onStart disables the plugin for the session. */
    crashed: boolean;
}

const registered = new Map<string, RegisteredPlugin>();
let currentTarget: BoonTarget = "userscript";

export function setTarget(target: BoonTarget): void {
    currentTarget = target;
}

export function getTarget(): BoonTarget {
    return currentTarget;
}

function safeCleanup(fn: () => void, onError: (err: unknown) => void): void {
    try {
        fn();
    } catch (err) {
        onError(err);
    }
}

function buildContext(def: AnyPlugin, cleanups: Array<() => void>): PluginContext<SettingsSchema> {
    const { manifest } = def;
    const logger = createLogger(manifest.id);
    const stats = createStats(manifest.id);
    const settings = def.settings
        ? bindSettings(manifest.id, def.settings)
        : ({} as ReturnType<typeof bindSettings>);

    const dataStore: PluginDataStore = createPluginStore(manifest.id);

    const contextMenuRaw = contextMenuApi.createApi();
    const contextMenu: ContextMenuApi = {
        patch(kind, fn) {
            const off = contextMenuRaw.patch(kind, fn as Parameters<typeof contextMenuRaw.patch>[1]);
            cleanups.push(off);
            return off;
        },
    };

    const messageAccessoriesRaw = messageAccessoriesApi.createApi();
    const messageAccessories: MessageAccessoriesApi = {
        add(id, factory) {
            const off = messageAccessoriesRaw.add(id, factory);
            cleanups.push(off);
            return off;
        },
        remove(id) {
            messageAccessoriesRaw.remove(id);
        },
        rescan(messageEl) {
            messageAccessoriesRaw.rescan(messageEl);
        },
    };

    const chatButtonRaw = chatButtonApi.createApi(manifest.id);
    const chatButton: ChatButtonApi = {
        add(button: ChatButtonSpec) {
            const off = chatButtonRaw.add(button);
            cleanups.push(off);
            return off;
        },
        remove(id) {
            chatButtonRaw.remove(id);
        },
    };

    return {
        manifest,
        logger,
        stats,
        settings,
        dataStore,
        contextMenu,
        messageAccessories,
        chatButton,
        on<E extends keyof BoonEventMap>(event: E, handler: (payload: BoonEventMap[E]) => void): () => void {
            const wrapped = (payload: BoonEventMap[E]): void => {
                try {
                    handler(payload);
                } catch (err) {
                    logger.error(`handler for ${String(event)} threw`, err);
                }
            };
            const off = on(event, wrapped);
            cleanups.push(off);
            return off;
        },
        injectStyle(css: string, suffix?: string): () => void {
            const remove = injectStyle(manifest.id, css, suffix);
            cleanups.push(remove);
            return remove;
        },
        registerCommand(command: BoonCommand): () => void {
            const wrapped: BoonCommand = {
                ...command,
                async execute(args, raw) {
                    try {
                        await command.execute(args, raw);
                    } catch (err) {
                        logger.error(`command "${command.name}" threw`, err);
                    }
                },
            };
            const off = commands.register(wrapped);
            cleanups.push(off);
            return off;
        },
        toast(message: string, type: "info" | "success" | "error" = "info"): void {
            showToast(`[${manifest.name}] ${message}`, type);
        },
    };
}

export async function register(def: AnyPlugin): Promise<void> {
    const { manifest } = def;
    if (manifest.targets && !manifest.targets.includes(currentTarget)) {
        createLogger(manifest.id).debug(`skipping (not enabled for target=${currentTarget})`);
        return;
    }
    if (registered.has(manifest.id)) {
        createLogger("core").warn(`plugin ${manifest.id} already registered`);
        return;
    }
    const cleanups: Array<() => void> = [];
    const ctx = buildContext(def, cleanups);
    const entry: RegisteredPlugin = {
        def,
        ctx,
        cleanups,
        enabled: false,
        crashed: false,
    };
    registered.set(manifest.id, entry);

    try {
        await def.onLoad?.(ctx);
    } catch (err) {
        ctx.logger.error("onLoad failed", err);
    }

    const shouldStart = isEnabled(manifest.id, manifest.enabledByDefault ?? true);
    if (shouldStart) await start(manifest.id);
}

export async function start(pluginId: string): Promise<void> {
    const entry = registered.get(pluginId);
    if (!entry || entry.enabled) return;
    if (entry.crashed) {
        entry.ctx.logger.warn("plugin crashed earlier this session; not starting");
        return;
    }
    try {
        await entry.def.onStart(entry.ctx);
        entry.enabled = true;
        setEnabled(pluginId, true);
        entry.ctx.logger.info("started");
        emit("plugin:enabled", { pluginId });
    } catch (err) {
        entry.ctx.logger.error("onStart failed; plugin disabled for session", err);
        entry.crashed = true;
        for (const fn of entry.cleanups.splice(0)) {
            safeCleanup(fn, e => entry.ctx.logger.warn("cleanup threw after crash", e));
        }
    }
}

export async function stop(pluginId: string): Promise<void> {
    const entry = registered.get(pluginId);
    if (!entry || !entry.enabled) return;
    try {
        await entry.def.onStop(entry.ctx);
    } catch (err) {
        entry.ctx.logger.error("onStop failed", err);
    }
    for (const fn of entry.cleanups.splice(0)) {
        safeCleanup(fn, e => entry.ctx.logger.warn("cleanup threw", e));
    }
    entry.enabled = false;
    setEnabled(pluginId, false);
    entry.ctx.logger.info("stopped");
    emit("plugin:disabled", { pluginId });
}

export async function toggle(pluginId: string): Promise<void> {
    const entry = registered.get(pluginId);
    if (!entry) return;
    if (entry.enabled) await stop(pluginId);
    else await start(pluginId);
}

export interface PluginListEntry {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    crashed: boolean;
    tags: ReadonlyArray<string>;
}

export function list(): PluginListEntry[] {
    return [...registered.values()].map(e => ({
        id: e.def.manifest.id,
        name: e.def.manifest.name,
        description: e.def.manifest.description,
        enabled: e.enabled,
        crashed: e.crashed,
        tags: e.def.manifest.tags ?? [],
    }));
}

export function get(pluginId: string): RegisteredPlugin | undefined {
    return registered.get(pluginId);
}
