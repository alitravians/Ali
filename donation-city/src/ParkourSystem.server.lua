--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام الباركور — PARKOUR SYSTEM (Server)                              ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  نظام باركور جديد كامل، مبني بالكامل بقطع روبلوكس أصلية (Part/Cylinder) ║
║  داخل هذا السكربت — صفر Union/Mesh = صفر مكعّبات. سهل/عائلي، طابع أسطح   ║
║  المدينة، مسار خطّي صاعد بهدوء يفهمه أي لاعب فوراً:                       ║
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
local HAZARD = C3(222, 36, 36)
local BOUNCE = C3(64, 240, 208)
local CPGLOW = C3(120, 240, 150)
local SIGNBG = C3(22, 28, 44)
local POSTC  = C3(64, 64, 74)
-- ألوان نمط «أسطح المدينة»
local CONCRETE  = C3(166, 166, 172)   -- سطح المبنى (السطح الذي يُمشى عليه)
local BLDG      = C3(78, 82, 96)        -- جسم المبنى تحت السطح
local WINDOW    = C3(255, 209, 120)     -- نوافذ مضيئة
local METAL     = C3(182, 186, 192)     -- خزّانات/مكيّفات
local DARKMETAL = C3(82, 86, 92)        -- أرجل/مراوح/هوائيات
local NEONSIGN  = C3(255, 92, 132)      -- لمبة الهوائي
local SILH      = C3(60, 56, 82)        -- ظلال ناطحات سحاب بعيدة (أفق المدينة)
local SILWIN    = C3(255, 196, 120)     -- نوافذ النواطح البعيدة (خافتة)

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

-- كرة صغيرة (للمبة الهوائي)
local function mkBall(name, dia, x, y, z, color, material, parent)
	local p = mk(name, V(dia, dia, dia), V(x, y, z), color, material, parent, false)
	p.Shape = Enum.PartType.Ball
	p.CanTouch = false
	return p
end

-- خرائط زينة الأسطح (مكيّفات/خزّانات ماء/هوائيات)
local AC_AT     = { [1] = true, [4] = true, [9] = true, [11] = true }
local TANK_AT   = { [2] = true, [7] = true }
local ANT_AT    = { [3] = true, [10] = true }

-- منصّة على شكل سطح مبنى: سطح خرساني يُمشى عليه + حافة سور ملوّنة بلون المنطقة
-- + جسم مبنى تحته بصفوف نوافذ مضيئة على الواجهات الأربع.
local function buildRooftop(i, c, top)
	local cx, cz = c.X, c.Z
	-- السطح الخرساني (السطح الذي يقف عليه اللاعب)
	mk("Plat" .. i, V(PW, PT, PD), c, CONCRETE, Enum.Material.Concrete, fPlat, true)
	-- حافة سور رفيعة ملوّنة بلون المنطقة حول حواف السطح (زينة فقط، لا تعيق القفز)
	local zc = zoneColor(i)
	local lh = 0.8                       -- ارتفاع الحافة
	local ly = top + lh / 2              -- مركزها فوق السطح مباشرة
	for _, sz in ipairs({ -1, 1 }) do    -- حافتا الأمام/الخلف (على محور X)
		local edge = mk("Ledge" .. i, V(PW + 0.6, lh, 0.6),
			V(cx, ly, cz + sz * (PD / 2)), zc, Enum.Material.SmoothPlastic, fDecor, false)
		edge.CanTouch = false
	end
	for _, sx in ipairs({ -1, 1 }) do    -- حافتا اليمين/اليسار (على محور Z)
		local edge = mk("Ledge" .. i, V(0.6, lh, PD + 0.6),
			V(cx + sx * (PW / 2), ly, cz), zc, Enum.Material.SmoothPlastic, fDecor, false)
		edge.CanTouch = false
	end
	-- جسم المبنى تحت السطح
	local bh, iw, idp = 9, PW - 0.8, PD - 0.8
	mk("Bldg" .. i, V(iw, bh, idp), V(cx, top - PT - bh / 2, cz), BLDG, Enum.Material.Concrete, fDecor, false)
	-- صفوف النوافذ المضيئة (٣ صفوف × ٤ واجهات)
	for r = 0, 2 do
		local yy = top - PT - 1.5 - r * 2.6
		for _, sz in ipairs({ -1, 1 }) do
			local win = mk("Win" .. i, V(iw * 0.66, 0.85, 0.15),
				V(cx, yy, cz + sz * (idp / 2 + 0.05)), WINDOW, Enum.Material.Neon, fDecor, false)
			win.CanTouch = false
		end
		for _, sx in ipairs({ -1, 1 }) do
			local win = mk("Win" .. i, V(0.15, 0.85, idp * 0.66),
				V(cx + sx * (iw / 2 + 0.05), yy, cz), WINDOW, Enum.Material.Neon, fDecor, false)
			win.CanTouch = false
		end
	end
end

