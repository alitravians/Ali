/*
 * BOON — Discord HTTP header capture
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Passively snoops on Discord's own outbound HTTP requests so plugins that
 * need to talk to the Discord REST API (e.g. autoTranslate's outgoing-send
 * fallback) can reuse the credentials Discord has already minted.
 *
 * Why not just read localStorage?
 *   Modern Discord builds wipe / proxy ``window.localStorage`` at boot to
 *   discourage self-bots. The same-origin iframe trick is also being
 *   clamped down on. Reading the token from localStorage returns ``null``
 *   on a freshly-installed Stable build, which is what broke v0.5.0/0.5.1
 *   outgoing translation for end users.
 *
 * Why not just call ``findByProps("getToken", "setToken")``?
 *   Discord's ``TokenStore`` module is registered with the webpack runtime
 *   but lazy-loaded — at the moment the user sends their first translated
 *   message, the cache typically contains ~100 modules out of ~3500
 *   registered factories, and TokenStore is not one of them. Force-loading
 *   thousands of factories at boot is expensive and triggers spurious
 *   side effects.
 *
 * Why capture from real requests?
 *   Discord's own UI hits the REST API constantly (presence, message
 *   fetches, typing pings, gateway resume, …). Every authenticated request
 *   carries the ``Authorization`` header — and the ``X-Super-Properties``,
 *   ``X-Discord-Locale``, ``X-Discord-Timezone`` headers Discord uses for
 *   client fingerprinting. By installing a thin pass-through wrapper on
 *   ``fetch`` and ``XMLHttpRequest.setRequestHeader`` we observe those
 *   headers as they fly past, with zero impact on the request itself.
 *
 * Lifetime
 *   The token is stable for the renderer's lifetime — Discord rotates it
 *   only at logout, which reloads the whole renderer. We cache the most
 *   recently observed value of each header so callers always see the
 *   freshest snapshot.
 */

import { createLogger } from "./logger.js";

const log = createLogger("headerCapture");

/**
 * Header names we care about, normalised to lowercase. Discord (and most
 * code today) ships them in different casings depending on how the request
 * was constructed, so we normalise both incoming names and the cache keys.
 */
const TRACKED_HEADERS = new Set<string>([
    "authorization",
    "x-super-properties",
    "x-discord-locale",
    "x-discord-timezone",
]);

/** Latest observed value per tracked header (lowercased key). */
const captured = new Map<string, string>();

let installed = false;

/**
 * Hostname suffixes we consider "Discord owned". Headers seen on requests
 * to any other origin are ignored, so co-installed extensions (or any
 * future BOON plugin that talks to a third-party API with its own
 * Authorization header) cannot poison the cache. Discord routes user
 * requests through ``discord.com`` and a few CDN subdomains; the
 * Authorization header only ever appears on ``discord.com`` / the gateway,
 * so a single hostname suffix is sufficient.
 */
const DISCORD_HOST_SUFFIXES = [
    "discord.com",
    "discordapp.com",
];

function isDiscordUrl(rawUrl: unknown): boolean {
    if (typeof rawUrl !== "string" || rawUrl.length === 0) return true;
    try {
        // Relative URLs (e.g. ``/api/v9/...``) resolve against the renderer
        // origin, which is itself ``discord.com`` — so a successful parse
        // with ``window.location.href`` as the base is also a Discord URL.
        const parsed = new URL(rawUrl, window.location.href);
        const host = parsed.hostname.toLowerCase();
        return DISCORD_HOST_SUFFIXES.some(s => host === s || host.endsWith("." + s));
    } catch {
        // Unparseable URL — be permissive (e.g. Electron internal schemes).
        // Better to occasionally over-capture than to miss the real token.
        return true;
    }
}

function record(name: unknown, value: unknown): void {
    if (typeof name !== "string" || typeof value !== "string") return;
    const key = name.toLowerCase();
    if (!TRACKED_HEADERS.has(key)) return;
    if (value.length === 0) return;
    const previous = captured.get(key);
    if (previous === value) return;
    captured.set(key, value);
    // Don't log the actual values — Authorization is a secret. Just log the
    // event so users debugging "no_token" know whether capture ever fired.
    log.info(`captured ${key} (len=${value.length})`);
}

