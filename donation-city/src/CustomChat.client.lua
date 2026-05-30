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

local LocalPlayer = Players.LocalPlayer
local playerGui   = LocalPlayer:WaitForChild("PlayerGui")

-- الريموتات (السيرفر ينشئها)
local folder     = ReplicatedStorage:WaitForChild("CustomChat", 30)
if not folder then return end
local sayRemote  = folder:WaitForChild("Say")
local pushRemote = folder:WaitForChild("Push")

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

local MAX_MESSAGES = 60          -- أقصى عدد رسائل محفوظة بالواجهة
local MAX_LEN      = 200

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
	IgnoreGuiInset = false,
	Parent = playerGui,
})

local root = new("Frame", {
	Name = "ChatRoot",
	AnchorPoint = Vector2.new(0, 1),
	Position = UDim2.new(0, 12, 1, -12),
	Size = UDim2.new(0, 380, 0, 250),
	BackgroundColor3 = CARD,
	BackgroundTransparency = 0.15,
	BorderSizePixel = 0,
	Parent = gui,
})
new("UICorner", { CornerRadius = UDim.new(0, 14), Parent = root })
new("UIStroke", { Color = PURPLE, Thickness = 1.5, Transparency = 0.35, Parent = root })
new("UISizeConstraint", { MinSize = Vector2.new(240, 140), MaxSize = Vector2.new(520, 420), Parent = root })

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

-- قائمة الرسائل
local list = new("ScrollingFrame", {
	Name = "Messages",
	Position = UDim2.new(0, 8, 0, 40),
	Size = UDim2.new(1, -16, 1, -88),
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
	Position = UDim2.new(0, 84, 0, 0),
	Size = UDim2.new(1, -84, 1, 0),
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
-- الإرسال
------------------------------------------------------------------------
local function sendMessage()
	if isMuted then return end
	local text = box.Text
	text = text:gsub("^%s+", ""):gsub("%s+$", "")
	if text == "" then return end
	if #text > MAX_LEN then text = text:sub(1, MAX_LEN) end
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

	local name = typeof(data.name) == "string" and data.name or "لاعب"
	local text = typeof(data.text) == "string" and data.text or ""
	if text == "" then return end

	-- رسالة إدارية ($) — تنسيق مميّز + صوت
	if typeof(data.adminMsg) == "string" and data.adminMsg ~= "" then
		addMessage(name, text, GOLD, { admin = data.adminMsg })
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
end)

------------------------------------------------------------------------
-- طيّ / فتح
------------------------------------------------------------------------
local collapsed = false
local OPEN_SIZE = UDim2.new(0, 380, 0, 250)

toggleBtn.MouseButton1Click:Connect(function()
	collapsed = not collapsed
	list.Visible = not collapsed
	inputRow.Visible = not collapsed
	toggleBtn.Text = collapsed and "▢" or "—"
	local goal = collapsed and UDim2.new(0, 380, 0, 36) or OPEN_SIZE
	TweenService:Create(root, TweenInfo.new(0.2, Enum.EasingStyle.Quad), { Size = goal }):Play()
end)

-- اختصار: مفتاح / يفتح صندوق الكتابة (مثل دردشة روبلوكس) على الكمبيوتر
UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	if input.KeyCode == Enum.KeyCode.Slash then
		if collapsed then toggleBtn:Activate() end
		task.defer(function() box:CaptureFocus() end)
	end
end)

-- رسالة ترحيب أولى
addMessage("النظام", "مرحباً بك! اكتب رسالتك واضغط إرسال (أو Enter).", PURPLE)

print("[CustomChat] العميل جاهز — واجهة الدردشة المخصّصة.")
