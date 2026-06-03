--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  واجهة السينما — CINEMA CLIENT (Client)                                ║
	║  المكان: StarterPlayer > StarterPlayerScripts   ·   النوع: LocalScript ║
	║                                                                        ║
	║  • قائمة اختيار المقعد (أمامي/خلفي) عند الضغط على البروجكتر.            ║
	║  • نافذة حوار (مرشد السينما) بالعربي تشرح كل ما يخص السينما.            ║
	║  • أصوات زجاج للأزرار (تمرير/ضغط) لتجربة احترافية متناسقة.             ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local SoundService      = game:GetService("SoundService")
local UserInputService  = game:GetService("UserInputService")

local LocalPlayer = Players.LocalPlayer
local playerGui   = LocalPlayer:WaitForChild("PlayerGui")

local remotes    = ReplicatedStorage:WaitForChild("CinemaRemotes")
local seatRemote = remotes:WaitForChild("SeatMenu")
local lobbyRemote = remotes:WaitForChild("Lobby")  -- يُعرَّف مبكراً لأن دوال النوافذ (شبّاك التذاكر/المتجر) تستعمله قبل هذا الموضع

------------------------------------------------------------------------
-- CONFIG (ألوان + أصوات الزجاج — قابلة للتعديل)
------------------------------------------------------------------------
local SOUNDS = {
	Hover = 9118823105,   -- رنّة زجاج خفيفة عند التمرير
	Click = 9125402735,   -- كسر زجاج عند الضغط
	Talk  = 9118823105,   -- نقرة كلام خفيفة أثناء شرح المرشد
}
local SOUND_VOLUME = 0.5

local PURPLE = Color3.fromRGB(168, 92, 255)
local CYAN   = Color3.fromRGB(70, 226, 255)
local GOLD   = Color3.fromRGB(255, 205, 90)
local CARD   = Color3.fromRGB(18, 14, 32)
local CARD2  = Color3.fromRGB(30, 22, 54)
local TEXT   = Color3.fromRGB(244, 242, 255)
local SUBT   = Color3.fromRGB(182, 176, 214)

local AR = { ["0"]="٠",["1"]="١",["2"]="٢",["3"]="٣",["4"]="٤",["5"]="٥",["6"]="٦",["7"]="٧",["8"]="٨",["9"]="٩" }
local function toAr(s): string
	return (tostring(s):gsub("%d", function(d) return AR[d] or d end))
end

local function fmt(sec: number): string
	sec = math.max(0, math.floor(sec + 0.5))
	return toAr(string.format("%d:%02d", math.floor(sec / 60), sec % 60))
end

local function new(class: string, props, children)
	local o = Instance.new(class)
	-- 🌐 إيقاف الترجمة التلقائية على حاويات الواجهة: النص العربي المصدر يظهر للجميع مهما كانت لغة الحساب
	if class == "ScreenGui" or class == "BillboardGui" or class == "SurfaceGui" then o.AutoLocalize = false end
	for k, v in pairs(props or {}) do o[k] = v end
	for _, c in ipairs(children or {}) do c.Parent = o end
	return o
end

local function playSound(id: number?, vol: number?)
	if not id or id <= 0 then return end
	pcall(function()
		local s = Instance.new("Sound")
		s.SoundId = "rbxassetid://" .. tostring(id)
		s.Volume = vol or SOUND_VOLUME
		s.Parent = SoundService
		s:Play()
		s.Ended:Once(function() s:Destroy() end)
		task.delay(5, function() if s then s:Destroy() end end)
	end)
end

------------------------------------------------------------------------
-- ScreenGui واحد يُعاد استخدامه
------------------------------------------------------------------------
local gui = new("ScreenGui", {
	Name = "CinemaUI", ResetOnSpawn = false, IgnoreGuiInset = true,
	DisplayOrder = 30, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, Parent = playerGui,
})

-- مقياس متجاوب: يصغّر الواجهة على شاشات الجوال الصغيرة فلا تطفح النوافذ
local uiScale = Instance.new("UIScale")
uiScale.Parent = gui
do
	local cam = workspace.CurrentCamera
	local function fit()
		if not cam then return end
		local w = cam.ViewportSize.X
		local h = cam.ViewportSize.Y
		local s = math.clamp(math.min(w / 820, h / 620), 0.62, 1)
		uiScale.Scale = s
	end
	fit()
	if cam then cam:GetPropertyChangedSignal("ViewportSize"):Connect(fit) end
	workspace:GetPropertyChangedSignal("CurrentCamera"):Connect(function()
		cam = workspace.CurrentCamera
		if cam then cam:GetPropertyChangedSignal("ViewportSize"):Connect(fit) end
		fit()
	end)
end

------------------------------------------------------------------------
-- أرصفة الأزرار الجانبية (Docks): ترتّب الأزرار الثابتة عمودياً تلقائياً
-- بدون أي تداخل مهما كان عددها أو حجم الشاشة (يسار + يمين).
------------------------------------------------------------------------
-- ترتيب صريح وحتمي للأزرار داخل الرصيف (بدون UIListLayout نهائياً)
-- يحسب موضع كل زر يدوياً حسب LayoutOrder → يستحيل التداخل مهما حصل.
local DOCK_GAP = 10
local dockSide: { [Instance]: number } = {}
local dockCenterY: { [Instance]: number } = {}   -- كسر ارتفاع مركز الرصيف (0.5 = وسط)
local function relayoutDock(dock: Instance)
	local side = dockSide[dock] or -1
	local cy = dockCenterY[dock] or 0.5
	local btns = {}
	for _, c in ipairs(dock:GetChildren()) do
		if c:IsA("GuiButton") then table.insert(btns, c) end
	end
	table.sort(btns, function(a, b) return (a.LayoutOrder or 0) < (b.LayoutOrder or 0) end)
	local total = 0
	for _, b in ipairs(btns) do total += b.Size.Y.Offset end
	total += DOCK_GAP * math.max(0, #btns - 1)
	local y = -total / 2
	for _, b in ipairs(btns) do
		local h = b.Size.Y.Offset
		b.AnchorPoint = Vector2.new(side < 0 and 0 or 1, 0.5)
		b.Position = UDim2.new(side < 0 and 0 or 1, 0, cy, y + h / 2)
		y += h + DOCK_GAP
	end
end
local function makeDock(side: number)
	-- حاوية بكامل ارتفاع الشاشة (شفافة، لا تحجب اللمس). الأزرار تُرتَّب يدوياً.
	local dock = new("Frame", {
		Name = side < 0 and "LeftDock" or "RightDock",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(side < 0 and 0 or 1, 0),
		Position = UDim2.new(side < 0 and 0 or 1, side < 0 and 12 or -12, 0, 0),
		Size = UDim2.new(0, 150, 1, 0),
		Parent = gui,
	})
	dockSide[dock] = side
	-- أي زر يُضاف لاحقاً يُعاد ترتيب الرصيف تلقائياً (بعد ضبط خصائصه)
	dock.ChildAdded:Connect(function(c)
		if c:IsA("GuiButton") then task.defer(relayoutDock, dock) end
	end)
	dock.ChildRemoved:Connect(function(c)
		if c:IsA("GuiButton") then task.defer(relayoutDock, dock) end
	end)
	return dock
end
local leftDock  = makeDock(-1)
local rightDock = makeDock(1)
-- «المزيد» وأزرار اليمين أعلى على الشاشة (لا وسط)
dockCenterY[rightDock] = 0.34

local activeRoot: Instance? = nil

local function closeActive()
	if activeRoot then
		local root = activeRoot
		activeRoot = nil
		TweenService:Create(root, TweenInfo.new(0.18), { BackgroundTransparency = 1 }):Play()
		for _, d in ipairs(root:GetDescendants()) do
			if d:IsA("GuiObject") then
				TweenService:Create(d, TweenInfo.new(0.18), { BackgroundTransparency = 1 }):Play()
				if d:IsA("TextLabel") or d:IsA("TextButton") then
					TweenService:Create(d, TweenInfo.new(0.18), { TextTransparency = 1 }):Play()
				end
			end
		end
		task.delay(0.22, function() if root and root.Parent then root:Destroy() end end)
	end
end

-- خلفية معتمة + بطاقة في المنتصف (مع أنيميشن ظهور)
local function makeModal(cardSize: UDim2)
	closeActive()
	local backdrop = new("TextButton", {
		Name = "Backdrop", Text = "", AutoButtonColor = false, Modal = true,
		BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1,
		Size = UDim2.fromScale(1, 1), Parent = gui,
	})
	TweenService:Create(backdrop, TweenInfo.new(0.2), { BackgroundTransparency = 0.45 }):Play()

	local card = new("Frame", {
		Name = "Card", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
		Size = cardSize, BackgroundColor3 = CARD, Parent = backdrop,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 22) }),
		new("UIStroke", { Color = PURPLE, Thickness = 2, Transparency = 0.25 }),
		new("UIGradient", { Rotation = 90, Color = ColorSequence.new(CARD2, CARD) }),
	})
	card.Size = UDim2.fromScale(cardSize.X.Scale * 0.9, cardSize.Y.Scale * 0.9)
	TweenService:Create(card, TweenInfo.new(0.28, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
		{ Size = cardSize }):Play()

	activeRoot = backdrop
	backdrop.MouseButton1Click:Connect(closeActive)
	return backdrop, card
end

-- زر منسّق مع أصوات الزجاج
local function styledButton(parent, props, enabled: boolean)
	enabled = (enabled ~= false)
	local btn = new("TextButton", props or {})
	new("UICorner", { CornerRadius = UDim.new(0, 14), Parent = btn })
	local stroke = new("UIStroke", { Color = enabled and CYAN or Color3.fromRGB(80, 78, 95), Thickness = 1.5, Transparency = 0.3, Parent = btn })
	btn.AutoButtonColor = false
	if not enabled then
		btn.BackgroundTransparency = 0.5
		btn.TextTransparency = 0.4
		return btn
	end
	local baseColor = btn.BackgroundColor3
	btn.MouseEnter:Connect(function()
		playSound(SOUNDS.Hover, SOUND_VOLUME)
		TweenService:Create(btn, TweenInfo.new(0.12), { BackgroundColor3 = baseColor:Lerp(Color3.new(1,1,1), 0.12) }):Play()
		TweenService:Create(stroke, TweenInfo.new(0.12), { Transparency = 0, Thickness = 2.5 }):Play()
	end)
	btn.MouseLeave:Connect(function()
		TweenService:Create(btn, TweenInfo.new(0.12), { BackgroundColor3 = baseColor }):Play()
		TweenService:Create(stroke, TweenInfo.new(0.12), { Transparency = 0.3, Thickness = 1.5 }):Play()
	end)
	btn.MouseButton1Down:Connect(function()
		playSound(SOUNDS.Click, SOUND_VOLUME + 0.05)
	end)
	return btn
end

local showSeatMenu   -- forward declaration
local showStore      -- forward declaration (المتجر — نافذة وسط الشاشة)
local onStoreSpeedSet -- forward declaration (تحديث شريط سرعة المشي في المتجر بعد تأكيد السيرفر)
local showAdminPanel -- forward declaration (لوحة الإدارة)
local showAnnounce   -- forward declaration (إعلان عام على الشاشة)
local showMaintenance -- forward declaration (شاشة الصيانة)
local maintenanceFrame -- شاشة الصيانة المعروضة حالياً
local adminTab = "stats"  -- التبويب المختار حالياً (يُحفظ بين التحديثات)
local lastAdminData       -- آخر بيانات لوحة الإدارة (لإعادة الفتح بعد نافذة فرعية)
local myRank = ""         -- رتبتي الإدارية (owner/admin/mod/staff/"") — من السيرفر
local updateAdminButton   -- forward declaration (إظهار/إخفاء زر الإدارة حسب الرتبة)
local showWarn            -- forward declaration (نافذة تحذير إداري للّاعب)
local showProfile    -- forward declaration (الإنجازات + التقييم)
local onArcadeResult -- forward declaration (نتيجة الأركيد)
local applyPerks     -- forward declaration (أزرار باقات خاصة: مالك العرض / مايك الإعلان)
local playEventFx    -- forward declaration (مؤثرات الفعاليات)

------------------------------------------------------------------------
-- نافذة اختيار طريقة الدفع لحجز المقعد (كوينز أو تذكرة)
------------------------------------------------------------------------
local function askSeatPayment(data, onPick)
	local _, card = makeModal(UDim2.fromOffset(410, 360))
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "💳 اختر طريقة الدفع", Font = Enum.Font.GothamBlack,
		TextSize = 26, TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 44), Position = UDim2.fromOffset(14, 14),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	local price   = data.price or 30
	local coins   = data.coins or 0
	local tickets = data.tickets or 0
	new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, TextSize = 15, TextColor3 = SUBT,
		Size = UDim2.new(1, -28, 0, 26), Position = UDim2.fromOffset(14, 60), TextXAlignment = Enum.TextXAlignment.Right,
		Text = "💰 رصيدك: " .. toAr(coins) .. " كوينز   ·   🎟️ تذاكرك: " .. toAr(tickets), Parent = card,
	})

	local canCoins = coins >= price
	local cb = styledButton(card, {
		Name = "PayCoins", Text = "💰 ادفع " .. toAr(price) .. " كوينز" .. (data.vip and " (نص السعر VIP)" or ""),
		Font = Enum.Font.GothamBlack, TextSize = 19, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(40, 30, 70), Size = UDim2.new(1, -28, 0, 72), Position = UDim2.fromOffset(14, 96),
		Parent = card,
	}, canCoins)
	if canCoins then
		cb.MouseButton1Click:Connect(function() onPick("coins") end)
	end

	local canTicket = tickets > 0
	local tb = styledButton(card, {
		Name = "PayTicket",
		Text = canTicket and ("🎟️ استخدم تذكرة (متبقّي: " .. toAr(tickets) .. ")") or "🎟️ لا توجد تذاكر",
		Font = Enum.Font.GothamBlack, TextSize = 19, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(28, 54, 40), Size = UDim2.new(1, -28, 0, 72), Position = UDim2.fromOffset(14, 178),
		Parent = card,
	}, canTicket)
	if canTicket then
		tb.MouseButton1Click:Connect(function() onPick("ticket") end)
	end

	local back = styledButton(card, {
		Name = "Back", Text = "↩️ رجوع", Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 40),
		Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	back.MouseButton1Click:Connect(function() showSeatMenu(data) end)
end

------------------------------------------------------------------------
-- شبكة اختيار مقعد محدّد (حجز مقعد بعينه)
------------------------------------------------------------------------
local function showSeatGrid(data)
	local _, card = makeModal(UDim2.fromOffset(520, 500))
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "🎯 اختر مقعدك بالتحديد", Font = Enum.Font.GothamBlack,
		TextSize = 26, TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 42), Position = UDim2.fromOffset(14, 12),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, TextSize = 14, TextColor3 = SUBT,
		Size = UDim2.new(1, -28, 0, 24), Position = UDim2.fromOffset(14, 54), TextXAlignment = Enum.TextXAlignment.Right,
		Text = "🟢 متاح   ·   🔴 محجوز   ·   الصفوف الأولى أقرب للشاشة", Parent = card,
	})

	local scroll = new("ScrollingFrame", {
		BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.new(1, -28, 1, -150),
		Position = UDim2.fromOffset(14, 84), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ScrollBarThickness = 6, ScrollBarImageColor3 = PURPLE, Parent = card,
	}, {
		new("UIGridLayout", {
			CellSize = UDim2.fromOffset(70, 44), CellPadding = UDim2.fromOffset(8, 8),
			HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder,
		}),
		new("UIPadding", { PaddingTop = UDim.new(0, 4), PaddingBottom = UDim.new(0, 4) }),
	})

	for _, s in ipairs(data.seats or {}) do
		local free = not s.taken
		local cell = styledButton(scroll, {
			Name = "Seat" .. s.i, LayoutOrder = s.i,
			Text = (free and "🟢 " or "🔴 ") .. toAr(s.i),
			Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
			BackgroundColor3 = free and Color3.fromRGB(28, 54, 36) or Color3.fromRGB(60, 26, 32),
			Size = UDim2.fromOffset(70, 44), Parent = scroll,
		}, free)
		if free then
			cell.MouseButton1Click:Connect(function()
				askSeatPayment(data, function(method)
					seatRemote:FireServer({ action = "chooseSeat", index = s.i, pay = method })
					closeActive()
				end)
			end)
		end
	end

	local back = styledButton(card, {
		Name = "Back", Text = "↩️ رجوع", Font = Enum.Font.GothamBold, TextSize = 17, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 42),
		Position = UDim2.new(0.5, 0, 1, -14), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	back.MouseButton1Click:Connect(function() showSeatMenu(data) end)
end

------------------------------------------------------------------------
-- قائمة اختيار المقعد
------------------------------------------------------------------------
showSeatMenu = function(data)
	local _, card = makeModal(UDim2.fromOffset(440, 440))

	new("TextLabel", {
		BackgroundTransparency = 1, Text = "🎬 اختر مقعدك", Font = Enum.Font.GothamBlack,
		TextSize = 30, TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 46), Position = UDim2.fromOffset(14, 14),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	local sub = new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, TextSize = 16, TextColor3 = SUBT,
		TextWrapped = true, Size = UDim2.new(1, -28, 0, 44), Position = UDim2.fromOffset(14, 58),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
		Text = "الأمامي أقرب للشاشة · الخلفي يعطيك مشهداً شاملاً",
	})

	if data.playing then
		sub.Text = "🔴 العرض جارٍ — يتبقّى " .. fmt(data.remain or 0) .. " · اختر مقعداً لتجلس كمتفرّج"
		sub.TextColor3 = Color3.fromRGB(255, 130, 130)
	end

	local function makeChoice(row, label, count, yPos)
		local free = count or 0
		local enabled = free > 0
		local btn = styledButton(card, {
			Name = row, Text = "", BackgroundColor3 = (row == "front") and Color3.fromRGB(40, 30, 70) or Color3.fromRGB(30, 36, 64),
			Size = UDim2.new(1, -28, 0, 84), Position = UDim2.fromOffset(14, yPos), Parent = card,
		}, enabled)
		new("UIGradient", { Rotation = 25, Color = ColorSequence.new((row == "front") and PURPLE or CYAN, CARD), Transparency = NumberSequence.new(0.55), Parent = btn })
		new("TextLabel", {
			BackgroundTransparency = 1, Text = label, Font = Enum.Font.GothamBlack, TextSize = 24, TextColor3 = TEXT,
			Size = UDim2.new(1, -22, 0, 40), Position = UDim2.fromOffset(11, 10), TextXAlignment = Enum.TextXAlignment.Right, Parent = btn,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, TextSize = 16,
			TextColor3 = enabled and Color3.fromRGB(150, 255, 180) or Color3.fromRGB(255, 140, 140),
			Text = enabled and ("مقاعد فاضية: " .. toAr(free)) or "ممتلئ — لا توجد مقاعد",
			Size = UDim2.new(1, -22, 0, 26), Position = UDim2.fromOffset(11, 50), TextXAlignment = Enum.TextXAlignment.Right, Parent = btn,
		})
		if enabled then
			btn.MouseButton1Click:Connect(function()
				askSeatPayment(data, function(method)
					seatRemote:FireServer({ action = "choose", row = row, pay = method })
					closeActive()
				end)
			end)
		end
		return btn
	end

	makeChoice("front", "🪑 مقعد أمامي", data.front, 112)
	makeChoice("back",  "🛋️ مقعد خلفي", data.back, 206)

	local pick = styledButton(card, {
		Name = "Pick", Text = "🎯 اختيار مقعد محدّد", Font = Enum.Font.GothamBold, TextSize = 18, TextColor3 = GOLD,
		BackgroundColor3 = Color3.fromRGB(58, 46, 24), Size = UDim2.new(1, -28, 0, 44),
		Position = UDim2.fromOffset(14, 300), Parent = card,
	})
	pick.MouseButton1Click:Connect(function() showSeatGrid(data) end)

	local cancel = styledButton(card, {
		Name = "Cancel", Text = "إلغاء", Font = Enum.Font.GothamBold, TextSize = 17, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 40),
		Position = UDim2.new(0.5, 0, 1, -14), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	cancel.MouseButton1Click:Connect(function()
		seatRemote:FireServer({ action = "cancel" })
		closeActive()
	end)
end

------------------------------------------------------------------------
-- نافذة حوار المرشد (محتوى عربي احترافي — تنقّل محلي)
------------------------------------------------------------------------
local GUIDE_STEPS = {
	"أهلاً وسهلاً في 🎬 <b>سينما مدينة التبرعات</b>! أنا مرشدك، خلّني أشرح لك كل شي بسرعة 👇",
	"🎬 <b>السينما:</b> قاعة بشاشة عملاقة و٣٠ مقعداً وأجواء حقيقية — وقت العرض تنخفض الإضاءة وتُقفل البوابة.",
	"🪑 <b>كيف تشاهد فيلم؟</b> اقترب من البروجكتر واضغط E، تختار مقعدك، ويبدأ العرض تلقائياً.",
	"🎯 <b>حجز مقعد محدّد:</b> من البروجكتر تقدر تختار مقعدك بالضبط من الشبكة (🟢 متاح · 🔴 محجوز).",
	"⏳ <b>صف الانتظار:</b> لو العرض شغّال، انضم للصف من لافتة المدخل وننبّهك أول ما يخلص — و⭐ VIP لهم أولوية.",
	"🍿 <b>الأكل:</b> خذ فشارك ومشروبك من البسطة أو من الخدّام (اضغط E)، وبعدها اضغط زر الماوس تاكل وترتشف 🥤.",
	"🎟️ <b>التذاكر:</b> كل فيلم يحتاج تذكرة. افتح «شبّاك التذاكر» وخذ 🎁 تذكرة مجانية كل دقيقتين أو اشترِ تذكرة فورية بالكوينز.",
	"💰 <b>الكوينز:</b> عملة اللعبة — تجمعها من اللعب والفعاليات، وتشتري بها حزم كوينز من المتجر.",
	"🛒 <b>المتجر</b> (زر يسار الشاشة): كل المميزات بمكان واحد — VIP والباقات وحزم الكوينز والتذكرة الفورية بضغطة شراء.",
	"⭐ <b>VIP:</b> لاونج خاص بمقاعد ذهبية، تذاكر بنص السعر، دخل كوينز مضاعف، وتاج ⭐ فوق راسك.",
	"🎁 <b>الباقات الدائمة:</b> 🍿 بوفيه مفتوح · 🎬 مالك العرض · ✨ أثر نيون · 📢 مايك الإعلان — كلها في المتجر.",
	"✨ <b>زر «المزيد»</b> (يمين الشاشة): إنجازاتك، تقييم الفيلم، صالة الأركيد، والصورة التذكارية 📸.",
	"📜 <b>القوانين:</b> احترم الحضور، ابقَ بمقعدك وقت العرض، ولا تحجز مقاعد بدون استخدام. استمتع! 🎉",
	"💡 <b>نصيحة أخيرة:</b> جدّد تذاكرك باستمرار، جرّب الباقات، وادعُ أصحابك. نشوفك بالقاعة! 👋",
}

local function showDialog()
	closeActive()

	-- فقاعة كلام سفلية تلقائية — المرشد يتكلّم ويشرح خطوة بخطوة
	local bubble = new("Frame", {
		Name = "GuideBubble", AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -22), Size = UDim2.fromOffset(620, 212),
		BackgroundColor3 = CARD, Parent = gui,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 22) }),
		new("UIStroke", { Color = CYAN, Thickness = 2, Transparency = 0.2 }),
		new("UIGradient", { Rotation = 90, Color = ColorSequence.new(CARD2, CARD) }),
	})
	activeRoot = bubble

	-- ذيل الفقاعة (مربّع مائل أسفل المنتصف)
	new("Frame", {
		BackgroundColor3 = CARD, Rotation = 45, AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 0, 1, -1), Size = UDim2.fromOffset(26, 26), Parent = bubble,
	})

	-- شريط التقدّم العلوي
	local barBg = new("Frame", {
		BackgroundColor3 = Color3.fromRGB(20, 16, 34), BorderSizePixel = 0,
		Position = UDim2.fromOffset(0, 0), Size = UDim2.new(1, 0, 0, 5), Parent = bubble,
	}, { new("UICorner", { CornerRadius = UDim.new(0, 4) }) })
	local bar = new("Frame", {
		BackgroundColor3 = CYAN, BorderSizePixel = 0, Size = UDim2.fromScale(0, 1), Parent = barBg,
	}, { new("UICorner", { CornerRadius = UDim.new(0, 4) }) })

	-- رأس: صورة المرشد + الاسم + العدّاد
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "👋", Font = Enum.Font.GothamBlack, TextSize = 30,
		Size = UDim2.fromOffset(44, 44), Position = UDim2.new(1, -54, 0, 12), Parent = bubble,
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "مرشد السينما", Font = Enum.Font.GothamBlack, TextSize = 22,
		TextColor3 = CYAN, TextXAlignment = Enum.TextXAlignment.Right,
		Size = UDim2.new(0, 220, 0, 44), Position = UDim2.new(1, -104, 0, 12), Parent = bubble,
	})
	local counter = new("TextLabel", {
		BackgroundTransparency = 1, Text = "", Font = Enum.Font.GothamBold, TextSize = 16,
		TextColor3 = SUBT, TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.fromOffset(90, 44), Position = UDim2.fromOffset(14, 12), Parent = bubble,
	})

	-- نص الشرح (تأثير كتابة)
	local body = new("TextLabel", {
		Name = "Body", BackgroundTransparency = 1, Text = "", RichText = true,
		Font = Enum.Font.GothamMedium, TextSize = 19, TextColor3 = TEXT, TextWrapped = true,
		TextXAlignment = Enum.TextXAlignment.Right, TextYAlignment = Enum.TextYAlignment.Top,
		Size = UDim2.new(1, -36, 0, 96), Position = UDim2.fromOffset(18, 62), Parent = bubble,
	})

	-- أزرار التنقّل
	local nextBtn = styledButton(bubble, {
		Text = "التالي ›", Font = Enum.Font.GothamBold, TextSize = 17, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(34, 28, 58), Size = UDim2.fromOffset(150, 38),
		Position = UDim2.new(0, 14, 1, -50), Parent = bubble,
	})
	local prevBtn = styledButton(bubble, {
		Text = "‹ السابق", Font = Enum.Font.GothamBold, TextSize = 17, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(30, 24, 48), Size = UDim2.fromOffset(150, 38),
		Position = UDim2.new(0, 172, 1, -50), Parent = bubble,
	})
	local closeBtn = styledButton(bubble, {
		Text = "إغلاق", Font = Enum.Font.GothamBold, TextSize = 17, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(58, 40, 64), Size = UDim2.fromOffset(150, 38),
		AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -14, 1, -50), Parent = bubble,
	})

	local STEP = 0
	local gen = 0
	local DUR = 4.5

	local render
	render = function(idx)
		idx = math.clamp(idx, 1, #GUIDE_STEPS)
		STEP = idx
		gen += 1
		local myGen = gen
		counter.Text = toAr(idx) .. " / " .. toAr(#GUIDE_STEPS)
		prevBtn.Visible = idx > 1
		nextBtn.Text = (idx < #GUIDE_STEPS) and "التالي ›" or "تم"

		body.MaxVisibleGraphemes = 0
		body.Text = GUIDE_STEPS[idx]

		-- تأثير الكتابة + صوت كلام خفيف
		task.spawn(function()
			local total = utf8.len(body.ContentText)
			if not total then
				body.MaxVisibleGraphemes = -1
				return
			end
			local i = 0
			while i < total do
				if myGen ~= gen or not bubble.Parent then return end
				i += 1
				body.MaxVisibleGraphemes = i
				if i % 3 == 0 then playSound(SOUNDS.Talk, 0.1) end
				task.wait(0.03)
			end
			if myGen == gen then body.MaxVisibleGraphemes = -1 end
		end)

		-- شريط التقدّم + الانتقال التلقائي كل ٤.٥ ثانية
		bar.Size = UDim2.fromScale(0, 1)
		if idx < #GUIDE_STEPS then
			TweenService:Create(bar, TweenInfo.new(DUR, Enum.EasingStyle.Linear), { Size = UDim2.fromScale(1, 1) }):Play()
			task.delay(DUR, function()
				if myGen == gen and bubble.Parent then render(idx + 1) end
			end)
		else
			bar.Size = UDim2.fromScale(1, 1)
		end
	end

	prevBtn.MouseButton1Click:Connect(function() render(STEP - 1) end)
	nextBtn.MouseButton1Click:Connect(function()
		if STEP < #GUIDE_STEPS then render(STEP + 1) else closeActive() end
	end)
	closeBtn.MouseButton1Click:Connect(closeActive)

	render(1)
end

------------------------------------------------------------------------
-- HUD الكوينز (أعلى يمين الشاشة — بعيد عن منطقة اللعب)
------------------------------------------------------------------------
local function setupCoinsHud()
	local hud = new("Frame", {
		Name = "CoinsHud", AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -16, 0, 16),
		Size = UDim2.fromOffset(168, 44), BackgroundColor3 = CARD, Parent = gui,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 12) }),
		new("UIStroke", { Color = GOLD, Thickness = 1.5, Transparency = 0.3 }),
		new("UIGradient", { Rotation = 90, Color = ColorSequence.new(CARD2, CARD) }),
	})
	local label = new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.GothamBlack, TextSize = 20, TextColor3 = GOLD,
		Size = UDim2.new(1, -14, 1, 0), Position = UDim2.fromOffset(7, 0),
		TextXAlignment = Enum.TextXAlignment.Right, Text = "💰 ٠ كوينز", Parent = hud,
	})
	local function refresh()
		local stats = LocalPlayer:FindFirstChild("leaderstats")
		local v = stats and stats:FindFirstChild("كوينز")
		label.Text = "💰 " .. toAr(v and v.Value or 0) .. " كوينز"
	end
	local function hook()
		local stats = LocalPlayer:WaitForChild("leaderstats", 30)
		local v = stats and stats:WaitForChild("كوينز", 30)
		if v then v.Changed:Connect(refresh) end
		refresh()
	end
	task.spawn(hook)
