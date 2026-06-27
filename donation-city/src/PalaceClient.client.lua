--[[
╔══════════════════════════════════════════════════════════════════════╗
║  القصر الجمهوري — PALACE CLIENT (Client)                              ║
║  المكان: StarterPlayer ▸ StarterPlayerScripts   ·   النوع: LocalScript ║
║                                                                        ║
║  واجهات اللاعب لقفل البصمة + سجلّ الدخول:                              ║
║    • عند الضغط على الجهاز → شاشة «جاري قراءة البصمة…» بخطّ مسح متحرّك   ║
║      + نبض + صوت، بإحساس واقعي.                                        ║
║    • النتيجة من السيرفر: ✓ «تم التحقق — تفضّل» (أدمن) أو «🚫 للأدمن     ║
║      فقط» (غير ذلك)، مع لون وصوت مناسبين.                              ║
║    • عرض سجلّ الدخول (الاسم + الوقت) للأدمن في لوحة أنيقة.             ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local SoundService      = game:GetService("SoundService")

local player = Players.LocalPlayer
local pg = player:WaitForChild("PlayerGui")

local net          = ReplicatedStorage:WaitForChild("PalaceNet")
local evStartScan  = net:WaitForChild("StartScan")
local evScanResult = net:WaitForChild("ScanResult")
local evLogData    = net:WaitForChild("LogData")

local GOLD = Color3.fromRGB(214, 175, 92)

----------------------------------------------------------------------
-- 🔊 أصوات (نُعيد استخدام معرّفات مثبتة في المشروع)
----------------------------------------------------------------------
local function mkSound(id, vol, speed)
	local s = Instance.new("Sound")
	s.SoundId = id
	s.Volume = vol or 0.5
	s.PlaybackSpeed = speed or 1
	s.Parent = SoundService
	return s
end
local sndBeep    = mkSound("rbxassetid://9112627118", 0.35, 1.4)
local sndSuccess = mkSound("rbxassetid://9118823105", 0.6, 1)
local sndDenied  = mkSound("rbxassetid://9112627118", 0.5, 0.5)

----------------------------------------------------------------------
-- 🖐️ شاشة المسح البيومتري — لوحة جهاز بيومتري واقعية
--      إطار معدني + زجاج غاطس + بصمة واقعية (Asset) تتكشّف تدريجياً
--      + دليل يد + حلقة تقدّم/نسبة + شعاع مسح + شريحة تكلفة/رصيد + شريط LED.
--      تدرّج لوني للحالة: أزرق(جاهز) → ذهبي(يمسح) → أخضر/أحمر(نتيجة).
----------------------------------------------------------------------
-- 🎨 ألوان الحالة + معرّفات الـAssets (بصمة واقعية + دليل اليد عبر rbxthumb)
local CYAN     = Color3.fromRGB(95, 210, 255)
local CYAN_D   = Color3.fromRGB(40, 105, 150)
local GREEN    = Color3.fromRGB(80, 240, 150)
local RED       = Color3.fromRGB(245, 95, 95)
local GOLD_SCAN = Color3.fromRGB(255, 205, 110)
local FP_TEX   = "rbxthumb://type=Asset&id=75452689012143&w=420&h=420"
local HAND_TEX = "rbxthumb://type=Asset&id=86422106031253&w=420&h=420"
local GLOW_TEX = "rbxassetid://5028857084"
local CW, CH   = 360, 580   -- أبعاد لوحة الجهاز

local gui = Instance.new("ScreenGui")
gui.Name = "PalaceScanGui"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.DisplayOrder = 50
gui.Enabled = false
gui.Parent = pg

local dim = Instance.new("Frame")
dim.Size = UDim2.new(1, 0, 1, 0)
dim.BackgroundColor3 = Color3.fromRGB(1, 3, 7)
dim.BackgroundTransparency = 0.3
dim.Parent = gui

-- ═══ توهّج خارجي خلف الجهاز (يتلوّن مع الحالة) ═══
local auraGlow = Instance.new("ImageLabel")
auraGlow.BackgroundTransparency = 1
auraGlow.Image = GLOW_TEX
auraGlow.ImageColor3 = CYAN
auraGlow.ImageTransparency = 0.55
auraGlow.AnchorPoint = Vector2.new(0.5, 0.5)
auraGlow.Size = UDim2.new(0, CW + 220, 0, CH + 220)
auraGlow.Position = UDim2.new(0.5, 0, 0.5, 0)
auraGlow.Parent = gui

-- ═══ جسم الجهاز: لوحة بيومترية معدنية (إطار + حافة مصقولة) ═══
local device = Instance.new("Frame")
device.AnchorPoint = Vector2.new(0.5, 0.5)
device.Size = UDim2.new(0, CW, 0, CH)
device.Position = UDim2.new(0.5, 0, 0.5, 0)
device.BackgroundColor3 = Color3.fromRGB(26, 30, 38)
device.Parent = gui
Instance.new("UICorner", device).CornerRadius = UDim.new(0, 30)
local devGrad = Instance.new("UIGradient")
devGrad.Color = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromRGB(46, 52, 64)),
	ColorSequenceKeypoint.new(0.5, Color3.fromRGB(26, 30, 38)),
	ColorSequenceKeypoint.new(1, Color3.fromRGB(16, 19, 26)),
})
devGrad.Rotation = 90
devGrad.Parent = device
local bezelStroke = Instance.new("UIStroke")
bezelStroke.Color = GOLD; bezelStroke.Thickness = 2.5; bezelStroke.Transparency = 0.15
bezelStroke.Parent = device

