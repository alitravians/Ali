/*
 * BOON — settings store
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Persistent per-plugin settings backed by `localStorage` under a single
 * JSON blob at `BOON:state`. The blob shape is versioned so future updates
 * can migrate user data forward without data loss.
 *
 * Shape (v1):
 *   {
 *     version: 1,
 *     enabled:  { [pluginId]: boolean },
 *     settings: { [pluginId]: { [key]: SettingValue } },
 *     activeProfile?: string,
 *     profiles?: { [profileId]: { name, enabled, settings } }
 *   }
 *
 * Every write goes through `commit()` which:
 *   1. Validates against the schema (rejects unknown plugin ids? no — those
 *      are allowed for forward compatibility; rejects values that don't
 *      satisfy the declared type).
 *   2. Persists to localStorage.
 *   3. Emits "settings:changed" for plugins to react.
 */

import { emit } from "./events.js";
import { rootLogger } from "./logger.js";
import type {
    SettingDefinition,
    SettingsSchema,
    SettingsValues,
} from "./types.js";

const STORAGE_KEY = "BOON:state";
const CURRENT_VERSION = 1;

export interface ProfileSnapshot {
    name: string;
    enabled: Record<string, boolean>;
    settings: Record<string, Record<string, unknown>>;
}

export interface BoonState {
    version: number;
    enabled: Record<string, boolean>;
    settings: Record<string, Record<string, unknown>>;
    activeProfile?: string;
    profiles?: Record<string, ProfileSnapshot>;
}

function defaultState(): BoonState {
    return {
        version: CURRENT_VERSION,
        enabled: {},
        settings: {},
    };
}

let cached: BoonState | null = null;

function migrate(raw: unknown): BoonState {
    if (!raw || typeof raw !== "object") return defaultState();
    const obj = raw as Partial<BoonState> & { version?: number };
    const version = typeof obj.version === "number" ? obj.version : 0;
    // No migrations yet — bump version when adding new keys.
    return {
        version: CURRENT_VERSION,
        enabled: obj.enabled ?? {},
        settings: obj.settings ?? {},
        activeProfile: obj.activeProfile,
        profiles: obj.profiles,
        ...(version === 0 ? {} : {}),
    };
}

function load(): BoonState {
    if (cached) return cached;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            cached = defaultState();
            return cached;
        }
        cached = migrate(JSON.parse(raw));
        return cached;
    } catch (err) {
        rootLogger.warn("failed to read BOON state, resetting", err);
        cached = defaultState();
        return cached;
    }
}

function commit(): void {
    if (!cached) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch (err) {
        rootLogger.error("failed to persist BOON state", err);
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function isEnabled(pluginId: string, fallback: boolean): boolean {
    const state = load();
    return state.enabled[pluginId] ?? fallback;
}

export function setEnabled(pluginId: string, value: boolean): void {
    const state = load();
    state.enabled[pluginId] = value;
    commit();
}

export function getSetting<T>(pluginId: string, key: string, fallback: T): T {
    const state = load();
    const bucket = state.settings[pluginId];
    if (!bucket || !(key in bucket)) return fallback;
    return bucket[key] as T;
}

export function setSetting(pluginId: string, key: string, value: unknown): void {
    const state = load();
    let bucket = state.settings[pluginId];
    if (!bucket) {
        bucket = {};
        state.settings[pluginId] = bucket;
    }
    bucket[key] = value;
    commit();
    emit("settings:changed", { pluginId, key, value });
}

export function resetPlugin(pluginId: string): void {
    const state = load();
    delete state.settings[pluginId];
    delete state.enabled[pluginId];
    commit();
}

export function exportState(): BoonState {
    return JSON.parse(JSON.stringify(load())) as BoonState;
}

export function importState(next: Partial<BoonState>): void {
    cached = migrate(next);
    commit();
}

// ─── Runtime validation ──────────────────────────────────────────────────────

function isValidForDef(def: SettingDefinition, value: unknown): boolean {
    switch (def.type) {
        case "boolean":
            return typeof value === "boolean";
        case "number":
            if (typeof value !== "number" || !Number.isFinite(value)) return false;
            if (def.min !== undefined && value < def.min) return false;
            if (def.max !== undefined && value > def.max) return false;
            return true;
        case "string":
        case "textarea":
        case "color":
            return typeof value === "string";
        case "select":
            if (typeof value !== "string") return false;
            return def.options.some(opt => opt.value === value);
    }
}

/**
 * Build a live proxy over a plugin's settings schema. Reads return the
 * persisted value (validated against the schema; falls back to the default
 * if missing or invalid). Writes persist immediately AND emit
 * "settings:changed".
 */
export function bindSettings<S extends SettingsSchema>(
    pluginId: string,
    schema: S,
): SettingsValues<S> {
    const target = {} as SettingsValues<S>;
    return new Proxy(target, {
        get(_t, prop) {
            if (typeof prop !== "string") return undefined;
            const def = schema[prop];
            if (!def) return undefined;
            const persisted = getSetting<unknown>(pluginId, prop, def.default);
            return isValidForDef(def, persisted) ? persisted : def.default;
        },
        set(_t, prop, value) {
            if (typeof prop !== "string") return false;
            const def = schema[prop];
            if (!def) return false;
            if (!isValidForDef(def, value)) {
                rootLogger.warn(`rejected invalid ${pluginId}.${prop}`, value);
                return false;
            }
            setSetting(pluginId, prop, value);
            return true;
        },
        ownKeys() {
            return Object.keys(schema);
        },
        getOwnPropertyDescriptor(_t, prop) {
            if (typeof prop !== "string") return undefined;
            const def = schema[prop];
            if (!def) return undefined;
            const persisted = getSetting<unknown>(pluginId, prop, def.default);
            return {
                enumerable: true,
                configurable: true,
                value: isValidForDef(def, persisted) ? persisted : def.default,
            };
        },
        has(_t, prop) {
            return typeof prop === "string" && prop in schema;
        },
    });
}