-- زينة فوق السطح: مكيّف هواء، خزّان ماء على أرجل، أو هوائي (لا تعيق اللعب)
local function buildRoofDecor(i, top, cx, cz)
	if AC_AT[i] then
		local ax, az = cx - PW * 0.26, cz - PD * 0.24
		mk("AC", V(2.4, 1.4, 1.8), V(ax, top + 0.7, az), METAL, Enum.Material.Metal, fDecor, false).CanTouch = false
		mkCyl("Fan", 0.2, 1.0, top + 1.5, ax, az, DARKMETAL, Enum.Material.Metal, fDecor, false).CanTouch = false
	end
	if TANK_AT[i] then
		local tx, tz = cx + PW * 0.22, cz + PD * 0.2
		for _, sx in ipairs({ -1, 1 }) do
			for _, sz in ipairs({ -1, 1 }) do
				mk("Leg", V(0.3, 2.4, 0.3), V(tx + sx * 0.8, top + 1.2, tz + sz * 0.8),
					DARKMETAL, Enum.Material.Metal, fDecor, false).CanTouch = false
			end
		end
		mkCyl("Tank", 3.0, 2.6, top + 3.6, tx, tz, METAL, Enum.Material.Metal, fDecor, false).CanTouch = false
		mkCyl("TankLid", 0.4, 2.8, top + 5.2, tx, tz, DARKMETAL, Enum.Material.Metal, fDecor, false).CanTouch = false
	end
	if ANT_AT[i] then
		local mx = cx + PW * 0.28
		mkCyl("Mast", 6.0, 0.22, top + 3.0, mx, cz, DARKMETAL, Enum.Material.Metal, fDecor, false).CanTouch = false
		mkBall("AntBulb", 0.7, mx, top + 6.1, cz, NEONSIGN, Enum.Material.Neon, fDecor)
	end
end

-- بناء المنصّات (أسطح مدينة) وكل ما عليها
for i = 0, COUNT - 1 do
	local c = platCenter(i)
	local top = platTop(i)
	buildRooftop(i, c, top)
	buildRoofDecor(i, top, c.X, c.Z)

	if CP_AT[i] then buildCheckpoint(i, top, c.X, c.Z, CP_AT[i]) end
	if STRIP_AT[i] then buildStrip(i, top, c.X, c.Z) end
	if SPIN_AT[i] then buildSpinner(top, c.X, c.Z, SPIN_AT[i]) end
	if BOUNCE_AT[i] then buildBounce(top, c.X, c.Z) end
end

-- أفق المدينة: ناطحات سحاب بعيدة تحيط بالمسار وتعطي إحساس الارتفاع (زينة فقط)
local function buildSkyline()
	for k = 0, 6 do
		local t = k / 6
		local baseX = ORIGIN_X - 12 + t * (STEP_X * (COUNT - 1) + 24)
		local baseZ = ORIGIN_Z + t * (STEP_Z * (COUNT - 1))
		for _, side in ipairs({ -1, 1 }) do
			local off = RIGHTV * (70 * side)
			local bw = 9 + (k % 3) * 3
			local bht = 60 + ((k * 17 + (side + 1) * 23) % 55)
			local bx, bz = baseX + off.X, baseZ + off.Z
			local roofY = 55 + ((k * 13 + (side + 1) * 11) % 50)
			mk("Sil", V(bw, bht, bw), V(bx, roofY - bht / 2, bz), SILH, Enum.Material.Concrete, fDecor, false).CanTouch = false
			-- شريطا نوافذ خافتان على واجهة المبنى
			for r = 0, 1 do
				local wy = roofY - 8 - r * 14
				local face = mk("SilWin", V(bw * 0.7, 1.2, 0.2),
					V(bx, wy, bz - side * (bw / 2 + 0.1)), SILWIN, Enum.Material.Neon, fDecor, false)
				face.CanTouch = false
				face.Transparency = 0.15
			end
		end
	end
end
buildSkyline()

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

