--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام دردشة مخصّص — CUSTOM CHAT (Client)                                ║
║  المكان: StarterPlayer > StarterPlayerScripts   ·   النوع: LocalScript ║
║                                                                        ║
║  واجهة دردشة بثيم اللعبة النيون (أسفل يسار الشاشة):                      ║
║    • صندوق كتابة + زر إرسال (وEnter يرسل).                              ║
║    • قائمة رسائل تمرير مع أسماء ملوّنة (RichText).                       ║
║    • زر طيّ/فتح 💬 (مناسب للجوال).                                      ║
║  الرسائل تُفلتر على السيرفر قبل وصولها (إلزامي من روبلوكس).              ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local UserInputService  = game:GetService("UserInputService")
local SoundService      = game:GetService("SoundService")
local StarterGui        = game:GetService("StarterGui")
local TextChatService   = game:GetService("TextChatService")

local LocalPlayer = Players.LocalPlayer
local playerGui   = LocalPlayer:WaitForChild("PlayerGui")

------------------------------------------------------------------------
-- إخفاء دردشة روبلوكس الافتراضية (الأيقونة أعلى يسار الشاشة) — اللاعب طلب
-- يكون الشات في الزاوية اليمنى السفلى فقط (زرّنا البنفسجي). فنوقف الواجهة
-- الرسمية ونبقي دردشتنا المخصّصة وحدها، بلا أيقونتين متكرّرتين.
------------------------------------------------------------------------
local function showDefaultChat()
	-- TextChatService الحديث: نوقف نافذة الدردشة وشريط الإدخال الرسميَّين
	pcall(function()
		local win = TextChatService:FindFirstChildOfClass("ChatWindowConfiguration")
		if win then win.Enabled = true end
		local bar = TextChatService:FindFirstChildOfClass("ChatInputBarConfiguration")
		if bar then bar.Enabled = true end
	end)
	-- النظام القديم (Legacy): نوقف واجهة الدردشة من CoreGui
	pcall(function()
		StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Chat, true)
	end)
end
showDefaultChat()
-- نعيد المحاولة بضع مرّات لأن StarterGui/الإعدادات قد لا تكون جاهزة فوراً
task.spawn(function()
	for _ = 1, 10 do
		task.wait(0.5)
		showDefaultChat()
	end
end)

-- الريموتات (السيرفر ينشئها)
local folder     = ReplicatedStorage:WaitForChild("CustomChat", 30)
if not folder then return end
local sayRemote  = folder:WaitForChild("Say")
local pushRemote = folder:WaitForChild("Push")
local whisperRemote = folder:WaitForChild("Whisper")

------------------------------------------------------------------------
-- لوحة الألوان (نفس ثيم اللعبة النيون)
------------------------------------------------------------------------
local PURPLE = Color3.fromRGB(168, 92, 255)
local CYAN   = Color3.fromRGB(70, 226, 255)
local GOLD   = Color3.fromRGB(255, 205, 90)
local VIPCOL = Color3.fromRGB(214, 138, 255)
local CARD   = Color3.fromRGB(18, 14, 32)
local TEXT   = Color3.fromRGB(244, 242, 255)
local MUTED  = Color3.fromRGB(170, 165, 200)
local PINK   = Color3.fromRGB(255, 138, 216)   -- لون الرسائل الخاصة (الهَمس)

local MAX_MESSAGES = 60          -- أقصى عدد رسائل محفوظة بالواجهة
local MAX_LEN      = 200

------------------------------------------------------------------------
-- اختصارات السمايلات النصية ← تتحوّل تلقائياً إلى إيموجي (الأطول أولاً)
------------------------------------------------------------------------
local EMOJI_SHORTCODES = {
	{ "<3", "❤️" }, { ":'(", "😢" },
	{ ":-)", "🙂" }, { ":-(", "🙁" }, { ":-D", "😄" }, { ":-P", "😛" }, { ";-)", "😉" },
	{ ":D", "😄" }, { ":P", "😛" }, { ":p", "😛" }, { ";)", "😉" },
	{ ":)", "🙂" }, { ":(", "🙁" }, { ":o", "😮" }, { ":O", "😮" },
	{ ":|", "😐" }, { ":*", "😘" }, { "xD", "🤣" }, { "XD", "🤣" },
}

local function escPat(s: string): string
	return (s:gsub("[%(%)%.%%%+%-%*%?%[%]%^%$]", "%%%1"))
end

-- يحوّل الاختصارات النصية إلى إيموجي (مثل ":)" ← 🙂 و"<3" ← ❤️)
local function applyEmojiShortcodes(text: string): string
	for _, pair in ipairs(EMOJI_SHORTCODES) do
		local code, emoji = pair[1], pair[2]
		text = text:gsub(escPat(code), function() return emoji end)
	end
	return text
end

local function new(class: string, props: { [string]: any }): Instance
	local inst = Instance.new(class)
	for k, v in pairs(props) do
		if k ~= "Parent" then
			(inst :: any)[k] = v
		end
	end
	if props.Parent then inst.Parent = props.Parent end
	return inst
end

