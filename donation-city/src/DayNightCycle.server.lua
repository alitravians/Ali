--!nonstrict
----------------------------------------------------------------------
-- DAY NIGHT CYCLE (Server)
--   نظام تعاقب الليل والنهار — يعتمد على وقت السيرفر الحقيقي بتوقيت
--   البحرين (UTC+3). يحرّك Lighting.ClockTime لتتبع الوقت الفعلي، ويضبط
--   السطوع/الإضاءة المحيطة/الضباب تدريجياً عبر ٥ مراحل:
--       الفجر → الصباح → الظهر → العصر → المساء.
--   كما يبثّ وقت السيرفر للعملاء عبر RemoteEvent ليعرضوه في ساعة HUD.
----------------------------------------------------------------------
local Lighting        = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players         = game:GetService("Players")

local BAHRAIN_OFFSET = 3 * 3600   -- UTC+3 (التوقيت الرسمي للبحرين، لا صيفي)

----------------------------------------------------------------------
-- قناة بثّ وقت السيرفر للعملاء (ساعة الـHUD)
----------------------------------------------------------------------
local clockEvent = ReplicatedStorage:FindFirstChild("ServerClockSync")
if not clockEvent then
	clockEvent = Instance.new("RemoteEvent")
	clockEvent.Name = "ServerClockSync"
	clockEvent.Parent = ReplicatedStorage
end

-- ثانية البحرين الحالية (Epoch + إزاحة المنطقة)
local function bahrainEpoch(): number
	return os.time() + BAHRAIN_OFFSET
end

-- ساعة اليوم ككسر [0,24) من ثانية البحرين
local function clockHour(): number
	return (bahrainEpoch() % 86400) / 3600
end

----------------------------------------------------------------------
-- منحنى الإضاءة: عامل نهار [0,1] حسب ارتفاع الشمس التقريبي
--   0 عند 6ص و6م (الأفق)، 1 عند الظهر، 0 ليلاً.
----------------------------------------------------------------------
local function daylightFactor(h: number): number
	return math.clamp(math.sin((h - 6) / 12 * math.pi), 0, 1)
end

-- مزج لونين
local function lerpColor(a: Color3, b: Color3, t: number): Color3
	return a:Lerp(b, t)
end

-- إعدادات النهار/الليل المرجعية (تُمزج حسب عامل النهار)
local DAY = {
	Brightness     = 2.6,
	OutdoorAmbient = Color3.fromRGB(150, 150, 158),
	Ambient        = Color3.fromRGB(80, 80, 90),
	FogColor       = Color3.fromRGB(190, 210, 235),
}
local NIGHT = {
	Brightness     = 0.9,
	OutdoorAmbient = Color3.fromRGB(48, 56, 86),
	Ambient        = Color3.fromRGB(30, 34, 52),
	FogColor       = Color3.fromRGB(20, 26, 46),
}

-- لمسة دفء عند الفجر/الغروب (الشمس منخفضة لكن النهار موجود)
local WARM = Color3.fromRGB(255, 150, 90)

local function applyLighting(h: number)
	local f = daylightFactor(h)
	-- قرب الأفق (شروق/غروب): عامل دفء يبلغ ذروته حين تكون الشمس منخفضة
	local horizon = math.clamp(1 - math.abs(f - 0.18) / 0.18, 0, 1)
	if f <= 0 then horizon = 0 end

	Lighting.Brightness     = NIGHT.Brightness + (DAY.Brightness - NIGHT.Brightness) * f
	local outdoor = lerpColor(NIGHT.OutdoorAmbient, DAY.OutdoorAmbient, f)
	local fog     = lerpColor(NIGHT.FogColor, DAY.FogColor, f)
	-- صبغة دفء عند الأفق
	outdoor = lerpColor(outdoor, WARM, horizon * 0.35)
	fog     = lerpColor(fog, WARM, horizon * 0.30)
	Lighting.OutdoorAmbient = outdoor
	Lighting.Ambient        = lerpColor(NIGHT.Ambient, DAY.Ambient, f)
	Lighting.FogColor       = fog
end

----------------------------------------------------------------------
-- تطبيق فوري + إعادة بثّ عند انضمام لاعب
----------------------------------------------------------------------
local function pushClock(plr: Player?)
	local epoch = bahrainEpoch()
	if plr then
		clockEvent:FireClient(plr, epoch)
	else
		clockEvent:FireAllClients(epoch)
	end
end

Players.PlayerAdded:Connect(function(plr)
	task.delay(1, function() pushClock(plr) end)
end)

-- ضبط الإضاءة فوراً عند الإقلاع
Lighting.ClockTime = clockHour()
applyLighting(Lighting.ClockTime)
pushClock()

----------------------------------------------------------------------
-- حلقة التحديث: كل ثانية نحرّك الساعة والإضاءة بسلاسة،
-- وكل ~15 ثانية نزامن وقت العملاء.
----------------------------------------------------------------------
task.spawn(function()
	local syncAccum = 0
	while true do
		local h = clockHour()
		Lighting.ClockTime = h
		applyLighting(h)
		syncAccum += 1
		if syncAccum >= 15 then
			syncAccum = 0
			pushClock()
		end
		task.wait(1)
	end
end)
