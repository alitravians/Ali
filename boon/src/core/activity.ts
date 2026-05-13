/*
 * BOON — in-memory activity log
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Capped ring buffer of `ActivityEntry`. Plugins push to it via their logger;
 * the Activity tab in the Settings UI subscribes to "activity:appended" to
 * render new entries live. The log is in-memory only (no persistence) and
 * capped to 500 entries to keep memory predictable across long sessions.
 */

import { emit } from "./events.js";
import type { ActivityEntry, ActivityLevel } from "./types.js";

const MAX_ENTRIES = 500;
const buffer: ActivityEntry[] = [];
const subscribers = new Set<(entry: ActivityEntry) => void>();

export function append(source: string, level: ActivityLevel, message: string): void {
    const entry: ActivityEntry = {
        timestamp: Date.now(),
        source,
        level,
        message,
    };
    buffer.push(entry);
    if (buffer.length > MAX_ENTRIES) buffer.shift();
    for (const sub of subscribers) {
        try {
            sub(entry);
        } catch {
            /* swallow subscriber errors */
        }
    }
    emit("activity:appended", entry);
}

export function snapshot(): ReadonlyArray<ActivityEntry> {
    return buffer.slice();
}

export function clear(): void {
    buffer.length = 0;
}

export function subscribe(fn: (entry: ActivityEntry) => void): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
}
