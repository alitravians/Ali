--!nocheck
-- ============================================================================
-- Harness: تحقّق منطق "إشعار الإهداء الاحترافي" من CinemaServices.server.lua
--   • للحاضر: شريط إعلان فوري عبر lobbyRemote (action="giftAward").
--   • للغائب: يُحفظ في طابور دائم (CinemaGiftQueue_v1) ويظهر مرة واحدة أول دخول.
-- يشغّل نسخاً حرفية من الدوال الحقيقية مع محاكاة خدمات Roblox.
-- ============================================================================
local function deepcopy(t)
	if type(t) ~= "table" then return t end
	local c = {}
	for k, v in pairs(t) do c[k] = deepcopy(v) end
	return c
end

-- side-effects recorder
local calls = { perks = {}, fireClient = {}, awardBuyer = {} }

-- mock DataStore factory (in-memory, copy-on-read/write)
local function makeStore()
	local _store = {}
	local s = {}
	function s:GetAsync(key) return deepcopy(_store[key]) end
	function s:SetAsync(key, val) _store[key] = deepcopy(val) end
	function s:UpdateAsync(key, transform)
		local cur = deepcopy(_store[key])
		local newv = transform(cur)
		if newv ~= nil then _store[key] = deepcopy(newv) end
		return deepcopy(_store[key])
	end
	function s:raw() return _store end
	return s
end
local grantStore = makeStore()
local giftStore = makeStore()
local DataStoreService = {
	GetDataStore = function(self, name)
		if name == "CinemaGiftQueue_v1" then return giftStore end
		return grantStore
	end,
}

