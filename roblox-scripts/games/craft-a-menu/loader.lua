-- Craft a Menu | Auto-Farm loader
-- PlaceId 119569506060933 (Goofy Recipes)
-- Always fetches the latest main.lua from the default (`arabic-localization`) branch.
-- Usage (paste in your executor):
--   loadstring(game:HttpGet("https://raw.githubusercontent.com/alitravians/Ali/arabic-localization/roblox-scripts/games/craft-a-menu/loader.lua"))()

local RAW = "https://raw.githubusercontent.com/alitravians/Ali/arabic-localization/roblox-scripts/games/craft-a-menu/main.lua"

local ok, err = pcall(function()
    loadstring(game:HttpGet(RAW))()
end)

if not ok then
    warn("[CraftAMenu] Failed to load main.lua: " .. tostring(err))
    -- Surface the error to the user if Rayfield never loaded.
    pcall(function()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = "Craft a Menu Auto-Farm",
            Text = "Load failed: " .. tostring(err),
            Duration = 8,
        })
    end)
end