end
setupCoinsHud()

------------------------------------------------------------------------
-- شبّاك التذاكر / قائمة الأفلام (Movie Selection GUI)
------------------------------------------------------------------------
local function showBoxOffice(data)
	local _, card = makeModal(UDim2.fromOffset(520, 588))
	local film = (data.films and data.films[1]) or { title = "—", genre = "", duration = "", rating = "", synopsis = "" }
	local acc = film.accent and Color3.fromRGB(film.accent[1], film.accent[2], film.accent[3]) or PURPLE

	new("TextLabel", {
		BackgroundTransparency = 1, Text = "🎟️ شبّاك التذاكر", Font = Enum.Font.GothamBlack,
		TextSize = 28, TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 44), Position = UDim2.fromOffset(14, 12),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})

	-- بطاقة الفيلم (بوستر بتدرّج + بيانات)
	local poster = new("Frame", {
		BackgroundColor3 = acc, Size = UDim2.new(1, -28, 0, 150), Position = UDim2.fromOffset(14, 62), Parent = card,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 16) }),
		new("UIGradient", { Rotation = 35, Color = ColorSequence.new(acc, CARD) }),
		new("UIStroke", { Color = acc, Thickness = 2, Transparency = 0.2 }),
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "🎬", Font = Enum.Font.GothamBlack, TextSize = 52,
		Size = UDim2.fromOffset(90, 90), Position = UDim2.fromOffset(14, 30), TextColor3 = TEXT, Parent = poster,
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Text = film.title, Font = Enum.Font.GothamBlack, TextSize = 26, TextColor3 = TEXT,
		Size = UDim2.new(1, -120, 0, 40), Position = UDim2.fromOffset(10, 14), TextXAlignment = Enum.TextXAlignment.Right, Parent = poster,
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, TextSize = 16, TextColor3 = Color3.fromRGB(235, 230, 255),
		Text = "🎭 " .. (film.genre or "") .. "   ⏱️ " .. (film.duration or "") .. "   🔖 " .. (film.rating or ""),
		Size = UDim2.new(1, -120, 0, 26), Position = UDim2.fromOffset(10, 58), TextXAlignment = Enum.TextXAlignment.Right, Parent = poster,
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.Gotham, TextSize = 15, TextColor3 = Color3.fromRGB(225, 222, 245),
		Text = film.synopsis or "", TextWrapped = true,
		Size = UDim2.new(1, -120, 0, 50), Position = UDim2.fromOffset(10, 88), TextXAlignment = Enum.TextXAlignment.Right, Parent = poster,
	})

	-- حالة العرض
	local status = new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.GothamBold, TextSize = 17,
		Size = UDim2.new(1, -28, 0, 30), Position = UDim2.fromOffset(14, 220), TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	if data.playing then
		status.TextColor3 = Color3.fromRGB(255, 130, 130)
		status.Text = "🔴 العرض جارٍ — يتبقّى " .. fmt(data.remain or 0)
	else
		status.TextColor3 = Color3.fromRGB(150, 255, 180)
		status.Text = "🟢 متاح الآن — اشترِ تذكرة ثم توجّه للبروجكتر"
	end

	-- الرصيد
	new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.GothamBold, TextSize = 17, TextColor3 = GOLD,
		Size = UDim2.new(1, -28, 0, 28), Position = UDim2.fromOffset(14, 254), TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
		Text = "💰 رصيدك: " .. toAr(data.coins or 0) .. " كوينز   ·   🎟️ تذاكرك: " .. toAr(data.tickets or 0) .. "/٣",
	})

	-- زر الشراء
	local price = data.ticketPrice or 30
	local canBuy = (data.coins or 0) >= price and (data.tickets or 0) < 3
	local buy = styledButton(card, {
		Name = "Buy", Text = "🎟️ اشترِ — " .. toAr(price) .. " كوينز", Font = Enum.Font.GothamBlack, TextSize = 17,
		TextColor3 = TEXT, BackgroundColor3 = Color3.fromRGB(36, 30, 64),
		Size = UDim2.new(0.5, -19, 0, 52), Position = UDim2.fromOffset(14, 294), Parent = card,
	}, canBuy)
	new("UIGradient", { Rotation = 20, Color = ColorSequence.new(PURPLE, CARD), Transparency = NumberSequence.new(0.5), Parent = buy })
	if canBuy then
		buy.MouseButton1Click:Connect(function()
			lobbyRemote:FireServer({ action = "buyTicket" })
		end)
	end
	-- 🎁 تذكرة مجانية كل دقيقتين (استبدلت لوحة التذاكر الجانبية القديمة)
	local freeOk = (data.tickets or 0) < 3
	local free = styledButton(card, {
		Name = "FreeTicket", Text = "🎁 تذكرة مجانية", Font = Enum.Font.GothamBlack, TextSize = 17,
		TextColor3 = Color3.fromRGB(20, 16, 8), BackgroundColor3 = GOLD,
		Size = UDim2.new(0.5, -19, 0, 52), Position = UDim2.new(0.5, 5, 0, 294), Parent = card,
	}, freeOk)
	if freeOk then
		free.MouseButton1Click:Connect(function()
			lobbyRemote:FireServer({ action = "claimFreeTicket" })
		end)
	end

	-- قسم VIP
	new("Frame", {
		BackgroundColor3 = Color3.fromRGB(255, 205, 90), BackgroundTransparency = 0.7,
		Size = UDim2.new(1, -28, 0, 2), Position = UDim2.fromOffset(14, 356), Parent = card,
	})
	if data.vip then
		new("TextLabel", {
			BackgroundTransparency = 1, Font = Enum.Font.GothamBlack, TextSize = 19, TextColor3 = GOLD,
			Size = UDim2.new(1, -28, 0, 56), Position = UDim2.fromOffset(14, 366), TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
			Text = "⭐ أنت عضو VIP — تذاكر بنص السعر · دخل مضاعف · لاونج خاص",
			TextWrapped = true,
		})
	else
		new("TextLabel", {
			BackgroundTransparency = 1, Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = GOLD,
			Size = UDim2.new(1, -28, 0, 24), Position = UDim2.fromOffset(14, 364), TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
			Text = "⭐ ترقية VIP: لاونج خاص · تذاكر بنص السعر · دخل مضاعف",
		})
		-- شراء بالـ Robux (إن فُعّل) + ترقية بالكوينز
		local robux = styledButton(card, {
			Name = "VipRobux", Text = "⭐ VIP بالـ Robux", Font = Enum.Font.GothamBlack, TextSize = 17, TextColor3 = Color3.fromRGB(20, 16, 8),
			BackgroundColor3 = GOLD, Size = UDim2.new(0.5, -19, 0, 46), Position = UDim2.fromOffset(14, 392), Parent = card,
		})
		robux.MouseButton1Click:Connect(function()
			lobbyRemote:FireServer({ action = "buyVipRobux" })
		end)
		local vipCoinsOk = (data.coins or 0) >= (data.vipPrice or 500)
		local vipBtn = styledButton(card, {
			Name = "VipCoins", Text = "ترقية بـ " .. toAr(data.vipPrice or 500) .. " كوينز", Font = Enum.Font.GothamBold, TextSize = 16,
			TextColor3 = TEXT, BackgroundColor3 = Color3.fromRGB(36, 30, 64),
			Size = UDim2.new(0.5, -19, 0, 46), Position = UDim2.new(0.5, 5, 0, 392), Parent = card,
		}, vipCoinsOk)
		if vipCoinsOk then
			vipBtn.MouseButton1Click:Connect(function()
				lobbyRemote:FireServer({ action = "buyVip" })
			end)
		end
	end

	-- ملاحظة + إغلاق
	new("TextLabel", {
		BackgroundTransparency = 1, Font = Enum.Font.Gotham, TextSize = 14, TextColor3 = SUBT,
		Size = UDim2.new(1, -28, 0, 26), Position = UDim2.fromOffset(14, 470), TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
		Text = "💡 تكسب الكوينز تلقائياً بالبقاء في اللعبة.",
	})
	local close = styledButton(card, {
		Name = "Close", Text = "إغلاق", Font = Enum.Font.GothamBold, TextSize = 17, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 40),
		Position = UDim2.new(0.5, 0, 1, -14), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	close.MouseButton1Click:Connect(closeActive)
end

------------------------------------------------------------------------
-- استقبال أوامر السيرفر
------------------------------------------------------------------------
seatRemote.OnClientEvent:Connect(function(data)
	if type(data) ~= "table" then return end
	if data.action == "open" then
		showSeatMenu(data)
	elseif data.action == "dialog" then
		showDialog()
	end
end)

local onTeamData      -- forward declaration (تُعرّف في كتلة صفحة الفريق أدناه)
lobbyRemote.OnClientEvent:Connect(function(data)
	if type(data) ~= "table" then return end
	if data.action == "boxoffice" then
		showBoxOffice(data)
	elseif data.action == "store" then
		showStore(data)
	elseif data.action == "adminOpen" then
		showAdminPanel(data)
	elseif data.action == "adminDenied" then
		showAnnounce({ text = "❌ لا تملك صلاحية الإدارة (مشرف فأعلى)." })
	elseif data.action == "rankInfo" then
		myRank = typeof(data.rank) == "string" and data.rank or ""
		if updateAdminButton then updateAdminButton() end
	elseif data.action == "warn" then
		if showWarn then showWarn(data) end
	elseif data.action == "announce" then
		showAnnounce(data)
	elseif data.action == "maintenance" then
		if showMaintenance then showMaintenance(data) end
	elseif data.action == "profile" then
		showProfile(data)
	elseif data.action == "arcadeResult" then
		onArcadeResult(data)
	elseif data.action == "event" then
		playEventFx(data)
	elseif data.action == "perks" then
		if applyPerks then applyPerks(data) end
	elseif data.action == "speedSet" then
		if onStoreSpeedSet then onStoreSpeedSet(data.speed) end
	elseif data.action == "teamData" then
		if onTeamData then onTeamData(data) end
	elseif data.action == "giftAward" then
		-- 🎁 إشعار إهداء باقة من الإدارة (شريط علوي احترافي)
		showAnnounce({ text = tostring(data.text or "🎁 أهدتك الإدارة باقة مجاناً!") })
	end
end)

------------------------------------------------------------------------
-- 👥 صفحة فريق العمل — أيقونة يسار الشاشة + نافذة بطاقات (صورة أفتار + رتبة + حالة)
-- البيانات تأتي من السيرفر (teamData) وتتحدّث تلقائياً عند تغيّر الرتب/الإعداد.
------------------------------------------------------------------------
do
	local TEAM_BADGE = { owner = "👑", admin = "🛡️", mod = "🔰", staff = "🎬" }
	local TEAM_AR    = { owner = "المالك", admin = "أدمن", mod = "مشرف", staff = "طاقم السينما" }
	local TEAM_COLOR = {
		owner = GOLD, admin = Color3.fromRGB(120, 200, 255),
		mod = Color3.fromRGB(150, 255, 180), staff = Color3.fromRGB(255, 220, 130),
	}

	local teamState = { enabled = true, title = "فريق العمل", sections = {} }
	local teamPanel       -- البطاقة المفتوحة حالياً (إن وُجدت)
	local thumbCache = {} -- [userId] = imageUrl

	-- زر الفريق في الدوك الأيسر (أعلى الأزرار)
	local teamBtn = new("TextButton", {
		Name = "TeamTab", Text = "👥 الفريق", Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(36, 30, 64), AutoButtonColor = false, LayoutOrder = 1,
		Size = UDim2.fromOffset(132, 46), Parent = leftDock,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 14) }),
		new("UIStroke", { Color = PURPLE, Thickness = 1.5, Transparency = 0.2 }),
		new("UIGradient", { Rotation = 20, Color = ColorSequence.new(PURPLE, CARD) }),
	})
	teamBtn.MouseEnter:Connect(function() playSound(SOUNDS.Hover, SOUND_VOLUME); TweenService:Create(teamBtn, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(56, 46, 92) }):Play() end)
	teamBtn.MouseLeave:Connect(function() TweenService:Create(teamBtn, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(36, 30, 64) }):Play() end)

	-- اجلب صورة الأفتار (رأس) لمعرّف، وعيّنها على ImageLabel (يعمل في اللعبة المنشورة)
	local function loadAvatar(userId: number, img: ImageLabel)
		if thumbCache[userId] then img.Image = thumbCache[userId]; return end
		task.spawn(function()
			local ok, url = pcall(function()
				return Players:GetUserThumbnailAsync(userId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size150x150)
			end)
			if ok and url and img and img.Parent then
				thumbCache[userId] = url
				img.Image = url
			end
		end)
	end

	-- ===== جدول الفريق (أعمدة: الأفتار · الاسم · الرتبة · الحالة) — RTL =====
	-- مواضع الأعمدة (نِسَب من عرض الصف) موحّدة بين صف العناوين وصفوف البيانات.
	local function colLabel(parent, props)
		props.BackgroundTransparency = 1
		props.Parent = parent
		return new("TextLabel", props)
	end

	-- عنوان قسم (Section Title) — شريط ذهبي بعدد الأعضاء
	local function sectionTitle(parent, title, count, lo)
		local s = new("Frame", {
			Name = "Section", BackgroundColor3 = Color3.fromRGB(40, 32, 18), BackgroundTransparency = 0.15,
			Size = UDim2.new(1, -6, 0, 34), LayoutOrder = lo, Parent = parent,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 10) }),
			new("UIStroke", { Color = GOLD, Thickness = 1.4, Transparency = 0.2 }),
		})
		colLabel(s, { Text = "📂 " .. tostring(title), Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = GOLD,
			AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -12, 0.5, 0), Size = UDim2.new(1, -70, 1, 0),
			TextXAlignment = Enum.TextXAlignment.Right, TextTruncate = Enum.TextTruncate.AtEnd })
		colLabel(s, { Text = tostring(count) .. " 👤", Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = SUBT,
			AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 12, 0.5, 0), Size = UDim2.fromOffset(56, 34),
			TextXAlignment = Enum.TextXAlignment.Left })
	end

	-- صف العناوين الثابت (الأفتار · الاسم · المسؤولية · الحالة)
	local function tableHeader(parent, lo)
		local h = new("Frame", {
			Name = "Header", BackgroundColor3 = PURPLE, BackgroundTransparency = 0.62,
			Size = UDim2.new(1, -6, 0, 28), LayoutOrder = lo, Parent = parent,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 8) }) })
		colLabel(h, { Text = "الأفتار", Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = GOLD,
			AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -6, 0.5, 0), Size = UDim2.fromOffset(48, 28),
			TextXAlignment = Enum.TextXAlignment.Center })
		colLabel(h, { Text = "الاسم", Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = GOLD,
			AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -54, 0.5, 0), Size = UDim2.new(0.32, 0, 1, 0),
			TextXAlignment = Enum.TextXAlignment.Right })
		colLabel(h, { Text = "المسؤولية", Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = GOLD,
			AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.43, 0, 0.5, 0), Size = UDim2.new(0.32, 0, 1, 0),
			TextXAlignment = Enum.TextXAlignment.Center })
		colLabel(h, { Text = "الحالة", Font = Enum.Font.GothamBold, TextSize = 12, TextColor3 = GOLD,
			AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Size = UDim2.new(0.22, 0, 1, 0),
			TextXAlignment = Enum.TextXAlignment.Left })
	end

	-- صف عضو واحد (Zebra = تظليل متناوب)
	local function tableRow(parent, m, order, zebra)
		local rank = m.rank or ""
		local accent = TEAM_COLOR[rank] or CYAN
		local row = new("Frame", {
			Name = "Row", BackgroundColor3 = zebra and CARD2 or CARD, BackgroundTransparency = 0.1,
			Size = UDim2.new(1, -6, 0, 50), LayoutOrder = order, Parent = parent,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 10) }),
			new("UIStroke", { Color = accent, Thickness = 1, Transparency = 0.5 }),
		})
		-- عمود الأفتار (يمين) + شارة الرتبة
		local avatarHolder = new("Frame", {
			BackgroundColor3 = CARD, Size = UDim2.fromOffset(40, 40), AnchorPoint = Vector2.new(1, 0.5),
			Position = UDim2.new(1, -8, 0.5, 0), Parent = row,
		}, {
			new("UICorner", { CornerRadius = UDim.new(1, 0) }),
			new("UIStroke", { Color = accent, Thickness = 1.5, Transparency = 0.1 }),
		})
		local img = new("ImageLabel", {
			BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Image = "", Parent = avatarHolder,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
		loadAvatar(m.userId, img)
		new("TextLabel", {
			BackgroundColor3 = accent, Text = TEAM_BADGE[rank] or "⭐", Font = Enum.Font.GothamBlack, TextSize = 11,
			TextColor3 = Color3.fromRGB(18, 14, 28), Size = UDim2.fromOffset(19, 19), AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, 0, 1, 2), Parent = avatarHolder,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }), new("UIStroke", { Color = CARD2, Thickness = 1.2 }) })
		-- عمود الاسم
		colLabel(row, { Text = m.name or ("#" .. tostring(m.userId)), Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = TEXT,
			AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -54, 0.5, 0), Size = UDim2.new(0.32, 0, 1, 0),
			TextXAlignment = Enum.TextXAlignment.Right, TextTruncate = Enum.TextTruncate.AtEnd })
		-- عمود المسؤولية (بلون الرتبة)
		colLabel(row, { Text = m.role or (TEAM_AR[rank] or "عضو"),
			Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = accent,
			AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.43, 0, 0.5, 0), Size = UDim2.new(0.32, 0, 1, 0),
			TextXAlignment = Enum.TextXAlignment.Center, TextTruncate = Enum.TextTruncate.AtEnd })
		-- عمود الحالة
		colLabel(row, { Text = m.online and "🟢 متصل" or "⚪ غير متصل",
			Font = Enum.Font.GothamMedium, TextSize = 12, TextColor3 = m.online and Color3.fromRGB(150, 255, 180) or SUBT,
			AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Size = UDim2.new(0.22, 0, 1, 0),
			TextXAlignment = Enum.TextXAlignment.Left })
	end

	local function buildTeamPanel()
		local _, card = makeModal(UDim2.fromOffset(440, 560))
		teamPanel = card
		card.Destroying:Connect(function() if teamPanel == card then teamPanel = nil end end)

		new("TextLabel", {
			BackgroundTransparency = 1, Text = "👥 " .. (teamState.title or "فريق العمل"),
			Font = Enum.Font.GothamBlack, TextSize = 22, TextColor3 = GOLD,
			Size = UDim2.new(1, -28, 0, 36), Position = UDim2.fromOffset(14, 12),
			TextXAlignment = Enum.TextXAlignment.Right, TextWrapped = true, Parent = card,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "تعرّف على إدارة وطاقم السينما 🎬",
			Font = Enum.Font.GothamMedium, TextSize = 13, TextColor3 = SUBT,
			Size = UDim2.new(1, -28, 0, 20), Position = UDim2.fromOffset(14, 48),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
		})

		local scroll = new("ScrollingFrame", {
			BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.new(1, -20, 1, -130),
			Position = UDim2.fromOffset(10, 78), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
			ScrollBarThickness = 5, ScrollBarImageColor3 = PURPLE, Parent = card,
		}, {
			new("UIListLayout", { Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingTop = UDim.new(0, 4), PaddingBottom = UDim.new(0, 4) }),
		})

		local sections = teamState.sections or {}
		if #sections == 0 then
			new("TextLabel", {
				BackgroundTransparency = 1, Text = "لا يوجد أعضاء فريق معروضون حالياً.", Font = Enum.Font.GothamBold,
				TextSize = 15, TextColor3 = SUBT, Size = UDim2.new(1, -16, 0, 60), TextWrapped = true,
				TextXAlignment = Enum.TextXAlignment.Center, Parent = scroll,
			})
		else
			local lo = 0
			for _, sec in ipairs(sections) do
				local mem = sec.members or {}
				lo += 1; sectionTitle(scroll, sec.title or "قسم", #mem, lo)
				if #mem > 0 then
					lo += 1; tableHeader(scroll, lo)
					for i, m in ipairs(mem) do lo += 1; tableRow(scroll, m, lo, i % 2 == 0) end
				else
					lo += 1
					new("TextLabel", {
						BackgroundTransparency = 1, Text = "— لا أعضاء في هذا القسم بعد —", Font = Enum.Font.GothamMedium,
						TextSize = 13, TextColor3 = SUBT, Size = UDim2.new(1, -16, 0, 34), TextWrapped = true,
						TextXAlignment = Enum.TextXAlignment.Center, LayoutOrder = lo, Parent = scroll,
					})
				end
			end
		end

		local close = styledButton(card, {
			Name = "Close", Text = "إغلاق", Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
			BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 38),
			Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
		})
		close.MouseButton1Click:Connect(function() closeActive() end)
	end

	teamBtn.MouseButton1Click:Connect(function()
		playSound(SOUNDS.Click, SOUND_VOLUME)
		lobbyRemote:FireServer({ action = "teamRequest" })  -- اطلب أحدث بيانات
		buildTeamPanel()
	end)

	-- يستقبل تحديثات الفريق من السيرفر
	onTeamData = function(data)
		teamState.enabled = data.enabled ~= false
		if typeof(data.title) == "string" then teamState.title = data.title end
		if type(data.sections) == "table" then teamState.sections = data.sections end
		teamBtn.Visible = teamState.enabled
		-- لو النافذة مفتوحة: أعِد بناءها بالبيانات الجديدة (مزامنة فورية)
		if teamPanel and teamPanel.Parent then buildTeamPanel() end
	end

	-- اطلب البيانات الأولية بعد جهوزية الجلسة
	task.delay(2.5, function() lobbyRemote:FireServer({ action = "teamRequest" }) end)
