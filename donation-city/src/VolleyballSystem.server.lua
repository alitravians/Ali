--[[
╔══════════════════════════════════════════════════════════════════════╗
║  كرة الطائرة — VOLLEYBALL SYSTEM (Server)                             ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  • ملعب رملي بجانب البحر: شبكة احترافية + خطوط حدود + مدرّج مشاهدة      ║
║  • مباريات فريق ضد فريق: 1v1 / 2v2 / 3v3 (تُحدَّد تلقائياً بعدد الفريقين)║
║  • كرة بفيزياء واقعية: لمسة اللاعب تردّها فوق الشبكة للجهة الأخرى        ║
║  • احتساب تلقائي: الإرسال + خروج الكرة + سقوطها داخل الملعب + الفوز      ║
║  • لوحة نتائج حيّة (أسماء الفريقين + النقاط + الفائز) تُقرأ من الوجهين    ║
║  • مكافآت عند الفوز: كوينز + إنجازات + تسجيل في لوحة المتصدّرين          ║
║  • لوحة متصدّرين (أكثر اللاعبين فوزاً) عبر OrderedDataStore              ║
║  • منطقة مستقلة جنوب الشاطئ، لا تمسّ السينما/الباركور/ألعاب الأطفال      ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace        = game:GetService("Workspace")
local Players          = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService       = game:GetService("RunService")

----------------------------------------------------------------------
-- إعدادات الملعب والمباراة
----------------------------------------------------------------------
local VCX, VCZ = 150, -100        -- مركز الملعب (جنوب الشاطئ، بجانب البحر)
local FLOOR_Y  = 1.5              -- سطح أرضية الملعب (أعلى نقطة)
local HALF_W   = 9                -- نصف عرض الملعب (محور X)
local HALF_L   = 18               -- نصف طول كل جهة (محور Z)
local NET_Z    = VCZ              -- الشبكة في المنتصف (Z ثابت)
local NET_X0, NET_X1 = VCX - 10, VCX + 10
local LAND_Y   = 3.2              -- ارتفاع يُعتبر دونه أن الكرة لمست الأرض
local MATCH_POINTS = 7            -- نقاط الفوز (مع فارق نقطتين، وسقف 11)
local HARD_CAP = 11
local MAX_TEAM = 3
local SERVE_DELAY = 2.5           -- ثوانٍ قبل انطلاق الإرسال

-- ألوان
local SAND   = Color3.fromRGB(232, 210, 152)
local LINE   = Color3.fromRGB(250, 250, 250)
local BLUE   = Color3.fromRGB(70, 140, 240)
local RED    = Color3.fromRGB(235, 80, 80)
local NETCOL = Color3.fromRGB(245, 245, 245)
local POST   = Color3.fromRGB(40, 42, 55)
local GOLD   = Color3.fromRGB(255, 205, 70)
local DARK   = Color3.fromRGB(18, 20, 34)

----------------------------------------------------------------------
-- DataStore: لوحة المتصدّرين (أكثر فوزاً)
----------------------------------------------------------------------
local winsRank
pcall(function() winsRank = DataStoreService:GetOrderedDataStore("VolleyWins_v1") end)

local court = Instance.new("Model")
court.Name = "VolleyballCourt"
court.Parent = Workspace

local function newPart(props)
	local p = Instance.new("Part")
	p.Anchored = props.Anchored ~= false
	p.CanCollide = props.CanCollide ~= false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Name = props.Name or "Part"
	if props.Shape then p.Shape = props.Shape end
	p.Size = props.Size or Vector3.new(1, 1, 1)
	if props.CFrame then p.CFrame = props.CFrame else p.Position = props.Position or Vector3.new() end
	p.Color = props.Color or Color3.fromRGB(180, 180, 180)
	p.Material = props.Material or Enum.Material.SmoothPlastic
	if props.Transparency then p.Transparency = props.Transparency end
	if props.Reflectance then p.Reflectance = props.Reflectance end
	p.Parent = props.Parent or court
	return p
end

----------------------------------------------------------------------
-- بناء الملعب: أرضية رملية + خطوط + شبكة + أعمدة
----------------------------------------------------------------------
-- قاعدة رملية مستقلة للملعب
newPart({ Name = "CourtSand", Size = Vector3.new(2 * HALF_W + 16, 1, 2 * HALF_L + 16),
	Position = Vector3.new(VCX, FLOOR_Y - 0.5, VCZ), Color = SAND, Material = Enum.Material.Sand })

-- أرضية اللعب (سطح أنعم لارتداد الكرة) — جهتان ملوّنتان خفيفتان
newPart({ Name = "FloorA", Size = Vector3.new(2 * HALF_W, 0.4, HALF_L),
	Position = Vector3.new(VCX, FLOOR_Y, VCZ - HALF_L / 2), Color = Color3.fromRGB(225, 200, 150),
	Material = Enum.Material.Sand, Transparency = 0.15, CanCollide = false })
newPart({ Name = "FloorB", Size = Vector3.new(2 * HALF_W, 0.4, HALF_L),
	Position = Vector3.new(VCX, FLOOR_Y, VCZ + HALF_L / 2), Color = Color3.fromRGB(150, 175, 210),
	Material = Enum.Material.Sand, Transparency = 0.15, CanCollide = false })

-- خطوط حدود الملعب (نيون رفيع فوق الرمل)
local function line(cx, cz, sx, sz)
	newPart({ Name = "Line", Size = Vector3.new(sx, 0.2, sz),
		Position = Vector3.new(cx, FLOOR_Y + 0.25, cz), Color = LINE,
		Material = Enum.Material.Neon, CanCollide = false })
end
line(VCX, VCZ - HALF_L, 2 * HALF_W + 0.6, 0.6)   -- الخط الخلفي A
line(VCX, VCZ + HALF_L, 2 * HALF_W + 0.6, 0.6)   -- الخط الخلفي B
line(VCX - HALF_W, VCZ, 0.6, 2 * HALF_L)         -- الجانب الأيسر
line(VCX + HALF_W, VCZ, 0.6, 2 * HALF_L)         -- الجانب الأيمن
line(VCX, VCZ, 2 * HALF_W + 0.6, 0.6)            -- خط الوسط (تحت الشبكة)

-- أعمدة الشبكة + الشبكة نفسها
newPart({ Name = "NetPostL", Size = Vector3.new(0.7, 9, 0.7),
	Position = Vector3.new(NET_X0, FLOOR_Y + 4.5, NET_Z), Color = POST, Material = Enum.Material.Metal })
newPart({ Name = "NetPostR", Size = Vector3.new(0.7, 9, 0.7),
	Position = Vector3.new(NET_X1, FLOOR_Y + 4.5, NET_Z), Color = POST, Material = Enum.Material.Metal })
-- شريط الشبكة العلوي (أبيض) + جسم الشبكة (شبه شفّاف يصدّ الكرة)
newPart({ Name = "NetTop", Size = Vector3.new(2 * HALF_W + 2, 0.5, 0.4),
	Position = Vector3.new(VCX, FLOOR_Y + 8, NET_Z), Color = NETCOL, Material = Enum.Material.SmoothPlastic })
newPart({ Name = "NetBody", Size = Vector3.new(2 * HALF_W + 2, 5.4, 0.4),
	Position = Vector3.new(VCX, FLOOR_Y + 5.1, NET_Z), Color = NETCOL, Material = Enum.Material.ForceField,
	Transparency = 0.2 })

----------------------------------------------------------------------
-- مدرّج مشاهدة صغير (غرب الملعب)
----------------------------------------------------------------------
do
	local standX = VCX - HALF_W - 7
	for row = 0, 2 do
		newPart({ Name = "Bleacher", Size = Vector3.new(4, 1, 2 * HALF_L),
			Position = Vector3.new(standX - row * 4, FLOOR_Y + 0.5 + row * 1.6, VCZ),
			Color = Color3.fromRGB(120, 90, 60), Material = Enum.Material.WoodPlanks })
	end
	-- مظلّة على المدرّج
	newPart({ Name = "StandRoof", Size = Vector3.new(14, 0.4, 2 * HALF_L + 4),
		Position = Vector3.new(standX - 4, FLOOR_Y + 10, VCZ), Color = Color3.fromRGB(60, 120, 200),
		Material = Enum.Material.Fabric, CanCollide = false })
end

----------------------------------------------------------------------
-- لوحة نصّية على الوجهين (بدون Adornee — يحجبها جسم اللوح فلا يزدوج النص)
----------------------------------------------------------------------
local function dualText(part, makeFn)
	for _, face in ipairs({ Enum.NormalId.Front, Enum.NormalId.Back }) do
		local sg = Instance.new("SurfaceGui")
		sg.Face = face
		sg.CanvasSize = Vector2.new(800, 300)
		sg.LightInfluence = 0
		sg.Parent = part
		makeFn(sg)
	end
end

----------------------------------------------------------------------
-- لوحة النتائج الحيّة (فوق الشبكة، تُقرأ من الجهتين)
----------------------------------------------------------------------
local scoreBoard = newPart({ Name = "ScoreBoard", Size = Vector3.new(2 * HALF_W + 2, 6, 0.6),
	Position = Vector3.new(VCX, FLOOR_Y + 12.5, NET_Z), Color = DARK, Material = Enum.Material.SmoothPlastic })

local scoreLabels = {}  -- face -> { title, score, sub }
local function buildScoreFace(sg)
	local frame = Instance.new("Frame")
	frame.BackgroundColor3 = DARK; frame.BorderSizePixel = 0
	frame.Size = UDim2.fromScale(1, 1); frame.Parent = sg
	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1; title.Size = UDim2.new(1, 0, 0, 70)
	title.Position = UDim2.new(0, 0, 0, 6); title.Font = Enum.Font.GothamBlack
	title.TextScaled = true; title.TextColor3 = GOLD; title.RichText = true
	title.Text = "🏐 كرة الطائرة"; title.Parent = frame
	local score = Instance.new("TextLabel")
	score.BackgroundTransparency = 1; score.Size = UDim2.new(1, 0, 0, 150)
	score.Position = UDim2.new(0, 0, 0, 78); score.Font = Enum.Font.GothamBlack
	score.TextScaled = true; score.RichText = true; score.TextColor3 = Color3.new(1, 1, 1)
	score.Text = "في الانتظار…"; score.Parent = frame
	local sub = Instance.new("TextLabel")
	sub.BackgroundTransparency = 1; sub.Size = UDim2.new(1, 0, 0, 60)
	sub.Position = UDim2.new(0, 0, 1, -64); sub.Font = Enum.Font.GothamMedium
	sub.TextScaled = true; sub.TextColor3 = Color3.fromRGB(190, 200, 220)
	sub.Text = "انضمّ للفريق وابدأ المباراة"; sub.Parent = frame
	table.insert(scoreLabels, { title = title, score = score, sub = sub })
end
dualText(scoreBoard, buildScoreFace)

----------------------------------------------------------------------
-- حالة المباراة
----------------------------------------------------------------------
local match = {
	phase = "idle",       -- idle | serving | rally | over
	teamA = {}, teamB = {},  -- arrays of userId
	scoreA = 0, scoreB = 0,
	server = "A",
	lastTouch = nil,      -- "A" | "B"
	scoredLock = false,
	achA = false, achB = false, -- وسم بلوغ 5 نقاط
}

local function teamArr(t) return t == "A" and match.teamA or match.teamB end
local function other(t) return t == "A" and "B" or "A" end

local function teamOf(userId)
	for _, id in ipairs(match.teamA) do if id == userId then return "A" end end
	for _, id in ipairs(match.teamB) do if id == userId then return "B" end end
	return nil
end

local function removeFrom(arr, userId)
	for i, id in ipairs(arr) do
		if id == userId then table.remove(arr, i); return true end
	end
	return false
end

local function namesOf(arr)
	local out = {}
	for _, id in ipairs(arr) do
		local p = Players:GetPlayerByUserId(id)
		out[#out + 1] = p and (p.DisplayName ~= "" and p.DisplayName or p.Name) or ("#" .. id)
	end
	return #out > 0 and table.concat(out, " + ") or "—"
end

local function notifyAll(text)
	for _, p in ipairs(Players:GetPlayers()) do
		if _G.NotifyPlayer then _G.NotifyPlayer(p, text) end
	end
end
local function notifyTeams(text)
	for _, t in ipairs({ "A", "B" }) do
		for _, id in ipairs(teamArr(t)) do
			local p = Players:GetPlayerByUserId(id)
			if p and _G.NotifyPlayer then _G.NotifyPlayer(p, text) end
		end
	end
end

----------------------------------------------------------------------
-- تحديث لوحة النتائج
----------------------------------------------------------------------
local function updateBoard()
	local scoreText, subText
	if match.phase == "idle" then
		scoreText = string.format("🔵 %d  -  %d 🔴", match.scoreA, match.scoreB)
		subText = string.format("الأزرق: %s  ·  الأحمر: %s", namesOf(match.teamA), namesOf(match.teamB))
		if #match.teamA == 0 and #match.teamB == 0 then
			scoreText = "في الانتظار…"
			subText = "انضمّ لفريق من اللوحتين ثم «ابدأ المباراة»"
		end
	elseif match.phase == "over" then
		scoreText = string.format("🔵 %d  -  %d 🔴", match.scoreA, match.scoreB)
		local winner = match.scoreA > match.scoreB and "🔵 الأزرق" or "🔴 الأحمر"
		subText = "🏆 الفائز: " .. winner
	else
		scoreText = string.format("🔵 %d  -  %d 🔴", match.scoreA, match.scoreB)
		local fmt = match.phase == "serving" and "إرسال فريق %s" or "اللعب جارٍ — فريق الإرسال %s"
		subText = string.format(fmt, match.server == "A" and "الأزرق" or "الأحمر")
			.. string.format("  (حتى %d نقطة)", MATCH_POINTS)
	end
	for _, lab in ipairs(scoreLabels) do
		lab.score.Text = scoreText
		lab.sub.Text = subText
	end
end

----------------------------------------------------------------------
-- الكرة + فيزياؤها
----------------------------------------------------------------------
local ball = newPart({ Name = "VolleyBall", Shape = Enum.PartType.Ball, Anchored = true,
	Size = Vector3.new(2.4, 2.4, 2.4), Position = Vector3.new(VCX, FLOOR_Y + 7, NET_Z),
	Color = Color3.fromRGB(255, 245, 230), Material = Enum.Material.SmoothPlastic })
ball.CustomPhysicalProperties = PhysicalProperties.new(0.7, 0.3, 0.55, 1, 1)
do
	-- خطوط الكرة (تزيين)
	local d = Instance.new("Decal"); d.Texture = "rbxassetid://6701051873"; d.Face = Enum.NormalId.Front; d.Parent = ball
end

local serveSpot = {
	A = Vector3.new(VCX, FLOOR_Y + 6, VCZ - HALF_L + 2),
	B = Vector3.new(VCX, FLOOR_Y + 6, VCZ + HALF_L - 2),
}

-- ردّ الكرة لجهة الخصم (لمسة لاعب أو إرسال)
local function hitBall(fromTeam, isServe)
	local dirZ = (fromTeam == "A") and 1 or -1   -- A ترسل نحو +Z (جهة B)
	local vy = isServe and 38 or 44
	local vz = dirZ * (isServe and 26 or 30)
	local vx = (VCX - ball.Position.X) * 1.4     -- توجيه نحو منتصف العرض
	vx = math.clamp(vx, -22, 22)
	ball.AssemblyLinearVelocity = Vector3.new(vx, vy, vz)
	ball.AssemblyAngularVelocity = Vector3.new(math.random(-6, 6), 0, math.random(-6, 6))
end

-- تثبيت الكرة في نقطة الإرسال
local function parkBall(team)
	ball.Anchored = true
	ball.AssemblyLinearVelocity = Vector3.zero
	ball.AssemblyAngularVelocity = Vector3.zero
	ball.CFrame = CFrame.new(serveSpot[team])
end

----------------------------------------------------------------------
-- بدء/إنهاء الجولة (الإرسال)
----------------------------------------------------------------------
local serveToken = 0

local function beginServe()
	if match.phase == "over" or match.phase == "idle" then return end
	match.phase = "serving"
	match.lastTouch = match.server
	match.scoredLock = false
	parkBall(match.server)
	updateBoard()
	notifyTeams(string.format("🏐 إرسال فريق %s خلال %.0f ثوانٍ…",
		match.server == "A" and "الأزرق" or "الأحمر", SERVE_DELAY))
	serveToken += 1
	local myToken = serveToken
	task.delay(SERVE_DELAY, function()
		if myToken ~= serveToken then return end
		if match.phase ~= "serving" then return end
		match.phase = "rally"
		ball.Anchored = false
		hitBall(match.server, true)
		updateBoard()
	end)
end

----------------------------------------------------------------------
-- تسجيل الفوز في لوحة المتصدّرين
----------------------------------------------------------------------
local function recordWins(userIds)
	if not winsRank then return end
	for _, id in ipairs(userIds) do
		pcall(function()
			winsRank:UpdateAsync(tostring(id), function(old)
				return (tonumber(old) or 0) + 1
			end)
		end)
	end
end

local refreshLeaderboard  -- forward

local function endMatch(winnerTeam)
	match.phase = "over"
	ball.Anchored = true
	ball.CFrame = CFrame.new(VCX, FLOOR_Y + 7, NET_Z)
	local winners = teamArr(winnerTeam)
	local losers = teamArr(other(winnerTeam))
	-- مكافآت
	for _, id in ipairs(winners) do
		local p = Players:GetPlayerByUserId(id)
		if p then
			if _G.AddCoins then _G.AddCoins(p, 150) end
			if _G.AwardAchievement then
				_G.AwardAchievement(p, "vb_first")
				_G.AwardAchievement(p, "vb_win")
			end
			if _G.NotifyPlayer then _G.NotifyPlayer(p, "🏆 فزت بمباراة كرة الطائرة! +150 كوينز") end
		end
	end
	for _, id in ipairs(losers) do
		local p = Players:GetPlayerByUserId(id)
		if p then
			if _G.AddCoins then _G.AddCoins(p, 40) end
			if _G.AwardAchievement then _G.AwardAchievement(p, "vb_first") end
			if _G.NotifyPlayer then _G.NotifyPlayer(p, "🏐 انتهت المباراة — حاول مرة أخرى! +40 كوينز") end
		end
	end
	recordWins(winners)
	notifyAll(string.format("🏐 انتهت مباراة كرة الطائرة! الفائز: فريق %s (%d-%d)",
		winnerTeam == "A" and "الأزرق" or "الأحمر", match.scoreA, match.scoreB))
	updateBoard()
	if refreshLeaderboard then task.spawn(refreshLeaderboard) end
	-- إعادة الضبط بعد لحظات
	task.delay(8, function()
		if match.phase == "over" then
			match.teamA, match.teamB = {}, {}
			match.scoreA, match.scoreB = 0, 0
			match.server, match.lastTouch = "A", nil
			match.achA, match.achB = false, false
			match.phase = "idle"
			parkBall("A")
			ball.Anchored = true
			ball.CFrame = CFrame.new(VCX, FLOOR_Y + 7, NET_Z)
			updateBoard()
		end
	end)
end

----------------------------------------------------------------------
-- منح نقطة + فحص الفوز
----------------------------------------------------------------------
local function awardPoint(team, reason)
	if team == "A" then match.scoreA += 1 else match.scoreB += 1 end
	local sc = team == "A" and match.scoreA or match.scoreB
	-- إنجاز تسجيل 5 نقاط
	if sc >= 5 then
		local flagged = team == "A" and match.achA or match.achB
		if not flagged then
			if team == "A" then match.achA = true else match.achB = true end
			for _, id in ipairs(teamArr(team)) do
				local p = Players:GetPlayerByUserId(id)
				if p and _G.AwardAchievement then _G.AwardAchievement(p, "vb_points") end
			end
		end
	end
	notifyTeams(string.format("🏐 نقطة لفريق %s (%s) — %d:%d",
		team == "A" and "الأزرق" or "الأحمر", reason, match.scoreA, match.scoreB))
	-- شرط الفوز: بلوغ النقاط المطلوبة بفارق نقطتين، أو السقف الأقصى
	local hi = math.max(match.scoreA, match.scoreB)
	local lo = math.min(match.scoreA, match.scoreB)
	if (hi >= MATCH_POINTS and hi - lo >= 2) or hi >= HARD_CAP then
		endMatch(match.scoreA > match.scoreB and "A" or "B")
	else
		match.server = team   -- الفائز بالنقطة يُرسل
		beginServe()
	end
end

----------------------------------------------------------------------
-- لمس الكرة (ردّها) أثناء اللعب
----------------------------------------------------------------------
local lastHitClock = 0
ball.Touched:Connect(function(hit)
	if match.phase ~= "rally" then return end
	local char = hit and hit.Parent
	local player = char and Players:GetPlayerFromCharacter(char)
	if not player then return end
	local team = teamOf(player.UserId)
	if not team then return end
	if os.clock() - lastHitClock < 0.22 then return end
	lastHitClock = os.clock()
	match.lastTouch = team
	hitBall(team, false)
end)

----------------------------------------------------------------------
-- حلقة كشف سقوط الكرة (نهاية الجولة)
----------------------------------------------------------------------
local function inCourtBounds(pos)
	return math.abs(pos.X - VCX) <= HALF_W + 0.5
		and pos.Z >= (VCZ - HALF_L - 0.5) and pos.Z <= (VCZ + HALF_L + 0.5)
end

task.spawn(function()
	while true do
		if match.phase == "rally" and not match.scoredLock then
			local pos = ball.Position
			-- سقطت على الأرض أو خرجت بعيداً جداً
			if pos.Y <= LAND_Y or pos.Y < FLOOR_Y - 30 then
				match.scoredLock = true
				if inCourtBounds(pos) then
					-- سقطت داخل الملعب: الجهة التي سقطت فيها تخسر النقطة
					local landSide = (pos.Z < NET_Z) and "A" or "B"
					awardPoint(other(landSide), "سقطت داخل الملعب")
				else
					-- خرجت: من لمسها أخيراً أخرجها → النقطة للخصم
					local fault = match.lastTouch or other(match.server)
					awardPoint(other(fault), "خروج الكرة")
				end
			end
		end
		RunService.Heartbeat:Wait()
	end
end)

----------------------------------------------------------------------
-- نظام الانضمام (لوحات + ProximityPrompt)
----------------------------------------------------------------------
local function teleportToSide(player, team)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if not hrp then return end
	local z = team == "A" and (VCZ - HALF_L + 4) or (VCZ + HALF_L - 4)
	hrp.CFrame = CFrame.new(VCX, FLOOR_Y + 4, z)
end

local function joinTeam(player, team)
	if match.phase ~= "idle" then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "⏳ توجد مباراة جارية — انتظر انتهاءها.") end
		return
	end
	local arr = teamArr(team)
	if #arr >= MAX_TEAM then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "🚫 الفريق ممتلئ (الحد 3 لاعبين).") end
		return
	end
	-- أزله من الفريق الآخر إن كان فيه
	removeFrom(teamArr(other(team)), player.UserId)
	if not teamOf(player.UserId) then
		table.insert(arr, player.UserId)
	end
	if _G.NotifyPlayer then
		_G.NotifyPlayer(player, string.format("✅ انضممت لفريق %s. اضغط «ابدأ المباراة» عند الجاهزية.",
			team == "A" and "الأزرق" or "الأحمر"))
	end
	updateBoard()
end

local function leaveMatch(player)
	if match.phase ~= "idle" then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "⏳ لا يمكن المغادرة أثناء مباراة جارية.") end
		return
	end
	if removeFrom(match.teamA, player.UserId) or removeFrom(match.teamB, player.UserId) then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "↩️ غادرت الفريق.") end
		updateBoard()
	end
