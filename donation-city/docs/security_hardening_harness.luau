--!nocheck
-- اختبار منطقي لإصلاحات التصليب الأمني (Anti-flood + عدّ القفز/الجري على السيرفر)
-- يحاكي os.clock حتى نتحكّم بالزمن، ويتحقّق من السلوك المتوقّع بدقّة.

local pass, fail = 0, 0
local function check(name, cond)
	if cond then pass += 1; print("PASS " .. name)
	else fail += 1; print("FAIL " .. name) end
end

-- ساعة وهمية للتحكّم بالزمن
local NOW = 0
local function clock() return NOW end

----------------------------------------------------------------------
-- 1) Anti-flood: نفس خوارزمية rlAllow الموجودة في كل المعالجات
----------------------------------------------------------------------
local function makeLimiter(refill, burst)
	local _rl = {}
	return function(userId)
		local now = clock()
		local b = _rl[userId]
		if not b then b = { t = burst, at = now }; _rl[userId] = b end
		b.t = math.min(burst, b.t + (now - b.at) * refill)
		b.at = now
		if b.t < 1 then return false end
		b.t -= 1
		return true
	end
end

do
	local RL_REFILL, RL_BURST = 15, 25
	local allow = makeLimiter(RL_REFILL, RL_BURST)

	-- (أ) دفعة فورية: أول 25 نداء تمرّ (سعة الدلو)، ثم تُحجب البقية في نفس اللحظة
	NOW = 100
	local okCount = 0
	for _ = 1, 1000 do
		if allow(1) then okCount += 1 end
	end
	check("flood: الدفعة الفورية محصورة بسعة الدلو (25)", okCount == 25)
	check("flood: باقي الـ975 نداء في نفس اللحظة محجوبة", okCount < 1000)

	-- (ب) بعد ثانية واحدة تتجدّد ~15 رمزاً (refill) فيُسمح بـ15 إضافية تقريباً
	NOW = 101
	local okAfter1s = 0
	for _ = 1, 1000 do
		if allow(1) then okAfter1s += 1 end
	end
	check("flood: تتجدّد ~15 نداء/ثانية فقط", okAfter1s == 15)

	-- (ج) الاستخدام الطبيعي لا يتأثّر: نداء كل ~1 ثانية يمرّ دائماً
	local allow2 = makeLimiter(RL_REFILL, RL_BURST)
	local normalOk = true
	for i = 1, 50 do
		NOW = 200 + i * 1.0  -- نداء كل ثانية (مثل تقرير الجري)
		if not allow2(7) then normalOk = false end
	end
	check("normal: نداء/ثانية (تقرير الجري الطبيعي) يمرّ دائماً", normalOk)

	-- (د) العزل بين اللاعبين: إغراق لاعب لا يؤثّر على آخر
	local allow3 = makeLimiter(RL_REFILL, RL_BURST)
	NOW = 300
	for _ = 1, 100 do allow3(10) end  -- استنزف دلو اللاعب 10
	check("isolation: لاعب آخر له دلوه الكامل", allow3(11) == true)
end

----------------------------------------------------------------------
-- 2) عدّ القفز على السيرفر (Humanoid.Jumping) مع مانع ارتداد
----------------------------------------------------------------------
do
	local JUMP_DEBOUNCE = 0.25
	local JUMP_COUNT = 100
	local s = { jumps = 0, lastJumpAt = nil, doneJump = false }
	local awarded = false
	local function countJump()
		local now = clock()
		if s.lastJumpAt and (now - s.lastJumpAt) < JUMP_DEBOUNCE then return end
		s.lastJumpAt = now
		s.jumps += 1
		if not s.doneJump and s.jumps >= JUMP_COUNT then
			s.doneJump = true
			awarded = true
		end
	end

	-- محاولة تزوير: استدعاء countJump آلاف المرات في نفس اللحظة (كما لو spam)
	NOW = 500
	for _ = 1, 5000 do countJump() end
	check("jump: الـspam في نفس اللحظة يُحتسب قفزة واحدة فقط", s.jumps == 1)
	check("jump: لا يُمنح إنجاز قفّاز بالتزوير", awarded == false)

	-- قفزات حقيقية متباعدة (كل 0.3s > debounce) تُحتسب كلها
	for i = 1, 120 do
		NOW = 500 + i * 0.3
		countJump()
	end
	check("jump: 120 قفزة حقيقية متباعدة تُحتسب", s.jumps == 121)
	check("jump: يُمنح إنجاز قفّاز بعد 100 قفزة فعلية", awarded == true)
end

----------------------------------------------------------------------
-- 3) الجري: احتساب الزمن الحقيقي المنقضي فقط (مكافحة التزوير)
----------------------------------------------------------------------
do
	local SPRINT_SECONDS = 60
	local lastSprintAt = {}
	local s = { sprintSecs = 0, doneSprint = false }
	local awarded = false
	local function report(userId, secs)
		local now = clock()
		local last = lastSprintAt[userId]
		lastSprintAt[userId] = now
		local credit = math.clamp(secs, 0, 2)
		if last then credit = math.min(credit, math.max(0, now - last)) end
		s.sprintSecs += credit
		if not s.doneSprint and s.sprintSecs >= SPRINT_SECONDS then
			s.doneSprint = true
			awarded = true
		end
	end

	-- تزوير: 10000 رسالة بقيمة 2 ثانية في نفس اللحظة → الزمن الحقيقي ≈ 0
	NOW = 1000
	report(1, 2)  -- أول رسالة (لا last) تُمنح حتى 2
	for _ = 1, 10000 do report(1, 2) end
	check("sprint: الـspam لا يضيف أكثر من ~2 ثانية (أول رسالة فقط)", s.sprintSecs <= 2.0001)
	check("sprint: لا إنجاز عدّاء بالتزوير", awarded == false)

	-- جري حقيقي: رسالة كل ثانية لمدة 65 ثانية → تتراكم فعلياً
	for i = 1, 65 do
		NOW = 1000 + i * 1.0
		report(1, 2)  -- العميل يبلّغ 2 لكن الزمن الحقيقي 1s فيُحتسب 1
	end
	check("sprint: الجري الحقيقي يتراكم بالزمن الفعلي (~1s/رسالة)", s.sprintSecs >= 60)
	check("sprint: يُمنح إنجاز عدّاء بعد جري فعلي كافٍ", awarded == true)
end

----------------------------------------------------------------------
print(string.format("\n==== النتيجة: %d نجح / %d فشل ====", pass, fail))
if fail > 0 then error("بعض الاختبارات فشلت") end