----------------------------------------------------------------------
-- ضابط شرطة البحرين عند بداية المسار (قطع أصلية، ثابت، يستقبل اللاعبين)
-- الزيّ التكتيكي المعتمد: قميص كحلي #0D1B33 + سترة واقية (Plate Carrier) بجِعَب
-- MOLLE + جراب إداري، شعار شرطة البحرين الدائري كبيراً على السترة وكلا الكُمّين
-- وشارة البريه، رقعة «شرطة البحرين / POLICE»، ٣ نجوم رتبة فضّية لامعة على مقدّمة
-- كل عضد، لانيارد أبيض، بريه كحلي مائل، حزام مهام + جراب + جِعَب، بنطلون كارجو
-- + بوت عسكري. مبني بالكامل من Part/Cylinder/Ball (صفر Union/Mesh). كل القطع
-- Anchored وبلا تصادم/لمس → صفر فيزياء وصفر استهلاك. يواجه اللاعب القادم.
-- مرجع الهندسة: /home/ubuntu/tools/officer_render.py (نسخة tac المعتمدة ١:١).
----------------------------------------------------------------------
do
	-- ألوان زيّ شرطة البحرين (من الصورة المرجعية المعتمدة، sRGB 0..255)
	local oNAVY   = C3(13, 27, 51)     -- كحلي الزيّ #0D1B33
	local oNAVY2  = C3(28, 35, 64)     -- كحلي أفتح #1C2340 (تفاصيل/كتافيات/جيوب)
	local oBLACK  = C3(16, 16, 19)     -- بوت/حزام/جِعَب/جراب
	local oBLACK2 = C3(28, 28, 33)     -- سترة تكتيكية/أربطة/أحزمة نسيجية
	local oSKIN   = C3(214, 164, 124)  -- بشرة
	local oGOLD   = C3(212, 168, 78)   -- أزرار/حلقة الشعار/التاج/الإطارات
	local oSILVER = C3(176, 183, 195)  -- مشبك الحزام
	local oSTAR   = C3(222, 228, 238)  -- نجوم الرتبة الفضّية اللامعة
	local oWHITE  = C3(230, 230, 230)  -- قمة الشعار/الرقعة/اللانيارد/بياض العين
	local oRED    = C3(200, 16, 46)    -- درع الشعار #C8102E
	local oEYE    = C3(24, 24, 32)     -- بؤبؤ/خط الفم
	local oBROW   = C3(46, 30, 18)     -- حاجب
	local oHAIR   = C3(22, 16, 14)     -- شعر
	local oLIP    = C3(150, 104, 99)   -- شفة
	local oIRIS   = C3(70, 44, 24)     -- قزحية

	-- موضع الضابط: على منصّة البداية، جانب نقطة الانطلاق، يواجه اللاعب
	local top0 = platTop(0)
	local c0 = platCenter(0)
	local footPos = V(c0.X, top0, c0.Z) + RIGHTV * 4.2
	-- base.LookVector = RIGHTV ⇒ «أمام» الضابط = -RIGHTV (نحو نقطة الانطلاق)
	local base = CFrame.lookAt(footPos, footPos + RIGHTV)

	local officer = Instance.new("Model")
	officer.Name = "PoliceOfficer"
	officer.Parent = fDecor

	-- تحويل إحداثيات بلندر (X يمين، Y أمام-/خلف+، Z أعلى) → إطار الضابط المحلي:
	--   الموضع: (bx, bz, -by)   ·   الحجم: (sx, sz, sy)   (دوران صلب، غير معكوس)
	local function lp(bx, by, bz) return V(bx, bz, -by) end
	local function lsz(sx, sy, sz) return V(sx, sz, sy) end

	-- صندوق بإطار الضابط (rcf = دوران محلي اختياري معاد تعبيره من بلندر)
	local function obox(bx, by, bz, sx, sy, sz, color, material, rcf)
		local cf = base * CFrame.new(lp(bx, by, bz)) * (rcf or CFrame.new())
		local p = mk("OPart", lsz(sx, sy, sz), cf, color, material or Enum.Material.SmoothPlastic, officer, false)
		p.CanTouch = false
		return p
	end

	-- أسطوانة بإطار الضابط؛ caxis = محور بلندر ('Z' عمودي، 'Y' أمام/خلف، 'X' جانبي)
	local function ocyl(bx, by, bz, r, h, color, material, caxis, rcf)
		local axisCF
		if caxis == "Y" then axisCF = CFrame.Angles(0, math.rad(90), 0)
		elseif caxis == "X" then axisCF = CFrame.new()
		else axisCF = CFrame.Angles(0, 0, math.rad(90)) end   -- 'Z' (افتراضي)
		local p = Instance.new("Part")
		p.Name = "OCyl"; p.Anchored = true; p.CanCollide = false; p.CanTouch = false
		p.Shape = Enum.PartType.Cylinder
		p.Size = V(h, r * 2, r * 2)
		p.Color = color
		p.Material = material or Enum.Material.SmoothPlastic
		p.CFrame = base * CFrame.new(lp(bx, by, bz)) * (rcf or CFrame.new()) * axisCF
		p.Parent = officer
		return p
	end

	-- إطار وضع العناصر على وجه أمامي/جانبي (FRONT/LEFT/RIGHT) للشارات والرقع
	local function faceFrame(face, cx, cy, cz)
		local function P(u, v, d)
			if face == "FRONT" then return cx + u, cy - d, cz + v
			elseif face == "LEFT" then return cx - d, cy + u, cz + v
			else return cx + d, cy + u, cz + v end
		end
		local function Dm(du, dv, dthin)
			if face == "FRONT" then return du, dthin, dv else return dthin, du, dv end
		end
		local axis = (face == "FRONT") and "Y" or "X"
		return P, Dm, axis
	end

	-- شعار شرطة البحرين الدائري: حلقة ذهبية + درع أحمر متوّج + قمة بيضاء مسنّنة + إكليل
	local function ocrest(cx, cy, cz, sc, face)
		local P, Dm, axis = faceFrame(face, cx, cy, cz)
		local x, y, z, a, b, c
		x, y, z = P(0, 0, 0.0);           ocyl(x, y, z, 0.33 * sc, 0.05, oGOLD, Enum.Material.Metal, axis)
		x, y, z = P(0, 0, 0.03);          ocyl(x, y, z, 0.27 * sc, 0.07, oWHITE, Enum.Material.SmoothPlastic, axis)
		x, y, z = P(0, -0.02 * sc, 0.06); a, b, c = Dm(0.30 * sc, 0.40 * sc, 0.08); obox(x, y, z, a, b, c, oRED)
		x, y, z = P(0, 0.15 * sc, 0.065); a, b, c = Dm(0.30 * sc, 0.10 * sc, 0.09); obox(x, y, z, a, b, c, oWHITE)
		for n = 0, 3 do
			x, y, z = P(-0.105 * sc + n * 0.07 * sc, 0.15 * sc, 0.06); a, b, c = Dm(0.05 * sc, 0.07 * sc, 0.10)
			obox(x, y, z, a, b, c, oRED)
		end
		x, y, z = P(0, 0.30 * sc, 0.05);  a, b, c = Dm(0.24 * sc, 0.10 * sc, 0.07); obox(x, y, z, a, b, c, oGOLD, Enum.Material.Metal)
		for _, s2 in ipairs({ -1, 1 }) do
			x, y, z = P(s2 * 0.26 * sc, -0.01 * sc, 0.04); a, b, c = Dm(0.06 * sc, 0.30 * sc, 0.06)
			obox(x, y, z, a, b, c, oGOLD, Enum.Material.Metal, CFrame.Angles(0, math.rad(s2 * 10), 0))
		end
	end

	-- رقعة «شرطة البحرين / POLICE»: خلفية داكنة + سطرا نص فاتح
	local function opatch(cx, cy, cz, face)
		local P, Dm = faceFrame(face, cx, cy, cz)
		local x, y, z, a, b, c
		x, y, z = P(0, 0, 0.0);      a, b, c = Dm(0.70, 0.32, 0.05); obox(x, y, z, a, b, c, oBLACK2)
		x, y, z = P(0, 0.075, 0.02); a, b, c = Dm(0.54, 0.05, 0.06); obox(x, y, z, a, b, c, oWHITE)
		x, y, z = P(0, -0.06, 0.02); a, b, c = Dm(0.46, 0.06, 0.06); obox(x, y, z, a, b, c, oWHITE)
	end

	-- نجمة رتبة فضّية لامعة تواجه الأمام (قرص + شعاعان + معيّن)
	local function orankStar(bx, by, bz, r)
		ocyl(bx, by, bz, r * 0.62, 0.07, oSTAR, Enum.Material.SmoothPlastic, "Y")
		obox(bx, by, bz, r * 2.0, 0.07, r * 0.34, oSTAR)
		obox(bx, by, bz, r * 0.34, 0.07, r * 2.0, oSTAR)
		obox(bx, by, bz, r * 1.4, 0.07, r * 1.4, oSTAR, nil, CFrame.Angles(0, 0, math.rad(-45)))
	end

	-- ═══ الأرجل: بنطلون كارجو كحلي بجيوب جانبية + بوت عسكري أسود برباط ═══
	for _, sx in ipairs({ -1, 1 }) do
		local x = sx * 0.46
		obox(x, 0, 1.72, 0.88, 1.02, 1.55, oNAVY)                    -- فخذ
		obox(x, 0.04, 0.92, 0.82, 0.98, 1.45, oNAVY)                 -- ساق
		obox(x, -0.50, 1.30, 0.84, 0.10, 0.30, oNAVY2)               -- ركبة
		obox(x + sx * 0.46, -0.02, 1.55, 0.12, 0.46, 0.62, oNAVY2)   -- جيب كارجو جانبي
		obox(x, 0.0, 0.58, 0.86, 0.92, 0.96, oBLACK)                 -- ساق البوت
		obox(x, -0.22, 0.22, 0.86, 1.30, 0.44, oBLACK)               -- مقدّمة البوت
		for k = 0, 3 do
			obox(x, -0.45, 0.36 + k * 0.18, 0.52, 0.05, 0.05, oBLACK2) -- رباط
		end
	end
	obox(0, 0, 2.56, 1.74, 1.02, 0.72, oNAVY)                        -- الحوض

	-- ═══ الجذع (قميص كحلي) + باكِت أزرار + جيوب صدر + ياقة ═══
	obox(0, 0, 3.55, 2.06, 1.08, 2.06, oNAVY)
	obox(0, -0.55, 3.55, 0.16, 0.06, 1.92, oNAVY2)                   -- باكِت أمامي
	for k = 0, 3 do
		ocyl(0, -0.59, 4.15 - k * 0.5, 0.065, 0.05, oGOLD, Enum.Material.Metal, "Y") -- أزرار
	end
	for _, sx in ipairs({ -1, 1 }) do
		obox(sx * 0.52, -0.55, 3.50, 0.62, 0.06, 0.46, oNAVY2)       -- جيب صدر
		obox(sx * 0.52, -0.57, 3.74, 0.66, 0.06, 0.16, oNAVY2)       -- غطاء الجيب
		ocyl(sx * 0.52, -0.6, 3.66, 0.04, 0.05, oGOLD, Enum.Material.Metal, "Y") -- زر الجيب
		obox(sx * 0.34, -0.40, 4.50, 0.55, 0.30, 0.18, oNAVY2, nil, CFrame.Angles(0, math.rad(sx * 18), 0)) -- ياقة
	end

	-- ═══ الأذرع (أكمام طويلة) + شعار البحرين الدائري على كلا الكُمّين ═══
	for _, sx in ipairs({ -1, 1 }) do
		local x = sx * 1.5
		obox(x, 0.0, 4.0, 0.76, 0.92, 1.25, oNAVY)                   -- عضد
		obox(x, 0.06, 2.92, 0.72, 0.88, 1.15, oNAVY)                 -- ساعد
		obox(x, 0.06, 2.40, 0.78, 0.92, 0.18, oNAVY2)                -- سوار
		obox(x, 0.08, 2.08, 0.68, 0.84, 0.5, oSKIN)                  -- يد
	end
	ocrest(-1.90, -0.05, 4.08, 0.74, "LEFT")
	ocrest(1.90, -0.05, 4.08, 0.74, "RIGHT")

	-- ═══ الكتفان: كتافيتان + ٣ نجوم رتبة على مقدّمة كل عضد + لانيارد أبيض ═══
	for _, sx in ipairs({ -1, 1 }) do
		obox(sx * 0.62, -0.04, 4.55, 0.62, 0.86, 0.07, oGOLD, Enum.Material.Metal) -- إطار الكتافية
		obox(sx * 0.62, -0.04, 4.60, 0.50, 0.74, 0.12, oNAVY2)                     -- الكتافية
	end
	for _, sx in ipairs({ -1, 1 }) do
		obox(sx * 1.5, -0.47, 4.18, 0.42, 0.06, 1.00, oNAVY2)                      -- لوح الرتبة
		obox(sx * 1.5, -0.46, 3.66, 0.50, 0.05, 0.07, oGOLD, Enum.Material.Metal)  -- شريط ذهبي
		for n = 0, 2 do
			orankStar(sx * 1.5, -0.53, 3.92 + n * 0.30, 0.135)
		end
	end
	obox(0.92, -0.50, 4.05, 0.10, 0.10, 0.95, oWHITE, nil, CFrame.Angles(0, math.rad(8), 0) * CFrame.Angles(math.rad(20), 0, 0)) -- لانيارد
	obox(0.78, -0.55, 3.62, 0.10, 0.55, 0.10, oWHITE)
	ocyl(0.62, -0.6, 3.66, 0.07, 0.18, oWHITE, Enum.Material.SmoothPlastic, "Y")

	-- ═══ الحزام + المشبك + الجراب + الجِعَب ═══
	obox(0, 0, 2.58, 2.14, 1.14, 0.3, oBLACK)
	obox(0, -0.6, 2.58, 0.34, 0.07, 0.24, oSILVER, Enum.Material.Metal)
	obox(1.02, -0.18, 2.18, 0.34, 0.46, 0.78, oBLACK)                -- جراب المسدّس
	obox(1.02, -0.30, 2.70, 0.18, 0.22, 0.34, oBLACK2, nil, CFrame.Angles(math.rad(12), 0, 0)) -- مقبض
	obox(-0.95, -0.30, 2.40, 0.30, 0.34, 0.42, oBLACK)              -- جِعبة
	obox(-1.02, 0.20, 2.42, 0.30, 0.34, 0.40, oBLACK)              -- جِعبة خلفية

	-- ═══ الرقبة + الرأس + الوجه ═══
	obox(0, 0.02, 4.95, 0.64, 0.62, 0.5, oSKIN)                     -- رقبة
	local cranium = obox(0, 0.02, 5.48, 1.40, 1.34, 1.04, oSKIN)    -- جمجمة
	obox(0, -0.03, 4.96, 1.16, 1.24, 0.70, oSKIN)                  -- فكّ/ذقن
	for _, sx in ipairs({ -1, 1 }) do
		obox(sx * 0.72, 0.04, 5.36, 0.12, 0.34, 0.46, oSKIN)        -- أذن
	end
	obox(0, 0.07, 5.74, 1.46, 1.40, 0.6, oHAIR)                    -- شعر علوي
	obox(0, 0.62, 5.40, 1.30, 0.30, 0.9, oHAIR)                    -- شعر خلفي
	for _, sx in ipairs({ -1, 1 }) do
		obox(sx * 0.71, -0.20, 5.18, 0.10, 0.34, 0.5, oHAIR)        -- سالف
	end
	for _, sx in ipairs({ -1, 1 }) do
		obox(sx * 0.31, -0.62, 5.47, 0.30, 0.08, 0.18, oWHITE)                              -- بياض العين
		ocyl(sx * 0.31, -0.67, 5.47, 0.085, 0.05, oIRIS, Enum.Material.SmoothPlastic, "Y")  -- قزحية
		ocyl(sx * 0.31, -0.70, 5.47, 0.035, 0.05, oEYE, Enum.Material.SmoothPlastic, "Y")   -- بؤبؤ
		obox(sx * 0.31, -0.65, 5.585, 0.34, 0.12, 0.07, oSKIN)                              -- جفن
		obox(sx * 0.32, -0.70, 5.64, 0.36, 0.06, 0.085, oBROW, nil, CFrame.Angles(0, 0, math.rad(sx * 9))) -- حاجب
	end
	obox(0, -0.78, 5.42, 0.18, 0.18, 0.44, oSKIN)                  -- جسر الأنف
	obox(0, -0.85, 5.18, 0.26, 0.22, 0.20, oSKIN)                  -- طرف الأنف
	for _, sx in ipairs({ -1, 1 }) do
		obox(sx * 0.11, -0.82, 5.09, 0.05, 0.10, 0.06, oBROW)       -- منخار
	end
	obox(0, -0.65, 5.01, 0.32, 0.09, 0.045, oLIP)                  -- شفة عليا
	obox(0, -0.65, 4.945, 0.30, 0.09, 0.055, oLIP)                 -- شفة سفلى
	obox(0, -0.69, 4.98, 0.30, 0.04, 0.015, oEYE)                  -- خطّ الفم

	-- ═══ البريه الكحلي المائل (رباط + قبّة قرصية مائلة + طيّة منسدلة + زرّ) + شارة شعار أمامية ═══
	-- قطع روبلوكس الكرة (Ball) تُرسَم دائماً ككرة منتظمة بأصغر بُعد؛ فالقبّة مبنية من أقراص
	-- أسطوانية مائلة (caxis="Z") لإنتاج شكل البريه المنسدل الصحيح بصرياً.
	local beretTilt = CFrame.Angles(0, 0, math.rad(14)) * CFrame.Angles(math.rad(8), 0, 0)
	local beretFlop = CFrame.Angles(0, 0, math.rad(24)) * CFrame.Angles(math.rad(12), 0, 0)
	ocyl(0.05, 0.05, 5.93, 0.74, 0.26, oBLACK, Enum.Material.Fabric, "Z")              -- رباط الرأس
	ocyl(0.16, 0.06, 6.06, 0.98, 0.34, oNAVY, Enum.Material.Fabric, "Z", beretTilt)   -- قبّة البريه (قرص عريض مائل)
	ocyl(0.64, 0.08, 6.02, 0.56, 0.20, oNAVY, Enum.Material.Fabric, "Z", beretFlop)   -- طيّة منسدلة جانبية
	ocyl(0.16, 0.06, 6.30, 0.13, 0.12, oNAVY, Enum.Material.Fabric, "Z", beretTilt)   -- زرّ علوي
	ocrest(-0.34, -0.66, 5.99, 0.5, "FRONT")                                          -- شارة الكاب

	-- ═══ السترة التكتيكية (Plate Carrier) + جِعَب MOLLE + شارات أمامية واضحة ═══
	obox(0, -0.02, 3.55, 2.26, 1.28, 1.92, oBLACK2, Enum.Material.Fabric)            -- جسم السترة
	for _, sx in ipairs({ -1, 1 }) do
		obox(sx * 0.5, -0.18, 4.5, 0.46, 0.66, 0.14, oBLACK)        -- حمّالة كتف
		obox(sx * 1.06, 0.05, 3.2, 0.16, 1.1, 0.7, oBLACK)          -- حزام جانبي (cummerbund)
	end
	for k = 0, 2 do
		obox(-0.5 + k * 0.5, -0.66, 3.55, 0.40, 0.18, 0.62, oBLACK) -- جِعبة ذخيرة
		for r = 0, 1 do
			obox(-0.5 + k * 0.5, -0.74, 3.45 + r * 0.3, 0.42, 0.05, 0.05, oBLACK2) -- شريط
		end
	end
	obox(0.45, -0.7, 4.12, 0.72, 0.16, 0.5, oBLACK)                 -- جراب إداري علوي
	opatch(-0.42, -0.70, 4.18, "FRONT")                             -- رقعة شرطة البحرين / POLICE
	ocrest(0.52, -0.70, 4.12, 0.58, "FRONT")                        -- شعار البحرين الكبير على السترة

	-- لافتة تعريف فوق الرأس (نص عربي، بلا إيموجي)
	local tag = Instance.new("BillboardGui")
	tag.Name = "NameTag"
	tag.Adornee = cranium
	tag.Size = UDim2.new(0, 220, 0, 64)
	tag.StudsOffsetWorldSpace = V(0, 2.6, 0)
	tag.AlwaysOnTop = true
	tag.MaxDistance = 90
	tag.Parent = cranium
	local tagLbl = Instance.new("TextLabel")
	tagLbl.BackgroundTransparency = 1
	tagLbl.Size = UDim2.fromScale(1, 1)
	tagLbl.Font = Enum.Font.GothamBlack
	tagLbl.TextScaled = true
	tagLbl.RichText = true
	tagLbl.AutoLocalize = false
	tagLbl.TextColor3 = GOLD
	tagLbl.TextStrokeTransparency = 0.4
	tagLbl.Text = "ضابط شرطة\n<font size=\"16\" color=\"#FFFFFF\">بالتوفيق في الباركور</font>"
	tagLbl.Parent = tag
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
-- بوّابة دخول الباركور 3D (قطع أصلية): قاعدة إطلاق دائرية + حلقة ضوء
-- خضراء دوّارة + قوس بعمودين ولافتة «برج الباركور» + عمود ضوء يطلع
-- للسماء + فقاعة «اضغط E للبدء». البدء بالضغط (ProximityPrompt) مع عدّ
-- تنازلي ٣·٢·١ بدل البدء التلقائي باللمس (يمنع الانطلاق بالغلط). كل
-- القطع Anchored؛ الحلقة تدور فقط عند اقتراب لاعب → صفر استهلاك عند الخمول.
----------------------------------------------------------------------
local GREENZ = C3(60, 190, 110)         -- أخضر منطقة البداية
local CONCR  = C3(120, 126, 138)        -- خرسانة القوس