-- إطار داخلي رفيع يعطي إحساس البزل المعدني
local bezelInner = Instance.new("Frame")
bezelInner.BackgroundTransparency = 1
bezelInner.Size = UDim2.new(1, -14, 1, -14)
bezelInner.Position = UDim2.new(0, 7, 0, 7)
bezelInner.Parent = device
Instance.new("UICorner", bezelInner).CornerRadius = UDim.new(0, 24)
local biStroke = Instance.new("UIStroke")
biStroke.Color = Color3.fromRGB(64, 70, 84); biStroke.Thickness = 1; biStroke.Transparency = 0.2
biStroke.Parent = bezelInner

-- ═══ رأس الجهاز: شعار + نوع التحقّق + ليد حالة ═══
local statusDot = Instance.new("Frame")
statusDot.AnchorPoint = Vector2.new(0, 0.5)
statusDot.Size = UDim2.new(0, 12, 0, 12)
statusDot.Position = UDim2.new(0, 26, 0, 44)
statusDot.BackgroundColor3 = CYAN
statusDot.Parent = device
Instance.new("UICorner", statusDot).CornerRadius = UDim.new(1, 0)
local dotStroke = Instance.new("UIStroke"); dotStroke.Color = CYAN; dotStroke.Thickness = 1; dotStroke.Transparency = 0.4; dotStroke.Parent = statusDot

local title = Instance.new("TextLabel")
title.BackgroundTransparency = 1
title.Size = UDim2.new(1, -54, 0, 34)
title.Position = UDim2.new(0, 27, 0, 24)
title.Font = Enum.Font.GothamBlack
title.Text = "قصر شهد"
title.TextScaled = true
title.TextXAlignment = Enum.TextXAlignment.Right
title.TextColor3 = GOLD
title.Parent = device
local subtitle = Instance.new("TextLabel")
subtitle.BackgroundTransparency = 1
subtitle.Size = UDim2.new(1, -54, 0, 18)
subtitle.Position = UDim2.new(0, 27, 0, 60)
subtitle.Font = Enum.Font.Gotham
subtitle.Text = "بوابة التحقّق البيومتري"
subtitle.TextScaled = true
subtitle.TextXAlignment = Enum.TextXAlignment.Right
subtitle.TextColor3 = Color3.fromRGB(150, 170, 195)
subtitle.Parent = device

