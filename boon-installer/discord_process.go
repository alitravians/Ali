// SPDX-License-Identifier: GPL-3.0-or-later
//
// Cross-platform Discord process control. Lets the installer:
//   1. Kill a running Discord before swapping app.asar (so Windows doesn't
//      throw ERROR_SHARING_VIOLATION when we rename the file).
//   2. Relaunch Discord after the patch is written, so the user sees BOON
//      immediately without any manual steps.
//
// All commands are best-effort: an installer that can't relaunch Discord is
// still successful from the patching point of view.

package main

import (
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// processNames returns the OS-specific executable names to terminate for a
// given Discord branch (Discord/DiscordPTB/DiscordCanary/DiscordDevelopment).
func processNames(branch string) []string {
	switch runtime.GOOS {
	case "windows":
		// `taskkill /IM` is case-insensitive and matches process image name.
		return []string{branch + ".exe"}
	case "darwin":
		// `pkill -x` is exact match; macOS Discord runs as "Discord Helper",
		// "Discord Helper (GPU)" etc — kill the parent only.
		switch branch {
		case "Discord":
			return []string{"Discord"}
		case "DiscordCanary":
			return []string{"Discord Canary"}
		case "DiscordPTB":
			return []string{"Discord PTB"}
		case "DiscordDevelopment":
			return []string{"Discord Development"}
		}
		return []string{branch}
	default:
		// Linux: official .deb names its binary `Discord` / `DiscordCanary`
		// (capitalised), distro packages typically lowercase. Try both.
		lower := strings.ToLower(branch)
		switch branch {
		case "Discord":
			return []string{"Discord", "discord"}
		case "DiscordCanary":
			return []string{"DiscordCanary", "discord-canary"}
		case "DiscordPTB":
			return []string{"DiscordPTB", "discord-ptb"}
		case "DiscordDevelopment":
			return []string{"DiscordDevelopment", "discord-development"}
		}
		return []string{branch, lower}
	}
}

// KillDiscord terminates any running processes for `branch`. Returns true if
// at least one process was killed, false if nothing was running. Either way,
// the caller can proceed with patching.
func KillDiscord(branch string) bool {
	killed := false
	for _, name := range processNames(branch) {
		var cmd *exec.Cmd
		switch runtime.GOOS {
		case "windows":
			cmd = exec.Command("taskkill", "/F", "/IM", name)
		case "darwin":
			cmd = exec.Command("pkill", "-x", name)
		default:
			cmd = exec.Command("pkill", "-x", name)
		}
		if err := cmd.Run(); err == nil {
			killed = true
		}
	}
	if killed {
		// Give the OS a moment to release file locks (esp. on Windows).
		time.Sleep(800 * time.Millisecond)
	}
	return killed
}

// LaunchDiscord starts Discord in the background using the install's normal
// launcher path. Returns nil on success; non-nil errors are recoverable (the
// patch itself already succeeded). Best-effort.
func LaunchDiscord(ins *DiscordInstall) error {
	switch runtime.GOOS {
	case "windows":
		return launchDiscordWindows(ins)
	case "darwin":
		return launchDiscordDarwin(ins)
	default:
		return launchDiscordLinux(ins)
	}
}

func launchDiscordWindows(ins *DiscordInstall) error {
	// Discord ships an Update.exe in its top-level folder that knows how to
	// (re)start the right `Discord*.exe` from the latest app-x.y.z subdir.
	updater := filepath.Join(ins.BasePath, "Update.exe")
	if fileExists(updater) {
		return exec.Command(updater, "--processStart", ins.Branch+".exe").Start()
	}
	// Fallback: launch the exe directly from the latest app-*/ folder.
	exe := filepath.Join(filepath.Dir(ins.AppPath), ins.Branch+".exe")
	if fileExists(exe) {
		return exec.Command(exe).Start()
	}
	return nil
}

func launchDiscordDarwin(ins *DiscordInstall) error {
	// `open` returns immediately after launching the .app bundle.
	return exec.Command("open", ins.BasePath).Start()
}

func launchDiscordLinux(ins *DiscordInstall) error {
	// Look for an executable matching the branch name next to app.asar's
	// resources/ folder, or in the BasePath itself for system installs.
	candidates := []string{
		filepath.Join(filepath.Dir(ins.AppPath), ins.Branch),
		filepath.Join(filepath.Dir(ins.AppPath), strings.ToLower(ins.Branch)),
		filepath.Join(ins.BasePath, ins.Branch),
		filepath.Join(ins.BasePath, strings.ToLower(ins.Branch)),
	}
	for _, exe := range candidates {
		if fileExists(exe) {
			cmd := exec.Command(exe)
			return cmd.Start()
		}
	}
	// Last resort: hope the binary is on $PATH under its lowercase name.
	if path, err := exec.LookPath(strings.ToLower(ins.Branch)); err == nil {
		return exec.Command(path).Start()
	}
	return nil
}
