--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام الباركور — PARKOUR SYSTEM (Server)                              ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  • مسار متدرّج الصعوبة: سهل → متوسط → صعب → أسطوري                      ║
║  • مسافات قفز عادلة ضمن قدرة اللاعب + منصّات واضحة غير متداخلة           ║
║  • منصّات متحركة تحمل اللاعب فعلاً + عقبات دوّارة + منصّات تختفي وتظهر    ║
║  • Checkpoints مع حفظ تلقائي + العودة لآخر نقطة عند السقوط              ║
║  • جوائز عند الإكمال (كوينز + إنجاز + تاج «بطل الباركور» + بريق)         ║
║  • لوحات متصدرين: أسرع وقت (دائم/يومي) + الأكثر إكمالاً (OrderedDataStore)║
║                                                                        ║
║  ⚙️ الأداء (إصلاح اللاق الجذري): كل الحركة (المنصّات/العقبات/الاختفاء)   ║
║     تُدار في حلقة Heartbeat واحدة فقط، وتتوقّف تماماً عندما لا يوجد لاعب  ║
║     قريب من الباركور → صفر استهلاك للسيرفر أثناء الخمول.                 ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace        = game:GetService("Workspace")
local Players          = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local RunService       = game:GetService("RunService")

local V   = Vector3.new
local TAU = math.pi * 2

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
local STAGE_COLOR = { [1] = C_EASY, [2] = C_MED, [3] = C_HARD, [4] = C_LEGEND }

-- مركز الباركور ونطاق التفعيل (لإيقاف الحركة عند الخمول)
local COURSE_CENTER = V(-133, 18, 40)
local ACTIVE_RANGE2 = 155 * 155

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
	p.Size = props.Size or V(8, 1, 8)
	if props.CFrame then p.CFrame = props.CFrame else p.Position = props.Position or V() end
	p.Color = props.Color or Color3.fromRGB(180, 180, 180)
	p.Material = props.Material or Enum.Material.SmoothPlastic
	if props.Transparency then p.Transparency = props.Transparency end
	p.Parent = props.Parent or course
	return p
end

----------------------------------------------------------------------
-- مسار المنصّات — مسافات قفز عادلة (قفزة Roblox الافتراضية ترفع ~7 وتقطع ~10-12)
-- لا تتجاوز الفجوات الأفقية ~10، ولا يزيد الصعود لكل قفزة عن ~2، فالمسار
-- صعب بآلياته (منصّات صغيرة/متحركة/تختفي/عقبات) لا بمسافات مستحيلة.
--
-- خصائص العقدة: move="x"/"z" + dist + period | blink={on,off} | beam=true [+fast]
-- (أول عقدة في كل مرحلة تكون ثابتة دائماً لأنها نقطة حفظ)
----------------------------------------------------------------------
local nodes = {
	-- ── سهلة (منصّات واسعة، فجوات ~8، صعود ~1-2) ──
	{ stage = 1, pos = V(-95,  4, 70), size = V(10, 1, 10) },   -- البداية
	{ stage = 1, pos = V(-103, 6, 70), size = V(9, 1, 9) },
	{ stage = 1, pos = V(-111, 7, 73), size = V(9, 1, 9) },
	{ stage = 1, pos = V(-119, 8, 70), size = V(9, 1, 9) },
	{ stage = 1, pos = V(-127, 9, 70), size = V(8, 1, 8) },
	-- ── متوسطة (منصّة متحركة + عقبة دوّارة، فجوات ~9) ──
	{ stage = 2, pos = V(-136, 11, 70), size = V(9, 1, 9) },                                  -- نقطة حفظ (ثابتة)
	{ stage = 2, pos = V(-145, 12, 70), size = V(7, 1, 7), move = "x", dist = 5, period = 4.0 },
	{ stage = 2, pos = V(-154, 13, 70), size = V(8, 1, 8) },
	{ stage = 2, pos = V(-163, 14, 70), size = V(8, 1, 8), beam = true },                     -- عقبة دوّارة فوقها
	{ stage = 2, pos = V(-172, 15, 70), size = V(7, 1, 7) },
	-- ── صعبة (منصّات تختفي + متحركة، فجوات ~9-10، منعطف جنوباً) ──
	{ stage = 3, pos = V(-172, 17, 61), size = V(7, 1, 7) },                                  -- نقطة حفظ (ثابتة)
	{ stage = 3, pos = V(-172, 18, 52), size = V(6, 1, 6), blink = { on = 2.2, off = 1.3 } },
	{ stage = 3, pos = V(-172, 19, 43), size = V(6, 1, 6), move = "z", dist = 5, period = 3.6 },
	{ stage = 3, pos = V(-166, 20, 36), size = V(6, 1, 6), blink = { on = 2.0, off = 1.2 } },
	{ stage = 3, pos = V(-159, 21, 29), size = V(6, 1, 6) },
	-- ── أسطورية (مسار أطول + كل الآليات، فجوات ~9) ──
	{ stage = 4, pos = V(-152, 23, 24), size = V(6, 1, 6) },                                  -- نقطة حفظ (ثابتة)
	{ stage = 4, pos = V(-144, 24, 20), size = V(5, 1, 5), move = "x", dist = 5, period = 3.2 },
	{ stage = 4, pos = V(-136, 25, 16), size = V(5, 1, 5), blink = { on = 1.6, off = 1.2 } },
	{ stage = 4, pos = V(-128, 26, 13), size = V(5, 1, 5), beam = true, fast = true },
	{ stage = 4, pos = V(-120, 28, 10), size = V(6, 1, 6), move = "z", dist = 6, period = 3.0 },
	{ stage = 4, pos = V(-112, 29,  8), size = V(6, 1, 6) },                                  -- آخر منصّة قبل النهاية
}

