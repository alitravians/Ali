/*
 * BOON — Discord Client Modification Framework
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Helper for plugins to inject and reliably remove scoped <style> tags.
 */

const PREFIX = "boon-style-";

export function injectStyle(pluginId: string, css: string, suffix = "default"): () => void {
    const id = `${PREFIX}${pluginId}-${suffix}`;
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = id;
        document.head.appendChild(el);
    }
    el.textContent = css;
    return () => el?.remove();
}