end

------------------------------------------------------------------------
-- 🛒 المتجر — نافذة احترافية وسط الشاشة («فاترينة»): شريط تصنيفات جانبي
-- + بانر عرض كبير (Hero) للمنتج المميّز + شبكة بطاقات المنتجات.
-- باقة «سرعة البرق» المملوكة تعرض شريط تمرير للتحكم بسرعة المشي (يثبّته السيرفر).
------------------------------------------------------------------------
do
	local PW, PH = 800, 540          -- مقاس النافذة (يصغّره UIScale تلقائياً على الجوال)
	local storeRoot                  -- الخلفية+النافذة المفتوحة حالياً
	local storeOpen = false
	local storeData                  -- آخر بيانات وردت من السيرفر
	local activeCat = "all"          -- التصنيف المختار حالياً
	local speedUpdateUI              -- دالة مزامنة شريط السرعة مع قيمة السيرفر (إن عُرض)
	local uisConns = {}              -- اتصالات UserInputService للسلايدر (تُفصل عند الإغلاق)

	local CATS = {
		{ key = "all",   label = "الكل" },
		{ key = "packs", label = "الباقات" },
		{ key = "coins", label = "حزم كوينز" },
		{ key = "speed", label = "السرعة" },
	}

	local function clearConns()
		for _, c in ipairs(uisConns) do pcall(function() c:Disconnect() end) end
		uisConns = {}
	end

	local function destroyStore(animated)
		speedUpdateUI = nil
		clearConns()
		local r = storeRoot
		storeRoot = nil
		storeOpen = false
		if not r then return end
		if not animated then if r.Parent then r:Destroy() end return end
		TweenService:Create(r, TweenInfo.new(0.18), { BackgroundTransparency = 1 }):Play()
		for _, d in ipairs(r:GetDescendants()) do
			if d:IsA("GuiObject") then
				TweenService:Create(d, TweenInfo.new(0.16), { BackgroundTransparency = 1 }):Play()
				if d:IsA("TextLabel") or d:IsA("TextButton") then
					TweenService:Create(d, TweenInfo.new(0.16), { TextTransparency = 1 }):Play()
				end
			end
		end
		task.delay(0.2, function() if r and r.Parent then r:Destroy() end end)
	end
	local function closeStore() destroyStore(true) end

	-- أيقونة العنصر (صورة Roblox أو رمز احتياطي) داخل قرص أنيق
	local function buildIcon(parent, item, size, anchor, pos)
		local rad = math.floor(size * 0.22)
		local holder = new("Frame", {
			BackgroundColor3 = CARD, BorderSizePixel = 0, Size = UDim2.fromOffset(size, size),
			AnchorPoint = anchor, Position = pos, Parent = parent,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, rad) }),
			new("UIStroke", { Color = GOLD, Thickness = 1.4, Transparency = 0.4 }),
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(CARD2, CARD) }),
		})
		if item.icon and item.icon ~= 0 then
			new("ImageLabel", {
				BackgroundTransparency = 1, Image = "rbxassetid://" .. tostring(item.icon),
				Size = UDim2.fromScale(1, 1), Parent = holder,
			}, { new("UICorner", { CornerRadius = UDim.new(0, rad) }) })
		else
			new("TextLabel", {
				BackgroundTransparency = 1, Text = item.emoji or "🛒", Font = Enum.Font.GothamBlack,
				TextScaled = true, TextColor3 = TEXT, AnchorPoint = Vector2.new(0.5, 0.5),
				Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.6, 0.6), Parent = holder,
			})
		end
		return holder
	end

	-- إطلاق عملية الشراء (Game Pass أو منتج) + حالة انتظار مؤقتة على الزر
	local function fireBuy(item, btn, label)
		btn.Text = "⏳ جاري فتح نافذة الشراء..."
		task.delay(2, function() if btn and btn.Parent then btn.Text = label end end)
		if item.kind == "gamepass" then
			lobbyRemote:FireServer({ action = "buyGamePass", passId = item.id })
		else
			lobbyRemote:FireServer({ action = "buyProduct", productId = item.id })
		end
	end

	-- شريط تمرير سرعة المشي (يظهر فقط لمالك «سرعة البرق») — السيرفر هو من يثبّت القيمة
	local function buildSpeedSlider(parent, posY, data)
		local minV = tonumber(data.speedMin) or 16
		local maxV = tonumber(data.speedMax) or 32
		local curV = math.clamp(tonumber(data.speedValue) or minV, minV, maxV)

		local box = new("Frame", {
			BackgroundColor3 = CARD, BorderSizePixel = 0,
			Size = UDim2.new(1, -32, 0, 74), Position = UDim2.fromOffset(16, posY), Parent = parent,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 12) }),
			new("UIStroke", { Color = GOLD, Thickness = 1.2, Transparency = 0.5 }),
		})
		local valLbl = new("TextLabel", {
			BackgroundTransparency = 1, Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = GOLD,
			TextXAlignment = Enum.TextXAlignment.Right, Size = UDim2.new(1, -24, 0, 24),
			Position = UDim2.fromOffset(12, 8), Parent = box,
		})
		local track = new("Frame", {
			Active = true, BackgroundColor3 = Color3.fromRGB(44, 38, 64), BorderSizePixel = 0,
			Size = UDim2.new(1, -28, 0, 10), Position = UDim2.fromOffset(14, 48), Parent = box,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
		local fill = new("Frame", {
			BackgroundColor3 = GOLD, BorderSizePixel = 0, Size = UDim2.fromScale(0, 1), Parent = track,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
		local knob = new("TextButton", {
			Text = "", AutoButtonColor = false, BackgroundColor3 = TEXT, ZIndex = 3,
			Size = UDim2.fromOffset(22, 22), AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.new(0, 0, 0.5, 0), Parent = track,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }), new("UIStroke", { Color = GOLD, Thickness = 2 }) })

		local function paint(v)
			v = math.clamp(math.floor(v + 0.5), minV, maxV)
			curV = v
			-- نحفظ القيمة في بيانات المتجر حتى لا يرجع الشريط لقيمة قديمة عند تبديل التصنيف وإعادة بنائه
			if data then data.speedValue = v end
			local pct = (v - minV) / math.max(maxV - minV, 1)
			fill.Size = UDim2.fromScale(pct, 1)
			knob.Position = UDim2.new(pct, 0, 0.5, 0)
			valLbl.Text = "🏃 سرعتك: " .. toAr(v) .. " / " .. toAr(maxV)
		end
		paint(curV)
		speedUpdateUI = paint   -- ليُحدّثها تأكيد السيرفر (speedSet)

		local dragging = false
		local function valueFromX(x)
			local absX = track.AbsolutePosition.X
			local absW = math.max(track.AbsoluteSize.X, 1)
			local sx = math.clamp((x - absX) / absW, 0, 1)
			return minV + sx * (maxV - minV)
		end
		local function startDrag(input)
			if input.UserInputType == Enum.UserInputType.MouseButton1
				or input.UserInputType == Enum.UserInputType.Touch then
				dragging = true
				paint(valueFromX(input.Position.X))
			end
		end
		knob.InputBegan:Connect(startDrag)
		track.InputBegan:Connect(startDrag)
		table.insert(uisConns, UserInputService.InputChanged:Connect(function(input)
			if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement
				or input.UserInputType == Enum.UserInputType.Touch) then
				paint(valueFromX(input.Position.X))
			end
		end))
		table.insert(uisConns, UserInputService.InputEnded:Connect(function(input)
			if dragging and (input.UserInputType == Enum.UserInputType.MouseButton1
				or input.UserInputType == Enum.UserInputType.Touch) then
				dragging = false
				lobbyRemote:FireServer({ action = "setSpeed", speed = curV })  -- السيرفر يحصر القيمة ويطبّقها
			end
		end))
		return box
	end

	-- بانر العرض الكبير (Hero) للمنتج المميّز (سرعة البرق)
	local function buildHero(parent, item, order)
		local ownedSpeed = item.owned and item.cat == "speed"
		local hero = new("Frame", {
			Name = "Hero", BackgroundColor3 = CARD2, BorderSizePixel = 0, LayoutOrder = order or 1,
			Size = UDim2.new(1, 0, 0, ownedSpeed and 252 or 196), Parent = parent,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 18) }),
			new("UIStroke", { Color = GOLD, Thickness = 2, Transparency = 0.25 }),
			new("UIGradient", { Rotation = 30, Color = ColorSequence.new(Color3.fromRGB(60, 42, 100), CARD) }),
		})

		new("TextLabel", {
			BackgroundColor3 = GOLD, Text = "★ مميّز", Font = Enum.Font.GothamBlack, TextSize = 13,
			TextColor3 = Color3.fromRGB(30, 22, 8), Size = UDim2.fromOffset(84, 26),
			Position = UDim2.fromOffset(14, 14), Parent = hero,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 8) }) })

		buildIcon(hero, item, 104, Vector2.new(1, 0), UDim2.new(1, -16, 0, 16))

		new("TextLabel", {
			BackgroundTransparency = 1, Text = item.name, Font = Enum.Font.GothamBlack, TextSize = 28,
			TextColor3 = TEXT, TextXAlignment = Enum.TextXAlignment.Right,
			Size = UDim2.new(1, -144, 0, 36), Position = UDim2.fromOffset(16, 48), Parent = hero,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = item.desc or "", Font = Enum.Font.GothamMedium, TextSize = 15,
			TextColor3 = SUBT, TextXAlignment = Enum.TextXAlignment.Right, TextYAlignment = Enum.TextYAlignment.Top,
			TextWrapped = true, Size = UDim2.new(1, -144, 0, 50), Position = UDim2.fromOffset(16, 88), Parent = hero,
		})

		if item.owned then
			new("TextLabel", {
				BackgroundColor3 = Color3.fromRGB(150, 235, 170), Text = "✓ مملوك", Font = Enum.Font.GothamBlack,
				TextSize = 14, TextColor3 = Color3.fromRGB(20, 28, 18), Size = UDim2.fromOffset(104, 28),
				AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -16, 0, 130), Parent = hero,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 8) }) })
			if ownedSpeed and storeData and storeData.speed ~= false then
				buildSpeedSlider(hero, 168, storeData)
			end
		else
			local label = "🛒 اشترِ — " .. toAr(item.price or 0) .. " R$"
			local buy = styledButton(hero, {
				Name = "Buy", Text = label, Font = Enum.Font.GothamBlack, TextSize = 18,
				TextColor3 = Color3.fromRGB(20, 16, 8), BackgroundColor3 = GOLD,
				Size = UDim2.new(1, -32, 0, 44), Position = UDim2.fromOffset(16, 142), Parent = hero,
			})
			buy.MouseButton1Click:Connect(function()
				playSound(SOUNDS.Click, SOUND_VOLUME)
				fireBuy(item, buy, label)
			end)
		end
		return hero
	end

	-- بطاقة منتج صغيرة داخل الشبكة (مقاسها يحدّده UIGridLayout)
	local function buildCard(parent, item)
		local card = new("Frame", {
			Name = "Item", BackgroundColor3 = CARD2, BorderSizePixel = 0, Parent = parent,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 14) }),
			new("UIStroke", { Color = item.kind == "gamepass" and GOLD or PURPLE, Thickness = 1.4, Transparency = 0.45 }),
		})
		buildIcon(card, item, 54, Vector2.new(1, 0), UDim2.new(1, -10, 0, 10))
		new("TextLabel", {
			BackgroundTransparency = 1, Text = item.name, Font = Enum.Font.GothamBlack, TextSize = 17,
			TextColor3 = TEXT, TextXAlignment = Enum.TextXAlignment.Right, TextTruncate = Enum.TextTruncate.AtEnd,
			Size = UDim2.new(1, -76, 0, 26), Position = UDim2.fromOffset(10, 10), Parent = card,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = item.desc or "", Font = Enum.Font.GothamMedium, TextSize = 13,
			TextColor3 = SUBT, TextXAlignment = Enum.TextXAlignment.Right, TextYAlignment = Enum.TextYAlignment.Top,
			TextWrapped = true, Size = UDim2.new(1, -20, 0, 46), Position = UDim2.fromOffset(10, 42), Parent = card,
		})
		if item.owned then
			styledButton(card, {
				Name = "Owned", Text = "✓ مملوك", Font = Enum.Font.GothamBlack, TextSize = 15,
				TextColor3 = Color3.fromRGB(20, 28, 18), BackgroundColor3 = Color3.fromRGB(150, 235, 170),
				Size = UDim2.new(1, -20, 0, 34), Position = UDim2.new(0, 10, 1, -44), Parent = card,
			}, false)
		else
			local label = "🛒 " .. toAr(item.price or 0) .. " R$"
			local buy = styledButton(card, {
				Name = "Buy", Text = label, Font = Enum.Font.GothamBlack, TextSize = 15,
				TextColor3 = Color3.fromRGB(20, 16, 8), BackgroundColor3 = GOLD,
				Size = UDim2.new(1, -20, 0, 34), Position = UDim2.new(0, 10, 1, -44), Parent = card,
			})
			buy.MouseButton1Click:Connect(function()
				playSound(SOUNDS.Click, SOUND_VOLUME)
				fireBuy(item, buy, label)
			end)
		end
		return card
	end

	showStore = function(data)
		storeData = data
		local keepCat = activeCat or "all"
		if storeRoot then destroyStore(false) end
		storeOpen = true

		local backdrop = new("TextButton", {
			Name = "StoreBackdrop", Text = "", AutoButtonColor = false, Modal = true,
			BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1,
			Size = UDim2.fromScale(1, 1), Parent = gui,
		})
		storeRoot = backdrop
		backdrop.MouseButton1Click:Connect(closeStore)
		TweenService:Create(backdrop, TweenInfo.new(0.2), { BackgroundTransparency = 0.5 }):Play()

		local panel = new("Frame", {
			Name = "StorePanel", Active = true, BackgroundColor3 = CARD, BorderSizePixel = 0,
			AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
			Size = UDim2.fromOffset(math.floor(PW * 0.92), math.floor(PH * 0.92)), Parent = backdrop,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 22) }),
			new("UIStroke", { Color = PURPLE, Thickness = 2, Transparency = 0.2 }),
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(CARD2, CARD) }),
		})
		TweenService:Create(panel, TweenInfo.new(0.26, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
			{ Size = UDim2.fromOffset(PW, PH) }):Play()

		-- الرأس: العنوان + الرصيد + زر الإغلاق
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "🛒 متجر مدينة التبرعات", Font = Enum.Font.GothamBlack,
			TextSize = 24, TextColor3 = GOLD, TextXAlignment = Enum.TextXAlignment.Right,
			Size = UDim2.new(1, -130, 0, 32), Position = UDim2.fromOffset(64, 14), Parent = panel,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "💰 رصيدك: " .. toAr(data.coins or 0) .. " كوينز",
			Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = CYAN, TextXAlignment = Enum.TextXAlignment.Right,
			Size = UDim2.new(1, -130, 0, 20), Position = UDim2.fromOffset(64, 46), Parent = panel,
		})
		local close = styledButton(panel, {
			-- نستخدم «×» (U+00D7) بدل «✕» (U+2715) لأن الأخير لا يتوفّر في خط روبلوكس فيظهر مربّعاً فارغاً
			Name = "X", Text = "×", Font = Enum.Font.GothamBlack, TextSize = 26, TextColor3 = TEXT,
			BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.fromOffset(38, 38),
			Position = UDim2.fromOffset(14, 14), Parent = panel,
		})
		close.MouseButton1Click:Connect(closeStore)

		-- شريط التصنيفات العمودي (يمين النافذة)
		local rail = new("Frame", {
			Name = "Rail", BackgroundTransparency = 1, AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -14, 0, 78), Size = UDim2.new(0, 150, 1, -92), Parent = panel,
		}, {
			new("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }),
		})

		-- منطقة المحتوى (يسار شريط التصنيفات)
		local content = new("ScrollingFrame", {
			Name = "Content", BackgroundTransparency = 1, BorderSizePixel = 0,
			Position = UDim2.fromOffset(14, 78), Size = UDim2.new(1, -192, 1, -92),
			CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
			ScrollBarThickness = 6, ScrollBarImageColor3 = PURPLE, Parent = panel,
		}, {
			new("UIListLayout", { Padding = UDim.new(0, 12), SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingRight = UDim.new(0, 6), PaddingBottom = UDim.new(0, 8) }),
		})

		local function renderContent()
			speedUpdateUI = nil
			clearConns()
			for _, ch in ipairs(content:GetChildren()) do
				if not ch:IsA("UIListLayout") and not ch:IsA("UIPadding") then ch:Destroy() end
			end
			local featured
			for _, it in ipairs(storeData.items or {}) do
				if it.featured then featured = it; break end
			end
			if (activeCat == "all" or activeCat == "speed") and featured then
				buildHero(content, featured, 1)
			end
			if activeCat == "speed" then return end

			local grid = new("Frame", {
				Name = "Grid", BackgroundTransparency = 1, AutomaticSize = Enum.AutomaticSize.Y,
				Size = UDim2.new(1, 0, 0, 0), LayoutOrder = 2, Parent = content,
			}, {
				new("UIGridLayout", {
					CellSize = UDim2.fromOffset(280, 150), CellPadding = UDim2.fromOffset(12, 12),
					HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder,
				}),
			})
			local any = false
			for _, it in ipairs(storeData.items or {}) do
				local show = false
				if activeCat == "all" then show = not it.featured
				elseif activeCat == "packs" then show = (it.cat == "packs")
				elseif activeCat == "coins" then show = (it.cat == "coins") end
				if show then buildCard(grid, it); any = true end
			end
			if not any then grid:Destroy() end
		end

		local catBtns = {}
		local function setActive(key)
			activeCat = key
			for k, b in pairs(catBtns) do
				local on = (k == key)
				b.BackgroundColor3 = on and PURPLE or Color3.fromRGB(36, 30, 64)
				b.TextColor3 = on and Color3.fromRGB(22, 14, 40) or TEXT
			end
			renderContent()
		end
		for i, c in ipairs(CATS) do
			local b = new("TextButton", {
				Name = "Cat_" .. c.key, Text = c.label, Font = Enum.Font.GothamBlack, TextSize = 16,
				TextColor3 = TEXT, BackgroundColor3 = Color3.fromRGB(36, 30, 64), AutoButtonColor = false,
				Size = UDim2.new(1, 0, 0, 46), LayoutOrder = i, Parent = rail,
			}, {
				new("UICorner", { CornerRadius = UDim.new(0, 12) }),
				new("UIStroke", { Color = PURPLE, Thickness = 1.2, Transparency = 0.5 }),
			})
			catBtns[c.key] = b
			b.MouseEnter:Connect(function()
				playSound(SOUNDS.Hover, SOUND_VOLUME)
				if activeCat ~= c.key then
					TweenService:Create(b, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(56, 46, 92) }):Play()
				end
			end)
			b.MouseLeave:Connect(function()
				if activeCat ~= c.key then
					TweenService:Create(b, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(36, 30, 64) }):Play()
				end
			end)
			b.MouseButton1Click:Connect(function()
				playSound(SOUNDS.Click, SOUND_VOLUME)
				setActive(c.key)
			end)
		end

		setActive(keepCat)
	end

	-- مزامنة شريط السرعة مع القيمة التي ثبّتها السيرفر
	onStoreSpeedSet = function(v)
		local n = tonumber(v)
		if not n then return end
		-- نُحدّث بيانات المتجر أيضاً لتبقى القيمة صحيحة حتى لو أُعيد بناء الشريط لاحقاً
		if storeData then storeData.speedValue = n end
		if speedUpdateUI then speedUpdateUI(n) end
	end

	-- الزر الثابت على يسار الشاشة لفتح/إغلاق المتجر
	local tab = new("TextButton", {
		Name = "StoreTab", Text = "🛒 المتجر", Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(36, 30, 64), AutoButtonColor = false,
		LayoutOrder = 1, Size = UDim2.fromOffset(132, 46), Parent = leftDock,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 14) }),
		new("UIStroke", { Color = GOLD, Thickness = 1.5, Transparency = 0.2 }),
		new("UIGradient", { Rotation = 20, Color = ColorSequence.new(PURPLE, CARD) }),
	})
	tab.MouseEnter:Connect(function()
		playSound(SOUNDS.Hover, SOUND_VOLUME)
		TweenService:Create(tab, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(56, 46, 92) }):Play()
	end)
	tab.MouseLeave:Connect(function()
		TweenService:Create(tab, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(36, 30, 64) }):Play()
	end)
	tab.MouseButton1Click:Connect(function()
		playSound(SOUNDS.Click, SOUND_VOLUME)
		if storeOpen then
			closeStore()
		else
			lobbyRemote:FireServer({ action = "openStore" })
		end
	end)
