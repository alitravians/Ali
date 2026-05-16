/*
 * BOON — update checker
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * BOON has no server. Updates are distributed via GitHub Releases on the
 * source repository (alitravians/Ali). This module exposes a small API
 * the UI uses to:
 *
 *   - Compare the running version against the latest release tag
 *   - Fetch the latest release's body (markdown) for the changelog view
 *   - Parse the changelog into structured sections
 *
 * The release body is expected to follow this convention:
 *
 *   ## 📦 إضافات جديدة
 *   - PluginName — short description
 *
 *   ## 🐛 إصلاحات
 *   - **PluginName**: what was fixed
 *
 *   ## ✨ تحسينات
 *   - free-form improvement
 *
 * Unknown sections are passed through under "other".
 */

import { rootLogger } from "./logger.js";
import { curatedFor, sanitizeRawItem } from "./curatedChangelog.js";

const REPO_API = "https://api.github.com/repos/alitravians/Ali/releases";

// Unauthenticated requests to api.github.com share a 60-req/hour budget keyed
// to the client IP. The in-app updater polls the API on every "check for
// updates" click and on every renderer boot, so a user who tests several
// releases in a row exhausts the quota and starts seeing HTTP 403 with no way
// to recover for the rest of the hour. The Atom feed below is served from
// github.com (not the API) and is governed by a separate, much higher budget.
// We use it as a fallback the moment the API rate-limits us so the updater
// keeps working through the rate window.
const REPO_ATOM = "https://github.com/alitravians/Ali/releases.atom";

// Discord's renderer CSP only whitelists discord.com for connect-src, so
// `fetch("https://api.github.com/...")` is blocked outright in the desktop
// target. The patcher exposes a `BOON_FETCH` IPC handler that runs the
// request in main and returns the body. When the bridge is present (i.e.
// running inside patched Discord) we route every GitHub call through it;
// otherwise we fall back to direct fetch (userscript / extension targets
// don't have IPC but also aren't subject to Discord's CSP).
interface BoonBootInvoke {
    invoke<T = unknown>(channel: string, payload?: unknown): Promise<T>;
    readonly ipc: boolean;
}

interface IpcFetchResult {
    ok: boolean;
    status: number;
    body?: string;
    error?: string;
    headers?: { [k: string]: string | null };
}

interface FetchResponse {
    ok: boolean;
    status: number;
    body: string;
    error?: string;
}

function boonBoot(): BoonBootInvoke | null {
    const b = (globalThis as { __BOON__?: BoonBootInvoke }).__BOON__;
    if (!b || typeof b.invoke !== "function" || !b.ipc) return null;
    return b;
}

