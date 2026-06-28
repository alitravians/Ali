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
local Debris            = game:GetService("Debris")
local ContentProvider   = game:GetService("ContentProvider")
local SoundService      = game:GetService("SoundService")

-- معرّف صوت المسح الضوئي «scanner-sound-effect» (Audio، مملوك لحساب اللعبة، معتمَد رقابياً)
local SCAN_SOUND_ID = "rbxassetid://76270469261531"

-- تحميل مسبق للصوت عند بدء السيرفر كي يكون طوله (TimeLength) معروفاً فور أول دخول،
-- فتُزامَن حركة المسح معه بدقّة دون أي انتظار محسوس
task.spawn(function()
	local pre = Instance.new("Sound")
	pre.SoundId = SCAN_SOUND_ID
	pre.Parent = SoundService -- مولد فعلي لضمان تخزين موثوق أثناء التحميل المسبق
	pcall(function() ContentProvider:PreloadAsync({ pre }) end)
	pre:Destroy()
end)

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
-- ساحة باركور معزولة في ركن فاضٍ بعيد عن وسط الماب (المسار لولب مدمج حول برج مركزي)
local CX, CZ = -150, -150              -- مركز الساحة المعزولة (الركن الجنوبي الغربي الفاضي)
local TOP0   = 86                      -- ارتفاع سطح أول منصّة (عالياً في السماء)
local RISE   = 3.3                     -- صعود لطيف ثابت بين كل منصّة (قفزة سهلة)
local PW, PD, PT = 11, 11, 1.2          -- عرض/عمق/سمك المنصّة الاعتيادية
local NARROW_W   = 3.8                  -- عرض الجسر الرفيع (مرحلة الدقّة)
local COUNT  = 28                       -- عدد المنصّات (0..27) موزّعة على ٥ مراحل
local SPIRAL_R = 24                     -- نصف قطر اللولب (بصمة مدمجة ~٦٤ وحدة)
local ANG0     = 0                      -- زاوية بداية اللولب
local ANG_STEP = math.rad(33)           -- زاوية بين كل منصّتين (وتر ~١٣.٦ وحدة، قفزة عادلة)
local COIN_VALUE = 20                   -- قيمة العملة الواحدة

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
local LASER  = C3(255, 70, 96)          -- بوّابة ليزر كانسة (قاتلة)
local COINC  = C3(255, 206, 84)         -- عملة ذهبية
-- ألوان نمط «أسطح المدينة» + الساحة
local CONCRETE  = C3(166, 166, 172)
local BLDG      = C3(78, 82, 96)
local WINDOW    = C3(255, 209, 120)
local METAL     = C3(182, 186, 192)
local DARKMETAL = C3(82, 86, 92)
local NEONSIGN  = C3(255, 92, 132)
local COREC     = C3(60, 66, 88)        -- جسم برج اللولب المركزي
local BASEC     = C3(46, 50, 68)        -- قاعدة الساحة المعزولة

-- ٥ مراحل صعوبة متدرّجة: ١ إحماء · ٢ توقيت · ٣ مراوغة · ٤ دقّة · ٥ القمّة (لكلٍّ لونها)
local STAGE_COLOR = { GREEN, TEAL, ORANGE, RED, GOLD }
local function stageIndex(i)
	if i <= 5 then return 1
	elseif i <= 11 then return 2
	elseif i <= 17 then return 3
	elseif i <= 23 then return 4
	else return 5 end
end
local STAGE_OF = {}
for i = 0, COUNT - 1 do STAGE_OF[i] = stageIndex(i) end
local function zoneColor(i) return STAGE_COLOR[STAGE_OF[i]] end

-- خرائط العناصر (حسب رقم المنصّة) — منحنى صعوبة متوسّط عادل
local CP_AT      = { [0] = "١", [6] = "٢", [12] = "٣", [15] = "٤", [18] = "٥", [21] = "٦", [24] = "٧" }  -- نقاط حفظ
local STRIP_AT   = { [4] = true, [26] = true }                   -- بلاطات حمراء قاتلة
local BOUNCE_AT  = { [5] = true }                                -- منصّات قفز نطّاطة
local FADE_AT    = { [7] = true, [8] = true, [9] = true }        -- بلاطات تتلاشى تحت القدم
local SWEEP_AT   = { [10] = true, [22] = true }                  -- بوّابات ليزر كانسة (قاتلة)
local SPIN_AT    = { [13] = 1.2, [16] = 1.4, [25] = 1.6 }        -- عوائق دوّارة (rad/s)
local PEND_AT    = { [14] = true, [17] = true, [26] = true }     -- كرات بندوليّة متأرجحة (تدفع)
local NARROW_AT  = { [19] = true, [20] = true }                  -- جسور رفيعة
local TILEROW_AT = { [23] = true }                               -- بلاطات قاتلة على الجانبين
local COIN_AT    = { [2] = true, [5] = true, [8] = true, [11] = true, [14] = true, [17] = true, [20] = true, [23] = true, [24] = true }

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
local killParts  = {}   -- بلاطات/أشرطة قاتلة + أعمدة دوّارة + ليزر كانس
local bouncePads = {}   -- منصّات القفز
local spinners   = {}   -- {bar, center, angle, speed}
local sweepers   = {}   -- {bar, base, axis, amp, speed, phase} — بوّابات ليزر كانسة
local pendulums  = {}   -- {ball, rope, pivot, len, axis, amp, speed, phase}
local fadeTiles  = {}   -- بلاطات تتلاشى تحت القدم
local coins      = {}   -- {part, center, spin, value}
local finishPart

local function platTop(i) return TOP0 + i * RISE end
local function platCenter(i)
	local ang = ANG0 + i * ANG_STEP
	return V(CX + math.cos(ang) * SPIRAL_R, platTop(i) - PT / 2, CZ + math.sin(ang) * SPIRAL_R)
end
-- اتجاه التقدّم الأفقي عند المنصّة i (مماس اللولب نحو المنصّة التالية)
local function fwdAt(i)
	local a = platCenter(i)
	local b = platCenter(math.min(i + 1, COUNT - 1))
	local d = V(b.X - a.X, 0, b.Z - a.Z)
	if d.Magnitude < 0.05 then
		local a2 = platCenter(math.max(i - 1, 0))
		d = V(a.X - a2.X, 0, a.Z - a2.Z)
	end
	if d.Magnitude < 0.05 then return V(0, 0, 1) end
	return d.Unit
end
local function rightAt(i)
	local f = fwdAt(i)
	return V(f.Z, 0, -f.X)
end

