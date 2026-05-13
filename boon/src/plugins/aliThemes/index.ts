/*
 * BOON Plugin: AliThemes
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Theme presets + accent color + corner radius + density + custom CSS. Applies
 * styles by injecting a single <style> tag and re-injects on settings change.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";
import { THEMES, type ThemeId } from "./themes.js";

const MANIFEST_ID = "aliThemes";

const SCHEMA = {
    preset: {
        type: "select",
        label: "الثيم",
        description: "اختر ثيم جاهز.",
        default: "default",
        options: [
            { label: "افتراضي", value: "default" },
            { label: "Midnight (داكن جداً)", value: "midnight" },
            { label: "Sunset (برتقالي/بنفسجي)", value: "sunset" },
            { label: "Ocean (أزرق هادئ)", value: "ocean" },
            { label: "Cyber (نيون أخضر)", value: "cyber" },
            { label: "Sand (أبيض دافئ)", value: "sand" },
        ],
    },
    accent: {
        type: "color",
        label: "لون التركيز",
        description: "يطبّق على الأزرار والروابط.",
        default: "#00ff88",
    },
    radius: {
        type: "number",
        label: "نصف قطر الزوايا",
        description: "بكسلات. 0 = حواف حادة.",
        default: 6,
        min: 0,
        max: 24,
    },
    compact: {
        type: "boolean",
        label: "وضع مضغوط",
        description: "يقلل الحشو والمسافات.",
        default: false,
    },
    customCss: {
        type: "textarea",
        label: "CSS مخصص",
        description: "يُحقن آخر شي ليطغى على باقي القواعد.",
        default: "",
        placeholder: "/* اكتب CSS هنا */",
    },
} as const satisfies SettingsSchema;

function adjustLightness(hex: string, delta: number): string {
    const m = /^#?([\da-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const num = parseInt(m[1], 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + delta));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + delta));
    const b = Math.max(0, Math.min(255, (num & 0xff) + delta));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function buildCss(values: {
    preset: ThemeId;
    accent: string;
    radius: number;
    compact: boolean;
    customCss: string;
}): string {
    const base = THEMES[values.preset] ?? "";
    const accent = values.accent || "#00ff88";
    const accentHover = adjustLightness(accent, -10);
    const variables = `
:root {
    --boon-accent: ${accent};
    --boon-accent-hover: ${accentHover};
    --boon-radius: ${values.radius}px;
}
button[class*="lookFilled"]:not([disabled]) {
    background-color: var(--boon-accent) !important;
    border-radius: var(--boon-radius) !important;
}
button[class*="lookFilled"]:not([disabled]):hover {
    background-color: var(--boon-accent-hover) !important;
}
a, [class*="anchor"] { color: var(--boon-accent) !important; }
[class*="container"][class*="message"],
[class*="card_"] { border-radius: var(--boon-radius) !important; }
${values.compact ? "[class*='groupStart'] { margin-top: 4px !important; }" : ""}
${values.compact ? "[class*='messageListItem'] { padding-top: 2px !important; padding-bottom: 2px !important; }" : ""}
`;
    return [variables, base, values.customCss].filter(Boolean).join("\n");
}

export default definePlugin({
    manifest: {
        id: MANIFEST_ID,
        name: "AliThemes",
        description: "ثيمات وتخصيص شكل الدسكورد — ألوان، زوايا، CSS مخصص.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["تخصيص", "Themes"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        const apply = (): void => {
            const css = buildCss({
                preset: ctx.settings.preset as ThemeId,
                accent: ctx.settings.accent,
                radius: ctx.settings.radius,
                compact: ctx.settings.compact,
                customCss: ctx.settings.customCss,
            });
            ctx.injectStyle(css, "main");
            ctx.stats.touch();
        };
        apply();
        ctx.on("settings:changed", ({ pluginId }) => {
            if (pluginId === MANIFEST_ID) {
                apply();
                ctx.stats.bump("applied");
            }
        });
        ctx.logger.info("active");
    },
    onStop(ctx) {
        ctx.logger.info("stopped");
    },
});
