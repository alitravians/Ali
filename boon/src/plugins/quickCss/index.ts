/*
 * BOON Plugin: QuickCSS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's QuickCSS / Monaco editor (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord (UserCss + QuickCSS panel)
 *
 * Lightweight inline CSS editor — no Monaco. The user opens a floating panel
 * (Ctrl+Alt+C or via plugin's settings textarea) and writes CSS that is
 * applied live to Discord. Persists across reloads via the plugin's
 * dataStore (IndexedDB).
 *
 * Why not Monaco: Monaco is ~3MB minified, requires bundling the worker, and
 * needs a sandboxed iframe to run inside Discord's CSP. Real-world QuickCSS
 * usage is small snippets (theme tweaks, hide-this-element rules), so a plain
 * textarea is the right tool.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    css: {
        type: "textarea",
        label: "CSS مخصّص",
        description: "أي CSS هنا يطبّق فوراً على Discord. أمثلة: تغيير لون الخلفية، إخفاء عناصر، تخصيص الخطوط.",
        default: "",
        placeholder: "/* اكتب CSS هنا */\nbody { --background-primary: #1a1a1a; }",
    },
    showFab: {
        type: "boolean",
        label: "إظهار زر تحرير عائم",
        description: "زر صغير في الزاوية لفتح المحرّر بدون الذهاب للإعدادات.",
        default: false,
    },
    fabPosition: {
        type: "select",
        label: "موضع الزر العائم",
        default: "bottom-right",
        options: [
            { label: "أسفل يمين", value: "bottom-right" },
            { label: "أسفل يسار", value: "bottom-left" },
            { label: "أعلى يمين", value: "top-right" },
            { label: "أعلى يسار", value: "top-left" },
        ],
    },
} as const satisfies SettingsSchema;

const FAB_ID = "boon-quickcss-fab";
const PANEL_ID = "boon-quickcss-panel";
const STYLE_ID = "rules"; // ctx.injectStyle id

function fabPositionCss(pos: string): string {
    switch (pos) {
        case "bottom-left": return "bottom:16px;left:16px";
        case "top-right": return "top:60px;right:16px";
        case "top-left": return "top:60px;left:16px";
        default: return "bottom:16px;right:16px";
    }
}

