#!/usr/bin/env node
/*
 * BOON build script — produces three distribution artifacts:
 *
 *   dist/boon.user.js               Tampermonkey/Violentmonkey userscript
 *   dist/extension/                  Chrome/Firefox MV3 unpacked extension
 *   dist/desktop/README.md           Pointer to the desktop rebrand workflow
 *
 * Bundles BOON's TypeScript with esbuild into IIFE that runs in the page context.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { build } from "esbuild";
import { mkdir, copyFile, readFile, writeFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

const COMMON_OPTIONS = {
    bundle: true,
    format: "iife",
    target: "es2022",
    legalComments: "linked",
    sourcemap: false,
    minify: false,
    logLevel: "info",
    define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
    },
};

async function buildUserscript() {
    await mkdir(DIST, { recursive: true });
    const banner = await readFile(join(SRC, "targets/userscript/banner.txt"), "utf8");
    const out = join(DIST, "boon.user.js");
    await build({
        ...COMMON_OPTIONS,
        entryPoints: [join(SRC, "targets/userscript/main.ts")],
        outfile: out,
        globalName: "__BOON_USER",
        banner: { js: banner },
    });
    console.log(`✓ userscript → ${out}`);
}

async function buildExtension() {
    const outDir = join(DIST, "extension");
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });

    // The userscript payload is loaded into the page context by content.ts
    await build({
        ...COMMON_OPTIONS,
        entryPoints: [join(SRC, "targets/userscript/main.ts")],
        outfile: join(outDir, "boon.userscript.js"),
    });
    await build({
        ...COMMON_OPTIONS,
        entryPoints: [join(SRC, "targets/extension/content.ts")],
        outfile: join(outDir, "boon.content.js"),
    });
    await build({
        ...COMMON_OPTIONS,
        entryPoints: [join(SRC, "targets/extension/background.ts")],
        outfile: join(outDir, "boon.background.js"),
    });

    await copyFile(
        join(SRC, "targets/extension/manifest.json"),
        join(outDir, "manifest.json"),
    );
    await copyFile(
        join(SRC, "targets/extension/popup.html"),
        join(outDir, "popup.html"),
    );

    // Placeholder icons — repo includes a single SVG which the docs explain
    // how to rasterize. For the extension package we ship a 1x1 transparent
    // PNG so Chrome doesn't refuse to load the unpacked extension.
    const TRANSPARENT_PNG = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=",
        "base64",
    );
    await Promise.all([
        writeFile(join(outDir, "icon-16.png"), TRANSPARENT_PNG),
        writeFile(join(outDir, "icon-48.png"), TRANSPARENT_PNG),
        writeFile(join(outDir, "icon-128.png"), TRANSPARENT_PNG),
    ]);

    console.log(`✓ extension → ${outDir}`);
}

async function buildDesktop() {
    const outDir = join(DIST, "desktop");
    await mkdir(outDir, { recursive: true });
    await copyFile(
        join(SRC, "targets/desktop/README.md"),
        join(outDir, "README.md"),
    );
    await copyFile(
        join(SRC, "targets/desktop/LICENSE-NOTICE.md"),
        join(outDir, "LICENSE-NOTICE.md"),
    );
    await copyFile(
        join(SRC, "targets/desktop/rebrand.mjs"),
        join(outDir, "rebrand.mjs"),
    );
    console.log(`✓ desktop → ${outDir}`);
}

const TARGETS = {
    userscript: buildUserscript,
    extension: buildExtension,
    desktop: buildDesktop,
};

async function main() {
    const requested = process.argv.slice(2);
    const targets = requested.length ? requested : Object.keys(TARGETS);
    for (const t of targets) {
        const fn = TARGETS[t];
        if (!fn) {
            console.error(`unknown target: ${t}`);
            process.exit(1);
        }
        await fn();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
