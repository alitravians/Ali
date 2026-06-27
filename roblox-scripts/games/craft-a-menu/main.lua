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
local LogService        = game:GetService("LogService")

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
local firetouchinterest   = safe("firetouchinterest")
local writefile_          = safe("writefile")
local setclipboard_       = safe("setclipboard")
local getgenv_            = safe("getgenv") or function() return _G end
local getconnections_     = safe("getconnections")
local firesignal_         = safe("firesignal")
local hookmetamethod_     = safe("hookmetamethod")
local getnamecallmethod_  = safe("getnamecallmethod")
local newcclosure_        = safe("newcclosure") or function(f) return f end
local decompile_          = safe("decompile")
local makefolder_         = safe("makefolder")
local isfolder_           = safe("isfolder")
local identifyexecutor_   = safe("identifyexecutor") or safe("getexecutorname")
local GENV                = getgenv_()

-- Best-effort executor name/version string for the report header.
local function executorName()
    if identifyexecutor_ then
        local ok, a, b = pcall(identifyexecutor_)
        if ok and a then return tostring(a) .. (b and (" " .. tostring(b)) or "") end
    end
    return "unknown"
end

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

-- Build a label from an instance plus a few ancestors, so matching survives the
-- common pattern where the meaningful name is on a parent (e.g. the ClickDetector
-- is `SpawnButton.Button.ClickDetector` -> the keyword lives two levels up).
local function ancestryLabel(inst, levels)
    local parts, node = {}, inst
    for _ = 0, (levels or 3) do
        if not node then break end
        table.insert(parts, node.Name)
        node = node.Parent
    end
    return table.concat(parts, " ")
end

