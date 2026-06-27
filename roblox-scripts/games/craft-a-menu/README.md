# Craft a Menu — Auto-Farm

Auto-farm script for [Craft a Menu](https://www.roblox.com/games/119569506060933) (Goofy Recipes).
Tested target: **Potassium** executor (full UNC/SUNC), also works on any executor
that supports `game:HttpGet` + Rayfield (Synapse Z, Delta, Krnl, Wave, etc.).

## Loadstring

```lua
loadstring(game:HttpGet("https://raw.githubusercontent.com/alitravians/Ali/main/roblox-scripts/games/craft-a-menu/loader.lua"))()
```

## Features

**Auto-Farm tab**
- Auto Open Crates — opens ingredient crates on the conveyor belt (ProximityPrompt + ClickDetector).
- Auto Make Food — cooks/levels recipes at the oven (prompts, clicks, or the `E` keybind fallback).
- Auto Collect Money / Rewards.
- Auto Sell / Serve Customers.
- Run ALL once — single manual pass of every nearby prompt/click.

**Settings tab**
- Prompt Radius (0 = whole map), Action Delay (rate limit), Loop Delay.
- Anti-AFK, Rejoin Server.

**Calibrate tab**
- Dump Remotes & Prompts to `CraftAMenu_dump.txt` + clipboard, or print to console.
  Use this to fine-tune the keyword lists if a game update moves things around.

## How it works

Craft a Menu is server-authoritative, so money/recipes can't be faked client-side.
The script farms by driving the same actions a player would: firing the crate/oven
ProximityPrompts + ClickDetectors and matching RemoteEvents. Everything is detected
**generically by name/type** (so it survives small updates) and every executor call is
wrapped in `pcall` and rate-limited.

## Notes

- All executor functions (`fireproximityprompt`, `fireclickdetector`, `getgenv`,
  `writefile`, `setclipboard`) are feature-checked — missing ones degrade gracefully.
- Thread identity is elevated to 8 on load so the Rayfield UI mounts reliably.
- Config is saved per-game via Rayfield (`CraftAMenu` folder).
