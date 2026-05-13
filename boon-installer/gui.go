// SPDX-License-Identifier: GPL-3.0-or-later
//
// BOON Desktop Installer — GUI window (Vencord-style).
//
// Renders a single window with the list of detected Discord installs and
// three big buttons: Install, Repair, Uninstall. Auto-closes Discord before
// patching and auto-relaunches it on success.
//
// Adapted from VencordInstaller (GPL-3.0) — same widget toolkit (giu /
// imgui-go) but BOON branding, Arabic labels, and embedded runtime instead
// of GitHub downloads.

//go:build !cliOnly

package main

import (
	"image/color"
	"runtime"

	g "github.com/AllenDang/giu"
)

// Colour palette — BOON cyber-green primary with red destructive and yellow
// warning matching Vencord's familiar layout.
var (
	BoonGreen  = color.RGBA{R: 0x00, G: 0xFF, B: 0x88, A: 0xFF}
	BoonDark   = color.RGBA{R: 0x0A, G: 0x1F, B: 0x10, A: 0xFF}
	BoonRed    = color.RGBA{R: 0xEC, G: 0x41, B: 0x44, A: 0xFF}
	BoonBlue   = color.RGBA{R: 0x58, G: 0x65, B: 0xF2, A: 0xFF}
	BoonYellow = color.RGBA{R: 0xFE, G: 0xE7, B: 0x5C, A: 0xFF}
)

var (
	installs    []*DiscordInstall
	radioIdx    int
	statusTitle string
	statusBody  string

	win     *g.MasterWindow
	dataDir string
)

func runGUI() {
	dir, err := EnsureDataDir("")
	if err != nil {
		// Fall back to CLI so the user at least sees the error text.
		fail("data dir:", err)
	}
	dataDir = dir

	refreshInstalls()

	win = g.NewMasterWindow("BOON Installer", 1100, 720, 0)
	win.Run(guiLoop)
}

func refreshInstalls() {
	list, _ := FindDiscordInstalls()
	installs = list
	if radioIdx >= len(installs) {
		radioIdx = 0
	}
}

func showModal(title, body string) {
	statusTitle = title
	statusBody = body
	g.OpenPopup("#boon-status")
}

func currentInstall() *DiscordInstall {
	if radioIdx < 0 || radioIdx >= len(installs) {
		return nil
	}
	return installs[radioIdx]
}

// performAction runs Install / Repair / Uninstall on the currently selected
// Discord install. Discord is killed first and (on success) relaunched.
func performAction(action string) {
	ins := currentInstall()
	if ins == nil {
		showModal("No Discord selected", "Pick a Discord branch from the list first.")
		return
	}
	KillDiscord(ins.Branch)

	var err error
	switch action {
	case "patch":
		err = PatchInstall(ins, dataDir)
	case "repair":
		// Repair == force-rewrite the stub + runtime even if already patched.
		err = PatchInstall(ins, dataDir)
	case "unpatch":
		if !ins.Patched {
			showModal("Nothing to do", "This Discord install is not patched yet.")
			return
		}
		err = UnpatchInstall(ins)
	}

	if err != nil {
		showModal("Action failed: "+action, err.Error())
		refreshInstalls()
		return
	}

	// Auto-relaunch Discord so the user sees the result immediately.
	_ = LaunchDiscord(ins)

	switch action {
	case "patch":
		showModal("BOON installed", "BOON has been installed on "+ins.Branch+". Discord is restarting — open User Settings and you will see the BOON section.")
	case "repair":
		showModal("BOON repaired", "Refreshed BOON files on "+ins.Branch+" and restarted Discord.")
	case "unpatch":
		showModal("BOON removed", "BOON has been removed from "+ins.Branch+". Discord is back to stock.")
	}
	refreshInstalls()
}

// guiLoop is called every frame by giu. It rebuilds the entire window.
func guiLoop() {
	g.PushWindowPadding(36, 28)
	g.SingleWindow().Layout(buildLayout()...)
	g.PopStyle()
}

