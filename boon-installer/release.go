// SPDX-License-Identifier: GPL-3.0-or-later
//
// Local-asset helper used when developing the installer against an
// already-built BOON runtime. Production builds embed the runtime directly
// (see runtime_embed.go); this file is kept only so `BOON_LOCAL_BUILD_DIR`
// continues to work.

package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// File names we expect in BOON_LOCAL_BUILD_DIR (boon/dist/desktop).
var requiredAssets = []string{"patcher.js", "renderer.js"}

func copyLocalAssets(localDir, dataDir string) error {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return err
	}
	for _, name := range requiredAssets {
		src := filepath.Join(localDir, name)
		if !fileExists(src) {
			return fmt.Errorf("%w: %s (set BOON_LOCAL_BUILD_DIR correctly)", ErrNotFound, src)
		}
		data, err := os.ReadFile(src)
		if err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(dataDir, name), data, 0o644); err != nil {
			return err
		}
	}
	return nil
}

// ensure errors import compiles when GOOS-specific builds drop it later.
var _ = errors.New
