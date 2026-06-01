--[[
╔══════════════════════════════════════════════════════════════════════╗
║  واجهة المهام + الترحيب + دليل المبتدئين — MISSION CLIENT (Client)     ║
║  المكان: StarterPlayerScripts     ·     النوع: LocalScript             ║
║                                                                        ║
║  • زر «📋 المهام» يفتح لوحة: المهام اليومية (تقدّم + جائزة) + الأسبوعية ║
║    + عدّاد التحديث القادم + مكافأة إتمام الكل.                          ║
║  • رسالة ترحيب تلقائية في الدردشة + رسالة خاصة لأول مرة.               ║
║  • لوحة إرشاد للمبتدئين تظهر مرّة واحدة فقط (أول دخول).                 ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")
local StarterGui        = game:GetService("StarterGui")

local player    = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

----------------------------------------------------------------------
-- Remotes
----------------------------------------------------------------------
local folder        = ReplicatedStorage:WaitForChild("MissionRemotes", 30)
local syncRemote    = folder and folder:WaitForChild("Sync", 10)
local welcomeRemote = folder and folder:WaitForChild("Welcome", 10)
local requestRemote = folder and folder:WaitForChild("Request", 10)

----------------------------------------------------------------------
-- ألوان
----------------------------------------------------------------------
local DARK   = Color3.fromRGB(18, 15, 30)
local PANEL  = Color3.fromRGB(28, 23, 46)
local ROW    = Color3.fromRGB(38, 32, 60)
local PURPLE = Color3.fromRGB(168, 92, 255)
local CYAN   = Color3.fromRGB(70, 226, 255)
local GOLD   = Color3.fromRGB(255, 205, 90)
local GREEN  = Color3.fromRGB(90, 230, 140)
local WHITE  = Color3.fromRGB(245, 245, 255)

local function new(class, props, children)
	local o = Instance.new(class)
	for k, v in pairs(props or {}) do o[k] = v end
	for _, c in ipairs(children or {}) do c.Parent = o end
	return o
end

local function corner(r) return new("UICorner", { CornerRadius = UDim.new(0, r or 8) }) end
local function stroke(c, t) return new("UIStroke", { Color = c or PURPLE, Thickness = t or 1.5, Transparency = 0.2 }) end

----------------------------------------------------------------------
-- ScreenGui + زر الفتح
----------------------------------------------------------------------
local gui = new("ScreenGui", {
	Name = "MissionsGui", ResetOnSpawn = false, IgnoreGuiInset = true,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling, Parent = playerGui,
})

local openBtn = new("TextButton", {
	Name = "OpenBtn", Parent = gui,
	-- أعلى اليسار تحت الشريط العلوي لروبلوكس (لا يتداخل مع أزرار روبلوكس ولا الوسط)
	AnchorPoint = Vector2.new(0, 0), Position = UDim2.new(0, 16, 0, 62),
	Size = UDim2.new(0, 116, 0, 44),
	BackgroundColor3 = PURPLE, Text = "📋 المهام",
	Font = Enum.Font.GothamBold, TextSize = 18, TextColor3 = WHITE,
}, { corner(10), stroke(GOLD, 1.5) })

-- شارة عدّاد المهام المكتملة
local badge = new("TextLabel", {
	Name = "Badge", Parent = openBtn,
	AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 4, 0, -6),
	Size = UDim2.new(0, 30, 0, 20), BackgroundColor3 = GREEN,
	Text = "0/0", Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = DARK,
}, { corner(8) })

----------------------------------------------------------------------
-- اللوحة
----------------------------------------------------------------------
local panel = new("Frame", {
	Name = "Panel", Parent = gui, Visible = false,
	AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0),
	Size = UDim2.new(0, 460, 0, 540), BackgroundColor3 = DARK,
}, { corner(16), stroke(PURPLE, 2) })

local header = new("TextLabel", {
	Parent = panel, Position = UDim2.new(0, 0, 0, 0), Size = UDim2.new(1, 0, 0, 52),
	BackgroundColor3 = PANEL, Text = "📋 المهام اليومية", Font = Enum.Font.GothamBlack,
	TextSize = 22, TextColor3 = GOLD,
}, { corner(16) })

local closeBtn = new("TextButton", {
	Parent = panel, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -10, 0, 10),
	Size = UDim2.new(0, 34, 0, 34), BackgroundColor3 = Color3.fromRGB(200, 70, 70),
	Text = "×", Font = Enum.Font.GothamBold, TextSize = 24, TextColor3 = WHITE,
}, { corner(8) })

local timerLbl = new("TextLabel", {
	Parent = panel, Position = UDim2.new(0, 12, 0, 56), Size = UDim2.new(1, -24, 0, 22),
	BackgroundTransparency = 1, Text = "", Font = Enum.Font.Gotham, TextSize = 13,
	TextColor3 = CYAN, TextXAlignment = Enum.TextXAlignment.Right,
})

