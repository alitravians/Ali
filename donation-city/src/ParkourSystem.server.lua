--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام الباركور — PARKOUR SYSTEM (Server)                              ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  نظام باركور جديد كامل، مبني بالكامل بقطع روبلوكس أصلية (Part/Cylinder) ║
║  داخل هذا السكربت — صفر Union/Mesh = صفر مكعّبات. سهل/عائلي، طابع جزر    ║
║  طائرة ملوّنة، مسار خطّي صاعد بهدوء يفهمه أي لاعب فوراً:                  ║
║   ─ ١٤ منصّة واسعة ومسافات قريبة على ٤ مناطق ملوّنة بالتدرّج:            ║
║       أخضر (تعليمي بلا خطر) ← فيروزي ← برتقالي ← أحمر (القمة).           ║
║   ─ نقاط حفظ مرقّمة (١·٢·٣·٤) عند بداية كل منطقة: تلمسها = تُحفظ نقطتك.   ║
║   ─ حواجز/بلاطات حمراء قاتلة: لمسها = ترجع فوراً لآخر نقطة حفظ (إعادة    ║
║     المرحلة). عوائق حمراء دوّارة في الزون البرتقالي/الأحمر. منصّة قفز      ║
║     فيروزية نطّاطة كلمسة متعة.                                          ║
║   ─ أسهم ذهبية فوق كل فجوة تأشّر للمنصّة التالية. بداية «ابدأ هنا»         ║
║     واضحة + قوس نهاية «النهاية».                                        ║
║   ─ تسقط تحت المسار → ترجع لآخر نقطة حفظ. تصل القمة → كوينز + إنجاز.     ║
║                                                                        ║
║  الأداء: كل القطع Anchored (صفر فيزياء). المنطق على أحداث Touched،      ║
║  وحلقة واحدة (تقدّم/سقوط + تدوير العوائق) تعمل فقط أثناء جولة نشِطة       ║
║  وتتوقّف تماماً عند الخمول → صفر استهلاك أثناء الخمول (لا لاق).          ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace         = game:GetService("Workspace")
local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")
local DataStoreService  = game:GetService("DataStoreService")

local V = Vector3.new
local C3 = Color3.fromRGB

----------------------------------------------------------------------
-- RemoteEvents (نفس عقد الواجهة: Progress / Stop)
----------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("ParkourRemotes")
if not remotes then
	remotes = Instance.new("Folder"); remotes.Name = "ParkourRemotes"; remotes.Parent = ReplicatedStorage
end
local progressRemote = remotes:FindFirstChild("Progress")
if not progressRemote then
	progressRemote = Instance.new("RemoteEvent"); progressRemote.Name = "Progress"; progressRemote.Parent = remotes
end
local stopRemote = remotes:FindFirstChild("Stop")
if not stopRemote then
	stopRemote = Instance.new("RemoteEvent"); stopRemote.Name = "Stop"; stopRemote.Parent = remotes
end

----------------------------------------------------------------------
-- أفضل وقت شخصي (اختياري، آمن بـ pcall)
----------------------------------------------------------------------
local bestStore
pcall(function() bestStore = DataStoreService:GetDataStore("ParkourBest_v2") end)

----------------------------------------------------------------------
-- ثوابت الهندسة والألوان
----------------------------------------------------------------------
local ORIGIN_X, ORIGIN_Z = -175, 20    -- بداية المسار (سماء الركن الشمالي الغربي، فوق المباني)
local TOP0   = 90                      -- ارتفاع سطح أول منصّة
local RISE   = 3.6                     -- صعود لطيف بين كل منصّة (قفزة سهلة)
local STEP_X = 14                       -- تباعد المنصّات على X
local STEP_Z = 4                        -- انزياح بسيط على Z (مسار يقرأ بوضوح)
local PW, PD, PT = 11, 11, 1.2          -- عرض/عمق/سمك المنصّة
local COUNT = 14                        -- عدد المنصّات (0..13)

local FWD   = V(STEP_X, 0, STEP_Z).Unit        -- اتجاه التقدّم الأفقي
local RIGHTV = V(FWD.Z, 0, -FWD.X)             -- عمودي أفقي (لتوزيع الحواجز)