local function escapeRich(s: string): string
	s = s:gsub("&", "&amp;")
	s = s:gsub("<", "&lt;")
	s = s:gsub(">", "&gt;")
	s = s:gsub('"', "&quot;")
	return s
end

local function colorHex(c: Color3): string
	return string.format("#%02X%02X%02X",
		math.floor(c.R * 255 + 0.5),
		math.floor(c.G * 255 + 0.5),
		math.floor(c.B * 255 + 0.5))
end

------------------------------------------------------------------------
-- بناء الواجهة
------------------------------------------------------------------------
local gui = new("ScreenGui", {
	Name = "CustomChatGui",
	ResetOnSpawn = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	DisplayOrder = 50,
	IgnoreGuiInset = true,    -- absolute screen coords (align with Roblox top bar, top-left)
	Parent = playerGui,
})

------------------------------------------------------------------------
-- ختم نسخة مرئي مؤقّت: يثبت للّاعب أنه يشغّل آخر ملف فعلاً (يختفي تلقائياً).
-- إذا ما ظهر هذا الشريط عند Play → معناه الملف المفتوح قديم وليس آخر نسخة.
------------------------------------------------------------------------
do
	local stampGui = Instance.new("ScreenGui")
	stampGui.Name = "BuildStamp"
	stampGui.ResetOnSpawn = false
	stampGui.DisplayOrder = 999
	stampGui.IgnoreGuiInset = true
	stampGui.Parent = playerGui
	local lbl = Instance.new("TextLabel")
	lbl.AnchorPoint = Vector2.new(0.5, 0)
	lbl.Position = UDim2.new(0.5, 0, 0, 6)
	lbl.Size = UDim2.new(0, 360, 0, 30)
	lbl.BackgroundColor3 = Color3.fromRGB(20, 140, 70)
	lbl.BackgroundTransparency = 0.1
	lbl.TextColor3 = Color3.fromRGB(255, 255, 255)
	lbl.Font = Enum.Font.GothamBold
	lbl.TextSize = 15
	lbl.Text = "✅ Build A1 — new aquarium + chat top-left"
	lbl.Parent = stampGui
	local cr = Instance.new("UICorner"); cr.CornerRadius = UDim.new(0, 8); cr.Parent = lbl
	task.delay(12, function()
		for i = 1, 20 do
			lbl.BackgroundTransparency = 0.1 + i * 0.045
			lbl.TextTransparency = i * 0.05
			task.wait(0.05)
		end
		stampGui:Destroy()
	end)
end

-- 💬 زر مُصغّر (فقاعة) أسفل يمين الشاشة — يفتح/يخفي لوحة الدردشة، فلا تزعج اللاعب.
-- launcher button: TOP-LEFT, beside the native Roblox chat icon (pixel offset approximate; easy to nudge)
local launcher = new("TextButton", {
	Name = "ChatLauncher",
	AnchorPoint = Vector2.new(0, 0),
	Position = UDim2.new(0, 160, 0, 4),
	Size = UDim2.new(0, 38, 0, 38),
	BackgroundColor3 = PURPLE,
	BackgroundTransparency = 0.05,
	Font = Enum.Font.GothamBold,
	Text = "💬",
	TextColor3 = TEXT,
	TextSize = 24,
	AutoButtonColor = true,
	Parent = gui,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = launcher })
new("UIStroke", { Color = CYAN, Thickness = 1.5, Transparency = 0.3, Parent = launcher })

-- شارة عدد الرسائل غير المقروءة فوق الفقاعة
local badge = new("TextLabel", {
	Name = "Badge",
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, 4, 0, -6),
	Size = UDim2.new(0, 22, 0, 22),
	BackgroundColor3 = Color3.fromRGB(255, 70, 90),
	Font = Enum.Font.GothamBold,
	Text = "0",
	TextColor3 = Color3.fromRGB(255, 255, 255),
	TextSize = 12,
	Visible = false,
	ZIndex = 3,
	Parent = launcher,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = badge })

-- chat panel opens from TOP-LEFT (drops below the launcher) instead of bottom-right
local root = new("Frame", {
	Name = "ChatRoot",
	AnchorPoint = Vector2.new(0, 0),
	Position = UDim2.new(0, 12, 0, 90),
	Size = UDim2.new(0, 380, 0, 300),
	BackgroundColor3 = CARD,
	BackgroundTransparency = 0.12,
	BorderSizePixel = 0,
	Visible = false,            -- تبدأ مخفيّة (مصغّرة) — تُفتح من الفقاعة
	Parent = gui,
})
new("UICorner", { CornerRadius = UDim.new(0, 14), Parent = root })
new("UIStroke", { Color = PURPLE, Thickness = 1.5, Transparency = 0.35, Parent = root })
new("UISizeConstraint", { MinSize = Vector2.new(260, 180), MaxSize = Vector2.new(520, 460), Parent = root })

-- شريط العنوان
local header = new("Frame", {
	Name = "Header",
	Size = UDim2.new(1, 0, 0, 36),
	BackgroundTransparency = 1,
	Parent = root,
})
new("TextLabel", {
	Name = "Title",
	Size = UDim2.new(1, -44, 1, 0),
	Position = UDim2.new(0, 12, 0, 0),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBold,
	Text = "💬 الدردشة",
	TextColor3 = TEXT,
	TextSize = 16,
	TextXAlignment = Enum.TextXAlignment.Right,
	Parent = header,
})

