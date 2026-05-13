// SPDX-License-Identifier: GPL-3.0-or-later
package main

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"runtime"
)

// EnsureDataDir resolves the on-disk location where alitravians stores its
// desktop runtime files (patcher.js, renderer.js, downloaded assets) and
// creates it if missing. Returns the absolute path.
//
// Resolution precedence:
//  1. Explicit -data-dir flag.
//  2. New ALITRAVIANS_DATA_DIR env var.
//  3. Legacy BOON_DATA_DIR env var (kept for backwards compat).
//  4. Per-user config dir + "alitravians" subfolder.
//
// When the new default dir is missing and a legacy `BOON` folder exists at
// the same parent, we migrate it once so users upgrading from <= v0.1.5
// keep their state.json + any locally downloaded renderer.
func EnsureDataDir(override string) (string, error) {
	var dir string
	switch {
	case override != "":
		dir = override
	case os.Getenv("ALITRAVIANS_DATA_DIR") != "":
		dir = os.Getenv("ALITRAVIANS_DATA_DIR")
	case os.Getenv("BOON_DATA_DIR") != "":
		dir = os.Getenv("BOON_DATA_DIR")
	default:
		base, err := userConfigDir()
		if err != nil {
			return "", err
		}
		dir = filepath.Join(base, "alitravians")
		// One-shot migration from the legacy BOON folder. We only do this
		// when the user has NOT yet created an alitravians folder so we
		// never clobber a fresh install.
		legacy := filepath.Join(base, "BOON")
		if !dirExists(dir) && dirExists(legacy) {
			if err := migrateDir(legacy, dir); err != nil {
				// Migration is best-effort. If it fails, fall back to the
				// new empty dir — the installer will then write fresh
				// runtime files into it and the user is no worse off than
				// a clean install.
				_ = err
			}
		}
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

func userConfigDir() (string, error) {
	if d, err := os.UserConfigDir(); err == nil {
		return d, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	switch runtime.GOOS {
	case "windows":
		if d := os.Getenv("APPDATA"); d != "" {
			return d, nil
		}
		return filepath.Join(home, "AppData", "Roaming"), nil
	case "darwin":
		return filepath.Join(home, "Library", "Application Support"), nil
	default:
		return filepath.Join(home, ".config"), nil
	}
}

// fileExists reports whether path exists as a regular file.
func fileExists(path string) bool {
	st, err := os.Stat(path)
	return err == nil && !st.IsDir()
}

// dirExists reports whether path exists as a directory.
func dirExists(path string) bool {
	st, err := os.Stat(path)
	return err == nil && st.IsDir()
}

// migrateDir copies the contents of src into a freshly-created dst dir.
// We deliberately COPY (not rename) because the legacy `BOON` folder may
// still be referenced by the old patched asar stub on disk — destroying it
// would break a Discord install the user has not yet re-patched. The old
// folder stays as a fossil; the installer will retire it on next patch
// when it overwrites the asar stub with the new dataDir path.
func migrateDir(src, dst string) error {
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}
	for _, e := range entries {
		if e.IsDir() {
			// We don't currently nest dirs under the data folder; skip to
			// keep the migration trivially safe.
			continue
		}
		srcPath := filepath.Join(src, e.Name())
		dstPath := filepath.Join(dst, e.Name())
		if err := copyFile(srcPath, dstPath); err != nil {
			return err
		}
	}
	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	return out.Sync()
}

// ErrNotFound is returned when a file/path we expect is missing.
var ErrNotFound = errors.New("not found")
