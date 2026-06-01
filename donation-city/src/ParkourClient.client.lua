--[[
╔══════════════════════════════════════════════════════════════════════╗
║  واجهة الباركور — PARKOUR CLIENT (Client)                            ║
║  المكان: StarterPlayerScripts    ·     النوع: LocalScript              ║
║                                                                        ║
║  • شريط تقدّم علوي: المرحلة + النقطة + النسبة + الوقت الجاري            ║
║  • نافذة إكمال عند إنهاء المسار (الوقت + المكافأة)                     ║
║  • يستقبل التحديثات من ParkourRemotes.Progress                         ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService       = game:GetService("RunService")

local player = Players.LocalPlayer
local pg = player:WaitForChild("PlayerGui")

local remotes = ReplicatedStorage:WaitForChild("ParkourRemotes", 30)
if not remotes then return end
local progressRemote = remotes:WaitForChild("Progress", 30)
if not progressRemote then return end
local stopRemote = remotes:WaitForChild("Stop", 30)

----------------------------------------------------------------------
-- بناء الواجهة
----------------------------------------------------------------------
local gui = Instance.new("ScreenGui")
gui.Name = "ParkourHUD"; gui.ResetOnSpawn = false; gui.IgnoreGuiInset = true
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling; gui.Parent = pg

-- شريط التقدّم (أعلى الوسط) — مصغّر ليأخذ مساحة أقل من الشاشة
local bar = Instance.new("Frame")
bar.AnchorPoint = Vector2.new(0.5, 0)
bar.Position = UDim2.new(0.5, 0, 0, 10)
bar.Size = UDim2.fromOffset(248, 46)
bar.BackgroundColor3 = Color3.fromRGB(18, 20, 34)
bar.BackgroundTransparency = 0.1
bar.Visible = false
bar.Parent = gui
local barCorner = Instance.new("UICorner"); barCorner.CornerRadius = UDim.new(0, 10); barCorner.Parent = bar
local barStroke = Instance.new("UIStroke"); barStroke.Color = Color3.fromRGB(255, 205, 70); barStroke.Thickness = 1.5; barStroke.Parent = bar

local title = Instance.new("TextLabel")
title.BackgroundTransparency = 1; title.Position = UDim2.new(0, 8, 0, 4); title.Size = UDim2.new(1, -16, 0, 17)
title.Font = Enum.Font.GothamBlack; title.TextScaled = true; title.TextXAlignment = Enum.TextXAlignment.Center
title.TextColor3 = Color3.fromRGB(255, 215, 90); title.Text = "🧗 الباركور"; title.Parent = bar

local info = Instance.new("TextLabel")
info.BackgroundTransparency = 1; info.Position = UDim2.new(0, 8, 0, 22); info.Size = UDim2.new(1, -16, 0, 18)
info.Font = Enum.Font.GothamMedium; info.TextScaled = true; info.TextXAlignment = Enum.TextXAlignment.Center
info.TextColor3 = Color3.fromRGB(235, 235, 245); info.Text = ""; info.Parent = bar

-- شريط النسبة المئوية (خط سفلي)
local pct = Instance.new("Frame")
pct.AnchorPoint = Vector2.new(0, 1); pct.Position = UDim2.new(0, 0, 1, 0)
pct.Size = UDim2.new(0, 0, 0, 4); pct.BackgroundColor3 = Color3.fromRGB(90, 200, 120); pct.BorderSizePixel = 0
pct.Parent = bar

-- زر «إيقاف الباركور / خروج» (يظهر فقط أثناء اللعب)
local stopBtn = Instance.new("TextButton")
stopBtn.AnchorPoint = Vector2.new(0.5, 0)
stopBtn.Position = UDim2.new(0.5, 0, 0, 60)
stopBtn.Size = UDim2.fromOffset(168, 28)
stopBtn.BackgroundColor3 = Color3.fromRGB(200, 70, 70)
stopBtn.BackgroundTransparency = 0.05
stopBtn.Font = Enum.Font.GothamBold; stopBtn.TextSize = 15
stopBtn.TextColor3 = Color3.new(1, 1, 1)
stopBtn.Text = "❌ إيقاف الباركور"
stopBtn.AutoButtonColor = true
stopBtn.Visible = false
stopBtn.Parent = gui
local sbC = Instance.new("UICorner"); sbC.CornerRadius = UDim.new(0, 9); sbC.Parent = stopBtn
stopBtn.Activated:Connect(function()
	if stopRemote then stopRemote:FireServer() end
end)

----------------------------------------------------------------------
-- نافذة الإكمال
----------------------------------------------------------------------
local function showFinish(timeStr, reward)
	local pop = Instance.new("Frame")
	pop.AnchorPoint = Vector2.new(0.5, 0.5); pop.Position = UDim2.new(0.5, 0, 0.42, 0)
	pop.Size = UDim2.fromOffset(420, 200); pop.BackgroundColor3 = Color3.fromRGB(24, 26, 44); pop.Parent = gui
	local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, 18); c.Parent = pop
	local s = Instance.new("UIStroke"); s.Color = Color3.fromRGB(190, 120, 255); s.Thickness = 3; s.Parent = pop
	local h = Instance.new("TextLabel"); h.BackgroundTransparency = 1; h.Position = UDim2.new(0, 0, 0, 16)
	h.Size = UDim2.new(1, 0, 0, 60); h.Font = Enum.Font.GothamBlack; h.TextScaled = true
	h.TextColor3 = Color3.fromRGB(255, 215, 90); h.Text = "🏁 أكملت الباركور!"; h.Parent = pop
	local d = Instance.new("TextLabel"); d.BackgroundTransparency = 1; d.Position = UDim2.new(0, 20, 0, 86)
	d.Size = UDim2.new(1, -40, 0, 90); d.Font = Enum.Font.GothamMedium; d.TextScaled = true
	d.TextColor3 = Color3.fromRGB(235, 235, 245)
	d.Text = string.format("الوقت: %s\nالمكافأة: %d كوينز + لقب «بطل الباركور» 🏆", timeStr, reward)
	d.Parent = pop
	task.delay(6, function() if pop then pop:Destroy() end end)
end

----------------------------------------------------------------------
-- استقبال التحديثات + عدّاد محلي سلس
----------------------------------------------------------------------
local function fmtTime(sec)
	local m = math.floor(sec / 60)
	local s = sec - m * 60
	return string.format("%d:%05.2f", m, s)
end

local active = false
local baseTime = 0          -- آخر وقت من السيرفر
local baseClock = 0         -- لحظة استلامه محلياً
local curStage, curCp, curTotal, curPct = 1, 1, 1, 0

local STAGE_COLORS = {
	[1] = Color3.fromRGB(90, 200, 120), [2] = Color3.fromRGB(95, 170, 255),
	[3] = Color3.fromRGB(255, 150, 70), [4] = Color3.fromRGB(200, 110, 255),
}
local STAGE_NAMES = { [1] = "سهلة", [2] = "متوسطة", [3] = "صعبة", [4] = "أسطورية" }

progressRemote.OnClientEvent:Connect(function(data)
	if type(data) ~= "table" then return end
	if data.state == "finish" then
		active = false; bar.Visible = false; stopBtn.Visible = false
		player:SetAttribute("InParkour", false)   -- يسمح بالجري ثانية خارج المسار
		showFinish(fmtTime(data.time or 0), data.reward or 0)
		return
	end
	if data.state == "idle" then
		active = false; bar.Visible = false; stopBtn.Visible = false
		player:SetAttribute("InParkour", false)
		return
	end
	-- run
	active = true; bar.Visible = true; stopBtn.Visible = true
	player:SetAttribute("InParkour", true)   -- يوقف الجري داخل المسار (سرعة ثابتة للتحكّم)
	baseTime = data.time or 0; baseClock = os.clock()
	curStage = data.stage or 1; curCp = data.cp or 1; curTotal = data.total or 1; curPct = data.percent or 0
	pct.BackgroundColor3 = STAGE_COLORS[curStage] or STAGE_COLORS[1]
end)

RunService.RenderStepped:Connect(function()
	if not active then return end
	local t = baseTime + (os.clock() - baseClock)
	info.Text = string.format("المرحلة %s · نقطة %d/%d · %d%% · ⏱️ %s",
		STAGE_NAMES[curStage] or curStage, curCp, curTotal, curPct, fmtTime(t))
	pct.Size = UDim2.new(curPct / 100, 0, 0, 5)
end)
