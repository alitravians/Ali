--[[
╔══════════════════════════════════════════════════════════════════════╗
║  منطقة الشاطئ — BEACH AREA (Server)                                   ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  • شاطئ رملي كبير + بحر بمادّة Water (انعكاس + حركة ماء واقعية)        ║
║  • أمواج متحركة عند خط الشاطئ + أصوات بحر/طيور محيطة (Looped)          ║
║  • نخيل + مظلات شاطئية + كراسي استرخاء + ممشى خشبي                     ║
║  • أعمدة إنارة دافئة (إضاءة ليلية جميلة) + لوحة ترحيب على الوجهين       ║
║  • منطقة مستقلة تماماً شرق الساحة، لا تمسّ السينما/البوثات              ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace = game:GetService("Workspace")

-- مركز منطقة الشاطئ (شرق الخريطة، بعيداً عن السينما والبوثات)
local CX, CZ = 150, 20
local SAND_Y = 0.9          -- سطح الرمل
local SAND_X, SAND_Z = 120, 160

-- ألوان
local SAND   = Color3.fromRGB(235, 214, 158)
local SEA    = Color3.fromRGB(40, 140, 200)
local WOOD   = Color3.fromRGB(120, 80, 55)
local LEAF   = Color3.fromRGB(60, 170, 80)
local TRUNK  = Color3.fromRGB(110, 75, 45)
local WARM   = Color3.fromRGB(255, 200, 120)
local FOAM   = Color3.fromRGB(235, 248, 255)

local beach = Instance.new("Model")
beach.Name = "BeachArea"
beach.Parent = Workspace

local function newPart(props)
	local p = Instance.new("Part")
	p.Anchored = true
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
	if props.Orientation then p.Orientation = props.Orientation end
	if props.Reflectance then p.Reflectance = props.Reflectance end
	p.Parent = props.Parent or beach
	return p
end

----------------------------------------------------------------------
-- الرمل + البحر
----------------------------------------------------------------------
newPart({ Name = "Sand", Size = Vector3.new(SAND_X, 1, SAND_Z),
	Position = Vector3.new(CX, SAND_Y, CZ), Color = SAND, Material = Enum.Material.Sand })

-- خط حدّ ناعم للرمل (يميل بسلاسة نحو الماء)
local shoreX = CX + SAND_X / 2          -- خط الشاطئ (شرق)
newPart({ Name = "WetSand", Size = Vector3.new(10, 1, SAND_Z),
	Position = Vector3.new(shoreX - 3, SAND_Y - 0.15, CZ),
	Color = Color3.fromRGB(205, 184, 132), Material = Enum.Material.Sand })

-- البحر: ماء Terrain حقيقي قابل للسباحة (الـ Part بمادّة Water لا يسمح بالسباحة في Roblox)
-- + قاع صلب وحواجز غير مرئية تمنع اللاعب من السقوط تحت الماب.
local Terrain = Workspace.Terrain

local SEA_W   = 150                  -- عرض البحر (محور X، شرق الشاطئ) — بحر أوسع
local SEA_L   = SAND_Z               -- طول البحر (محور Z) يحاذي الرمل
local SEA_CX  = shoreX + SEA_W / 2   -- مركز البحر
local WATER_TOP    = SAND_Y          -- سطح الماء (يحاذي مستوى الرمل تقريباً)
local WATER_BOTTOM = -16             -- قاع منطقة الماء (عمق سباحة مريح)
local WATER_H  = WATER_TOP - WATER_BOTTOM
local WATER_CY = (WATER_TOP + WATER_BOTTOM) / 2

-- 1) ملء ماء Terrain فعلي — هو الوحيد الذي يفعّل السباحة للّاعب
pcall(function()
	Terrain:FillBlock(
		CFrame.new(SEA_CX, WATER_CY, CZ),
		Vector3.new(SEA_W, WATER_H, SEA_L),
		Enum.Material.Water
	)
end)

-- 2) قاع بحر صلب: لو غاص اللاعب حتى القاع يقف عليه فلا يسقط تحت الماب أبداً
newPart({ Name = "SeaBed", Size = Vector3.new(SEA_W + 12, 2, SEA_L + 12),
	Position = Vector3.new(SEA_CX, WATER_BOTTOM - 1, CZ),
	Color = Color3.fromRGB(196, 178, 130), Material = Enum.Material.Sand })