local toggleBtn = new("TextButton", {
	Name = "Toggle",
	AnchorPoint = Vector2.new(1, 0.5),
	Position = UDim2.new(1, -8, 0.5, 0),
	Size = UDim2.new(0, 28, 0, 28),
	BackgroundColor3 = PURPLE,
	BackgroundTransparency = 0.2,
	Font = Enum.Font.GothamBold,
	Text = "—",
	TextColor3 = TEXT,
	TextSize = 18,
	AutoButtonColor = true,
	Parent = header,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = toggleBtn })

------------------------------------------------------------------------
-- صفّ الوضع: عام / خاص (هَمس) + اختيار المستقبِل
------------------------------------------------------------------------
local modeRow = new("Frame", {
	Name = "ModeRow",
	Position = UDim2.new(0, 8, 0, 40),
	Size = UDim2.new(1, -16, 0, 30),
	BackgroundTransparency = 1,
	Parent = root,
})

local publicBtn = new("TextButton", {
	Name = "PublicBtn",
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, 0, 0, 0),
	Size = UDim2.new(0, 78, 1, 0),
	BackgroundColor3 = CYAN,
	BackgroundTransparency = 0.05,
	Font = Enum.Font.GothamBold,
	Text = "🌐 عام",
	TextColor3 = Color3.fromRGB(8, 12, 20),
	TextSize = 14,
	AutoButtonColor = true,
	Parent = modeRow,
})
new("UICorner", { CornerRadius = UDim.new(0, 9), Parent = publicBtn })

local privateBtn = new("TextButton", {
	Name = "PrivateBtn",
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -84, 0, 0),
	Size = UDim2.new(0, 84, 1, 0),
	BackgroundColor3 = Color3.fromRGB(40, 30, 56),
	BackgroundTransparency = 0.1,
	Font = Enum.Font.GothamBold,
	Text = "🔒 خاص",
	TextColor3 = TEXT,
	TextSize = 14,
	AutoButtonColor = true,
	Parent = modeRow,
})
new("UICorner", { CornerRadius = UDim.new(0, 9), Parent = privateBtn })

-- زر اختيار اللاعب المستقبِل (يظهر فقط في وضع الخاص)
local targetBtn = new("TextButton", {
	Name = "TargetBtn",
	Position = UDim2.new(0, 0, 0, 0),
	Size = UDim2.new(1, -176, 1, 0),
	BackgroundColor3 = Color3.fromRGB(28, 22, 48),
	BackgroundTransparency = 0.1,
	Font = Enum.Font.GothamMedium,
	Text = "👤 اختر لاعباً…",
	TextColor3 = PINK,
	TextSize = 13,
	TextTruncate = Enum.TextTruncate.AtEnd,
	AutoButtonColor = true,
	Visible = false,
	Parent = modeRow,
})
new("UICorner", { CornerRadius = UDim.new(0, 9), Parent = targetBtn })
new("UIStroke", { Color = PINK, Thickness = 1, Transparency = 0.5, Parent = targetBtn })

-- قائمة الرسائل
local list = new("ScrollingFrame", {
	Name = "Messages",
	Position = UDim2.new(0, 8, 0, 76),
	Size = UDim2.new(1, -16, 1, -124),
	BackgroundColor3 = Color3.fromRGB(10, 8, 20),
	BackgroundTransparency = 0.35,
	BorderSizePixel = 0,
	ScrollBarThickness = 4,
	ScrollBarImageColor3 = PURPLE,
	CanvasSize = UDim2.new(0, 0, 0, 0),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ScrollingDirection = Enum.ScrollingDirection.Y,
	Parent = root,
})
new("UICorner", { CornerRadius = UDim.new(0, 10), Parent = list })
new("UIPadding", {
	PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6),
	PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8),
	Parent = list,
})
local listLayout = new("UIListLayout", {
	FillDirection = Enum.FillDirection.Vertical,
	SortOrder = Enum.SortOrder.LayoutOrder,
	Padding = UDim.new(0, 4),
	Parent = list,
})

-- صفّ الإدخال
local inputRow = new("Frame", {
	Name = "InputRow",
	AnchorPoint = Vector2.new(0, 1),
	Position = UDim2.new(0, 8, 1, -8),
	Size = UDim2.new(1, -16, 0, 38),
	BackgroundTransparency = 1,
	Parent = root,
})

local sendBtn = new("TextButton", {
	Name = "Send",
	Size = UDim2.new(0, 76, 1, 0),
	Position = UDim2.new(0, 0, 0, 0),
	BackgroundColor3 = CYAN,
	BackgroundTransparency = 0.05,
	Font = Enum.Font.GothamBold,
	Text = "إرسال",
	TextColor3 = Color3.fromRGB(8, 12, 20),
	TextSize = 15,
	AutoButtonColor = true,
	Parent = inputRow,
})
new("UICorner", { CornerRadius = UDim.new(0, 10), Parent = sendBtn })

