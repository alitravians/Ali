--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام الباركور — PARKOUR SYSTEM (Server)                              ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  المسار: برج «Troll Obby Tower Hell» المستورد من متجر المنشئين          ║
║  (موديل ParkourCourse الثابت داخل ملف اللعبة، مفحوص أمنياً ومنظّف من     ║
║  السكربتات الخبيثة، وكل قطعه Anchored = صفر فيزياء).                    ║
║  هذا السكربت يكتشف عناصر الموديل ويشغّلها:                              ║
║   ─ SpawnLocation (معطّلة) = نقطة البداية أعلى بوّابة الدخول.            ║
║   ─ أجزاء KILLPART-* (ليزر/بلاطات قاتلة) → رجوع فوري لآخر نقطة حفظ.     ║
║   ─ أجزاء AutoSpeed = وسادات تسريع مؤقتة (متعة، غير قاتلة).             ║
║   ─ منصّة «end» العليا = خط النهاية → كوينز + إنجاز + أفضل وقت.          ║
║   ─ نقاط حفظ تلقائية مرقّمة تُبنى على أكبر المنصّات موزّعةً على الارتفاع.   ║
║   ─ تسقط تحت المسار → ترجع لآخر نقطة حفظ.                              ║
║                                                                        ║
║  الأداء: المنطق على أحداث Touched، وحلقة واحدة (مراقبة السقوط) تعمل     ║
║  فقط أثناء جولة نشِطة وتتوقّف تماماً عند الخمول → صفر استهلاك (لا لاق).   ║
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
-- الألوان
----------------------------------------------------------------------
local GREEN  = C3(126, 211, 110)
local TEAL   = C3(58, 200, 192)
local ORANGE = C3(245, 158, 66)
local RED    = C3(226, 88, 88)
local GOLD   = C3(214, 175, 92)
local CPGLOW = C3(120, 240, 150)
local SIGNBG = C3(22, 28, 44)
local DARKMETAL = C3(82, 86, 92)

-- ٥ مراحل تقدّم (حسب الارتفاع) — لكلٍّ لونها في واجهة العميل والبوّابة
local STAGE_COLOR = { GREEN, TEAL, ORANGE, RED, GOLD }

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

-- كرة صغيرة (لقمم المنارات)
local function mkBall(name, dia, x, y, z, color, material, parent)
	local p = mk(name, V(dia, dia, dia), V(x, y, z), color, material, parent, false)
	p.Shape = Enum.PartType.Ball
	p.CanTouch = false
	return p
end

----------------------------------------------------------------------
-- اكتشاف عناصر موديل البرج المستورد (ParkourCourse)
----------------------------------------------------------------------
local course = Workspace:WaitForChild("ParkourCourse")

local spawnLoc, endPart
local killParts, speedPads, flatCandidates = {}, {}, {}
local courseMinY = math.huge
for _, d in ipairs(course:GetDescendants()) do
	if d:IsA("ProximityPrompt") then
		-- المطالبات الأصلية بلا سكربتاتها لا تفعل شيئاً — تُعطَّل حتى لا تربك اللاعب
		d.Enabled = false
	elseif d:IsA("BasePart") then
		courseMinY = math.min(courseMinY, d.Position.Y)
		local nm = d.Name
		if d:IsA("SpawnLocation") then
			spawnLoc = d
		elseif nm == "end" then
			endPart = d
		elseif nm:sub(1, 8) == "KILLPART" then
			d.CanTouch = true
			table.insert(killParts, d)
		elseif nm == "AutoSpeed" then
			d.CanTouch = true
			table.insert(speedPads, d)
		elseif d.CanCollide and d.Size.Y <= 3 and d.Size.X >= 8 and d.Size.Z >= 8 then
			table.insert(flatCandidates, d)   -- منصّة مرشّحة لنقطة حفظ تلقائية
		end
	end
end
if not spawnLoc then error("[Parkour] SpawnLocation مفقودة من موديل ParkourCourse") end
if not endPart then error("[Parkour] منصّة النهاية (end) مفقودة من موديل ParkourCourse") end

----------------------------------------------------------------------
-- إحداثيات النظام
----------------------------------------------------------------------
local SPAWN_POS = spawnLoc.Position + V(0, 3.5, 0)
local SPAWN_CF  = CFrame.new(SPAWN_POS)
local BASE_Y    = SPAWN_POS.Y
local FINISH_Y  = endPart.Position.Y + endPart.Size.Y / 2 + 3.5
local FALL_Y    = courseMinY - 12
local EXIT_POS  = V(6, 5, 60)          -- خروج آمن قرب نقطة الانطلاق الرئيسية (0,_,60)
local ENTRY_POS = V(-20, 1.3, 60)      -- منصّة دخول أرضية بجانب الانطلاق الرئيسي (مرئية وسهلة الوصول)