function recordHeaders(headers: unknown): void {
    if (!headers) return;
    if (headers instanceof Headers) {
        // ``Headers.forEach`` order is (value, name) — historically confusing.
        headers.forEach((value, name) => record(name, value));
        return;
    }
    if (Array.isArray(headers)) {
        for (const entry of headers) {
            if (Array.isArray(entry) && entry.length === 2) {
                record(entry[0], entry[1]);
            }
        }
        return;
    }
    if (typeof headers === "object") {
        for (const [name, value] of Object.entries(headers as Record<string, unknown>)) {
            record(name, value);
        }
    }
}

function requestUrlFromInput(input: RequestInfo | URL): string | null {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;
    return null;
}

/**
 * Install passive wrappers on ``fetch`` and ``XMLHttpRequest.setRequestHeader``
 * so every authenticated Discord request feeds our cache. Idempotent.
 *
 * The wrappers are PASSIVE — they delegate to the original implementation
 * without altering the request in any way. The only observable effect is the
 * extra synchronous header read, which is negligible.
 */
export function installHeaderCapture(): void {
    if (installed) return;
    installed = true;

    // --- fetch -------------------------------------------------------------
    // We try-catch the install itself in case Discord (or another extension)
    // froze ``window.fetch``.
    try {
        const originalFetch = window.fetch.bind(window);
        window.fetch = function patchedFetch(
            input: RequestInfo | URL,
            init?: RequestInit,
        ): Promise<Response> {
            try {
                if (isDiscordUrl(requestUrlFromInput(input))) {
                    // Per the Fetch spec, when both a ``Request`` input and
                    // an ``init.headers`` are passed, ``init.headers``
                    // OVERRIDES the Request's headers. Record the Request
                    // first so a later ``init`` overwrite wins in the cache.
                    if (input instanceof Request) recordHeaders(input.headers);
                    if (init?.headers) recordHeaders(init.headers);
                }
            } catch (err) {
                log.warn("fetch header inspection threw", err);
            }
            return originalFetch(input, init);
        };
        log.info("installed fetch wrapper");
    } catch (err) {
        log.warn("could not wrap fetch", err);
    }

    // --- XMLHttpRequest ----------------------------------------------------
    // ``setRequestHeader`` doesn't know the request URL on its own, so we
    // also wrap ``open`` to stash the URL on the XHR instance. The stash
    // lives under a Symbol-keyed property to avoid colliding with any
    // application-defined ``url`` field on the XHR instance.
    try {
        const proto = XMLHttpRequest.prototype;
        const URL_KEY = Symbol("boonRequestUrl");
        const originalOpen = proto.open;
        proto.open = function patchedOpen(
            this: XMLHttpRequest & Record<symbol, string>,
            method: string,
            url: string | URL,
            ...rest: unknown[]
        ): void {
            try {
                this[URL_KEY] = typeof url === "string" ? url : url.href;
            } catch {
                // Frozen instance — skip stash, capture will skip below.
            }
            // The signature with all overloads is awkward to type; cast to
            // the original function and forward all arguments verbatim.
            return (originalOpen as (...args: unknown[]) => void).apply(
                this,
                [method, url, ...rest],
            );
        };
        const originalSetRequestHeader = proto.setRequestHeader;
        proto.setRequestHeader = function patchedSetRequestHeader(
            this: XMLHttpRequest & Record<symbol, string | undefined>,
            name: string,
            value: string,
        ): void {
            try {
                if (isDiscordUrl(this[URL_KEY])) record(name, value);
            } catch (err) {
                log.warn("XHR header inspection threw", err);
            }
            return originalSetRequestHeader.call(this, name, value);
        };
        log.info("installed XHR wrappers");
    } catch (err) {
        log.warn("could not wrap XMLHttpRequest", err);
    }
}

/**
 * Return the latest observed value for a tracked header, or ``null`` if we
 * haven't seen one yet. The lookup is case-insensitive.
 */
export function getCapturedHeader(name: string): string | null {
    const key = name.toLowerCase();
    if (!TRACKED_HEADERS.has(key)) return null;
    const value = captured.get(key);
    return value ?? null;
}

/** Number of distinct tracked headers we currently have a value for. */
export function capturedHeaderCount(): number {
    return captured.size;
}
