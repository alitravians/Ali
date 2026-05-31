--[[
╔══════════════════════════════════════════════════════════════════════╗
║  منطقة ألعاب الأطفال — PLAYGROUND (Server)                            ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  • زحليقة قابلة للاستخدام (سطح منخفض الاحتكاك = انزلاق واقعي) + صوت     ║
║  • مراجيح بمقاعد تتأرجح فعلياً (اللاعب يجلس فتتحرك به)                  ║
║  • دوّار دائري (Merry-go-round) بمقاعد تدور باللاعبين                  ║
║  • ترامبولين بقفز ارتدادي حقيقي + صوت                                  ║
║  • جدار تسلّق صغير (TrussPart قابل للتسلّق) + بيت ألعاب مصغّر          ║
║  • منطقة مستقلة جنوب الساحة، آمنة على الأداء                           ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace  = game:GetService("Workspace")
local RunService = game:GetService("RunService")

local CX, CZ = 0, 130           -- مركز المنطقة (جنوب الساحة)
local GY = 0.8                  -- سطح أرضية اللعب

local SOFT  = Color3.fromRGB(120, 200, 170)
local RED   = Color3.fromRGB(235, 90, 90)
local BLUE  = Color3.fromRGB(90, 150, 235)
local YEL   = Color3.fromRGB(245, 205, 70)
local GRN   = Color3.fromRGB(110, 200, 120)
local WOOD  = Color3.fromRGB(150, 100, 60)
local METAL = Color3.fromRGB(200, 200, 210)

local pg = Instance.new("Model")
pg.Name = "Playground"
pg.Parent = Workspace

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
	p.Parent = props.Parent or pg
	return p
end

local function sound(parent, id, vol)
	local s = Instance.new("Sound")
	s.SoundId = "rbxassetid://" .. id
	s.Volume = vol or 0.6
	s.RollOffMaxDistance = 60
	s.Parent = parent
	return s
end

-- أرضية لعب ناعمة
newPart({ Name = "PlayFloor", Size = Vector3.new(90, 1, 80), Position = Vector3.new(CX, GY, CZ),
	Color = SOFT, Material = Enum.Material.SmoothPlastic })

-- سياج خفيف حول المنطقة
for _, d in ipairs({ { 0, -40, 90, 1 }, { 0, 40, 90, 1 }, { -45, 0, 1, 80 }, { 45, 0, 1, 80 } }) do
	newPart({ Name = "Fence", Size = Vector3.new(d[3], 4, d[4]),
		Position = Vector3.new(CX + d[1], GY + 2, CZ + d[2]), Color = Color3.fromRGB(230, 230, 235),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
end

----------------------------------------------------------------------
-- 🛝 الزحليقة (سطح منخفض الاحتكاك = انزلاق واقعي) + درج صعود
----------------------------------------------------------------------
do
	local sx, sz = CX - 28, CZ - 18
	-- برج علوي
	newPart({ Name = "SlideTower", Size = Vector3.new(7, 12, 7), Position = Vector3.new(sx, GY + 6, sz),
		Color = RED, Material = Enum.Material.SmoothPlastic })
	newPart({ Name = "SlideTop", Size = Vector3.new(8, 1, 8), Position = Vector3.new(sx, GY + 12.5, sz),
		Color = YEL })
	-- درج صعود
	for i = 1, 6 do
		newPart({ Name = "Step", Size = Vector3.new(6, 1, 1.6),
			Position = Vector3.new(sx, GY + 1.5 * i, sz + 4 + i * 1.3), Color = METAL, Material = Enum.Material.Metal })
	end
	-- سطح الانزلاق المائل (احتكاك شبه معدوم)
	local slide = newPart({ Name = "Slide", Size = Vector3.new(6, 1, 22),
		CFrame = CFrame.new(sx, GY + 7, sz - 9) * CFrame.Angles(math.rad(38), 0, 0),
		Color = BLUE, Material = Enum.Material.SmoothPlastic })
	slide.CustomPhysicalProperties = PhysicalProperties.new(0.7, 0.02, 0, 1, 1)  -- friction ≈ 0
	-- حواف جانبية
	for _, ox in ipairs({ -3.2, 3.2 }) do
		local rail = newPart({ Name = "SlideRail", Size = Vector3.new(0.6, 2, 22),
			CFrame = CFrame.new(sx + ox, GY + 7.6, sz - 9) * CFrame.Angles(math.rad(38), 0, 0),
			Color = Color3.fromRGB(255, 255, 255) })
		rail.CustomPhysicalProperties = PhysicalProperties.new(0.7, 0.02, 0, 1, 1)
	end
	-- صوت انزلاق عند لمس السطح
	local swoosh = sound(slide, 5733671759, 0.5)   -- استبدل المعرّف لو رغبت
	local lastPlay = 0
	slide.Touched:Connect(function(hit)
		local hum = hit and hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
		if hum and os.clock() - lastPlay > 1.2 then lastPlay = os.clock(); swoosh:Play() end
	end)
end

----------------------------------------------------------------------
-- 🤸 الترامبولين (قفز ارتدادي حقيقي) + صوت
----------------------------------------------------------------------
local function trampoline(x, z)
	-- إطار
	newPart({ Name = "TrampFrame", Shape = Enum.PartType.Cylinder, Size = Vector3.new(2, 9, 9),
		CFrame = CFrame.new(x, GY + 1, z) * CFrame.Angles(0, 0, math.rad(90)), Color = Color3.fromRGB(40, 40, 60) })
	local mat = newPart({ Name = "TrampMat", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.6, 8, 8),
		CFrame = CFrame.new(x, GY + 2, z) * CFrame.Angles(0, 0, math.rad(90)),
		Color = Color3.fromRGB(30, 30, 40), Material = Enum.Material.SmoothPlastic })
	local boing = sound(mat, 5466166437, 0.6)
	local debounce = {}
	mat.Touched:Connect(function(hit)
		local char = hit and hit.Parent
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if not (hum and hrp) then return end
		local id = char
		if debounce[id] and os.clock() - debounce[id] < 0.4 then return end
		debounce[id] = os.clock()
		local v = hrp.AssemblyLinearVelocity
		hrp.AssemblyLinearVelocity = Vector3.new(v.X, 75, v.Z)
		boing:Play()
	end)
end
trampoline(CX + 26, CZ - 20)
trampoline(CX + 26, CZ - 6)

----------------------------------------------------------------------
-- 🧗 جدار تسلّق صغير (TrussPart قابل للتسلّق) + منصّة علوية
----------------------------------------------------------------------
do
	local wx, wz = CX - 30, CZ + 26
	newPart({ Name = "ClimbBase", Size = Vector3.new(12, 1, 4), Position = Vector3.new(wx, GY + 0.5, wz), Color = WOOD })
	for i = -1, 1 do
		local truss = Instance.new("TrussPart")
		truss.Anchored = true
		truss.Size = Vector3.new(2, 14, 2)
		truss.Position = Vector3.new(wx + i * 3.5, GY + 7.5, wz)
		truss.Color = Color3.fromRGB(255, 140, 60)
		truss.Parent = pg
	end
	newPart({ Name = "ClimbTop", Size = Vector3.new(12, 1, 6), Position = Vector3.new(wx, GY + 14.5, wz + 2), Color = GRN })
end

----------------------------------------------------------------------
-- 🏠 بيت ألعاب مصغّر
----------------------------------------------------------------------
do
	local hx, hz = CX + 28, CZ + 24
	newPart({ Name = "HouseFloor", Size = Vector3.new(12, 1, 12), Position = Vector3.new(hx, GY + 0.5, hz), Color = WOOD })
	-- جدران مع فتحة باب
	newPart({ Name = "HouseWall", Size = Vector3.new(12, 8, 1), Position = Vector3.new(hx, GY + 4.5, hz - 5.5), Color = YEL })
	newPart({ Name = "HouseWall", Size = Vector3.new(1, 8, 12), Position = Vector3.new(hx - 5.5, GY + 4.5, hz), Color = RED })
	newPart({ Name = "HouseWall", Size = Vector3.new(1, 8, 12), Position = Vector3.new(hx + 5.5, GY + 4.5, hz), Color = RED })
	newPart({ Name = "HouseWallA", Size = Vector3.new(4, 8, 1), Position = Vector3.new(hx - 4, GY + 4.5, hz + 5.5), Color = YEL })
	newPart({ Name = "HouseWallB", Size = Vector3.new(4, 8, 1), Position = Vector3.new(hx + 4, GY + 4.5, hz + 5.5), Color = YEL })
	-- سقف هرمي بسيط
	newPart({ Name = "HouseRoof", Size = Vector3.new(14, 1, 14), CFrame = CFrame.new(hx, GY + 9.5, hz), Color = Color3.fromRGB(160, 60, 60) })
	newPart({ Name = "HouseRoofTop", Size = Vector3.new(8, 1, 8), CFrame = CFrame.new(hx, GY + 11, hz) * CFrame.Angles(0, math.rad(45), 0), Color = Color3.fromRGB(140, 50, 50) })
end

----------------------------------------------------------------------
-- 🪑 مقاعد متحركة (مراجيح + دوّار) — مقاعد مثبّتة CFrame واللاعب يُلحَم بها
----------------------------------------------------------------------
-- مرجوحة: مقعد يتأرجح كبندول حول محور علوي
local swings = {}
local function buildSwing(px, pz, facing)
	-- إطار المرجوحة (قائمان + عارضة)
	newPart({ Name = "SwingPost", Size = Vector3.new(0.8, 12, 0.8), Position = Vector3.new(px - 5, GY + 6, pz), Color = METAL, Material = Enum.Material.Metal })
	newPart({ Name = "SwingPost", Size = Vector3.new(0.8, 12, 0.8), Position = Vector3.new(px + 5, GY + 6, pz), Color = METAL, Material = Enum.Material.Metal })
	newPart({ Name = "SwingBar", Size = Vector3.new(11, 0.8, 0.8), Position = Vector3.new(px, GY + 12, pz), Color = METAL, Material = Enum.Material.Metal })
	local pivotY = GY + 11.6
	local armLen = 7
	local seat = Instance.new("Seat")
	seat.Name = "SwingSeat"; seat.Anchored = true; seat.CanCollide = true
	seat.Size = Vector3.new(4, 0.6, 3)
	seat.Color = RED; seat.Material = Enum.Material.SmoothPlastic
	seat.Position = Vector3.new(px, pivotY - armLen, pz)
	seat.Parent = pg
	-- حبلان مرئيان
	for _, ox in ipairs({ -1.6, 1.6 }) do
		newPart({ Name = "SwingRope", Size = Vector3.new(0.18, armLen, 0.18),
			Position = Vector3.new(px + ox, pivotY - armLen / 2, pz), Color = Color3.fromRGB(60, 50, 40), CanCollide = false })
	end
	table.insert(swings, { seat = seat, pivot = Vector3.new(px, pivotY, pz), arm = armLen, phase = #swings * 0.9, facing = facing or 0 })
end
buildSwing(CX - 6, CZ + 4)
buildSwing(CX + 8, CZ + 4, math.pi)

-- دوّار دائري: قرص يدور + مقاعد على المحيط
local roundabout = nil
local roundSeats = {}
do
	local rx, rz = CX, CZ - 30
	local centerY = GY + 1.6
	newPart({ Name = "RoundPole", Size = Vector3.new(1.2, 4, 1.2), Position = Vector3.new(rx, GY + 2, rz), Color = METAL, Material = Enum.Material.Metal })
	roundabout = newPart({ Name = "RoundDisc", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1, 16, 16),
		CFrame = CFrame.new(rx, centerY, rz) * CFrame.Angles(0, 0, math.rad(90)), Color = BLUE, Material = Enum.Material.SmoothPlastic })
	for i = 0, 3 do
		local seat = Instance.new("Seat")
		seat.Name = "RoundSeat"; seat.Anchored = true; seat.CanCollide = true
		seat.Size = Vector3.new(2.6, 0.6, 2.6); seat.Color = YEL; seat.Material = Enum.Material.SmoothPlastic
		seat.Parent = pg
		table.insert(roundSeats, { seat = seat, baseAngle = math.rad(i * 90) })
	end
	roundabout:SetAttribute("CX", rx); roundabout:SetAttribute("CY", centerY + 1); roundabout:SetAttribute("CZ", rz)
end

----------------------------------------------------------------------
-- حلقة التحريك (مراجيح + دوّار) — Heartbeat سلس
----------------------------------------------------------------------
local roundAngle = 0
RunService.Heartbeat:Connect(function(dt)
	local t = os.clock()
	-- مراجيح: بندول
	for _, sw in ipairs(swings) do
		if sw.seat.Parent then
			local theta = math.rad(28) * math.sin(t * 1.6 + sw.phase)
			local cf = CFrame.new(sw.pivot)
				* CFrame.Angles(theta, sw.facing, 0)
				* CFrame.new(0, -sw.arm, 0)
			sw.seat.CFrame = cf
		end
	end
	-- دوّار
	if roundabout and roundabout.Parent then
		roundAngle = (roundAngle + dt * 0.8) % (math.pi * 2)
		local rx = roundabout:GetAttribute("CX")
		local ry = roundabout:GetAttribute("CY")
		local rz = roundabout:GetAttribute("CZ")
		roundabout.CFrame = CFrame.new(rx, ry - 1, rz) * CFrame.Angles(0, 0, math.rad(90)) * CFrame.Angles(roundAngle, 0, 0)
		for _, rs in ipairs(roundSeats) do
			if rs.seat.Parent then
				local a = roundAngle + rs.baseAngle
				rs.seat.CFrame = CFrame.new(rx, ry, rz)
					* CFrame.Angles(0, a, 0)
					* CFrame.new(0, 0, 5.2)
					* CFrame.Angles(0, math.pi, 0)
			end
		end
	end
end)

----------------------------------------------------------------------
-- لوحة ترحيب
----------------------------------------------------------------------
do
	newPart({ Name = "PgSignPost", Size = Vector3.new(1, 9, 1), Position = Vector3.new(CX, GY + 4.5, CZ - 40), Color = WOOD })
	local board = newPart({ Name = "PlaygroundSign", Size = Vector3.new(14, 4, 0.6), Position = Vector3.new(CX, GY + 9.5, CZ - 40), Color = Color3.fromRGB(40, 60, 90) })
	for _, face in ipairs({ Enum.NormalId.Back, Enum.NormalId.Front, Enum.NormalId.Left, Enum.NormalId.Right }) do
		local sg = Instance.new("SurfaceGui"); sg.Face = face; sg.CanvasSize = Vector2.new(820, 240)
		sg.LightInfluence = 0; sg.Adornee = board; sg.Parent = board
		local lbl = Instance.new("TextLabel"); lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
		lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
		lbl.TextColor3 = Color3.fromRGB(255, 225, 150); lbl.Text = "🛝 ساحة الألعاب"; lbl.Parent = sg
	end
end

print("[Playground] ready at", CX, CZ)
