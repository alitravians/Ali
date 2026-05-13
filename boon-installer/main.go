// BOON Desktop Installer — CLI
//
// Cross-platform tool that patches the official Discord Desktop app so BOON
// loads on startup. Architecture is adapted from VencordInstaller (GPL-3.0,
// (c) Vendicated and contributors); see LICENSE-NOTICE.md.
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

  BOON Desktop Installer  •  v%s
  Patches Discord so BOON loads on startup.
  Adapted from VencordInstaller (GPL-3.0).
`

var Version = "dev"

func main() {
	doPatch := flag.Bool("patch", false, "patch (install) BOON into all detected Discord installs")
	doUnpatch := flag.Bool("unpatch", false, "unpatch (uninstall) BOON from all detected Discord installs")
	listOnly := flag.Bool("list", false, "list detected Discord installs and exit")
	autoYes := flag.Bool("yes", false, "skip the interactive confirmation prompt")
	dataDir := flag.String("data-dir", "", "override BOON data directory (default: per-user config dir)")
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
			status = "PATCHED by BOON"
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
	fmt.Println("    [1] Patch (install BOON)")
	fmt.Println("    [2] Unpatch (remove BOON)")
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

func fail(args ...any) {
	fmt.Fprintln(os.Stderr, "[FATAL]", fmt.Sprint(args...))
	os.Exit(1)
}
