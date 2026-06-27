--[[
    Craft a Menu — Auto-Farm
    Game: https://www.roblox.com/games/119569506060933  (Goofy Recipes)

    Gameplay loop this script automates:
      1. Crates ride a conveyor belt -> OPEN them to collect ingredients.
      2. Combine ingredients in an oven -> "Make Food" (E) to craft/level recipes.
      3. Recipes generate money; collect cash and re-invest into bigger crates.

    Design notes:
      * Craft a Menu is server-authoritative. Money/recipes can't be faked client
        side, so this farms by driving the same actions you would: firing the
        crate/oven ProximityPrompts + ClickDetectors and the game's RemoteEvents.
      * Everything is GENERIC (scans by name/type) so it survives small updates,
        and every executor call is wrapped in pcall + rate limited.
      * Use the "Calibrate" tab -> "Dump Remotes & Prompts" to export the exact
        remote/prompt names if the auto-detection ever misses something.
]]

----------------------------------------------------------------------
-- Services
----------------------------------------------------------------------
local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace         = game:GetService("Workspace")
local StarterGui        = game:GetService("StarterGui")
local VirtualUser       = game:GetService("VirtualUser")

local LocalPlayer = Players.LocalPlayer

----------------------------------------------------------------------
-- Executor helpers (never assume they exist)
----------------------------------------------------------------------
local function safe(name)
    local env = getfenv(0)
    local fn = rawget(env, name) or rawget(_G, name)
    if type(fn) ~= "function" then
        local ok, genv = pcall(function() return getgenv() end)
        if ok and type(genv) == "table" then fn = rawget(genv, name) end
    end
    if type(fn) == "function" then return fn end
    return nil
end

-- Elevate thread identity so CoreGui/UI access works on every executor (incl. Potassium).
do
    for _, n in ipairs({ "setthreadidentity", "setidentity", "set_thread_identity" }) do
        local fn = rawget(_G, n)
        if type(fn) == "function" then pcall(fn, 8) end
    end
end

local fireProximityPrompt = safe("fireproximityprompt")
local fireClickDetector   = safe("fireclickdetector")
local writefile_          = safe("writefile")
local setclipboard_       = safe("setclipboard")
local getgenv_            = safe("getgenv") or function() return _G end
local GENV                = getgenv_()

-- Clean restart if the script is executed again. We bump a generation token:
-- every loop captures its generation and exits the moment a newer load bumps it,
-- so there is no race where an old loop resumes after a fixed wait. We also tear
-- down the old UI/connection so re-running never leaks windows or connections.
if GENV.__CraftAMenuLoaded then
    if GENV.__CraftAMenuAntiAfk then
        pcall(function() GENV.__CraftAMenuAntiAfk:Disconnect() end)
        GENV.__CraftAMenuAntiAfk = nil
    end
    if GENV.__CraftAMenuRayfield then
        pcall(function() GENV.__CraftAMenuRayfield:Destroy() end)
        GENV.__CraftAMenuRayfield = nil
    end
end
GENV.__CraftAMenuGen = (GENV.__CraftAMenuGen or 0) + 1
local MY_GEN = GENV.__CraftAMenuGen
GENV.__CraftAMenuLoaded = true

----------------------------------------------------------------------
-- State
----------------------------------------------------------------------
local State = GENV.__CraftAMenuState or {
    autoMakeFood   = false,
    autoSpawn      = false,
    autoCollect    = false,
    autoSell       = false,
    antiAfk        = false,
    promptRadius   = 0,      -- studs; 0 = whole map (default: fire all your tables)
    actionDelay    = 0.15,   -- seconds between fired actions (rate limit)
    loopDelay      = 0.5,    -- seconds between farm passes
}
GENV.__CraftAMenuState = State

----------------------------------------------------------------------
-- Character helpers
----------------------------------------------------------------------
local function getRoot()
    local char = LocalPlayer.Character
    if not char then return nil end
    return char:FindFirstChild("HumanoidRootPart") or char:FindFirstChildWhichIsA("BasePart")
end

local function withinRadius(inst)
    if State.promptRadius <= 0 then return true end
    local root = getRoot()
    if not root then return false end  -- no character (dead/respawning): skip
    local part = inst:IsA("BasePart") and inst
        or (inst.Parent and inst.Parent:IsA("BasePart") and inst.Parent)
        or inst:FindFirstAncestorWhichIsA("BasePart")
    if not part then return true end
    return (part.Position - root.Position).Magnitude <= State.promptRadius
