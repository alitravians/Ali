--[[
    BOON Hub - Code a Business (Coding Simulator 2)
    Game: https://www.roblox.com/games/109141895577255/Code-a-Business
    PlaceId: 109141895577255

    Features:
    - Auto Code (automatically writes code on your PC)
    - Auto Collect Code (collects finished code from all PCs)
    - Auto Sell (sells programs, apps, platforms)
    - Auto Mine (auto mining resources)
    - Auto Fish (auto fishing)
    - Auto Collect Meteor (collects meteors automatically)
    - Auto Collect Time Reward (claims playtime rewards)
    - Auto Buy Fish Shop (buys from fishing shop)
    - Anti-AFK
    - Speed Hack
    - Fullbright

    Loadstring:
    loadstring(game:HttpGet("https://raw.githubusercontent.com/alitravians/Ali/arabic-localization/roblox-scripts/games/code-a-business.lua"))()
]]

-- Services
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")
local VirtualUser = game:GetService("VirtualUser")
local TweenService = game:GetService("TweenService")
local ProximityPromptService = game:GetService("ProximityPromptService")

local player = Players.LocalPlayer

-- Verify game
if game.PlaceId ~= 109141895577255 then
    warn("[BOON Hub] This script is for Code a Business (Coding Simulator 2) only!")
    return
end

-- Load Rayfield UI (try direct GitHub URL first, then sirius.menu fallback)
local Rayfield
do
    local rayfieldUrls = {
        "https://raw.githubusercontent.com/SiriusSoftwareLtd/Rayfield/main/source.lua",
        "https://sirius.menu/rayfield",
    }
    for _, url in ipairs(rayfieldUrls) do
        local ok, result = pcall(function()
            return loadstring(game:HttpGet(url))()
        end)
        if ok and result then
            Rayfield = result
            break
        end
    end
    if not Rayfield then
        warn("[BOON Hub] Failed to load Rayfield UI library from all sources!")
        return
    end
end

-- State variables
local autoCodingEnabled = false
local autoCollectCodeEnabled = false
local autoSellEnabled = false
local autoMineEnabled = false
local autoFishEnabled = false
local autoMeteorEnabled = false
local autoTimeRewardEnabled = false
local autoBuyFishShopEnabled = false
local antiAfkEnabled = true
local speedEnabled = false
local fullbrightEnabled = false
local desiredSpeed = 16

local codingDelay = 0.5
local collectDelay = 1
local sellDelay = 1
local mineDelay = 0.5
local fishDelay = 1
local sellType = "Programs"

-- Generation counters to prevent concurrent loop instances
local autoCodingGen = 0
local autoCollectCodeGen = 0
local autoSellGen = 0
local autoMineGen = 0
local autoFishGen = 0
local autoMeteorGen = 0
local autoTimeRewardGen = 0
local autoBuyFishShopGen = 0

-- Utility: get character safely
local function getCharacter()
    local char = player.Character
    if not char then return nil, nil, nil end
    local humanoid = char:FindFirstChildWhichIsA("Humanoid")
    local rootPart = char:FindFirstChild("HumanoidRootPart")
    return char, humanoid, rootPart
end

-- Find remotes helper
local function findRemote(name, className)
    -- Search in common locations
    local locations = {
        ReplicatedStorage,
        ReplicatedStorage:FindFirstChild("Remotes"),
        ReplicatedStorage:FindFirstChild("Events"),
        ReplicatedStorage:FindFirstChild("RemoteEvents"),
        ReplicatedStorage:FindFirstChild("Network"),
    }

    for _, location in pairs(locations) do
        if location then
            local remote = location:FindFirstChild(name)
            if remote then
                if className then
                    if remote:IsA(className) then return remote end
                elseif remote:IsA("RemoteEvent") or remote:IsA("RemoteFunction") then
                    return remote
                end
            end
        end
    end

    -- Deep search
    for _, v in pairs(ReplicatedStorage:GetDescendants()) do
        if v.Name == name then
            if className then
                if v:IsA(className) then return v end
            elseif v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                return v
            end
        end
    end

    return nil
end

