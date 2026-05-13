// SPDX-License-Identifier: GPL-3.0-or-later
//
// Downloads BOON's desktop runtime assets (patcher.js, renderer.js) from
// GitHub Releases. Only the latest release is considered.

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// The Ali repo hosts many sub-projects, so we list all recent releases and
// filter by tag prefix rather than using `/releases/latest`.
const ReleaseAPIURL = "https://api.github.com/repos/alitravians/Ali/releases?per_page=30"

// Tag prefix used for BOON releases (set by .github/workflows/boon-release.yml).
const ReleaseTagPrefix = "boon-v"

// File names we expect to see attached to a BOON release.
var requiredAssets = []string{"patcher.js", "renderer.js"}

type ghAsset struct {
	Name string `json:"name"`
	URL  string `json:"browser_download_url"`
}

type ghRelease struct {
	TagName    string    `json:"tag_name"`
	Draft      bool      `json:"draft"`
	Prerelease bool      `json:"prerelease"`
	Assets     []ghAsset `json:"assets"`
}

func (r *ghRelease) isBoon() bool {
	return !r.Draft && !r.Prerelease && len(r.TagName) > len(ReleaseTagPrefix) &&
		r.TagName[:len(ReleaseTagPrefix)] == ReleaseTagPrefix
}

// DownloadLatestAssets fetches the latest BOON release from GitHub and writes
// the runtime files (patcher.js, renderer.js) into `dataDir`. Returns the
// release tag on success.
//
// When `localOverrideDir` is non-empty, copies the files from there instead of
// downloading. Used by `BOON_LOCAL_BUILD_DIR=/path/to/boon/dist/desktop` for
// development and by CI smoke-tests.
func DownloadLatestAssets(dataDir string) (string, error) {
	if local := os.Getenv("BOON_LOCAL_BUILD_DIR"); local != "" {
		return "local:" + local, copyLocalAssets(local, dataDir)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", ReleaseAPIURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "BOON-Installer/"+Version)
	req.Header.Set("Accept", "application/vnd.github+json")
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("fetch release: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("github returned status %d", resp.StatusCode)
	}

	var releases []ghRelease
	if err := json.NewDecoder(resp.Body).Decode(&releases); err != nil {
		return "", fmt.Errorf("decode releases: %w", err)
	}

	var rel *ghRelease
	for i := range releases {
		if releases[i].isBoon() {
			rel = &releases[i]
			break
		}
	}
	if rel == nil {
		return "", fmt.Errorf("no BOON release found (looked for tag prefix %q)", ReleaseTagPrefix)
	}

	got := map[string]bool{}
	for _, a := range rel.Assets {
		for _, want := range requiredAssets {
			if a.Name == want {
				if err := downloadFile(client, a.URL, filepath.Join(dataDir, want)); err != nil {
					return "", err
				}
				got[want] = true
			}
		}
	}
	for _, w := range requiredAssets {
		if !got[w] {
			return "", fmt.Errorf("required asset %q missing from release %s — please open an issue", w, rel.TagName)
		}
	}
	return rel.TagName, nil
}

func downloadFile(c *http.Client, url, dest string) error {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "BOON-Installer/"+Version)
	resp, err := c.Do(req)
	if err != nil {
		return fmt.Errorf("download %s: %w", url, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("download %s: status %d", url, resp.StatusCode)
	}
	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return err
	}
	f, err := os.OpenFile(dest, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	if _, err := io.Copy(f, resp.Body); err != nil {
		return err
	}
	return nil
}

func copyLocalAssets(localDir, dataDir string) error {
	for _, name := range requiredAssets {
		src := filepath.Join(localDir, name)
		if !fileExists(src) {
			return fmt.Errorf("%w: %s (set BOON_LOCAL_BUILD_DIR correctly)", ErrNotFound, src)
		}
		data, err := os.ReadFile(src)
		if err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(dataDir, name), data, 0o644); err != nil {
			return err
		}
	}
	return nil
}

// ensure errors import compiles when GOOS-specific builds drop it later.
var _ = errors.New
