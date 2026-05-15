/*
 * BOON — DataStore (IndexedDB wrapper)
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * A small async key-value store backed by IndexedDB. Use this for data that
 * doesn't belong in the BOON settings blob (which lives in localStorage and
 * is meant for user-facing toggles):
 *
 *   - Translation caches
 *   - Music player playlists / queue snapshots
 *   - Last-seen state per plugin (timestamps, hashes)
 *   - Anything larger than a few kB or that grows over time
 *
 * Each plugin gets its own logical namespace (an IndexedDB object store
 * with a deterministic name) via `createPluginStore(pluginId)`.
 *
 * The implementation degrades gracefully: if IndexedDB is unavailable
 * (private browsing, ancient browser, …) we fall back to an in-memory
 * Map so plugins keep working — they just won't persist.
 */

import { rootLogger } from "./logger.js";

const DB_NAME = "boon-datastore";
const DB_VERSION = 1;
const STORE_PREFIX = "plugin:";

let dbPromise: Promise<IDBDatabase> | null = null;
let knownStores: Set<string> | null = null;

function isIndexedDbAvailable(): boolean {
    try {
        return typeof indexedDB !== "undefined";
    } catch {
        return false;
    }
}

async function probeExistingVersion(): Promise<number> {
    // Prefer indexedDB.databases() when available — it returns the existing
    // version directly without opening anything. Chromium/Electron 80+ have it.
    const dbs = (indexedDB as unknown as { databases?: () => Promise<IDBDatabaseInfo[]> })
        .databases;
    if (typeof dbs === "function") {
        try {
            const list = await dbs.call(indexedDB);
            const found = list.find(d => d.name === DB_NAME);
            return found?.version ?? 0;
        } catch {
            // fall through to open-probe
        }
    }
    // Fallback probe: open without specifying a version (matches current),
    // read .version, immediately close. Returns 0 for a brand-new DB.
    return new Promise<number>(resolve => {
        let probe: IDBOpenDBRequest;
        try {
            probe = indexedDB.open(DB_NAME);
        } catch {
            resolve(0);
            return;
        }
        let createdFresh = false;
        probe.onupgradeneeded = (): void => {
            // Fired only when the DB didn't exist — we're creating it now.
            createdFresh = true;
        };
        probe.onsuccess = (): void => {
            const v = probe.result.version;
            probe.result.close();
            resolve(createdFresh ? 0 : v);
        };
        probe.onerror = (): void => resolve(0);
        probe.onblocked = (): void => resolve(0);
    });
}

function openDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = (async (): Promise<IDBDatabase> => {
        if (!isIndexedDbAvailable()) {
            throw new Error("IndexedDB unavailable");
        }
        // Determine the existing on-disk version FIRST so we never request a
        // lower one. Hardcoding ``DB_VERSION = 1`` and re-opening at 1 raises
        // ``VersionError: requested version (1) is less than existing (2)`` on
        // users whose DB was already bumped to >=2 by ``ensureStore``. The
        // rejection was cached in ``dbPromise`` and poisoned every subsequent
        // call — silently breaking every plugin cache.
        const existing = await probeExistingVersion();
        const targetVersion = Math.max(existing, DB_VERSION);
        return new Promise<IDBDatabase>((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, targetVersion);
            req.onupgradeneeded = (): void => {
                // Stores are created lazily in ``ensureStore``; no schema
                // work is needed when we're simply opening at the existing
                // version (or initialising at v1 for a brand-new DB).
            };
            req.onsuccess = (): void => {
                knownStores = new Set(Array.from(req.result.objectStoreNames));
                resolve(req.result);
            };
            req.onerror = (): void => reject(req.error ?? new Error("IDB open failed"));
            req.onblocked = (): void => reject(new Error("IDB open blocked"));
        });
    })();
    // If the initial open fails for any reason, clear the cached promise so
    // the next caller retries from scratch instead of inheriting the failure
    // for the rest of the session. We also fall back to an in-memory store
    // at the public API layer below, so callers keep working either way.
    dbPromise.catch(() => {
        dbPromise = null;
    });
    return dbPromise;
}

