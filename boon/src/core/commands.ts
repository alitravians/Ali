/*
 * BOON — Discord Client Modification Framework
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Custom slash-style commands. BOON cannot register real Discord slash commands
 * (those require gateway/REST access), so instead we intercept text starting with
 * the BOON command prefix (default `..`) in the composer when the user presses Enter.
 */

import { rootLogger } from "./logger.js";
import type { BoonCommand } from "./types.js";

const COMMAND_PREFIX = "..";
const registry = new Map<string, BoonCommand>();

export function getPrefix(): string {
    return COMMAND_PREFIX;
}

export function register(command: BoonCommand): () => void {
    if (registry.has(command.name)) {
        rootLogger.warn(`command "${command.name}" already registered, overwriting`);
    }
    registry.set(command.name, command);
    return () => {
        if (registry.get(command.name) === command) registry.delete(command.name);
    };
}

export function listCommands(): BoonCommand[] {
    return [...registry.values()];
}

export async function tryHandle(raw: string): Promise<boolean> {
    if (!raw.startsWith(COMMAND_PREFIX)) return false;
    const body = raw.slice(COMMAND_PREFIX.length).trim();
    if (!body) return false;
    const [name, ...rest] = body.split(/\s+/);
    const command = registry.get(name);
    if (!command) return false;
    try {
        await command.execute(rest, body);
    } catch (err) {
        rootLogger.error(`command "${name}" failed:`, err);
    }
    return true;
}

/**
 * Install a keydown listener on the composer that intercepts Enter on
 * BOON-prefixed messages and runs the matching command instead of sending.
 */
export function installComposerInterceptor(): () => void {
    const handler = async (e: KeyboardEvent): Promise<void> => {
        if (e.key !== "Enter" || e.shiftKey) return;
        const target = e.target as HTMLElement | null;
        if (!target?.matches?.('div[role="textbox"][data-slate-editor="true"]')) return;
        const text = target.textContent ?? "";
        if (!text.startsWith(COMMAND_PREFIX)) return;
        const handled = await tryHandle(text);
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
            target.innerHTML = "";
            target.dispatchEvent(new InputEvent("input", { bubbles: true }));
        }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
}
