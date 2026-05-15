/*
 * BOON Plugin: ImageZoom
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's ImageZoom plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/imageZoom
 *
 * Hold the mouse over an image in Discord's lightbox preview (the one that
 * opens when you click an attachment) → a circular lens follows the cursor
 * and shows the image at a higher zoom. Scroll wheel = zoom level, Shift+scroll
 * = lens size.
 *
 * We target the lightbox specifically (not chat thumbnails) to avoid
 * intercepting Discord's own click-to-expand on every image in chat.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    zoomStep: {
        type: "number",
        label: "خطوة التكبير",
        description: "كم تتغير نسبة التكبير مع كل scroll.",
        default: 0.5,
        min: 0.1,
        max: 2,
    },
    initialZoom: {
        type: "number",
        label: "التكبير الابتدائي",
        default: 2,
        min: 1,
        max: 10,
    },
    initialSize: {
        type: "number",
        label: "حجم العدسة (بكسل)",
        default: 200,
        min: 80,
        max: 500,
    },
} as const satisfies SettingsSchema;

const LIGHTBOX_IMG_SELECTOR =
    'div[role="dialog"] img[class*="image"]:not([alt^="reaction" i]), ' +
    'div[class*="modal-"] img[class*="image_"], ' +
    '[class*="imageWrapper"] img[class*="image_"]:hover, ' +
    'div[class*="lightbox"] img';

interface LensState {
    el: HTMLDivElement;
    img: HTMLImageElement;
    zoom: number;
    size: number;
    active: boolean;
}

export default definePlugin({
    manifest: {
        id: "imageZoom",
        name: "ImageZoom",
        description: "عدسة تكبير تتبع المؤشر فوق الصور المفتوحة. Scroll = تكبير، Shift+Scroll = حجم العدسة.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["UX", "Vencord-inspired"],
        enabledByDefault: false,
    },
    settings: SCHEMA,
    onStart(ctx) {
        let state: LensState | null = null;

        const removeLens = (): void => {
            if (state) {
                state.el.remove();
                state = null;
            }
        };

        const onMouseDown = (e: MouseEvent): void => {
            if (e.button !== 0) return;
            const target = e.target as HTMLElement | null;
            if (!target) return;
            // Only on lightbox images (large preview), never on small chat thumbs
            if (!target.matches(LIGHTBOX_IMG_SELECTOR.split(",").map(s => s.trim()).join(","))) return;
            // Skip if already wrapped in lens
            if (target.closest(".boon-zoom-lens")) return;

            const img = target as HTMLImageElement;
            const rect = img.getBoundingClientRect();
            if (rect.width < 100 || rect.height < 100) return; // ignore icons/emojis

            e.preventDefault();
            e.stopPropagation();

            const lens = document.createElement("div");
            lens.className = "boon-zoom-lens";
            const size = ctx.settings.initialSize;
            const zoom = ctx.settings.initialZoom;
            lens.style.cssText = [
                "position:fixed", "z-index:99999", "pointer-events:none",
                "border:2px solid var(--brand-experiment,#5865f2)",
                "border-radius:50%", "box-shadow:0 4px 24px rgba(0,0,0,0.5)",
                "background-repeat:no-repeat",
                `width:${size}px`, `height:${size}px`,
            ].join(";");
            // Set background-image via CSSOM (NOT cssText with template literal) so
            // a hostile img.src that contains `")` cannot break out of the url().
            // CSSStyleDeclaration auto-escapes the value.
            lens.style.backgroundImage = `url(${JSON.stringify(img.src)})`;
            document.body.appendChild(lens);

            state = { el: lens, img, zoom, size, active: true };
            updateLens(e.clientX, e.clientY);

            window.addEventListener("mousemove", onMove, { passive: true });
            window.addEventListener("mouseup", onUp, { once: true });
            window.addEventListener("wheel", onWheel, { passive: false });
        };

        const updateLens = (x: number, y: number): void => {
            if (!state) return;
            const rect = state.img.getBoundingClientRect();
            const relX = ((x - rect.left) / rect.width) * 100;
            const relY = ((y - rect.top) / rect.height) * 100;
            const bgW = rect.width * state.zoom;
            const bgH = rect.height * state.zoom;
            state.el.style.left = `${x - state.size / 2}px`;
            state.el.style.top = `${y - state.size / 2}px`;
            state.el.style.width = `${state.size}px`;
            state.el.style.height = `${state.size}px`;
            state.el.style.backgroundSize = `${bgW}px ${bgH}px`;
            state.el.style.backgroundPosition = `${relX}% ${relY}%`;
        };

        const onMove = (e: MouseEvent): void => updateLens(e.clientX, e.clientY);

        const onWheel = (e: WheelEvent): void => {
            if (!state) return;
            e.preventDefault();
            if (e.shiftKey) {
                state.size = Math.max(80, Math.min(500, state.size + (e.deltaY < 0 ? 20 : -20)));
            } else {
                state.zoom = Math.max(1, Math.min(20, state.zoom + (e.deltaY < 0 ? ctx.settings.zoomStep : -ctx.settings.zoomStep)));
            }
            // Re-apply at current mouse position
            const rect = state.el.getBoundingClientRect();
            updateLens(rect.left + rect.width / 2, rect.top + rect.height / 2);
        };

        const onUp = (): void => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("wheel", onWheel);
            removeLens();
            ctx.stats.bump("zoomed");
        };

        document.addEventListener("mousedown", onMouseDown, true);
        ctx.logger.info("active");

        // Cleanup on stop via the framework's auto-cleanup of injected styles
        // and listeners. We manually clean ours:
        const cleanup = (): void => {
            document.removeEventListener("mousedown", onMouseDown, true);
            removeLens();
        };
        // Register on a custom event so onStop sees us:
        (globalThis as unknown as { __BOON_IMAGEZOOM_CLEANUP__?: () => void }).__BOON_IMAGEZOOM_CLEANUP__ = cleanup;
    },
    onStop(ctx) {
        const g = globalThis as unknown as { __BOON_IMAGEZOOM_CLEANUP__?: () => void };
        g.__BOON_IMAGEZOOM_CLEANUP__?.();
        delete g.__BOON_IMAGEZOOM_CLEANUP__;
        ctx.logger.info("stopped");
    },
});