-- 3) حواجز غير مرئية حول البحر (شرق/شمال/جنوب) تمنع السباحة خارج الماء نحو الفراغ
local WALL_CY = (8 + (WATER_BOTTOM - 1)) / 2
local WALL_H  = 8 - (WATER_BOTTOM - 1)
local function seaWall(name, sx, sz, px, pz)
	local w = newPart({ Name = name, Size = Vector3.new(sx, WALL_H, sz),
		Position = Vector3.new(px, WALL_CY, pz), Transparency = 1 })
	w.CanQuery = false
end
seaWall("SeaWallE", 2, SEA_L + 12, SEA_CX + SEA_W / 2 + 1, CZ)   -- الحائط الشرقي (أعمق نقطة)
seaWall("SeaWallN", SEA_W + 4, 2, SEA_CX, CZ - SEA_L / 2 - 1)    -- الحائط الشمالي
seaWall("SeaWallS", SEA_W + 4, 2, SEA_CX, CZ + SEA_L / 2 + 1)    -- الحائط الجنوبي

----------------------------------------------------------------------
-- أمواج متحركة عند خط الشاطئ
----------------------------------------------------------------------
local waves = {}
for i = 1, 3 do
	local w = newPart({ Name = "Wave" .. i, Size = Vector3.new(4, 0.6, SAND_Z - 10),
		Position = Vector3.new(shoreX - 2 - i * 4, SAND_Y - 0.05, CZ),
		Color = FOAM, Material = Enum.Material.Neon, Transparency = 0.45, CanCollide = false })
	w.CanQuery = false
	waves[i] = { part = w, baseX = shoreX - 2 - i * 4, phase = i * 1.1 }
end

-- حركة الأمواج تعمل فقط عند وجود لاعب قريب من الشاطئ (توفير موارد السيرفر)
local Players = game:GetService("Players")
local WAVE_RANGE2 = 160 * 160
task.spawn(function()
	while beach.Parent do
		local someoneNear = false
		for _, pl in ipairs(Players:GetPlayers()) do
			local hrp = pl.Character and pl.Character:FindFirstChild("HumanoidRootPart")
			if hrp then
				local dx, dz = hrp.Position.X - CX, hrp.Position.Z - CZ
				if dx * dx + dz * dz <= WAVE_RANGE2 then someoneNear = true; break end
			end
		end
		if someoneNear then
			local t = os.clock()
			for _, w in ipairs(waves) do
				local s = math.sin(t * 1.4 + w.phase)
				local p = w.part
				if p.Parent then
					p.Position = Vector3.new(w.baseX + s * 2.5, SAND_Y - 0.05, CZ)
					p.Transparency = 0.4 + 0.2 * (0.5 + 0.5 * s)
				end
			end
			task.wait(0.08)
		else
			task.wait(1)   -- خمول: فحص خفيف كل ثانية بدل ١٦ مرة بالثانية
		end
	end
end)

----------------------------------------------------------------------
-- أصوات محيطة (بحر + طيور) — استبدل المعرّفات بمفضّلتك لو رغبت
----------------------------------------------------------------------
local function ambientSound(name, id, volume, parentPart)
	local s = Instance.new("Sound")
	s.Name = name
	s.SoundId = "rbxassetid://" .. id
	s.Looped = true
	s.Volume = volume
	s.RollOffMode = Enum.RollOffMode.InverseTapered
	s.RollOffMinDistance = 20
	s.RollOffMaxDistance = 220
	s.Parent = parentPart
	s.Playing = true
	return s
end

local soundAnchor = newPart({ Name = "BeachSoundAnchor", Size = Vector3.new(2, 2, 2),
	Position = Vector3.new(shoreX, SAND_Y + 2, CZ), Transparency = 1, CanCollide = false })