-- ألوان المناطق + اللمسات
local GREEN  = C3(126, 211, 110)
local TEAL   = C3(58, 200, 192)
local ORANGE = C3(245, 158, 66)
local RED    = C3(226, 88, 88)
local GOLD   = C3(214, 175, 92)
local ROCK   = C3(96, 68, 46)
local STEM   = C3(74, 52, 36)
local HAZARD = C3(222, 36, 36)
local BOUNCE = C3(64, 240, 208)
local CPGLOW = C3(120, 240, 150)
local SIGNBG = C3(22, 28, 44)
local POSTC  = C3(64, 64, 74)

local function zoneColor(i)
	if i <= 3 then return GREEN
	elseif i <= 6 then return TEAL
	elseif i <= 9 then return ORANGE
	else return RED end
end

-- خرائط العناصر (حسب رقم المنصّة)
local CP_AT     = { [0] = "١", [4] = "٢", [7] = "٣", [10] = "٤" }   -- نقاط حفظ مرقّمة
local STRIP_AT  = { [5] = true, [9] = true, [11] = true }            -- بلاطات حمراء قاتلة
local SPIN_AT   = { [8] = 1.1, [12] = 1.5 }                          -- عوائق دوّارة (سرعة rad/s)
local BOUNCE_AT = { [6] = true }                                     -- منصّة قفز نطّاطة

----------------------------------------------------------------------
-- أدوات بناء قطع أصلية
----------------------------------------------------------------------
local function mk(name, size, posOrCF, color, material, parent, canCollide)
	local p = Instance.new("Part")
	p.Name = name; p.Anchored = true
	p.CanCollide = (canCollide ~= false)
	p.Size = size
	if typeof(posOrCF) == "CFrame" then p.CFrame = posOrCF else p.Position = posOrCF end
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	return p
end

-- أسطوانة عمودية (الطول على المحور العمودي بعد تدوير 90° حول Z)
local function mkCyl(name, height, dia, centerY, x, z, color, material, parent, canCollide)
	local p = Instance.new("Part")
	p.Name = name; p.Anchored = true
	p.CanCollide = (canCollide ~= false)
	p.Shape = Enum.PartType.Cylinder
	p.Size = V(height, dia, dia)
	p.CFrame = CFrame.new(x, centerY, z) * CFrame.Angles(0, 0, math.rad(90))
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.Parent = parent
	return p
end

-- عمود/عارضة تصل بين نقطتين (للأسهم والقوس)
local function beam(p1, p2, th, color, material, parent)
	local d = (p2 - p1).Magnitude
	if d < 0.05 then return nil end
	local part = mk("Beam", V(th, th, d), CFrame.lookAt((p1 + p2) / 2, p2), color, material, parent, false)
	part.CanTouch = false
	return part
end

-- لافتة نص مزدوجة الوجه (تُقرأ من الجهتين، بلا أي إيموجي)
local function signGui(part, text, color, size)
	for _, face in ipairs({ Enum.NormalId.Front, Enum.NormalId.Back }) do
		local sg = Instance.new("SurfaceGui")
		sg.Face = face
		sg.AutoLocalize = false
		sg.CanvasSize = Vector2.new(size or 480, size or 480)
		sg.LightInfluence = 0
		sg.Parent = part
		local lbl = Instance.new("TextLabel")
		lbl.BackgroundTransparency = 1
		lbl.Size = UDim2.fromScale(1, 1)
		lbl.Font = Enum.Font.GothamBlack
		lbl.TextScaled = true
		lbl.Text = text
		lbl.TextColor3 = color or GOLD
		lbl.Parent = sg
	end
end

----------------------------------------------------------------------
-- بناء المسار داخل موديل ParkourCourse
----------------------------------------------------------------------
local old = Workspace:FindFirstChild("ParkourCourse")
if old then old:Destroy() end

local course = Instance.new("Model")
course.Name = "ParkourCourse"
course.Parent = Workspace

local fPlat  = Instance.new("Folder"); fPlat.Name  = "Platforms";   fPlat.Parent  = course
local fCP    = Instance.new("Folder"); fCP.Name    = "CheckPoints"; fCP.Parent    = course
local fHaz   = Instance.new("Folder"); fHaz.Name   = "Hazards";     fHaz.Parent   = course
local fDecor = Instance.new("Folder"); fDecor.Name = "Decor";       fDecor.Parent = course

