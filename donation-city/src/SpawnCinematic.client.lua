--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  SPAWN CINEMATIC (Client)                                              ║
	║  المكان: StarterPlayer ▸ StarterPlayerScripts   ·   النوع: LocalScript ║
	║                                                                        ║
	║  الريسبون الملكي على طريقة ببجي — مشهد فردي لكل لاعب، جوال-أولاً:        ║
	║    ١) وضع المشاهدة داخل «طائرة شهد للنزول الملكي» (إضاءة LED احترافية،   ║
	║       لقطة بانورامية على المدينة، عدّاد ٣-٢-١، زر Skip كبير).            ║
	║    ٢) القفز → سقوط حرّ موجَّه (WASD/عصا + كاميرا حرّة) + HUD ارتفاع/سرعة.  ║
	║    ٣) فتح المظلّة بحرف E أو زر لمس كبير → نزول موجَّه سلس + تمايل.         ║
	║    ٤) هبوط حرّ وين ما ينزل اللاعب على الماب → غبار/صدمة + استعادة الكاميرا.║
	║                                                                        ║
	║  يُشغَّل مرّة واحدة عند الدخول فقط (إشارة من شاشة التحميل عند «بدء       ║
	║  اللعبة») — لا يتكرّر عند الموت داخل اللعبة.                             ║
	║                                                                        ║
	║  كل الفيزياء والكاميرا على العميل = سلاسة بدون لاق حتى على الأجهزة       ║
	║  الضعيفة. الإضاءة أضواء روبلوكس حقيقية (Neon + PointLight) لأن توهّج     ║
	║  الـMesh لا ينتقل مع الموديل المرفوع.                                    ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")
local UserInputService  = game:GetService("UserInputService")
local Lighting          = game:GetService("Lighting")
-- جوال حقيقي فقط (لمس بلا لوحة مفاتيح) → أزرار لمس؛ غير ذلك (كمبيوتر ولو بشاشة لمس) → تلميح لوحة المفاتيح.
local function isMobileInput(): boolean
	return UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled
end
local TweenService      = game:GetService("TweenService")
local Workspace         = game:GetService("Workspace")

local LocalPlayer = Players.LocalPlayer

-- الإعدادات (سهلة التعديل)
local CONFIG = {
	-- جغرافيا المشهد
	JUMP_XZ         = Vector2.new(0, 0),      -- يقفز فوق وسط المدينة ثم نزول حرّ موجَّه
	ALTITUDE        = 720,                    -- ارتفاع الطائرة عند الإقلاع
	PLANE_LENGTH    = 120,                    -- طول جسم الطائرة بعد التحجيم
	MAP_HALF        = 195,                    -- نصف حدود الماب (الأرض 400×400) — نمنع الخروج للفراغ

	-- فيزياء السقوط
	FREEFALL_MIN    = 70,                     -- سرعة بداية السقوط الحر
	FREEFALL_MAX    = 165,                    -- أقصى سرعة سقوط حر
	FREEFALL_ACC    = 90,                     -- تسارع السقوط
	AUTO_DEPLOY_ALT = 230,                    -- فتح المظلّة تلقائياً عند هذا الارتفاع (أمان)
	CANOPY_SPEED    = 26,                     -- سرعة النزول تحت المظلّة
	LAND_ALT        = 5.5,                    -- ارتفاع لحظة الهبوط فوق الأرض
	DRIFT_FREEFALL  = 62,                     -- سرعة التوجيه الأفقي أثناء السقوط الحر (WASD/عصا)
	DRIFT_CANOPY    = 42,                     -- سرعة التوجيه الأفقي تحت المظلّة
	TURN_FREEFALL   = 3.4,                    -- أقصى سرعة دوران الجسم أثناء السقوط الحر (راديان/ث) — لفّات ٣٦٠ سلسة
	TURN_CANOPY     = 2.2,                    -- أقصى سرعة دوران الجسم تحت المظلّة (راديان/ث)
	BANK_FREEFALL   = math.rad(30),           -- أقصى ميلان جانبي (Bank) مع الانعطاف بالسقوط الحر
	BANK_CANOPY     = math.rad(20),           -- أقصى ميلان جانبي مع الانعطاف تحت المظلّة
	BOOST_FREEFALL  = 1.7,                    -- مضاعِف سرعة السقوط الحر عند الضغط (Shift / زر التسريع)
	BOOST_CANOPY    = 2.2,                    -- مضاعِف سرعة النزول بالمظلّة عند الضغط

	-- أضواء/ألوان
	SWAP_NAV_COLORS = false,                  -- اقلبها لو الأحمر/الأخضر بالعكس على الأجنحة
	FORWARD_SIGN    = 1,                       -- اقلبها (-1) لو الطائرة تطير بمؤخّرتها

	-- معرّفات أصوات (٠ = معطّل بهدوء؛ تُعبّأ لاحقاً من حساب المالك)
	SND_ENGINE      = 0,
	SND_JUMP        = 0,
	SND_CHUTE       = 5893607560,
	SND_LAND        = 103869454042122,
	SND_WIND        = 7143970965,
}

local GOLD  = Color3.fromRGB(214, 175, 92)
local NAVY  = Color3.fromRGB(28, 42, 78)
local WHITE = Color3.fromRGB(245, 245, 250)
local WARM  = Color3.fromRGB(255, 226, 168)
local loadCanopyTemplate: (() -> Model?)? = nil
local buildProceduralCanopy: (() -> (Model, BasePart))? = nil

----------------------------------------------------------------------
-- أدوات مساعدة
----------------------------------------------------------------------
local function mk(class: string, props: { [string]: any }): Instance
	local inst = Instance.new(class)
	for k, v in pairs(props) do
		(inst :: any)[k] = v
	end
	return inst
end

local canopyTemplate: Model? = nil

loadCanopyTemplate = function(): Model?
	if canopyTemplate then
			return canopyTemplate
	end

	local mesh = ReplicatedStorage:WaitForChild("RoyalCanopyMesh", 35)
	if mesh and mesh:IsA("Model") then
			canopyTemplate = mesh
			return canopyTemplate
	end

	return nil
end

task.spawn(loadCanopyTemplate)

local function normalizeCanopyTemplate(model: Model)
	local bboxCF, bboxSize = model:GetBoundingBox()
	local pivot = model:GetPivot()
	local pivotToBox = pivot:ToObjectSpace(bboxCF)
	local horizontal = math.max(bboxSize.X, bboxSize.Z)
	local scale = if horizontal > 0 then (24 / horizontal) else 1
	if scale > 0 and math.abs(scale - 1) > 1e-4 then
			model:ScaleTo(scale)
			bboxCF, bboxSize = model:GetBoundingBox()
			pivot = model:GetPivot()
			pivotToBox = pivot:ToObjectSpace(bboxCF)
	end
	-- ثبّت المظلّة من أسفلها (حلقة التعليق) فوق ظهر اللاعب مباشرة بدل توسيطها عالياً،
	-- عشان الحبال تتجمّع على ظهره وتتزامن معه بدل ما تطير فوقه.
	local BOTTOM_OFFSET = 1.6
	local targetBox = CFrame.new(0, BOTTOM_OFFSET + bboxSize.Y * 0.5, 0)
	model:PivotTo(targetBox * pivotToBox:Inverse())
end

local function recolorCanopyTemplate(model: Model)
	for _, inst in ipairs(model:GetDescendants()) do
			if inst:IsA("BasePart") then
					local name = string.lower(inst.Name)
					if name:find("line") or name:find("rope") or name:find("cord") or name:find("strap") or name:find("harness") or name:find("ring") then
							inst.Color = Color3.fromRGB(38, 38, 44)
							inst.Material = Enum.Material.SmoothPlastic
					elseif name:find("gold") or name:find("apex") or name:find("vent") or name:find("top") then
							inst.Color = GOLD
							inst.Material = Enum.Material.Metal
					else
							inst.Color = NAVY
							inst.Material = Enum.Material.SmoothPlastic
					end
			end
	end
end

local function buildCanopy(): (Model, BasePart)
	local loader = loadCanopyTemplate
	local procedural = buildProceduralCanopy
	if not loader or not procedural then
			error("SpawnCinematic: canopy builders not initialized")
	end

	local template = loader()
	if not template then
			return procedural()
	end

	local model = mk("Model", { Name = "RoyalCanopy" })
	local anchor = mk("Part", {
			Name = "Anchor", Size = Vector3.new(0.5, 0.5, 0.5), Transparency = 1,
			Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
			CastShadow = false, Parent = model,
	}) :: Part
	model.PrimaryPart = anchor

	local mesh = template:Clone()
	mesh.Parent = model

	for _, inst in ipairs(mesh:GetDescendants()) do
			if inst:IsA("BasePart") then
					inst.Anchored = true
					inst.CanCollide = false
					inst.CanQuery = false
					inst.CanTouch = false
					inst.CastShadow = false
			end
	end

	normalizeCanopyTemplate(mesh)
	recolorCanopyTemplate(mesh)

	return model, anchor
end

local function neonBulb(name, size, color, parent): Part
	local p = mk("Part", {
		Name = name, Size = size, Anchored = true, CanCollide = false,
		CanQuery = false, CanTouch = false, CastShadow = false,
		Material = Enum.Material.Neon, Color = color, Parent = parent,
	}) :: Part
	return p
end

local function playSound3D(parent: Instance, id: number, vol: number, looped: boolean): Sound?
	if not id or id <= 0 then return nil end
	local s = mk("Sound", {
		SoundId = "rbxassetid://" .. tostring(id), Volume = vol,
		Looped = looped or false, RollOffMaxDistance = 220,
		RollOffMinDistance = 12, Parent = parent,
	}) :: Sound
	s:Play()
	return s
end

local cinematicLightingCleanup: (() -> ())? = nil
local cinematicShadow: Part? = nil
local cinematicWind: Sound? = nil

local function startCinematicLighting()
	local snapshot = {
		Brightness = Lighting.Brightness,
		Ambient = Lighting.Ambient,
		OutdoorAmbient = Lighting.OutdoorAmbient,
		FogColor = Lighting.FogColor,
		FogStart = Lighting.FogStart,
		FogEnd = Lighting.FogEnd,
		ClockTime = Lighting.ClockTime,
		ExposureCompensation = Lighting.ExposureCompensation,
		EnvironmentDiffuseScale = Lighting.EnvironmentDiffuseScale,
		EnvironmentSpecularScale = Lighting.EnvironmentSpecularScale,
		ShadowSoftness = Lighting.ShadowSoftness,
	}

	local atmosphere = mk("Atmosphere", {
		Name = "RoyalSpawnAtmosphere",
		Density = 0.18,
		Haze = 1.25,
		Glare = 0.22,
		Color = Color3.fromRGB(178, 214, 243),
		Decay = Color3.fromRGB(94, 126, 171),
		Parent = Lighting,
	}) :: Atmosphere

	local cc = mk("ColorCorrectionEffect", {
		Name = "RoyalSpawnColor",
		Brightness = 0.06,
		Contrast = 0.08,
		Saturation = 0.1,
		TintColor = Color3.fromRGB(246, 248, 255),
		Parent = Lighting,
	}) :: ColorCorrectionEffect

	local bloom = mk("BloomEffect", {
		Name = "RoyalSpawnBloom",
		Intensity = 0.28,
		Threshold = 1.05,
		Size = 24,
		Parent = Lighting,
	}) :: BloomEffect

	local sun = mk("SunRaysEffect", {
		Name = "RoyalSpawnSunRays",
		Intensity = 0.05,
		Spread = 0.75,
		Parent = Lighting,
	}) :: SunRaysEffect

	Lighting.Brightness = 2.8
	Lighting.Ambient = Color3.fromRGB(148, 177, 208)
	Lighting.OutdoorAmbient = Color3.fromRGB(180, 203, 231)
	Lighting.FogColor = Color3.fromRGB(184, 216, 242)
	Lighting.FogStart = 0
	Lighting.FogEnd = 8000
	Lighting.ClockTime = 13.6
	Lighting.ExposureCompensation = 0.12
	Lighting.EnvironmentDiffuseScale = 1
	Lighting.EnvironmentSpecularScale = 1
	Lighting.ShadowSoftness = 0.25

	return function()
		pcall(function()
			if atmosphere then atmosphere:Destroy() end
			if cc then cc:Destroy() end
			if bloom then bloom:Destroy() end
			if sun then sun:Destroy() end
		end)
		for k, v in pairs(snapshot) do
			pcall(function()
				(Lighting :: any)[k] = v
			end)
		end
	end