-- بلاطة قاتلة على سطح المنصّة (لمسها = رجوع)؛ مزاحة لجهة لتترك ممرّاً آمناً
local function buildStrip(i, cx, cz, top, fwd, rgt)
	local side = (i % 2 == 0) and 1 or -1
	local ox, oz = cx + rgt.X * (2.2 * side), cz + rgt.Z * (2.2 * side)
	local strip = mk("KillStrip", V(7.0, 0.4, 3.4),
		CFrame.lookAt(V(ox, top + 0.25, oz), V(ox + fwd.X, top + 0.25, oz + fwd.Z)),
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
local function buildCheckpoint(_i, cx, cz, top, numeral, fwd)
	local disc = mkCyl("CPDisc", 0.3, 6.5, top + 0.16, cx, cz, CPGLOW, Enum.Material.Neon, fCP, false)
	disc.CanTouch = true
	disc.Transparency = 0.25
	table.insert(cpPads, { part = disc, fwd = fwd })
	local bx, bz = cx - fwd.X * 3.5, cz - fwd.Z * 3.5
	local signCF = CFrame.lookAt(V(bx, top + 3.2, bz), V(bx - fwd.X, top + 3.2, bz - fwd.Z))
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

-- خرائط زينة الأسطح (مكيّفات/خزّانات ماء/هوائيات) — على منصّات نظيفة فقط
local AC_AT   = { [1] = true }
local TANK_AT = { [3] = true }
local ANT_AT  = { [11] = true }

-- منصّة على شكل سطح مبنى (مبنية في الإطار المحلّي للمماس): سطح يُمشى عليه + حافة
-- ملوّنة بلون المرحلة + (اختيارياً) جسم مبنى بنوافذ مضيئة تحته.
local function buildRooftop(i, cf, _top, width, depth, withBody)
	mk("Plat" .. i, V(width, PT, depth), cf, CONCRETE, Enum.Material.Concrete, fPlat, true)
	local zc = zoneColor(i)
	local lh = 0.8
	for _, sz in ipairs({ -1, 1 }) do
		local e = mk("Ledge" .. i, V(width + 0.6, lh, 0.6),
			cf * CFrame.new(0, PT / 2 + lh / 2, sz * (depth / 2)), zc, Enum.Material.SmoothPlastic, fDecor, false)
		e.CanTouch = false
	end
	for _, sx in ipairs({ -1, 1 }) do
		local e = mk("Ledge" .. i, V(0.6, lh, depth + 0.6),
			cf * CFrame.new(sx * (width / 2), PT / 2 + lh / 2, 0), zc, Enum.Material.SmoothPlastic, fDecor, false)
		e.CanTouch = false
	end
	if withBody then
		local bh, iw, idp = 9, width - 0.8, depth - 0.8
		mk("Bldg" .. i, V(iw, bh, idp), cf * CFrame.new(0, -PT / 2 - bh / 2, 0), BLDG, Enum.Material.Concrete, fDecor, false)
		for r = 0, 2 do
			local yy = -PT / 2 - 1.5 - r * 2.6
			for _, sz in ipairs({ -1, 1 }) do
				mk("Win" .. i, V(iw * 0.66, 0.85, 0.15),
					cf * CFrame.new(0, yy, sz * (idp / 2 + 0.05)), WINDOW, Enum.Material.Neon, fDecor, false).CanTouch = false
			end
			for _, sx in ipairs({ -1, 1 }) do
				mk("Win" .. i, V(0.15, 0.85, idp * 0.66),
					cf * CFrame.new(sx * (iw / 2 + 0.05), yy, 0), WINDOW, Enum.Material.Neon, fDecor, false).CanTouch = false
			end
		end
	end
end

-- زينة فوق السطح: مكيّف هواء، خزّان ماء على أرجل، أو هوائي (لا تعيق اللعب)
local function buildRoofDecor(i, cf, top)
	if AC_AT[i] then
		local p = cf * CFrame.new(-PW * 0.26, PT / 2 + 0.7, -PD * 0.24)
		mk("AC", V(2.4, 1.4, 1.8), p, METAL, Enum.Material.Metal, fDecor, false).CanTouch = false
		mkCyl("Fan", 0.2, 1.0, p.Y + 0.8, p.X, p.Z, DARKMETAL, Enum.Material.Metal, fDecor, false).CanTouch = false
	end
	if TANK_AT[i] then
		local b = cf * CFrame.new(PW * 0.22, 0, PD * 0.2)
		for _, sx in ipairs({ -1, 1 }) do
			for _, sz in ipairs({ -1, 1 }) do
				mk("Leg", V(0.3, 2.4, 0.3), V(b.X + sx * 0.8, top + 1.2, b.Z + sz * 0.8),
					DARKMETAL, Enum.Material.Metal, fDecor, false).CanTouch = false
			end
		end
		mkCyl("Tank", 3.0, 2.6, top + 3.6, b.X, b.Z, METAL, Enum.Material.Metal, fDecor, false).CanTouch = false
		mkCyl("TankLid", 0.4, 2.8, top + 5.2, b.X, b.Z, DARKMETAL, Enum.Material.Metal, fDecor, false).CanTouch = false
	end
	if ANT_AT[i] then
		local m = cf * CFrame.new(PW * 0.28, 0, 0)
		mkCyl("Mast", 6.0, 0.22, top + 3.0, m.X, m.Z, DARKMETAL, Enum.Material.Metal, fDecor, false).CanTouch = false
		local ab = mkBall("AntBulb", 0.45, m.X, top + 6.1, m.Z, NEONSIGN, Enum.Material.Neon, fDecor)
		ab.Transparency = 0.2
	end
end

-- أسطوانة بمحور عمودي (قرص/تاج)
local function vDisc(name, dia, thick, x, y, z, color, material, parent)
	local p = Instance.new("Part")
	p.Name = name; p.Anchored = true; p.CanCollide = false; p.CanTouch = false
	p.Shape = Enum.PartType.Cylinder
	p.Size = V(thick, dia, dia)
	p.CFrame = CFrame.new(x, y, z) * CFrame.Angles(0, 0, math.rad(90))
	p.Color = color; p.Material = material or Enum.Material.SmoothPlastic
	p.Parent = parent
	return p
end

-- عملة ذهبية دوّارة فوق المنصّة (تُجمع باللمس)
local function buildCoin(cx, cz, top)
	local coin = Instance.new("Part")
	coin.Name = "Coin"; coin.Anchored = true; coin.CanCollide = false
	coin.Shape = Enum.PartType.Cylinder
	coin.Size = V(0.35, 2.6, 2.6)
	local center = V(cx, top + 3.4, cz)
	coin.CFrame = CFrame.new(center)
	coin.Color = COINC; coin.Material = Enum.Material.Neon
	coin.CanTouch = true
	coin.Parent = fDecor
	table.insert(coins, { part = coin, center = center, spin = 0, value = COIN_VALUE })
end

-- بلاطة تتلاشى: يقف عليها اللاعب ثم تختفي بعد لحظة ثم تعود (مرحلة التوقيت)
local function buildFadeTile(i, cf, _top)
	local tile = mk("FadeTile" .. i, V(PW * 0.86, PT, PD * 0.86), cf, TEAL, Enum.Material.Neon, fPlat, true)
	tile.Transparency = 0.05
	local ring = mk("FadeRing" .. i, V(PW * 0.98, 0.3, PD * 0.98),
		cf * CFrame.new(0, -PT, 0), zoneColor(i), Enum.Material.Neon, fDecor, false)
	ring.CanTouch = false; ring.Transparency = 0.45
	table.insert(fadeTiles, tile)
end

-- بوّابة ليزر كانسة: قضيب أحمر يتحرّك جانبياً عبر المنصّة (لمسه = رجوع)
local function buildSweep(i, cx, cz, top, _fwd, rgt)
	for _, s in ipairs({ -1, 1 }) do
		local px, pz = cx + rgt.X * (PW / 2 + 0.4) * s, cz + rgt.Z * (PW / 2 + 0.4) * s
		mk("LaserPost", V(0.6, 5.6, 0.6), V(px, top + 2.9, pz), POSTC, Enum.Material.Metal, fHaz, false).CanTouch = false
	end
	local base = V(cx, top + 2.9, cz)
	local bar = mk("LaserBar", V(0.5, 5.0, 0.5), CFrame.new(base), LASER, Enum.Material.Neon, fHaz, false)
	bar.CanTouch = true
	table.insert(killParts, bar)
	table.insert(sweepers, { bar = bar, base = base, axis = rgt, amp = PW / 2 - 0.4, speed = 1.9 + (i % 3) * 0.3, phase = (i % 2) * math.pi })
end

-- كرة بندوليّة متأرجحة: تتأرجح عرضيّاً عبر عرض الممرّ (يميناً/يساراً) وتدفع اللاعب (غير قاتلة)
local function buildPendulum(i, cx, cz, top, fwd, rgt)
	local pivotY = top + 9.5
	local pivot = V(cx, pivotY, cz)
	mk("PendBeam", V(0.6, 0.6, 8.4),
		CFrame.lookAt(V(cx, pivotY + 0.3, cz), V(cx + rgt.X, pivotY + 0.3, cz + rgt.Z)),
		POSTC, Enum.Material.Metal, fDecor, false).CanTouch = false
	for _, s in ipairs({ -1, 1 }) do
		local px, pz = cx + rgt.X * (3.8 * s), cz + rgt.Z * (3.8 * s)
		beam(V(px, top, pz), V(px, pivotY + 0.3, pz), 0.5, POSTC, Enum.Material.Metal, fDecor)
	end
	local len = 6.0
	local ballPos = V(cx, pivotY - len, cz)
	local rope = mk("PendRope", V(0.22, 0.22, len), CFrame.lookAt((pivot + ballPos) / 2, ballPos),
		DARKMETAL, Enum.Material.Metal, fDecor, false)
	rope.CanTouch = false
	local ball = mk("PendBall", V(2.6, 2.6, 2.6), ballPos, ORANGE, Enum.Material.Neon, fHaz, true)
	ball.Shape = Enum.PartType.Ball
	ball.CanTouch = true
	table.insert(pendulums, { ball = ball, rope = rope, pivot = pivot, len = len,
		axis = fwd, amp = math.rad(48), speed = 1.5 + (i % 2) * 0.35, phase = (i % 2) * 1.2 })
end

-- بلاطات قاتلة على جانبي المنصّة (ممرّ أوسط آمن) — دقّة الخطو
local function buildTileRow(_i, cf, _top)
	for _, a in ipairs({ -1, 1 }) do
		for b = -1, 1 do
			local t = mk("KillTile", V(2.6, 0.5, 2.6),
				cf * CFrame.new(a * 3.0, PT / 2 + 0.25, b * 3.0), HAZARD, Enum.Material.Neon, fHaz, false)
			t.CanTouch = true
			table.insert(killParts, t)
		end
	end
end

-- ساحة الباركور المعزولة: قاعدة عريضة + برج لولب مركزي مضيء + أعمدة إنارة
local function buildArena()
	local baseY = platTop(0) - 6
	local topY  = platTop(COUNT - 1) + 4
	vDisc("ArenaBase", (SPIRAL_R + 16) * 2, 3.0, CX, baseY, CZ, BASEC, Enum.Material.Slate, fDecor)
	vDisc("ArenaRim", (SPIRAL_R + 17) * 2, 0.6, CX, baseY + 1.7, CZ, GOLD, Enum.Material.Neon, fDecor)
	local coreH = topY - baseY
	local core = Instance.new("Part")
	core.Name = "ArenaCore"; core.Anchored = true; core.CanCollide = false; core.CanTouch = false
	core.Shape = Enum.PartType.Cylinder
	core.Size = V(coreH, 9, 9)
	core.CFrame = CFrame.new(CX, baseY + coreH / 2, CZ) * CFrame.Angles(0, 0, math.rad(90))
	core.Color = COREC; core.Material = Enum.Material.Concrete; core.Parent = fDecor
	local stageStart = { 0, 6, 12, 18, 24 }
	for s = 1, 5 do
		vDisc("CoreRing" .. s, 10.4, 0.6, CX, platTop(stageStart[s]) - 1, CZ, STAGE_COLOR[s], Enum.Material.Neon, fDecor)
	end
	vDisc("CoreCrown", 7.5, 4.0, CX, topY + 2, CZ, GOLD, Enum.Material.Metal, fDecor)
	local beamUp = mk("ArenaBeam", V(1.0, 44, 1.0), V(CX, topY + 24, CZ), GOLD, Enum.Material.Neon, fDecor, false)
	beamUp.CanTouch = false; beamUp.Transparency = 0.55
	for k = 0, 5 do
		local a = math.rad(k * 60)
		local lx, lz = CX + math.cos(a) * (SPIRAL_R + 13), CZ + math.sin(a) * (SPIRAL_R + 13)
		beam(V(lx, baseY + 1.7, lz), V(lx, baseY + 11, lz), 0.5, POSTC, Enum.Material.Metal, fDecor)
		local lb = mkBall("LampBulb", 0.7, lx, baseY + 11.4, lz, STAGE_COLOR[(k % 5) + 1], Enum.Material.Neon, fDecor)
		lb.Transparency = 0.3
	end
end

-- بناء المنصّات (أسطح مدينة) وكل ما عليها على طول اللولب
for i = 0, COUNT - 1 do
	local c = platCenter(i)
	local top = platTop(i)
	local fwd = fwdAt(i)
	local rgt = rightAt(i)
	local cf = CFrame.lookAt(c, c + fwd)

	if FADE_AT[i] then
		buildFadeTile(i, cf, top)
	else
		local width = NARROW_AT[i] and NARROW_W or PW
		local depth = NARROW_AT[i] and (PD + 3) or PD
		buildRooftop(i, cf, top, width, depth, not NARROW_AT[i])
		if not NARROW_AT[i] then buildRoofDecor(i, cf, top) end
	end

	if CP_AT[i] then buildCheckpoint(i, c.X, c.Z, top, CP_AT[i], fwd) end
	if STRIP_AT[i] then buildStrip(i, c.X, c.Z, top, fwd, rgt) end
	if SPIN_AT[i] then buildSpinner(top, c.X, c.Z, SPIN_AT[i]) end
	if BOUNCE_AT[i] then buildBounce(top, c.X, c.Z) end
	if SWEEP_AT[i] then buildSweep(i, c.X, c.Z, top, fwd, rgt) end
	if PEND_AT[i] then buildPendulum(i, c.X, c.Z, top, fwd, rgt) end
	if TILEROW_AT[i] then buildTileRow(i, cf, top) end
	if COIN_AT[i] then buildCoin(c.X, c.Z, top) end
end

-- ساحة الباركور المعزولة (بديلة عن ناطحات السحاب المبعثرة التي كانت تزحم وسط الماب)
buildArena()

-- أسهم ذهبية فوق كل فجوة تأشّر للمنصّة التالية
for i = 0, COUNT - 2 do
	local a, b = platCenter(i), platCenter(i + 1)
	local fwd = fwdAt(i)
	local rgt = rightAt(i)
	local mid = (a + b) / 2 + V(0, 3.0 + (platTop(i + 1) - platTop(i)) / 2, 0)
	local vertex = mid + fwd * 1.6
	beam(vertex, mid - fwd * 0.2 + rgt * 1.3, 0.45, GOLD, Enum.Material.Metal, fDecor)
	beam(vertex, mid - fwd * 0.2 - rgt * 1.3, 0.45, GOLD, Enum.Material.Metal, fDecor)
end

-- لافتة البداية «ابدأ هنا» على المنصّة الأولى
do
	local c = platCenter(0)
	local top = platTop(0)
	local fwd = fwdAt(0)
	local rgt = rightAt(0)
	local bp = c + fwd * 4.0
	local lpos = bp + rgt * 3.2
	local rpos = bp - rgt * 3.2
	beam(V(lpos.X, top, lpos.Z), V(lpos.X, top + 7, lpos.Z), 0.6, GOLD, Enum.Material.Metal, fDecor)
	beam(V(rpos.X, top, rpos.Z), V(rpos.X, top + 7, rpos.Z), 0.6, GOLD, Enum.Material.Metal, fDecor)
	local bannerCF = CFrame.lookAt(V(bp.X, top + 6.4, bp.Z), V(bp.X - fwd.X, top + 6.4, bp.Z - fwd.Z))
	local banner = mk("StartBanner", V(7.2, 2.2, 0.3), bannerCF, GREEN, Enum.Material.SmoothPlastic, fDecor, false)
	signGui(banner, "ابدأ هنا", C3(255, 255, 255), 720)
end

----------------------------------------------------------------------
-- ضابط شرطة البحرين عند بداية المسار (قطع أصلية، ثابت، يستقبل اللاعبين)
-- الزيّ التكتيكي المعتمد: قميص كحلي #0D1B33 + سترة واقية (Plate Carrier) بجِعَب
-- MOLLE + جراب إداري، شعار شرطة البحرين الدائري كبيراً على السترة وكلا الكُمّين
-- وشارة البريه، رقعة «شرطة البحرين / POLICE»، ٣ نجوم رتبة فضّية لامعة على مقدّمة
-- كل عضد، لانيارد أبيض، بريه كحلي مائل، حزام مهام + جراب + جِعَب، بنطلون كارجو
-- + بوت عسكري. مبني بالكامل من Part/Cylinder (صفر Union/Mesh). كل القطع
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
	local rgt0 = rightAt(0)
	local footPos = V(c0.X, top0, c0.Z) + rgt0 * 4.2
	-- base.LookVector = rgt0 ⇒ «أمام» الضابط = -rgt0 (نحو نقطة الانطلاق)
	local base = CFrame.lookAt(footPos, footPos + rgt0)

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
	ocyl(0.05, 0.05, 5.90, 0.74, 0.24, oBLACK, Enum.Material.Fabric, "Z")              -- رباط الرأس
	ocyl(0.18, 0.05, 6.04, 1.04, 0.20, oNAVY, Enum.Material.Fabric, "Z", beretTilt)   -- طيّة عريضة منسدلة (overhang)
	ocyl(0.16, 0.06, 6.16, 0.82, 0.22, oNAVY, Enum.Material.Fabric, "Z", beretTilt)   -- قبّة وسطى مدوّرة
	ocyl(0.14, 0.07, 6.28, 0.48, 0.18, oNAVY, Enum.Material.Fabric, "Z", beretTilt)   -- قمّة القبّة
	ocyl(0.13, 0.07, 6.38, 0.14, 0.12, oNAVY, Enum.Material.Fabric, "Z", beretTilt)   -- زرّ علوي
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
	local fwdF = fwdAt(COUNT - 1)
	local rgtF = rightAt(COUNT - 1)
	local lpos = c + rgtF * 5.0
	local rpos = c - rgtF * 5.0
	beam(V(lpos.X, top, lpos.Z), V(lpos.X, top + 10, lpos.Z), 0.8, GOLD, Enum.Material.Metal, fDecor)
	beam(V(rpos.X, top, rpos.Z), V(rpos.X, top + 10, rpos.Z), 0.8, GOLD, Enum.Material.Metal, fDecor)
	beam(V(lpos.X, top + 10, lpos.Z), V(rpos.X, top + 10, rpos.Z), 0.8, GOLD, Enum.Material.Metal, fDecor)
	local bannerCF = CFrame.lookAt(V(c.X, top + 8.4, c.Z), V(c.X - fwdF.X, top + 8.4, c.Z - fwdF.Z))
	local banner = mk("FinishBanner", V(8.0, 2.4, 0.3), bannerCF, GOLD, Enum.Material.Metal, fDecor, false)
	signGui(banner, "النهاية", SIGNBG, 720)

	finishPart = mk("ParkourFinish", V(PW, 12, PD), V(c.X, top + 6, c.Z), GOLD, Enum.Material.SmoothPlastic, course, false)
	finishPart.Transparency = 1
	finishPart.CanTouch = true
end

----------------------------------------------------------------------
-- إحداثيات النظام
----------------------------------------------------------------------
local P0        = platCenter(0)
local SPAWN_POS = V(P0.X, platTop(0) + 3.5, P0.Z)
local SPAWN_CF  = CFrame.lookAt(SPAWN_POS, SPAWN_POS + fwdAt(0))   -- يواجه أوّل قفزة
local BASE_Y    = platTop(0) + 3.5
local FINISH_Y  = platTop(COUNT - 1) + 3.5
local FALL_Y    = platTop(0) - 12
local EXIT_POS  = V(6, 5, 60)          -- خروج آمن قرب نقطة الانطلاق الرئيسية (0,_,60)
local ENTRY_POS = V(-20, 1.3, 60)      -- منصّة دخول أرضية بجانب الانطلاق الرئيسي (مرئية وسهلة الوصول)

----------------------------------------------------------------------
-- بوّابة دخول الباركور — نصب رخامي ذهبي احترافي (قطع أصلية فقط):
--   • منصّة إطلاق دائرية مدرّجة (رخام) بحافة ذهبية + قرص «ابدأ» أخضر
--     + شيفرونات ذهبية تشير للمركز + أذرع ضوء ذهبية تدور عند الاقتراب.
--   • قوس بعمودين رخاميين بقواعد وتيجان ذهبية ونقش مضيء + عارضة علوية
--     تحمل لوحة «برج الباركور» بإطار ذهبي + شريط بألوان المراحل الخمس.
--   • منارتان جانبيتان بخمس حلقات ملوّنة (تلميح للمراحل) + لوحة «أفضل وقت».
--   • منارة محتواة تنطلق من أعلى القوس للأعلى فقط (لا تخترق البوّابة).
--   • أنيميشن دخول: عند الضغط E يتثبّت اللاعب ويمسحه قرص ضوء ينزل من
--     أعلى القوس للقاعدة، ثم يُنقل لقمة البرج. كله Anchored؛ الدوران/المسح
--     يعملان فقط عند الحاجة → صفر استهلاك عند الخمول.
----------------------------------------------------------------------
local MARBLE  = C3(228, 220, 206)       -- رخام فاتح
local MARBL2  = C3(196, 186, 170)       -- رخام أغمق (الدرجات/القواعد)
local GOLDLIT = C3(255, 214, 130)       -- ذهبي متوهّج (Neon)
local GREENZ  = C3(64, 200, 120)        -- أخضر «ابدأ»
local DARKBG  = C3(24, 30, 46)          -- خلفية اللوحة
local SCANC   = C3(120, 225, 245)       -- قرص المسح الضوئي
local SCANRIM = C3(160, 242, 255)       -- حافة المسح

local gate = Instance.new("Model"); gate.Name = "ParkourGate"; gate.Parent = Workspace

local padTopY = ENTRY_POS.Y + 0.4

-- منصّة إطلاق مدرّجة (قرصان رخاميان متناقصان تحت سطح الوقوف)
mkCyl("PadStep1", 0.8, 16.5, ENTRY_POS.Y - 0.5, ENTRY_POS.X, ENTRY_POS.Z, MARBL2, Enum.Material.Marble, gate, true).CanTouch = false
mkCyl("PadStep2", 0.8, 13.0, ENTRY_POS.Y - 0.1, ENTRY_POS.X, ENTRY_POS.Z, MARBLE, Enum.Material.Marble, gate, true).CanTouch = false

-- القرص العلوي (سطح الوقوف)
local entryPad = Instance.new("Part")
entryPad.Name = "ParkourEntry"; entryPad.Anchored = true; entryPad.CanCollide = true
entryPad.Shape = Enum.PartType.Cylinder
entryPad.Size = V(0.8, 10, 10)
entryPad.CFrame = CFrame.new(ENTRY_POS) * CFrame.Angles(0, 0, math.rad(90))
entryPad.Color = MARBLE; entryPad.Material = Enum.Material.Marble
entryPad.TopSurface = Enum.SurfaceType.Smooth; entryPad.Parent = gate

-- حافة ذهبية متوهّجة حول القرص العلوي (قرص نيون أكبر بقليل يطلّ كحلقة)
local padRim = mkCyl("PadRim", 0.3, 11.0, padTopY - 0.12, ENTRY_POS.X, ENTRY_POS.Z, GOLDLIT, Enum.Material.Neon, gate, false)
padRim.CanTouch = false

-- قرص «ابدأ» أخضر بالمركز + نص على الوجه العلوي
local goDisc = mkCyl("GoDisc", 0.22, 4.8, padTopY + 0.07, ENTRY_POS.X, ENTRY_POS.Z, GREENZ, Enum.Material.Neon, gate, false)
goDisc.CanTouch = false; goDisc.Transparency = 0.1
do
	local goText = mk("GoText", V(4.2, 0.12, 4.2), CFrame.new(ENTRY_POS.X, padTopY + 0.2, ENTRY_POS.Z), GREENZ, Enum.Material.Neon, gate, false)
	goText.Transparency = 1; goText.CanTouch = false
	local sg = Instance.new("SurfaceGui")
	sg.Face = Enum.NormalId.Top; sg.AutoLocalize = false
	sg.CanvasSize = Vector2.new(400, 400); sg.LightInfluence = 0; sg.Parent = goText
	local lbl = Instance.new("TextLabel")
	lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
	lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true
	lbl.Text = "ابدأ"; lbl.TextColor3 = C3(12, 40, 22); lbl.Parent = sg
end

-- شيفرونات ذهبية (٨) تشير نحو المركز
for k = 0, 7 do
	local a = math.rad(k * 45)
	local r = 3.7
	local px, pz = ENTRY_POS.X + math.cos(a) * r, ENTRY_POS.Z + math.sin(a) * r
	local chev = mk("PadChevron", V(1.5, 0.16, 0.45),
		CFrame.new(V(px, padTopY + 0.12, pz), V(ENTRY_POS.X, padTopY + 0.12, ENTRY_POS.Z)),
		GOLDLIT, Enum.Material.Neon, gate, false)
	chev.CanTouch = false
end

-- أذرع ضوء ذهبية دوّارة (٣) فوق القرص — تدور عند الاقتراب فقط
local gateBars = {}
for i = 1, 3 do
	local bar = mk("GateSweep", V(9.0, 0.18, 0.5), CFrame.new(ENTRY_POS + V(0, 0.55, 0)), GOLDLIT, Enum.Material.Neon, gate, false)
	bar.CanTouch = false; bar.Transparency = 0.1
	gateBars[i] = bar
end

-- قوس بعمودين رخاميين بقواعد وتيجان ذهبية ونقش مضيء
local PZ = 4.7                                   -- إزاحة العمود على المحور Z
for _, sz in ipairs({ -1, 1 }) do
	local cz = ENTRY_POS.Z + sz * PZ
	mk("GatePillar", V(1.5, 9.4, 1.5), CFrame.new(ENTRY_POS.X, ENTRY_POS.Y + 4.7, cz), MARBLE, Enum.Material.Marble, gate, true)
	mk("GatePillarBase", V(2.3, 0.9, 2.3), CFrame.new(ENTRY_POS.X, ENTRY_POS.Y + 0.45, cz), MARBL2, Enum.Material.Marble, gate, true).CanTouch = false
	mk("GatePillarBaseCap", V(2.0, 0.5, 2.0), CFrame.new(ENTRY_POS.X, ENTRY_POS.Y + 1.05, cz), GOLD, Enum.Material.Metal, gate, true).CanTouch = false
	mk("GatePillarCap", V(2.2, 0.9, 2.2), CFrame.new(ENTRY_POS.X, ENTRY_POS.Y + 9.7, cz), GOLD, Enum.Material.Metal, gate, false).CanTouch = false
	local fl = mk("GateFlute", V(0.2, 7.0, 0.4), CFrame.new(ENTRY_POS.X + 0.78, ENTRY_POS.Y + 4.9, cz), GOLDLIT, Enum.Material.Neon, gate, false)
	fl.CanTouch = false
end

-- العارضة العلوية (رخام) + شريط ذهبي سفلي
mk("GateBeamTop", V(1.8, 1.4, 11.2), CFrame.new(ENTRY_POS.X, ENTRY_POS.Y + 10.0, ENTRY_POS.Z), MARBLE, Enum.Material.Marble, gate, false).CanTouch = false
mk("GateBeamTrim", V(0.5, 0.4, 11.2), CFrame.new(ENTRY_POS.X + 0.75, ENTRY_POS.Y + 9.35, ENTRY_POS.Z), GOLDLIT, Enum.Material.Neon, gate, false).CanTouch = false

-- لافتة «برج الباركور» بإطار ذهبي (تواجه ±X، تُقرأ من الجهتين)
do
	local frameCF = CFrame.new(ENTRY_POS.X + 0.2, ENTRY_POS.Y + 9.6, ENTRY_POS.Z) * CFrame.Angles(0, math.rad(90), 0)
	mk("GateSignFrame", V(9.4, 3.4, 0.22), frameCF, GOLD, Enum.Material.Metal, gate, false).CanTouch = false
	local sign = mk("GateSign", V(8.6, 2.6, 0.32), CFrame.new(ENTRY_POS.X + 0.35, ENTRY_POS.Y + 9.6, ENTRY_POS.Z) * CFrame.Angles(0, math.rad(90), 0), DARKBG, Enum.Material.SmoothPlastic, gate, false)
	sign.CanTouch = false
	signGui(sign, "برج الباركور", GOLD, 720)
end

-- شريط ألوان المراحل الخمس تحت اللافتة (تلميح للتحدّي)
for k = 0, 4 do
	local seg = mk("GateStageSeg", V(0.3, 0.5, 1.5),
		CFrame.new(ENTRY_POS.X + 0.55, ENTRY_POS.Y + 7.9, ENTRY_POS.Z + (k - 2) * 1.7),
		STAGE_COLOR[k + 1], Enum.Material.Neon, gate, false)
	seg.CanTouch = false
end

-- منارتان جانبيتان بخمس حلقات ملوّنة + كرة ذهبية بالقمة
for _, sz in ipairs({ -1, 1 }) do
	local bx, bz = ENTRY_POS.X, ENTRY_POS.Z + sz * 9.2
	mkCyl("BeaconPost", 7.0, 1.5, ENTRY_POS.Y + 3.2, bx, bz, MARBL2, Enum.Material.Marble, gate, true).CanTouch = false
	for k = 0, 4 do
		local band = mkCyl("BeaconBand", 0.7, 2.1, ENTRY_POS.Y + 1.6 + k * 1.25, bx, bz, STAGE_COLOR[k + 1], Enum.Material.Neon, gate, false)
		band.CanTouch = false
	end
	local bt = mkBall("BeaconTop", 1.0, bx, ENTRY_POS.Y + 7.5, bz, GOLDLIT, Enum.Material.Neon, gate)
	bt.Transparency = 0.25
end

-- لوحة «أفضل وقت» ملكية بجانب البوّابة (زجاج داكن + إطار وتاج ذهبي + شريحة)
do
	local hx, hz = ENTRY_POS.X + 6.5, ENTRY_POS.Z + 7.5
	local W, H = 4.4, 2.6
	local boardCF = CFrame.new(hx, ENTRY_POS.Y + 3.6, hz) * CFrame.Angles(0, math.rad(90), 0) * CFrame.Angles(math.rad(-10), 0, 0)

	-- عمودان جانبيان يحملان اللوح (خلف الحواف حتى لا يغطّيان النص)
	local rv = boardCF.RightVector
	for _, side in ipairs({ -1, 1 }) do
		local off = side * (W / 2 - 0.3)
		local px = hx + rv.X * off
		local pz = hz + rv.Z * off
		mkCyl("HoloPost", 2.4, 0.42, ENTRY_POS.Y + 1.1, px, pz, DARKMETAL, Enum.Material.Metal, gate, true).CanTouch = false
	end

	-- لوح زجاجي داكن
	local board = mk("HoloBoard", V(W, H, 0.22), boardCF, C3(14, 18, 26), Enum.Material.Glass, gate, false)
	board.CanTouch = false; board.Reflectance = 0.15

	-- إطار ذهبي حول اللوح (إحداثيات محلية للوح)
	local fr = 0.2
	for _, d in ipairs({
		{ V(0, H / 2, 0), V(W + fr * 2, fr, 0.3) },
		{ V(0, -H / 2, 0), V(W + fr * 2, fr, 0.3) },
		{ V(-W / 2, 0, 0), V(fr, H, 0.3) },
		{ V(W / 2, 0, 0), V(fr, H, 0.3) },
	}) do
		local f = mk("HoloFrame", d[2], boardCF * CFrame.new(d[1]), GOLD, Enum.Material.Metal, gate, false)
		f.CanTouch = false
	end

	-- تاج ذهبي صغير أعلى اللوح
	for i = -2, 2 do
		local spike = 0.45 + (i == 0 and 0.4 or (math.abs(i) == 1 and 0.18 or 0))
		local s = mk("HoloCrown", V(0.3, spike, 0.3),
			boardCF * CFrame.new(i * 0.62, H / 2 + 0.18 + spike / 2, 0),
			GOLDLIT, Enum.Material.Neon, gate, false)
		s.CanTouch = false
	end

	-- واجهة احترافية (الوجهان) — عنوان متدرّج + سطر وصفي + شريحة
	for _, face in ipairs({ Enum.NormalId.Front, Enum.NormalId.Back }) do
		local sg = Instance.new("SurfaceGui")
		sg.Face = face
		sg.AutoLocalize = false
		sg.CanvasSize = Vector2.new(880, 520)
		sg.LightInfluence = 0
		sg.Parent = board

		local title = Instance.new("TextLabel")
		title.BackgroundTransparency = 1
		title.Size = UDim2.new(1, -50, 0.40, 0)
		title.Position = UDim2.new(0, 25, 0.06, 0)
		title.Font = Enum.Font.GothamBlack
		title.TextScaled = true
		title.Text = "أفضل وقت"
		title.TextColor3 = C3(255, 245, 215)
		title.Parent = sg
		local tg = Instance.new("UIGradient")
		tg.Color = ColorSequence.new(GOLDLIT, GOLD)
		tg.Rotation = 90
		tg.Parent = title
		local tstk = Instance.new("UIStroke")
		tstk.Thickness = 3
		tstk.Color = C3(60, 42, 12)
		tstk.Transparency = 0.2
		tstk.Parent = title

		-- خط فاصل ذهبي تحت العنوان
		local divider = Instance.new("Frame")
		divider.AnchorPoint = Vector2.new(0.5, 0)
		divider.Position = UDim2.new(0.5, 0, 0.45, 0)
		divider.Size = UDim2.new(0.5, 0, 0, 3)
		divider.BorderSizePixel = 0
		divider.BackgroundColor3 = GOLD
		divider.BackgroundTransparency = 0.15
		divider.Parent = sg
		local dc = Instance.new("UICorner")
		dc.CornerRadius = UDim.new(1, 0)
		dc.Parent = divider

		local sub = Instance.new("TextLabel")
		sub.BackgroundTransparency = 1
		sub.Size = UDim2.new(1, -60, 0.12, 0)
		sub.Position = UDim2.new(0, 30, 0.50, 0)
		sub.Font = Enum.Font.GothamMedium
		sub.TextScaled = true
		sub.Text = "تحد نفسك واكسر رقمك"
		sub.TextColor3 = C3(190, 200, 215)
		sub.TextTransparency = 0.12
		sub.Parent = sg

		local pill = Instance.new("Frame")
		pill.AnchorPoint = Vector2.new(0.5, 0.5)
		pill.Position = UDim2.new(0.5, 0, 0.78, 0)
		pill.Size = UDim2.new(0.82, 0, 0.2, 0)
		pill.BackgroundColor3 = C3(8, 12, 20)
		pill.BackgroundTransparency = 0.15
		pill.Parent = sg
		local pc = Instance.new("UICorner")
		pc.CornerRadius = UDim.new(0.5, 0)
		pc.Parent = pill
		local pstk = Instance.new("UIStroke")
		pstk.Thickness = 2.5
		pstk.Color = GOLD
		pstk.Transparency = 0.1
		pstk.Parent = pill
		local pl = Instance.new("TextLabel")
		pl.BackgroundTransparency = 1
		pl.Size = UDim2.new(1, -50, 0.62, 0)
		pl.Position = UDim2.new(0.5, 0, 0.5, 0)
		pl.AnchorPoint = Vector2.new(0.5, 0.5)
		pl.Font = Enum.Font.GothamBold
		pl.TextScaled = true
		pl.Text = "سجل أسرع زمن"
		pl.TextColor3 = GOLDLIT
		pl.Parent = pill
	end
end

-- منارة محتواة تنطلق من أعلى القوس للأعلى فقط (لا تخترق البوّابة) + كرة تتويج
do
	local baseY = ENTRY_POS.Y + 10.7
	local beaconCore = mkCyl("GateBeacon", 13, 0.9, baseY + 6.5, ENTRY_POS.X, ENTRY_POS.Z, GOLDLIT, Enum.Material.Neon, gate, false)
	beaconCore.Transparency = 0.5; beaconCore.CanTouch = false
	local beaconHalo = mkCyl("GateBeaconHalo", 12, 2.2, baseY + 6.0, ENTRY_POS.X, ENTRY_POS.Z, GOLDLIT, Enum.Material.Neon, gate, false)
	beaconHalo.Transparency = 0.85; beaconHalo.CanTouch = false
	local gbc = mkBall("GateBeaconCap", 1.2, ENTRY_POS.X, baseY + 13.2, ENTRY_POS.Z, GOLDLIT, Enum.Material.Neon, gate)
	gbc.Transparency = 0.3
end

-- فقاعة العدّ/الحالة فوق القوس (تظهر فقط أثناء الدخول)
local gateCountLbl, gateCountBB
do
	local anchor = mk("GateCountAnchor", V(0.4, 0.4, 0.4), CFrame.new(ENTRY_POS + V(0, 13.0, 0)), GOLDLIT, Enum.Material.SmoothPlastic, gate, false)
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

-- فقاعة «ابدأ» على القاعدة (ProximityPrompt)
local promptPart = mk("GatePromptPart", V(0.6, 0.6, 0.6), CFrame.new(ENTRY_POS + V(0, 1.8, 0)), GOLDLIT, Enum.Material.SmoothPlastic, gate, false)
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

-- أنيميشن المسح الضوئي عند الدخول: يثبّت اللاعب ويمسحه قرص ينزل من أعلى
-- القوس للقاعدة، ثم يُنقل لقمة البرج (يُبنى عند الحاجة ويُهدَم بعدها → صفر خمول)
local function runEntryScan(player)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	local wasAnchored = if hrp then hrp.Anchored else false
	local wasPlatformStand = if hum then hum.PlatformStand else false
	local rig
	local snd
	-- يُغلّف الجسم كاملاً (التثبيت + بناء المؤثّر + العرض) بـpcall، فيُضمن
	-- التنظيف أدناه دائماً حتى لو أخفقت أي خطوة → اللاعب لا يبقى مثبّتاً أبداً
	pcall(function()
		if hrp then
			hrp.CFrame = CFrame.new(ENTRY_POS.X, padTopY + 3.0, ENTRY_POS.Z)
			hrp.Anchored = true
		end
		if hum then hum.PlatformStand = true end

		rig = Instance.new("Model"); rig.Name = "GateScanFX"; rig.Parent = gate
		local topY = ENTRY_POS.Y + 9.2
		local botY = padTopY + 0.4
		local disc = mkCyl("ScanDisc", 0.3, 9.2, topY, ENTRY_POS.X, ENTRY_POS.Z, SCANC, Enum.Material.Neon, rig, false)
		disc.Transparency = 0.3; disc.CanTouch = false
		local rim = mkCyl("ScanRim", 0.5, 9.9, topY, ENTRY_POS.X, ENTRY_POS.Z, SCANRIM, Enum.Material.Neon, rig, false)
		rim.Transparency = 0.1; rim.CanTouch = false

		-- صوت المسح الضوئي «scanner-sound-effect» (assetId 76270469261531، نوع Audio،
		-- مملوك لحساب اللعبة ومعتمَد رقابياً). صوت ثلاثي الأبعاد يصدر من قرص المسح وينزل
		-- معه فيسمعه كل القريبين. عند انتهاء المسح يُسلَّم لمصدر ثابت (أدناه) كي يُكمل
		-- تشغيله دون قطع مفاجئ مهما طال، ثم يُنظَّف ذاتياً. لو تعذّر تحميله (حذف/خصوصية/
		-- رقابة) يتعطّل الصوت بهدوء دون كسر التسلسل لأن التنظيف لا يعتمد على نجاح التحميل
		snd = Instance.new("Sound")
		snd.Name = "ScanSound"
		snd.SoundId = SCAN_SOUND_ID
		snd.Volume = 1
		snd.RollOffMode = Enum.RollOffMode.InverseTapered
		snd.RollOffMaxDistance = 80
		snd.Parent = disc

		-- زامن مدة نزول القرص مع طول الصوت: انتظر معرفة طوله (محمّل مسبقاً فيكون فورياً،
		-- وبحدّ أقصى قصير احتياطاً)، ثم يبدأ الصوت والحركة وينتهيان معاً تماماً
		local loadEnd = os.clock() + 0.75
		while snd.TimeLength <= 0 and os.clock() < loadEnd do
			RunService.Heartbeat:Wait()
		end
		local T = if snd.TimeLength > 0 then math.clamp(snd.TimeLength, 0.8, 3.5) else 1.25
		snd:Play()
		local t0 = os.clock()
		while true do
			local a = (os.clock() - t0) / T
			if a >= 1 then break end
			local y = topY + (botY - topY) * a
			local cf = CFrame.new(ENTRY_POS.X, y, ENTRY_POS.Z) * CFrame.Angles(0, 0, math.rad(90))
			disc.CFrame = cf; rim.CFrame = cf
			if not (player.Parent and player.Character == char and hrp and hrp.Parent) then break end
			RunService.Heartbeat:Wait()
		end
	end)
	-- يُنقَل الصوت لمصدر ثابت عند البوّابة قبل هدم المؤثّر كي يُكمِل تشغيله بلا
	-- قطع مفاجئ (مهم لو كان أطول من زمن المسح)، ويُنظَّف عند الانتهاء أو بحدّ أقصى
	if snd then
		if snd.Parent and snd.IsPlaying then
			snd.Parent = promptPart
			snd.Ended:Once(function() snd:Destroy() end)
			Debris:AddItem(snd, 8)
		else
			snd:Destroy()
		end
	end
	if rig then rig:Destroy() end
	if hrp and hrp.Parent then hrp.Anchored = wasAnchored end
	if hum and hum.Parent then hum.PlatformStand = wasPlatformStand end
end

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
				bar.CFrame = CFrame.new(ENTRY_POS + V(0, 0.55, 0)) * CFrame.Angles(0, theta + (i - 1) * (math.pi * 2 / 3), 0)
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

-- المرحلة الحالية (١..٥) من ارتفاع اللاعب ← رقم المنصّة ← STAGE_OF
local function currentStage(player)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if not hrp then return 1 end
	local idx = math.clamp(math.floor((hrp.Position.Y - TOP0) / RISE + 0.5), 0, COUNT - 1)
	return STAGE_OF[idx]
end

local function sendProgress(player, state)
	local st = runState[player.UserId]
	local elapsed = (st and st.inRun) and (os.clock() - st.startT) or 0
	local pct = (st and st.inRun) and progressPercent(player) or 0
	local stg = (st and st.inRun) and currentStage(player) or 1
	progressRemote:FireClient(player, {
		state   = state or ((st and st.inRun) and "run" or "idle"),
		stage   = stg,
		cp      = stg,
		total   = #STAGE_COLOR,
		percent = pct,
		time    = elapsed,
		coins   = (st and st.coinTotal) or 0,
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
-- بوّابة الدخول: الضغط E → تثبيت اللاعب + مسح ضوئي ينزل من القوس → النقل
-- لقمة البرج (بدل البدء التلقائي باللمس؛ يمنع الانطلاق بالغلط عند المرور)
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
		-- pcall يضمن أن البوّابة تُفتح دائماً حتى لو أخفق المسح/البدء (يمنع قفلاً دائماً)
		local ok, err = pcall(function()
			setGateNumber("استعد", GOLD)
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "ثبّت مكانك… جارٍ المسح الضوئي.") end
			task.wait(0.5)
			setGateNumber("مسح ضوئي…", SCANC)
			runEntryScan(player)
			setGateNumber("انطلق!", CPGLOW)
			local cur = runState[player.UserId]
			if player.Parent and not (cur and cur.inRun) then
				startRun(player)
			end
			task.wait(0.6)
		end)
		if not ok then
			warn("[ParkourGate] خطأ في تسلسل الدخول: " .. tostring(err))
		end
		setGateNumber("", nil)
		gatePrompt.Enabled = true
		gateCountingDown = false
	end)
end)

