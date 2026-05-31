--[[
	مدينة التبرعات — باني العالم (WorldBuilder)
	يوضع في: ServerScriptService
	النوع: Script (Server)
	يبني كل مجسّمات الماب برمجياً: الأرض، النافورة، بوثات التبرّع،
	مبنى السينما (القاعة + الشاشة + البروجكتر + الكراسي + الحرّاس + لوحة التعليمات + بسطة الفشار).
	ثم يرفع علم WorldReady ليبدأ بقية الأنظمة عملها.
]]

local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")

----------------------------------------------------------------------
-- أدوات بناء عامة
----------------------------------------------------------------------
local function newPart(props: { [string]: any }): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.Material = Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do
		(p :: any)[k] = v
	end
	return p
end

local function corner(parent: Instance, radius: number?)
	-- زوايا ناعمة عبر إضافة قطعة أسطوانية ليست ضرورية في 3D، نتجاهلها.
	return parent
end

----------------------------------------------------------------------
-- الجذر
----------------------------------------------------------------------
local city = Instance.new("Folder")
city.Name = "City"
city.Parent = Workspace

-- الأرض (عشب أخضر مشرق)
local ground = newPart({
	Name = "Ground",
	Size = Vector3.new(400, 4, 400),
	Position = Vector3.new(0, -2, 0),
	Color = Color3.fromRGB(95, 190, 95),
	Material = Enum.Material.Grass,
	Parent = city,
})

-- ساحة مرصوفة فاتحة في الوسط
local plaza = newPart({
	Name = "Plaza",
	Size = Vector3.new(140, 1, 140),
	Position = Vector3.new(0, 0.5, 0),
	Color = Color3.fromRGB(232, 224, 210),
	Material = Enum.Material.Marble,
	Parent = city,
})

-- نقطة الانطلاق
local spawnPart = Instance.new("SpawnLocation")
spawnPart.Name = "MainSpawn"
spawnPart.Anchored = true
spawnPart.Size = Vector3.new(12, 1, 12)
spawnPart.Position = Vector3.new(0, 1.5, 45)
spawnPart.Color = Color3.fromRGB(168, 85, 247)
spawnPart.Material = Enum.Material.Neon
spawnPart.TopSurface = Enum.SurfaceType.Smooth
spawnPart.Parent = city

----------------------------------------------------------------------
-- النافورة في الوسط
----------------------------------------------------------------------
local fountain = Instance.new("Model")
fountain.Name = "Fountain"
fountain.Parent = city

local MARBLE = Color3.fromRGB(224, 216, 205)
local WATER_COL = Color3.fromRGB(90, 180, 235)

-- جدار الحوض السفلي (حلقة مرمر) + قاعدة
local fBase = newPart({
	Name = "Base", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(1.4, 30, 30),
	CFrame = CFrame.new(0, 0.7, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = MARBLE, Material = Enum.Material.Marble, Parent = fountain,
})
local fRim = newPart({
	Name = "Rim", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(2.6, 30, 30),
	CFrame = CFrame.new(0, 2.4, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = MARBLE, Material = Enum.Material.Marble, Parent = fountain,
})
-- سطح الماء السفلي
local fWater = newPart({
	Name = "Water", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(0.5, 27.5, 27.5),
	CFrame = CFrame.new(0, 2.5, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = WATER_COL, Material = Enum.Material.Glass, Transparency = 0.35,
	Reflectance = 0.15, Parent = fountain,
})
-- عمود وسطي + حوض علوي أصغر
local fPillar = newPart({
	Name = "Pillar", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(7, 3.2, 3.2),
	CFrame = CFrame.new(0, 5.6, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = MARBLE, Material = Enum.Material.Marble, Parent = fountain,
})
local fTier = newPart({
	Name = "UpperBowl", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(1.4, 12, 12),
	CFrame = CFrame.new(0, 7.2, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = MARBLE, Material = Enum.Material.Marble, Parent = fountain,
})
local fTierWater = newPart({
	Name = "UpperWater", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(0.4, 10, 10),
	CFrame = CFrame.new(0, 7.95, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = WATER_COL, Material = Enum.Material.Glass, Transparency = 0.35,
	Reflectance = 0.15, Parent = fountain,
})
local fSpout = newPart({
	Name = "Spout", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(3, 1.1, 1.1),
	CFrame = CFrame.new(0, 9.4, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = MARBLE, Material = Enum.Material.Marble, Parent = fountain,
})
fountain.PrimaryPart = fBase

-- إضاءة ناعمة (بدل الكرة النيون)
do
	local pl = Instance.new("PointLight")
	pl.Color = Color3.fromRGB(170, 215, 255)
	pl.Range = 24; pl.Brightness = 1.6; pl.Parent = fSpout
end

-- نفّاثة ماء حقيقية تطلع للأعلى ثم تتساقط
local function waterJet(parent, atCFrame, rate, speed, spread)
	local att = Instance.new("Attachment")
	att.CFrame = atCFrame
	att.Parent = parent
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxassetid://6109259509" -- قطرة ماء ناعمة
	e.Color = ColorSequence.new(Color3.fromRGB(200, 235, 255), Color3.fromRGB(150, 210, 250))
	e.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.15),
		NumberSequenceKeypoint.new(0.7, 0.35),
		NumberSequenceKeypoint.new(1, 1),
	})
	e.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.7),
		NumberSequenceKeypoint.new(1, 0.25),
	})
	e.Lifetime = NumberRange.new(1.1, 1.5)
	e.Rate = rate
	e.Speed = NumberRange.new(speed, speed + 4)
	e.SpreadAngle = Vector2.new(spread, spread)
	e.Acceleration = Vector3.new(0, -38, 0) -- جاذبية تجعل الماء يتقوّس ويتساقط
	e.EmissionDirection = Enum.NormalId.Top
	e.LightEmission = 0.4
	e.Rotation = NumberRange.new(0, 360)
	e.Parent = parent
	return e
end

-- رذاذ/فقاعات عند سطح الماء
local function waterMist(parent, atCFrame)
	local att = Instance.new("Attachment")
	att.CFrame = atCFrame
	att.Parent = parent
	local m = Instance.new("ParticleEmitter")
	m.Texture = "rbxasset://textures/particles/smoke_main.dds"
	m.Color = ColorSequence.new(Color3.fromRGB(225, 245, 255))
	m.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.55),
		NumberSequenceKeypoint.new(1, 1),
	})
	m.Size = NumberSequence.new(2.4)
	m.Lifetime = NumberRange.new(0.6, 1.0)
	m.Rate = 14
	m.Speed = NumberRange.new(1, 3)
	m.SpreadAngle = Vector2.new(40, 40)
	m.Parent = parent
	return m