func buildLayout() g.Layout {
	wF, _ := win.GetSize()
	w := float32(wF) - 80

	return g.Layout{
		// --- Header -----------------------------------------------------
		g.Align(g.AlignCenter).To(
			g.Style().SetFontSize(36).SetColor(g.StyleColorText, BoonGreen).To(
				g.Label("BOON Installer"),
			),
		),
		g.Dummy(0, 6),
		g.Align(g.AlignCenter).To(
			g.Style().SetFontSize(16).To(
				g.Label("v"+Version+" — injects BOON directly into Discord User Settings"),
			),
		),
		g.Dummy(0, 14),

		// --- Data dir ---------------------------------------------------
		g.Style().SetFontSize(15).To(
			g.Row(
				g.Label("BOON files are stored at: "+dataDir),
				g.Style().
					SetColor(g.StyleColorButton, BoonBlue).
					SetStyle(g.StyleVarFramePadding, 6, 4).
					To(
						g.Button("Open").OnClick(func() {
							g.OpenURL("file://" + dataDir)
						}),
					),
			),
		),
		g.Dummy(0, 4),

		// --- Branch list ------------------------------------------------
		g.Separator(),
		g.Dummy(0, 8),
		g.Style().SetFontSize(22).To(
			g.Label("Please select an install to patch:"),
		),
		buildInstallsList(),
		g.Dummy(0, 12),

		// --- Action buttons --------------------------------------------
		g.Style().SetFontSize(20).To(
			g.Row(
				g.Style().SetColor(g.StyleColorButton, BoonGreen).
					SetColor(g.StyleColorText, BoonDark).
					To(
						g.Button("Install").
							OnClick(func() { performAction("patch") }).
							Size((w-30)/3, 56),
					),
				g.Style().SetColor(g.StyleColorButton, BoonBlue).
					To(
						g.Button("Repair / Reinstall").
							OnClick(func() { performAction("repair") }).
							Size((w-30)/3, 56),
					),
				g.Style().SetColor(g.StyleColorButton, BoonRed).
					To(
						g.Button("Uninstall").
							OnClick(func() { performAction("unpatch") }).
							Size((w-30)/3, 56),
					),
			),
		),

		g.Dummy(0, 16),

		// --- Footer & refresh ------------------------------------------
		g.Row(
			g.Style().SetColor(g.StyleColorButton, BoonBlue).
				SetStyle(g.StyleVarFramePadding, 8, 6).
				To(
					g.Button("Refresh detected Discord").OnClick(refreshInstalls),
				),
			g.Label("OS: "+runtime.GOOS+"/"+runtime.GOARCH),
		),

		// --- Status modal ----------------------------------------------
		buildStatusModal(),
	}
}

func buildInstallsList() g.Widget {
	if len(installs) == 0 {
		return g.Style().SetColor(g.StyleColorText, BoonYellow).To(
			g.Label("No Discord installs detected on this machine.\nInstall Discord from https://discord.com/download then click Refresh."),
		)
	}
	widgets := g.Layout{}
	for i, ins := range installs {
		i, ins := i, ins
		label := ins.Branch + " — " + ins.BasePath
		if ins.Patched {
			label += "   [PATCHED by BOON]"
		} else {
			label += "   [vanilla]"
		}
		widgets = append(widgets,
			g.Style().SetFontSize(18).To(
				g.RadioButton(label, radioIdx == i).
					OnChange(func() { radioIdx = i }),
			),
		)
	}
	return widgets
}

func buildStatusModal() g.Widget {
	return g.Style().
		SetStyle(g.StyleVarWindowPadding, 28, 24).
		SetStyleFloat(g.StyleVarWindowRounding, 10).
		To(
			g.PopupModal("#boon-status").
				Flags(g.WindowFlagsAlwaysAutoResize).
				Layout(
					g.Align(g.AlignCenter).To(
						g.Style().SetFontSize(26).SetColor(g.StyleColorText, BoonGreen).To(
							g.Label(statusTitle),
						),
						g.Dummy(0, 10),
						g.Style().SetFontSize(16).To(
							g.Label(statusBody).Wrapped(true),
						),
						g.Dummy(0, 16),
						g.Style().SetColor(g.StyleColorButton, BoonGreen).
							SetColor(g.StyleColorText, BoonDark).
							To(
								g.Button("OK").
									Size(120, 36).
									OnClick(func() { g.CloseCurrentPopup() }),
							),
					),
				),
		)
}
