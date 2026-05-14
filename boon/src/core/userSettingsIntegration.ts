/*
 * BOON — Discord User Settings native integration
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Injects BOON sub-pages into Discord's User Settings dialog so the framework
 * appears as part of Discord's own settings tree (My Account / Privacy /
 * BOON Plugins / BOON Themes / …) instead of as a floating modal.
 *
 * Strategy — pure DOM observation. We never patch webpack chunks (those
 * change on every Discord deploy). Instead we:
 *   1. Watch document.body for the appearance of the User Settings nav root.
 *   2. Once detected, sniff the hashed class names from existing native rows
 *      (e.g. itemContainer_caf372, section__409aa, sectionLabel__409aa) and
 *      clone them onto our injected rows so they look pixel-identical.
 *   3. On click of a BOON row, hide native content children and render the
 *      corresponding BOON view (re-using `ui.renderEmbedded`) into the
 *      content region.
 *   4. On click of a native row, restore Discord's children and remove our
 *      content overlay.
 */
import { rootLogger } from "./logger.js";
import { renderEmbedded, clearEmbedded } from "./ui.js";
import type { ViewId } from "./ui.js";

interface SidebarTab {
    id: ViewId;
    label: string;
    icon: string;
}

const TABS: ReadonlyArray<SidebarTab> = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "plugins", label: "Plugins", icon: "🧩" },
    { id: "themes", label: "Themes", icon: "🎨" },
    { id: "updater", label: "Updates", icon: "🔄" },
    { id: "profiles", label: "Profiles", icon: "👤" },
    { id: "activity", label: "Activity", icon: "📜" },
    { id: "backup", label: "Backup", icon: "💾" },
];

const SECTION_ATTR = "data-boon-settings-section";
const TAB_ATTR = "data-boon-settings-tab";
const CONTENT_ATTR = "data-boon-settings-content";
const LABEL_ATTR = "data-boon-settings-label";

let observer: MutationObserver | null = null;
let currentTab: ViewId | null = null;

function findSidebar(): HTMLElement | null {
    // Only return the SETTINGS sidebar nav. The Friends/DM nav and the
    // channels list also use `[class*="nav__"]` selectors, so we scope to
    // the settings modal first.
    const settingsModal = document.querySelector<HTMLElement>(
        '[class*="mobileNavigationOpen"]'
    )?.parentElement;
    const root = settingsModal ?? document;
    return root.querySelector<HTMLElement>('[class*="sidebar_"] [class*="nav__"]') ??
        root.querySelector<HTMLElement>('[class*="sidebar_"] nav');
}

function findContentRegion(): HTMLElement | null {
    // The User Settings modal layout, current Discord (2025-Q4):
    //   modalContent_{hash}
    //     modalContentInner_{hash}
    //       container_{hash}
    //         sidebar__{hash}          (the left nav — where we inject BOON tabs)
    //         content_{hash} mobileNavigationOpen_{hash}     (the RIGHT PANE)
    //
    // The selector `[class*="sidebar__"]` would also match Discord's app-level
    // channel sidebar — so we anchor on our injected nav, walk up to the
    // dialog container, then take the sibling of the settings sidebar.
    const ownNav = document.querySelector<HTMLElement>(`[${SECTION_ATTR}]`);
    const settingsSidebar = ownNav
        ? ownNav.closest('[class*="sidebar_"]') as HTMLElement | null
        : null;
    const dialog = settingsSidebar?.parentElement;
    if (!dialog) return null;
    for (const child of Array.from(dialog.children) as HTMLElement[]) {
        if (child === settingsSidebar) continue;
        if (child.querySelector('[class*="contentBody"], [class*="mobileNavigation"]')) {
            return child;
        }
    }
    // Last resort: first non-sidebar sibling.
    for (const child of Array.from(dialog.children) as HTMLElement[]) {
        if (child !== settingsSidebar) return child;
    }
    return null;
}

