--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام التذاكر — TICKET SYSTEM (Server)                                 ║
║  المكان: ServerScriptService   ·   النوع: Script                       ║
║                                                                        ║
║  • التذاكر محفوظة بالـ DataStore (تبقى بين الجلسات).                    ║
║  • مكافأة يومية: كل 24 ساعة يحصل اللاعب على 3 تذاكر جديدة تلقائياً.     ║
║  • تُصرف التذاكر على حجز المقاعد (أو الدفع بالكوينز كبديل).             ║
║                                                                        ║
║  API (لباقي السكربتات):                                                ║
║     _G.GetTickets(player)         -> number                            ║
║     _G.UseTicket(player, n?)      -> bool (true إذا نجح الخصم)          ║
║     _G.AddTickets(player, n)                                           ║
║     _G.NotifyPlayer(player, text)                                      ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService  = game:GetService("DataStoreService")

------------------------------------------------------------------------
-- CONFIG
------------------------------------------------------------------------
local CONFIG = {
	MaxTickets    = 10,    -- الحد الأقصى لكل لاعب
	StartTickets  = 3,     -- تذاكر اللاعب الجديد (تُحتسب كأول مكافأة يومية)
	DailyTickets  = 3,     -- تذاكر تُمنح كل 24 ساعة
	DailySeconds  = 86400, -- 24 ساعة بالثواني
	ClaimCooldown = 120,   -- (متوافقية قديمة) ثواني بين كل تذكرة من الزر
}

-- حالة الجلسة (لكل سيرفر) — userId -> { tickets, lastDaily, nextClaimAt }
local sessions = {}

------------------------------------------------------------------------
-- DataStore (حفظ دائم للتذاكر + وقت آخر مكافأة يومية)
------------------------------------------------------------------------
local ticketStore
pcall(function() ticketStore = DataStoreService:GetDataStore("CinemaTickets_v1") end)

local function loadData(userId)
	if not ticketStore then return nil end
	local ok, data = pcall(function() return ticketStore:GetAsync("t_" .. userId) end)
	if ok and type(data) == "table" then return data end
	return nil
end

local function saveData(userId)
	if not ticketStore then return end
	local s = sessions[userId]
	if not s then return end
	for _ = 1, 3 do
		local ok = pcall(function()
			ticketStore:SetAsync("t_" .. userId, { tickets = s.tickets, lastDaily = s.lastDaily })
		end)
		if ok then return end
		task.wait(1)
	end
end

------------------------------------------------------------------------
-- Remotes
------------------------------------------------------------------------
-- نفس النمط الدفاعي في BoothSystem/CinemaServices: لا نُنشئ نسخة مكرّرة لو كانت موجودة
local folder = ReplicatedStorage:FindFirstChild("TicketRemotes")
if not folder then
	folder = Instance.new("Folder")
	folder.Name = "TicketRemotes"
	folder.Parent = ReplicatedStorage
end

local claimRemote = folder:FindFirstChild("ClaimTicket")
if not claimRemote then
	claimRemote = Instance.new("RemoteEvent")
	claimRemote.Name = "ClaimTicket"
	claimRemote.Parent = folder
end

local notifyRemote = folder:FindFirstChild("Notify")
if not notifyRemote then
	notifyRemote = Instance.new("RemoteEvent")
	notifyRemote.Name = "Notify"
	notifyRemote.Parent = folder
end

------------------------------------------------------------------------
-- مزامنة سمات اللاعب للواجهة
------------------------------------------------------------------------
local function syncAttributes(player)
	local s = sessions[player.UserId]
	if not s then return end
	player:SetAttribute("Tickets", s.tickets)
	player:SetAttribute("TicketMax", CONFIG.MaxTickets)
	player:SetAttribute("TicketNextClaim", s.nextClaimAt or 0)
	if s.tickets >= CONFIG.MaxTickets and _G.AwardBadge then
		_G.AwardBadge(player, "TICKETS")
	end
end

