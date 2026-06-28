--[[
	BOUNDARY SYSTEM (Server) — حدود مدينة شهد
	يوضع في: ServerScriptService (Script, RunContext = Server)

	طبقتا حماية لحافة المدينة:
	  (1) حاجز خفي صلب على حدود المدينة الفعلية — يمنع اللاعب من الخروج أو رمي نفسه.
	      يُقاس المحيط تلقائياً من أرضية المدينة الحقيقية وقت التشغيل (مو رقم ثابت)،
	      فيلتفّ الحاجز على آخر نقطة يمشي عليها اللاعب مهما كان شكل الماب.
	  (2) شبكة أمان للسقوط — لو نزل تحت حدّ معيّن لأي سبب يُعاد للسبون
	      بنعومة بدون شاشة موت ولا خسارة.
]]

local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local WALL_H   = 60           -- ارتفاع الجدار الخفي (عالٍ ليمنع القفز/التسلّق)
local WALL_T   = 4            -- سُمك الجدار
local MARGIN   = 1            -- فجوة بسيطة خارج آخر أرض (يخلّي اللاعب يوصل الحافة تماماً)
local FALL_Y   = -40          -- حدّ السقوط: تحت هذا الارتفاع يُنقذ اللاعب

local DEBUG_VISIBLE = true    -- مؤقّت: إظهار الجدران لمعاينة مكانها الفعلي (يُطفأ بعد تأكيد المكان)

----------------------------------------------------------------------
-- قياس امتداد الأرض الفعلي: نمرّ على كل قطعة أرضية مستوية قريبة من
-- مستوى الأرض ونجمع أبعد حوافّها على المحورين X و Z. كذا يلتفّ الحاجز
-- على المدينة الحقيقية (بما فيها الشاطئ/الساحات) مهما كان شكلها.
----------------------------------------------------------------------
local function measureExtents(): (number, number, number, number)
	local xMin, xMax = math.huge, -math.huge
	local zMin, zMax = math.huge, -math.huge
	for _, inst in ipairs(Workspace:GetDescendants()) do
		if inst:IsA("BasePart") and inst.Anchored and inst.CanCollide then
			local s = inst.Size
			local p = inst.Position
			local footprint = s.X * s.Z
			-- أرضية مستوية: مساحة كبيرة، رقيقة عمودياً، وقريبة من مستوى الأرض
			if footprint >= 150 and s.Y <= 22 and p.Y >= -12 and p.Y <= 16 then
				local hx, hz = s.X / 2, s.Z / 2
				if p.X - hx < xMin then xMin = p.X - hx end
				if p.X + hx > xMax then xMax = p.X + hx end
				if p.Z - hz < zMin then zMin = p.Z - hz end
				if p.Z + hz > zMax then zMax = p.Z + hz end
			end
		end
	end
	-- احتياط لو ما لقينا أرضية (قبل بناء العالم): مربّع افتراضي ±200
	if xMin == math.huge then
		return -200, 200, -200, 200
	end
	-- تقييد عقلاني يمنع أي قطعة شاذّة من تمديد الحاجز بعيداً
	xMin = math.max(xMin, -600); xMax = math.min(xMax, 600)
	zMin = math.max(zMin, -600); zMax = math.min(zMax, 600)
	return xMin, xMax, zMin, zMax
end

-- ننتظر بناء عالم WorldBuilder (الأرض «Ground») قبل القياس
local city = Workspace:WaitForChild("City", 20)
if city then
	city:WaitForChild("Ground", 10)
end
task.wait(2) -- مهلة بسيطة ليكمل بقية السكربتات بناء أرضياتها (شاطئ/ساحات)

