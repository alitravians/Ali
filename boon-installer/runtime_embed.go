// SPDX-License-Identifier: GPL-3.0-or-later
//
// BOON runtime payload — patcher.js + renderer.js are baked directly into the
// installer binary. This replaces the previous GitHub-Releases download path,
// which suffered from API rate limits (HTTP 403) on busy users / IPs.
//
// CI copies the freshly-built files from boon/dist/desktop/ into
// boon-installer/runtime/ before running `go build`. The .gitignore in
// runtime/ keeps them out of source control.
//
// If the binary is built without those files present (e.g. local dev `go run
// .` without first building the boon package), the constants below are empty
// strings and we fall back to the BOON_LOCAL_BUILD_DIR env-var path.

package main

import (
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
)

//go:embed runtime/patcher.js
var embeddedPatcherJS []byte

//go:embed runtime/renderer.js
var embeddedRendererJS []byte

// WriteEmbeddedRuntime writes the embedded patcher.js + renderer.js into
// dataDir, overwriting any existing files. Used by both the GUI and CLI
// install paths so patched Discord instances pick up updates automatically.
func WriteEmbeddedRuntime(dataDir string) error {
	if local := os.Getenv("BOON_LOCAL_BUILD_DIR"); local != "" {
		return copyLocalAssets(local, dataDir)
	}
	if len(embeddedPatcherJS) == 0 || len(embeddedRendererJS) == 0 {
		return fmt.Errorf("embedded runtime is empty — installer was built without boon-installer/runtime/{patcher,renderer}.js")
	}
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(dataDir, "patcher.js"), embeddedPatcherJS, 0o644); err != nil {
		return fmt.Errorf("write patcher.js: %w", err)
	}
	if err := os.WriteFile(filepath.Join(dataDir, "renderer.js"), embeddedRendererJS, 0o644); err != nil {
		return fmt.Errorf("write renderer.js: %w", err)
	}
	return nil
}
