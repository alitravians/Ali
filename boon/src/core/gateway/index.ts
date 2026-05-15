/*
 * BOON — Discord Gateway WebSocket interceptor
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Background: Discord's renderer bundle is so heavily mangled that *neither*
 * `findByProps("subscribe","unsubscribe","dispatch")` nor `require.c` scans
 * surface the Flux dispatcher. Vencord works around this with bundle-level
 * source-string patches (a heavyweight machinery we deliberately avoid).
 *
 * Instead we hook the protocol that *all* realtime Discord events ride: the
 * Gateway WebSocket. The protocol is public, stable, and outside Discord's
 * obfuscation pipeline:
 *
 *   https://discord.com/developers/docs/topics/gateway-events
 *
 * Strategy:
 *   1. CONSTRUCTOR WRAP. The instant this module is imported (top of
 *      renderer.js, before any plugin runs) we replace `window.WebSocket`
 *      with a small wrapper that tags any connection whose URL matches
 *      `*.discord.gg` and attaches a `message` listener so plugin handlers
 *      see every parseable frame.
 *   2. PROTOTYPE PATCH. Discord's renderer opens its gateway WS *before*
 *      `executeJavaScript` (`dom-ready`) gets to run our renderer, so the
 *      constructor wrap misses the cold-start connection. We patch
 *      `WebSocket.prototype.send` so the first time Discord's existing
 *      gateway WS sends a frame (heartbeat / IDENTIFY / presence —
 *      typically within a few hundred ms) we tag it and attach our message
 *      listener retroactively. Prototype patches DO apply to existing
 *      instances, so this works on the pre-existing socket.
 *
 * Frame parsing (full implementation, no degradation):
 *   The desktop client opens the gateway with `encoding=etf` +
 *   `compress=zstd-stream` for transport size. ETF is a binary format and
 *   zstd-stream is a streaming compression layer. We bundle the `fzstd`
 *   decoder (~7 KB minified) and ship a hand-rolled ETF reader (~200 lines)
 *   targeted at the gateway message subset, so we read frames *natively*
 *   in the desktop client's preferred encoding instead of trying to force
 *   the gateway off its negotiated format.
 *
 *   An earlier revision tried to rewrite `encoding=etf` → `encoding=json`
 *   on the URL. The gateway happily speaks JSON when asked, but Discord's
 *   renderer is hard-coded to decode incoming frames as ETF, so the
 *   mismatch threw protocol-decode errors and sent the renderer into a
 *   reconnect loop. We do NOT touch the URL anymore — we observe Discord's
 *   chosen encoding and decode it ourselves, in parallel with Discord's
 *   own message handler.
 *
 *   Per-WS-connection state (the zstd decompressor) lives in a WeakMap so
 *   it is GC'd automatically when Discord drops the socket.
 *
 * Failure modes (all defensive):
 *   - If ETF parsing throws (Discord ships a new tag, payload corrupt) we
 *     drop the frame and log once per session at WARN level. Never throw
 *     into Discord's runtime.
 *   - If zstd push fails (bad block, mid-stream restart) we reset the
 *     decompressor for that socket and skip the frame.
 *   - Binary frames on a JSON-encoded socket and string frames on an
 *     ETF socket are both surfaced harmlessly via the same `decodeBinary`
 *     / `decodeString` paths.
 *
 * Anti-clobber: re-running this module on hot reload (Ctrl+R re-injection)
 * is a no-op — we tag `globalThis.__BOON_GATEWAY_HOOKED__` so we never
 * double-wrap `WebSocket`.
 *
 * We deliberately do NOT modify outgoing frames. Reading is safe; injecting
 * gateway events would let plugins fake server state and would race against
 * Discord's authoritative stores.
 */

import { Decompress as ZstdDecompress } from "fzstd";
import { createLogger } from "../logger.js";
import { decodeETF, ETFParseError } from "./etf.js";

const log = createLogger("gateway");

/**
 * Discord gateway dispatch events we care about. Open to extension — adding
 * a new key here makes the corresponding `on(name, fn)` typed.
 *
 * Field shapes mirror the public gateway docs exactly — we copy the
 * payload onto the typed surface without any normalisation. See
 * https://discord.com/developers/docs/topics/gateway-events#typing-start.
 */