-- ═══ شاشة زجاجية غاطسة (الماسح) ═══
local glass = Instance.new("Frame")
glass.AnchorPoint = Vector2.new(0.5, 0)
glass.Size = UDim2.new(0, 300, 0, 300)
glass.Position = UDim2.new(0.5, 0, 0, 96)
glass.BackgroundColor3 = Color3.fromRGB(8, 12, 20)
glass.ClipsDescendants = true
glass.Parent = device
Instance.new("UICorner", glass).CornerRadius = UDim.new(0, 22)
local glassGrad = Instance.new("UIGradient")
glassGrad.Color = ColorSequence.new(Color3.fromRGB(16, 24, 38), Color3.fromRGB(5, 8, 14))
glassGrad.Rotation = 90
glassGrad.Parent = glass
local glassStroke = Instance.new("UIStroke")
glassStroke.Color = CYAN_D; glassStroke.Thickness = 1.5; glassStroke.Transparency = 0.25
glassStroke.Parent = glass
-- انعكاس زجاجي علوي خفيف
local sheen = Instance.new("Frame")
sheen.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
sheen.BackgroundTransparency = 0.9
sheen.Size = UDim2.new(1, 0, 0.32, 0)
sheen.BorderSizePixel = 0
sheen.ZIndex = 8
sheen.Parent = glass
local sheenGrad = Instance.new("UIGradient")
sheenGrad.Rotation = 90
sheenGrad.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 0.78),
	NumberSequenceKeypoint.new(1, 1),
})
sheenGrad.Parent = sheen

-- توهّج خلف البصمة داخل الزجاج
local glow = Instance.new("ImageLabel")
glow.BackgroundTransparency = 1
glow.Image = GLOW_TEX
glow.ImageColor3 = CYAN
glow.ImageTransparency = 0.4
glow.AnchorPoint = Vector2.new(0.5, 0.5)
glow.Size = UDim2.new(1.25, 0, 1.25, 0)
glow.Position = UDim2.new(0.5, 0, 0.5, 0)
glow.ZIndex = 1
glow.Parent = glass

-- حلقة التقدّم حول البصمة
local progRing = Instance.new("Frame")
progRing.AnchorPoint = Vector2.new(0.5, 0.5)
progRing.Size = UDim2.new(0, 250, 0, 250)
progRing.Position = UDim2.new(0.5, 0, 0.5, 0)
progRing.BackgroundTransparency = 1
progRing.ZIndex = 2
progRing.Parent = glass
Instance.new("UICorner", progRing).CornerRadius = UDim.new(1, 0)
local progStroke = Instance.new("UIStroke"); progStroke.Color = CYAN_D; progStroke.Thickness = 2; progStroke.Transparency = 0.25; progStroke.Parent = progRing

-- البصمة الواقعية (صورة Asset) — تتكشّف تدريجياً مع المسح
local fpImage = Instance.new("ImageLabel")
fpImage.BackgroundTransparency = 1
fpImage.Image = FP_TEX
fpImage.ImageColor3 = Color3.fromRGB(170, 225, 255)
fpImage.ImageTransparency = 0.78
fpImage.AnchorPoint = Vector2.new(0.5, 0.5)
fpImage.Size = UDim2.new(0, 210, 0, 210)
fpImage.Position = UDim2.new(0.5, 0, 0.5, 0)
fpImage.ZIndex = 3
fpImage.Parent = glass

-- دليل مكان اليد (يظهر بحالة الراحة فقط)
local handGuide = Instance.new("ImageLabel")
handGuide.BackgroundTransparency = 1
handGuide.Image = HAND_TEX
handGuide.ImageColor3 = Color3.fromRGB(150, 200, 240)
handGuide.ImageTransparency = 0.45
handGuide.AnchorPoint = Vector2.new(0.5, 0.5)
handGuide.Size = UDim2.new(0, 250, 0, 250)
handGuide.Position = UDim2.new(0.5, 0, 0.5, 0)
handGuide.ZIndex = 4
handGuide.Visible = false
handGuide.Parent = glass

-- خطّ مسح دوّار حول البصمة
local sweep = Instance.new("Frame")
sweep.AnchorPoint = Vector2.new(0.5, 1)
sweep.Size = UDim2.new(0, 3, 0, 122)
sweep.Position = UDim2.new(0.5, 0, 0.5, 0)
sweep.BackgroundColor3 = CYAN
sweep.BorderSizePixel = 0
sweep.ZIndex = 5
sweep.Parent = progRing
local swGrad = Instance.new("UIGradient")
swGrad.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 1),
	NumberSequenceKeypoint.new(1, 0.05),
})
swGrad.Rotation = 90
swGrad.Parent = sweep

