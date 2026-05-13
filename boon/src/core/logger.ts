/*
 * alitravians — namespaced logger
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Every plugin gets a namespaced logger. Calls log to the browser console
 * with a coloured `[alitravians] <namespace>` prefix AND push to the
 * in-memory Activity log so the Activity tab in the Settings UI can render
 * lifecycle events without subscribing to every console event.
 *
 * NOTE: We keep the literal `[BOON]` string in a comment so that any
 * patcher.js still running the legacy `looksLikeRenderer` check (which
 * scans bundled renderer.js for `[BOON]`) accepts new builds. Don't
 * remove this marker without also bumping installer + patcher together:
 * [BOON]
 */

import { append as appendActivity } from "./activity.js";
import type { BoonLogger } from "./types.js";

const PREFIX = "%c[alitravians]";
const BASE_STYLE = "color:#0a1f10;background:#00ff88;padding:2px 6px;border-radius:3px;font-weight:700";
const NS_STYLE = "color:#00ff88;font-weight:600";

function format(args: unknown[]): string {
    return args
        .map(arg => {
            if (typeof arg === "string") return arg;
            if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
            try {
                return JSON.stringify(arg);
            } catch {
                return String(arg);
            }
        })
        .join(" ");
}

export function createLogger(namespace: string): BoonLogger {
    const label = `${PREFIX} %c${namespace}`;
    return {
        info: (...args) => {
            console.log(label, BASE_STYLE, NS_STYLE, ...args);
            appendActivity(namespace, "info", format(args));
        },
        warn: (...args) => {
            console.warn(label, BASE_STYLE, NS_STYLE, ...args);
            appendActivity(namespace, "warn", format(args));
        },
        error: (...args) => {
            console.error(label, BASE_STYLE, NS_STYLE, ...args);
            appendActivity(namespace, "error", format(args));
        },
        debug: (...args) => {
            if (!isDebugEnabled()) return;
            console.debug(label, BASE_STYLE, NS_STYLE, ...args);
            appendActivity(namespace, "debug", format(args));
        },
    };
}

function isDebugEnabled(): boolean {
    try {
        return localStorage.getItem("alitravians_DEBUG") === "1"
            || localStorage.getItem("BOON_DEBUG") === "1";
    } catch {
        return false;
    }
}

export const rootLogger = createLogger("core");
