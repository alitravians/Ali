--!nonstrict
----------------------------------------------------------------------
-- DAY NIGHT CLIENT (Client)
--   ساعة السيرفر (HUD) أعلى الشاشة — شريحة زجاج داكن فاخرة بإطار ذهبي
--   متدرّج وظل ناعم، تعرض وقت السيرفر بتوقيت البحرين + شمس بأشعة دوّارة
--   نهاراً تتحوّل لهلال ليلاً، توهّج نابض، واسم المرحلة (الفجر/الصباح/
--   الظهر/العصر/المغرب/الليل) مع انتقالات ألوان سلسة.
--   تتحدّث محلياً وتُزامَن من السيرفر دورياً عبر RemoteEvent "ServerClockSync".
----------------------------------------------------------------------
local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")
local TweenService      = game:GetService("TweenService")

local player = Players.LocalPlayer
local pg     = player:WaitForChild("PlayerGui")
local clockEvent = ReplicatedStorage:WaitForChild("ServerClockSync")

local GOLD       = Color3.fromRGB(214, 175, 92)
local GOLD_LIGHT = Color3.fromRGB(245, 218, 150)
local GLOW_TEX   = "rbxassetid://5028857084"
local SHADOW_TEX = "rbxassetid://6014261993"

----------------------------------------------------------------------
-- بناء الـHUD
----------------------------------------------------------------------
local gui = Instance.new("ScreenGui")
gui.Name = "ServerClockGui"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.DisplayOrder = 30
gui.Parent = pg

-- إطار حاوٍ (ثابت) — يحمل الظل والشريحة معاً
local holder = Instance.new("Frame")
holder.AnchorPoint = Vector2.new(0.5, 0)
holder.Position = UDim2.new(0.5, 0, 0, 12)
holder.Size = UDim2.new(0, 248, 0, 66)
holder.BackgroundTransparency = 1
holder.Parent = gui

-- ظل ناعم خلف الشريحة
local shadow = Instance.new("ImageLabel")
shadow.BackgroundTransparency = 1
shadow.Image = SHADOW_TEX
shadow.ImageColor3 = Color3.fromRGB(0, 0, 0)
shadow.ImageTransparency = 0.45
shadow.ScaleType = Enum.ScaleType.Slice
shadow.SliceCenter = Rect.new(49, 49, 450, 450)
shadow.AnchorPoint = Vector2.new(0.5, 0.5)
shadow.Position = UDim2.new(0.5, 0, 0.5, 6)
shadow.Size = UDim2.new(1, 36, 1, 36)
shadow.Parent = holder

-- الشريحة الزجاجية
local pill = Instance.new("Frame")
pill.AnchorPoint = Vector2.new(0.5, 0.5)
pill.Position = UDim2.new(0.5, 0, 0.5, 0)
pill.Size = UDim2.new(1, 0, 1, 0)
pill.BackgroundColor3 = Color3.fromRGB(16, 20, 30)
pill.BackgroundTransparency = 0.04
pill.Parent = holder
Instance.new("UICorner", pill).CornerRadius = UDim.new(0, 20)
local pgrad = Instance.new("UIGradient")
pgrad.Color = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromRGB(34, 41, 58)),
	ColorSequenceKeypoint.new(0.5, Color3.fromRGB(20, 25, 37)),
	ColorSequenceKeypoint.new(1, Color3.fromRGB(12, 15, 23)),
})
pgrad.Rotation = 90
pgrad.Parent = pill

-- إطار ذهبي متدرّج
local pstroke = Instance.new("UIStroke")
pstroke.Color = GOLD
pstroke.Thickness = 1.8
pstroke.Transparency = 0.1
pstroke.Parent = pill
local sgrad = Instance.new("UIGradient")
sgrad.Color = ColorSequence.new({
	ColorSequenceKeypoint.new(0, GOLD_LIGHT),
	ColorSequenceKeypoint.new(0.5, GOLD),
	ColorSequenceKeypoint.new(1, Color3.fromRGB(150, 118, 60)),
})
sgrad.Rotation = 90
sgrad.Parent = pstroke