end

------------------------------------------------------------------------
-- إعلان عام على الشاشة (شريط علوي يظهر ثم يختفي)
------------------------------------------------------------------------
local announceFrame
showAnnounce = function(data)
	if announceFrame and announceFrame.Parent then announceFrame:Destroy() end
	-- شريط إعلان أعلى وسط الشاشة (ينزلق من الأعلى) — بعيد عن أعمدة الأزرار الجانبية
	-- يكبر ارتفاع الشريط تلقائياً ليتسع للنص الطويل (عدة باقات) مع حدّ أدنى 58 يبقي الشكل المعتاد للنص القصير
	local frame = new("Frame", {
		Name = "Announce", BackgroundColor3 = CARD, AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, -90), Size = UDim2.new(0, 360, 0, 0),
		AutomaticSize = Enum.AutomaticSize.Y, ZIndex = 80, Parent = gui,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 16) }),
		new("UIStroke", { Color = GOLD, Thickness = 2, Transparency = 0.1 }),
		new("UIGradient", { Rotation = 20, Color = ColorSequence.new(CARD2, CARD) }),
		new("UISizeConstraint", { MinSize = Vector2.new(360, 58) }),
		new("UIPadding", {
			PaddingTop = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8),
			PaddingLeft = UDim.new(0, 12), PaddingRight = UDim.new(0, 12),
		}),
		new("TextLabel", {
			BackgroundTransparency = 1, Text = tostring(data.text or ""), Font = Enum.Font.GothamBlack,
			TextSize = 18, TextColor3 = GOLD, TextScaled = false, TextWrapped = true,
			AutomaticSize = Enum.AutomaticSize.Y, Size = UDim2.new(1, 0, 0, 42), ZIndex = 81,
			TextXAlignment = Enum.TextXAlignment.Center, TextYAlignment = Enum.TextYAlignment.Center,
		}),
	})
	announceFrame = frame
	TweenService:Create(frame, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
		{ Position = UDim2.new(0.5, 0, 0, 14) }):Play()
	task.delay(5, function()
		if frame and frame.Parent and announceFrame == frame then
			local tw = TweenService:Create(frame, TweenInfo.new(0.4),
				{ Position = UDim2.new(0.5, 0, 0, -90) })
			tw:Play()
			tw.Completed:Once(function() if frame then frame:Destroy() end end)
		end
	end)
end

-- ⚠️ نافذة تحذير إداري تظهر للّاعب المُحذَّر (وسط الشاشة + السبب)
showWarn = function(data)
	local reason = tostring(data.reason or "تنبيه من الإدارة.")
	local by = tostring(data.by or "الإدارة")
	local overlay = new("Frame", {
		Name = "WarnOverlay", BackgroundColor3 = Color3.fromRGB(0, 0, 0), BackgroundTransparency = 0.5,
		Size = UDim2.fromScale(1, 1), ZIndex = 150, Active = true, Parent = gui,
	})
	local cardW = new("Frame", {
		BackgroundColor3 = CARD, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(420, 250), ZIndex = 151, Parent = overlay,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 20) }),
		new("UIStroke", { Color = Color3.fromRGB(255, 190, 60), Thickness = 3, Transparency = 0.05 }),
		new("UIGradient", { Rotation = 90, Color = ColorSequence.new(CARD2, CARD) }),
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "⚠️ تحذير إداري", Font = Enum.Font.GothamBlack, TextSize = 28,
		TextColor3 = Color3.fromRGB(255, 200, 70), Size = UDim2.new(1, -36, 0, 48), Position = UDim2.fromOffset(18, 22),
		TextXAlignment = Enum.TextXAlignment.Center, ZIndex = 152, Parent = cardW,
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "السبب:\n" .. reason, Font = Enum.Font.GothamMedium, TextSize = 18,
		TextColor3 = TEXT, TextWrapped = true, Size = UDim2.new(1, -44, 0, 110), Position = UDim2.fromOffset(22, 78),
		TextXAlignment = Enum.TextXAlignment.Center, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 152, Parent = cardW,
	})
	local okBtn = styledButton(cardW, {
		Name = "OK", Text = "حسناً، فهمت", Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = Color3.fromRGB(20, 16, 8),
		BackgroundColor3 = Color3.fromRGB(255, 200, 70), Size = UDim2.new(1, -44, 0, 44),
		Position = UDim2.new(0.5, 0, 1, -16), AnchorPoint = Vector2.new(0.5, 1), ZIndex = 152, Parent = cardW,
	})
	okBtn.MouseButton1Click:Connect(function() overlay:Destroy() end)
	pcall(function() playSound(SOUNDS.Click, SOUND_VOLUME) end)
end

-- تجميد اللاعب أثناء الصيانة: لا أحد يتحرك (حتى الأدمن) لين تُلغى الصيانة فعلياً
local maintActive = false
local maintFreezeConn
local lastMaintData

local function applyFreezeToChar(char)
	if not char then return end
	local hum = char:FindFirstChildWhichIsA("Humanoid")
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if hum then
		if hum.WalkSpeed ~= 0 then hum.WalkSpeed = 0 end
		if hum.JumpPower ~= 0 then hum.JumpPower = 0 end
		pcall(function() if hum.JumpHeight ~= 0 then hum.JumpHeight = 0 end end)
		hum:SetStateEnabled(Enum.HumanoidStateType.Jumping, false)
	end
	if hrp and not hrp.Anchored then hrp.Anchored = true end
end

local function unfreezeChar(char)
	if not char then return end
	local hum = char:FindFirstChildWhichIsA("Humanoid")
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if hrp then hrp.Anchored = false end
	if hum then
		hum:SetStateEnabled(Enum.HumanoidStateType.Jumping, true)
		-- استعد السرعة الأساسية (سرعة باقة «البرق» إن مُلكت، وإلا 16) بدل رقم ثابت
		local base = LocalPlayer:GetAttribute("BaseWalkSpeed")
		hum.WalkSpeed = (type(base) == "number" and base > 0) and base or 16
		hum.JumpPower = 50
		pcall(function() hum.JumpHeight = 7.2 end)
	end
end

local function startMaintFreeze()
	if maintFreezeConn then return end
	applyFreezeToChar(LocalPlayer.Character)
	maintFreezeConn = game:GetService("RunService").Heartbeat:Connect(function()
		if not maintActive then return end
		applyFreezeToChar(LocalPlayer.Character)
		-- الشاشة تختفي تلقائياً وقت تفتح لوحة الإدارة (لإلغاء الصيانة) وترجع بعد ما تُغلق
		if (not maintenanceFrame or not maintenanceFrame.Parent) and activeRoot == nil then
			showMaintenance(lastMaintData)
		elseif maintenanceFrame and maintenanceFrame.Parent then
			maintenanceFrame.Visible = (activeRoot == nil)
		end
	end)
end

local function stopMaintFreeze()
	if maintFreezeConn then maintFreezeConn:Disconnect(); maintFreezeConn = nil end
	unfreezeChar(LocalPlayer.Character)
end

LocalPlayer.CharacterAdded:Connect(function(char)
	if maintActive then
		task.wait(0.25)
		applyFreezeToChar(char)
	end
end)

-- شاشة الصيانة/الإغلاق المؤقت — تعرض الرسالة + زر دخول الإدارة (لإلغاء الصيانة فقط)
showMaintenance = function(data)
	if type(data) == "table" then lastMaintData = data end
	-- إنهاء الصيانة: فكّ التجميد وأزل الشاشة
	if not data or data.on ~= true then
		maintActive = false
		stopMaintFreeze()
		if maintenanceFrame and maintenanceFrame.Parent then maintenanceFrame:Destroy() end
		maintenanceFrame = nil
		return
	end
	-- الصيانة مفعّلة: جمّد كل اللاعبين (حتى الأدمن) لين تُلغى الصيانة
	maintActive = true
	startMaintFreeze()
	if maintenanceFrame and maintenanceFrame.Parent then maintenanceFrame:Destroy() end
	maintenanceFrame = nil

	local overlay = new("Frame", {
		Name = "Maintenance", BackgroundColor3 = Color3.fromRGB(8, 6, 18), BackgroundTransparency = 0.04,
		Size = UDim2.fromScale(1, 1), ZIndex = 200, Active = true, Parent = gui,
	}, { new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromRGB(20, 14, 40), Color3.fromRGB(8, 6, 18)) }) })
	maintenanceFrame = overlay

	local cardM = new("Frame", {
		BackgroundColor3 = CARD, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(460, 280), ZIndex = 201, Parent = overlay,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 22) }),
		new("UIStroke", { Color = GOLD, Thickness = 2, Transparency = 0.15 }),
		new("UIGradient", { Rotation = 90, Color = ColorSequence.new(CARD2, CARD) }),
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "🛠️ تحت الصيانة", Font = Enum.Font.GothamBlack, TextSize = 30, TextColor3 = GOLD,
		Size = UDim2.new(1, -36, 0, 50), Position = UDim2.fromOffset(18, 26), ZIndex = 202,
		TextXAlignment = Enum.TextXAlignment.Center, Parent = cardM,
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Text = tostring(data.text or "السينما تحت الصيانة مؤقتاً."), Font = Enum.Font.GothamMedium,
		TextSize = 18, TextColor3 = TEXT, TextWrapped = true, Size = UDim2.new(1, -44, 0, 120),
		Position = UDim2.fromOffset(22, 86), ZIndex = 202, TextXAlignment = Enum.TextXAlignment.Center, Parent = cardM,
	})
	-- زر دخول الإدارة يبقى متاحاً دائماً (حتى أثناء الصيانة) لإعادة الفتح
	local adminBtn = styledButton(cardM, {
		Name = "AdminAccess", Text = "👑 دخول الإدارة", Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -44, 0, 44),
		Position = UDim2.new(0.5, 0, 1, -18), AnchorPoint = Vector2.new(0.5, 1), ZIndex = 202, Parent = cardM,
	})
	adminBtn.ZIndex = 202
	adminBtn.MouseButton1Click:Connect(function()
		-- لا نلغي التجميد ولا الصيانة — فقط نفتح لوحة الإدارة فوق الشاشة لإلغاء الصيانة
		-- (الشاشة تختفي تلقائياً ما دامت اللوحة مفتوحة، وترجع لو أغلقتها بدون إلغاء الصيانة)
		-- فتح لوحة الإدارة مباشرة (التحقق بالرتبة في السيرفر)
		lobbyRemote:FireServer({ action = "adminAuth" })
	end)
end

------------------------------------------------------------------------
-- لوحة الإدارة (لأصحاب الصلاحية فقط) — محمية بكود دخول
------------------------------------------------------------------------
local ADMIN_IDS = { [2771986878] = true }  -- مطابقة لإعداد السيرفر

local GREEN_BTN = Color3.fromRGB(32, 70, 44)
local RED_BTN   = Color3.fromRGB(96, 32, 40)
local NEU_BTN   = Color3.fromRGB(36, 30, 64)
local ORG_BTN   = Color3.fromRGB(120, 72, 30)

