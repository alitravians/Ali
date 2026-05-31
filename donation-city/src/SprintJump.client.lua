--[[
╔══════════════════════════════════════════════════════════════════════╗
║  الجري والقفز المتطوّر — SPRINT & JUMP (Client)                       ║
║  المكان: StarterPlayerScripts    ·     النوع: LocalScript              ║
║                                                                        ║
║  • جري بالضغط على Shift (أو زر باللمس للجوال) — سرعة أعلى.             ║
║  • شريط طاقة: يَنقُص أثناء الجري ويتجدّد عند التوقّف (لا جري بلا طاقة). ║
║  • مؤثّرات قفز وهبوط (جسيمات + صوت) لحركة أكثر حيويّة.                 ║
║  • يبلّغ السيرفر بثواني الجري وعدد القفزات (لإنجازَي «عدّاء» و«قفّاز»). ║
║  • آمن مع قفل الحركة في السينما (لا يتدخّل إن كانت السرعة مقفولة).     ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")
local UserInputService  = game:GetService("UserInputService")

local player = Players.LocalPlayer
local pg = player:WaitForChild("PlayerGui")

----------------------------------------------------------------------
-- إعدادات
----------------------------------------------------------------------
local NORMAL_SPEED = 16
local SPRINT_SPEED = 28
local MAX_ENERGY   = 100
local DRAIN_RATE   = 100 / 8     -- استنزاف كامل خلال ~8 ثوانٍ جري
local CHARGE_RATE  = 100 / 12    -- شحن كامل خلال ~12 ثانية توقّف
local MIN_TO_START = 8           -- أقل طاقة للبدء بالجري

----------------------------------------------------------------------
-- ربط السيرفر (تقارير الجري/القفز) — اختياري (لا يعطّل المؤثرات لو غاب)
----------------------------------------------------------------------
local reportRemote
task.spawn(function()
	local folder = ReplicatedStorage:WaitForChild("ActivityRemotes", 30)
	if folder then reportRemote = folder:WaitForChild("Report", 30) end
end)

----------------------------------------------------------------------
-- واجهة شريط الطاقة
----------------------------------------------------------------------
local gui = Instance.new("ScreenGui")
gui.Name = "SprintHUD"; gui.ResetOnSpawn = false; gui.IgnoreGuiInset = true
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling; gui.Parent = pg

local barBack = Instance.new("Frame")
barBack.Name = "EnergyBack"
barBack.AnchorPoint = Vector2.new(0.5, 1)
barBack.Position = UDim2.new(0.5, 0, 1, -18)
barBack.Size = UDim2.fromOffset(240, 16)
barBack.BackgroundColor3 = Color3.fromRGB(20, 22, 34)
barBack.BackgroundTransparency = 0.25
barBack.BorderSizePixel = 0
barBack.Parent = gui
local backCorner = Instance.new("UICorner"); backCorner.CornerRadius = UDim.new(0, 8); backCorner.Parent = barBack
local backStroke = Instance.new("UIStroke"); backStroke.Color = Color3.fromRGB(80, 90, 120); backStroke.Thickness = 1.5; backStroke.Transparency = 0.3; backStroke.Parent = barBack

local barFill = Instance.new("Frame")
barFill.Name = "EnergyFill"
barFill.Position = UDim2.fromOffset(2, 2)
barFill.Size = UDim2.new(1, -4, 1, -4)
barFill.BackgroundColor3 = Color3.fromRGB(90, 220, 140)
barFill.BorderSizePixel = 0
barFill.Parent = barBack
local fillCorner = Instance.new("UICorner"); fillCorner.CornerRadius = UDim.new(0, 7); fillCorner.Parent = barFill

local barLabel = Instance.new("TextLabel")
barLabel.BackgroundTransparency = 1
barLabel.Size = UDim2.fromScale(1, 1)
barLabel.Font = Enum.Font.GothamBold
barLabel.TextScaled = true
barLabel.TextColor3 = Color3.new(1, 1, 1)
barLabel.TextStrokeTransparency = 0.5
barLabel.Text = "⚡ طاقة الجري"
barLabel.Parent = barBack

-- زر جري للجوال (يظهر فقط على الأجهزة اللمسية)
local touchBtn
if UserInputService.TouchEnabled then
	touchBtn = Instance.new("TextButton")
	touchBtn.Name = "SprintButton"
	touchBtn.AnchorPoint = Vector2.new(1, 1)
	touchBtn.Position = UDim2.new(1, -30, 1, -90)
	touchBtn.Size = UDim2.fromOffset(96, 96)
	touchBtn.BackgroundColor3 = Color3.fromRGB(70, 140, 240)
	touchBtn.BackgroundTransparency = 0.2
	touchBtn.Text = "🏃"
	touchBtn.TextScaled = true
	touchBtn.Parent = gui
	local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(1, 0); c.Parent = touchBtn
end

----------------------------------------------------------------------
-- حالة الجري والطاقة
----------------------------------------------------------------------
local energy = MAX_ENERGY
local wantSprint = false   -- زرّ الجري مضغوط
local exhausted = false     -- نفدت الطاقة: ننتظر تجاوز الحدّ الأدنى قبل السماح بالجري

local function setSprintInput(on)
	wantSprint = on
end

UserInputService.InputBegan:Connect(function(input, gpe)
	if gpe then return end
	if input.KeyCode == Enum.KeyCode.LeftShift or input.KeyCode == Enum.KeyCode.RightShift then
		setSprintInput(true)
	end
end)
UserInputService.InputEnded:Connect(function(input)
	if input.KeyCode == Enum.KeyCode.LeftShift or input.KeyCode == Enum.KeyCode.RightShift then
		setSprintInput(false)
	end
end)
if touchBtn then
	touchBtn.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then
			setSprintInput(true)
		end
	end)
	touchBtn.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then
			setSprintInput(false)
		end
	end)
