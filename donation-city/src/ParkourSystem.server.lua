--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام الباركور — PARKOUR SYSTEM (Server)                              ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  • مسار متدرّج الصعوبة: سهل → متوسط → صعب → أسطوري                      ║
║  • منصّات ثابتة + متحركة + عقبات دوّارة + منصّات تختفي وتظهر             ║
║  • Checkpoints مع حفظ تلقائي + العودة لآخر نقطة عند السقوط              ║
║  • واجهة تقدّم (مرحلة/نسبة/وقت) عبر ParkourProgress RemoteEvent         ║
║  • جوائز عند الإكمال (كوينز + إنجاز + تاج «بطل الباركور» + بريق)         ║
║  • لوحات متصدرين: أسرع وقت (دائم/يومي) + الأكثر إكمالاً (OrderedDataStore)║
║  • منطقة مستقلة غرب الخريطة، آمنة على الأداء (StreamingEnabled-friendly)║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace        = game:GetService("Workspace")
local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService     = game:GetService("TweenService")
local DataStoreService = game:GetService("DataStoreService")
local RunService       = game:GetService("RunService")

----------------------------------------------------------------------
-- إعداد الـ RemoteEvent للتقدّم (واجهة العميل)
----------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("ParkourRemotes")
if not remotes then
	remotes = Instance.new("Folder"); remotes.Name = "ParkourRemotes"; remotes.Parent = ReplicatedStorage
end
local progressRemote = remotes:FindFirstChild("Progress")
if not progressRemote then
	progressRemote = Instance.new("RemoteEvent"); progressRemote.Name = "Progress"; progressRemote.Parent = remotes
end

----------------------------------------------------------------------
-- DataStores (best time + completions + leaderboards)
----------------------------------------------------------------------
local bestStore, timeRank, compRank, dailyRank
pcall(function() bestStore = DataStoreService:GetDataStore("ParkourBest_v1") end)
pcall(function() timeRank  = DataStoreService:GetOrderedDataStore("ParkourTimeRank_v1") end)
pcall(function() compRank  = DataStoreService:GetOrderedDataStore("ParkourCompRank_v1") end)
pcall(function() dailyRank = DataStoreService:GetOrderedDataStore("ParkourDaily_" .. os.date("!%Y%m%d")) end)

----------------------------------------------------------------------
-- ألوان وثوابت
----------------------------------------------------------------------
local C_EASY   = Color3.fromRGB(90, 200, 120)
local C_MED    = Color3.fromRGB(95, 170, 255)
local C_HARD   = Color3.fromRGB(255, 150, 70)
local C_LEGEND = Color3.fromRGB(200, 110, 255)
local C_CP     = Color3.fromRGB(255, 215, 90)
local C_OBST   = Color3.fromRGB(255, 70, 70)
local GOLD     = Color3.fromRGB(255, 205, 70)

local course = Instance.new("Model")
course.Name = "ParkourCourse"
course.Parent = Workspace

