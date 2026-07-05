--[[
╔══════════════════════════════════════════════════════════════════════╗
║  CHESS CLIENT — مؤثرات الشطرنج (Client)                                ║
║                                                                        ║
║  يشغّل حركة قطع الشطرنج محليّاً على جهاز كل لاعب (60 إطاراً بالثانية)     ║
║  بدل بثّها من السيرفر إطاراً-إطاراً — حركة فورية سلسة على الجوال        ║
║  والكمبيوتر معاً. السيرفر يرسل فقط «النقلة النهائية» عبر RemoteEvent.  ║
║                                                                        ║
║  المؤثرات: انزلاق/قفز القطعة، الأسر إلى الرفّ، اهتزاز القطعة المحدّدة،  ║
║  ونبض مربّع الكش — كلها محلية بلا أي حمل على الشبكة.                    ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

local LocalPlayer = Players.LocalPlayer

local remote = ReplicatedStorage:WaitForChild("ChessFX", 30)
if not remote then return end

-- الحركات الجارية لكل قطعة (حركة جديدة تلغي القديمة تلقائيّاً)
local activeMoves: { [BasePart]: number } = {}
local moveToken = 0

-- الاهتزازات/النبضات الجارية
local bobbing: { [BasePart]: { base: CFrame, conn: RBXScriptConnection } } = {}
local pulsing: { [BasePart]: RBXScriptConnection } = {}

local function stopBob(part: BasePart, restore: boolean)
	local b = bobbing[part]
	if not b then return end
	bobbing[part] = nil
	b.conn:Disconnect()
	if restore and part.Parent then
		part.CFrame = b.base
	end
end

local function startBob(part: BasePart)
	if bobbing[part] then return end
	local base = part.CFrame
	local t0 = os.clock()
	local conn
	conn = RunService.RenderStepped:Connect(function()
		if not part.Parent then
			stopBob(part, false)
			return
		end
		local bob = math.sin((os.clock() - t0) * 5.5) * 0.12
		part.CFrame = base * CFrame.new(0, bob, 0)
	end)
	bobbing[part] = { base = base, conn = conn }
end

local function stopPulse(part: BasePart)
	local conn = pulsing[part]
	if not conn then return end
	pulsing[part] = nil
	conn:Disconnect()
end

local function startPulse(part: BasePart)
	if pulsing[part] then return end
	local conn
	conn = RunService.RenderStepped:Connect(function()
		if not part.Parent then
			stopPulse(part)
			return
		end
		local pulse = 0.5 + 0.5 * math.sin(os.clock() * 5.5)
		part.Transparency = 0.2 + 0.46 * (1 - pulse)
	end)
	pulsing[part] = conn
end

-- حركة قطعة: انزلاق سريع بقوس ارتفاع (الحصان يقفز أعلى)
local function animateMove(part: BasePart, goalCF: CFrame, lift: number, duration: number)
	stopBob(part, false)
	moveToken += 1
	local myToken = moveToken
	activeMoves[part] = myToken
	local startCF = part.CFrame
	local startY = startCF.Position.Y
	local goalPos = goalCF.Position
	local t = 0
	while t < 1 do
		local dt = RunService.RenderStepped:Wait()
		if activeMoves[part] ~= myToken or not part.Parent then return end
		t = math.min(1, t + dt / duration)
		local eased = 1 - (1 - t) * (1 - t) * (1 - t)   -- خروج تكعيبي: انطلاقة فورية
		local x = startCF.X + (goalPos.X - startCF.X) * eased
		local z = startCF.Z + (goalPos.Z - startCF.Z) * eased
		local y = startY + (goalPos.Y - startY) * eased + math.sin(t * math.pi) * lift
		part.CFrame = CFrame.new(Vector3.new(x, y, z)) * (goalCF - goalCF.Position)
	end
	if activeMoves[part] == myToken then
		activeMoves[part] = nil
		if part.Parent then part.CFrame = goalCF end
	end
end

-- أسر: القطعة تطير بقوس إلى رفّ الأسرى وتصغر
local function animateCapture(part: BasePart, goalCF: CFrame, goalSize: Vector3, duration: number)
	stopBob(part, false)
	moveToken += 1
	local myToken = moveToken
	activeMoves[part] = myToken
	local startCF = part.CFrame
	local startSize = part.Size
	local goalPos = goalCF.Position
	local t = 0
	while t < 1 do
		local dt = RunService.RenderStepped:Wait()
		if activeMoves[part] ~= myToken or not part.Parent then return end
		t = math.min(1, t + dt / duration)
		local eased = t * t * (3 - 2 * t)
		local pos = startCF.Position:Lerp(goalPos, eased)
		pos = Vector3.new(pos.X, pos.Y + math.sin(t * math.pi) * 0.35, pos.Z)
		part.Size = startSize:Lerp(goalSize, eased)
		part.CFrame = startCF:Lerp(goalCF, eased) - startCF.Position:Lerp(goalPos, eased) + pos
	end
	if activeMoves[part] == myToken then
		activeMoves[part] = nil
		if part.Parent then
			part.Size = goalSize
			part.CFrame = goalCF
		end
	end
end

remote.OnClientEvent:Connect(function(kind: string, part: BasePart?, a, b, c)
	if typeof(part) ~= "Instance" or not part:IsA("BasePart") then return end
	if kind == "move" then
		task.spawn(animateMove, part, a, b, c)
	elseif kind == "capture" then
		task.spawn(animateCapture, part, a, b, c)
	elseif kind == "bob" then
		startBob(part)
	elseif kind == "bobstop" then
		stopBob(part, true)
	elseif kind == "pulse" then
		startPulse(part)
	elseif kind == "pulsestop" then
		stopPulse(part)
	end
end)

----------------------------------------------------------------------
-- كاميرا ٣٦٠° حول طاولة الشطرنج أثناء اللعب
-- عند الجلوس على كرسي الشطرنج تتحوّل الكاميرا لمدار حرّ حول مركز الرقعة:
--   كمبيوتر: سحب بالزر الأيمن يدور، وعجلة الماوس تقرّب/تبعّد.
--   جوال: سحب إصبع واحد يدور، وقرصة إصبعين تقرّب/تبعّد (النقر على القطع يبقى شغّالاً).
-- عند القيام من الكرسي ترجع الكاميرا الافتراضية تلقائياً.
----------------------------------------------------------------------
local orbitConn: RBXScriptConnection? = nil
local orbitInputConns: { RBXScriptConnection } = {}

local function stopOrbit()
	if not orbitConn and #orbitInputConns == 0 then
		return
	end
	if orbitConn then
		orbitConn:Disconnect()
		orbitConn = nil
	end
	for _, c in ipairs(orbitInputConns) do
		c:Disconnect()
	end
	table.clear(orbitInputConns)
	local cam = Workspace.CurrentCamera
	if cam then
		cam.CameraType = Enum.CameraType.Custom
		local char = LocalPlayer.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then
			cam.CameraSubject = hum
		end
	end
end

local function startOrbit(seat: BasePart, center: Vector3)
	stopOrbit()
	local cam = Workspace.CurrentCamera
	if not cam then
		return
	end

	-- البداية: خلف كرسيّ اللاعب مواجهاً الرقعة بميلان مريح
	local toSeat = seat.Position - center
	local yaw = math.atan2(toSeat.X, toSeat.Z)
	local pitch = math.rad(42)
	local dist = 9
	local dragging = false
	local panLast = Vector2.zero
	local pinchLast = 1

	table.insert(orbitInputConns, UserInputService.InputBegan:Connect(function(input, gpe)
		if gpe then
			return
		end
		if input.UserInputType == Enum.UserInputType.MouseButton2 then
			dragging = true
		end
	end))
	table.insert(orbitInputConns, UserInputService.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton2 then
			dragging = false
		end
	end))
	table.insert(orbitInputConns, UserInputService.InputChanged:Connect(function(input, gpe)
		if input.UserInputType == Enum.UserInputType.MouseMovement and dragging then
			yaw -= input.Delta.X * 0.008
			pitch = math.clamp(pitch + input.Delta.Y * 0.006, math.rad(12), math.rad(80))
		elseif input.UserInputType == Enum.UserInputType.MouseWheel and not gpe then
			dist = math.clamp(dist - input.Position.Z * 1.2, 4.5, 18)
		end
	end))
	table.insert(orbitInputConns, UserInputService.TouchPan:Connect(function(_, translation, _, state, gpe)
		if gpe then
			return
		end
		if state == Enum.UserInputState.Begin then
			panLast = translation
		end
		local d = translation - panLast
		panLast = translation
		yaw -= d.X * 0.01
		pitch = math.clamp(pitch + d.Y * 0.008, math.rad(12), math.rad(80))
	end))
	table.insert(orbitInputConns, UserInputService.TouchPinch:Connect(function(_, scale, _, state, gpe)
		if gpe then
			return
		end
		if state == Enum.UserInputState.Begin then
			pinchLast = scale
		end
		if scale > 0.05 then
			dist = math.clamp(dist * (pinchLast / scale), 4.5, 18)
			pinchLast = scale
		end
	end))

	cam.CameraType = Enum.CameraType.Scriptable
	orbitConn = RunService.RenderStepped:Connect(function()
		if not seat.Parent then
			stopOrbit()
			return
		end
		local offset = Vector3.new(
			math.sin(yaw) * math.cos(pitch),
			math.sin(pitch),
			math.cos(yaw) * math.cos(pitch)
		) * dist
		cam.CFrame = CFrame.lookAt(center + offset, center + Vector3.new(0, 0.4, 0))
	end)
end

local function hookHumanoid(char: Model)
	local hum = char:WaitForChild("Humanoid", 15)
	if not hum or not hum:IsA("Humanoid") then
		return
	end
	hum.Seated:Connect(function(active, seatPart)
		if active and seatPart then
			local center = seatPart:GetAttribute("ChessBoardCenter")
			if typeof(center) == "Vector3" then
				startOrbit(seatPart, center)
				return
			end
		end
		stopOrbit()
	end)
end

if LocalPlayer.Character then
	task.spawn(hookHumanoid, LocalPlayer.Character)
end
LocalPlayer.CharacterAdded:Connect(function(char)
	task.spawn(hookHumanoid, char)
end)