local gate = Instance.new("Model"); gate.Name = "ParkourGate"; gate.Parent = Workspace

-- قاعدة الإطلاق الدائرية (يقف عليها اللاعب)
local entryPad = Instance.new("Part")
entryPad.Name = "ParkourEntry"; entryPad.Anchored = true; entryPad.CanCollide = true
entryPad.Shape = Enum.PartType.Cylinder
entryPad.Size = V(0.8, 10, 10)
entryPad.CFrame = CFrame.new(ENTRY_POS) * CFrame.Angles(0, 0, math.rad(90))
entryPad.Color = C3(46, 54, 70); entryPad.Material = Enum.Material.Metal
entryPad.TopSurface = Enum.SurfaceType.Smooth; entryPad.Parent = gate

local padTopY = ENTRY_POS.Y + 0.4

-- حلقة ضوء خضراء (قرص نيون فوق القاعدة) + قرص داخلي غامق
local ring = mkCyl("GateRing", 0.25, 9.0, padTopY + 0.18, ENTRY_POS.X, ENTRY_POS.Z, CPGLOW, Enum.Material.Neon, gate, false)
ring.Transparency = 0.45; ring.CanTouch = false
local ringIn = mkCyl("GateRingInner", 0.3, 6.0, padTopY + 0.16, ENTRY_POS.X, ENTRY_POS.Z, C3(20, 30, 40), Enum.Material.SmoothPlastic, gate, false)
ringIn.Transparency = 0.2; ringIn.CanTouch = false