showAdminPanel = function(data)
	lastAdminData = data
	local backdrop, card = makeModal(UDim2.fromOffset(520, 600))
	local conns = {}
	backdrop.Destroying:Connect(function()
		for _, c in ipairs(conns) do pcall(function() c:Disconnect() end) end
	end)

	local function cmd(t)
		t.action = "admin"
		lobbyRemote:FireServer(t)
	end

	-- رتبتي ووزنها (للتحكم بإظهار الأقسام والأزرار)
	local RANK_W = { owner = 4, admin = 3, mod = 2, staff = 1, [""] = 0 }
	local RANK_AR = { owner = "👑 المالك", admin = "🛡️ أدمن", mod = "🔰 مشرف", staff = "🎬 طاقم" }
	local myRankNow = typeof(data.myRank) == "string" and data.myRank or ""
	local myW = RANK_W[myRankNow] or 0

	-- العنوان (يبيّن رتبتي)
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "👑 لوحة الإدارة — " .. (RANK_AR[myRankNow] or "إدارة"),
		Font = Enum.Font.GothamBlack, TextSize = 22,
		TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 36), Position = UDim2.fromOffset(14, 10),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})

	-- ===== شريط التبويبات =====
	local tabBar = new("Frame", {
		BackgroundTransparency = 1, Size = UDim2.new(1, -28, 0, 38), Position = UDim2.fromOffset(14, 50), Parent = card,
	})
	local tabs = {
		{ key = "stats",    label = "📊 إحصائيات" },
		{ key = "players",  label = "👥 اللاعبون" },
	}
	if myW >= RANK_W.mod then
		table.insert(tabs, { key = "chat", label = "💬 الشات" })
	end
	if myW >= RANK_W.admin then
		table.insert(tabs, { key = "mods", label = "👮 المشرفون" })
		table.insert(tabs, { key = "team", label = "👥 الفريق" })
		table.insert(tabs, { key = "commands", label = "📋 الأوامر" })
		table.insert(tabs, { key = "show", label = "🎬 العرض" })
		table.insert(tabs, { key = "settings", label = "⚙️ الإعدادات" })
	end
	local tabButtons = {}

	-- ===== منطقة المحتوى (تتغيّر حسب التبويب) =====
	local content = new("ScrollingFrame", {
		BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.new(1, -28, 1, -150),
		Position = UDim2.fromOffset(14, 96), CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ScrollBarThickness = 6, ScrollBarImageColor3 = PURPLE, Parent = card,
	}, {
		new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
	})

	local order = 0
	local function nextOrder() order += 1; return order end
	local function clearContent()
		for _, c in ipairs(content:GetChildren()) do
			if c:IsA("GuiObject") then c:Destroy() end
		end
	end

	-- ===== أدوات بناء عناصر صغيرة =====
	local function rowFrame(h)
		return new("Frame", {
			BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, h), LayoutOrder = nextOrder(), Parent = content,
		})
	end
	local function sectionLabel(text)
		local f = rowFrame(24)
		new("TextLabel", {
			BackgroundTransparency = 1, Text = text, Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = CYAN,
			Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Right, Parent = f,
		})
	end
	local function note(text)
		local f = rowFrame(34)
		new("TextLabel", {
			BackgroundTransparency = 1, Text = text, Font = Enum.Font.GothamMedium, TextSize = 12, TextColor3 = SUBT,
			Size = UDim2.fromScale(1, 1), TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Right, Parent = f,
		})
	end
	local function bigButton(text, color, fn)
		local f = rowFrame(46)
		local b = styledButton(f, {
			Text = text, Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = TEXT,
			BackgroundColor3 = color, Size = UDim2.fromScale(1, 1), Parent = f,
		})
		b.MouseButton1Click:Connect(fn)
		return b
	end
	local function twoButtons(t1, c1, f1, t2, c2, f2)
		local f = rowFrame(44)
		local b1 = styledButton(f, {
			Text = t1, Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = c1,
			Size = UDim2.new(0.5, -5, 1, 0), Position = UDim2.fromOffset(0, 0), Parent = f,
		})
		b1.MouseButton1Click:Connect(f1)
		local b2 = styledButton(f, {
			Text = t2, Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = c2,
			Size = UDim2.new(0.5, -5, 1, 0), Position = UDim2.new(0.5, 5, 0, 0), Parent = f,
		})
		b2.MouseButton1Click:Connect(f2)
	end
	local function addStat(label, value)
		local f = new("Frame", {
			BackgroundColor3 = CARD2, Size = UDim2.new(1, 0, 0, 34), LayoutOrder = nextOrder(), Parent = content,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
		new("TextLabel", {
			BackgroundTransparency = 1, Text = label, Font = Enum.Font.GothamMedium, TextSize = 14, TextColor3 = SUBT,
			Size = UDim2.new(0.58, -10, 1, 0), Position = UDim2.new(0.42, 0, 0, 0),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = f,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = tostring(value), Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = GOLD,
			Size = UDim2.new(0.42, -8, 1, 0), Position = UDim2.fromOffset(8, 0),
			TextXAlignment = Enum.TextXAlignment.Left, Parent = f,
		})
	end
	-- سلايدر (٠..١) — يحدّث بصرياً وقت السحب ويرسل الأمر عند الإفلات
	local function slider(labelFn, initFrac, onCommit)
		local f = rowFrame(48)
		local lbl = new("TextLabel", {
			BackgroundTransparency = 1, Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = SUBT,
			Size = UDim2.new(1, 0, 0, 18), Position = UDim2.fromOffset(0, 0),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = f,
		})
		local track = new("TextButton", {
			Text = "", AutoButtonColor = false, BackgroundColor3 = CARD, Size = UDim2.new(1, 0, 0, 16),
			Position = UDim2.fromOffset(0, 26), Parent = f,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }), new("UIStroke", { Color = PURPLE, Transparency = 0.5 }) })
		local fill = new("Frame", {
			BackgroundColor3 = CYAN, Size = UDim2.fromScale(math.clamp(initFrac, 0, 1), 1), Parent = track,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
		local frac = math.clamp(initFrac, 0, 1)
		local function setLabel() lbl.Text = labelFn(frac) end
		setLabel()
		local function apply(px, commit)
			if not track.Parent then return end
			local ap, aw = track.AbsolutePosition.X, track.AbsoluteSize.X
			frac = math.clamp((px - ap) / math.max(aw, 1), 0, 1)
			fill.Size = UDim2.fromScale(frac, 1)
			setLabel()
			if commit then onCommit(frac) end
		end
		local dragging = false
		track.MouseButton1Down:Connect(function()
			dragging = true
			apply(UserInputService:GetMouseLocation().X, false)
		end)
		table.insert(conns, UserInputService.InputChanged:Connect(function(inp)
			if dragging and inp.UserInputType == Enum.UserInputType.MouseMovement then
				apply(inp.Position.X, false)
			end
		end))
		table.insert(conns, UserInputService.InputEnded:Connect(function(inp)
			if dragging and inp.UserInputType == Enum.UserInputType.MouseButton1 then
				dragging = false
				if track.Parent then onCommit(frac) end
			end
		end))
	end

	-- نافذة فرعية (تأكيد/إدخال) — تُعيد فتح اللوحة عند الإلغاء
	local function subPrompt(titleText, placeholder, confirmText, confirmColor, onConfirm)
		local _, c = makeModal(UDim2.fromOffset(380, placeholder ~= nil and 248 or 196))
		new("TextLabel", {
			BackgroundTransparency = 1, Text = titleText, Font = Enum.Font.GothamBlack, TextSize = 19, TextColor3 = GOLD,
			Size = UDim2.new(1, -28, 0, 56), Position = UDim2.fromOffset(14, 14), TextWrapped = true,
			TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		local box
		if placeholder ~= nil then
			box = new("TextBox", {
				PlaceholderText = placeholder, Text = "", ClearTextOnFocus = false, Font = Enum.Font.GothamMedium,
				TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD, Size = UDim2.new(1, -28, 0, 46),
				Position = UDim2.fromOffset(14, 78), TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.3 }) })
		end
		local ok = styledButton(c, {
			Text = confirmText, Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = TEXT, BackgroundColor3 = confirmColor,
			Size = UDim2.new(0.5, -19, 0, 44), Position = UDim2.new(0.5, 5, 1, -14), AnchorPoint = Vector2.new(0, 1), Parent = c,
		})
		ok.MouseButton1Click:Connect(function()
			onConfirm(box and box.Text or "")
		end)
		local cancel = styledButton(c, {
			Text = "إلغاء", Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT, BackgroundColor3 = NEU_BTN,
			Size = UDim2.new(0.5, -19, 0, 44), Position = UDim2.new(0, 14, 1, -14), AnchorPoint = Vector2.new(0, 1), Parent = c,
		})
		cancel.MouseButton1Click:Connect(function()
			closeActive()
			if lastAdminData then showAdminPanel(lastAdminData) end
		end)
	end

	local function warnPrompt(pl)
		subPrompt("⚠️ تحذير " .. (pl.display or pl.name), "اكتب سبب التحذير...", "إرسال التحذير", PURPLE, function(text)
			if #text > 0 then cmd({ cmd = "warn", userId = pl.userId, reason = text }) end
		end)
	end
	local function kickConfirm(pl)
		subPrompt("👢 طرد " .. (pl.display or pl.name) .. "؟", "سبب الطرد (اختياري)...", "تأكيد الطرد", RED_BTN, function(reason)
			cmd({ cmd = "kick", userId = pl.userId, reason = reason })
		end)
	end

	-- 🔇 اختيار مدة الكتم (دقيقة/٥/١٠/٣٠/ساعة/دائم)
	local function mutePrompt(pl)
		local _, c = makeModal(UDim2.fromOffset(380, 320))
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "🔇 كتم " .. (pl.display or pl.name), Font = Enum.Font.GothamBlack,
			TextSize = 19, TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 40), Position = UDim2.fromOffset(14, 14),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "اختر مدة الكتم:", Font = Enum.Font.GothamMedium, TextSize = 14, TextColor3 = SUBT,
			Size = UDim2.new(1, -28, 0, 22), Position = UDim2.fromOffset(14, 54), TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		local durs = {
			{ "دقيقة", 1 }, { "٥ دقائق", 5 }, { "١٠ دقائق", 10 },
			{ "٣٠ دقيقة", 30 }, { "ساعة", 60 }, { "♾️ دائم", 0 },
		}
		local function pick(mins)
			closeActive()
			cmd({ cmd = "mute", userId = pl.userId, minutes = mins })
			if lastAdminData then showAdminPanel(lastAdminData) end
		end
		local cols = 2
		for i, d in ipairs(durs) do
			local r = math.floor((i - 1) / cols)
			local col = (i - 1) % cols
			local b = styledButton(c, {
				Text = d[1], Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT,
				BackgroundColor3 = (d[2] == 0) and RED_BTN or NEU_BTN,
				Size = UDim2.new(0.5, -19, 0, 44), Position = UDim2.fromOffset(14 + col * (170 + 8), 84 + r * 52), Parent = c,
			})
			b.MouseButton1Click:Connect(function() pick(d[2]) end)
		end
		local cancel = styledButton(c, {
			Text = "إلغاء", Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD2,
			Size = UDim2.new(1, -28, 0, 40), Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = c,
		})
		cancel.MouseButton1Click:Connect(function()
			closeActive()
			if lastAdminData then showAdminPanel(lastAdminData) end
		end)
	end

	-- 🔨 اختيار مدة حظر اللاعب من الماب (يوم/٣/٧/١٤/٣٠/دائم) — للأدمن فأعلى
	local function banPrompt(pl)
		local _, c = makeModal(UDim2.fromOffset(380, 320))
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "🔨 حظر " .. (pl.display or pl.name) .. " من الماب", Font = Enum.Font.GothamBlack,
			TextSize = 18, TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 40), Position = UDim2.fromOffset(14, 14),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "اختر مدة الحظر (بالأيام):", Font = Enum.Font.GothamMedium, TextSize = 14, TextColor3 = SUBT,
			Size = UDim2.new(1, -28, 0, 22), Position = UDim2.fromOffset(14, 54), TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		local durs = {
			{ "يوم", 1 }, { "٣ أيام", 3 }, { "٧ أيام", 7 },
			{ "١٤ يوم", 14 }, { "٣٠ يوم", 30 }, { "♾️ دائم", 0 },
		}
		local function pick(days)
			closeActive()
			cmd({ cmd = "mapBan", userId = pl.userId, days = days })
			if lastAdminData then showAdminPanel(lastAdminData) end
		end
		local cols = 2
		for i, d in ipairs(durs) do
			local r = math.floor((i - 1) / cols)
			local col = (i - 1) % cols
			local b = styledButton(c, {
				Text = d[1], Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT,
				BackgroundColor3 = (d[2] == 0) and RED_BTN or NEU_BTN,
				Size = UDim2.new(0.5, -19, 0, 44), Position = UDim2.fromOffset(14 + col * (170 + 8), 84 + r * 52), Parent = c,
			})
			b.MouseButton1Click:Connect(function() pick(d[2]) end)
		end
		local cancel = styledButton(c, {
			Text = "إلغاء", Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD2,
			Size = UDim2.new(1, -28, 0, 40), Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = c,
		})
		cancel.MouseButton1Click:Connect(function()
			closeActive()
			if lastAdminData then showAdminPanel(lastAdminData) end
		end)
	end

	-- 🏷️ تعيين رتبة لاعب (Admin/Moderator/Cinema Staff/إزالة) — للأدمن فأعلى
	local function rankPrompt(pl)
		local _, c = makeModal(UDim2.fromOffset(380, 330))
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "🏷️ رتبة " .. (pl.display or pl.name), Font = Enum.Font.GothamBlack,
			TextSize = 19, TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 40), Position = UDim2.fromOffset(14, 14),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "الرتبة الحالية: " .. (RANK_AR[pl.rank or ""] or "لاعب عادي"),
			Font = Enum.Font.GothamMedium, TextSize = 14, TextColor3 = SUBT,
			Size = UDim2.new(1, -28, 0, 22), Position = UDim2.fromOffset(14, 54), TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		-- لا تُعرض إلا الرتب الأدنى من رتبتي
		local opts = {}
		if myW > RANK_W.admin then table.insert(opts, { "🛡️ تعيين أدمن", "admin", Color3.fromRGB(150, 60, 60) }) end
		if myW > RANK_W.mod then table.insert(opts, { "🔰 تعيين مشرف", "mod", Color3.fromRGB(60, 110, 150) }) end
		table.insert(opts, { "🎬 تعيين طاقم", "staff", Color3.fromRGB(130, 105, 40) })
		table.insert(opts, { "🗑️ إزالة الرتبة", "remove", RED_BTN })
		local y = 84
		for _, o in ipairs(opts) do
			local b = styledButton(c, {
				Text = o[1], Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = o[3],
				Size = UDim2.new(1, -28, 0, 42), Position = UDim2.fromOffset(14, y), Parent = c,
			})
			y += 50
			b.MouseButton1Click:Connect(function()
				closeActive()
				if o[2] == "remove" then
					cmd({ cmd = "removeRank", userId = pl.userId })
				else
					cmd({ cmd = "setRank", userId = pl.userId, rank = o[2] })
				end
				if lastAdminData then showAdminPanel(lastAdminData) end
			end)
		end
		local cancel = styledButton(c, {
			Text = "إغلاق", Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD2,
			Size = UDim2.new(1, -28, 0, 38), Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = c,
		})
		cancel.MouseButton1Click:Connect(function()
			closeActive()
			if lastAdminData then showAdminPanel(lastAdminData) end
		end)
	end

	-- 🎁 إهداء/سحب Game Pass مجاناً للاعب (أدمن فأعلى) — نافذة منبثقة فيها كل الباقات
	local PASS_LIST = {
		{ key = "vip",        name = "⭐ عضوية VIP",   vip = true },
		{ key = "buffet",     name = "🍿 بوفيه مفتوح" },
		{ key = "showrunner", name = "🎬 مالك العرض" },
		{ key = "speed",      name = "⚡ سرعة البرق" },
		{ key = "neon",       name = "✨ أثر نيون" },
		{ key = "announcer",  name = "📢 مايك الإعلان" },
	}
	local function passesPrompt(pl)
		local _, c = makeModal(UDim2.fromOffset(400, 470))
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "🎁 باقات " .. (pl.display or pl.name), Font = Enum.Font.GothamBlack,
			TextSize = 19, TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 36), Position = UDim2.fromOffset(14, 12),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "أهدِ أو اسحب أي باقة مجاناً (دائمة عبر الحساب)",
			Font = Enum.Font.GothamMedium, TextSize = 13, TextColor3 = SUBT,
			Size = UDim2.new(1, -28, 0, 20), Position = UDim2.fromOffset(14, 48), TextXAlignment = Enum.TextXAlignment.Right, Parent = c,
		})
		local y = 78
		for _, p in ipairs(PASS_LIST) do
			-- granted = ممنوحة من الإدارة (قابلة للسحب) · owns = نشطة بأي طريقة
			local granted, owns
			if p.vip then
				granted = (pl.vip == true)   -- VIP يُدار بنظامه (منح/سحب دائماً متاح)
				owns = granted
			else
				granted = (pl.grants and pl.grants[p.key] == true)
				owns = (pl.passes and pl.passes[p.key] == true)
			end
			local purchased = owns and not granted  -- يملكها من المتجر (لا تُسحب)
			local label, color, enabled
			if granted then
				label = "🗑️ سحب  " .. p.name; color = RED_BTN; enabled = true
			elseif purchased then
				label = "✔️ مُشتراة  " .. p.name; color = CARD2; enabled = false
			else
				label = "🎁 إهداء  " .. p.name; color = GREEN_BTN; enabled = true
			end
			local b = styledButton(c, {
				Text = label, Font = Enum.Font.GothamBold, TextSize = 15,
				TextColor3 = enabled and TEXT or SUBT, BackgroundColor3 = color,
				Size = UDim2.new(1, -28, 0, 42), Position = UDim2.fromOffset(14, y), Parent = c,
			}, enabled)
			y += 50
			if enabled then
				b.MouseButton1Click:Connect(function()
					closeActive()
					if p.vip then
						cmd({ cmd = granted and "vipRevoke" or "vipGrant", userId = pl.userId })
					else
						cmd({ cmd = granted and "revokePass" or "grantPass", userId = pl.userId, pass = p.key })
					end
					if lastAdminData then showAdminPanel(lastAdminData) end
				end)
			end
		end
		local cancel = styledButton(c, {
			Text = "إغلاق", Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD2,
			Size = UDim2.new(1, -28, 0, 40), Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = c,
		})
		cancel.MouseButton1Click:Connect(function()
			closeActive()
			if lastAdminData then showAdminPanel(lastAdminData) end
		end)
	end

	local RANK_BADGE = { owner = " 👑", admin = " 🛡️", mod = " 🔰", staff = " 🎬" }
	local function makePlayerRow(parent, pl)
		local isSelf = pl.userId == LocalPlayer.UserId
		local targetW = RANK_W[pl.rank or ""] or 0
		-- بناء أزرار الإجراءات حسب صلاحيتي ورتبة الهدف (لا أتصرّف بمن هو مثلي/أعلى)
		local actions = {}
		if not isSelf and targetW < myW then
			if myW >= RANK_W.mod then
				table.insert(actions, { "⚠️ تحذير", PURPLE, function() warnPrompt(pl) end })
				table.insert(actions, { pl.muted and "🔊 فكّ كتم" or "🔇 كتم", CYAN, function()
					if pl.muted then cmd({ cmd = "unmute", userId = pl.userId }) else mutePrompt(pl) end
				end })
			end
			if myW >= RANK_W.admin then
				table.insert(actions, { "👢 طرد", RED_BTN, function() kickConfirm(pl) end })
				table.insert(actions, { pl.mapBanned and "♻️ فك الحظر" or "🔨 حظر", Color3.fromRGB(150, 40, 40), function()
					if pl.mapBanned then cmd({ cmd = "mapUnban", userId = pl.userId }) else banPrompt(pl) end
				end })
				table.insert(actions, { "📍 انتقال", CYAN, function() cmd({ cmd = "teleport", userId = pl.userId }) end })
				table.insert(actions, { pl.vip and "🚫 VIP" or "⭐ VIP", GOLD, function() cmd({ cmd = pl.vip and "vipRevoke" or "vipGrant", userId = pl.userId }) end })
				table.insert(actions, { "🎁 باقات", Color3.fromRGB(150, 60, 130), function() passesPrompt(pl) end })
				table.insert(actions, { pl.banned and "✅ حجز" or "🚫 حجز", ORG_BTN, function() cmd({ cmd = pl.banned and "unban" or "ban", userId = pl.userId }) end })
				table.insert(actions, { "🏷️ رتبة", Color3.fromRGB(90, 70, 140), function() rankPrompt(pl) end })
			end
		end

		local cols = 3
		local nRows = math.ceil(#actions / cols)
		local rowH = (isSelf and 38) or (38 + nRows * 34)
		local cardR = new("Frame", {
			BackgroundColor3 = CARD2, Size = UDim2.new(1, 0, 0, rowH), Parent = parent,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
		local badges = RANK_BADGE[pl.rank or ""] or ""
		if pl.vip then badges = badges .. " ⭐" end
		if pl.banned then badges = badges .. " 🚫" end
		if pl.mapBanned then badges = badges .. " 🔨" end
		if pl.muted then badges = badges .. " 🔇" end
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "👤 " .. (pl.display or pl.name) .. badges, Font = Enum.Font.GothamBold,
			TextSize = 15, TextColor3 = TEXT, Size = UDim2.new(1, -16, 0, 26), Position = UDim2.fromOffset(8, 4),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = cardR,
		})
		if isSelf then
			new("TextLabel", {
				BackgroundTransparency = 1, Text = "(أنت)", Font = Enum.Font.GothamMedium, TextSize = 12, TextColor3 = SUBT,
				Size = UDim2.new(0, 60, 0, 26), Position = UDim2.fromOffset(8, 4),
				TextXAlignment = Enum.TextXAlignment.Left, Parent = cardR,
			})
			return
		end
		if #actions == 0 then
			new("TextLabel", {
				BackgroundTransparency = 1, Text = "🔒 لا صلاحية على هذا اللاعب", Font = Enum.Font.GothamMedium,
				TextSize = 12, TextColor3 = SUBT, Size = UDim2.new(0, 220, 0, 26), Position = UDim2.fromOffset(8, 4),
				TextXAlignment = Enum.TextXAlignment.Left, Parent = cardR,
			})
			return
		end
		for i, a in ipairs(actions) do
			local r = math.floor((i - 1) / cols)
			local c = (i - 1) % cols
			local b = styledButton(cardR, {
				Text = a[1], Font = Enum.Font.GothamBold, TextSize = 12,
				TextColor3 = (a[2] == GOLD or a[2] == CYAN) and Color3.fromRGB(18, 14, 28) or TEXT,
				BackgroundColor3 = a[2], Size = UDim2.new(1 / cols, -4, 0, 30),
				Position = UDim2.new(c / cols, 2, 0, 36 + r * 34), Parent = cardR,
			})
			b.MouseButton1Click:Connect(a[3])
		end
	end

	-- ===== تبويب الإحصائيات =====
	local function buildStats()
		local s = data.stats or {}
		sectionLabel("📊 إحصائيات حية")
		addStat("👥 اللاعبون الآن", toAr(s.players or #(data.players or {})))
		addStat("🏪 البوثات المحجوزة", toAr(s.claimed or 0) .. " / " .. toAr(s.total or 6))
		addStat("📦 منتجات معروضة", toAr(s.products or 0))
		addStat("💰 إجمالي الدعم", toAr(s.support or 0) .. " Robux")
		addStat("🏆 أكثر بوث تفاعلاً", s.topBooth or "—")
		sectionLabel("📜 سجل أوامر الإدارة")
		local logs = data.log or {}
		if #logs == 0 then
			note("لا يوجد نشاط إداري بعد.")
		else
			for _, line in ipairs(logs) do
				local f = new("Frame", {
					BackgroundColor3 = CARD2, Size = UDim2.new(1, 0, 0, 28), LayoutOrder = nextOrder(), Parent = content,
				}, { new("UICorner", { CornerRadius = UDim.new(0, 8) }) })
				new("TextLabel", {
					BackgroundTransparency = 1, Text = line, Font = Enum.Font.GothamMedium, TextSize = 12, TextColor3 = SUBT,
					Size = UDim2.new(1, -16, 1, 0), Position = UDim2.fromOffset(8, 0),
					TextXAlignment = Enum.TextXAlignment.Right, Parent = f,
				})
			end
		end
	end

	-- ===== تبويب العرض =====
	local function buildShow()
		local playing = data.playing == true
		bigButton(playing and "⏹️ إيقاف العرض" or "▶️ تشغيل العرض الآن", playing and RED_BTN or GREEN_BTN, function()
			cmd({ cmd = playing and "stop" or "play" })
		end)
		twoButtons(
			"⏭️ تخطّي العرض", NEU_BTN, function() cmd({ cmd = "skip" }) end,
			"🔄 إعادة العرض", NEU_BTN, function() cmd({ cmd = "restart" }) end
		)
		sectionLabel("💡 الإضاءة")
		twoButtons(
			"💡 إضاءة كاملة", NEU_BTN, function() cmd({ cmd = "lightsOn" }) end,
			"🌙 خفض الإضاءة", NEU_BTN, function() cmd({ cmd = "lightsOff" }) end
		)
		slider(function(fr) return "🔆 مستوى الإضاءة: " .. toAr(math.floor(fr * 100)) .. "%" end, 1, function(fr)
			cmd({ cmd = "lightLevel", value = fr * 100 })
		end)
		sectionLabel("🎨 لون الأجواء")
		local f = rowFrame(40)
		local sw = {
			{ "بنفسجي", 168, 92, 255 }, { "سماوي", 70, 226, 255 }, { "ذهبي", 255, 205, 90 },
			{ "أحمر", 255, 80, 90 }, { "أخضر", 90, 230, 150 }, { "↺ طبيعي", nil },
		}
		local n = #sw
		for i, c in ipairs(sw) do
			local col = c[2] and Color3.fromRGB(c[2], c[3], c[4]) or NEU_BTN
			local b = styledButton(f, {
				Text = c[1], Font = Enum.Font.GothamBold, TextSize = 11,
				TextColor3 = c[2] and Color3.fromRGB(18, 14, 28) or TEXT, BackgroundColor3 = col,
				Size = UDim2.new(1 / n, -4, 1, 0), Position = UDim2.new((i - 1) / n, 2, 0, 0), Parent = f,
			})
			b.MouseButton1Click:Connect(function()
				if c[2] then cmd({ cmd = "ambient", r = c[2], g = c[3], b = c[4] }) else cmd({ cmd = "ambient", reset = true }) end
			end)
		end
		sectionLabel("🎵 موسيقى اللوبي")
		local music = data.music or {}
		twoButtons(
			"🎵 تشغيل", GREEN_BTN, function() cmd({ cmd = "music", on = true, volume = (music.volume or 0.4) * 100 }) end,
			"🔇 إيقاف", RED_BTN, function() cmd({ cmd = "music", on = false }) end
		)
		slider(function(fr) return "🔊 مستوى الصوت: " .. toAr(math.floor(fr * 100)) .. "%" end, music.volume or 0.4, function(fr)
			cmd({ cmd = "music", on = music.on == true, volume = fr * 100 })
		end)
		if not music.hasId then
			note("ℹ️ لا يوجد رقم صوت — ضع LobbyMusicId في إعدادات السكربت لتشغيل موسيقى اللوبي.")
		end
	end

	-- ===== تبويب اللاعبين =====
	local function buildPlayers()
		local sf = rowFrame(40)
		local search = new("TextBox", {
			PlaceholderText = "🔍 ابحث عن لاعب...", Text = "", ClearTextOnFocus = false, Font = Enum.Font.GothamMedium,
			TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD, Size = UDim2.fromScale(1, 1),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = sf,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })
		-- 🔨 حظر/فك حظر بالـ UserID — للأدمن فأعلى (يعمل حتى لو اللاعب غير موجود بالماب، ويتيح فكّ الحظر الدائم)
		if myW >= RANK_W.admin then
			sectionLabel("🔨 حظر / فك حظر بالـ UserID")
			note("يعمل حتى لو اللاعب غير موجود الآن — لفكّ حظر دائم أو حظر شخص غائب.")
			local idf = rowFrame(40)
			local idBox = new("TextBox", {
				PlaceholderText = "رقم اللاعب (أرقام)", Text = "", ClearTextOnFocus = false, Font = Enum.Font.GothamMedium,
				TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD, Size = UDim2.new(0.62, -4, 1, 0),
				Position = UDim2.fromScale(0.38, 0), TextXAlignment = Enum.TextXAlignment.Right, Parent = idf,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })
			local dayBox = new("TextBox", {
				PlaceholderText = "أيام (0=دائم)", Text = "", ClearTextOnFocus = false, Font = Enum.Font.GothamMedium,
				TextSize = 14, TextColor3 = TEXT, BackgroundColor3 = CARD, Size = UDim2.new(0.38, -4, 1, 0),
				Position = UDim2.fromScale(0, 0), TextXAlignment = Enum.TextXAlignment.Center, Parent = idf,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })
			bigButton("🔨 حظر بالـ ID", Color3.fromRGB(150, 40, 40), function()
				local uid = tonumber((idBox.Text or ""):match("%d+"))
				local days = math.max(0, math.floor(tonumber(dayBox.Text) or 0))
				if uid then cmd({ cmd = "mapBan", userId = uid, days = days }) end
			end)
			bigButton("♻️ فك الحظر بالـ ID", GREEN_BTN, function()
				local uid = tonumber((idBox.Text or ""):match("%d+"))
				if uid then cmd({ cmd = "mapUnban", userId = uid }) end
			end)
		end
		local holder = new("Frame", {
			BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y,
			LayoutOrder = nextOrder(), Parent = content,
		}, { new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }) })
		local function render(filter)
			for _, c in ipairs(holder:GetChildren()) do
				if c:IsA("GuiObject") then c:Destroy() end
			end
			filter = string.lower(filter or "")
			local any = false
			for _, pl in ipairs(data.players or {}) do
				local nm = string.lower((pl.display or pl.name or "") .. " " .. (pl.name or ""))
				if filter == "" or string.find(nm, filter, 1, true) then
					makePlayerRow(holder, pl)
					any = true
				end
			end
			if not any then
				new("TextLabel", {
					BackgroundTransparency = 1, Text = "لا يوجد لاعب مطابق.", Font = Enum.Font.GothamMedium, TextSize = 13,
					TextColor3 = SUBT, Size = UDim2.new(1, 0, 0, 30), TextXAlignment = Enum.TextXAlignment.Right, Parent = holder,
				})
			end
		end
		search:GetPropertyChangedSignal("Text"):Connect(function() render(search.Text) end)
		render("")
	end

	-- ===== تبويب الإعدادات =====
	local function buildSettings()
		sectionLabel("📢 إعلان عام")
		local templates = {
			"🎬 العرض يبدأ قريباً — خذوا أماكنكم!",
			"🍿 لا تنسوا الفشار والمشروب من البوفيه!",
			"🎟️ اشترِ تذكرتك من شباك التذاكر!",
			"🙏 شكراً لدعمكم الرائع — استمتعوا!",
		}
		for _, t in ipairs(templates) do
			bigButton(t, NEU_BTN, function() cmd({ cmd = "broadcast", text = t }) end)
		end
		local bf = rowFrame(44)
		local box = new("TextBox", {
			PlaceholderText = "إعلان مخصّص...", Text = "", ClearTextOnFocus = false, Font = Enum.Font.GothamMedium,
			TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD, Size = UDim2.new(1, -92, 1, 0),
			Position = UDim2.fromOffset(92, 0), TextXAlignment = Enum.TextXAlignment.Right, Parent = bf,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })
		local send = styledButton(bf, {
			Text = "إرسال", Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = Color3.fromRGB(20, 16, 8),
			BackgroundColor3 = GOLD, Size = UDim2.fromOffset(84, 44), Position = UDim2.fromOffset(0, 0), Parent = bf,
		})
		send.MouseButton1Click:Connect(function()
			if #box.Text > 0 then cmd({ cmd = "broadcast", text = box.Text }); box.Text = "" end
		end)

		sectionLabel("🏪 نظام البوثات")
		local enabled = data.boothsEnabled ~= false
		bigButton(enabled and "⛔ تعطيل نظام البوثات" or "✅ تفعيل نظام البوثات", enabled and RED_BTN or GREEN_BTN, function()
			cmd({ cmd = enabled and "boothsDisable" or "boothsEnable" })
		end)
		local booths = data.booths or {}
		if #booths == 0 then
			note("لا توجد بوثات محجوزة حالياً.")
		else
			for _, b in ipairs(booths) do
				local f = new("Frame", {
					BackgroundColor3 = CARD2, Size = UDim2.new(1, 0, 0, 40), LayoutOrder = nextOrder(), Parent = content,
				}, { new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
				new("TextLabel", {
					BackgroundTransparency = 1, Font = Enum.Font.GothamMedium, TextSize = 13, TextColor3 = TEXT,
					Text = (b.present and "🟢 " or "⚪ ") .. (b.ownerName or "?") .. " · " .. (b.keyLabel or b.key or "") .. " · " .. toAr(b.sales or 0) .. " دعم",
					Size = UDim2.new(1, -96, 1, 0), Position = UDim2.fromOffset(8, 0),
					TextXAlignment = Enum.TextXAlignment.Right, Parent = f,
				})
				local rel = styledButton(f, {
					Text = "تحرير", Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = TEXT, BackgroundColor3 = RED_BTN,
					Size = UDim2.fromOffset(80, 30), AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Parent = f,
				})
				rel.MouseButton1Click:Connect(function() cmd({ cmd = "boothRelease", key = b.key }) end)
			end
		end

		sectionLabel("🛠️ وضع الصيانة")
		local mf = rowFrame(44)
		local mbox = new("TextBox", {
			PlaceholderText = "رسالة الصيانة للّاعبين...", Text = data.maintenanceMsg or "", ClearTextOnFocus = false,
			Font = Enum.Font.GothamMedium, TextSize = 14, TextColor3 = TEXT, BackgroundColor3 = CARD,
			Size = UDim2.fromScale(1, 1), TextXAlignment = Enum.TextXAlignment.Right, Parent = mf,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })
		local maint = data.maintenance == true
		bigButton(maint and "✅ إنهاء وضع الصيانة" or "🛠️ تفعيل وضع الصيانة", maint and GREEN_BTN or ORG_BTN, function()
			if maint then cmd({ cmd = "maintenanceOff" }) else cmd({ cmd = "maintenanceOn", text = mbox.Text }) end
		end)
	end

	-- ===== تبويب الشات (مشرف فأعلى): رسالة إدارية + إعلان + تفعيل/تعطيل =====
	local function buildChat()
		sectionLabel("📨 رسالة إدارية (تظهر بخط أسود عريض + صوت)")
		note("تُرسل لكل اللاعبين بصيغة [" .. ((myRankNow == "owner" and "المالك") or (myRankNow == "admin" and "أدمن") or "مشرف") .. "]. (أو اكتب في الدردشة: $رسالتك)")
		local af = rowFrame(44)
		local abox = new("TextBox", {
			PlaceholderText = "نص الرسالة الإدارية...", Text = "", ClearTextOnFocus = false, Font = Enum.Font.GothamMedium,
			TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD, Size = UDim2.new(1, -92, 1, 0),
			Position = UDim2.fromOffset(92, 0), TextXAlignment = Enum.TextXAlignment.Right, Parent = af,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })
		local asend = styledButton(af, {
			Text = "إرسال", Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = Color3.fromRGB(20, 16, 8),
			BackgroundColor3 = GOLD, Size = UDim2.fromOffset(84, 44), Position = UDim2.fromOffset(0, 0), Parent = af,
		})
		asend.MouseButton1Click:Connect(function()
			if #abox.Text > 0 then cmd({ cmd = "adminMsg", text = abox.Text }); abox.Text = "" end
		end)

		if myW < RANK_W.admin then
			note("ℹ️ الإعلان العام وتفعيل/تعطيل الدردشة متاحان للأدمن فأعلى.")
			return
		end

		sectionLabel("📢 إعلان عام (شريط علوي)")
		local templates = {
			"🎬 العرض يبدأ قريباً — خذوا أماكنكم!",
			"🙏 شكراً لدعمكم الرائع — استمتعوا!",
		}
		for _, t in ipairs(templates) do
			bigButton(t, NEU_BTN, function() cmd({ cmd = "broadcast", text = t }) end)
		end
		local bf = rowFrame(44)
		local box = new("TextBox", {
			PlaceholderText = "إعلان مخصّص...", Text = "", ClearTextOnFocus = false, Font = Enum.Font.GothamMedium,
			TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD, Size = UDim2.new(1, -92, 1, 0),
			Position = UDim2.fromOffset(92, 0), TextXAlignment = Enum.TextXAlignment.Right, Parent = bf,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })
		local send = styledButton(bf, {
			Text = "إرسال", Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = Color3.fromRGB(20, 16, 8),
			BackgroundColor3 = GOLD, Size = UDim2.fromOffset(84, 44), Position = UDim2.fromOffset(0, 0), Parent = bf,
		})
		send.MouseButton1Click:Connect(function()
			if #box.Text > 0 then cmd({ cmd = "broadcast", text = box.Text }); box.Text = "" end
		end)

		sectionLabel("💬 حالة الدردشة")
		local chatOn = data.chatEnabled ~= false
		note(chatOn and "الدردشة مفتوحة الآن لكل اللاعبين." or "الدردشة مغلقة حالياً (الإداريون فقط يكتبون).")
		bigButton(chatOn and "🔒 إغلاق الدردشة للجميع" or "✅ فتح الدردشة للجميع", chatOn and RED_BTN or GREEN_BTN, function()
			cmd({ cmd = chatOn and "chatDisable" or "chatEnable" })
			task.delay(0.25, function() cmd({ cmd = "refresh" }) end)
		end)
	end

	-- ===== تبويب المشرفين (أدمن فأعلى): قائمة + إضافة عبر اللاعبين =====
	local function buildMods()
		sectionLabel("👮 فريق الإدارة الحالي")
		local mods = data.mods or {}
		if #mods == 0 then
			note("لا يوجد مشرفون بعد. عيّن مشرفاً من تبويب «اللاعبون» بزر «🏷️ رتبة».")
		else
			for _, m in ipairs(mods) do
				local f = new("Frame", {
					BackgroundColor3 = CARD2, Size = UDim2.new(1, 0, 0, 42), LayoutOrder = nextOrder(), Parent = content,
				}, { new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
				local tag = (RANK_AR[m.rank] or m.rank) .. (m.online and " · 🟢 متصل" or " · ⚪ غير متصل")
				new("TextLabel", {
					BackgroundTransparency = 1, Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = TEXT,
					Text = (m.name or ("#" .. tostring(m.userId))) .. "  —  " .. tag,
					Size = UDim2.new(1, -96, 1, 0), Position = UDim2.fromOffset(8, 0),
					TextXAlignment = Enum.TextXAlignment.Right, Parent = f,
				})
				-- إزالة الرتبة (لو رتبته أقل من رتبتي)
				if (RANK_W[m.rank] or 0) < myW then
					local rem = styledButton(f, {
						Text = "إزالة", Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = TEXT, BackgroundColor3 = RED_BTN,
						Size = UDim2.fromOffset(80, 30), AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Parent = f,
					})
					rem.MouseButton1Click:Connect(function()
						cmd({ cmd = "removeRank", userId = m.userId })
						task.delay(0.25, function() cmd({ cmd = "refresh" }) end)
					end)
				end
			end
		end
		note("ℹ️ لإضافة مشرف: افتح «👥 اللاعبون» واضغط «🏷️ رتبة» بجانب اللاعب، ثم اختر الرتبة.")
	end

	-- ===== تبويب الفريق (أدمن فأعلى): التحكم بصفحة فريق العمل =====
	local function buildTeam()
		-- إظهار/إخفاء أيقونة الفريق لكل اللاعبين
		sectionLabel("👥 صفحة فريق العمل")
		local tEnabled = data.teamEnabled ~= false
		bigButton(tEnabled and "🙈 إخفاء أيقونة الفريق عن اللاعبين" or "👁️ إظهار أيقونة الفريق للّاعبين",
			tEnabled and RED_BTN or GREEN_BTN, function()
				cmd({ cmd = "teamToggle", on = not tEnabled })
			end)

		-- عنوان الصفحة المخصّص
		sectionLabel("✏️ عنوان الصفحة")
		local tf = rowFrame(44)
		local tbox = new("TextBox", {
			PlaceholderText = "عنوان صفحة الفريق...", Text = data.teamTitle or "", ClearTextOnFocus = false,
			Font = Enum.Font.GothamMedium, TextSize = 15, TextColor3 = TEXT, BackgroundColor3 = CARD,
			Size = UDim2.new(1, -92, 1, 0), Position = UDim2.fromOffset(92, 0),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = tf,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })
		local tsave = styledButton(tf, {
			Text = "حفظ", Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = Color3.fromRGB(20, 16, 8),
			BackgroundColor3 = GOLD, Size = UDim2.fromOffset(84, 44), Position = UDim2.fromOffset(0, 0), Parent = tf,
		})
		tsave.MouseButton1Click:Connect(function()
			if #tbox.Text > 0 then cmd({ cmd = "teamTitle", text = tbox.Text }) end
		end)

		-- ===== إدارة الأقسام (إضافة/تسمية/حذف/ترتيب) =====
		local secList = data.teamSecList or {}
		sectionLabel("🗂️ الأقسام (أضِف/أعد التسمية/احذف/رتّب)")
		for sidx, s in ipairs(secList) do
			local sf = new("Frame", {
				BackgroundColor3 = CARD2, Size = UDim2.new(1, 0, 0, 44), LayoutOrder = nextOrder(), Parent = content,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 10) }), new("UIStroke", { Color = GOLD, Transparency = 0.55 }) })
			-- اسم القسم (تعديل + حفظ)
			local sbox = new("TextBox", {
				PlaceholderText = "اسم القسم...", Text = s.title or "", ClearTextOnFocus = false,
				Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = GOLD, BackgroundColor3 = CARD,
				Size = UDim2.new(1, -210, 0, 32), AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -8, 0.5, 0),
				TextXAlignment = Enum.TextXAlignment.Right, Parent = sf,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 8) }) })
			local sren = styledButton(sf, {
				Text = "✏️", Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT, BackgroundColor3 = PURPLE,
				Size = UDim2.fromOffset(34, 32), AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 122, 0.5, 0), Parent = sf,
			})
			sren.MouseButton1Click:Connect(function()
				if #sbox.Text > 0 then cmd({ cmd = "teamSecRename", section = s.id, text = sbox.Text }) end
			end)
			local sup = styledButton(sf, {
				Text = "▲", Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = TEXT, BackgroundColor3 = NEU_BTN,
				Size = UDim2.fromOffset(30, 32), AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 8, 0.5, 0), Parent = sf,
			}, sidx > 1)
			if sidx > 1 then sup.MouseButton1Click:Connect(function() cmd({ cmd = "teamSecMove", section = s.id, dir = "up" }) end) end
			local sdn = styledButton(sf, {
				Text = "▼", Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = TEXT, BackgroundColor3 = NEU_BTN,
				Size = UDim2.fromOffset(30, 32), AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 42, 0.5, 0), Parent = sf,
			}, sidx < #secList)
			if sidx < #secList then sdn.MouseButton1Click:Connect(function() cmd({ cmd = "teamSecMove", section = s.id, dir = "down" }) end) end
			local sdel = styledButton(sf, {
				Text = "🗑️", Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = TEXT, BackgroundColor3 = RED_BTN,
				Size = UDim2.fromOffset(34, 32), AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 80, 0.5, 0), Parent = sf,
			}, #secList > 1)
			if #secList > 1 then sdel.MouseButton1Click:Connect(function() cmd({ cmd = "teamSecDelete", section = s.id }) end) end
		end
		-- إضافة قسم جديد
		local af = rowFrame(44)
		local abox = new("TextBox", {
			PlaceholderText = "اسم قسم جديد (مثل: الدعم الفني)...", Text = "", ClearTextOnFocus = false,
			Font = Enum.Font.GothamMedium, TextSize = 14, TextColor3 = TEXT, BackgroundColor3 = CARD,
			Size = UDim2.new(1, -120, 1, 0), Position = UDim2.fromOffset(120, 0),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = af,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = GOLD, Transparency = 0.4 }) })
		local aadd = styledButton(af, {
			Text = "➕ إضافة", Font = Enum.Font.GothamBlack, TextSize = 14, TextColor3 = Color3.fromRGB(20, 16, 8),
			BackgroundColor3 = GOLD, Size = UDim2.fromOffset(112, 44), Position = UDim2.fromOffset(0, 0), Parent = af,
		})
		aadd.MouseButton1Click:Connect(function()
			if #abox.Text > 0 then cmd({ cmd = "teamSecAdd", text = abox.Text }); abox.Text = "" end
		end)

		-- ===== الأعضاء مجمّعين حسب القسم (نقل + مسؤولية + إخفاء + ترتيب) =====
		sectionLabel("📋 الأعضاء — وزّعهم على الأقسام وحدّد مسؤوليتهم")
		local groups = data.teamSections or {}
		local total = 0
		for _, g in ipairs(groups) do total += #(g.members or {}) end
		if total == 0 then
			note("لا يوجد أعضاء فريق بعد. عيّن رتباً من تبويب «اللاعبون».")
		else
			for _, g in ipairs(groups) do
				local mem = g.members or {}
				-- ترويسة القسم في قائمة الأعضاء
				local gl = rowFrame(26)
				new("TextLabel", {
					BackgroundTransparency = 1, Text = "📂 " .. (g.title or "قسم") .. "  (" .. #mem .. ")",
					Font = Enum.Font.GothamBlack, TextSize = 14, TextColor3 = GOLD, Size = UDim2.fromScale(1, 1),
					TextXAlignment = Enum.TextXAlignment.Right, Parent = gl,
				})
				if #mem == 0 then
					note("— لا أعضاء في هذا القسم —")
				end
				for idx, m in ipairs(mem) do
					local f = new("Frame", {
						BackgroundColor3 = CARD2, Size = UDim2.new(1, 0, 0, 118), LayoutOrder = nextOrder(), Parent = content,
					}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.55 }) })
					-- سطر الاسم + الرتبة + الحالة
					local badge = RANK_BADGE[m.rank] or " ⭐"
					local statusTxt = (m.online and " · 🟢" or " · ⚪") .. (m.hidden and " · 🙈مخفي" or "")
					new("TextLabel", {
						BackgroundTransparency = 1, Font = Enum.Font.GothamBold, TextSize = 14,
						TextColor3 = m.hidden and SUBT or TEXT,
						Text = (m.name or ("#" .. tostring(m.userId))) .. badge .. statusTxt,
						Size = UDim2.new(1, -16, 0, 22), Position = UDim2.fromOffset(8, 6),
						TextXAlignment = Enum.TextXAlignment.Right, TextTruncate = Enum.TextTruncate.AtEnd, Parent = f,
					})
					-- أزرار التحكم: ▲ ▼ + إخفاء/إظهار
					local up = styledButton(f, {
						Text = "▲", Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT, BackgroundColor3 = NEU_BTN,
						Size = UDim2.fromOffset(32, 30), Position = UDim2.fromOffset(8, 32), Parent = f,
					}, idx > 1)
					if idx > 1 then up.MouseButton1Click:Connect(function() cmd({ cmd = "teamMove", userId = m.userId, dir = "up" }) end) end
					local down = styledButton(f, {
						Text = "▼", Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT, BackgroundColor3 = NEU_BTN,
						Size = UDim2.fromOffset(32, 30), Position = UDim2.fromOffset(44, 32), Parent = f,
					}, idx < #mem)
					if idx < #mem then down.MouseButton1Click:Connect(function() cmd({ cmd = "teamMove", userId = m.userId, dir = "down" }) end) end
					local hide = styledButton(f, {
						Text = m.hidden and "👁️" or "🙈", Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT,
						BackgroundColor3 = m.hidden and GREEN_BTN or RED_BTN,
						Size = UDim2.fromOffset(36, 30), Position = UDim2.fromOffset(80, 32), Parent = f,
					})
					hide.MouseButton1Click:Connect(function()
						cmd({ cmd = m.hidden and "teamShow" or "teamHide", userId = m.userId })
					end)
					-- حقل المسؤولية + حفظ
					local rbox = new("TextBox", {
						PlaceholderText = "المسؤولية (مثل: استقبال اللاعبين)...", Text = m.role or "", ClearTextOnFocus = false,
						Font = Enum.Font.GothamMedium, TextSize = 13, TextColor3 = TEXT, BackgroundColor3 = CARD,
						Size = UDim2.new(1, -212, 0, 30), AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -8, 0, 47),
						TextXAlignment = Enum.TextXAlignment.Right, Parent = f,
					}, { new("UICorner", { CornerRadius = UDim.new(0, 8) }), new("UIStroke", { Color = CYAN, Transparency = 0.5 }) })
					local rsave = styledButton(f, {
						Text = "💾", Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT, BackgroundColor3 = PURPLE,
						Size = UDim2.fromOffset(34, 30), Position = UDim2.fromOffset(122, 32), Parent = f,
					})
					rsave.MouseButton1Click:Connect(function()
						cmd({ cmd = "teamRole", userId = m.userId, text = rbox.Text })
					end)
					-- شرائح اختيار القسم (نقل العضو)
					local chips = new("Frame", {
						BackgroundTransparency = 1, Size = UDim2.new(1, -16, 0, 30), Position = UDim2.fromOffset(8, 82), Parent = f,
					}, { new("UIListLayout", {
						FillDirection = Enum.FillDirection.Horizontal, HorizontalAlignment = Enum.HorizontalAlignment.Right,
						Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder, Wraps = true,
					}) })
					for ci, sec in ipairs(secList) do
						local active = (m.section == sec.id)
						local chip = styledButton(chips, {
							Text = sec.title or "قسم", Font = Enum.Font.GothamBold, TextSize = 12,
							TextColor3 = active and Color3.fromRGB(18, 14, 28) or TEXT,
							BackgroundColor3 = active and GOLD or CARD, AutomaticSize = Enum.AutomaticSize.X,
							Size = UDim2.fromOffset(0, 26), LayoutOrder = ci, Parent = chips,
						})
						new("UIPadding", { PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10), Parent = chip })
						if not active then
							chip.MouseButton1Click:Connect(function()
								cmd({ cmd = "teamAssign", userId = m.userId, section = sec.id })
							end)
						end
					end
				end
			end
		end
		note("ℹ️ كل عضو يظهر تحت قسمه في صفحة «👥 الفريق». لو ما حدّدت مسؤولية تظهر رتبته تلقائياً. صور الأفتار تعمل في اللعبة المنشورة.")
	end

	-- ===== ⌘ تبويب الأوامر: التحكم بمستوى صلاحية كل أمر =====
	local function buildCommands()
		sectionLabel("📋 صلاحيات الأوامر — اختر مستوى كل أمر")
		note("لكل أمر مستوى مطلوب: «الجميع» متاح للكل · «المشرفون» للمشرف فأعلى · «الأداريون» للأدمن فأعلى · «معطّل» يوقف الأمر. يُحفظ تلقائياً ويُطبّق فوراً على الجميع. (الأمران /help و /clear متاحان دائماً للجميع.)")

		local LV_EVERYONE, LV_MOD, LV_ADMIN, LV_OFF = 0, 2, 3, 99
		local LEVELS = {
			{ v = LV_EVERYONE, t = "الجميع",    c = Color3.fromRGB(120, 220, 140) },
			{ v = LV_MOD,      t = "المشرفون",  c = CYAN },
			{ v = LV_ADMIN,    t = "الأداريون", c = GOLD },
			{ v = LV_OFF,      t = "معطّل",      c = Color3.fromRGB(232, 96, 110) },
		}

		local perms = data.cmdPerms
		if typeof(perms) ~= "table" or #perms == 0 then
			note("… لا توجد أوامر متاحة للعرض حالياً.")
			return
		end

		for _, c in ipairs(perms) do
			local f = rowFrame(66)
			new("TextLabel", {
				BackgroundTransparency = 1, Text = tostring(c.label or ("/" .. tostring(c.key))),
				Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT,
				Size = UDim2.new(1, 0, 0, 24), Position = UDim2.fromOffset(0, 0),
				TextXAlignment = Enum.TextXAlignment.Right, TextTruncate = Enum.TextTruncate.AtEnd, Parent = f,
			})
			local chips = new("Frame", {
				BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 32), Position = UDim2.fromOffset(0, 30), Parent = f,
			})
			local nL = #LEVELS
			for li, lv in ipairs(LEVELS) do
				local active = (tonumber(c.level) == lv.v)
				local chip = styledButton(chips, {
					Text = lv.t, Font = Enum.Font.GothamBold, TextSize = 12,
					TextColor3 = active and Color3.fromRGB(18, 14, 28) or TEXT,
					BackgroundColor3 = active and lv.c or CARD,
					Size = UDim2.new(1 / nL, -5, 1, 0),
					Position = UDim2.new((nL - li) / nL, 2, 0, 0), Parent = chips,
				})
				if not active then
					chip.MouseButton1Click:Connect(function()
						cmd({ cmd = "setCmdPerm", key = c.key, level = lv.v })
					end)
				end
			end
		end
	end

	-- ===== ربط التبويبات =====
	local builders = {
		stats = buildStats, show = buildShow, players = buildPlayers,
		settings = buildSettings, chat = buildChat, mods = buildMods, team = buildTeam,
		commands = buildCommands,
	}
	local function selectTab(key)
		adminTab = key
		for k, b in pairs(tabButtons) do
			local active = (k == key)
			b.BackgroundColor3 = active and PURPLE or CARD2
			b.TextColor3 = active and Color3.fromRGB(18, 14, 28) or TEXT
		end
		clearContent()
		order = 0
		local fn = builders[key]
		if fn then fn() end
	end

	local nT = #tabs
	for i, t in ipairs(tabs) do
		local b = styledButton(tabBar, {
			Name = t.key, Text = t.label, Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = TEXT,
			BackgroundColor3 = CARD2, Size = UDim2.new(1 / nT, -5, 1, 0),
			Position = UDim2.new((nT - i) / nT, 2, 0, 0), Parent = tabBar,
		})
		tabButtons[t.key] = b
		b.MouseButton1Click:Connect(function() selectTab(t.key) end)
	end

	if not tabButtons[adminTab] then adminTab = tabs[1].key end
	selectTab(adminTab)

	-- زر الإغلاق
	local close = styledButton(card, {
		Name = "Close", Text = "إغلاق", Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 38),
		Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	close.MouseButton1Click:Connect(closeActive)
end

-- زر الإدارة (يظهر للمالك دائماً، وللمشرفين/الأدمن عند منحهم رتبة من السيرفر)
local adminTabBtn = new("TextButton", {
	Name = "AdminTab", Text = "👑 إدارة", Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = Color3.fromRGB(20, 16, 8),
	BackgroundColor3 = GOLD, AutoButtonColor = false,
	LayoutOrder = 2, Size = UDim2.fromOffset(132, 40),
	Visible = ADMIN_IDS[LocalPlayer.UserId] == true,  -- المالك يراه فوراً
	Parent = leftDock,
}, {
	new("UICorner", { CornerRadius = UDim.new(0, 14) }),
	new("UIStroke", { Color = CARD, Thickness = 1.5, Transparency = 0.2 }),
})
adminTabBtn.MouseButton1Click:Connect(function()
	playSound(SOUNDS.Click, SOUND_VOLUME)
	-- فتح لوحة الإدارة مباشرة (التحقق بالرتبة في السيرفر)
	lobbyRemote:FireServer({ action = "adminAuth" })
end)

-- يُحدّث ظهور الزر ونصّه حسب الرتبة القادمة من السيرفر (rankInfo)
local RANK_TAB = {
	owner = { t = "👑 إدارة", c = GOLD },
	admin = { t = "🛡️ إدارة", c = Color3.fromRGB(255, 130, 130) },
	mod   = { t = "🔰 إشراف", c = Color3.fromRGB(120, 200, 255) },
}
updateAdminButton = function()
	local info = RANK_TAB[myRank]
	local show = (info ~= nil) or (ADMIN_IDS[LocalPlayer.UserId] == true)
	adminTabBtn.Visible = show
	if info then
		adminTabBtn.Text = info.t
		adminTabBtn.BackgroundColor3 = info.c
	end
end

------------------------------------------------------------------------
-- ☆ المرحلة ٧ — الإضافات: الإنجازات + التقييم + الأركيد + كشك الصور + الفعاليات
------------------------------------------------------------------------
local PINK  = Color3.fromRGB(255, 90, 170)
local GREEN = Color3.fromRGB(120, 220, 140)

-- لوحة الملف الشخصي (الإنجازات + تقييم الفيلم)
showProfile = function(data)
	local _, card = makeModal(UDim2.fromOffset(460, 580))
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "🏆 إنجازاتي وتقييمي", Font = Enum.Font.GothamBlack, TextSize = 24,
		TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 40), Position = UDim2.fromOffset(14, 12),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})

	-- قسم تقييم الفيلم
	new("TextLabel", {
		BackgroundTransparency = 1,
		Text = "⭐ تقييم «مدينة التبرعات»: " .. string.format("%.1f", data.ratingAvg or 0)
			.. " (" .. toAr(data.ratingCount or 0) .. " صوت)",
		Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = CYAN,
		Size = UDim2.new(1, -28, 0, 26), Position = UDim2.fromOffset(14, 56),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	local stars = new("Frame", {
		BackgroundTransparency = 1, Size = UDim2.new(1, -28, 0, 46), Position = UDim2.fromOffset(14, 84),
		Parent = card,
	}, { new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center, Padding = UDim.new(0, 8) }) })
	if data.rated then
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "✓ شكراً لتقييمك!", Font = Enum.Font.GothamBold, TextSize = 16,
			TextColor3 = GREEN, Size = UDim2.fromScale(1, 1), Parent = stars,
		})
	else
		for i = 1, 5 do
			local sb = styledButton(stars, {
				Name = "S" .. i, Text = "⭐", Font = Enum.Font.GothamBlack, TextSize = 22, TextColor3 = GOLD,
				BackgroundColor3 = Color3.fromRGB(40, 32, 60), Size = UDim2.fromOffset(46, 42), Parent = stars,
			})
			sb.MouseButton1Click:Connect(function()
				lobbyRemote:FireServer({ action = "rate", value = i })
			end)
		end
	end

	-- قائمة الإنجازات
	local scroll = new("ScrollingFrame", {
		BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.new(1, -28, 1, -200),
		Position = UDim2.fromOffset(14, 142), CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y, ScrollBarThickness = 6, ScrollBarImageColor3 = PURPLE,
		Parent = card,
	}, { new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }) })
	for _, a in ipairs(data.achievements or {}) do
		local row = new("Frame", {
			BackgroundColor3 = a.owned and Color3.fromRGB(34, 44, 32) or Color3.fromRGB(26, 22, 38),
			Size = UDim2.new(1, -8, 0, 56), Parent = scroll,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 12) }),
			new("UIStroke", { Color = a.owned and GOLD or Color3.fromRGB(60, 52, 80),
				Thickness = 1.5, Transparency = a.owned and 0.2 or 0.6 }),
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = a.owned and a.emoji or "🔒", Font = Enum.Font.GothamBlack,
			TextSize = 26, TextColor3 = TEXT, Size = UDim2.fromOffset(48, 56),
			AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -8, 0, 0), Parent = row,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = a.name, Font = Enum.Font.GothamBlack, TextSize = 16,
			TextColor3 = a.owned and GOLD or SUBT, Size = UDim2.new(1, -64, 0, 26), Position = UDim2.fromOffset(8, 6),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = row,
		})
		new("TextLabel", {
			BackgroundTransparency = 1, Text = a.desc, Font = Enum.Font.GothamMedium, TextSize = 13,
			TextColor3 = SUBT, Size = UDim2.new(1, -64, 0, 22), Position = UDim2.fromOffset(8, 30),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = row,
		})
	end

	local close = styledButton(card, {
		Name = "Close", Text = "إغلاق", Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 38),
		Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	close.MouseButton1Click:Connect(closeActive)
end

-- صالة الأركيد — لعبة سرعة نقر بسيطة (المكافأة من السيرفر)
local arcadeActive = false
local function showArcade()
	if arcadeActive then return end
	arcadeActive = true
	local backdrop, card = makeModal(UDim2.fromOffset(420, 480))
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "🕹️ أركيد السرعة", Font = Enum.Font.GothamBlack, TextSize = 24,
		TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 40), Position = UDim2.fromOffset(14, 12),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	local info = new("TextLabel", {
		BackgroundTransparency = 1, Text = "انقر الهدف ٥ مرات بسرعة!", Font = Enum.Font.GothamBold, TextSize = 15,
		TextColor3 = CYAN, Size = UDim2.new(1, -28, 0, 24), Position = UDim2.fromOffset(14, 52),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	local area = new("Frame", {
		Name = "Area", BackgroundColor3 = Color3.fromRGB(16, 12, 28), Size = UDim2.new(1, -28, 1, -150),
		Position = UDim2.fromOffset(14, 84), Parent = card,
	}, { new("UICorner", { CornerRadius = UDim.new(0, 14) }), new("UIStroke", { Color = PURPLE, Transparency = 0.4 }) })

	local hits, need, finished = 0, 5, false
	local function endGame()
		arcadeActive = false
		closeActive()
	end
	local target = styledButton(area, {
		Name = "Target", Text = "🎯", Font = Enum.Font.GothamBlack, TextSize = 26, TextColor3 = TEXT,
		BackgroundColor3 = GOLD, Size = UDim2.fromOffset(60, 60), Position = UDim2.fromOffset(130, 130), Parent = area,
	})
	local function moveTarget()
		local w, h = area.AbsoluteSize.X, area.AbsoluteSize.Y
		local x = math.random(0, math.max(0, math.floor(w) - 64))
		local y = math.random(0, math.max(0, math.floor(h) - 64))
		target.Position = UDim2.fromOffset(x, y)
	end
	target.MouseButton1Click:Connect(function()
		if finished then return end
		hits += 1
		info.Text = "النقاط: " .. toAr(hits) .. " / " .. toAr(need)
		playSound(SOUNDS.Click, SOUND_VOLUME)
		if hits >= need then
			finished = true
			lobbyRemote:FireServer({ action = "arcadePlay" })
			task.delay(0.4, endGame)
		else
			moveTarget()
		end
	end)
	moveTarget()

	local close = styledButton(card, {
		Name = "Close", Text = "خروج", Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 38),
		Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	close.MouseButton1Click:Connect(endGame)
end

onArcadeResult = function(data)
	if data.ok then
		showAnnounce({ text = "🕹️ أحسنت! +" .. toAr(data.reward or 0) .. " كوينز" })
	else
		showAnnounce({ text = "⏳ انتظر " .. toAr(data.wait or 0) .. " ثانية قبل اللعب مجدداً" })
	end
end

-- كشك الصور التذكارية (وميض + إطار تذكاري)
local function showPhotoBooth()
	local flash = new("Frame", {
		Name = "Flash", BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 0,
		Size = UDim2.fromScale(1, 1), ZIndex = 95, Parent = gui,
	})
	TweenService:Create(flash, TweenInfo.new(0.6), { BackgroundTransparency = 1 }):Play()
	task.delay(0.6, function() if flash then flash:Destroy() end end)

	local _, card = makeModal(UDim2.fromOffset(420, 470))
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "📸 صورة تذكارية", Font = Enum.Font.GothamBlack, TextSize = 22,
		TextColor3 = PINK, Size = UDim2.new(1, -28, 0, 36), Position = UDim2.fromOffset(14, 14),
		TextXAlignment = Enum.TextXAlignment.Center, Parent = card,
	})

	-- بطاقة بولارويد بيضاء
	local polaroid = new("Frame", {
		Name = "Polaroid", BackgroundColor3 = Color3.fromRGB(245, 245, 245),
		AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 56),
		Size = UDim2.fromOffset(300, 330), Parent = card,
	}, { new("UICorner", { CornerRadius = UDim.new(0, 8) }) })

	-- منطقة الصورة (خلفية متدرّجة)
	local photo = new("Frame", {
		Name = "Photo", BackgroundColor3 = Color3.fromRGB(20, 14, 40),
		Size = UDim2.fromOffset(272, 250), Position = UDim2.fromOffset(14, 14), ClipsDescendants = true, Parent = polaroid,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 6) }),
		new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromRGB(64, 44, 104), Color3.fromRGB(16, 11, 28)) }),
	})

	new("TextLabel", {
		BackgroundTransparency = 1, Text = "🎬 سينما مدينة التبرعات · " .. LocalPlayer.DisplayName,
		Font = Enum.Font.GothamBold, TextSize = 16, TextScaled = false, TextWrapped = true,
		TextColor3 = Color3.fromRGB(40, 30, 60), Size = UDim2.fromOffset(272, 56), Position = UDim2.fromOffset(14, 270),
		Parent = polaroid,
	})

	-- 🧍 عرض مجسّم اللاعب ثلاثي الأبعاد عبر ViewportFrame
	local vp = new("ViewportFrame", {
		Name = "Avatar", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = photo,
	})
	local cam = Instance.new("Camera")
	cam.Parent = vp
	vp.CurrentCamera = cam
	vp.LightDirection = Vector3.new(-0.4, -1, -0.5)
	vp.Ambient = Color3.fromRGB(170, 170, 185)
	vp.LightColor = Color3.fromRGB(255, 250, 240)

	local char = LocalPlayer.Character
	local rendered = false
	if char then
		rendered = pcall(function()
			char.Archivable = true
			local clone = char:Clone()
			for _, d in ipairs(clone:GetDescendants()) do
				if d:IsA("Script") or d:IsA("LocalScript") then
					d:Destroy()
				elseif d:IsA("BasePart") then
					d.Anchored = true
				end
			end
			clone.Parent = vp
			local cf, size = clone:GetBoundingBox()
			local hrp = clone:FindFirstChild("HumanoidRootPart")
			local dist = math.max(size.X, size.Y, size.Z) * 1.35 + 3
			local dirv = hrp and hrp.CFrame.LookVector or Vector3.new(0, 0, 1)
			local rightv = hrp and hrp.CFrame.RightVector or Vector3.new(1, 0, 0)
			local focus = cf.Position + Vector3.new(0, size.Y * 0.04, 0)
			local camPos = focus + dirv * dist + rightv * (dist * 0.28) + Vector3.new(0, size.Y * 0.12, 0)
			cam.CFrame = CFrame.lookAt(camPos, focus)
		end)
	end
	if not rendered then
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "📸\n" .. LocalPlayer.DisplayName, Font = Enum.Font.GothamBlack,
			TextSize = 28, TextColor3 = GOLD, TextWrapped = true, Size = UDim2.fromScale(1, 1), Parent = photo,
		})
	end
	local close = styledButton(card, {
		Name = "Close", Text = "حفظ وإغلاق", Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 38),
		Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	close.MouseButton1Click:Connect(closeActive)
end

-- مؤثرات الفعاليات (كونفيتي ملوّن من وسط الشاشة)
playEventFx = function(data)
	if data.kind ~= "fireworks" then return end
	local colors = { GOLD, PURPLE, CYAN, PINK, GREEN }
	for i = 1, 24 do
		local dot = new("Frame", {
			BackgroundColor3 = colors[(i % #colors) + 1], AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.new(0.5, 0, 0.5, 0), Size = UDim2.fromOffset(10, 10), ZIndex = 90, Parent = gui,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
		local ang = math.rad(math.random(0, 360))
		local dist = math.random(180, 420)
		local goal = UDim2.new(0.5, math.cos(ang) * dist, 0.5, math.sin(ang) * dist)
		local tw = TweenService:Create(dot, TweenInfo.new(1.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ Position = goal, BackgroundTransparency = 1, Size = UDim2.fromOffset(2, 2) })
		tw:Play()
		tw.Completed:Once(function() if dot then dot:Destroy() end end)
	end
end

------------------------------------------------------------------------
-- 🎟️ أزرار الباقات الخاصة (تظهر فقط لحاملي الباقة)
-- 🎬 مالك العرض → بدء الفيلم    ·    📢 مايك الإعلان → بثّ إعلان
------------------------------------------------------------------------
local perkBuilt = {}
local perkBtns  = {}  -- مراجع الأزرار لإظهارها/إخفائها عند تغيّر الصلاحية أثناء الجلسة

local function showAnnouncerModal()
	local _, card = makeModal(UDim2.fromOffset(420, 300))
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "📢 مايك الإعلان", Font = Enum.Font.GothamBlack, TextSize = 24,
		TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 40), Position = UDim2.fromOffset(14, 16),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	new("TextLabel", {
		BackgroundTransparency = 1, Text = "اكتب رسالتك وتظهر لكل اللاعبين:", Font = Enum.Font.GothamMedium, TextSize = 14,
		TextColor3 = SUBT, Size = UDim2.new(1, -28, 0, 22), Position = UDim2.fromOffset(14, 60),
		TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
	})
	local box = new("TextBox", {
		Name = "Msg", PlaceholderText = "رسالة الإعلان...", Text = "", ClearTextOnFocus = false,
		Font = Enum.Font.GothamMedium, TextSize = 16, TextColor3 = TEXT, BackgroundColor3 = CARD,
		Size = UDim2.new(1, -28, 0, 90), Position = UDim2.fromOffset(14, 90), TextWrapped = true,
		TextXAlignment = Enum.TextXAlignment.Right, TextYAlignment = Enum.TextYAlignment.Top, Parent = card,
	}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = PURPLE, Transparency = 0.3 }) })
	local go = styledButton(card, {
		Name = "Go", Text = "📢 بثّ الإعلان", Font = Enum.Font.GothamBlack, TextSize = 17,
		TextColor3 = Color3.fromRGB(20, 16, 8), BackgroundColor3 = GOLD, Size = UDim2.new(1, -28, 0, 44),
		Position = UDim2.new(0.5, 0, 1, -14), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
	})
	go.MouseButton1Click:Connect(function()
		local t = box.Text
		if #t > 0 then
			lobbyRemote:FireServer({ action = "announcerSay", text = t })
			closeActive()
		end
	end)
end

applyPerks = function(data)
	-- 🎬 زر بدء العرض (مالك العرض) — يُبنى مرة ويُظهر/يُخفى حسب الصلاحية
	if data.showrunner and not perkBuilt.showrunner then
		perkBuilt.showrunner = true
		local b = new("TextButton", {
			Name = "ShowrunnerTab", Text = "🎬 ابدأ العرض", Font = Enum.Font.GothamBlack, TextSize = 15,
			TextColor3 = Color3.fromRGB(20, 16, 8), BackgroundColor3 = GOLD, AutoButtonColor = false,
			LayoutOrder = 2, Size = UDim2.fromOffset(132, 40),
			Parent = rightDock,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 14) }),
			new("UIStroke", { Color = CARD, Thickness = 1.5, Transparency = 0.2 }),
		})
		b.MouseButton1Click:Connect(function()
			playSound(SOUNDS.Click, SOUND_VOLUME)
			lobbyRemote:FireServer({ action = "showrunnerPlay" })
		end)
		perkBtns.showrunner = b
	elseif perkBtns.showrunner then
		perkBtns.showrunner.Visible = data.showrunner == true
	end
	-- 📢 زر الإعلان (حامل الباقة أو مشرف فأعلى أو VIP) — يظهر/يختفي فوراً عند تغيّر الصلاحية
	if data.announcer and not perkBuilt.announcer then
		perkBuilt.announcer = true
		local b = new("TextButton", {
			Name = "AnnouncerTab", Text = "📢 إعلان", Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = TEXT,
			BackgroundColor3 = Color3.fromRGB(36, 30, 64), AutoButtonColor = false,
			LayoutOrder = 3, Size = UDim2.fromOffset(132, 40),
			Parent = rightDock,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 14) }),
			new("UIStroke", { Color = GOLD, Thickness = 1.5, Transparency = 0.2 }),
		})
		b.MouseButton1Click:Connect(function()
			playSound(SOUNDS.Click, SOUND_VOLUME)
			showAnnouncerModal()
		end)
		perkBtns.announcer = b
	elseif perkBtns.announcer then
		perkBtns.announcer.Visible = data.announcer == true
	end