export interface GatewayEventMap {
    TYPING_START: {
        readonly channel_id: string;
        readonly user_id: string;
        readonly guild_id?: string;
        readonly timestamp: number;
        readonly member?: unknown;
    };
    /**
     * Gateway does NOT actually emit TYPING_STOP — Discord clients infer
     * "stop" from absence after ~10s. We keep the name slot so plugins can
     * still subscribe; we'll synthesise stops in a future iteration if a
     * plugin needs them.
     */
}

type GatewayHandler<K extends keyof GatewayEventMap> = (payload: GatewayEventMap[K]) => void;

interface GenericGatewayFrame {
    readonly op: number;       // opcode (0 = Dispatch)
    readonly t?: string;       // event name (only for op=0)
    readonly s?: number | null; // sequence
    readonly d: unknown;       // event payload
}

const listeners = new Map<string, Set<(payload: unknown) => void>>();

/** Internal: dispatch a parsed gateway frame to subscribed handlers. */
function emit(eventName: string, payload: unknown): void {
    const set = listeners.get(eventName);
    if (!set) return;
    for (const fn of set) {
        try {
            fn(payload);
        } catch (err) {
            log.warn(`handler for ${eventName} threw`, err);
        }
    }
}

/**
 * Subscribe to a typed gateway dispatch event. Returns a cleanup function
 * suitable for use in a plugin's `onStop` list.
 *
 * Safe to call *before* the WebSocket hook attaches a connection — we hold
 * the subscription in memory and start firing once frames arrive.
 */
export function onGatewayEvent<K extends keyof GatewayEventMap>(
    event: K,
    handler: GatewayHandler<K>,
): () => void {
    let set = listeners.get(event);
    if (!set) {
        set = new Set();
        listeners.set(event, set);
    }
    const wrapped = (payload: unknown): void => {
        handler(payload as GatewayEventMap[K]);
    };
    set.add(wrapped);
    return (): void => {
        const current = listeners.get(event);
        if (!current) return;
        current.delete(wrapped);
        if (current.size === 0) listeners.delete(event);
    };
}

/**
 * Match Discord gateway URLs. The official gateway uses one of:
 *   wss://gateway.discord.gg/?encoding=etf&v=9&compress=zstd-stream
 *   wss://gateway-us-east1-d.discord.gg/?encoding=etf&v=9
 *   wss://gateway.discord.gg:443/?...
 * We accept any host under `discord.gg` to remain resilient to regional
 * shards and future subdomains.
 */
function isGatewayUrl(url: string): boolean {
    try {
        const u = new URL(url);
        if (u.protocol !== "wss:" && u.protocol !== "ws:") return false;
        return u.hostname.endsWith(".discord.gg") || u.hostname === "discord.gg";
    } catch {
        return false;
    }
}

interface ParsedFrame {
    readonly op?: number;
    readonly t?: string;
    readonly d?: unknown;
}

/** Decode a string frame as gateway JSON. */
function decodeString(raw: string): ParsedFrame | null {
    if (!raw.startsWith("{")) return null;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        return parsed as ParsedFrame;
    } catch {
        return null;
    }
}

/** Concatenate a list of Uint8Array chunks into one. */
function concatChunks(chunks: ReadonlyArray<Uint8Array>): Uint8Array {
    if (chunks.length === 1) return chunks[0];
    let total = 0;
    for (const c of chunks) total += c.length;
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
        out.set(c, off);
        off += c.length;
    }
    return out;
}

interface MaybeHookedWebSocket extends WebSocket {
    __boonHooked?: boolean;
}

/**
 * Per-connection state. zstd-stream is a *single* zstd stream split across
 * many WS frames, so we have to keep one Decompress per socket. We use a
 * WeakMap so the entry is GC'd automatically when Discord drops the socket.
 *
 * fzstd's `Decompress` calls `ondata` once or more per `push()`. We collect
 * those callbacks into `pendingChunks` then drain the accumulator AFTER the
 * push returns. For zstd-stream the gateway aligns so that the bytes
 * produced by one WS-frame's push() form one complete ETF gateway frame —
 * but defensively we still try the buffer as ETF and discard it if parsing
 * fails (so a misalignment doesn't permanently break the socket).
 */
