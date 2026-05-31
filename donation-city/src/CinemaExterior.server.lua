--[[
╔══════════════════════════════════════════════════════════════════════╗
║  الواجهة الخارجية — CINEMA EXTERIOR (Server)                          ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  • واجهة نيون مودرن + أبواب زجاجية أوتوماتيكية تنفتح عند الاقتراب        ║
║  • بوسترات أفلام متبدّلة + شاشة LED خارجية بإعلانات متحركة               ║
║  • موقف سيارات + مقاعد ونباتات + ركن تصوير + مارّة (NPCs) يتمشّون        ║
║  • يُبنى فوق المبنى الموجود (Workspace.Cinema) دون تعديل الداخل          ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace    = game:GetService("Workspace")
local Players       = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local RunService   = game:GetService("RunService")

-- إحداثيات حقيقية مستخرجة من المبنى الموجود
local FRONT_Z   = -110          -- مستوى الجدار الأمامي
local FACE_Z    = FRONT_Z + 1.2 -- الوجه الخارجي (نحو +Z / جهة السپاون)
local GROUND_Y  = 1             -- سطح الساحة
local ENTRY_W   = 14            -- عرض فتحة المدخل

local PURPLE = Color3.fromRGB(168, 85, 247)
local GOLD   = Color3.fromRGB(255, 205, 70)
local CYAN   = Color3.fromRGB(80, 200, 255)
local PINK   = Color3.fromRGB(255, 90, 170)

local ext = Instance.new("Model")
ext.Name = "Exterior"
ext.Parent = Workspace

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
	p.Parent = props.Parent or ext
	return p
end

local function neonStrip(size, pos, color)
	return newPart({ Name = "Neon", Size = size, Position = pos, Color = color,
		Material = Enum.Material.Neon, CanCollide = false })
end

-- يبني واجهة نص على وجهَي اللوحة (Back للجمهور +Z + Front) ليُقرأ النص واضحاً
-- من أي اتجاه يقف فيه اللاعب (يمنع ظهور الكتابة معكوسة أو فارغة).
-- builder(gui) يُستدعى لكل وجه ويُعيد ما يلزم تحديثه لاحقاً (أو nil).
local function dualSurface(part, canvasSize, builder)
	local out = {}
	for _, face in ipairs({ Enum.NormalId.Back, Enum.NormalId.Front }) do
		local g = Instance.new("SurfaceGui")
		g.Face = face
		g.CanvasSize = canvasSize
		g.Parent = part
		out[#out + 1] = builder(g)
	end
	return out
end

----------------------------------------------------------------------
-- شرائط نيون على الواجهة
----------------------------------------------------------------------
for _, dx in ipairs({ -9, 9 }) do
	neonStrip(Vector3.new(0.6, 13, 0.6), Vector3.new(dx, 11, FACE_Z), dx < 0 and PURPLE or CYAN)
end
neonStrip(Vector3.new(30, 0.6, 0.6), Vector3.new(0, 18, FACE_Z), GOLD)
neonStrip(Vector3.new(0.6, 26, 0.6), Vector3.new(-33, 13, FACE_Z), PINK)
neonStrip(Vector3.new(0.6, 26, 0.6), Vector3.new( 33, 13, FACE_Z), PINK)
neonStrip(Vector3.new(66, 0.6, 0.6), Vector3.new(0, 1.4, FACE_Z), PURPLE)

----------------------------------------------------------------------
-- أبواب زجاجية أوتوماتيكية (تجميلية لا تحبس اللاعب — البوابة الأصلية تتكفّل بالمنع)
----------------------------------------------------------------------
local function makeDoor(name, closedX, openX)
	local closed = Vector3.new(closedX, 7, FRONT_Z + 0.6)
	local open   = Vector3.new(openX,   7, FRONT_Z + 0.6)
	local d = newPart({ Name = name, Size = Vector3.new(6.6, 12, 0.4), Position = closed,
		Color = CYAN, Material = Enum.Material.Glass, Transparency = 0.45, CanCollide = false })
	neonStrip(Vector3.new(6.8, 0.4, 0.5), closed + Vector3.new(0, 6, 0), CYAN)
	return d, closed, open
end
local lDoor, lClosed, lOpen = makeDoor("AutoDoorL", -3.4, -7.5)
local rDoor, rClosed, rOpen = makeDoor("AutoDoorR",  3.4,  7.5)

local doorsOpen = false
local doorCenter = Vector3.new(0, 4, FRONT_Z + 1)
local function setDoors(open)
	if open == doorsOpen then return end
	doorsOpen = open
	local ti = TweenInfo.new(0.5, Enum.EasingStyle.Quad)
	TweenService:Create(lDoor, ti, { Position = open and lOpen or lClosed }):Play()
	TweenService:Create(rDoor, ti, { Position = open and rOpen or rClosed }):Play()
end
task.spawn(function()
	while true do
		local near = false
		for _, p in ipairs(Players:GetPlayers()) do
			local hrp = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
			if hrp and (hrp.Position - doorCenter).Magnitude < 18 then near = true break end
		end
		setDoors(near)
		task.wait(0.3)
	end
end)

----------------------------------------------------------------------
-- بوسترات أفلام على جانبي المدخل (تتبدّل تلقائياً)
----------------------------------------------------------------------
local POSTERS = {
	{ "🎬 مدينة التبرعات", "دراما عائلية", PURPLE },
	{ "🌌 ليل النيون",      "خيال علمي",   CYAN },
	{ "🏆 أبطال المدينة",   "مغامرة",      GOLD },
	{ "❤️ قلوب كريمة",      "رومانسي",     PINK },
}
local function makePoster(x)
	local board = newPart({ Name = "Poster", Size = Vector3.new(8, 12, 0.4),
		Position = Vector3.new(x, 11, FACE_Z), Color = Color3.fromRGB(14, 10, 26) })
	neonStrip(Vector3.new(8.6, 12.6, 0.3), Vector3.new(x, 11, FACE_Z - 0.1), PURPLE)
	local titles, genres = {}, {}
	dualSurface(board, Vector2.new(400, 600), function(g)
		local title = Instance.new("TextLabel")
		title.Size = UDim2.new(1, -16, 0, 140); title.Position = UDim2.fromOffset(8, 40)
		title.BackgroundTransparency = 1; title.Font = Enum.Font.GothamBlack; title.TextScaled = true
		title.TextWrapped = true; title.TextColor3 = GOLD; title.Parent = g
		local genre = Instance.new("TextLabel")
		genre.Size = UDim2.new(1, -16, 0, 70); genre.Position = UDim2.new(0, 8, 1, -100)
		genre.BackgroundTransparency = 1; genre.Font = Enum.Font.GothamBold; genre.TextScaled = true
		genre.TextColor3 = CYAN; genre.Parent = g
		table.insert(titles, title); table.insert(genres, genre)
	end)
	return titles, genres
end
local tL, gL = makePoster(-20)
local tR, gR = makePoster(20)
local function setPoster(titles, genres, data)
	for _, lbl in ipairs(titles) do lbl.Text = data[1]; lbl.TextColor3 = data[3] end
	for _, lbl in ipairs(genres) do lbl.Text = data[2] end
end
task.spawn(function()
	local i = 0
	while true do
		setPoster(tL, gL, POSTERS[(i % #POSTERS) + 1])
		setPoster(tR, gR, POSTERS[((i + 1) % #POSTERS) + 1])
		i += 1
		task.wait(6)
	end
end)

----------------------------------------------------------------------
-- شاشة LED خارجية (عمود + لوحة) بإعلانات متحركة
----------------------------------------------------------------------
newPart({ Name = "LedPole", Size = Vector3.new(2, 24, 2), Position = Vector3.new(-52, 12, -88),
	Color = Color3.fromRGB(40, 34, 60), Material = Enum.Material.Metal })
local led = newPart({ Name = "LedBillboard", Size = Vector3.new(28, 16, 1),
	Position = Vector3.new(-52, 28, -88), Color = Color3.fromRGB(8, 6, 16) })
led.Orientation = Vector3.new(0, 35, 0)
do
	local panels = dualSurface(led, Vector2.new(700, 400), function(g)
		local bg = Instance.new("Frame"); bg.Size = UDim2.fromScale(1, 1)
		bg.BackgroundColor3 = Color3.fromRGB(10, 8, 20); bg.Parent = g
		local msg = Instance.new("TextLabel")
		msg.Size = UDim2.fromScale(1, 1); msg.BackgroundTransparency = 1
		msg.Font = Enum.Font.GothamBlack; msg.TextScaled = true; msg.TextWrapped = true
		msg.TextColor3 = GOLD; msg.Parent = bg
		return { msg = msg, bg = bg }
	end)
	local ADS = {
		{ "🍿 بوفيه السينما\nفشار + مشروب", GOLD },
		{ "⭐ عضوية VIP\nمقاعد ذهبية ومزايا حصرية", PURPLE },
		{ "🎟️ احجز مقعدك الآن\nأفضل تجربة سينمائية", CYAN },
		{ "🎉 عروض اليوم\nأفلام جديدة باستمرار", PINK },
	}
	task.spawn(function()
		local i = 0
		while true do
			local ad = ADS[(i % #ADS) + 1]
			for _, p in ipairs(panels) do
				p.msg.Text = ad[1]; p.msg.TextColor3 = ad[2]
				p.bg.BackgroundColor3 = ad[2]:Lerp(Color3.new(0, 0, 0), 0.85)
			end
			i += 1
			task.wait(4)
		end
	end)
end

----------------------------------------------------------------------
-- موقف سيارات (أسفلت + خطوط + سيارات)
----------------------------------------------------------------------
newPart({ Name = "ParkingLot", Size = Vector3.new(44, 0.4, 40), Position = Vector3.new(50, 1.15, -78),
	Color = Color3.fromRGB(38, 38, 44), Material = Enum.Material.Asphalt })
for i = -2, 2 do
	newPart({ Name = "LotLine", Size = Vector3.new(0.4, 0.1, 36), Position = Vector3.new(50 + i * 8.5, 1.4, -78),
		Color = Color3.fromRGB(240, 230, 120), CanCollide = false })
end
local carColors = { Color3.fromRGB(220, 60, 70), Color3.fromRGB(70, 120, 230),
	Color3.fromRGB(245, 200, 70), Color3.fromRGB(60, 200, 140) }
for i = 1, 4 do
	local cx = 50 + (i - 2.5) * 8.5
	local cz = -78 + (i % 2 == 0 and 9 or -9)
	local col = carColors[i]
	newPart({ Name = "CarBody", Size = Vector3.new(5, 2.4, 9), Position = Vector3.new(cx, 2.6, cz),
		Color = col })
	newPart({ Name = "CarCabin", Size = Vector3.new(4.4, 2, 4.5), Position = Vector3.new(cx, 4.6, cz - 0.5),
		Color = col:Lerp(Color3.new(0, 0, 0), 0.25), Material = Enum.Material.Glass, Transparency = 0.25 })
	for _, wz in ipairs({ -3, 3 }) do
		for _, wx in ipairs({ -2.4, 2.4 }) do
			newPart({ Name = "Wheel", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.6, 1.8, 1.8),
				CFrame = CFrame.new(cx + wx, 1.6, cz + wz) * CFrame.Angles(0, 0, math.rad(90)),
				Color = Color3.fromRGB(20, 20, 24) })
		end
	end
end

----------------------------------------------------------------------
-- مقاعد + نباتات أمام المدخل
----------------------------------------------------------------------
for _, dx in ipairs({ -28, 28 }) do
	-- المقعد على الجهة اليمنى فقط؛ الجهة اليسرى فيها لوحة «قوانين وتعليمات السينما»
	-- فلا حاجة لمقعد يزدحم بجانبها (يبقى نباتٌ خفيف لتأثيث المكان بشكل مرتّب).
	if dx > 0 then
		newPart({ Name = "Bench", Size = Vector3.new(10, 0.6, 3), Position = Vector3.new(dx, 2.3, -98),
			Color = Color3.fromRGB(120, 80, 55), Material = Enum.Material.Wood })
		newPart({ Name = "BenchBack", Size = Vector3.new(10, 3, 0.6), Position = Vector3.new(dx, 3.8, -99.2),
			Color = Color3.fromRGB(120, 80, 55), Material = Enum.Material.Wood })
	end
	for _, px in ipairs({ -5.5, 5.5 }) do
		newPart({ Name = "Pot", Size = Vector3.new(2.4, 2.4, 2.4), Position = Vector3.new(dx + px, 2.2, -94),
			Color = Color3.fromRGB(90, 70, 60), Material = Enum.Material.Slate })
		newPart({ Name = "Plant", Shape = Enum.PartType.Ball, Size = Vector3.new(4, 5, 4),
			Position = Vector3.new(dx + px, 5, -94), Color = Color3.fromRGB(60, 175, 85),
			Material = Enum.Material.Grass, CanCollide = false })
	end
end

----------------------------------------------------------------------
-- ركن التصوير (Selfie Spot)
----------------------------------------------------------------------
-- يوضع على يمين المدخل في مساحة مفتوحة حتى لا يتداخل مع لوحة «قوانين السينما» (يسار المدخل)
local selfie = newPart({ Name = "SelfieWall", Size = Vector3.new(12, 10, 0.6),
	Position = Vector3.new(44, 6, -100), Color = Color3.fromRGB(18, 12, 34) })
selfie.Orientation = Vector3.new(0, -25, 0)
do
	-- نص على الوجهين بإطار نيون داخلي (بدل لوح النيون الذي كان يغطّي الكتابة)
	dualSurface(selfie, Vector2.new(500, 420), function(g)
		local bg = Instance.new("Frame"); bg.Size = UDim2.fromScale(1, 1)
		bg.BackgroundColor3 = Color3.fromRGB(18, 12, 34); bg.Parent = g
		local st = Instance.new("UIStroke"); st.Color = PINK; st.Thickness = 6; st.Parent = bg
		local t = Instance.new("TextLabel"); t.Size = UDim2.fromScale(1, 1); t.BackgroundTransparency = 1
		t.Font = Enum.Font.GothamBlack; t.Text = "📸 ركن التصوير"; t.TextScaled = true
		t.TextColor3 = PINK; t.Parent = bg
	end)
	-- توهّج وردي ناعم خلف اللوحة
	local pl = Instance.new("PointLight"); pl.Color = PINK; pl.Range = 16; pl.Brightness = 1.3; pl.Parent = selfie
end

----------------------------------------------------------------------
-- مارّة (NPCs) يتمشّون أمام السينما (تجميلي)
----------------------------------------------------------------------
local function buildStroller(name, x, z, col)
	local m = Instance.new("Model"); m.Name = name; m.Parent = ext
	local root = newPart({ Name = "Root", Size = Vector3.new(2, 4, 1), Position = Vector3.new(x, 4, z),
		Color = col, Parent = m })
	newPart({ Name = "Head", Shape = Enum.PartType.Ball, Size = Vector3.new(1.6, 1.6, 1.6),
		Position = Vector3.new(x, 6.6, z), Color = Color3.fromRGB(245, 220, 190), Parent = m })
	newPart({ Name = "Legs", Size = Vector3.new(1.8, 3, 1), Position = Vector3.new(x, 1.5, z),
		Color = Color3.fromRGB(40, 40, 60), Parent = m })
	m.PrimaryPart = root
	return m
end
local strollers = {
	{ m = buildStroller("Walker1", -12, -85, PURPLE), baseX = -12, z = -85, range = 22 },
	{ m = buildStroller("Walker2",  16, -78, CYAN),   baseX = 16,  z = -78, range = 18 },
	{ m = buildStroller("Walker3",   0, -72, GOLD),   baseX = 0,   z = -72, range = 26 },
}
task.spawn(function()
	local t0 = os.clock()
	while true do
		local t = os.clock() - t0
		for i, s in ipairs(strollers) do
			if s.m and s.m.PrimaryPart then
				local offset = math.sin(t * 0.4 + i) * s.range
				local face = math.cos(t * 0.4 + i) >= 0 and 90 or -90
				s.m:PivotTo(CFrame.new(Vector3.new(s.baseX + offset, 4, s.z)) * CFrame.Angles(0, math.rad(face), 0))
			end
		end
		RunService.Heartbeat:Wait()
	end
end)
