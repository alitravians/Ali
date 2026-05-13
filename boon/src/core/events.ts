/*
 * BOON — Discord Client Modification Framework
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tiny typed event bus used between the framework and plugins.
 */

import type { BoonEventMap } from "./types.js";

type Handler<E extends keyof BoonEventMap> = (payload: BoonEventMap[E]) => void;

const listeners = new Map<keyof BoonEventMap, Set<Handler<keyof BoonEventMap>>>();

export function on<E extends keyof BoonEventMap>(event: E, handler: Handler<E>): () => void {
    let set = listeners.get(event);
    if (!set) {
        set = new Set();
        listeners.set(event, set);
    }
    set.add(handler as Handler<keyof BoonEventMap>);
    return () => set!.delete(handler as Handler<keyof BoonEventMap>);
}

export function emit<E extends keyof BoonEventMap>(event: E, payload: BoonEventMap[E]): void {
    const set = listeners.get(event);
    if (!set) return;
    for (const handler of set) {
        try {
            (handler as Handler<E>)(payload);
        } catch (err) {
            console.error("[alitravians] event handler threw for", event, err);
        }
    }
}

export function clearAll(): void {
    listeners.clear();
}