end

-- نافورة مركزية قوية من الفوّهة + ٤ نفّاثات جانبية من الحوض العلوي
waterJet(fSpout, CFrame.new(0, 0.8, 0), 60, 26, 7)
for i = 0, 3 do
	local ang = math.rad(i * 90)
	waterJet(fTier, CFrame.new(math.cos(ang) * 3.6, 1.2, math.sin(ang) * 3.6), 26, 14, 10)
end
waterMist(fWater, CFrame.new(0, 0.4, 0))
waterMist(fTierWater, CFrame.new(0, 0.4, 0))

-- صوت خرير ماء خفيف (استبدل الرقم لو تبي صوتاً آخر)
do
	local s = Instance.new("Sound")
	s.SoundId = "rbxassetid://9112627118"
	s.Looped = true; s.Volume = 0.4; s.RollOffMaxDistance = 70
	s.Parent = fBase
	pcall(function() s:Play() end)
end

-- تموّج خفيف لسطح الماء (حركة حيّة)
task.spawn(function()
	local t = 0
	while fWater.Parent do
		t += 0.08
		local w = 0.5 + 0.12 * math.sin(t)
		fWater.Size = Vector3.new(w, 27.5, 27.5)
		fTierWater.Size = Vector3.new(0.4 + 0.08 * math.sin(t * 1.3), 10, 10)
		task.wait(0.08)
	end
end)

----------------------------------------------------------------------
-- 🐟 حوض السمك (Aquarium) + ركن سلفي — جنب النافورة
----------------------------------------------------------------------
local aquarium = Instance.new("Model")
aquarium.Name = "Aquarium"
aquarium.Parent = city

local AQ_CX, AQ_CZ = 26, 0          -- مركز الحوض (جنب النافورة)
local AQ_LEN, AQ_DEP, AQ_H = 18, 7, 5.5
local standTop = 3                   -- ارتفاع القاعدة عن الأرض
local waterCY = standTop + AQ_H / 2  -- مركز الماء عمودياً

-- قاعدة/منصّة الحوض
newPart({
	Name = "AqStand", Size = Vector3.new(AQ_LEN + 1.5, standTop, AQ_DEP + 1.5),
	Position = Vector3.new(AQ_CX, standTop / 2, AQ_CZ),
	Color = Color3.fromRGB(40, 34, 54), Material = Enum.Material.Slate, Parent = aquarium,
})
-- رمل القاع
newPart({
	Name = "AqSand", Size = Vector3.new(AQ_LEN - 0.6, 0.8, AQ_DEP - 0.6),
	Position = Vector3.new(AQ_CX, standTop + 0.4, AQ_CZ),
	Color = Color3.fromRGB(232, 214, 168), Material = Enum.Material.Sand, Parent = aquarium,
})
-- كتلة الماء (شفّافة مزرقّة)
local aqWater = newPart({
	Name = "AqWater", Size = Vector3.new(AQ_LEN - 0.4, AQ_H - 0.6, AQ_DEP - 0.4),
	Position = Vector3.new(AQ_CX, waterCY, AQ_CZ),
	Color = Color3.fromRGB(95, 190, 230), Material = Enum.Material.Glass,
	Transparency = 0.55, Reflectance = 0.05, CanCollide = false, Parent = aquarium,
})
-- جدران زجاجية + إطار
local function glassPane(name, size, pos)
	newPart({ Name = name, Size = size, Position = pos, Color = Color3.fromRGB(220, 240, 255),
		Material = Enum.Material.Glass, Transparency = 0.78, Reflectance = 0.25, Parent = aquarium })