local START_POS  = V(-95, 4, 70)
local FINISH_POS  = V(-104, 30, 8)

----------------------------------------------------------------------
-- بناء المنصّات + تسجيل العناصر الديناميكية (بلا أي حلقة لكل عنصر)
----------------------------------------------------------------------
local movers   = {}   -- { part, base, dir, half, period, phase, hx, hz, lastPos }
local blinkers = {}   -- { part, onT, warnT, offT, cycle, phase }
local rotators = {}   -- { part, center, speed }

local checkpoints = {}   -- [i] = { cf = CFrame, y = number }
local function addCheckpoint(pos)
	table.insert(checkpoints, { cf = CFrame.new(pos + V(0, 4, 0)), y = pos.Y })
end

local lastStage = 0
for _, n in ipairs(nodes) do
	if n.stage ~= lastStage then
		addCheckpoint(n.pos)
		lastStage = n.stage
	end
	local p = newPart({ Name = "Plat_S" .. n.stage, Size = n.size, Position = n.pos,
		Color = STAGE_COLOR[n.stage] or C_EASY, Material = Enum.Material.SmoothPlastic })
	if n.move then
		local dir = (n.move == "x") and V(1, 0, 0) or V(0, 0, 1)
		movers[#movers + 1] = { part = p, base = n.pos, dir = dir, half = n.dist / 2,
			period = n.period, phase = math.random() * 1.0,
			hx = n.size.X / 2 + 1.2, hz = n.size.Z / 2 + 1.2, lastPos = n.pos }
	elseif n.blink then
		local warnT = 0.4
		blinkers[#blinkers + 1] = { part = p, onT = n.blink.on, warnT = warnT, offT = n.blink.off,
			cycle = n.blink.on + warnT + n.blink.off, phase = math.random() * 3 }
	end
	if n.beam then
		local len = n.size.X + 3
		local bar = newPart({ Name = "Obstacle", Size = V(len, 0.8, 0.8),
			Position = n.pos + V(0, 2.4, 0), Color = C_OBST, Material = Enum.Material.Neon })
		rotators[#rotators + 1] = { part = bar, center = n.pos + V(0, 2.4, 0), speed = n.fast and 120 or 70 }
	end
end

----------------------------------------------------------------------
-- لوحة البداية (نص على الوجوه) + منصّة النهاية المضيئة
----------------------------------------------------------------------
do
	local board = newPart({ Name = "ParkourSign", Size = V(12, 4, 0.6),
		Position = START_POS + V(0, 7, 0), Color = Color3.fromRGB(24, 30, 46) })
	for _, face in ipairs({ Enum.NormalId.Back, Enum.NormalId.Front, Enum.NormalId.Left, Enum.NormalId.Right }) do
		local sg = Instance.new("SurfaceGui"); sg.Face = face; sg.CanvasSize = Vector2.new(800, 260)
		sg.LightInfluence = 0; sg.Adornee = board; sg.Parent = board
		local lbl = Instance.new("TextLabel"); lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
		lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
		lbl.TextColor3 = GOLD; lbl.Text = "🧗 الباركور\n<font size=\"34\">قف على المنصّة لتبدأ</font>"; lbl.Parent = sg
	end
end

local finishPad = newPart({ Name = "FinishPad", Size = V(8, 1, 8),
	Position = FINISH_POS, Color = GOLD, Material = Enum.Material.Neon })

----------------------------------------------------------------------
-- نقاط الحفظ المرئية (Pads)
----------------------------------------------------------------------
local cpPads = {}
for i, cp in ipairs(checkpoints) do
	cpPads[i] = newPart({ Name = "Checkpoint" .. i, Size = V(10, 0.4, 10),
		Position = V(cp.cf.X, cp.y + 0.7, cp.cf.Z), Color = C_CP,
		Material = Enum.Material.Neon, Transparency = 0.25, CanCollide = false })
end
local TOTAL_CP = #checkpoints

----------------------------------------------------------------------
-- حالة اللاعبين أثناء الجري
----------------------------------------------------------------------
local runState = {}   -- [userId] = { cpIndex, startT, inRun, reached }

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
-- كاش أسماء اللاعبين + تنسيق الوقت
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
		bb.StudsOffsetWorldSpace = V(0, 3.4, 0); bb.AlwaysOnTop = true; bb.Parent = head
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
		local centi = math.floor(elapsed * 100)
		local prev = nil
		if bestStore then
			pcall(function()
				local d = bestStore:GetAsync("u_" .. userId)
				if type(d) == "table" then prev = d.time end
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
				compRank:UpdateAsync(tostring(userId), function(old) return (tonumber(old) or 0) + 1 end)
			end)
		end
	end)