----------------------------------------------------------------------
-- نقاط حفظ تلقائية: تُختار أكبر المنصّات المسطّحة موزّعةً بالتساوي على كامل
-- الارتفاع (٦ نطاقات)، ويُبنى على كلٍّ قرص أخضر متوهّج بلافتة رقم عربي.
----------------------------------------------------------------------
local fCP = Instance.new("Folder"); fCP.Name = "AutoCheckpoints"; fCP.Parent = course
local cpPads = {}
do
	local BANDS = 6
	local NUMERALS = { "١", "٢", "٣", "٤", "٥", "٦" }
	local span = math.max(FINISH_Y - BASE_Y, 1)
	local chosen = {}
	for b = 1, BANDS do
		local lo = BASE_Y + span * (b - 1) / BANDS
		local hi = BASE_Y + span * b / BANDS
		local best, bestArea
		for _, p in ipairs(flatCandidates) do
			local topY = p.Position.Y + p.Size.Y / 2
			if topY >= lo and topY < hi then
				local area = p.Size.X * p.Size.Z
				if not best or area > bestArea then best, bestArea = p, area end
			end
		end
		if best then table.insert(chosen, best) end
	end
	table.sort(chosen, function(a, b) return a.Position.Y < b.Position.Y end)
	for k, plat in ipairs(chosen) do
		local topY = plat.Position.Y + plat.Size.Y / 2
		local cx, cz = plat.Position.X, plat.Position.Z
		local dia = math.min(6.5, math.min(plat.Size.X, plat.Size.Z) - 1)
		local disc = mkCyl("CPDisc" .. k, 0.3, dia, topY + 0.16, cx, cz, CPGLOW, Enum.Material.Neon, fCP, false)
		disc.CanTouch = true
		disc.Transparency = 0.25
		table.insert(cpPads, { part = disc })
		local sign = mk("CPNum" .. k, V(2.6, 2.6, 0.3), CFrame.new(cx, topY + 3.2, cz), SIGNBG, Enum.Material.SmoothPlastic, fCP, false)
		signGui(sign, NUMERALS[k] or tostring(k), CPGLOW)
	end
end

-- حجم نهاية غير مرئي فوق منصّة «end» (لمسه = فوز)
local finishPart = mk("ParkourFinish",
	V(endPart.Size.X, 12, endPart.Size.Z),
	endPart.Position + V(0, endPart.Size.Y / 2 + 6, 0),
	GOLD, Enum.Material.SmoothPlastic, course, false)
finishPart.Transparency = 1
finishPart.CanTouch = true

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
padRim.CanTouch = false; padRim.Transparency = 0.25

-- قرص «ابدأ» أخضر بالمركز + نص على الوجه العلوي
local goDisc = mkCyl("GoDisc", 0.22, 4.8, padTopY + 0.07, ENTRY_POS.X, ENTRY_POS.Z, GREENZ, Enum.Material.Neon, gate, false)
goDisc.CanTouch = false; goDisc.Transparency = 0.3
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
	-- توزيع الأذرع ١٢٠° منذ الإنشاء + إزاحة رأسية طفيفة لكل ذراع، حتى لا
	-- تتطابق وتتداخل (z-fighting) أثناء الخمول فتومض كأنها خلل.
	local bar = mk("GateSweep", V(9.0, 0.18, 0.5),
		CFrame.new(ENTRY_POS + V(0, 0.55 + (i - 1) * 0.06, 0)) * CFrame.Angles(0, (i - 1) * (math.pi * 2 / 3), 0),
		GOLDLIT, Enum.Material.Neon, gate, false)
	bar.CanTouch = false; bar.Transparency = 0.35
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

	-- لوح زجاجي داكن (صلب حتى لا يُخترَق)
	local board = mk("HoloBoard", V(W, H, 0.22), boardCF, C3(14, 18, 26), Enum.Material.Glass, gate, true)
	board.CanTouch = false; board.Reflectance = 0.15

	-- إطار ذهبي حول اللوح (إحداثيات محلية للوح)
	local fr = 0.2
	for _, d in ipairs({
		{ V(0, H / 2, 0), V(W + fr * 2, fr, 0.3) },
		{ V(0, -H / 2, 0), V(W + fr * 2, fr, 0.3) },
		{ V(-W / 2, 0, 0), V(fr, H, 0.3) },
		{ V(W / 2, 0, 0), V(fr, H, 0.3) },
	}) do
		local f = mk("HoloFrame", d[2], boardCF * CFrame.new(d[1]), GOLD, Enum.Material.Metal, gate, true)
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
				bar.CFrame = CFrame.new(ENTRY_POS + V(0, 0.55 + (i - 1) * 0.06, 0)) * CFrame.Angles(0, theta + (i - 1) * (math.pi * 2 / 3), 0)
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

-- المرحلة الحالية (١..٥) من ارتفاع اللاعب — أخماس متساوية من ارتفاع البرج
local function currentStage(player)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if not hrp then return 1 end
	local frac = (hrp.Position.Y - BASE_Y) / math.max(FINISH_Y - BASE_Y, 1)
	return math.clamp(1 + math.floor(frac * #STAGE_COLOR), 1, #STAGE_COLOR)
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
	local pad = cp.part
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
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "تم حفظ نقطة الرجوع.") end
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
-- وسادات التسريع (AutoSpeed من الموديل): دفعة سرعة مؤقتة (غير قاتلة)
----------------------------------------------------------------------
local SPEED_BOOST, SPEED_TIME = 30, 3
local boostUntil = {}
for _, pad in ipairs(speedPads) do
	pad.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		local char = player.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if not hum then return end
		local firstBoost = not boostUntil[player.UserId] or os.clock() > boostUntil[player.UserId]
		boostUntil[player.UserId] = os.clock() + SPEED_TIME
		if firstBoost then
			local baseSpeed = hum.WalkSpeed
			hum.WalkSpeed = math.max(baseSpeed, SPEED_BOOST)
			task.spawn(function()
				while os.clock() < (boostUntil[player.UserId] or 0) do
					task.wait(0.2)
				end
				boostUntil[player.UserId] = nil
				if hum.Parent then hum.WalkSpeed = baseSpeed end
			end)
		end
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
		activeConn = RunService.Heartbeat:Connect(function()
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
	boostUntil[player.UserId] = nil
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