end

local function clearCinematicTransient()
	if cinematicWind then
		pcall(function() cinematicWind:Stop() end)
		pcall(function() cinematicWind:Destroy() end)
		cinematicWind = nil
	end
	if cinematicShadow then
		pcall(function() cinematicShadow:Destroy() end)
		cinematicShadow = nil
	end
	if cinematicLightingCleanup then
		pcall(cinematicLightingCleanup)
		cinematicLightingCleanup = nil
	end
	local char = LocalPlayer.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.CameraOffset = Vector3.zero
	end
end

-- استعادة قيم الحركة بعد المشهد (استقلال عن شاشة التحميل). لا نلتقط WalkSpeed
-- الحالية لأن الشخصية مجمّدة (=0) عند البدء؛ نستعيد من سِمة BaseWalkSpeed (سرعة
-- باقة «البرق» إن مُلكت، وإلا 16) كما تفعل بقية الأنظمة (CinemaClient/CustomChat)
-- حتى لا تضيع السرعة المخصّصة. مُعرّفة على مستوى الوحدة ليستعملها مسار النجاح
-- ومعالج الخطأ معاً.
local function restoreMovement(humanoid: Humanoid)
	local base = LocalPlayer:GetAttribute("BaseWalkSpeed")
	humanoid.WalkSpeed = (typeof(base) == "number" and base > 0) and base or 16
	humanoid.JumpPower = 50
	humanoid.JumpHeight = 7.2
end

-- تمكين/تعطيل تحكّم اللاعب الافتراضي عبر وحدة اللاعب
local function setControls(enabled: boolean)
	pcall(function()
		local ps = LocalPlayer:FindFirstChild("PlayerScripts")
		if not ps then return end
		local pm = ps:FindFirstChild("PlayerModule")
		if not pm then return end
		local controls = require(pm):GetControls()
		if enabled then controls:Enable() else controls:Disable() end
	end)
end

-- ارتفاع سطح الأرض أسفل أي نقطة (x,z) — للنزول الحرّ (الهبوط وين ما ينزل اللاعب).
-- نبدأ الشعاع من أسفل اللاعب مباشرةً (fromY) حتى لا نصطدم بالطائرة/المظلّة فوقه،
-- ونستبعد ما يُمرَّر (الشخصية والمظلّة). لو لم تُحمَّل الأرض بعد (Streaming) نرجع 0
-- (سطح الأرضية الأساسية) ويُصحَّح تلقائياً كل ما اقترب اللاعب وحُمِّلت المنطقة.
local groundRayParams = RaycastParams.new()
groundRayParams.FilterType = Enum.RaycastFilterType.Exclude

local function groundYAt(x: number, z: number, fromY: number, exclude: { Instance }): number
	groundRayParams.FilterDescendantsInstances = exclude
	local result = Workspace:Raycast(Vector3.new(x, fromY, z), Vector3.new(0, -(math.abs(fromY) + 1200), 0), groundRayParams)
	if result then return result.Position.Y end
	return 0
end

-- وحدة التحكّم الافتراضية (لقراءة متجه الإدخال: WASD/الأسهم أو عصا الجوال)
local controlModule: any = nil
local function getControlModule(): any
	if controlModule then return controlModule end
	pcall(function()
		local ps = LocalPlayer:FindFirstChild("PlayerScripts")
		local pm = ps and ps:FindFirstChild("PlayerModule")
		if pm then controlModule = require(pm):GetControls() end
	end)
	return controlModule
end

-- توجيه الجوال أثناء الكاميرا السينمائية: العصا الافتراضية تختفي مع الكاميرا Scriptable،
-- فنقرأ سحب الإصبع مباشرة (سحب وثبّت = توجيه مستمر) كبديل للعصا.
local touchSteer = Vector2.zero
local touchSteerConns: { RBXScriptConnection } = {}
local function touchSteerStop()
	for _, c in ipairs(touchSteerConns) do c:Disconnect() end
	table.clear(touchSteerConns)
	touchSteer = Vector2.zero
end
local function touchSteerStart()
	touchSteerStop()
	if not (UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled) then return end
	local activeTouch: InputObject? = nil
	local startPos = Vector2.zero
	table.insert(touchSteerConns, UserInputService.InputBegan:Connect(function(input, gpe)
		if gpe then return end
		if input.UserInputType == Enum.UserInputType.Touch and activeTouch == nil then
			activeTouch = input
			startPos = Vector2.new(input.Position.X, input.Position.Y)
		end
	end))
	table.insert(touchSteerConns, UserInputService.InputChanged:Connect(function(input)
		if input == activeTouch then
			local d = Vector2.new(input.Position.X, input.Position.Y) - startPos
			touchSteer = Vector2.new(math.clamp(d.X / 90, -1, 1), math.clamp(d.Y / 90, -1, 1))
		end
	end))
	table.insert(touchSteerConns, UserInputService.InputEnded:Connect(function(input)
		if input == activeTouch then
			activeTouch = nil
			touchSteer = Vector2.zero
		end
	end))
end

-- متجه التوجيه نسبةً لاتجاه جسم اللاعب (لا الكاميرا) — يُستخدم مع الكاميرا
-- السينمائية الدوّارة حتى يبقى W = للأمام وA/D = انعطاف ثابتاً مهما دارت الكاميرا.
local function steerBodyDir(faceDir: Vector3): Vector3
	local mv = Vector3.zero
	local cm = getControlModule()
	if cm then
		local ok, v = pcall(function() return cm:GetMoveVector() end)
		if ok and typeof(v) == "Vector3" then mv = v end
	end
	if mv.Magnitude < 0.05 then
		local f, r = 0, 0
		if UserInputService:IsKeyDown(Enum.KeyCode.W) or UserInputService:IsKeyDown(Enum.KeyCode.Up) then f += 1 end
		if UserInputService:IsKeyDown(Enum.KeyCode.S) or UserInputService:IsKeyDown(Enum.KeyCode.Down) then f -= 1 end
		if UserInputService:IsKeyDown(Enum.KeyCode.D) or UserInputService:IsKeyDown(Enum.KeyCode.Right) then r += 1 end
		if UserInputService:IsKeyDown(Enum.KeyCode.A) or UserInputService:IsKeyDown(Enum.KeyCode.Left) then r -= 1 end
		mv = Vector3.new(r, 0, -f)
	end
	if mv.Magnitude < 0.05 and touchSteer.Magnitude > 0.05 then
		-- الجوال: سحب يمين/يسار = انعطاف، سحب لفوق = للأمام
		mv = Vector3.new(touchSteer.X, 0, touchSteer.Y)
	end
	if mv.Magnitude < 0.05 then return Vector3.zero end
	local look = Vector3.new(faceDir.X, 0, faceDir.Z)
	look = look.Magnitude > 0.01 and look.Unit or Vector3.new(0, 0, -1)
	local right = Vector3.new(-look.Z, 0, look.X)
	local world = right * mv.X + look * (-mv.Z)
	return world.Magnitude > 0.01 and world.Unit or Vector3.zero
end

-- دوران واقعي ٣٦٠°: يلفّ الاتجاه الحالي نحو الاتجاه المطلوب بسرعة دوران محدودة
-- (بدل القفز الفوري) — يرجع الاتجاه الجديد + مقدار الدوران المُطبَّق (لحساب الميلان الجانبي).
local function turnToward(cur: Vector3, target: Vector3, maxStep: number): (Vector3, number)
	local a0 = math.atan2(cur.X, cur.Z)
	local a1 = math.atan2(target.X, target.Z)
	local d = math.atan2(math.sin(a1 - a0), math.cos(a1 - a0))
	local step = math.clamp(d, -maxStep, maxStep)
	local a = a0 + step
	return Vector3.new(math.sin(a), 0, math.cos(a)), step
end

----------------------------------------------------------------------
-- كاميرا سينمائية ٣٦٠° تلقائية أثناء النزول
-- بمجرد القفز تتحوّل الكاميرا لمدار سينمائي يدور حول اللاعب من زوايا متغيّرة:
--   سقوط حر: دوران مستمر مع تنفّس بالمسافة والارتفاع (لقطات علوية وجانبية).
--   فتح المظلّة: لقطة من الأسفل تنظر لفوق نحو القبّة ثم تصعد تدريجياً.
--   تحت المظلّة: دوران أوسع وأهدأ يُظهر المدينة من كل الزوايا.
--   قرب الهبوط: الكاميرا تنخفض لزاوية أرضية درامية.
-- التوجيه (WASD/عصا الجوال) يبقى شغّالاً نسبةً لاتجاه جسم اللاعب.
----------------------------------------------------------------------
local cine = {
	conn = nil :: RBXScriptConnection?,
	yaw = 0,
	mode = "freefall",
	modeT = 0,
	pos = Vector3.zero,
	faceDir = Vector3.new(0, 0, -1),
	altitude = 1000,
	speed = 0,
	shake = 0,
	offset = nil :: Vector3?,
	orbitSpd = 0.45,
	shotIdx = 1,
	shotT = 0,
	blur = nil :: BlurEffect?,
	baseFOV = 70,
}

-- لقطات السقوط الحر: مدار دوّار · قريبة أمامية (على الوجه) · جانبية ملاحِقة · علوية تطلّ على المدينة
local FREEFALL_SHOTS = {
	{ name = "orbit", dur = 6.0 },
	{ name = "front", dur = 3.6 },
	{ name = "side",  dur = 4.2 },
	{ name = "top",   dur = 3.8 },
}

local function cineSetMode(mode: string)
	if cine.mode ~= mode then
		cine.mode = mode
		cine.modeT = os.clock()
	end
end

local function cineStop(cam: Camera?)
	if cine.conn then
		cine.conn:Disconnect()
		cine.conn = nil
	end
	cine.offset = nil
	touchSteerStop()
	if cine.blur then
		cine.blur:Destroy()
		cine.blur = nil
	end
	if cam then
		cam.FieldOfView = cine.baseFOV
	end
end

-- يقرّب زاوية yaw الحالية نحو زاوية مستهدفة بأقصر مسار (للقطات الملاحِقة)
local function approachAngle(cur: number, target: number, rate: number, dt: number): number
	local d = math.atan2(math.sin(target - cur), math.cos(target - cur))
	return cur + d * math.min(1, rate * dt)
end

