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
-- 🖐️ شاشة المسح
----------------------------------------------------------------------
local gui = Instance.new("ScreenGui")
gui.Name = "PalaceScanGui"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.DisplayOrder = 50
gui.Enabled = false
gui.Parent = pg

local dim = Instance.new("Frame")
dim.Size = UDim2.new(1, 0, 1, 0)
dim.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
dim.BackgroundTransparency = 0.4
dim.Parent = gui

local card = Instance.new("Frame")
card.Size = UDim2.new(0, 360, 0, 460)
card.Position = UDim2.new(0.5, -180, 0.5, -230)
card.BackgroundColor3 = Color3.fromRGB(16, 20, 32)
card.Parent = gui
local cardCorner = Instance.new("UICorner"); cardCorner.CornerRadius = UDim.new(0, 22); cardCorner.Parent = card
local cardStroke = Instance.new("UIStroke"); cardStroke.Color = GOLD; cardStroke.Thickness = 2.5; cardStroke.Parent = card

local title = Instance.new("TextLabel")
title.BackgroundTransparency = 1
title.Size = UDim2.new(1, -20, 0, 50)
title.Position = UDim2.new(0, 10, 0, 14)
title.Font = Enum.Font.GothamBlack
title.Text = "قفل القصر الرئاسي"
title.TextScaled = true
title.TextColor3 = GOLD
title.Parent = card

-- منطقة البصمة
local scanBox = Instance.new("Frame")
scanBox.Size = UDim2.new(0, 220, 0, 250)
scanBox.Position = UDim2.new(0.5, -110, 0, 78)
scanBox.BackgroundColor3 = Color3.fromRGB(10, 26, 40)
scanBox.ClipsDescendants = true
scanBox.Parent = card
local sbCorner = Instance.new("UICorner"); sbCorner.CornerRadius = UDim.new(0, 16); sbCorner.Parent = scanBox
local sbStroke = Instance.new("UIStroke"); sbStroke.Color = Color3.fromRGB(60, 150, 210); sbStroke.Thickness = 2; sbStroke.Parent = scanBox

local glow = Instance.new("ImageLabel")
glow.BackgroundTransparency = 1
glow.Image = "rbxassetid://5028857084"
glow.ImageColor3 = Color3.fromRGB(70, 170, 240)
glow.ImageTransparency = 0.2
glow.Size = UDim2.new(1.4, 0, 1.4, 0)
glow.Position = UDim2.new(-0.2, 0, -0.2, 0)
glow.Parent = scanBox

local fingerprint = Instance.new("TextLabel")
fingerprint.BackgroundTransparency = 1
fingerprint.Size = UDim2.new(1, 0, 1, 0)
fingerprint.Font = Enum.Font.GothamBlack
fingerprint.Text = "🖐️"
fingerprint.TextScaled = true
fingerprint.TextColor3 = Color3.fromRGB(150, 215, 255)
fingerprint.Parent = scanBox

-- خط المسح المتحرّك
local scanline = Instance.new("Frame")
scanline.Size = UDim2.new(1, 0, 0, 4)
scanline.Position = UDim2.new(0, 0, 0, 0)
scanline.BackgroundColor3 = Color3.fromRGB(120, 230, 255)
scanline.Parent = scanBox
local slGrad = Instance.new("UIGradient")
slGrad.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 1),
	NumberSequenceKeypoint.new(0.5, 0),
	NumberSequenceKeypoint.new(1, 1),
})
slGrad.Parent = scanline

local status = Instance.new("TextLabel")
status.BackgroundTransparency = 1
status.Size = UDim2.new(1, -20, 0, 70)
status.Position = UDim2.new(0, 10, 1, -86)
status.Font = Enum.Font.GothamBold
status.Text = "جاري قراءة البصمة…"
status.TextScaled = true
status.TextColor3 = Color3.fromRGB(200, 230, 255)
status.Parent = card

local scanning = false

local function runScanline()
	task.spawn(function()
		while scanning do
			scanline.Position = UDim2.new(0, 0, 0, 0)
			local up = TweenService:Create(scanline, TweenInfo.new(0.9, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Position = UDim2.new(0, 0, 1, -4)})
			up:Play(); up.Completed:Wait()
			if not scanning then break end
			local dn = TweenService:Create(scanline, TweenInfo.new(0.9, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Position = UDim2.new(0, 0, 0, 0)})
			dn:Play(); dn.Completed:Wait()
		end
	end)
	task.spawn(function()
		while scanning do
			sndBeep:Play()
			task.wait(0.5)
		end
	end)
end

evStartScan.OnClientEvent:Connect(function()
	scanning = true
	gui.Enabled = true
	card.Size = UDim2.new(0, 360, 0, 460)
	scanBox.Visible = true
	scanline.Visible = true
	fingerprint.TextColor3 = Color3.fromRGB(150, 215, 255)
	sbStroke.Color = Color3.fromRGB(60, 150, 210)
	glow.ImageColor3 = Color3.fromRGB(70, 170, 240)
	status.Text = "جاري قراءة البصمة…"
	status.TextColor3 = Color3.fromRGB(200, 230, 255)
	runScanline()
end)

evScanResult.OnClientEvent:Connect(function(granted)
	scanning = false
	scanline.Visible = false
	if granted then
		fingerprint.Text = "✓"
		fingerprint.TextColor3 = Color3.fromRGB(70, 235, 130)
		sbStroke.Color = Color3.fromRGB(70, 235, 130)
		glow.ImageColor3 = Color3.fromRGB(70, 235, 130)
		status.Text = "✓ تم التحقق — تفضّل بالدخول"
		status.TextColor3 = Color3.fromRGB(120, 245, 160)
		sndSuccess:Play()
	else
		fingerprint.Text = "✕"
		fingerprint.TextColor3 = Color3.fromRGB(245, 90, 90)
		sbStroke.Color = Color3.fromRGB(245, 90, 90)
		glow.ImageColor3 = Color3.fromRGB(245, 90, 90)
		status.Text = "🚫 للأدمن فقط"
		status.TextColor3 = Color3.fromRGB(255, 120, 120)
		sndDenied:Play()
		-- اهتزاز بسيط
		for _ = 1, 4 do
			card.Position = UDim2.new(0.5, -180 + 8, 0.5, -230); task.wait(0.04)
			card.Position = UDim2.new(0.5, -180 - 8, 0.5, -230); task.wait(0.04)
		end
		card.Position = UDim2.new(0.5, -180, 0.5, -230)
	end
	task.delay(1.9, function()
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
lTitle.Text = "🗒️ سجلّ دخول القصر"
lTitle.TextScaled = true
lTitle.TextColor3 = GOLD
lTitle.Parent = lCard

local closeBtn = Instance.new("TextButton")
closeBtn.Size = UDim2.new(0, 36, 0, 36)
closeBtn.Position = UDim2.new(1, -44, 0, 12)
closeBtn.BackgroundColor3 = Color3.fromRGB(180, 60, 60)
closeBtn.Font = Enum.Font.GothamBold
closeBtn.Text = "✕"
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
	nm.Text = "👤 " .. tostring(name)
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
