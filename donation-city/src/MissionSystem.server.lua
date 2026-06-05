--[[
╔══════════════════════════════════════════════════════════════════════╗
║  المهام اليومية والأسبوعية — MISSION SYSTEM (Server)                  ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  • ٤ مهام يومية تُختار لكل لاعب وتتجدّد كل ٢٤ ساعة (مع عدّاد التحديث).  ║
║  • مهمة أسبوعية كبرى تتجدّد كل ٧ أيام (جائزة ضخمة + إنجاز).            ║
║  • التقدّم يُبلَّغ عبر _G.ReportMission(player, event, amount?, tag?).   ║
║  • الجوائز كوينز عبر _G.AddCoins؛ مكافأة إتمام كل المهام اليومية.       ║
║  • محفوظ بالـ DataStore (يبقى بين الجلسات) — pcall + إعادة محاولة.      ║
║  • رسالة ترحيب + علامة «أول مرة» تُرسَل للعميل (دليل المبتدئين).        ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService  = game:GetService("DataStoreService")

----------------------------------------------------------------------
-- إعدادات عامة
----------------------------------------------------------------------
local DAILY_COUNT     = 4        -- عدد المهام اليومية لكل لاعب
local DAILY_PERIOD    = 86400    -- يوم بالثواني
local WEEKLY_PERIOD   = 604800   -- أسبوع بالثواني
local DAILY_ALL_BONUS = 500      -- مكافأة إتمام كل المهام اليومية

----------------------------------------------------------------------
-- بنك المهام اليومية: key = معرّف · event = الحدث · target = الهدف · coins = الجائزة
----------------------------------------------------------------------
local POOL = {
	-- 🎬 السينما
	{ key = "ticket_buy",  cat = "cinema", event = "ticket_buy",  target = 1,   coins = 50,  desc = "اشترِ تذكرة سينما" },
	{ key = "movie_watch", cat = "cinema", event = "movie_watch", target = 1,   coins = 100, desc = "شاهد فيلماً كاملاً" },
	{ key = "cinema_sit",  cat = "cinema", event = "cinema_sit",  target = 300, coins = 100, desc = "اجلس في قاعة السينما ٥ دقائق", time = true },
	-- 🛍️ البوثات
	{ key = "booth_visit", cat = "booth",  event = "booth_visit", target = 3,   coins = 50,  desc = "زُر ٣ بوثات مختلفة" },
	{ key = "booth_buy",   cat = "booth",  event = "booth_buy",   target = 1,   coins = 100, desc = "اشترِ منتجاً من أحد البوثات" },
	{ key = "booth_add",   cat = "booth",  event = "booth_add",   target = 1,   coins = 100, desc = "أضف منتجاً إلى بوثك" },
	-- 🏖️ الشاطئ
	{ key = "beach_visit", cat = "beach",  event = "beach_visit", target = 1,   coins = 50,  desc = "زُر منطقة الشاطئ" },
	{ key = "beach_time",  cat = "beach",  event = "beach_time",  target = 120, coins = 50,  desc = "ابقَ في الشاطئ دقيقتين", time = true },
	-- 🧗 الباركور
	{ key = "parkour_cp",  cat = "parkour",event = "parkour_cp",  target = 1,   coins = 50,  desc = "اجتز نقطة حفظ في الباركور" },
	{ key = "parkour_cp5", cat = "parkour",event = "parkour_cp",  target = 5,   coins = 150, desc = "اجتز ٥ نقاط حفظ في الباركور" },
	{ key = "parkour_done",cat = "parkour",event = "parkour_done",target = 1,   coins = 250, desc = "أكمل مسار الباركور كاملاً" },
	-- 👥 اجتماعي
	{ key = "chat_msg",    cat = "social", event = "chat_msg",    target = 1,   coins = 50,  desc = "أرسل رسالة في الدردشة" },
	-- ملاحظة: مهمة «تكوين فريق كرة الطائرة» أُزيلت لأن نظام الكرة الطائرة غير
	-- مُفعّل في اللعبة، فكانت مهمة يومية مستحيلة الإكمال تعطّل تقدّم اللاعب.
}
local POOL_BY_KEY = {}
for _, m in ipairs(POOL) do POOL_BY_KEY[m.key] = m end

-- 🗓️ بنك المهام الأسبوعية الكبرى (جائزة ٥٠٠٠ كوينز + إنجاز «بطل الأسبوع»)
local WEEKLY_POOL = {
	{ key = "w_movies",  event = "movie_watch",  target = 5,  coins = 5000, desc = "شاهد ٥ أفلام هذا الأسبوع" },
	{ key = "w_parkour", event = "parkour_done", target = 3,  coins = 5000, desc = "أكمل الباركور ٣ مرّات" },
}
local WEEKLY_BY_KEY = {}
for _, m in ipairs(WEEKLY_POOL) do WEEKLY_BY_KEY[m.key] = m end

----------------------------------------------------------------------
-- DataStore
----------------------------------------------------------------------
local store
pcall(function() store = DataStoreService:GetDataStore("Missions_v1") end)

-- قراءة مع إعادة محاولة تميّز «فشل القراءة» عن «لا توجد بيانات».
-- تُرجع (ok, data): ok=false ⇒ فشلت كل المحاولات ⇒ لا تُعامل اللاعب كـ«أول مرة» ولا تحفظ فوقه.
local function loadData(userId)
	if not store then return true, nil end  -- بلا متجر = بلا حفظ، عامله كجديد
	for attempt = 1, 4 do
		local ok, data = pcall(function() return store:GetAsync("m_" .. userId) end)
		if ok then
			if type(data) == "table" then return true, data end
			return true, nil  -- لاعب جديد فعلاً
		end
		if attempt < 4 then task.wait(0.5 * attempt) end
	end
	return false, nil  -- فشل قراءة
end

local sessions = {}  -- [userId] = data table (انظر الأسفل) + { dSeen, wSeen, dirty }

local function saveData(userId)
	if not store then return end
	local s = sessions[userId]
	if not s then return end
	-- 🛡️ حارس: لا نكتب فوق تقدّم لم نقرأه بنجاح
	if s.dataLoaded == false then return end
	local payload = {
		v = 1,
		dDay = s.dDay, dList = s.dList, dProg = s.dProg, dDone = s.dDone, dBonus = s.dBonus,
		dSeen = s.dSeen,
		wWeek = s.wWeek, wKey = s.wKey, wProg = s.wProg, wDone = s.wDone, wSeen = s.wSeen,
	}
	for _ = 1, 3 do
		if pcall(function() store:SetAsync("m_" .. userId, payload) end) then return end
		task.wait(1)
	end
end

----------------------------------------------------------------------
-- Remotes (server↔client)
----------------------------------------------------------------------
local folder = ReplicatedStorage:FindFirstChild("MissionRemotes")
if not folder then
	folder = Instance.new("Folder")
	folder.Name = "MissionRemotes"
	folder.Parent = ReplicatedStorage
end
local function makeRemote(name)
	local r = folder:FindFirstChild(name)
	if not r then
		r = Instance.new("RemoteEvent")
		r.Name = name
		r.Parent = folder
	end
	return r
end
local syncRemote    = makeRemote("Sync")     -- server → client: حالة المهام للواجهة
local welcomeRemote = makeRemote("Welcome")  -- server → client: ترحيب + أول مرة
local requestRemote = makeRemote("Request")  -- client → server: اطلب التحديث

----------------------------------------------------------------------
-- أدوات
----------------------------------------------------------------------
local function notify(player, text)
	if _G.NotifyPlayer then _G.NotifyPlayer(player, text) end
end

local function dayNumber()  return math.floor(os.time() / DAILY_PERIOD) end
local function weekNumber() return math.floor(os.time() / WEEKLY_PERIOD) end

-- اختيار عشوائي ثابت (يعتمد على userId+الفترة) — يختلف بين اللاعبين والأيام
local function pickDaily(userId, day)
	local rng = Random.new(userId * 100000 + day)
	local keys = {}
	for _, m in ipairs(POOL) do keys[#keys + 1] = m.key end
	-- خلط Fisher–Yates
	for i = #keys, 2, -1 do
		local j = rng:NextInteger(1, i)
		keys[i], keys[j] = keys[j], keys[i]
	end
	local chosen = {}
	for i = 1, math.min(DAILY_COUNT, #keys) do chosen[i] = keys[i] end
	return chosen
end

local function pickWeekly(userId, week)
	local rng = Random.new(userId * 7777 + week)
	return WEEKLY_POOL[rng:NextInteger(1, #WEEKLY_POOL)].key
end

----------------------------------------------------------------------
-- بناء/تجديد حالة اللاعب
----------------------------------------------------------------------
local function refreshDaily(s, userId)
	s.dDay  = dayNumber()
	s.dList = pickDaily(userId, s.dDay)
	s.dProg, s.dDone, s.dSeen, s.dBonus = {}, {}, {}, false
	for _, k in ipairs(s.dList) do s.dProg[k] = 0; s.dSeen[k] = {} end
end

local function refreshWeekly(s, userId)
	s.wWeek = weekNumber()
	s.wKey  = pickWeekly(userId, s.wWeek)
	s.wProg, s.wDone, s.wSeen = 0, false, {}
end

local function ensureFresh(player)
	local s = sessions[player.UserId]
	if not s then return end
	if s.dDay ~= dayNumber() then
		refreshDaily(s, player.UserId)
		notify(player, "📋 تجدّدت مهامك اليومية! افتح لوحة المهام.")
		task.spawn(function() saveData(player.UserId) end)
	end
	if s.wWeek ~= weekNumber() then
		refreshWeekly(s, player.UserId)
		task.spawn(function() saveData(player.UserId) end)
	end
end

----------------------------------------------------------------------
-- إرسال الحالة للعميل (للواجهة)
----------------------------------------------------------------------
local function buildPayload(player)
	local s = sessions[player.UserId]
	if not s then return nil end
	local daily = {}
	for _, k in ipairs(s.dList) do
		local m = POOL_BY_KEY[k]
		if m then
			daily[#daily + 1] = {
				key = k, desc = m.desc, cat = m.cat, coins = m.coins,
				prog = math.min(s.dProg[k] or 0, m.target), target = m.target,
				done = s.dDone[k] == true, time = m.time == true,
			}
		end
	end
	local wm = WEEKLY_BY_KEY[s.wKey]
	local weekly = wm and {
		desc = wm.desc, coins = wm.coins,
		prog = math.min(s.wProg or 0, wm.target), target = wm.target, done = s.wDone == true,
	} or nil
	return {
		daily = daily,
		bonusCoins = DAILY_ALL_BONUS, bonusDone = s.dBonus == true,
		weekly = weekly,
		dailyReset  = (s.dDay + 1) * DAILY_PERIOD,    -- وقت التجديد القادم (epoch)
		weeklyReset = (s.wWeek + 1) * WEEKLY_PERIOD,
	}
end

local function pushSync(player)
	local payload = buildPayload(player)
	if payload then syncRemote:FireClient(player, payload) end
end

----------------------------------------------------------------------
-- منح الجوائز
----------------------------------------------------------------------
local function grantCoins(player, n)
	if _G.AddCoins then _G.AddCoins(player, n) end
end

local function checkDailyBonus(player, s)
	if s.dBonus then return end
	for _, k in ipairs(s.dList) do
		-- تجاهل أي مفتاح مهمة أُزيل من البنك (بيانات قديمة محفوظة): لا يجب أن يمنع
		-- مكافأة «إكمال كل المهام»، لأنه لن يصبح مكتملاً أبداً (لا يُعرَض ولا يُحتسب).
		if POOL_BY_KEY[k] and not s.dDone[k] then return end
	end
	s.dBonus = true
	grantCoins(player, DAILY_ALL_BONUS)
	if _G.AwardAchievement then _G.AwardAchievement(player, "daily_master") end
	notify(player, string.format("🎯 أكملت كل مهام اليوم! مكافأة إضافية +%d كوينز + لقب «منجِز اليوم».", DAILY_ALL_BONUS))
end

----------------------------------------------------------------------
-- استقبال التقدّم من باقي الأنظمة
--   _G.ReportMission(player, event, amount?, tag?)
----------------------------------------------------------------------
_G.ReportMission = function(player, event, amount, tag)
	if typeof(player) ~= "Instance" then return end
	local s = sessions[player.UserId]
	if not s then return end
	ensureFresh(player)
	amount = tonumber(amount) or 1
	if amount <= 0 then return end
	local changed = false

	-- المهام اليومية
	for _, k in ipairs(s.dList) do
		local m = POOL_BY_KEY[k]
		if m and m.event == event and not s.dDone[k] then
			if tag ~= nil then
				s.dSeen[k] = s.dSeen[k] or {}
				if s.dSeen[k][tag] then m = nil end  -- علامة مكرّرة → تجاهل
				if m then s.dSeen[k][tag] = true end
			end
			if m then
				s.dProg[k] = (s.dProg[k] or 0) + amount
				changed = true
				if s.dProg[k] >= m.target then
					s.dDone[k] = true
					grantCoins(player, m.coins)
					notify(player, string.format("✅ مهمة مكتملة: %s (+%d كوينز)", m.desc, m.coins))
					checkDailyBonus(player, s)
				end
			end
		end
	end

	-- المهمة الأسبوعية
	local wm = WEEKLY_BY_KEY[s.wKey]
	if wm and wm.event == event and not s.wDone then
		local count = true
		if tag ~= nil then
			s.wSeen = s.wSeen or {}
			if s.wSeen[tag] then count = false else s.wSeen[tag] = true end
		end
		if count then
			s.wProg = (s.wProg or 0) + amount
			changed = true
			if s.wProg >= wm.target then
				s.wDone = true
				grantCoins(player, wm.coins)
				if _G.AwardAchievement then _G.AwardAchievement(player, "weekly_hero") end
				notify(player, string.format("🏅 أكملت المهمة الأسبوعية! +%d كوينز + لقب «بطل الأسبوع».", wm.coins))
			end
		end
	end

	if changed then
		s.dirty = true
		pushSync(player)
	end
end

----------------------------------------------------------------------
-- دورة الحياة
----------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player)
	local ok, data = loadData(player.UserId)
	local firstTime = ok and (data == nil)
	local s = {}
	sessions[player.UserId] = s
	if not ok then
		-- 🛡️ فشل قراءة: لا نعتبره «أول مرة» ولا نحفظ فوقه. نعرض مهام مؤقّتة محميّة بـ dataLoaded=false
		s.dataLoaded = false
		refreshDaily(s, player.UserId)
		refreshWeekly(s, player.UserId)
		if _G.NotifyPlayer then
			task.spawn(function() _G.NotifyPlayer(player, "⚠️ تعذّر تحميل تقدّم مهامك بسبب ضغط الخادم. لن يُحفظ هذه الجلسة — أعد الدخول لاحقاً.") end)
		end
	elseif data and data.dList and data.dProg then
		s.dataLoaded = true
		s.dDay, s.dList, s.dProg = data.dDay, data.dList, data.dProg
		s.dDone, s.dBonus, s.dSeen = data.dDone or {}, data.dBonus == true, data.dSeen or {}
		s.wWeek, s.wKey, s.wProg = data.wWeek, data.wKey, data.wProg or 0
		s.wDone, s.wSeen = data.wDone == true, data.wSeen or {}
	else
		s.dataLoaded = true
		refreshDaily(s, player.UserId)
		refreshWeekly(s, player.UserId)
	end
	-- ترحيل بيانات قديمة: لو القائمة المحفوظة تحوي مفتاح مهمة أُزيل من البنك
	-- (مثل مهام الكرة الطائرة بعد إزالة نظامها)، جدّد القائمة فوراً كي يحصل
	-- اللاعب على مهام صالحة بدل أن يعلق بمهمة مستحيلة تعطّل مكافأة الإكمال.
	if s.dList then
		for _, k in ipairs(s.dList) do
			if not POOL_BY_KEY[k] then refreshDaily(s, player.UserId); break end
		end
	end
	if s.wKey and not WEEKLY_BY_KEY[s.wKey] then refreshWeekly(s, player.UserId) end
	-- جدّد إن انقضت الفترة منذ آخر جلسة
	if s.dDay ~= dayNumber() then refreshDaily(s, player.UserId) end
	if s.wWeek ~= weekNumber() then refreshWeekly(s, player.UserId) end
	-- احفظ فوراً (يُفيد اللاعب الجديد كي لا يُعتبر «أول مرة» مجدداً، ولِيُثبّت أي تجديد
	-- فترة/ترحيل للقدامى). محميّ بحارس saveData: لو dataLoaded=false لا يكتب شيئاً.
	task.spawn(function() saveData(player.UserId) end)

	-- ترحيب + دليل المبتدئين (مرة واحدة)
	task.delay(3, function()
		if not player.Parent then return end
		welcomeRemote:FireClient(player, { firstTime = firstTime })
		pushSync(player)
	end)
end)

-- 🛡️ مكافحة إغراق الـRemotes: حدّ نداءات لكل لاعب (token-bucket بسيط)
local _rl = {}
local RL_REFILL, RL_BURST = 15, 25
local function rlAllow(userId: number): boolean
	local now = os.clock()
	local b = _rl[userId]
	if not b then b = { t = RL_BURST, at = now }; _rl[userId] = b end
	b.t = math.min(RL_BURST, b.t + (now - b.at) * RL_REFILL)
	b.at = now
	if b.t < 1 then return false end
	b.t -= 1
	return true
end

Players.PlayerRemoving:Connect(function(player)
	saveData(player.UserId)
	sessions[player.UserId] = nil
	_rl[player.UserId] = nil
end)

-- طلب العميل تحديث الحالة (عند فتح اللوحة)
requestRemote.OnServerEvent:Connect(function(player)
	if not rlAllow(player.UserId) then return end
	ensureFresh(player)
	pushSync(player)
end)

-- حفظ دوري لمن تغيّرت حالته
task.spawn(function()
	while true do
		task.wait(60)
		for userId, s in pairs(sessions) do
			if s.dirty then
				s.dirty = false
				task.spawn(function() pcall(saveData, userId) end)
			end
		end
	end
end)

-- فحص دوري لتجديد المهام للاعبين المتصلين عند انقضاء اليوم/الأسبوع
task.spawn(function()
	while true do
		task.wait(30)
		for _, player in ipairs(Players:GetPlayers()) do
			ensureFresh(player)
		end
	end
end)

game:BindToClose(function()
	-- حفظ متوازٍ يتفادى تجاوز مهلة الإغلاق (30s) عند وجود عدد كبير من اللاعبين
	local pending = 0
	for userId in pairs(sessions) do
		pending += 1
		task.spawn(function()
			pcall(saveData, userId)
			pending -= 1
		end)
	end
	local t0 = os.clock()
	while pending > 0 and (os.clock() - t0) < 25 do
		task.wait(0.1)
	end
end)

print("[MissionSystem] ready — daily/weekly missions, activity-based economy.")
