/*
 * BOON — Erlang External Term Format (ETF) decoder
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Minimal Discord-gateway-only ETF reader. Implements the subset of
 * https://www.erlang.org/doc/apps/erts/erl_ext_dist.html that Discord's
 * gateway ever sends:
 *
 *   97  SMALL_INTEGER_EXT   (1 byte uint)
 *   98  INTEGER_EXT         (4 byte int32, big-endian)
 *   70  NEW_FLOAT_EXT       (8 byte float64, big-endian)
 *   100 ATOM_EXT            (Latin-1, len:u16) — legacy, rare today
 *   115 SMALL_ATOM_EXT      (Latin-1, len:u8)  — legacy, rare today
 *   118 ATOM_UTF8_EXT       (UTF-8,   len:u16)
 *   119 SMALL_ATOM_UTF8_EXT (UTF-8,   len:u8)
 *   109 BINARY_EXT          (len:u32 bytes — Discord uses for strings & IDs)
 *   107 STRING_EXT          (len:u16 of bytes — Erlang's "char list")
 *   106 NIL_EXT             (empty list)
 *   108 LIST_EXT            (len:u32 elements + tail)
 *   104 SMALL_TUPLE_EXT     (arity:u8 + elements)
 *   105 LARGE_TUPLE_EXT     (arity:u32 + elements)
 *   116 MAP_EXT             (pairs:u32 + key, value pairs)
 *   110 SMALL_BIG_EXT       (n:u8 + sign:u8 + n bytes, little-endian)
 *   111 LARGE_BIG_EXT       (n:u32 + sign:u8 + n bytes, little-endian)
 *
 * Anything outside this list throws an `ETFParseError`, which the gateway
 * interceptor catches and converts into a frame-skip. We never propagate
 * parser errors up into Discord's runtime.
 *
 * Atoms are coerced to JavaScript values where it makes sense:
 *   'nil' | 'null' → null
 *   'true' | 'false' → boolean
 *   anything else → string
 *
 * Integers up to 2^53−1 are returned as JS numbers. Bigger integers from
 * BIG_EXT (Discord snowflakes can hit this range) are returned as decimal
 * strings — the gateway documentation explicitly states snowflakes are
 * strings on the wire, and parsing them as numbers would lose precision.
 */

export class ETFParseError extends Error {
    constructor(msg: string, public readonly pos: number) {
        super(`ETF: ${msg} at byte ${pos}`);
        this.name = "ETFParseError";
    }
}

const VERSION = 131;
const SMALL_INTEGER = 97;
const INTEGER = 98;
const NEW_FLOAT = 70;
const ATOM = 100;
const SMALL_ATOM = 115;
const ATOM_UTF8 = 118;
const SMALL_ATOM_UTF8 = 119;
const BINARY = 109;
const STRING = 107;
const NIL = 106;
const LIST = 108;
const SMALL_TUPLE = 104;
const LARGE_TUPLE = 105;
const MAP = 116;
const SMALL_BIG = 110;
const LARGE_BIG = 111;

const textDec = new TextDecoder("utf-8", { fatal: false });
const latin1Dec = new TextDecoder("latin1");

function atomToValue(name: string): unknown {
    if (name === "nil" || name === "null") return null;
    if (name === "true") return true;
    if (name === "false") return false;
    return name;
}

class Reader {
    constructor(
        private readonly buf: Uint8Array,
        public pos = 0,
    ) {}
    private avail(n: number): void {
        if (this.pos + n > this.buf.length) {
            throw new ETFParseError(`unexpected EOF (need ${n} more bytes)`, this.pos);
        }
    }
    u8(): number {
        this.avail(1);
        return this.buf[this.pos++];
    }
    u16(): number {
        this.avail(2);
        const v = (this.buf[this.pos] << 8) | this.buf[this.pos + 1];
        this.pos += 2;
        return v >>> 0;
    }
    i32(): number {
        this.avail(4);
        const v =
            (this.buf[this.pos] << 24) |
            (this.buf[this.pos + 1] << 16) |
            (this.buf[this.pos + 2] << 8) |
            this.buf[this.pos + 3];
        this.pos += 4;
        return v;
    }
    u32(): number {
        return this.i32() >>> 0;
    }
    f64(): number {
        this.avail(8);
        const dv = new DataView(this.buf.buffer, this.buf.byteOffset + this.pos, 8);
        const v = dv.getFloat64(0, false);
        this.pos += 8;
        return v;
    }
    bytes(n: number): Uint8Array {
        this.avail(n);
        const out = this.buf.subarray(this.pos, this.pos + n);
        this.pos += n;
        return out;
    }
    utf8(n: number): string {
        return textDec.decode(this.bytes(n));
    }
    latin1(n: number): string {
        return latin1Dec.decode(this.bytes(n));
    }
}

