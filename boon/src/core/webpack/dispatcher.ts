/*
 * BOON — Flux dispatcher access + subscription helper
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Locates Discord's Flux dispatcher and exposes a typed `subscribe` helper
 * that returns its own cleanup fn — exactly the shape plugin lifecycles
 * already use.
 *
 * Discord's dispatcher is a single, app-wide instance. Locating it is a
 * one-time cost: we cache the reference after the first successful find.
 *
 * The dispatcher's signature (verified against Discord's webpack bundle):
 *   subscribe(actionType: string, callback: (action) => void): void
 *   unsubscribe(actionType: string, callback: (action) => void): void
 *   dispatch(action: { type: string, ... }): void | Promise<void>
 *
 * We deliberately do NOT call `dispatch` from BOON — only subscribe. Reading
 * Discord's actions is safe; injecting fake actions would break invariants
 * in Discord's stores.
 */

import { createLogger } from "../logger.js";
import { findByProps } from "./modules.js";
import type { FluxAction, FluxActionHandler, FluxDispatcher } from "./types.js";

const log = createLogger("webpack:dispatcher");

let cached: FluxDispatcher | null = null;

/**
 * Locate the Flux dispatcher by looking for an object that exposes the full
 * subscribe/unsubscribe/dispatch triple. Returns `null` if we haven't
 * captured enough modules yet — callers should retry after `whenWebpackReady`
 * resolves, or use `subscribeToAction` which retries internally.
 */
export function getDispatcher(): FluxDispatcher | null {
    if (cached) return cached;
    const candidate = findByProps("subscribe", "unsubscribe", "dispatch");
    if (!isDispatcher(candidate)) return null;
    cached = candidate;
    log.info("located Flux dispatcher");
    return cached;
}

function isDispatcher(value: unknown): value is FluxDispatcher {
    if (!value || typeof value !== "object") return false;
    const o = value as Record<string, unknown>;
    return typeof o.subscribe === "function"
        && typeof o.unsubscribe === "function"
        && typeof o.dispatch === "function";
}

/**
 * Subscribe to a single Flux action type and return a cleanup function that
 * unsubscribes. Designed to drop straight into a plugin's `onStop` cleanup
 * list.
 *
 * If the dispatcher can't be located yet, the subscription is queued — once
 * the dispatcher appears we attach the handler retroactively. The returned
 * cleanup fn works in both cases.
 *
 * NEVER throw — if anything goes wrong (e.g. webpack interceptor failed),
 * the cleanup fn is a no-op and we log a warning. Plugins must check
 * `isWebpackReady()` themselves if they want to refuse to start.
 */
export function subscribeToAction<A extends FluxAction = FluxAction>(
    actionType: string,
    handler: FluxActionHandler<A>,
): () => void {
    const safe = (action: FluxAction): void => {
        try {
            handler(action as A);
        } catch (err) {
            log.warn(`handler for ${actionType} threw`, err);
        }
    };

    const dispatcher = getDispatcher();
    if (dispatcher) {
        dispatcher.subscribe(actionType, safe);
        return () => {
            try {
                dispatcher.unsubscribe(actionType, safe);
            } catch (err) {
                log.warn(`unsubscribe ${actionType} failed`, err);
            }
        };
    }

    // Dispatcher not ready — defer subscription. The retry runs on the next
    // animation frame; if it still isn't ready we wait again. This gives
    // Discord up to ~5s of cold boot to ship the dispatcher module.
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 300; // ~5s at 60Hz
    let activeUnsubscribe: (() => void) | null = null;

    const retry = (): void => {
        if (cancelled) return;
        attempts++;
        const d = getDispatcher();
        if (d) {
            d.subscribe(actionType, safe);
            activeUnsubscribe = () => {
                try { d.unsubscribe(actionType, safe); } catch { /* noop */ }
            };
            return;
        }
        if (attempts >= maxAttempts) {
            log.warn(`gave up locating Flux dispatcher for ${actionType} after ${attempts} frames`);
            return;
        }
        requestAnimationFrame(retry);
    };
    requestAnimationFrame(retry);

    return () => {
        cancelled = true;
        activeUnsubscribe?.();
    };
}