local xMin, xMax, zMin, zMax = measureExtents()
local cx = (xMin + xMax) / 2
local cz = (zMin + zMax) / 2
local spanX = (xMax - xMin) + 2 * MARGIN
local spanZ = (zMax - zMin) + 2 * MARGIN
local edgeX0 = xMin - MARGIN - WALL_T / 2  -- مركز الجدار الغربي
local edgeX1 = xMax + MARGIN + WALL_T / 2  -- مركز الجدار الشرقي
local edgeZ0 = zMin - MARGIN - WALL_T / 2  -- مركز الجدار الجنوبي
local edgeZ1 = zMax + MARGIN + WALL_T / 2  -- مركز الجدار الشمالي
local fullX = spanX + 2 * WALL_T           -- طول يغطّي الزوايا
local fullZ = spanZ + 2 * WALL_T

----------------------------------------------------------------------
-- مجلّد الحدود (يُعاد بناؤه إن وُجد سابقاً — idempotent)
----------------------------------------------------------------------
local existing = Workspace:FindFirstChild("CityBounds")
if existing then existing:Destroy() end

local bounds = Instance.new("Folder")
bounds.Name = "CityBounds"
bounds.Parent = Workspace

local function newPart(props: { [string]: any }): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.Material = Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do
		(p :: any)[k] = v
	end
	p.Parent = bounds
	return p
end

----------------------------------------------------------------------
-- (1) الحاجز الخفي الصلب — أربعة جدران على المحيط المقيس
----------------------------------------------------------------------
local sides = {
	{ Size = Vector3.new(fullX, WALL_H, WALL_T), Pos = Vector3.new(cx, WALL_H / 2, edgeZ1) },
	{ Size = Vector3.new(fullX, WALL_H, WALL_T), Pos = Vector3.new(cx, WALL_H / 2, edgeZ0) },
	{ Size = Vector3.new(WALL_T, WALL_H, fullZ), Pos = Vector3.new(edgeX1, WALL_H / 2, cz) },
	{ Size = Vector3.new(WALL_T, WALL_H, fullZ), Pos = Vector3.new(edgeX0, WALL_H / 2, cz) },
}
for i, s in ipairs(sides) do
	newPart({
		Name = "BoundWall" .. i,
		Size = s.Size,
		Position = s.Pos,
		Transparency = DEBUG_VISIBLE and 0.45 or 1,
		Color = Color3.fromRGB(255, 40, 40),
		Material = DEBUG_VISIBLE and Enum.Material.Neon or Enum.Material.SmoothPlastic,
		CanCollide = true,      -- يصدّ اللاعب
		CastShadow = false,
	})
end

----------------------------------------------------------------------
-- (2) شبكة أمان للسقوط — يُعاد للسبون بنعومة بلا موت
----------------------------------------------------------------------
local cachedSpawn: BasePart? = nil
local function spawnCFrame(): CFrame
	if not cachedSpawn or not cachedSpawn.Parent then
		local spawn = Workspace:FindFirstChild("MainSpawn", true)
		cachedSpawn = (spawn and spawn:IsA("BasePart")) and spawn or nil
	end
	if cachedSpawn then
		return cachedSpawn.CFrame + Vector3.new(0, 6, 0)
	end
	return CFrame.new(0, 8, 45)
end

local function rescue(char: Model)
	local hrp = char:FindFirstChild("HumanoidRootPart")
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not (hrp and hrp:IsA("BasePart")) or not hum or hum.Health <= 0 then return end
	hrp.AssemblyLinearVelocity = Vector3.zero
	hrp.AssemblyAngularVelocity = Vector3.zero
	hrp.CFrame = spawnCFrame()
end

RunService.Heartbeat:Connect(function()
	for _, plr in ipairs(Players:GetPlayers()) do
		local char = plr.Character
		if char then
			local hrp = char:FindFirstChild("HumanoidRootPart")
			if hrp and hrp:IsA("BasePart") and hrp.Position.Y < FALL_Y then
				rescue(char)
			end
		end
	end
end)

print(string.format(
	"[BoundarySystem] حدود مقيسة: X[%.0f..%.0f] Z[%.0f..%.0f] (حاجز خفي + شبكة أمان).",
	xMin, xMax, zMin, zMax
))