-- Find all remotes and cache them
local function discoverRemotes()
    local remotes = {}
    for _, v in pairs(ReplicatedStorage:GetDescendants()) do
        if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
            remotes[v.Name] = v
        end
    end
    return remotes
end

local cachedRemotes = discoverRemotes()

local function getRemote(name)
    if cachedRemotes[name] then return cachedRemotes[name] end
    -- Try to find it again
    local remote = findRemote(name)
    if remote then
        cachedRemotes[name] = remote
    end
    return remote
end

-- Fire remote safely
local function fireRemote(name, ...)
    local args = {...}
    local remote = getRemote(name)
    if remote then
        local success, err = pcall(function()
            if remote:IsA("RemoteEvent") then
                remote:FireServer(unpack(args))
            elseif remote:IsA("RemoteFunction") then
                return remote:InvokeServer(unpack(args))
            end
        end)
        if not success then
            warn("[BOON Hub] Failed to fire remote " .. name .. ": " .. tostring(err))
        end
        return success
    end
    return false
end

-- Fire ProximityPrompt
local function firePrompt(prompt)
    if prompt and prompt:IsA("ProximityPrompt") then
        local success, err = pcall(function()
            fireproximityprompt(prompt)
        end)
        if not success then
            pcall(function()
                prompt:InputHoldBegin()
                task.wait(prompt.HoldDuration + 0.1)
                prompt:InputHoldEnd()
            end)
        end
    end
end

-- Find player's computers/PCs in workspace
local function findPlayerComputers()
    local computers = {}
    -- Look for the player's tycoon/plot/office area
    local playerPlot = nil

    -- Common patterns: player's folder in workspace, tycoon model, etc.
    for _, v in pairs(Workspace:GetDescendants()) do
        if v:IsA("Model") or v:IsA("Folder") then
            if v.Name == player.Name or v.Name == tostring(player.UserId) then
                playerPlot = v
                break
            end
        end
    end

    -- Search for computers/PCs
    local searchAreas = playerPlot and {playerPlot} or {Workspace}
    for _, area in pairs(searchAreas) do
        for _, v in pairs(area:GetDescendants()) do
            if v:IsA("Model") and (
                v.Name:lower():find("computer") or
                v.Name:lower():find("pc") or
                v.Name:lower():find("desk") or
                v.Name:lower():find("monitor") or
                v.Name:lower():find("setup")
            ) then
                table.insert(computers, v)
            end
        end
    end

    return computers
end

-- Find collectible items (meteors, code bubbles, etc.)
local function findCollectibles(namePattern)
    local items = {}
    for _, v in pairs(Workspace:GetDescendants()) do
        if (v:IsA("BasePart") or v:IsA("Model")) and v.Name:lower():find(namePattern:lower()) then
            table.insert(items, v)
        end
    end
    return items
end

-- Teleport to position safely
local function teleportTo(position)
    local char, humanoid, rootPart = getCharacter()
    if rootPart then
        rootPart.CFrame = CFrame.new(position + Vector3.new(0, 3, 0))
    end
end

