--[[ ════════════════════════════════════════════════════════════════════════
     GUARD SYSTEM (Server)
     حرّاس القصر الجمهوري — شخصيات مُهيكلة (R6) بزيّ الحرس الملكي.

     • تُبنى عبر HumanoidDescription فتأخذ رِيﭺ R6 كامل + سكربت Animate قياسي
       (مشي/وقوف بأنميشن طبيعي) — لأن موديل المتجر الأصلي كان «تمثالاً» ثابتاً
       بلا مفاصل أطراف، فأعدنا تهيئته كشخصية حقيقية تمشي.
     • نفس الزيّ بالضبط: تونيك أحمر (Shirt) + بنطلون أسود (Pants) + الوجه،
       وقبّعة الفرو (GuardCap) ملحومة على الرأس (مخزّنة بإحداثيات نسبية للرأس).
     • حارسان يحرسان المدخل بانتباه (HRP مثبّت، الأطراف تتحرّك بالأنميشن)،
       وحارسان يرحّبون ويرافقون الزوّار (قائد يقودك للبهو + تابع يمشي خلفك)
       عبر PathfindingService، ويرجعون لأماكنهم عند خروجك.
     • ترحيب سلس: التفاتة بـTweenService + فقاعة كلام تظهر/تتلاشى بنعومة،
       جُمل متنوّعة وتهدئة زمنية لتفادي التكرار المزعج.
   ════════════════════════════════════════════════════════════════════════ ]]

local Players            = game:GetService("Players")
local TweenService       = game:GetService("TweenService")
local PathfindingService = game:GetService("PathfindingService")
local Workspace          = game:GetService("Workspace")

-- ── زيّ الحرس (من الموديل المفحوص 6875688893 — نظيف) ───────────────────────
local SHIRT_ID = 1588379400
local PANTS_ID = 1588492725

-- ── إحداثيات (تطابق غرف PalaceSystem: المدخل عند x=96 يواجه الغرب −X) ──────
local FLOOR_Y = 0.6
local R6_HIP  = 3.0                       -- ارتفاع مركز HumanoidRootPart فوق الأرضية لـR6
local function ground(x, z)
	return Vector3.new(x, FLOOR_Y + R6_HIP, z)
end

local WEST = Vector3.new(-1, 0, 0)        -- اتجاه الزوّار القادمين

local POSTS = {
	{ name = "حارس المدخل", pos = ground(93, 12),  face = WEST, sentry = true  },
	{ name = "حارس المدخل", pos = ground(93, 24),  face = WEST, sentry = true  },
	{ name = "حارس البهو",  pos = ground(118, 11), face = WEST, sentry = false, role = "lead"   },
	{ name = "حارس البهو",  pos = ground(118, 25), face = WEST, sentry = false, role = "follow" },
}

local LOBBY_TARGET = ground(152, 18)      -- وسط البهو الذي يقودك إليه الحارس القائد
local ENTRY_MIN    = Vector3.new(92, -3, -2)
local ENTRY_MAX    = Vector3.new(176, 16, 36)

local GREET_RADIUS   = 18
local GREET_COOLDOWN = 12
local PHRASES = {
	"أهلاً بك في القصر الجمهوري",
	"نوّرت القصر، تفضّل",
	"مرحباً بك، أهلاً وسهلاً",
	"حيّاك الله في مكتب القصر الجمهوري",
	"تشرّفنا بحضورك",
}

