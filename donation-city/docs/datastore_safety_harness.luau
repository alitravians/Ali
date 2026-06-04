--!nocheck
-- ============================================================================
-- Harness: تحقّق "حماية بيانات اللاعب عند فشل قراءة DataStore"
--   يثبت أن دوال التحميل/الحفظ بعد الإصلاح:
--     • تميّز «فشل القراءة» عن «لاعب جديد».
--     • لا تكتب أبداً القيمة الافتراضية فوق بيانات حقيقية مخزّنة عند فشل القراءة.
--     • تحفظ بشكل طبيعي عند نجاح القراءة (لاعب قديم/جديد).
-- يشغّل نسخاً حرفية من منطق الدوال الحقيقية (getAsyncRetry/loadX/saveX/الحارس)
-- مع محاكاة DataStore قابلة لحقن فشل القراءة.
-- ============================================================================

local pass, fail = 0, 0
local function check(name, cond)
	if cond then pass += 1; print("✅ " .. name)
	else fail += 1; print("❌ " .. name) end
end

-- mock task: بلا تأخير فعلي
task = { wait = function() end, spawn = function(fn, ...) fn(...) end }

-- ---------------------------------------------------------------------------
-- mock DataStore مع حقن فشل قراءة (readFail) لكل مفتاح أو شامل
-- ---------------------------------------------------------------------------
local function makeStore()
	local _store, fails = {}, {}
	local s = {}
	function s:setStored(k, v) _store[k] = v end
	function s:getStored(k) return _store[k] end
	function s:failRead(k, n) fails[k] = n end          -- يفشل قراءة المفتاح n مرة ثم ينجح
	function s:failReadAll(n) fails["*"] = n end
	function s:GetAsync(key)
		local n = fails[key] or fails["*"]
		if n and n > 0 then
			if fails[key] then fails[key] = n - 1 else fails["*"] = n - 1 end
			error("simulated read throttle for " .. key)
		end
		return _store[key]
	end
	function s:SetAsync(key, val) _store[key] = val end
	return s
end

local CONFIG = { StartCoins = 100, SpeedDefault = 16, StartTickets = 3, MaxTickets = 10 }

-- ===========================================================================
-- نسخة حرفية من منطق CinemaServices (coins)
-- ===========================================================================
local function makeCoinModule(store)
	local sessions = {}
	local function getAsyncRetry(key)
		if not store then return false, nil end
		for attempt = 1, 4 do
			local ok, val = pcall(function() return store:GetAsync(key) end)
			if ok then return true, val end
			task.wait(0.5 * attempt)
		end
		return false, nil
	end
	local function loadCoins(uid)
		if not store then return true, CONFIG.StartCoins end
		local ok, data = getAsyncRetry("c_" .. uid)
		if not ok then return false, CONFIG.StartCoins end
		if type(data) == "number" then return true, data end
		return true, CONFIG.StartCoins
	end
	local function join(uid)
		local okCoins, coins = loadCoins(uid)
		sessions[uid] = { coins = coins, dataLoaded = okCoins, _saved = { coins = coins } }
	end
	local function addCoins(uid, n) sessions[uid].coins += n end
	local function saveCoins(uid)
		local s = sessions[uid]
		if not s then return end
		if s.dataLoaded == false then return end            -- 🛡️ الحارس
		s._saved = s._saved or {}
		if s._saved.coins ~= s.coins then
			store:SetAsync("c_" .. uid, s.coins); s._saved.coins = s.coins
		end
	end
	return { join = join, addCoins = addCoins, save = saveCoins, sessions = sessions }
end

-- ===========================================================================
-- نسخة حرفية من منطق TicketSystem
-- ===========================================================================
local function makeTicketModule(store)
	local sessions = {}
	local function loadData(uid)
		if not store then return true, nil end
		for attempt = 1, 4 do
			local ok, data = pcall(function() return store:GetAsync("t_" .. uid) end)
			if ok then
				if type(data) == "table" then return true, data end
				return true, nil
			end
			task.wait(0.5 * attempt)
		end
		return false, nil
	end
	local function saveData(uid)
		local s = sessions[uid]
		if not s then return end
		if s.dataLoaded == false then return end            -- 🛡️ الحارس
		store:SetAsync("t_" .. uid, { tickets = s.tickets })
	end
	local function join(uid)
		local ok, saved = loadData(uid)
		if not ok then
			sessions[uid] = { tickets = CONFIG.StartTickets, dataLoaded = false }
		elseif saved then
			sessions[uid] = { tickets = saved.tickets, dataLoaded = true }
		else
			sessions[uid] = { tickets = CONFIG.StartTickets, dataLoaded = true }
			saveData(uid)                                      -- حفظ فوري للجديد فقط
		end
	end
	return { join = join, save = saveData, sessions = sessions }
