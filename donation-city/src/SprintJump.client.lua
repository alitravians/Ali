--[[
╔══════════════════════════════════════════════════════════════════════╗
║  الجري والقفز المتطوّر — SPRINT & JUMP (Client)                       ║
║  المكان: StarterPlayerScripts    ·     النوع: LocalScript              ║
║                                                                        ║
║  • جري بالتبديل (ضغطة Shift أو زر اللمس) — تجري بلا حدّ وقت.            ║
║  • ضغطة ثانية توقف الجري. لا يوجد استنزاف طاقة.                        ║
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
local DEFAULT_NORMAL = 16   -- السرعة الافتراضية لمن لا يملك «سرعة البرق»
local SPRINT_BOOST   = 12   -- دفعة الجري فوق السرعة الأساسية (16+12 = 28 كالسابق)
local SPRINT_CAP     = 40   -- سقف أمان لسرعة الجري (يمنع «الطيران»)

-- السرعة الأساسية الحالية للاعب: يضبطها السيرفر عبر سِمة BaseWalkSpeed لحامل
-- باقة «سرعة البرق» (16→32)؛ ومن لا يملكها تبقى 16. نظام الجري يبني عليها.
local function baseSpeed(): number
	local b = player:GetAttribute("BaseWalkSpeed")
	if type(b) == "number" and b > 0 then return b end
	return DEFAULT_NORMAL
end
local function sprintSpeed(normal: number): number
	return math.min(normal + SPRINT_BOOST, SPRINT_CAP)
end

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
gui.AutoLocalize = false  -- 🌐 النص العربي يظهر للجميع (إيقاف الترجمة التلقائية)
gui.Name = "SprintHUD"; gui.ResetOnSpawn = false; gui.IgnoreGuiInset = true
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling; gui.Parent = pg

-- (أُلغي شريط الطاقة — الجري الآن تبديل بلا حدّ وقت) — نبقيه مخفيّاً
local barBack = Instance.new("Frame")
barBack.Visible = false
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

-- زر جري للجوال (أصغر + أعلى على الشاشة، يظهر فقط على الأجهزة اللمسية)
local touchBtn
if UserInputService.TouchEnabled then
	touchBtn = Instance.new("TextButton")
	touchBtn.Name = "SprintButton"
	touchBtn.AnchorPoint = Vector2.new(1, 1)
	touchBtn.Position = UDim2.new(1, -22, 1, -150)
	touchBtn.Size = UDim2.fromOffset(60, 60)
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
local wantSprint = false   -- حالة تبديل الجري (تشغيل/إيقاف)

local function refreshBtn()
	if not touchBtn then return end
	if wantSprint then
		touchBtn.BackgroundColor3 = Color3.fromRGB(90, 210, 130)   -- أخضر = الجري مُفعّل
		touchBtn.Text = "🏃‍♂️"
	else
		touchBtn.BackgroundColor3 = Color3.fromRGB(70, 140, 240)
		touchBtn.Text = "🏃"
	end
end

-- تبديل الجري: ضغطة تُشغّل، وضغطة تُوقف (بلا حدّ وقت)
local function toggleSprint()
	wantSprint = not wantSprint
	refreshBtn()
end

UserInputService.InputBegan:Connect(function(input, gpe)
	if gpe then return end
	if input.KeyCode == Enum.KeyCode.LeftShift or input.KeyCode == Enum.KeyCode.RightShift then
		toggleSprint()
	end
end)
if touchBtn then
	touchBtn.Activated:Connect(toggleSprint)
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

	-- (أُزيلت أصوات القفز/الهبوط بناءً على طلب المستخدم — نبقي مؤثّر الجسيمات فقط)

	hum.StateChanged:Connect(function(_, newState)
		if newState == Enum.HumanoidStateType.Jumping then
			puff:Emit(10)
			if reportRemote then reportRemote:FireServer("jump") end
		elseif newState == Enum.HumanoidStateType.Landed then
			puff:Emit(16)
		end
	end)
end

-- كتم صوت الموت الافتراضي («oof») المزعج عند السقوط/الموت
local function muteDeathSound(char)
	task.spawn(function()
		local hrp = char:WaitForChild("HumanoidRootPart", 10)
		if not hrp then return end
		local died = hrp:FindFirstChild("Died") or hrp:WaitForChild("Died", 6)
		if died and died:IsA("Sound") then died.Volume = 0; died:Destroy() end
	end)
end

local function onChar(char)
	-- صفّر حالة الجري عند ولادة شخصية جديدة
	wantSprint = false
	refreshBtn()
	muteDeathSound(char)
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

	local NORMAL = baseSpeed()                 -- السرعة الأساسية (16 أو سرعة باقة البرق)
	local SPRINT = sprintSpeed(NORMAL)         -- سرعة الجري = الأساسية + دفعة (بسقف أمان)

	-- داخل الباركور: نوقف الجري ونرجع السرعة الطبيعية (تحكّم دقيق بالقفزات).
	-- لا نلمس السرعة إن كانت مقفولة على 0 (سينما/تحميل).
	if player:GetAttribute("InParkour") then
		if wantSprint then wantSprint = false; refreshBtn() end
		if hum.WalkSpeed == SPRINT then hum.WalkSpeed = NORMAL end
		return
	end

	-- هل الشخصية تتحرّك فعلاً؟ (للجري الفعلي فقط)
	local moving = hum.MoveDirection.Magnitude > 0.1
	local sprinting = wantSprint and moving   -- بلا حدّ وقت/طاقة

	-- تقرير ثواني الجري (لإنجاز «عدّاء») دون أي استنزاف
	if sprinting then
		sprintReportAccum += dt
		if sprintReportAccum >= 1 and reportRemote then
			reportRemote:FireServer("sprint", sprintReportAccum)
			sprintReportAccum = 0
		end
	end

	-- تطبيق السرعة بأمان: لا نلمس السرعة إلا إن كانت بقيمتها الطبيعية/سرعة الجري
	-- (هكذا لو قفلت السينما الحركة على 0 لا نكسر القفل)
	if sprinting then
		if hum.WalkSpeed == NORMAL then hum.WalkSpeed = SPRINT end
	else
		if hum.WalkSpeed == SPRINT then hum.WalkSpeed = NORMAL end
	end
end)