end

local function startMatch(player)
	if match.phase ~= "idle" then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "⏳ المباراة بدأت بالفعل.") end
		return
	end
	local a, b = #match.teamA, #match.teamB
	if a == 0 or b == 0 then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "🚫 يحتاج كل فريق لاعباً واحداً على الأقل.") end
		return
	end
	if a ~= b then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, string.format("🚫 يجب تساوي الفريقين (الآن %d ضد %d).", a, b)) end
		return
	end
	match.scoreA, match.scoreB = 0, 0
	match.achA, match.achB = false, false
	match.server = "A"
	for _, t in ipairs({ "A", "B" }) do
		for _, id in ipairs(teamArr(t)) do
			local p = Players:GetPlayerByUserId(id)
			if p then teleportToSide(p, t) end
		end
	end
	notifyAll(string.format("🏐 بدأت مباراة كرة الطائرة %dضد%d! 🔵 %s  ضد  🔴 %s",
		a, b, namesOf(match.teamA), namesOf(match.teamB)))
	beginServe()
end

-- لوحة انضمام بـ ProximityPrompt
local function joinPad(label, color, pos, onTrigger)
	local pad = newPart({ Name = "Join_" .. label, Size = Vector3.new(5, 5, 0.6),
		Position = pos, Color = color, Material = Enum.Material.Neon })
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = label
	prompt.ObjectText = "🏐 كرة الطائرة"
	prompt.HoldDuration = 0.2
	prompt.MaxActivationDistance = 12
	prompt.RequiresLineOfSight = false
	prompt.Parent = pad
	prompt.Triggered:Connect(function(plr) onTrigger(plr) end)
	-- وسم نصّي على الوجهين
	dualText(pad, function(sg)
		sg.CanvasSize = Vector2.new(300, 300)
		local t = Instance.new("TextLabel")
		t.BackgroundTransparency = 1; t.Size = UDim2.fromScale(1, 1)
		t.Font = Enum.Font.GothamBlack; t.TextScaled = true; t.TextColor3 = Color3.new(1, 1, 1)
		t.Text = label; t.Parent = sg
	end)
	return pad
