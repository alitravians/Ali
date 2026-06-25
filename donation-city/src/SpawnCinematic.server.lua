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
