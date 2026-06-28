--[[
	BOUNDARY SYSTEM (Server) — حدود مدينة شهد
	يوضع في: ServerScriptService (Script, RunContext = Server)

	ثلاث طبقات حماية لحافة المدينة:
	  (1) حاجز خفي صلب على كامل المحيط — يمنع اللاعب من الخروج أو رمي نفسه.
	  (2) سور زجاجي ذهبي مرئي خفيف — يوضّح أين تنتهي المدينة (هوية ملكية).
	  (3) شبكة أمان للسقوط — لو نزل تحت حدّ معيّن لأي سبب يُعاد للسبون
	      بنعومة بدون شاشة موت ولا خسارة.
]]

local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local BOUND    = 196          -- نصف امتداد الحدّ (الأرض 400×400 ومركزها الأصل)
local WALL_H   = 60           -- ارتفاع الجدار الخفي (عالٍ ليمنع القفز/التسلّق)
local WALL_T   = 4            -- سُمك الجدار
local POST_H   = 7            -- ارتفاع عمود السور المرئي
local POST_GAP = 16           -- المسافة بين أعمدة السور
local FALL_Y   = -40          -- حدّ السقوط: تحت هذا الارتفاع يُنقذ اللاعب

local GOLD_C  = Color3.fromRGB(214, 175, 92)
local GOLD_HI = Color3.fromRGB(245, 220, 150)
local GLASS_C = Color3.fromRGB(150, 200, 235)

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
-- (1) الحاجز الخفي الصلب — أربعة جدران على المحيط
----------------------------------------------------------------------
local sides = {
	{ Size = Vector3.new(BOUND * 2 + WALL_T, WALL_H, WALL_T), Pos = Vector3.new(0, WALL_H / 2,  BOUND) },
	{ Size = Vector3.new(BOUND * 2 + WALL_T, WALL_H, WALL_T), Pos = Vector3.new(0, WALL_H / 2, -BOUND) },
	{ Size = Vector3.new(WALL_T, WALL_H, BOUND * 2 + WALL_T), Pos = Vector3.new( BOUND, WALL_H / 2, 0) },
	{ Size = Vector3.new(WALL_T, WALL_H, BOUND * 2 + WALL_T), Pos = Vector3.new(-BOUND, WALL_H / 2, 0) },
}
for i, s in ipairs(sides) do
	newPart({
		Name = "BoundWall" .. i,
		Size = s.Size,
		Position = s.Pos,
		Transparency = 1,       -- غير مرئي
		CanCollide = true,      -- يصدّ اللاعب
		CastShadow = false,
	})
end

----------------------------------------------------------------------
-- (2) سور زجاجي ذهبي مرئي خفيف — أعمدة + قمم تاج + ألواح زجاجية
----------------------------------------------------------------------
local function railRun(fromX: number, fromZ: number, toX: number, toZ: number)
	local dx, dz = toX - fromX, toZ - fromZ
	local length = math.sqrt(dx * dx + dz * dz)
	local steps = math.max(1, math.floor(length / POST_GAP))
	local spacing = length / steps
	local panelH = POST_H - 1.6
	for k = 0, steps do
		local t = k / steps
		local px, pz = fromX + dx * t, fromZ + dz * t
		newPart({
			Name = "FencePost",
			Size = Vector3.new(0.8, POST_H, 0.8),
			Position = Vector3.new(px, POST_H / 2, pz),
			Color = GOLD_C, Material = Enum.Material.Metal,
			CanCollide = false, CastShadow = false,
		})
		newPart({
			Name = "FenceCap",
			Size = Vector3.new(1.3, 0.6, 1.3),
			Position = Vector3.new(px, POST_H + 0.3, pz),
			Color = GOLD_HI, Material = Enum.Material.Metal,
			CanCollide = false, CastShadow = false,
		})
		if k < steps then
			local nt = (k + 1) / steps
			local nx, nz = fromX + dx * nt, fromZ + dz * nt
			local mx, mz = (px + nx) / 2, (pz + nz) / 2
			local cy = panelH / 2 + 0.4
			local panel = newPart({
				Name = "FenceGlass",
				Size = Vector3.new(0.25, panelH, spacing),
				Color = GLASS_C, Material = Enum.Material.Glass,
				Transparency = 0.55,
				CanCollide = false, CastShadow = false,
			})
			panel.CFrame = CFrame.new(Vector3.new(mx, cy, mz), Vector3.new(nx, cy, nz))
		end
	end
end
railRun(-BOUND,  BOUND,  BOUND,  BOUND)
railRun(-BOUND, -BOUND,  BOUND, -BOUND)
railRun( BOUND, -BOUND,  BOUND,  BOUND)
railRun(-BOUND, -BOUND, -BOUND,  BOUND)

----------------------------------------------------------------------
-- (3) شبكة أمان للسقوط — يُعاد للسبون بنعومة بلا موت
----------------------------------------------------------------------
local function spawnCFrame(): CFrame
	local spawn = Workspace:FindFirstChild("MainSpawn", true)
	if spawn and spawn:IsA("BasePart") then
		return spawn.CFrame + Vector3.new(0, 6, 0)
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

print("[BoundarySystem] حدود مدينة شهد جاهزة (حاجز خفي + سور ذهبي + شبكة أمان).")