-- ── فقاعة كلام أنيقة تتلاشى بنعومة ─────────────────────────────────────────
local function speak(char, text)
	local head = char:FindFirstChild("Head")
	if not head then return end
	local old = head:FindFirstChild("GuardSpeech")
	if old then old:Destroy() end

	local bb = Instance.new("BillboardGui")
	bb.Name = "GuardSpeech"
	bb.Size = UDim2.new(0, 240, 0, 64)
	bb.StudsOffset = Vector3.new(0, 3.4, 0)
	bb.AlwaysOnTop = true
	bb.Parent = head

	local frame = Instance.new("Frame")
	frame.Size = UDim2.fromScale(1, 1)
	frame.BackgroundColor3 = Color3.fromRGB(18, 22, 38)
	frame.BackgroundTransparency = 1
	frame.Parent = bb
	local corner = Instance.new("UICorner"); corner.CornerRadius = UDim.new(0, 12); corner.Parent = frame
	local stroke = Instance.new("UIStroke"); stroke.Color = Color3.fromRGB(212, 175, 55)
	stroke.Thickness = 2; stroke.Transparency = 1; stroke.Parent = frame

	local lbl = Instance.new("TextLabel")
	lbl.Size = UDim2.new(1, -14, 1, -10)
	lbl.Position = UDim2.new(0, 7, 0, 5)
	lbl.BackgroundTransparency = 1
	lbl.Font = Enum.Font.GothamMedium
	lbl.TextScaled = true
	lbl.TextColor3 = Color3.fromRGB(255, 245, 220)
	lbl.TextTransparency = 1
	lbl.Text = text
	lbl.Parent = frame

	local tin = TweenInfo.new(0.35, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	TweenService:Create(frame,  tin, { BackgroundTransparency = 0.08 }):Play()
	TweenService:Create(stroke, tin, { Transparency = 0 }):Play()
	TweenService:Create(lbl,    tin, { TextTransparency = 0 }):Play()

	task.delay(3.4, function()
		if not bb.Parent then return end
		local tout = TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		TweenService:Create(frame,  tout, { BackgroundTransparency = 1 }):Play()
		TweenService:Create(stroke, tout, { Transparency = 1 }):Play()
		local t = TweenService:Create(lbl, tout, { TextTransparency = 1 })
		t.Completed:Connect(function() if bb then bb:Destroy() end end)
		t:Play()
	end)
end

-- ── التفاتة سلسة (للحرّاس الثابتين فقط — المتحرّكون يلتفتون باتجاه المشي) ────
local function faceTo(char, targetPos)
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hrp or not hrp.Anchored then return end
	local flat = Vector3.new(targetPos.X, hrp.Position.Y, targetPos.Z)
	if (flat - hrp.Position).Magnitude < 0.2 then return end
	local goal = CFrame.lookAt(hrp.Position, flat)
	TweenService:Create(hrp, TweenInfo.new(0.45, Enum.EasingStyle.Sine, Enum.EasingDirection.Out),
		{ CFrame = goal }):Play()
end

-- ── قبّعة الفرو (Bearskin) — أسطوانة سوداء عالية + قمّة مقبّبة ──────────────
-- بسيطة ومتينة (قطعتان فقط) بدل الـ١٥ قطعة التي كانت تتناثر.
local CAP_BLACK = Color3.fromRGB(20, 20, 22)
local function attachCap(char)
	local head = char:FindFirstChild("Head")
	if not head then return end

	-- بدن القبّعة: أسطوانة عمودية (PartType.Cylinder محورها X → نُدوّرها لتقف عموديّاً)
	local body = Instance.new("Part")
	body.Name = "BearskinBody"
	body.Shape = Enum.PartType.Cylinder
	body.Size = Vector3.new(2.1, 1.55, 1.55)   -- X=الارتفاع، Y/Z=القطر
	body.Color = CAP_BLACK
	body.Material = Enum.Material.Sand
	body.Anchored = false; body.CanCollide = false; body.Massless = true
	body.CFrame = head.CFrame * CFrame.new(0, 1.45, 0) * CFrame.Angles(0, 0, math.rad(90))
	local wb = Instance.new("WeldConstraint"); wb.Part0 = head; wb.Part1 = body; wb.Parent = body
	body.Parent = char

	-- قمّة مقبّبة
	local top = Instance.new("Part")
	top.Name = "BearskinTop"
	top.Shape = Enum.PartType.Ball
	top.Size = Vector3.new(1.55, 0.95, 1.55)
	top.Color = CAP_BLACK
	top.Material = Enum.Material.Sand
	top.Anchored = false; top.CanCollide = false; top.Massless = true
	top.CFrame = head.CFrame * CFrame.new(0, 2.55, 0)
	local wt = Instance.new("WeldConstraint"); wt.Part0 = head; wt.Part1 = top; wt.Parent = top
	top.Parent = char
end

-- ── تلبيس الحارس بزيّ الحرس الملكي (تونيك أحمر + بنطلون أسود) ───────────────
-- ملاحظة: أرقام الموديل هي ShirtTemplate/PantsTemplate (صور) — تُستخدم عبر إنشاء
-- Shirt/Pants مباشرة، لا عبر HumanoidDescription.Shirt (التي تتوقّع رقم كتالوج).
local function dressGuard(char)
	for _, c in ipairs(char:GetChildren()) do
		if c:IsA("Shirt") or c:IsA("Pants") or c:IsA("ShirtGraphic") then c:Destroy() end
	end
	local shirt = Instance.new("Shirt")
	shirt.Name = "GuardShirt"
	shirt.ShirtTemplate = "rbxassetid://" .. SHIRT_ID
	shirt.Parent = char
	local pants = Instance.new("Pants")
	pants.Name = "GuardPants"
	pants.PantsTemplate = "rbxassetid://" .. PANTS_ID
	pants.Parent = char

	-- لون احتياطي: لو تأخّر تحميل القميص يبقى الجسم أحمر بدل البيج الافتراضي
	local bc = char:FindFirstChildOfClass("BodyColors") or Instance.new("BodyColors")
	bc.TorsoColor    = BrickColor.new("Bright red")
	bc.LeftArmColor  = BrickColor.new("Bright red")
	bc.RightArmColor = BrickColor.new("Bright red")
	bc.LeftLegColor  = BrickColor.new("Really black")
	bc.RightLegColor = BrickColor.new("Really black")
	bc.HeadColor     = BrickColor.new("Pastel brown")
	bc.Parent = char
end

-- ── بناء حارس واحد ─────────────────────────────────────────────────────────
-- وصف R6 قياسي (رِيﭺ كامل + مفاصل Motor6D)؛ الزيّ يُطبّق بعده عبر dressGuard.
local function buildDescription()
	return Instance.new("HumanoidDescription")
end

-- أنميشن R6 الافتراضي من روبلوكس (وقوف/مشي). لازم نشغّلها يدوياً لأن سكربت
-- Animate الافتراضي LocalScript ولا يعمل على شخصيات NPC في الـWorkspace.
local IDLE_ID = "rbxassetid://180435571"
local WALK_ID = "rbxassetid://180426354"

local function setupAnimation(char, hum)
	local animator = hum:FindFirstChildOfClass("Animator")
	if not animator then
		animator = Instance.new("Animator"); animator.Parent = hum
	end
	local defaultAnim = char:FindFirstChild("Animate")
	if defaultAnim then defaultAnim:Destroy() end   -- LocalScript معطّل على NPC

	local function load(id)
		local a = Instance.new("Animation"); a.AnimationId = id
		local ok, tr = pcall(function() return animator:LoadAnimation(a) end)
		if ok and tr then tr.Looped = true end
		return ok and tr or nil
	end
	local idle, walk = load(IDLE_ID), load(WALK_ID)
	if idle then idle:Play() end

	local moving = false
	hum.Running:Connect(function(speed)
		if speed > 0.5 then
			if not moving then
				moving = true
				if walk then walk:Play(0.15) end
				if idle then idle:Stop(0.15) end
			end
		else
			if moving then
				moving = false
				if idle then idle:Play(0.15) end
				if walk then walk:Stop(0.15) end
			end
		end
	end)
end

local function spawnGuard(post)
	local desc = buildDescription()
	local ok, char = pcall(function()
		return Players:CreateHumanoidModelFromDescription(desc, Enum.HumanoidRigType.R6)
	end)
	if not ok or not char then
		warn("[GuardSystem] فشل بناء الحارس:", char)
		return nil
	end
	char.Name = post.name

	local hum = char:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.DisplayDistanceType  = Enum.HumanoidDisplayDistanceType.None
		hum.HealthDisplayType    = Enum.HumanoidHealthDisplayType.AlwaysOff
		hum.BreakJointsOnDeath   = false
		hum.WalkSpeed            = 9
	end

	local hrp = char:FindFirstChild("HumanoidRootPart")
	if hrp then char.PrimaryPart = hrp end
	char.Parent = Workspace
	char:PivotTo(CFrame.lookAt(post.pos, post.pos + post.face))
	dressGuard(char)
	attachCap(char)
	if hum then setupAnimation(char, hum) end

	if hrp and post.sentry then
		hrp.Anchored = true            -- يقف بانتباه بثبات (الأنميشن يبقى يعمل)
	end

	return { char = char, hum = hum, hrp = hrp, post = post, lastGreet = 0,
		homeCF = CFrame.lookAt(post.pos, post.pos + post.face), busy = false }
end

-- ── حركة بخطوة آمنة (Pathfinding + مهلة لتفادي التعليق) ────────────────────
local function moveStep(hum, pos)
	if not hum then return end
	hum:MoveTo(pos)
	local done = false
	local conn = hum.MoveToFinished:Connect(function() done = true end)
	local t = 0
	while not done and t < 4 do t += task.wait(0.1) end
	conn:Disconnect()
end

local function walkTo(g, dest)
	if not g or not g.hum or not g.hrp or g.busy then return end
	g.busy = true
	local ok, path = pcall(function()
		local p = PathfindingService:CreatePath({
			AgentRadius = 2.5, AgentHeight = 5, AgentCanJump = false,
		})
		p:ComputeAsync(g.hrp.Position, dest)
		return p
	end)
	if ok and path and path.Status == Enum.PathStatus.Success then
		for _, wp in ipairs(path:GetWaypoints()) do
			moveStep(g.hum, wp.Position)
		end
	else
		moveStep(g.hum, dest)
	end
	g.busy = false
end

-- ── الإقلاع ────────────────────────────────────────────────────────────────
local guards = {}
local leadGuard, followGuard
task.spawn(function()
	for _, post in ipairs(POSTS) do
		local g = spawnGuard(post)
		if g then
			table.insert(guards, g)
			if post.role == "lead"   then leadGuard   = g end
			if post.role == "follow" then followGuard = g end
		end
		task.wait(0.2)
	end
end)

local function nearestPlayer(pos, radius)
	local best, bestD
	for _, pl in ipairs(Players:GetPlayers()) do
		local ch = pl.Character
		local rp = ch and ch:FindFirstChild("HumanoidRootPart")
		if rp then
			local d = (rp.Position - pos).Magnitude
			if d <= radius and (not bestD or d < bestD) then
				best, bestD = pl, d
			end
		end
	end
	return best
end

-- ── حلقة الترحيب (لكل الحرّاس) ─────────────────────────────────────────────
task.spawn(function()
	while true do
		local now = os.clock()
		for _, g in ipairs(guards) do
			if g.hrp and g.hrp.Parent then
				local pl = nearestPlayer(g.hrp.Position, GREET_RADIUS)
				local prp = pl and pl.Character and pl.Character:FindFirstChild("HumanoidRootPart")
				if prp then
					faceTo(g.char, prp.Position)
					if now - g.lastGreet >= GREET_COOLDOWN then
						g.lastGreet = now
						speak(g.char, PHRASES[math.random(#PHRASES)])
					end
				end
			end
		end
		task.wait(0.5)
	end
end)

-- ── حلقة المرافقة (قائد يقودك للبهو + تابع يمشي خلفك، ويرجعون عند الخروج) ──
local function inEntry(pos)
	return pos.X >= ENTRY_MIN.X and pos.X <= ENTRY_MAX.X
		and pos.Y >= ENTRY_MIN.Y and pos.Y <= ENTRY_MAX.Y
		and pos.Z >= ENTRY_MIN.Z and pos.Z <= ENTRY_MAX.Z
end

task.spawn(function()
	local active = nil
	while true do
		local target
		for _, pl in ipairs(Players:GetPlayers()) do
			local rp = pl.Character and pl.Character:FindFirstChild("HumanoidRootPart")
			if rp and inEntry(rp.Position) then target = pl; break end
		end

		if target and active ~= target then
			active = target
			if leadGuard then
				speak(leadGuard.char, "تفضّل من هنا، سأرافقك")
				task.spawn(function() walkTo(leadGuard, LOBBY_TARGET) end)
			end
		elseif not target and active then
			active = nil
			if leadGuard then task.spawn(function() walkTo(leadGuard, leadGuard.homeCF.Position) end) end
			if followGuard then task.spawn(function() walkTo(followGuard, followGuard.homeCF.Position) end) end
		end

		if active and followGuard and followGuard.hum then
			local rp = active.Character and active.Character:FindFirstChild("HumanoidRootPart")
			if rp and not followGuard.busy then
				local behind = rp.Position - (rp.CFrame.LookVector * 6)
				followGuard.hum:MoveTo(Vector3.new(behind.X, FLOOR_Y + R6_HIP, behind.Z))
			end
		end

		task.wait(1.0)
	end
end)
