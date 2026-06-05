--!nocheck
-- ===== Mock Roblox environment to run REAL feature code from CinemaServices.server.lua =====
local function deepcopy(t)
	if type(t) ~= "table" then return t end
	local c = {}
	for k, v in pairs(t) do c[k] = deepcopy(v) end
	return c
end

-- recorded side-effects
local calls = { awardBuyer = {}, neon = {}, speed = {}, badge = {}, perks = {}, notify = {} }

-- mock DataStore (in-memory, copy-on-read/write like real DataStore)
local _store = {}
local mockStore = {}
function mockStore:GetAsync(key) return deepcopy(_store[key]) end
function mockStore:SetAsync(key, val) _store[key] = deepcopy(val) end
function mockStore:UpdateAsync(key, transform)
	local cur = deepcopy(_store[key])
	local newv = transform(cur)
	if newv ~= nil then _store[key] = deepcopy(newv) end
	return deepcopy(_store[key])
end
local DataStoreService = { GetDataStore = function(self, name) return mockStore end }

-- mock Players
local present = {}
local Players = {
	GetPlayerByUserId = function(self, uid) return present[uid] end,
	GetPlayers = function(self)
		local t = {}; for _, p in pairs(present) do t[#t + 1] = p end; return t
	end,
	PlayerRemoving = { Connect = function(self, fn) end },
}

-- mock MarketplaceService (configurable ownership + failure injection)
local mpOwns = {}
local mp = { fail = false }
local MarketplaceService = {
	UserOwnsGamePassAsync = function(self, uid, id)
		if mp.fail then error("simulated network failure") end
		return mpOwns[uid .. ":" .. id] == true
	end,
}

-- mock task lib
local task = { wait = function() end, spawn = function(f) end, defer = function(f) end }

-- session store
local sessions = {}

-- CONFIG (real game-pass ids)
local CONFIG = {
	SpeedMin = 16, SpeedDefault = 24, SpeedMax = 32,
	BuffetGamePassId = 1861433203, ShowrunnerGamePassId = 1860580500,
	NeonTrailGamePassId = 1862887909, AnnouncerGamePassId = 1860172487,
	SpeedGamePassId = 1861667386,
}

-- stubbed effect functions (record invocations)
local function applyNeonTrail(p) calls.neon[#calls.neon + 1] = p.UserId end
local function applySpeed(p) calls.speed[#calls.speed + 1] = p.UserId end
local function refreshBadge(p) calls.badge[#calls.badge + 1] = p.UserId end
local function sendPerks(p) calls.perks[#calls.perks + 1] = p.UserId end
local function notify(p, msg) calls.notify[#calls.notify + 1] = msg end

-- shadow _G so extracted code's `_G.AwardAchievement` resolves to THIS local table
local _G = {
	AwardAchievement = function(p, name)
		calls.awardBuyer[#calls.awardBuyer + 1] = { uid = p.UserId, name = name }
	end,
}

-- forward declaration (assigned in extracted code)
local applyAllPasses

local function mkPlayer(uid)
	return { UserId = uid, Name = "P" .. uid, DisplayName = "P" .. uid,
		Character = nil, CharacterAdded = { Connect = function(self, fn) end } }
end
-- ===== END preamble; REAL code follows =====
local PASS_DEFS = {
	{ key = "buffet",     id = CONFIG.BuffetGamePassId,     badge = "🍿",
	  msg = "🍿 تم تفعيل «بوفيه مفتوح» — أكل ومشروب مجاني بلا حدود من بسطة الوجبات!" },
	{ key = "showrunner", id = CONFIG.ShowrunnerGamePassId, badge = "🎬",
	  msg = "🎬 تم تفعيل «مالك العرض» — تقدر تبدأ الفيلم بأي وقت من زر «ابدأ العرض»." },
	{ key = "neon",       id = CONFIG.NeonTrailGamePassId,  badge = "✨",
	  msg = "✨ تم تفعيل «أثر نيون» — توهّج حصري سماوي↔وردي يتبع خطواتك!" },
	{ key = "announcer",  id = CONFIG.AnnouncerGamePassId,  badge = "📢",
	  msg = "📢 تم تفعيل «مايك الإعلان» — تقدر تبثّ إعلاناتك لكل اللاعبين." },
	{ key = "speed",      id = CONFIG.SpeedGamePassId,      badge = "⚡",
	  msg = "⚡ تم تفعيل «سرعة البرق» — تحكّم بسرعة مشيك من شريط التمرير داخل المتجر!" },
}

-- منح باقة (تُستدعى عند الدخول لمن يملكها أو بعد إتمام الشراء)
--   awardBuyer=false → لا تُمنح إنجاز "مُشترٍ" (تُستخدم للإهداء من الإدارة، لأن اللاعب لم يشترِ)
local function grantPass(player: Player, key: string, announce: boolean?, awardBuyer: boolean?)
	local s = sessions[player.UserId]
	if not s then return end
	s.passes = s.passes or {}
	if s.passes[key] then return end
	s.passes[key] = true
	if key == "neon" then applyNeonTrail(player) end
	if key == "speed" then
		-- أول مرة: ابدأ بالسرعة الافتراضية إن لم تكن محفوظة، ثم طبّق
		if not tonumber(s.speed) then s.speed = CONFIG.SpeedDefault end
		applySpeed(player)
	end
	refreshBadge(player)
	if awardBuyer ~= false and _G.AwardAchievement then _G.AwardAchievement(player, "buyer") end
	for _, d in ipairs(PASS_DEFS) do
		if d.key == key and announce ~= false then notify(player, d.msg) end
	end
end

-- معرّف الباقة → مفتاحها (للتحقق عند الشراء)
local function passKeyById(id: number): string?
	for _, d in ipairs(PASS_DEFS) do
		if d.id ~= 0 and d.id == id then return d.key end
	end
	return nil
end

------------------------------------------------------------------------
-- 🎁 إهداء/سحب Game Pass من لوحة الإدارة (مجاني، دائم عبر DataStore)
--   • يُخزَّن لكل لاعب بمفتاح مستقل ("u"..uid) → يعمل عبر كل السيرفرات وبعد إعادة التشغيل.
--   • القيمة: { buffet=true, speed=true, ... } مفاتيح الباقات الممنوحة.
--   • الباقة الممنوحة تعطي نفس مزايا الشراء الحقيقي (تمرّ عبر grantPass).
--   • السحب يزيل المنحة فقط؛ لو اللاعب يملك الباص فعلاً من المتجر يبقى عنده.
------------------------------------------------------------------------
local passGrantStore
pcall(function() passGrantStore = DataStoreService:GetDataStore("CinemaPassGrants_v1") end)

-- كاش بالذاكرة: [uid(number)] = { [key]=true }
local passGrants = {}

local function isValidPassKey(key: string?): boolean
	if not key then return false end
	for _, d in ipairs(PASS_DEFS) do if d.key == key then return true end end
	return false
end

-- اسم الباقة للعرض في إشعارات الإدارة
local function passNameByKey(key: string): string
	local NAMES = {
		buffet = "🍿 بوفيه مفتوح", showrunner = "🎬 مالك العرض", neon = "✨ أثر نيون",
		announcer = "📢 مايك الإعلان", speed = "⚡ سرعة البرق",
	}
	return NAMES[key] or key
end

-- تنقية بيانات DataStore لمفاتيح باقات صالحة فقط
local function sanitizeGrants(data: any): { [string]: boolean }
	local g = {}
	if type(data) == "table" then
		for k, v in pairs(data) do
			if v == true and isValidPassKey(tostring(k)) then g[tostring(k)] = true end
		end
	end
	return g
end

-- قراءة منح اللاعب. الحاضر: من الكاش. غير الحاضر: من DataStore مباشرة (لا نخزّن كاشاً يَقدُم).
local function readPassGrants(uid: number): { [string]: boolean }
	if not uid then return {} end
	if passGrants[uid] then return passGrants[uid] end
	local g = {}
	if passGrantStore then
		local ok, data = pcall(function() return passGrantStore:GetAsync("u" .. uid) end)
		if ok then g = sanitizeGrants(data) end
	end
	-- نُبقي الكاش فقط للاعب حاضر في هذا السيرفر (يُمسح عند خروجه)
	if Players:GetPlayerByUserId(uid) then passGrants[uid] = g end
	return g
end

-- تعديل منحة ذرّياً عبر UpdateAsync (يمنع ضياع التحديثات بين السيرفرات). يُرجع true لو تغيّرت الحالة.
local function setGrant(uid: number, key: string, on: boolean): boolean
	if not uid or not isValidPassKey(key) then return false end
	local changed = false
	if passGrantStore then
		local ok = pcall(function()
			passGrantStore:UpdateAsync("u" .. uid, function(old)
				local g = sanitizeGrants(old)
				if on then
					if g[key] then return nil end       -- ممنوحة أصلاً → ألغِ الكتابة
					g[key] = true
				else
					if not g[key] then return nil end   -- غير ممنوحة → ألغِ الكتابة
					g[key] = nil
				end
				changed = true
				return g
			end)
		end)
		if not ok then
			-- فشل الخدمة: طبّق على الكاش كحل احتياطي حتى لا تتعطل التجربة
			local g = passGrants[uid] or {}
			if on ~= (g[key] == true) then g[key] = on or nil; changed = true end
			if Players:GetPlayerByUserId(uid) then passGrants[uid] = g end
			return changed
		end
	else
		-- بدون DataStore (استوديو/اختبار): عدّل الكاش مباشرة
		local g = passGrants[uid] or {}
		if on ~= (g[key] == true) then g[key] = on or nil; changed = true end
		passGrants[uid] = g
		return changed
	end
	-- نجح DataStore: زامن الكاش للحاضر فقط، وامسحه لغير الحاضر
	if changed then
		if Players:GetPlayerByUserId(uid) then
			local g = passGrants[uid] or {}
			g[key] = on or nil
			passGrants[uid] = g
		else
			passGrants[uid] = nil
		end
	end
	return changed
end

-- إزالة مؤثرات باقة من لاعب حاضر (عكس grantPass) — تُستدعى عند السحب فقط
local function removePassEffects(player: Player, key: string)
	local s = sessions[player.UserId]
	if not s then return end
	if s.passes then s.passes[key] = nil end
	if key == "neon" then
		local char = player.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		if root then
			for _, n in ipairs({ "NeonTrail", "NeonTrailTop", "NeonTrailBottom" }) do
				local o = root:FindFirstChild(n); if o then o:Destroy() end
			end
		end
	elseif key == "speed" then
		-- يرجع لغير المالك: السرعة الأساسية = الحد الأدنى
		applySpeed(player)
		local char = player.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then hum.WalkSpeed = CONFIG.SpeedMin end
	end
	refreshBadge(player)
	sendPerks(player)
end

-- إهداء باقة (دائم). يُطبَّق فوراً لو اللاعب حاضر.
local function adminGrantPass(uid: number, key: string): boolean
	if not setGrant(uid, key, true) then return false end  -- ممنوحة أصلاً أو مفتاح غير صالح
	local target = Players:GetPlayerByUserId(uid)
	if target then
		grantPass(target, key, true, false)  -- إهداء مجاني: لا يُمنح إنجاز "مُشترٍ"
		sendPerks(target)  -- حدّث واجهة المزايا فوراً (أزرار العرض/الإعلان/شريط السرعة)
	end
	return true
end

-- سحب باقة ممنوحة. لو يملكها فعلاً من المتجر تبقى له.
local function adminRevokePass(uid: number, key: string): boolean
	if not setGrant(uid, key, false) then return false end  -- غير ممنوحة من الإدارة
	local target = Players:GetPlayerByUserId(uid)
	if target then
		-- نزيل المؤثرات فقط لو تأكّدنا أنه لا يملك الباص من المتجر.
		-- لو فشل التحقق (خطأ شبكة) نُبقي المؤثرات احتياطاً كي لا نسلب باصاً مشترى.
		local pid = 0
		for _, d in ipairs(PASS_DEFS) do if d.key == key then pid = d.id break end end
		local removeFx = true
		if pid ~= 0 then
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(uid, pid)
			end)
			if not ok or owns == true then removeFx = false end  -- فشل التحقق أو يملكه فعلاً → لا تُزال
		end
		if removeFx then removePassEffects(target, key) end
	end
	return true
end

-- نظّف الكاش عند خروج اللاعب (يُعاد التحميل من DataStore عند دخوله مجدداً)
Players.PlayerRemoving:Connect(function(p)
	passGrants[p.UserId] = nil
end)

-- فحص كل الباقات عند دخول اللاعب + تثبيت المؤثرات على كل ظهور للشخصية
applyAllPasses = function(player: Player)
	local s = sessions[player.UserId]
	if not s then return end
	s.passes = s.passes or {}
	for _, d in ipairs(PASS_DEFS) do
		if d.id ~= 0 then
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, d.id)
			end)
			if ok and owns then grantPass(player, d.key, false) end
		end
	end
	-- + الباقات الممنوحة من الإدارة (مجاناً، دائمة عبر DataStore)
	-- awardBuyer=false: إهداء مجاني → لا يُمنح إنجاز «مُشترٍ» عند الدخول
	local granted = readPassGrants(player.UserId)
	for key in pairs(granted) do
		if isValidPassKey(key) then grantPass(player, key, false, false) end
	end
	sendPerks(player)
	applySpeed(player)  -- ⚡ ثبّت السرعة فوراً لو الشخصية موجودة
	-- أعد تطبيق الأثر/الشارة/السرعة عند كل ولادة للشخصية
	player.CharacterAdded:Connect(function()
		task.wait(0.5)
		if s.passes.neon then applyNeonTrail(player) end
		refreshBadge(player)
		applySpeed(player)
	end)
end

-- ===== TEST DRIVER (references preamble/funcs upvalues directly: same chunk) =====
local fails = 0
local total = 0
local function check(name, cond)
	total = total + 1
	if not cond then fails = fails + 1 end
	print((cond and "PASS  " or "FAIL  ") .. name)
end
local function buyerCount(uid)
	local n = 0
	for _, a in ipairs(calls.awardBuyer) do if a.uid == uid and a.name == "buyer" then n = n + 1 end end
	return n
end
local function listed(t, uid)
	for _, v in ipairs(t) do if v == uid then return true end end
	return false
end

local SPEED_ID, BUFFET_ID = 1861667386, 1861433203

print("================ ميزة إهداء/سحب Game Pass — اختبار منطقي =================")

-- T1: grant to present player persists + applies effect + NO buyer achievement
sessions[1] = { passes = {} }; present[1] = mkPlayer(1)
local r1 = adminGrantPass(1, "neon")
check("T1.a adminGrantPass returns true", r1 == true)
check("T1.b grant persisted to DataStore (u1.neon)", _store["u1"] ~= nil and _store["u1"].neon == true)
check("T1.c readPassGrants reflects grant", readPassGrants(1).neon == true)
check("T1.d neon effect applied (applyNeonTrail)", listed(calls.neon, 1))
check("T1.e session marked owning neon", sessions[1].passes.neon == true)
check("T1.f client perks refreshed (sendPerks)", listed(calls.perks, 1))
check("T1.g NO 'buyer' achievement for free gift", buyerCount(1) == 0)

-- T2: grant idempotent (already granted -> false, no double-write)
local r2 = adminGrantPass(1, "neon")
check("T2.a second grant returns false (idempotent)", r2 == false)
check("T2.b still no buyer achievement", buyerCount(1) == 0)

-- T3: grant speed sets default speed, applies, no buyer
local r3 = adminGrantPass(1, "speed")
check("T3.a speed grant true", r3 == true)
check("T3.b session passes.speed", sessions[1].passes.speed == true)
check("T3.c session speed defaulted to 24", sessions[1].speed == 24)
check("T3.d applySpeed invoked", listed(calls.speed, 1))
check("T3.e still no buyer achievement", buyerCount(1) == 0)

-- T4: invalid pass key rejected (no write)
local r4 = adminGrantPass(1, "hacker")
check("T4.a invalid key grant returns false", r4 == false)
check("T4.b invalid key not stored", readPassGrants(1).hacker == nil)

-- T5: revoke keeps effects when player owns pass from store
sessions[2] = { passes = {} }; present[2] = mkPlayer(2)
mpOwns["2:" .. BUFFET_ID] = true            -- owns buffet via marketplace
adminGrantPass(2, "buffet")                  -- admin also gifts it
check("T5.a buffet granted to p2", sessions[2].passes.buffet == true)
local r5 = adminRevokePass(2, "buffet")
check("T5.b revoke returns true (grant existed)", r5 == true)
check("T5.c admin grant removed from store", readPassGrants(2).buffet == nil)
check("T5.d store-owned buffet EFFECT preserved", sessions[2].passes.buffet == true)

-- T6: revoke a purely-granted pass (not store-owned) removes effects
sessions[3] = { passes = {} }; present[3] = mkPlayer(3)
adminGrantPass(3, "neon")
check("T6.a neon granted to p3", sessions[3].passes.neon == true)
local r6 = adminRevokePass(3, "neon")
check("T6.b revoke true", r6 == true)
check("T6.c pure-grant neon effect removed", sessions[3].passes.neon == nil)
check("T6.d grant removed from store", readPassGrants(3).neon == nil)

-- T7: revoke during Marketplace API failure must NOT strip effects (safety)
sessions[4] = { passes = {} }; present[4] = mkPlayer(4)
adminGrantPass(4, "speed")
check("T7.a speed granted to p4", sessions[4].passes.speed == true)
mp.fail = true                               -- simulate ownership-check failure
local r7 = adminRevokePass(4, "speed")
mp.fail = false
check("T7.b revoke still returns true", r7 == true)
check("T7.c grant removed from store", readPassGrants(4).speed == nil)
check("T7.d effect PRESERVED on API failure (no wrongful strip)", sessions[4].passes.speed == true)

-- T8: join-time reapplication of admin grant must NOT award buyer (the rejoin bug fix)
adminGrantPass(5, "showrunner")              -- player 5 OFFLINE when gifted
check("T8.a offline grant persisted", _store["u5"] ~= nil and _store["u5"].showrunner == true)
check("T8.b offline grant not applied yet (no session)", sessions[5] == nil)
sessions[5] = { passes = {} }; present[5] = mkPlayer(5)   -- now p5 joins
applyAllPasses(present[5])
check("T8.c join reapplies admin grant", sessions[5].passes.showrunner == true)
check("T8.d join does NOT award 'buyer' for admin gift", buyerCount(5) == 0)

-- T9: CONTROL — a real marketplace purchase DOES award buyer on join
sessions[6] = { passes = {} }; present[6] = mkPlayer(6)
mpOwns["6:" .. BUFFET_ID] = true
applyAllPasses(present[6])
check("T9.a store-owned buffet applied on join", sessions[6].passes.buffet == true)
check("T9.b real purchase DOES award 'buyer' (control)", buyerCount(6) >= 1)

-- T10: cache hygiene — offline player reads fresh from DataStore (no stale cache)
adminGrantPass(7, "neon")                     -- p7 offline
_store["u7"].speed = true                      -- another server adds 'speed' directly
local g7 = readPassGrants(7)
check("T10.a offline read sees neon", g7.neon == true)
check("T10.b offline read sees externally-added speed (fresh, not stale)", g7.speed == true)

print("=========================================================================")
print(string.format("RESULT: %d/%d checks passed, %d failed", total - fails, total, fails))
if fails > 0 then error("TEST FAILURES: " .. fails) end
