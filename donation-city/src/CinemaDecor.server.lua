--[[
	CINEMA DECOR — نافورة واقعية + حوض سمك + ركن سلفي (Server)
	يوضع في: ServerScriptService     ·     النوع: Script
	يحذف النافورة الثابتة القديمة ويبني نافورة واقعية بماء متساقط،
	وحوضاً زجاجياً فيه أسماك تسبح بحركة حيّة، وركن سلفي بجانبه.
]]

local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

----------------------------------------------------------------------
-- أداة بناء عامة
----------------------------------------------------------------------
local function newPart(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	for k, v in pairs(props) do
		(p :: any)[k] = v
	end
	return p
end

-- حاوية الديكور
local decor = Instance.new("Folder")
decor.Name = "CinemaDecor"
decor.Parent = Workspace

----------------------------------------------------------------------
-- 1) حذف النافورة الثابتة القديمة
----------------------------------------------------------------------
local OLD_NAMES = {
	FountainBase = true, FountainPillar = true, FountainPool = true,
	FountainTop = true, Fountain = true,
}
for _, inst in ipairs(Workspace:GetDescendants()) do
	if inst:IsA("BasePart") or inst:IsA("Model") then
		if OLD_NAMES[inst.Name] then
			pcall(function() inst:Destroy() end)
		end
	end
end

----------------------------------------------------------------------
-- 2) نافورة واقعية (حوضان متدرّجان + ماء متساقط)
----------------------------------------------------------------------
local fountain = Instance.new("Model")
fountain.Name = "Fountain"
fountain.Parent = decor

local MARBLE = Color3.fromRGB(224, 216, 205)
local WATER_COL = Color3.fromRGB(90, 180, 235)

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
local fWater = newPart({
	Name = "Water", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(0.5, 27.5, 27.5),
	CFrame = CFrame.new(0, 2.5, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = WATER_COL, Material = Enum.Material.Glass, Transparency = 0.35,
	Reflectance = 0.15, Parent = fountain,
})
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

-- إضاءة مائية ناعمة
do
	local pl = Instance.new("PointLight")
	pl.Color = Color3.fromRGB(170, 215, 255)
	pl.Range = 26; pl.Brightness = 1.8; pl.Parent = fSpout
end

-- مرساة غير مدوّرة أعلى الفوهة (لتكون اتجاهات الرذاذ صحيحة نحو الأعلى)
local jetAnchor = newPart({
	Name = "JetAnchor", Size = Vector3.new(0.4, 0.4, 0.4),
	CFrame = CFrame.new(0, 10, 0),
	Transparency = 1, CanCollide = false, Parent = fountain,
})

-- 1) عمود ماء مركزي يطلع للأعلى (Neon شفّاف) — يتنفّس ارتفاعه
local jet = newPart({
	Name = "WaterColumn", Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(4.2, 0.9, 0.9),
	CFrame = CFrame.new(0, 11.5, 0) * CFrame.Angles(0, 0, math.rad(90)),
	Color = Color3.fromRGB(175, 222, 250), Material = Enum.Material.Neon,
	Transparency = 0.4, CanCollide = false, Parent = fountain,
})

-- 2) رذاذ متصاعد يتقوّس ويتساقط (نسيج مدمج مضمون الظهور)
local function spray(att, rate, speed, spread, size0)
	local e = Instance.new("ParticleEmitter")
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	e.Color = ColorSequence.new(Color3.fromRGB(210, 240, 255), Color3.fromRGB(150, 205, 245))
	e.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.1),
		NumberSequenceKeypoint.new(0.75, 0.35),
		NumberSequenceKeypoint.new(1, 1),
	})
	e.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, size0),
		NumberSequenceKeypoint.new(1, size0 * 0.4),
	})
	e.Lifetime = NumberRange.new(1.0, 1.5)
	e.Rate = rate
	e.Speed = NumberRange.new(speed, speed + 5)
	e.SpreadAngle = Vector2.new(spread, spread)
	e.Acceleration = Vector3.new(0, -42, 0)
	e.EmissionDirection = Enum.NormalId.Top
	e.LightEmission = 0.5
	e.Rotation = NumberRange.new(0, 360)
	e.Parent = att
	return e
end

