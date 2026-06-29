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
local RunService        = game:GetService("RunService")
local SoundService      = game:GetService("SoundService")
local Workspace         = game:GetService("Workspace")
local StarterGui        = game:GetService("StarterGui")
local TextChatService   = game:GetService("TextChatService")

local LocalPlayer = Players.LocalPlayer
local playerGui   = LocalPlayer:WaitForChild("PlayerGui")

------------------------------------------------------------------------
-- إظهار دردشة روبلوكس الافتراضية (الأيقونة أعلى يسار الشاشة) — اللاعب طلب
-- أن يكون زرّنا المخصّص بجانب زر الشات الأصلي أعلى اليسار، فنُبقي الواجهة
-- الرسمية ظاهرة ونضع زرّنا بجوارها (لا نخفيها).
------------------------------------------------------------------------
local function showDefaultChat()
	-- TextChatService الحديث: نُبقي نافذة الدردشة وشريط الإدخال الرسميَّين ظاهرين
	pcall(function()
		local win = TextChatService:FindFirstChildOfClass("ChatWindowConfiguration")
		if win then win.Enabled = true end
		local bar = TextChatService:FindFirstChildOfClass("ChatInputBarConfiguration")
		if bar then bar.Enabled = true end
	end)
	-- النظام القديم (Legacy): نُبقي واجهة الدردشة من CoreGui ظاهرة
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
	-- 🌐 إيقاف الترجمة التلقائية على حاويات الواجهة (النص العربي يظهر للجميع)
	if class == "ScreenGui" or class == "BillboardGui" or class == "SurfaceGui" then inst.AutoLocalize = false end
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

-- 💬 زر مُصغّر (فقاعة) أسفل الشريط العلوي لروبلوكس على اليسار — يفتح/يخفي لوحة الدردشة.
-- كان سابقاً في صف أيقونات روبلوكس (x=160,y=4) فصار متلاصقاً ومحجوباً؛ نُقل لمكان واضح
-- تحت الشريط العلوي (y=62) بعيداً عن أيقونات روبلوكس فيبين واضحاً ومنفصلاً.
local launcher = new("TextButton", {
	Name = "ChatLauncher",
	AnchorPoint = Vector2.new(0, 0),
	Position = UDim2.new(0, 16, 0, 62),
	Size = UDim2.new(0, 42, 0, 42),
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
	Position = UDim2.new(0, 12, 0, 112),   -- أسفل فقاعة الشات (التي نُقلت إلى y=62)
	Size = UDim2.new(0, 380, 0, 300),
	BackgroundColor3 = CARD,
	BackgroundTransparency = 0.12,
	BorderSizePixel = 0,
	Visible = false,            -- تبدأ مخفيّة (مصغّرة) — تُفتح من الفقاعة
	Parent = gui,
})
new("UICorner", { CornerRadius = UDim.new(0, 14), Parent = root })
new("UIStroke", { Color = PURPLE, Thickness = 1.5, Transparency = 0.35, Parent = root })
-- حد أدنى صغير بما يكفي لأصغر شاشات الجوال (الأفقية) — التخطيط المتجاوب أدناه هو من يحسب المقاس الفعلي
new("UISizeConstraint", { MinSize = Vector2.new(220, 120), MaxSize = Vector2.new(520, 460), Parent = root })

