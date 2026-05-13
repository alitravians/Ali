/*
 * BOON — named state snapshots (profiles)
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * A profile captures `{ enabled, settings }` at a point in time. The user
 * can save the current state as a named profile and switch between profiles
 * with a single click. Profiles are stored inside the same BOON state blob,
 * so they survive across browser sessions.
 */

import { emit } from "./events.js";
import { exportState, importState, type ProfileSnapshot } from "./settings.js";

const PROFILES_KEY = "BOON:profiles";

interface ProfilesBlob {
    activeId?: string;
    items: Record<string, ProfileSnapshot>;
}

function read(): ProfilesBlob {
    try {
        const raw = localStorage.getItem(PROFILES_KEY);
        if (!raw) return { items: {} };
        const parsed = JSON.parse(raw) as Partial<ProfilesBlob>;
        return {
            activeId: parsed.activeId,
            items: parsed.items ?? {},
        };
    } catch {
        return { items: {} };
    }
}

function write(blob: ProfilesBlob): void {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(blob));
}

export interface ProfileInfo {
    id: string;
    name: string;
    active: boolean;
}

export function list(): ProfileInfo[] {
    const blob = read();
    return Object.entries(blob.items).map(([id, item]) => ({
        id,
        name: item.name,
        active: blob.activeId === id,
    }));
}

export function getActive(): string | undefined {
    return read().activeId;
}

export function save(name: string, id?: string): ProfileInfo {
    const blob = read();
    const effectiveId = id ?? `profile-${Date.now().toString(36)}`;
    const state = exportState();
    blob.items[effectiveId] = {
        name,
        enabled: state.enabled,
        settings: state.settings,
    };
    if (!blob.activeId) blob.activeId = effectiveId;
    write(blob);
    return { id: effectiveId, name, active: blob.activeId === effectiveId };
}

export function activate(id: string): boolean {
    const blob = read();
    const snap = blob.items[id];
    if (!snap) return false;
    blob.activeId = id;
    write(blob);
    importState({ version: 1, enabled: snap.enabled, settings: snap.settings });
    emit("profile:switched", { profileId: id });
    return true;
}

export function remove(id: string): void {
    const blob = read();
    delete blob.items[id];
    if (blob.activeId === id) blob.activeId = undefined;
    write(blob);
}

export function rename(id: string, name: string): void {
    const blob = read();
    const item = blob.items[id];
    if (!item) return;
    item.name = name;
    write(blob);
}

export function exportProfile(id: string): string | null {
    const blob = read();
    const snap = blob.items[id];
    if (!snap) return null;
    return JSON.stringify({ kind: "boon-profile", version: 1, ...snap }, null, 2);
}

export function importProfile(raw: string): ProfileInfo | null {
    try {
        const parsed = JSON.parse(raw) as { name?: string; enabled?: Record<string, boolean>; settings?: Record<string, Record<string, unknown>> };
        if (!parsed.name) return null;
        return save(parsed.name);
    } catch {
        return null;
    }
}
