/*
 * BOON — per-plugin live stats
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Per-plugin counters and "last used" timestamps. The `lastUsed` value is
 * persisted to localStorage under `alitravians:plugin:last-used` so the
 * "unused" filter and "recent" sort survive a Discord restart. Counters
 * remain in-memory only (resetting per session is fine for the dashboard).
 *
 * Persistence is best-effort — any storage failure is silently ignored
 * and the in-memory map keeps working.
 */

import type { PluginStats } from "./types.js";

interface PluginRecord {
    counters: Map<string, number>;
    lastUsed: number;
}

const records = new Map<string, PluginRecord>();

const LAST_USED_STORAGE_KEY = "alitravians:plugin:last-used";

function loadLastUsedMap(): Record<string, number> {
    try {
        const raw = localStorage.getItem(LAST_USED_STORAGE_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const out: Record<string, number> = {};
            for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
                if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[k] = v;
            }
            return out;
        }
    } catch { /* ignore */ }
    return {};
}

let lastUsedHydrated = false;
function hydrateLastUsed(): void {
    if (lastUsedHydrated) return;
    const map = loadLastUsedMap();
    for (const [id, ts] of Object.entries(map)) {
        const rec = records.get(id);
        if (rec) rec.lastUsed = ts;
        else records.set(id, { counters: new Map(), lastUsed: ts });
    }
    lastUsedHydrated = true;
}

function persistLastUsed(): void {
    try {
        const out: Record<string, number> = {};
        for (const [id, rec] of records) {
            if (rec.lastUsed > 0) out[id] = rec.lastUsed;
        }
        localStorage.setItem(LAST_USED_STORAGE_KEY, JSON.stringify(out));
    } catch { /* ignore */ }
}

function ensure(pluginId: string): PluginRecord {
    hydrateLastUsed();
    let rec = records.get(pluginId);
    if (!rec) {
        rec = { counters: new Map(), lastUsed: 0 };
        records.set(pluginId, rec);
    }
    return rec;
}

function markUsed(rec: PluginRecord): void {
    rec.lastUsed = Date.now();
    persistLastUsed();
}

export function createStats(pluginId: string): PluginStats {
    return {
        bump(key, by = 1) {
            const rec = ensure(pluginId);
            rec.counters.set(key, (rec.counters.get(key) ?? 0) + by);
            markUsed(rec);
        },
        get(key) {
            return ensure(pluginId).counters.get(key) ?? 0;
        },
        snapshot() {
            const rec = ensure(pluginId);
            return Object.fromEntries(rec.counters);
        },
        touch() {
            markUsed(ensure(pluginId));
        },
    };
}

export function getLastUsed(pluginId: string): number {
    hydrateLastUsed();
    return records.get(pluginId)?.lastUsed ?? 0;
}

export function getCounters(pluginId: string): Record<string, number> {
    const rec = records.get(pluginId);
    return rec ? Object.fromEntries(rec.counters) : {};
}

export function clearAll(): void {
    records.clear();
    try { localStorage.removeItem(LAST_USED_STORAGE_KEY); } catch { /* ignore */ }
    lastUsedHydrated = false;
}
