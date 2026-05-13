/*
 * BOON — Discord Client Modification Framework
 * Copyright (c) 2026 ali travians and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Plugin spec, lifecycle, shared types.
 *
 * Design notes:
 *   - Schemas are described as readonly so plugin authors can write them as
 *     `const SCHEMA = {...} as const satisfies SettingsSchema` and keep narrow
 *     literal types for select options.
 *   - The runtime SettingsBag exposed to plugins is a typed Proxy: reads return
 *     the persisted value (falling back to the schema default) and writes
 *     persist immediately AND emit a "settings:changed" event.
 *   - All effects acquired through PluginContext (event listeners, injected
 *     styles, registered commands) are tracked and torn down by the lifecycle
 *     manager — plugins cannot leak state.
 */

export type BoonTarget = "userscript" | "extension" | "desktop";

export interface PluginAuthor {
    name: string;
    id?: string;
}

// ─── Settings schema ─────────────────────────────────────────────────────────

export type SettingType =
    | "boolean"
    | "string"
    | "number"
    | "select"
    | "color"
    | "textarea";

interface SettingDefinitionBase<T> {
    readonly type: SettingType;
    readonly label: string;
    readonly description?: string;
    readonly default: T;
}

export interface BooleanSetting extends SettingDefinitionBase<boolean> {
    readonly type: "boolean";
}

export interface StringSetting extends SettingDefinitionBase<string> {
    readonly type: "string" | "color";
    readonly placeholder?: string;
}

export interface TextareaSetting extends SettingDefinitionBase<string> {
    readonly type: "textarea";
    readonly placeholder?: string;
}

export interface NumberSetting extends SettingDefinitionBase<number> {
    readonly type: "number";
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
}

export interface SelectOption {
    readonly label: string;
    readonly value: string;
}

export interface SelectSetting extends SettingDefinitionBase<string> {
    readonly type: "select";
    readonly options: ReadonlyArray<SelectOption>;
}

export type SettingDefinition =
    | BooleanSetting
    | StringSetting
    | TextareaSetting
    | NumberSetting
    | SelectSetting;

export type SettingsSchema = Readonly<Record<string, SettingDefinition>>;

/**
 * Maps a schema to its concrete value type, switching on `type` so the schema
 * can be declared `as const satisfies SettingsSchema` and still produce the
 * right value types — without locking `preset: "default"` into a literal.
 *
 * For `select` settings, the value type is the union of the declared option
 * `value` strings (so editor autocomplete is meaningful), falling back to
 * plain `string`.
 */
export type SettingsValues<S extends SettingsSchema> = {
    -readonly [K in keyof S]:
        S[K] extends { readonly type: "boolean" } ? boolean :
        S[K] extends { readonly type: "number" } ? number :
        S[K] extends { readonly type: "select"; readonly options: ReadonlyArray<{ readonly value: infer V extends string }> } ? V :
        S[K] extends { readonly type: "string" | "color" | "textarea" } ? string :
        never;
};

// ─── Logger ──────────────────────────────────────────────────────────────────