async function ensureStore(storeName: string): Promise<IDBDatabase> {
    const db = await openDb();
    if (db.objectStoreNames.contains(storeName)) return db;

    // Need to bump version to add a new object store.
    db.close();
    dbPromise = null;
    return new Promise<IDBDatabase>((resolve, reject) => {
        const next = db.version + 1;
        const req = indexedDB.open(DB_NAME, next);
        req.onupgradeneeded = (): void => {
            const upgraded = req.result;
            if (!upgraded.objectStoreNames.contains(storeName)) {
                upgraded.createObjectStore(storeName);
            }
        };
        req.onsuccess = (): void => {
            knownStores?.add(storeName);
            dbPromise = Promise.resolve(req.result);
            resolve(req.result);
        };
        req.onerror = (): void => reject(req.error ?? new Error("IDB upgrade failed"));
        req.onblocked = (): void => reject(new Error("IDB upgrade blocked"));
    });
}

async function run<T>(
    storeName: string,
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
    const db = await ensureStore(storeName);
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    if (result instanceof Promise) return result;
    return new Promise<T>((resolve, reject) => {
        result.onsuccess = (): void => resolve(result.result);
        result.onerror = (): void => reject(result.error ?? new Error("IDB op failed"));
    });
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface PluginDataStore {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    keys(): Promise<string[]>;
    clear(): Promise<void>;
}

const fallback = new Map<string, Map<string, unknown>>();

function fallbackStore(storeName: string): PluginDataStore {
    if (!fallback.has(storeName)) fallback.set(storeName, new Map());
    const bucket = fallback.get(storeName)!;
    return {
        async get<T>(key: string): Promise<T | undefined> {
            return bucket.get(key) as T | undefined;
        },
        async set<T>(key: string, value: T): Promise<void> {
            bucket.set(key, value);
        },
        async delete(key: string): Promise<void> {
            bucket.delete(key);
        },
        async keys(): Promise<string[]> {
            return Array.from(bucket.keys());
        },
        async clear(): Promise<void> {
            bucket.clear();
        },
    };
}

/**
 * Return a namespaced async key-value store for the given plugin id.
 * Safe to call multiple times — returns equivalent stores backed by the
 * same IndexedDB object store.
 */
export function createPluginStore(pluginId: string): PluginDataStore {
    const storeName = `${STORE_PREFIX}${pluginId}`;
    if (!isIndexedDbAvailable()) {
        rootLogger.warn(`IndexedDB unavailable; ${pluginId} datastore is in-memory only`);
        return fallbackStore(storeName);
    }
    return {
        async get<T>(key: string): Promise<T | undefined> {
            try {
                return await run<T | undefined>(storeName, "readonly", store => store.get(key) as IDBRequest<T | undefined>);
            } catch (err) {
                rootLogger.warn(`datastore.get(${storeName}/${key}) failed`, err);
                return undefined;
            }
        },
        async set<T>(key: string, value: T): Promise<void> {
            try {
                await run<IDBValidKey>(storeName, "readwrite", store => store.put(value, key));
            } catch (err) {
                rootLogger.warn(`datastore.set(${storeName}/${key}) failed`, err);
            }
        },
        async delete(key: string): Promise<void> {
            try {
                await run<undefined>(storeName, "readwrite", store => store.delete(key) as IDBRequest<undefined>);
            } catch (err) {
                rootLogger.warn(`datastore.delete(${storeName}/${key}) failed`, err);
            }
        },
        async keys(): Promise<string[]> {
            try {
                const keys = await run<IDBValidKey[]>(storeName, "readonly", store => store.getAllKeys());
                return keys.map(k => String(k));
            } catch (err) {
                rootLogger.warn(`datastore.keys(${storeName}) failed`, err);
                return [];
            }
        },
        async clear(): Promise<void> {
            try {
                await run<undefined>(storeName, "readwrite", store => store.clear() as IDBRequest<undefined>);
            } catch (err) {
                rootLogger.warn(`datastore.clear(${storeName}) failed`, err);
            }
        },
    };
}
