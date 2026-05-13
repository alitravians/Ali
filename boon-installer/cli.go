// BOON Desktop Installer — CLI fallback.
//
// The default build is the GUI (gui.go). Pass `-cli` on the command line to
// route to this CLI path, or build with `-tags cliOnly` for a GUI-less
// binary on headless CI.
//
// SPDX-License-Identifier: GPL-3.0-or-later
package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strings"
)

const banner = `
   ____   ____   ____   _   _
  | __ ) / __ \ / __ \ | \ | |
  |  _ \| |  | | |  | ||  \| |
  | |_) | |__| | |__| || |\  |
  |____/ \____/ \____/ |_| \_|

  alitravians Desktop Installer  •  v%s
  Patches Discord so alitravians loads on startup.
  Adapted from VencordInstaller (GPL-3.0).
`

var Version = "dev"

func runCLI() {
	doPatch := flag.Bool("patch", false, "patch (install) alitravians into all detected Discord installs")
	doUnpatch := flag.Bool("unpatch", false, "unpatch (uninstall) alitravians from all detected Discord installs")
	listOnly := flag.Bool("list", false, "list detected Discord installs and exit")
	autoYes := flag.Bool("yes", false, "skip the interactive confirmation prompt")
	dataDir := flag.String("data-dir", "", "override alitravians data directory (default: per-user config dir)")
	// -cli is consumed by main.go to route here; accept it so it does not
	// break flag parsing.
	_ = flag.Bool("cli", false, "force CLI mode (no GUI)")
	flag.Parse()

	fmt.Printf(banner, Version)

	dir, err := EnsureDataDir(*dataDir)
	if err != nil {
		fail("data dir:", err)
	}
	fmt.Println("  Data dir:", dir)
	fmt.Println()

	installs, err := FindDiscordInstalls()
	if err != nil {
		fail("scan:", err)
	}
	if len(installs) == 0 {
		fmt.Println("  No Discord installs were detected on this machine.")
		fmt.Println("  Please install Discord first from https://discord.com/download")
		os.Exit(1)
	}

	fmt.Println("  Detected Discord installs:")
	for i, ins := range installs {
		status := "vanilla"
		if ins.Patched {
			status = "PATCHED by alitravians"
		}
		fmt.Printf("    %d. %s  [%s]  →  %s\n", i+1, ins.Branch, status, ins.AppPath)
	}
	fmt.Println()

	if *listOnly {
		return
	}

	// Choose action: explicit flag, or interactive prompt
	action := ""
	switch {
	case *doPatch && *doUnpatch:
		fail("cannot use -patch and -unpatch together")
	case *doPatch:
		action = "patch"
	case *doUnpatch:
		action = "unpatch"
	default:
		action = promptAction()
	}

	if !*autoYes {
		fmt.Printf("  About to %s %d install(s). Continue? [y/N] ", action, len(installs))
		if !readYes() {
			fmt.Println("  Aborted.")
			return
		}
	}

	failures := 0
	for _, ins := range installs {
		fmt.Printf("\n  %s  %s …\n", strings.Title(action), ins.AppPath)
		// Always close Discord first so the asar rename succeeds.
		if KillDiscord(ins.Branch) {
			fmt.Println("    closed running", ins.Branch)
		}
		var err error
		if action == "patch" {
			err = PatchInstall(ins, dir)
		} else {
			err = UnpatchInstall(ins)
		}
		if err != nil {
			failures++
			fmt.Println("    [ERROR]", err)
		} else {
			fmt.Println("    OK")
			if lerr := LaunchDiscord(ins); lerr != nil {
				fmt.Println("    (could not auto-launch:", lerr, ")")
			}
		}
	}

	fmt.Println()
	if failures == 0 {
		fmt.Println("  All done. Restart Discord to apply.")
	} else {
		fmt.Printf("  Done with %d failure(s). Check the messages above.\n", failures)
		os.Exit(2)
	}
}

func promptAction() string {
	fmt.Println("  What would you like to do?")
	fmt.Println("    [1] Patch (install alitravians)")
	fmt.Println("    [2] Unpatch (remove alitravians)")
	fmt.Println("    [3] Quit")
	fmt.Print("  Choice: ")
	r := bufio.NewReader(os.Stdin)
	line, _ := r.ReadString('\n')
	switch strings.TrimSpace(line) {
	case "1":
		return "patch"
	case "2":
		return "unpatch"
	case "3":
		fmt.Println("  Bye.")
		os.Exit(0)
	}
	fmt.Println("  Invalid choice.")
	os.Exit(1)
	return ""
}

func readYes() bool {
	r := bufio.NewReader(os.Stdin)
	line, _ := r.ReadString('\n')
	t := strings.ToLower(strings.TrimSpace(line))
	return t == "y" || t == "yes"
}