local box = new("TextBox", {
	Name = "Input",
	Position = UDim2.new(0, 130, 0, 0),
	Size = UDim2.new(1, -130, 1, 0),
	BackgroundColor3 = Color3.fromRGB(28, 22, 48),
	BackgroundTransparency = 0.1,
	Font = Enum.Font.Gotham,
	PlaceholderText = "اكتب رسالة…",
	PlaceholderColor3 = MUTED,
	Text = "",
	TextColor3 = TEXT,
	TextSize = 15,
	TextXAlignment = Enum.TextXAlignment.Right,
	ClearTextOnFocus = false,
	TextTruncate = Enum.TextTruncate.AtEnd,
	Parent = inputRow,
})
new("UICorner", { CornerRadius = UDim.new(0, 10), Parent = box })
new("UIStroke", { Color = PURPLE, Thickness = 1, Transparency = 0.5, Parent = box })
new("UIPadding", {
	PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10),
	Parent = box,
})

------------------------------------------------------------------------
-- إضافة رسالة للواجهة
------------------------------------------------------------------------
local orderCounter = 0

local function trimOldMessages()
	local children = {}
	for _, c in ipairs(list:GetChildren()) do
		if c:IsA("TextLabel") then table.insert(children, c) end
	end
	if #children <= MAX_MESSAGES then return end
	table.sort(children, function(a, b) return a.LayoutOrder < b.LayoutOrder end)
	for i = 1, #children - MAX_MESSAGES do
		children[i]:Destroy()
	end
end

-- صوت تنبيه خفيف عند وصول رسالة إدارية
local dingSound = new("Sound", {
	Name = "AdminDing", SoundId = "rbxassetid://9118823105", Volume = 0.5, Parent = SoundService,
})
local function playDing()
	pcall(function() SoundService:PlayLocalSound(dingSound) end)
end

-- أيقونات وألوان خلفية الرسالة الإدارية حسب الرتبة
local ADMIN_ICON = { OWNER = "👑", ADMIN = "🛡️", MODERATOR = "🔰" }
local ADMIN_BG = {
	OWNER     = Color3.fromRGB(255, 205, 90),
	ADMIN     = Color3.fromRGB(255, 130, 130),
	MODERATOR = Color3.fromRGB(120, 200, 255),
}

local function scrollToBottom()
	task.defer(function()
		list.CanvasPosition = Vector2.new(0, list.AbsoluteCanvasSize.Y)
	end)
end

