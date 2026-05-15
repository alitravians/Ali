/*
 * BOON — Typed lazy accessors for Discord stores
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Thin wrappers around `findStore(...)` that return strongly-typed handles
 * for the stores BOON currently consumes. Each accessor returns `null` if
 * the store can't be located, leaving the call-site to decide whether that's
 * a fatal error or a soft fail.
 *
 * Add new accessors here as more plugins start consuming webpack-backed data.
 * Keep the file small — each entry should be a couple of lines plus a stable
 * Discord store name.
 */

import { findStore } from "./modules.js";
import type { TypingStore } from "./types.js";

/**
 * Discord's `TypingStore` tracks which users are currently typing in each
 * channel. The map is updated by the `TYPING_START` and `TYPING_STOP`
 * actions, so plugins typically subscribe to those AND read the store on
 * each tick rather than maintaining their own mirror.
 */
export function getTypingStore(): TypingStore | null {
    const store = findStore("TypingStore");
    if (!isTypingStore(store)) return null;
    return store;
}

function isTypingStore(value: unknown): value is TypingStore {
    if (!value || typeof value !== "object") return false;
    const o = value as Record<string, unknown>;
    return typeof o.getTypingUsers === "function"
        && typeof o.addChangeListener === "function"
        && typeof o.removeChangeListener === "function";
}