end
glassPane("AqFront", Vector3.new(AQ_LEN, AQ_H, 0.2), Vector3.new(AQ_CX, waterCY, AQ_CZ + AQ_DEP / 2))
glassPane("AqBack",  Vector3.new(AQ_LEN, AQ_H, 0.2), Vector3.new(AQ_CX, waterCY, AQ_CZ - AQ_DEP / 2))
glassPane("AqLeft",  Vector3.new(0.2, AQ_H, AQ_DEP), Vector3.new(AQ_CX - AQ_LEN / 2, waterCY, AQ_CZ))
glassPane("AqRight", Vector3.new(0.2, AQ_H, AQ_DEP), Vector3.new(AQ_CX + AQ_LEN / 2, waterCY, AQ_CZ))
-- إطار علوي
newPart({ Name = "AqTopFrame", Size = Vector3.new(AQ_LEN + 0.4, 0.4, AQ_DEP + 0.4),
	Position = Vector3.new(AQ_CX, standTop + AQ_H, AQ_CZ), Color = Color3.fromRGB(30, 26, 42),
	Material = Enum.Material.Metal, Parent = aquarium })

-- صخور ونباتات بالقاع
for i = -1, 1 do
	newPart({ Name = "AqRock", Shape = Enum.PartType.Ball, Size = Vector3.new(2, 1.4, 1.6),
		Position = Vector3.new(AQ_CX + i * 5.5, standTop + 1, AQ_CZ + (i % 2) * 1.2),
		Color = Color3.fromRGB(80, 78, 90), Material = Enum.Material.Slate, Parent = aquarium })
	for j = 0, 2 do
		newPart({ Name = "AqPlant", Size = Vector3.new(0.4, 2.6 + j * 0.5, 0.4),
			Position = Vector3.new(AQ_CX + i * 5.5 + (j - 1) * 0.6, standTop + 1.8, AQ_CZ - 1.4),
			Color = Color3.fromRGB(60, 180, 90), Material = Enum.Material.Grass,
			CanCollide = false, Parent = aquarium })
	end
end

-- إضاءة الحوض
do
	local pl = Instance.new("PointLight")
	pl.Color = Color3.fromRGB(150, 220, 255); pl.Range = 18; pl.Brightness = 1.4
	pl.Parent = aqWater
end