local scroll = new("ScrollingFrame", {
	Parent = panel, Position = UDim2.new(0, 10, 0, 82), Size = UDim2.new(1, -20, 1, -94),
	BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 6,
	CanvasSize = UDim2.new(0, 0, 0, 0), AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ScrollBarImageColor3 = PURPLE,
}, {
	new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	new("UIPadding", { PaddingTop = UDim.new(0, 2), PaddingBottom = UDim.new(0, 6) }),
})

----------------------------------------------------------------------
-- بناء صف مهمة
----------------------------------------------------------------------
local CAT_EMOJI = {
	cinema = "🎬", booth = "🛍️", beach = "🏖️", parkour = "🧗", social = "👥",
}

local function makeRow(order, m)
	local pct = math.clamp((m.prog or 0) / math.max(1, m.target), 0, 1)
	local row = new("Frame", {
		LayoutOrder = order, Size = UDim2.new(1, 0, 0, 64), BackgroundColor3 = ROW,
	}, { corner(10) })
	if m.done then stroke(GREEN, 2).Parent = row end

	new("TextLabel", {
		Parent = row, Position = UDim2.new(0, 10, 0, 6), Size = UDim2.new(1, -20, 0, 22),
		BackgroundTransparency = 1, Text = (CAT_EMOJI[m.cat] or "•") .. "  " .. (m.desc or ""),
		Font = Enum.Font.GothamSemibold, TextSize = 15, TextColor3 = WHITE,
		TextXAlignment = Enum.TextXAlignment.Right, TextTruncate = Enum.TextTruncate.AtEnd,
	})

	-- شريط التقدّم
	local barBg = new("Frame", {
		Parent = row, Position = UDim2.new(0, 10, 0, 34), Size = UDim2.new(1, -120, 0, 16),
		BackgroundColor3 = Color3.fromRGB(20, 18, 32),
	}, { corner(8) })
	new("Frame", {
		Parent = barBg, Size = UDim2.new(pct, 0, 1, 0),
		BackgroundColor3 = m.done and GREEN or CYAN,
	}, { corner(8) })

	local progTxt
	if m.time then
		progTxt = string.format("%d/%d ث", math.floor(m.prog or 0), m.target)
	else
		progTxt = string.format("%d/%d", math.floor(m.prog or 0), m.target)
	end
	new("TextLabel", {
		Parent = barBg, BackgroundTransparency = 1, Size = UDim2.new(1, 0, 1, 0),
		Text = m.done and "✓ مكتملة" or progTxt, Font = Enum.Font.GothamBold,
		TextSize = 12, TextColor3 = WHITE,
	})

	new("TextLabel", {
		Parent = row, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -10, 0, 34),
		Size = UDim2.new(0, 96, 0, 16), BackgroundTransparency = 1,
		Text = m.done and "✅ +" .. m.coins or ("💰 +" .. m.coins), Font = Enum.Font.GothamBold,
		TextSize = 14, TextColor3 = m.done and GREEN or GOLD,
		TextXAlignment = Enum.TextXAlignment.Right,
	})
	return row
end

----------------------------------------------------------------------
-- العرض
----------------------------------------------------------------------
local lastPayload = nil

local function render(payload)
	lastPayload = payload
	for _, c in ipairs(scroll:GetChildren()) do
		if c:IsA("Frame") then c:Destroy() end
	end
	local order = 0
	local doneCount = 0
	for _, m in ipairs(payload.daily or {}) do
		order += 1
		makeRow(order, m).Parent = scroll
		if m.done then doneCount += 1 end
	end
	badge.Text = doneCount .. "/" .. #(payload.daily or {})

	-- مكافأة إتمام الكل
	order += 1
	new("TextLabel", {
		LayoutOrder = order, Parent = scroll, Size = UDim2.new(1, 0, 0, 40),
		BackgroundColor3 = payload.bonusDone and GREEN or Color3.fromRGB(60, 50, 20),
		Text = (payload.bonusDone and "🎯 مكافأة الإتمام: مستلمة!" or
			("🎯 أكمل كل المهام → +" .. (payload.bonusCoins or 0) .. " كوينز + لقب «منجِز اليوم»")),
		Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = payload.bonusDone and DARK or GOLD,
	}, { corner(10) })

	-- المهمة الأسبوعية
	if payload.weekly then
		local w = payload.weekly
		order += 1
		new("TextLabel", {
			LayoutOrder = order, Parent = scroll, Size = UDim2.new(1, 0, 0, 26),
			BackgroundTransparency = 1, Text = "🏅 المهمة الأسبوعية الكبرى",
			Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = PURPLE,
			TextXAlignment = Enum.TextXAlignment.Right,
		})
		order += 1
		makeRow(order, { desc = w.desc, cat = "social", prog = w.prog, target = w.target,
			coins = w.coins, done = w.done, time = false }).Parent = scroll
	end
