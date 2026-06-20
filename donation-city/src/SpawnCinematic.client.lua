--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  SPAWN CINEMATIC (Client)                                              ║
	║  المكان: StarterPlayer ▸ StarterPlayerScripts   ·   النوع: LocalScript ║
	║                                                                        ║
	║  الريسبون الملكي على طريقة ببجي — مشهد فردي لكل لاعب، جوال-أولاً:        ║
	║    ١) وضع المشاهدة داخل «طائرة شهد للنزول الملكي» (إضاءة LED احترافية،   ║
	║       لقطة بانورامية على المدينة، عدّاد ٣-٢-١، زر Skip كبير).            ║
	║    ٢) القفز → سقوط حرّ + HUD (ارتفاع/سرعة) + أثر ملوّن + دائرة هبوط تكبر. ║
	║    ٣) فتح المظلّة بحرف E أو زر لمس كبير → نزول مستقيم سلس + تمايل.        ║
	║    ٤) هبوط ثابت على منصّة حدود الماب → غبار/صدمة + استعادة الكاميرا.      ║
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
local TweenService      = game:GetService("TweenService")
local Workspace         = game:GetService("Workspace")

local LocalPlayer = Players.LocalPlayer

----------------------------------------------------------------------
-- الإعدادات (سهلة التعديل)
----------------------------------------------------------------------
local CONFIG = {
	-- جغرافيا المشهد
	LANDING_XZ      = Vector2.new(150, -150), -- منصّة الهبوط على حدود الماب (مطابقة للسيرفر)
	ALTITUDE        = 720,                    -- ارتفاع الطائرة عند الإقلاع
	FLIGHT_DIST     = 460,                    -- طول مسار الطائرة فوق المدينة قبل القفز
	PLANE_LENGTH    = 120,                    -- طول جسم الطائرة بعد التحجيم

	-- التوقيت
	SPECTATOR_TIME  = 9.0,                    -- مدّة المشاهدة قبل القفز التلقائي
	COUNTDOWN_FROM  = 3,                      -- عدّاد ٣-٢-١

	-- فيزياء السقوط
	FREEFALL_MIN    = 70,                     -- سرعة بداية السقوط الحر
	FREEFALL_MAX    = 165,                    -- أقصى سرعة سقوط حر
	FREEFALL_ACC    = 90,                     -- تسارع السقوط
	AUTO_DEPLOY_ALT = 230,                    -- فتح المظلّة تلقائياً عند هذا الارتفاع (أمان)
	CANOPY_SPEED    = 26,                     -- سرعة النزول تحت المظلّة
	LAND_ALT        = 5.5,                    -- ارتفاع لحظة الهبوط فوق المنصّة

	-- أضواء/ألوان
	SWAP_NAV_COLORS = false,                  -- اقلبها لو الأحمر/الأخضر بالعكس على الأجنحة
	FORWARD_SIGN    = 1,                       -- اقلبها (-1) لو الطائرة تطير بمؤخّرتها

	-- معرّفات أصوات (٠ = معطّل بهدوء؛ تُعبّأ لاحقاً من حساب المالك)
	SND_ENGINE      = 0,
	SND_JUMP        = 0,
	SND_CHUTE       = 0,
	SND_LAND        = 0,
}

local GOLD  = Color3.fromRGB(214, 175, 92)
local NAVY  = Color3.fromRGB(28, 42, 78)
local WHITE = Color3.fromRGB(245, 245, 250)
local WARM  = Color3.fromRGB(255, 226, 168)

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

