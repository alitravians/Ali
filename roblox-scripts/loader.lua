--[[
    BOON Hub - Universal Loader
    Automatically detects the game and loads the appropriate script.
    
    Usage:
    loadstring(game:HttpGet("https://raw.githubusercontent.com/alitravians/Ali/main/roblox-scripts/loader.lua"))()
]]

local REPO = "https://raw.githubusercontent.com/alitravians/Ali/main/roblox-scripts"
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
    local success, err = pcall(function()
        loadstring(game:HttpGet(gameScripts[placeId]))()
    end)
    if not success then
        warn("[BOON Hub] Failed to load game script: " .. tostring(err))
        -- Fallback to universal
        print("[BOON Hub] Falling back to universal script...")
        pcall(function()
            loadstring(game:HttpGet(REPO .. "/universal.lua"))()
        end)
    end
else
    print("[BOON Hub] No game-specific script found. Loading universal script...")
    local success, err = pcall(function()
        loadstring(game:HttpGet(REPO .. "/universal.lua"))()
    end)
    if not success then
        warn("[BOON Hub] Failed to load universal script: " .. tostring(err))
    end
end
