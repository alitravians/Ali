--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  SPAWN CINEMATIC (Server)                                              ║
	║  المكان: ServerScriptService   ·   النوع: Script                       ║
	║                                                                        ║
	║  الريسبون الملكي على طريقة ببجي (دعم السيرفر):                          ║
	║    • يحمّل جسم الطائرة (MeshPart) المرفوع على حساب المالك مرّة واحدة     ║
	║      ويضعه قالباً في ReplicatedStorage ليستنسخه كل لاعب محلياً.         ║
	║    • يبني منصّة هبوط ملكية ثابتة على حدود الماب (Raycast لأرض آمنة).     ║
	║    • يمنح شارة «أول هبوط» عند أول هبوط ناجح (آمن لو الشارة غير منشأة).   ║
	║                                                                        ║
	║  المشهد نفسه (كاميرا/فيزياء/HUD) يُدار على العميل لكل لاعب على حدة      ║
	║  (مشهد فردي) — SpawnCinematic (Client).                                ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local Players          = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local InsertService    = game:GetService("InsertService")
local Workspace        = game:GetService("Workspace")

-- معرّف موديل الطائرة الملكية (مرفوع عبر Open Cloud على حساب المالك، معتمَد).
local PLANE_ASSET_ID = 130978289788461

-- نقطة الهبوط الثابتة على حدود الماب (الأرض 400×400، حوافها عند ±200).
local LANDING_XZ = Vector2.new(150, -150)

------------------------------------------------------------------------
-- قنوات الاتصال (RemoteEvents)
------------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("SpawnCinematicRemotes")
if not remotes then
	remotes = Instance.new("Folder")
	remotes.Name = "SpawnCinematicRemotes"
	remotes.Parent = ReplicatedStorage
end

local landedRemote = remotes:FindFirstChild("Landed")
if not landedRemote then
	landedRemote = Instance.new("RemoteEvent")
	landedRemote.Name = "Landed"
	landedRemote.Parent = remotes
end

------------------------------------------------------------------------
-- تحميل جسم الطائرة (MeshPart) وعرضه قالباً في ReplicatedStorage
------------------------------------------------------------------------
-- نختار أكبر MeshPart داخل الموديل المُحمَّل (جسم الطائرة المُدمج).
local function largestMeshPart(root: Instance): MeshPart?
	local best: MeshPart? = nil
	local bestVol = -1
	for _, d in ipairs(root:GetDescendants()) do
		if d:IsA("MeshPart") then
			local s = d.Size
			local vol = s.X * s.Y * s.Z
			if vol > bestVol then
				bestVol = vol
				best = d
			end
		end
	end
	return best
end

local function publishPlaneTemplate()
	if ReplicatedStorage:FindFirstChild("RoyalPlaneMesh") then return end

	local okLoad, loaded = pcall(function()
		return InsertService:LoadAsset(PLANE_ASSET_ID)
	end)
	if not okLoad or not loaded then
		warn("[SpawnCinematic] تعذّر تحميل موديل الطائرة (" .. tostring(loaded) .. ") — العميل سيستعمل طائرة احتياطية بالقطع.")
		return
	end

	local mesh = largestMeshPart(loaded)
	if not mesh then
		warn("[SpawnCinematic] لم يُعثر على MeshPart داخل الموديل المُحمَّل — طائرة احتياطية.")
		loaded:Destroy()
		return
	end

	-- قالب نظيف خفيف: أبيض ناعم، ثابت، بلا اصطدام، يُستنسخ على العميل.
	local template = mesh:Clone()
	template.Name = "RoyalPlaneMesh"
	template.Anchored = true
	template.CanCollide = false
	template.CanQuery = false
	template.CanTouch = false
	template.CastShadow = false
	template.Color = Color3.fromRGB(244, 244, 248)
	template.Material = Enum.Material.SmoothPlastic
	for _, ch in ipairs(template:GetChildren()) do
		if ch:IsA("LuaSourceContainer") or ch:IsA("Decal") or ch:IsA("Texture") then
			ch:Destroy()
		end
	end
	template.Parent = ReplicatedStorage
	loaded:Destroy()
	print(string.format("[SpawnCinematic] جسم الطائرة جاهز كقالب (الحجم الأصلي %.1f×%.1f×%.1f).",
		template.Size.X, template.Size.Y, template.Size.Z))
end

------------------------------------------------------------------------
-- منصّة الهبوط الملكية على حدود الماب
------------------------------------------------------------------------
local function groundYAt(x: number, z: number): number
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { Players }
	local origin = Vector3.new(x, 400, z)
	local result = Workspace:Raycast(origin, Vector3.new(0, -800, 0), params)
	if result then return result.Position.Y end
	return 0
end

local function buildLandingPad()
	if Workspace:FindFirstChild("RoyalLandingPad") then return end
	local gy = groundYAt(LANDING_XZ.X, LANDING_XZ.Y)
	local center = Vector3.new(LANDING_XZ.X, gy + 0.6, LANDING_XZ.Y)

	local model = Instance.new("Model")
	model.Name = "RoyalLandingPad"

	local function disc(name, dia, height, color, material, transparency)
		local p = Instance.new("Part")
		p.Name = name
		p.Shape = Enum.PartType.Cylinder
		p.Size = Vector3.new(height, dia, dia)
		p.CFrame = CFrame.new(center) * CFrame.Angles(0, 0, math.rad(90))
		p.Anchored = true
		p.Color = color
		p.Material = material
		p.Transparency = transparency or 0
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = model
		return p
	end

	local base = disc("Base", 34, 1.2, Color3.fromRGB(236, 232, 224), Enum.Material.Marble, 0)
	base.CanCollide = true
	disc("RingGold", 36, 1.0, Color3.fromRGB(214, 175, 92), Enum.Material.Metal, 0).CanCollide = false
	local glow = disc("Glow", 24, 1.3, Color3.fromRGB(120, 220, 170), Enum.Material.Neon, 0.45)
	glow.CanCollide = false

	model.PrimaryPart = base
	model.Parent = Workspace
	print(string.format("[SpawnCinematic] منصّة الهبوط الملكية جاهزة عند (%.0f, %.1f, %.0f).",
		center.X, center.Y, center.Z))
end

------------------------------------------------------------------------
-- شارة «أول هبوط» عند أول هبوط ناجح
------------------------------------------------------------------------
landedRemote.OnServerEvent:Connect(function(player: Player)
	if typeof(_G.AwardBadge) == "function" then
		_G.AwardBadge(player, "FIRST_LANDING")
	end
end)

------------------------------------------------------------------------
-- إقلاع
------------------------------------------------------------------------
task.spawn(publishPlaneTemplate)
task.spawn(buildLandingPad)

print("[SpawnCinematic] جاهز — الريسبون الملكي مدعوم من السيرفر.")