-- ارتفاع سطح الأرض/المنصّة عند نقطة الهبوط (Raycast لأسفل)
local function padTopY(char: Model?): number
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	local exclude = {}
	if char then exclude[#exclude + 1] = char end
	params.FilterDescendantsInstances = exclude
	local origin = Vector3.new(CONFIG.LANDING_XZ.X, 400, CONFIG.LANDING_XZ.Y)
	local result = Workspace:Raycast(origin, Vector3.new(0, -800, 0), params)
	if result then return result.Position.Y end
	return 1
end

----------------------------------------------------------------------
-- بناء الطائرة الملكية (جسم Mesh مرفوع + إكسسوارات ذهبية + إضاءة LED)
----------------------------------------------------------------------
-- يرتّب محاور الجسم: الأكبر = طول (أمام)، الأصغر = ارتفاع، الأوسط = عرض.
local function axisOrder(size: Vector3): (string, string, string)
	-- ترتيب ثابت: الأكبر أولاً، ومع تساوي الأبعاد نرجّح بأولوية محور ثابتة
	-- (X ثم Z ثم Y) حتى لا يطلع الترتيب عشوائياً ويميل الجسم خطأً.
	local prio = { X = 3, Z = 2, Y = 1 }
	local arr = { { "X", size.X }, { "Y", size.Y }, { "Z", size.Z } }
	table.sort(arr, function(a, b)
		if a[2] ~= b[2] then return a[2] > b[2] end
		return prio[a[1]] > prio[b[1]]
	end)
	return arr[1][1], arr[3][1], arr[2][1] -- forward(max), up(min), lateral(mid)
end

-- يبني CFrame يوجّه أطول محور للجسم نحو travelDir وأقصر محور للأعلى.
local function orientCFrame(pos: Vector3, travelDir: Vector3, size: Vector3): (CFrame, Vector3, Vector3, Vector3)
	local fAxis, uAxis, lAxis = axisOrder(size)
	local up = Vector3.new(0, 1, 0)
	local fwd = travelDir.Unit * CONFIG.FORWARD_SIGN
	local lat = fwd:Cross(up).Unit
	local dir: { [string]: Vector3 } = {}
	dir[fAxis] = fwd; dir[uAxis] = up; dir[lAxis] = lat
	local cf = CFrame.fromMatrix(pos, dir.X, dir.Y, dir.Z)
	if dir.X:Cross(dir.Y):Dot(dir.Z) < 0 then
		dir[lAxis] = -lat
		cf = CFrame.fromMatrix(pos, dir.X, dir.Y, dir.Z)
	end
	return cf, fwd, up, dir[lAxis]
end

local function getBodyTemplate(): (Instance, Vector3)
	local tmpl = ReplicatedStorage:FindFirstChild("RoyalPlaneMesh")
	if tmpl and tmpl:IsA("MeshPart") then
		return tmpl:Clone(), tmpl.Size
	end
	-- طائرة احتياطية بالقطع لو تعذّر تحميل الـMesh من السيرفر
	local fb = mk("Part", {
		Name = "RoyalPlaneMesh", Shape = Enum.PartType.Block,
		Size = Vector3.new(44, 10, 14), Material = Enum.Material.SmoothPlastic,
		Color = WHITE, Anchored = true, CanCollide = false, CastShadow = false,
	})
	return fb, fb.Size
end

local function buildPlane(startPos: Vector3, travelDir: Vector3)
	local body, rawSize = getBodyTemplate()
	local bodyPart = body :: BasePart
	local scale = CONFIG.PLANE_LENGTH / math.max(rawSize.X, rawSize.Y, rawSize.Z)
	bodyPart.Size = rawSize * scale
	bodyPart.Anchored = true; bodyPart.CanCollide = false
	bodyPart.CanQuery = false; bodyPart.CanTouch = false; bodyPart.CastShadow = false
	bodyPart.Color = WHITE; bodyPart.Material = Enum.Material.SmoothPlastic

	local cf, fwd, up, lat = orientCFrame(startPos, travelDir, bodyPart.Size)
	bodyPart.CFrame = cf
	local s = bodyPart.Size
	local hf = math.max(s.X, s.Y, s.Z) / 2          -- نصف الطول
	local hu = math.min(s.X, s.Y, s.Z) / 2          -- نصف الارتفاع
	local hl = (s.X + s.Y + s.Z - 2 * hf - 2 * hu) / 2 -- نصف العرض

	local model = mk("Model", { Name = "RoyalPlane" })
	bodyPart.Parent = model
	model.PrimaryPart = bodyPart
	local P = startPos

	-- نقطة عالم نسبية للجسم
	local function at(f, l, u)
		return P + fwd * (hf * f) + lat * (hl * l) + up * (hu * u)
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
		local strip = neonBulb("CheatLine", Vector3.new(hf * 1.5, hu * 0.10, 0.2), GOLD, model)
		strip.Material = Enum.Material.Neon
		strip.CFrame = CFrame.fromMatrix(at(0, side * 1.0, 0.15), fwd, up, lat * side)
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
			AlwaysOnTop = false,
		}) :: SurfaceGui
		mk("TextLabel", {
			Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1,
			Text = "طائرة شهد للنزول الملكي", Font = Enum.Font.GothamBlack,
			TextScaled = true, TextColor3 = GOLD, TextStrokeColor3 = NAVY,
			TextStrokeTransparency = 0.2, Parent = sg,
		})
	end

	------------------------------------------------------------------
	-- نوافذ المقصورة (وهج دافئ ثابت)
	------------------------------------------------------------------
	for _, side in ipairs({ -1, 1 }) do
		local win = neonBulb("CabinWindows", Vector3.new(hf * 0.95, hu * 0.16, 0.18), WARM, model)
		win.CFrame = CFrame.fromMatrix(at(0.05, side * 1.0, 0.45), fwd, up, lat * side)
		local pl = mk("PointLight", { Color = WARM, Brightness = 1.4, Range = 16, Parent = win }) :: PointLight
		pl.Shadows = false
	end

	------------------------------------------------------------------
	-- نظام إضاءة LED احترافي
	------------------------------------------------------------------
	local navColorL = if CONFIG.SWAP_NAV_COLORS then Color3.fromRGB(60, 255, 90) else Color3.fromRGB(255, 50, 50)
	local navColorR = if CONFIG.SWAP_NAV_COLORS then Color3.fromRGB(255, 50, 50) else Color3.fromRGB(60, 255, 90)

	-- أضواء ملاحة جناحية (أحمر يسار / أخضر يمين)
	local navL = neonBulb("NavPort", Vector3.new(1.1, 1.1, 1.1), navColorL, model)
	navL.Shape = Enum.PartType.Ball
	navL.CFrame = CFrame.new(at(-0.05, -1.0, 0.05))
	local navLLight = mk("PointLight", { Color = navColorL, Brightness = 4, Range = 26, Parent = navL }) :: PointLight

	local navR = neonBulb("NavStarboard", Vector3.new(1.1, 1.1, 1.1), navColorR, model)
	navR.Shape = Enum.PartType.Ball
	navR.CFrame = CFrame.new(at(-0.05, 1.0, 0.05))
	local navRLight = mk("PointLight", { Color = navColorR, Brightness = 4, Range = 26, Parent = navR }) :: PointLight

	-- منارة الذيل البيضاء (نبض)
	local beacon = neonBulb("TailBeacon", Vector3.new(1.0, 1.0, 1.0), WHITE, model)
	beacon.Shape = Enum.PartType.Ball
	beacon.CFrame = CFrame.new(at(-0.95, 0, 0.85))
	local beaconLight = mk("PointLight", { Color = WHITE, Brightness = 5, Range = 30, Parent = beacon }) :: PointLight

	-- سترّوب أحمر تحت البطن (ومضتان سريعتان متكررتان)
	local strobe = neonBulb("BellyStrobe", Vector3.new(1.4, 0.5, 1.4), Color3.fromRGB(255, 40, 40), model)
	strobe.Shape = Enum.PartType.Ball
	strobe.CFrame = CFrame.new(at(0, 0, -1.0))
	local strobeLight = mk("PointLight", { Color = Color3.fromRGB(255, 40, 40), Brightness = 6, Range = 34, Parent = strobe }) :: PointLight

	-- أضواء هبوط بيضاء بالأنف (ثابتة)
	local landBulb = neonBulb("LandingLight", Vector3.new(1.6, 0.6, 0.6), WHITE, model)
	landBulb.CFrame = CFrame.new(at(0.88, 0, -0.25))
	local landLight = mk("PointLight", { Color = WHITE, Brightness = 4, Range = 40, Parent = landBulb }) :: PointLight
	landLight.Shadows = false

	-- توهّج بطني ذهبي ناعم (ثابت)
	local underBulb = neonBulb("Underglow", Vector3.new(hf * 1.1, 0.25, hl * 1.0), GOLD, model)
	underBulb.Transparency = 0.25
	underBulb.CFrame = CFrame.new(at(0, 0, -0.95))
	mk("PointLight", { Color = GOLD, Brightness = 1.2, Range = 22, Parent = underBulb, Shadows = false })

	-- باب القفز (فتحة داكنة على جانب الجسم)
	local door = neonBulb("JumpDoor", Vector3.new(hf * 0.22, hu * 0.55, 0.1), Color3.fromRGB(20, 22, 30), model)
	door.Material = Enum.Material.SmoothPlastic
	door.CFrame = CFrame.fromMatrix(at(-0.1, -1.02, 0.0), fwd, up, -lat)

	local rotOnly = orientCFrame(Vector3.new(0, 0, 0), travelDir, bodyPart.Size)

	return {
		model = model, body = bodyPart,
		fwd = fwd, up = up, lat = lat, rot = rotOnly,
		half = { f = hf, u = hu, l = hl },
		nav = { { navL, navLLight }, { navR, navRLight } },
		beacon = { beacon, beaconLight },
		strobe = { strobe, strobeLight },
	}