----------------------------------------------------------------------
-- نقاط الحفظ المرقّمة: تثبّت نقطة الرجوع + تحتسب مهمة parkour_cp
----------------------------------------------------------------------
for _, cp in ipairs(cpPads) do
	local pad, cpFwd = cp.part, cp.fwd
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
			local cpPos = V(pad.Position.X, topY + 3.5, pad.Position.Z)
			st.cpCF = CFrame.lookAt(cpPos, cpPos + cpFwd)   -- يواجه اتجاه التقدّم
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
-- العملات الذهبية: جمعها يمنح كوينز (مرّة لكل جولة) ثم تعود بعد لحظات
----------------------------------------------------------------------
local COIN_RESPAWN = 6
for _, ci in ipairs(coins) do
	local coin = ci.part
	coin.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		st.coinHit = st.coinHit or {}
		if st.coinHit[coin] then return end
		st.coinHit[coin] = true
		st.coinTotal = (st.coinTotal or 0) + ci.value
		if _G.AddCoins then _G.AddCoins(player, ci.value) end
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "+" .. ci.value .. " كوينز") end
		coin.Transparency = 1; coin.CanTouch = false
		task.delay(COIN_RESPAWN, function()
			if coin.Parent then coin.Transparency = 0; coin.CanTouch = true end
		end)
	end)
