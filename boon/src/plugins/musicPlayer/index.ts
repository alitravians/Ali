/*
 * BOON Plugin: MusicPlayer
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * A floating YouTube player overlaid on Discord. Open via `..play <url|query>`
 * or `..music`. The player is draggable, minimizable, and persistent across
 * channel switches.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";

const PANEL_ID = "boon-music-panel";

const SCHEMA = {
    autoplay: {
        type: "boolean",
        label: "تشغيل تلقائي عند فتح فيديو",
        default: true,
    },
    rememberPosition: {
        type: "boolean",
        label: "احفظ مكان النافذة",
        default: true,
    },
    defaultVolume: {
        type: "number",
        label: "مستوى الصوت الافتراضي",
        description: "0 إلى 100.",
        default: 70,
        min: 0,
        max: 100,
    },
} as const satisfies SettingsSchema;

function extractYouTubeId(input: string): string | null {
    const trimmed = input.trim();
    if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
    const patterns = [
        /[?&]v=([\w-]{11})/,
        /youtu\.be\/([\w-]{11})/,
        /youtube\.com\/embed\/([\w-]{11})/,
        /youtube\.com\/shorts\/([\w-]{11})/,
    ];
    for (const re of patterns) {
        const m = trimmed.match(re);
        if (m) return m[1];
    }
    return null;
}

function buildEmbedUrl(query: string, autoplay: boolean): string {
    const id = extractYouTubeId(query);
    if (id) {
        // Hardcoded protocol + host + path; only the validated 11-char id is interpolated.
        return `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&modestbranding=1&rel=0`;
    }
    // Strip any control characters out of the query before URI-encoding to be defensive.
    const safeQuery = query.replace(/[\u0000-\u001f\u007f]/g, "");
    return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(safeQuery)}&autoplay=${
        autoplay ? 1 : 0
    }`;
}

/**
 * Defense in depth: refuse to set `iframe.src` to anything other than a
 * URL whose origin is exactly `https://www.youtube.com`. Even though
 * `buildEmbedUrl` already only ever returns such URLs, going through this
 * guard makes it auditable for static analysis tools.
 */
function setYouTubeIframeSrc(iframe: HTMLIFrameElement, src: string): void {
    if (src === "about:blank") {
        iframe.src = src;
        return;
    }
    let parsed: URL;
    try {
        parsed = new URL(src);
    } catch {
        return;
    }
    if (parsed.protocol !== "https:" || parsed.host !== "www.youtube.com") {
        return;
    }
    iframe.src = parsed.toString();
}

interface Position {
    x: number;
    y: number;
    w: number;
    h: number;
}

const STORAGE_KEY = "BOON:musicPlayer:position";

function loadPosition(): Position {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Position;
    } catch {
        /* ignore */
    }
    return { x: window.innerWidth - 380, y: window.innerHeight - 280, w: 360, h: 240 };
}

function savePosition(p: Position): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
        /* ignore */
    }
}

function ensureStyles(): void {
    if (document.getElementById("boon-music-styles")) return;
    const style = document.createElement("style");
    style.id = "boon-music-styles";
    style.textContent = `
#${PANEL_ID} {
    position: fixed;
    background: #1e1f22;
    border: 1px solid #404249;
    border-radius: 8px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    z-index: 2147483645;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: var(--font-primary, "gg sans", sans-serif);
    color: #f2f3f5;
}
#${PANEL_ID} .boon-music-header {
    padding: 6px 10px;
    background: #2b2d31;
    cursor: move;
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; font-weight: 600;
    user-select: none;
}
#${PANEL_ID} .boon-music-header span.title { color: #f2f3f5; }
#${PANEL_ID} .boon-music-header .btns { display: flex; gap: 6px; }
#${PANEL_ID} .boon-music-header button {
    background: transparent; border: none; color: #b5bac1; cursor: pointer;
    padding: 2px 6px; font-size: 16px; line-height: 1; border-radius: 4px;
}
#${PANEL_ID} .boon-music-header button:hover { background: #404249; color: white; }
#${PANEL_ID} iframe { flex: 1; border: none; width: 100%; }
#${PANEL_ID} .boon-music-input {
    padding: 8px; background: #2b2d31; display: flex; gap: 6px;
}
#${PANEL_ID} .boon-music-input input {
    flex: 1; background: #1e1f22; border: 1px solid #1e1f22; color: #f2f3f5;
    padding: 6px 8px; border-radius: 4px; font-size: 13px;
}
#${PANEL_ID} .boon-music-input button {
    background: #00ff88; border: none; color: #0a1f10;
    padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;
    font-weight: 700;
}
#${PANEL_ID}.minimized iframe, #${PANEL_ID}.minimized .boon-music-input { display: none; }
#${PANEL_ID} .boon-music-resize {
    position: absolute; right: 0; bottom: 0;
    width: 14px; height: 14px; cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, #00ff88 50%);
}
`;
    document.head.appendChild(style);
}

let panel: HTMLElement | null = null;
let currentQuery = "";