local function cineStart(cam: Camera, startFwd: Vector3)
	cineStop(cam)
	-- البداية خلف اللاعب مواجهاً اتجاه سقوطه
	cine.yaw = math.atan2(-startFwd.X, -startFwd.Z)
	cine.mode = "freefall"
	cine.modeT = os.clock()
	cine.shotIdx = 1
	cine.shotT = os.clock()
	cine.orbitSpd = 0.45
	cine.baseFOV = cam.FieldOfView
	cam.CameraType = Enum.CameraType.Scriptable
	touchSteerStart()
	local Lighting = game:GetService("Lighting")
	cine.blur = mk("BlurEffect", { Name = "CineDescentBlur", Size = 0, Parent = Lighting }) :: BlurEffect
	cine.conn = RunService.RenderStepped:Connect(function(dt)
		local t = os.clock()
		local sinceMode = t - cine.modeT
		local orbitTarget, dist, height
		local faceA = math.atan2(cine.faceDir.X, cine.faceDir.Z)
		local fovTarget = cine.baseFOV
		local blurTarget = 0
		if cine.mode == "freefall" then
			-- تبديل تلقائي بين لقطات سينمائية متنوّعة
			local shot = FREEFALL_SHOTS[cine.shotIdx]
			if t - cine.shotT > shot.dur then
				cine.shotIdx = (cine.shotIdx % #FREEFALL_SHOTS) + 1
				cine.shotT = t
				shot = FREEFALL_SHOTS[cine.shotIdx]
			end
			if shot.name == "front" then
				-- قريبة أمامية: الكاميرا أمام اللاعب تنظر لوجهه وهو ساقط
				orbitTarget = 0
				cine.yaw = approachAngle(cine.yaw, faceA, 3.5, dt)
				dist = 5.5
				height = 0.6 + math.sin(t * 0.7) * 0.5
			elseif shot.name == "side" then
				-- جانبية ملاحِقة
				orbitTarget = 0
				cine.yaw = approachAngle(cine.yaw, faceA + math.pi * 0.5, 3, dt)
				dist = 8.5
				height = 1.2
			elseif shot.name == "top" then
				-- علوية تطلّ على اللاعب والمدينة تحته
				orbitTarget = 0.25
				dist = 5
				height = 13
			else
				-- مدار دوّار كلاسيكي مع تنفّس
				orbitTarget = 0.5
				dist = 13 + math.sin(t * 0.31) * 3.5
				height = 2.5 + math.sin(t * 0.23) * 5.0
			end
			-- FOV يتّسع مع السرعة (إحساس اندفاع) + غباش حركة خفيف
			local spdF = math.clamp((cine.speed - 100) / 90, 0, 1)
			fovTarget = cine.baseFOV + spdF * 14
			blurTarget = spdF * 8
		elseif cine.mode == "deploy" then
			-- لحظة فتح المظلّة: لقطة من الأسفل تنظر لفوق + زوم درامي (مع البطء الزمني)
			orbitTarget = 0.2
			dist = 10
			height = -6 + math.min(sinceMode / 2.2, 1) * 10
			fovTarget = cine.baseFOV - 12 + math.min(sinceMode / 2.0, 1) * 12
			blurTarget = math.max(0, 1 - sinceMode / 1.2) * 10
			if sinceMode > 2.4 then cineSetMode("canopy") end
		elseif cine.mode == "canopy" then
			-- مدار أوسع وأهدأ يستعرض المدينة من كل الزوايا
			orbitTarget = 0.32
			dist = 16 + math.sin(t * 0.21) * 4
			height = 4 + math.sin(t * 0.17) * 5
			fovTarget = cine.baseFOV + 2
		else -- landing
			-- زاوية أرضية درامية قرب الهبوط
			orbitTarget = 0.5
			dist = 12
			height = math.clamp(cine.altitude * 0.3, 2.5, 10)
			fovTarget = cine.baseFOV - 4
		end
		-- لا تنزل الكاميرا تحت الأرض
		height = math.max(height, -(cine.altitude - 4))
		-- تسارع/تباطؤ ناعم بسرعة الدوران بدل التغيّر الفجائي
		cine.orbitSpd += (orbitTarget - cine.orbitSpd) * math.min(1, dt * 2)
		cine.yaw += cine.orbitSpd * dt
		local desired = Vector3.new(math.sin(cine.yaw) * dist, height, math.cos(cine.yaw) * dist)
		local off = cine.offset or desired
		off = off:Lerp(desired, math.min(1, dt * 3))
		cine.offset = off
		local shakeOff = Vector3.new(
			math.sin(t * 18.5),
			math.cos(t * 23.5) * 0.6,
			math.sin(t * 15.7) * 0.4
		) * cine.shake
		cam.CFrame = CFrame.lookAt(cine.pos + off + shakeOff, cine.pos + Vector3.new(0, 1, 0))
		cam.FieldOfView += (fovTarget - cam.FieldOfView) * math.min(1, dt * 2.5)
		if cine.blur then
			cine.blur.Size += (blurTarget - cine.blur.Size) * math.min(1, dt * 4)
		end
	end)
end

----------------------------------------------------------------------
-- بناء الطائرة الملكية (جسم Mesh مرفوع + إكسسوارات ذهبية + إضاءة LED)
----------------------------------------------------------------------
-- يبني الطائرة بالكامل من قطع روبلوكس أصلية بمحاور ثابتة ومضبوطة دائماً
-- (لا اعتماد على اتجاه الموديل المرفوع — يضمن طائرة معتدلة غير مقلوبة أبداً).
local function buildPlane(startPos: Vector3, travelDir: Vector3)
	-- إطار اتجاه ثابت: أمام أفقي، أعلى دائماً (0,1,0)، جانب عمودي عليهما
	local fwd = Vector3.new(travelDir.X, 0, travelDir.Z)
	if fwd.Magnitude < 1e-3 then fwd = Vector3.new(0, 0, 1) end
	fwd = fwd.Unit * CONFIG.FORWARD_SIGN
	local up = Vector3.new(0, 1, 0)
	local lat = fwd:Cross(up).Unit

	local L = CONFIG.PLANE_LENGTH                 -- طول الجسم
	local R = L * 0.075                           -- نصف قطر جسم الطائرة
	local hf, hu, hl = L / 2, R, R                -- أنصاف الأبعاد (طول/ارتفاع/عرض)

	local model = mk("Model", { Name = "RoyalPlane" })
	local P = startPos

	-- نقطة عالم نسبية لجسم الطائرة
	local function at(f, l, u)
		return P + fwd * (hf * f) + lat * (hl * l) + up * (hu * u)
	end
	-- إطار صندوق: المحور المحلي X=جانب، Y=أعلى، Z=أمام (Size = عرض×ارتفاع×طول)
	local function boxCF(f, l, u)
		return CFrame.fromMatrix(at(f, l, u), lat, up)
	end
	-- إطار أسطوانة: طولها على محور المحلي X — نوجّهه للأمام
	local function cylCF(f, l, u)
		return CFrame.fromMatrix(at(f, l, u), fwd, up)
	end
	local function solid(name, shape, size, color, material): Part
		return mk("Part", {
			Name = name, Shape = shape, Size = size, Color = color,
			Material = material or Enum.Material.SmoothPlastic,
			Anchored = true, CanCollide = false, CanQuery = false,
			CanTouch = false, CastShadow = false, Parent = model,
		}) :: Part
	end

	------------------------------------------------------------------
	-- جسم الطائرة (أسطوانة ناعمة + أنف ومؤخّرة مدوّرتان)
	------------------------------------------------------------------
	local bodyPart = solid("Fuselage", Enum.PartType.Cylinder,
		Vector3.new(L, R * 2, R * 2), WHITE)
	bodyPart.CFrame = cylCF(0, 0, 0)
	model.PrimaryPart = bodyPart

	local noseBall = solid("NoseCone", Enum.PartType.Ball,
		Vector3.new(R * 2, R * 2, R * 2), WHITE)
	noseBall.CFrame = CFrame.new(at(0.95, 0, 0))
	local tailBall = solid("TailCone", Enum.PartType.Ball,
		Vector3.new(R * 1.7, R * 1.7, R * 1.7), WHITE)
	tailBall.CFrame = CFrame.new(at(-0.95, 0, 0))

	-- زجاج قمرة القيادة الداكن (إحساس واقعي)
	local glass = solid("Cockpit", Enum.PartType.Block,
		Vector3.new(R * 1.5, R * 0.75, L * 0.11), Color3.fromRGB(22, 28, 46),
		Enum.Material.Glass)
	glass.Transparency = 0.25; glass.Reflectance = 0.18
	glass.CFrame = boxCF(0.68, 0, 0.62)

	------------------------------------------------------------------
	-- الأجنحة الرئيسية (مائلة للخلف قليلاً)
	------------------------------------------------------------------
	for _, side in ipairs({ -1, 1 }) do
		local wing = solid("Wing", Enum.PartType.Block,
			Vector3.new(L * 0.42, R * 0.16, L * 0.20), WHITE)
		wing.CFrame = boxCF(-0.06, side * 3.4, -0.12)
			* CFrame.Angles(0, -side * math.rad(15), 0)
		-- محرّك أسفل كل جناح
		local nac = solid("Engine", Enum.PartType.Cylinder,
			Vector3.new(L * 0.16, R * 0.9, R * 0.9), NAVY, Enum.Material.Metal)
		nac.CFrame = cylCF(-0.06, side * 2.0, -0.55)
		local intake = solid("EngineIntake", Enum.PartType.Cylinder,
			Vector3.new(L * 0.03, R * 0.95, R * 0.95), GOLD, Enum.Material.Metal)
		intake.CFrame = cylCF(0.07, side * 2.0, -0.55)
	end

	------------------------------------------------------------------
	-- الذيل: زعنفة عمودية + مثبّتان أفقيان
	------------------------------------------------------------------
	local fin = solid("TailFin", Enum.PartType.Block,
		Vector3.new(R * 0.32, R * 2.6, L * 0.16), WHITE)
	fin.CFrame = boxCF(-0.82, 0, 1.55)
	local finTrim = solid("FinTrim", Enum.PartType.Block,
		Vector3.new(R * 0.36, R * 2.4, L * 0.05), GOLD, Enum.Material.Metal)
	finTrim.CFrame = boxCF(-0.9, 0, 1.55)
	for _, side in ipairs({ -1, 1 }) do
		local stab = solid("Stabilizer", Enum.PartType.Block,
			Vector3.new(L * 0.17, R * 0.14, L * 0.12), WHITE)
		stab.CFrame = boxCF(-0.86, side * 1.6, 0.4)
			* CFrame.Angles(0, -side * math.rad(12), 0)
	end

	------------------------------------------------------------------
	-- إكسسوارات ذهبية تجميلية (مخروط الأنف، حلقات المحرّكين، خط الزينة)
	------------------------------------------------------------------
	local noseRing = neonBulb("NoseTrim", Vector3.new(hu * 0.9, hu * 0.9, hf * 0.10), GOLD, model)
	noseRing.Shape = Enum.PartType.Cylinder
	noseRing.Material = Enum.Material.Metal
	noseRing.CFrame = CFrame.lookAt(at(0.92, 0, 0), at(1.4, 0, 0)) * CFrame.Angles(0, math.rad(90), 0)

	for _, side in ipairs({ -1, 1 }) do
		local eng = neonBulb("EngineRing", Vector3.new(hu * 0.7, hu * 0.7, hf * 0.12), GOLD, model)
		eng.Shape = Enum.PartType.Cylinder
		eng.Material = Enum.Material.Metal
		eng.CFrame = CFrame.lookAt(at(-0.7, side * 0.45, 0.05), at(-1.2, side * 0.45, 0.05)) * CFrame.Angles(0, math.rad(90), 0)
	end

	-- خط زينة ذهبي على الجهتين
	for _, side in ipairs({ -1, 1 }) do
		local strip = neonBulb("CheatLine", Vector3.new(hf * 1.5, hu * 0.07, 0.2), GOLD, model)
		strip.Material = Enum.Material.Neon
		-- أنزل خط الزينة أسفل شريط الكتابة حتى لا يغطّي وهجه النص
		strip.CFrame = CFrame.fromMatrix(at(-0.42, side * 1.0, 0.15), fwd, up, lat * side)
	end

	------------------------------------------------------------------
	-- الكتابة الملكية «طائرة شهد للنزول الملكي» على الجهتين
	------------------------------------------------------------------
	for _, side in ipairs({ -1, 1 }) do
		local panel = mk("Part", {
			Name = "LiveryPanel", Size = Vector3.new(hf * 1.2, hu * 0.7, 0.15),
			Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
			CastShadow = false, Transparency = 1, Parent = model,
		}) :: Part
		panel.CFrame = CFrame.fromMatrix(at(0.05, side * 1.02, 0.35), fwd, up, lat * side)
		local sg = mk("SurfaceGui", {
			Name = "Livery", Face = Enum.NormalId.Back, Parent = panel,
			CanvasSize = Vector2.new(800, 240), LightInfluence = 0,
			AlwaysOnTop = true, ZOffset = 1,
		}) :: SurfaceGui
		-- لوحة كحلية معتمة خلف النص تمنع الوهج من تغطيته + إطار ذهبي
		local plate = mk("Frame", {
			Name = "Plate", AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.96, 0.74),
			BackgroundColor3 = NAVY, BackgroundTransparency = 0.08, Parent = sg,
		}) :: Frame
		mk("UICorner", { CornerRadius = UDim.new(0, 26), Parent = plate })
		mk("UIStroke", { Color = GOLD, Thickness = 4, Parent = plate })
		mk("TextLabel", {
			Size = UDim2.fromScale(0.9, 0.72), Position = UDim2.fromScale(0.5, 0.5),
			AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1,
			Text = "طائرة شهد للنزول الملكي", Font = Enum.Font.GothamBlack,
			TextScaled = true, TextColor3 = GOLD, TextStrokeColor3 = Color3.new(0, 0, 0),
			TextStrokeTransparency = 0.1, Parent = plate,
		})
	end

	------------------------------------------------------------------
	-- نوافذ المقصورة (وهج دافئ ثابت)
	------------------------------------------------------------------
	for _, side in ipairs({ -1, 1 }) do
		local win = neonBulb("CabinWindows", Vector3.new(hf * 0.95, hu * 0.16, 0.18), WARM, model)
		win.CFrame = CFrame.fromMatrix(at(0.05, side * 1.0, 0.45), fwd, up, lat * side)
		local pl = mk("PointLight", { Color = WARM, Brightness = 0.35, Range = 8, Parent = win }) :: PointLight
		pl.Shadows = false
	end

	------------------------------------------------------------------
	-- نظام إضاءة LED احترافي
	------------------------------------------------------------------
	local navColorL = if CONFIG.SWAP_NAV_COLORS then Color3.fromRGB(60, 255, 90) else Color3.fromRGB(255, 50, 50)
	local navColorR = if CONFIG.SWAP_NAV_COLORS then Color3.fromRGB(255, 50, 50) else Color3.fromRGB(60, 255, 90)

	-- أضواء ملاحة جناحية (أحمر يسار / أخضر يمين) — نِقاط صغيرة أنيقة، خافتة نهاراً
	local navL = neonBulb("NavPort", Vector3.new(0.6, 0.6, 0.6), navColorL, model)
	navL.Shape = Enum.PartType.Ball
	navL.CFrame = CFrame.new(at(-0.05, -1.0, 0.05))
	local navLLight = mk("PointLight", { Color = navColorL, Brightness = 1.6, Range = 13, Parent = navL }) :: PointLight

	local navR = neonBulb("NavStarboard", Vector3.new(0.6, 0.6, 0.6), navColorR, model)
	navR.Shape = Enum.PartType.Ball
	navR.CFrame = CFrame.new(at(-0.05, 1.0, 0.05))
	local navRLight = mk("PointLight", { Color = navColorR, Brightness = 1.6, Range = 13, Parent = navR }) :: PointLight

	-- منارة الذيل البيضاء (نبض)
	local beacon = neonBulb("TailBeacon", Vector3.new(0.55, 0.55, 0.55), WHITE, model)
	beacon.Shape = Enum.PartType.Ball
	beacon.CFrame = CFrame.new(at(-0.95, 0, 0.85))
	local beaconLight = mk("PointLight", { Color = WHITE, Brightness = 1.6, Range = 13, Parent = beacon }) :: PointLight

	-- سترّوب أحمر تحت البطن (ومضتان سريعتان متكررتان)
	local strobe = neonBulb("BellyStrobe", Vector3.new(0.7, 0.4, 0.7), Color3.fromRGB(255, 40, 40), model)
	strobe.Shape = Enum.PartType.Ball
	strobe.CFrame = CFrame.new(at(0, 0, -1.0))
	local strobeLight = mk("PointLight", { Color = Color3.fromRGB(255, 40, 40), Brightness = 2, Range = 15, Parent = strobe }) :: PointLight

	-- أضواء هبوط بيضاء بالأنف (ثابتة)
	local landBulb = neonBulb("LandingLight", Vector3.new(1.2, 0.5, 0.5), WHITE, model)
	landBulb.CFrame = CFrame.new(at(0.88, 0, -0.25))
	local landLight = mk("PointLight", { Color = WHITE, Brightness = 1.5, Range = 20, Parent = landBulb }) :: PointLight
	landLight.Shadows = false

	-- شريط بطني ذهبي رفيع (موجَّه مع الجسم، خافت — لا يطغى على الطائرة)
	local underBulb = neonBulb("Underglow", Vector3.new(hf * 1.2, 0.12, hl * 0.5), GOLD, model)
	underBulb.Transparency = 0.5
	underBulb.CFrame = CFrame.fromMatrix(at(0, 0, -0.72), fwd, up, lat)
	mk("PointLight", { Color = GOLD, Brightness = 0.5, Range = 10, Parent = underBulb, Shadows = false })

	------------------------------------------------------------------
	-- المقصورة الداخلية القابلة للمشي (أرضية + جدران صلبة + باب يفتح)
	-- اللاعب يقف ويتحرّك فوق الأرضية فعلياً (فيزياء حقيقية، غير مثبّت).
	------------------------------------------------------------------
	-- أبعاد المقصورة بالنسبة لأنصاف الجسم
	local CABIN_HALF_F = hf * 0.62                 -- نصف طول المقصورة
	local CABIN_HALF_L = hl * 0.72                 -- نصف عرض الممشى
	local FLOOR_U      = -0.42                      -- ارتفاع الأرضية نسبةً للمركز (أسفل قليلاً)
	local CEIL_U       = 0.92                        -- ارتفاع السقف

	local function collidableBox(name, size, cf, color, transparency): Part
		local p = mk("Part", {
			Name = name, Size = size, CFrame = cf, Color = color or NAVY,
			Material = Enum.Material.SmoothPlastic, Anchored = true,
			CanCollide = true, CanQuery = false, CanTouch = false, CastShadow = false,
			Transparency = transparency or 0, Parent = model,
		}) :: Part
		return p
	end

	-- أرضية المقصورة (مرئية — سجادة طيران كحلية فاخرة)
	local floorLen = CABIN_HALF_F * 2
	local floorWid = CABIN_HALF_L * 2
	local floor = collidableBox("CabinFloor",
		Vector3.new(floorWid, 1, floorLen),
		boxCF(0, 0, FLOOR_U), Color3.fromRGB(26, 28, 44))
	floor.Material = Enum.Material.Carpet
	-- ممشى سجادة ذهبي في المنتصف (الممرّ بين الصفوف)
	mk("Part", {
		Name = "CabinRunner", Size = Vector3.new(floorWid * 0.30, 0.12, floorLen * 0.98),
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
		CastShadow = false, Material = Enum.Material.Carpet, Color = Color3.fromRGB(120, 92, 38),
		CFrame = boxCF(0, 0, FLOOR_U) * CFrame.new(0, 0.56, 0), Parent = model,
	})

	-- جدران جانبية حاجزة (شفّافة — تمنع السقوط أثناء المشي)
	local wallH = (CEIL_U - FLOOR_U) * hu
	local wallCU = (CEIL_U + FLOOR_U) / 2
	for _, side in ipairs({ -1, 1 }) do
		collidableBox("CabinWall",
			Vector3.new(floorLen, wallH, 0.6),
			CFrame.fromMatrix(at(0, side * 0.95, wallCU), fwd, up, lat * side),
			NAVY, 1)
	end
	-- حاجز المقدّمة (قمرة القيادة) والمؤخّرة
	for _, fSign in ipairs({ -1, 1 }) do
		collidableBox("CabinEnd",
			Vector3.new(floorWid + 1.2, wallH, 0.6),
			boxCF(fSign * 0.62, 0, wallCU),
			NAVY, 1)
	end
	-- سقف حاجز (يمنع القفز للخارج من الأعلى)
	collidableBox("CabinCeil",
		Vector3.new(floorWid + 1.2, 0.6, floorLen),
		boxCF(0, 0, CEIL_U), NAVY, 1)

	------------------------------------------------------------------
	-- تأثيث المقصورة الواقعي: بانلات كريمية معتمة + نوافذ + خزائن علوية +
	-- سقف بإضاءة كوّة مخفية + صفوف كراسي جلدية تواجه الأمام + فاصل قمرة قيادة
	------------------------------------------------------------------
	local CREAMC = Color3.fromRGB(236, 230, 216)   -- بطانة/سقف المقصورة
	local PANELC = Color3.fromRGB(224, 218, 206)   -- بانل الجدار الجانبي
	local SKYC   = Color3.fromRGB(150, 205, 240)   -- زجاج النافذة (سماء)
	local SEATC  = Color3.fromRGB(46, 56, 104)     -- جلد كحلي
	local SEATAC = Color3.fromRGB(120, 40, 52)     -- جلد عنّابي (صف وسط)
	local HEADC  = Color3.fromRGB(236, 230, 218)   -- غطاء مسند الرأس
	local ARMC   = Color3.fromRGB(40, 46, 60)      -- مسند الذراع

	-- بانلات جانبية كريمية معتمة (تغطّي الجدار الشفّاف فيختفي ما خلفه برّا)
	for _, side in ipairs({ -1, 1 }) do
		local liner = solid("CabinLiner", Enum.PartType.Block,
			Vector3.new(floorLen, wallH, 0.4), PANELC)
		liner.CFrame = CFrame.fromMatrix(at(0, side * 0.9, wallCU), fwd, up, lat * side)
	end

	-- سقف كريمي + كوّة إضاءة مخفية دافئة في منتصف السقف
	local ceilPanel = solid("CabinCeilPanel", Enum.PartType.Block,
		Vector3.new(floorWid, 0.4, floorLen), CREAMC)
	ceilPanel.CFrame = boxCF(0, 0, CEIL_U - 0.02)
	local cove = neonBulb("CabinCove", Vector3.new(0.6, 0.12, floorLen * 0.96), WARM, model)
	cove.CFrame = boxCF(0, 0, CEIL_U - 0.16)
	mk("PointLight", { Color = WARM, Brightness = 1.7, Range = 28, Parent = cove, Shadows = false })

	-- نوافذ مضيئة على الجهتين + خزائن علوية مائلة
	local nWin = 5
	for _, side in ipairs({ -1, 1 }) do
		local bin = solid("OverheadBin", Enum.PartType.Block,
			Vector3.new(floorLen * 0.96, hu * 0.5, hl * 0.6), CREAMC)
		bin.CFrame = CFrame.fromMatrix(at(0, side * 0.74, CEIL_U - 0.22), fwd, up, lat * side)
			* CFrame.Angles(math.rad(14), 0, 0)
		for i = 1, nWin do
			local f = -0.46 + (i - 0.5) * (0.92 / nWin)
			local trim = solid("WindowTrim", Enum.PartType.Block,
				Vector3.new(hf * 0.13, hu * 0.32, 0.16), CREAMC)
			trim.CFrame = CFrame.fromMatrix(at(f, side * 0.885, 0.16), fwd, up, lat * side)
			local win = neonBulb("CabinWindow", Vector3.new(hf * 0.095, hu * 0.24, 0.10), SKYC, model)
			win.CFrame = CFrame.fromMatrix(at(f, side * 0.875, 0.16), fwd, up, lat * side)
			mk("PointLight", { Color = SKYC, Brightness = 0.45, Range = 9, Parent = win, Shadows = false })
		end
	end

	-- كرسي ركّاب وثير يواجه الأمام (قاعدة + ظهر مائل + مسند رأس + مسندا ذراع)
	local function buildSeat(f, side, accent)
		local hue = if accent then SEATAC else SEATC
		local base = solid("SeatBase", Enum.PartType.Block,
			Vector3.new(hl * 0.42, hu * 0.18, hf * 0.05), hue)
		base.Material = Enum.Material.Fabric
		base.CFrame = boxCF(f, side * 0.5, FLOOR_U + 0.22)
		local backrest = solid("SeatBack", Enum.PartType.Block,
			Vector3.new(hl * 0.42, hu * 0.50, hf * 0.020), hue)
		backrest.Material = Enum.Material.Fabric
		backrest.CFrame = boxCF(f - 0.024, side * 0.5, FLOOR_U + 0.52)
			* CFrame.Angles(math.rad(8), 0, 0)
		local head = solid("SeatHead", Enum.PartType.Block,
			Vector3.new(hl * 0.30, hu * 0.16, hf * 0.020), HEADC)
		head.Material = Enum.Material.Fabric
		head.CFrame = boxCF(f - 0.030, side * 0.5, FLOOR_U + 0.76)
		for _, ay in ipairs({ -0.20, 0.20 }) do
			local arm = solid("SeatArm", Enum.PartType.Block,
				Vector3.new(hl * 0.06, hu * 0.10, hf * 0.045), ARMC)
			arm.CFrame = boxCF(f, side * 0.5 + ay, FLOOR_U + 0.34)
		end
	end
	for ri = -1, 1 do
		for _, side in ipairs({ -1, 1 }) do
			buildSeat(ri * 0.18, side, ri == 0)
		end
	end

	-- فاصل قمرة القيادة بباب مضيء أمام المقصورة (يخفي الحاجز الأمامي)
	local divider = solid("CockpitDivider", Enum.PartType.Block,
		Vector3.new(floorWid + 0.6, wallH, 0.5), PANELC)
	divider.CFrame = boxCF(0.6, 0, wallCU)
	local divDoor = neonBulb("CockpitDoorGlow", Vector3.new(hl * 0.55, wallH * 0.66, 0.10), WARM, model)
	divDoor.CFrame = boxCF(0.585, 0, wallCU - 0.12)

	-- باب القفز القابل للفتح (لوح صلب على الجانب الأيسر؛ يُفتح بالـE)
	local doorClosedCF = CFrame.fromMatrix(at(-0.18, -0.96, (FLOOR_U + CEIL_U) / 2 - 0.05), fwd, up, -lat)
	local door = mk("Part", {
		Name = "JumpDoor",
		Size = Vector3.new(hf * 0.34, wallH * 0.92, 0.5),
		CFrame = doorClosedCF, Color = Color3.fromRGB(225, 225, 232),
		Material = Enum.Material.SmoothPlastic, Anchored = true,
		CanCollide = true, CanQuery = false, CanTouch = false, CastShadow = false,
		Parent = model,
	}) :: Part
	-- إطار ذهبي حول الباب
	local doorTrim = neonBulb("DoorTrim", Vector3.new(hf * 0.38, wallH * 0.98, 0.18), GOLD, model)
	doorTrim.Material = Enum.Material.Metal
	doorTrim.CFrame = CFrame.fromMatrix(at(-0.18, -1.0, (FLOOR_U + CEIL_U) / 2 - 0.05), fwd, up, -lat)
	-- إطار الفتحة الداكن خلف الباب (يبان لما يفتح)
	local doorHole = neonBulb("DoorHole", Vector3.new(hf * 0.34, wallH * 0.9, 0.1), Color3.fromRGB(12, 14, 22), model)
	doorHole.Material = Enum.Material.SmoothPlastic
	doorHole.CFrame = CFrame.fromMatrix(at(-0.2, -1.04, (FLOOR_U + CEIL_U) / 2 - 0.05), fwd, up, -lat)

	-- نقطة الوقوف داخل المقصورة (وسط الأرضية، يقدر يمشي منها بحرية)
	local spawnOnFloorCF = boxCF(0, 0, FLOOR_U) * CFrame.new(0, 4, 0)
	-- نقطة باب القفز (تجاه الخارج عبر الباب الأيسر)
	local jumpStandCF = boxCF(-0.42, -0.6, FLOOR_U) * CFrame.new(0, 3, 0)

	local rotOnly = CFrame.fromMatrix(Vector3.new(0, 0, 0), fwd, up)

	return {
		model = model, body = bodyPart,
		fwd = fwd, up = up, lat = lat, rot = rotOnly,
		half = { f = hf, u = hu, l = hl },
		nav = { { navL, navLLight }, { navR, navRLight } },
		beacon = { beacon, beaconLight },
		strobe = { strobe, strobeLight },
		cabin = {
			floor = floor, door = door, doorClosedCF = doorClosedCF,
			spawnCF = spawnOnFloorCF, jumpCF = jumpStandCF,
		},
	}