end

----------------------------------------------------------------------
-- بلاطات تتلاشى: بعد لمسها بلحظة تختفي (تسقط منها) ثم تعود — مرحلة التوقيت
----------------------------------------------------------------------
local FADE_WARN, FADE_GONE = 0.9, 1.8
for _, tile in ipairs(fadeTiles) do
	local busy = false
	tile.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun or busy then return end
		busy = true
		task.delay(FADE_WARN, function()
			tile.CanCollide = false; tile.Transparency = 0.85
			task.delay(FADE_GONE, function()
				tile.CanCollide = true; tile.Transparency = 0.05
				busy = false
			end)
		end)
	end)
end

----------------------------------------------------------------------
-- الكرات البندوليّة: تدفع اللاعب بعيداً (غير قاتلة) — مرحلة المراوغة
----------------------------------------------------------------------
local pendCooldown = {}
for _, pd in ipairs(pendulums) do
	pd.ball.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		if pendCooldown[player.UserId] then return end
		pendCooldown[player.UserId] = true
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp then
			local d = hrp.Position - pd.ball.Position
			local push = V(d.X, 0, d.Z)
			if push.Magnitude < 0.1 then push = pd.axis end
			hrp.AssemblyLinearVelocity = push.Unit * 55 + V(0, 20, 0)
		end
		task.delay(0.5, function() pendCooldown[player.UserId] = nil end)
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

	progressRemote:FireClient(player, { state = "finish", time = elapsed, reward = REWARD, percent = 100, total = #STAGE_COLOR, best = st.best, record = isRecord, coins = st.coinTotal or 0 })
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
			local now = os.clock()
			-- بوّابات الليزر الكانسة (حركة جانبية ذهاباً وإياباً)
			for _, sw in ipairs(sweepers) do
				local off = math.sin(now * sw.speed + sw.phase) * sw.amp
				sw.bar.CFrame = CFrame.new(sw.base + sw.axis * off)
			end
			-- الكرات البندوليّة المتأرجحة (+ كشف تصادم بالمسافة لأن Touched غير موثوق مع Position teleporting)
			for _, pd in ipairs(pendulums) do
				local ang = math.sin(now * pd.speed + pd.phase) * pd.amp
				local dir = CFrame.fromAxisAngle(pd.axis, ang) * V(0, -1, 0)
				local ballPos = pd.pivot + dir * pd.len
				pd.ball.CFrame = CFrame.new(ballPos)
				pd.rope.CFrame = CFrame.lookAt((pd.pivot + ballPos) / 2, ballPos)
				for _, player in ipairs(Players:GetPlayers()) do
					local st = runState[player.UserId]
					if st and st.inRun and not pendCooldown[player.UserId] then
						local char = player.Character
						local hrp = char and char:FindFirstChild("HumanoidRootPart")
						if hrp and (hrp.Position - ballPos).Magnitude < 3.6 then
							pendCooldown[player.UserId] = true
							local d = hrp.Position - ballPos
							local push = V(d.X, 0, d.Z)
							if push.Magnitude < 0.1 then push = pd.axis end
							hrp.AssemblyLinearVelocity = push.Unit * 55 + V(0, 20, 0)
							task.delay(0.5, function() pendCooldown[player.UserId] = nil end)
						end
					end
				end
			end
			-- دوران العملات (زينة)
			for _, ci in ipairs(coins) do
				if ci.part.Parent and ci.part.Transparency < 1 then
					ci.spin = (ci.spin + 2.4 * dt) % (math.pi * 2)
					ci.part.CFrame = CFrame.new(ci.center) * CFrame.Angles(0, ci.spin, 0)
				end
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
	pendCooldown[player.UserId] = nil
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