-- Fire every ProximityPrompt whose name/object/ancestry matches `words`.
local function firePromptsMatching(words)
    if not fireProximityPrompt then return 0 end
    local count = 0
    for _, prompt in ipairs(Workspace:GetDescendants()) do
        if prompt:IsA("ProximityPrompt") then
            local label = (prompt.ActionText or "") .. " " .. (prompt.ObjectText or "")
                .. " " .. prompt.Name .. " " .. (prompt.Parent and prompt.Parent.Name or "")
            -- Only a targeted (non-empty) keyword set may fire disabled prompts; the
            -- empty-set "Run ALL" pass stays conservative and skips disabled ones.
            local targeted = #words > 0
            local eligible = prompt.Enabled or targeted
            if eligible and (#words == 0 or matchesAny(label, words)) and withinRadius(prompt) then
                -- Some games disable prompts until you're close; temporarily enable so
                -- the fire registers. Single arg only (a 2nd count of 0 is a no-op).
                local wasEnabled = prompt.Enabled
                if not wasEnabled then pcall(function() prompt.Enabled = true end) end
                local ok = pcall(fireProximityPrompt, prompt)
                if not wasEnabled then pcall(function() prompt.Enabled = wasEnabled end) end
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
            local label = ancestryLabel(cd, 3)
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

-- Fire one specific RemoteEvent/RemoteFunction by exact leaf name. Decompiled
-- source (HotbarUIScript) shows spawning a customer is
-- `RemoteEvents.ClickSpawnButton:FireServer(<SpawnButton.Button>)` -- it needs
-- the SpawnButton's Button part as the argument, not a bare no-arg call.
local function fireRemoteByName(name, ...)
    local container = ReplicatedStorage:FindFirstChild("RemoteEvents")
    local r = container and container:FindFirstChild(name)
    if r and not (r:IsA("RemoteEvent") or r:IsA("RemoteFunction")) then r = nil end
    if not r then
        for _, v in ipairs(ReplicatedStorage:GetDescendants()) do
            if v.Name == name and (v:IsA("RemoteEvent") or v:IsA("RemoteFunction")) then
                r = v
                break
            end
        end
    end
    if not r then return false end
    local args = table.pack(...)
    if r:IsA("RemoteEvent") then
        return pcall(function() r:FireServer(table.unpack(args, 1, args.n)) end)
    end
    task.spawn(function() pcall(function() r:InvokeServer(table.unpack(args, 1, args.n)) end) end)
    return true
end

-- Find THIS player's plot. Decompiled PlotHelperModule: a plot Model under
-- workspace.Plots is yours when `plot:GetAttribute("OwnerUserId") == UserId`.
local function getMyPlot()
    local plots = Workspace:FindFirstChild("Plots")
    if not plots then return nil end
    for _, plot in ipairs(plots:GetChildren()) do
        if plot:IsA("Model") and plot:GetAttribute("OwnerUserId") == LocalPlayer.UserId then
            return plot
        end
    end
    return nil
end

-- World position of the plot, used to force StreamingEnabled to load it back in.
-- A Model's pivot is kept even when its parts are streamed out, so this is stable.
local function plotPosition(plot)
    local ok, pivot = pcall(function() return plot:GetPivot() end)
    if ok and pivot then return pivot.Position end
    local part = plot:FindFirstChildWhichIsA("BasePart", true)
    return part and part.Position or nil
end

-- Force the plot region to stream in WITHOUT moving the character, when possible.
-- StreamingEnabled unloads your money button while you stand at the cooking tables
-- (that is exactly why MoneyButton shows up as <missing> in the report).
local function streamInPlot(plot)
    local pos = plotPosition(plot)
    if not pos then return end
    pcall(function() LocalPlayer:RequestStreamAroundAsync(pos) end)
end

-- Wait (up to `timeout`s) for a named descendant Model to actually stream in.
local function waitForChild(parent, name, timeout)
    local t0 = os.clock()
    repeat
        local c = parent:FindFirstChild(name)
        if c then return c end
        task.wait(0.05)
    until os.clock() - t0 > (timeout or 0.5)
    return parent:FindFirstChild(name)
end

-- Collect money on YOUR plot. The decompiled game has NO collect remote: money is
-- banked only by the "Collect ALL Money" ProximityPrompt on MoneyButton (and the
-- "10X" one on MoneyButtonBig), plus touch hitboxes under CollectButtons. Both are
-- proximity/touch based, and the server validates that you are physically near AND
-- the part is streamed in. So we: stream the plot in, briefly teleport onto each
-- money button, fire its prompt, and (caller) restore the original position.
-- Returns the number of collect triggers fired.
local function fireCollectOnPlot(plot)
    if not plot then return 0 end
    local root = getRoot()

    -- 1) Force the plot to load even though we are standing at the tables.
    streamInPlot(plot)
    task.wait(0.1)

    local fired = 0
    local function triggerPromptUnder(model)
        if not model then return end
        -- Make sure the button part has streamed in before we look for the prompt.
        local part = model:FindFirstChild("Button") or model:FindFirstChildWhichIsA("BasePart", true)
        if root and part then
            pcall(function() root.CFrame = part.CFrame + Vector3.new(0, 3, 0) end)
            task.wait(0.1)
            part = model:FindFirstChild("Button") or part
        end
        for _, p in ipairs(model:GetDescendants()) do
            if p:IsA("ProximityPrompt") then
                local wasEnabled = p.Enabled
                if not wasEnabled then pcall(function() p.Enabled = true end) end
                if fireProximityPrompt and pcall(fireProximityPrompt, p) then fired += 1 end
                if not wasEnabled then pcall(function() p.Enabled = wasEnabled end) end
                task.wait(State.actionDelay)
            end
        end
    end

    -- 2) Fire the two known money buttons by name (stream them in if needed).
    triggerPromptUnder(waitForChild(plot, "MoneyButton", 0.4))
    triggerPromptUnder(waitForChild(plot, "MoneyButtonBig", 0.4))

    -- 3) Fallback: any other "collect" ProximityPrompt anywhere under the plot.
    for _, p in ipairs(plot:GetDescendants()) do
        if p:IsA("ProximityPrompt")
            and string.find(string.lower(p.ActionText or ""), "collect", 1, true)
            and not p:FindFirstAncestor("MoneyButton")
            and not p:FindFirstAncestor("MoneyButtonBig") then
            local part = p:FindFirstAncestorWhichIsA("BasePart")
            if root and part then
                pcall(function() root.CFrame = part.CFrame + Vector3.new(0, 3, 0) end)
                task.wait()
            end
            local wasEnabled = p.Enabled
            if not wasEnabled then pcall(function() p.Enabled = true end) end
            if fireProximityPrompt and pcall(fireProximityPrompt, p) then fired += 1 end
            if not wasEnabled then pcall(function() p.Enabled = wasEnabled end) end
            task.wait(State.actionDelay)
        end
    end

    -- 4) Touch-based CollectButtons (Hitbox with TouchInterest), if any.
    local cb = plot:FindFirstChild("CollectButtons")
    if cb and firetouchinterest and root then
        for _, m in ipairs(cb:GetChildren()) do
            local hit = m:FindFirstChild("Hitbox")
            if hit and hit:IsA("BasePart") then
                pcall(function() root.CFrame = hit.CFrame + Vector3.new(0, 3, 0) end)
                task.wait()
                -- UNC: firetouchinterest(playerPart, targetPart, toggle) -> fires
                -- target.Touched(playerPart), which is what the game's collect handler listens for.
                pcall(firetouchinterest, root, hit, 0)
                pcall(firetouchinterest, root, hit, 1)
                fired += 1
                task.wait(State.actionDelay)
            end
        end
    end

    return fired
end