-- opts: { admin = "OWNER"/"ADMIN"/"MODERATOR" } للرسالة الإدارية ، { system = true } لرسالة النظام
local function addMessage(name: string, text: string, nameColor: Color3, opts)
	opts = opts or {}
	orderCounter += 1

	-- رسالة إدارية: خط أسود عريض أكبر على خلفية مميّزة + أيقونة + صوت
	if opts.admin then
		local label = opts.admin
		local icon = ADMIN_ICON[label] or "🛡️"
		local bg = ADMIN_BG[label] or GOLD
		local lbl = new("TextLabel", {
			Name = "AdminMsg",
			LayoutOrder = orderCounter,
			Size = UDim2.new(1, 0, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			BackgroundColor3 = bg, BackgroundTransparency = 0.05,
			Font = Enum.Font.GothamBlack,
			RichText = true,
			Text = string.format('%s [%s] %s: %s',
				icon, label, escapeRich(name), escapeRich(text)),
			TextColor3 = Color3.fromRGB(12, 10, 16),
			TextSize = 17,
			TextWrapped = true,
			TextXAlignment = Enum.TextXAlignment.Right,
			TextYAlignment = Enum.TextYAlignment.Top,
			Parent = list,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 8), Parent = lbl })
		new("UIPadding", {
			PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8),
			PaddingTop = UDim.new(0, 5), PaddingBottom = UDim.new(0, 5), Parent = lbl,
		})
		playDing()
		trimOldMessages(); scrollToBottom()
		return lbl
	end

	-- 🔒 رسالة خاصة (همس): إطار وردي مميّز يوضّح أنها بينك وبين الطرف الآخر فقط
	if opts.private then
		local lbl = new("TextLabel", {
			Name = "PrivateMsg",
			LayoutOrder = orderCounter,
			Size = UDim2.new(1, 0, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			BackgroundColor3 = Color3.fromRGB(40, 20, 42),
			BackgroundTransparency = 0.1,
			Font = Enum.Font.GothamMedium,
			RichText = true,
			Text = string.format('<font color="%s">🔒 %s</font>  <font color="%s">%s</font>',
				colorHex(PINK), escapeRich(name), colorHex(TEXT), escapeRich(text)),
			TextColor3 = TEXT,
			TextSize = 14,
			TextWrapped = true,
			TextXAlignment = Enum.TextXAlignment.Right,
			TextYAlignment = Enum.TextYAlignment.Top,
			Parent = list,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 8), Parent = lbl })
		new("UIStroke", { Color = PINK, Thickness = 1, Transparency = 0.45, Parent = lbl })
		new("UIPadding", {
			PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8),
			PaddingTop = UDim.new(0, 5), PaddingBottom = UDim.new(0, 5), Parent = lbl,
		})
		trimOldMessages(); scrollToBottom()
		return lbl
	end

	-- رسالة نظام: رمادية مائلة بدون وسم مرسِل
	if opts.system then
		local lbl = new("TextLabel", {
			Name = "SysMsg",
			LayoutOrder = orderCounter,
			Size = UDim2.new(1, 0, 0, 0),
			AutomaticSize = Enum.AutomaticSize.Y,
			BackgroundTransparency = 1,
			Font = Enum.Font.GothamMedium,
			RichText = true,
			Text = string.format('<i><font color="%s">%s</font></i>', colorHex(MUTED), escapeRich(text)),
			TextColor3 = MUTED, TextSize = 13, TextWrapped = true,
			TextXAlignment = Enum.TextXAlignment.Right,
			TextYAlignment = Enum.TextYAlignment.Top,
			Parent = list,
		})
		trimOldMessages(); scrollToBottom()
		return lbl
	end

	-- رسالة عادية
	local lbl = new("TextLabel", {
		Name = "Msg",
		LayoutOrder = orderCounter,
		Size = UDim2.new(1, 0, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y,
		BackgroundTransparency = 1,
		Font = Enum.Font.Gotham,
		RichText = true,
		Text = string.format('<font color="%s"><b>%s</b></font>  <font color="%s">%s</font>',
			colorHex(nameColor), escapeRich(name), colorHex(TEXT), escapeRich(text)),
		TextColor3 = TEXT,
		TextSize = 15,
		TextWrapped = true,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextYAlignment = Enum.TextYAlignment.Top,
		Parent = list,
	})
	trimOldMessages()
	scrollToBottom()
	return lbl
end

------------------------------------------------------------------------
-- حالة الكتم (يتحكّم بها السيرفر عبر الإدارة)
------------------------------------------------------------------------
local isMuted = false
local muteEndsAt = nil   -- os.clock()+remaining ، أو nil للدائم/غير مكتوم
local muteTick = 0       -- لإلغاء العدّاد القديم

local function muteText(): string
	if not isMuted then return "اكتب رسالة…" end
	if not muteEndsAt then return "🚫 مكتوم (دائم) — لا يمكنك الإرسال" end
	local rem = math.max(0, math.ceil(muteEndsAt - os.clock()))
	if rem <= 0 then return "🚫 مكتوم — لا يمكنك الإرسال" end
	local mins = math.floor(rem / 60)
	local secs = rem % 60
	if mins > 0 then
		return string.format("🚫 مكتوم — المتبقّي %d:%02d", mins, secs)
	end
	return string.format("🚫 مكتوم — المتبقّي %d ثانية", secs)
end

-- on=true: اكتم. remaining = ثواني متبقّية ، -1 = دائم.
local function setMuted(on: boolean, remaining)
	isMuted = on == true
	muteTick += 1
	local myTick = muteTick
	if isMuted then
		local rem = tonumber(remaining)
		muteEndsAt = (rem and rem >= 0) and (os.clock() + rem) or nil
		box.Text = ""
	else
		muteEndsAt = nil
	end
	box.TextEditable = not isMuted
	box.PlaceholderText = muteText()
	sendBtn.AutoButtonColor = not isMuted
	sendBtn.BackgroundColor3 = isMuted and Color3.fromRGB(96, 86, 116) or CYAN
	sendBtn.Text = isMuted and "🔇" or "إرسال"

	-- عدّاد تنازلي للكتم المؤقّت — يحدّث النص كل ثانية ويفكّ تلقائياً عند الانتهاء
	if isMuted and muteEndsAt then
		task.spawn(function()
			while myTick == muteTick and isMuted do
				if os.clock() >= muteEndsAt then
					setMuted(false)
					addMessage("النظام", "🔊 انتهت مدة الكتم — تقدر ترسل الآن.", PURPLE, { system = true })
					break
				end
				box.PlaceholderText = muteText()
				task.wait(1)
			end
		end)
	end
end

------------------------------------------------------------------------
-- 🔒 وضع الخاص (الهَمس): اختيار اللاعب + تبديل الوضع
------------------------------------------------------------------------
local privateMode = false
local whisperTargetId: number? = nil
local whisperTargetName: string? = nil

-- نافذة اختيار اللاعب (تظهر فوق قائمة الرسائل)
local picker = new("Frame", {
	Name = "PlayerPicker",
	Position = UDim2.new(0, 8, 0, 76),
	Size = UDim2.new(1, -16, 1, -124),
	BackgroundColor3 = Color3.fromRGB(14, 10, 26),
	BackgroundTransparency = 0.02,
	BorderSizePixel = 0,
	Visible = false,
	ZIndex = 5,
	Parent = root,
})
new("UICorner", { CornerRadius = UDim.new(0, 10), Parent = picker })
new("UIStroke", { Color = PINK, Thickness = 1.2, Transparency = 0.4, Parent = picker })
new("TextLabel", {
	Name = "PickerTitle",
	Size = UDim2.new(1, -12, 0, 26),
	Position = UDim2.new(0, 6, 0, 4),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBold,
	Text = "🔒 اختر لاعباً للدردشة الخاصة",
	TextColor3 = PINK,
	TextSize = 13,
	TextXAlignment = Enum.TextXAlignment.Right,
	ZIndex = 6,
	Parent = picker,
})
local pickerList = new("ScrollingFrame", {
	Name = "PickerList",
	Position = UDim2.new(0, 6, 0, 32),
	Size = UDim2.new(1, -12, 1, -38),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 4,
	ScrollBarImageColor3 = PINK,
	CanvasSize = UDim2.new(0, 0, 0, 0),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ScrollingDirection = Enum.ScrollingDirection.Y,
	ZIndex = 6,
	Parent = picker,
})
new("UIListLayout", {
	FillDirection = Enum.FillDirection.Vertical,
	SortOrder = Enum.SortOrder.LayoutOrder,
	Padding = UDim.new(0, 4),
	Parent = pickerList,
})

local function setTarget(plr: Player?)
	if plr then
		whisperTargetId = plr.UserId
		whisperTargetName = plr.DisplayName ~= "" and plr.DisplayName or plr.Name
		targetBtn.Text = "👤 إلى: " .. whisperTargetName
		box.PlaceholderText = "خاص إلى " .. whisperTargetName .. "…"
	else
		whisperTargetId = nil
		whisperTargetName = nil
		targetBtn.Text = "👤 اختر لاعباً…"
		box.PlaceholderText = "اكتب رسالتك…"
	end
end

local function rebuildPicker()
	for _, c in ipairs(pickerList:GetChildren()) do
		if c:IsA("TextButton") then c:Destroy() end
	end
	local others = {}
	for _, plr in ipairs(Players:GetPlayers()) do
		if plr ~= LocalPlayer then table.insert(others, plr) end
	end
	if #others == 0 then
		local empty = new("TextButton", {
			Size = UDim2.new(1, 0, 0, 30), BackgroundTransparency = 1,
			Font = Enum.Font.GothamMedium, Text = "لا يوجد لاعبون آخرون حالياً",
			TextColor3 = MUTED, TextSize = 12, AutoButtonColor = false, ZIndex = 6,
			Parent = pickerList,
		})
		return
	end
	for i, plr in ipairs(others) do
		local b = new("TextButton", {
			Name = "P_" .. plr.UserId,
			LayoutOrder = i,
			Size = UDim2.new(1, 0, 0, 32),
			BackgroundColor3 = Color3.fromRGB(30, 22, 48),
			BackgroundTransparency = 0.1,
			Font = Enum.Font.GothamMedium,
			Text = "👤 " .. (plr.DisplayName ~= "" and plr.DisplayName or plr.Name),
			TextColor3 = TEXT, TextSize = 13,
			TextXAlignment = Enum.TextXAlignment.Right,
			AutoButtonColor = true, ZIndex = 6,
			Parent = pickerList,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 8), Parent = b })
		new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingLeft = UDim.new(0, 8), Parent = b })
		b.MouseButton1Click:Connect(function()
			setTarget(plr)
			picker.Visible = false
		end)
	end
