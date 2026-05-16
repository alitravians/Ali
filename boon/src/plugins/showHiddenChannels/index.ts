/*
 * BOON Plugin: ShowHiddenChannels
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's `showHiddenChannels` (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/showHiddenChannels
 *
 * Where Vencord patches Discord's React channel-list to render hidden channels
 * inline, BOON takes a different route that matches its DOM-based architecture:
 * we surface hidden channels through a *companion panel* opened from a small
 * "🔒 خفي (N)" button in the channel-list header. This avoids hooking
 * Discord's render pipeline (which is webpack-mangled and brittle) and gives
 * us a much richer browsing experience than the original — search, type
 * filtering, sort, category grouping, and a per-channel details view that
 * surfaces topic, slowmode, voice properties, and the full role/member
 * permission overwrite list.
 *
 * Architecture:
 *   - `discovery.ts` is the pure logic layer: it reads `ChannelStore` +
 *     `PermissionStore` and partitions a guild's channels by VIEW_CHANNEL.
 *   - `panel.ts` owns all DOM rendering — launcher button, modal, list,
 *     details view. Re-renders on every state change.
 *   - `styles.ts` is a single CSS string, injected via `ctx.injectStyle` so
 *     the framework handles cleanup automatically.
 *   - `index.ts` (this file) wires lifecycle hooks, the `..hidden` command,
 *     and the user-facing settings.
 *
 * Cleanup: `placeLauncher` returns a teardown fn that disconnects the
 * sidebar MutationObserver, clears the rescan interval, and removes the
 * button + any open panel from the DOM. Stored on
 * `globalThis.__BOON_SHOW_HIDDEN_CHANNELS_CLEANUP__` so `onStop` only needs
 * to invoke it.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";
import { isWebpackReady } from "../../core/webpack/index.js";
import {
    applyDefaults,
    closePanel,
    openPanel,
    placeLauncher,
    requestReconcile,
    type FilterKind,
    type SortKey,
} from "./panel.js";
import { STYLE, STYLE_ID } from "./styles.js";

const SCHEMA = {
    showLauncher: {
        type: "boolean",
        label: "إظهار زر القفل في رأس قائمة القنوات",
        description: "يضيف زر '🔒 خفي (N)' في رأس قائمة القنوات لكل سيرفر. أغلِق هذا الخيار لو تبي تستخدم الأمر ..hidden فقط.",
        default: true,
    },
    defaultFilter: {
        type: "select",
        label: "التصفية الافتراضية",
        description: "النوع المعروض أول ما يفتح اللوح.",
        default: "all",
        options: [
            { value: "all", label: "كل الأنواع" },
            { value: "text", label: "قنوات نصية" },
            { value: "voice", label: "قنوات صوتية" },
            { value: "stage", label: "قنوات مسرح" },
            { value: "forum", label: "قنوات منتدى" },
            { value: "announcement", label: "قنوات إعلانات" },
            { value: "media", label: "قنوات ميديا" },
            { value: "category", label: "فئات" },
        ],
    },
    defaultSort: {
        type: "select",
        label: "الترتيب الافتراضي",
        description: "الموضع: نفس ترتيب Discord الأصلي. آخر نشاط: يعتمد على آخر رسالة (snowflake).",
        default: "position",
        options: [
            { value: "position", label: "الموضع" },
            { value: "name", label: "الاسم" },
            { value: "activity", label: "آخر نشاط" },
        ],
    },
    hideNsfw: {
        type: "boolean",
        label: "إخفاء قنوات +18 (NSFW) من القائمة",
        description: "حتى لو ما تقدر تشوفها أصلاً، يمكن ما تبي تشوف أسماءها — خصوصاً في الأماكن العامة.",
        default: false,
    },
    registerCommand: {
        type: "boolean",
        label: "تفعيل أمر ..hidden",
        description: "يفتح اللوح من خانة الكتابة (اكتب ..hidden ثم Enter).",
        default: true,
    },
} as const satisfies SettingsSchema;

const G_CLEANUP_KEY = "__BOON_SHOW_HIDDEN_CHANNELS_CLEANUP__" as const;

interface GlobalSlot {
    [G_CLEANUP_KEY]?: () => void;
}

export default definePlugin({
    manifest: {
        id: "showHiddenChannels",
        name: "ShowHiddenChannels",
        description: "عرض القنوات المخفية في السيرفر مع بحث، فلترة بالنوع، ترتيب، وعرض تفاصيل (الموضوع، الصلاحيات، آخر نشاط).",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["شريط جانبي", "Vencord-inspired", "webpack", "خصوصية"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        if (!isWebpackReady()) {
            ctx.logger.info("webpack not ready yet; launcher will appear once stores are located");
        }

        const removeStyle = ctx.injectStyle(STYLE, STYLE_ID);

        applyDefaults({
            defaultFilter: ctx.settings.defaultFilter as FilterKind,
            defaultSort: ctx.settings.defaultSort as SortKey,
            hideNsfw: ctx.settings.hideNsfw,
        });
        // applyDefaults() with no `apply` arg seeds all three fields on
        // start. The settings:changed handler below uses the `apply` arg to
        // only touch fields whose underlying setting actually changed, so
        // toggling an unrelated setting (e.g. showLauncher) doesn't snap the
        // user's in-session filter/sort back to defaults.

        let teardownLauncher: (() => void) | null = null;
        if (ctx.settings.showLauncher) {
            teardownLauncher = placeLauncher({
                onOpen: () => openPanel({
                    toast: msg => ctx.toast(msg, "info"),
                }),
            });
        }

        let unregisterCmd: (() => void) | null = null;
        if (ctx.settings.registerCommand) {
            unregisterCmd = ctx.registerCommand({
                name: "hidden",
                description: "افتح لوح القنوات المخفية للسيرفر الحالي.",
                execute() {
                    openPanel({
                        toast: msg => ctx.toast(msg, "info"),
                    });
                    ctx.stats.bump("panel_opens_command");
                },
            });
        }

        const unsubSettings = ctx.on("settings:changed", ({ pluginId, key }) => {
            if (pluginId !== "showHiddenChannels") return;
            // Only push the field that actually changed. Otherwise toggling
            // `showLauncher` or `registerCommand` would also snap the user's
            // current filter/sort tab back to the schema default.
            if (key === "defaultFilter" || key === "defaultSort" || key === "hideNsfw") {
                applyDefaults(
                    {
                        defaultFilter: ctx.settings.defaultFilter as FilterKind,
                        defaultSort: ctx.settings.defaultSort as SortKey,
                        hideNsfw: ctx.settings.hideNsfw,
                    },
                    {
                        filter: key === "defaultFilter",
                        sort: key === "defaultSort",
                        nsfw: key === "hideNsfw",
                    },
                );
                // `hideNsfw` is the only field that affects what the
                // launcher badge / open panel renders; the other two only
                // bias state the user touches deliberately. Bump the
                // launcher so the badge updates within one frame instead
                // of waiting up to 15s for the next interval tick.
                if (key === "hideNsfw") requestReconcile();
            }

            const launcherWanted = ctx.settings.showLauncher;
            const launcherActive = teardownLauncher !== null;
            if (launcherWanted && !launcherActive) {
                teardownLauncher = placeLauncher({
                    onOpen: () => openPanel({
                        toast: msg => ctx.toast(msg, "info"),
                    }),
                });
            } else if (!launcherWanted && launcherActive) {
                teardownLauncher?.();
                teardownLauncher = null;
            }

            const cmdWanted = ctx.settings.registerCommand;
            const cmdActive = unregisterCmd !== null;
            if (cmdWanted && !cmdActive) {
                unregisterCmd = ctx.registerCommand({
                    name: "hidden",
                    description: "افتح لوح القنوات المخفية للسيرفر الحالي.",
                    execute() {
                        openPanel({
                            toast: msg => ctx.toast(msg, "info"),
                        });
                        ctx.stats.bump("panel_opens_command");
                    },
                });
            } else if (!cmdWanted && cmdActive) {
                unregisterCmd?.();
                unregisterCmd = null;
            }
        });

        ctx.logger.info("active");

        const g = globalThis as unknown as GlobalSlot;
        g[G_CLEANUP_KEY] = () => {
            unsubSettings();
            unregisterCmd?.();
            unregisterCmd = null;
            teardownLauncher?.();
            teardownLauncher = null;
            closePanel();
            removeStyle();
        };
    },
    onStop(ctx) {
        const g = globalThis as unknown as GlobalSlot;
        g[G_CLEANUP_KEY]?.();
        delete g[G_CLEANUP_KEY];
        ctx.logger.info("stopped");
    },
});
