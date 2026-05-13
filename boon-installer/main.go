// SPDX-License-Identifier: GPL-3.0-or-later
//
// BOON Desktop Installer — entry point.
//
// By default we boot the GUI (Vencord-style window with Install / Repair /
// Uninstall buttons). The CLI mode (cli.go) is available via `-cli`, or by
// building with `-tags cliOnly` for a GUI-less binary on headless CI.

package main

import (
	"fmt"
	"os"
)

func main() {
	// Pre-scan args for `-cli` so a user (or scripted job) can force the
	// non-GUI flow without having a display server.
	for _, arg := range os.Args[1:] {
		if arg == "-cli" || arg == "--cli" {
			runCLI()
			return
		}
	}
	runGUI()
}

func fail(args ...any) {
	fmt.Fprintln(os.Stderr, "[FATAL]", fmt.Sprint(args...))
	os.Exit(1)
}