end

local function setPrivateMode(on: boolean)
	privateMode = on
	publicBtn.BackgroundColor3 = on and Color3.fromRGB(40, 30, 56) or CYAN
	publicBtn.TextColor3 = on and TEXT or Color3.fromRGB(8, 12, 20)
	privateBtn.BackgroundColor3 = on and PINK or Color3.fromRGB(40, 30, 56)
	privateBtn.TextColor3 = on and Color3.fromRGB(20, 8, 18) or TEXT
	targetBtn.Visible = on
	if on then
		setTarget(nil)
		rebuildPicker()
		picker.Visible = true
	else
		picker.Visible = false
		box.PlaceholderText = "اكتب رسالتك…"
	end
end

publicBtn.MouseButton1Click:Connect(function() setPrivateMode(false) end)
privateBtn.MouseButton1Click:Connect(function() setPrivateMode(true) end)
targetBtn.MouseButton1Click:Connect(function()
	rebuildPicker()
	picker.Visible = not picker.Visible
end)
Players.PlayerRemoving:Connect(function(plr)
	if whisperTargetId == plr.UserId then setTarget(nil) end
	if picker.Visible then rebuildPicker() end
end)

------------------------------------------------------------------------
-- الإرسال
------------------------------------------------------------------------
local function sendMessage()
	if isMuted then return end
	local text = box.Text
	text = text:gsub("^%s+", ""):gsub("%s+$", "")
	if text == "" then return end
	text = applyEmojiShortcodes(text)
	if #text > MAX_LEN then text = text:sub(1, MAX_LEN) end

	if privateMode then
		if not whisperTargetId then
			addMessage("النظام", "👤 اختر لاعباً أولاً لإرسال رسالة خاصة.", PINK, { system = true })
			rebuildPicker(); picker.Visible = true
			return
		end
		box.Text = ""
		whisperRemote:FireServer(whisperTargetId, text)
		return
	end

	box.Text = ""
	sayRemote:FireServer(text)
end

sendBtn.MouseButton1Click:Connect(sendMessage)