-- أذرع ضوء دوّارة (٣ أذرع تلتفّ حول المركز)
local gateBars = {}
for i = 1, 3 do
	local bar = mk("GateSweep", V(8.6, 0.22, 0.7), CFrame.new(ENTRY_POS + V(0, 0.6, 0)), CPGLOW, Enum.Material.Neon, gate, false)
	bar.CanTouch = false; bar.Transparency = 0.1
	gateBars[i] = bar
end

-- قوس بعمودين + عارضة علوية
for _, sz in ipairs({ -1, 1 }) do
	mk("GatePillar", V(1.2, 9.0, 1.2), CFrame.new(ENTRY_POS + V(0, 4.5, sz * 4.2)), CONCR, Enum.Material.Concrete, gate, true)
	mk("GatePillarBase", V(1.8, 0.7, 1.8), CFrame.new(ENTRY_POS + V(0, 0.65, sz * 4.2)), GREENZ, Enum.Material.Neon, gate, false)
end
mk("GateBeamTop", V(1.2, 1.2, 10.0), CFrame.new(ENTRY_POS + V(0, 9.2, 0)), CONCR, Enum.Material.Concrete, gate, false)

-- لافتة «برج الباركور» على العارضة (تواجه ±X، تُقرأ من الجهتين)
do
	local sign = mk("GateSign", V(8.6, 2.6, 0.3), CFrame.new(ENTRY_POS + V(0, 9.2, 0)) * CFrame.Angles(0, math.rad(90), 0), SIGNBG, Enum.Material.SmoothPlastic, gate, false)
	sign.CanTouch = false
	signGui(sign, "برج الباركور\nاضغط E للبدء", GOLD, 720)