end

-- زر «المزيد» (يمين الشاشة) يفتح مركز الإضافات
do
	local moreTab = new("TextButton", {
		Name = "MoreTab", Text = "✨ المزيد", Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(36, 30, 64), AutoButtonColor = false,
		LayoutOrder = 1, Size = UDim2.fromOffset(126, 44),
		Parent = rightDock,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 14) }),
		new("UIStroke", { Color = PINK, Thickness = 1.5, Transparency = 0.2 }),
		new("UIGradient", { Rotation = 20, Color = ColorSequence.new(PURPLE, CARD) }),
	})
	moreTab.MouseButton1Click:Connect(function()
		playSound(SOUNDS.Click, SOUND_VOLUME)
		local _, card = makeModal(UDim2.fromOffset(340, 350))
		new("TextLabel", {
			BackgroundTransparency = 1, Text = "✨ المزيد", Font = Enum.Font.GothamBlack, TextSize = 24,
			TextColor3 = GOLD, Size = UDim2.new(1, -28, 0, 40), Position = UDim2.fromOffset(14, 12),
			TextXAlignment = Enum.TextXAlignment.Right, Parent = card,
		})
		local opts = {
			{ "🏆 إنجازاتي والتقييم", function() closeActive(); lobbyRemote:FireServer({ action = "getProfile" }) end },
			{ "🕹️ صالة الأركيد",     function() closeActive(); showArcade() end },
			{ "📸 صورة تذكارية",      function() closeActive(); showPhotoBooth() end },
		}
		for i, o in ipairs(opts) do
			local b = styledButton(card, {
				Name = "Opt" .. i, Text = o[1], Font = Enum.Font.GothamBold, TextSize = 17, TextColor3 = TEXT,
				BackgroundColor3 = Color3.fromRGB(40, 32, 60), Size = UDim2.new(1, -28, 0, 54),
				Position = UDim2.fromOffset(14, 60 + (i - 1) * 64), Parent = card,
			})
			b.MouseButton1Click:Connect(o[2])
		end
		local close = styledButton(card, {
			Name = "Close", Text = "إغلاق", Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = TEXT,
			BackgroundColor3 = Color3.fromRGB(48, 40, 64), Size = UDim2.new(1, -28, 0, 36),
			Position = UDim2.new(0.5, 0, 1, -12), AnchorPoint = Vector2.new(0.5, 1), Parent = card,
		})
		close.MouseButton1Click:Connect(closeActive)
	end)
