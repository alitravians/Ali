--[[
	BOUNDARY SYSTEM (Server) — حدود مدينة شهد
	يوضع في: ServerScriptService (Script, RunContext = Server)

	طبقتا حماية لحافة المدينة:
	  (1) حاجز خفي صلب على كامل المحيط — يمنع اللاعب من الخروج أو رمي نفسه.
	  (2) شبكة أمان للسقوط — لو نزل تحت حدّ معيّن لأي سبب يُعاد للسبون
	      بنعومة بدون شاشة موت ولا خسارة.
]]

local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local BOUND    = 196          -- نصف امتداد الحدّ (الأرض 400×400 ومركزها الأصل)
local WALL_H   = 60           -- ارتفاع الجدار الخفي (عالٍ ليمنع القفز/التسلّق)
local WALL_T   = 4            -- سُمك الجدار
local FALL_Y   = -40          -- حدّ السقوط: تحت هذا الارتفاع يُنقذ اللاعب

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
-- (2) شبكة أمان للسقوط — يُعاد للسبون بنعومة بلا موت
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

print("[BoundarySystem] حدود مدينة شهد جاهزة (حاجز خفي + شبكة أمان).")
