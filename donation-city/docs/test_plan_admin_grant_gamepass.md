# Test Plan — Admin Grant/Revoke Game Pass (PR #233)

## Why a logic harness (not live Studio)
Roblox Studio runs only on Windows/macOS; this box is Linux. So live in-game testing must be
done by the user after publishing. What CAN be verified here, deterministically, is the **server
logic** that powers the feature. We run the **real functions** extracted verbatim from
`src/CinemaServices.server.lua` against mocked Roblox services (DataStore, Players,
MarketplaceService) using the standalone `luau` runtime.

- Harness assembly: `h_preamble.lua` (mocks) + lines 452-464 (`PASS_DEFS`) + lines 573-790
  (real `grantPass`, `isValidPassKey`, `sanitizeGrants`, `readPassGrants`, `setGrant`,
  `removePassEffects`, `adminGrantPass`, `adminRevokePass`, `applyAllPasses`) + `h_driver.lua`.
- The mock DataStore copies on read/write to mimic real DataStore semantics; `UpdateAsync`
  runs the real transform closure.

## Scenarios
| # | Scenario | Expected |
|---|----------|----------|
| T1 | Admin grants pass to an online player | Persists to DataStore; effect applied; client perks refreshed; **no "buyer" achievement** |
| T2 | Grant same pass twice | Second call returns false (idempotent, no double write) |
| T3 | Grant `speed` | Session speed defaults to 24; `applySpeed` invoked; no "buyer" |
| T4 | Grant invalid key (`hacker`) | Rejected; nothing stored |
| T5 | Revoke a pass the player **also owns from the store** | Grant removed, but store-owned effect **preserved** |
| T6 | Revoke a pure admin grant (not store-owned) | Effect removed |
| T7 | Revoke while MarketplaceService ownership check **fails (network)** | Effect **preserved** (no wrongful strip) |
| T8 | Player gifted while OFFLINE, then joins (`applyAllPasses`) | Grant reapplied; **no "buyer"** awarded on rejoin |
| T9 | CONTROL: real marketplace purchase on join | Buyer achievement **IS** awarded (proves the test distinguishes gift vs purchase) |
| T10 | Cache hygiene: offline player's grants read fresh from DataStore | Externally-added grant is seen (no stale cache) |

## Run
```
cat h_preamble.lua h_passdefs.lua h_funcs.lua h_driver.lua > harness.lua
luau harness.lua
```
Pass criteria: all assertions report PASS, exit code 0.
