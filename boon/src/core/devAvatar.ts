/*
 * alitravians — embedded developer avatar
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inlined as a `data:image/webp` URI so the renderer never has to fetch
 * an external image host at runtime. Discord's CSP for `img-src` is
 * permissive enough that an external URL would work, but bundling keeps
 * the dev card painting instantly on the very first open and removes a
 * cross-origin failure surface.
 *
 * Source: portrait crop generated for the project (circular 144x144 WebP,
 * quality 78, ~4.6 KB). Refresh by re-running the avatar build step in
 * the PR description when the artwork changes.
 */

const DEV_AVATAR_DATA_URI =
    "data:image/webp;base64,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" +
    "A";

export { DEV_AVATAR_DATA_URI };