soundAnchor.CanQuery = false
ambientSound("OceanWaves", 1838457617, 0.6, soundAnchor)   -- هدير أمواج
ambientSound("Seagulls", 9112999833, 0.35, soundAnchor)    -- طيور بحر

----------------------------------------------------------------------
-- نخلة
----------------------------------------------------------------------
local function palm(x, z)
	newPart({ Name = "PalmTrunk", Shape = Enum.PartType.Cylinder, Size = Vector3.new(11, 1.4, 1.4),
		CFrame = CFrame.new(x, SAND_Y + 5.5, z) * CFrame.Angles(0, 0, math.rad(90)),
		Color = TRUNK, Material = Enum.Material.Wood })
	local crownY = SAND_Y + 11
	for a = 0, 5 do
		local ang = math.rad(a * 60)
		newPart({ Name = "PalmLeaf", Size = Vector3.new(8, 0.5, 3),
			CFrame = CFrame.new(x, crownY, z)
				* CFrame.Angles(0, ang, math.rad(18))
				* CFrame.new(4, 0, 0),
			Color = LEAF, Material = Enum.Material.Grass, CanCollide = false })
	end
	newPart({ Name = "Coconut", Shape = Enum.PartType.Ball, Size = Vector3.new(1.4, 1.4, 1.4),
		Position = Vector3.new(x, crownY - 0.4, z), Color = Color3.fromRGB(90, 60, 40),
		Material = Enum.Material.Wood, CanCollide = false })
end

----------------------------------------------------------------------
-- مظلّة شاطئية
----------------------------------------------------------------------
local function umbrella(x, z, col)
	newPart({ Name = "UmbrellaPole", Shape = Enum.PartType.Cylinder, Size = Vector3.new(9, 0.5, 0.5),
		CFrame = CFrame.new(x, SAND_Y + 4.5, z) * CFrame.Angles(0, 0, math.rad(90)),
		Color = Color3.fromRGB(230, 230, 230), Material = Enum.Material.Metal })
	newPart({ Name = "UmbrellaTop", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.6, 9, 9),
		CFrame = CFrame.new(x, SAND_Y + 9, z) * CFrame.Angles(0, 0, math.rad(90)),
		Color = col, Material = Enum.Material.SmoothPlastic, CanCollide = false })
end

----------------------------------------------------------------------
-- كرسي استرخاء (مائل)
----------------------------------------------------------------------
local function lounger(x, z, col)
	newPart({ Name = "LoungerSeat", Size = Vector3.new(3, 0.4, 6),
		Position = Vector3.new(x, SAND_Y + 1, z), Color = col, Material = Enum.Material.Fabric })
	newPart({ Name = "LoungerBack", Size = Vector3.new(3, 0.4, 4),
		CFrame = CFrame.new(x, SAND_Y + 2.2, z - 3.4) * CFrame.Angles(math.rad(-55), 0, 0),
		Color = col, Material = Enum.Material.Fabric })
	for _, ox in ipairs({ -1.2, 1.2 }) do
		newPart({ Name = "LoungerLeg", Size = Vector3.new(0.3, 1, 0.3),
			Position = Vector3.new(x + ox, SAND_Y + 0.5, z + 2.5),
			Color = Color3.fromRGB(210, 210, 210), Material = Enum.Material.Metal })
	end
end

----------------------------------------------------------------------
-- عمود إنارة دافئ (يضيء ليلاً)
----------------------------------------------------------------------
local function lamp(x, z)
	newPart({ Name = "LampPole", Size = Vector3.new(0.6, 12, 0.6),
		Position = Vector3.new(x, SAND_Y + 6, z), Color = Color3.fromRGB(40, 40, 50),
		Material = Enum.Material.Metal })
	local head = newPart({ Name = "LampHead", Shape = Enum.PartType.Ball, Size = Vector3.new(2, 2, 2),
		Position = Vector3.new(x, SAND_Y + 12, z), Color = WARM, Material = Enum.Material.Neon,
		CanCollide = false })
	local light = Instance.new("PointLight")
	light.Color = WARM; light.Brightness = 2; light.Range = 26; light.Parent = head
end