end

-- تحريك إضاءة LED (وميض ملاحة، نبض منارة، ومضة سترّوب مزدوجة)
local function stepLEDs(plane, t: number)
	-- وميض ملاحة ناعم
	local navOn = (t % 1.5) > 0.18
	for _, pair in ipairs(plane.nav) do
		local light = pair[2] :: PointLight
		light.Brightness = navOn and 1.6 or 0.2
		;(pair[1] :: BasePart).Transparency = navOn and 0 or 0.55
	end
	-- نبض منارة الذيل
	local pulse = 0.5 + 0.5 * math.sin(t * 6)
	;(plane.beacon[2] :: PointLight).Brightness = 0.6 + pulse * 1.5
	;(plane.beacon[1] :: BasePart).Transparency = 0.15 + (1 - pulse) * 0.5
	-- سترّوب: ومضتان سريعتان كل ١.٢ث
	local ph = t % 1.2
	local flash = (ph < 0.06) or (ph >= 0.16 and ph < 0.22)
	;(plane.strobe[2] :: PointLight).Brightness = flash and 2.5 or 0
	;(plane.strobe[1] :: BasePart).Transparency = flash and 0 or 0.7
end

----------------------------------------------------------------------
-- المظلّة (قبّة + حبال + harness) تتبع اللاعب مع تمايل
----------------------------------------------------------------------
buildProceduralCanopy = function(): (Model, BasePart)
	local model = mk("Model", { Name = "RoyalCanopy" })
	local anchor = mk("Part", {
		Name = "Anchor", Size = Vector3.new(0.5, 0.5, 0.5), Transparency = 1,
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
		CastShadow = false, Parent = model,
	}) :: Part
	model.PrimaryPart = anchor

	-- مظلّة ملكية واقعية: قبّة قماش معتمة بحوافّ مفصّصة منتفخة + خياطات قطاعات
	-- (كحلي/ذهبي متناوب) + فتحة تهوية ذهبية بالقمّة + حبال تعليق تتجمّع للـharness.
	local R = 17
	local DY = 13.5                     -- ارتفاع مركز القبة فوق نقطة التعليق (اللاعب)
	local HALF_H = R * 0.6              -- نصف ارتفاع القبّة (ضحلة = شكل مظلّة)
	local GORES = 16
	local CREAM = Color3.fromRGB(244, 241, 230)
	local SEAM_NAVY = Color3.fromRGB(33, 44, 78)
	local LINE_C = Color3.fromRGB(38, 38, 44)
	local domeCF = anchor.CFrame * CFrame.new(0, DY, 0)
	local harness = anchor.CFrame * CFrame.new(0, 2.5, 0)   -- تتجمّع الحبال عند ظهر اللاعب

	-- القبّة: كرة مفلطحة معتمة بمادة قماش
	mk("Part", {
		Name = "Dome", Shape = Enum.PartType.Ball, Size = Vector3.new(R * 2, HALF_H * 2, R * 2),
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
		CastShadow = false, Material = Enum.Material.Fabric, Color = CREAM,
		CFrame = domeCF, Parent = model,
	})

	-- خياطات القطاعات: من القمّة إلى الحافة (كحلي/ذهبي متناوب)
	local apex = domeCF * CFrame.new(0, HALF_H * 0.94, 0)
	for i = 0, GORES - 1 do
		local a = math.rad(i * (360 / GORES))
		local rimP = (domeCF * CFrame.Angles(0, a, 0) * CFrame.new(R * 0.99, HALF_H * 0.04, 0)).Position
		local seam = mk("Part", {
			Name = "Seam", Anchored = true, CanCollide = false, CanQuery = false,
			CanTouch = false, CastShadow = false, Material = Enum.Material.SmoothPlastic,
			Color = if i % 2 == 0 then SEAM_NAVY else GOLD, Parent = model,
		}) :: Part
		local len = (apex.Position - rimP).Magnitude
		seam.CFrame = CFrame.lookAt(apex.Position, rimP) * CFrame.new(0, 0, -len / 2)
		seam.Size = Vector3.new(0.16, 0.16, len)
	end

	-- حافّة مفصّصة منتفخة (حلقة كرات قماش صغيرة) — شكل المظلّة الحقيقي
	for i = 0, GORES * 2 - 1 do
		local a = math.rad(i * (360 / (GORES * 2)))
		local p = (domeCF * CFrame.Angles(0, a, 0) * CFrame.new(R * 0.99, HALF_H * 0.02, 0)).Position
		mk("Part", {
			Name = "Lobe", Shape = Enum.PartType.Ball, Size = Vector3.new(R * 0.3, R * 0.2, R * 0.3),
			Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
			CastShadow = false, Material = Enum.Material.Fabric, Color = CREAM,
			CFrame = CFrame.new(p), Parent = model,
		})
	end

	-- فتحة تهوية ذهبية بالقمّة (لمسة ملكية)
	mk("Part", {
		Name = "ApexVent", Shape = Enum.PartType.Ball, Size = Vector3.new(R * 0.34, R * 0.18, R * 0.34),
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
		CastShadow = false, Material = Enum.Material.Neon, Color = GOLD,
		CFrame = domeCF * CFrame.new(0, HALF_H * 0.96, 0), Parent = model,
	})

	-- حبال التعليق: من الحافّة تتجمّع كلّها عند harness على ظهر اللاعب
	for i = 0, GORES - 1 do
		local a = math.rad(i * (360 / GORES))
		local rimP = (domeCF * CFrame.Angles(0, a, 0) * CFrame.new(R * 0.96, HALF_H * 0.02, 0)).Position
		local line = mk("Part", {
			Name = "Line", Anchored = true, CanCollide = false, CanQuery = false,
			CanTouch = false, CastShadow = false, Material = Enum.Material.SmoothPlastic,
			Color = LINE_C, Parent = model,
		}) :: Part
		local len = (rimP - harness.Position).Magnitude
		line.CFrame = CFrame.lookAt(rimP, harness.Position) * CFrame.new(0, 0, -len / 2)
		line.Size = Vector3.new(0.08, 0.08, len)
	end
	return model, anchor