end

-- ===========================================================================
-- نسخة حرفية من منطق MissionSystem (مبسّط على حقل التقدّم)
-- ===========================================================================
local function makeMissionModule(store)
	local sessions = {}
	local function loadData(uid)
		if not store then return true, nil end
		for attempt = 1, 4 do
			local ok, data = pcall(function() return store:GetAsync("m_" .. uid) end)
			if ok then
				if type(data) == "table" then return true, data end
				return true, nil
			end
			task.wait(0.5 * attempt)
		end
		return false, nil
	end
	local function saveData(uid)
		local s = sessions[uid]
		if not s then return end
		if s.dataLoaded == false then return end            -- 🛡️ الحارس
		store:SetAsync("m_" .. uid, { prog = s.prog })
	end
	local function join(uid)
		local ok, data = loadData(uid)
		if not ok then
			sessions[uid] = { prog = 0, dataLoaded = false }
		elseif data and data.prog then
			sessions[uid] = { prog = data.prog, dataLoaded = true }
		else
			sessions[uid] = { prog = 0, dataLoaded = true }
		end
		saveData(uid)                                          -- محاولة الحفظ الفوري (محروسة)
	end
	return { join = join, save = saveData, sessions = sessions }
end

-- ===========================================================================
-- نسخة حرفية من منطق ParkourSystem (أفضل وقت)
-- ===========================================================================
local function makeParkourModule(store)
	local runState = {}
	local function join(uid)
		local ok, v
		for attempt = 1, 4 do
			ok, v = pcall(function() return store:GetAsync("p_" .. uid) end)
			if ok then break end
			task.wait(0.5 * attempt)
		end
		runState[uid] = runState[uid] or {}
		if ok then
			runState[uid].bestLoaded = true
			if type(v) == "number" then runState[uid].best = v / 100 end
		else
			runState[uid].bestLoaded = false
		end
	end
	local function finish(uid, elapsed)
		local st = runState[uid]
		if not st.best or elapsed < st.best then
			st.best = elapsed
			if st.bestLoaded ~= false then                     -- 🛡️ الحارس
				store:SetAsync("p_" .. uid, math.floor(elapsed * 100))
			end
		end
	end
	return { join = join, finish = finish, runState = runState }
end

print("================ DataStore Safety Harness ================")

-- --- COINS ---------------------------------------------------------------
do
	local store = makeStore(); local m = makeCoinModule(store)
	-- T1: فشل القراءة لا يمحو الرصيد الحقيقي
	store:setStored("c_1", 5000)
	store:failRead("c_1", 99)                 -- يفشل دائماً
	m.join(1)
	check("Coins T1a: dataLoaded=false عند فشل القراءة", m.sessions[1].dataLoaded == false)
	check("Coins T1b: الجلسة تبدأ بالافتراضي 100", m.sessions[1].coins == 100)
	m.addCoins(1, 50)                          -- يكسب → 150
	m.save(1)
	check("Coins T1c: المخزّن ما زال 5000 (لم يُمحَ)", store:getStored("c_1") == 5000)
end
do
	local store = makeStore(); local m = makeCoinModule(store)
	-- T2: نجاح القراءة يحمّل ويحفظ طبيعياً
	store:setStored("c_2", 5000)
	m.join(2)
	check("Coins T2a: حمّل 5000", m.sessions[2].coins == 5000 and m.sessions[2].dataLoaded == true)
	m.addCoins(2, 50); m.save(2)
	check("Coins T2b: حُفظ 5050", store:getStored("c_2") == 5050)
end
do
	local store = makeStore(); local m = makeCoinModule(store)
	-- T3: لاعب جديد (لا بيانات) يحفظ الافتراضي
	m.join(3)
	check("Coins T3a: جديد=100 dataLoaded=true", m.sessions[3].coins == 100 and m.sessions[3].dataLoaded == true)
	m.addCoins(3, 25); m.save(3)
	check("Coins T3b: حُفظ 125", store:getStored("c_3") == 125)
end
do
	local store = makeStore(); local m = makeCoinModule(store)
	-- T4: قراءة تفشل 3 مرات ثم تنجح (إعادة المحاولة تنقذ)
	store:setStored("c_4", 777)
	store:failRead("c_4", 3)
	m.join(4)
	check("Coins T4: إعادة المحاولة نجحت → حمّل 777 dataLoaded=true", m.sessions[4].coins == 777 and m.sessions[4].dataLoaded == true)
end

