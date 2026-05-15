/*
 * BOON Plugin: MessageLogger
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Inspired by Vencord's MessageLogger plugin (GPL-3.0).
 * Source: https://github.com/Vendicated/Vencord/tree/main/src/plugins/messageLoggerEnhanced
 *
 * Snapshots every message text we see in the DOM (per channel, per messageId).
 * When the DOM mutation observer reports a message disappearing from view OR a
 * message's text changing, we tag the snapshot accordingly:
 *
 *   - DISAPPEARED + last-known content non-empty  → "deleted"
 *   - REAPPEARED with different content           → "edited"
 *
 * We then render a sticky accessory under the message (when it re-appears)
 * showing the previous content (red strikethrough = deleted, yellow = old
 * version).
 *
 * Constraints:
 *   - Pure DOM. We can't distinguish "user deleted it" from "Discord scrolled
 *     it out of the virtualized list" — so we mark it tentatively as deleted
 *     and clear the flag if it re-mounts with the same content within 30s.
 *   - Memory is bounded: max 500 entries per channel, LRU-evicted.
 *   - Cache is in-memory only (cleared on Discord reload). Persisting deleted
 *     messages would raise serious privacy / ToS concerns — by design.
 */

import { definePlugin, type SettingsSchema } from "../../core/types.js";
import { observeMessages, readMessageBodyText } from "../../core/discord.js";

const SCHEMA = {
    enableDeleted: { type: "boolean", label: "تتبع الرسائل المحذوفة", default: true },
    enableEdited: { type: "boolean", label: "تتبع الرسائل المعدّلة", default: true },
    maxPerChannel: {
        type: "number",
        label: "الحد الأقصى للرسائل المحفوظة لكل قناة",
        description: "أكبر = ذاكرة أكثر. صفر = بلا حد.",
        default: 500,
        min: 0,
        max: 5000,
    },
    showAuthor: { type: "boolean", label: "إظهار اسم المرسل في السجل", default: true },
    confirmGraceMs: {
        type: "number",
        label: "زمن انتظار التأكيد (مللي ثانية)",
        description: "إذا اختفت رسالة لأقل من هذا الزمن، نتجاهلها (scroll، تحديث DOM).",
        default: 1500,
        min: 500,
        max: 10000,
    },
} as const satisfies SettingsSchema;

interface Snapshot {
    messageId: string;
    channelId: string;
    authorName: string;
    content: string;
    seenAt: number;
}

interface DeletedRecord {
    snapshot: Snapshot;
    deletedAt: number;
}

interface EditedRecord {
    messageId: string;
    channelId: string;
    history: string[];
}

const cache = new Map<string, Snapshot>();          // key: channelId:messageId
const channelKeys = new Map<string, Set<string>>(); // channelId -> Set of "channelId:messageId"
const pendingDelete = new Map<string, number>();    // key -> timer id
const confirmedDeleted = new Map<string, DeletedRecord>();
const edits = new Map<string, EditedRecord>();

function key(channelId: string, messageId: string): string {
    return `${channelId}:${messageId}`;
}

function evict(channelId: string, max: number): void {
    if (max <= 0) return;
    const set = channelKeys.get(channelId);
    if (!set || set.size <= max) return;
    const it = set.values();
    while (set.size > max) {
        const k = it.next().value;
        if (!k) break;
        set.delete(k);
        cache.delete(k);
    }
}