async function fetchViaBridge(url: string, accept?: string): Promise<FetchResponse> {
    const boot = boonBoot();
    if (boot) {
        // Wrap the bridge call: any rejection (ipc-timeout, no-handler,
        // CSP error, etc.) becomes a structured failure response so callers
        // never see an uncaught promise rejection and the UI never gets
        // stuck in the loading state.
        try {
            const res = await boot.invoke<IpcFetchResult>("BOON_FETCH", { url, accept });
            return {
                ok: !!res?.ok,
                status: res?.status ?? 0,
                body: res?.body ?? "",
                error: res?.error,
            };
        } catch (err) {
            return {
                ok: false,
                status: 0,
                body: "",
                error: err instanceof Error ? err.message : String(err),
            };
        }
    }
    // Userscript / extension / dev environments: direct fetch is fine.
    try {
        const r = await fetch(url, {
            headers: { Accept: accept ?? "application/vnd.github+json" },
            cache: "no-cache",
        });
        const text = await r.text();
        return { ok: r.ok, status: r.status, body: text };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            body: "",
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

export interface RawRelease {
    tag_name: string;
    name: string | null;
    body: string | null;
    published_at: string;
    html_url: string;
}

export type ChangelogSectionKind = "added" | "fixed" | "improved" | "other";

export interface ChangelogSection {
    kind: ChangelogSectionKind;
    title: string;
    items: string[];
}

export interface Release {
    tag: string;
    name: string;
    publishedAt: string;
    htmlUrl: string;
    sections: ChangelogSection[];
}

const SECTION_KIND_BY_KEYWORD: ReadonlyArray<[RegExp, ChangelogSectionKind]> = [
    [/إضاف|added|new/i, "added"],
    [/إصلاح|fix/i, "fixed"],
    [/تحسين|improve/i, "improved"],
];

function classify(title: string): ChangelogSectionKind {
    for (const [pattern, kind] of SECTION_KIND_BY_KEYWORD) {
        if (pattern.test(title)) return kind;
    }
    return "other";
}

export function parseChangelog(markdown: string): ChangelogSection[] {
    if (!markdown.trim()) return [];
    const sections: ChangelogSection[] = [];
    let current: ChangelogSection | null = null;
    for (const rawLine of markdown.split(/\r?\n/)) {
        const line = rawLine.trimEnd();
        const headerMatch = /^##+\s+(.*)$/.exec(line);
        if (headerMatch) {
            current = {
                kind: classify(headerMatch[1]),
                title: headerMatch[1].trim(),
                items: [],
            };
            sections.push(current);
            continue;
        }
        const itemMatch = /^\s*[-*]\s+(.*)$/.exec(line);
        if (itemMatch && current) {
            current.items.push(itemMatch[1].trim());
        }
    }
    return sections.filter(s => s.items.length > 0);
}

function toRelease(raw: RawRelease): Release {
    return {
        tag: raw.tag_name,
        name: raw.name ?? raw.tag_name,
        publishedAt: raw.published_at,
        htmlUrl: raw.html_url,
        sections: changelogForRelease(raw.tag_name, raw.body ?? ""),
    };
}

/**
 * Produce the user-facing changelog sections for a release.
 *
 * Order of preference:
 *   1. The hand-curated entry in `curatedChangelog.ts` (best Arabic copy,
 *      no commit / PR / file-name noise leaks to users).
 *   2. A sanitized parse of the raw GitHub body — `sanitizeRawItem` strips
 *      conventional-commit prefixes (`fix(scope):`), PR refs (`(#123)`),
 *      `by @user in …` suffixes, and absolute GitHub URLs.
 *   3. If sanitization leaves nothing meaningful, return an empty list so
 *      the modal renders the friendly "open GitHub for details" hint.
 */
function changelogForRelease(tag: string, body: string): ChangelogSection[] {
    const curated = curatedFor(tag);
    if (curated && curated.length > 0) {
        const byKind = new Map<ChangelogSectionKind, ChangelogSection>();
        const kindTitle: Record<ChangelogSectionKind, string> = {
            added: "إضافات",
            fixed: "إصلاحات",
            improved: "تحسينات",
            other: "ملاحظات",
        };
        for (const it of curated) {
            let section = byKind.get(it.kind);
            if (!section) {
                section = { kind: it.kind, title: kindTitle[it.kind], items: [] };
                byKind.set(it.kind, section);
            }
            section.items.push(it.text);
        }
        return [...byKind.values()];
    }

    const parsed = parseChangelog(body);
    const cleaned: ChangelogSection[] = [];
    for (const sec of parsed) {
        const items = sec.items
            .map(sanitizeRawItem)
            .filter((s): s is string => !!s);
        if (items.length > 0) {
            cleaned.push({ kind: sec.kind, title: sec.title, items });
        }
    }
    return cleaned;
}

export type FetchErrorKind = "rate-limited" | "network" | "http" | "none";

export interface FetchResult {
    releases: Release[];
    error: FetchErrorKind;
    httpStatus?: number;
}

export const RELEASES_URL = "https://github.com/alitravians/Ali/releases";

/**
 * Decode the small set of HTML entities the GitHub Atom feed uses inside
 * `<content type="html">` blocks. We deliberately keep this minimal — the
 * goal is not to reconstruct the full release body, just to leave the curated
 * changelog lookup (which keys off the tag, not the body) the cleanest input
 * we can manage without pulling in a real HTML parser.
 */
function stripHtmlEntities(s: string): string {
    return s
        .replace(/<[^>]*>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function extractTagFromHtmlUrl(url: string): string | null {
    if (!url) return null;
    const m = /\/releases\/tag\/([^/?#]+)\/?$/.exec(url);
    return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Parse a GitHub releases Atom feed into the same `Release[]` shape the JSON
 * API returns. We rely on the renderer's built-in `DOMParser` so there is no
 * new dependency — but we guard against `DOMParser` not being present (e.g.
 * the userscript target running in a worker context) by returning an empty
 * array, which keeps the outer fallback chain intact.
 */
function parseAtomFeed(xml: string): Release[] {
    if (typeof DOMParser === "undefined") return [];
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("atom XML parse error");
    }
    const entries = Array.from(doc.getElementsByTagName("entry"));
    const out: Release[] = [];
    for (const entry of entries) {
        let htmlUrl = "";
        for (const link of Array.from(entry.getElementsByTagName("link"))) {
            const rel = link.getAttribute("rel");
            const href = link.getAttribute("href");
            if ((rel === "alternate" || rel === null) && href) {
                htmlUrl = href;
                break;
            }
        }
        const tag = extractTagFromHtmlUrl(htmlUrl);
        if (!tag) continue;
        const updatedEl = entry.getElementsByTagName("updated")[0];
        const titleEl = entry.getElementsByTagName("title")[0];
        const contentEl = entry.getElementsByTagName("content")[0];
        const publishedAt = (updatedEl?.textContent ?? "").trim();
        const rawTitle = (titleEl?.textContent ?? "").trim();
        const name = rawTitle.replace(/^alitravians\s+/i, "") || tag;
        const body = stripHtmlEntities(contentEl?.textContent ?? "");
        out.push(toRelease({
            tag_name: tag,
            name,
            body,
            published_at: publishedAt,
            html_url: htmlUrl,
        }));
    }
    return out;
}

async function fetchReleasesViaAtom(): Promise<FetchResult> {
    const res = await fetchViaBridge(REPO_ATOM, "application/atom+xml");
    if (!res.ok) {
        rootLogger.warn(`updater: atom feed ${res.status || "network"} (${res.error ?? "-"})`);
        if (!res.status) return { releases: [], error: "network" };
        return { releases: [], error: "http", httpStatus: res.status };
    }
    try {
        const releases = parseAtomFeed(res.body);
        if (releases.length === 0) {
            return { releases: [], error: "http", httpStatus: res.status };
        }
        return { releases, error: "none" };
    } catch (err) {
        rootLogger.warn("updater: failed to parse atom feed", err);
        return { releases: [], error: "http", httpStatus: res.status };
    }
}

/**
 * Fetch BOON's GitHub releases. Returns a structured result so the UI can
 * distinguish "no releases yet" from "GitHub rate-limited us" from "user is
 * offline" — every failure mode gets a clear message and a manual fallback
 * link to the releases page on github.com.
 *
 * When the JSON API rate-limits us (HTTP 403/429), we transparently retry
 * against `releases.atom`, which is served from github.com and not subject
 * to the 60-req/hour unauthenticated API budget. The user only sees a
 * rate-limit message when *both* paths fail.
 */
export async function fetchReleasesResult(limit: number = 10): Promise<FetchResult> {
    const res = await fetchViaBridge(
        `${REPO_API}?per_page=${Math.min(limit, 30)}`,
        "application/vnd.github+json",
    );
    if (!res.ok) {
        rootLogger.warn(`updater: GitHub ${res.status || "network"} (${res.error ?? "-"})`);
        if (res.status === 403 || res.status === 429) {
            const atom = await fetchReleasesViaAtom();
            if (atom.releases.length > 0) return atom;
            return { releases: [], error: "rate-limited", httpStatus: res.status };
        }
        if (!res.status) {
            // Network / timeout / IPC error — no HTTP response at all.
            return { releases: [], error: "network" };
        }
        return { releases: [], error: "http", httpStatus: res.status };
    }
    try {
        const json = JSON.parse(res.body) as RawRelease[];
        return { releases: json.map(toRelease), error: "none" };
    } catch (err) {
        rootLogger.warn("updater: failed to parse releases JSON", err);
        return { releases: [], error: "http", httpStatus: res.status };
    }
}

export async function fetchReleases(limit: number = 10): Promise<Release[]> {
    const r = await fetchReleasesResult(limit);
    return r.releases;
}

export async function fetchLatest(): Promise<Release | null> {
    // We deliberately fetch up to 10 releases (not just ``per_page=1``)
    // because GitHub's ``/releases`` endpoint does not reliably return the
    // semver-highest release first — see ``pickLatest`` for the full
    // explanation. Fetching only 1 and trusting it would re-introduce the
    // exact bug PR #186 fixes. We then run ``pickLatest`` over the page so
    // any future caller of this helper gets the correct latest release.
    const releases = await fetchReleases(10);
    return pickLatest(releases);
}

/**
 * Fetch the `renderer.js` asset from a release. Returns the JS source as a
 * string. Throws on network / HTTP / mismatch errors so the caller can show
 * a clear message.
 */
export async function downloadRendererForTag(tag: string): Promise<string> {
    // Release-asset URLs follow a stable pattern that does not consume
    // GitHub API rate-limit budget (raw asset endpoint). github.com 302s
    // through to objects.githubusercontent.com — patcher.ipcFetch follows
    // those redirects automatically.
    const url = `https://github.com/alitravians/Ali/releases/download/${encodeURIComponent(tag)}/renderer.js`;
    const res = await fetchViaBridge(url, "application/octet-stream, */*;q=0.8");
    if (!res.ok) {
        throw new Error(res.status ? `http-${res.status}` : (res.error || "network"));
    }
    const text = res.body;
    // Sanity check matches the patcher's: must look like an alitravians
    // renderer. Accept the legacy `[BOON]` marker too so we can still stage
    // older builds for users mid-migration.
    const hasMarker = text.includes("[alitravians]") || text.includes("[BOON]");
    if (text.length < 10000 || !hasMarker || !text.includes("VERSION")) {
        throw new Error("invalid-renderer-payload");
    }
    return text;
}

/**
 * Try to download `patcher.js` for the given release tag.
 *
 * Patcher self-update was added in v0.2.1: every release ships an updated
 * patcher.js as a release asset, and the in-app updater stages it next to
 * renderer.js so the next Discord boot promotes both atomically. Pre-v0.2.1
 * releases did not publish a patcher asset; in that case we just return null
 * and the caller skips patcher staging.
 */
async function downloadPatcherForTag(tag: string): Promise<string | null> {
    const url = `https://github.com/alitravians/Ali/releases/download/${encodeURIComponent(tag)}/patcher.js`;
    const res = await fetchViaBridge(url, "application/octet-stream, */*;q=0.8");
    if (!res.ok) return null;
    const text = res.body;
    // Same sanity checks the patcher applies in `looksLikePatcher`.
    if (text.length < 5000) return null;
    if (!text.includes("[alitravians] patcher loading")) return null;
    if (!/PATCHER_VERSION\s*=\s*"\d+\.\d+\.\d+"/.test(text)) return null;
    return text;
}

interface PatcherBootInfo {
    patcherVersion?: string | null;
}

/**
 * Drive the in-app updater: download renderer.js (and the patcher, if newer)
 * for the latest release, stage them via the patcher's IPC, and (optionally)
 * relaunch Discord.
 *
 * Returns the renderer version that was staged. Callers should show a
 * "restart" affordance on success — the patcher is promoted on the same
 * relaunch.
 */
export async function stageUpdate(tag: string): Promise<{ version: string | null }> {
    const boot = (globalThis as { __BOON__?: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).__BOON__;
    if (!boot || typeof boot.invoke !== "function") {
        throw new Error("ipc-unavailable");
    }
    const code = await downloadRendererForTag(tag);

    // Best-effort patcher upgrade. Done BEFORE the renderer stage because if
    // the patcher download fails we still want the renderer update to land,
    // and if the patcher stage fails (e.g. old patcher with no
    // BOON_STAGE_PATCHER handler) we silently ignore — the renderer stage
    // alone is the v0.1.x behaviour. Once v0.2.1 has rolled out everywhere
    // this path becomes self-sustaining.
    try {
        const patcherCode = await downloadPatcherForTag(tag);
        if (patcherCode) {
            // Skip staging if the running patcher already reports a version
            // ≥ the downloaded one. compareVersions handles missing values
            // by treating them as "0", which means an old patcher with no
            // `patcherVersion` field will always be considered out of date.
            const bootInfo = await boot.invoke("BOON_GET_BOOT_INFO").catch(() => null) as PatcherBootInfo | null;
            const currentPatcherVersion = bootInfo?.patcherVersion ?? "0.0.0";
            const m = /PATCHER_VERSION\s*=\s*"(\d+\.\d+\.\d+)"/.exec(patcherCode);
            const newPatcherVersion = m ? m[1] : "0.0.0";
            if (isNewer(newPatcherVersion, currentPatcherVersion)) {
                await boot.invoke("BOON_STAGE_PATCHER", { code: patcherCode }).catch(() => {});
            }
        }
    } catch {
        // Swallow — patcher upgrades are opportunistic, never block renderer.
    }

    const result = await boot.invoke("BOON_STAGE_UPDATE", { code, tag }) as {
        ok: boolean;
        version?: string | null;
        error?: string;
    };
    if (!result || !result.ok) {
        throw new Error(result?.error || "stage-failed");
    }
    return { version: result.version ?? null };
}

/**
 * Trigger an Electron `app.relaunch() + app.exit()` via the patcher.
 *
 * Defence-in-depth against the "logged-out after update" bug fixed in
 * patcher v0.2.3:
 *
 *   Older patchers (≤ v0.2.2) call `app.exit(0)` directly without flushing
 *   Discord's IndexedDB/localStorage to disk. Discord stores its auth token
 *   in IndexedDB (MultiAccountStore /_login) with async-buffered writes, so
 *   a force-exit mid-write truncates the DB and the user is logged out on
 *   the next launch.
 *
 *   The new patcher (v0.2.3+) calls `session.flushStorageData()` before
 *   exiting, which fixes the bug at the root. But the *first* update after
 *   this fix ships happens on the OLD patcher — meaning anyone still on
 *   v0.2.2 would still lose their session on that one upgrade.
 *
 *   So before invoking BOON_RELAUNCH we:
 *     1. Touch localStorage synchronously — Chromium guarantees that every
 *        `localStorage.setItem` is flushed to disk before it returns. This
 *        forces any prior pending localStorage writes to land too.
 *     2. Wait ~500 ms so Discord's pending IndexedDB transactions have time
 *        to commit (Chromium's IDB flush cadence is ~250 ms; 500 ms is two
 *        cycles plus a safety margin).
 *
 *   Once a user is on v0.2.3+ the patcher-side flush makes step 2
 *   redundant, but keeping it costs nothing and the renderer can't tell
 *   which patcher version is active without an extra round trip.
 */
export async function relaunchDiscord(): Promise<void> {
    const boot = (globalThis as { __BOON__?: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).__BOON__;
    if (!boot || typeof boot.invoke !== "function") {
        throw new Error("ipc-unavailable");
    }

    try {
        // (1) Synchronous localStorage write — forces Chromium to flush all
        //     pending LS writes to disk. The key name is namespaced so we
        //     don't collide with anything Discord writes.
        window.localStorage.setItem("__alitravians_flush_marker__", String(Date.now()));
        window.localStorage.removeItem("__alitravians_flush_marker__");
    } catch {
        // localStorage may be sealed or unavailable in odd contexts; ignore.
    }

    // (2) Give IndexedDB ~500ms to commit auth-related transactions.
    await new Promise<void>(resolve => { setTimeout(resolve, 500); });

    await boot.invoke("BOON_RELAUNCH");
}

/**
 * Compare two semver-like tags. Returns -1/0/1.
 *
 * Accepts tags in any of these shapes:
 *   - "0.2.10"
 *   - "v0.2.10"
 *   - "boon-v0.2.10"
 *   - "release-1.2.3"
 *
 * Previously the normaliser only stripped a leading "v", which meant any
 * prefix like "boon-v" was preserved into the first segment and resolved
 * to ``parseInt("boon-v0") = NaN || 0`` — accidentally still working for
 * the "boon-v" pattern but masking the real bug. We now explicitly extract
 * the *first dotted-numeric run* anywhere in the string, which makes the
 * comparator robust against future tag-naming changes.
 */
export function compareVersions(a: string, b: string): number {
    const norm = (s: string): number[] => {
        const m = /(\d+(?:\.\d+)+)/.exec(s);
        const base = m ? m[1] : s.replace(/^[^\d]*/, "");
        return base.split(".").map(p => Number.parseInt(p, 10) || 0);
    };
    const aa = norm(a);
    const bb = norm(b);
    const len = Math.max(aa.length, bb.length);
    for (let i = 0; i < len; i++) {
        const av = aa[i] ?? 0;
        const bv = bb[i] ?? 0;
        if (av < bv) return -1;
        if (av > bv) return 1;
    }
    return 0;
}

/**
 * Pick the semver-highest release from a list, irrespective of the order
 * GitHub returned them in. This exists because GitHub's
 * ``/repos/.../releases`` endpoint does NOT reliably sort by semver — it
 * uses a mix of tag-alphabetical and internal heuristics that, with
 * double-digit patch numbers (e.g. v0.2.10), can leave the highest-semver
 * release several positions deep instead of at index 0.
 *
 * Observed example (2026-05-15): with releases v0.2.10, v0.2.9, v0.2.8,
 * v0.2.7, v0.2.6 all present, GitHub returned them in the order
 * [v0.2.9, v0.2.8, v0.2.7, v0.2.6, v0.2.10, ...]. The previous code's
 * ``result.releases[0]`` picked v0.2.9 as "latest" and gated the install
 * button on it, leaving users stuck on v0.2.9 with the install button
 * never rendering even though v0.2.10 was available.
 */
export function pickLatest<T extends { tag: string }>(releases: readonly T[]): T | null {
    if (releases.length === 0) return null;
    return releases.reduce((best, cur) =>
        compareVersions(cur.tag, best.tag) > 0 ? cur : best,
    );
}

export function isNewer(latest: string, current: string): boolean {
    return compareVersions(latest, current) > 0;
}
