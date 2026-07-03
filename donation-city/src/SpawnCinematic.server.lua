--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  SPAWN CINEMATIC (Server)                                              ║
	║  المكان: ServerScriptService   ·   النوع: Script                       ║
	║                                                                        ║
	║  الريسبون الملكي على طريقة ببجي (دعم السيرفر):                          ║
	║    • الطائرة الملكية تُبنى من قطع روبلوكس أصلية على العميل             ║
	║      (لا اعتماد على موديل مرفوع — اتجاه ثابت معتدل دائماً).            ║
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

------------------------------------------------------------------------
-- قنوات الاتصال (RemoteEvents)
------------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("SpawnCinematicRemotes")
if not remotes then
	remotes = Instance.new("Folder")
	remotes.Name = "SpawnCinematicRemotes"
	remotes.Parent = ReplicatedStorage
end

local CANOPY_ASSET_ID = 124648818423970

local function loadRoyalCanopyMesh()
    if ReplicatedStorage:FindFirstChild("RoyalCanopyMesh") then
            return
    end

    local asset = nil
    for attempt = 1, 5 do
            local ok, result = pcall(function()
                    return InsertService:LoadAsset(CANOPY_ASSET_ID)
            end)
            if ok and result then
                    asset = result
                    break
            end
            task.wait(2 * attempt)
    end

    if not asset then
            warn("SpawnCinematic: failed to load RoyalCanopyMesh asset")
            return
    end

    local model = asset:FindFirstChildWhichIsA("Model")
    if not model then
            asset:Destroy()
            warn("SpawnCinematic: RoyalCanopyMesh asset did not contain a Model")
            return
    end

    model.Name = "RoyalCanopyMesh"
    for _, inst in ipairs(model:GetDescendants()) do
            if inst:IsA("BasePart") then
                    inst.Anchored = true
            end
    end

    model.Parent = ReplicatedStorage
    asset:Destroy()
end

task.spawn(loadRoyalCanopyMesh)

local landedRemote = remotes:FindFirstChild("Landed")
if not landedRemote then
	landedRemote = Instance.new("RemoteEvent")
	landedRemote.Name = "Landed"
	landedRemote.Parent = remotes
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

print("[SpawnCinematic] جاهز — الريسبون الملكي مدعوم من السيرفر.")