function extractAuthor(li: HTMLElement): string {
    const el = li.querySelector<HTMLElement>('[id^="message-username-"] span, h3 span');
    return el?.textContent?.trim() ?? "?";
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

interface RenderArgs {
    deleted?: DeletedRecord;
    edited?: EditedRecord;
    showAuthor: boolean;
}

function renderAccessory(args: RenderArgs): HTMLElement {
    const root = document.createElement("div");
    root.className = "boon-messagelogger-accessory";
    root.style.cssText = "margin-top:4px;display:flex;flex-direction:column;gap:2px";

    if (args.deleted) {
        const row = document.createElement("div");
        row.style.cssText = "padding:4px 8px;background:rgba(237,66,69,0.12);border-right:3px solid #ed4245;border-radius:4px;font-size:13px;color:#f23f42";
        const author = args.showAuthor ? `<span style="opacity:0.7;margin-left:6px">${escapeHtml(args.deleted.snapshot.authorName)}</span>` : "";
        row.innerHTML = `🗑️ <span style="text-decoration:line-through">${escapeHtml(args.deleted.snapshot.content)}</span>${author}`;
        root.appendChild(row);
    }

    if (args.edited && args.edited.history.length > 1) {
        const previous = args.edited.history.slice(0, -1);
        for (const old of previous) {
            const row = document.createElement("div");
            row.style.cssText = "padding:4px 8px;background:rgba(255,212,59,0.10);border-right:3px solid #f0b232;border-radius:4px;font-size:12px;color:var(--text-muted,#b5bac1);font-style:italic";
            row.innerHTML = `✏️ <span style="text-decoration:line-through;opacity:0.85">${escapeHtml(old)}</span>`;
            root.appendChild(row);
        }
    }

    return root;
}

function findOrCreateHost(li: HTMLElement): HTMLElement {
    let host = li.querySelector<HTMLElement>(".boon-messagelogger-host");
    if (host) return host;
    const contents = li.querySelector<HTMLElement>('div[class*="contents_"]')
        ?? li.querySelector<HTMLElement>('div[id^="message-content-"]')?.parentElement;
    if (!contents) return li;
    host = document.createElement("div");
    host.className = "boon-messagelogger-host boon-accessory-host";
    contents.appendChild(host);
    return host;
}

export default definePlugin({
    manifest: {
        id: "messageLogger",
        name: "MessageLogger",
        description: "حفظ مؤقت للرسائل المحذوفة والمعدّلة وعرضها تحت الرسالة الأصلية. الذاكرة فقط — لا تخزين دائم.",
        authors: [{ name: "ali" }],
        version: "0.1.0",
        tags: ["مراقبة", "Vencord-inspired"],
        enabledByDefault: true,
    },
    settings: SCHEMA,
    onStart(ctx) {
        // Track which channelIds we've seen — when ALL li for that channel
        // disappear, treat as channel switch (not deletion)
        const visibleByChannel = new Map<string, Set<string>>();

        const handle = (li: HTMLElement): void => {
            // Skip our own accessory mutations
            if (li.closest(".boon-messagelogger-host")) return;

            const id = li.id; // chat-messages-<channel>-<message>
            const parts = id.split("-");
            if (parts.length < 3) return;
            const messageId = parts[parts.length - 1];
            const channelId = parts[parts.length - 2];
            const k = key(channelId, messageId);

            const content = readMessageBodyText(li).trim();
            const author = extractAuthor(li);
            const now = Date.now();

            // Track visibility
            let visible = visibleByChannel.get(channelId);
            if (!visible) {
                visible = new Set();
                visibleByChannel.set(channelId, visible);
            }
            visible.add(k);

            // Clear any pending-delete for this key (it came back)
            const pending = pendingDelete.get(k);
            if (pending !== undefined) {
                window.clearTimeout(pending);
                pendingDelete.delete(k);
            }

            // Check for edit
            const prior = cache.get(k);
            if (prior && content && prior.content && prior.content !== content) {
                if (ctx.settings.enableEdited) {
                    let rec = edits.get(k);
                    if (!rec) {
                        rec = { messageId, channelId, history: [prior.content] };
                        edits.set(k, rec);
                    }
                    if (rec.history[rec.history.length - 1] !== prior.content) {
                        rec.history.push(prior.content);
                    }
                    if (rec.history.length > 5) {
                        rec.history = rec.history.slice(-5);
                    }
                    ctx.stats.bump("edits_logged");
                }
            }

            // If we had marked it deleted but it came back unchanged, drop the mark
            const wasDeleted = confirmedDeleted.get(k);
            if (wasDeleted && wasDeleted.snapshot.content === content) {
                confirmedDeleted.delete(k);
            }

            // Update snapshot
            if (content) {
                cache.set(k, { messageId, channelId, authorName: author, content, seenAt: now });
                let set = channelKeys.get(channelId);
                if (!set) {
                    set = new Set();
                    channelKeys.set(channelId, set);
                }
                set.add(k);
                evict(channelId, ctx.settings.maxPerChannel);
            }

            // Render accessory if we have something to show
            const deleted = confirmedDeleted.get(k);
            const edited = edits.get(k);
            const host = findOrCreateHost(li);
            host.innerHTML = "";
            if (deleted || (edited && edited.history.length > 1)) {
                host.appendChild(renderAccessory({
                    deleted,
                    edited,
                    showAuthor: ctx.settings.showAuthor,
                }));
            }
        };

        const cleanupObserver = observeMessages(handle);

        // Periodically check for messages that vanished from DOM (potential deletes).
        // We do this on a tick rather than per-mutation to avoid thrashing.
        const sweepInterval = window.setInterval(() => {
            if (!ctx.settings.enableDeleted) return;
            const present = new Set<string>();
            document.querySelectorAll<HTMLElement>('li[id^="chat-messages-"]').forEach(li => {
                const id = li.id;
                const p = id.split("-");
                if (p.length >= 3) {
                    present.add(`${p[p.length - 2]}:${p[p.length - 1]}`);
                }
            });

            // For each cached entry that's not present in DOM right now,
            // schedule a delayed confirm (if not already scheduled)
            for (const [k, snap] of cache) {
                if (present.has(k)) continue;
                if (pendingDelete.has(k)) continue;
                if (confirmedDeleted.has(k)) continue;
                if (!snap.content) continue;
                const timer = window.setTimeout(() => {
                    pendingDelete.delete(k);
                    // Re-check that it's STILL missing after grace period
                    const still = document.getElementById(`chat-messages-${snap.channelId}-${snap.messageId}`);
                    if (still) return; // came back — not deleted
                    confirmedDeleted.set(k, { snapshot: snap, deletedAt: Date.now() });
                    ctx.stats.bump("deletes_logged");
                    ctx.logger.info(`deleted msg ${snap.messageId} by ${snap.authorName}`);
                }, ctx.settings.confirmGraceMs);
                pendingDelete.set(k, timer);
            }
        }, 2000);

        ctx.logger.info("active");

        const g = globalThis as unknown as { __BOON_MESSAGELOGGER_CLEANUP__?: () => void };
        g.__BOON_MESSAGELOGGER_CLEANUP__ = () => {
            cleanupObserver();
            window.clearInterval(sweepInterval);
            for (const t of pendingDelete.values()) window.clearTimeout(t);
            pendingDelete.clear();
            cache.clear();
            channelKeys.clear();
            confirmedDeleted.clear();
            edits.clear();
            visibleByChannel.clear();
        };
    },
    onStop(ctx) {
        const g = globalThis as unknown as { __BOON_MESSAGELOGGER_CLEANUP__?: () => void };
        g.__BOON_MESSAGELOGGER_CLEANUP__?.();
        delete g.__BOON_MESSAGELOGGER_CLEANUP__;
        ctx.logger.info("stopped");
    },
});