-- شعاع المسح الأفقي على الزجاج
local scanline = Instance.new("Frame")
scanline.AnchorPoint = Vector2.new(0.5, 0.5)
scanline.Size = UDim2.new(0.82, 0, 0, 3)
scanline.Position = UDim2.new(0.5, 0, 0.08, 0)
scanline.BackgroundColor3 = Color3.fromRGB(180, 245, 255)
scanline.BorderSizePixel = 0
scanline.ZIndex = 7
scanline.Visible = false
scanline.Parent = glass
local slGrad = Instance.new("UIGradient")
slGrad.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 1),
	NumberSequenceKeypoint.new(0.5, 0),
	NumberSequenceKeypoint.new(1, 1),
})
slGrad.Parent = scanline

-- النسبة المئوية (تظهر أثناء المسح)
local pctLabel = Instance.new("TextLabel")
pctLabel.BackgroundTransparency = 1
pctLabel.Size = UDim2.new(0, 110, 0, 30)
pctLabel.AnchorPoint = Vector2.new(0.5, 1)
pctLabel.Position = UDim2.new(0.5, 0, 1, -14)
pctLabel.Font = Enum.Font.GothamBlack
pctLabel.Text = ""
pctLabel.TextScaled = true
pctLabel.ZIndex = 7
pctLabel.TextColor3 = GOLD_SCAN
pctLabel.TextTransparency = 0.1
pctLabel.Parent = glass

-- أيقونة النتيجة (✔ / ✘) تظهر فوق البصمة عند القبول/الرفض
local resultIcon = Instance.new("TextLabel")
resultIcon.BackgroundTransparency = 1
resultIcon.Size = UDim2.new(0, 120, 0, 120)
resultIcon.AnchorPoint = Vector2.new(0.5, 0.5)
resultIcon.Position = UDim2.new(0.5, 0, 0.5, 0)
resultIcon.Font = Enum.Font.GothamBlack
resultIcon.Text = ""
resultIcon.TextScaled = true
resultIcon.ZIndex = 9
resultIcon.TextColor3 = GREEN
resultIcon.Parent = glass

-- ═══ نص الحالة ═══
local status = Instance.new("TextLabel")
status.BackgroundTransparency = 1
status.Size = UDim2.new(1, -40, 0, 38)
status.Position = UDim2.new(0, 20, 0, 408)
status.Font = Enum.Font.GothamBold
status.Text = "ضع يدك على الماسح"
status.TextScaled = true
status.TextColor3 = Color3.fromRGB(205, 230, 255)
status.Parent = device

-- ═══ شريحة المعلومات (التكلفة / الرصيد) ═══
local chip = Instance.new("Frame")
chip.AnchorPoint = Vector2.new(0.5, 0)
chip.Size = UDim2.new(0, 230, 0, 38)
chip.Position = UDim2.new(0.5, 0, 0, 452)
chip.BackgroundColor3 = Color3.fromRGB(16, 22, 34)
chip.Parent = device
Instance.new("UICorner", chip).CornerRadius = UDim.new(1, 0)
local chipStroke = Instance.new("UIStroke"); chipStroke.Color = CYAN_D; chipStroke.Thickness = 1.3; chipStroke.Transparency = 0.1; chipStroke.Parent = chip
local chipLabel = Instance.new("TextLabel")
chipLabel.BackgroundTransparency = 1
chipLabel.Size = UDim2.new(1, -22, 1, -10)
chipLabel.Position = UDim2.new(0, 11, 0, 5)
chipLabel.Font = Enum.Font.GothamMedium
chipLabel.Text = "الدخول: 250 كوينز"
chipLabel.TextScaled = true
chipLabel.TextColor3 = Color3.fromRGB(220, 235, 255)
chipLabel.Parent = chip

