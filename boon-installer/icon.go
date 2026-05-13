// SPDX-License-Identifier: GPL-3.0-or-later
//
// BOON logomark embedding.
//
// The PNG variants in `assets/` are embedded directly into the installer
// binary so the GUI can call `MasterWindow.SetIcon` without depending on
// external files. The 256×256 variant is the master copy and the smaller
// sizes are kept for crisp downscaling on Linux/macOS title bars and
// taskbars.

package main

import (
	"bytes"
	_ "embed"
	"image"
	_ "image/png"
)

//go:embed assets/logo-16.png
var logoPNG16 []byte

//go:embed assets/logo-32.png
var logoPNG32 []byte

//go:embed assets/logo-48.png
var logoPNG48 []byte

//go:embed assets/logo-64.png
var logoPNG64 []byte

//go:embed assets/logo-128.png
var logoPNG128 []byte

//go:embed assets/logo-256.png
var logoPNG256 []byte

// LogoImages returns the embedded BOON logomark at a range of resolutions
// for window managers / docks to choose from. Decode errors are swallowed
// (we fall back to giu's default icon if decoding fails for any reason —
// not worth crashing the installer over).
func LogoImages() []image.Image {
	raws := [][]byte{logoPNG16, logoPNG32, logoPNG48, logoPNG64, logoPNG128, logoPNG256}
	out := make([]image.Image, 0, len(raws))
	for _, b := range raws {
		img, _, err := image.Decode(bytes.NewReader(b))
		if err != nil {
			continue
		}
		out = append(out, img)
	}
	return out
}