end

----------------------------------------------------------------------
-- واجهة الـHUD (جوال-أولاً: مقاسات Scale + أزرار لمس كبيرة)
----------------------------------------------------------------------
local function buildHUD()
	local gui = mk("ScreenGui", {
		Name = "RoyalSpawnHUD", ResetOnSpawn = false, IgnoreGuiInset = true,
		DisplayOrder = 60, ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		Parent = LocalPlayer:WaitForChild("PlayerGui"),
	}) :: ScreenGui

	local root = mk("Frame", {
		Name = "Root", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1,
		Parent = gui,
	}) :: Frame
	local scale = mk("UIScale", { Scale = 1, Parent = root }) :: UIScale
	local function refreshScale()
		local vp = Workspace.CurrentCamera and Workspace.CurrentCamera.ViewportSize or Vector2.new(1280, 720)
		scale.Scale = math.clamp(math.min(vp.X / 1280, vp.Y / 720), 0.72, 1.7)
	end
	refreshScale()
	if Workspace.CurrentCamera then
		Workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(refreshScale)
	end

	-- لافتة الطور (أعلى الوسط)
	local banner = mk("TextLabel", {
		Name = "Banner", AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.fromScale(0.5, 0.04), Size = UDim2.fromOffset(520, 56),
		BackgroundColor3 = Color3.fromRGB(15, 18, 30), BackgroundTransparency = 0.25,
		Text = "وضع المشاهدة", Font = Enum.Font.GothamBlack, TextScaled = true,
		TextColor3 = GOLD, Parent = root,
	}) :: TextLabel
	mk("UICorner", { CornerRadius = UDim.new(0, 14), Parent = banner })
	mk("UIStroke", { Color = GOLD, Thickness = 2, Transparency = 0.3, Parent = banner })
	mk("UIPadding", {
		PaddingLeft = UDim.new(0, 18), PaddingRight = UDim.new(0, 18),
		PaddingTop = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8), Parent = banner,
	})

	-- عدّاد ٣-٢-١ (وسط الشاشة)
	local countdown = mk("TextLabel", {
		Name = "Countdown", AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.42), Size = UDim2.fromOffset(220, 220),
		BackgroundTransparency = 1, Text = "", Font = Enum.Font.GothamBlack,
		TextScaled = true, TextColor3 = WHITE, TextStrokeColor3 = NAVY,
		TextStrokeTransparency = 0.1, Visible = false, Parent = root,
	}) :: TextLabel

	-- HUD ارتفاع/سرعة (أعلى اليسار)
	local stats = mk("Frame", {
		Name = "Stats", AnchorPoint = Vector2.new(0, 0), Position = UDim2.fromScale(0.03, 0.12),
		Size = UDim2.fromOffset(220, 110), BackgroundColor3 = Color3.fromRGB(12, 14, 24),
		BackgroundTransparency = 0.3, Visible = false, Parent = root,
	}) :: Frame
	mk("UICorner", { CornerRadius = UDim.new(0, 12), Parent = stats })
	mk("UIStroke", { Color = GOLD, Thickness = 1.5, Transparency = 0.4, Parent = stats })
	local altLabel = mk("TextLabel", {
		Name = "Alt", Position = UDim2.fromScale(0, 0.06), Size = UDim2.fromScale(1, 0.42),
		BackgroundTransparency = 1, Text = "الارتفاع: -", Font = Enum.Font.GothamBold,
		TextScaled = true, TextColor3 = WHITE, TextXAlignment = Enum.TextXAlignment.Center,
		Parent = stats,
	}) :: TextLabel
	local spdLabel = mk("TextLabel", {
		Name = "Spd", Position = UDim2.fromScale(0, 0.52), Size = UDim2.fromScale(1, 0.42),
		BackgroundTransparency = 1, Text = "السرعة: -", Font = Enum.Font.GothamBold,
		TextScaled = true, TextColor3 = GOLD, TextXAlignment = Enum.TextXAlignment.Center,
		Parent = stats,
	}) :: TextLabel
	mk("UIPadding", {
		PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10),
		PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6), Parent = stats,
	})

	-- زر Skip كبير (أسفل الوسط — في منطقة آمنة لا تُقصّ على الجوال)
	local skipBtn = mk("TextButton", {
		Name = "Skip", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.84),
		Size = UDim2.fromOffset(260, 84), BackgroundColor3 = Color3.fromRGB(214, 175, 92),
		Text = "تخطّي", Font = Enum.Font.GothamBlack, TextScaled = true,
		TextColor3 = Color3.fromRGB(20, 22, 34), AutoButtonColor = true, Visible = false,
		Parent = root,
	}) :: TextButton
	mk("UICorner", { CornerRadius = UDim.new(0, 18), Parent = skipBtn })
	mk("UIStroke", { Color = WHITE, Thickness = 2, Transparency = 0.4, Parent = skipBtn })

	-- زر فتح المظلّة كبير (أسفل الوسط، منطقة آمنة) + تلميح E للكمبيوتر
	local chuteBtn = mk("TextButton", {
		Name = "Chute", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.84),
		Size = UDim2.fromOffset(300, 96), BackgroundColor3 = Color3.fromRGB(60, 170, 240),
		Text = "افتح المظلّة", Font = Enum.Font.GothamBlack, TextScaled = true,
		TextColor3 = WHITE, AutoButtonColor = true, Visible = false, Parent = root,
	}) :: TextButton
	mk("UICorner", { CornerRadius = UDim.new(0, 20), Parent = chuteBtn })
	mk("UIStroke", { Color = WHITE, Thickness = 2, Transparency = 0.3, Parent = chuteBtn })

	local eHint = mk("TextLabel", {
		Name = "EHint", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.72),
		Size = UDim2.fromOffset(280, 40), BackgroundTransparency = 1,
		Text = "اضغط E لفتح المظلّة", Font = Enum.Font.GothamBold, TextScaled = true,
		TextColor3 = WARM, Visible = false, Parent = root,
	}) :: TextLabel

	-- زر تسريع النزول (اضغط مع الاستمرار) — على يمين الشاشة، منطقة آمنة
	local boostBtn = mk("TextButton", {
		Name = "Boost", AnchorPoint = Vector2.new(1, 1), Position = UDim2.fromScale(0.96, 0.84),
		Size = UDim2.fromOffset(140, 96), BackgroundColor3 = Color3.fromRGB(214, 175, 92),
		Text = "تسريع ⬇", Font = Enum.Font.GothamBlack, TextScaled = true,
		TextColor3 = Color3.fromRGB(20, 22, 34), AutoButtonColor = true, Visible = false, Parent = root,
	}) :: TextButton
	mk("UICorner", { CornerRadius = UDim.new(0, 18), Parent = boostBtn })
	mk("UIStroke", { Color = WHITE, Thickness = 2, Transparency = 0.35, Parent = boostBtn })
	mk("UIPadding", {
		PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8),
		PaddingTop = UDim.new(0, 14), PaddingBottom = UDim.new(0, 14), Parent = boostBtn,
	})

	return {
		gui = gui, banner = banner, countdown = countdown, stats = stats,
		alt = altLabel, spd = spdLabel, skip = skipBtn, chute = chuteBtn, eHint = eHint,
		boost = boostBtn,
	}
