/*
 * alitravians — version constant
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Single source of truth for the alitravians version string. Imported by
 * `core/index.ts` (re-exported as `VERSION`) and by `core/ui.ts` so the
 * panel header / settings tab always show the same number that the
 * patcher logs at boot.
 *
 * Keep this file dependency-free: importing anything else creates a
 * cycle with `index.ts` (which imports the rest of core).
 */

export const VERSION = "0.7.7";
