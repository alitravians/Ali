---
name: analyzing-donation-city-luau
description: >-
  Static analysis / health-check workflow for the Donation City Roblox (Luau)
  sources under donation-city/src. Use when asked to lint, audit, do a "فحص
  دوري", or analyze the Roblox game code. Installs selene + luau-analyze and
  runs them in a way that suppresses the Roblox "unknown global" noise so the
  output is high-signal.
---

# Analyzing Donation City Luau code

The Donation City game lives in `donation-city/`. The live game scripts are in
`donation-city/src/*.lua` (also baked into `donation-city/DonationCity_FINAL.rbxlx`).

Past sessions wasted time (a) re-downloading the Luau tools every run and (b)
manually filtering thousands of `Unknown global` warnings because the tools were
not aware of the Roblox API. This skill removes both frictions.

## 1. Install the tools (idempotent)

```bash
bash .agents/skills/analyzing-donation-city-luau/setup.sh
export PATH="$HOME/.local/bin:$PATH"
```

This installs:
- **selene** (Kampfkarren) — the primary linter. It supports the Roblox standard
  library, so it does NOT spam "unknown global".
- **luau-analyze** (luau-lang) — secondary, for Luau-native lints such as
  `MisleadingAndOr` (the lint that caught the real bug fixed in PR #248).

Both binaries are git-ignored (see `donation-city/.gitignore`).

## 2. Primary lint — selene (Roblox-aware, low noise)

```bash
cd donation-city
selene src/
```

Config is committed at `donation-city/selene.toml`:
- `std = "roblox"` — selene auto-fetches & caches the Roblox std on first run
  (generates `roblox.yml`, which is git-ignored). This is why there are zero
  "unknown global" reports.
- A few lints are intentionally set to `allow` because they flag deliberate
  project patterns, NOT bugs:
  - `multiple_statements` — the codebase intentionally puts several statements on
    one line with `;`.
  - `global_usage` — the cross-script API is intentionally exposed via `_G`
    (e.g. `_G.NotifyPlayer`).
  - `roblox_manual_fromscale_or_fromoffset` — purely a `UDim2.new` style hint.

Everything else stays ON, so the output is genuinely useful: `unused_variable`,
`deprecated`, `shadowing`, `empty_if`, etc. Expect a small number (~50) of
real, low-severity warnings — review them, don't blanket-silence them.

## 3. Secondary lint — luau-analyze (logic lints)

This build of `luau-analyze` has no `--defs` flag, so it cannot be made
Roblox-aware; it will always emit `Unknown global` / `Unknown type` lines for
Roblox APIs. Filter exactly those (and nothing else) so real findings remain:

```bash
cd donation-city
luau-analyze src/ 2>&1 | grep -vE "Unknown (global|type)"
```

What's left are Luau-native diagnostics worth reading, e.g. `MisleadingAndOr`
(the `a and b or c` pitfall), unreachable code, etc.

## 4. Do NOT touch game behavior

This skill is analysis-only. The config files (`selene.toml`, `.gitignore`)
have zero effect on the running game. Never edit `donation-city/src/*.lua` or
`DonationCity_FINAL.rbxlx` as part of "analysis" — only when fixing a confirmed
bug, and always via a branch + PR (see the repo knowledge note on committing
donation-city work).
