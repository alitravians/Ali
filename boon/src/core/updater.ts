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

export async function fetchReleases(limit: number = 10): Promise<Release[]> {
    try {
        const res = await fetch(`${REPO_API}?per_page=${Math.min(limit, 30)}`, {
            headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) {
            rootLogger.warn(`updater: GitHub ${res.status}`);
            return [];
        }
        const json = (await res.json()) as RawRelease[];
        return json.map(toRelease);
    } catch (err) {
        rootLogger.warn("updater: failed to fetch", err);
        return [];
    }
}

export async function fetchLatest(): Promise<Release | null> {
    const releases = await fetchReleases(1);
    return releases[0] ?? null;
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