function readTerm(r: Reader): unknown {
    const tag = r.u8();
    switch (tag) {
        case SMALL_INTEGER:
            return r.u8();
        case INTEGER:
            return r.i32();
        case NEW_FLOAT:
            return r.f64();
        case ATOM:
            return atomToValue(r.latin1(r.u16()));
        case SMALL_ATOM:
            return atomToValue(r.latin1(r.u8()));
        case ATOM_UTF8:
            return atomToValue(r.utf8(r.u16()));
        case SMALL_ATOM_UTF8:
            return atomToValue(r.utf8(r.u8()));
        case BINARY:
            return r.utf8(r.u32());
        case STRING: {
            // Erlang STRING_EXT is an optimised "list of bytes" used for
            // short ASCII strings. Discord uses it for things like guild
            // member names. We decode as UTF-8 since gateway payloads are
            // UTF-8 in every other place too.
            return r.utf8(r.u16());
        }
        case NIL:
            return [];
        case LIST: {
            const n = r.u32();
            const out: unknown[] = new Array(n);
            for (let i = 0; i < n; i++) out[i] = readTerm(r);
            // tail — for proper lists this is NIL. We discard it; Discord
            // never sends improper lists.
            readTerm(r);
            return out;
        }
        case SMALL_TUPLE: {
            const n = r.u8();
            const out: unknown[] = new Array(n);
            for (let i = 0; i < n; i++) out[i] = readTerm(r);
            return out;
        }
        case LARGE_TUPLE: {
            const n = r.u32();
            const out: unknown[] = new Array(n);
            for (let i = 0; i < n; i++) out[i] = readTerm(r);
            return out;
        }
        case MAP: {
            const pairs = r.u32();
            const obj: Record<string, unknown> = Object.create(null);
            for (let i = 0; i < pairs; i++) {
                const key = readTerm(r);
                const val = readTerm(r);
                if (typeof key === "string") {
                    obj[key] = val;
                } else {
                    obj[String(key)] = val;
                }
            }
            return obj;
        }
        case SMALL_BIG:
            return readBig(r, r.u8());
        case LARGE_BIG:
            return readBig(r, r.u32());
        default:
            throw new ETFParseError(`unknown tag ${tag}`, r.pos - 1);
    }
}

function readBig(r: Reader, n: number): string | number {
    const sign = r.u8(); // 0 = positive, 1 = negative
    const bytes = r.bytes(n);
    // Up to 6 little-endian bytes (max value 2^48 − 1 ≈ 2.8×10^14) fits cleanly
    // inside Number.MAX_SAFE_INTEGER (2^53 − 1). 7 bytes exceeds that ceiling
    // and would silently lose precision on Discord snowflakes, so we emit a
    // decimal string instead.
    if (n <= 6) {
        let v = 0;
        for (let i = n - 1; i >= 0; i--) v = v * 256 + bytes[i];
        return sign === 0 ? v : -v;
    }
    // BigInt-based decimal stringification.
    let acc = 0n;
    let mult = 1n;
    for (let i = 0; i < n; i++) {
        acc += BigInt(bytes[i]) * mult;
        mult *= 256n;
    }
    return sign === 0 ? acc.toString(10) : "-" + acc.toString(10);
}

/**
 * Decode a Discord gateway frame from ETF bytes into a plain JS value.
 *
 * Throws `ETFParseError` on malformed input. The caller (gateway
 * interceptor) MUST catch and discard the frame on error — never throw
 * into Discord's runtime.
 */
export function decodeETF(buf: Uint8Array): unknown {
    if (buf.length < 1) throw new ETFParseError("empty buffer", 0);
    const r = new Reader(buf);
    const head = r.u8();
    if (head !== VERSION) {
        throw new ETFParseError(`bad version byte ${head} (expected 131)`, 0);
    }
    return readTerm(r);
}

/** Test-only handle. */
export const __TEST__ = { Reader, readTerm, readBig };