----------------------------------------------------------------------
-- ممشى خشبي بمحاذاة الشاطئ (مدخل المنطقة من جهة الساحة)
----------------------------------------------------------------------
local walkX = CX - SAND_X / 2 + 6
for i = -7, 7 do
	newPart({ Name = "BoardPlank", Size = Vector3.new(8, 0.3, 4),
		Position = Vector3.new(walkX, SAND_Y + 0.45, CZ + i * 4.4),
		Color = (i % 2 == 0) and WOOD or Color3.fromRGB(135, 92, 64),
		Material = Enum.Material.WoodPlanks })
end

----------------------------------------------------------------------
-- توزيع العناصر على الشاطئ
----------------------------------------------------------------------
local UCOL = { Color3.fromRGB(255, 99, 99), Color3.fromRGB(99, 170, 255),
	Color3.fromRGB(255, 200, 80), Color3.fromRGB(140, 220, 120) }

-- نخيل على أطراف المنطقة
palm(CX - 40, CZ - 55); palm(CX - 10, CZ - 60); palm(CX + 30, CZ - 52)
palm(CX - 38, CZ + 55); palm(CX + 5, CZ + 60); palm(CX + 36, CZ + 54)
palm(CX - 50, CZ + 5)

-- مظلات + كراسي استرخاء (أزواج) باتجاه البحر
local spots = { { CX + 8, CZ - 30 }, { CX + 14, CZ - 6 }, { CX + 10, CZ + 18 }, { CX + 16, CZ + 40 } }
for i, s in ipairs(spots) do
	local col = UCOL[(i - 1) % #UCOL + 1]
	umbrella(s[1], s[2], col)
	lounger(s[1] + 4, s[2] - 1.5, col)
	lounger(s[1] + 4, s[2] + 2.5, col)
end

-- أعمدة إنارة على طول الممشى وخط الشاطئ
lamp(walkX - 2, CZ - 36); lamp(walkX - 2, CZ + 36)
lamp(shoreX - 8, CZ - 44); lamp(shoreX - 8, CZ + 44)
lamp(CX, CZ - 60); lamp(CX, CZ + 60)

----------------------------------------------------------------------
-- سياج خشبي حول الشاطئ (حدّ بصري + مظهر) — يترك فتحة الممشى مفتوحة
----------------------------------------------------------------------
local FENCE = Color3.fromRGB(160, 110, 70)
local function fenceRun(x0, z0, x1, z1)
	local dx, dz = x1 - x0, z1 - z0
	local len = math.sqrt(dx * dx + dz * dz)
	local n = math.max(1, math.floor(len / 6))
	for i = 0, n do
		local t = i / n
		newPart({ Name = "FencePost", Size = Vector3.new(0.5, 4, 0.5),
			Position = Vector3.new(x0 + dx * t, SAND_Y + 2, z0 + dz * t),
			Color = FENCE, Material = Enum.Material.Wood, CanCollide = false })
	end
	local ang = math.atan2(dz, dx)
	for _, hy in ipairs({ SAND_Y + 1.4, SAND_Y + 2.8 }) do
		newPart({ Name = "FenceRail", Size = Vector3.new(len, 0.3, 0.3),
			CFrame = CFrame.new((x0 + x1) / 2, hy, (z0 + z1) / 2) * CFrame.Angles(0, -ang, 0),
			Color = FENCE, Material = Enum.Material.Wood, CanCollide = false })
	end
end
do
	local bxW, bxE = CX - SAND_X / 2, CX + SAND_X / 2
	local bzN, bzS = CZ - SAND_Z / 2, CZ + SAND_Z / 2
	fenceRun(bxW, bzN, bxE - 4, bzN)        -- الشمال
	fenceRun(bxW, bzS, bxE - 4, bzS)        -- الجنوب
	fenceRun(bxW, bzN, bxW, CZ - 18)        -- الغرب (الجزء الشمالي)
	fenceRun(bxW, CZ + 18, bxW, bzS)        -- الغرب (الجزء الجنوبي) — بينهما فتحة الممشى
end

----------------------------------------------------------------------
-- ٣ ألعاب أطفال على الرمل (مستوحاة من صور المرجع) — كلّها ثابتة (بلا حلقات)
----------------------------------------------------------------------
local PLAY = {
	red = Color3.fromRGB(235, 90, 90), yel = Color3.fromRGB(255, 205, 70),
	blu = Color3.fromRGB(80, 160, 240), grn = Color3.fromRGB(90, 200, 120),
	steel = Color3.fromRGB(150, 160, 175),
}

-- (1) زحليقة لولبية
local function spiralSlide(cx, cz)
	local baseY = SAND_Y + 0.5
	newPart({ Name = "SpiralPole", Shape = Enum.PartType.Cylinder, Size = Vector3.new(14, 1.2, 1.2),
		CFrame = CFrame.new(cx, baseY + 7, cz) * CFrame.Angles(0, 0, math.rad(90)),
		Color = PLAY.steel, Material = Enum.Material.Metal })
	newPart({ Name = "SpiralTop", Size = Vector3.new(5, 0.6, 5),
		Position = Vector3.new(cx, baseY + 13.5, cz), Color = PLAY.blu, Material = Enum.Material.SmoothPlastic })
	local turns, steps, r = 1.75, 28, 4.2
	for i = 0, steps do
		local t = i / steps
		local ang = t * turns * math.pi * 2
		local y = (baseY + 13) - t * 12
		newPart({ Name = "SpiralChute", Size = Vector3.new(2.6, 0.4, 2.6),
			CFrame = CFrame.new(cx + math.cos(ang) * r, y, cz + math.sin(ang) * r)
				* CFrame.Angles(0, -ang, math.rad(12)),
			Color = (i % 2 == 0) and PLAY.yel or PLAY.red, Material = Enum.Material.SmoothPlastic,
			CanCollide = false })
	end
	for a = 0, 3 do
		local ang = math.rad(a * 90)
		newPart({ Name = "SpiralRail", Size = Vector3.new(0.3, 4, 0.3),
			Position = Vector3.new(cx + math.cos(ang) * 2.2, baseY + 15, cz + math.sin(ang) * 2.2),
			Color = PLAY.steel, Material = Enum.Material.Metal })
	end
end

-- (2) لعبة التوازن (Seesaw)
local function seesaw(cx, cz)
	local baseY = SAND_Y + 0.5
	newPart({ Name = "SeesawFulcrum", Size = Vector3.new(1.6, 2.4, 4),
		Position = Vector3.new(cx, baseY + 1.2, cz), Color = PLAY.grn, Material = Enum.Material.SmoothPlastic })
	newPart({ Name = "SeesawPlank", Size = Vector3.new(12, 0.5, 1.8),
		CFrame = CFrame.new(cx, baseY + 2.4, cz) * CFrame.Angles(0, 0, math.rad(9)),
		Color = PLAY.red, Material = Enum.Material.WoodPlanks })
	for _, sgn in ipairs({ -1, 1 }) do
		local sx = cx + sgn * 5
		local sy = baseY + 2.4 + sgn * (5 * math.tan(math.rad(9)))
		newPart({ Name = "SeesawSeat", Size = Vector3.new(2, 0.4, 1.6),
			Position = Vector3.new(sx, sy + 0.6, cz), Color = PLAY.yel, Material = Enum.Material.SmoothPlastic })
		newPart({ Name = "SeesawGrip", Size = Vector3.new(0.3, 1.6, 0.3),
			Position = Vector3.new(sx, sy + 1.6, cz), Color = PLAY.steel, Material = Enum.Material.Metal })
	end
end

-- (3) مجموعة ألعاب: مراجيح + زحليقة مستقيمة
local function swingSet(cx, cz)
	local baseY = SAND_Y + 0.5
	for _, sgn in ipairs({ -1, 1 }) do
		newPart({ Name = "SwingLeg", Size = Vector3.new(0.5, 9, 0.5),
			CFrame = CFrame.new(cx - 4, baseY + 4.3, cz + sgn * 2.6) * CFrame.Angles(math.rad(sgn * 14), 0, 0),
			Color = PLAY.blu, Material = Enum.Material.Metal })
		newPart({ Name = "SwingLeg", Size = Vector3.new(0.5, 9, 0.5),
			CFrame = CFrame.new(cx + 4, baseY + 4.3, cz + sgn * 2.6) * CFrame.Angles(math.rad(sgn * 14), 0, 0),
			Color = PLAY.blu, Material = Enum.Material.Metal })
	end
	newPart({ Name = "SwingBeam", Size = Vector3.new(9, 0.6, 0.6),
		Position = Vector3.new(cx, baseY + 8.2, cz), Color = PLAY.steel, Material = Enum.Material.Metal })
	for _, ox in ipairs({ -2.4, 2.4 }) do
		for _, cc in ipairs({ -0.7, 0.7 }) do
			newPart({ Name = "SwingChain", Size = Vector3.new(0.18, 4, 0.18),
				Position = Vector3.new(cx + ox, baseY + 6, cz + cc), Color = PLAY.steel,
				Material = Enum.Material.Metal, CanCollide = false })
		end
		newPart({ Name = "SwingSeat", Size = Vector3.new(1.8, 0.3, 1.4),
			Position = Vector3.new(cx + ox, baseY + 4, cz), Color = PLAY.yel,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
	local sx = cx + 9
	newPart({ Name = "SlideTopPad", Size = Vector3.new(4, 0.5, 4),
		Position = Vector3.new(sx, baseY + 6.5, cz), Color = PLAY.grn, Material = Enum.Material.SmoothPlastic })
	for _, sgn in ipairs({ -1, 1 }) do
		newPart({ Name = "SlideLadderLeg", Size = Vector3.new(0.4, 7, 0.4),
			Position = Vector3.new(sx + 1.5, baseY + 3.5, cz + sgn * 1.6),
			Color = PLAY.steel, Material = Enum.Material.Metal })
	end
	newPart({ Name = "SlideChute", Size = Vector3.new(3, 0.4, 9),
		CFrame = CFrame.new(sx - 3.5, baseY + 4, cz) * CFrame.Angles(math.rad(34), 0, 0),
		Color = PLAY.red, Material = Enum.Material.SmoothPlastic })
	for _, sgn in ipairs({ -1, 1 }) do
		newPart({ Name = "SlideWall", Size = Vector3.new(0.3, 1.2, 9),
			CFrame = CFrame.new(sx - 3.5 + sgn * 1.5, baseY + 4.4, cz) * CFrame.Angles(math.rad(34), 0, 0),
			Color = PLAY.yel, Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
end

spiralSlide(CX - 16, CZ - 44)
seesaw(CX - 28, CZ + 2)
swingSet(CX - 22, CZ + 44)

----------------------------------------------------------------------
-- لوحة ترحيب «🏖️ الشاطئ» تُقرأ من الوجهين
----------------------------------------------------------------------
do
	local px = CX - SAND_X / 2 + 2
	newPart({ Name = "BeachSignPost", Size = Vector3.new(1, 9, 1),
		Position = Vector3.new(px, SAND_Y + 4.5, CZ), Color = WOOD, Material = Enum.Material.Wood })
	local board = newPart({ Name = "BeachSign", Size = Vector3.new(12, 3.4, 0.5),
		Position = Vector3.new(px, SAND_Y + 9.5, CZ), Color = Color3.fromRGB(28, 60, 90),
		Material = Enum.Material.SmoothPlastic })
	for _, face in ipairs({ Enum.NormalId.Back, Enum.NormalId.Front, Enum.NormalId.Left, Enum.NormalId.Right }) do
		local sg = Instance.new("SurfaceGui")
		sg.Face = face; sg.CanvasSize = Vector2.new(800, 240); sg.LightInfluence = 0
		sg.Adornee = board; sg.Parent = board
		local lbl = Instance.new("TextLabel")
		lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
		lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
		lbl.TextColor3 = Color3.fromRGB(255, 225, 150); lbl.Text = "🏖️ منطقة الشاطئ"; lbl.Parent = sg
	end
end

print("[BeachArea] Beach zone ready at", CX, CZ)