-- mock Players
local present = {}
local Players = {
	GetPlayerByUserId = function(self, uid) return present[uid] end,
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

-- mock task lib: spawn يُشغّل فوراً + wait بلا تأخير → نلتقط أثر الإشعار فوراً
local task = {
	wait = function() end,
	spawn = function(f, ...) f(...) end,
	defer = function(f, ...) f(...) end,
	delay = function(_, f, ...) f(...) end,
}

-- mock lobbyRemote: نسجّل كل FireClient
local lobbyRemote = {
	FireClient = function(self, player, payload)
		calls.fireClient[#calls.fireClient + 1] = { uid = player.UserId, payload = deepcopy(payload) }
	end,
}

-- sessions + effect stubs
local sessions = {}
local function applyNeonTrail(p) end
local function applySpeed(p) end
local function refreshBadge(p) end
local function sendPerks(p) calls.perks[#calls.perks + 1] = p.UserId end

local _G = { AwardAchievement = function(p, name)
	calls.awardBuyer[#calls.awardBuyer + 1] = { uid = p.UserId, name = name }
end }

local CONFIG = {
	SpeedMin = 16, SpeedDefault = 24, SpeedMax = 32,
	BuffetGamePassId = 1861433203, ShowrunnerGamePassId = 1860580500,
	NeonTrailGamePassId = 1862887909, AnnouncerGamePassId = 1860172487,
	SpeedGamePassId = 1861667386,
}

local PASS_DEFS = {
	{ key = "buffet",     id = CONFIG.BuffetGamePassId,     badge = "🍿", msg = "🍿 ..." },
	{ key = "showrunner", id = CONFIG.ShowrunnerGamePassId, badge = "🎬", msg = "🎬 ..." },
	{ key = "neon",       id = CONFIG.NeonTrailGamePassId,  badge = "✨", msg = "✨ ..." },
	{ key = "announcer",  id = CONFIG.AnnouncerGamePassId,  badge = "📢", msg = "📢 ..." },
	{ key = "speed",      id = CONFIG.SpeedGamePassId,      badge = "⚡", msg = "⚡ ..." },
}

local function mkPlayer(uid)
	return { UserId = uid, Name = "P" .. uid, Parent = {},
		Character = nil, CharacterAdded = { Connect = function(self, fn) end } }
end

local applyAllPasses  -- forward decl

-- ===== END preamble — below are VERBATIM functions from CinemaServices.server.lua =====

local function grantPass(player, key, announce, awardBuyer)
	local s = sessions[player.UserId]
	if not s then return end
	s.passes = s.passes or {}
	if s.passes[key] then return end
	s.passes[key] = true
	if key == "neon" then applyNeonTrail(player) end
	if key == "speed" then
		if not tonumber(s.speed) then s.speed = CONFIG.SpeedDefault end
		applySpeed(player)
	end
	refreshBadge(player)
	if awardBuyer ~= false and _G.AwardAchievement then _G.AwardAchievement(player, "buyer") end
end

local passGrantStore
pcall(function() passGrantStore = DataStoreService:GetDataStore("CinemaPassGrants_v1") end)
local passGrants = {}

local function isValidPassKey(key)
	if not key then return false end
	for _, d in ipairs(PASS_DEFS) do if d.key == key then return true end end
	return false
end

local function passNameByKey(key)
	local NAMES = {
		buffet = "🍿 بوفيه مفتوح", showrunner = "🎬 مالك العرض", neon = "✨ أثر نيون",
		announcer = "📢 مايك الإعلان", speed = "⚡ سرعة البرق",
	}
	return NAMES[key] or key
end

local function sanitizeGrants(data)
	local g = {}
	if type(data) == "table" then
		for k, v in pairs(data) do
			if v == true and isValidPassKey(tostring(k)) then g[tostring(k)] = true end
		end
	end
	return g
end

local function readPassGrants(uid)
	if not uid then return {} end
	if passGrants[uid] then return passGrants[uid] end
	local g = {}
	if passGrantStore then
		local ok, data = pcall(function() return passGrantStore:GetAsync("u" .. uid) end)
		if ok then g = sanitizeGrants(data) end
	end
	if Players:GetPlayerByUserId(uid) then passGrants[uid] = g end
	return g
end

local function setGrant(uid, key, on)
	if not uid or not isValidPassKey(key) then return false end
	local changed = false
	if passGrantStore then
		local ok = pcall(function()
			passGrantStore:UpdateAsync("u" .. uid, function(old)
				local g = sanitizeGrants(old)
				if on then
					if g[key] then return nil end
					g[key] = true
				else
					if not g[key] then return nil end
					g[key] = nil
				end
				changed = true
				return g
			end)
		end)
		if not ok then return changed end
	end
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

-- ===== 🎁 gift-notice helpers (verbatim) =====
local giftQueueStore
pcall(function() giftQueueStore = DataStoreService:GetDataStore("CinemaGiftQueue_v1") end)

local function giftNoticeText(keys)
	local names = {}
	for _, k in ipairs(keys) do names[#names + 1] = "«" .. passNameByKey(k) .. "»" end
	if #names == 0 then return "" end
	if #names == 1 then
		return "🎁 أهدتك إدارة مدينة التبرعات باقة " .. names[1] .. " مجاناً — مزاياها مفعّلة الآن، استمتع بها!"
	end
	return "🎁 أهدتك إدارة مدينة التبرعات الباقات التالية مجاناً: " .. table.concat(names, "، ") .. " — مفعّلة الآن!"
end

local function sendGiftNotice(target, keys)
	local text = giftNoticeText(keys)
	if text ~= "" then lobbyRemote:FireClient(target, { action = "giftAward", text = text }) end
end

local function queueGiftNotice(uid, key)
	if not giftQueueStore or not isValidPassKey(key) then return end
	pcall(function()
		giftQueueStore:UpdateAsync("u" .. uid, function(old)
			local g = {}
			if type(old) == "table" then
				for k, v in pairs(old) do
					if v == true and isValidPassKey(tostring(k)) then g[tostring(k)] = true end
				end
			end
			if g[key] then return nil end
			g[key] = true
			return g
		end)
	end)
end

local function popGiftNotices(uid)
	local keys = {}
	if not giftQueueStore then return keys end
	local captured
	local ok = pcall(function()
		giftQueueStore:UpdateAsync("u" .. uid, function(old)
			captured = old
			if old == nil then return nil end
			return {}
		end)
	end)
	if ok and type(captured) == "table" then
		for k, v in pairs(captured) do
			if v == true and isValidPassKey(tostring(k)) then keys[#keys + 1] = tostring(k) end
		end
	end
	return keys
end

local function adminGrantPass(uid, key)
	if not setGrant(uid, key, true) then return false end
	local target = Players:GetPlayerByUserId(uid)
	if target then
		grantPass(target, key, true, false)
		sendPerks(target)
		sendGiftNotice(target, { key })
	else
		queueGiftNotice(uid, key)
	end
	return true
end

local function adminRevokePass(uid, key)
	if not setGrant(uid, key, false) then return false end
	return true
end

applyAllPasses = function(player)
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
	local granted = readPassGrants(player.UserId)
	for key in pairs(granted) do
		if isValidPassKey(key) then grantPass(player, key, false, false) end
	end
	sendPerks(player)
	task.spawn(function()
		local pending = popGiftNotices(player.UserId)
		if #pending == 0 then return end
		local stillGranted = {}
		for _, k in ipairs(pending) do
			if granted[k] then stillGranted[#stillGranted + 1] = k end
		end
		if #stillGranted == 0 then return end
		task.wait(2)
		if player.Parent then sendGiftNotice(player, stillGranted) end
	end)
end

-- ============================================================================
-- ===== TESTS =====
-- ============================================================================
local pass, fail = 0, 0
local function check(name, cond)
	if cond then pass = pass + 1; print("  ✅ " .. name)
	else fail = fail + 1; print("  ❌ " .. name) end
end
local function reset()
	calls = { perks = {}, fireClient = {}, awardBuyer = {} }
	sessions = {}; present = {}; passGrants = {}; mpOwns = {}; mp.fail = false
	for k in pairs(grantStore:raw()) do grantStore:raw()[k] = nil end
	for k in pairs(giftStore:raw()) do giftStore:raw()[k] = nil end
end
local function lastFire()
	return calls.fireClient[#calls.fireClient]
end
local function hasFireWith(uid, substr)
	for _, c in ipairs(calls.fireClient) do
		if c.uid == uid and c.payload.action == "giftAward"
			and string.find(c.payload.text, substr, 1, true) then return true end
	end
	return false
end

print("== T1: لاعب حاضر يُهدى باقة → إشعار فوري يوضّح أنها من الإدارة ==")
reset()
local A = mkPlayer(101); present[101] = A; sessions[101] = { passes = {} }
check("الإهداء نجح", adminGrantPass(101, "neon") == true)
check("أُرسل إشعار واحد للحاضر", #calls.fireClient == 1)
check("action = giftAward", lastFire() and lastFire().payload.action == "giftAward")
check("النص يحتوي «من الإدارة»: إدارة مدينة التبرعات", hasFireWith(101, "إدارة مدينة التبرعات"))
check("النص يحتوي اسم الباقة (أثر نيون)", hasFireWith(101, "أثر نيون"))
check("النص يحتوي «مجاناً»", hasFireWith(101, "مجاناً"))
check("لا يُمنح إنجاز «مُشترٍ» للإهداء", #calls.awardBuyer == 0)
check("الواجهة (perks) حُدِّثت فوراً", #calls.perks == 1)
check("لا شيء في طابور الغائبين", next(giftStore:raw()) == nil)

print("== T2: لاعب غائب يُهدى باقة → لا إشعار فوري، يُحفظ في الطابور ==")
reset()
check("الإهداء نجح (غائب)", adminGrantPass(202, "speed") == true)
check("لا إشعار فوري (لا أحد حاضر)", #calls.fireClient == 0)
check("الباقة محفوظة في طابور الإهداء", giftStore:raw()["u202"] ~= nil and giftStore:raw()["u202"].speed == true)
check("الباقة محفوظة في منح DataStore أيضاً", grantStore:raw()["u202"].speed == true)

print("== T3: الغائب يدخل → يظهر الإشعار مرة واحدة ثم يُمسح الطابور ==")
-- يكمل من حالة T2
local B = mkPlayer(202); present[202] = B; sessions[202] = { passes = {} }
applyAllPasses(B)
check("ظهر إشعار الإهداء عند الدخول", hasFireWith(202, "سرعة البرق"))
check("الإشعار يوضّح أنه من الإدارة", hasFireWith(202, "إدارة مدينة التبرعات"))
check("إشعار واحد فقط", #calls.fireClient == 1)
check("الطابور أُفرِغ بعد العرض", giftStore:raw()["u202"] == nil or next(giftStore:raw()["u202"]) == nil)

print("== T4: دخول ثانٍ للاعب نفسه → لا يتكرر الإشعار ==")
calls.fireClient = {}
sessions[202] = { passes = {} }  -- محاكاة جلسة جديدة
applyAllPasses(B)
check("لا إشعار إهداء مكرر في الدخول الثاني", #calls.fireClient == 0)

print("== T5: إهداء عدة باقات لغائب → إشعار مجمّع واحد عند الدخول ==")
reset()
adminGrantPass(303, "neon")
adminGrantPass(303, "buffet")
local C = mkPlayer(303); present[303] = C; sessions[303] = { passes = {} }
applyAllPasses(C)
check("إشعار مجمّع واحد فقط", #calls.fireClient == 1)
check("يذكر «أثر نيون»", hasFireWith(303, "أثر نيون"))
check("يذكر «بوفيه مفتوح»", hasFireWith(303, "بوفيه مفتوح"))
check("بصيغة الجمع (الباقات التالية)", hasFireWith(303, "الباقات التالية"))

print("== T6: إهداء لغائب ثم سحبها قبل دخوله → لا إشعار مضلِّل ==")
reset()
adminGrantPass(404, "neon")        -- غائب → طابور + منحة
adminRevokePass(404, "neon")       -- سُحبت قبل الدخول
local D = mkPlayer(404); present[404] = D; sessions[404] = { passes = {} }
applyAllPasses(D)
check("لا يظهر إشعار إهداء لباقة مسحوبة", #calls.fireClient == 0)

print("== T7: إعادة الإهداء لنفس الباقة المعلّقة لا تُكرّرها في الطابور ==")
reset()
adminGrantPass(505, "speed")
-- سحب ثم إعادة إهداء يضيفها من جديد للطابور (سلوك صحيح)
local before = adminGrantPass(505, "speed")  -- ممنوحة أصلاً → يجب false
check("الإهداء المكرر لباقة ممنوحة يُرجع false", before == false)
local q = giftStore:raw()["u505"]
local cnt = 0; if q then for _ in pairs(q) do cnt = cnt + 1 end end
check("الطابور يحتوي مدخلاً واحداً فقط للباقة", cnt == 1)

print("== T8: لاعب يُهدى وهو حاضر لا يُكتب في طابور الغائبين ==")
reset()
local E = mkPlayer(606); present[606] = E; sessions[606] = { passes = {} }
adminGrantPass(606, "announcer")
check("لا قيد في طابور الإهداء للحاضر", giftStore:raw()["u606"] == nil)

print(string.format("\n==== النتيجة: %d نجح / %d فشل ====", pass, fail))
if fail > 0 then error("بعض الفحوصات فشلت") end
print("كل فحوصات إشعار الإهداء ناجحة ✅")