export interface BoonLogger {
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    debug(...args: unknown[]): void;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface BoonEventMap {
    "message:received": { messageId: string; channelId: string; content: string; authorId: string };
    "message:sent": { channelId: string; content: string };
    "channel:switch": { channelId: string | null; guildId: string | null };
    "settings:changed": { pluginId: string; key: string; value: unknown };
    "plugin:enabled": { pluginId: string };
    "plugin:disabled": { pluginId: string };
    "profile:switched": { profileId: string };
    "boon:ready": Record<string, never>;
    "activity:appended": ActivityEntry;
}

// ─── Activity log ────────────────────────────────────────────────────────────

export type ActivityLevel = "info" | "warn" | "error" | "debug";

export interface ActivityEntry {
    readonly timestamp: number;
    readonly source: string;
    readonly level: ActivityLevel;
    readonly message: string;
}

// ─── Commands ────────────────────────────────────────────────────────────────

export interface BoonCommandArg {
    readonly name: string;
    readonly description?: string;
    readonly required?: boolean;
}

export interface BoonCommand {
    readonly name: string;
    readonly description: string;
    readonly args?: ReadonlyArray<BoonCommandArg>;
    /** Hide from the command palette but keep usable via the `..prefix`. */
    readonly hidden?: boolean;
    execute(args: string[], raw: string): void | Promise<void>;
}

// ─── Plugin context ──────────────────────────────────────────────────────────

export interface PluginStats {
    /** Increment a counter; surfaced on the Dashboard plugin card. */
    bump(key: string, by?: number): void;
    /** Read the current value of a counter. */
    get(key: string): number;
    /** Snapshot all counters as a plain object. */
    snapshot(): Record<string, number>;
    /** Update the "last used" timestamp shown on the Dashboard card. */
    touch(): void;
}

/** Async key-value store backed by IndexedDB (per-plugin namespace). */
export interface PluginDataStore {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    keys(): Promise<string[]>;
    clear(): Promise<void>;
}

/** Right-click context menu patcher (DOM-based, Vencord-style API). */
export interface ContextMenuApi {
    patch(
        kind: "message" | "user" | "channel" | "guild" | "any",
        patch: (
            ctx: {
                kind: "message" | "user" | "channel" | "guild" | "unknown";
                messageId?: string;
                channelId?: string;
                guildId?: string;
                userId?: string;
                menuEl: HTMLElement;
                target: HTMLElement | null;
            },
            addItem: (item: ContextMenuItem) => void,
        ) => void,
    ): () => void;
}

export interface ContextMenuItem {
    readonly id: string;
    readonly label: string;
    readonly icon?: string;
    readonly danger?: boolean;
    readonly disabled?: boolean;
    onClick: (ctx: {
        kind: string;
        messageId?: string;
        channelId?: string;
        guildId?: string;
        userId?: string;
    }) => void | Promise<void>;
}

/** Attach DOM accessories below each Discord message. */
export interface MessageAccessoriesApi {
    add(id: string, factory: (info: AccessoryMessageInfo) => HTMLElement | null): () => void;
    remove(id: string): void;
}

export interface AccessoryMessageInfo {
    readonly id: string;
    readonly channelId: string | null;
    readonly author: string;
    readonly content: string;
    readonly el: HTMLElement;
}

/** Inject buttons next to Discord's chat input toolbar. */
export interface ChatButtonApi {
    add(button: ChatButtonSpec): () => void;
    remove(id: string): void;
}

export interface ChatButtonSpec {
    readonly id: string;
    readonly label: string;
    readonly icon: string;
    onClick(): void;
}

export interface PluginContext<S extends SettingsSchema = SettingsSchema> {
    readonly manifest: PluginManifest;
    readonly logger: BoonLogger;
    readonly stats: PluginStats;
    readonly settings: SettingsValues<S>;
    readonly dataStore: PluginDataStore;
    readonly contextMenu: ContextMenuApi;
    readonly messageAccessories: MessageAccessoriesApi;
    readonly chatButton: ChatButtonApi;
    on<E extends keyof BoonEventMap>(event: E, handler: (payload: BoonEventMap[E]) => void): () => void;
    injectStyle(css: string, id?: string): () => void;
    registerCommand(command: BoonCommand): () => void;
    toast(message: string, type?: "info" | "success" | "error"): void;
}

// ─── Plugin definition ───────────────────────────────────────────────────────

export interface PluginManifest {
    /** Unique id, lowercase ascii. */
    readonly id: string;
    /** Display name shown in BOON UI. */
    readonly name: string;
    /** One-line description (Arabic preferred). */
    readonly description: string;
    readonly authors: ReadonlyArray<PluginAuthor>;
    readonly version: string;
    readonly tags?: ReadonlyArray<string>;
    /** Enable the plugin on first run. */
    readonly enabledByDefault?: boolean;
    /** Restrict to specific build targets. Omit = all. */
    readonly targets?: ReadonlyArray<BoonTarget>;
}

export interface PluginDefinition<S extends SettingsSchema = SettingsSchema> {
    readonly manifest: PluginManifest;
    readonly settings?: S;
    /** One-time setup at framework boot, before `onStart`. */
    onLoad?(ctx: PluginContext<S>): void | Promise<void>;
    /** Required. Called when the plugin is enabled. */
    onStart(ctx: PluginContext<S>): void | Promise<void>;
    /** Required. Must reverse everything `onStart` did. */
    onStop(ctx: PluginContext<S>): void | Promise<void>;
}

/** Type-erased plugin definition for storage in the manager. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPlugin = PluginDefinition<any>;

/** Helper that preserves the settings-schema generic for plugin authors. */
export function definePlugin<S extends SettingsSchema>(def: PluginDefinition<S>): PluginDefinition<S> {
    return def;
}

// ─── Window global ───────────────────────────────────────────────────────────

declare global {
    interface Window {
        BOON?: BoonGlobal;
    }

    // Bootstrap object installed by the desktop patcher before renderer.js
    // runs. Lets the renderer talk back to the main process to download
    // updates, relaunch Discord, etc. Always check that `__BOON__` exists
    // and that `invoke` resolves — non-desktop targets won't have it.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    var __BOON__: BoonBoot | undefined;
}

export interface BoonBoot {
    readonly currentVersion: string | null;
    readonly dataDir: string;
    readonly lastPromotedVersion: string | null;
    readonly ipc: boolean;
    invoke<T = unknown>(channel: string, payload?: unknown): Promise<T>;
}

export interface BoonPluginInfo {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly enabled: boolean;
    readonly tags: ReadonlyArray<string>;
}

export interface BoonGlobal {
    readonly version: string;
    readonly target: BoonTarget;
    readonly plugins: ReadonlyArray<BoonPluginInfo>;
    enable(pluginId: string): Promise<void>;
    disable(pluginId: string): Promise<void>;
    openSettings(): void;
    closeSettings(): void;
    openPalette(): void;
}
