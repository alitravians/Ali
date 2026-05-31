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

-- البحر (مادّة Water: حركة ماء وانعكاس واقعيان على القطعة)
local sea = newPart({ Name = "Sea", Size = Vector3.new(120, 1, 240),
	Position = Vector3.new(shoreX + 60, SAND_Y - 0.4, CZ), Color = SEA,
	Material = Enum.Material.Water, Transparency = 0.15, Reflectance = 0.25, CanCollide = false })
sea.CanQuery = false

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

task.spawn(function()
	while beach.Parent do
		local t = os.clock()
		for _, w in ipairs(waves) do
			local s = math.sin(t * 1.4 + w.phase)
			local p = w.part
			if p.Parent then
				p.Position = Vector3.new(w.baseX + s * 2.5, SAND_Y - 0.05, CZ)
				p.Transparency = 0.4 + 0.2 * (0.5 + 0.5 * s)
			end
		end
		task.wait(0.06)
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