interface SniffedClasses {
    section: string;
    itemContainer: string;
    itemInner: string;
    itemContent: string;
    icon: string | null;
    sectionLabel: string;
    heading: string;
    activeClass: string;
}

function sniffClasses(sidebar: HTMLElement): SniffedClasses | null {
    const section = sidebar.querySelector<HTMLElement>('[class*="section__"]');
    const itemContainer = sidebar.querySelector<HTMLElement>('[class*="itemContainer"]');
    const itemInner = itemContainer?.querySelector<HTMLElement>('[class*="item_"]');
    const itemContent = itemContainer?.querySelector<HTMLElement>('[class*="itemContent"]');
    const icon = itemContainer?.querySelector<HTMLElement>('[class*="icon_"]');
    const sectionLabel = sidebar.querySelector<HTMLElement>('[class*="sectionLabel"]');
    const heading = sectionLabel?.querySelector<HTMLElement>('[class*="heading-"], [class*="label__"]');
    if (!section || !itemContainer || !itemInner || !itemContent || !sectionLabel || !heading) {
        return null;
    }
    // Detect active class. Try the canonical pattern first.
    let activeClass = "";
    const activeInner = sidebar.querySelector<HTMLElement>('[class*="item_"][aria-current="page"]')
        ?? sidebar.querySelector<HTMLElement>('[class*="item_"][class*="active"]');
    if (activeInner) {
        for (const cls of activeInner.classList) {
            if (cls.startsWith("active_")) {
                activeClass = cls;
                break;
            }
        }
    }
    return {
        section: section.className,
        itemContainer: itemContainer.className,
        itemInner: itemInner.className,
        itemContent: itemContent.className,
        icon: icon?.className ?? null,
        sectionLabel: sectionLabel.className,
        heading: heading.className,
        activeClass,
    };
}

function isUserSettingsOpen(): boolean {
    // The settings modal renders a right pane with class
    //   content_{hash} mobileNavigationOpen_{hash}
    // This is specific to the User Settings dialog and is not used by the
    // friends list or channel sidebars.
    return !!document.querySelector('[class*="mobileNavigationOpen"]');
}

function buildBoonRow(cls: SniffedClasses, tab: SidebarTab): HTMLElement {
    const container = document.createElement("div");
    container.className = cls.itemContainer;
    container.setAttribute(TAB_ATTR, tab.id);

    const inner = document.createElement("div");
    inner.className = cls.itemInner;
    inner.setAttribute("role", "listitem");
    inner.setAttribute("tabindex", "-1");

    const content = document.createElement("div");
    content.className = cls.itemContent;

    // Use a green-dot pseudo-icon (no SVG resource dependency).
    const dot = document.createElement("span");
    dot.style.cssText = [
        "display:inline-flex",
        "align-items:center",
        "justify-content:center",
        "width:20px",
        "height:20px",
        "font-size:14px",
        "flex-shrink:0",
    ].join(";");
    dot.textContent = tab.icon;

    const label = document.createElement("div");
    label.textContent = tab.label;
    label.style.flex = "1";

    if (cls.icon) {
        dot.className = cls.icon;
        dot.style.color = "#00ff88";
    }

    content.appendChild(dot);
    content.appendChild(label);
    inner.appendChild(content);
    container.appendChild(inner);

    container.addEventListener("click", evt => {
        evt.stopPropagation();
        activateBoonTab(tab.id);
    });
    return container;
}

function buildBoonLabel(cls: SniffedClasses): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = cls.sectionLabel;
    wrap.setAttribute(LABEL_ATTR, "");

    const heading = document.createElement("div");
    heading.className = cls.heading;
    heading.textContent = "alitravians";
    heading.style.color = "#00ff88";
    heading.style.letterSpacing = "1px";

    wrap.appendChild(heading);
    return wrap;
}

