# Test Report — Admin Grant/Revoke Game Pass (PR #233)

**How I tested:** Ran the **real** server functions (extracted verbatim from
`src/CinemaServices.server.lua`, lines 452-464 + 573-790) inside the standalone `luau`
runtime against mocked Roblox services (DataStore / Players / MarketplaceService).
Live in-game testing is the user's step (Roblox Studio is Windows/macOS-only; this box is Linux).

**Result: 36/36 logic checks passed (exit 0). CI on PR #233: 7/7 green.**

![test results](https://app.devin.ai/attachments/54eba991-e056-4080-a338-64a338d3ed9e6/admin_grant_test_results.png)
<!-- evidence image: docs/admin_grant_test_results.png -->


## Assertions
- T1 Grant to online player → persisted to DataStore, neon effect applied, perks refreshed, **no "buyer" achievement** — passed
- T2 Granting same pass twice is idempotent (2nd returns false, no double write) — passed
- T3 Granting `speed` sets default speed 24 and invokes `applySpeed`, no "buyer" — passed
- T4 Invalid pass key rejected, nothing stored — passed
- T5 Revoke when player **also owns from store** → grant removed but store effect preserved — passed
- T6 Revoke a pure admin grant (not store-owned) → effect removed — passed
- T7 Revoke while Marketplace ownership check **fails (network)** → effect preserved (no wrongful strip) — passed
- T8 Gifted while **offline**, then joins → grant reapplied, **no "buyer" on rejoin** — passed
- T9 CONTROL: real marketplace purchase on join → "buyer" **is** awarded (proves test distinguishes gift vs purchase) — passed
- T10 Cache hygiene: offline player's grants read fresh from DataStore (no stale cache) — passed

## Caveats / not covered here
- This validates **server logic only**. It does NOT exercise the live admin-panel UI, the
  `RemoteEvent` wiring (`grantPass`/`revokePass` commands), or the client `passesPrompt`
  3-state buttons (🎁 إهداء / ✔️ مُشتراة / 🗑️ سحب). Those require live Studio/game testing by the user.
- DataStore/Marketplace are mocked; real network behavior, throttling, and cross-server
  propagation timing are not reproduced.

## Run
```
cat h_preamble.lua h_passdefs.lua h_funcs.lua h_driver.lua > harness.lua
luau harness.lua   # -> RESULT: 36/36 checks passed, 0 failed
```