end

local function finishRun(player)
	local st = runState[player.UserId]
	if not st or not st.inRun then return end
	local elapsed = os.clock() - st.startT
	st.inRun = false
	local reward = 250
	if _G.AddCoins then _G.AddCoins(player, reward) end
	if _G.AwardAchievement then
		_G.AwardAchievement(player, "parkour_first")
		_G.AwardAchievement(player, "parkour_done")
	end
	if _G.ReportMission then _G.ReportMission(player, "parkour_done", 1) end
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
	if not part then return end
	part.Touched:Connect(function(hit)
		local char = hit and hit.Parent
		local player = char and Players:GetPlayerFromCharacter(char)
		if player then fn(player) end
	end)
end

hookTouch(course:FindFirstChild("Plat_S1"), function(player)
	local st = runState[player.UserId]
	if not (st and st.inRun) then startRun(player) end
end)

for i, pad in ipairs(cpPads) do
	hookTouch(pad, function(player)
		local st = runState[player.UserId]
		if not st then startRun(player); st = runState[player.UserId] end
		if not st.inRun then return end
		if i > st.cpIndex then
			st.cpIndex = i
			st.reached[i] = true
			if _G.AddCoins then _G.AddCoins(player, 20) end
			if _G.ReportMission then _G.ReportMission(player, "parkour_cp", 1, "cp" .. i) end
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "✅ نقطة حفظ " .. i .. "/" .. TOTAL_CP .. " (+20 كوينز)") end
			sendProgress(player)
		end
	end)
end

hookTouch(finishPad, function(player)
	local st = runState[player.UserId]
	if st and st.inRun and st.cpIndex >= TOTAL_CP then finishRun(player) end
end)

----------------------------------------------------------------------
-- ⚙️ المحرّك الموحّد: حلقة Heartbeat واحدة فقط (تتوقّف عند الخمول)
--   تتولّى: المنصّات المتحركة (مع حمل اللاعب) + التختّفي + العقبات الدوّارة
--   + إعادة اللاعب لآخر نقطة عند السقوط. لا يوجد أي task.spawn لكل عنصر.
----------------------------------------------------------------------
local startClock = os.clock()
local active = false