-- --- COINS: شراء Robux أثناء جلسة متدهورة لا يضيع (يُحوّل للطابور الدائم) ---
do
	-- نسخة حرفية من منطق deliverOrQueue بعد الإصلاح
	local sessions = {}
	local pending = {}  -- userId -> { info, ... }  (طابور دائم)
	local function grant(uid) sessions[uid].granted = (sessions[uid].granted or 0) + 1 end
	local function deliverOrQueue(uid, info)
		local present = sessions[uid] ~= nil
		if present and sessions[uid].dataLoaded ~= false then
			grant(uid); return "granted"
		end
		pending[uid] = pending[uid] or {}; table.insert(pending[uid], info)
		return "queued"
	end
	-- جلسة متدهورة (dataLoaded=false) تشتري كوينز
	sessions[1] = { dataLoaded = false, granted = 0 }
	local r = deliverOrQueue(1, { kind = "coins", amount = 250 })
	check("Purchase T1a: شراء أثناء التدهور يُحوّل للطابور (لا يُمنح في الذاكرة)", r == "queued" and sessions[1].granted == 0)
	check("Purchase T1b: المنتج محفوظ في الطابور الدائم", pending[1] and #pending[1] == 1)
	-- جلسة سليمة (dataLoaded=true) تشتري كوينز → تُسلَّم فوراً
	sessions[2] = { dataLoaded = true, granted = 0 }
	local r2 = deliverOrQueue(2, { kind = "coins", amount = 600 })
	check("Purchase T2: شراء أثناء جلسة سليمة يُسلَّم فوراً", r2 == "granted" and sessions[2].granted == 1)
end

-- --- TICKETS -------------------------------------------------------------
do
	local store = makeStore(); local m = makeTicketModule(store)
	store:setStored("t_1", { tickets = 9 })
	store:failRead("t_1", 99)
	m.join(1)
	check("Tickets T1a: dataLoaded=false عند فشل القراءة", m.sessions[1].dataLoaded == false)
	m.save(1)                                  -- محاكاة الخروج
	check("Tickets T1b: المخزّن ما زال 9 (لم يُكتب فوقه الافتراضي)", store:getStored("t_1").tickets == 9)
end
do
	local store = makeStore(); local m = makeTicketModule(store)
	store:setStored("t_2", { tickets = 7 })
	m.join(2)
	check("Tickets T2: قراءة ناجحة حمّلت 7", m.sessions[2].tickets == 7 and m.sessions[2].dataLoaded == true)
end
do
	local store = makeStore(); local m = makeTicketModule(store)
	m.join(3)                                  -- جديد
	check("Tickets T3: جديد حفظ StartTickets", store:getStored("t_3").tickets == CONFIG.StartTickets)
end

-- --- MISSIONS ------------------------------------------------------------
do
	local store = makeStore(); local m = makeMissionModule(store)
	store:setStored("m_1", { prog = 42 })
	store:failRead("m_1", 99)
	m.join(1)
	check("Missions T1a: dataLoaded=false عند الفشل", m.sessions[1].dataLoaded == false)
	check("Missions T1b: المخزّن ما زال prog=42 (لم يُمحَ بحفظ فوري)", store:getStored("m_1").prog == 42)
end
do
	local store = makeStore(); local m = makeMissionModule(store)
	store:setStored("m_2", { prog = 5 })
	m.join(2)
	check("Missions T2: قراءة ناجحة حمّلت prog=5", m.sessions[2].prog == 5 and m.sessions[2].dataLoaded == true)
end

-- --- PARKOUR -------------------------------------------------------------
do
	local store = makeStore(); local m = makeParkourModule(store)
	store:setStored("p_1", 250)                -- أفضل وقت محفوظ = 2.5s
	store:failRead("p_1", 99)
	m.join(1)
	check("Parkour T1a: bestLoaded=false عند الفشل", m.runState[1].bestLoaded == false)
	m.finish(1, 9.99)                          -- وقت أبطأ بكثير
	check("Parkour T1b: المخزّن ما زال 250 (لم يُكتب فوقه وقت أبطأ)", store:getStored("p_1") == 250)
end
do
	local store = makeStore(); local m = makeParkourModule(store)
	store:setStored("p_2", 500)
	m.join(2)
	m.finish(2, 3.0)                           -- 3.0s < 5.0s المخزّن → رقم جديد
	check("Parkour T2: قراءة ناجحة سمحت بحفظ الرقم الأفضل 300", store:getStored("p_2") == 300)
end

print("=========================================================")
print(string.format("النتيجة: %d/%d ناجح، %d فاشل", pass, pass + fail, fail))
if fail > 0 then error("هناك اختبارات فاشلة") end