-- شريط العنوان
local header = new("Frame", {
	Name = "Header",
	Size = UDim2.new(1, 0, 0, 36),
	BackgroundTransparency = 1,
	Parent = root,
})
new("TextLabel", {
	Name = "Title",
	Size = UDim2.new(1, -88, 1, 0),
	Position = UDim2.new(0, 44, 0, 0),
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
local ADMIN_AR = { OWNER = "المالك", ADMIN = "أدمن", MODERATOR = "مشرف" }
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
				icon, (ADMIN_AR[label] or label), escapeRich(name), escapeRich(text)),
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
	"🥉", "👑", "💎", "💰", "💵", "🎮", "🕹️", "🎲",
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

-- 📱 تخطيط متجاوب: مقاس وموضع اللوحة يُحسبان من حجم الشاشة الفعلي (وكيبورد الجوال)
-- عند كل فتح/تدوير/تغيّر — فلا تخرج اللوحة (وصفّ الكتابة بقاعها) عن حدود الشاشة على أي جهاز.
local PANEL_TOP   = 56    -- أسفل شريط روبلوكس العلوي
local PANEL_MARGIN = 10
local openTween: Tween? = nil   -- توين الفتح الجاري — يُلغى عند أي إعادة تخطيط كي لا يطغى على المقاس الجديد
local function layoutPanel()
	if openTween then openTween:Cancel(); openTween = nil end
	local vp = gui.AbsoluteSize
	local w = math.clamp(vp.X - 24, 220, 380)
	local bottomLimit = vp.Y - PANEL_MARGIN
	if UserInputService.OnScreenKeyboardVisible then
		-- لا يغطّي كيبورد الجوال صفّ الكتابة: القاع يبقى فوق أعلى الكيبورد
		bottomLimit = math.min(bottomLimit, UserInputService.OnScreenKeyboardPosition.Y - 6)
	end
	local h = math.clamp(bottomLimit - PANEL_TOP, 120, 300)
	-- وضع مضغوط للارتفاعات الصغيرة جداً (كيبورد على شاشة صغيرة): يُخفى صفّ الوضع
	-- وترتفع قائمة الرسائل مكانه كي تبقى مرئية (بدل ارتفاع سالب/صفري)
	local compact = h < 170
	modeRow.Visible = not compact
	if compact then
		list.Position = UDim2.new(0, 8, 0, 40)
		list.Size = UDim2.new(1, -16, 1, -88)
		picker.Position = UDim2.new(0, 8, 0, 40)
		picker.Size = UDim2.new(1, -16, 1, -88)
	else
		list.Position = UDim2.new(0, 8, 0, 76)
		list.Size = UDim2.new(1, -16, 1, -124)
		picker.Position = UDim2.new(0, 8, 0, 76)
		picker.Size = UDim2.new(1, -16, 1, -124)
	end
	local y
	if vp.Y >= 520 and not UserInputService.OnScreenKeyboardVisible then
		y = 112                                -- الشاشات الطويلة (كمبيوتر): الموضع المعتاد تحت الفقاعة
	else
		y = math.max(PANEL_TOP, bottomLimit - h) -- الجوال: التصق بالمساحة المتاحة كاملة
	end
	root.Position = UDim2.new(0, 12, 0, y)
	root.Size = UDim2.new(0, w, 0, h)
end

gui:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
	if root.Visible then layoutPanel() end
end)
UserInputService:GetPropertyChangedSignal("OnScreenKeyboardVisible"):Connect(function()
	if root.Visible then layoutPanel() end
end)
UserInputService:GetPropertyChangedSignal("OnScreenKeyboardPosition"):Connect(function()
	if root.Visible then layoutPanel() end
end)

local function openChat()
	isOpen = true
	unread = 0
	badge.Visible = false
	launcher.Visible = false
	root.Visible = true
	layoutPanel()
	local target = root.Size
	root.Size = UDim2.new(0, target.X.Offset, 0, 0)
	local tw = TweenService:Create(root, TweenInfo.new(0.18, Enum.EasingStyle.Quad), { Size = target })
	openTween = tw
	tw.Completed:Connect(function()
		if openTween == tw then openTween = nil end
	end)
	tw:Play()
end

local function closeChat()
	isOpen = false
	if openTween then openTween:Cancel(); openTween = nil end
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
-- 🧹 مسح كل رسائل الواجهة (أمر /clear)
------------------------------------------------------------------------
local function clearMessages()
	for _, c in ipairs(list:GetChildren()) do
		if c:IsA("TextLabel") or c:IsA("Frame") then c:Destroy() end
	end
end