end

-- عمود ضوء يطلع للسماء (قلب البوّابة) + هالة
do
	local beamCore = mkCyl("GateSkyBeam", 44, 1.6, padTopY + 22, ENTRY_POS.X, ENTRY_POS.Z, CPGLOW, Enum.Material.Neon, gate, false)
	beamCore.Transparency = 0.55; beamCore.CanTouch = false
	local beamHalo = mkCyl("GateSkyHalo", 40, 3.4, padTopY + 20, ENTRY_POS.X, ENTRY_POS.Z, CPGLOW, Enum.Material.Neon, gate, false)
	beamHalo.Transparency = 0.85; beamHalo.CanTouch = false
end

-- فقاعة العدّ التنازلي فوق القوس (تظهر فقط أثناء العدّ)
local gateCountLbl, gateCountBB
do
	local anchor = mk("GateCountAnchor", V(0.4, 0.4, 0.4), CFrame.new(ENTRY_POS + V(0, 12.4, 0)), CPGLOW, Enum.Material.SmoothPlastic, gate, false)
	anchor.Transparency = 1; anchor.CanTouch = false
	gateCountBB = Instance.new("BillboardGui")
	gateCountBB.Name = "GateCountdown"; gateCountBB.Adornee = anchor
	gateCountBB.Size = UDim2.new(0, 200, 0, 200)
	gateCountBB.AlwaysOnTop = true; gateCountBB.MaxDistance = 140
	gateCountBB.Enabled = false; gateCountBB.Parent = anchor
	gateCountLbl = Instance.new("TextLabel")
	gateCountLbl.BackgroundTransparency = 1; gateCountLbl.Size = UDim2.fromScale(1, 1)
	gateCountLbl.Font = Enum.Font.GothamBlack; gateCountLbl.TextScaled = true
	gateCountLbl.TextColor3 = GOLD; gateCountLbl.TextStrokeTransparency = 0.3
	gateCountLbl.Text = ""; gateCountLbl.Parent = gateCountBB