local function newPart(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = props.CanCollide ~= false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Name = props.Name or "Plat"
	p.Size = props.Size or Vector3.new(8, 1, 8)
	if props.CFrame then p.CFrame = props.CFrame else p.Position = props.Position or Vector3.new() end
	p.Color = props.Color or Color3.fromRGB(180, 180, 180)
	p.Material = props.Material or Enum.Material.SmoothPlastic
	if props.Transparency then p.Transparency = props.Transparency end
	p.Parent = props.Parent or course
	return p
end

----------------------------------------------------------------------
-- مسار المنصّات (غرب الخريطة، صاعد بالارتفاع)
-- kind: "static" | "move" | "blink" | "beam"
----------------------------------------------------------------------
local nodes = {
	-- ── المرحلة السهلة (منصّات واسعة، قفزات قصيرة) ──
	{ stage = 1, kind = "static", size = Vector3.new(10, 1, 10), pos = Vector3.new(-95, 4, 70), color = C_EASY },
	{ stage = 1, kind = "static", size = Vector3.new(9, 1, 9),   pos = Vector3.new(-106, 5, 70), color = C_EASY },
	{ stage = 1, kind = "static", size = Vector3.new(9, 1, 9),   pos = Vector3.new(-117, 6, 66), color = C_EASY },
	{ stage = 1, kind = "static", size = Vector3.new(8, 1, 8),   pos = Vector3.new(-128, 7, 71), color = C_EASY },
	{ stage = 1, kind = "static", size = Vector3.new(8, 1, 8),   pos = Vector3.new(-139, 8, 75), color = C_EASY },
	-- ── المرحلة المتوسطة (منصّات متحركة + عقبة دوّارة) ──
	{ stage = 2, kind = "static", size = Vector3.new(12, 1, 12), pos = Vector3.new(-151, 10, 72), color = C_MED },
	{ stage = 2, kind = "beam",   size = Vector3.new(12, 1, 12), pos = Vector3.new(-151, 10, 72), color = C_MED }, -- عقبة دوّارة فوق المنصّة السابقة
	{ stage = 2, kind = "move",   size = Vector3.new(7, 1, 7),   pos = Vector3.new(-162, 12, 72), color = C_MED, axis = "z", dist = 7, time = 2.2 },
	{ stage = 2, kind = "static", size = Vector3.new(7, 1, 7),   pos = Vector3.new(-173, 14, 72), color = C_MED },
	{ stage = 2, kind = "move",   size = Vector3.new(6, 1, 6),   pos = Vector3.new(-173, 16, 60), color = C_MED, axis = "x", dist = 8, time = 2.0 },
	-- ── المرحلة الصعبة (متحركة أسرع + منصّات تختفي + قفزات أدق) ──
	{ stage = 3, kind = "static", size = Vector3.new(8, 1, 8),   pos = Vector3.new(-173, 18, 48), color = C_HARD },
	{ stage = 3, kind = "blink",  size = Vector3.new(6, 1, 6),   pos = Vector3.new(-164, 20, 44), color = C_HARD, on = 1.6, off = 1.1 },
	{ stage = 3, kind = "move",   size = Vector3.new(5, 1, 5),   pos = Vector3.new(-155, 22, 44), color = C_HARD, axis = "z", dist = 9, time = 1.4 },
	{ stage = 3, kind = "blink",  size = Vector3.new(5, 1, 5),   pos = Vector3.new(-146, 24, 40), color = C_HARD, on = 1.3, off = 1.1 },
	{ stage = 3, kind = "static", size = Vector3.new(6, 1, 6),   pos = Vector3.new(-137, 26, 38), color = C_HARD },
	-- ── المرحلة الأسطورية (مسار طويل + كل العقبات + قفزات نادرة) ──
	{ stage = 4, kind = "move",   size = Vector3.new(4.5, 1, 4.5), pos = Vector3.new(-128, 28, 38), color = C_LEGEND, axis = "x", dist = 10, time = 1.2 },
	{ stage = 4, kind = "blink",  size = Vector3.new(4.5, 1, 4.5), pos = Vector3.new(-119, 30, 34), color = C_LEGEND, on = 1.0, off = 1.0 },
	{ stage = 4, kind = "static", size = Vector3.new(5, 1, 5),     pos = Vector3.new(-110, 32, 32), color = C_LEGEND },
	{ stage = 4, kind = "beam",   size = Vector3.new(11, 1, 11),   pos = Vector3.new(-110, 32, 32), color = C_LEGEND }, -- دوّار سريع
	{ stage = 4, kind = "move",   size = Vector3.new(4, 1, 4),     pos = Vector3.new(-101, 34, 30), color = C_LEGEND, axis = "z", dist = 11, time = 1.0 },
	{ stage = 4, kind = "blink",  size = Vector3.new(4, 1, 4),     pos = Vector3.new(-92, 36, 26), color = C_LEGEND, on = 0.9, off = 1.0 },
	{ stage = 4, kind = "static", size = Vector3.new(6, 1, 6),     pos = Vector3.new(-83, 38, 24), color = C_LEGEND },
}

-- نقاط الحفظ (CFrame): تبدأ من منصّة البداية ثم نهاية كل مرحلة
local checkpoints = {}   -- [i] = { cf = CFrame, y = number }
local function addCheckpoint(pos)
	local cf = CFrame.new(pos + Vector3.new(0, 4, 0))
	table.insert(checkpoints, { cf = cf, y = pos.Y })
end

----------------------------------------------------------------------
-- بناء المنصّات والسلوكيات الديناميكية
----------------------------------------------------------------------
local function buildMove(p, axis, dist, timeSec)
	local base = p.Position
	local goal = (axis == "x") and (base + Vector3.new(dist, 0, 0)) or (base + Vector3.new(0, 0, dist))
	local info = TweenInfo.new(timeSec, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
	TweenService:Create(p, info, { Position = goal }):Play()
end

local function buildBlink(p, onT, offT)
	task.spawn(function()
		while p.Parent do
			p.Transparency = 0; p.CanCollide = true
			task.wait(onT)
			p.Transparency = 0.55; p.CanCollide = true   -- تحذير قبل الاختفاء
			task.wait(0.35)
			p.Transparency = 1; p.CanCollide = false
			task.wait(offT)
		end
	end)
end

local function buildBeam(centerPos, fast)
	-- عقبة دوّارة فوق المنصّة (يجب القفز فوقها أثناء مرورها)
	local beam = newPart({ Name = "Obstacle", Size = Vector3.new(11, 0.8, 0.8),
		Position = centerPos + Vector3.new(0, 2.2, 0), Color = C_OBST, Material = Enum.Material.Neon })
	beam.CanCollide = true
	local speed = fast and 150 or 90    -- درجة/ثانية
	task.spawn(function()
		local ang = 0
		while beam.Parent do
			ang = (ang + speed * 0.05) % 360
			beam.CFrame = CFrame.new(centerPos + Vector3.new(0, 2.2, 0)) * CFrame.Angles(0, math.rad(ang), 0)
			task.wait(0.05)
		end
	end)
end

local lastStage = 0
for _, n in ipairs(nodes) do
	-- أضف checkpoint عند بداية البلاطة الأولى من كل مرحلة
	if n.stage ~= lastStage and n.kind ~= "beam" then
		addCheckpoint(n.pos)
		lastStage = n.stage
	end
	if n.kind == "beam" then
		buildBeam(n.pos, n.stage >= 4)
	else
		local p = newPart({ Name = "Plat_S" .. n.stage, Size = n.size, Position = n.pos,
			Color = n.color, Material = Enum.Material.SmoothPlastic })
		if n.kind == "move" then buildMove(p, n.axis, n.dist, n.time)
		elseif n.kind == "blink" then buildBlink(p, n.on, n.off) end
	end
end

----------------------------------------------------------------------
-- منصّة البداية + لوح + نقطة بداية، ومنصّة النهاية
----------------------------------------------------------------------
local START_POS  = Vector3.new(-95, 4, 70)
local FINISH_POS = Vector3.new(-83, 38, 24)

-- لوحة البداية
do
	local board = newPart({ Name = "ParkourSign", Size = Vector3.new(12, 4, 0.6),
		Position = START_POS + Vector3.new(0, 7, 0), Color = Color3.fromRGB(24, 30, 46) })
	for _, face in ipairs({ Enum.NormalId.Back, Enum.NormalId.Front, Enum.NormalId.Left, Enum.NormalId.Right }) do
		local sg = Instance.new("SurfaceGui"); sg.Face = face; sg.CanvasSize = Vector2.new(800, 260)
		sg.LightInfluence = 0; sg.Adornee = board; sg.Parent = board
		local lbl = Instance.new("TextLabel"); lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
		lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
		lbl.TextColor3 = GOLD; lbl.Text = "🧗 الباركور\n<font size=\"34\">قف على المنصّة لتبدأ</font>"; lbl.Parent = sg
	end
end

-- منصّة النهاية مضيئة
local finishPad = newPart({ Name = "FinishPad", Size = Vector3.new(8, 1, 8),
	Position = FINISH_POS, Color = GOLD, Material = Enum.Material.Neon })

----------------------------------------------------------------------
-- نقاط الحفظ المرئية (Pads)
----------------------------------------------------------------------
local cpPads = {}
for i, cp in ipairs(checkpoints) do
	local pad = newPart({ Name = "Checkpoint" .. i, Size = Vector3.new(10, 0.4, 10),
		Position = Vector3.new(cp.cf.X, cp.y + 0.7, cp.cf.Z), Color = C_CP,
		Material = Enum.Material.Neon, Transparency = 0.25, CanCollide = false })
	cpPads[i] = pad
end
local TOTAL_CP = #checkpoints

----------------------------------------------------------------------
-- حالة اللاعبين أثناء الجري
----------------------------------------------------------------------
local runState = {}   -- [userId] = { cpIndex=int, startT=number, inRun=bool, reached={}, bestCp=int }

local function sendProgress(player)
	local st = runState[player.UserId]
	if not st then return end
	local elapsed = st.inRun and (os.clock() - st.startT) or 0
	progressRemote:FireClient(player, {
		state   = st.inRun and "run" or "idle",
		stage   = math.min(st.cpIndex, 4),
		cp      = st.cpIndex,
		total   = TOTAL_CP,
		percent = math.floor((st.cpIndex / TOTAL_CP) * 100),
		time    = elapsed,
	})
end

local function teleportTo(player, cf)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if hrp then hrp.CFrame = cf end
end

local function startRun(player)
	local st = runState[player.UserId]
	if st and st.inRun then return end
	runState[player.UserId] = { cpIndex = 1, startT = os.clock(), inRun = true, reached = { [1] = true } }
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "🧗 بدأ الباركور! اوصل أبعد نقطة وسجّل أسرع وقت.") end
	sendProgress(player)
end

----------------------------------------------------------------------
-- كاش أسماء اللاعبين للوحات
----------------------------------------------------------------------
local nameCache = {}
local function nameFor(userId)
	if nameCache[userId] then return nameCache[userId] end
	local nm = "لاعب"
	local pl = Players:GetPlayerByUserId(userId)
	if pl then nm = pl.DisplayName else
		pcall(function() nm = Players:GetNameFromUserIdAsync(userId) end)
	end
	nameCache[userId] = nm
	return nm
end

local function fmtTime(sec)
	local m = math.floor(sec / 60)
	local s = sec - m * 60
	return string.format("%d:%05.2f", m, s)
end

----------------------------------------------------------------------
-- إكمال المسار + الجوائز + تسجيل المتصدرين
----------------------------------------------------------------------
local function applyChampionEffect(player)
	local char = player.Character
	if not char then return end
	local head = char:FindFirstChild("Head")
	if head and not head:FindFirstChild("ParkourTitle") then
		local bb = Instance.new("BillboardGui")
		bb.Name = "ParkourTitle"; bb.Adornee = head; bb.Size = UDim2.fromOffset(180, 36)
		bb.StudsOffsetWorldSpace = Vector3.new(0, 3.4, 0); bb.AlwaysOnTop = true; bb.Parent = head
		local lbl = Instance.new("TextLabel"); lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
		lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
		lbl.TextColor3 = Color3.fromRGB(190, 120, 255); lbl.TextStrokeTransparency = 0.3
		lbl.Text = "🏁 بطل الباركور"; lbl.Parent = bb
	end
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if hrp then
		local spark = Instance.new("ParticleEmitter")
		spark.Texture = "rbxassetid://243660364"; spark.Lifetime = NumberRange.new(0.8, 1.4)
		spark.Rate = 60; spark.Speed = NumberRange.new(4, 8); spark.Rotation = NumberRange.new(0, 360)
		spark.Color = ColorSequence.new(GOLD); spark.Parent = hrp
		task.delay(4, function() spark.Enabled = false; task.wait(2); spark:Destroy() end)
	end
end

local function recordLeaderboard(userId, elapsed)
	task.spawn(function()
		local centi = math.floor(elapsed * 100)   -- وقت بالسنتي ثانية (أقل = أفضل)
		local prev, completions = nil, 1
		if bestStore then
			pcall(function()
				local d = bestStore:GetAsync("u_" .. userId)
				if type(d) == "table" then prev = d.time; completions = (d.completions or 0) + 1 end
			end)
			pcall(function()
				bestStore:UpdateAsync("u_" .. userId, function(old)
					old = (type(old) == "table") and old or {}
					old.name = nameFor(userId)
					old.completions = (old.completions or 0) + 1
					if not old.time or centi < old.time then old.time = centi end
					return old
				end)
			end)
		end
		-- OrderedDataStore: أسرع وقت (نخزّن الأقل) — ولا نكتب إلا لو تحسّن
		if timeRank and (not prev or centi < prev) then
			pcall(function() timeRank:SetAsync(tostring(userId), centi) end)
		end
		if dailyRank then
			pcall(function()
				local cur = dailyRank:GetAsync(tostring(userId))
				if not cur or centi < cur then dailyRank:SetAsync(tostring(userId), centi) end
			end)
		end
		if compRank then
			pcall(function()
				compRank:SetAsync(tostring(userId), completions)
			end)
		end
	end)
end

local function finishRun(player)
	local st = runState[player.UserId]
	if not st or not st.inRun then return end
	local elapsed = os.clock() - st.startT
	st.inRun = false
	-- جوائز
	local reward = 250
	if _G.AddCoins then _G.AddCoins(player, reward) end
	if _G.AwardAchievement then
		_G.AwardAchievement(player, "parkour_first")
		_G.AwardAchievement(player, "parkour_done")
	end
	applyChampionEffect(player)
	if _G.NotifyPlayer then
		_G.NotifyPlayer(player, string.format("🏁 أكملت الباركور! الوقت %s — مكافأة %d كوينز + لقب «بطل الباركور» 🏆", fmtTime(elapsed), reward))
	end
	recordLeaderboard(player.UserId, elapsed)
	progressRemote:FireClient(player, { state = "finish", time = elapsed, reward = reward, percent = 100, total = TOTAL_CP })
end

----------------------------------------------------------------------
-- لمس البداية / النقاط / النهاية
----------------------------------------------------------------------
local function hookTouch(part, fn)
	part.Touched:Connect(function(hit)
		local char = hit and hit.Parent
		local player = char and Players:GetPlayerFromCharacter(char)
		if player then fn(player) end
	end)
end

-- البداية: قف على منصّة البداية لبدء العدّاد (مرة واحدة لكل جولة)
hookTouch(course:FindFirstChild("Plat_S1") or finishPad, function(player)
	local st = runState[player.UserId]
	if not (st and st.inRun) then startRun(player) end
end)

-- نقاط الحفظ
for i, pad in ipairs(cpPads) do
	hookTouch(pad, function(player)
		local st = runState[player.UserId]
		if not st then startRun(player); st = runState[player.UserId] end
		if not st.inRun then return end
		if i > st.cpIndex then
			st.cpIndex = i
			st.reached[i] = true
			if _G.AddCoins then _G.AddCoins(player, 20) end   -- مكافأة وصول نقطة جديدة
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "✅ نقطة حفظ " .. i .. "/" .. TOTAL_CP .. " (+20 كوينز)") end
			sendProgress(player)
		end
	end)