-- نافورة مركزية صاعدة قوية
local topAtt = Instance.new("Attachment")
topAtt.Parent = jetAnchor
spray(topAtt, 95, 24, 9, 0.9)

-- نفّاثات جانبية مائلة للخارج (٦ جهات)
for i = 0, 5 do
	local ang = math.rad(i * 60)
	local a = Instance.new("Attachment")
	a.CFrame = CFrame.new(math.cos(ang) * 0.6, -0.2, math.sin(ang) * 0.6)
		* CFrame.Angles(math.rad(math.cos(ang) * 36), 0, math.rad(-math.sin(ang) * 36))
	a.Parent = jetAnchor
	spray(a, 36, 18, 6, 0.6)
end

-- رذاذ/بخار خفيف عند سطح الماء
local function mist(part, atCFrame)
	local att = Instance.new("Attachment")
	att.CFrame = atCFrame
	att.Parent = part
	local m = Instance.new("ParticleEmitter")
	m.Texture = "rbxasset://textures/particles/smoke_main.dds"
	m.Color = ColorSequence.new(Color3.fromRGB(230, 245, 255))
	m.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.6),
		NumberSequenceKeypoint.new(1, 1),
	})
	m.Size = NumberSequence.new(2.6)
	m.Lifetime = NumberRange.new(0.6, 1.0)
	m.Rate = 16
	m.Speed = NumberRange.new(1, 3)
	m.SpreadAngle = Vector2.new(45, 45)
	m.Parent = att
	return m
end
mist(fWater, CFrame.new(0, 0.5, 0))
mist(fTierWater, CFrame.new(0, 0.5, 0))

-- 3) ماء يتساقط من الحوض العلوي إلى السفلي (ستائر شفّافة حول المحيط)
for i = 0, 7 do
	local ang = math.rad(i * 45)
	newPart({
		Name = "Overflow", Size = Vector3.new(0.5, 4.6, 1.5),
		CFrame = CFrame.new(math.cos(ang) * 5.4, 4.9, math.sin(ang) * 5.4),
		Color = Color3.fromRGB(178, 222, 250), Material = Enum.Material.Glass,
		Transparency = 0.5, CanCollide = false, Parent = fountain,
	})
end

do
	local s = Instance.new("Sound")
	s.SoundId = "rbxassetid://9112627118"
	s.Looped = true; s.Volume = 0.4; s.RollOffMaxDistance = 70
	s.Parent = fBase
	pcall(function() s:Play() end)
end

task.spawn(function()
	local t = 0
	while fWater.Parent do
		t += 0.08
		fWater.Size = Vector3.new(0.5 + 0.12 * math.sin(t), 27.5, 27.5)
		fTierWater.Size = Vector3.new(0.4 + 0.08 * math.sin(t * 1.3), 10, 10)
		if jet.Parent then
			local h = 4.2 + 0.9 * math.sin(t * 1.6)
			jet.Size = Vector3.new(h, 0.9, 0.9)
			jet.CFrame = CFrame.new(0, 9.4 + h / 2, 0) * CFrame.Angles(0, 0, math.rad(90))
		end
		task.wait(0.08)
	end
end)

----------------------------------------------------------------------
-- 3) حوض السمك (Aquarium) + ركن سلفي — جنب النافورة
----------------------------------------------------------------------
local aquarium = Instance.new("Model")
aquarium.Name = "Aquarium"
aquarium.Parent = decor

local AQ_CX, AQ_CZ = 30, 0
local AQ_LEN, AQ_DEP, AQ_H = 18, 7, 5.5
local standTop = 3
local waterCY = standTop + AQ_H / 2

