--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  نظام الشارات — BADGE AWARDS (Server)                                  ║
	║  المكان: ServerScriptService   ·   النوع: Script                       ║
	║                                                                        ║
	║  يمنح شارات مدينة التبرعات تلقائياً:                                    ║
	║    • أول زيارة   — بمجرد دخول اللاعب.                                   ║
	║    • صديق المدينة — عند عودة اللاعب للعب مرة ثانية (يُحفظ في DataStore). ║
	║    • متبرّع كريم  — عند أول تبرع (يناديها سكربت البوثات).               ║
	║    • عاشق السينما — عند اكتمال أول فيلم (يناديها سكربت السينما).         ║
	║    • جامع التذاكر — عند بلوغ الحد الأقصى للتذاكر (يناديها نظام التذاكر). ║
	║    • بطل الباركور — عند إكمال مسار الباركور (يناديها نظام الباركور).     ║
	║    • مستكشف المدينة — عند زيارة كل المناطق (يناديها نظام النشاط).        ║
	║    • طاقم المدينة — تكريمية لأعضاء الإدارة/الإشراف (تلقائياً بالدخول).   ║
	║    • أول هبوط — عند أول هبوط بالريسبون الملكي (يناديها SpawnCinematic). ║
	║                                                                        ║
	║  API لباقي السكربتات:  _G.AwardBadge(player, "DONOR")                  ║
	║  المفاتيح: FIRST_VISIT · DONOR · CINEMA · TICKETS · LOYAL              ║
	║           · PARKOUR · EXPLORER · STAFF · FIRST_LANDING                 ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local BadgeService     = game:GetService("BadgeService")
local DataStoreService = game:GetService("DataStoreService")
local Players          = game:GetService("Players")

------------------------------------------------------------------------
-- أرقام الشارات (من لوحة تحكم التجربة)
------------------------------------------------------------------------
local BADGE_IDS = {
	FIRST_VISIT = 4295435737631922,  -- أول زيارة
	DONOR       = 3069178032909925,  -- متبرّع كريم
	CINEMA      = 2250602283618115,  -- عاشق السينما
	TICKETS     = 3455171715645213,  -- جامع التذاكر
	LOYAL       = 2829867823404545,  -- صديق المدينة
	PARKOUR     = 1607820276935635,  -- بطل الباركور
	EXPLORER    = 2250297071909187,  -- مستكشف المدينة
	STAFF       = 1801654870065253,  -- طاقم المدينة
	FIRST_LANDING = 949955161632602, -- أول هبوط الملكي (الريسبون على طريقة ببجي)
}

------------------------------------------------------------------------
-- منح شارة بأمان (يتجاهل لو يملكها اللاعب أصلاً)
------------------------------------------------------------------------
local function awardById(player: Player, badgeId: number)
	if not player or not badgeId or badgeId <= 0 then return end

	local okInfo, has = pcall(function()
		return BadgeService:UserHasBadgeAsync(player.UserId, badgeId)
	end)
	if okInfo and has then return end  -- يملكها بالفعل

	local okAward, awarded = pcall(function()
		return BadgeService:AwardBadge(player.UserId, badgeId)
	end)
	if not okAward then
		warn("[BadgeAwards] فشل منح الشارة " .. tostring(badgeId) .. ": " .. tostring(awarded))
	end
end

-- API عام لباقي السكربتات
_G.AwardBadge = function(player: Player, key: string)
	local id = BADGE_IDS[key]
	if not id then
		warn("[BadgeAwards] مفتاح شارة غير معروف: " .. tostring(key))
		return
	end
	task.spawn(awardById, player, id)
end

------------------------------------------------------------------------
-- الوفاء (صديق المدينة): تتبّع الزيارات عبر DataStore
------------------------------------------------------------------------
local visitsStore
pcall(function()
	visitsStore = DataStoreService:GetDataStore("DonationCity_Visits")
end)

------------------------------------------------------------------------
-- طاقم المدينة: تُمنح تلقائياً لأعضاء الإدارة/الإشراف (owner/admin/mod/staff)
-- نعتمد على نظام الرتب في السينما (_G.GetChatRank) الذي قد يتأخّر بالتحميل،
-- لذلك ننتظره بمحاولات قصيرة قبل الفحص.
------------------------------------------------------------------------
local STAFF_RANKS = { owner = true, admin = true, mod = true, staff = true }

local function tryAwardStaff(player: Player)
	for _ = 1, 20 do                       -- ~10 ثوانٍ كحدّ أقصى
		if not player.Parent then return end  -- خرج اللاعب
		if _G.GetChatRank then
			local ok, rank = pcall(_G.GetChatRank, player)
			if ok and STAFF_RANKS[rank] then
				_G.AwardBadge(player, "STAFF")
			end
			return                          -- نظام الرتب جاهز — انتهينا
		end
		task.wait(0.5)
	end
end

Players.PlayerAdded:Connect(function(player)
	-- أول زيارة — فوراً
	_G.AwardBadge(player, "FIRST_VISIT")

	-- طاقم المدينة — بعد جهوزية نظام الرتب
	task.spawn(tryAwardStaff, player)

	-- صديق المدينة — لو زار من قبل
	if not visitsStore then return end
	local key = "u_" .. player.UserId
	local ok, visited = pcall(function()
		return visitsStore:GetAsync(key)
	end)
	if ok and visited then
		_G.AwardBadge(player, "LOYAL")
	else
		pcall(function()
			visitsStore:SetAsync(key, true)
		end)
	end
end)

print("[BadgeAwards] جاهز — 8 شارات مفعّلة + شارة قيد الإعداد (أول هبوط).")
