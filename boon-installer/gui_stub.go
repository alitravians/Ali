// SPDX-License-Identifier: GPL-3.0-or-later
//
// Compile-time stub for builds that opt out of the GUI via `-tags cliOnly`
// (e.g. headless CI sanity-check builds).

//go:build cliOnly

package main

func runGUI() {
	// Without a window toolkit linked in, just route to the CLI path.
	runCLI()
}
