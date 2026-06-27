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
-- 🖐️ شاشة المسح البيومتري — نمط هولوغرام احترافي
--      بصمة هولوغرامية متوهّجة فوق منصّة ضوئية + شعاع مسح + حلقة تقدّم
--      بنسبة + تدرّج لوني للحالة: أزرق(جاهز) → ذهبي(يمسح) → أخضر/أحمر.
----------------------------------------------------------------------
local CYAN   = Color3.fromRGB(95, 210, 255)
local CYAN_D = Color3.fromRGB(45, 120, 165)
local GREEN  = Color3.fromRGB(90, 240, 150)
local RED    = Color3.fromRGB(245, 100, 100)
local CW, CH = 380, 520   -- أبعاد البطاقة

local gui = Instance.new("ScreenGui")
gui.Name = "PalaceScanGui"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.DisplayOrder = 50
gui.Enabled = false
gui.Parent = pg

local dim = Instance.new("Frame")
dim.Size = UDim2.new(1, 0, 1, 0)
dim.BackgroundColor3 = Color3.fromRGB(2, 4, 9)
dim.BackgroundTransparency = 0.32
dim.Parent = gui

local card = Instance.new("Frame")
card.AnchorPoint = Vector2.new(0.5, 0.5)
card.Size = UDim2.new(0, CW, 0, CH)
card.Position = UDim2.new(0.5, 0, 0.5, 0)
card.BackgroundColor3 = Color3.fromRGB(13, 20, 33)
card.Parent = gui
Instance.new("UICorner", card).CornerRadius = UDim.new(0, 26)
local cardGrad = Instance.new("UIGradient")
cardGrad.Color = ColorSequence.new(Color3.fromRGB(17, 26, 42), Color3.fromRGB(9, 14, 24))
cardGrad.Rotation = 90
cardGrad.Parent = card
local cardStroke = Instance.new("UIStroke"); cardStroke.Color = CYAN_D; cardStroke.Thickness = 2; cardStroke.Parent = card
-- إطار ذهبي داخلي رفيع
local inner = Instance.new("Frame")
inner.BackgroundTransparency = 1
inner.Size = UDim2.new(1, -12, 1, -12)
inner.Position = UDim2.new(0, 6, 0, 6)
inner.Parent = card
Instance.new("UICorner", inner).CornerRadius = UDim.new(0, 21)
local innerStroke = Instance.new("UIStroke"); innerStroke.Color = Color3.fromRGB(120, 95, 45); innerStroke.Thickness = 1; innerStroke.Transparency = 0.3; innerStroke.Parent = inner

local title = Instance.new("TextLabel")
title.BackgroundTransparency = 1
title.Size = UDim2.new(1, -30, 0, 42)
title.Position = UDim2.new(0, 15, 0, 18)
title.Font = Enum.Font.GothamBlack
title.Text = "قصر شهد"
title.TextScaled = true
title.TextColor3 = GOLD
title.Parent = card
local subtitle = Instance.new("TextLabel")
subtitle.BackgroundTransparency = 1
subtitle.Size = UDim2.new(1, -30, 0, 22)
subtitle.Position = UDim2.new(0, 15, 0, 62)
subtitle.Font = Enum.Font.Gotham
subtitle.Text = "تحقّق بيومتري"
subtitle.TextScaled = true
subtitle.TextColor3 = CYAN
subtitle.Parent = card

-- منطقة الهولوغرام
local scanBox = Instance.new("Frame")
scanBox.AnchorPoint = Vector2.new(0.5, 0)
scanBox.Size = UDim2.new(0, 280, 0, 300)
scanBox.Position = UDim2.new(0.5, 0, 0, 96)
scanBox.BackgroundTransparency = 1
scanBox.ClipsDescendants = true
scanBox.Parent = card

-- توهّج خلفي للبصمة
local glow = Instance.new("ImageLabel")
glow.BackgroundTransparency = 1
glow.Image = "rbxassetid://5028857084"
glow.ImageColor3 = CYAN
glow.ImageTransparency = 0.25
glow.AnchorPoint = Vector2.new(0.5, 0.5)
glow.Size = UDim2.new(1.5, 0, 1.5, 0)
glow.Position = UDim2.new(0.5, 0, 0.42, 0)
glow.Parent = scanBox