newPart({
	Name = "AqStand", Size = Vector3.new(AQ_LEN + 1.5, standTop, AQ_DEP + 1.5),
	Position = Vector3.new(AQ_CX, standTop / 2, AQ_CZ),
	Color = Color3.fromRGB(40, 34, 54), Material = Enum.Material.Slate, Parent = aquarium,
})
newPart({
	Name = "AqSand", Size = Vector3.new(AQ_LEN - 0.6, 0.8, AQ_DEP - 0.6),
	Position = Vector3.new(AQ_CX, standTop + 0.4, AQ_CZ),
	Color = Color3.fromRGB(232, 214, 168), Material = Enum.Material.Sand, Parent = aquarium,
})
local aqWater = newPart({
	Name = "AqWater", Size = Vector3.new(AQ_LEN - 0.4, AQ_H - 0.6, AQ_DEP - 0.4),
	Position = Vector3.new(AQ_CX, waterCY, AQ_CZ),
	Color = Color3.fromRGB(95, 190, 230), Material = Enum.Material.Glass,
	Transparency = 0.55, Reflectance = 0.05, CanCollide = false, Parent = aquarium,
})
local function glassPane(name, size, pos)
	newPart({ Name = name, Size = size, Position = pos, Color = Color3.fromRGB(220, 240, 255),
		Material = Enum.Material.Glass, Transparency = 0.78, Reflectance = 0.25, Parent = aquarium })
end
glassPane("AqFront", Vector3.new(AQ_LEN, AQ_H, 0.2), Vector3.new(AQ_CX, waterCY, AQ_CZ + AQ_DEP / 2))
glassPane("AqBack",  Vector3.new(AQ_LEN, AQ_H, 0.2), Vector3.new(AQ_CX, waterCY, AQ_CZ - AQ_DEP / 2))
glassPane("AqLeft",  Vector3.new(0.2, AQ_H, AQ_DEP), Vector3.new(AQ_CX - AQ_LEN / 2, waterCY, AQ_CZ))
glassPane("AqRight", Vector3.new(0.2, AQ_H, AQ_DEP), Vector3.new(AQ_CX + AQ_LEN / 2, waterCY, AQ_CZ))
newPart({ Name = "AqTopFrame", Size = Vector3.new(AQ_LEN + 0.4, 0.4, AQ_DEP + 0.4),
	Position = Vector3.new(AQ_CX, standTop + AQ_H, AQ_CZ), Color = Color3.fromRGB(30, 26, 42),
	Material = Enum.Material.Metal, Parent = aquarium })

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

do
	local pl = Instance.new("PointLight")
	pl.Color = Color3.fromRGB(150, 220, 255); pl.Range = 18; pl.Brightness = 1.4
	pl.Parent = aqWater
end

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

do
	newPart({ Name = "SelfiePost", Size = Vector3.new(0.5, 6, 0.5),
		Position = Vector3.new(AQ_CX + AQ_LEN / 2 + 2.5, 3, AQ_CZ + AQ_DEP / 2 + 1.5),
		Color = Color3.fromRGB(36, 30, 54), Material = Enum.Material.Metal, Parent = aquarium })
	local board = newPart({ Name = "SelfieBoard", Size = Vector3.new(7, 3.2, 0.3),
		Position = Vector3.new(AQ_CX + AQ_LEN / 2 + 2.5, 7, AQ_CZ + AQ_DEP / 2 + 1.5),
		Color = Color3.fromRGB(18, 14, 32), Material = Enum.Material.SmoothPlastic, Parent = aquarium })
	board.Orientation = Vector3.new(0, -35, 0)
	local sg = Instance.new("SurfaceGui")
	sg.Face = Enum.NormalId.Back; sg.CanvasSize = Vector2.new(560, 256)
	sg.Parent = board
	local bg = Instance.new("Frame"); bg.Size = UDim2.fromScale(1, 1)
	bg.BackgroundColor3 = Color3.fromRGB(18, 14, 32); bg.Parent = sg
	local st = Instance.new("UIStroke"); st.Color = Color3.fromRGB(255, 120, 200); st.Thickness = 4; st.Parent = bg
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1; t.Size = UDim2.fromScale(1, 1)
	t.Font = Enum.Font.GothamBlack; t.TextScaled = true
	t.TextColor3 = Color3.fromRGB(255, 150, 210)
	t.Text = "📸 صوّر مع الحوض!\n🐟 ابتسم للسمك"
	t.Parent = bg
	-- نسخة على الوجه الآخر ليُقرأ النص من أي اتجاه
	local sgFront = sg:Clone(); sgFront.Face = Enum.NormalId.Front; sgFront.Parent = board
	local pl = Instance.new("PointLight"); pl.Color = Color3.fromRGB(255, 150, 210)
	pl.Range = 12; pl.Brightness = 1.4; pl.Parent = board
end