local function resetDynamic()
	for _, b in ipairs(blinkers) do
		b.part.Transparency = 0; b.part.CanCollide = true
	end
	for _, m in ipairs(movers) do
		m.part.CFrame = CFrame.new(m.base); m.lastPos = m.base
	end
end

RunService.Heartbeat:Connect(function()
	-- جمع اللاعبين القريبين من الباركور
	local near = {}
	for _, pl in ipairs(Players:GetPlayers()) do
		local char = pl.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp then
			local dx, dz = hrp.Position.X - COURSE_CENTER.X, hrp.Position.Z - COURSE_CENTER.Z
			if dx * dx + dz * dz <= ACTIVE_RANGE2 then
				near[#near + 1] = { pl = pl, hrp = hrp }
			end
		end
	end

	if #near == 0 then
		if active then resetDynamic(); active = false end
		return
	end
	local justActivated = not active
	active = true

	local t = os.clock() - startClock

	-- المنصّات المتحركة + حمل اللاعب الواقف عليها
	for _, m in ipairs(movers) do
		local off = math.sin((t / m.period + m.phase) * TAU) * m.half
		local np = m.base + m.dir * off
		if justActivated then m.lastPos = np end
		local delta = np - m.lastPos
		m.part.CFrame = CFrame.new(np)
		if delta.Magnitude > 0 then
			for _, e in ipairs(near) do
				local rel = e.hrp.Position - np
				if math.abs(rel.X) <= m.hx and math.abs(rel.Z) <= m.hz and rel.Y > 0 and rel.Y < 5.5 then
					e.hrp.CFrame = e.hrp.CFrame + delta
				end
			end
		end
		m.lastPos = np
	end

	-- المنصّات التي تختفي وتظهر
	for _, b in ipairs(blinkers) do
		local p = (t + b.phase) % b.cycle
		if p < b.onT then
			b.part.Transparency = 0; b.part.CanCollide = true
		elseif p < b.onT + b.warnT then
			b.part.Transparency = 0.5; b.part.CanCollide = true     -- تحذير قبل الاختفاء
		else
			b.part.Transparency = 1; b.part.CanCollide = false
		end
	end

	-- العقبات الدوّارة
	for _, r in ipairs(rotators) do
		local ang = (t * r.speed) % 360
		r.part.CFrame = CFrame.new(r.center) * CFrame.Angles(0, math.rad(ang), 0)
	end

	-- العودة لآخر نقطة حفظ عند السقوط
	for _, e in ipairs(near) do
		local st = runState[e.pl.UserId]
		if st and st.inRun then
			local cp = checkpoints[st.cpIndex]
			if cp and e.hrp.Position.Y < (cp.y - 6) then
				e.hrp.CFrame = cp.cf
				if _G.NotifyPlayer then _G.NotifyPlayer(e.pl, "↩️ رجعناك لآخر نقطة حفظ.") end
			end
		end
	end
end)

-- تحديث عدّاد الوقت على الواجهة كل ثانية (خفيف)
task.spawn(function()
	while true do
		for _, player in ipairs(Players:GetPlayers()) do
			local st = runState[player.UserId]
			if st and st.inRun then sendProgress(player) end
		end
		task.wait(1)
	end
end)

-- عند إعادة الظهور أثناء الجولة، أرجع اللاعب لآخر نقطة حفظ
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
	local board = newPart({ Name = "LB_" .. title, Size = V(12, 14, 0.6),
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

local fastestFrame = makeBoard("🏆 أسرع الأوقات", V(-95, 11, 78))
local dailyFrame   = makeBoard("🥇 أسرع اليوم",   V(-83, 11, 78))
local compFrame    = makeBoard("🔥 الأكثر إكمالاً", V(-71, 11, 78))

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

print("[ParkourSystem] Course ready —", TOTAL_CP, "checkpoints,", #movers, "movers,", #blinkers, "blinkers,", #rotators, "rotators")