end

----------------------------------------------------------------------
-- التسلسل الكامل للريسبون
----------------------------------------------------------------------
local started = false
local activeInputConn: RBXScriptConnection? = nil -- يُنظَّف في معالج الخطأ لو تعطّل run()
local activeBoostConn: RBXScriptConnection? = nil -- مستمع إفلات Shift للتسريع — يُنظَّف في معالج الخطأ أيضاً

local function run()
	local char = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
	local hum = char:FindFirstChildOfClass("Humanoid") or char:WaitForChild("Humanoid", 8)
	local hrp = char:FindFirstChild("HumanoidRootPart") or char:WaitForChild("HumanoidRootPart", 8)
	-- شاشة التحميل تترك التحكّم معطّلاً؛ فلو تعذّر إكمال الإعداد نعيده هنا حتى لا يعلق اللاعب
	if not hum or not hrp then setControls(true) return end
	local humanoid = hum :: Humanoid
	local rootPart = hrp :: BasePart

	local cam = Workspace.CurrentCamera
	if not cam then setControls(true) return end
	cinematicLightingCleanup = startCinematicLighting()

	-- مسار الطائرة: تعبر المدينة وتُسقط اللاعب فوق وسط الماب، ثم نزول حرّ موجَّه.
	local jumpXZ = CONFIG.JUMP_XZ
	local travelDir = (Vector3.new(1, 0, 0) * CONFIG.FORWARD_SIGN).Unit
	local jumpPoint = Vector3.new(jumpXZ.X, CONFIG.ALTITUDE, jumpXZ.Y)
	local fallDir = travelDir

	-- إعداد الواجهة + بناء الطائرة عند نقطة القفز (تحوم ثابتة لتمشي داخلها)
	local hud = buildHUD()
	local plane = buildPlane(jumpPoint, travelDir)
	plane.model.Parent = Workspace
	local engineSnd = playSound3D(plane.body, CONFIG.SND_ENGINE, 0.6, true)
	cinematicShadow = mk("Part", {
		Name = "RoyalSpawnShadow",
		Shape = Enum.PartType.Ball,
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
		CastShadow = false, Material = Enum.Material.SmoothPlastic,
		Color = Color3.fromRGB(0, 0, 0), Transparency = 1,
		Size = Vector3.new(28, 0.18, 28), Parent = Workspace,
	}) :: Part

	------------------------------------------------------------------
	-- غيوم تمرّ بسرعة من النوافذ → إحساس طيران حقيقي (الطائرة «تتحرّك»)
	------------------------------------------------------------------
	local cloudFolder = Instance.new("Folder")
	cloudFolder.Name = "SpawnFlightClouds"
	cloudFolder.Parent = Workspace
	local clouds: { BasePart } = {}
	local CLOUD_SPAN = 800                          -- مدى الغيوم أمام/خلف الطائرة
	local function placeCloud(c: BasePart, ahead: number)
		local sideOff = (math.random() * 2 - 1) * 150
		local vertOff = (math.random() * 2 - 1) * 110
		c.Position = jumpPoint + travelDir * ahead + plane.lat * sideOff + Vector3.new(0, vertOff, 0)
	end
	for i = 1, 16 do
		local sc = 45 + math.random() * 70
		local c = mk("Part", {
			Name = "FlightCloud", Shape = Enum.PartType.Ball, Anchored = true,
			CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false,
			Material = Enum.Material.SmoothPlastic, Color = Color3.fromRGB(248, 248, 255),
			Transparency = 0.28, Size = Vector3.new(sc, sc * 0.5, sc), Parent = cloudFolder,
		}) :: BasePart
		clouds[i] = c
		placeCloud(c, (math.random() - 0.5) * CLOUD_SPAN)
	end
	local function stepClouds(dt: number)
		for _, c in ipairs(clouds) do
			c.Position = c.Position - travelDir * (170 * dt)
			if (c.Position - jumpPoint):Dot(travelDir) < -CLOUD_SPAN * 0.5 then
				placeCloud(c, CLOUD_SPAN * 0.5)
			end
		end
	end

	local deployed = false
	local jumpRequested = false
	local deployStartTime = 0
	local deployOpenSpeed = 0
	local function updateDescentFX(altitude: number, speed: number, groundY: number, canopyMode: boolean, openBlend: number, x: number, z: number)
		if cinematicShadow then
			local shadowSize = math.clamp(60 - altitude * 0.08, 12, 60)
			cinematicShadow.Size = Vector3.new(shadowSize, 0.18, shadowSize)
			cinematicShadow.Position = Vector3.new(x, groundY + 0.04, z)
			cinematicShadow.Transparency = math.clamp(0.34 + (60 - shadowSize) * 0.01, 0.34, 0.85)
		end
		local shakeBase = canopyMode and 0.03 or math.clamp((speed - 95) / 950, 0, 0.08)
		shakeBase += math.clamp(1 - math.clamp(openBlend, 0, 1), 0, 1) * 0.08
		local t = os.clock()
		humanoid.CameraOffset = Vector3.new(math.sin(t * 18.5) * shakeBase, math.cos(t * 23.5) * shakeBase * 0.6, 0)
		if cinematicWind then
			local windVolume = math.clamp((speed - 55) / 125, 0.08, 0.95)
			if canopyMode then
				windVolume *= 0.7
			end
			cinematicWind.Volume = windVolume
		end
	end

	------------------------------------------------------------------
	-- الطور ١: المقصورة القابلة للمشي — تتحرّك داخل الطائرة بحرّية،
	-- ثم تضغط E (أو زر «اقفز» على الجوال) لفتح الباب والقفز.
	------------------------------------------------------------------
	-- ضع اللاعب فوق أرضية المقصورة وفعّل حركته الطبيعية (غير مثبّت)
	rootPart.Anchored = false
	humanoid.AutoRotate = true
	pcall(function() humanoid:SetStateEnabled(Enum.HumanoidStateType.Dead, false) end)
	restoreMovement(humanoid)
	rootPart.CFrame = plane.cabin.spawnCF
	rootPart.AssemblyLinearVelocity = Vector3.zero
	cam.CameraType = Enum.CameraType.Custom
	cam.CameraSubject = humanoid
	setControls(true)

	-- فصل واضح بين الجوال (أزرار لمس) والكمبيوتر (تلميح لوحة المفاتيح):
	-- الجوال يرى زر «اقفز» فقط، والكمبيوتر يرى تلميح «اضغط E» فقط — بلا تكرار.
	if isMobileInput() then
		hud.banner.Text = "امشِ داخل الطائرة ثم اضغط زر «اقفز»"
		hud.skip.Text = "اقفز"
		hud.skip.Visible = true
		hud.skip.Activated:Connect(function() jumpRequested = true end)
	else
		hud.banner.Text = "امشِ داخل الطائرة ثم اقفز"
		hud.eHint.Text = "اضغط E للقفز"
		hud.eHint.Visible = true
	end

	local cabinInput = UserInputService.InputBegan:Connect(function(input, gpe)
		if gpe then return end
		if input.KeyCode == Enum.KeyCode.E then jumpRequested = true end
	end)
	activeInputConn = cabinInput

	-- حلقة المقصورة: الغيوم تمرّ من النوافذ + تمايل طيران خفيف، وننتظر القفز
	while not jumpRequested do
		local dt = RunService.Heartbeat:Wait()
		local t = os.clock()
		stepLEDs(plane, t)
		stepClouds(dt)
		-- شبكة أمان: لو سقط اللاعب خارج المقصورة لأي سبب أعِده للأرضية
		if rootPart.Position.Y < jumpPoint.Y - plane.half.u * 0.9 then
			rootPart.CFrame = plane.cabin.spawnCF
			rootPart.AssemblyLinearVelocity = Vector3.zero
		end
	end

	if cabinInput then cabinInput:Disconnect() end
	activeInputConn = nil
	hud.skip.Visible = false
	hud.eHint.Visible = false

	------------------------------------------------------------------
	-- فتح باب الطائرة (حركة انزلاق) ثم القفز
	------------------------------------------------------------------
	do
		-- ثبّت اللاعب عند الباب فوراً (قبل فتح الباب) كي لا تجرّه سرعته خارج المقصورة
		humanoid.AutoRotate = false
		rootPart.AssemblyLinearVelocity = Vector3.zero
		rootPart.CFrame = plane.cabin.jumpCF
		rootPart.Anchored = true

		local jumpDoor = plane.cabin.door
		jumpDoor.CanCollide = false
		local openCF = plane.cabin.doorClosedCF * CFrame.new(jumpDoor.Size.X * 0.9, 0, 0)
		TweenService:Create(jumpDoor, TweenInfo.new(0.6, Enum.EasingStyle.Quad), {
			CFrame = openCF, Transparency = 1,
		}):Play()
		playSound3D(plane.body, CONFIG.SND_JUMP, 0.5, false)
		task.wait(0.7)
	end

	------------------------------------------------------------------
	-- الطور ٢: القفز + السقوط الحر
	------------------------------------------------------------------
	hud.skip.Visible = false
	hud.countdown.Visible = false
	hud.banner.Text = "سقوط حرّ"
	hud.stats.Visible = true
	-- الجوال: أزرار لمس (افتح المظلّة + تسريع) فقط · الكمبيوتر: تلميح E/Shift فقط.
	if isMobileInput() then
		hud.chute.Visible = true
		hud.boost.Visible = true
		hud.banner.Text = "سقوط حرّ — اسحب إصبعك على الشاشة للتوجيه"
	else
		hud.eHint.Text = "اضغط E لفتح المظلّة · استمر بالضغط على Shift لتسريع النزول"
		hud.eHint.Visible = true
	end
	playSound3D(rootPart, CONFIG.SND_JUMP, 0.7, false)
	cinematicWind = playSound3D(rootPart, CONFIG.SND_WIND, 0.12, true)

	-- كاميرا سينمائية ٣٦٠° تلقائية تدور حول اللاعب من زوايا متغيّرة طوال النزول،
	-- والتوجيه (WASD/عصا الجوال) يبقى شغّالاً نسبةً لاتجاه جسم اللاعب (W = للأمام، A/D = انعطاف).
	cine.pos = rootPart.Position
	cine.altitude = CONFIG.ALTITUDE
	cine.shake = 0
	cineStart(cam, fallDir)
	setControls(true)

	local canopy: Model? = nil
	local descentExclude: { Instance } = { char }

	-- الطائرة تكمل طيرانها وتختفي
	task.spawn(function()
		local flyT = os.clock()
		while plane.model.Parent and os.clock() - flyT < 3 do
			local dt = RunService.Heartbeat:Wait()
			-- قد تُنظَّف الطائرة أثناء الانتظار (عند فشل التسلسل)؛ نتأكّد قبل أي عملية
			if not plane.model.Parent then break end
			plane.model:PivotTo(plane.model:GetPivot() + travelDir * (90 * dt))
			stepClouds(dt)
			stepLEDs(plane, os.clock())
		end
		if engineSnd then engineSnd:Stop() end
		if plane.model then plane.model:Destroy() end
		if cloudFolder then cloudFolder:Destroy() end
	end)

	-- أثر ملوّن خلف اللاعب
	local a0 = mk("Attachment", { Name = "TrailTop", Position = Vector3.new(0, 1.2, 0), Parent = rootPart }) :: Attachment
	local a1 = mk("Attachment", { Name = "TrailBot", Position = Vector3.new(0, -1.2, 0), Parent = rootPart }) :: Attachment
	local trail = mk("Trail", {
		Attachment0 = a0, Attachment1 = a1, Lifetime = 0.7, MinLength = 0.1,
		LightEmission = 1, Color = ColorSequence.new({
			ColorSequenceKeypoint.new(0, GOLD),
			ColorSequenceKeypoint.new(0.5, Color3.fromRGB(225, 80, 60)),
			ColorSequenceKeypoint.new(1, WHITE),
		}),
		Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.1),
			NumberSequenceKeypoint.new(1, 1),
		}),
		Parent = rootPart,
	}) :: Trail

	-- E / زر اللمس لفتح المظلّة + تسريع النزول (Shift على الكمبيوتر / زر «تسريع» على الجوال)
	local boosting = false
	hud.chute.Activated:Connect(function() deployed = true end)
	local inputConn = UserInputService.InputBegan:Connect(function(input, gpe)
		if input.KeyCode == Enum.KeyCode.LeftShift or input.KeyCode == Enum.KeyCode.RightShift then
			boosting = true
			return
		end
		if gpe then return end
		if input.KeyCode == Enum.KeyCode.E then deployed = true end
	end)
	local boostEndConn = UserInputService.InputEnded:Connect(function(input)
		if input.KeyCode == Enum.KeyCode.LeftShift or input.KeyCode == Enum.KeyCode.RightShift then
			boosting = false
		end
	end)
	activeBoostConn = boostEndConn
	-- زر اللمس: اضغط مع الاستمرار لتسريع النزول
	local function pressBoost(input) if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then boosting = true end end
	local function releaseBoost(input) if input.UserInputType == Enum.UserInputType.Touch or input.UserInputType == Enum.UserInputType.MouseButton1 then boosting = false end end
	hud.boost.InputBegan:Connect(pressBoost)
	hud.boost.InputEnded:Connect(releaseBoost)
	activeInputConn = inputConn

	local function updateDescentVisuals(altitude, speed)
		hud.alt.Text = string.format("الارتفاع: %d م", math.max(0, math.floor(altitude)))
		hud.spd.Text = string.format("السرعة: %d", math.floor(speed * 3.6))
	end

	local vSpeed = CONFIG.FREEFALL_MIN
	local y = CONFIG.ALTITUDE
	local px, pz = jumpXZ.X, jumpXZ.Y
	local faceDir = fallDir
	local bank = 0
	while true do
		local dt = RunService.Heartbeat:Wait()
		vSpeed = math.min(CONFIG.FREEFALL_MAX, vSpeed + CONFIG.FREEFALL_ACC * dt)
		local effSpeed = vSpeed * (if boosting then CONFIG.BOOST_FREEFALL else 1)
		y -= effSpeed * dt
		local dir = steerBodyDir(faceDir)
		local bankTarget = 0
		if dir.Magnitude > 0.01 then
			px = math.clamp(px + dir.X * CONFIG.DRIFT_FREEFALL * dt, -CONFIG.MAP_HALF, CONFIG.MAP_HALF)
			pz = math.clamp(pz + dir.Z * CONFIG.DRIFT_FREEFALL * dt, -CONFIG.MAP_HALF, CONFIG.MAP_HALF)
			-- دوران سلس ٣٦٠° نحو اتجاه الإدخال بدل القفز الفوري + ميلان جانبي مع الانعطاف
			local step
			faceDir, step = turnToward(faceDir, dir, CONFIG.TURN_FREEFALL * dt)
			bankTarget = -math.clamp(step / math.max(CONFIG.TURN_FREEFALL * dt, 1e-4), -1, 1) * CONFIG.BANK_FREEFALL
		end
		bank += (bankTarget - bank) * math.min(1, dt * 5)
		local groundY = groundYAt(px, pz, y - 2, descentExclude)
		local altitude = y - groundY
		local pos = Vector3.new(px, y, pz)
		rootPart.CFrame = CFrame.lookAt(pos, pos + faceDir) * CFrame.Angles(math.rad(-55), 0, bank)
		cine.pos = pos
		cine.faceDir = faceDir
		cine.altitude = altitude
		cine.speed = effSpeed
		cine.shake = math.clamp((effSpeed - 95) / 950, 0, 0.14)
		updateDescentVisuals(altitude, effSpeed)
		updateDescentFX(altitude, effSpeed, groundY, false, 0, px, pz)
		if deployed or altitude <= CONFIG.AUTO_DEPLOY_ALT or altitude <= CONFIG.LAND_ALT then
			deployOpenSpeed = effSpeed
			deployStartTime = os.clock()
			break
		end
	end

	------------------------------------------------------------------
	-- الطور ٣: فتح المظلّة + نزول مستقيم سلس مع تمايل
	------------------------------------------------------------------
	deployed = true
	hud.chute.Visible = false
	hud.eHint.Visible = false
	hud.banner.Text = "النزول بالمظلّة"
	if trail then trail.Enabled = false end
	playSound3D(rootPart, CONFIG.SND_CHUTE, 0.7, false)
	cineSetMode("deploy")

	canopy = buildCanopy()
	canopy.Parent = Workspace
	canopy:ScaleTo(0.2)
	descentExclude[#descentExclude + 1] = canopy
	-- فتحة المظلّة: تكبير تدريجي سريع (تأثير الانبثاق)
	-- نتحقّق من بقاء القبّة كل خطوة حتى لا نُحدث خطأ في الكونسول لو نُظّفت أثناء الفشل.
	task.spawn(function()
		for i = 1, 10 do
			if not canopy or not canopy.Parent then return end
			canopy:ScaleTo(0.2 + 0.08 * i)
			task.wait(0.02)
		end
	end)

	while true do
		local dt = RunService.Heartbeat:Wait()
		-- بطء زمني درامي لحظة فتح المظلّة يتلاشى تدريجياً خلال ثانية ونص
		local slowMo = 0.35 + 0.65 * math.clamp((os.clock() - deployStartTime) / 1.5, 0, 1)
		dt *= slowMo
		local openBlend = math.clamp((os.clock() - deployStartTime) / 0.72, 0, 1)
		local canopySpeed = ((deployOpenSpeed > 0 and (deployOpenSpeed + (CONFIG.CANOPY_SPEED - deployOpenSpeed) * openBlend)) or CONFIG.CANOPY_SPEED) * (if boosting then CONFIG.BOOST_CANOPY else 1)
		y -= canopySpeed * dt
		local dir = steerBodyDir(faceDir)
		local bankTarget = 0
		if dir.Magnitude > 0.01 then
			px = math.clamp(px + dir.X * CONFIG.DRIFT_CANOPY * dt, -CONFIG.MAP_HALF, CONFIG.MAP_HALF)
			pz = math.clamp(pz + dir.Z * CONFIG.DRIFT_CANOPY * dt, -CONFIG.MAP_HALF, CONFIG.MAP_HALF)
			-- انعطاف واقعي: الجسم يلفّ تدريجياً نحو اتجاه الإدخال (لفّات ٣٦٠ حول نقطة الهبوط)
			local step
			faceDir, step = turnToward(faceDir, dir, CONFIG.TURN_CANOPY * dt)
			bankTarget = -math.clamp(step / math.max(CONFIG.TURN_CANOPY * dt, 1e-4), -1, 1) * CONFIG.BANK_CANOPY
		end
		bank += (bankTarget - bank) * math.min(1, dt * 5)
		local groundY = groundYAt(px, pz, y - 2, descentExclude)
		local altitude = y - groundY
		local tt = os.clock()
		local swayYaw = math.sin(tt * 1.1) * 0.10
		local swayRoll = math.sin(tt * 0.9) * 0.08
		local pos = Vector3.new(px, y, pz)
		-- الاتجاه: الجسم يواجه اتجاه حركته (لا الكاميرا) — فتبقى الكاميرا حرّة تدور ٣٦٠°
		--          حول المظلّي من كل الزوايا، بجلسة مظلّي واقعية (مثل ببجي) مع ميلان جانبي
		--          للجسم والمظلّة أثناء الانعطاف.
		local base = CFrame.lookAt(pos, pos + faceDir)
		rootPart.CFrame = base * CFrame.Angles(math.rad(-52), swayYaw, swayRoll + bank)
		canopy:PivotTo(base * CFrame.Angles(0, swayYaw, swayRoll * 1.6 + bank * 0.6))
		cine.pos = pos
		cine.faceDir = faceDir
		cine.altitude = altitude
		cine.speed = canopySpeed
		cine.shake = 0.03 + math.clamp(1 - openBlend, 0, 1) * 0.1
		if altitude < 55 and cine.mode ~= "landing" then cineSetMode("landing") end
		updateDescentVisuals(altitude, canopySpeed)
		updateDescentFX(altitude, canopySpeed, groundY, true, openBlend, px, pz)
		if altitude <= CONFIG.LAND_ALT then break end
	end
	hud.boost.Visible = false
	boosting = false
	if boostEndConn then boostEndConn:Disconnect() end
	activeBoostConn = nil

	------------------------------------------------------------------
	-- الطور ٤: الهبوط (غبار/صدمة + استعادة الكاميرا والتحكّم)
	------------------------------------------------------------------
	local landY = groundYAt(px, pz, y + 50, descentExclude)
	rootPart.CFrame = CFrame.new(px, landY + 3, pz)
	playSound3D(rootPart, CONFIG.SND_LAND, 0.8, false)

	-- موجة غبار
	local dustPart = mk("Part", {
		Name = "Dust", Size = Vector3.new(1, 1, 1), Transparency = 1, Anchored = true,
		CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false,
		CFrame = CFrame.new(px, landY + 1, pz), Parent = Workspace,
	}) :: Part
	local dustAtt = mk("Attachment", { Parent = dustPart }) :: Attachment
	local dust = mk("ParticleEmitter", {
		Texture = "rbxassetid://243660364", Rate = 0, Lifetime = NumberRange.new(0.6, 1.1),
		Speed = NumberRange.new(14, 22), SpreadAngle = Vector2.new(80, 80),
		Color = ColorSequence.new(Color3.fromRGB(225, 215, 195)),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 4), NumberSequenceKeypoint.new(1, 14) }),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 1) }),
		Parent = dustAtt,
	}) :: ParticleEmitter
	dust:Emit(40)

	-- حلقة صدمة تتمدّد
	local ring = mk("Part", {
		Name = "ImpactRing", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.4, 4, 4),
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false,
		Material = Enum.Material.Neon, Color = GOLD, Transparency = 0.2,
		CFrame = CFrame.new(px, landY + 0.4, pz) * CFrame.Angles(0, 0, math.rad(90)),
		Parent = Workspace,
	}) :: Part
	TweenService:Create(ring, TweenInfo.new(0.7, Enum.EasingStyle.Quad), {
		Size = Vector3.new(0.4, 46, 46), Transparency = 1,
	}):Play()

	-- إخفاء المظلّة + علامة الهبوط
	if canopy then
		for _, d in ipairs(canopy:GetDescendants()) do
			if d:IsA("BasePart") then TweenService:Create(d, TweenInfo.new(0.5), { Transparency = 1 }):Play() end
		end
		task.delay(0.6, function() if canopy then canopy:Destroy() end end)
	end
	task.delay(0.6, function()
		if ring then ring:Destroy() end
		if dustPart then dustPart:Destroy() end
		if a0 then a0:Destroy() end
		if a1 then a1:Destroy() end
		if trail then trail:Destroy() end
	end)

	-- منح شارة «أول هبوط»
	pcall(function()
		local remotes = ReplicatedStorage:FindFirstChild("SpawnCinematicRemotes")
		local landed = remotes and remotes:FindFirstChild("Landed")
		if landed and landed:IsA("RemoteEvent") then landed:FireServer() end
	end)

	-- استعادة الكاميرا والتحكّم + قيم الحركة (لا نعتمد على شاشة التحميل)
	if inputConn then inputConn:Disconnect() end
	activeInputConn = nil
	rootPart.Anchored = false
	restoreMovement(humanoid)
	humanoid.AutoRotate = true
	pcall(function() humanoid:SetStateEnabled(Enum.HumanoidStateType.Dead, true) end)
	cineStop(cam)
	cam.CameraType = Enum.CameraType.Custom
	cam.CameraSubject = humanoid
	setControls(true)
	clearCinematicTransient()

	-- تلاشي الـHUD ثم إزالته
	hud.banner.Text = "وصلت! 🌟"
	task.delay(1.2, function()
		for _, d in ipairs(hud.gui:GetDescendants()) do
			if d:IsA("TextLabel") then TweenService:Create(d, TweenInfo.new(0.5), { TextTransparency = 1 }):Play()
			elseif d:IsA("Frame") and d.Name ~= "Root" then TweenService:Create(d, TweenInfo.new(0.5), { BackgroundTransparency = 1 }):Play() end
		end
		task.delay(0.6, function() if hud.gui then hud.gui:Destroy() end end)
	end)