end

----------------------------------------------------------------------
-- مؤثّرات القفز/الهبوط على الشخصية
----------------------------------------------------------------------
local function attachEffects(char)
	local hum = char:WaitForChild("Humanoid", 10)
	local hrp = char:WaitForChild("HumanoidRootPart", 10)
	if not hum or not hrp then return end

	-- جسيمات تنبعث عند القفز/الهبوط (Emit يدوي)
	local att = Instance.new("Attachment")
	att.Name = "SJ_Effect"; att.Position = Vector3.new(0, -2.6, 0); att.Parent = hrp
	local puff = Instance.new("ParticleEmitter")
	puff.Name = "SJ_Puff"
	puff.Texture = "rbxassetid://243660364"   -- دائرة دخان ناعمة (قابلة للتبديل)
	puff.Rate = 0
	puff.Lifetime = NumberRange.new(0.35, 0.55)
	puff.Speed = NumberRange.new(6, 10)
	puff.SpreadAngle = Vector2.new(180, 180)
	puff.Rotation = NumberRange.new(0, 360)
	puff.Color = ColorSequence.new(Color3.fromRGB(235, 230, 220))
	puff.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.2),
		NumberSequenceKeypoint.new(1, 1),
	})
	puff.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 2.2),
		NumberSequenceKeypoint.new(1, 4.5),
	})
	puff.Parent = att

	-- أصوات قفز/هبوط (معرّفات قابلة للتبديل — 0/خطأ = صامت بلا ضرر)
	local jumpSound = Instance.new("Sound")
	jumpSound.Name = "SJ_Jump"; jumpSound.SoundId = "rbxassetid://5466166437"; jumpSound.Volume = 0.35; jumpSound.Parent = hrp
	local landSound = Instance.new("Sound")
	landSound.Name = "SJ_Land"; landSound.SoundId = "rbxassetid://5466166437"; landSound.Volume = 0.45; landSound.Parent = hrp

	hum.StateChanged:Connect(function(_, newState)
		if newState == Enum.HumanoidStateType.Jumping then
			puff:Emit(10)
			pcall(function() jumpSound:Play() end)
			if reportRemote then reportRemote:FireServer("jump") end
		elseif newState == Enum.HumanoidStateType.Landed then
			puff:Emit(16)
			pcall(function() landSound:Play() end)
		end
	end)
end

local function onChar(char)
	-- صفّر حالة الجري عند ولادة شخصية جديدة
	wantSprint = false
	task.spawn(attachEffects, char)
end
if player.Character then onChar(player.Character) end
player.CharacterAdded:Connect(onChar)

----------------------------------------------------------------------
-- الحلقة الرئيسية: تطبيق السرعة + إدارة الطاقة + تقرير الجري
----------------------------------------------------------------------
local sprintReportAccum = 0

RunService.RenderStepped:Connect(function(dt)
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hum then return end

	-- هل الشخصية تتحرّك فعلاً؟ (للجري الفعلي فقط)
	local moving = hum.MoveDirection.Magnitude > 0.1
	local sprinting = wantSprint and moving and not exhausted and energy > 0

	-- إدارة الطاقة
	if sprinting then
		energy = math.max(0, energy - DRAIN_RATE * dt)
		if energy <= 0 then exhausted = true end
		sprintReportAccum += dt
		if sprintReportAccum >= 1 and reportRemote then
			reportRemote:FireServer("sprint", sprintReportAccum)
			sprintReportAccum = 0
		end
	else
		energy = math.min(MAX_ENERGY, energy + CHARGE_RATE * dt)
		if exhausted and energy >= MIN_TO_START then exhausted = false end
	end

	-- تطبيق السرعة بأمان: لا نلمس السرعة إلا إن كانت بقيمتها الطبيعية/سرعة الجري
	-- (هكذا لو قفلت السينما الحركة على 0 لا نكسر القفل)
	if sprinting then
		if hum.WalkSpeed == NORMAL_SPEED then hum.WalkSpeed = SPRINT_SPEED end
	else
		if hum.WalkSpeed == SPRINT_SPEED then hum.WalkSpeed = NORMAL_SPEED end
	end

	-- تحديث الشريط
	local frac = energy / MAX_ENERGY
	barFill.Size = UDim2.new(frac, -4, 1, -4)
	if sprinting then
		barFill.BackgroundColor3 = Color3.fromRGB(255, 180, 70)   -- برتقالي أثناء الجري
	elseif energy < MIN_TO_START then
		barFill.BackgroundColor3 = Color3.fromRGB(230, 80, 80)     -- أحمر عند النفاد
	else
		barFill.BackgroundColor3 = Color3.fromRGB(90, 220, 140)    -- أخضر جاهز
	end
end)
