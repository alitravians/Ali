/*
 * BOON — per-plugin live stats
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * In-memory counters and "last used" timestamps for each plugin. Surfaced
 * on the Dashboard plugin cards. Lives only for the lifetime of the page —
 * not persisted, so refreshing Discord clears the stats.
 */

import type { PluginStats } from "./types.js";

interface PluginRecord {
    counters: Map<string, number>;
    lastUsed: number;
}

const records = new Map<string, PluginRecord>();

function ensure(pluginId: string): PluginRecord {
    let rec = records.get(pluginId);
    if (!rec) {
        rec = { counters: new Map(), lastUsed: 0 };
        records.set(pluginId, rec);
    }
    return rec;
}

export function createStats(pluginId: string): PluginStats {
    return {
        bump(key, by = 1) {
            const rec = ensure(pluginId);
            rec.counters.set(key, (rec.counters.get(key) ?? 0) + by);
            rec.lastUsed = Date.now();
        },
        get(key) {
            return ensure(pluginId).counters.get(key) ?? 0;
        },
        snapshot() {
            const rec = ensure(pluginId);
            return Object.fromEntries(rec.counters);
        },
        touch() {
            ensure(pluginId).lastUsed = Date.now();
        },
    };
}

export function getLastUsed(pluginId: string): number {
    return records.get(pluginId)?.lastUsed ?? 0;
}

export function getCounters(pluginId: string): Record<string, number> {
    const rec = records.get(pluginId);
    return rec ? Object.fromEntries(rec.counters) : {};
}

export function clearAll(): void {
    records.clear();
}