-- حلقة التقدّم الخارجية (زخرفية) + علامات
local progRing = Instance.new("Frame")
progRing.AnchorPoint = Vector2.new(0.5, 0.5)
progRing.Size = UDim2.new(0, 250, 0, 250)
progRing.Position = UDim2.new(0.5, 0, 0.42, 0)
progRing.BackgroundTransparency = 1
progRing.Parent = scanBox
Instance.new("UICorner", progRing).CornerRadius = UDim.new(1, 0)
local progStroke = Instance.new("UIStroke"); progStroke.Color = CYAN_D; progStroke.Thickness = 2; progStroke.Transparency = 0.2; progStroke.Parent = progRing

-- خطّ مسح دوّار (يدور حول البصمة أثناء المسح)
local sweep = Instance.new("Frame")
sweep.AnchorPoint = Vector2.new(0.5, 1)
sweep.Size = UDim2.new(0, 3, 0, 125)
sweep.Position = UDim2.new(0.5, 0, 0.5, 0)
sweep.BackgroundColor3 = CYAN
sweep.BorderSizePixel = 0
sweep.ZIndex = 4
sweep.Parent = progRing
local swGrad = Instance.new("UIGradient")
swGrad.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 1),
	NumberSequenceKeypoint.new(1, 0.05),
})
swGrad.Rotation = 90
swGrad.Parent = sweep

-- بصمة هولوغرامية: حلقات متّحدة المركز بإزاحة بسيطة (إحساس لولبي)
local printRidges = {}
for i = 0, 6 do
	local ring = Instance.new("Frame")
	ring.AnchorPoint = Vector2.new(0.5, 0.5)
	local ox = math.sin(i * 0.9) * 0.04
	ring.Position = UDim2.new(0.5 + ox, 0, 0.42, 0)
	local s = 0.86 - i * 0.115
	ring.Size = UDim2.new(s, 0, s * 1.16, 0)
	ring.BackgroundTransparency = 1
	ring.ZIndex = 2
	ring.Parent = scanBox
	Instance.new("UICorner", ring).CornerRadius = UDim.new(1, 0)
	local st = Instance.new("UIStroke")
	st.Thickness = 2.5
	st.Color = Color3.fromRGB(170, 230, 255)
	st.Transparency = 0.05
	st.Parent = ring
	table.insert(printRidges, st)
end
local function tintPrint(c: Color3)
	for _, st in ipairs(printRidges) do st.Color = c end
end

-- منصّة ضوئية أسفل البصمة
local platform = Instance.new("Frame")
platform.AnchorPoint = Vector2.new(0.5, 0.5)
platform.Size = UDim2.new(0, 200, 0, 26)
platform.Position = UDim2.new(0.5, 0, 0.93, 0)
platform.BackgroundTransparency = 1
platform.ZIndex = 3
platform.Parent = scanBox
Instance.new("UICorner", platform).CornerRadius = UDim.new(1, 0)
local platStroke = Instance.new("UIStroke"); platStroke.Color = CYAN; platStroke.Thickness = 2; platStroke.Transparency = 0.1; platStroke.Parent = platform

-- شعاع المسح الأفقي
local scanline = Instance.new("Frame")
scanline.AnchorPoint = Vector2.new(0.5, 0.5)
scanline.Size = UDim2.new(0.78, 0, 0, 3)
scanline.Position = UDim2.new(0.5, 0, 0.1, 0)
scanline.BackgroundColor3 = Color3.fromRGB(170, 245, 255)
scanline.BorderSizePixel = 0
scanline.ZIndex = 5
scanline.Parent = scanBox
local slGrad = Instance.new("UIGradient")
slGrad.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 1),
	NumberSequenceKeypoint.new(0.5, 0),
	NumberSequenceKeypoint.new(1, 1),
})
slGrad.Parent = scanline