end

----------------------------------------------------------------------
-- تنظيف العناصر المرئية بالاسم (يُستدعى عند الخطأ حتى لا تبقى أزرار HUD
-- أو طائرة/علامات معلّقة تعترض النقر). آمن لو لم يُنشأ أيٌّ منها بعد.
----------------------------------------------------------------------
local function cleanupArtifacts()
	clearCinematicTransient()
	pcall(function()
		local pg = LocalPlayer:FindFirstChild("PlayerGui")
		local gui = pg and pg:FindFirstChild("RoyalSpawnHUD")
		if gui then gui:Destroy() end
	end)
	for _, name in ipairs({ "RoyalPlane", "RoyalCanopy", "RoyalSpawnShadow", "ImpactRing", "Dust", "SpawnFlightClouds" }) do
		local inst = Workspace:FindFirstChild(name)
		if inst then inst:Destroy() end
	end
	local char = LocalPlayer.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if hrp then
		for _, name in ipairs({ "TrailTop", "TrailBot" }) do
			local att = hrp:FindFirstChild(name)
			if att then att:Destroy() end
		end
		for _, d in ipairs(hrp:GetChildren()) do
			if d:IsA("Trail") then d:Destroy() end
		end
	end
end

----------------------------------------------------------------------
-- التشغيل: مرّة واحدة عند الدخول (إشارة من شاشة التحميل)
----------------------------------------------------------------------
local function trigger()
	if started then return end
	started = true
	-- إشارة لشاشة التحميل أن المشهد سيطر فعلاً (تُلغي شبكة أمان استعادة التحكّم)
	LocalPlayer:SetAttribute("RoyalSpawnActive", true)
	local ok, err = pcall(run)
	if not ok then
		warn("[SpawnCinematic] خطأ في التسلسل: " .. tostring(err))
		-- استعادة آمنة حتى لا يعلق اللاعب (تشمل دوران الشخصية وحالة الموت والكاميرا)
		if activeInputConn then activeInputConn:Disconnect(); activeInputConn = nil end
		if activeBoostConn then activeBoostConn:Disconnect(); activeBoostConn = nil end
		setControls(true)
		clearCinematicTransient()
		local cam = Workspace.CurrentCamera
		cineStop(cam)
		if cam then cam.CameraType = Enum.CameraType.Custom end
		local char = LocalPlayer.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp and hrp:IsA("BasePart") then hrp.Anchored = false end
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then
			hum.AutoRotate = true
			restoreMovement(hum :: Humanoid)
			pcall(function() hum:SetStateEnabled(Enum.HumanoidStateType.Dead, true) end)
			if cam then cam.CameraSubject = hum end
		end
		-- إزالة أي عناصر مرئية معلّقة (HUD/طائرة/علامات/أثر) حتى لا تعترض اللعب
		cleanupArtifacts()
	end
end

if LocalPlayer:GetAttribute("RoyalSpawnStart") then
	trigger()
else
	LocalPlayer:GetAttributeChangedSignal("RoyalSpawnStart"):Connect(function()
		if LocalPlayer:GetAttribute("RoyalSpawnStart") then trigger() end
	end)
end