end

------------------------------------------------------------------------
-- تجربة سينمائية للجالس وقت العرض: شريط ليتربوكس + انتقال + اهتزاز خفيف
------------------------------------------------------------------------
local RunService = game:GetService("RunService")
local Workspace  = game:GetService("Workspace")

local function setupCinematics()
	local cinemaModel = Workspace:WaitForChild("Cinema", 30)
	if not cinemaModel then return end

	-- شريطا الليتربوكس (أعلى/أسفل)
	local function bar(anchorY, posY)
		return new("Frame", {
			BackgroundColor3 = Color3.new(0, 0, 0), BorderSizePixel = 0,
			AnchorPoint = Vector2.new(0.5, anchorY), Position = UDim2.new(0.5, 0, posY, 0),
			Size = UDim2.new(1, 0, 0, 0), ZIndex = 50, Parent = gui,
		})
	end
	local topBar = bar(0, 0)
	local botBar = bar(1, 1)

	-- ستارة انتقال سوداء
	local fade = new("Frame", {
		BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, BorderSizePixel = 0,
		Size = UDim2.fromScale(1, 1), ZIndex = 60, Visible = false, Parent = gui,
	})

	local BAR_H = 0.11
	local active = false
	local function setBars(on: boolean)
		local h = on and BAR_H or 0
		local ti = TweenInfo.new(0.6, Enum.EasingStyle.Quad)
		TweenService:Create(topBar, ti, { Size = UDim2.new(1, 0, h, 0) }):Play()
		TweenService:Create(botBar, ti, { Size = UDim2.new(1, 0, h, 0) }):Play()
	end
	local function transition()
		fade.Visible = true; fade.BackgroundTransparency = 1
		TweenService:Create(fade, TweenInfo.new(0.35), { BackgroundTransparency = 0 }):Play()
		task.wait(0.45)
		local t = TweenService:Create(fade, TweenInfo.new(0.6), { BackgroundTransparency = 1 })
		t:Play(); t.Completed:Once(function() fade.Visible = false end)
	end

	local function seatedInCinema()
		local char = LocalPlayer.Character
		local hum = char and char:FindFirstChildWhichIsA("Humanoid")
		if not hum or not hum.Sit then return false, hum end
		local sp = hum.SeatPart
		return (sp ~= nil and sp:IsDescendantOf(cinemaModel)), hum
	end

	RunService.RenderStepped:Connect(function()
		local playing = cinemaModel:GetAttribute("Playing") == true
		local seated, hum = seatedInCinema()
		local want = playing and seated
		if want ~= active then
			active = want
			setBars(want)
			if want then task.spawn(transition) end
		end
		if hum then
			if active then
				local t = os.clock()
				hum.CameraOffset = Vector3.new(math.sin(t * 6.3) * 0.05, math.cos(t * 8.1) * 0.05, 0)
			elseif hum.CameraOffset.Magnitude > 0.001 then
				hum.CameraOffset = hum.CameraOffset:Lerp(Vector3.zero, 0.2)
			end
		end
	end)
end
task.spawn(setupCinematics)

