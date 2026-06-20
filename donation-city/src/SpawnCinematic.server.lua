--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  SPAWN CINEMATIC (Server)                                              ║
	║  المكان: ServerScriptService   ·   النوع: Script                       ║
	║                                                                        ║
	║  الريسبون الملكي على طريقة ببجي (دعم السيرفر):                          ║
	║    • يحمّل جسم الطائرة (MeshPart) المرفوع على حساب المالك مرّة واحدة     ║
	║      ويضعه قالباً في ReplicatedStorage ليستنسخه كل لاعب محلياً.         ║
	║    • النزول حرّ: اللاعب يتحكّم وينزل وين ما يبي (لا منصّة هبوط ثابتة).    ║
	║    • يمنح شارة «أول هبوط» عند أول هبوط ناجح (آمن لو الشارة غير منشأة).   ║
	║                                                                        ║
	║  المشهد نفسه (كاميرا/فيزياء/HUD) يُدار على العميل لكل لاعب على حدة      ║
	║  (مشهد فردي) — SpawnCinematic (Client).                                ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local Players          = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local InsertService    = game:GetService("InsertService")

-- معرّف موديل الطائرة الملكية (مرفوع عبر Open Cloud على حساب المالك، معتمَد).
local PLANE_ASSET_ID = 130978289788461

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
-- شارة «أول هبوط» عند أول هبوط ناجح
------------------------------------------------------------------------
-- علم لكل لاعب يمنع تكرار النداء لو أرسل العميل الحدث أكثر من مرّة (حماية من السبام).
local awarded: { [Player]: boolean } = {}
landedRemote.OnServerEvent:Connect(function(player: Player)
	if awarded[player] then return end
	awarded[player] = true
	if typeof(_G.AwardBadge) == "function" then
		_G.AwardBadge(player, "FIRST_LANDING")
	end
end)
Players.PlayerRemoving:Connect(function(player: Player)
	awarded[player] = nil
end)

------------------------------------------------------------------------
-- إقلاع
------------------------------------------------------------------------
task.spawn(publishPlaneTemplate)

print("[SpawnCinematic] جاهز — الريسبون الملكي مدعوم من السيرفر.")