-- ============================================================
-- AUTO CODING
-- Simulates keyboard input to auto-type code on computers
-- Works by finding the coding UI and triggering key presses
-- ============================================================
local function autoCodingLoop(gen)
    task.spawn(function()
        while autoCodingEnabled and autoCodingGen == gen do
            pcall(function()
                -- Method 1: Fire the coding remote directly
                fireRemote("Code")
                fireRemote("Coding")
                fireRemote("StartCoding")
                fireRemote("CompleteCoding")
                fireRemote("TypeCode")
                fireRemote("FinishCode")
                fireRemote("WriteLine")
                fireRemote("AddLine")

                -- Method 2: Simulate virtual keyboard for the coding minigame
                local gui = player.PlayerGui
                if gui then
                    for _, v in pairs(gui:GetDescendants()) do
                        -- Look for coding-related buttons/text fields
                        if v:IsA("TextButton") and (
                            v.Name:lower():find("code") or
                            v.Name:lower():find("type") or
                            v.Name:lower():find("write") or
                            v.Name:lower():find("enter") or
                            v.Name:lower():find("submit") or
                            v.Name:lower():find("compile") or
                            v.Name:lower():find("run")
                        ) then
                            pcall(function()
                                -- Fire all click events
                                if v.Activated then
                                    v.Activated:Fire()
                                end
                                if v.MouseButton1Click then
                                    for _, conn in pairs(getconnections(v.MouseButton1Click)) do
                                        conn:Fire()
                                    end
                                end
                            end)
                        end
                    end

                    -- Try to interact with the coding screen/textbox
                    for _, v in pairs(gui:GetDescendants()) do
                        if v:IsA("TextBox") and (
                            v.Name:lower():find("code") or
                            v.Name:lower():find("input") or
                            v.Name:lower():find("editor")
                        ) then
                            pcall(function()
                                v:CaptureFocus()
                                v.Text = v.Text .. "a"
                                v:ReleaseFocus(true)
                            end)
                        end
                    end
                end

                -- Method 3: Fire proximity prompts on computers
                local computers = findPlayerComputers()
                for _, computer in pairs(computers) do
                    for _, part in pairs(computer:GetDescendants()) do
                        if part:IsA("ProximityPrompt") then
                            firePrompt(part)
                        end
                        if part:IsA("ClickDetector") then
                            pcall(function()
                                fireclickdetector(part)
                            end)
                        end
                    end
                end
            end)
            task.wait(codingDelay)
        end
    end)
end

-- ============================================================
-- AUTO COLLECT CODE
-- Collects completed code/programs from all PCs
-- ============================================================
local function autoCollectCodeLoop(gen)
    task.spawn(function()
        while autoCollectCodeEnabled and autoCollectCodeGen == gen do
            pcall(function()
                -- Fire collect remotes
                fireRemote("CollectCode")
                fireRemote("Collect")
                fireRemote("CollectAll")
                fireRemote("CollectProgram")
                fireRemote("PickupCode")
                fireRemote("GrabCode")

                -- Look for code bubbles/floating items to collect
                local collectibles = {}
                for _, v in pairs(Workspace:GetDescendants()) do
                    if (v:IsA("BasePart") or v:IsA("Model")) then
                        local name = v.Name:lower()
                        if name:find("code") or name:find("bubble") or name:find("collect") or name:find("pickup") or name:find("drop") then
                            -- Check for proximity prompts
                            for _, child in pairs(v:GetDescendants()) do
                                if child:IsA("ProximityPrompt") then
                                    firePrompt(child)
                                end
                                if child:IsA("ClickDetector") then
                                    pcall(function() fireclickdetector(child) end)
                                end
                            end

                            -- Touch interaction
                            local char, _, rootPart = getCharacter()
                            if rootPart and v:IsA("BasePart") then
                                pcall(function()
                                    firetouchinterest(rootPart, v, 0)
                                    task.wait()
                                    firetouchinterest(rootPart, v, 1)
                                end)
                            end
                        end
                    end
                end

                -- Also try collecting from player's own computers
                local computers = findPlayerComputers()
                for _, computer in pairs(computers) do
                    for _, part in pairs(computer:GetDescendants()) do
                        if part:IsA("ProximityPrompt") then
                            firePrompt(part)
                        end
                    end
                end
            end)
            task.wait(collectDelay)
        end
    end)
end

