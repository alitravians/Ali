/*
 * BOON Plugin: NoNitroAds
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Hides the most common Nitro upsell UI surfaces using CSS selectors. We
 * intentionally avoid webpack patches here — they break on every Discord
 * release. Instead we target Discord's aria labels, button classes, and
 * data attributes which are far more stable.
 *
 * Each selector is gated by a setting so the user can re-enable specific
 * surfaces if needed.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const SCHEMA = {
    hideGiftButton: { type: "boolean", label: "إخفاء زر الهدية (gift) في صندوق الكتابة", default: true },
    hideNitroTab: { type: "boolean", label: "إخفاء تبويب Nitro في إعدادات المستخدم", default: true },
    hideBoostBar: { type: "boolean", label: "إخفاء شريط تعزيز السيرفر", default: true },
    hideStickerUpsell: { type: "boolean", label: "إخفاء إعلانات Stickers/Soundboard المدفوعة", default: true },
    hideUpsellModals: { type: "boolean", label: "إخفاء النوافذ المنبثقة للترقية", default: true },
    hidePremiumBadges: { type: "boolean", label: "إخفاء شارة Nitro بجانب الأسماء", default: false },
} as const satisfies SettingsSchema;

function buildCss(s: Record<string, boolean>): string {
    const rules: string[] = [];
    if (s.hideGiftButton) {
        rules.push(`
button[aria-label*="Send a gift" i],
button[aria-label*="إهداء" i],
button[aria-label*="Nitro" i][class*="button"]:not([class*="primary"]) {
    display: none !important;
}`);
    }
    if (s.hideNitroTab) {
        rules.push(`
nav [class*="side"] [aria-label*="Nitro" i],
[role="tab"][aria-label*="Nitro" i],
[class*="sidebar"] div[class*="item"][aria-label*="Nitro" i] {
    display: none !important;
}`);
    }
    if (s.hideBoostBar) {
        rules.push(`
[class*="boostBar"], [class*="guildBoostBanner"],
[aria-label*="Server Boost" i] {
    display: none !important;
}`);
    }
    if (s.hideStickerUpsell) {
        rules.push(`
[class*="upsellOverlay"],
[class*="premium"][class*="upsell"],
[class*="stickerPickerNitroLabel"],
[class*="soundboardUpsell"] {
    display: none !important;
}`);
    }
    if (s.hideUpsellModals) {
        rules.push(`
[class*="premiumPromo_"], [class*="premiumModal"],
[class*="upsellModal"], [class*="premiumGate"] {
    display: none !important;
}`);
    }
    if (s.hidePremiumBadges) {
        rules.push(`
[class*="premiumIcon"], img[src*="premium"] {
    display: none !important;
}`);
    }
    rules.push(`/* BOON NoNitroAds — ${new Date().toISOString().slice(0, 10)} */`);
    return rules.join("\n");
}

export default definePlugin({
    manifest: {
        id: "noNitroAds",
        name: "NoNitroAds",
        description: "إخفاء إعلانات Nitro: زر الهدية، تبويب Nitro، نوافذ الترقية، Stickers مدفوعة.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["تنظيف", "Nitro"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        const apply = (): void => {
            const css = buildCss({
                hideGiftButton: ctx.settings.hideGiftButton,
                hideNitroTab: ctx.settings.hideNitroTab,
                hideBoostBar: ctx.settings.hideBoostBar,
                hideStickerUpsell: ctx.settings.hideStickerUpsell,
                hideUpsellModals: ctx.settings.hideUpsellModals,
                hidePremiumBadges: ctx.settings.hidePremiumBadges,
            });
            ctx.injectStyle(css, "rules");
            ctx.stats.touch();
        };
        apply();
        ctx.on("settings:changed", ({ pluginId }) => {
            if (pluginId === "noNitroAds") {
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
