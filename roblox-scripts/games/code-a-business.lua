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

-- Load Fluent UI library
local Fluent
do
    local fluentUrls = {
        "https://github.com/dawid-scripts/Fluent/releases/latest/download/main.lua",
    }
    for _, url in ipairs(fluentUrls) do
        local ok, result = pcall(function()
            return loadstring(game:HttpGet(url))()
        end)
        if ok and result then
            Fluent = result
            break
        end
    end
    if not Fluent then
        warn("[BOON Hub] Failed to load Fluent UI library!")
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

-- Re-discover remotes periodically in case game adds them dynamically
task.spawn(function()
    while true do
        task.wait(30)
        cachedRemotes = discoverRemotes()
    end
end)

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

-- Teleport to position safely
local function teleportTo(position)
    local char, humanoid, rootPart = getCharacter()
    if rootPart then
        rootPart.CFrame = CFrame.new(position + Vector3.new(0, 3, 0))
    end
end

-- ============================================================
-- AUTO CODING
-- Starts a coding session via StartPlayerCodingSession remote,
-- pops programming bubbles via PopProgrammingBubble remote,
-- and completes programs via CompletePlayerCodingProgram remote
-- ============================================================
local function autoCodingLoop(gen)
    task.spawn(function()
        while autoCodingEnabled and autoCodingGen == gen do
            pcall(function()
                local gui = player.PlayerGui
                if not gui then return end

                -- Step 1: Fire StartPlayerCodingSession to begin coding
                local startRemote = ReplicatedStorage:FindFirstChild("Remotes")
                if startRemote then
                    startRemote = startRemote:FindFirstChild("Server")
                    if startRemote then
                        startRemote = startRemote:FindFirstChild("StartPlayerCodingSession")
                        if startRemote then
                            pcall(function() startRemote:FireServer() end)
                        end
                    end
                end

                task.wait(0.5)

                -- Step 2: Pop all programming bubbles in the MakeSoftware GUI
                local makeSoftware = gui:FindFirstChild("MakeSoftware")
                if makeSoftware then
                    -- Click bubbles via GUI
                    local bubblesFolder = makeSoftware:FindFirstChild("ProgrammingBubbles")
                    if bubblesFolder then
                        for _, bubble in pairs(bubblesFolder:GetChildren()) do
                            if bubble:IsA("GuiObject") and bubble.Visible then
                                -- Fire remote for each bubble
                                local popRemote = ReplicatedStorage:FindFirstChild("Remotes")
                                if popRemote then
                                    popRemote = popRemote:FindFirstChild("Server")
                                    if popRemote then
                                        popRemote = popRemote:FindFirstChild("PopProgrammingBubble")
                                        if popRemote then
                                            pcall(function() popRemote:FireServer() end)
                                        end
                                    end
                                end
                                -- Also click the bubble directly
                                pcall(function()
                                    for _, conn in pairs(getconnections(bubble.MouseButton1Click)) do
                                        conn:Fire()
                                    end
                                end)
                            end
                        end
                    end

                    -- Also try clicking ChangeSoftware button if available
                    local changeSw = makeSoftware:FindFirstChild("ChangeSoftware")
                    if changeSw then
                        pcall(function()
                            for _, conn in pairs(getconnections(changeSw.MouseButton1Click)) do
                                conn:Fire()
                            end
                        end)
                    end
                end

                -- Step 3: Try to complete the current coding program
                pcall(function()
                    local completeRemote = ReplicatedStorage:FindFirstChild("Remotes")
                    if completeRemote then
                        completeRemote = completeRemote:FindFirstChild("Server")
                        if completeRemote then
                            completeRemote = completeRemote:FindFirstChild("CompletePlayerCodingProgram")
                            if completeRemote and completeRemote:IsA("RemoteFunction") then
                                completeRemote:InvokeServer()
                            end
                        end
                    end
                end)
            end)
            task.wait(codingDelay)
        end
    end)
end