function injectBoonSection(): void {
    const sidebar = findSidebar();
    if (!sidebar) return;
    if (sidebar.querySelector(`[${SECTION_ATTR}]`)) return; // already injected

    const cls = sniffClasses(sidebar);
    if (!cls) return;

    const label = buildBoonLabel(cls);
    const section = document.createElement("ul");
    section.className = cls.section;
    section.setAttribute(SECTION_ATTR, "");
    for (const tab of TABS) {
        section.appendChild(buildBoonRow(cls, tab));
    }

    // Insert at the middle of the sidebar instead of the end. We anchor on
    // existing section labels so the alitravians group lands between two
    // native sections rather than at an arbitrary child index.
    const labels = Array.from(
        sidebar.querySelectorAll<HTMLElement>('[class*="sectionLabel"]'),
    ).filter(el => el.parentElement === sidebar);
    const anchorLabel = labels.length >= 2 ? labels[Math.floor(labels.length / 2)] : null;
    if (anchorLabel) {
        // Place our label right before the chosen native label, and our
        // section right after our label, so the new group reads as one block.
        sidebar.insertBefore(label, anchorLabel);
        sidebar.insertBefore(section, anchorLabel);
    } else {
        // Fallback: insert at midpoint of direct children.
        const children = Array.from(sidebar.children);
        const ref = children[Math.floor(children.length / 2)] ?? null;
        sidebar.insertBefore(label, ref);
        sidebar.insertBefore(section, ref);
    }
    rootLogger.info("native settings: injected BOON section into User Settings sidebar");
}

function setBoonRowSelected(tabId: ViewId | null, cls: SniffedClasses | null): void {
    document.querySelectorAll<HTMLElement>(`[${TAB_ATTR}]`).forEach(row => {
        const inner = row.firstElementChild as HTMLElement | null;
        if (!inner) return;
        if (row.getAttribute(TAB_ATTR) === tabId && cls?.activeClass) {
            inner.classList.add(cls.activeClass);
            inner.setAttribute("aria-current", "page");
        } else if (cls?.activeClass) {
            inner.classList.remove(cls.activeClass);
            inner.removeAttribute("aria-current");
        } else {
            inner.removeAttribute("aria-current");
        }
    });
}

function clearNativeRowSelection(cls: SniffedClasses): void {
    if (!cls.activeClass) return;
    document.querySelectorAll<HTMLElement>(`.${cls.activeClass}`).forEach(el => {
        if (el.closest(`[${TAB_ATTR}]`)) return;
        el.classList.remove(cls.activeClass);
        el.removeAttribute("aria-current");
    });
}

function hideNativeContent(): HTMLElement | null {
    const region = findContentRegion();
    if (!region) return null;
    // Hide every immediate child of the right pane except our host. We record
    // the original inline `display` value so we can restore it later. NOTE:
    // dataset values are strings — `""` is falsy in JS but is a valid stored
    // value, so we must compare against `undefined` explicitly. Otherwise the
    // second activation overwrites the saved "" with "none" and we can never
    // restore.
    for (const child of Array.from(region.children) as HTMLElement[]) {
        if (child.hasAttribute(CONTENT_ATTR)) continue;
        if (child.dataset.boonHiddenPrev === undefined) {
            child.dataset.boonHiddenPrev = child.style.display;
        }
        child.style.display = "none";
    }
    let host = region.querySelector<HTMLElement>(`:scope > [${CONTENT_ATTR}]`);
    if (!host) {
        host = document.createElement("div");
        host.setAttribute(CONTENT_ATTR, "");
        host.style.cssText = [
            "flex:1 1 auto",
            "min-height:0",
            "overflow-y:auto",
            "background:transparent",
        ].join(";");
        region.appendChild(host);
    }
    host.style.display = "block";
    return host;
}