end

-- تحريك إضاءة LED (وميض ملاحة، نبض منارة، ومضة سترّوب مزدوجة)
local function stepLEDs(plane, t: number)
	-- وميض ملاحة ناعم
	local navOn = (t % 1.5) > 0.18
	for _, pair in ipairs(plane.nav) do
		local light = pair[2] :: PointLight
		light.Brightness = navOn and 4 or 0.4
		;(pair[1] :: BasePart).Transparency = navOn and 0 or 0.55
	end
	-- نبض منارة الذيل
	local pulse = 0.5 + 0.5 * math.sin(t * 6)
	;(plane.beacon[2] :: PointLight).Brightness = 1.5 + pulse * 5
	;(plane.beacon[1] :: BasePart).Transparency = 0.15 + (1 - pulse) * 0.5
	-- سترّوب: ومضتان سريعتان كل ١.٢ث
	local ph = t % 1.2
	local flash = (ph < 0.06) or (ph >= 0.16 and ph < 0.22)
	;(plane.strobe[2] :: PointLight).Brightness = flash and 8 or 0
	;(plane.strobe[1] :: BasePart).Transparency = flash and 0 or 0.7
end

----------------------------------------------------------------------
-- المظلّة (قبّة + حبال + harness) تتبع اللاعب مع تمايل
----------------------------------------------------------------------
local function buildCanopy(): (Model, BasePart)
	local model = mk("Model", { Name = "RoyalCanopy" })
	local anchor = mk("Part", {
		Name = "Anchor", Size = Vector3.new(0.5, 0.5, 0.5), Transparency = 1,
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
		CastShadow = false, Parent = model,
	}) :: Part
	model.PrimaryPart = anchor

	local R = 16
	local dome = mk("Part", {
		Name = "Dome", Shape = Enum.PartType.Ball, Size = Vector3.new(R * 2, R, R * 2),
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
		CastShadow = false, Material = Enum.Material.SmoothPlastic, Color = WHITE,
		CFrame = anchor.CFrame * CFrame.new(0, 16, 0), Parent = model,
	}) :: Part
	-- قطاعات ذهبية على القبّة
	for i = 0, 5 do
		local a = math.rad(i * 60)
		local strip = neonBulb("Panel", Vector3.new(0.4, 0.6, R * 1.9), GOLD, model)
		strip.CFrame = dome.CFrame * CFrame.Angles(0, a, 0) * CFrame.new(R * 0.5, 0, 0)
	end
	-- حبال التعليق
	for i = 0, 5 do
		local a = math.rad(i * 60)
		local rim = dome.CFrame * CFrame.Angles(0, a, 0) * CFrame.new(R * 0.95, -R * 0.35, 0)
		local line = mk("Part", {
			Name = "Line", Size = Vector3.new(0.12, 0.12, 1), Anchored = true,
			CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false,
			Material = Enum.Material.SmoothPlastic, Color = Color3.fromRGB(40, 40, 46),
			Parent = model,
		}) :: Part
		local target = anchor.CFrame * CFrame.new(0, 2, 0)
		line.CFrame = CFrame.lookAt(rim.Position, target.Position) * CFrame.new(0, 0, -(rim.Position - target.Position).Magnitude / 2)
		line.Size = Vector3.new(0.12, 0.12, (rim.Position - target.Position).Magnitude)
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
		Text = "وضع المشاهدة ✈️", Font = Enum.Font.GothamBlack, TextScaled = true,
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

	-- زر Skip كبير (أسفل الوسط)
	local skipBtn = mk("TextButton", {
		Name = "Skip", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.93),
		Size = UDim2.fromOffset(260, 84), BackgroundColor3 = Color3.fromRGB(214, 175, 92),
		Text = "تخطّي ⏭", Font = Enum.Font.GothamBlack, TextScaled = true,
		TextColor3 = Color3.fromRGB(20, 22, 34), AutoButtonColor = true, Visible = false,
		Parent = root,
	}) :: TextButton
	mk("UICorner", { CornerRadius = UDim.new(0, 18), Parent = skipBtn })
	mk("UIStroke", { Color = WHITE, Thickness = 2, Transparency = 0.4, Parent = skipBtn })

	-- زر فتح المظلّة كبير (أسفل الوسط) + تلميح E للكمبيوتر
	local chuteBtn = mk("TextButton", {
		Name = "Chute", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.93),
		Size = UDim2.fromOffset(300, 96), BackgroundColor3 = Color3.fromRGB(60, 170, 240),
		Text = "افتح المظلّة 🪂", Font = Enum.Font.GothamBlack, TextScaled = true,
		TextColor3 = WHITE, AutoButtonColor = true, Visible = false, Parent = root,
	}) :: TextButton
	mk("UICorner", { CornerRadius = UDim.new(0, 20), Parent = chuteBtn })
	mk("UIStroke", { Color = WHITE, Thickness = 2, Transparency = 0.3, Parent = chuteBtn })

	local eHint = mk("TextLabel", {
		Name = "EHint", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.81),
		Size = UDim2.fromOffset(280, 40), BackgroundTransparency = 1,
		Text = "اضغط E لفتح المظلّة", Font = Enum.Font.GothamBold, TextScaled = true,
		TextColor3 = WARM, Visible = false, Parent = root,
	}) :: TextLabel

	return {
		gui = gui, banner = banner, countdown = countdown, stats = stats,
		alt = altLabel, spd = spdLabel, skip = skipBtn, chute = chuteBtn, eHint = eHint,
	}