-- 🐟 أسماك ملوّنة تسبح بحركة حيّة
local FISH_COLORS = {
	Color3.fromRGB(255, 140, 40), Color3.fromRGB(255, 210, 70), Color3.fromRGB(240, 80, 110),
	Color3.fromRGB(80, 170, 255), Color3.fromRGB(120, 230, 170), Color3.fromRGB(255, 120, 200),
	Color3.fromRGB(255, 245, 250),
}
local fishes = {}
for i = 1, 7 do
	local col = FISH_COLORS[((i - 1) % #FISH_COLORS) + 1]
	local body = newPart({ Name = "FishBody", Size = Vector3.new(1.5, 0.75, 0.45),
		Color = col, Material = Enum.Material.SmoothPlastic, CanCollide = false, Parent = aquarium })
	local tail = newPart({ Name = "FishTail", Size = Vector3.new(0.55, 0.65, 0.3),
		Color = col, Material = Enum.Material.SmoothPlastic, CanCollide = false, Parent = aquarium })
	table.insert(fishes, {
		body = body, tail = tail,
		x = AQ_CX + math.random(-6, 6),
		baseZ = AQ_CZ + (math.random() - 0.5) * (AQ_DEP - 2.5),
		baseY = waterCY + (math.random() - 0.5) * (AQ_H - 2.5),
		dir = (i % 2 == 0) and 1 or -1,
		speed = 2.4 + math.random() * 1.8,
		phase = math.random() * 6.28,
		zAmp = 0.6 + math.random() * 0.8,
		yAmp = 0.3 + math.random() * 0.5,
	})
end

local RunService = game:GetService("RunService")
local halfLen = (AQ_LEN - 3) / 2
local tClock = 0
RunService.Heartbeat:Connect(function(dt)
	tClock += dt
	for _, f in ipairs(fishes) do
		f.x += f.dir * f.speed * dt
		if f.x > AQ_CX + halfLen then f.x = AQ_CX + halfLen; f.dir = -1 end
		if f.x < AQ_CX - halfLen then f.x = AQ_CX - halfLen; f.dir = 1 end
		local z = f.baseZ + math.sin(tClock * 1.3 + f.phase) * f.zAmp
		local y = f.baseY + math.sin(tClock * 0.9 + f.phase) * f.yAmp
		local face = (f.dir > 0) and 0 or math.pi
		local cf = CFrame.new(f.x, y, z) * CFrame.Angles(0, face, 0)
			* CFrame.Angles(0, 0, math.rad(math.sin(tClock * 6 + f.phase) * 8))
		f.body.CFrame = cf
		f.tail.CFrame = cf * CFrame.new(-1.0, 0, 0)
			* CFrame.Angles(0, math.rad(math.sin(tClock * 9 + f.phase) * 28), 0)
	end
end)

-- 📸 ركن سلفي جنب الحوض
do
	local signPost = newPart({ Name = "SelfiePost", Size = Vector3.new(0.5, 6, 0.5),
		Position = Vector3.new(AQ_CX + AQ_LEN / 2 + 2.5, 3, AQ_CZ + AQ_DEP / 2 + 1.5),
		Color = Color3.fromRGB(36, 30, 54), Material = Enum.Material.Metal, Parent = aquarium })
	local board = newPart({ Name = "SelfieBoard", Size = Vector3.new(7, 3.2, 0.3),
		Position = Vector3.new(AQ_CX + AQ_LEN / 2 + 2.5, 7, AQ_CZ + AQ_DEP / 2 + 1.5),
		Color = Color3.fromRGB(18, 14, 32), Material = Enum.Material.SmoothPlastic, Parent = aquarium })
	board.Orientation = Vector3.new(0, -35, 0)
	local sg = Instance.new("SurfaceGui")
	sg.Face = Enum.NormalId.Front; sg.CanvasSize = Vector2.new(560, 256)
	sg.AlwaysOnTop = false; sg.Parent = board
	local bg = Instance.new("Frame"); bg.Size = UDim2.fromScale(1, 1)
	bg.BackgroundColor3 = Color3.fromRGB(18, 14, 32); bg.Parent = sg
	local st = Instance.new("UIStroke"); st.Color = Color3.fromRGB(255, 120, 200); st.Thickness = 4; st.Parent = bg
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1; t.Size = UDim2.fromScale(1, 1)
	t.Font = Enum.Font.GothamBlack; t.TextScaled = true
	t.TextColor3 = Color3.fromRGB(255, 150, 210)
	t.Text = "📸 صوّر مع الحوض!\n🐟 ابتسم للسمك"
	t.Parent = bg
	local pl = Instance.new("PointLight"); pl.Color = Color3.fromRGB(255, 150, 210)
	pl.Range = 12; pl.Brightness = 1.4; pl.Parent = board
end

----------------------------------------------------------------------
-- بوثات التبرّع (٦)
----------------------------------------------------------------------
local GAME_PASS_ID = 23392852

local boothFolder = Instance.new("Folder")
boothFolder.Name = "DonationBooths"
boothFolder.Parent = city

local boothColors = {
	Color3.fromRGB(231, 76, 60),   -- أحمر
	Color3.fromRGB(52, 152, 219),  -- أزرق
	Color3.fromRGB(241, 196, 15),  -- ذهبي
	Color3.fromRGB(46, 204, 113),  -- أخضر
	Color3.fromRGB(155, 89, 182),  -- بنفسجي
	Color3.fromRGB(255, 121, 198), -- وردي
}
local boothAmounts = { 25, 50, 100, 250, 500, 1000 }

local function buildBooth(index: number, position: Vector3, color: Color3, amount: number)
	local model = Instance.new("Model")
	model.Name = "Booth" .. index
	model.Parent = boothFolder

	local stand = newPart({
		Name = "Stand",
		Size = Vector3.new(8, 6, 6),
		Position = position + Vector3.new(0, 3, 0),
		Color = color,
		Material = Enum.Material.SmoothPlastic,
		Parent = model,
	})
	local counter = newPart({
		Name = "Counter",
		Size = Vector3.new(9, 1, 4),
		Position = position + Vector3.new(0, 4, 3),
		Color = Color3.fromRGB(255, 255, 255),
		Material = Enum.Material.Wood,
		Parent = model,
	})
	-- مظلّة
	local roof = newPart({
		Name = "Roof",
		Size = Vector3.new(11, 1, 9),
		Position = position + Vector3.new(0, 7.5, 0),
		Color = color,
		Material = Enum.Material.Fabric,
		Parent = model,
	})
	-- عمود إشارة نيون
	local sign = newPart({
		Name = "Sign",
		Size = Vector3.new(7, 2, 0.4),
		Position = position + Vector3.new(0, 9, 0),
		Color = color,
		Material = Enum.Material.Neon,
		Parent = model,
	})
	local signGui = Instance.new("SurfaceGui")
	signGui.Face = Enum.NormalId.Front
	signGui.CanvasSize = Vector2.new(400, 120)
	signGui.Parent = sign
	local signLabel = Instance.new("TextLabel")
	signLabel.Size = UDim2.fromScale(1, 1)
	signLabel.BackgroundTransparency = 1
	signLabel.Font = Enum.Font.GothamBlack
	signLabel.Text = "تبرّع 💝"
	signLabel.TextScaled = true
	signLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
	signLabel.Parent = signGui

	model.PrimaryPart = stand

	-- زر التفاعل E
	local promptPart = newPart({
		Name = "PromptPart",
		Size = Vector3.new(4, 4, 1),
		Position = position + Vector3.new(0, 4, 3.2),
		Transparency = 1,
		CanCollide = false,
		Parent = model,
	})
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "DonatePrompt"
	prompt.ActionText = "تبرّع"
	prompt.ObjectText = "بوث التبرّع (" .. tostring(amount) .. " R$)"
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 10
	prompt.RequiresLineOfSight = false
	prompt.Parent = promptPart

	model:SetAttribute("GamePassId", GAME_PASS_ID)
	model:SetAttribute("Amount", amount)
end

-- نوزّع البوثات على حافة الساحة
local boothPositions = {
	Vector3.new(-55, 0, -20),
	Vector3.new(-55, 0, 20),
	Vector3.new(55, 0, -20),
	Vector3.new(55, 0, 20),
	Vector3.new(-25, 0, -55),
	Vector3.new(25, 0, -55),
}
for i = 1, 6 do
	buildBooth(i, boothPositions[i], boothColors[i], boothAmounts[i])
end

----------------------------------------------------------------------
-- مبنى السينما
----------------------------------------------------------------------
local cinema = Instance.new("Model")
cinema.Name = "Cinema"
cinema.Parent = city

-- موقع مركز السينما (خلف الساحة)
local CIN = Vector3.new(0, 0, -130)
local HALL_W, HALL_H, HALL_D = 60, 26, 70

-- الأرضية
local cFloor = newPart({
	Name = "Floor",
	Size = Vector3.new(HALL_W, 1, HALL_D),
	Position = CIN + Vector3.new(0, 0.5, 0),
	Color = Color3.fromRGB(40, 30, 55),
	Material = Enum.Material.Carpet,
	Parent = cinema,
})
-- السقف
local cRoof = newPart({
	Name = "Roof",
	Size = Vector3.new(HALL_W, 1, HALL_D),
	Position = CIN + Vector3.new(0, HALL_H, 0),
	Color = Color3.fromRGB(28, 22, 40),
	Material = Enum.Material.Slate,
	Parent = cinema,
})
-- الجدران
local function wall(name, size, pos)
	return newPart({
		Name = name,
		Size = size,
		Position = pos,
		Color = Color3.fromRGB(55, 45, 75),
		Material = Enum.Material.Concrete,
		Parent = cinema,
	})
end
wall("WallBack", Vector3.new(HALL_W, HALL_H, 1), CIN + Vector3.new(0, HALL_H / 2, -HALL_D / 2))
wall("WallLeft", Vector3.new(1, HALL_H, HALL_D), CIN + Vector3.new(-HALL_W / 2, HALL_H / 2, 0))
wall("WallRight", Vector3.new(1, HALL_H, HALL_D), CIN + Vector3.new(HALL_W / 2, HALL_H / 2, 0))
-- الجدار الأمامي فيه فتحة البوابة (نبنيه قطعتين + أعلى)
wall("WallFrontL", Vector3.new(HALL_W / 2 - 6, HALL_H, 1), CIN + Vector3.new(-(HALL_W / 4 + 3), HALL_H / 2, HALL_D / 2))
wall("WallFrontR", Vector3.new(HALL_W / 2 - 6, HALL_H, 1), CIN + Vector3.new((HALL_W / 4 + 3), HALL_H / 2, HALL_D / 2))
wall("WallFrontTop", Vector3.new(12, HALL_H - 12, 1), CIN + Vector3.new(0, HALL_H - (HALL_H - 12) / 2, HALL_D / 2))

-- واجهة المدخل: درجات + عمودان + مظلّة + لوحة Marquee
local steps = newPart({
	Name = "Steps",
	Size = Vector3.new(24, 2, 8),
	Position = CIN + Vector3.new(0, 1, HALL_D / 2 + 5),
	Color = Color3.fromRGB(230, 225, 215),
	Material = Enum.Material.Marble,
	Parent = cinema,
})
for i, dx in ipairs({ -10, 10 }) do
	newPart({
		Name = "Column" .. i,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(14, 3, 3),
		CFrame = CFrame.new(CIN + Vector3.new(dx, 7, HALL_D / 2 + 3)) * CFrame.Angles(0, 0, math.rad(90)),
		Color = Color3.fromRGB(240, 235, 225),
		Material = Enum.Material.Marble,
		Parent = cinema,
	})
end
local canopy = newPart({
	Name = "Canopy",
	Size = Vector3.new(30, 1, 10),
	Position = CIN + Vector3.new(0, 14, HALL_D / 2 + 4),
	Color = Color3.fromRGB(168, 85, 247),
	Material = Enum.Material.Neon,
	Parent = cinema,
})
local marquee = newPart({
	Name = "Marquee",
	Size = Vector3.new(26, 6, 0.6),
	Position = CIN + Vector3.new(0, 18, HALL_D / 2 + 6),
	Color = Color3.fromRGB(20, 14, 40),
	Material = Enum.Material.SmoothPlastic,
	Parent = cinema,
})
local marqueeGui = Instance.new("SurfaceGui")
marqueeGui.Face = Enum.NormalId.Front
marqueeGui.CanvasSize = Vector2.new(800, 200)
marqueeGui.Parent = marquee
local marqueeLabel = Instance.new("TextLabel")
marqueeLabel.Size = UDim2.fromScale(1, 1)
marqueeLabel.BackgroundTransparency = 1
marqueeLabel.Font = Enum.Font.GothamBlack
marqueeLabel.Text = "🎬 سينما المدينة"
marqueeLabel.TextScaled = true
marqueeLabel.TextColor3 = Color3.fromRGB(255, 205, 70)
marqueeLabel.Parent = marqueeGui

-- شاشة العرض الكبيرة (على الجدار الخلفي)
local screen = newPart({
	Name = "Screen",
	Size = Vector3.new(44, 22, 0.5),
	Position = CIN + Vector3.new(0, 13, -HALL_D / 2 + 1),
	Color = Color3.fromRGB(8, 8, 12),
	Material = Enum.Material.SmoothPlastic,
	Parent = cinema,
})
-- SurfaceGui للشاشة (تعرض النصوص/الصور/الفيديو)
local screenGui = Instance.new("SurfaceGui")
screenGui.Name = "ScreenDisplay"
screenGui.Face = Enum.NormalId.Front
screenGui.CanvasSize = Vector2.new(1280, 640)
screenGui.LightInfluence = 0
screenGui.Parent = screen

-- إطار الصورة (سلايد-شو Decals)
local screenImage = Instance.new("ImageLabel")
screenImage.Name = "Image"
screenImage.Size = UDim2.fromScale(1, 1)
screenImage.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
screenImage.BackgroundTransparency = 0
screenImage.ImageTransparency = 1
screenImage.ScaleType = Enum.ScaleType.Fit
screenImage.Parent = screenGui

-- إطار الفيديو (لو رفع المستخدم فيديو لاحقاً)
local screenVideo = Instance.new("VideoFrame")
screenVideo.Name = "Video"
screenVideo.Size = UDim2.fromScale(1, 1)
screenVideo.BackgroundTransparency = 1
screenVideo.Video = ""
screenVideo.Visible = false
screenVideo.Volume = 1
screenVideo.Parent = screenGui

-- نص العرض (المشاهد الافتراضية + العنوان)
local screenText = Instance.new("TextLabel")
screenText.Name = "Text"
screenText.Size = UDim2.fromScale(1, 1)
screenText.BackgroundTransparency = 1
screenText.Font = Enum.Font.GothamBlack
screenText.Text = "🎬 سينما المدينة\nاضغط البروجكتر لبدء الفيلم"
screenText.TextScaled = false
screenText.TextSize = 64
screenText.TextWrapped = true
screenText.TextColor3 = Color3.fromRGB(255, 255, 255)
screenText.Parent = screenGui

-- توهّج خفيف للشاشة
local screenLight = Instance.new("SurfaceLight")
screenLight.Face = Enum.NormalId.Front
screenLight.Range = 30
screenLight.Brightness = 0
screenLight.Angle = 90
screenLight.Parent = screen

-- البروجكتر (في منتصف القاعة) فيه زر E
local projector = newPart({
	Name = "Projector",
	Size = Vector3.new(4, 3, 6),
	Position = CIN + Vector3.new(0, 6, 18),
	Color = Color3.fromRGB(30, 30, 40),
	Material = Enum.Material.Metal,
	Parent = cinema,
})
local projStand = newPart({
	Name = "ProjectorStand",
	Size = Vector3.new(2, 5, 2),
	Position = CIN + Vector3.new(0, 2.5, 18),
	Color = Color3.fromRGB(20, 20, 28),
	Material = Enum.Material.Metal,
	Parent = cinema,
})
local projPrompt = Instance.new("ProximityPrompt")
projPrompt.Name = "PlayMoviePrompt"
projPrompt.ActionText = "تشغيل الفيلم"
projPrompt.ObjectText = "بروجكتر السينما"
projPrompt.KeyboardKeyCode = Enum.KeyCode.E
projPrompt.HoldDuration = 0.4
projPrompt.MaxActivationDistance = 12
projPrompt.RequiresLineOfSight = false
projPrompt.Parent = projector

-- الكراسي (٣٠ كرسي بصفوف تواجه الشاشة)
local seatsFolder = Instance.new("Folder")
seatsFolder.Name = "Seats"
seatsFolder.Parent = cinema

local rows, perRow = 5, 6
local startZ = CIN.Z + 8
for r = 1, rows do
	for c = 1, perRow do
		local seat = Instance.new("Seat")
		seat.Name = string.format("Seat_%d_%d", r, c)
		seat.Anchored = true
		seat.Size = Vector3.new(4, 1, 4)
		local x = CIN.X + (c - (perRow + 1) / 2) * 6
		local z = startZ - (r - 1) * 8
		local y = 1.5 + (r - 1) * 1.2 -- صفوف مرتفعة تدريجياً
		seat.Position = Vector3.new(x, y, z)
		seat.Color = Color3.fromRGB(120, 40, 60)
		seat.Material = Enum.Material.Fabric
		seat.TopSurface = Enum.SurfaceType.Smooth
		-- مسند الظهر
		local back = newPart({
			Name = "Back",
			Size = Vector3.new(4, 4, 1),
			Position = Vector3.new(x, y + 2, z + 1.5),
			Color = Color3.fromRGB(100, 35, 52),
			Material = Enum.Material.Fabric,
			Parent = seatsFolder,
		})
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = seat
		weld.Part1 = back
		weld.Parent = seat
		seat.Parent = seatsFolder
	end
end

-- لوحة التعليمات العربية (جنب البوابة)
local board = newPart({
	Name = "InstructionBoard",
	Size = Vector3.new(14, 10, 0.5),
	Position = CIN + Vector3.new(-20, 7, HALL_D / 2 + 6),
	Color = Color3.fromRGB(20, 14, 40),
	Material = Enum.Material.SmoothPlastic,
	Parent = cinema,
})
local boardGui = Instance.new("SurfaceGui")
boardGui.Face = Enum.NormalId.Front
boardGui.CanvasSize = Vector2.new(560, 400)
boardGui.Parent = board
local boardBG = Instance.new("Frame")
boardBG.Size = UDim2.fromScale(1, 1)
boardBG.BackgroundColor3 = Color3.fromRGB(20, 14, 40)
boardBG.BorderSizePixel = 0
boardBG.Parent = boardGui
local boardTitle = Instance.new("TextLabel")
boardTitle.Size = UDim2.new(1, 0, 0, 70)
boardTitle.BackgroundTransparency = 1
boardTitle.Font = Enum.Font.GothamBlack
boardTitle.Text = "📜 تعليمات السينما"
boardTitle.TextScaled = true
boardTitle.TextColor3 = Color3.fromRGB(255, 205, 70)
boardTitle.Parent = boardBG
local boardBody = Instance.new("TextLabel")
boardBody.Position = UDim2.new(0, 20, 0, 80)
boardBody.Size = UDim2.new(1, -40, 1, -90)
boardBody.BackgroundTransparency = 1
boardBody.Font = Enum.Font.GothamMedium
boardBody.TextXAlignment = Enum.TextXAlignment.Right
boardBody.TextYAlignment = Enum.TextYAlignment.Top
boardBody.TextWrapped = true
boardBody.Text = table.concat({
	"• اجلس على أي كرسي فاضي داخل القاعة.",
	"• اضغط E على البروجكتر لبدء الفيلم (تُخصم تذكرة واحدة).",
	"• أثناء العرض تنخفض الإضاءة وتُغلق البوابة.",
	"• لا يمكنك القيام من الكرسي حتى ينتهي الفيلم.",
	"• كل لاعب لديه ٣ تذاكر — استخدم الزر الجانبي لأخذ تذكرة كل دقيقتين.",
	"• خذ علبة فشار من البسطة (E) واضغط زر الماوس للأكل.",
	"• استمتع بالعرض! 🍿",
}, "\n\n")
boardBody.TextSize = 22
boardBody.TextColor3 = Color3.fromRGB(235, 230, 255)
boardBody.Parent = boardBG

-- بسطة الفشار (E تعطيك علبة)
local popStand = newPart({
	Name = "PopcornStand",
	Size = Vector3.new(8, 5, 5),
	Position = CIN + Vector3.new(20, 3, HALL_D / 2 - 4),
	Color = Color3.fromRGB(231, 76, 60),
	Material = Enum.Material.SmoothPlastic,
	Parent = cinema,
})
local popSign = newPart({
	Name = "PopcornSign",
	Size = Vector3.new(8, 2, 0.4),
	Position = CIN + Vector3.new(20, 6.5, HALL_D / 2 - 4),
	Color = Color3.fromRGB(255, 205, 70),
	Material = Enum.Material.Neon,
	Parent = cinema,
})
local popGui = Instance.new("SurfaceGui")
popGui.Face = Enum.NormalId.Front
popGui.CanvasSize = Vector2.new(400, 100)
popGui.Parent = popSign
local popLabel = Instance.new("TextLabel")
popLabel.Size = UDim2.fromScale(1, 1)
popLabel.BackgroundTransparency = 1
popLabel.Font = Enum.Font.GothamBlack
popLabel.Text = "🍿 فشار مجاني"
popLabel.TextScaled = true
popLabel.TextColor3 = Color3.fromRGB(120, 40, 20)
popLabel.Parent = popGui
local popPrompt = Instance.new("ProximityPrompt")
popPrompt.Name = "PopcornPrompt"
popPrompt.ActionText = "خذ فشار"
popPrompt.ObjectText = "بسطة الفشار"
popPrompt.KeyboardKeyCode = Enum.KeyCode.E
popPrompt.HoldDuration = 0
popPrompt.MaxActivationDistance = 10
popPrompt.RequiresLineOfSight = false
popPrompt.Parent = popStand

-- الحرّاس عند البوابة (مجسّمات بشرية بسيطة)
local guardsFolder = Instance.new("Folder")
guardsFolder.Name = "Guards"
guardsFolder.Parent = cinema

local function buildGuard(name: string, pos: Vector3)
	local g = Instance.new("Model")
	g.Name = name
	g.Parent = guardsFolder
	local torso = newPart({
		Name = "Torso",
		Size = Vector3.new(3, 4, 1.5),
		Position = pos + Vector3.new(0, 5, 0),
		Color = Color3.fromRGB(30, 30, 40),
		Material = Enum.Material.Fabric,
		Parent = g,
	})
	newPart({
		Name = "Head",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(2, 2, 2),
		Position = pos + Vector3.new(0, 8, 0),
		Color = Color3.fromRGB(240, 200, 160),
		Material = Enum.Material.SmoothPlastic,
		Parent = g,
	})
	newPart({
		Name = "Legs",
		Size = Vector3.new(3, 4, 1.5),
		Position = pos + Vector3.new(0, 2, 0),
		Color = Color3.fromRGB(20, 20, 28),
		Material = Enum.Material.Fabric,
		Parent = g,
	})
	g.PrimaryPart = torso
end
buildGuard("GuardLeft", CIN + Vector3.new(-7, 0, HALL_D / 2 + 2))
buildGuard("GuardRight", CIN + Vector3.new(7, 0, HALL_D / 2 + 2))

-- حاجز البوابة (يُفعّل أثناء الفيلم لمنع الدخول)
local gate = newPart({
	Name = "GateBarrier",
	Size = Vector3.new(12, 12, 1),
	Position = CIN + Vector3.new(0, 6, HALL_D / 2),
	Color = Color3.fromRGB(168, 85, 247),
	Material = Enum.Material.ForceField,
	Transparency = 1,
	CanCollide = false,
	Parent = cinema,
})

----------------------------------------------------------------------
-- أشجار وبالونات للزينة
----------------------------------------------------------------------
local deco = Instance.new("Folder")
deco.Name = "Decoration"
deco.Parent = city

local rng = Random.new()
for i = 1, 10 do
	local angle = (i / 10) * math.pi * 2
	local rad = 85
	local x = math.cos(angle) * rad
	local z = math.sin(angle) * rad
	local trunk = newPart({
		Name = "TreeTrunk" .. i,
		Size = Vector3.new(2, 8, 2),
		Position = Vector3.new(x, 4, z),
		Color = Color3.fromRGB(120, 80, 50),
		Material = Enum.Material.Wood,
		Parent = deco,
	})
	newPart({
		Name = "TreeTop" .. i,
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(10, 10, 10),
		Position = Vector3.new(x, 11, z),
		Color = Color3.fromRGB(60, 170, 80),
		Material = Enum.Material.Grass,
		Parent = deco,
	})
end
for i = 1, 12 do
	local balloon = newPart({
		Name = "Balloon" .. i,
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(3, 4, 3),
		Position = Vector3.new(rng:NextNumber(-60, 60), rng:NextNumber(18, 30), rng:NextNumber(-60, 60)),
		Color = Color3.fromHSV(rng:NextNumber(0, 1), 0.7, 1),
		Material = Enum.Material.SmoothPlastic,
		CanCollide = false,
		Parent = deco,
	})
end

----------------------------------------------------------------------
-- الإضاءة (نهار مشرق) — تُحفظ القيم الأصلية لاستعادتها بعد الفيلم
----------------------------------------------------------------------
Lighting.ClockTime = 14
Lighting.Brightness = 2.5
Lighting.GlobalShadows = true
Lighting.OutdoorAmbient = Color3.fromRGB(140, 140, 150)
Lighting.Ambient = Color3.fromRGB(70, 70, 80)
Lighting.FogEnd = 100000

-- إضاءة داخلية موزّعة في سقف السينما (شبكة منتظمة)
for gx = -2, 2 do
	for gz = -2, 2 do
		local lampPart = newPart({
			Name = "CeilingLamp",
			Size = Vector3.new(3, 0.4, 3),
			Position = CIN + Vector3.new(gx * 12, HALL_H - 0.8, gz * 12),
			Color = Color3.fromRGB(255, 250, 230),
			Material = Enum.Material.Neon,
			Parent = cinema,
		})
		local lampLight = Instance.new("PointLight")
		lampLight.Name = "Lamp"
		lampLight.Color = Color3.fromRGB(255, 245, 220)
		lampLight.Range = 24
		lampLight.Brightness = 1.8
		lampLight.Parent = lampPart
	end
end

----------------------------------------------------------------------
-- علم الجاهزية
----------------------------------------------------------------------
local ready = ReplicatedStorage:FindFirstChild("WorldReady")
if not ready then
	ready = Instance.new("BoolValue")
	ready.Name = "WorldReady"
	ready.Parent = ReplicatedStorage
end
ready.Value = true

print("[WorldBuilder] تم بناء مدينة التبرّعات بنجاح.")
