// SPDX-License-Identifier: GPL-3.0-or-later
package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
)

// DiscordInstall describes one detected Discord install on the user's machine.
type DiscordInstall struct {
	Branch       string // "Discord", "DiscordCanary", "DiscordPTB", "DiscordDevelopment"
	BasePath     string // top-level Discord folder
	AppPath      string // .../resources or .../app folder that contains app.asar
	OrigAsarPath string // .../app.asar (vanilla)
	BackupPath   string // .../_app.asar (set after patching)
	Patched      bool
}

// FindDiscordInstalls scans the OS for known Discord install locations and
// returns the ones whose `app.asar` file (or already-renamed `_app.asar`)
// exists.
func FindDiscordInstalls() ([]*DiscordInstall, error) {
	var raw []*DiscordInstall
	switch runtime.GOOS {
	case "windows":
		raw = findDiscordWindows()
	case "darwin":
		raw = findDiscordDarwin()
	case "linux":
		raw = findDiscordLinux()
	default:
		return nil, fmt.Errorf("unsupported OS: %s", runtime.GOOS)
	}
	// Deduplicate by AppPath and confirm the asar files actually exist.
	seen := map[string]bool{}
	out := raw[:0]
	for _, ins := range raw {
		if ins == nil || ins.AppPath == "" {
			continue
		}
		if seen[ins.AppPath] {
			continue
		}
		seen[ins.AppPath] = true

		ins.OrigAsarPath = filepath.Join(ins.AppPath, "app.asar")
		ins.BackupPath = filepath.Join(ins.AppPath, "_app.asar")
		switch {
		case fileExists(ins.BackupPath):
			ins.Patched = true
			out = append(out, ins)
		case fileExists(ins.OrigAsarPath):
			ins.Patched = false
			out = append(out, ins)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Branch < out[j].Branch })
	if len(out) == 0 {
		return nil, errors.New("no Discord install found")
	}
	return out, nil
}

func findDiscordWindows() []*DiscordInstall {
	var out []*DiscordInstall
	roots := []string{
		os.Getenv("LOCALAPPDATA"),
		os.Getenv("PROGRAMDATA"),
	}
	branches := []string{"Discord", "DiscordCanary", "DiscordPTB", "DiscordDevelopment"}
	for _, root := range roots {
		if root == "" {
			continue
		}
		for _, b := range branches {
			base := filepath.Join(root, b)
			if !dirExists(base) {
				continue
			}
			appDir := latestAppDir(base)
			if appDir == "" {
				continue
			}
			out = append(out, &DiscordInstall{
				Branch:   b,
				BasePath: base,
				AppPath:  filepath.Join(appDir, "resources"),
			})
		}
	}
	return out
}

// latestAppDir returns the highest-versioned `app-*` subdirectory under base
// (Windows Discord installs each update under `app-x.y.z`).
func latestAppDir(base string) string {
	ents, err := os.ReadDir(base)
	if err != nil {
		return ""
	}
	var candidates []string
	for _, e := range ents {
		if e.IsDir() && strings.HasPrefix(e.Name(), "app-") {
			candidates = append(candidates, e.Name())
		}
	}
	if len(candidates) == 0 {
		return ""
	}
	sort.Strings(candidates)
	return filepath.Join(base, candidates[len(candidates)-1])
}

func findDiscordDarwin() []*DiscordInstall {
	var out []*DiscordInstall
	branches := map[string]string{
		"Discord":            "/Applications/Discord.app",
		"DiscordCanary":      "/Applications/Discord Canary.app",
		"DiscordPTB":         "/Applications/Discord PTB.app",
		"DiscordDevelopment": "/Applications/Discord Development.app",
	}
	for branch, base := range branches {
		if !dirExists(base) {
			continue
		}
		out = append(out, &DiscordInstall{
			Branch:   branch,
			BasePath: base,
			AppPath:  filepath.Join(base, "Contents", "Resources"),
		})
	}
	return out
}

func findDiscordLinux() []*DiscordInstall {
	var out []*DiscordInstall
	home, _ := os.UserHomeDir()

	// Layout A: system-wide installs (root or distro package) — app.asar lives
	// directly under <base>/resources/.
	staticBranches := []struct {
		branch string
		dirs   []string
	}{
		{"Discord", []string{
			"/opt/discord", "/opt/Discord", "/usr/lib/discord", "/usr/share/discord",
			filepath.Join(home, ".local/share/Discord"),
		}},
		{"DiscordCanary", []string{
			"/opt/discord-canary", "/usr/lib/discord-canary",
			"/usr/share/discord-canary",
		}},
		{"DiscordPTB", []string{
			"/opt/discord-ptb", "/usr/lib/discord-ptb",
			"/usr/share/discord-ptb",
		}},
	}
	for _, b := range staticBranches {
		for _, base := range b.dirs {
			if !dirExists(base) {
				continue
			}
			out = append(out, &DiscordInstall{
				Branch:   b.branch,
				BasePath: base,
				AppPath:  filepath.Join(base, "resources"),
			})
		}
	}

	// Layout B: Discord's self-updating per-user install. The official .deb
	// ships a tiny launcher that downloads each release into
	//   ~/.config/discord/app-<version>/resources/app.asar
	// and replaces the symlink in ~/.config/discord/Discord on update. PTB,
	// Canary and Development follow the same pattern under their own dirs.
	if home != "" {
		selfUpdating := map[string]string{
			"Discord":            filepath.Join(home, ".config/discord"),
			"DiscordPTB":         filepath.Join(home, ".config/discordptb"),
			"DiscordCanary":      filepath.Join(home, ".config/discordcanary"),
			"DiscordDevelopment": filepath.Join(home, ".config/discorddevelopment"),
		}
		for branch, base := range selfUpdating {
			if !dirExists(base) {
				continue
			}
			appDir := latestAppDir(base)
			if appDir == "" {
				continue
			}
			out = append(out, &DiscordInstall{
				Branch:   branch,
				BasePath: base,
				AppPath:  filepath.Join(appDir, "resources"),
			})
		}
	}

	// Layout C: Flatpak — distributed by the community, app.asar lives inside
	// the flatpak data dir rather than under /var/lib/flatpak. PTB/Canary
	// flatpaks use the same scheme under different app-ids.
	if home != "" {
		flatpaks := map[string]string{
			"Discord (Flatpak)":       "com.discordapp.Discord",
			"DiscordPTB (Flatpak)":    "com.discordapp.DiscordPTB",
			"DiscordCanary (Flatpak)": "com.discordapp.DiscordCanary",
		}
		for branch, appID := range flatpaks {
			flatpakRoot := filepath.Join(home, ".var/app", appID, "data/discord")
			if dirExists(flatpakRoot) {
				out = append(out, &DiscordInstall{
					Branch:   branch,
					BasePath: flatpakRoot,
					AppPath:  filepath.Join(flatpakRoot, "resources"),
				})
			}
		}
	}
	return out
}