end

local entryZ = VCZ - HALF_L - 8   -- منطقة الانضمام شمال الملعب (جهة الشاطئ)
joinPad("انضم للأزرق 🔵", BLUE, Vector3.new(VCX - 7, FLOOR_Y + 3, entryZ),
	function(p) joinTeam(p, "A") end)
joinPad("انضم للأحمر 🔴", RED, Vector3.new(VCX + 7, FLOOR_Y + 3, entryZ),
	function(p) joinTeam(p, "B") end)
joinPad("ابدأ المباراة ▶️", Color3.fromRGB(90, 200, 120), Vector3.new(VCX, FLOOR_Y + 3, entryZ - 5),
	startMatch)
joinPad("مغادرة ↩️", Color3.fromRGB(120, 120, 130), Vector3.new(VCX + 14, FLOOR_Y + 3, entryZ),
	leaveMatch)

----------------------------------------------------------------------
-- تنظيف عند خروج لاعب من السيرفر
----------------------------------------------------------------------
Players.PlayerRemoving:Connect(function(player)
	local team = teamOf(player.UserId)
	if not team then return end
	if match.phase == "idle" then
		removeFrom(match.teamA, player.UserId)
		removeFrom(match.teamB, player.UserId)
		updateBoard()
	else
		-- غادر لاعب أثناء مباراة → الخصم يفوز افتراضياً
		removeFrom(match.teamA, player.UserId)
		removeFrom(match.teamB, player.UserId)
		local remainA, remainB = #match.teamA, #match.teamB
		if remainA == 0 and remainB > 0 then
			endMatch("B")
		elseif remainB == 0 and remainA > 0 then
			endMatch("A")
		elseif remainA == 0 and remainB == 0 then
			-- كل اللاعبين غادروا بنفس اللحظة — نعيد الملعب للحالة الأولية
			match.phase = "idle"
			match.scoreA, match.scoreB = 0, 0
			match.server, match.lastTouch = "A", nil
			match.achA, match.achB = false, false
			serveToken += 1   -- يلغي أي إرسال مجدول
			ball.Anchored = true
			ball.CFrame = CFrame.new(VCX, FLOOR_Y + 7, NET_Z)
			updateBoard()
		end
	end
end)