function restoreNativeContent(): void {
    const region = findContentRegion();
    if (!region) return;
    for (const child of Array.from(region.children) as HTMLElement[]) {
        if (child.hasAttribute(CONTENT_ATTR)) {
            child.style.display = "none";
            continue;
        }
        const prev = child.dataset.boonHiddenPrev;
        child.style.display = prev ?? "";
        delete child.dataset.boonHiddenPrev;
    }
    // We're handing the content region back to Discord, so the BOON host
    // is no longer the right re-render target. Detach it so subsequent
    // overlay opens (Ctrl+Shift+B fallback, palette, etc.) hit the
    // floating-modal path correctly.
    clearEmbedded();
}

function activateBoonTab(tabId: ViewId): void {
    const sidebar = findSidebar();
    if (!sidebar) return;
    const cls = sniffClasses(sidebar);
    if (!cls) return;

    clearNativeRowSelection(cls);
    setBoonRowSelected(tabId, cls);

    // Scroll the active BOON row into view so users can see which tab is
    // selected even on first open.
    const activeRow = document.querySelector<HTMLElement>(`[${TAB_ATTR}="${tabId}"]`);
    activeRow?.scrollIntoView({ block: "nearest", behavior: "auto" });

    const host = hideNativeContent();
    if (!host) return;
    renderEmbedded(host, tabId);
    currentTab = tabId;
}

let nativeClickHandlerInstalled = false;
function installNativeClickHandler(): void {
    if (nativeClickHandlerInstalled) return;
    nativeClickHandlerInstalled = true;
    document.addEventListener(
        "click",
        evt => {
            const target = evt.target as HTMLElement | null;
            if (!target) return;
            const boonRow = target.closest(`[${TAB_ATTR}]`);
            if (boonRow) return;
            const nativeRow = target.closest('[data-settings-sidebar-item]') ??
                target.closest('[class*="itemContainer"]');
            if (!nativeRow) return;
            if (currentTab === null) return;
            // user clicked a native settings row — restore Discord content
            const sidebar = findSidebar();
            const cls = sidebar ? sniffClasses(sidebar) : null;
            if (cls) setBoonRowSelected(null, cls);
            restoreNativeContent();
            currentTab = null;
        },
        true,
    );
}

export function init(): void {
    installNativeClickHandler();
    installShortcut();
    observer = new MutationObserver(() => {
        if (isUserSettingsOpen()) {
            injectBoonSection();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    rootLogger.info("native settings: observer installed");
}

let shortcutInstalled = false;
function installShortcut(): void {
    if (shortcutInstalled) return;
    shortcutInstalled = true;
    window.addEventListener(
        "keydown",
        evt => {
            if (evt.shiftKey && evt.ctrlKey && evt.key.toLowerCase() === "b") {
                evt.preventDefault();
                openSettingsAt("plugins");
            }
        },
        true,
    );
}

export function shutdown(): void {
    observer?.disconnect();
    observer = null;
    restoreNativeContent();
    currentTab = null;
}

/**
 * Open Discord's User Settings dialog and switch to the requested BOON tab.
 * Used by the Ctrl+Shift+B fallback shortcut.
 */
export function openSettingsAt(tabId: ViewId = "plugins"): void {
    if (isUserSettingsOpen()) {
        if (!document.querySelector(`[${SECTION_ATTR}]`)) injectBoonSection();
        activateBoonTab(tabId);
        return;
    }
    const cog = document.querySelector<HTMLElement>('[aria-label="User Settings"]') ??
        document.querySelector<HTMLElement>('button[aria-label*="Settings" i]');
    if (cog) cog.click();
    const start = Date.now();
    const tryActivate = (): void => {
        if (Date.now() - start > 4000) return;
        if (document.querySelector(`[${SECTION_ATTR}]`)) {
            activateBoonTab(tabId);
        } else {
            if (isUserSettingsOpen()) injectBoonSection();
            window.setTimeout(tryActivate, 120);
        }
    };
    window.setTimeout(tryActivate, 200);
}
