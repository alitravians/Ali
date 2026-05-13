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

const REPO_API = "https://api.github.com/repos/alitravians/Ali/releases";

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
        sections: parseChangelog(raw.body ?? ""),
    };
}

export type FetchErrorKind = "rate-limited" | "network" | "http" | "none";

export interface FetchResult {
    releases: Release[];
    error: FetchErrorKind;
    httpStatus?: number;
}

export const RELEASES_URL = "https://github.com/alitravians/Ali/releases";

/**
 * Fetch BOON's GitHub releases. Returns a structured result so the UI can
 * distinguish "no releases yet" from "GitHub rate-limited us" from "user is
 * offline" — every failure mode gets a clear message and a manual fallback
 * link to the releases page on github.com.
 */
export async function fetchReleasesResult(limit: number = 10): Promise<FetchResult> {
    try {
        const res = await fetch(`${REPO_API}?per_page=${Math.min(limit, 30)}`, {
            headers: { Accept: "application/vnd.github+json" },
            cache: "no-cache",
        });
        if (!res.ok) {
            rootLogger.warn(`updater: GitHub ${res.status}`);
            const kind: FetchErrorKind =
                res.status === 403 || res.status === 429 ? "rate-limited" : "http";
            return { releases: [], error: kind, httpStatus: res.status };
        }
        const json = (await res.json()) as RawRelease[];
        return { releases: json.map(toRelease), error: "none" };
    } catch (err) {
        rootLogger.warn("updater: failed to fetch", err);
        return { releases: [], error: "network" };
    }
}

export async function fetchReleases(limit: number = 10): Promise<Release[]> {
    const r = await fetchReleasesResult(limit);
    return r.releases;
}

export async function fetchLatest(): Promise<Release | null> {
    const releases = await fetchReleases(1);
    return releases[0] ?? null;
}

/**
 * Fetch the `renderer.js` asset from a release. Returns the JS source as a
 * string. Throws on network / HTTP / mismatch errors so the caller can show
 * a clear message.
 */
export async function downloadRendererForTag(tag: string): Promise<string> {
    // Release-asset URLs follow a stable pattern that does not consume
    // GitHub API rate-limit budget (raw asset endpoint).
    const url = `https://github.com/alitravians/Ali/releases/download/${encodeURIComponent(tag)}/renderer.js`;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
        throw new Error(`http-${res.status}`);
    }
    const text = await res.text();
    // Sanity check matches the patcher's: must look like a BOON renderer.
    if (text.length < 10000 || !text.includes("[BOON]") || !text.includes("VERSION")) {
        throw new Error("invalid-renderer-payload");
    }
    return text;
}

/**
 * Drive the in-app updater: download renderer.js for the latest release,
 * stage it via the patcher's IPC, and (optionally) relaunch Discord.
 *
 * Returns the version that was staged. Callers should show a "restart"
 * affordance on success.
 */
export async function stageUpdate(tag: string): Promise<{ version: string | null }> {
    const boot = (globalThis as { __BOON__?: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).__BOON__;
    if (!boot || typeof boot.invoke !== "function") {
        throw new Error("ipc-unavailable");
    }
    const code = await downloadRendererForTag(tag);
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

export async function relaunchDiscord(): Promise<void> {
    const boot = (globalThis as { __BOON__?: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).__BOON__;
    if (!boot || typeof boot.invoke !== "function") {
        throw new Error("ipc-unavailable");
    }
    await boot.invoke("BOON_RELAUNCH");
}

/** Compare two semver-like tags ("v0.1.0", "0.1.0"). Returns -1/0/1. */
export function compareVersions(a: string, b: string): number {
    const norm = (s: string): number[] =>
        s.replace(/^v/, "").split(".").map(p => Number.parseInt(p, 10) || 0);
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

export function isNewer(latest: string, current: string): boolean {
    return compareVersions(latest, current) > 0;
}