-- لمعة علوية داخلية خفيفة
local sheen = Instance.new("Frame")
sheen.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
sheen.BackgroundTransparency = 0.9
sheen.BorderSizePixel = 0
sheen.Position = UDim2.new(0, 6, 0, 4)
sheen.Size = UDim2.new(1, -12, 0, 16)
sheen.Parent = pill
Instance.new("UICorner", sheen).CornerRadius = UDim.new(0, 12)
local shgrad = Instance.new("UIGradient")
shgrad.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 0.5),
	NumberSequenceKeypoint.new(1, 1),
})
shgrad.Rotation = 90
shgrad.Parent = sheen

-- مركز الأيقونة (يسار الشريحة)
local ICON_X = 42

-- توهّج خلف الأيقونة (نابض)
local iconGlow = Instance.new("ImageLabel")
iconGlow.BackgroundTransparency = 1
iconGlow.Image = GLOW_TEX
iconGlow.ImageColor3 = Color3.fromRGB(255, 210, 120)
iconGlow.ImageTransparency = 0.2
iconGlow.AnchorPoint = Vector2.new(0.5, 0.5)
iconGlow.Size = UDim2.new(0, 60, 0, 60)
iconGlow.Position = UDim2.new(0, ICON_X, 0.5, 0)
iconGlow.ZIndex = 2
iconGlow.Parent = pill

-- أشعة الشمس الدوّارة (تظهر نهاراً)
local rays = Instance.new("Frame")
rays.BackgroundTransparency = 1
rays.AnchorPoint = Vector2.new(0.5, 0.5)
rays.Size = UDim2.new(0, 50, 0, 50)
rays.Position = UDim2.new(0, ICON_X, 0.5, 0)
rays.ZIndex = 3
rays.Parent = pill
for i = 0, 3 do
	local rod = Instance.new("Frame")
	rod.AnchorPoint = Vector2.new(0.5, 0.5)
	rod.Position = UDim2.new(0.5, 0, 0.5, 0)
	rod.Size = UDim2.new(0, 3, 0, 46)
	rod.Rotation = i * 45
	rod.BackgroundColor3 = Color3.fromRGB(255, 224, 150)
	rod.BorderSizePixel = 0
	rod.ZIndex = 3
	rod.Parent = rays
	Instance.new("UICorner", rod).CornerRadius = UDim.new(1, 0)
end

-- قرص الشمس/القمر
local disc = Instance.new("Frame")
disc.AnchorPoint = Vector2.new(0.5, 0.5)
disc.Size = UDim2.new(0, 28, 0, 28)
disc.Position = UDim2.new(0, ICON_X, 0.5, 0)
disc.BackgroundColor3 = Color3.fromRGB(255, 215, 130)
disc.BorderSizePixel = 0
disc.ZIndex = 4
disc.Parent = pill
Instance.new("UICorner", disc).CornerRadius = UDim.new(1, 0)
local dstroke = Instance.new("UIStroke")
dstroke.Color = Color3.fromRGB(255, 240, 200)
dstroke.Thickness = 1
dstroke.Transparency = 0.4
dstroke.Parent = disc

-- ظل الهلال (يغطّي جزءاً من القرص ليلاً لصنع شكل الهلال)
local crescent = Instance.new("Frame")
crescent.AnchorPoint = Vector2.new(0.5, 0.5)
crescent.Size = UDim2.new(0, 22, 0, 22)
crescent.Position = UDim2.new(0.72, 0, 0.4, 0)
crescent.BackgroundColor3 = Color3.fromRGB(16, 20, 30)
crescent.BorderSizePixel = 0
crescent.ZIndex = 5
crescent.Visible = false
crescent.Parent = disc
Instance.new("UICorner", crescent).CornerRadius = UDim.new(1, 0)

-- وقت
local timeLabel = Instance.new("TextLabel")
timeLabel.BackgroundTransparency = 1
timeLabel.AnchorPoint = Vector2.new(1, 0)
timeLabel.Position = UDim2.new(1, -18, 0, 9)
timeLabel.Size = UDim2.new(0, 158, 0, 32)
timeLabel.Font = Enum.Font.GothamBlack
timeLabel.Text = "--:--"
timeLabel.TextScaled = true
timeLabel.TextXAlignment = Enum.TextXAlignment.Right
timeLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
timeLabel.ZIndex = 2
timeLabel.Parent = pill