local cpPads     = {}   -- أقراص نقاط الحفظ
local killParts  = {}   -- بلاطات/أشرطة قاتلة + أعمدة دوّارة
local bouncePads = {}   -- منصّات القفز
local spinners   = {}   -- {bar, center, angle, speed}
local finishPart

local function platTop(i) return TOP0 + i * RISE end
local function platCenter(i)
	return V(ORIGIN_X + i * STEP_X, platTop(i) - PT / 2, ORIGIN_Z + i * STEP_Z)
end

-- بلاطة قاتلة على سطح المنصّة (لمسها = رجوع)؛ مزاحة لجهة لتترك ممرّاً آمناً
local function buildStrip(i, top, cx, cz)
	local side = (i % 2 == 0) and 1 or -1
	local off = RIGHTV * (2.2 * side)
	local strip = mk("KillStrip", V(7.0, 0.4, 3.4),
		CFrame.lookAt(V(cx + off.X, top + 0.25, cz + off.Z), V(cx, top + 0.25, cz) + FWD),
		HAZARD, Enum.Material.Neon, fHaz, false)
	strip.CanTouch = true
	table.insert(killParts, strip)
end

-- عائق دوّار: عمود صلب + شريط أحمر يلفّ أفقياً (لمسه = رجوع)
local function buildSpinner(top, cx, cz, speed)
	mk("SpinPost", V(0.9, 4.6, 0.9), V(cx, top + 2.3, cz), POSTC, Enum.Material.Metal, fHaz, true)
	mkCyl("SpinHub", 0.6, 1.5, top + 1.7, cx, cz, GOLD, Enum.Material.Neon, fHaz, false)
	local center = V(cx, top + 1.7, cz)
	local bar = mk("SpinBar", V(0.7, 0.7, 9.0), CFrame.new(center), HAZARD, Enum.Material.Neon, fHaz, false)
	bar.CanTouch = true
	table.insert(killParts, bar)
	table.insert(spinners, { bar = bar, center = center, angle = 0, speed = speed })
end

-- منصّة قفز نطّاطة (لمسها = نطّة لأعلى)
local function buildBounce(top, cx, cz)
	local pad = mk("BouncePad", V(5, 0.6, 5), V(cx, top + 0.3, cz), BOUNCE, Enum.Material.Neon, fHaz, true)
	pad.CanTouch = true
	mkCyl("BounceRing", 0.4, 6, top + 0.55, cx, cz, BOUNCE, Enum.Material.Neon, fHaz, false)
	table.insert(bouncePads, pad)
end

-- نقطة حفظ مرقّمة: قرص أخضر متوهّج + لافتة بالرقم
local function buildCheckpoint(i, top, cx, cz, numeral)
	local disc = mkCyl("CPDisc", 0.3, 9.5, top + 0.16, cx, cz, CPGLOW, Enum.Material.Neon, fCP, false)
	disc.CanTouch = true
	disc.Transparency = 0.25
	table.insert(cpPads, disc)
	local back = platCenter(i) - FWD * 3.5
	local signCF = CFrame.lookAt(V(back.X, top + 3.2, back.Z), V(back.X, top + 3.2, back.Z) - FWD)
	local sign = mk("CPNum", V(2.6, 2.6, 0.3), signCF, SIGNBG, Enum.Material.SmoothPlastic, fCP, false)
	signGui(sign, numeral, CPGLOW)
end

-- بناء المنصّات وكل ما عليها
for i = 0, COUNT - 1 do
	local c = platCenter(i)
	local top = platTop(i)
	local mat = (i <= 3) and Enum.Material.Grass or Enum.Material.SmoothPlastic
	mk("Plat" .. i, V(PW, PT, PD), c, zoneColor(i), mat, fPlat, true)
	-- إطار ذهبي رفيع تحت السطح
	mk("Rim" .. i, V(PW + 0.8, 0.4, PD + 0.8), V(c.X, top - PT - 0.2, c.Z), GOLD, Enum.Material.Metal, fDecor, false)
	-- جسم الجزيرة (صخرة) + ساق سفلية لإحساس الجزر الطائرة
	mk("Rock" .. i, V(PW - 1.5, 3, PD - 1.5), V(c.X, top - PT - 1.7, c.Z), ROCK, Enum.Material.Slate, fDecor, false)
	mkCyl("Stem" .. i, 6, 4, top - PT - 5.5, c.X, c.Z, STEM, Enum.Material.Slate, fDecor, false)

	if CP_AT[i] then buildCheckpoint(i, top, c.X, c.Z, CP_AT[i]) end
	if STRIP_AT[i] then buildStrip(i, top, c.X, c.Z) end
	if SPIN_AT[i] then buildSpinner(top, c.X, c.Z, SPIN_AT[i]) end
	if BOUNCE_AT[i] then buildBounce(top, c.X, c.Z) end