-- Cooking is NOT just the "Make Food" prompt -- it is the craft flow shown in the
-- decompiled CraftUIScript. To turn your ingredients into a meal the game does:
--   1) ReplicatedStorage.CraftRequestAdd:FireServer(ingredientId)   -- "move to oven"
--   2) ReplicatedStorage.RemoteEvents.startCraft:FireServer(LocalPlayer)  -- cook
--   3) ReplicatedStorage.RemoteEvents.clearCraft:FireServer()       -- reset slots
-- Single-ingredient recipes exist (Potato/Egg/Flour/Milk/Meat/Vegetable/Sugar from
-- CardLibrary), so adding one owned ingredient is always a valid recipe. We read the
-- live ingredient inventory from the game's own InventoryModuleLocal so we know
-- exactly what we own. Returns the number of cook requests sent.
local cachedInvMod
local function getInventoryModule()
    if cachedInvMod ~= nil then return cachedInvMod or nil end
    local mod = ReplicatedStorage:FindFirstChild("InventoryModuleLocal")
    if not mod then cachedInvMod = false; return nil end
    local ok, res = pcall(require, mod)
    cachedInvMod = (ok and type(res) == "table") and res or false
    return cachedInvMod or nil
end

-- Collect every owned ingredient ID (with amount > 0) from InventoryModuleLocal.
-- The module stores ingredients as an ARRAY of {Id=..,Amount=..}; older/edge
-- shapes may key by Id (dict) or expose ingredientCountMap (Id -> count). We
-- read all three so a structure change can't silently zero us out.
local function ownedIngredientIds(invMod)
    local ids, seen = {}, {}
    local function take(id, amt)
        if type(id) == "string" and id ~= "" and (amt == nil or amt > 0) and not seen[id] then
            seen[id] = true
            table.insert(ids, id)
        end
    end
    if type(invMod) ~= "table" then return ids end
    local ing = invMod.ingredients
    if type(ing) == "table" then
        for k, v in pairs(ing) do
            if type(v) == "table" then
                take(v.Id or (type(k) == "string" and k or nil), v.Amount)
            elseif type(v) == "number" and type(k) == "string" then
                take(k, v)            -- dict: Id -> amount
            end
        end
    end
    local cm = invMod.ingredientCountMap
    if type(cm) == "table" then
        for id, amt in pairs(cm) do take(id, amt) end
    end
    return ids
end

-- Diagnostic snapshot of the last autoCook pass (shown in FULL REPORT).
local lastCook = { ran = false, invMod = false, ids = 0, fired = 0, sample = "", err = "" }

local function autoCook()
    local craftAdd   = ReplicatedStorage:FindFirstChild("CraftRequestAdd")
    local re         = ReplicatedStorage:FindFirstChild("RemoteEvents")
    local startCraft = re and re:FindFirstChild("startCraft")
    local clearCraft = re and re:FindFirstChild("clearCraft")
    lastCook = { ran = true, invMod = false, ids = 0, fired = 0, sample = "", err = "" }
    if not (craftAdd and startCraft) then
        lastCook.err = "missing CraftRequestAdd/startCraft remote"
        return 0
    end

    local invMod = getInventoryModule()
    lastCook.invMod = invMod ~= nil
    local ids = ownedIngredientIds(invMod)
    lastCook.ids = #ids
    lastCook.sample = table.concat({ ids[1], ids[2], ids[3] }, ", ")
    if #ids == 0 then
        lastCook.err = "no owned ingredients found in InventoryModuleLocal"
        return 0
    end

    local cooked = 0
    for _, id in ipairs(ids) do
        -- One craft per pass per ingredient: clear slots, add the single
        -- ingredient (single-ingredient recipes always match), then startCraft.
        -- clearCraft is a server round-trip, so wait before re-adding.
        if clearCraft then pcall(function() clearCraft:FireServer() end); task.wait(State.actionDelay) end
        pcall(function() craftAdd:FireServer(id) end)              -- move ingredient to oven
        task.wait(State.actionDelay)
        pcall(function() startCraft:FireServer(LocalPlayer) end)   -- cook it
        cooked += 1
        task.wait(State.actionDelay)
    end
    if clearCraft then pcall(function() clearCraft:FireServer() end) end
    lastCook.fired = cooked
    return cooked
end

-- Fire remotes whose leaf name matches `words` (no args; safe best-effort).
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
-- Narrow on purpose: bare "spawn" also matches "Respawn*" remotes, which would
-- keep killing/resetting the character. These two cover SpawnButton (ClickDetector,
-- matched via ancestry) and the ClickSpawnButton RemoteEvent.
local KW_SPAWN   = { "spawnbutton", "clickspawn" }
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
-- GUI buttons (money is collected by on-screen "+$" buttons, not by any
-- workspace prompt/click). Fire their click signals directly so Auto Collect
-- actually banks the accumulated income.
----------------------------------------------------------------------
local function fireGuiButton(btn)
    local fired = false
    -- Stop at the first signal that fires so a single button isn't clicked 3x.
    for _, sigName in ipairs({ "MouseButton1Click", "Activated", "MouseButton1Down" }) do
        local ok, sig = pcall(function() return btn[sigName] end)
        if ok and sig then
            if getconnections_ then
                pcall(function()
                    for _, c in ipairs(getconnections_(sig)) do
                        if type(c.Fire) == "function" then pcall(function() c:Fire() end); fired = true end
                    end
                end)
            end
            if (not fired) and firesignal_ then
                if pcall(firesignal_, sig) then fired = true end
            end
        end
        if fired then break end
    end
    return fired
