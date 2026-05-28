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
-- Interacts with computers via ProximityPrompts, ClickDetectors,
-- and fires all coding-related remotes found in the game
-- ============================================================
local function autoCodingLoop(gen)
    task.spawn(function()
        while autoCodingEnabled and autoCodingGen == gen do
            pcall(function()
                -- Method 1: Fire ALL remotes with coding-related names
                for name, remote in pairs(cachedRemotes) do
                    local n = name:lower()
                    if n:find("code") or n:find("coding") or n:find("type") or n:find("write")
                        or n:find("compile") or n:find("program") or n:find("complete")
                        or n:find("start") or n:find("work") or n:find("finish") then
                        pcall(function()
                            if remote:IsA("RemoteEvent") then
                                remote:FireServer()
                            elseif remote:IsA("RemoteFunction") then
                                remote:InvokeServer()
                            end
                        end)
                    end
                end

                -- Method 2: Fire ALL ProximityPrompts in/near player's area
                local char, _, rootPart = getCharacter()
                if rootPart then
                    for _, v in pairs(Workspace:GetDescendants()) do
                        if v:IsA("ProximityPrompt") and v.Enabled then
                            local promptPart = v.Parent
                            if promptPart and promptPart:IsA("BasePart") then
                                local dist = (promptPart.Position - rootPart.Position).Magnitude
                                if dist < 30 then
                                    firePrompt(v)
                                end
                            end
                        end
                    end
                end

                -- Method 3: Fire ClickDetectors near player
                if rootPart then
                    for _, v in pairs(Workspace:GetDescendants()) do
                        if v:IsA("ClickDetector") then
                            local clickPart = v.Parent
                            if clickPart and clickPart:IsA("BasePart") then
                                local dist = (clickPart.Position - rootPart.Position).Magnitude
                                if dist < 30 then
                                    pcall(function() fireclickdetector(v) end)
                                end
                            end
                        end
                    end
                end

                -- Method 4: Click GUI buttons related to coding
                local gui = player.PlayerGui
                if gui then
                    for _, v in pairs(gui:GetDescendants()) do
                        if v:IsA("TextButton") and v.Visible then
                            local n = v.Name:lower()
                            local t = ""
                            pcall(function() t = v.Text:lower() end)
                            if n:find("code") or n:find("type") or n:find("write") or n:find("start")
                                or n:find("compile") or n:find("run") or n:find("submit")
                                or t:find("code") or t:find("start") or t:find("compile") then
                                pcall(function()
                                    for _, conn in pairs(getconnections(v.MouseButton1Click)) do
                                        conn:Fire()
                                    end
                                end)
                            end
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
-- Uses touch, ProximityPrompts, and remotes
-- ============================================================
local function autoCollectCodeLoop(gen)
    task.spawn(function()
        while autoCollectCodeEnabled and autoCollectCodeGen == gen do
            pcall(function()
                -- Method 1: Fire ALL remotes with collect-related names
                for name, remote in pairs(cachedRemotes) do
                    local n = name:lower()
                    if n:find("collect") or n:find("pickup") or n:find("grab") or n:find("claim")
                        or n:find("bubble") or n:find("store") then
                        pcall(function()
                            if remote:IsA("RemoteEvent") then
                                remote:FireServer()
                            elseif remote:IsA("RemoteFunction") then
                                remote:InvokeServer()
                            end
                        end)
                    end
                end

                -- Method 2: Touch all collectible parts (bubbles, drops, items)
                local char, _, rootPart = getCharacter()
                if rootPart then
                    for _, v in pairs(Workspace:GetDescendants()) do
                        if v:IsA("BasePart") and v:FindFirstChildOfClass("TouchTransmitter") then
                            local dist = (v.Position - rootPart.Position).Magnitude
                            if dist < 50 then
                                pcall(function()
                                    firetouchinterest(rootPart, v, 0)
                                    task.wait()
                                    firetouchinterest(rootPart, v, 1)
                                end)
                            end
                        end
                    end
                end

                -- Method 3: Fire ProximityPrompts for collection
                if rootPart then
                    for _, v in pairs(Workspace:GetDescendants()) do
                        if v:IsA("ProximityPrompt") and v.Enabled then
                            local promptPart = v.Parent
                            if promptPart and promptPart:IsA("BasePart") then
                                local dist = (promptPart.Position - rootPart.Position).Magnitude
                                if dist < 50 then
                                    local pn = promptPart.Name:lower()
                                    local action = v.ActionText:lower()
                                    if pn:find("code") or pn:find("bubble") or pn:find("collect")
                                        or pn:find("pickup") or pn:find("drop") or pn:find("item")
                                        or action:find("collect") or action:find("pick") or action:find("grab") then
                                        firePrompt(v)
                                    end
                                end
                            end
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
-- Fires sell-related remotes and interacts with sell areas
-- ============================================================
local function autoSellLoop(gen)
    task.spawn(function()
        while autoSellEnabled and autoSellGen == gen do
            pcall(function()
                -- Method 1: Fire ALL remotes with sell-related names
                for name, remote in pairs(cachedRemotes) do
                    local n = name:lower()
                    if n:find("sell") or n:find("purchase") or n:find("trade") or n:find("shop") then
                        pcall(function()
                            if remote:IsA("RemoteEvent") then
                                remote:FireServer()
                                if sellType == "Programs" or sellType == "All" then
                                    remote:FireServer("Program")
                                    remote:FireServer("Programs")
                                end
                                if sellType == "Apps" or sellType == "All" then
                                    remote:FireServer("App")
                                    remote:FireServer("Apps")
                                end
                                if sellType == "Platforms" or sellType == "All" then
                                    remote:FireServer("Platform")
                                    remote:FireServer("Platforms")
                                end
                            elseif remote:IsA("RemoteFunction") then
                                remote:InvokeServer()
                            end
                        end)
                    end
                end

                -- Method 2: Fire sell-related ProximityPrompts
                for _, v in pairs(Workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") and v.Enabled then
                        local parent = v.Parent
                        if parent then
                            local parentName = parent.Name:lower()
                            local action = v.ActionText:lower()
                            if parentName:find("sell") or parentName:find("shop") or parentName:find("store")
                                or parentName:find("trade") or parentName:find("npc") or parentName:find("vendor")
                                or action:find("sell") or action:find("trade") or action:find("shop") then
                                firePrompt(v)
                            end
                        end
                    end
                end

                -- Method 3: Click sell GUI buttons
                local gui = player.PlayerGui
                if gui then
                    for _, v in pairs(gui:GetDescendants()) do
                        if v:IsA("TextButton") and v.Visible then
                            local n = v.Name:lower()
                            local t = ""
                            pcall(function() t = v.Text:lower() end)
                            if n:find("sell") or t:find("sell") or t:find("بيع") then
                                pcall(function()
                                    for _, conn in pairs(getconnections(v.MouseButton1Click)) do
                                        conn:Fire()
                                    end
                                end)
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
-- Automatically mines resources via remotes and prompts
-- ============================================================
local function autoMineLoop(gen)
    task.spawn(function()
        while autoMineEnabled and autoMineGen == gen do
            pcall(function()
                -- Fire ALL remotes with mine-related names
                for name, remote in pairs(cachedRemotes) do
                    local n = name:lower()
                    if n:find("mine") or n:find("rock") or n:find("ore") or n:find("boulder")
                        or n:find("hit") or n:find("swing") or n:find("break") or n:find("dig") then
                        pcall(function()
                            if remote:IsA("RemoteEvent") then
                                remote:FireServer()
                            elseif remote:IsA("RemoteFunction") then
                                remote:InvokeServer()
                            end
                        end)
                    end
                end

                -- Fire mine-related ProximityPrompts and ClickDetectors
                for _, v in pairs(Workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") and v.Enabled then
                        local parent = v.Parent
                        if parent then
                            local pn = parent.Name:lower()
                            local action = v.ActionText:lower()
                            if pn:find("mine") or pn:find("rock") or pn:find("ore") or pn:find("boulder") or pn:find("crystal")
                                or action:find("mine") or action:find("break") or action:find("dig") then
                                firePrompt(v)
                            end
                        end
                    end
                    if v:IsA("ClickDetector") then
                        local parent = v.Parent
                        if parent then
                            local pn = parent.Name:lower()
                            if pn:find("mine") or pn:find("rock") or pn:find("ore") then
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
-- Automatically fishes via remotes and prompts
-- ============================================================
local function autoFishLoop(gen)
    task.spawn(function()
        while autoFishEnabled and autoFishGen == gen do
            pcall(function()
                for name, remote in pairs(cachedRemotes) do
                    local n = name:lower()
                    if n:find("fish") or n:find("rod") or n:find("cast") or n:find("reel") or n:find("catch") then
                        pcall(function()
                            if remote:IsA("RemoteEvent") then
                                remote:FireServer()
                            elseif remote:IsA("RemoteFunction") then
                                remote:InvokeServer()
                            end
                        end)
                    end
                end

                for _, v in pairs(Workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") and v.Enabled then
                        local parent = v.Parent
                        if parent then
                            local pn = parent.Name:lower()
                            local action = v.ActionText:lower()
                            if pn:find("fish") or pn:find("rod") or pn:find("pond") or pn:find("lake")
                                or action:find("fish") or action:find("cast") then
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
-- Collects meteors via ProximityPrompts and touch
-- ============================================================
local function autoMeteorLoop(gen)
    task.spawn(function()
        while autoMeteorEnabled and autoMeteorGen == gen do
            pcall(function()
                for name, remote in pairs(cachedRemotes) do
                    local n = name:lower()
                    if n:find("meteor") or n:find("comet") or n:find("asteroid") then
                        pcall(function()
                            if remote:IsA("RemoteEvent") then
                                remote:FireServer()
                            elseif remote:IsA("RemoteFunction") then
                                remote:InvokeServer()
                            end
                        end)
                    end
                end

                for _, v in pairs(Workspace:GetDescendants()) do
                    local vname = v.Name:lower()
                    if vname:find("meteor") or vname:find("comet") or vname:find("asteroid") then
                        if v:IsA("BasePart") or v:IsA("Model") then
                            for _, child in pairs(v:GetDescendants()) do
                                if child:IsA("ProximityPrompt") then
                                    firePrompt(child)
                                end
                            end
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
-- Collects playtime rewards via remotes and GUI buttons
-- ============================================================
local function autoTimeRewardLoop(gen)
    task.spawn(function()
        while autoTimeRewardEnabled and autoTimeRewardGen == gen do
            pcall(function()
                for name, remote in pairs(cachedRemotes) do
                    local n = name:lower()
                    if n:find("claim") or n:find("reward") or n:find("playtime") or n:find("gift") then
                        pcall(function()
                            if remote:IsA("RemoteEvent") then
                                remote:FireServer()
                            elseif remote:IsA("RemoteFunction") then
                                remote:InvokeServer()
                            end
                        end)
                    end
                end

                local gui = player.PlayerGui
                if gui then
                    for _, v in pairs(gui:GetDescendants()) do
                        if v:IsA("TextButton") then
                            local bname = v.Name:lower()
                            local t = ""
                            pcall(function() t = v.Text:lower() end)
                            if bname:find("claim") or bname:find("reward") or bname:find("collect")
                                or t:find("claim") or t:find("collect") or t:find("reward") then
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
-- Buys items from the fishing shop via remotes and prompts
-- ============================================================
local function autoBuyFishShopLoop(gen)
    task.spawn(function()
        while autoBuyFishShopEnabled and autoBuyFishShopGen == gen do
            pcall(function()
                for name, remote in pairs(cachedRemotes) do
                    local n = name:lower()
                    if (n:find("buy") or n:find("purchase")) and (n:find("fish") or n:find("market") or n:find("shop")) then
                        pcall(function()
                            if remote:IsA("RemoteEvent") then
                                remote:FireServer()
                            elseif remote:IsA("RemoteFunction") then
                                remote:InvokeServer()
                            end
                        end)
                    end
                end

                for _, v in pairs(Workspace:GetDescendants()) do
                    if v:IsA("ProximityPrompt") and v.Enabled then
                        local parent = v.Parent
                        if parent then
                            local pn = parent.Name:lower()
                            local action = v.ActionText:lower()
                            if (pn:find("fish") or action:find("fish"))
                                and (pn:find("shop") or pn:find("market") or pn:find("buy") or pn:find("store")
                                    or action:find("buy") or action:find("purchase")) then
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
    Content = "Script for Code a Business (Coding Simulator 2)\n\nFeatures:\n- Auto Code & Auto Collect\n- Auto Sell (Programs/Apps/Platforms)\n- Auto Mine & Auto Fish\n- Auto Meteor Collector\n- Auto Time Rewards\n- Speed Hack & Fullbright\n- Anti-AFK\n\nToggle UI: K"
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
    Name = "FULL GAME SCAN (F9 Console) - RUN THIS FIRST!",
    Callback = function()
        print("\n========================================")
        print("  BOON Hub - Full Game Scan")
        print("========================================")

        print("\n--- ALL REMOTES (ReplicatedStorage) ---")
        for _, v in pairs(ReplicatedStorage:GetDescendants()) do
            if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                print("  " .. v.ClassName .. ": " .. v:GetFullName())
            end
        end

        print("\n--- ALL PROXIMITY PROMPTS (Workspace) ---")
        for _, v in pairs(Workspace:GetDescendants()) do
            if v:IsA("ProximityPrompt") then
                print("  [PP] " .. v:GetFullName() .. " | Action: " .. v.ActionText .. " | Object: " .. v.ObjectText .. " | Key: " .. tostring(v.KeyboardKeyCode))
            end
        end

        print("\n--- ALL CLICK DETECTORS (Workspace) ---")
        for _, v in pairs(Workspace:GetDescendants()) do
            if v:IsA("ClickDetector") then
                print("  [CD] " .. v:GetFullName())
            end
        end

        print("\n--- WORKSPACE TOP-LEVEL ---")
        for _, v in pairs(Workspace:GetChildren()) do
            print("  " .. v.ClassName .. ": " .. v.Name)
        end

        print("\n--- PLAYER PLOT / TYCOON ---")
        for _, v in pairs(Workspace:GetDescendants()) do
            if (v:IsA("Model") or v:IsA("Folder")) and (v.Name == player.Name or v.Name == tostring(player.UserId)) then
                print("  Found player area: " .. v:GetFullName())
                for _, child in pairs(v:GetChildren()) do
                    print("    " .. child.ClassName .. ": " .. child.Name)
                end
            end
        end

        print("\n--- PLAYER GUI SCREENS ---")
        local gui = player.PlayerGui
        if gui then
            for _, v in pairs(gui:GetChildren()) do
                print("  " .. v.ClassName .. ": " .. v.Name .. " | Enabled: " .. tostring(v.Enabled))
            end
        end

        print("\n--- TOUCH TRANSMITTERS (collectibles) ---")
        local ttCount = 0
        for _, v in pairs(Workspace:GetDescendants()) do
            if v:IsA("TouchTransmitter") then
                ttCount = ttCount + 1
                if ttCount <= 20 then
                    print("  [TT] " .. v:GetFullName())
                end
            end
        end
        if ttCount > 20 then
            print("  ... and " .. (ttCount - 20) .. " more")
        end

        print("\n========================================")
        print("  Scan complete! Send this output to the developer.")
        print("========================================\n")
        Rayfield:Notify({Title = "Scan Done!", Content = "Open F9 console and screenshot the results!", Duration = 10})
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
    Content = "Code a Business script is ready!\nToggle UI: K",
    Duration = 5
})