----------------------------------------------------------------------
-- لوحة المتصدّرين (أكثر اللاعبين فوزاً)
----------------------------------------------------------------------
local lbBoard = newPart({ Name = "VolleyLeaderboard", Size = Vector3.new(10, 13, 0.6),
	Position = Vector3.new(VCX - HALF_W - 16, FLOOR_Y + 7, VCZ), Color = DARK,
	CFrame = CFrame.new(VCX - HALF_W - 16, FLOOR_Y + 7, VCZ) * CFrame.Angles(0, math.rad(90), 0) })

local lbList
do
	local sg = Instance.new("SurfaceGui")
	sg.Face = Enum.NormalId.Front
	sg.CanvasSize = Vector2.new(360, 480); sg.LightInfluence = 0; sg.Parent = lbBoard
	local frame = Instance.new("Frame"); frame.BackgroundColor3 = DARK
	frame.BorderSizePixel = 0; frame.Size = UDim2.fromScale(1, 1); frame.Parent = sg
	local head = Instance.new("TextLabel"); head.BackgroundTransparency = 1
	head.Size = UDim2.new(1, 0, 0, 60); head.Font = Enum.Font.GothamBlack
	head.TextScaled = true; head.TextColor3 = GOLD; head.Text = "🏐 أبطال كرة الطائرة"; head.Parent = frame
	lbList = Instance.new("TextLabel"); lbList.BackgroundTransparency = 1
	lbList.Position = UDim2.new(0, 12, 0, 68); lbList.Size = UDim2.new(1, -24, 1, -76)
	lbList.Font = Enum.Font.GothamMedium; lbList.TextScaled = false; lbList.TextSize = 26
	lbList.TextYAlignment = Enum.TextYAlignment.Top; lbList.TextXAlignment = Enum.TextXAlignment.Right
	lbList.RichText = true; lbList.TextColor3 = Color3.new(1, 1, 1); lbList.TextWrapped = true
	lbList.Text = "جارٍ التحميل…"; lbList.Parent = frame