end

-- Click the on-screen *collect* button. From the dump the real collector is
-- `ScreenGui.IncomeButton`; the tiered "+$" buttons are `BuyIncomeGui.IncomeButton1..3`
-- which are PURCHASES (they spend your cash / prompt Robux), so we must skip those.
-- We click only collect/claim-style buttons and hard-exclude any purchase/shop ones.
local function clickCollectButtons()
    local pg = LocalPlayer:FindFirstChild("PlayerGui")
    if not pg then return 0 end
    local count = 0
    for _, b in ipairs(pg:GetDescendants()) do
        if (b:IsA("TextButton") or b:IsA("ImageButton")) then
            local full = b:GetFullName()
            local low  = string.lower(full)
            -- Anything that buys/multiplies/opens a shop spends money -> never click.
            local isPurchase = full:find("BuyIncome") ~= nil
                or low:find("buy") ~= nil or low:find("mult") ~= nil
                or low:find("plus") ~= nil or low:find("shop") ~= nil
                or low:find("robux") ~= nil or low:find("gamepass") ~= nil
                or low:find("currency") ~= nil or low:find("2x") ~= nil
            -- Collect targets: IncomeButton / MoneyButton / any collect/claim button.
            local isCollect = b.Name == "IncomeButton"
                or matchesAny(b.Name, { "collect", "claim", "moneybutton" })
            if isCollect and not isPurchase then
                if fireGuiButton(b) then
                    count += 1
                    task.wait(State.actionDelay)
                end
            end
        end
    end
    return count
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
        -- Real cooking = the craft flow (move ingredients to oven -> startCraft),
        -- driven from the game's own remotes/inventory. This is what actually
        -- turns ingredients into meals; firing the "Make Food" prompt alone never
        -- moved the items to the oven.
        local cooked = autoCook()
        -- Also poke the on-table "Make Food" prompts (serve/cook at the station).
        local fired = firePromptsMatching(KW_MAKE)
        if cooked == 0 and fired == 0 then
            pressE()  -- last-resort fallback to the in-game E keybind
        end
    end)

    startLoop("autoSpawn", function()
        -- Spawn customers/orders. Spy-confirmed: ClickSpawnButton:FireServer().
        -- Decompiled source: ClickSpawnButton:FireServer(<SpawnButton.Button>).
        -- Pass YOUR plot's SpawnButton.Button part as the required argument.
        local plot = getMyPlot()
        local sb = plot and plot:FindFirstChild("SpawnButton")
        local btn = sb and sb:FindFirstChild("Button")
        if btn then
            fireRemoteByName("ClickSpawnButton", btn)
            -- Fire the SpawnButton's own ClickDetector directly (exact instance, not
            -- a keyword scan -- "spawnbutton" substring would also hit "RespawnButton").
            if fireClickDetector then
                local cd = btn:FindFirstChildWhichIsA("ClickDetector")
                if cd then pcall(fireClickDetector, cd) end
            end
        end
    end)

    startLoop("autoCollect", function()
        -- Bank income by triggering the real collect prompts on YOUR plot
        -- (MoneyButton -> "Collect ALL Money", MoneyButtonBig -> "...10X").
        -- fireCollectOnPlot forces the plot to stream in, teleports onto each
        -- collect prompt, and fires it. Save/restore position around the whole pass.
        local plot = getMyPlot()
        local root = getRoot()
        local saved = root and root.CFrame
        if plot then fireCollectOnPlot(plot) end
        if saved then
            task.wait()
            -- Re-fetch the root: if the character died mid-collect, the captured
            -- one is destroyed and the restore would silently no-op.
            pcall(function() local r = getRoot(); if r then r.CFrame = saved end end)
        end
        clickCollectButtons()             -- also click on-screen collect GUI buttons
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

    table.insert(lines, "")
    table.insert(lines, "-- GUI buttons (PlayerGui) --")
    local pg = LocalPlayer:FindFirstChild("PlayerGui")
    if pg then
        for _, b in ipairs(pg:GetDescendants()) do
            if b:IsA("TextButton") or b:IsA("ImageButton") then
                local txt = b:IsA("TextButton") and (b.Text or "") or ""
                table.insert(lines, ("[%s] visible=%s text='%s' @ %s"):format(
                    b.ClassName, tostring(b.Visible), txt, b:GetFullName()))
            end
        end
    end

    return table.concat(lines, "\n")
end

----------------------------------------------------------------------
-- Deep dump: export the full game tree (every instance + class name) for the
-- key services, plus decompile every LocalScript/ModuleScript when the executor
-- supports `decompile`. This is the "understand the whole game" exporter.
----------------------------------------------------------------------
local function buildTreeDump(root, maxNodes)
    local lines, n = {}, 0
    local function walk(inst, depth)
        for _, child in ipairs(inst:GetChildren()) do
            if n >= maxNodes then return end
            n += 1
            local extra = ""
            if child:IsA("ProximityPrompt") then
                extra = (" [Action='%s' Object='%s']"):format(child.ActionText or "", child.ObjectText or "")
            elseif child:IsA("TextButton") then
                extra = (" [text='%s']"):format(child.Text or "")
            elseif child:IsA("ValueBase") then
                extra = (" [=%s]"):format(tostring((child :: any).Value))
            end
            table.insert(lines, ("%s[%s] %s%s"):format(string.rep("  ", depth), child.ClassName, child.Name, extra))
            walk(child, depth + 1)
        end
    end
    walk(root, 0)
    if n >= maxNodes then table.insert(lines, ("... (truncated at %d nodes)"):format(maxNodes)) end
    return table.concat(lines, "\n"), n
end

local function buildFullDump()
    local lines = { "== Craft a Menu FULL dump ==", "PlaceId: " .. tostring(game.PlaceId),
        "decompile available: " .. tostring(decompile_ ~= nil), "" }
    local services = {
        { "ReplicatedStorage", ReplicatedStorage },
        { "Workspace", Workspace },
        { "PlayerGui", LocalPlayer:FindFirstChild("PlayerGui") },
        { "ReplicatedFirst", game:FindFirstChild("ReplicatedFirst") },
        { "Lighting", game:FindFirstChild("Lighting") },
    }
    for _, sv in ipairs(services) do
        local name, root = sv[1], sv[2]
        if root then
            table.insert(lines, ("######## %s ########"):format(name))
            local tree = buildTreeDump(root, 4000)
            table.insert(lines, tree)
            table.insert(lines, "")
        end
    end
    return table.concat(lines, "\n")
end

-- Decompile every script under the given roots into a folder (one file each).
local function dumpScripts()
    if not (decompile_ and writefile_) then
        return false, "executor lacks decompile/writefile"
    end
    local folder = "CraftAMenu_scripts"
    if makefolder_ and not (isfolder_ and isfolder_(folder)) then pcall(makefolder_, folder) end
    local roots = { ReplicatedStorage, LocalPlayer:FindFirstChild("PlayerGui"),
        game:FindFirstChild("ReplicatedFirst"), Workspace }
    local count, index = 0, {}
    for _, root in ipairs(roots) do
        if root then
            for _, s in ipairs(root:GetDescendants()) do
                if s:IsA("LocalScript") or s:IsA("ModuleScript") or s:IsA("Script") then
                    local ok, src = pcall(decompile_, s)
                    if ok and type(src) == "string" and #src > 0 then
                        local safeName = s:GetFullName():gsub("[^%w]+", "_")
                        local path = folder .. "/" .. safeName .. ".lua"
                        if pcall(writefile_, path, src) then
                            count += 1
                            table.insert(index, path .. "  <-  " .. s:GetFullName())
                        end
                    end
                end
            end
        end
    end
    pcall(writefile_, folder .. "/_INDEX.txt", table.concat(index, "\n"))
    return true, ("decompiled %d scripts into %s/"):format(count, folder)
end

-- Quick health check: what's available + what would actually fire.
local function buildDiagnostics()
    local lines = { "== Craft a Menu diagnostics ==", "PlaceId: " .. tostring(game.PlaceId), "" }
    table.insert(lines, "executor fireproximityprompt: " .. tostring(fireProximityPrompt ~= nil))
    table.insert(lines, "executor fireclickdetector:   " .. tostring(fireClickDetector ~= nil))
    table.insert(lines, "character present:            " .. tostring(getRoot() ~= nil))
    table.insert(lines, "")

    local pTotal, pMake, pEnabled = 0, 0, 0
    local firstMake
    for _, p in ipairs(Workspace:GetDescendants()) do
        if p:IsA("ProximityPrompt") then
            pTotal += 1
            if p.Enabled then pEnabled += 1 end
            local label = (p.ActionText or "") .. " " .. (p.ObjectText or "")
                .. " " .. p.Name .. " " .. (p.Parent and p.Parent.Name or "")
            if matchesAny(label, KW_MAKE) then
                pMake += 1
                firstMake = firstMake or p
            end
        end
    end
    table.insert(lines, ("ProximityPrompts: total=%d  match-MAKE=%d  enabled=%d"):format(pTotal, pMake, pEnabled))

    if firstMake and fireProximityPrompt then
        -- Mirror the real farm path: enable a disabled prompt before firing, then restore.
        local wasEnabled = firstMake.Enabled
        if not wasEnabled then pcall(function() firstMake.Enabled = true end) end
        local ok, err = pcall(fireProximityPrompt, firstMake)
        if not wasEnabled then pcall(function() firstMake.Enabled = wasEnabled end) end
        table.insert(lines, ("test-fire '%s' (was enabled=%s) @ %s -> ok=%s err=%s"):format(
            firstMake.ActionText or "", tostring(wasEnabled), firstMake:GetFullName(),
            tostring(ok), tostring(err)))
    end

    local cTotal, cSpawn = 0, 0
    for _, c in ipairs(Workspace:GetDescendants()) do
        if c:IsA("ClickDetector") then
            cTotal += 1
            if matchesAny(ancestryLabel(c, 3), KW_SPAWN) then cSpawn += 1 end
        end
    end
    table.insert(lines, ("ClickDetectors:   total=%d  match-SPAWN=%d"):format(cTotal, cSpawn))
    return table.concat(lines, "\n")
end

----------------------------------------------------------------------
-- Remote spy: capture the EXACT remote + args the game fires when YOU do an
-- action manually (e.g. collect money). Installed once via __namecall hook;
-- it only records while GENV.__CraftAMenuSpyOn is true, so it is dormant
-- otherwise. This is how we learn the real "collect" call without guessing.
----------------------------------------------------------------------
local function describeArg(v)
    local t = typeof(v)
    if t == "Instance" then return "Instance:" .. v:GetFullName() end
    if t == "table" then return "table" end
    return t .. ":" .. tostring(v)
end

local function installRemoteSpy()
    if GENV.__CraftAMenuSpyHooked then return true end
    if not (hookmetamethod_ and getnamecallmethod_) then return false end
    GENV.__CraftAMenuSpyLog = GENV.__CraftAMenuSpyLog or {}
    local oldNamecall
    oldNamecall = hookmetamethod_(game, "__namecall", newcclosure_(function(self, ...)
        if GENV.__CraftAMenuSpyOn then
            local ok, method = pcall(getnamecallmethod_)
            if ok and (method == "FireServer" or method == "InvokeServer") then
                local args, parts = { ... }, {}
                for i = 1, select("#", ...) do parts[i] = describeArg(args[i]) end
                local ok2, full = pcall(function() return self:GetFullName() end)
                table.insert(GENV.__CraftAMenuSpyLog, ("%s | %s(%s)"):format(
                    ok2 and full or tostring(self), method, table.concat(parts, ", ")))
            end
        end
        return oldNamecall(self, ...)
    end))
    GENV.__CraftAMenuSpyHooked = true
    return true
end

----------------------------------------------------------------------
-- FULL REPORT: a single professional health report. It captures the executor
-- capabilities, live console errors/warnings (via LogService), the geometry that
-- decides whether server-side proximity checks pass, and a per-feature live test
-- (fire each action once, record ok/err + any error it printed). Everything goes
-- into ONE file (CraftAMenu_report.txt) so the whole picture is studyable.
----------------------------------------------------------------------
local REPORT_TYPE = {
    [Enum.MessageType.MessageOutput]  = "PRINT",
    [Enum.MessageType.MessageInfo]    = "INFO",
    [Enum.MessageType.MessageWarning] = "WARN",
    [Enum.MessageType.MessageError]   = "ERROR",
}

-- Position/proximity facts for one of the plot's money buttons.
local function describeMoneyButton(plot, modelName)
    local model = plot and plot:FindFirstChild(modelName)
    local button = model and model:FindFirstChild("Button")
    if not button then return ("  %s: <missing>"):format(modelName) end
    local prompt = button:FindFirstChildWhichIsA("ProximityPrompt")
    local part = (button:IsA("BasePart") and button) or button:FindFirstChildWhichIsA("BasePart", true)
    local root = getRoot()
    local dist = (part and root) and math.floor((part.Position - root.Position).Magnitude + 0.5) or -1
    if not prompt then
        return ("  %s: part=%s dist=%s studs  prompt=<none>"):format(
            modelName, tostring(part ~= nil), tostring(dist))
    end
    return ("  %s: dist=%s studs  prompt.Enabled=%s  MaxActivationDistance=%s  HoldDuration=%s  Action='%s'"):format(
        modelName, tostring(dist), tostring(prompt.Enabled),
        tostring(prompt.MaxActivationDistance), tostring(prompt.HoldDuration),
        tostring(prompt.ActionText or ""))
end

local function runFullReport()
    local L = {}
    local function add(s) table.insert(L, s) end

    -- 1) live console capture --------------------------------------------------
    local logs = {}
    local logConn = LogService.MessageOut:Connect(function(msg, mtype)
        table.insert(logs, { t = REPORT_TYPE[mtype] or "?", m = msg, clock = os.clock() })
    end)
    local function logsSince(c0)
        local out = {}
        for _, e in ipairs(logs) do
            if e.clock >= c0 and (e.t == "ERROR" or e.t == "WARN") then
                table.insert(out, ("      [%s] %s"):format(e.t, e.m))
            end
        end
        return out
    end

    -- Wrap the whole body so a mid-report error can never leak the LogService
    -- connection (it is always disconnected in the cleanup below).
    local okBody, bodyErr = pcall(function()
    add("================= Craft a Menu — FULL REPORT =================")
    add("generated: " .. os.date("%Y-%m-%d %H:%M:%S"))
    add(("PlaceId=%s  GameId=%s  JobId=%s"):format(
        tostring(game.PlaceId), tostring(game.GameId), tostring(game.JobId)))
    add("executor: " .. executorName())
    add("")

    -- 2) executor capability matrix -------------------------------------------
    add("---- Executor capabilities ----")
    local caps = {
        { "fireproximityprompt", fireProximityPrompt }, { "fireclickdetector", fireClickDetector },
        { "getconnections", getconnections_ }, { "firesignal", firesignal_ },
        { "hookmetamethod", hookmetamethod_ }, { "getnamecallmethod", getnamecallmethod_ },
        { "decompile", decompile_ }, { "writefile", writefile_ }, { "setclipboard", setclipboard_ },
        { "makefolder", makefolder_ }, { "getgenv", safe("getgenv") },
    }
    for _, c in ipairs(caps) do
        add(("  %-22s %s"):format(c[1], c[2] and "OK" or "MISSING"))
    end
    add("")

    -- 3) player / plot geometry (why collect is accepted or rejected) ----------
    add("---- Player & plot geometry ----")
    local root = getRoot()
    add("  character present: " .. tostring(root ~= nil))
    if root then add("  character position: " .. tostring(root.Position)) end
    local plot = getMyPlot()
    add("  my plot (OwnerUserId==me): " .. (plot and plot:GetFullName() or "<NOT FOUND>"))
    if plot then
        add(describeMoneyButton(plot, "MoneyButton"))
        add(describeMoneyButton(plot, "MoneyButtonBig"))
        local sb = plot:FindFirstChild("SpawnButton")
        local sbBtn = sb and sb:FindFirstChild("Button")
        add("  SpawnButton.Button: " .. (sbBtn and "present" or "<missing>"))
    end
    add("")

    -- 4) world inventory -------------------------------------------------------
    local pTotal, pMake, pEnabled, pCollect = 0, 0, 0, 0
    for _, p in ipairs(Workspace:GetDescendants()) do
        if p:IsA("ProximityPrompt") then
            pTotal += 1
            if p.Enabled then pEnabled += 1 end
            local label = (p.ActionText or "") .. " " .. (p.ObjectText or "") .. " " .. (p.Name or "") .. " " .. (p.Parent and p.Parent.Name or "")
            if matchesAny(label, KW_MAKE) then pMake += 1 end
            if matchesAny(label, KW_COLLECT) then pCollect += 1 end
        end
    end
    add("---- World inventory ----")
    add(("  ProximityPrompts: total=%d enabled=%d match-MAKE=%d match-COLLECT=%d"):format(
        pTotal, pEnabled, pMake, pCollect))
    add("")

    -- 5) per-feature live test -------------------------------------------------
    add("---- Live feature tests (fired once each) ----")

    -- Make Food (real craft flow: move ingredients to oven -> startCraft)
    do
        local c0 = os.clock()
        local cooked = autoCook()
        local fired = firePromptsMatching(KW_MAKE)
        task.wait(0.5)
        add(("  [Make Food]  autoCook craft requests = %d | table prompts fired = %d"):format(cooked, fired))
        add(("      InventoryModuleLocal found = %s | owned ingredient ids = %d (%s)"):format(
            tostring(lastCook.invMod), lastCook.ids, lastCook.sample ~= "" and lastCook.sample or "none"))
        if lastCook.err ~= "" then add(("      cook error: %s"):format(lastCook.err)) end
        for _, l in ipairs(logsSince(c0)) do add(l) end
    end

    -- Spawn
    do
        local c0 = os.clock()
        local sb = plot and plot:FindFirstChild("SpawnButton")
        local btn = sb and sb:FindFirstChild("Button")
        local pcalled, sent = false, false
        if btn then pcalled, sent = pcall(function() return fireRemoteByName("ClickSpawnButton", btn) end) end
        task.wait(0.5)
        add(("  [Spawn]  ClickSpawnButton(SpawnButton.Button) -> no-exception=%s, remote-fired=%s%s"):format(
            tostring(pcalled), tostring(sent), btn and "" or " (SpawnButton.Button MISSING)"))
        for _, l in ipairs(logsSince(c0)) do add(l) end
    end

    -- Collect (teleport-onto-button path)
    do
        local c0 = os.clock()
        local before = root and root.Position
        local saved = root and root.CFrame
        local fired = 0
        if plot then fired = fireCollectOnPlot(plot) end
        if saved then task.wait(); pcall(function() getRoot().CFrame = saved end) end
        task.wait(0.6)
        add(("  [Collect]  fireCollectOnPlot -> collect triggers fired = %d (RequestStreamAround + teleport-onto-MoneyButton)"):format(fired))
        if before and getRoot() then
            local moved = math.floor((getRoot().Position - before).Magnitude + 0.5)
            add(("      character moved %d studs net after collect (should be ~0)"):format(moved))
        end
        for _, l in ipairs(logsSince(c0)) do add(l) end
    end
    add("")

    -- 6) all remotes -----------------------------------------------------------
    add("---- RemoteEvents / RemoteFunctions ----")
    for _, r in ipairs(collectRemotes()) do
        add(("  [%s] %s"):format(r.ClassName, r:GetFullName()))
    end
    add("")

    -- 7) all captured errors/warnings -----------------------------------------
    add("---- All console ERRORS/WARNINGS during report ----")
    local anyErr = false
    for _, e in ipairs(logs) do
        if e.t == "ERROR" or e.t == "WARN" then
            anyErr = true
            add(("  [%s] %s"):format(e.t, e.m))
        end
    end
    if not anyErr then add("  (none captured)") end
    end)

    logConn:Disconnect()
    if not okBody then add("  [report aborted by error] " .. tostring(bodyErr)) end
    return table.concat(L, "\n")
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
    State.autoCollect = true
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
    Name = "★ Generate FULL Report (errors + tests -> file)",
    Callback = function()
        notify("Craft a Menu", "Generating full report (~3s)... stay in-game.", 6)
        task.spawn(function()
            local ok, report = pcall(runFullReport)
            if not ok then
                notify("Craft a Menu", "Report failed: " .. tostring(report), 8)
                return
            end
            if writefile_ then pcall(writefile_, "CraftAMenu_report.txt", report) end
            if setclipboard_ then pcall(setclipboard_, report) end
            print(report)
            notify("Craft a Menu", "Report -> CraftAMenu_report.txt + clipboard. Send it to me.", 10)
        end)
    end,
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
    Name = "FULL game dump (whole tree -> file)",
    Callback = function()
        local dump = buildFullDump()
        if writefile_ then pcall(writefile_, "CraftAMenu_fulldump.txt", dump) end
        if setclipboard_ then pcall(setclipboard_, dump) end
        notify("Craft a Menu", "Full tree -> CraftAMenu_fulldump.txt + clipboard.", 8)
    end,
})