export default definePlugin({
    manifest: {
        id: "quickCss",
        name: "QuickCSS",
        description: "محرّر CSS مخصّص يطبّق على Discord في الحال. لتخصيص الألوان والخطوط وإخفاء العناصر.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["تخصيص", "Vencord-inspired"],
        enabledByDefault: false,
    },
    settings: SCHEMA,
    onStart(ctx) {
        const applyCss = (): void => {
            const css = ctx.settings.css;
            ctx.injectStyle(css, STYLE_ID);
            ctx.stats.touch();
        };

        const removeFab = (): void => {
            document.getElementById(FAB_ID)?.remove();
        };

        const removePanel = (): void => {
            document.getElementById(PANEL_ID)?.remove();
        };

        const ensureFab = (): void => {
            removeFab();
            if (!ctx.settings.showFab) return;
            const fab = document.createElement("button");
            fab.id = FAB_ID;
            fab.title = "تحرير CSS مخصّص (Ctrl+Alt+C)";
            fab.textContent = "CSS";
            fab.style.cssText = [
                "position:fixed", fabPositionCss(ctx.settings.fabPosition), "z-index:9000",
                "width:48px", "height:48px", "border-radius:50%",
                "background:var(--brand-experiment,#5865f2)", "color:#fff",
                "border:0", "cursor:pointer",
                "font-size:14px", "font-weight:700",
                "box-shadow:0 4px 12px rgba(0,0,0,0.3)",
            ].join(";");
            fab.addEventListener("click", openPanel);
            document.body.appendChild(fab);
        };

        // Tracks the close-fn of an open panel so onStop can fully tear it down
        // (DOM element + document keydown listener) instead of leaking either.
        let currentClose: (() => void) | null = null;

        const openPanel = (): void => {
            currentClose?.();
            const panel = document.createElement("div");
            panel.id = PANEL_ID;
            panel.setAttribute("dir", "rtl");
            panel.style.cssText = [
                "position:fixed", "inset:0", "z-index:99000",
                "background:rgba(0,0,0,0.5)",
                "display:flex", "align-items:center", "justify-content:center",
            ].join(";");

            const box = document.createElement("div");
            box.style.cssText = [
                "background:var(--background-secondary,#2b2d31)",
                "color:var(--text-normal,#dbdee1)",
                "border-radius:8px", "padding:16px",
                "width:min(80vw,720px)", "height:min(70vh,560px)",
                "display:flex", "flex-direction:column", "gap:8px",
                "font-family:var(--font-primary,system-ui)",
            ].join(";");

            box.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <h3 style="margin:0;font-size:16px">محرّر CSS مخصّص</h3>
                    <button id="boon-quickcss-close" style="background:transparent;border:0;color:inherit;font-size:22px;cursor:pointer">✕</button>
                </div>
                <textarea id="boon-quickcss-textarea" dir="ltr" spellcheck="false" style="flex:1;background:var(--background-tertiary,#1e1f22);color:inherit;border:1px solid var(--background-modifier-accent,#3f4147);border-radius:4px;padding:8px;font-family:var(--font-code,monospace);font-size:13px;line-height:1.5;resize:none;text-align:left"></textarea>
                <div style="display:flex;gap:8px;justify-content:flex-end">
                    <button id="boon-quickcss-revert" style="padding:6px 14px;background:var(--background-modifier-accent,#3f4147);color:inherit;border:0;border-radius:4px;cursor:pointer">تراجع</button>
                    <button id="boon-quickcss-save" style="padding:6px 16px;background:var(--brand-experiment,#5865f2);color:#fff;border:0;border-radius:4px;cursor:pointer;font-weight:600">حفظ وتطبيق</button>
                </div>
            `;

            panel.appendChild(box);
            document.body.appendChild(panel);

            const ta = box.querySelector<HTMLTextAreaElement>("#boon-quickcss-textarea")!;
            ta.value = ctx.settings.css;
            ta.focus();

            // Every close path (click-outside, ✕ button, Save, Escape) must
            // also detach the document keydown listener — otherwise reopening
            // the panel accumulates dead handlers on document.
            const onKey = (e: KeyboardEvent): void => {
                if (e.key === "Escape") close();
            };
            const close = (): void => {
                document.removeEventListener("keydown", onKey);
                removePanel();
                if (currentClose === close) currentClose = null;
            };
            currentClose = close;
            panel.addEventListener("click", e => { if (e.target === panel) close(); });
            box.querySelector("#boon-quickcss-close")?.addEventListener("click", close);
            box.querySelector("#boon-quickcss-revert")?.addEventListener("click", () => {
                ta.value = ctx.settings.css;
            });
            box.querySelector("#boon-quickcss-save")?.addEventListener("click", () => {
                ctx.settings.css = ta.value;
                applyCss();
                ctx.toast("تم تطبيق CSS", "success");
                ctx.stats.bump("saved");
                close();
            });
            document.addEventListener("keydown", onKey);
        };

        const onShortcut = (e: KeyboardEvent): void => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "c") {
                e.preventDefault();
                openPanel();
            }
        };
        document.addEventListener("keydown", onShortcut);

        applyCss();
        ensureFab();

        ctx.on("settings:changed", ({ pluginId }) => {
            if (pluginId !== "quickCss") return;
            applyCss();
            ensureFab();
        });

        const g = globalThis as unknown as { __BOON_QUICKCSS_CLEANUP__?: () => void };
        g.__BOON_QUICKCSS_CLEANUP__ = () => {
            document.removeEventListener("keydown", onShortcut);
            currentClose?.(); // closes panel AND removes its document keydown listener
            removeFab();
            removePanel(); // belt-and-suspenders in case no panel was open
        };

        ctx.logger.info("active");
    },
    onStop(ctx) {
        const g = globalThis as unknown as { __BOON_QUICKCSS_CLEANUP__?: () => void };
        g.__BOON_QUICKCSS_CLEANUP__?.();
        delete g.__BOON_QUICKCSS_CLEANUP__;
        ctx.logger.info("stopped");
    },
});