end

-- النهاية
hookTouch(finishPad, function(player)
	local st = runState[player.UserId]
	if st and st.inRun and st.cpIndex >= TOTAL_CP - 0 then finishRun(player) end
end)

----------------------------------------------------------------------
-- العودة لآخر نقطة عند السقوط + تحديث الوقت
----------------------------------------------------------------------
task.spawn(function()
	while true do
		for _, player in ipairs(Players:GetPlayers()) do
			local st = runState[player.UserId]
			if st and st.inRun then
				local cp = checkpoints[st.cpIndex]
				local char = player.Character
				local hrp = char and char:FindFirstChild("HumanoidRootPart")
				if hrp and cp and hrp.Position.Y < (cp.y - 6) then
					teleportTo(player, cp.cf)
					if _G.NotifyPlayer then _G.NotifyPlayer(player, "↩️ رجعناك لآخر نقطة حفظ.") end
				end
			end
		end
		task.wait(0.2)
	end
end)

-- تحديث عدّاد الوقت على الواجهة كل ثانية
task.spawn(function()
	while true do
		for _, player in ipairs(Players:GetPlayers()) do
			local st = runState[player.UserId]
			if st and st.inRun then sendProgress(player) end
		end
		task.wait(1)
	end
end)

-- عند موت/إعادة ظهور اللاعب أثناء الجولة، أرجعه لآخر نقطة حفظ
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function()
		task.wait(0.6)
		local st = runState[player.UserId]
		if st and st.inRun then
			local cp = checkpoints[st.cpIndex]
			if cp then teleportTo(player, cp.cf) end
		end
	end)