end

if syncRemote then
	syncRemote.OnClientEvent:Connect(render)
end

----------------------------------------------------------------------
-- عدّاد التحديث القادم
----------------------------------------------------------------------
local function fmtCountdown(secs)
	secs = math.max(0, math.floor(secs))
	local h = math.floor(secs / 3600)
	local m = math.floor((secs % 3600) / 60)
	local s = secs % 60
	return string.format("%02d:%02d:%02d", h, m, s)
end

RunService.Heartbeat:Connect(function()
	if not panel.Visible or not lastPayload then return end
	local now = os.time()
	local d = (lastPayload.dailyReset or now) - now
	timerLbl.Text = "⏳ تجديد المهام بعد: " .. fmtCountdown(d)
end)

----------------------------------------------------------------------
-- فتح/إغلاق
----------------------------------------------------------------------
local function openPanel()
	panel.Visible = true
	if requestRemote then requestRemote:FireServer() end
end
local function closePanel() panel.Visible = false end

openBtn.MouseButton1Click:Connect(function()
	if panel.Visible then closePanel() else openPanel() end
end)
closeBtn.MouseButton1Click:Connect(closePanel)

----------------------------------------------------------------------
-- الترحيب + دليل المبتدئين
----------------------------------------------------------------------
local function chat(text)
	if _G.ChatSystemMessage then
		_G.ChatSystemMessage(text)
	else
		pcall(function()
			StarterGui:SetCore("ChatMakeSystemMessage", { Text = text, Color = PURPLE, Font = Enum.Font.GothamBold })
		end)
	end
end

local function showBeginnerGuide()
	if gui:FindFirstChild("Guide") then return end
	local shade = new("Frame", {
		Name = "Guide", Parent = gui, Size = UDim2.new(1, 0, 1, 0),
		BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.45, ZIndex = 50,
	})
	local card = new("Frame", {
		Parent = shade, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0),
		Size = UDim2.new(0, 430, 0, 380), BackgroundColor3 = DARK, ZIndex = 51,
	}, { corner(16), stroke(GOLD, 2) })
	new("TextLabel", {
		Parent = card, Position = UDim2.new(0, 0, 0, 0), Size = UDim2.new(1, 0, 0, 54),
		BackgroundColor3 = PANEL, Text = "🌟 دليل المبتدئين", Font = Enum.Font.GothamBlack,
		TextSize = 22, TextColor3 = GOLD, ZIndex = 52,
	}, { corner(16) })
	new("TextLabel", {
		Parent = card, Position = UDim2.new(0, 18, 0, 64), Size = UDim2.new(1, -36, 1, -130),
		BackgroundTransparency = 1, ZIndex = 52, RichText = true,
		Font = Enum.Font.GothamSemibold, TextSize = 17, TextColor3 = WHITE,
		TextXAlignment = Enum.TextXAlignment.Right, TextYAlignment = Enum.TextYAlignment.Top,
		Text = table.concat({
			"💰 <b>لا توجد كوينز مجانية!</b> اجمعها بالنشاط والمهام.",
			"",
			"١- اختر بوثاً خاصاً بك.",
			"٢- شاهد فيلماً داخل السينما.",
			"٣- جرّب الباركور.",
			"٤- أكمل المهام اليومية لتحصل على الكوينز.",
		}, "\n"),
	})
	new("TextButton", {
		Parent = card, AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -16),
		Size = UDim2.new(0, 200, 0, 44), BackgroundColor3 = GREEN, ZIndex = 52,
		Text = "فهمت — لنبدأ!", Font = Enum.Font.GothamBold, TextSize = 18, TextColor3 = DARK,
	}, { corner(10) }).MouseButton1Click:Connect(function()
		shade:Destroy()
		openPanel()
	end)
end

if welcomeRemote then
	welcomeRemote.OnClientEvent:Connect(function(data)
		chat("🎬 أهلاً بك في السيرفر! استكشف السينما والبوثات والشاطئ والأنشطة المختلفة.")
		chat("💰 لا توجد كوينز مجانية! أكمل المهام اليومية والأنشطة للحصول على العملات والجوائز. نتمنى لك وقتاً ممتعاً.")
		if data and data.firstTime then
			chat("🌟 أهلاً بك لأول مرة! ابدأ بزيارة لوحة المهام اليومية 📋 لمعرفة كيفية جمع الكوينز وفتح المكافآت.")
			task.wait(1)
			showBeginnerGuide()
		end
	end)
end

print("[MissionClient] ready — missions UI + welcome + beginner guide.")