-- النسبة المئوية
local pctLabel = Instance.new("TextLabel")
pctLabel.BackgroundTransparency = 1
pctLabel.Size = UDim2.new(0, 120, 0, 36)
pctLabel.AnchorPoint = Vector2.new(0.5, 0.5)
pctLabel.Position = UDim2.new(0.5, 0, 0.42, 0)
pctLabel.Font = Enum.Font.GothamBlack
pctLabel.Text = "0%"
pctLabel.TextScaled = true
pctLabel.ZIndex = 6
pctLabel.TextColor3 = GOLD
pctLabel.TextTransparency = 0.15
pctLabel.Parent = scanBox

local status = Instance.new("TextLabel")
status.BackgroundTransparency = 1
status.Size = UDim2.new(1, -24, 0, 54)
status.Position = UDim2.new(0, 12, 1, -72)
status.Font = Enum.Font.GothamBold
status.Text = "جاري قراءة البصمة…"
status.TextScaled = true
status.TextColor3 = Color3.fromRGB(200, 230, 255)
status.Parent = card

local scanning = false

local function runScanFx()
	-- شعاع أفقي يصعد وينزل على البصمة
	task.spawn(function()
		while scanning do
			scanline.Position = UDim2.new(0.5, 0, 0.05, 0)
			local up = TweenService:Create(scanline, TweenInfo.new(0.95, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Position = UDim2.new(0.5, 0, 0.8, 0)})
			up:Play(); up.Completed:Wait()
			if not scanning then break end
			local dn = TweenService:Create(scanline, TweenInfo.new(0.95, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Position = UDim2.new(0.5, 0, 0.05, 0)})
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
	-- النسبة تتقدّم 0→~92٪ تدريجياً حتى تصل النتيجة
	task.spawn(function()
		local p = 0
		while scanning and p < 92 do
			p += math.random(2, 5)
			if p > 92 then p = 92 end
			pctLabel.Text = p .. "%"
			task.wait(0.16)
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

local function setAccent(c: Color3)
	tintPrint(c)
	progStroke.Color = c
	platStroke.Color = c
	sweep.BackgroundColor3 = c
	glow.ImageColor3 = c
	pctLabel.TextColor3 = c
end

evStartScan.OnClientEvent:Connect(function()
	scanning = true
	gui.Enabled = true
	card.Size = UDim2.new(0, CW, 0, CH)
	scanline.Visible = true
	sweep.Visible = true
	pctLabel.Text = "0%"
	setAccent(CYAN)
	-- لون البصمة أفتح من اللكنة لإحساس الهولوغرام
	tintPrint(Color3.fromRGB(170, 230, 255))
	status.Text = "جاري قراءة البصمة…"
	status.TextColor3 = Color3.fromRGB(200, 230, 255)
	-- تحوّل للذهبي (طور المسح) بعد لحظة
	task.delay(0.35, function()
		if scanning then setAccent(GOLD); tintPrint(Color3.fromRGB(245, 220, 150)) end
	end)
	runScanFx()
end)

evScanResult.OnClientEvent:Connect(function(granted)
	scanning = false
	scanline.Visible = false
	sweep.Visible = false
	if granted then
		setAccent(GREEN)
		pctLabel.Text = "100%"
		status.Text = "تم التحقق — تفضّل بالدخول"
		status.TextColor3 = Color3.fromRGB(120, 245, 160)
		sndSuccess:Play()
	else
		setAccent(RED)
		status.Text = "رصيدك غير كافٍ — تحتاج 250 كوينز"
		status.TextColor3 = Color3.fromRGB(255, 120, 120)
		sndDenied:Play()
		-- اهتزاز بسيط
		for _ = 1, 4 do
			card.Position = UDim2.new(0.5, 8, 0.5, 0); task.wait(0.04)
			card.Position = UDim2.new(0.5, -8, 0.5, 0); task.wait(0.04)
		end
		card.Position = UDim2.new(0.5, 0, 0.5, 0)
	end
	task.delay(2.0, function()
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