end)
Players.PlayerRemoving:Connect(function(player)
	runState[player.UserId] = nil
end)

----------------------------------------------------------------------
-- لوحات المتصدّرين (أسرع وقت دائم + يومي + الأكثر إكمالاً)
----------------------------------------------------------------------
local function makeBoard(title, pos)
	local board = newPart({ Name = "LB_" .. title, Size = Vector3.new(12, 14, 0.6),
		Position = pos, Color = Color3.fromRGB(18, 20, 34) })
	local sg = Instance.new("SurfaceGui"); sg.Face = Enum.NormalId.Front
	sg.CanvasSize = Vector2.new(420, 520); sg.LightInfluence = 0; sg.Adornee = board; sg.Parent = board
	local frame = Instance.new("Frame"); frame.BackgroundTransparency = 1; frame.Size = UDim2.fromScale(1, 1); frame.Parent = sg
	local layout = Instance.new("UIListLayout"); layout.Padding = UDim.new(0, 6)
	layout.SortOrder = Enum.SortOrder.LayoutOrder; layout.Parent = frame
	local head = Instance.new("TextLabel"); head.BackgroundTransparency = 1; head.Size = UDim2.new(1, 0, 0, 56)
	head.Font = Enum.Font.GothamBlack; head.TextScaled = true; head.TextColor3 = GOLD; head.Text = title
	head.LayoutOrder = 0; head.Parent = frame
	return frame
