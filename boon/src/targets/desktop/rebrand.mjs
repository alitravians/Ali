#!/usr/bin/env node
/*
 * BOON Desktop rebrand script
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Applies BOON branding to a Vencord source checkout. Only modifies user-facing
 * strings (window titles, sidebar labels, settings page headings). Does NOT
 * touch code logic, copyright headers, or attribution text — that's important
 * for GPL-3 compliance.
 *
 * Usage:
 *   node rebrand.mjs /path/to/vencord
 */

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const REPLACEMENTS = [
    // Sidebar section header — appears as "Vencord Settings" in user settings
    [/Vencord Settings/g, "BOON Settings"],
    // Top-level menu item label
    [/(["'>])Vencord(["'<])/g, "$1BOON$2"],
    // Common badge / window title strings
    [/Vencord Plugin Settings/g, "BOON Plugin Settings"],
    // Plugin grid empty-state copy
    [/No Vencord plugins found/g, "No BOON plugins found"],
    // Toast / notification copy
    [/Loaded Vencord/g, "Loaded BOON"],
    [/Welcome to Vencord/g, "Welcome to BOON"],
];

const SKIP_DIRS = new Set([
    "node_modules", ".git", "dist", "browser", "scripts",
]);

const FILE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".md"]);

/** Skip the LICENSE file, copyright headers, and attribution notices entirely. */
function shouldSkipPath(path) {
    const lower = path.toLowerCase();
    return (
        lower.endsWith("license") ||
        lower.endsWith("license.md") ||
        lower.endsWith("notice") ||
        lower.endsWith("changelog.md")
    );
}

async function walk(dir, out = []) {
    const entries = await readdir(dir);
    for (const entry of entries) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        const st = await stat(full);
        if (st.isDirectory()) await walk(full, out);
        else if (FILE_EXTS.has(extname(entry))) out.push(full);
    }
    return out;
}

function rewrite(content) {
    let next = content;
    let changed = false;
    for (const [re, replacement] of REPLACEMENTS) {
        const before = next;
        next = next.replace(re, replacement);
        if (before !== next) changed = true;
    }
    return changed ? next : null;
}

async function main() {
    const target = process.argv[2];
    if (!target) {
        console.error("usage: node rebrand.mjs <path-to-vencord-checkout>");
        process.exit(1);
    }
    const files = await walk(target);
    let touched = 0;
    for (const file of files) {
        if (shouldSkipPath(file)) continue;
        const content = await readFile(file, "utf8");
        // Never touch the copyright header at the top of a source file
        const headerEnd = content.indexOf("*/");
        const header = headerEnd >= 0 ? content.slice(0, headerEnd + 2) : "";
        const body = headerEnd >= 0 ? content.slice(headerEnd + 2) : content;
        const rewritten = rewrite(body);
        if (rewritten !== null) {
            await writeFile(file, header + rewritten, "utf8");
            touched++;
        }
    }
    console.log(`BOON rebrand applied — ${touched} files updated under ${target}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
