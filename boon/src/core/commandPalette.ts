/*
 * BOON — Ctrl+K command palette
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Bound to Ctrl+K (and Cmd+K on macOS). Lists every action in BOON in one
 * fuzzy-searchable surface:
 *   - every plugin's registered commands
 *   - "Open BOON Settings"
 *   - "Toggle plugin: <name>"
 *   - "Switch profile: <name>"
 *
 * Actions are pulled lazily from injected providers — the manager calls
 * `registerProvider` once for each capability (commands, plugins, profiles)
 * and the palette re-collects on every open.
 */

import { listCommands } from "./commands.js";
import * as profiles from "./profiles.js";
import { rootLogger } from "./logger.js";

export interface PaletteAction {
    id: string;
    title: string;
    subtitle?: string;
    keywords?: string;
    run(): void | Promise<void>;
}

type Provider = () => PaletteAction[];

const providers: Provider[] = [];
let toggleOpen: (() => void) | null = null;

export function registerProvider(provider: Provider): () => void {
    providers.push(provider);
    return () => {
        const i = providers.indexOf(provider);
        if (i >= 0) providers.splice(i, 1);
    };
}

function collect(): PaletteAction[] {
    const out: PaletteAction[] = [];
    for (const p of providers) {
        try {
            out.push(...p());
        } catch (err) {
            rootLogger.warn("palette provider threw", err);
        }
    }
    out.push(
        ...listCommands().map<PaletteAction>(cmd => ({
            id: `cmd:${cmd.name}`,
            title: `..${cmd.name}`,
            subtitle: cmd.description,
            keywords: cmd.name,
            run: () => cmd.execute([], `..${cmd.name}`),
        })),
        ...profiles.list().map<PaletteAction>(p => ({
            id: `profile:${p.id}`,
            title: `تفعيل ملف شخصي: ${p.name}`,
            subtitle: p.active ? "الملف النشط حالياً" : undefined,
            keywords: `profile ${p.name}`,
            run: () => {
                profiles.activate(p.id);
            },
        })),
    );
    return out;
}

function fuzzyScore(query: string, target: string): number {
    if (!query) return 1;
    const q = query.toLowerCase();
    const t = target.toLowerCase();
    if (t.includes(q)) return 100 - Math.abs(t.length - q.length);
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++;
    }
    return qi === q.length ? 10 + qi : 0;
}

export function search(query: string): PaletteAction[] {
    const items = collect();
    if (!query.trim()) return items;
    return items
        .map(a => ({
            a,
            score: Math.max(
                fuzzyScore(query, a.title),
                a.subtitle ? fuzzyScore(query, a.subtitle) * 0.6 : 0,
                a.keywords ? fuzzyScore(query, a.keywords) * 0.8 : 0,
            ),
        }))
        .filter(x => x.score > 0)
        .sort((x, y) => y.score - x.score)
        .map(x => x.a);
}

export function bindToggle(fn: () => void): void {
    toggleOpen = fn;
}

export function installShortcut(): () => void {
    function onKey(e: KeyboardEvent): void {
        const isPaletteKey = e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey);
        if (!isPaletteKey) return;
        e.preventDefault();
        e.stopPropagation();
        toggleOpen?.();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
}