end

local fastestFrame = makeBoard("🏆 أسرع الأوقات", Vector3.new(-95, 11, 78))
local dailyFrame   = makeBoard("🥇 أسرع اليوم",   Vector3.new(-83, 11, 78))
local compFrame    = makeBoard("🔥 الأكثر إكمالاً", Vector3.new(-71, 11, 78))

local function fillBoard(frame, ranked, fmtVal)
	for _, c in ipairs(frame:GetChildren()) do
		if c:IsA("TextLabel") and c.LayoutOrder > 0 then c:Destroy() end
	end
	if #ranked == 0 then
		local empty = Instance.new("TextLabel"); empty.BackgroundTransparency = 1
		empty.Size = UDim2.new(1, 0, 0, 40); empty.Font = Enum.Font.Gotham; empty.TextScaled = true
		empty.TextColor3 = Color3.fromRGB(200, 200, 210); empty.Text = "لا توجد نتائج بعد"
		empty.LayoutOrder = 1; empty.Parent = frame
		return
	end
	for i, e in ipairs(ranked) do
		local row = Instance.new("TextLabel"); row.BackgroundTransparency = 1
		row.Size = UDim2.new(1, 0, 0, 40); row.Font = Enum.Font.GothamMedium; row.TextScaled = true
		row.TextColor3 = (i == 1) and GOLD or Color3.fromRGB(230, 230, 240)
		row.Text = string.format("%d. %s — %s", i, nameFor(e.id), fmtVal(e.val))
		row.LayoutOrder = i; row.Parent = frame
	end
end

local function readRank(store, ascending)
	local out = {}
	if not store then return out end
	pcall(function()
		local pages = store:GetSortedAsync(ascending, 8)
		for _, e in ipairs(pages:GetCurrentPage()) do
			table.insert(out, { id = tonumber(e.key), val = e.value })
		end
	end)
	return out
end

local function refreshBoards()
	fillBoard(fastestFrame, readRank(timeRank, true),  function(v) return fmtTime(v / 100) end)
	fillBoard(dailyFrame,   readRank(dailyRank, true),  function(v) return fmtTime(v / 100) end)
	fillBoard(compFrame,    readRank(compRank, false), function(v) return v .. " مرة" end)
end

task.spawn(function()
	while true do
		refreshBoards()
		task.wait(60)
	end
end)

print("[ParkourSystem] Course ready —", TOTAL_CP, "checkpoints")