-- سطر المرحلة + التوقيت
local subLabel = Instance.new("TextLabel")
subLabel.BackgroundTransparency = 1
subLabel.AnchorPoint = Vector2.new(1, 1)
subLabel.Position = UDim2.new(1, -18, 1, -9)
subLabel.Size = UDim2.new(0, 168, 0, 16)
subLabel.Font = Enum.Font.GothamMedium
subLabel.Text = "بتوقيت البحرين"
subLabel.TextScaled = true
subLabel.TextXAlignment = Enum.TextXAlignment.Right
subLabel.TextColor3 = Color3.fromRGB(180, 198, 222)
subLabel.ZIndex = 2
subLabel.Parent = pill

----------------------------------------------------------------------
-- مزامنة الوقت: نحفظ الأساس ونعدّ محلياً بين المزامنات
----------------------------------------------------------------------
local baseEpoch: number? = nil
local baseClock = os.clock()
local frozen = false   -- لو الإدارة ثبّتت الوقت، لا نتقدّم محلياً

clockEvent.OnClientEvent:Connect(function(epoch: number, isFrozen: boolean?)
	baseEpoch = epoch
	baseClock = os.clock()
	frozen = isFrozen == true
end)

-- مرحلة اليوم: الاسم + لون القرص + لون التوهّج + هل هو ليل (هلال)
local function phaseForHour(h: number): (string, Color3, Color3, boolean)
	if h >= 5 and h < 6.5 then
		return "الفجر", Color3.fromRGB(255, 180, 120), Color3.fromRGB(255, 170, 110), false
	elseif h >= 6.5 and h < 11.5 then
		return "الصباح", Color3.fromRGB(255, 230, 160), Color3.fromRGB(255, 225, 150), false
	elseif h >= 11.5 and h < 15 then
		return "الظهر", Color3.fromRGB(255, 245, 205), Color3.fromRGB(255, 240, 190), false
	elseif h >= 15 and h < 17.5 then
		return "العصر", Color3.fromRGB(255, 210, 150), Color3.fromRGB(255, 200, 140), false
	elseif h >= 17.5 and h < 19 then
		return "المغرب", Color3.fromRGB(255, 150, 100), Color3.fromRGB(255, 140, 95), false
	else
		return "الليل", Color3.fromRGB(205, 220, 255), Color3.fromRGB(170, 195, 255), true
	end
end

local function fmt(h: number, m: number): string
	local suffix = if h < 12 then "ص" else "م"
	local h12 = h % 12
	if h12 == 0 then h12 = 12 end
	return string.format("%d:%02d %s", h12, m, suffix)
end

local TWEEN = TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local lastPhase: string? = nil

local accum = 0
local pulse = 0
RunService.Heartbeat:Connect(function(dt)
	-- دوران الأشعة + نبض التوهّج (كل إطار، بسلاسة)
	rays.Rotation = (rays.Rotation + dt * 18) % 360
	pulse += dt
	local s = 1 + 0.07 * math.sin(pulse * 2)
	iconGlow.Size = UDim2.new(0, 60 * s, 0, 60 * s)
	iconGlow.ImageTransparency = 0.2 + 0.12 * (0.5 + 0.5 * math.sin(pulse * 2))

	-- تحديث الوقت كل نصف ثانية
	accum += dt
	if accum < 0.5 then return end
	accum = 0
	if not baseEpoch then return end
	local now = if frozen then baseEpoch else baseEpoch + (os.clock() - baseClock)
	local secs = now % 86400
	local h = math.floor(secs / 3600)
	local m = math.floor((secs % 3600) / 60)
	timeLabel.Text = fmt(h, m)

	local hf = secs / 3600
	local name, discC, glowC, isNight = phaseForHour(hf)
	if name ~= lastPhase then
		lastPhase = name
		subLabel.Text = name .. " · بتوقيت البحرين"
		crescent.Visible = isNight
		rays.Visible = not isNight
		TweenService:Create(disc, TWEEN, { BackgroundColor3 = discC }):Play()
		TweenService:Create(iconGlow, TWEEN, { ImageColor3 = glowC }):Play()
	end
end)