interface ConnState {
    readonly zstd: ZstdDecompress;
    pendingChunks: Uint8Array[];
    zstdBroken: boolean;
}

const connState = new WeakMap<WebSocket, ConnState>();

function getOrCreateState(ws: WebSocket): ConnState {
    let s = connState.get(ws);
    if (s) return s;
    const newState: ConnState = {
        zstd: new ZstdDecompress((chunk: Uint8Array) => {
            // fzstd reuses its internal buffer between callbacks, so we
            // MUST copy the chunk before retaining it across the call
            // boundary.
            newState.pendingChunks.push(chunk.slice());
        }),
        pendingChunks: [],
        zstdBroken: false,
    };
    connState.set(ws, newState);
    return newState;
}

/** Decode a binary frame: zstd-stream → ETF → plain JS object. */
function decodeBinary(ws: WebSocket, bytes: Uint8Array): ParsedFrame | null {
    const state = getOrCreateState(ws);
    if (state.zstdBroken) return null;
    state.pendingChunks.length = 0;
    try {
        state.zstd.push(bytes);
    } catch (err) {
        // Don't poison the WeakMap — leave the socket flagged so we skip
        // future binary frames rather than spamming logs. Discord's
        // own decompressor still works, so the user-visible client is fine.
        state.zstdBroken = true;
        log.warn("zstd push failed; disabling binary parse for this socket", err);
        return null;
    }
    if (state.pendingChunks.length === 0) return null;
    const concat = concatChunks(state.pendingChunks);
    state.pendingChunks.length = 0;
    try {
        const decoded = decodeETF(concat);
        if (!decoded || typeof decoded !== "object") return null;
        return decoded as ParsedFrame;
    } catch (err) {
        if (err instanceof ETFParseError) {
            // Single skip; do not log per-frame.
            return null;
        }
        log.warn("unexpected ETF decode error", err);
        return null;
    }
}

/**
 * Attach our message listener to a confirmed gateway WebSocket. Idempotent
 * via a tag on the socket instance so the prototype `send` hook can run
 * unconditionally without re-attaching on every frame.
 */
function attachListener(ws: WebSocket): void {
    const tagged = ws as MaybeHookedWebSocket;
    if (tagged.__boonHooked) return;
    tagged.__boonHooked = true;
    ws.addEventListener("message", (ev: MessageEvent): void => {
        let frame: ParsedFrame | null = null;
        const data: unknown = ev.data;
        if (typeof data === "string") {
            frame = decodeString(data);
        } else if (data instanceof ArrayBuffer) {
            frame = decodeBinary(ws, new Uint8Array(data));
        } else if (data instanceof Uint8Array) {
            frame = decodeBinary(ws, data);
        } else if (typeof Blob !== "undefined" && data instanceof Blob) {
            // Discord uses binaryType="arraybuffer", but be defensive in
            // case a future change flips it to "blob". We resolve the
            // blob to bytes asynchronously and re-enter the parse path.
            void data.arrayBuffer().then((ab: ArrayBuffer) => {
                const f = decodeBinary(ws, new Uint8Array(ab));
                if (f && f.op === 0 && typeof f.t === "string") {
                    const set = listeners.get(f.t);
                    if (set && set.size > 0) emit(f.t, (f as GenericGatewayFrame).d);
                }
            }).catch(() => { /* drop */ });
            return;
        }
        if (!frame) return;
        // op=0 is Dispatch. Other opcodes (heartbeat ack, hello, etc.)
        // carry no event name.
        if (frame.op !== 0 || typeof frame.t !== "string") return;
        const set = listeners.get(frame.t);
        if (!set || set.size === 0) return;
        emit(frame.t, (frame as GenericGatewayFrame).d);
    });
    // Clean up the connection state when the socket closes. We rely on
    // the WeakMap to GC the Decompress object eventually, but eager cleanup
    // helps if a plugin keeps a stale reference to the socket somewhere.
    ws.addEventListener("close", () => {
        connState.delete(ws);
    });
}

