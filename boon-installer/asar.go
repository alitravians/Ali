// SPDX-License-Identifier: GPL-3.0-or-later
//
// Minimal asar writer — enough to produce a stub `app.asar` containing two
// files: `index.js` (which `require()`s our patcher) and `package.json`. We do
// NOT read existing asar archives; that's done by Electron at runtime.
//
// Format reference: https://github.com/electron/asar
// Ported from VencordInstaller's app_asar.go (GPL-3.0).

package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

const stubPackageJSON = `{
  "name": "discord",
  "main": "index.js"
}`

type asarFile struct {
	Size   int32  `json:"size"`
	Offset string `json:"offset"`
}

type asarHeader struct {
	Files map[string]asarFile `json:"files"`
}

// WriteStubAsar produces a `.asar` archive at outPath containing:
//   - index.js (content: indexJSContent)
//   - package.json (content: stubPackageJSON)
//
// This is all that's needed for the patched Discord to boot into our patcher.
func WriteStubAsar(outPath, indexJSContent string) error {
	header := asarHeader{Files: map[string]asarFile{}}

	indexBytes := len([]byte(indexJSContent))
	header.Files["index.js"] = asarFile{
		Size:   int32(indexBytes),
		Offset: "0",
	}
	header.Files["package.json"] = asarFile{
		Size:   int32(len([]byte(stubPackageJSON))),
		Offset: strconv.Itoa(indexBytes),
	}

	headerBytes, err := json.Marshal(header)
	if err != nil {
		return err
	}
	headerStr := string(headerBytes)
	headerStrSize := uint32(len(headerStr))
	dataSize := uint32(4)
	aligned := (headerStrSize + dataSize - 1) & ^(dataSize - 1)
	headerSize := aligned + 8
	headerObjectSize := aligned + dataSize
	if diff := aligned - headerStrSize; diff > 0 {
		headerStr += strings.Repeat("\x00", int(diff))
	}

	f, err := os.Create(outPath)
	if err != nil {
		return fmt.Errorf("create %s: %w", outPath, err)
	}
	defer f.Close()

	for _, n := range []uint32{dataSize, headerSize, headerObjectSize, headerStrSize} {
		if err := binary.Write(f, binary.LittleEndian, int32(n)); err != nil {
			return fmt.Errorf("write header sizes: %w", err)
		}
	}
	if _, err := f.WriteString(headerStr); err != nil {
		return fmt.Errorf("write header: %w", err)
	}
	if _, err := f.WriteString(indexJSContent); err != nil {
		return fmt.Errorf("write index.js: %w", err)
	}
	if _, err := f.WriteString(stubPackageJSON); err != nil {
		return fmt.Errorf("write package.json: %w", err)
	}
	return nil
}