end

-- أسهم ذهبية فوق كل فجوة تأشّر للمنصّة التالية
for i = 0, COUNT - 2 do
	local a, b = platCenter(i), platCenter(i + 1)
	local mid = (a + b) / 2 + V(0, 3.0 + (platTop(i + 1) - platTop(i)) / 2, 0)
	local vertex = mid + FWD * 1.6
	beam(vertex, mid - FWD * 0.2 + RIGHTV * 1.3, 0.55, GOLD, Enum.Material.Neon, fDecor)
	beam(vertex, mid - FWD * 0.2 - RIGHTV * 1.3, 0.55, GOLD, Enum.Material.Neon, fDecor)
end

-- لافتة البداية «ابدأ هنا» على المنصّة الأولى
do
	local c = platCenter(0)
	local top = platTop(0)
	local bp = c + FWD * 4.0
	local lpos = bp + RIGHTV * 3.2
	local rpos = bp - RIGHTV * 3.2
	beam(V(lpos.X, top, lpos.Z), V(lpos.X, top + 7, lpos.Z), 0.6, GOLD, Enum.Material.Metal, fDecor)
	beam(V(rpos.X, top, rpos.Z), V(rpos.X, top + 7, rpos.Z), 0.6, GOLD, Enum.Material.Metal, fDecor)
	local bannerCF = CFrame.lookAt(V(bp.X, top + 6.4, bp.Z), V(bp.X, top + 6.4, bp.Z) - FWD)
	local banner = mk("StartBanner", V(7.2, 2.2, 0.3), bannerCF, GREEN, Enum.Material.SmoothPlastic, fDecor, false)
	signGui(banner, "ابدأ هنا", C3(255, 255, 255), 720)
end

-- قوس النهاية «النهاية» على آخر منصّة + مُحفِّز الفوز
do
	local c = platCenter(COUNT - 1)
	local top = platTop(COUNT - 1)
	local lpos = c + RIGHTV * 5.0
	local rpos = c - RIGHTV * 5.0
	beam(V(lpos.X, top, lpos.Z), V(lpos.X, top + 10, lpos.Z), 0.8, GOLD, Enum.Material.Metal, fDecor)
	beam(V(rpos.X, top, rpos.Z), V(rpos.X, top + 10, rpos.Z), 0.8, GOLD, Enum.Material.Metal, fDecor)
	beam(V(lpos.X, top + 10, lpos.Z), V(rpos.X, top + 10, rpos.Z), 0.8, GOLD, Enum.Material.Metal, fDecor)
	local bannerCF = CFrame.lookAt(V(c.X, top + 8.4, c.Z), V(c.X, top + 8.4, c.Z) - FWD)
	local banner = mk("FinishBanner", V(8.0, 2.4, 0.3), bannerCF, GOLD, Enum.Material.Neon, fDecor, false)
	signGui(banner, "النهاية", SIGNBG, 720)

	finishPart = mk("ParkourFinish", V(PW, 12, PD), V(c.X, top + 6, c.Z), GOLD, Enum.Material.SmoothPlastic, course, false)
	finishPart.Transparency = 1
	finishPart.CanTouch = true
end

----------------------------------------------------------------------
-- إحداثيات النظام
----------------------------------------------------------------------
local SPAWN_POS = V(ORIGIN_X, platTop(0) + 3.5, ORIGIN_Z)
local SPAWN_CF  = CFrame.new(SPAWN_POS)
local BASE_Y    = platTop(0) + 3.5
local FINISH_Y  = platTop(COUNT - 1) + 3.5
local FALL_Y    = platTop(0) - 12
local EXIT_POS  = V(6, 5, 60)          -- خروج آمن قرب نقطة الانطلاق الرئيسية (0,_,60)
local ENTRY_POS = V(-20, 1.3, 60)      -- منصّة دخول أرضية بجانب الانطلاق الرئيسي (مرئية وسهلة الوصول)