-- ============================================================
-- AUTO SELL
-- Automatically sells programs/apps/platforms
-- ============================================================
local function autoSellLoop(gen)
    task.spawn(function()
        while autoSellEnabled and autoSellGen == gen do
            pcall(function()
                -- Fire sell remotes
                fireRemote("Sell")
                fireRemote("SellAll")
                fireRemote("SellProgram")
                fireRemote("SellPrograms")
                fireRemote("SellApp")
                fireRemote("SellApps")
                fireRemote("SellPlatform")
                fireRemote("SellPlatforms")

                -- Try with arguments based on sell type
                if sellType == "Programs" or sellType == "All" then
                    fireRemote("Sell", "Program")
                    fireRemote("Sell", "Programs")
                end
                if sellType == "Apps" or sellType == "All" then
                    fireRemote("Sell", "App")
                    fireRemote("Sell", "Apps")
                end
                if sellType == "Platforms" or sellType == "All" then
                    fireRemote("Sell", "Platform")
                    fireRemote("Sell", "Platforms")
                end

                -- Try interacting with sell NPC/area
                for _, v in pairs(Workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") then
                        local parent = v.Parent
                        if parent then
                            local parentName = parent.Name:lower()
                            if parentName:find("sell") or parentName:find("shop") or parentName:find("store") or parentName:find("npc") then
                                firePrompt(v)
                            end
                        end
                    end
                end
            end)
            task.wait(sellDelay)
        end
    end)
end

-- ============================================================
-- AUTO MINE
-- Automatically mines resources
-- ============================================================
local function autoMineLoop(gen)
    task.spawn(function()
        while autoMineEnabled and autoMineGen == gen do
            pcall(function()
                -- Fire mining remotes
                fireRemote("Mine")
                fireRemote("MineRock")
                fireRemote("MineOre")
                fireRemote("Hit")
                fireRemote("Swing")
                fireRemote("BreakRock")
                fireRemote("MineBoulder")

                -- Find mining areas and interact
                for _, v in pairs(Workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") then
                        local parent = v.Parent
                        if parent then
                            local parentName = parent.Name:lower()
                            if parentName:find("mine") or parentName:find("rock") or parentName:find("ore") or parentName:find("boulder") or parentName:find("crystal") then
                                firePrompt(v)
                            end
                        end
                    end
                    if v:IsA("ClickDetector") then
                        local parent = v.Parent
                        if parent then
                            local parentName = parent.Name:lower()
                            if parentName:find("mine") or parentName:find("rock") or parentName:find("ore") then
                                pcall(function() fireclickdetector(v) end)
                            end
                        end
                    end
                end
            end)
            task.wait(mineDelay)
        end
    end)
end

-- ============================================================
-- AUTO FISH
-- Automatically fishes
-- ============================================================
local function autoFishLoop(gen)
    task.spawn(function()
        while autoFishEnabled and autoFishGen == gen do
            pcall(function()
                fireRemote("Fish")
                fireRemote("CastRod")
                fireRemote("Reel")
                fireRemote("Catch")
                fireRemote("StartFishing")
                fireRemote("StopFishing")

                -- Find fishing area prompts
                for _, v in pairs(Workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") then
                        local parent = v.Parent
                        if parent then
                            local parentName = parent.Name:lower()
                            if parentName:find("fish") or parentName:find("rod") or parentName:find("pond") or parentName:find("lake") then
                                firePrompt(v)
                            end
                        end
                    end
                end
            end)
            task.wait(fishDelay)
        end
    end)
end

-- ============================================================
-- AUTO COLLECT METEOR
-- Collects meteors by triggering E prompts
-- ============================================================
local function autoMeteorLoop(gen)
    task.spawn(function()
        while autoMeteorEnabled and autoMeteorGen == gen do
            pcall(function()
                fireRemote("CollectMeteor")
                fireRemote("MeteorCollect")
                fireRemote("PickupMeteor")
                fireRemote("GrabMeteor")

                -- Find meteor objects
                for _, v in pairs(Workspace:GetDescendants()) do
                    local name = v.Name:lower()
                    if name:find("meteor") or name:find("comet") or name:find("asteroid") then
                        -- Try proximity prompt
                        if v:IsA("BasePart") or v:IsA("Model") then
                            for _, child in pairs(v:GetDescendants()) do
                                if child:IsA("ProximityPrompt") then
                                    firePrompt(child)
                                end
                            end
                            -- Try touch
                            local char, _, rootPart = getCharacter()
                            if rootPart then
                                local targetPart = v:IsA("Model") and v:FindFirstChildWhichIsA("BasePart") or v
                                if targetPart and targetPart:IsA("BasePart") then
                                    pcall(function()
                                        firetouchinterest(rootPart, targetPart, 0)
                                        task.wait()
                                        firetouchinterest(rootPart, targetPart, 1)
                                    end)
                                end
                            end
                        end
                    end
                end
            end)
            task.wait(1)
        end
    end)
end

-- ============================================================
-- AUTO TIME REWARD
-- Collects playtime rewards automatically
-- ============================================================
local function autoTimeRewardLoop(gen)
    task.spawn(function()
        while autoTimeRewardEnabled and autoTimeRewardGen == gen do
            pcall(function()
                fireRemote("ClaimReward")
                fireRemote("ClaimTimeReward")
                fireRemote("CollectReward")
                fireRemote("TimeReward")
                fireRemote("PlaytimeReward")
                fireRemote("Reward")

                -- Look for reward UI buttons
                local gui = player.PlayerGui
                if gui then
                    for _, v in pairs(gui:GetDescendants()) do
                        if v:IsA("TextButton") then
                            local name = v.Name:lower()
                            local text = v.Text:lower()
                            if name:find("claim") or name:find("reward") or name:find("collect")
                                or text:find("claim") or text:find("collect") or text:find("reward") then
                                pcall(function()
                                    if v.Visible and v.Active then
                                        for _, conn in pairs(getconnections(v.MouseButton1Click)) do
                                            conn:Fire()
                                        end
                                    end
                                end)
                            end
                        end
                    end
                end
            end)
            task.wait(5)
        end
    end)
end

-- ============================================================
-- AUTO BUY FISH SHOP
-- Buys items from the fishing shop
-- ============================================================
local function autoBuyFishShopLoop(gen)
    task.spawn(function()
        while autoBuyFishShopEnabled and autoBuyFishShopGen == gen do
            pcall(function()
                fireRemote("BuyFishShop")
                fireRemote("BuyFish")
                fireRemote("BuyFromShop")
                fireRemote("PurchaseFish")
                fireRemote("BuyMarket")

                -- Find fish shop prompts
                for _, v in pairs(Workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") then
                        local parent = v.Parent
                        if parent then
                            local parentName = parent.Name:lower()
                            if parentName:find("fish") and (parentName:find("shop") or parentName:find("market") or parentName:find("buy") or parentName:find("store")) then
                                firePrompt(v)
                            end
                        end
                    end
                end
            end)
            task.wait(2)
        end
    end)
end

-- ============================================================
-- FULLBRIGHT
-- ============================================================
local savedLighting = {}

local function enableFullbright()
    savedLighting.Ambient = Lighting.Ambient
    savedLighting.Brightness = Lighting.Brightness
    savedLighting.FogEnd = Lighting.FogEnd
    savedLighting.GlobalShadows = Lighting.GlobalShadows

    Lighting.Ambient = Color3.fromRGB(255, 255, 255)
    Lighting.Brightness = 1
    Lighting.FogEnd = 1e10
    Lighting.GlobalShadows = false

    savedLighting.effects = {}
    for _, v in pairs(Lighting:GetDescendants()) do
        if v:IsA("BloomEffect") or v:IsA("BlurEffect") or v:IsA("ColorCorrectionEffect") or v:IsA("SunRaysEffect") then
            table.insert(savedLighting.effects, {effect = v, enabled = v.Enabled})
            v.Enabled = false
        end
    end
end

local function disableFullbright()
    if savedLighting.Ambient then
        Lighting.Ambient = savedLighting.Ambient
        Lighting.Brightness = savedLighting.Brightness
        Lighting.FogEnd = savedLighting.FogEnd
        Lighting.GlobalShadows = savedLighting.GlobalShadows
    end
    if savedLighting.effects then
        for _, entry in pairs(savedLighting.effects) do
            if entry.effect and entry.effect.Parent then
                entry.effect.Enabled = entry.enabled
            end
        end
    end
end

-- ============================================================
-- ANTI-AFK
-- ============================================================
local function setupAntiAfk()
    player.Idled:Connect(function()
        if antiAfkEnabled then
            VirtualUser:CaptureController()
            VirtualUser:ClickButton2(Vector2.new())
        end
    end)
end

setupAntiAfk()

-- ============================================================
-- CREATE RAYFIELD WINDOW
-- ============================================================
local Window = Rayfield:CreateWindow({
    Name = "BOON Hub - Code a Business",
    Icon = 0,
    LoadingTitle = "BOON Hub Loading...",
    LoadingSubtitle = "Code a Business Script",
    Theme = "Default",
    ToggleUIKeybind = "RightControl",
    ConfigurationSaving = {
        Enabled = true,
        FolderName = nil,
        FileName = "BOONHub_CodeABusiness"
    },
    KeySystem = false
})

-- ============ CODING TAB ============
local CodingTab = Window:CreateTab("Coding", "code")
CodingTab:CreateSection("Auto Coding System")

CodingTab:CreateToggle({
    Name = "Auto Code",
    CurrentValue = false,
    Flag = "AutoCodingToggle",
    Callback = function(v)
        autoCodingGen = autoCodingGen + 1
        autoCodingEnabled = v
        if v then
            autoCodingLoop(autoCodingGen)
            Rayfield:Notify({Title = "Auto Code", Content = "Started auto coding!", Duration = 3})
        else
            Rayfield:Notify({Title = "Auto Code", Content = "Stopped auto coding.", Duration = 3})
        end
    end
})

CodingTab:CreateSlider({
    Name = "Coding Speed (delay)",
    Range = {0.1, 3},
    Increment = 0.1,
    CurrentValue = 0.5,
    Suffix = "s",
    Flag = "CodingDelay",
    Callback = function(v) codingDelay = v end
})

CodingTab:CreateToggle({
    Name = "Auto Collect Code",
    CurrentValue = false,
    Flag = "AutoCollectCodeToggle",
    Callback = function(v)
        autoCollectCodeGen = autoCollectCodeGen + 1
        autoCollectCodeEnabled = v
        if v then
            autoCollectCodeLoop(autoCollectCodeGen)
            Rayfield:Notify({Title = "Auto Collect", Content = "Collecting code from all PCs!", Duration = 3})
        else
            Rayfield:Notify({Title = "Auto Collect", Content = "Stopped collecting.", Duration = 3})
        end
    end
})

CodingTab:CreateSlider({
    Name = "Collect Speed (delay)",
    Range = {0.5, 5},
    Increment = 0.5,
    CurrentValue = 1,
    Suffix = "s",
    Flag = "CollectDelay",
    Callback = function(v) collectDelay = v end
})

-- ============ FARMING TAB ============
local FarmingTab = Window:CreateTab("Farming", "pickaxe")
FarmingTab:CreateSection("Auto Sell")

FarmingTab:CreateToggle({
    Name = "Auto Sell",
    CurrentValue = false,
    Flag = "AutoSellToggle",
    Callback = function(v)
        autoSellGen = autoSellGen + 1
        autoSellEnabled = v
        if v then
            autoSellLoop(autoSellGen)
            Rayfield:Notify({Title = "Auto Sell", Content = "Selling " .. sellType .. " automatically!", Duration = 3})
        end
    end
})

FarmingTab:CreateDropdown({
    Name = "Sell Type",
    Options = {"Programs", "Apps", "Platforms", "All"},
    CurrentOption = {"Programs"},
    Flag = "SellTypeDropdown",
    Callback = function(opts) sellType = opts[1] or "Programs" end
})

FarmingTab:CreateSlider({
    Name = "Sell Speed (delay)",
    Range = {0.5, 5},
    Increment = 0.5,
    CurrentValue = 1,
    Suffix = "s",
    Flag = "SellDelay",
    Callback = function(v) sellDelay = v end
})

FarmingTab:CreateSection("Mining & Fishing")

FarmingTab:CreateToggle({
    Name = "Auto Mine",
    CurrentValue = false,
    Flag = "AutoMineToggle",
    Callback = function(v)
        autoMineGen = autoMineGen + 1
        autoMineEnabled = v
        if v then
            autoMineLoop(autoMineGen)
            Rayfield:Notify({Title = "Auto Mine", Content = "Mining automatically!", Duration = 3})
        end
    end
})

FarmingTab:CreateSlider({
    Name = "Mine Speed (delay)",
    Range = {0.1, 3},
    Increment = 0.1,
    CurrentValue = 0.5,
    Suffix = "s",
    Flag = "MineDelay",
    Callback = function(v) mineDelay = v end
})

FarmingTab:CreateToggle({
    Name = "Auto Fish",
    CurrentValue = false,
    Flag = "AutoFishToggle",
    Callback = function(v)
        autoFishGen = autoFishGen + 1
        autoFishEnabled = v
        if v then
            autoFishLoop(autoFishGen)
            Rayfield:Notify({Title = "Auto Fish", Content = "Fishing automatically!", Duration = 3})
        end
    end
})

FarmingTab:CreateSlider({
    Name = "Fish Speed (delay)",
    Range = {0.5, 5},
    Increment = 0.5,
    CurrentValue = 1,
    Suffix = "s",
    Flag = "FishDelay",
    Callback = function(v) fishDelay = v end
})

FarmingTab:CreateToggle({
    Name = "Auto Buy Fish Shop",
    CurrentValue = false,
    Flag = "AutoBuyFishShopToggle",
    Callback = function(v)
        autoBuyFishShopGen = autoBuyFishShopGen + 1
        autoBuyFishShopEnabled = v
        if v then
            autoBuyFishShopLoop(autoBuyFishShopGen)
            Rayfield:Notify({Title = "Fish Shop", Content = "Auto buying from fish shop!", Duration = 3})
        end
    end
})

-- ============ COLLECT TAB ============
local CollectTab = Window:CreateTab("Collect", "star")
CollectTab:CreateSection("Auto Collection")

CollectTab:CreateToggle({
    Name = "Auto Collect Meteors",
    CurrentValue = false,
    Flag = "AutoMeteorToggle",
    Callback = function(v)
        autoMeteorGen = autoMeteorGen + 1
        autoMeteorEnabled = v
        if v then
            autoMeteorLoop(autoMeteorGen)
            Rayfield:Notify({Title = "Meteors", Content = "Collecting meteors automatically!", Duration = 3})
        end
    end
})

CollectTab:CreateToggle({
    Name = "Auto Collect Time Rewards",
    CurrentValue = false,
    Flag = "AutoTimeRewardToggle",
    Callback = function(v)
        autoTimeRewardGen = autoTimeRewardGen + 1
        autoTimeRewardEnabled = v
        if v then
            autoTimeRewardLoop(autoTimeRewardGen)
            Rayfield:Notify({Title = "Time Rewards", Content = "Claiming rewards automatically!", Duration = 3})
        end
    end
})

CollectTab:CreateSection("Manual Actions")

CollectTab:CreateButton({
    Name = "Collect All Codes Now",
    Callback = function()
        pcall(function()
            fireRemote("CollectCode")
            fireRemote("Collect")
            fireRemote("CollectAll")

            for _, v in pairs(Workspace:GetDescendants()) do
                if v:IsA("ProximityPrompt") then
                    local parentName = v.Parent and v.Parent.Name:lower() or ""
                    if parentName:find("code") or parentName:find("collect") or parentName:find("bubble") then
                        firePrompt(v)
                    end
                end
            end
        end)
        Rayfield:Notify({Title = "Collect All", Content = "Collected all available codes!", Duration = 3})
    end
})

CollectTab:CreateButton({
    Name = "Sell Everything Now",
    Callback = function()
        pcall(function()
            fireRemote("SellAll")
            fireRemote("Sell", "Program")
            fireRemote("Sell", "App")
            fireRemote("Sell", "Platform")
            fireRemote("SellPrograms")
            fireRemote("SellApps")
            fireRemote("SellPlatforms")
        end)
        Rayfield:Notify({Title = "Sell All", Content = "Sold everything!", Duration = 3})
    end
})

CollectTab:CreateButton({
    Name = "Buy All Merchant Items",
    Callback = function()
        pcall(function()
            fireRemote("BuyMerchant")
            fireRemote("BuyAll")
            fireRemote("PurchaseAll")
            fireRemote("BuyFromMerchant")

            for _, v in pairs(Workspace:GetDescendants()) do
                if v:IsA("ProximityPrompt") then
                    local parentName = v.Parent and v.Parent.Name:lower() or ""
                    if parentName:find("merchant") or parentName:find("trader") or parentName:find("vendor") then
                        firePrompt(v)
                    end
                end
            end
        end)
        Rayfield:Notify({Title = "Merchant", Content = "Bought from merchant!", Duration = 3})
    end
})

-- ============ PLAYER TAB ============
local PlayerTab = Window:CreateTab("Player", "user")
PlayerTab:CreateSection("Movement")

PlayerTab:CreateToggle({
    Name = "Speed Hack",
    CurrentValue = false,
    Flag = "SpeedToggle",
    Callback = function(v)
        speedEnabled = v
        if not v then
            local _, humanoid = getCharacter()
            if humanoid then
                humanoid.WalkSpeed = 16
            end
        end
    end
})

PlayerTab:CreateSlider({
    Name = "Walk Speed",
    Range = {16, 500},
    Increment = 1,
    CurrentValue = 16,
    Suffix = " studs/s",
    Flag = "SpeedValue",
    Callback = function(v) desiredSpeed = v end
})

PlayerTab:CreateSection("Visual")

PlayerTab:CreateToggle({
    Name = "Fullbright",
    CurrentValue = false,
    Flag = "FullbrightToggle",
    Callback = function(v)
        fullbrightEnabled = v
        if v then
            enableFullbright()
            Rayfield:Notify({Title = "Fullbright", Content = "Fullbright enabled!", Duration = 3})
        else
            disableFullbright()
        end
    end
})

PlayerTab:CreateSection("Misc")

PlayerTab:CreateToggle({
    Name = "Anti-AFK",
    CurrentValue = true,
    Flag = "AntiAfkToggle",
    Callback = function(v)
        antiAfkEnabled = v
        Rayfield:Notify({Title = "Anti-AFK", Content = v and "Anti-AFK enabled!" or "Anti-AFK disabled.", Duration = 3})
    end
})

-- ============ INFO TAB ============
local InfoTab = Window:CreateTab("Info", "info")

InfoTab:CreateParagraph({
    Title = "BOON Hub - Code a Business",
    Content = "Script for Code a Business (Coding Simulator 2)\n\nFeatures:\n- Auto Code & Auto Collect\n- Auto Sell (Programs/Apps/Platforms)\n- Auto Mine & Auto Fish\n- Auto Meteor Collector\n- Auto Time Rewards\n- Speed Hack & Fullbright\n- Anti-AFK\n\nToggle UI: RightControl"
})

local remotesParagraph = InfoTab:CreateParagraph({
    Title = "Remotes Found",
    Content = "Scanning game remotes..."
})

-- Update remote info
task.spawn(function()
    task.wait(2)
    local remoteList = {}
    for name, remote in pairs(cachedRemotes) do
        table.insert(remoteList, name .. " (" .. remote.ClassName .. ")")
    end
    table.sort(remoteList)
    local remoteText = #remoteList > 0 and table.concat(remoteList, "\n") or "No remotes found in ReplicatedStorage"
    pcall(function()
        remotesParagraph:Set({Title = "Remotes Found", Content = remoteText})
    end)
end)

InfoTab:CreateButton({
    Name = "Print All Remotes (F9 Console)",
    Callback = function()
        print("\n====== GAME REMOTES ======")
        for _, v in pairs(ReplicatedStorage:GetDescendants()) do
            if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                print(v.ClassName .. ": " .. v:GetFullName())
            end
        end
        print("====== END REMOTES ======\n")
        Rayfield:Notify({Title = "Remotes", Content = "Check F9 console for remote list!", Duration = 5})
    end
})

InfoTab:CreateButton({
    Name = "Print Workspace Structure (F9)",
    Callback = function()
        print("\n====== WORKSPACE MODELS ======")
        for _, v in pairs(Workspace:GetChildren()) do
            print(v.ClassName .. ": " .. v.Name)
        end
        print("====== END STRUCTURE ======\n")
        Rayfield:Notify({Title = "Structure", Content = "Check F9 console!", Duration = 5})
    end
})

-- ============ HEARTBEAT LOOP ============
RunService.Heartbeat:Connect(function()
    local char, humanoid, rootPart = getCharacter()
    if not char then return end

    -- Speed hack
    if speedEnabled and humanoid then
        humanoid.WalkSpeed = desiredSpeed
    end
end)

-- Load saved configuration
Rayfield:LoadConfiguration()

-- Notify script loaded
Rayfield:Notify({
    Title = "BOON Hub Loaded",
    Content = "Code a Business script is ready!\nToggle UI: RightControl",
    Duration = 5
})