box.FocusLost:Connect(function(enterPressed)
	if enterPressed then
		sendMessage()
		-- إبقاء التركيز للكتابة المتتالية (اختياري — سلس على الكمبيوتر)
		task.defer(function()
			box:CaptureFocus()
		end)
	end
end)

------------------------------------------------------------------------
-- 😊 لوحة السمايلات (الإيموجي) — زر يفتح شبكة سمايلات تُدرَج في الرسالة
------------------------------------------------------------------------
local EMOJIS = {
	-- وجوه ومشاعر
	"😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "🙃",
	"😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
	"😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓",
	"😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔",
	"😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩",
	"🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
	"😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓",
	"🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑",
	"😬", "🙄", "😮", "😲", "🥱", "😴", "🤤", "😪",
	"😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒",
	"🤕", "🤑", "🤠", "😈", "👿", "👻", "💀", "👽",
	"🤖", "🎃", "😺", "😸", "😻", "😼", "😹", "😽",
	-- إيماءات وأيدي
	"👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰",
	"🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️",
	"✋", "🤚", "🖐️", "🖖", "👋", "🤝", "👏", "🙌",
	"👐", "🙏", "✍️", "💪", "🦾", "👀", "👁️", "🧠",
	-- قلوب ورموز
	"❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
	"🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
	"💘", "💝", "💟", "💯", "💢", "💥", "💫", "💦",
	"💨", "🔥", "⭐", "🌟", "✨", "⚡", "🌈", "☀️",
	-- احتفال وأشياء
	"🎉", "🎊", "🎈", "🎁", "🎀", "🏆", "🥇", "🥈",
	"🥉", "👑", "💎", "💰", "🪙", "🎮", "🕹️", "🎲",
	"🎬", "🍿", "🎤", "🎧", "🎵", "🎶", "📣", "🔔",
	-- طعام وحيوانات
	"🍕", "🍔", "🍟", "🌭", "🍩", "🍪", "🍰", "🧁",
	"🍫", "🍬", "🍭", "🍦", "☕", "🥤", "🍓", "🍉",
	"🐶", "🐱", "🦁", "🐯", "🐰", "🦊", "🐻", "🐼",
}

-- زر السمايلات داخل صفّ الإدخال (بين زر الإرسال وخانة الكتابة)
local emojiBtn = new("TextButton", {
	Name = "Emoji",
	Size = UDim2.new(0, 40, 1, 0),
	Position = UDim2.new(0, 84, 0, 0),
	BackgroundColor3 = Color3.fromRGB(40, 30, 66),
	BackgroundTransparency = 0.05,
	Font = Enum.Font.GothamBold,
	Text = "😊",
	TextColor3 = TEXT,
	TextSize = 20,
	AutoButtonColor = true,
	Parent = inputRow,
})
new("UICorner", { CornerRadius = UDim.new(0, 10), Parent = emojiBtn })
new("UIStroke", { Color = GOLD, Thickness = 1, Transparency = 0.5, Parent = emojiBtn })

-- اللوحة تظهر فوق صفّ الإدخال
local emojiPanel = new("Frame", {
	Name = "EmojiPanel",
	AnchorPoint = Vector2.new(0, 1),
	Position = UDim2.new(0, 8, 1, -52),
	Size = UDim2.new(1, -16, 0, 150),
	BackgroundColor3 = Color3.fromRGB(14, 10, 26),
	BackgroundTransparency = 0.02,
	BorderSizePixel = 0,
	Visible = false,
	ZIndex = 8,
	Parent = root,
})
new("UICorner", { CornerRadius = UDim.new(0, 12), Parent = emojiPanel })
new("UIStroke", { Color = PURPLE, Thickness = 1, Transparency = 0.4, Parent = emojiPanel })

local emojiScroll = new("ScrollingFrame", {
	Name = "Grid",
	Position = UDim2.new(0, 8, 0, 8),
	Size = UDim2.new(1, -16, 1, -16),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 4,
	ScrollBarImageColor3 = PURPLE,
	CanvasSize = UDim2.new(0, 0, 0, 0),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ZIndex = 8,
	Parent = emojiPanel,
})
new("UIGridLayout", {
	CellSize = UDim2.new(0, 40, 0, 40),
	CellPadding = UDim2.new(0, 6, 0, 6),
	HorizontalAlignment = Enum.HorizontalAlignment.Right,
	SortOrder = Enum.SortOrder.LayoutOrder,
	Parent = emojiScroll,
})

local function insertEmoji(e: string)
	if isMuted then return end
	local t = box.Text
	if #t + #e > MAX_LEN then return end
	box.Text = t .. e
	box:CaptureFocus()
end

for i, e in ipairs(EMOJIS) do
	local cell = new("TextButton", {
		Name = "E" .. i,
		BackgroundColor3 = Color3.fromRGB(30, 22, 50),
		BackgroundTransparency = 0.15,
		Font = Enum.Font.GothamBold,
		Text = e,
		TextSize = 22,
		TextColor3 = TEXT,
		AutoButtonColor = true,
		LayoutOrder = i,
		ZIndex = 8,
		Parent = emojiScroll,
	})
	new("UICorner", { CornerRadius = UDim.new(0, 8), Parent = cell })
	cell.MouseButton1Click:Connect(function() insertEmoji(e) end)
