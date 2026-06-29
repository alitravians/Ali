--!nonstrict
----------------------------------------------------------------------
-- DAY NIGHT CLIENT (Client)
--   ساعة السيرفر (HUD) أعلى الشاشة — شريحة زجاج داكن بإطار ذهبي تعرض
--   وقت السيرفر بتوقيت البحرين + أيقونة شمس/قمر تتغيّر مع المرحلة
--   (الفجر/الصباح/الظهر/العصر/المساء). تتحدّث كل ثانية محلياً وتُزامَن
--   من السيرفر دورياً عبر RemoteEvent "ServerClockSync".
----------------------------------------------------------------------
local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")

local player = Players.LocalPlayer
local pg     = player:WaitForChild("PlayerGui")
local clockEvent = ReplicatedStorage:WaitForChild("ServerClockSync")

local GOLD     = Color3.fromRGB(214, 175, 92)
local GLOW_TEX = "rbxassetid://5028857084"

----------------------------------------------------------------------
-- بناء الـHUD
----------------------------------------------------------------------
local gui = Instance.new("ScreenGui")
gui.Name = "ServerClockGui"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.DisplayOrder = 30
gui.Parent = pg

local pill = Instance.new("Frame")
pill.AnchorPoint = Vector2.new(0.5, 0)
pill.Position = UDim2.new(0.5, 0, 0, 12)
pill.Size = UDim2.new(0, 224, 0, 60)
pill.BackgroundColor3 = Color3.fromRGB(16, 20, 30)
pill.BackgroundTransparency = 0.06
pill.Parent = gui
Instance.new("UICorner", pill).CornerRadius = UDim.new(0, 18)
local pgrad = Instance.new("UIGradient")
pgrad.Color = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromRGB(30, 36, 50)),
	ColorSequenceKeypoint.new(1, Color3.fromRGB(14, 17, 26)),
})
pgrad.Rotation = 90
pgrad.Parent = pill
local pstroke = Instance.new("UIStroke")
pstroke.Color = GOLD
pstroke.Thickness = 1.6
pstroke.Transparency = 0.2
pstroke.Parent = pill

-- توهّج خلف الأيقونة
local iconGlow = Instance.new("ImageLabel")
iconGlow.BackgroundTransparency = 1
iconGlow.Image = GLOW_TEX
iconGlow.ImageColor3 = Color3.fromRGB(255, 210, 120)
iconGlow.ImageTransparency = 0.25
iconGlow.AnchorPoint = Vector2.new(0.5, 0.5)
iconGlow.Size = UDim2.new(0, 54, 0, 54)
iconGlow.Position = UDim2.new(0, 38, 0.5, 0)
iconGlow.Parent = pill

-- قرص الشمس/القمر
local disc = Instance.new("Frame")
disc.AnchorPoint = Vector2.new(0.5, 0.5)
disc.Size = UDim2.new(0, 26, 0, 26)
disc.Position = UDim2.new(0, 38, 0.5, 0)
disc.BackgroundColor3 = Color3.fromRGB(255, 215, 130)
disc.Parent = pill
Instance.new("UICorner", disc).CornerRadius = UDim.new(1, 0)

-- وقت
local timeLabel = Instance.new("TextLabel")
timeLabel.BackgroundTransparency = 1
timeLabel.AnchorPoint = Vector2.new(1, 0)
timeLabel.Position = UDim2.new(1, -16, 0, 8)
timeLabel.Size = UDim2.new(0, 150, 0, 30)
timeLabel.Font = Enum.Font.GothamBold
timeLabel.Text = "--:--"
timeLabel.TextScaled = true
timeLabel.TextXAlignment = Enum.TextXAlignment.Right
timeLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
timeLabel.Parent = pill

-- سطر التوقيت
local subLabel = Instance.new("TextLabel")
subLabel.BackgroundTransparency = 1
subLabel.AnchorPoint = Vector2.new(1, 1)
subLabel.Position = UDim2.new(1, -16, 1, -8)
subLabel.Size = UDim2.new(0, 150, 0, 16)
subLabel.Font = Enum.Font.GothamMedium
subLabel.Text = "توقيت السيرفر · البحرين"
subLabel.TextScaled = true
subLabel.TextXAlignment = Enum.TextXAlignment.Right
subLabel.TextColor3 = Color3.fromRGB(165, 185, 210)
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

-- مرحلة اليوم حسب الساعة → لون القرص/التوهّج
local function styleForHour(h: number): (Color3, Color3)
	if h >= 5 and h < 6.5 then            -- الفجر
		return Color3.fromRGB(255, 180, 120), Color3.fromRGB(255, 170, 110)
	elseif h >= 6.5 and h < 11.5 then     -- الصباح
		return Color3.fromRGB(255, 230, 160), Color3.fromRGB(255, 225, 150)
	elseif h >= 11.5 and h < 15 then      -- الظهر
		return Color3.fromRGB(255, 245, 205), Color3.fromRGB(255, 240, 190)
	elseif h >= 15 and h < 17.5 then      -- العصر
		return Color3.fromRGB(255, 210, 150), Color3.fromRGB(255, 200, 140)
	elseif h >= 17.5 and h < 19 then      -- الغروب/المساء المبكر
		return Color3.fromRGB(255, 150, 100), Color3.fromRGB(255, 140, 95)
	else                                   -- الليل → قمر
		return Color3.fromRGB(205, 220, 255), Color3.fromRGB(170, 195, 255)
	end
end

local function fmt(h: number, m: number): string
	local suffix = if h < 12 then "ص" else "م"
	local h12 = h % 12
	if h12 == 0 then h12 = 12 end
	return string.format("%d:%02d %s", h12, m, suffix)
end

local accum = 0
RunService.Heartbeat:Connect(function(dt)
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
	local discC, glowC = styleForHour(hf)
	disc.BackgroundColor3 = discC
	iconGlow.ImageColor3 = glowC
end)