function openPanel(autoplay: boolean): HTMLElement {
    ensureStyles();
    if (panel) return panel;
    const pos = loadPosition();
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.left = `${pos.x}px`;
    panel.style.top = `${pos.y}px`;
    panel.style.width = `${pos.w}px`;
    panel.style.height = `${pos.h}px`;

    const header = document.createElement("div");
    header.className = "boon-music-header";
    const titleEl = document.createElement("span");
    titleEl.className = "title";
    titleEl.textContent = "🎵 BOON Music";
    const btns = document.createElement("div");
    btns.className = "btns";
    const minBtn = document.createElement("button");
    minBtn.dataset.action = "minimize";
    minBtn.title = "تصغير";
    minBtn.textContent = "_";
    const closeBtn = document.createElement("button");
    closeBtn.dataset.action = "close";
    closeBtn.title = "إغلاق";
    closeBtn.textContent = "×";
    btns.append(minBtn, closeBtn);
    header.append(titleEl, btns);
    panel.appendChild(header);

    const iframe = document.createElement("iframe");
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    setYouTubeIframeSrc(iframe, currentQuery ? buildEmbedUrl(currentQuery, autoplay) : "about:blank");
    panel.appendChild(iframe);

    const inputBar = document.createElement("div");
    inputBar.className = "boon-music-input";
    const input = document.createElement("input");
    input.placeholder = "ابحث في يوتيوب أو ضع رابط";
    input.value = currentQuery;
    const playBtn = document.createElement("button");
    playBtn.textContent = "تشغيل";
    playBtn.addEventListener("click", () => {
        currentQuery = input.value;
        setYouTubeIframeSrc(iframe, buildEmbedUrl(currentQuery, autoplay));
    });
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            playBtn.click();
        }
    });
    inputBar.append(input, playBtn);
    panel.appendChild(inputBar);

    const resize = document.createElement("div");
    resize.className = "boon-music-resize";
    panel.appendChild(resize);

    document.body.appendChild(panel);

    header.addEventListener("click", e => {
        const action = (e.target as HTMLElement | null)?.dataset.action;
        if (action === "close") closePanel();
        else if (action === "minimize") panel!.classList.toggle("minimized");
    });

    // Drag
    let dragOffset: { x: number; y: number } | null = null;
    header.addEventListener("mousedown", e => {
        if ((e.target as HTMLElement).tagName === "BUTTON") return;
        const rect = panel!.getBoundingClientRect();
        dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        e.preventDefault();
    });
    document.addEventListener("mousemove", e => {
        if (!dragOffset || !panel) return;
        panel.style.left = `${Math.max(0, e.clientX - dragOffset.x)}px`;
        panel.style.top = `${Math.max(0, e.clientY - dragOffset.y)}px`;
    });
    document.addEventListener("mouseup", () => {
        if (dragOffset && panel) {
            const r = panel.getBoundingClientRect();
            savePosition({ x: r.left, y: r.top, w: r.width, h: r.height });
        }
        dragOffset = null;
    });

    // Resize
    let resizeStart: { x: number; y: number; w: number; h: number } | null = null;
    resize.addEventListener("mousedown", e => {
        const r = panel!.getBoundingClientRect();
        resizeStart = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
        e.preventDefault();
    });
    document.addEventListener("mousemove", e => {
        if (!resizeStart || !panel) return;
        const w = Math.max(240, resizeStart.w + (e.clientX - resizeStart.x));
        const h = Math.max(180, resizeStart.h + (e.clientY - resizeStart.y));
        panel.style.width = `${w}px`;
        panel.style.height = `${h}px`;
    });
    document.addEventListener("mouseup", () => {
        if (resizeStart && panel) {
            const r = panel.getBoundingClientRect();
            savePosition({ x: r.left, y: r.top, w: r.width, h: r.height });
        }
        resizeStart = null;
    });

    return panel;
}

function closePanel(): void {
    panel?.remove();
    panel = null;
}

export default definePlugin({
    manifest: {
        id: "musicPlayer",
        name: "MusicPlayer",
        description: "مشغّل يوتيوب عائم داخل Discord. اسحبه، صغّره، احفظ مكانه.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["موسيقى", "YouTube"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        ctx.registerCommand({
            name: "play",
            description: "افتح المشغّل وشغّل فيديو/بحث.",
            args: [{ name: "url-or-query", required: true }],
            execute(args) {
                currentQuery = args.join(" ");
                if (!currentQuery) {
                    ctx.toast("..play <رابط أو كلمات بحث>", "error");
                    return;
                }
                const p = openPanel(ctx.settings.autoplay);
                const iframe = p.querySelector<HTMLIFrameElement>("iframe");
                if (iframe) setYouTubeIframeSrc(iframe, buildEmbedUrl(currentQuery, ctx.settings.autoplay));
                ctx.toast(`▶️ ${currentQuery}`, "success");
                ctx.stats.bump("tracks_played");
            },
        });

        ctx.registerCommand({
            name: "music",
            description: "افتح/أغلق نافذة المشغّل.",
            execute() {
                if (panel) closePanel();
                else openPanel(ctx.settings.autoplay);
            },
        });

        // Toolbar button next to the chat composer — toggles the player.
        ctx.chatButton.add({
            id: "musicPlayer:toggle",
            label: "BOON: مشغّل الموسيقى",
            icon: "🎵",
            onClick() {
                if (panel) closePanel();
                else openPanel(ctx.settings.autoplay);
            },
        });

        ctx.logger.info("ready — ..play <query>");
    },
    onStop(ctx) {
        closePanel();
        ctx.logger.info("stopped");
    },
});