-- ═══ شريط LED أرضي أسفل الجهاز (يتلوّن مع الحالة) ═══
local led = Instance.new("Frame")
led.AnchorPoint = Vector2.new(0.5, 1)
led.Size = UDim2.new(0, 250, 0, 6)
led.Position = UDim2.new(0.5, 0, 1, -22)
led.BackgroundColor3 = CYAN
led.BorderSizePixel = 0
led.Parent = device
Instance.new("UICorner", led).CornerRadius = UDim.new(1, 0)
local ledGrad = Instance.new("UIGradient")
ledGrad.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 1),
	NumberSequenceKeypoint.new(0.5, 0),
	NumberSequenceKeypoint.new(1, 1),
})
ledGrad.Parent = led

local scanning = false
local lastInfo = nil

local function setAccent(c: Color3)
	progStroke.Color = c
	sweep.BackgroundColor3 = c
	glow.ImageColor3 = c
	auraGlow.ImageColor3 = c
	pctLabel.TextColor3 = c
	statusDot.BackgroundColor3 = c
	dotStroke.Color = c
	chipStroke.Color = c
	led.BackgroundColor3 = c
	bezelStroke.Color = c
end

local function runScanFx()
	-- شعاع أفقي يصعد وينزل على البصمة (موجة ناعمة)
	task.spawn(function()
		while scanning do
			scanline.Position = UDim2.new(0.5, 0, 0.06, 0)
			local up = TweenService:Create(scanline, TweenInfo.new(0.95, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Position = UDim2.new(0.5, 0, 0.92, 0)})
			up:Play(); up.Completed:Wait()
			if not scanning then break end
			local dn = TweenService:Create(scanline, TweenInfo.new(0.95, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Position = UDim2.new(0.5, 0, 0.06, 0)})
			dn:Play(); dn.Completed:Wait()
		end
	end)
	-- خطّ دوّار حول البصمة
	task.spawn(function()
		while scanning do
			sweep.Rotation = 0
			local rot = TweenService:Create(sweep, TweenInfo.new(1.1, Enum.EasingStyle.Linear), {Rotation = 360})
			rot:Play(); rot.Completed:Wait()
		end
	end)
	-- النسبة 0→~94٪ + كشف البصمة تدريجياً (تتجمّع خطوطها)
	task.spawn(function()
		local p = 0
		while scanning and p < 94 do
			p += math.random(3, 6)
			if p > 94 then p = 94 end
			pctLabel.Text = p .. "%"
			fpImage.ImageTransparency = 0.78 - (p / 94) * 0.7   -- من باهت → واضح
			task.wait(0.13)
		end
	end)
	-- نبضة صوت خفيفة
	task.spawn(function()
		while scanning do
			sndBeep:Play()
			task.wait(0.5)
		end
	end)
end

-- بدء المسح: لحظة «جاهز» (دليل اليد + التكلفة) ثم طور المسح الذهبي
evStartScan.OnClientEvent:Connect(function(info)
	lastInfo = info
	scanning = true
	gui.Enabled = true
	device.Position = UDim2.new(0.5, 0, 0.5, 0)
	resultIcon.Text = ""
	pctLabel.Text = ""
	scanline.Visible = false
	sweep.Visible = true
	fpImage.ImageTransparency = 0.78
	fpImage.ImageColor3 = Color3.fromRGB(170, 225, 255)
	setAccent(CYAN)

	local kind = (type(info) == "table" and info.kind) or "entry"
	local cost = (type(info) == "table" and info.cost) or nil
	if kind == "exit" then
		chip.Visible = false
		status.Text = "ضع إصبعك للخروج"
	else
		chip.Visible = true
		chipLabel.Text = cost and ("الدخول: " .. cost .. " كوينز") or "تحقّق بيومتري"
		chipLabel.TextColor3 = Color3.fromRGB(220, 235, 255)
		status.Text = "ضع يدك على الماسح"
	end
	status.TextColor3 = Color3.fromRGB(205, 230, 255)

	-- لحظة الراحة: دليل اليد ظاهر، البصمة باهتة
	handGuide.Visible = true
	task.delay(0.45, function()
		if not scanning then return end
		handGuide.Visible = false
		scanline.Visible = true
		setAccent(GOLD_SCAN)
		fpImage.ImageColor3 = Color3.fromRGB(255, 220, 150)
		status.Text = "جارٍ قراءة البصمة…"
		status.TextColor3 = Color3.fromRGB(255, 225, 160)
		runScanFx()
	end)
end)