end

-- فقاعة «اضغط E للبدء» على القاعدة (ProximityPrompt)
local promptPart = mk("GatePromptPart", V(0.6, 0.6, 0.6), CFrame.new(ENTRY_POS + V(0, 1.8, 0)), CPGLOW, Enum.Material.SmoothPlastic, gate, false)
promptPart.Transparency = 1; promptPart.CanTouch = false
local gatePrompt = Instance.new("ProximityPrompt")
gatePrompt.Name = "StartParkour"
gatePrompt.ActionText = "ابدأ"
gatePrompt.ObjectText = "برج الباركور"
gatePrompt.KeyboardKeyCode = Enum.KeyCode.E
gatePrompt.GamepadKeyCode = Enum.KeyCode.ButtonX
gatePrompt.HoldDuration = 0
gatePrompt.RequiresLineOfSight = false
gatePrompt.MaxActivationDistance = 14
gatePrompt.Parent = promptPart

-- دوران الأذرع: فقط عند اقتراب لاعب (صفر استهلاك عند الخمول)
task.spawn(function()
	local theta = 0
	while true do
		local near = false
		for _, pl in ipairs(Players:GetPlayers()) do
			local hrp = pl.Character and pl.Character:FindFirstChild("HumanoidRootPart")
			if hrp and (hrp.Position - ENTRY_POS).Magnitude < 80 then near = true; break end
		end
		if near then
			local dt = RunService.Heartbeat:Wait()
			theta = (theta + 1.7 * dt) % (math.pi * 2)
			for i, bar in ipairs(gateBars) do
				bar.CFrame = CFrame.new(ENTRY_POS + V(0, 0.6, 0)) * CFrame.Angles(0, theta + (i - 1) * (math.pi * 2 / 3), 0)
			end
		else
			task.wait(0.5)
		end
	end
end)

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
-- بوّابة الدخول: الضغط E → عدّ تنازلي ٣·٢·١ → بدء الجولة والنقل للقاعدة
-- (بدل البدء التلقائي باللمس؛ يمنع الانطلاق بالغلط عند المرور فوق القاعدة)
----------------------------------------------------------------------
local gateCountingDown = false
local function setGateNumber(txt, col)
	if gateCountLbl then
		gateCountLbl.Text = txt or ""
		gateCountLbl.TextColor3 = col or GOLD
	end
	if gateCountBB then gateCountBB.Enabled = (txt ~= nil and txt ~= "") end
end

gatePrompt.Triggered:Connect(function(player)
	if not player or not rlAllow(player.UserId) then return end
	local st = runState[player.UserId]
	if st and st.inRun then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "أنت داخل المسار بالفعل.") end
		return
	end
	if gateCountingDown then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "في انطلاقة جارية… انتظر لحظة.") end
		return
	end
	gateCountingDown = true
	gatePrompt.Enabled = false
	task.spawn(function()
		for _, n in ipairs({ "٣", "٢", "١" }) do
			setGateNumber(n, GOLD)
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "الانطلاق بعد " .. n .. "…") end
			task.wait(1)
		end
		setGateNumber("انطلق!", CPGLOW)
		local cur = runState[player.UserId]
		if player.Parent and not (cur and cur.inRun) then
			startRun(player)
		end
		task.wait(0.7)
		setGateNumber("", nil)
		gatePrompt.Enabled = true
		gateCountingDown = false
	end)
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