------------------------------------------------------------------------
-- ⌘ لوحة الأوامر — تشرح الأوامر وتبيّن المتاح لك مقابل المقفول
------------------------------------------------------------------------
local OKGREEN = Color3.fromRGB(120, 220, 140)
local LOCKCOL = Color3.fromRGB(255, 184, 92)
local OFFCOL  = Color3.fromRGB(232, 96, 110)

local cmdList: { any } = {}    -- آخر إعدادات وصلت من السيرفر
local myWeight = 0             -- وزن رتبتي (لتحديد المتاح)

-- طبقة معتمة خلف اللوحة
local cmdBackdrop = new("TextButton", {
	Name = "CmdBackdrop", Text = "", AutoButtonColor = false, Modal = true,
	BackgroundColor3 = Color3.fromRGB(0, 0, 0), BackgroundTransparency = 0.5,
	Size = UDim2.fromScale(1, 1), Visible = false, ZIndex = 20, Parent = gui,
})

local cmdPanel = new("Frame", {
	Name = "CommandsPanel",
	AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
	Size = UDim2.fromOffset(440, 480), BackgroundColor3 = CARD, BackgroundTransparency = 0.02,
	BorderSizePixel = 0, ZIndex = 21, Parent = cmdBackdrop,
})
new("UICorner", { CornerRadius = UDim.new(0, 16), Parent = cmdPanel })
new("UIStroke", { Color = PURPLE, Thickness = 1.5, Transparency = 0.3, Parent = cmdPanel })
new("UISizeConstraint", { MinSize = Vector2.new(300, 320), MaxSize = Vector2.new(520, 560), Parent = cmdPanel })

new("TextLabel", {
	Name = "Title", BackgroundTransparency = 1, Text = "📋 لوحة الأوامر",
	Font = Enum.Font.GothamBlack, TextSize = 20, TextColor3 = GOLD,
	Size = UDim2.new(1, -56, 0, 40), Position = UDim2.fromOffset(14, 10),
	TextXAlignment = Enum.TextXAlignment.Right, ZIndex = 22, Parent = cmdPanel,
})
local cmdClose = new("TextButton", {
	Name = "Close", AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 12, 0, 30),
	Size = UDim2.fromOffset(30, 30), BackgroundColor3 = Color3.fromRGB(48, 40, 64),
	Font = Enum.Font.GothamBold, Text = "×", TextColor3 = TEXT, TextSize = 22,
	AutoButtonColor = true, ZIndex = 22, Parent = cmdPanel,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = cmdClose })

new("TextLabel", {
	Name = "Hint", BackgroundTransparency = 1,
	Text = "اكتب الأمر في الدردشة مسبوقاً بـ «/». الأخضر متاح لك، والمقفول للمشرفين/الأداريين حسب ضبط الإدارة.",
	Font = Enum.Font.GothamMedium, TextSize = 12, TextColor3 = MUTED, TextWrapped = true,
	Size = UDim2.new(1, -28, 0, 40), Position = UDim2.fromOffset(14, 48),
	TextXAlignment = Enum.TextXAlignment.Right, ZIndex = 22, Parent = cmdPanel,
})

local cmdScroll = new("ScrollingFrame", {
	Name = "List", BackgroundTransparency = 1, BorderSizePixel = 0,
	Position = UDim2.fromOffset(14, 92), Size = UDim2.new(1, -28, 1, -106),
	CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ScrollBarThickness = 6, ScrollBarImageColor3 = PURPLE, ZIndex = 22, Parent = cmdPanel,
})
new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder, Parent = cmdScroll })

