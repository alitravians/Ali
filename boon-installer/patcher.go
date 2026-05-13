// SPDX-License-Identifier: GPL-3.0-or-later
//
// Patch / unpatch logic for one Discord install.

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// PatchInstall installs BOON into a single Discord branch.
//
// Steps:
//  1. Ensure BOON's runtime files (patcher.js, renderer.js) are present in
//     dataDir. Download from GitHub Releases if missing.
//  2. Rename Discord's `app.asar` -> `_app.asar` (backup).
//  3. Write a fresh stub `app.asar` whose `index.js` requires our patcher.
func PatchInstall(ins *DiscordInstall, dataDir string) error {
	if err := ensureRuntime(dataDir); err != nil {
		return err
	}
	patcherPath := filepath.Join(dataDir, "patcher.js")
	if !fileExists(patcherPath) {
		return fmt.Errorf("patcher.js missing at %s after download", patcherPath)
	}

	if ins.Patched {
		// Already patched — refresh the stub asar so a runtime path change
		// (e.g. user moved BOON data dir) is picked up.
		if err := writeStub(ins.OrigAsarPath, patcherPath); err != nil {
			return err
		}
		return nil
	}

	// Backup the vanilla asar (skip if backup already exists for safety).
	if !fileExists(ins.BackupPath) {
		if err := os.Rename(ins.OrigAsarPath, ins.BackupPath); err != nil {
			return fmt.Errorf("rename app.asar -> _app.asar: %w", err)
		}
	}

	// Some Discord branches also have `app.asar.unpacked` next to it. Rename
	// it too so paths resolve consistently after the swap.
	unpacked := ins.OrigAsarPath + ".unpacked"
	unpackedBak := ins.BackupPath + ".unpacked"
	if dirExists(unpacked) && !dirExists(unpackedBak) {
		_ = os.Rename(unpacked, unpackedBak)
	}

	if err := writeStub(ins.OrigAsarPath, patcherPath); err != nil {
		// Best-effort rollback of the backup rename.
		_ = os.Rename(ins.BackupPath, ins.OrigAsarPath)
		_ = os.Rename(unpackedBak, unpacked)
		return fmt.Errorf("write stub asar: %w", err)
	}

	ins.Patched = true
	return nil
}

// UnpatchInstall removes BOON from a single Discord branch.
func UnpatchInstall(ins *DiscordInstall) error {
	if !ins.Patched {
		return errors.New("not patched — nothing to undo")
	}
	// Remove our stub asar
	if fileExists(ins.OrigAsarPath) {
		if err := os.Remove(ins.OrigAsarPath); err != nil {
			return fmt.Errorf("remove stub app.asar: %w", err)
		}
	}
	// Restore the vanilla one
	if err := os.Rename(ins.BackupPath, ins.OrigAsarPath); err != nil {
		return fmt.Errorf("rename _app.asar -> app.asar: %w", err)
	}
	// Restore unpacked dir if present
	unpacked := ins.OrigAsarPath + ".unpacked"
	unpackedBak := ins.BackupPath + ".unpacked"
	if dirExists(unpackedBak) && !dirExists(unpacked) {
		_ = os.Rename(unpackedBak, unpacked)
	}
	ins.Patched = false
	return nil
}

// ensureRuntime makes sure patcher.js and renderer.js are present in dataDir,
// downloading the latest GitHub release otherwise.
func ensureRuntime(dataDir string) error {
	patcher := filepath.Join(dataDir, "patcher.js")
	renderer := filepath.Join(dataDir, "renderer.js")
	if fileExists(patcher) && fileExists(renderer) {
		return nil
	}
	tag, err := DownloadLatestAssets(dataDir)
	if err != nil {
		return fmt.Errorf("download runtime: %w", err)
	}
	fmt.Println("    downloaded BOON runtime", tag)
	return nil
}

// writeStub writes a new app.asar containing an index.js that require()s the
// given absolute patcherPath. The patcherPath is JSON-encoded so that
// backslashes on Windows are escaped correctly.
func writeStub(outAsarPath, patcherPath string) error {
	patcherJSON, err := json.Marshal(patcherPath)
	if err != nil {
		return err
	}
	indexJS := "require(" + string(patcherJSON) + ");\n"
	if err := WriteStubAsar(outAsarPath, indexJS); err != nil {
		return err
	}
	// Defensive: confirm the file is at least bigger than the asar header.
	st, err := os.Stat(outAsarPath)
	if err != nil {
		return err
	}
	if st.Size() < 64 {
		return fmt.Errorf("stub asar suspiciously small (%d bytes)", st.Size())
	}
	return nil
}

// ensure strings import compiles even if all callers are removed.
var _ = strings.TrimSpace
