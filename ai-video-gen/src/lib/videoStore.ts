/**
 * Persist generated videos in IndexedDB so they survive page reloads.
 * (Blob URLs created via URL.createObjectURL are document-scoped and
 * become invalid on navigation/reload; storing the actual Blob bytes
 * is the only way to make the gallery survive a refresh.)
 *
 * The metadata (id/prompt/duration/style/createdAt) is mirrored into
 * localStorage for fast first-paint, but the blob is the source of truth.
 */

import type { Duration, GeneratedVideo } from './types';

const DB_NAME = 'ai-video-gen';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const META_KEY = 'ai-video-gen:gallery:v2';
const MAX_GALLERY = 8;

export interface VideoMeta {
  id: string;
  prompt: string;
  duration: Duration;
  style: string;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function readMetaList(): VideoMeta[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VideoMeta[];
    return parsed.filter((v) => v && v.id && v.prompt && v.duration);
  } catch {
    return [];
  }
}

function writeMetaList(list: VideoMeta[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(META_KEY, JSON.stringify(list));
  } catch {
    /* quota exceeded; ignore */
  }
}

export async function saveVideo(meta: VideoMeta, blob: Blob): Promise<VideoMeta[]> {
  // Store blob bytes
  try {
    await withStore('readwrite', (s) => s.put(blob, meta.id));
  } catch {
    /* IDB unavailable (private mode); fall through — gallery persistence
       will still mirror metadata in localStorage but blobs won't survive reload */
  }

  const current = readMetaList().filter((m) => m.id !== meta.id);
  const next = [meta, ...current].slice(0, MAX_GALLERY);
  writeMetaList(next);

  // Best-effort cleanup: remove any IDB blobs whose meta is no longer in the list.
  const keep = new Set(next.map((m) => m.id));
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => {
      for (const key of keysReq.result as IDBValidKey[]) {
        if (typeof key === 'string' && !keep.has(key)) {
          store.delete(key);
        }
      }
    };
  } catch {
    /* ignore cleanup errors */
  }

  return next;
}

export async function loadVideoBlob(id: string): Promise<Blob | null> {
  try {
    const blob = await withStore<Blob | undefined>('readonly', (s) => s.get(id));
    return blob ?? null;
  } catch {
    return null;
  }
}

/**
 * Hydrate metadata into full GeneratedVideo objects with fresh blob URLs.
 * Items whose blobs are missing in IndexedDB are dropped silently.
 */
export async function hydrateGallery(): Promise<GeneratedVideo[]> {
  const metas = readMetaList();
  const out: GeneratedVideo[] = [];
  for (const meta of metas) {
    const blob = await loadVideoBlob(meta.id);
    if (!blob) continue;
    out.push({ ...meta, url: URL.createObjectURL(blob) });
  }
  return out;
}

export async function clearGallery(): Promise<void> {
  writeMetaList([]);
  try {
    await withStore('readwrite', (s) => s.clear());
  } catch {
    /* ignore */
  }
}