-- صفّ أمر واحد: الوصف يميناً + شارة الحالة يساراً
local function addCmdRow(orderIdx: number, label: string, statusText: string, statusColor: Color3)
	local row = new("Frame", {
		BackgroundColor3 = Color3.fromRGB(24, 18, 42), BackgroundTransparency = 0.15,
		Size = UDim2.new(1, 0, 0, 42), LayoutOrder = orderIdx, ZIndex = 22, Parent = cmdScroll,
	})
	new("UICorner", { CornerRadius = UDim.new(0, 10), Parent = row })
	new("TextLabel", {
		BackgroundTransparency = 1, Text = label, Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT,
		Size = UDim2.new(1, -130, 1, 0), Position = UDim2.new(0, 122, 0, 0),
		TextXAlignment = Enum.TextXAlignment.Right, TextTruncate = Enum.TextTruncate.AtEnd, ZIndex = 22, Parent = row,
	})
	local badge2 = new("TextLabel", {
		BackgroundColor3 = statusColor, BackgroundTransparency = 0.82,
		AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Size = UDim2.fromOffset(108, 26),
		Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = statusColor, Text = statusText,
		ZIndex = 22, Parent = row,
	})
	new("UICorner", { CornerRadius = UDim.new(0, 8), Parent = badge2 })
	new("UIStroke", { Color = statusColor, Thickness = 1, Transparency = 0.4, Parent = badge2 })
end

local function statusFor(level: number): (string, Color3)
	if level >= 99 then
		return "🚫 معطّل", OFFCOL
	elseif myWeight >= level then
		return "✓ متاح لك", OKGREEN
	elseif level >= 3 then
		return "🛡️ للأداريين", LOCKCOL
	else
		return "🔰 للمشرفين", LOCKCOL
	end
end

local function rebuildCommands()
	for _, c in ipairs(cmdScroll:GetChildren()) do
		if c:IsA("Frame") then c:Destroy() end
	end
	-- أمران دائماً متاحان للجميع وغير قابلين للتعطيل
	addCmdRow(1, "❓ /help — تفتح هذه اللوحة", "✓ متاح لك", OKGREEN)
	addCmdRow(2, "🧹 /clear — مسح الدردشة", "✓ متاح لك", OKGREEN)
	local i = 3
	for _, d in ipairs(cmdList) do
		local lvl = tonumber(d.level) or 0
		local st, col = statusFor(lvl)
		addCmdRow(i, tostring(d.label or ("/" .. tostring(d.key))), st, col)
		i += 1
	end
end

local cmdPanelOpen = false
local function openCommands()
	cmdPanelOpen = true
	rebuildCommands()
	cmdBackdrop.Visible = true
end
local function closeCommands()
	cmdPanelOpen = false
	cmdBackdrop.Visible = false
end
cmdClose.MouseButton1Click:Connect(closeCommands)
cmdBackdrop.MouseButton1Click:Connect(closeCommands)

-- زر ⌘ في رأس لوحة الدردشة يفتح لوحة الأوامر
local cmdBtn = new("TextButton", {
	Name = "CmdBtn", AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0),
	Size = UDim2.fromOffset(28, 28), BackgroundColor3 = GOLD, BackgroundTransparency = 0.2,
	Font = Enum.Font.GothamBold, Text = "📋", TextColor3 = Color3.fromRGB(20, 16, 8), TextSize = 15,
	AutoButtonColor = true, Parent = header,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = cmdBtn })
cmdBtn.MouseButton1Click:Connect(openCommands)

------------------------------------------------------------------------
-- 🕊️ متحكّم الطيران (أمر /fly) — BodyGyro + BodyVelocity مع WASD ومسافة/كنترول
------------------------------------------------------------------------
local flying = false
local flySpeed = 60
local flyBV: BodyVelocity? = nil
local flyBG: BodyGyro? = nil
local flyConns: { RBXScriptConnection } = {}
local move = { f = 0, b = 0, l = 0, r = 0, u = 0, d = 0 }
local boost = false
local mUp, mDown, mBoost = false, false, false   -- حالة أزرار اللمس (جوال)

