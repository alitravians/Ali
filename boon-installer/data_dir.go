// SPDX-License-Identifier: GPL-3.0-or-later
package main

import (
	"errors"
	"os"
	"path/filepath"
	"runtime"
)

// EnsureDataDir resolves the on-disk location where BOON stores its desktop
// runtime files (patcher.js, renderer.js, downloaded assets) and creates it
// if missing. Returns the absolute path.
func EnsureDataDir(override string) (string, error) {
	var dir string
	switch {
	case override != "":
		dir = override
	case os.Getenv("BOON_DATA_DIR") != "":
		dir = os.Getenv("BOON_DATA_DIR")
	default:
		base, err := userConfigDir()
		if err != nil {
			return "", err
		}
		dir = filepath.Join(base, "BOON")
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

// ErrNotFound is returned when a file/path we expect is missing.
var ErrNotFound = errors.New("not found")