end

emojiBtn.MouseButton1Click:Connect(function()
	emojiPanel.Visible = not emojiPanel.Visible
end)

------------------------------------------------------------------------
-- 💬 فتح/تصغير اللوحة عبر الفقاعة + شارة الرسائل غير المقروءة
------------------------------------------------------------------------
local isOpen = false
local unread = 0

local function openChat()
	isOpen = true
	unread = 0
	badge.Visible = false
	launcher.Visible = false
	root.Visible = true
	root.Size = UDim2.new(0, 380, 0, 0)
	TweenService:Create(root, TweenInfo.new(0.18, Enum.EasingStyle.Quad),
		{ Size = UDim2.new(0, 380, 0, 300) }):Play()
end

local function closeChat()
	isOpen = false
	root.Visible = false
	launcher.Visible = true
	emojiPanel.Visible = false
	if privateMode then picker.Visible = false end
end

local function notifyUnread()
	if isOpen then return end
	unread += 1
	badge.Text = unread > 9 and "9+" or tostring(unread)
	badge.Visible = true
end

launcher.MouseButton1Click:Connect(openChat)
toggleBtn.MouseButton1Click:Connect(closeChat)

-- اختصار: مفتاح / يفتح اللوحة وصندوق الكتابة (على الكمبيوتر)
UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	if input.KeyCode == Enum.KeyCode.Slash then
		if not isOpen then openChat() end
		task.defer(function() box:CaptureFocus() end)
	end
end)

------------------------------------------------------------------------
-- استقبال الرسائل المبثوثة
------------------------------------------------------------------------
pushRemote.OnClientEvent:Connect(function(data)
	if typeof(data) ~= "table" then return end

	-- تحديث حالة الكتم (من الإدارة)
	if data.muteState ~= nil then
		setMuted(data.muteState == true, data.remaining)
		if data.muteState then
			local extra = ""
			if tonumber(data.remaining) and tonumber(data.remaining) >= 0 then
				extra = " (المتبقّي ~" .. tostring(math.ceil(tonumber(data.remaining) / 60)) .. " دقيقة)"
			elseif tonumber(data.remaining) == -1 then
				extra = " (دائم)"
			end
			addMessage("النظام", "🔇 تم كتمك من الإدارة — تقدر تقرأ بس ما تقدر ترسل." .. extra, PURPLE, { system = true })
		else
			addMessage("النظام", "🔊 رُفع الكتم عنك — تقدر ترسل الآن.", PURPLE, { system = true })
		end
		return
	end

	-- رسالة نظام موجّهة لك فقط
	if data.system then
		addMessage("النظام", typeof(data.text) == "string" and data.text or "", PURPLE, { system = true })
		return
	end

	-- 🔒 رسالة خاصة (همس) — يراها الطرفان فقط
	if data.private then
		local ptext = typeof(data.text) == "string" and data.text or ""
		if ptext == "" then return end
		local from = typeof(data.fromName) == "string" and data.fromName or "لاعب"
		local to   = typeof(data.toName) == "string" and data.toName or "لاعب"
		local label
		if data.mine then
			label = "[خاص] أنت ➜ " .. to
		else
			label = "[خاص] " .. from .. " ➜ أنت"
		end
		addMessage(label, ptext, PINK, { private = true })
		notifyUnread()
		return
	end

	local name = typeof(data.name) == "string" and data.name or "لاعب"
	local text = typeof(data.text) == "string" and data.text or ""
	if text == "" then return end

	-- رسالة إدارية ($) — تنسيق مميّز + صوت
	if typeof(data.adminMsg) == "string" and data.adminMsg ~= "" then
		addMessage(name, text, GOLD, { admin = data.adminMsg })
		notifyUnread()
		return
	end

	-- لون ووسم الاسم حسب الرتبة
	local role = typeof(data.role) == "string" and data.role or ""
	local tag, col
	if role == "owner" then
		tag, col = "👑 ", GOLD
	elseif role == "admin" then
		tag, col = "🛡️ ", Color3.fromRGB(255, 130, 130)
	elseif role == "mod" then
		tag, col = "🔰 ", Color3.fromRGB(120, 200, 255)
	elseif role == "staff" then
		tag, col = "🎬 ", GOLD
	elseif role == "vip" then
		tag, col = "⭐ ", VIPCOL
	else
		tag, col = "", CYAN
	end

	addMessage(tag .. name, text, col)
	notifyUnread()
end)

-- رسالة ترحيب أولى
addMessage("النظام", "مرحباً بك! اكتب رسالتك واضغط إرسال (أو Enter).", PURPLE)

-- واجهة عامة: تسمح للأنظمة الأخرى (مثل نظام المهام) بنشر رسالة نظام في الدردشة
_G.ChatSystemMessage = function(text)
	if typeof(text) == "string" and text ~= "" then
		pcall(function() addMessage("النظام", text, PURPLE, { system = true }) end)
	end
end

print("[CustomChat] العميل جاهز — واجهة الدردشة المخصّصة.")