-- 📱 لوحة أزرار الطيران للجوال (تظهر فقط أثناء الطيران على الأجهزة اللمسية)
local flyPad: Frame? = nil
local function buildFlyPad()
	if flyPad or not UserInputService.TouchEnabled then return end
	local pad = new("Frame", {
		Name = "FlyPad", AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -22, 1, -150), Size = UDim2.fromOffset(64, 210),
		BackgroundTransparency = 1, Visible = false, Parent = gui,
	})
	new("UIListLayout", {
		Padding = UDim.new(0, 10), FillDirection = Enum.FillDirection.Vertical,
		VerticalAlignment = Enum.VerticalAlignment.Bottom,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		SortOrder = Enum.SortOrder.LayoutOrder, Parent = pad,
	})
	local function padBtn(txt, color, order)
		local b = new("TextButton", {
			Size = UDim2.fromOffset(60, 60), BackgroundColor3 = color, BackgroundTransparency = 0.15,
			Font = Enum.Font.GothamBold, Text = txt, TextColor3 = TEXT, TextSize = 26,
			AutoButtonColor = true, LayoutOrder = order, Parent = pad,
		})
		new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = b })
		new("UIStroke", { Color = GOLD, Thickness = 1.5, Transparency = 0.3, Parent = b })
		return b
	end
	local upB    = padBtn("⬆", Color3.fromRGB(70, 140, 240), 1)
	local boostB = padBtn("⚡", Color3.fromRGB(240, 170, 60), 2)
	local downB  = padBtn("⬇", Color3.fromRGB(70, 140, 240), 3)
	local function hold(btn, setter)
		btn.MouseButton1Down:Connect(function() setter(true) end)
		btn.MouseButton1Up:Connect(function() setter(false) end)
		btn.MouseLeave:Connect(function() setter(false) end)
	end
	hold(upB,    function(v) mUp = v end)
	hold(downB,  function(v) mDown = v end)
	hold(boostB, function(v) mBoost = v end)
	flyPad = pad
end

local function stopFly()
	flying = false
	for _, c in ipairs(flyConns) do pcall(function() c:Disconnect() end) end
	flyConns = {}
	if flyBV then flyBV:Destroy(); flyBV = nil end
	if flyBG then flyBG:Destroy(); flyBG = nil end
	move = { f = 0, b = 0, l = 0, r = 0, u = 0, d = 0 }
	mUp, mDown, mBoost = false, false, false
	if flyPad then flyPad.Visible = false end
	local ch = LocalPlayer.Character
	local hum = ch and ch:FindFirstChildOfClass("Humanoid")
	if hum then hum.PlatformStand = false end
end

