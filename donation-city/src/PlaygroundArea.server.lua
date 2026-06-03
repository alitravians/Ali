--[[
╔══════════════════════════════════════════════════════════════════════╗
║  لوحات المناطق — PLAYGROUND (Server)                                   ║
║                                                                        ║
║  أُزيلت ساحة الألعاب القديمة والشاطئ القديم، واستُبدلا بموقعَي «مبنى       ║
║  قيد الإنشاء» منفصلين (هندسة ثابتة في الـ Workspace). هذا السكربت يبني   ║
║  لوحة تعريفية لكل منطقة (الشاطئ / صالة الألعاب) — «قيد الإنشاء» — لين     ║
║  نعيد تصميم كل منطقة مستقبلاً. لوحات ثابتة خفيفة = صفر لاق.              ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace = game:GetService("Workspace")

-- مواقع المنطقتين (الجهة المقابلة للمدينة من كل مبنى)
local SIGNS = {
	{
		name  = "BeachZoneSign",
		pos   = Vector3.new(96, 0, 80),
		title = "🏖️ منطقة الشاطئ",
		sub   = "قيد الإنشاء",
		color = Color3.fromRGB(45, 150, 220),
	},
	{
		name  = "GameHallZoneSign",
		pos   = Vector3.new(96, 0, -110),
		title = "🎮 صالة الألعاب",
		sub   = "قيد الإنشاء",
		color = Color3.fromRGB(165, 95, 215),
	},
}

local function makeFace(board: BasePart, face: Enum.NormalId, cfg)
	local sg = Instance.new("SurfaceGui")
	sg.AutoLocalize = false  -- 🌐 إيقاف الترجمة التلقائية (النص العربي يظهر للجميع)
	sg.Name = "SignFace"
	sg.Face = face
	sg.CanvasSize = Vector2.new(900, 300)
	sg.LightInfluence = 0
	sg.AlwaysOnTop = false
	sg.Adornee = board
	sg.Parent = board

	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1
	title.Size = UDim2.new(1, -20, 0.58, 0)
	title.Position = UDim2.new(0, 10, 0.04, 0)
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.RichText = true
	title.Text = cfg.title
	title.TextColor3 = cfg.color
	title.Parent = sg

	local sub = Instance.new("TextLabel")
	sub.BackgroundTransparency = 1
	sub.Size = UDim2.new(1, -20, 0.34, 0)
	sub.Position = UDim2.new(0, 10, 0.62, 0)
	sub.Font = Enum.Font.GothamBold
	sub.TextScaled = true
	sub.Text = "🚧 " .. cfg.sub .. " 🚧"
	sub.TextColor3 = Color3.fromRGB(255, 210, 90)
	sub.Parent = sg
end

local function makeSign(cfg)
	local model = Instance.new("Model")
	model.Name = cfg.name

	-- عمودان حاملان
	for _, dz in ipairs({ -6, 6 }) do
		local post = Instance.new("Part")
		post.Name = "Post"
		post.Anchored = true
		post.CanCollide = true
		post.Size = Vector3.new(1, 11, 1)
		post.Position = cfg.pos + Vector3.new(0, 5.5, dz)
		post.Color = Color3.fromRGB(55, 58, 68)
		post.Material = Enum.Material.Metal
		post.Parent = model
	end

	-- اللوحة (رفيعة على محور X فتكون وجوهها العريضة باتجاه المدينة/المبنى)
	local board = Instance.new("Part")
	board.Name = "Board"
	board.Anchored = true
	board.CanCollide = false
	board.Size = Vector3.new(0.6, 6, 18)
	board.Position = cfg.pos + Vector3.new(0, 12, 0)
	board.Color = Color3.fromRGB(20, 24, 36)
	board.Material = Enum.Material.SmoothPlastic
	board.Parent = model

	makeFace(board, Enum.NormalId.Left, cfg)   -- الوجه المقابل للمدينة (-X)
	makeFace(board, Enum.NormalId.Right, cfg)  -- الوجه المقابل للمبنى (+X)

	model.Parent = Workspace
end

for _, cfg in ipairs(SIGNS) do
	local ok, err = pcall(makeSign, cfg)
	if not ok then
		warn("[Playground] تعذّر بناء لوحة " .. cfg.name .. ": " .. tostring(err))
	end
end

----------------------------------------------------------------------
-- 👮 شرطي الأمن جنب كل لوحة: تفاعل بزر E → فقاعة كلام تدريجية + صوت ناعم
----------------------------------------------------------------------
-- صوت همس قصير لطيف (٣D محلي، واطي، يُسمع بس وأنت قريب) — نبضة لكل كلمة.
local TALK_SOUND = "rbxassetid://131238032"

local GUARDS = {
	{
		model = "PoliceGuard_Beach",
		accent = Color3.fromRGB(45, 150, 220),
	},
	{
		model = "PoliceGuard_GameHall",
		accent = Color3.fromRGB(165, 95, 215),
	},
}

-- جُمل الشرطي (تُكتب تدريجياً سطراً بعد سطر)
local LINES = {
	"🚧 هذا المبنى تحت الصيانة حالياً.",
	"نشتغل عليه وهو قيد الإنشاء…",
	"إن شاء الله يفتح قريباً 🔜",
	"نعتذر عن الإزعاج 🙏 شكراً لصبرك.",
}

local CHAR_DELAY = 0.045   -- سرعة ظهور الحرف
local LINE_PAUSE = 0.7     -- توقّف بين الجُمل
local END_HOLD   = 2.0     -- بقاء الفقاعة بعد انتهاء الكلام

local function buildBubble(head: BasePart, accent: Color3)
	local bb = Instance.new("BillboardGui")
	bb.AutoLocalize = false  -- 🌐 إيقاف الترجمة التلقائية (النص العربي يظهر للجميع)
	bb.Name = "GuardSpeech"
	bb.Adornee = head
	bb.Size = UDim2.new(0, 300, 0, 140)
	bb.StudsOffsetWorldSpace = Vector3.new(0, 4.4, 0)
	bb.AlwaysOnTop = true
	bb.MaxDistance = 60
	bb.Enabled = false
	bb.Parent = head

	local frame = Instance.new("Frame")
	frame.Name = "Panel"
	frame.AnchorPoint = Vector2.new(0.5, 1)
	frame.Position = UDim2.new(0.5, 0, 1, -14)
	frame.Size = UDim2.new(1, 0, 1, -14)
	frame.BackgroundColor3 = Color3.fromRGB(18, 20, 34)
	frame.BackgroundTransparency = 0.12
	frame.BorderSizePixel = 0
	frame.Parent = bb
	Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 14)
	local stroke = Instance.new("UIStroke", frame)
	stroke.Color = accent
	stroke.Thickness = 2
	stroke.Transparency = 0.1
	local pad = Instance.new("UIPadding", frame)
	pad.PaddingLeft = UDim.new(0, 12); pad.PaddingRight = UDim.new(0, 12)
	pad.PaddingTop = UDim.new(0, 8);   pad.PaddingBottom = UDim.new(0, 8)

	-- ذيل صغير يشير للشرطي
	local tail = Instance.new("TextLabel")
	tail.Name = "Tail"
	tail.BackgroundTransparency = 1
	tail.AnchorPoint = Vector2.new(0.5, 0)
	tail.Position = UDim2.new(0.5, 0, 1, -15)
	tail.Size = UDim2.new(0, 30, 0, 24)
	tail.Font = Enum.Font.GothamBlack
	tail.Text = "▼"
	tail.TextScaled = true
	tail.TextColor3 = Color3.fromRGB(18, 20, 34)
	tail.ZIndex = 0
	tail.Parent = bb

	-- شارة علوية «👮 الأمن»
	local badge = Instance.new("TextLabel")
	badge.Name = "Badge"
	badge.AnchorPoint = Vector2.new(0, 0)
	badge.Position = UDim2.new(0, 0, 0, 0)
	badge.Size = UDim2.new(0, 96, 0, 26)
	badge.BackgroundColor3 = accent
	badge.BackgroundTransparency = 0.05
	badge.Font = Enum.Font.GothamBlack
	badge.Text = "👮 الأمن"
	badge.TextColor3 = Color3.fromRGB(255, 255, 255)
	badge.TextSize = 15
	badge.Parent = frame
	Instance.new("UICorner", badge).CornerRadius = UDim.new(1, 0)

	-- نص الكلام (يُكتب تدريجياً)
	local body = Instance.new("TextLabel")
	body.Name = "Body"
	body.BackgroundTransparency = 1
	body.AnchorPoint = Vector2.new(0.5, 1)
	body.Position = UDim2.new(0.5, 0, 1, 0)
	body.Size = UDim2.new(1, 0, 1, -32)
	body.Font = Enum.Font.GothamMedium
	body.RichText = true
	body.TextWrapped = true
	body.TextYAlignment = Enum.TextYAlignment.Center
	body.TextXAlignment = Enum.TextXAlignment.Center
	body.TextSize = 19
	body.TextColor3 = Color3.fromRGB(240, 244, 255)
	body.Text = ""
	body.Parent = frame

	return bb, body
end

local function setupGuard(cfg)
	local model = Workspace:FindFirstChild(cfg.model)
	if not model then return end
	local head = model:FindFirstChild("Head") or model:FindFirstChildWhichIsA("BasePart")
	if not head then return end

	-- إخفاء خانة الاسم/الصحّة الافتراضية (تعكس العربي) واستبدالها بلوحة اسم مخصّصة
	local hum = model:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.DisplayName = ""
		hum.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff
		hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	end

	-- لوحة اسم احترافية (TextLabel يدعم العربي صح، مثل لوحات المناطق)
	local nameBb = Instance.new("BillboardGui")
	nameBb.AutoLocalize = false  -- 🌐 إيقاف الترجمة التلقائية (النص العربي يظهر للجميع)
	nameBb.Name = "NameTag"
	nameBb.Adornee = head
	nameBb.Size = UDim2.new(0, 170, 0, 38)
	nameBb.StudsOffsetWorldSpace = Vector3.new(0, 2.6, 0)
	nameBb.AlwaysOnTop = true
	nameBb.MaxDistance = 70
	nameBb.Parent = head
	local nameFrame = Instance.new("Frame")
	nameFrame.Size = UDim2.new(1, 0, 1, 0)
	nameFrame.BackgroundColor3 = Color3.fromRGB(18, 20, 34)
	nameFrame.BackgroundTransparency = 0.15
	nameFrame.BorderSizePixel = 0
	nameFrame.Parent = nameBb
	Instance.new("UICorner", nameFrame).CornerRadius = UDim.new(1, 0)
	local nameStroke = Instance.new("UIStroke", nameFrame)
	nameStroke.Color = cfg.accent
	nameStroke.Thickness = 2
	local nameLbl = Instance.new("TextLabel")
	nameLbl.BackgroundTransparency = 1
	nameLbl.Size = UDim2.new(1, -10, 1, 0)
	nameLbl.Position = UDim2.new(0, 5, 0, 0)
	nameLbl.Font = Enum.Font.GothamBold
	nameLbl.RichText = true
	nameLbl.Text = "👮 أمن المدينة"
	nameLbl.TextScaled = true
	nameLbl.TextColor3 = Color3.fromRGB(240, 244, 255)
	nameLbl.Parent = nameFrame

	local sound = Instance.new("Sound")
	sound.Name = "GuardTalk"
	sound.SoundId = TALK_SOUND
	sound.Volume = 0.28
	sound.RollOffMode = Enum.RollOffMode.InverseTapered
	sound.RollOffMinDistance = 6
	sound.RollOffMaxDistance = 28
	sound.Parent = head

	local bb, body = buildBubble(head, cfg.accent)

	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "TalkPrompt"
	prompt.ActionText = "تحدّث"
	prompt.ObjectText = "👮 الأمن"
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.HoldDuration = 0
	prompt.RequiresLineOfSight = false
	prompt.MaxActivationDistance = 12
	prompt.Parent = head

	local talking = false
	prompt.Triggered:Connect(function()
		if talking then return end
		talking = true
		prompt.Enabled = false
		bb.Enabled = true
		body.Text = ""
		for _, line in ipairs(LINES) do
			for first, last in utf8.graphemes(line) do
				body.Text = string.sub(line, 1, last) .. "<font color=\"#FFD24A\">▌</font>"
				if first == 1 or string.sub(line, first, last) == " " then
					sound.PlaybackSpeed = 0.92 + math.random() * 0.16
					sound:Play()
				end
				task.wait(CHAR_DELAY)
			end
			body.Text = line
			task.wait(LINE_PAUSE)
		end
		task.wait(END_HOLD)
		bb.Enabled = false
		body.Text = ""
		prompt.Enabled = true
		talking = false
	end)
end

for _, cfg in ipairs(GUARDS) do
	local ok, err = pcall(setupGuard, cfg)
	if not ok then
		warn("[Playground] تعذّر تجهيز الشرطي " .. cfg.model .. ": " .. tostring(err))
	end
end

print("[Playground] لوحات المناطق + شرطيا الأمن جاهزون (الشاطئ + صالة الألعاب — قيد الإنشاء).")