-- ============================================================
-- AUTO COLLECT CODE
-- Collects software developer tokens and chests
-- Uses actual remotes: CollectSoftwareDeveloperToken, CollectChest
-- ============================================================
local function autoCollectCodeLoop(gen)
    task.spawn(function()
        while autoCollectCodeEnabled and autoCollectCodeGen == gen do
            pcall(function()
                -- Collect software developer tokens via exact path
                local serverRemotes = ReplicatedStorage:FindFirstChild("Remotes")
                if serverRemotes then
                    serverRemotes = serverRemotes:FindFirstChild("Server")
                    if serverRemotes then
                        local tokenRemote = serverRemotes:FindFirstChild("CollectSoftwareDeveloperToken")
                        if tokenRemote then
                            pcall(function() tokenRemote:FireServer() end)
                        end
                        local chestRemote = serverRemotes:FindFirstChild("CollectChest")
                        if chestRemote then
                            pcall(function() chestRemote:FireServer() end)
                        end
                        -- Also claim play rewards and daily rewards
                        local playReward = serverRemotes:FindFirstChild("PlayRewardClaimed")
                        if playReward then
                            pcall(function() playReward:FireServer() end)
                        end
                        local dailyReward = serverRemotes:FindFirstChild("DailyRewardClaimed")
                        if dailyReward then
                            pcall(function() dailyReward:FireServer() end)
                        end
                    end
                end

                -- Touch chest CollectParts in the world
                local char, _, rootPart = getCharacter()
                if rootPart then
                    local chestsFolder = Workspace:FindFirstChild("Map")
                    if chestsFolder then
                        chestsFolder = chestsFolder:FindFirstChild("Gameplay")
                        if chestsFolder then
                            chestsFolder = chestsFolder:FindFirstChild("Chests")
                        end
                    end
                    if chestsFolder then
                        for _, chest in pairs(chestsFolder:GetDescendants()) do
                            if chest:IsA("BasePart") and chest.Name == "CollectPart" then
                                pcall(function()
                                    firetouchinterest(rootPart, chest, 0)
                                    task.wait()
                                    firetouchinterest(rootPart, chest, 1)
                                end)
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
-- Sells software via GUI: opens Sell screen, SelectAll, then Sell
-- Also fires Software.Sell remote directly
-- Actual paths: Main.SideFrame.CoreButtons.Sell → Manage.Frame.BottomBar.SelectAll → Manage.Frame.BottomBar.Sell
-- ============================================================
local function autoSellLoop(gen)
    task.spawn(function()
        while autoSellEnabled and autoSellGen == gen do
            pcall(function()
                local gui = player.PlayerGui
                if not gui then return end

                -- Method 1: Fire Software.Sell remote directly
                local sellRemote = ReplicatedStorage:FindFirstChild("Remotes")
                if sellRemote then
                    sellRemote = sellRemote:FindFirstChild("Server")
                    if sellRemote then
                        sellRemote = sellRemote:FindFirstChild("Software")
                        if sellRemote then
                            sellRemote = sellRemote:FindFirstChild("Sell")
                            if sellRemote then
                                pcall(function() sellRemote:FireServer() end)
                            end
                        end
                    end
                end

                -- Method 2: Click GUI buttons by exact path
                -- Step 1: Click "Sell" CoreButton to open the Manage screen
                local sellCoreBtn = gui:FindFirstChild("Main")
                if sellCoreBtn then
                    sellCoreBtn = sellCoreBtn:FindFirstChild("SideFrame")
                    if sellCoreBtn then
                        sellCoreBtn = sellCoreBtn:FindFirstChild("CoreButtons")
                        if sellCoreBtn then
                            sellCoreBtn = sellCoreBtn:FindFirstChild("Sell")
                            if sellCoreBtn then
                                pcall(function()
                                    for _, conn in pairs(getconnections(sellCoreBtn.MouseButton1Click)) do
                                        conn:Fire()
                                    end
                                end)
                            end
                        end
                    end
                end

                task.wait(0.5)

                -- Step 2: Open Software tab in Manage screen
                local manageGui = gui:FindFirstChild("Manage")
                if manageGui then
                    local frame = manageGui:FindFirstChild("Frame")
                    if frame then
                        -- Click Software tab first
                        local tabBar = frame:FindFirstChild("TabBar")
                        if tabBar then
                            local softwareTab = tabBar:FindFirstChild("Software")
                            if softwareTab then
                                local softwareBtn = softwareTab:FindFirstChild("Software")
                                if softwareBtn then
                                    pcall(function()
                                        for _, conn in pairs(getconnections(softwareBtn.MouseButton1Click)) do
                                            conn:Fire()
                                        end
                                    end)
                                end
                            end
                        end

                        task.wait(0.3)

                        -- Step 3: Click SelectAll
                        local bottomBar = frame:FindFirstChild("BottomBar")
                        if bottomBar then
                            local selectAll = bottomBar:FindFirstChild("SelectAll")
                            if selectAll then
                                pcall(function()
                                    for _, conn in pairs(getconnections(selectAll.MouseButton1Click)) do
                                        conn:Fire()
                                    end
                                end)
                            end

                            task.wait(0.3)

                            -- Step 4: Click Sell
                            local sellBtn = bottomBar:FindFirstChild("Sell")
                            if sellBtn then
                                pcall(function()
                                    for _, conn in pairs(getconnections(sellBtn.MouseButton1Click)) do
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
-- Uses actual remotes: Mining.UpdateOreHealth, Mining.UpdateBoulderHealth
-- Fires ProximityPrompts on boulders in Workspace.Interiors.Mines
-- ============================================================
local function autoMineLoop(gen)
    task.spawn(function()
        while autoMineEnabled and autoMineGen == gen do
            pcall(function()
                -- Fire Mining remotes by exact path
                local miningFolder = ReplicatedStorage:FindFirstChild("Remotes")
                if miningFolder then
                    miningFolder = miningFolder:FindFirstChild("Server")
                    if miningFolder then
                        miningFolder = miningFolder:FindFirstChild("Mining")
                        if miningFolder then
                            local updateOre = miningFolder:FindFirstChild("UpdateOreHealth")
                            if updateOre then
                                pcall(function() updateOre:InvokeServer() end)
                            end
                            local updateBoulder = miningFolder:FindFirstChild("UpdateBoulderHealth")
                            if updateBoulder then
                                pcall(function() updateBoulder:InvokeServer() end)
                            end
                            local genOre = miningFolder:FindFirstChild("GenerateOreSpawnOre")
                            if genOre then
                                pcall(function() genOre:InvokeServer() end)
                            end
                            local useTnt = miningFolder:FindFirstChild("UseTnt")
                            if useTnt then
                                pcall(function() useTnt:FireServer() end)
                            end
                        end
                    end
                end

                -- Fire ProximityPrompts on boulders in all mines
                local minesFolder = Workspace:FindFirstChild("Interiors")
                if minesFolder then
                    minesFolder = minesFolder:FindFirstChild("Mines")
                    if minesFolder then
                        for _, mine in pairs(minesFolder:GetChildren()) do
                            local boulders = mine:FindFirstChild("Boulders")
                            if boulders then
                                for _, boulder in pairs(boulders:GetChildren()) do
                                    local pp = boulder:FindFirstChildWhichIsA("ProximityPrompt")
                                    if pp and pp.Enabled then
                                        firePrompt(pp)
                                    end
                                end
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
-- Uses actual remotes: Fishing.CastBobber, Fishing.ResolveFishingAttempt
-- Touches FishingSpots in Workspace.Map.Gameplay.FishingSpots
-- ============================================================
local function autoFishLoop(gen)
    task.spawn(function()
        while autoFishEnabled and autoFishGen == gen do
            pcall(function()
                -- Fire Fishing remotes by exact path
                local fishingFolder = ReplicatedStorage:FindFirstChild("Remotes")
                if fishingFolder then
                    fishingFolder = fishingFolder:FindFirstChild("Server")
                    if fishingFolder then
                        fishingFolder = fishingFolder:FindFirstChild("Fishing")
                        if fishingFolder then
                            local castBobber = fishingFolder:FindFirstChild("CastBobber")
                            if castBobber then
                                pcall(function() castBobber:FireServer() end)
                            end
                            local resolve = fishingFolder:FindFirstChild("ResolveFishingAttempt")
                            if resolve then
                                pcall(function() resolve:InvokeServer() end)
                            end
                        end
                    end
                end

                -- Touch fishing spot OpenParts
                local char, _, rootPart = getCharacter()
                if rootPart then
                    local fishSpots = Workspace:FindFirstChild("Map")
                    if fishSpots then
                        fishSpots = fishSpots:FindFirstChild("Gameplay")
                        if fishSpots then
                            fishSpots = fishSpots:FindFirstChild("FishingSpots")
                            if fishSpots then
                                for _, spot in pairs(fishSpots:GetDescendants()) do
                                    if spot:IsA("BasePart") and spot.Name == "OpenPart" then
                                        pcall(function()
                                            firetouchinterest(rootPart, spot, 0)
                                            task.wait()
                                            firetouchinterest(rootPart, spot, 1)
                                        end)
                                    end
                                end
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
-- Uses actual remote: MeteorMerge
-- Collects meteors from Workspace.RunTime.Meteors
-- ============================================================
local function autoMeteorLoop(gen)
    task.spawn(function()
        while autoMeteorEnabled and autoMeteorGen == gen do
            pcall(function()
                -- Fire MeteorMerge remote
                fireRemote("MeteorMerge")

                -- Touch/interact with meteors in RunTime.Meteors folder
                local char, _, rootPart = getCharacter()
                if rootPart then
                    local meteorsFolder = Workspace:FindFirstChild("RunTime")
                    if meteorsFolder then
                        meteorsFolder = meteorsFolder:FindFirstChild("Meteors")
                        if meteorsFolder then
                            for _, meteor in pairs(meteorsFolder:GetChildren()) do
                                local targetPart = meteor:IsA("BasePart") and meteor or meteor:FindFirstChildWhichIsA("BasePart")
                                if targetPart then
                                    pcall(function()
                                        firetouchinterest(rootPart, targetPart, 0)
                                        task.wait()
                                        firetouchinterest(rootPart, targetPart, 1)
                                    end)
                                    for _, pp in pairs(meteor:GetDescendants()) do
                                        if pp:IsA("ProximityPrompt") and pp.Enabled then
                                            firePrompt(pp)
                                        end
                                    end
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
-- Uses actual remotes: PlayRewardClaimed, DailyRewardClaimed, LeaveRewardClaimed
-- Clicks Claim buttons in PlayRewards and LeaveReward GUIs
-- ============================================================
local function autoTimeRewardLoop(gen)
    task.spawn(function()
        while autoTimeRewardEnabled and autoTimeRewardGen == gen do
            pcall(function()
                -- Fire reward remotes directly
                fireRemote("PlayRewardClaimed")
                fireRemote("DailyRewardClaimed")
                fireRemote("LeaveRewardClaimed")

                -- Click Claim button in LeaveReward GUI
                local gui = player.PlayerGui
                if gui then
                    local leaveReward = gui:FindFirstChild("LeaveReward")
                    if leaveReward then
                        for _, v in pairs(leaveReward:GetDescendants()) do
                            if (v:IsA("TextButton") or v:IsA("ImageButton")) and v.Name == "Claim" then
                                pcall(function()
                                    if v.Visible then
                                        for _, conn in pairs(getconnections(v.MouseButton1Click)) do
                                            conn:Fire()
                                        end
                                    end
                                end)
                            end
                        end
                    end

                    -- Click in PlayRewards GUI
                    local playRewards = gui:FindFirstChild("PlayRewards")
                    if playRewards then
                        for _, v in pairs(playRewards:GetDescendants()) do
                            if (v:IsA("TextButton") or v:IsA("ImageButton")) then
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

                    -- Click in DailyRewards GUI
                    local dailyRewards = gui:FindFirstChild("DailyRewards")
                    if dailyRewards then
                        for _, v in pairs(dailyRewards:GetDescendants()) do
                            if (v:IsA("TextButton") or v:IsA("ImageButton")) then
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
-- Uses actual remotes: Vendor.BuyMerchantItem, Vendor.BuyMarketItem
-- ============================================================
local function autoBuyFishShopLoop(gen)
    task.spawn(function()
        while autoBuyFishShopEnabled and autoBuyFishShopGen == gen do
            pcall(function()
                -- Fire vendor buy remotes by exact path
                local vendorFolder = ReplicatedStorage:FindFirstChild("Remotes")
                if vendorFolder then
                    vendorFolder = vendorFolder:FindFirstChild("Server")
                    if vendorFolder then
                        vendorFolder = vendorFolder:FindFirstChild("Vendor")
                        if vendorFolder then
                            local buyMerchant = vendorFolder:FindFirstChild("BuyMerchantItem")
                            if buyMerchant then
                                pcall(function() buyMerchant:FireServer() end)
                            end
                            local buyMarket = vendorFolder:FindFirstChild("BuyMarketItem")
                            if buyMarket then
                                pcall(function() buyMarket:FireServer() end)
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
-- Uses actual remote: PreventKickAfk + VirtualUser fallback
-- ============================================================
local function setupAntiAfk()
    -- Fire PreventKickAfk remote periodically (wait before first fire)
    task.spawn(function()
        task.wait(60)
        while true do
            if antiAfkEnabled then
                fireRemote("PreventKickAfk")
            end
            task.wait(60)
        end
    end)
    -- VirtualUser fallback for Idled event
    player.Idled:Connect(function()
        if antiAfkEnabled then
            VirtualUser:CaptureController()
            VirtualUser:ClickButton2(Vector2.new())
        end
    end)
end

setupAntiAfk()

-- ============================================================
-- CREATE FLUENT WINDOW
-- ============================================================
local Window = Fluent:CreateWindow({
    Title = "BOON Hub",
    SubTitle = "Code a Business",
    TabWidth = 160,
    Size = UDim2.fromOffset(520, 420),
    Acrylic = false,
    Theme = "Dark",
    MinimizeKey = Enum.KeyCode.RightControl
})

local Tabs = {
    Coding = Window:AddTab({ Title = "Coding", Icon = "code" }),
    Farming = Window:AddTab({ Title = "Farming", Icon = "pickaxe" }),
    Collect = Window:AddTab({ Title = "Collect", Icon = "star" }),
    Player = Window:AddTab({ Title = "Player", Icon = "user" }),
    Info = Window:AddTab({ Title = "Info", Icon = "info" }),
}

-- ============ CODING TAB ============
Tabs.Coding:AddParagraph({ Title = "Auto Coding System", Content = "Automate coding and collecting code." })

local autoCodingToggle = Tabs.Coding:AddToggle("AutoCodingToggle", { Title = "Auto Code", Default = false })
autoCodingToggle:OnChanged(function()
    local v = autoCodingToggle.Value
    autoCodingGen = autoCodingGen + 1
    autoCodingEnabled = v
    if v then
        autoCodingLoop(autoCodingGen)
        Fluent:Notify({Title = "Auto Code", Content = "Started auto coding!", Duration = 3})
    else
        Fluent:Notify({Title = "Auto Code", Content = "Stopped auto coding.", Duration = 3})
    end
end)

Tabs.Coding:AddSlider("CodingDelay", {
    Title = "Coding Speed (delay)",
    Default = 5,
    Min = 1,
    Max = 30,
    Rounding = 1,
    Callback = function(v) codingDelay = v / 10 end
})

local autoCollectCodeToggle = Tabs.Coding:AddToggle("AutoCollectCodeToggle", { Title = "Auto Collect Code", Default = false })
autoCollectCodeToggle:OnChanged(function()
    local v = autoCollectCodeToggle.Value
    autoCollectCodeGen = autoCollectCodeGen + 1
    autoCollectCodeEnabled = v
    if v then
        autoCollectCodeLoop(autoCollectCodeGen)
        Fluent:Notify({Title = "Auto Collect", Content = "Collecting code from all PCs!", Duration = 3})
    else
        Fluent:Notify({Title = "Auto Collect", Content = "Stopped collecting.", Duration = 3})
    end
end)

Tabs.Coding:AddSlider("CollectDelay", {
    Title = "Collect Speed (delay)",
    Default = 10,
    Min = 5,
    Max = 50,
    Rounding = 1,
    Callback = function(v) collectDelay = v / 10 end
})

-- ============ FARMING TAB ============
Tabs.Farming:AddParagraph({ Title = "Auto Sell", Content = "Automatically sell software." })

local autoSellToggle = Tabs.Farming:AddToggle("AutoSellToggle", { Title = "Auto Sell", Default = false })
autoSellToggle:OnChanged(function()
    local v = autoSellToggle.Value
    autoSellGen = autoSellGen + 1
    autoSellEnabled = v
    if v then
        autoSellLoop(autoSellGen)
        Fluent:Notify({Title = "Auto Sell", Content = "Selling automatically! (Select All > Sell)", Duration = 3})
    end
end)

Tabs.Farming:AddSlider("SellDelay", {
    Title = "Sell Speed (delay)",
    Default = 10,
    Min = 5,
    Max = 50,
    Rounding = 1,
    Callback = function(v) sellDelay = v / 10 end
})

Tabs.Farming:AddParagraph({ Title = "Mining & Fishing", Content = "Automate mining and fishing." })

local autoMineToggle = Tabs.Farming:AddToggle("AutoMineToggle", { Title = "Auto Mine", Default = false })
autoMineToggle:OnChanged(function()
    local v = autoMineToggle.Value
    autoMineGen = autoMineGen + 1
    autoMineEnabled = v
    if v then
        autoMineLoop(autoMineGen)
        Fluent:Notify({Title = "Auto Mine", Content = "Mining automatically!", Duration = 3})
    end
end)

Tabs.Farming:AddSlider("MineDelay", {
    Title = "Mine Speed (delay)",
    Default = 5,
    Min = 1,
    Max = 30,
    Rounding = 1,
    Callback = function(v) mineDelay = v / 10 end
})

local autoFishToggle = Tabs.Farming:AddToggle("AutoFishToggle", { Title = "Auto Fish", Default = false })
autoFishToggle:OnChanged(function()
    local v = autoFishToggle.Value
    autoFishGen = autoFishGen + 1
    autoFishEnabled = v
    if v then
        autoFishLoop(autoFishGen)
        Fluent:Notify({Title = "Auto Fish", Content = "Fishing automatically!", Duration = 3})
    end
end)

Tabs.Farming:AddSlider("FishDelay", {
    Title = "Fish Speed (delay)",
    Default = 10,
    Min = 5,
    Max = 50,
    Rounding = 1,
    Callback = function(v) fishDelay = v / 10 end
})

local autoBuyFishShopToggle = Tabs.Farming:AddToggle("AutoBuyFishShopToggle", { Title = "Auto Buy Fish Shop", Default = false })
autoBuyFishShopToggle:OnChanged(function()
    local v = autoBuyFishShopToggle.Value
    autoBuyFishShopGen = autoBuyFishShopGen + 1
    autoBuyFishShopEnabled = v
    if v then
        autoBuyFishShopLoop(autoBuyFishShopGen)
        Fluent:Notify({Title = "Fish Shop", Content = "Auto buying from fish shop!", Duration = 3})
    end
end)

-- ============ COLLECT TAB ============
Tabs.Collect:AddParagraph({ Title = "Auto Collection", Content = "Automatically collect rewards and items." })

local autoMeteorToggle = Tabs.Collect:AddToggle("AutoMeteorToggle", { Title = "Auto Collect Meteors", Default = false })
autoMeteorToggle:OnChanged(function()
    local v = autoMeteorToggle.Value
    autoMeteorGen = autoMeteorGen + 1
    autoMeteorEnabled = v
    if v then
        autoMeteorLoop(autoMeteorGen)
        Fluent:Notify({Title = "Meteors", Content = "Collecting meteors automatically!", Duration = 3})
    end
end)

local autoTimeRewardToggle = Tabs.Collect:AddToggle("AutoTimeRewardToggle", { Title = "Auto Collect Time Rewards", Default = false })
autoTimeRewardToggle:OnChanged(function()
    local v = autoTimeRewardToggle.Value
    autoTimeRewardGen = autoTimeRewardGen + 1
    autoTimeRewardEnabled = v
    if v then
        autoTimeRewardLoop(autoTimeRewardGen)
        Fluent:Notify({Title = "Time Rewards", Content = "Claiming rewards automatically!", Duration = 3})
    end
end)

Tabs.Collect:AddParagraph({ Title = "Manual Actions", Content = "One-click actions." })

Tabs.Collect:AddButton({
    Title = "Collect All Codes Now",
    Description = "Collect tokens and chests",
    Callback = function()
        pcall(function()
            fireRemote("CollectSoftwareDeveloperToken")
            fireRemote("CollectChest")

            local char, _, rootPart = getCharacter()
            if rootPart then
                local chestsFolder = Workspace:FindFirstChild("Map")
                if chestsFolder then
                    chestsFolder = chestsFolder:FindFirstChild("Gameplay")
                    if chestsFolder then chestsFolder = chestsFolder:FindFirstChild("Chests") end
                end
                if chestsFolder then
                    for _, chest in pairs(chestsFolder:GetDescendants()) do
                        if chest:IsA("BasePart") and chest.Name == "CollectPart" then
                            pcall(function()
                                firetouchinterest(rootPart, chest, 0)
                                task.wait()
                                firetouchinterest(rootPart, chest, 1)
                            end)
                        end
                    end
                end
            end
        end)
        Fluent:Notify({Title = "Collect All", Content = "Collected tokens and chests!", Duration = 3})
    end
})

Tabs.Collect:AddButton({
    Title = "Sell Everything Now",
    Description = "Open Manage > Software > Select All > Sell",
    Callback = function()
        pcall(function()
            -- Fire Software.Sell remote
            local sellRemote = ReplicatedStorage:FindFirstChild("Remotes")
            if sellRemote then
                sellRemote = sellRemote:FindFirstChild("Server")
                if sellRemote then
                    sellRemote = sellRemote:FindFirstChild("Software")
                    if sellRemote then
                        sellRemote = sellRemote:FindFirstChild("Sell")
                        if sellRemote then sellRemote:FireServer() end
                    end
                end
            end

            -- Click GUI buttons
            local gui = player.PlayerGui
            if gui then
                -- Step 1: Click CoreButtons.Sell to open Manage
                local sellCoreBtn = gui:FindFirstChild("Main")
                if sellCoreBtn then
                    sellCoreBtn = sellCoreBtn:FindFirstChild("SideFrame")
                    if sellCoreBtn then sellCoreBtn = sellCoreBtn:FindFirstChild("CoreButtons") end
                    if sellCoreBtn then sellCoreBtn = sellCoreBtn:FindFirstChild("Sell") end
                    if sellCoreBtn then
                        pcall(function()
                            for _, conn in pairs(getconnections(sellCoreBtn.MouseButton1Click)) do conn:Fire() end
                        end)
                    end
                end
                task.wait(0.5)

                -- Step 2: Click Software tab
                local manageGui = gui:FindFirstChild("Manage")
                if manageGui then
                    local frame = manageGui:FindFirstChild("Frame")
                    if frame then
                        local tabBar = frame:FindFirstChild("TabBar")
                        if tabBar then
                            local softwareTab = tabBar:FindFirstChild("Software")
                            if softwareTab then
                                local softwareBtn = softwareTab:FindFirstChild("Software")
                                if softwareBtn then
                                    pcall(function()
                                        for _, conn in pairs(getconnections(softwareBtn.MouseButton1Click)) do conn:Fire() end
                                    end)
                                end
                            end
                        end
                        task.wait(0.3)

                        -- Step 3: SelectAll then Sell
                        local bottomBar = frame:FindFirstChild("BottomBar")
                        if bottomBar then
                            local selectAll = bottomBar:FindFirstChild("SelectAll")
                            if selectAll then
                                pcall(function()
                                    for _, conn in pairs(getconnections(selectAll.MouseButton1Click)) do conn:Fire() end
                                end)
                            end
                            task.wait(0.3)
                            local sellBtn = bottomBar:FindFirstChild("Sell")
                            if sellBtn then
                                pcall(function()
                                    for _, conn in pairs(getconnections(sellBtn.MouseButton1Click)) do conn:Fire() end
                                end)
                            end
                        end
                    end
                end
            end
        end)
        Fluent:Notify({Title = "Sell All", Content = "Sold everything!", Duration = 3})
    end
})

Tabs.Collect:AddButton({
    Title = "Buy All Merchant Items",
    Description = "Buy from merchant and market",
    Callback = function()
        pcall(function()
            local vendorFolder = ReplicatedStorage:FindFirstChild("Remotes")
            if vendorFolder then
                vendorFolder = vendorFolder:FindFirstChild("Server")
                if vendorFolder then
                    vendorFolder = vendorFolder:FindFirstChild("Vendor")
                    if vendorFolder then
                        local buyMerchant = vendorFolder:FindFirstChild("BuyMerchantItem")
                        if buyMerchant then pcall(function() buyMerchant:FireServer() end) end
                        local buyMarket = vendorFolder:FindFirstChild("BuyMarketItem")
                        if buyMarket then pcall(function() buyMarket:FireServer() end) end
                    end
                end
            end
        end)
        Fluent:Notify({Title = "Merchant", Content = "Bought from merchant!", Duration = 3})
    end
})

-- ============ PLAYER TAB ============
Tabs.Player:AddParagraph({ Title = "Movement", Content = "Speed and movement hacks." })

local speedToggle = Tabs.Player:AddToggle("SpeedToggle", { Title = "Speed Hack", Default = false })
speedToggle:OnChanged(function()
    local v = speedToggle.Value
    speedEnabled = v
    if not v then
        local _, humanoid = getCharacter()
        if humanoid then
            humanoid.WalkSpeed = 16
        end
    end
end)

Tabs.Player:AddSlider("SpeedValue", {
    Title = "Walk Speed",
    Default = 16,
    Min = 16,
    Max = 500,
    Rounding = 0,
    Callback = function(v) desiredSpeed = v end
})

Tabs.Player:AddParagraph({ Title = "Visual", Content = "Visual enhancements." })

local fullbrightToggle = Tabs.Player:AddToggle("FullbrightToggle", { Title = "Fullbright", Default = false })
fullbrightToggle:OnChanged(function()
    local v = fullbrightToggle.Value
    fullbrightEnabled = v
    if v then
        enableFullbright()
        Fluent:Notify({Title = "Fullbright", Content = "Fullbright enabled!", Duration = 3})
    else
        disableFullbright()
    end
end)

Tabs.Player:AddParagraph({ Title = "Misc", Content = "Other utilities." })

local antiAfkToggle = Tabs.Player:AddToggle("AntiAfkToggle", { Title = "Anti-AFK", Default = true })
antiAfkToggle:OnChanged(function()
    local v = antiAfkToggle.Value
    antiAfkEnabled = v
    Fluent:Notify({Title = "Anti-AFK", Content = v and "Anti-AFK enabled!" or "Anti-AFK disabled.", Duration = 3})
end)

-- ============ INFO TAB ============
Tabs.Info:AddParagraph({
    Title = "BOON Hub - Code a Business",
    Content = "Script for Code a Business (Coding Simulator 2)\n\nFeatures:\n- Auto Code & Auto Collect\n- Auto Sell (Software)\n- Auto Mine & Auto Fish\n- Auto Meteor Collector\n- Auto Time Rewards\n- Speed Hack & Fullbright\n- Anti-AFK\n\nMinimize: RightControl"
})

Tabs.Info:AddParagraph({
    Title = "Remotes Found",
    Content = "Loading..."
})

-- Update remote info after delay
task.spawn(function()
    task.wait(2)
    local remoteList = {}
    for name, remote in pairs(cachedRemotes) do
        table.insert(remoteList, name .. " (" .. remote.ClassName .. ")")
    end
    table.sort(remoteList)
    local remoteText = #remoteList > 0 and table.concat(remoteList, "\n") or "No remotes found"
    print("[BOON Hub] Remotes: " .. remoteText)
end)

Tabs.Info:AddButton({
    Title = "FULL GAME SCAN (saves to file)",
    Description = "Scan the entire game and save as txt",
    Callback = function()
        Fluent:Notify({Title = "Scanning...", Content = "Please wait, scanning entire game...", Duration = 5})

        local lines = {}
        local function log(s) lines[#lines + 1] = s end

        local remoteCount, ppCount, cdCount, btnCount = 0, 0, 0, 0
        local scanOk, scanErr = pcall(function()

        log("================================================================")
        log("  BOON Hub - FULL GAME SCAN")
        log("  Game PlaceId: " .. tostring(game.PlaceId))
        local gameName = "Unknown"
        pcall(function() gameName = game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name end)
        log("  Game Name: " .. gameName)
        log("  Player: " .. player.Name .. " (UserId: " .. tostring(player.UserId) .. ")")
        log("  Timestamp: " .. os.date("%Y-%m-%d %H:%M:%S"))
        log("================================================================")

        -- Section 1: ALL RemoteEvents and RemoteFunctions
        log("\n\n=== 1. ALL REMOTES (ReplicatedStorage) ===")
        remoteCount = 0
        for _, v in pairs(ReplicatedStorage:GetDescendants()) do
            if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                remoteCount = remoteCount + 1
                log("  " .. v.ClassName .. ": " .. v.Name .. " | Path: " .. v:GetFullName())
            end
        end
        log("  TOTAL: " .. remoteCount .. " remotes")

        -- Section 2: ALL ProximityPrompts
        log("\n\n=== 2. ALL PROXIMITY PROMPTS (Workspace) ===")
        ppCount = 0
        for _, v in pairs(Workspace:GetDescendants()) do
            if v:IsA("ProximityPrompt") then
                ppCount = ppCount + 1
                local action, obj, key, enabled, holdDur, maxDist = "", "", "", "", "", ""
                pcall(function() action = v.ActionText end)
                pcall(function() obj = v.ObjectText end)
                pcall(function() key = tostring(v.KeyboardKeyCode) end)
                pcall(function() enabled = tostring(v.Enabled) end)
                pcall(function() holdDur = tostring(v.HoldDuration) end)
                pcall(function() maxDist = tostring(v.MaxActivationDistance) end)
                log("  [PP] " .. v:GetFullName())
                log("        Action: " .. action .. " | Object: " .. obj .. " | Key: " .. key)
                log("        Enabled: " .. enabled .. " | HoldDuration: " .. holdDur .. " | MaxDist: " .. maxDist)
            end
        end
        log("  TOTAL: " .. ppCount .. " prompts")

        -- Section 3: ALL ClickDetectors
        log("\n\n=== 3. ALL CLICK DETECTORS (Workspace) ===")
        cdCount = 0
        for _, v in pairs(Workspace:GetDescendants()) do
            if v:IsA("ClickDetector") then
                cdCount = cdCount + 1
                local maxDist = ""
                pcall(function() maxDist = tostring(v.MaxActivationDistance) end)
                log("  [CD] " .. v:GetFullName() .. " | MaxDist: " .. maxDist)
            end
        end
        log("  TOTAL: " .. cdCount .. " detectors")

        -- Section 4: Workspace structure (2 levels deep)
        log("\n\n=== 4. WORKSPACE STRUCTURE (2 levels) ===")
        for _, v in pairs(Workspace:GetChildren()) do
            log("  " .. v.ClassName .. ": " .. v.Name)
            if v:IsA("Model") or v:IsA("Folder") then
                for _, child in pairs(v:GetChildren()) do
                    log("    " .. child.ClassName .. ": " .. child.Name)
                end
            end
        end

        -- Section 5: Player area / plot / tycoon
        log("\n\n=== 5. PLAYER AREA / PLOT ===")
        local foundPlot = false
        for _, v in pairs(Workspace:GetDescendants()) do
            if (v:IsA("Model") or v:IsA("Folder")) then
                local vn = v.Name:lower()
                if vn == player.Name:lower() or vn == tostring(player.UserId)
                    or vn:find("plot") or vn:find("tycoon") or vn:find("office") then
                    foundPlot = true
                    log("  Found: " .. v:GetFullName() .. " (" .. v.ClassName .. ")")
                    for _, child in pairs(v:GetChildren()) do
                        log("    " .. child.ClassName .. ": " .. child.Name)
                        if child:IsA("Model") or child:IsA("Folder") then
                            for _, sub in pairs(child:GetChildren()) do
                                log("      " .. sub.ClassName .. ": " .. sub.Name)
                            end
                        end
                    end
                end
            end
        end
        if not foundPlot then log("  No player area found") end

        -- Section 6: ALL ScreenGuis and their children
        log("\n\n=== 6. PLAYER GUI - ALL SCREENS ===")
        local gui = player.PlayerGui
        if gui then
            for _, screen in pairs(gui:GetChildren()) do
                local enabled = "N/A"
                pcall(function() enabled = tostring(screen.Enabled) end)
                log("  " .. screen.ClassName .. ": " .. screen.Name .. " | Enabled: " .. enabled)
                pcall(function()
                    for _, child in pairs(screen:GetChildren()) do
                        log("    " .. child.ClassName .. ": " .. child.Name)
                    end
                end)
            end
        end

        -- Section 7: ALL GUI Buttons with text and visibility
        log("\n\n=== 7. ALL GUI BUTTONS (TextButton/ImageButton) ===")
        btnCount = 0
        if gui then
            for _, v in pairs(gui:GetDescendants()) do
                if v:IsA("TextButton") or v:IsA("ImageButton") then
                    btnCount = btnCount + 1
                    local t, vis, active = "", "", ""
                    pcall(function() t = v.Text end)
                    pcall(function() vis = tostring(v.Visible) end)
                    pcall(function() active = tostring(v.Active) end)
                    log("  [BTN] " .. v:GetFullName())
                    log("        Text: \"" .. t .. "\" | Visible: " .. vis .. " | Active: " .. active)
                end
            end
        end
        log("  TOTAL: " .. btnCount .. " buttons")

        -- Section 8: ALL TextLabels (shows game text/data)
        log("\n\n=== 8. ALL GUI TEXT LABELS ===")
        local labelCount = 0
        if gui then
            for _, v in pairs(gui:GetDescendants()) do
                if v:IsA("TextLabel") then
                    local t, vis = "", ""
                    pcall(function() t = v.Text end)
                    pcall(function() vis = tostring(v.Visible) end)
                    if t ~= "" then
                        labelCount = labelCount + 1
                        if labelCount <= 100 then
                            log("  [LBL] " .. v:GetFullName())
                            log("        Text: \"" .. t .. "\" | Visible: " .. vis)
                        end
                    end
                end
            end
        end
        if labelCount > 100 then
            log("  ... and " .. (labelCount - 100) .. " more labels")
        end
        log("  TOTAL: " .. labelCount .. " non-empty labels")

        -- Section 9: ALL TextBoxes (input fields)
        log("\n\n=== 9. ALL GUI TEXT BOXES (inputs) ===")
        if gui then
            for _, v in pairs(gui:GetDescendants()) do
                if v:IsA("TextBox") then
                    local t, placeholder = "", ""
                    pcall(function() t = v.Text end)
                    pcall(function() placeholder = v.PlaceholderText end)
                    log("  [INPUT] " .. v:GetFullName())
                    log("          Text: \"" .. t .. "\" | Placeholder: \"" .. placeholder .. "\"")
                end
            end
        end

        -- Section 10: TouchTransmitters
        log("\n\n=== 10. TOUCH TRANSMITTERS (collectibles) ===")
        local ttCount = 0
        for _, v in pairs(Workspace:GetDescendants()) do
            if v:IsA("TouchTransmitter") then
                ttCount = ttCount + 1
                if ttCount <= 100 then
                    log("  [TT] " .. v:GetFullName())
                end
            end
        end
        if ttCount > 100 then
            log("  ... and " .. (ttCount - 100) .. " more")
        end
        log("  TOTAL: " .. ttCount .. " touch transmitters")

        -- Section 11: Remotes in other services
        log("\n\n=== 11. REMOTES IN OTHER LOCATIONS ===")
        pcall(function()
            for _, v in pairs(game:GetService("Workspace"):GetDescendants()) do
                if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                    log("  [Workspace] " .. v.ClassName .. ": " .. v:GetFullName())
                end
            end
        end)
        pcall(function()
            for _, v in pairs(player:GetDescendants()) do
                if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                    log("  [Player] " .. v.ClassName .. ": " .. v:GetFullName())
                end
            end
        end)

        -- Section 12: Player stats/leaderstats and all player children
        log("\n\n=== 12. PLAYER STATS / LEADERSTATS ===")
        for _, child in pairs(player:GetChildren()) do
            local val = ""
            pcall(function() val = " = " .. tostring(child.Value) end)
            log("  [PlayerChild] " .. child.ClassName .. ": " .. child.Name .. val)
            if child:IsA("Folder") then
                for _, sub in pairs(child:GetChildren()) do
                    local subVal = ""
                    pcall(function() subVal = " = " .. tostring(sub.Value) end)
                    log("    " .. sub.ClassName .. ": " .. sub.Name .. subVal)
                end
            end
        end

        log("\n\n================================================================")
        log("  Scan complete! " .. remoteCount .. " remotes, " .. ppCount .. " prompts, " .. cdCount .. " detectors, " .. btnCount .. " buttons")
        log("================================================================")

        end) -- end pcall(function()

        if not scanOk then
            log("\n\n[SCAN ERROR] " .. tostring(scanErr))
            log("Partial scan results are shown above.")
        end

        local output = table.concat(lines, "\n")
        local fileName = "BOON_GameScan_" .. game.PlaceId .. ".txt"
        local saved = false
        pcall(function()
            writefile(fileName, output)
            saved = true
        end)

        if saved then
            Fluent:Notify({Title = "Scan Saved!", Content = "File: " .. fileName .. "\nFind it in your executor's workspace folder.", Duration = 20})
        else
            local clipOk = false
            pcall(function()
                setclipboard(output)
                clipOk = true
            end)
            if clipOk then
                Fluent:Notify({Title = "Copied!", Content = "Scan results copied to clipboard!", Duration = 15})
            else
                print(output)
                Fluent:Notify({Title = "Scan Done!", Content = "Results printed to F9 console.", Duration = 10})
            end
        end
    end
})

-- Select first tab
Window:SelectTab(1)

-- ============ HEARTBEAT LOOP ============
RunService.Heartbeat:Connect(function()
    local char, humanoid, rootPart = getCharacter()
    if not char then return end

    -- Speed hack
    if speedEnabled and humanoid then
        humanoid.WalkSpeed = desiredSpeed
    end
end)

-- Notify script loaded
Fluent:Notify({
    Title = "BOON Hub Loaded",
    Content = "Code a Business script is ready!\nMinimize: RightControl",
    Duration = 5
})