----------------------------------------------------------------------
-- منصّة الدخول في المدينة + لافتة
----------------------------------------------------------------------
local entryPad = Instance.new("Part")
entryPad.Name = "ParkourEntry"; entryPad.Anchored = true; entryPad.CanCollide = true
entryPad.Size = V(10, 0.6, 10); entryPad.Position = ENTRY_POS
entryPad.Color = C3(255, 205, 70); entryPad.Material = Enum.Material.Neon
entryPad.Transparency = 0.15; entryPad.TopSurface = Enum.SurfaceType.Smooth
entryPad.Parent = Workspace

do
	local sign = Instance.new("Part")
	sign.Name = "ParkourEntrySign"; sign.Anchored = true; sign.CanCollide = false
	sign.Size = V(8, 3.4, 0.4); sign.Position = ENTRY_POS + V(0, 4, 0)
	sign.Color = SIGNBG; sign.Material = Enum.Material.SmoothPlastic
	sign.Parent = Workspace
	local sg = Instance.new("SurfaceGui"); sg.Face = Enum.NormalId.Front
	sg.AutoLocalize = false  -- إيقاف الترجمة التلقائية (النص العربي يظهر للجميع)
	sg.CanvasSize = Vector2.new(720, 300); sg.LightInfluence = 0; sg.Parent = sign
	local lbl = Instance.new("TextLabel"); lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
	lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
	lbl.TextColor3 = C3(255, 205, 70)
	lbl.Text = "برج الباركور\n<font size=\"30\">قف هنا للانتقال للبداية</font>"
	lbl.Parent = sg
end

----------------------------------------------------------------------
-- أدوات
----------------------------------------------------------------------
local function fmtTime(sec)
	local m = math.floor(sec / 60)
	local s = sec - m * 60
	return string.format("%d:%05.2f", m, s)
end

local function teleportTo(player, cf)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if hrp then hrp.CFrame = cf end
end

local function playerFromHit(hit)
	local char = hit and hit.Parent
	if not char then return nil end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then return nil end
	return Players:GetPlayerFromCharacter(char)
end

----------------------------------------------------------------------
-- حالة الجولة لكل لاعب
----------------------------------------------------------------------
local runState = {}   -- [userId] = { inRun, startT, cpCF, cpY, best, loop }
local updateActiveLoop    -- forward declaration
local finishRun           -- forward declaration

local function progressPercent(player)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if not hrp then return 0 end
	local pct = (hrp.Position.Y - BASE_Y) / math.max(FINISH_Y - BASE_Y, 1) * 100
	return math.clamp(math.floor(pct), 0, 100)
end

local function sendProgress(player, state)
	local st = runState[player.UserId]
	local elapsed = (st and st.inRun) and (os.clock() - st.startT) or 0
	local pct = (st and st.inRun) and progressPercent(player) or 0
	progressRemote:FireClient(player, {
		state   = state or ((st and st.inRun) and "run" or "idle"),
		stage   = math.clamp(math.floor(pct / 25) + 1, 1, 4),
		cp      = math.clamp(math.floor(pct / 25) + 1, 1, 4),
		total   = 4,
		percent = pct,
		time    = elapsed,
	})
end

local function stopProgressLoop(st)
	if st and st.loop then
		pcall(task.cancel, st.loop)
		st.loop = nil
	end
end

local function startRun(player)
	local st = runState[player.UserId]
	if st and st.inRun then return end
	st = { inRun = true, startT = os.clock(), cpCF = SPAWN_CF, cpY = BASE_Y, best = st and st.best, bestLoaded = st and st.bestLoaded }
	runState[player.UserId] = st
	teleportTo(player, SPAWN_CF)
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "بدأ الباركور! اطلع لأعلى ووصل للقمة.") end
	sendProgress(player, "run")
	st.loop = task.spawn(function()
		while runState[player.UserId] == st and st.inRun do
			sendProgress(player, "run")
			task.wait(0.6)
		end
	end)
	if updateActiveLoop then updateActiveLoop() end
end