evScanResult.OnClientEvent:Connect(function(granted, info)
	scanning = false
	info = info or lastInfo
	handGuide.Visible = false
	scanline.Visible = false
	sweep.Visible = false
	local kind = (type(info) == "table" and info.kind) or "entry"
	if granted then
		setAccent(GREEN)
		fpImage.ImageTransparency = 0.05
		fpImage.ImageColor3 = Color3.fromRGB(150, 255, 190)
		pctLabel.Text = "100%"
		resultIcon.Text = "✓"
		resultIcon.TextColor3 = GREEN
		if kind == "exit" then
			status.Text = "تم التحقّق — تفضّل بالخروج"
			chip.Visible = false
		else
			status.Text = "تم التحقّق — تفضّل بالدخول"
			local bal = (type(info) == "table" and info.bal) or nil
			local cost = (type(info) == "table" and info.cost) or nil
			if kind == "admin" then
				chip.Visible = true
				chipLabel.Text = "دخول الإدارة · مجاني"
			elseif cost then
				chip.Visible = true
				chipLabel.Text = bal and ("خُصم " .. cost .. " · رصيدك " .. bal) or ("خُصم " .. cost .. " كوينز")
			end
			chipLabel.TextColor3 = Color3.fromRGB(200, 255, 215)
		end
		status.TextColor3 = Color3.fromRGB(150, 255, 190)
		sndSuccess:Play()
	else
		setAccent(RED)
		fpImage.ImageTransparency = 0.15
		fpImage.ImageColor3 = Color3.fromRGB(255, 150, 150)
		pctLabel.Text = ""
		resultIcon.Text = "✕"
		resultIcon.TextColor3 = RED
		status.Text = "رصيدك غير كافٍ"
		status.TextColor3 = Color3.fromRGB(255, 140, 140)
		local bal = (type(info) == "table" and info.bal) or nil
		local cost = (type(info) == "table" and info.cost) or nil
		if cost then
			chip.Visible = true
			chipLabel.Text = bal and ("معك " .. bal .. " · تحتاج " .. cost) or ("تحتاج " .. cost .. " كوينز")
			chipLabel.TextColor3 = Color3.fromRGB(255, 190, 190)
		end
		sndDenied:Play()
		-- اهتزاز بسيط للجهاز
		for _ = 1, 4 do
			device.Position = UDim2.new(0.5, 8, 0.5, 0); task.wait(0.04)
			device.Position = UDim2.new(0.5, -8, 0.5, 0); task.wait(0.04)
		end
		device.Position = UDim2.new(0.5, 0, 0.5, 0)
	end
	task.delay(2.2, function()
		if not scanning then gui.Enabled = false end
	end)
end)

----------------------------------------------------------------------
-- 🗒️ عارض سجلّ الدخول (أدمن)
----------------------------------------------------------------------
local logGui = Instance.new("ScreenGui")
logGui.Name = "PalaceLogGui"
logGui.ResetOnSpawn = false
logGui.DisplayOrder = 51
logGui.Enabled = false
logGui.Parent = pg

local lDim = Instance.new("Frame")
lDim.Size = UDim2.new(1, 0, 1, 0)
lDim.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
lDim.BackgroundTransparency = 0.5
lDim.Parent = logGui

local lCard = Instance.new("Frame")
lCard.Size = UDim2.new(0, 420, 0, 520)
lCard.Position = UDim2.new(0.5, -210, 0.5, -260)
lCard.BackgroundColor3 = Color3.fromRGB(18, 22, 34)
lCard.Parent = logGui
Instance.new("UICorner", lCard).CornerRadius = UDim.new(0, 20)
local lStroke = Instance.new("UIStroke"); lStroke.Color = GOLD; lStroke.Thickness = 2.5; lStroke.Parent = lCard

