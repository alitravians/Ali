--[[
    BOON Hub - Universal Loader
    Automatically detects the game and loads the appropriate script.
    
    Usage:
    loadstring(game:HttpGet("https://raw.githubusercontent.com/alitravians/Ali/arabic-localization/roblox-scripts/loader.lua"))()
]]

local REPO = "https://raw.githubusercontent.com/alitravians/Ali/arabic-localization/roblox-scripts"
local VERSION = "1.0.0"

-- Game-specific script mappings (PlaceId -> script path)
local gameScripts = {
    [109141895577255] = REPO .. "/games/code-a-business.lua",  -- Code a Business (Coding Simulator 2)
}

local placeId = game.PlaceId
local gameName = "Unknown Game"
pcall(function()
    gameName = game:GetService("MarketplaceService"):GetProductInfo(placeId).Name or "Unknown Game"
end)

print("[BOON Hub] v" .. VERSION)
print("[BOON Hub] Game: " .. gameName .. " (PlaceId: " .. tostring(placeId) .. ")")

if gameScripts[placeId] then
    print("[BOON Hub] Loading game-specific script...")
    local scriptUrl = gameScripts[placeId]
    local downloadOk, content = pcall(function()
        return game:HttpGet(scriptUrl)
    end)
    if not downloadOk or not content or content == "" then
        warn("[BOON Hub] Failed to download script from: " .. scriptUrl)
        warn("[BOON Hub] HttpGet error: " .. tostring(content))
        return
    end
    print("[BOON Hub] Downloaded " .. tostring(#content) .. " bytes")
    local fn, parseErr = loadstring(content)
    if not fn then
        warn("[BOON Hub] Script parse error: " .. tostring(parseErr))
        return
    end
    local runOk, runErr = pcall(fn)
    if not runOk then
        warn("[BOON Hub] Script runtime error: " .. tostring(runErr))
    end
else
    warn("[BOON Hub] No script available for this game (PlaceId: " .. tostring(placeId) .. ")")
end