local function startFly(speed: number?)
	local ch = LocalPlayer.Character
	if not ch then return end
	local flyRoot = ch:FindFirstChild("HumanoidRootPart") :: BasePart?
	local hum = ch:FindFirstChildOfClass("Humanoid")
	if not flyRoot then return end
	flySpeed = speed or flySpeed
	flying = true
	if hum then hum.PlatformStand = true end
	buildFlyPad()
	if flyPad then flyPad.Visible = true end

	local bg = Instance.new("BodyGyro")
	bg.P = 9e4
	bg.MaxTorque = Vector3.new(9e9, 9e9, 9e9)
	bg.CFrame = flyRoot.CFrame
	bg.Parent = flyRoot
	flyBG = bg

	local bv = Instance.new("BodyVelocity")
	bv.MaxForce = Vector3.new(9e9, 9e9, 9e9)
	bv.Velocity = Vector3.zero
	bv.Parent = flyRoot
	flyBV = bv

	table.insert(flyConns, UserInputService.InputBegan:Connect(function(inp, gpe)
		if gpe then return end
		local k = inp.KeyCode
		if k == Enum.KeyCode.W then move.f = 1
		elseif k == Enum.KeyCode.S then move.b = 1
		elseif k == Enum.KeyCode.A then move.l = 1
		elseif k == Enum.KeyCode.D then move.r = 1
		elseif k == Enum.KeyCode.Space then move.u = 1
		elseif k == Enum.KeyCode.LeftControl or k == Enum.KeyCode.RightControl then move.d = 1
		elseif k == Enum.KeyCode.LeftShift or k == Enum.KeyCode.RightShift then boost = true
		end
	end))
	table.insert(flyConns, UserInputService.InputEnded:Connect(function(inp)
		local k = inp.KeyCode
		if k == Enum.KeyCode.W then move.f = 0
		elseif k == Enum.KeyCode.S then move.b = 0
		elseif k == Enum.KeyCode.A then move.l = 0
		elseif k == Enum.KeyCode.D then move.r = 0
		elseif k == Enum.KeyCode.Space then move.u = 0
		elseif k == Enum.KeyCode.LeftControl or k == Enum.KeyCode.RightControl then move.d = 0
		elseif k == Enum.KeyCode.LeftShift or k == Enum.KeyCode.RightShift then boost = false
		end
	end))
	table.insert(flyConns, RunService.RenderStepped:Connect(function()
		local cam = Workspace.CurrentCamera
		if not (flyBV and flyBG and cam) then return end
		flyBG.CFrame = cam.CFrame
		local dir = Vector3.zero
		-- أفقي: أزرار الكيبورد (كمبيوتر) — تطير باتجاه نظر الكاميرا
		if move.f == 1 then dir += cam.CFrame.LookVector end
		if move.b == 1 then dir -= cam.CFrame.LookVector end
		if move.r == 1 then dir += cam.CFrame.RightVector end
		if move.l == 1 then dir -= cam.CFrame.RightVector end
		-- أفقي: عصا التحكّم (جوال) — تُستخدم حين لا يوجد إدخال كيبورد أفقي.
		-- MoveDirection محسوبة نسبةً للكاميرا أصلاً، فتغطّي الجوال والكمبيوتر معاً.
		local curHum = ch:FindFirstChildOfClass("Humanoid")
		if move.f == 0 and move.b == 0 and move.l == 0 and move.r == 0
			and curHum and curHum.MoveDirection.Magnitude > 0.05 then
			dir += curHum.MoveDirection
		end
		-- عمودي: كيبورد (مسافة/Ctrl) أو أزرار اللمس (⬆/⬇)
		if move.u == 1 or mUp then dir += Vector3.new(0, 1, 0) end
		if move.d == 1 or mDown then dir -= Vector3.new(0, 1, 0) end
		if dir.Magnitude > 0 then
			flyBV.Velocity = dir.Unit * flySpeed * ((boost or mBoost) and 2.2 or 1)
		else
			flyBV.Velocity = Vector3.zero
		end
	end))
end

-- لو مات/ظهر من جديد وهو طائر، أوقف الطيران (تنظيف آمن)
LocalPlayer.CharacterAdded:Connect(function()
	if flying then stopFly() end
end)

------------------------------------------------------------------------
-- استقبال الرسائل المبثوثة
------------------------------------------------------------------------
pushRemote.OnClientEvent:Connect(function(data)
	if typeof(data) ~= "table" then return end

	-- ⌘ إعدادات الأوامر (قائمة + وزن رتبتي) — لتحديث لوحة الأوامر
	if data.cmdConfig ~= nil then
		if typeof(data.cmdConfig) == "table" then cmdList = data.cmdConfig end
		if tonumber(data.myWeight) then myWeight = tonumber(data.myWeight) :: number end
		if cmdPanelOpen then rebuildCommands() end
		return
	end

	-- ❓ فتح لوحة الأوامر (أمر /help)
	if data.openCommands then
		openCommands()
		return
	end

	-- 🧹 مسح الدردشة (أمر /clear)
	if data.clearChat then
		clearMessages()
		return
	end

	-- 🕊️ تبديل الطيران (أمر /fly) — السيرفر تحقّق من الصلاحية مسبقاً
	if data.flyToggle then
		if flying then
			stopFly()
			addMessage("النظام", "🕊️ تم إيقاف الطيران.", PURPLE, { system = true })
		else
			startFly(tonumber(data.flySpeed))
			local tip = if UserInputService.TouchEnabled
				then "🕊️ تم تفعيل الطيران — حرّك بعصا التحكّم، وأزرار ⬆/⬇ للأعلى/الأسفل و⚡ للتسريع. اكتب /fly مرة ثانية للإيقاف."
				else "🕊️ تم تفعيل الطيران — WASD للتحرك، مسافة للأعلى، Ctrl للأسفل، Shift للسرعة. اكتب /fly مرة ثانية للإيقاف."
			addMessage("النظام", tip, PURPLE, { system = true })
		end
		return
	end

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