local function stopRun(player)
	local st = runState[player.UserId]
	if st then st.inRun = false; stopProgressLoop(st) end
	teleportTo(player, CFrame.new(EXIT_POS))
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "أوقفت الباركور وخرجت من المسار.") end
	progressRemote:FireClient(player, { state = "idle" })
	if updateActiveLoop then updateActiveLoop() end
end

-- مكافحة إغراق الـRemotes: حدّ نداءات لكل لاعب (token-bucket بسيط)
local _rl = {}
local RL_REFILL, RL_BURST = 15, 25
local function rlAllow(userId: number): boolean
	local now = os.clock()
	local b = _rl[userId]
	if not b then b = { t = RL_BURST, at = now }; _rl[userId] = b end
	b.t = math.min(RL_BURST, b.t + (now - b.at) * RL_REFILL)
	b.at = now
	if b.t < 1 then return false end
	b.t -= 1
	return true
end

stopRemote.OnServerEvent:Connect(function(player)
	if not rlAllow(player.UserId) then return end
	stopRun(player)
end)

----------------------------------------------------------------------
-- منصّة الدخول: تبدأ الجولة وتنقل للقاعدة
----------------------------------------------------------------------
local entryCooldown = {}
entryPad.Touched:Connect(function(hit)
	local player = playerFromHit(hit)
	if not player then return end
	if entryCooldown[player.UserId] then return end
	entryCooldown[player.UserId] = true
	startRun(player)
	task.delay(2, function() entryCooldown[player.UserId] = nil end)
end)

----------------------------------------------------------------------
-- نقاط الحفظ المرقّمة: تثبّت نقطة الرجوع + تحتسب مهمة parkour_cp
----------------------------------------------------------------------
for _, pad in ipairs(cpPads) do
	local topY = pad.Position.Y
	pad.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		st.cpHit = st.cpHit or {}
		if not st.cpHit[pad] then
			st.cpHit[pad] = true
			if _G.ReportMission then _G.ReportMission(player, "parkour_cp", 1) end
		end
		if topY > st.cpY + 1.5 then
			st.cpY = topY
			st.cpCF = CFrame.new(pad.Position.X, topY + 3.5, pad.Position.Z)
		end
	end)
end

----------------------------------------------------------------------
-- الحواجز القاتلة (بلاطات + أعمدة دوّارة): ترجع لآخر نقطة حفظ
----------------------------------------------------------------------
local killCooldown = {}
local function respawnAtCheckpoint(player)
	local st = runState[player.UserId]
	if not st or not st.inRun then return end
	if killCooldown[player.UserId] then return end
	killCooldown[player.UserId] = true
	teleportTo(player, st.cpCF or SPAWN_CF)
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "رجعناك لآخر نقطة حفظ.") end
	task.delay(0.6, function() killCooldown[player.UserId] = nil end)
end

for _, kp in ipairs(killParts) do
	kp.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if player then respawnAtCheckpoint(player) end
	end)
end

----------------------------------------------------------------------
-- منصّات القفز النطّاطة: دفعة لأعلى (متعة، غير قاتلة)
----------------------------------------------------------------------
local BOUNCE_V = 62
local bounceCooldown = {}
for _, pad in ipairs(bouncePads) do
	pad.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		if bounceCooldown[player.UserId] then return end
		bounceCooldown[player.UserId] = true
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp then
			local v = hrp.AssemblyLinearVelocity
			hrp.AssemblyLinearVelocity = Vector3.new(v.X, BOUNCE_V, v.Z)
		end
		task.delay(0.4, function() bounceCooldown[player.UserId] = nil end)
	end)
end