Calib:CreateButton({
    Name = "Decompile ALL scripts (-> CraftAMenu_scripts/)",
    Callback = function()
        local ok, msg = dumpScripts()
        notify("Craft a Menu", msg, 10)
    end,
})

Calib:CreateButton({
    Name = "Diagnose (test-fire + counts -> clipboard)",
    Callback = function()
        local diag = buildDiagnostics()
        if writefile_ then pcall(writefile_, "CraftAMenu_diag.txt", diag) end
        if setclipboard_ then pcall(setclipboard_, diag) end
        print(diag)
        notify("Craft a Menu", "Diagnostics copied to clipboard + console (F9).", 6)
    end,
})

Calib:CreateButton({
    Name = "Spy remotes 12s (collect money manually now!)",
    Callback = function()
        if not installRemoteSpy() then
            notify("Craft a Menu", "Executor lacks hookmetamethod/getnamecallmethod.", 6)
            return
        end
        GENV.__CraftAMenuSpyLog = {}
        GENV.__CraftAMenuSpyOn = true
        notify("Craft a Menu", "Spying 12s -> COLLECT YOUR MONEY MANUALLY NOW.", 6)
        task.spawn(function()
            task.wait(12)
            GENV.__CraftAMenuSpyOn = false
            local log = GENV.__CraftAMenuSpyLog or {}
            local out = (#log > 0) and table.concat(log, "\n")
                or "(no FireServer/InvokeServer captured in 12s)"
            out = "== Craft a Menu remote spy ==\n" .. out
            if writefile_ then pcall(writefile_, "CraftAMenu_spy.txt", out) end
            if setclipboard_ then pcall(setclipboard_, out) end
            print(out)
            notify("Craft a Menu", ("Spy done: %d calls -> clipboard + CraftAMenu_spy.txt"):format(#log), 8)
        end)
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