local lTitle = Instance.new("TextLabel")
lTitle.BackgroundTransparency = 1
lTitle.Size = UDim2.new(1, -20, 0, 52)
lTitle.Position = UDim2.new(0, 10, 0, 12)
lTitle.Font = Enum.Font.GothamBlack
lTitle.Text = "سجلّ دخول القصر"
lTitle.TextScaled = true
lTitle.TextColor3 = GOLD
lTitle.Parent = lCard

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 36, 0, 36)
closeBtn.Position = UDim2.new(1, -44, 0, 12)
closeBtn.BackgroundColor3 = Color3.fromRGB(180, 60, 60)
closeBtn.Font = Enum.Font.GothamBold
closeBtn.Text = "X"
closeBtn.TextScaled = true
closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
closeBtn.Parent = lCard
Instance.new("UICorner", closeBtn).CornerRadius = UDim.new(0, 10)
closeBtn.Activated:Connect(function() logGui.Enabled = false end)

local listFrame = Instance.new("ScrollingFrame")
listFrame.Size = UDim2.new(1, -24, 1, -78)
listFrame.Position = UDim2.new(0, 12, 0, 66)
listFrame.BackgroundTransparency = 1
listFrame.BorderSizePixel = 0
listFrame.ScrollBarThickness = 6
listFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
listFrame.Parent = lCard
local listLayout = Instance.new("UIListLayout")
listLayout.Padding = UDim.new(0, 6)
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Parent = listFrame

local function clearList()
	for _, c in ipairs(listFrame:GetChildren()) do
		if c:IsA("Frame") then c:Destroy() end
	end
end

local function addRow(i, name, t)
	local row = Instance.new("Frame")
	row.Size = UDim2.new(1, -6, 0, 46)
	row.BackgroundColor3 = Color3.fromRGB(28, 34, 50)
	row.LayoutOrder = i
	row.Parent = listFrame
	Instance.new("UICorner", row).CornerRadius = UDim.new(0, 10)
	local nm = Instance.new("TextLabel")
	nm.BackgroundTransparency = 1
	nm.Size = UDim2.new(0.55, 0, 1, 0)
	nm.Position = UDim2.new(0, 12, 0, 0)
	nm.Font = Enum.Font.GothamBold
	nm.TextXAlignment = Enum.TextXAlignment.Left
	nm.Text = tostring(name)
	nm.TextScaled = true
	nm.TextColor3 = Color3.fromRGB(235, 240, 250)
	nm.Parent = row
	local tm = Instance.new("TextLabel")
	tm.BackgroundTransparency = 1
	tm.Size = UDim2.new(0.42, -10, 1, 0)
	tm.Position = UDim2.new(0.57, 0, 0, 0)
	tm.Font = Enum.Font.Gotham
	tm.TextXAlignment = Enum.TextXAlignment.Right
	tm.Text = os.date("%m-%d  %H:%M", t)
	tm.TextScaled = true
	tm.TextColor3 = Color3.fromRGB(170, 185, 210)
	tm.Parent = row
end

evLogData.OnClientEvent:Connect(function(data)
	if data == false or type(data) ~= "table" then
		-- لا صلاحية: لا نفتح اللوحة، فقط ملاحظة سريعة عبر العنوان
		return
	end
	clearList()
	if #data == 0 then
		local empty = Instance.new("Frame")
		empty.Size = UDim2.new(1, -6, 0, 46)
		empty.BackgroundTransparency = 1
		empty.Parent = listFrame
		local lbl = Instance.new("TextLabel")
		lbl.BackgroundTransparency = 1; lbl.Size = UDim2.new(1,0,1,0)
		lbl.Font = Enum.Font.Gotham; lbl.Text = "لا توجد سجلّات بعد"; lbl.TextScaled = true
		lbl.TextColor3 = Color3.fromRGB(170,185,210); lbl.Parent = empty
	else
		for i, e in ipairs(data) do
			addRow(i, e.name, e.t)
		end
	end
	listFrame.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y + 8)
	logGui.Enabled = true
end)