----------------------------------------------------------------------
-- الفوز: كوينز + إنجاز + مهمة + تهنئة + أفضل وقت + خروج
----------------------------------------------------------------------
local REWARD = 250
local finishCooldown = {}
finishRun = function(player)
	local st = runState[player.UserId]
	if not st or not st.inRun then return end
	if finishCooldown[player.UserId] then return end
	finishCooldown[player.UserId] = true

	st.inRun = false
	stopProgressLoop(st)
	if updateActiveLoop then updateActiveLoop() end
	local elapsed = os.clock() - st.startT

	-- أفضل وقت شخصي
	local isRecord = false
	if not st.best or elapsed < st.best then
		st.best = elapsed; isRecord = true
		-- لا نكتب رقماً قياسياً فوق المخزّن إن فشلت قراءته (قد يكون الحقيقي أسرع)
		if bestStore and st.bestLoaded ~= false then
			pcall(function() bestStore:SetAsync(tostring(player.UserId), math.floor(elapsed * 100)) end)
		end
	end

	if _G.AddCoins then _G.AddCoins(player, REWARD) end
	if _G.AwardAchievement then
		_G.AwardAchievement(player, "parkour_first")
		_G.AwardAchievement(player, "parkour_done")
	end
	if _G.AwardBadge then _G.AwardBadge(player, "PARKOUR") end
	if _G.ReportMission then _G.ReportMission(player, "parkour_done", 1) end
	if _G.NotifyPlayer then
		_G.NotifyPlayer(player, string.format(
			"أكملت الباركور! الوقت %s%s — مكافأة %d كوينز + لقب «بطل الباركور»",
			fmtTime(elapsed), isRecord and " (رقم قياسي جديد!)" or "", REWARD))
	end

	progressRemote:FireClient(player, { state = "finish", time = elapsed, reward = REWARD, percent = 100, total = 4, best = st.best, record = isRecord })
	task.delay(2, function()
		teleportTo(player, CFrame.new(EXIT_POS))
		finishCooldown[player.UserId] = nil
	end)
end

if finishPart then
	finishPart.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if player then finishRun(player) end
	end)
end

----------------------------------------------------------------------
-- حلقة واحدة (تعمل أثناء جولة نشِطة فقط): سقوط + تدوير العوائق
-- تتوقّف تماماً عند الخمول → صفر استهلاك.
----------------------------------------------------------------------
local activeConn
updateActiveLoop = function()
	local anyActive = false
	for _, st in pairs(runState) do
		if st.inRun then anyActive = true; break end
	end
	if anyActive and not activeConn then
		activeConn = RunService.Heartbeat:Connect(function(dt)
			-- تدوير العوائق
			for _, sp in ipairs(spinners) do
				sp.angle = (sp.angle + sp.speed * dt) % (math.pi * 2)
				sp.bar.CFrame = CFrame.new(sp.center) * CFrame.Angles(0, sp.angle, 0)
			end
			-- مراقبة السقوط أسفل المسار
			for _, player in ipairs(Players:GetPlayers()) do
				local st = runState[player.UserId]
				if st and st.inRun then
					local char = player.Character
					local hrp = char and char:FindFirstChild("HumanoidRootPart")
					if hrp and hrp.Position.Y < FALL_Y then
						respawnAtCheckpoint(player)
					end
				end
			end
		end)
	elseif not anyActive and activeConn then
		activeConn:Disconnect(); activeConn = nil
	end
end

----------------------------------------------------------------------
-- تنظيف عند خروج اللاعب + إعادة فحص الحلقة
----------------------------------------------------------------------
Players.PlayerRemoving:Connect(function(player)
	local st = runState[player.UserId]
	stopProgressLoop(st)
	runState[player.UserId] = nil
	entryCooldown[player.UserId] = nil
	killCooldown[player.UserId] = nil
	bounceCooldown[player.UserId] = nil
	finishCooldown[player.UserId] = nil
	_rl[player.UserId] = nil
	updateActiveLoop()
end)

Players.PlayerAdded:Connect(function(player)
	-- استرجاع أفضل وقت محفوظ (اختياري)
	if bestStore then
		runState[player.UserId] = runState[player.UserId] or {}
		runState[player.UserId].bestLoaded = false
		task.spawn(function()
			local ok, v
			for attempt = 1, 4 do
				ok, v = pcall(function() return bestStore:GetAsync(tostring(player.UserId)) end)
				if ok then break end
				if attempt < 4 then task.wait(0.5 * attempt) end
			end
			local rs = runState[player.UserId]
			if not rs then return end
			if ok then
				if type(v) == "number" then rs.best = v / 100 end
				rs.bestLoaded = true
			else
				rs.bestLoaded = false
			end
		end)
	end
	-- الموت داخل المسار = استئناف من آخر نقطة حفظ (لا طرد للمدينة)
	player.CharacterAdded:Connect(function(char)
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		local hrp = char:WaitForChild("HumanoidRootPart", 5)
		if hrp then
			task.wait()
			hrp.CFrame = st.cpCF or SPAWN_CF
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "رجعناك لآخر نقطة حفظ.") end
		end
	end)
end)