end

----------------------------------------------------------------------
-- Generic scanners
----------------------------------------------------------------------
local function matchesAny(text, words)
    text = string.lower(text)
    for _, w in ipairs(words) do
        if string.find(text, w, 1, true) then return true end
    end
    return false
end

-- Fire every ProximityPrompt whose name/object/ancestry matches `words`.
local function firePromptsMatching(words)
    if not fireProximityPrompt then return 0 end
    local count = 0
    for _, prompt in ipairs(Workspace:GetDescendants()) do
        if prompt:IsA("ProximityPrompt") and prompt.Enabled then
            local label = (prompt.ActionText or "") .. " " .. (prompt.ObjectText or "")
                .. " " .. prompt.Name .. " " .. (prompt.Parent and prompt.Parent.Name or "")
            if (#words == 0 or matchesAny(label, words)) and withinRadius(prompt) then
                -- Single arg: passing a 2nd count of 0 is a no-op on many executors.
                local ok = pcall(fireProximityPrompt, prompt)
                if ok then
                    count += 1
                    task.wait(State.actionDelay)
                end
            end
        end
    end
    return count
end

-- Fire every ClickDetector whose ancestry matches `words`.
local function fireClicksMatching(words)
    if not fireClickDetector then return 0 end
    local count = 0
    for _, cd in ipairs(Workspace:GetDescendants()) do
        if cd:IsA("ClickDetector") then
            local label = cd.Name .. " " .. (cd.Parent and cd.Parent.Name or "")
            if (#words == 0 or matchesAny(label, words)) and withinRadius(cd) then
                local ok = pcall(fireClickDetector, cd)
                if ok then
                    count += 1
                    task.wait(State.actionDelay)
                end
            end
        end
    end
    return count
end

-- Collect every RemoteEvent/RemoteFunction in ReplicatedStorage once.
local function collectRemotes()
    local list = {}
    for _, v in ipairs(ReplicatedStorage:GetDescendants()) do
        if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
            table.insert(list, v)
        end
    end
    return list
end

-- Fire remotes whose full name matches `words` (no args; safe best-effort).
-- Skips `*Local` remotes: those are server->client UI events, so firing them
-- from the client does nothing useful (and just spams the local UI).
local function fireRemotesMatching(words)
    local count = 0
    for _, r in ipairs(collectRemotes()) do
        if not r.Name:match("Local$") and matchesAny(r.Name, words) then
            local ok
            if r:IsA("RemoteEvent") then
                ok = pcall(function() r:FireServer() end)
            else
                -- InvokeServer blocks until the server replies; run it in its own
                -- thread so a slow/hanging handler can't stall the farm loop.
                ok = true
                task.spawn(function() pcall(function() r:InvokeServer() end) end)
            end
            if ok then
                count += 1
                task.wait(State.actionDelay)
            end
        end
    end
    return count
end

----------------------------------------------------------------------
-- Keyword sets (the game uses E = "Make Food"; crates open via prompt/click)
----------------------------------------------------------------------
-- Tuned to the real game tree (see Calibrate dump):
--   Make Food  -> ProximityPrompt ActionText "Make Food" on Plots.*.CraftTables.*
--   Spawn      -> SpawnButton ClickDetectors + ClickSpawnButton RemoteEvent
local KW_MAKE    = { "make food", "make", "cook", "craft" }
local KW_SPAWN   = { "spawn" }
local KW_COLLECT = { "collect", "cash", "money", "coin", "reward", "income" }
local KW_SELL    = { "sell", "serve", "customer", "deliver", "order" }

----------------------------------------------------------------------
-- Make-Food via key E (the game's documented keybind)
----------------------------------------------------------------------
local pressE
do
    local VIM = nil
    pcall(function() VIM = game:GetService("VirtualInputManager") end)
    pressE = function()
        if VIM then
            pcall(function()
                VIM:SendKeyEvent(true, Enum.KeyCode.E, false, game)
                task.wait(0.05)
                VIM:SendKeyEvent(false, Enum.KeyCode.E, false, game)
            end)
        end
    end
end

----------------------------------------------------------------------
-- Farm loops (each runs in its own thread, guarded by State flags)
----------------------------------------------------------------------
local function startLoop(flagKey, body)
    task.spawn(function()
        -- Exit as soon as a newer execution bumps the generation token.
        while GENV.__CraftAMenuGen == MY_GEN do
            if State[flagKey] then
                pcall(body)
            end
            task.wait(State.loopDelay)
        end
    end)
end

local loopsStarted = false
local function startLoops()
    if loopsStarted then return end
    loopsStarted = true

    startLoop("autoMakeFood", function()
        -- Core farm: trigger the "Make Food" prompts on your craft tables.
        local fired = firePromptsMatching(KW_MAKE)
        if fired == 0 then
            pressE()  -- fallback to the in-game E keybind if no prompt matched
        end
    end)

    startLoop("autoSpawn", function()
        -- Spawn customers/orders: SpawnButton click detectors + remote.
        fireClicksMatching(KW_SPAWN)
        fireRemotesMatching(KW_SPAWN)
    end)

    startLoop("autoCollect", function()
        firePromptsMatching(KW_COLLECT)
        fireClicksMatching(KW_COLLECT)
        fireRemotesMatching(KW_COLLECT)
    end)

    startLoop("autoSell", function()
        firePromptsMatching(KW_SELL)
        fireClicksMatching(KW_SELL)
        fireRemotesMatching(KW_SELL)
    end)
end

----------------------------------------------------------------------
-- Anti-AFK
----------------------------------------------------------------------
local function setAntiAfk(on)
    State.antiAfk = on
    if on and not GENV.__CraftAMenuAntiAfk then
        GENV.__CraftAMenuAntiAfk = LocalPlayer.Idled:Connect(function()
            pcall(function()
                VirtualUser:CaptureController()
                VirtualUser:ClickButton2(Vector2.new())
            end)
        end)
    elseif (not on) and GENV.__CraftAMenuAntiAfk then
        GENV.__CraftAMenuAntiAfk:Disconnect()
        GENV.__CraftAMenuAntiAfk = nil
    end
end

----------------------------------------------------------------------
-- Calibration dump (export remotes + prompts to file & clipboard)
----------------------------------------------------------------------
local function buildDump()
    local lines = { "== Craft a Menu dump ==", "PlaceId: " .. tostring(game.PlaceId), "" }

    table.insert(lines, "-- RemoteEvents / RemoteFunctions --")
    for _, r in ipairs(collectRemotes()) do
        table.insert(lines, ("[%s] %s"):format(r.ClassName, r:GetFullName()))
    end

    table.insert(lines, "")
    table.insert(lines, "-- ProximityPrompts (in workspace) --")
    for _, p in ipairs(Workspace:GetDescendants()) do
        if p:IsA("ProximityPrompt") then
            table.insert(lines, ("Action='%s' Object='%s' @ %s"):format(
                p.ActionText or "", p.ObjectText or "", p:GetFullName()))
        end
    end

    table.insert(lines, "")
    table.insert(lines, "-- ClickDetectors (in workspace) --")
    for _, c in ipairs(Workspace:GetDescendants()) do
        if c:IsA("ClickDetector") then
            table.insert(lines, c:GetFullName())
        end
    end

    return table.concat(lines, "\n")
end

----------------------------------------------------------------------
-- GUI (Rayfield)
----------------------------------------------------------------------
local Rayfield
do
    local ok, lib = pcall(function()
        return loadstring(game:HttpGet("https://sirius.menu/rayfield"))()
    end)
    if ok then Rayfield = lib end
end
GENV.__CraftAMenuRayfield = Rayfield

local function notify(title, text, dur)
    if Rayfield then
        pcall(function() Rayfield:Notify({ Title = title, Content = text, Duration = dur or 4 }) end)
    else
        pcall(function()
            StarterGui:SetCore("SendNotification", { Title = title, Text = text, Duration = dur or 4 })
        end)
    end
end

if not Rayfield then
    -- No GUI library; still run with safe defaults so the script isn't useless.
    State.autoMakeFood = true
    State.autoSpawn = true
    setAntiAfk(true)
    startLoops()
    notify("Craft a Menu", "Rayfield UI failed to load; running with defaults.", 8)
    return
end

local Window = Rayfield:CreateWindow({
    Name = "Craft a Menu • Auto-Farm",
    LoadingTitle = "Craft a Menu",
    LoadingSubtitle = "by alitravians",
    ConfigurationSaving = { Enabled = true, FolderName = "CraftAMenu", FileName = "CraftAMenu" },
    KeySystem = false,
})

----------------------------------------------------------------------
-- Main tab
----------------------------------------------------------------------
local Main = Window:CreateTab("Auto-Farm", "play")
Main:CreateSection("Farming")

Main:CreateToggle({
    Name = "Auto Make Food (cook / level recipes)",
    CurrentValue = State.autoMakeFood,
    Flag = "cam_make",
    Callback = function(v) State.autoMakeFood = v; startLoops() end,
})

Main:CreateToggle({
    Name = "Auto Spawn Customers",
    CurrentValue = State.autoSpawn,
    Flag = "cam_spawn",
    Callback = function(v) State.autoSpawn = v; startLoops() end,
})

Main:CreateToggle({
    Name = "Auto Collect Money / Rewards",
    CurrentValue = State.autoCollect,
    Flag = "cam_collect",
    Callback = function(v) State.autoCollect = v; startLoops() end,
})

Main:CreateToggle({
    Name = "Auto Sell / Serve Customers",
    CurrentValue = State.autoSell,
    Flag = "cam_sell",
    Callback = function(v) State.autoSell = v; startLoops() end,
})

Main:CreateButton({
    Name = "Run ALL once (manual pass)",
    Callback = function()
        task.spawn(function()
            local n = firePromptsMatching({}) + fireClicksMatching({})
            notify("Craft a Menu", ("Fired %d prompts/clicks nearby."):format(n))
        end)
    end,
})

----------------------------------------------------------------------
-- Settings tab
----------------------------------------------------------------------
local Settings = Window:CreateTab("Settings", "settings")
Settings:CreateSection("Performance & Range")

Settings:CreateSlider({
    Name = "Prompt Radius (0 = whole map)",
    Range = { 0, 300 },
    Increment = 5,
    CurrentValue = State.promptRadius,
    Suffix = " studs",
    Flag = "cam_radius",
    Callback = function(v) State.promptRadius = v end,
})

Settings:CreateSlider({
    Name = "Action Delay (rate limit)",
    Range = { 0.05, 1 },
    Increment = 0.05,
    CurrentValue = State.actionDelay,
    Suffix = " s",
    Flag = "cam_actiondelay",
    Callback = function(v) State.actionDelay = v end,
})

Settings:CreateSlider({
    Name = "Loop Delay (pause between passes)",
    Range = { 0.1, 5 },
    Increment = 0.1,
    CurrentValue = State.loopDelay,
    Suffix = " s",
    Flag = "cam_loopdelay",
    Callback = function(v) State.loopDelay = v end,
})

Settings:CreateToggle({
    Name = "Anti-AFK",
    CurrentValue = State.antiAfk,
    Flag = "cam_antiafk",
    Callback = function(v) setAntiAfk(v) end,
})

Settings:CreateButton({
    Name = "Rejoin Server",
    Callback = function()
        pcall(function()
            game:GetService("TeleportService"):Teleport(game.PlaceId, LocalPlayer)
        end)
    end,
})

----------------------------------------------------------------------
-- Calibration tab
----------------------------------------------------------------------
local Calib = Window:CreateTab("Calibrate", "wrench")
Calib:CreateSection("Reverse-engineering helpers")
Calib:CreateParagraph({
    Title = "How to use",
    Content = "If a feature misses something, press Dump to export the game's "
        .. "remotes/prompts. Share the file so the keyword lists can be tuned.",
})

Calib:CreateButton({
    Name = "Dump Remotes & Prompts (file + clipboard)",
    Callback = function()
        local dump = buildDump()
        if writefile_ then pcall(writefile_, "CraftAMenu_dump.txt", dump) end
        if setclipboard_ then pcall(setclipboard_, dump) end
        notify("Craft a Menu", "Dumped to CraftAMenu_dump.txt + clipboard.", 6)
    end,
})

Calib:CreateButton({
    Name = "Print remotes to console (F9)",
    Callback = function()
        for _, r in ipairs(collectRemotes()) do
            print(("[%s] %s"):format(r.ClassName, r:GetFullName()))
        end
        notify("Craft a Menu", "Printed remotes to console (F9).", 4)
    end,
})

----------------------------------------------------------------------
-- Boot
----------------------------------------------------------------------
startLoops()
-- Re-establish Anti-AFK if persisted State has it enabled (the toggle's Callback
-- only fires on user interaction, so a re-exec would otherwise leave it ON-but-dead).
if State.antiAfk then setAntiAfk(true) end
pcall(function() Rayfield:LoadConfiguration() end)
notify("Craft a Menu", "Loaded. Toggle the farms in the Auto-Farm tab.", 6)
