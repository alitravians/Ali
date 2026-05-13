/*
 * BOON — Discord Client Modification Framework
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Framework entrypoint. Each build target imports this module and calls
 * `boot(target)` once the page is ready. `boot` is idempotent.
 */

import * as chatButton from "./chatButton.js";
import * as commands from "./commands.js";
import * as contextMenu from "./contextMenu.js";
import { startRouteObserver, whenAppReady } from "./discord.js";
import { emit } from "./events.js";
import { rootLogger } from "./logger.js";
import * as messageAccessories from "./messageAccessories.js";
import * as pm from "./pluginManager.js";
import * as ui from "./ui.js";
import * as userSettingsIntegration from "./userSettingsIntegration.js";
import type { AnyPlugin, BoonGlobal, BoonPluginInfo, BoonTarget } from "./types.js";

import aliThemes from "../plugins/aliThemes/index.js";
import autoTranslate from "../plugins/autoTranslate/index.js";
import musicPlayer from "../plugins/musicPlayer/index.js";
import noNitroAds from "../plugins/noNitroAds/index.js";
import serverTools from "../plugins/serverTools/index.js";

export const BUILT_IN_PLUGINS: ReadonlyArray<AnyPlugin> = [
    aliThemes,
    serverTools,
    autoTranslate,
    musicPlayer,
    noNitroAds,
];

export const VERSION = "0.1.3";

let booted = false;
let cleanupRouteObserver: (() => void) | null = null;
let cleanupComposerInterceptor: (() => void) | null = null;

export async function boot(target: BoonTarget): Promise<void> {
    if (booted) return;
    booted = true;

    rootLogger.info(`booting v${VERSION} on target=${target}`);
    pm.setTarget(target);

    await whenAppReady();

    ui.init();
    userSettingsIntegration.init();
    contextMenu.init();
    messageAccessories.init();
    chatButton.init();
    cleanupComposerInterceptor = commands.installComposerInterceptor();
    cleanupRouteObserver = startRouteObserver();

    for (const plugin of BUILT_IN_PLUGINS) {
        await pm.register(plugin);
    }

    installGlobal(target);
    emit("boon:ready", {});
    rootLogger.info("ready — open Discord User Settings to find BOON, or press Ctrl+Shift+B");
}

export function shutdown(): void {
    cleanupRouteObserver?.();
    cleanupComposerInterceptor?.();
}

function installGlobal(target: BoonTarget): void {
    const api: BoonGlobal = {
        version: VERSION,
        target,
        get plugins(): ReadonlyArray<BoonPluginInfo> {
            return pm.list().map<BoonPluginInfo>(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                enabled: p.enabled,
                tags: p.tags,
            }));
        },
        async enable(pluginId: string) {
            await pm.start(pluginId);
        },
        async disable(pluginId: string) {
            await pm.stop(pluginId);
        },
        openSettings() {
            userSettingsIntegration.openSettingsAt("plugins");
        },
        closeSettings() {
            ui.close();
        },
        openPalette() {
            // Cmd+K binding lives inside the palette module; this is the manual entry.
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        },
    };
    Object.defineProperty(window, "BOON", { value: api, writable: false, configurable: true });
}