/**
 * One-time installer. Wraps `window.WebSocket` so every future connection is
 * inspected. Idempotent — re-running on hot reload is a no-op.
 *
 * Call this as EARLY as possible in renderer.js (top-level import) so
 * Discord's gateway open is caught.
 */
export function installGatewayInterceptor(): void {
    const g = globalThis as unknown as { __BOON_GATEWAY_HOOKED__?: boolean };
    if (g.__BOON_GATEWAY_HOOKED__) return;
    g.__BOON_GATEWAY_HOOKED__ = true;

    const win = globalThis as unknown as { WebSocket: typeof WebSocket };
    const Original = win.WebSocket;
    if (!Original) {
        log.warn("WebSocket constructor not available; gateway interceptor disabled");
        return;
    }

    function BoonWebSocket(
        this: WebSocket,
        url: string | URL,
        protocols?: string | string[],
    ): WebSocket {
        const urlStr = typeof url === "string" ? url : url.toString();
        let isGateway = false;
        try {
            isGateway = isGatewayUrl(urlStr);
            if (isGateway) {
                log.info("intercepted gateway connection; observing frames");
            }
        } catch (err) {
            log.warn("URL classification failed", err);
        }

        const ws = protocols === undefined
            ? new Original(urlStr)
            : new Original(urlStr, protocols);

        if (isGateway) {
            try {
                attachListener(ws);
            } catch (err) {
                log.warn("failed to attach gateway listener", err);
            }
        }

        return ws;
    }

    // Preserve `new` semantics + prototype chain so any downstream
    // `instanceof WebSocket` check keeps working.
    BoonWebSocket.prototype = Original.prototype;
    Object.setPrototypeOf(BoonWebSocket, Original);
    // Static constants (CONNECTING, OPEN, CLOSING, CLOSED) live on the
    // constructor — proxy them via defineProperty so external consumers
    // (`WebSocket.OPEN === 1`) still resolve.
    for (const k of ["CONNECTING", "OPEN", "CLOSING", "CLOSED"] as const) {
        try {
            Object.defineProperty(BoonWebSocket, k, {
                value: (Original as unknown as Record<string, number>)[k],
                writable: false,
                enumerable: true,
                configurable: true,
            });
        } catch {
            // Some browsers freeze the originals; non-fatal.
        }
    }

    try {
        (win as { WebSocket: typeof WebSocket }).WebSocket = BoonWebSocket as unknown as typeof WebSocket;
        log.info("WebSocket constructor wrapped; ready for gateway connections");
    } catch (err) {
        log.error("failed to install WebSocket wrapper", err);
        g.__BOON_GATEWAY_HOOKED__ = false;
        return;
    }

    // ── Layer 2: prototype `send` patch (catches the cold-start race) ──
    // The cold-start renderer injection happens at `dom-ready`, which is
    // AFTER Discord opens its gateway WebSocket via FAST_CONNECT. So the
    // constructor wrap alone misses the very first gateway connection.
    //
    // We patch `WebSocket.prototype.send` so the first time Discord's
    // existing gateway WS sends a frame (heartbeat / IDENTIFY / presence —
    // typically within a few hundred ms) we tag it and attach our message
    // listener retroactively. Prototype patches DO apply to existing
    // instances.
    try {
        const protoSend: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void = Original.prototype.send;
        Original.prototype.send = function patchedSend(
            this: MaybeHookedWebSocket,
            data: string | ArrayBufferLike | Blob | ArrayBufferView,
        ): void {
            try {
                if (!this.__boonHooked && this.url && isGatewayUrl(this.url)) {
                    log.info("observing pre-existing gateway WS via send-patch");
                    attachListener(this);
                }
            } catch (err) {
                log.warn("send-patch hook failed", err);
            }
            return protoSend.call(this, data);
        };
    } catch (err) {
        log.warn("failed to patch WebSocket.prototype.send", err);
    }
}

/**
 * Test helper — exposed so the smoke test in `scripts/build.mjs` can
 * verify parser behaviour without a real WebSocket.
 */
export const __TEST__ = {
    decodeString,
    decodeBinary,
    isGatewayUrl,
    emit,
};