-- يمنح المكافأة اليومية إذا مرّت 24 ساعة (يُستدعى عند الدخول ودورياً)
local function applyDailyReward(player)
	local s = sessions[player.UserId]
	if not s then return false end
	local now = os.time()
	if (now - (s.lastDaily or 0)) >= CONFIG.DailySeconds then
		s.tickets = math.clamp(s.tickets + CONFIG.DailyTickets, 0, CONFIG.MaxTickets)
		s.lastDaily = now
		syncAttributes(player)
		notifyRemote:FireClient(player, "🎁 مكافأتك اليومية: +" .. CONFIG.DailyTickets .. " تذاكر! لديك الآن " .. s.tickets .. ".")
		task.spawn(function() saveData(player.UserId) end)
		return true
	end
	return false
end

Players.PlayerAdded:Connect(function(player)
	local saved = loadData(player.UserId)
	local now = os.time()
	if saved then
		sessions[player.UserId] = {
			tickets = math.clamp(saved.tickets or 0, 0, CONFIG.MaxTickets),
			lastDaily = saved.lastDaily or 0,
			nextClaimAt = now + CONFIG.ClaimCooldown,
		}
	else
		-- لاعب جديد: يبدأ بتذاكر ويُحتسب اليوم كأول مكافأة
		sessions[player.UserId] = {
			tickets = CONFIG.StartTickets,
			lastDaily = now,
			nextClaimAt = now + CONFIG.ClaimCooldown,
		}
		notifyRemote:FireClient(player, "🎟️ مرحباً! حصلت على " .. CONFIG.StartTickets .. " تذاكر للبداية.")
		task.spawn(function() saveData(player.UserId) end)
	end
	syncAttributes(player)
	-- امنح المكافأة اليومية إن استحقّت (للاعب العائد بعد 24 ساعة)
	task.wait(0.2)
	applyDailyReward(player)
end)

Players.PlayerRemoving:Connect(function(player)
	saveData(player.UserId)
	sessions[player.UserId] = nil
end)

game:BindToClose(function()
	for userId in pairs(sessions) do
		saveData(userId)
	end
end)

-- فحص دوري للمكافأة اليومية لمن يبقى متصلاً أكثر من 24 ساعة
task.spawn(function()
	while true do
		task.wait(300)
		for _, player in ipairs(Players:GetPlayers()) do
			applyDailyReward(player)
		end
	end
end)

------------------------------------------------------------------------
-- claim handler (زر قديم — غير مستخدم حالياً، مُبقى للتوافق)
------------------------------------------------------------------------
claimRemote.OnServerEvent:Connect(function(player)
	local s = sessions[player.UserId]
	if not s then return end
	if s.tickets >= CONFIG.MaxTickets then
		notifyRemote:FireClient(player, "تذاكرك ممتلئة (" .. CONFIG.MaxTickets .. "/" .. CONFIG.MaxTickets .. ").")
		return
	end
	local now = os.time()
	if now < s.nextClaimAt then
		notifyRemote:FireClient(player, "انتظر قليلاً قبل أخذ تذكرة جديدة.")
		return
	end
	s.tickets += 1
	s.nextClaimAt = now + CONFIG.ClaimCooldown
	syncAttributes(player)
	task.spawn(function() saveData(player.UserId) end)
	notifyRemote:FireClient(player, "✅ حصلت على تذكرة! لديك الآن " .. s.tickets .. ".")
end)

------------------------------------------------------------------------
-- public API
------------------------------------------------------------------------
_G.GetTickets = function(player)
	local s = sessions[player.UserId]
	return s and s.tickets or 0
end

_G.UseTicket = function(player, n)
	n = n or 1
	local s = sessions[player.UserId]
	if not s then return false end
	if s.tickets >= n then
		s.tickets -= n
		syncAttributes(player)
		task.spawn(function() saveData(player.UserId) end)
		return true
	end
	return false
end

_G.AddTickets = function(player, n)
	local s = sessions[player.UserId]
	if not s then return end
	s.tickets = math.clamp(s.tickets + n, 0, CONFIG.MaxTickets)
	syncAttributes(player)
	task.spawn(function() saveData(player.UserId) end)
end

_G.NotifyPlayer = function(player, text)
	notifyRemote:FireClient(player, text)
end

_G.TicketMax = CONFIG.MaxTickets

print("[TicketSystem] Ready — max " .. CONFIG.MaxTickets .. " tickets, daily " .. CONFIG.DailyTickets .. " every " .. CONFIG.DailySeconds .. "s.")