end

----------------------------------------------------------------------
-- التسلسل الكامل للريسبون
----------------------------------------------------------------------
local started = false

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

	-- نقاط المسار
	local groundY = padTopY(char)
	local landXZ = CONFIG.LANDING_XZ
	local jumpPoint = Vector3.new(landXZ.X, CONFIG.ALTITUDE, landXZ.Y)
	local cityDir = (Vector3.new(landXZ.X, 0, landXZ.Y) - Vector3.new(0, 0, 0))
	local travelDir = cityDir.Magnitude > 0.1 and cityDir.Unit or Vector3.new(0, 0, -1)
	local startPos = jumpPoint - travelDir * CONFIG.FLIGHT_DIST
	local fallDir = Vector3.new(travelDir.X, 0, travelDir.Z).Unit

	-- إعداد: تعطيل التحكّم + تثبيت الشخصية + كاميرا سينمائية
	setControls(false)
	humanoid.AutoRotate = false
	rootPart.Anchored = true
	pcall(function() humanoid:SetStateEnabled(Enum.HumanoidStateType.Dead, false) end)
	cam.CameraType = Enum.CameraType.Scriptable

	local hud = buildHUD()

	-- بناء الطائرة + إضاءة LED + هدير المحرّك
	local plane = buildPlane(startPos, travelDir)
	plane.model.Parent = Workspace
	local engineSnd = playSound3D(plane.body, CONFIG.SND_ENGINE, 0.6, true)

	local skipped = false
	local deployed = false
	hud.skip.Visible = true
	hud.skip.Activated:Connect(function() skipped = true end)

	------------------------------------------------------------------
	-- الطور ١: المشاهدة (طيران بانورامي + عدّاد + Skip)
	------------------------------------------------------------------
	local t0 = os.clock()
	local camAngle = 0
	local lastCount = -1
	while true do
		local dt = RunService.Heartbeat:Wait()
		local elapsed = os.clock() - t0
		local prog = math.clamp(elapsed / CONFIG.SPECTATOR_TIME, 0, 1)

		-- حركة الطائرة على المسار
		local planePos = startPos:Lerp(jumpPoint, prog)
		plane.model:PivotTo(plane.rot + planePos)
		stepLEDs(plane, os.clock())

		-- اللاعب عند باب القفز
		rootPart.CFrame = CFrame.lookAt(
			planePos + plane.lat * (-plane.half.l * 1.05) + plane.up * (-plane.half.u * 0.2),
			planePos + plane.lat * (-plane.half.l * 2)
		)

		-- كاميرا بانورامية تدور حول الطائرة وتُظهر المدينة
		camAngle += dt * 0.35
		local radius = 150
		local camPos = planePos + Vector3.new(math.sin(camAngle) * radius, 55, math.cos(camAngle) * radius)
		local target = CFrame.lookAt(camPos, planePos)
		cam.CFrame = cam.CFrame:Lerp(target, 0.12)

		-- عدّاد ٣-٢-١ في آخر ثوانٍ
		local remain = CONFIG.SPECTATOR_TIME - elapsed
		if remain <= CONFIG.COUNTDOWN_FROM then
			local n = math.ceil(remain)
			hud.countdown.Visible = true
			if n ~= lastCount and n > 0 then
				lastCount = n
				hud.countdown.Text = tostring(n)
				hud.countdown.TextSize = 0
				hud.countdown.TextScaled = true
				local pop = mk("UIScale", { Scale = 1.6, Parent = hud.countdown }) :: UIScale
				TweenService:Create(pop, TweenInfo.new(0.5, Enum.EasingStyle.Quad), { Scale = 1 }):Play()
				task.delay(0.55, function() pop:Destroy() end)
			end
		end

		if skipped or prog >= 1 then break end
	end

	------------------------------------------------------------------
	-- الطور ٢: القفز + السقوط الحر
	------------------------------------------------------------------
	hud.skip.Visible = false
	hud.countdown.Visible = false
	hud.banner.Text = "سقوط حرّ 🪂"
	hud.stats.Visible = true
	hud.chute.Visible = true
	if not UserInputService.TouchEnabled then hud.eHint.Visible = true end
	playSound3D(rootPart, CONFIG.SND_JUMP, 0.7, false)

	-- الطائرة تكمل طيرانها وتختفي
	task.spawn(function()
		local flyT = os.clock()
		while plane.model.Parent and os.clock() - flyT < 3 do
			local dt = RunService.Heartbeat:Wait()
			plane.model:PivotTo(plane.model:GetPivot() + travelDir * (90 * dt))
			stepLEDs(plane, os.clock())
		end
		if engineSnd then engineSnd:Stop() end
		if plane.model then plane.model:Destroy() end
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

	-- دائرة هبوط متوهّجة تكبر على المنصّة
	local marker = mk("Part", {
		Name = "LandMarker", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.4, 6, 6),
		Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false,
		CastShadow = false, Material = Enum.Material.Neon, Color = Color3.fromRGB(120, 230, 170),
		Transparency = 0.35, CFrame = CFrame.new(landXZ.X, groundY + 0.4, landXZ.Y) * CFrame.Angles(0, 0, math.rad(90)),
		Parent = Workspace,
	}) :: Part
	local beam = mk("Part", {
		Name = "LandBeam", Size = Vector3.new(10, 600, 10), Anchored = true, CanCollide = false,
		CanQuery = false, CanTouch = false, CastShadow = false, Material = Enum.Material.Neon,
		Color = Color3.fromRGB(120, 230, 170), Transparency = 0.9,
		CFrame = CFrame.new(landXZ.X, groundY + 300, landXZ.Y), Parent = Workspace,
	}) :: Part

	-- E / زر اللمس لفتح المظلّة
	hud.chute.Activated:Connect(function() deployed = true end)
	local inputConn = UserInputService.InputBegan:Connect(function(input, gpe)
		if gpe then return end
		if input.KeyCode == Enum.KeyCode.E then deployed = true end
	end)

	local function updateDescentVisuals(altitude, speed)
		hud.alt.Text = string.format("الارتفاع: %d م", math.max(0, math.floor(altitude)))
		hud.spd.Text = string.format("السرعة: %d", math.floor(speed * 3.6))
		local total = CONFIG.ALTITUDE - groundY
		local grow = 1 - math.clamp(altitude / total, 0, 1)
		local d = 6 + grow * 34
		marker.Size = Vector3.new(0.4, d, d)
		marker.Transparency = 0.5 - grow * 0.3
	end

	local vSpeed = CONFIG.FREEFALL_MIN
	local y = CONFIG.ALTITUDE
	while true do
		local dt = RunService.Heartbeat:Wait()
		vSpeed = math.min(CONFIG.FREEFALL_MAX, vSpeed + CONFIG.FREEFALL_ACC * dt)
		y -= vSpeed * dt
		local altitude = y - groundY
		rootPart.CFrame = CFrame.lookAt(Vector3.new(landXZ.X, y, landXZ.Y), Vector3.new(landXZ.X, y, landXZ.Y) + fallDir)
			* CFrame.Angles(math.rad(-72), 0, 0)
		local camPos = Vector3.new(landXZ.X, y + 14, landXZ.Y) - fallDir * 24
		cam.CFrame = cam.CFrame:Lerp(CFrame.lookAt(camPos, Vector3.new(landXZ.X, y - 26, landXZ.Y)), 0.18)
		updateDescentVisuals(altitude, vSpeed)
		if deployed or altitude <= CONFIG.AUTO_DEPLOY_ALT or altitude <= CONFIG.LAND_ALT then break end
	end

	------------------------------------------------------------------
	-- الطور ٣: فتح المظلّة + نزول مستقيم سلس مع تمايل
	------------------------------------------------------------------
	deployed = true
	hud.chute.Visible = false
	hud.eHint.Visible = false
	hud.banner.Text = "النزول بالمظلّة 🪂"
	if trail then trail.Enabled = false end
	playSound3D(rootPart, CONFIG.SND_CHUTE, 0.7, false)

	local canopy, canopyAnchor = buildCanopy()
	canopy.Parent = Workspace
	canopy:ScaleTo(0.2)
	TweenService:Create(canopyAnchor, TweenInfo.new(0.45, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {}):Play()
	task.spawn(function()
		for i = 1, 10 do canopy:ScaleTo(0.2 + 0.08 * i); task.wait(0.02) end
	end)

	while (y - groundY) > CONFIG.LAND_ALT do
		local dt = RunService.Heartbeat:Wait()
		y -= CONFIG.CANOPY_SPEED * dt
		local altitude = y - groundY
		local tt = os.clock()
		local swayYaw = math.sin(tt * 1.1) * 0.12
		local swayRoll = math.sin(tt * 0.9) * 0.10
		local base = CFrame.lookAt(Vector3.new(landXZ.X, y, landXZ.Y), Vector3.new(landXZ.X, y, landXZ.Y) + fallDir)
		rootPart.CFrame = base * CFrame.Angles(math.rad(-8), swayYaw, swayRoll)
		canopy:PivotTo(CFrame.new(rootPart.Position) * CFrame.Angles(0, swayYaw, swayRoll * 1.6))
		local camPos = Vector3.new(landXZ.X, y + 9, landXZ.Y) - fallDir * 30
		cam.CFrame = cam.CFrame:Lerp(CFrame.lookAt(camPos, Vector3.new(landXZ.X, y + 6, landXZ.Y)), 0.16)
		updateDescentVisuals(altitude, CONFIG.CANOPY_SPEED)
	end

	------------------------------------------------------------------
	-- الطور ٤: الهبوط (غبار/صدمة + استعادة الكاميرا والتحكّم)
	------------------------------------------------------------------
	rootPart.CFrame = CFrame.new(landXZ.X, groundY + 3, landXZ.Y)
	playSound3D(rootPart, CONFIG.SND_LAND, 0.8, false)

	-- موجة غبار
	local dustPart = mk("Part", {
		Name = "Dust", Size = Vector3.new(1, 1, 1), Transparency = 1, Anchored = true,
		CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false,
		CFrame = CFrame.new(landXZ.X, groundY + 1, landXZ.Y), Parent = Workspace,
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
		CFrame = CFrame.new(landXZ.X, groundY + 0.4, landXZ.Y) * CFrame.Angles(0, 0, math.rad(90)),
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
	TweenService:Create(marker, TweenInfo.new(0.5), { Transparency = 1 }):Play()
	TweenService:Create(beam, TweenInfo.new(0.5), { Transparency = 1 }):Play()
	task.delay(0.6, function()
		if marker then marker:Destroy() end
		if beam then beam:Destroy() end
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

	-- استعادة الكاميرا والتحكّم
	if inputConn then inputConn:Disconnect() end
	rootPart.Anchored = false
	humanoid.AutoRotate = true
	pcall(function() humanoid:SetStateEnabled(Enum.HumanoidStateType.Dead, true) end)
	cam.CameraType = Enum.CameraType.Custom
	cam.CameraSubject = humanoid
	setControls(true)

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
-- التشغيل: مرّة واحدة عند الدخول (إشارة من شاشة التحميل)
----------------------------------------------------------------------
local function trigger()
	if started then return end
	started = true
	local ok, err = pcall(run)
	if not ok then
		warn("[SpawnCinematic] خطأ في التسلسل: " .. tostring(err))
		-- استعادة آمنة حتى لا يعلق اللاعب (تشمل دوران الشخصية وحالة الموت والكاميرا)
		setControls(true)
		local cam = Workspace.CurrentCamera
		if cam then cam.CameraType = Enum.CameraType.Custom end
		local char = LocalPlayer.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp and hrp:IsA("BasePart") then hrp.Anchored = false end
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then
			hum.AutoRotate = true
			pcall(function() hum:SetStateEnabled(Enum.HumanoidStateType.Dead, true) end)
			if cam then cam.CameraSubject = hum end
		end
	end
end

if LocalPlayer:GetAttribute("RoyalSpawnStart") then
	trigger()
else
	LocalPlayer:GetAttributeChangedSignal("RoyalSpawnStart"):Connect(function()
		if LocalPlayer:GetAttribute("RoyalSpawnStart") then trigger() end
	end)
end