end

local nameCache = {}
local function nameFor(userId)
	if nameCache[userId] then return nameCache[userId] end
	local nm = "#" .. userId
	pcall(function() nm = Players:GetNameFromUserIdAsync(tonumber(userId)) end)
	nameCache[userId] = nm
	return nm
end

refreshLeaderboard = function()
	if not winsRank then lbList.Text = "—"; return end
	local ok, page = pcall(function()
		return winsRank:GetSortedAsync(false, 10)
	end)
	if not ok or not page then return end
	local top = page:GetCurrentPage()
	local lines = {}
	for i, entry in ipairs(top) do
		local medal = (i == 1 and "🥇") or (i == 2 and "🥈") or (i == 3 and "🥉") or (i .. ".")
		lines[#lines + 1] = string.format("%s %s — %d فوز", medal, nameFor(entry.key), entry.value)
	end
	lbList.Text = #lines > 0 and table.concat(lines, "\n") or "لا يوجد أبطال بعد — كن الأول!"
end

task.spawn(function()
	while true do
		refreshLeaderboard()
		task.wait(60)
	end
end)

----------------------------------------------------------------------
-- لوحة ترحيب «🏐 ملعب كرة الطائرة» على الوجهين
----------------------------------------------------------------------
do
	local post = newPart({ Name = "VolleySignPost", Size = Vector3.new(1, 8, 1),
		Position = Vector3.new(VCX, FLOOR_Y + 4, entryZ - 10), Color = POST, Material = Enum.Material.Metal })
	local sign = newPart({ Name = "VolleySign", Size = Vector3.new(16, 4, 0.6),
		Position = Vector3.new(VCX, FLOOR_Y + 8.5, entryZ - 10), Color = DARK })
	dualText(sign, function(sg)
		local t = Instance.new("TextLabel")
		t.BackgroundTransparency = 1; t.Size = UDim2.fromScale(1, 1)
		t.Font = Enum.Font.GothamBlack; t.TextScaled = true; t.TextColor3 = GOLD
		t.RichText = true; t.Text = "🏐 ملعب كرة الطائرة"; t.Parent = sg
	end)
end

updateBoard()
parkBall("A")
print("[Volleyball] الملعب جاهز عند (" .. VCX .. ", " .. VCZ .. ")")