------------------------------------------------------------------------
-- 🏪 نظام البوثات (Booths) — واجهة العميل
-- يحجز اللاعب بوثاً، يضيف Gamepasses الخاصة فيه، والزوار يشترون منه.
------------------------------------------------------------------------
do
	local ProximityPromptService = game:GetService("ProximityPromptService")

	local boothRemote = remotes:WaitForChild("Booth")
	local boothInfoFn = remotes:WaitForChild("BoothInfo")
	local MAX_PRODUCTS_C = 6

	local SWATCH_COLORS = {
		PURPLE, CYAN, GOLD,
		Color3.fromRGB(92, 217, 140), Color3.fromRGB(255, 115, 179),
		Color3.fromRGB(255, 130, 70), Color3.fromRGB(120, 255, 120), TEXT,
	}

	local boothStates = {}     -- key -> { ownerId, ownerName, welcome, colorIndex, products, sales, visits }
	local myBooth = nil        -- key of booth I own (or nil)
	local pendingManage = false

	local overlay = nil        -- current open booth modal root

	local function closeBoothModal()
		if overlay then
			local o = overlay
			overlay = nil
			TweenService:Create(o, TweenInfo.new(0.16), { BackgroundTransparency = 1 }):Play()
			task.delay(0.18, function() if o then o:Destroy() end end)
		end
	end

	-- backdrop + centered card; returns (root, card, body) where body is a holder
	local function makeModal(titleText: string, w: number, h: number)
		closeBoothModal()
		local root = new("Frame", {
			Name = "BoothModal", BackgroundColor3 = Color3.new(0, 0, 0),
			BackgroundTransparency = 0.45, BorderSizePixel = 0,
			Size = UDim2.fromScale(1, 1), Parent = gui, ZIndex = 50,
		})
		overlay = root
		root.InputBegan:Connect(function(io)
			if io.UserInputType == Enum.UserInputType.MouseButton1 or io.UserInputType == Enum.UserInputType.Touch then
				-- click outside the card closes
			end
		end)
		local card = new("Frame", {
			Name = "Card", BackgroundColor3 = CARD, BorderSizePixel = 0,
			AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
			Size = UDim2.fromOffset(w, h), Parent = root, ZIndex = 51,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 18) }),
			new("UIStroke", { Color = PURPLE, Thickness = 2, Transparency = 0.15 }),
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(CARD2, CARD) }),
		})
		local header = new("TextLabel", {
			Name = "Header", BackgroundTransparency = 1, Text = titleText,
			Font = Enum.Font.GothamBlack, TextSize = 22, TextColor3 = GOLD,
			TextXAlignment = Enum.TextXAlignment.Right, ZIndex = 52,
			Position = UDim2.fromOffset(16, 12), Size = UDim2.new(1, -70, 0, 32), Parent = card,
		})
		local close = new("TextButton", {
			Name = "Close", Text = "X", Font = Enum.Font.GothamBlack, TextSize = 20,
			TextColor3 = TEXT, BackgroundColor3 = Color3.fromRGB(60, 40, 80), AutoButtonColor = false,
			AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -12, 0, 12),
			Size = UDim2.fromOffset(34, 34), ZIndex = 52, Parent = card,
		}, { new("UICorner", { CornerRadius = UDim.new(1, 0) }) })
		close.MouseButton1Click:Connect(function() playSound(SOUNDS.Click, SOUND_VOLUME); closeBoothModal() end)
		root.BackgroundTransparency = 1
		TweenService:Create(root, TweenInfo.new(0.18), { BackgroundTransparency = 0.45 }):Play()
		return root, card
	end

	local function styledButton(parent, text, color, order)
		local b = new("TextButton", {
			Text = text, Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
			BackgroundColor3 = color, AutoButtonColor = false, LayoutOrder = order or 1,
			Size = UDim2.new(1, 0, 0, 40), ZIndex = 53, Parent = parent,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }) })
		b.MouseEnter:Connect(function()
			playSound(SOUNDS.Hover, SOUND_VOLUME)
			TweenService:Create(b, TweenInfo.new(0.12), { BackgroundTransparency = 0.15 }):Play()
		end)
		b.MouseLeave:Connect(function()
			TweenService:Create(b, TweenInfo.new(0.12), { BackgroundTransparency = 0 }):Play()
		end)
		return b
	end

	-- 🎉 toast + confetti
	local function celebrate(text: string)
		local toast = new("Frame", {
			Name = "Toast", BackgroundColor3 = CARD, BorderSizePixel = 0,
			AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 80),
			Size = UDim2.fromOffset(360, 56), ZIndex = 80, Parent = gui,
		}, {
			new("UICorner", { CornerRadius = UDim.new(0, 14) }),
			new("UIStroke", { Color = GOLD, Thickness = 2, Transparency = 0.1 }),
			new("TextLabel", {
				BackgroundTransparency = 1, Text = text, Font = Enum.Font.GothamBlack,
				TextSize = 17, TextColor3 = GOLD, Size = UDim2.fromScale(1, 1),
				ZIndex = 81, TextWrapped = true,
			}),
		})
		toast.BackgroundTransparency = 1
		for _, d in ipairs(toast:GetDescendants()) do
			if d:IsA("TextLabel") then d.TextTransparency = 1 end
		end
		TweenService:Create(toast, TweenInfo.new(0.25), { BackgroundTransparency = 0 }):Play()
		for _, d in ipairs(toast:GetDescendants()) do
			if d:IsA("TextLabel") then TweenService:Create(d, TweenInfo.new(0.25), { TextTransparency = 0 }):Play() end
		end
		-- confetti
		local cols = { PURPLE, CYAN, GOLD, Color3.fromRGB(255,115,179), Color3.fromRGB(120,255,140) }
		for i = 1, 26 do
			local p = new("Frame", {
				BackgroundColor3 = cols[(i % #cols) + 1], BorderSizePixel = 0,
				AnchorPoint = Vector2.new(0.5, 0.5),
				Position = UDim2.new(math.random(15, 85) / 100, 0, 0, -20),
				Size = UDim2.fromOffset(math.random(6, 12), math.random(8, 16)),
				Rotation = math.random(0, 180), ZIndex = 79, Parent = gui,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 3) }) })
			local fall = TweenService:Create(p, TweenInfo.new(math.random(12, 22) / 10, Enum.EasingStyle.Quad), {
				Position = UDim2.new(p.Position.X.Scale, math.random(-60, 60), 1, 40),
				Rotation = p.Rotation + math.random(180, 540), BackgroundTransparency = 1,
			})
			fall:Play()
			fall.Completed:Once(function() p:Destroy() end)
		end
		task.delay(3, function()
			if toast then
				TweenService:Create(toast, TweenInfo.new(0.3), { BackgroundTransparency = 1 }):Play()
				task.delay(0.35, function() if toast then toast:Destroy() end end)
			end
		end)
	end

	-- a small bottom info toast (non-celebration)
	local function infoToast(text: string, good: boolean)
		local t = new("TextLabel", {
			BackgroundColor3 = CARD2, BorderSizePixel = 0, Text = text,
			Font = Enum.Font.GothamBold, TextSize = 15, TextColor3 = good and Color3.fromRGB(150,255,180) or Color3.fromRGB(255,150,150),
			TextWrapped = true, AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, 0, 1, -24), Size = UDim2.fromOffset(380, 48), ZIndex = 85, Parent = gui,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 12) }), new("UIStroke", { Color = good and Color3.fromRGB(120,255,160) or Color3.fromRGB(255,120,120), Thickness = 1.5, Transparency = 0.2 }) })
		t.BackgroundTransparency = 1; t.TextTransparency = 1
		TweenService:Create(t, TweenInfo.new(0.2), { BackgroundTransparency = 0, TextTransparency = 0 }):Play()
		task.delay(2.6, function()
			if t then TweenService:Create(t, TweenInfo.new(0.3), { BackgroundTransparency = 1, TextTransparency = 1 }):Play(); task.delay(0.35, function() if t then t:Destroy() end end) end
		end)
	end

	--------------------------------------------------------------------
	-- Shop view (visitor): browse + buy a booth's products
	--------------------------------------------------------------------
	local function openShop(key: string)
		local st = boothStates[key]
		if not st or st.ownerId == 0 then infoToast("هذا البوث متاح — اضغط E لحجزه.", true); return end
		local _, card = makeModal("🏪 بوث " .. (st.ownerName or "لاعب"), 460, 520)

		local welcome = new("TextLabel", {
			BackgroundTransparency = 1, Text = st.welcome ~= "" and st.welcome or "أهلاً بكم! 🎬",
			Font = Enum.Font.GothamMedium, TextSize = 15, TextColor3 = SUBT, TextWrapped = true,
			TextXAlignment = Enum.TextXAlignment.Right, ZIndex = 53,
			Position = UDim2.fromOffset(16, 56), Size = UDim2.new(1, -32, 0, 40), Parent = card,
		})

		-- presence line + "call the owner" button
		local present = st.present == true
		new("TextLabel", {
			BackgroundTransparency = 1, ZIndex = 53,
			Text = present and "🟢 صاحب البوث موجود الآن" or "⚪ صاحب البوث غير موجود حالياً",
			Font = Enum.Font.GothamBold, TextSize = 13,
			TextColor3 = present and Color3.fromRGB(120, 255, 160) or SUBT,
			TextXAlignment = Enum.TextXAlignment.Right,
			Position = UDim2.fromOffset(16, 98), Size = UDim2.new(1, -150, 0, 26), Parent = card,
		})
		local ringBtn = new("TextButton", {
			Text = "🔔 نادِ صاحب البوث", Font = Enum.Font.GothamBold, TextSize = 13,
			TextColor3 = Color3.new(0, 0, 0), BackgroundColor3 = CYAN, AutoButtonColor = false, ZIndex = 53,
			Position = UDim2.new(1, -148, 0, 96), Size = UDim2.fromOffset(132, 30), Parent = card,
		}, { new("UICorner", { CornerRadius = UDim.new(0, 9) }) })
		ringBtn.MouseButton1Click:Connect(function()
			playSound(SOUNDS.Click, SOUND_VOLUME)
			boothRemote:FireServer({ action = "ring", boothKey = key })
		end)

		-- best seller (highest "sold")
		local bestIdx, bestSold = 0, 0
		for i, p in ipairs(st.products) do
			if (p.sold or 0) > bestSold then bestSold = p.sold; bestIdx = i end
		end

		local scroll = new("ScrollingFrame", {
			BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 53,
			Position = UDim2.fromOffset(12, 136), Size = UDim2.new(1, -24, 1, -152),
			ScrollBarThickness = 5, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
			Parent = card,
		}, {
			new("UIGridLayout", {
				CellSize = UDim2.fromOffset(204, 150), CellPadding = UDim2.fromOffset(10, 10),
				HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder,
			}),
		})

		if #st.products == 0 then
			new("TextLabel", {
				BackgroundTransparency = 1, Text = "لا توجد منتجات بعد.", Font = Enum.Font.GothamBold,
				TextSize = 16, TextColor3 = SUBT, Size = UDim2.new(1, 0, 0, 60), ZIndex = 53, Parent = scroll,
			})
		end
		for i, p in ipairs(st.products) do
			local cell = new("Frame", {
				BackgroundColor3 = CARD2, BorderSizePixel = 0, LayoutOrder = i, ZIndex = 53, Parent = scroll,
			}, {
				new("UICorner", { CornerRadius = UDim.new(0, 12) }),
				new("UIStroke", { Color = PURPLE, Thickness = 1.5, Transparency = 0.3 }),
			})
			local glow = cell:FindFirstChildWhichIsA("UIStroke")
			if i == bestIdx and bestSold > 0 then
				glow.Color = GOLD
				glow.Transparency = 0
				new("TextLabel", {
					BackgroundColor3 = GOLD, BorderSizePixel = 0, ZIndex = 56,
					Text = "🏆 الأكثر مبيعاً", Font = Enum.Font.GothamBlack, TextSize = 11,
					TextColor3 = Color3.new(0, 0, 0),
					Position = UDim2.new(1, -118, 0, -8), Size = UDim2.fromOffset(112, 20), Parent = cell,
				}, { new("UICorner", { CornerRadius = UDim.new(0, 8) }) })
			end
			new("ImageLabel", {
				BackgroundColor3 = CARD, Image = p.icon ~= "" and p.icon or "",
				Position = UDim2.fromOffset(10, 8), Size = UDim2.fromOffset(56, 56), ZIndex = 54, Parent = cell,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
			new("TextLabel", {
				BackgroundTransparency = 1, Text = p.name, Font = Enum.Font.GothamBold, TextSize = 14,
				TextColor3 = TEXT, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left,
				Position = UDim2.fromOffset(74, 8), Size = UDim2.new(1, -84, 0, 56), ZIndex = 54, Parent = cell,
			})
			new("TextLabel", {
				BackgroundTransparency = 1, Text = (p.price and p.price > 0) and ("R$ " .. toAr(p.price)) or "مجاني/غير محدّد",
				Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = GOLD, TextXAlignment = Enum.TextXAlignment.Left,
				Position = UDim2.fromOffset(12, 70), Size = UDim2.new(1, -24, 0, 24), ZIndex = 54, Parent = cell,
			})
			local buy = new("TextButton", {
				Text = "🛒 شراء", Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = Color3.new(0,0,0),
				BackgroundColor3 = GOLD, AutoButtonColor = false, ZIndex = 54,
				Position = UDim2.fromOffset(12, 102), Size = UDim2.new(1, -24, 0, 36), Parent = cell,
			}, { new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
			buy.MouseEnter:Connect(function()
				playSound(SOUNDS.Hover, SOUND_VOLUME)
				TweenService:Create(glow, TweenInfo.new(0.12), { Transparency = 0 }):Play()
				TweenService:Create(buy, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(255, 225, 140) }):Play()
			end)
			buy.MouseLeave:Connect(function()
				TweenService:Create(glow, TweenInfo.new(0.12), { Transparency = 0.3 }):Play()
				TweenService:Create(buy, TweenInfo.new(0.12), { BackgroundColor3 = GOLD }):Play()
			end)
			buy.MouseButton1Click:Connect(function()
				playSound(SOUNDS.Click, SOUND_VOLUME)
				boothRemote:FireServer({ action = "buy", boothKey = key, index = i })
			end)
		end
	end

	--------------------------------------------------------------------
	-- Management view (owner)
	--------------------------------------------------------------------
	local openManage  -- fwd

	local function rebuildManage(card, key)
		local st = boothStates[key]
		if not st then return end
		-- clear dynamic holder
		local holder = card:FindFirstChild("Dynamic")
		if holder then holder:Destroy() end
		holder = new("Frame", { Name = "Dynamic", BackgroundTransparency = 1, ZIndex = 53,
			Position = UDim2.fromOffset(12, 56), Size = UDim2.new(1, -24, 1, -68), Parent = card }, {
			new("UIListLayout", { FillDirection = Enum.FillDirection.Vertical, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }),
		})

		-- welcome
		local wlabel = new("TextLabel", { BackgroundTransparency = 1, Text = "✍️ النص الترحيبي:", Font = Enum.Font.GothamBold,
			TextSize = 14, TextColor3 = SUBT, TextXAlignment = Enum.TextXAlignment.Right, LayoutOrder = 1,
			Size = UDim2.new(1, 0, 0, 20), ZIndex = 53, Parent = holder })
		local wbox = new("TextBox", { Text = st.welcome or "", PlaceholderText = "اكتب ترحيباً للزوار…",
			Font = Enum.Font.GothamMedium, TextSize = 14, TextColor3 = TEXT, TextWrapped = true,
			BackgroundColor3 = CARD2, ClearTextOnFocus = false, LayoutOrder = 2, TextXAlignment = Enum.TextXAlignment.Right,
			Size = UDim2.new(1, 0, 0, 38), ZIndex = 53, Parent = holder }, { new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
		wbox.FocusLost:Connect(function()
			boothRemote:FireServer({ action = "setWelcome", text = wbox.Text })
		end)

		-- add pass row
		new("TextLabel", { BackgroundTransparency = 1, Text = "➕ أضف Gamepass (رابط أو رقم):", Font = Enum.Font.GothamBold,
			TextSize = 14, TextColor3 = SUBT, TextXAlignment = Enum.TextXAlignment.Right, LayoutOrder = 3,
			Size = UDim2.new(1, 0, 0, 20), ZIndex = 53, Parent = holder })
		local addRow = new("Frame", { BackgroundTransparency = 1, LayoutOrder = 4, Size = UDim2.new(1, 0, 0, 40), ZIndex = 53, Parent = holder })
		local idbox = new("TextBox", { Text = "", PlaceholderText = "https://roblox.com/game-pass/123…  أو  123456",
			Font = Enum.Font.GothamMedium, TextSize = 13, TextColor3 = TEXT, BackgroundColor3 = CARD2,
			ClearTextOnFocus = false, TextXAlignment = Enum.TextXAlignment.Left,
			Position = UDim2.fromOffset(0, 0), Size = UDim2.new(1, -104, 1, 0), ZIndex = 53, Parent = addRow },
			{ new("UICorner", { CornerRadius = UDim.new(0, 10) }), new("UIPadding", { PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10) }) })
		local addBtn = new("TextButton", { Text = "تحقّق وأضف", Font = Enum.Font.GothamBlack, TextSize = 14, TextColor3 = Color3.new(0,0,0),
			BackgroundColor3 = Color3.fromRGB(120, 255, 160), AutoButtonColor = false,
			AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 0), Size = UDim2.fromOffset(98, 40), ZIndex = 53, Parent = addRow },
			{ new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
		addBtn.MouseButton1Click:Connect(function()
			local input = idbox.Text
			if input == "" then infoToast("الصق رابط أو رقم Gamepass أولاً.", false); return end
			playSound(SOUNDS.Click, SOUND_VOLUME)
			addBtn.Text = "…"
			task.spawn(function()
				local ok, res = pcall(function() return boothInfoFn:InvokeServer(input) end)
				addBtn.Text = "تحقّق وأضف"
				if ok and res and res.ok then
					boothRemote:FireServer({ action = "addPass", input = input })
					idbox.Text = ""
				elseif ok and res and res.reason then
					infoToast(res.reason, false)
				else
					infoToast("تعذّر التحقق من هذا الرقم.", false)
				end
			end)
		end)

		-- color swatches
		new("TextLabel", { BackgroundTransparency = 1, Text = "🎨 لون البوث:", Font = Enum.Font.GothamBold,
			TextSize = 14, TextColor3 = SUBT, TextXAlignment = Enum.TextXAlignment.Right, LayoutOrder = 5,
			Size = UDim2.new(1, 0, 0, 20), ZIndex = 53, Parent = holder })
		local swRow = new("Frame", { BackgroundTransparency = 1, LayoutOrder = 6, Size = UDim2.new(1, 0, 0, 34), ZIndex = 53, Parent = holder },
			{ new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Right }) })
		for ci, col in ipairs(SWATCH_COLORS) do
			local sw = new("TextButton", { Text = "", BackgroundColor3 = col, AutoButtonColor = false,
				Size = UDim2.fromOffset(30, 30), ZIndex = 53, Parent = swRow },
				{ new("UICorner", { CornerRadius = UDim.new(1, 0) }),
				  new("UIStroke", { Color = TEXT, Thickness = st.colorIndex == ci and 3 or 0, Transparency = 0.1 }) })
			sw.MouseButton1Click:Connect(function()
				playSound(SOUNDS.Click, SOUND_VOLUME)
				boothRemote:FireServer({ action = "setColor", index = ci })
			end)
		end

		-- products list
		new("TextLabel", { BackgroundTransparency = 1, Text = "📦 منتجاتك (" .. toAr(#st.products) .. " / " .. toAr(MAX_PRODUCTS_C) .. "):",
			Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = SUBT, TextXAlignment = Enum.TextXAlignment.Right,
			LayoutOrder = 7, Size = UDim2.new(1, 0, 0, 20), ZIndex = 53, Parent = holder })
		local list = new("ScrollingFrame", { BackgroundTransparency = 1, BorderSizePixel = 0, LayoutOrder = 8,
			Size = UDim2.new(1, 0, 1, -278), ScrollBarThickness = 5, CanvasSize = UDim2.new(),
			AutomaticCanvasSize = Enum.AutomaticSize.Y, ZIndex = 53, Parent = holder },
			{ new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }) })
		for i, p in ipairs(st.products) do
			local row = new("Frame", { BackgroundColor3 = CARD2, BorderSizePixel = 0, LayoutOrder = i,
				Size = UDim2.new(1, 0, 0, 48), ZIndex = 54, Parent = list }, { new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
			new("ImageLabel", { BackgroundColor3 = CARD, Image = p.icon ~= "" and p.icon or "",
				Position = UDim2.fromOffset(6, 6), Size = UDim2.fromOffset(36, 36), ZIndex = 55, Parent = row },
				{ new("UICorner", { CornerRadius = UDim.new(0, 8) }) })
			new("TextLabel", { BackgroundTransparency = 1, Text = p.name .. "  •  R$ " .. toAr(p.price or 0),
				Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT, TextXAlignment = Enum.TextXAlignment.Right,
				Position = UDim2.fromOffset(50, 0), Size = UDim2.new(1, -110, 1, 0), ZIndex = 55, Parent = row })
			local del = new("TextButton", { Text = "🗑️", Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
				BackgroundColor3 = Color3.fromRGB(190, 60, 80), AutoButtonColor = false, AnchorPoint = Vector2.new(1, 0.5),
				Position = UDim2.new(1, -8, 0.5, 0), Size = UDim2.fromOffset(48, 36), ZIndex = 55, Parent = row },
				{ new("UICorner", { CornerRadius = UDim.new(0, 8) }) })
			del.MouseButton1Click:Connect(function()
				playSound(SOUNDS.Click, SOUND_VOLUME)
				boothRemote:FireServer({ action = "removeProduct", index = i })
			end)
		end

		-- bottom actions
		local actions = new("Frame", { BackgroundTransparency = 1, LayoutOrder = 9, Size = UDim2.new(1, 0, 0, 40), ZIndex = 53, Parent = holder },
			{ new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), HorizontalAlignment = Enum.HorizontalAlignment.Center }) })
		local prev = new("TextButton", { Text = "👁️ معاينة المتجر", Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT,
			BackgroundColor3 = PURPLE, AutoButtonColor = false, Size = UDim2.new(0.5, -4, 1, 0), ZIndex = 53, Parent = actions },
			{ new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
		prev.MouseButton1Click:Connect(function() playSound(SOUNDS.Click, SOUND_VOLUME); openShop(key) end)
		local rel = new("TextButton", { Text = "🔓 تحرير البوث", Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = TEXT,
			BackgroundColor3 = Color3.fromRGB(190, 60, 80), AutoButtonColor = false, Size = UDim2.new(0.5, -4, 1, 0), ZIndex = 53, Parent = actions },
			{ new("UICorner", { CornerRadius = UDim.new(0, 10) }) })
		rel.MouseButton1Click:Connect(function()
			playSound(SOUNDS.Click, SOUND_VOLUME)
			boothRemote:FireServer({ action = "release" })
			closeBoothModal()
		end)
	end

	openManage = function(key)
		local mst = boothStates[key]
		local mlbl = (mst and mst.keyLabel) or key
		local _, card = makeModal("👑 إدارة بوثك (" .. mlbl .. ")", 480, 580)
		rebuildManage(card, key)
		card:SetAttribute("BoothKey", key)
		card.Name = "ManageCard"
	end

	--------------------------------------------------------------------
	-- Leaderboards
	--------------------------------------------------------------------
	local lbDonors, lbPopular = {}, {}
	local function openLeaderboards()
		local _, card = makeModal("🏆 المتصدّرون", 440, 520)
		local function column(titleText, items, xScale, fmtItem)
			local col = new("Frame", { BackgroundTransparency = 1, ZIndex = 53,
				Position = UDim2.new(xScale, 8, 0, 56), Size = UDim2.new(0.5, -16, 1, -68), Parent = card },
				{ new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }) })
			new("TextLabel", { BackgroundTransparency = 1, Text = titleText, Font = Enum.Font.GothamBlack, TextSize = 16,
				TextColor3 = GOLD, Size = UDim2.new(1, 0, 0, 26), LayoutOrder = 0, ZIndex = 53, Parent = col })
			if #items == 0 then
				new("TextLabel", { BackgroundTransparency = 1, Text = "لا يوجد بعد", Font = Enum.Font.Gotham, TextSize = 13,
					TextColor3 = SUBT, Size = UDim2.new(1, 0, 0, 24), LayoutOrder = 1, ZIndex = 53, Parent = col })
			end
			for i, it in ipairs(items) do
				new("TextLabel", { BackgroundColor3 = CARD2, BorderSizePixel = 0, Text = toAr(i) .. ". " .. fmtItem(it),
					Font = Enum.Font.GothamBold, TextSize = 13, TextColor3 = TEXT, TextXAlignment = Enum.TextXAlignment.Right,
					LayoutOrder = i, Size = UDim2.new(1, 0, 0, 30), ZIndex = 53, Parent = col },
					{ new("UICorner", { CornerRadius = UDim.new(0, 8) }), new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingLeft = UDim.new(0, 8) }) })
			end
		end
		column("💝 الأكثر دعماً", lbDonors, 0, function(it) return (it.name or "?") .. " — R$ " .. toAr(it.robux or 0) end)
		column("🔥 أكثر البوثات", lbPopular, 0.5, function(it) return (it.ownerName or it.keyLabel or it.key) .. " — " .. toAr(it.sales or 0) .. " بيع" end)
	end

	--------------------------------------------------------------------
	-- Dock buttons (left side under store/admin): booth + leaderboards
	--------------------------------------------------------------------
	local boothBtn = new("TextButton", {
		Name = "BoothTab", Text = "🏪 بوثي", Font = Enum.Font.GothamBlack, TextSize = 16, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(36, 30, 64), AutoButtonColor = false, LayoutOrder = 3,
		Size = UDim2.fromOffset(132, 46), Parent = leftDock,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 14) }),
		new("UIStroke", { Color = CYAN, Thickness = 1.5, Transparency = 0.2 }),
		new("UIGradient", { Rotation = 20, Color = ColorSequence.new(PURPLE, CARD) }),
	})
	boothBtn.MouseEnter:Connect(function() playSound(SOUNDS.Hover, SOUND_VOLUME); TweenService:Create(boothBtn, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(56, 46, 92) }):Play() end)
	boothBtn.MouseLeave:Connect(function() TweenService:Create(boothBtn, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(36, 30, 64) }):Play() end)
	boothBtn.MouseButton1Click:Connect(function()
		playSound(SOUNDS.Click, SOUND_VOLUME)
		if myBooth then openManage(myBooth) else infoToast("اقترب من بوث متاح واضغط E لحجزه.", true) end
	end)

	local lbBtn = new("TextButton", {
		Name = "LeaderTab", Text = "🏆 المتصدّرون", Font = Enum.Font.GothamBlack, TextSize = 15, TextColor3 = TEXT,
		BackgroundColor3 = Color3.fromRGB(36, 30, 64), AutoButtonColor = false, LayoutOrder = 4,
		Size = UDim2.fromOffset(132, 46), Parent = leftDock,
	}, {
		new("UICorner", { CornerRadius = UDim.new(0, 14) }),
		new("UIStroke", { Color = GOLD, Thickness = 1.5, Transparency = 0.2 }),
		new("UIGradient", { Rotation = 20, Color = ColorSequence.new(PURPLE, CARD) }),
	})
	lbBtn.MouseEnter:Connect(function() playSound(SOUNDS.Hover, SOUND_VOLUME); TweenService:Create(lbBtn, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(56, 46, 92) }):Play() end)
	lbBtn.MouseLeave:Connect(function() TweenService:Create(lbBtn, TweenInfo.new(0.12), { BackgroundColor3 = Color3.fromRGB(36, 30, 64) }):Play() end)
	lbBtn.MouseButton1Click:Connect(function() playSound(SOUNDS.Click, SOUND_VOLUME); openLeaderboards() end)

	--------------------------------------------------------------------
	-- Prompt → claim / open shop / manage
	--------------------------------------------------------------------
	ProximityPromptService.PromptTriggered:Connect(function(prompt, player)
		if player ~= LocalPlayer then return end
		if prompt.Name ~= "BoothPrompt" then return end
		local model = prompt:FindFirstAncestorWhichIsA("Model")
		if not model then return end
		local key = model.Name:match("^DonationBooth_(.+)$")
		if not key then return end
		local st = boothStates[key]
		if not st or st.ownerId == 0 then
			pendingManage = true
			boothRemote:FireServer({ action = "claim", boothKey = key })
		elseif st.ownerId == LocalPlayer.UserId then
			openManage(key)
		else
			openShop(key)
		end
	end)

	--------------------------------------------------------------------
	-- Receive server state
	--------------------------------------------------------------------
	boothRemote.OnClientEvent:Connect(function(payload)
		if type(payload) ~= "table" then return end
		if payload.action == "state" then
			boothStates = payload.booths or {}
			myBooth = payload.myBooth
			boothBtn.Text = myBooth and "🏪 إدارة بوثي" or "🏪 بوثي"
			-- live refresh of an open management card
			if overlay then
				local mc = overlay:FindFirstChild("ManageCard", true)
				if mc and myBooth and mc:GetAttribute("BoothKey") == myBooth then
					rebuildManage(mc, myBooth)
				elseif mc and not myBooth then
					closeBoothModal()
				end
			end
			if pendingManage and myBooth then
				pendingManage = false
				openManage(myBooth)
			end
		elseif payload.action == "leaderboard" then
			lbDonors = payload.donors or {}
			lbPopular = payload.popular or {}
		elseif payload.action == "notify" then
			infoToast(payload.text or "", payload.kind ~= "error")
		elseif payload.action == "thank" then
			if payload.forMe then
				celebrate("🎉 شكراً لدعمك! 💝")
			else
				infoToast("💝 " .. (payload.buyerName or "لاعب") .. " دعم " .. (payload.ownerName or "بوثاً") .. " — شكراً!", true)
			end
		end
	end)

	-- ask for initial state
	task.delay(1, function()
		boothRemote:FireServer({ action = "requestState" })
	end)
end
