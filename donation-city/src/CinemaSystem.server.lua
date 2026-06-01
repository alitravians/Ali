--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  نظام السينما — CINEMA SYSTEM (Server)                                 ║
	║  المكان: ServerScriptService     ·     النوع: Script                   ║
	║                                                                        ║
	║  • شاشة عرض + بروجكتر: اقترب واضغط E لبدء الفيلم (دقيقة–دقيقتين)         ║
	║  • وقت العرض: تنخفض إضاءة القاعة لأجواء سينمائية ثم ترجع بعد النهاية     ║
	║  • تُقفل البوابة أثناء العرض فلا يدخل أحد، وتُفتح تلقائياً بعد الفيلم      ║
	║  • بسطة فشار: اضغط E لتأخذ علبة فشار                                    ║
	║  • لوحة تعليمات عربية + لافتة + شاشة كلها تُبنى برمجياً                  ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace        = game:GetService("Workspace")
local Players          = game:GetService("Players")
local ContentProvider  = game:GetService("ContentProvider")
local TweenService     = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local cinema = Workspace:WaitForChild("Cinema")

------------------------------------------------------------------------
-- CONFIG
------------------------------------------------------------------------
local CONFIG = {
	MovieMinSeconds = 60,   -- أقل مدة للفيلم
	MovieMaxSeconds = 120,  -- أقصى مدة للفيلم
	SceneSeconds    = 7,    -- مدة كل مشهد على الشاشة

	-- فيديو حقيقي: ضع رقم asset لفيديو مرفوع على Roblox (VideoFrame).
	-- 0 = استخدم المشاهد/السلايد-شو بدل الفيديو.
	VideoId = 0,

	-- سلايد-شو مجاني: لقطات الفيديو الحقيقية مرفوعة كـ Decals/Images (مجاناً).
	-- ضع أرقام الـ Decal IDs بالترتيب هنا، وستُعرض على شاشة السينما متزامنة مع الصوت.
	-- اتركها فارغة {} لاستخدام المشاهد النصية الافتراضية.
	-- الأولوية: فيديو حقيقي (VideoId) ← ثم السلايد-شو (SlideImages) ← ثم المشاهد النصية.
	-- ١٢ لقطة بالترتيب — استبدل الأصفار بأرقام الـ Decals بعد رفعها (راجع تعليمات التسليم).
	SlideImages = {
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	},
	SlideFadeTime = 0.6,    -- مدة التلاشي بين اللقطات (ثوانٍ)

	-- صوت الفيلم: مفعّل بصوت افتراضي. للأفضل والضمان ارفع صوتك من
	-- create.roblox.com → Audio وضع رقمه هنا (الأصوات المرفوعة من حسابك مضمونة).
	-- عند استخدام VideoId: لو MovieSoundId=0 يُشغّل صوت الفيديو نفسه، وإلا يُشغّل هذا الصوت متزامناً.
	MovieSoundId  = 134501679498361,  -- صوت الفيلم الجديد الذي اختاره المستخدم (0 = مغلق)
	PopcornSoundId = 0,          -- صوت قرمشة الفشار (0 = مغلق) ضع رقم asset لتفعيله
	PopcornBites   = 8,          -- عدد القضمات في علبة الفشار الواحدة
	LobbyMusicId   = 0,          -- موسيقى اللوبي (ضع رقم Audio asset مرفوع من حسابك، 0 = بدون)

	DimBrightness = 0.22,   -- نسبة خفض إضاءة القاعة وقت العرض (شبه ظلام لكن واضح للمشاهدة)

	LockViewers = true,     -- true = كل الجالسين يتقفلون وقت العرض (لا يقدرون القيام)

	SeatSelection = true,   -- true = عند الضغط على البروجكتر تظهر قائمة اختيار المقعد (أمامي/خلفي)
	ProjectorGlow = true,   -- true = يضيء البروجكتر أثناء العرض (إحساس سينمائي)
}

-- مشاهد "الفيلم" (عناوين متحركة احترافية — استبدلها بفيديو ID لاحقاً إن رغبت)
local SCENES = {
	{ bg = Color3.fromRGB(8, 8, 16),    title = "🎬 مدينة التبرعات",        sub = "تقدّم لكم" },
	{ bg = Color3.fromRGB(16, 10, 30),  title = "رحلة الكرم",                sub = "فيلم قصير" },
	{ bg = Color3.fromRGB(10, 22, 30),  title = "في مدينةٍ تنبض بالعطاء...", sub = "بدأت الحكاية" },
	{ bg = Color3.fromRGB(28, 16, 10),  title = "كل تبرّع يصنع فرقاً",        sub = "مهما كان صغيراً" },
	{ bg = Color3.fromRGB(10, 18, 28),  title = "اجتمع الأصدقاء",            sub = "ليصنعوا الأمل" },
	{ bg = Color3.fromRGB(24, 10, 28),  title = "والعطاء يعود إليك",         sub = "أضعافاً مضاعفة" },
	{ bg = Color3.fromRGB(10, 26, 18),  title = "شكراً لكونك هنا ❤️",        sub = "أنت بطل القصة" },
	{ bg = Color3.fromRGB(6, 6, 12),    title = "— النهاية —",               sub = "مدينة التبرعات" },
}

------------------------------------------------------------------------
-- helpers to find parts safely
------------------------------------------------------------------------
local function get(name)
	return cinema:FindFirstChild(name)
end

local screen   = get("Screen")
local marquee  = get("Marquee")
local infoBoard = get("InfoBoard")
local projector = get("Projector")
local popcorn  = get("PopcornStand")
local gate     = get("GateBarrier")
local lights   = get("CeilingLights")
local seatsModel = get("Seats")

------------------------------------------------------------------------
-- SEATS — collect every cinema Seat
------------------------------------------------------------------------
local function getSeats()
	local list = {}
	if seatsModel then
		for _, chair in ipairs(seatsModel:GetChildren()) do
			local seat = chair:FindFirstChildWhichIsA("Seat")
			if seat then list[#list + 1] = seat end
		end
	end
	return list
end

local function findFreeSeat()
	for _, seat in ipairs(getSeats()) do
		if seat.Occupant == nil then return seat end
	end
	return nil
end

-- تصنيف الكراسي إلى صفوف أمامية (الأقرب للشاشة) وخلفية (الأبعد)
local function classifySeats()
	local seats = getSeats()
	if screen then
		table.sort(seats, function(a, b)
			return (a.Position - screen.Position).Magnitude < (b.Position - screen.Position).Magnitude
		end)
	end
	local front, back = {}, {}
	local half = math.ceil(#seats / 2)
	for i, s in ipairs(seats) do
		if i <= half then front[#front + 1] = s else back[#back + 1] = s end
	end
	return front, back
end

local function freeCount(group)
	local n = 0
	for _, s in ipairs(group) do if s.Occupant == nil then n += 1 end end
	return n
end

local function findFreeInGroup(group)
	for _, s in ipairs(group) do if s.Occupant == nil then return s end end
	return nil
end

-- قائمة مقاعد بترتيب ثابت (صفّاً صفّاً ثم يساراً ليمين) لاختيار مقعد محدّد
local function seatsIndexed()
	local seats = getSeats()
	table.sort(seats, function(a, b)
		local da = screen and (a.Position - screen.Position).Magnitude or a.Position.Z
		local db = screen and (b.Position - screen.Position).Magnitude or b.Position.Z
		if math.abs(da - db) > 3 then return da < db end
		return a.Position.X < b.Position.X
	end)
	return seats
end

-- اجلس اللاعب في الصف المطلوب (front/back) مع تجاوز آمن لأي مقعد فاضٍ
local function seatPlayerInRow(player, row: string)
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hum then return nil end
	if hum.SeatPart then return hum.SeatPart end
	local front, back = classifySeats()
	local primary = (row == "back") and back or front
	local secondary = (row == "back") and front or back
	local seat = findFreeInGroup(primary) or findFreeInGroup(secondary)
	if seat then
		local ok = pcall(function() seat:Sit(hum) end)
		-- نتأكد أن الجلوس نجح فعلاً قبل أن نُرجع المقعد (وإلا يُخصم من اللاعب دون أن يجلس)
		if not (ok and hum.SeatPart == seat) then return nil end
	end
	return seat
end

-- اجلس اللاعب في مقعد محدّد (إن كان فاضياً)
local function sitInSeat(player, seat)
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hum or not seat or seat.Occupant ~= nil then return false end
	if hum.SeatPart then return true end
	local ok = pcall(function() seat:Sit(hum) end)
	-- لا نُرجع نجاحاً إلا إذا جلس اللاعب فعلاً في هذا المقعد (وإلا يُخصم منه دون أن يجلس)
	return ok and (hum.SeatPart == seat)
end

-- seat a player on a free chair; returns the Seat used (or nil)
local function seatPlayer(player)
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not hum then return nil end
	if hum.SeatPart then return hum.SeatPart end -- already seated
	local seat = findFreeSeat()
	if seat then
		pcall(function() seat:Sit(hum) end)
	end
	return seat
end

------------------------------------------------------------------------
-- build a SurfaceGui on a part's audience-facing (+Z = Back) face
------------------------------------------------------------------------
local function makeSurface(targetPart, pps)
	local sg = Instance.new("SurfaceGui")
	sg.Name = "Display"
	sg.Adornee = targetPart
	sg.Face = Enum.NormalId.Back
	sg.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	sg.PixelsPerStud = pps or 20
	sg.LightInfluence = 0
	sg.AlwaysOnTop = false
	sg.Parent = targetPart
	return sg
end

------------------------------------------------------------------------
-- SCREEN GUI (movie canvas)
------------------------------------------------------------------------
local screenBg, screenTitle, screenSub, screenProgress, screenTimer, screenVideo
local screenSlides = {}        -- صورتا السلايد-شو (للتلاشي بينهما)
local slideActive = 1          -- أي صورة ظاهرة حالياً
if screen then
	local sg = makeSurface(screen, 18)

	screenBg = Instance.new("Frame")
	screenBg.Size = UDim2.fromScale(1, 1)
	screenBg.BackgroundColor3 = Color3.fromRGB(6, 6, 12)
	screenBg.BorderSizePixel = 0
	screenBg.Parent = sg

	-- letterbox bars (cinematic)
	for _, y in ipairs({0, 1}) do
		local bar = Instance.new("Frame")
		bar.Size = UDim2.new(1, 0, 0.10, 0)
		bar.Position = UDim2.fromScale(0, y)
		bar.AnchorPoint = Vector2.new(0, y)
		bar.BackgroundColor3 = Color3.new(0, 0, 0)
		bar.BorderSizePixel = 0
		bar.ZIndex = 5
		bar.Parent = screenBg
	end

	screenTitle = Instance.new("TextLabel")
	screenTitle.BackgroundTransparency = 1
	screenTitle.Size = UDim2.new(0.9, 0, 0.3, 0)
	screenTitle.Position = UDim2.fromScale(0.5, 0.42)
	screenTitle.AnchorPoint = Vector2.new(0.5, 0.5)
	screenTitle.Font = Enum.Font.GothamBlack
	screenTitle.TextScaled = true
	screenTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
	screenTitle.TextWrapped = true
	screenTitle.Text = "📽️ السينما"
	screenTitle.Parent = screenBg

	screenSub = Instance.new("TextLabel")
	screenSub.BackgroundTransparency = 1
	screenSub.Size = UDim2.new(0.8, 0, 0.12, 0)
	screenSub.Position = UDim2.fromScale(0.5, 0.66)
	screenSub.AnchorPoint = Vector2.new(0.5, 0.5)
	screenSub.Font = Enum.Font.GothamMedium
	screenSub.TextScaled = true
	screenSub.TextColor3 = Color3.fromRGB(200, 200, 220)
	screenSub.Text = "اضغط E على البروجكتر لبدء العرض"
	screenSub.Parent = screenBg

	screenTimer = Instance.new("TextLabel")
	screenTimer.BackgroundTransparency = 1
	screenTimer.Size = UDim2.new(0.3, 0, 0.07, 0)
	screenTimer.Position = UDim2.fromScale(0.97, 0.13)
	screenTimer.AnchorPoint = Vector2.new(1, 0)
	screenTimer.Font = Enum.Font.GothamBold
	screenTimer.TextScaled = true
	screenTimer.TextXAlignment = Enum.TextXAlignment.Right
	screenTimer.TextColor3 = Color3.fromRGB(255, 90, 90)
	screenTimer.Text = ""
	screenTimer.ZIndex = 6
	screenTimer.Parent = screenBg

	local track = Instance.new("Frame")
	track.Size = UDim2.new(1, 0, 0.02, 0)
	track.Position = UDim2.fromScale(0, 0.9)
	track.BackgroundColor3 = Color3.fromRGB(40, 40, 50)
	track.BorderSizePixel = 0
	track.ZIndex = 6
	track.Parent = screenBg
	screenProgress = Instance.new("Frame")
	screenProgress.Size = UDim2.fromScale(0, 1)
	screenProgress.BackgroundColor3 = Color3.fromRGB(255, 80, 80)
	screenProgress.BorderSizePixel = 0
	screenProgress.Parent = track

	-- VideoFrame (للفيديو الحقيقي عند ضبط VideoId) — بين الشريطين السينمائيين
	screenVideo = Instance.new("VideoFrame")
	screenVideo.Size = UDim2.new(1, 0, 0.8, 0)
	screenVideo.Position = UDim2.fromScale(0, 0.1)
	screenVideo.BackgroundColor3 = Color3.new(0, 0, 0)
	screenVideo.BorderSizePixel = 0
	screenVideo.Visible = false
	screenVideo.Looped = false
	screenVideo.ZIndex = 4
	screenVideo.Parent = screenBg

	-- صورتان للسلايد-شو (Decals) لعمل تلاشٍ ناعم بينهما — بين الشريطين السينمائيين
	for i = 1, 2 do
		local img = Instance.new("ImageLabel")
		img.Name = "Slide" .. i
		img.Size = UDim2.new(1, 0, 0.8, 0)
		img.Position = UDim2.fromScale(0, 0.1)
		img.BackgroundColor3 = Color3.new(0, 0, 0)
		img.BackgroundTransparency = 1
		img.BorderSizePixel = 0
		img.ScaleType = Enum.ScaleType.Fit
		img.ImageTransparency = 1
		img.Visible = false
		img.ZIndex = 3
		img.Parent = screenBg
		screenSlides[i] = img
	end
end

local function setScreenIdle()
	if not screenBg then return end
	screenBg.BackgroundColor3 = Color3.fromRGB(6, 6, 12)
	screenTitle.Visible = true
	screenSub.Visible = true
	screenTitle.Text = "📽️ سينما مدينة التبرعات"
	screenSub.Text = "اضغط E على البروجكتر لبدء العرض"
	screenTimer.Text = ""
	screenProgress.Size = UDim2.fromScale(0, 1)
	if screenVideo then
		screenVideo.Playing = false
		screenVideo.Visible = false
	end
	for _, img in ipairs(screenSlides) do
		img.Visible = false
		img.ImageTransparency = 1
	end
	slideActive = 1
end
setScreenIdle()

------------------------------------------------------------------------
-- SLIDESHOW — عرض لقطة على الشاشة مع تلاشٍ ناعم بين الصورتين
------------------------------------------------------------------------
local function showSlide(assetId: number)
	if #screenSlides < 2 then return end
	local incoming = screenSlides[slideActive == 1 and 2 or 1]
	local outgoing = screenSlides[slideActive]

	incoming.Image = "rbxassetid://" .. tostring(assetId)
	incoming.ImageTransparency = 1
	incoming.Visible = true

	local fade = math.max(0.05, CONFIG.SlideFadeTime or 0.6)
	TweenService:Create(incoming, TweenInfo.new(fade, Enum.EasingStyle.Quad), { ImageTransparency = 0 }):Play()
	if outgoing and outgoing ~= incoming then
		local t = TweenService:Create(outgoing, TweenInfo.new(fade, Enum.EasingStyle.Quad), { ImageTransparency = 1 })
		t:Play()
		t.Completed:Once(function()
			if outgoing.ImageTransparency >= 1 then outgoing.Visible = false end
		end)
	end
	slideActive = (slideActive == 1) and 2 or 1
end

------------------------------------------------------------------------
-- MARQUEE
------------------------------------------------------------------------
local marqueeLabel
if marquee then
	local sg = makeSurface(marquee, 20)
	marqueeLabel = Instance.new("TextLabel")
	marqueeLabel.BackgroundTransparency = 1
	marqueeLabel.Size = UDim2.fromScale(1, 1)
	marqueeLabel.Font = Enum.Font.GothamBlack
	marqueeLabel.TextScaled = true
	marqueeLabel.TextColor3 = Color3.fromRGB(40, 20, 0)
	marqueeLabel.Text = "🎬 سينما مدينة التبرعات"
	marqueeLabel.Parent = sg
end

------------------------------------------------------------------------
-- INFO BOARD (rules + how-to, Arabic RTL)
------------------------------------------------------------------------
if infoBoard then
	local sg = makeSurface(infoBoard, 22)

	-- خلفية متدرّجة داكنة + إطار ذهبي مدوّر
	local pad = Instance.new("Frame")
	pad.Size = UDim2.fromScale(1, 1)
	pad.BackgroundColor3 = Color3.fromRGB(16, 13, 26)
	pad.BorderSizePixel = 0
	pad.Parent = sg
	local grad = Instance.new("UIGradient")
	grad.Rotation = 90
	grad.Color = ColorSequence.new(Color3.fromRGB(24, 18, 40), Color3.fromRGB(12, 10, 18))
	grad.Parent = pad
	local padCorner = Instance.new("UICorner"); padCorner.CornerRadius = UDim.new(0, 18); padCorner.Parent = pad
	local strokeAcc = Instance.new("UIStroke")
	strokeAcc.Color = Color3.fromRGB(255, 209, 102)
	strokeAcc.Thickness = 4
	strokeAcc.Parent = pad
	local innerPad = Instance.new("UIPadding")
	innerPad.PaddingTop = UDim.new(0, 14); innerPad.PaddingBottom = UDim.new(0, 14)
	innerPad.PaddingLeft = UDim.new(0, 16); innerPad.PaddingRight = UDim.new(0, 16)
	innerPad.Parent = pad

	-- رأس ذهبي أنيق
	local header = Instance.new("TextLabel")
	header.BackgroundColor3 = Color3.fromRGB(255, 209, 102)
	header.Size = UDim2.new(1, 0, 0.135, 0)
	header.Font = Enum.Font.GothamBlack
	header.TextScaled = true
	header.TextColor3 = Color3.fromRGB(28, 18, 0)
	header.Text = "🎬 قوانين وتعليمات السينما"
	header.Parent = pad
	local hCorner = Instance.new("UICorner"); hCorner.CornerRadius = UDim.new(0, 12); hCorner.Parent = header
	local hPad = Instance.new("UIPadding")
	hPad.PaddingLeft = UDim.new(0, 10); hPad.PaddingRight = UDim.new(0, 10)
	hPad.Parent = header

	-- حاوية الصفوف (كل تعليمة في سطر مستقل) — UIListLayout يحلّ تلخبط RTL
	local list = Instance.new("Frame")
	list.BackgroundTransparency = 1
	list.Position = UDim2.fromScale(0, 0.155)
	list.Size = UDim2.new(1, 0, 0.845, 0)
	list.Parent = pad
	local layout = Instance.new("UIListLayout")
	layout.FillDirection = Enum.FillDirection.Vertical
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.Padding = UDim.new(0.012, 0)
	layout.Parent = list

	-- أيقونة في بداية كل سطر بدل الأرقام (تتفادى انقلاب الأقواس في RTL)
	local RULES = {
		{ "🎟️", "خذ تذكرتك من الشبّاك قبل الدخول." },
		{ "🪑", "ادخل القاعة واجلس على أي كرسي." },
		{ "🍿", "من البسطة اضغط E لتأخذ الفشار والمشروب." },
		{ "🎬", "اقترب من البروجكتر واضغط E لبدء الفيلم." },
		{ "💡", "وقت العرض تنخفض الإضاءة وتُقفل البوابة." },
		{ "⏱️", "مدة الفيلم من دقيقة إلى دقيقتين." },
		{ "🚪", "بعد النهاية تُفتح البوابة وترجع الإضاءة." },
		{ "🤫", "احترم الحضور وتجنّب الإزعاج أثناء العرض." },
	}
	for i, r in ipairs(RULES) do
		local row = Instance.new("Frame")
		row.LayoutOrder = i
		row.Size = UDim2.new(1, 0, 0.108, 0)
		row.BackgroundColor3 = (i % 2 == 0) and Color3.fromRGB(30, 24, 48) or Color3.fromRGB(22, 18, 36)
		row.BackgroundTransparency = 0.15
		row.Parent = list
		local rCorner = Instance.new("UICorner"); rCorner.CornerRadius = UDim.new(0, 10); rCorner.Parent = row

		-- النص (يمين) + الأيقونة (يسار)
		local txt = Instance.new("TextLabel")
		txt.BackgroundTransparency = 1
		txt.AnchorPoint = Vector2.new(1, 0.5)
		txt.Position = UDim2.fromScale(0.985, 0.5)
		txt.Size = UDim2.new(0.84, 0, 0.74, 0)
		txt.Font = Enum.Font.GothamBold
		txt.TextScaled = true
		txt.TextColor3 = Color3.fromRGB(244, 242, 252)
		txt.TextXAlignment = Enum.TextXAlignment.Right
		txt.TextYAlignment = Enum.TextYAlignment.Center
		txt.Text = r[2]
		txt.Parent = row

		local icon = Instance.new("TextLabel")
		icon.BackgroundTransparency = 1
		icon.AnchorPoint = Vector2.new(0, 0.5)
		icon.Position = UDim2.fromScale(0.012, 0.5)
		icon.Size = UDim2.new(0.12, 0, 0.8, 0)
		icon.Font = Enum.Font.GothamBlack
		icon.TextScaled = true
		icon.TextColor3 = Color3.fromRGB(255, 209, 102)
		icon.Text = r[1]
		icon.Parent = row
	end

	-- سطر ختامي مميّز
	local footer = Instance.new("TextLabel")
	footer.LayoutOrder = #RULES + 1
	footer.Size = UDim2.new(1, 0, 0.108, 0)
	footer.BackgroundColor3 = Color3.fromRGB(48, 30, 10)
	footer.BackgroundTransparency = 0.1
	footer.Font = Enum.Font.GothamBlack
	footer.TextScaled = true
	footer.TextColor3 = Color3.fromRGB(255, 220, 140)
	footer.Text = "🍿 استمتع بوقتك في مدينة التبرعات!"
	footer.Parent = list
	local fCorner = Instance.new("UICorner"); fCorner.CornerRadius = UDim.new(0, 10); fCorner.Parent = footer
	local fPad = Instance.new("UIPadding")
	fPad.PaddingLeft = UDim.new(0, 10); fPad.PaddingRight = UDim.new(0, 10)
	fPad.Parent = footer
end

------------------------------------------------------------------------
-- LIGHTS dim / restore
------------------------------------------------------------------------
local lightStore = {}
if lights then
	for _, panel in ipairs(lights:GetDescendants()) do
		if panel:IsA("BasePart") then
			local pl = panel:FindFirstChildWhichIsA("PointLight")
			        or panel:FindFirstChildWhichIsA("SpotLight")
			lightStore[#lightStore + 1] = {
				part = panel, light = pl,
				color = panel.Color,
				bright = pl and pl.Brightness or 0,
			}
		end
	end
end

local DIM_TINT = Color3.fromRGB(10, 9, 16)

-- on=true → إضاءة كاملة طبيعية، on=false → خفض الإضاءة لأجواء العرض (لا تنطفئ تماماً)
local function setLights(on)
	for _, e in ipairs(lightStore) do
		if e.light then
			e.light.Enabled = true
			e.light.Brightness = on and e.bright or (e.bright * CONFIG.DimBrightness)
		end
		if e.part then
			-- نبقي الخامة Neon حتى تظل الألواح متوهّجة بخفوت أثناء العرض
			e.part.Material = Enum.Material.Neon
			e.part.Color = on and e.color or e.color:Lerp(DIM_TINT, 0.78)
		end
	end
end

------------------------------------------------------------------------
-- HALL AMBIANCE — إضاءة كاملة وقت الخمول + نيون جدران/ممرات
-- (مستوحى من سينمات حقيقية: ألواح نيون حمراء/زرقاء + ممرات مضيئة)
------------------------------------------------------------------------
local NEON_RED  = Color3.fromRGB(255, 64, 70)
local NEON_BLUE = Color3.fromRGB(80, 175, 255)
local AISLE_GLOW = Color3.fromRGB(255, 226, 170)

local function buildHallAmbiance()
	local floorP = get("Floor")
	local fc = floorP and floorP.Position or Vector3.new(0, 1, -150)
	local fs = floorP and floorP.Size or Vector3.new(70, 1, 84)
	local topY  = fc.Y + fs.Y / 2          -- سطح الأرضية
	local halfX = fs.X / 2
	local halfZ = fs.Z / 2
	local wallX = halfX - 2                 -- داخل الجدران بقليل
	local cz    = fc.Z

	local amb = Instance.new("Folder")
	amb.Name = "Ambiance"
	amb.Parent = cinema

	local function neon(size: Vector3, pos: Vector3, color: Color3, lb: number?, lr: number?)
		local p = Instance.new("Part")
		p.Anchored = true; p.CanCollide = false; p.CastShadow = false
		p.Material = Enum.Material.Neon; p.Color = color
		p.Size = size; p.CFrame = CFrame.new(pos); p.Parent = amb
		if lb and lb > 0 then
			local pl = Instance.new("PointLight")
			pl.Color = color; pl.Brightness = lb; pl.Range = lr or 16
			pl.Parent = p
		end
		return p
	end

	-- ألواح نيون على الجدران الجانبية (يسار أحمر، يمين أزرق) — صفّان: منتصف وأعلى
	local stripLen = fs.Z - 14
	neon(Vector3.new(0.5, 1.6, stripLen), Vector3.new(-wallX, topY + 8,  cz), NEON_RED,  1.4, 24)
	neon(Vector3.new(0.5, 1.0, stripLen), Vector3.new(-wallX, topY + 16, cz), NEON_RED,  0.7, 18)
	neon(Vector3.new(0.5, 1.6, stripLen), Vector3.new( wallX, topY + 8,  cz), NEON_BLUE, 1.4, 24)
	neon(Vector3.new(0.5, 1.0, stripLen), Vector3.new( wallX, topY + 16, cz), NEON_BLUE, 0.7, 18)

	-- شريط نيون أفقي خلف الشاشة لإطار مضيء
	if screen then
		neon(Vector3.new(screen.Size.X + 4, 0.6, 0.6),
			screen.Position + Vector3.new(0, screen.Size.Y / 2 + 1.5, 1),
			NEON_BLUE, 0.6, 14)
	end

	-- ممرات مضيئة على امتداد القاعة (إضاءة أمان تبقى خافتة حتى أثناء الفيلم)
	for _, ax in ipairs({ -9, 9 }) do
		neon(Vector3.new(0.5, 0.18, fs.Z - 18), Vector3.new(ax, topY + 0.25, cz), AISLE_GLOW, 0.5, 8)
	end

	-- إضاءة سقف حقيقية (هي إصلاح الإظلام: الألواح Neon تتوهّج لكنها لا تضيء الغرفة)
	-- تُسجَّل في lightStore لتخفت تلقائياً وقت العرض ثم ترجع كاملة بعده.
	for _, zx in ipairs({ cz - halfZ * 0.55, cz, cz + halfZ * 0.55 }) do
		for _, xx in ipairs({ -halfX * 0.5, halfX * 0.5 }) do
			local hub = Instance.new("Part")
			hub.Anchored = true; hub.CanCollide = false; hub.CastShadow = false
			hub.Transparency = 1; hub.Size = Vector3.new(1, 1, 1)
			hub.CFrame = CFrame.new(xx, topY + 22, zx); hub.Parent = amb
			local pl = Instance.new("PointLight")
			pl.Color = Color3.fromRGB(255, 244, 224); pl.Brightness = 2.2; pl.Range = 42
			pl.Parent = hub
			lightStore[#lightStore + 1] = { part = nil, light = pl, color = pl.Color, bright = 2.2 }
		end
	end
end

-- مؤثرات بصرية عامة بإحساس Cyber-Neon (خفيفة حتى لا تؤثر على باقي المدينة)
local function setupPostFX()
	local Lighting = game:GetService("Lighting")
	if not Lighting:FindFirstChild("CinemaBloom") then
		local bloom = Instance.new("BloomEffect")
		bloom.Name = "CinemaBloom"; bloom.Intensity = 0.7; bloom.Size = 24; bloom.Threshold = 1.5
		bloom.Parent = Lighting
	end
	if not Lighting:FindFirstChild("CinemaColor") then
		local cc = Instance.new("ColorCorrectionEffect")
		cc.Name = "CinemaColor"; cc.Brightness = 0; cc.Contrast = 0.06; cc.Saturation = 0.08
		cc.Parent = Lighting
	end
end

pcall(buildHallAmbiance)
pcall(setupPostFX)
setLights(true)   -- القاعة مضيئة بالكامل عند بدء اللعبة (لا فيلم = إضاءة كاملة)

------------------------------------------------------------------------
-- GATE open / close
------------------------------------------------------------------------
local function setGate(closed)
	if not gate then return end
	gate.CanCollide = closed
	gate.Transparency = closed and 0.35 or 1
end

------------------------------------------------------------------------
-- PROJECTOR GLOW — إضاءة سينمائية من البروجكتر أثناء العرض
------------------------------------------------------------------------
local projLight
if CONFIG.ProjectorGlow and projector and projector:IsA("BasePart") then
	projLight = Instance.new("PointLight")
	projLight.Name = "ProjectorGlow"
	projLight.Color = Color3.fromRGB(255, 244, 214)
	projLight.Range = 20
	projLight.Brightness = 0
	projLight.Parent = projector
end
local function setProjector(on: boolean)
	if projLight then
		TweenService:Create(projLight, TweenInfo.new(0.6), { Brightness = on and 2.4 or 0 }):Play()
	end
end

------------------------------------------------------------------------
-- MOVIE playback
------------------------------------------------------------------------
local playing = false
local starting = false
local stopRequested = false
local movieEndsAt = 0
local playPrompt = projector and projector:FindFirstChildWhichIsA("ProximityPrompt", true)

local movieSound
if CONFIG.MovieSoundId ~= 0 and screen then
	movieSound = Instance.new("Sound")
	movieSound.SoundId = "rbxassetid://" .. tostring(CONFIG.MovieSoundId)
	movieSound.Looped = true
	movieSound.Volume = 0.8
	movieSound.RollOffMode = Enum.RollOffMode.Linear
	movieSound.RollOffMinDistance = 20
	movieSound.RollOffMaxDistance = 220
	movieSound.Parent = screen
end

local function fmt(t)
	t = math.max(0, math.floor(t + 0.5))
	return string.format("%d:%02d", math.floor(t / 60), t % 60)
end

------------------------------------------------------------------------
-- VIEWER LOCK — keep seated viewers in their chairs during the movie
------------------------------------------------------------------------
local lockConns = {}   -- humanoid -> RBXScriptConnection
local lockedJump = {}  -- humanoid -> { h, p }

local function lockHumanoid(hum, seat)
	if lockConns[hum] then return end
	lockedJump[hum] = { h = hum.JumpHeight, p = hum.JumpPower }
	hum.JumpHeight = 0
	hum.JumpPower = 0
	pcall(function() hum:SetStateEnabled(Enum.HumanoidStateType.Jumping, false) end)
	lockConns[hum] = hum.Seated:Connect(function(active)
		if active then return end
		task.defer(function()
			if lockConns[hum] and hum.Parent then
				local s = (seat and seat.Parent) and seat or findFreeSeat()
				if s then pcall(function() s:Sit(hum) end) end
			end
		end)
	end)
end

local function lockAllSeated()
	if not CONFIG.LockViewers then return end
	for _, seat in ipairs(getSeats()) do
		local occ = seat.Occupant
		if occ then lockHumanoid(occ, seat) end
	end
end

local function unlockAll()
	for hum, conn in pairs(lockConns) do
		conn:Disconnect()
		local j = lockedJump[hum]
		if j and hum.Parent then
			hum.JumpHeight = j.h
			hum.JumpPower = j.p
			pcall(function() hum:SetStateEnabled(Enum.HumanoidStateType.Jumping, true) end)
		end
	end
	lockConns = {}
	lockedJump = {}
	-- stand everyone up so they can leave
	for _, seat in ipairs(getSeats()) do
		local occ = seat.Occupant
		if occ then occ.Sit = false end
	end
end

local function playMovie(presser)
	if playing then starting = false; return end
	playing = true
	starting = false  -- العرض بدأ فعلياً: ارفع قفل البدء (يمنع سباق التشغيل المزدوج)
	stopRequested = false
	if playPrompt then playPrompt.Enabled = false end
	-- اجلس اللاعب الذي ضغط البروجكتر ثم اقفل كل الجالسين
	if presser then seatPlayer(presser) end
	task.wait(0.15)
	lockAllSeated()
	-- إنجاز «أول فيلم» لكل جالس عند بدء العرض
	for _, seat in ipairs(getSeats()) do
		local occ = seat.Occupant
		local plr = occ and Players:GetPlayerFromCharacter(occ.Parent)
		if plr and _G.AwardAchievement then _G.AwardAchievement(plr, "first_movie") end
	end
	setGate(true)
	setLights(false)
	setProjector(true)
	if marqueeLabel then marqueeLabel.Text = "🔴 العرض جارٍ الآن" end

	-- جهّز الفيديو الحقيقي إن وُجد
	local hasVideo = (CONFIG.VideoId ~= 0) and (screenVideo ~= nil)
	if hasVideo then
		screenVideo.Video = "rbxassetid://" .. tostring(CONFIG.VideoId)
		pcall(function() ContentProvider:PreloadAsync({ screenVideo }) end)
	end

	-- جهّز السلايد-شو (لقطات حقيقية كـ Decals) إن وُجدت ولم يكن هناك فيديو
	-- نتجاهل أي رقم 0 أو غير صالح حتى لا تُعرض صور فارغة قبل رفع اللقطات
	local slides = {}
	for _, id in ipairs(CONFIG.SlideImages or {}) do
		if type(id) == "number" and id > 0 then
			slides[#slides + 1] = id
		end
	end
	local hasSlides = (not hasVideo) and (#slides > 0) and (#screenSlides >= 2)
	if hasSlides then
		pcall(function()
			local probe = screenSlides[1]
			for _, id in ipairs(slides) do
				probe.Image = "rbxassetid://" .. tostring(id)
				ContentProvider:PreloadAsync({ probe })
			end
			probe.Image = ""
			probe.ImageTransparency = 1
			probe.Visible = false
		end)
	end

	-- preload the separate movie audio and detect whether it ACTUALLY loaded.
	-- custom audio is private by default; if this experience isn't granted
	-- permission to the asset, it fails to load — and if we still muted the
	-- video the audience would hear nothing. So gate the mute on a real load.
	local movieSoundOk = false
	if movieSound then
		pcall(function() ContentProvider:PreloadAsync({ movieSound }) end)
		movieSoundOk = movieSound.IsLoaded
		if not movieSoundOk then
			warn(("[Cinema] movie audio rbxassetid://%s failed to load — falling back to the video's own audio. "
				.. "To use this custom sound, grant THIS experience permission to the audio on its Roblox asset page "
				.. "(Configure -> Permissions) and make sure its moderation status is Approved."):format(tostring(CONFIG.MovieSoundId)))
		end
	end

	-- مدة العرض: تتبع طول الفيديو، وإلا طول الصوت، وإلا مدة عشوائية افتراضية
	local duration
	if hasVideo and screenVideo.TimeLength and screenVideo.TimeLength > 0 then
		duration = screenVideo.TimeLength
	elseif movieSound and movieSound.TimeLength and movieSound.TimeLength > 0 then
		duration = movieSound.TimeLength
	else
		duration = math.random(CONFIG.MovieMinSeconds, CONFIG.MovieMaxSeconds)
	end

	-- 3..2..1 countdown
	if screenBg then
		for n = 3, 1, -1 do
			screenBg.BackgroundColor3 = Color3.fromRGB(4, 4, 8)
			screenTitle.Text = tostring(n)
			screenSub.Text = "يبدأ العرض..."
			screenTimer.Text = fmt(duration)
			task.wait(1)
		end
	end

	-- تشغيل الفيديو + الصوت متزامنين
	if hasVideo then
		screenTitle.Visible = false
		screenSub.Visible = false
		screenVideo.Visible = true
		screenVideo.Volume = (movieSound and movieSoundOk) and 0 or 1  -- نكتم صوت الفيديو فقط لو صوتنا المنفصل حُمّل فعلاً (وإلا نُبقي صوت الفيديو بدل الصمت)
		screenVideo.TimePosition = 0
		screenVideo.Playing = true
	elseif hasSlides then
		-- وضع السلايد-شو: نخفي النص ونعرض اللقطات على خلفية سوداء سينمائية
		screenTitle.Visible = false
		screenSub.Visible = false
		if screenBg then screenBg.BackgroundColor3 = Color3.fromRGB(0, 0, 0) end
	end
	if movieSound and movieSoundOk then movieSound.TimePosition = 0; movieSound:Play() end

	-- مدة المشهد/اللقطة الواحدة: في وضع السلايد-شو نوزّع اللقطات بالتساوي على مدة الصوت
	local segSeconds = CONFIG.SceneSeconds
	if hasSlides then
		segSeconds = duration / #slides
	end

	movieEndsAt = os.clock() + duration
	local elapsed = 0
	local sceneIndex = 0
	while elapsed < duration do
		if stopRequested then break end
		sceneIndex += 1
		if hasSlides then
			local id = slides[((sceneIndex - 1) % #slides) + 1]
			showSlide(id)
		elseif not hasVideo then
			local scene = SCENES[((sceneIndex - 1) % #SCENES) + 1]
			if screenBg then
				screenBg.BackgroundColor3 = scene.bg
				screenTitle.Text = scene.title
				screenSub.Text = scene.sub
			end
		end
		local sceneEnd = math.min(elapsed + segSeconds, duration)
		while elapsed < sceneEnd do
			if stopRequested then break end
			task.wait(0.25)
			elapsed += 0.25
			if screenProgress then screenProgress.Size = UDim2.fromScale(math.clamp(elapsed / duration, 0, 1), 1) end
			if screenTimer then screenTimer.Text = fmt(duration - elapsed) end
		end
	end

	-- شارة "عاشق السينما" + تقدّم مهمة «شاهد فيلماً كاملاً» لكل من شاهد حتى النهاية
	for _, seat in ipairs(getSeats()) do
		local occ = seat.Occupant
		local char = occ and occ.Parent
		local viewer = char and Players:GetPlayerFromCharacter(char)
		if viewer then
			if _G.AwardBadge then _G.AwardBadge(viewer, "CINEMA") end
			if _G.ReportMission then _G.ReportMission(viewer, "movie_watch", 1) end
		end
	end

	-- end of movie -> restore
	if hasVideo then
		screenVideo.Playing = false
		screenVideo.Visible = false
	end
	if hasVideo or hasSlides then
		screenTitle.Visible = true
		screenSub.Visible = true
	end
	if movieSound then movieSound:Stop() end
	setLights(true)
	setProjector(false)
	unlockAll()
	setGate(false)
	if marqueeLabel then marqueeLabel.Text = "🎬 سينما مدينة التبرعات" end
	setScreenIdle()
	if playPrompt then playPrompt.Enabled = true end
	playing = false
end

-- مُشغّل آمن: يضمن أن أعلام البدء/التشغيل (starting/playing) لا تبقى عالقة أبداً حتى لو فشل playMovie.
-- لو حصل خطأ في أي مرحلة، نصفّر العلَمين ونُعيد القاعة لحالتها الطبيعية فلا تتعطّل العروض القادمة.
local function launchMovie(presser)
	starting = true
	task.spawn(function()
		local ok, err = pcall(playMovie, presser)
		if not ok then
			warn("[CinemaSystem] playMovie error: " .. tostring(err))
			-- تنظيف شامل (finally): صفّر الأعلام وأرجع القاعة لوضع الخمول مهما كان مكان الفشل
			starting = false
			playing = false
			stopRequested = false
			pcall(unlockAll)
			pcall(function() setGate(false) end)
			pcall(function() setLights(true) end)
			pcall(function() setProjector(false) end)
			pcall(setScreenIdle)
			if marqueeLabel then marqueeLabel.Text = "🎬 سينما مدينة التبرعات" end
			if playPrompt then playPrompt.Enabled = true end
		end
	end)
end

------------------------------------------------------------------------
-- REMOTE: قائمة اختيار المقعد (تُعرض على العميل عبر LocalScript: CinemaSeatMenu)
------------------------------------------------------------------------
local cinemaRemotes = ReplicatedStorage:FindFirstChild("CinemaRemotes")
if not cinemaRemotes then
	cinemaRemotes = Instance.new("Folder")
	cinemaRemotes.Name = "CinemaRemotes"
	cinemaRemotes.Parent = ReplicatedStorage
end
local seatRemote = cinemaRemotes:FindFirstChild("SeatMenu")
if not seatRemote then
	seatRemote = Instance.new("RemoteEvent")
	seatRemote.Name = "SeatMenu"
	seatRemote.Parent = cinemaRemotes
end

local rowName = { front = "الأمامي", back = "الخلفي" }

------------------------------------------------------------------------
-- الدفع لحجز المقعد: كوينز أو تذكرة (اختيار اللاعب)
------------------------------------------------------------------------
local SEAT_PRICE = 30   -- سعر الدخول بالكوينز (نصّه لأعضاء VIP)
local function seatPriceFor(player)
	if _G.IsVIP and _G.IsVIP(player) then return math.floor(SEAT_PRICE / 2) end
	return SEAT_PRICE
end
-- يخصم وسيلة الدفع المختارة (يتحقق من الكفاية). يرجّع true إذا نجح.
local function paySeat(player, method)
	if method == "ticket" then
		return (_G.UseTicket and _G.UseTicket(player, 1)) == true
	end
	return (_G.SpendCoins and _G.SpendCoins(player, seatPriceFor(player))) == true
end
local function notifyPaid(player, method)
	if not _G.NotifyPlayer then return end
	if method == "ticket" then
		_G.NotifyPlayer(player, "🎟️ استخدمت تذكرة — استمتع بالعرض!")
	else
		_G.NotifyPlayer(player, "💰 دفعت " .. seatPriceFor(player) .. " كوينز — استمتع بالعرض!")
	end
end
local function notifyPayFail(player, method)
	if not _G.NotifyPlayer then return end
	if method == "ticket" then
		_G.NotifyPlayer(player, "❌ ما عندك تذاكر. اختر الدفع بالكوينز أو استلم مكافأتك اليومية.")
	else
		_G.NotifyPlayer(player, "❌ ما عندك كوينز كافية (تحتاج " .. seatPriceFor(player) .. " كوينز).")
	end
end

-- افتح قائمة اختيار المقعد لدى اللاعب مع عدد المقاعد الفاضية لكل صف
local function openSeatMenu(player)
	local front, back = classifySeats()
	local list = seatsIndexed()
	local grid = {}
	for i, s in ipairs(list) do
		grid[i] = { i = i, taken = (s.Occupant ~= nil) }
	end
	seatRemote:FireClient(player, {
		action  = "open",
		front   = freeCount(front),
		back    = freeCount(back),
		seats   = grid,
		playing = playing,
		remain  = playing and math.max(0, math.floor(movieEndsAt - os.clock())) or 0,
		coins   = (_G.GetCoins and _G.GetCoins(player)) or 0,
		tickets = (_G.GetTickets and _G.GetTickets(player)) or 0,
		price   = seatPriceFor(player),
		vip     = (_G.IsVIP and _G.IsVIP(player)) == true,
	})
end

if playPrompt then
	playPrompt.Triggered:Connect(function(player)
		if CONFIG.SeatSelection then
			-- تظهر القائمة سواء العرض شغّال (للجلوس كمتفرّج) أو لا (لبدء عرض جديد)
			openSeatMenu(player)
			return
		end
		-- السلوك القديم (بدون قائمة): تذكرة ← بدء مباشر
		-- نفحص playing وكذلك starting لسدّ نافذة سباق نادرة قد تُستهلك فيها تذكرتان لعرض واحد
		if playing or starting then
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "🎬 العرض جارٍ الآن، انتظر انتهاءه.") end
			return
		end
		if _G.UseTicket then
			if not _G.UseTicket(player, 1) then
				if _G.NotifyPlayer then _G.NotifyPlayer(player, "❌ لا تملك تذاكر كافية. خذ تذكرة من الزر على اليسار.") end
				return
			end
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "🎟️ تم استخدام تذكرة — استمتع بالفيلم!") end
		end
		launchMovie(player)  -- المُشغّل الآمن: قفل البدء + تنظيف عند الفشل
	end)
else
	warn("[CinemaSystem] Projector ProximityPrompt not found.")
end

-- استقبال اختيار اللاعب (front/back) من القائمة
seatRemote.OnServerEvent:Connect(function(player, payload)
	if type(payload) ~= "table" then return end

	-- اختيار مقعد محدّد من الشبكة (حجز فعلي: من يجلس يأخذ المقعد ويمنع غيره)
	if payload.action == "chooseSeat" then
		local idx = tonumber(payload.index)
		local list = seatsIndexed()
		local seat = idx and list[idx] or nil
		if not seat then return end
		if seat.Occupant ~= nil then
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "❌ هذا المقعد محجوز، اختر غيره.") end
			openSeatMenu(player)
			return
		end
		-- جالس بالفعل؟ لا نخصم مرتين
		local hum0 = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if hum0 and hum0.SeatPart then
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "🎬 أنت بالفعل في مقعدك.") end
			return
		end
		-- الدفع: كوينز أو تذكرة (حسب اختيار اللاعب)
		local method = (payload.pay == "ticket") and "ticket" or "coins"
		-- نُجلس اللاعب أولاً لتأمين المقعد ثم نخصم — حتى لا يخسر دفعته لو حُجز المقعد لحظة الاختيار
		if not sitInSeat(player, seat) then
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "❌ هذا المقعد محجوز، اختر غيره.") end
			openSeatMenu(player)
			return
		end
		if not paySeat(player, method) then
			local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
			if hum then hum.Sit = false end  -- لم يدفع: أوقفه فلا يجلس مجاناً
			notifyPayFail(player, method)
			openSeatMenu(player)
			return
		end
		notifyPaid(player, method)
		local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if (playing or starting) then
			if hum and CONFIG.LockViewers then lockHumanoid(hum, seat) end
			return
		end
		launchMovie(player)
		return
	end

	if payload.action ~= "choose" then return end -- "cancel" أو غيره يُتجاهل
	local row = (payload.row == "back") and "back" or "front"
	local method = (payload.pay == "ticket") and "ticket" or "coins"

	-- جالس بالفعل؟ أعد قفله فقط دون خصم
	local hum0 = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
	if hum0 and hum0.SeatPart then
		if (playing or starting) and CONFIG.LockViewers then lockHumanoid(hum0, hum0.SeatPart) end
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "🎬 أنت بالفعل في مقعدك.") end
		return
	end

	-- نُجلس اللاعب أولاً لتأمين مقعد في الصف المطلوب ثم نخصم — حتى لا يخسر دفعته لو امتلأت المقاعد لحظة الاختيار
	local seat = seatPlayerInRow(player, row)
	if not seat then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "❌ لا توجد مقاعد فاضية حالياً.") end
		return
	end

	if not paySeat(player, method) then
		local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if hum then hum.Sit = false end  -- لم يدفع: أوقفه فلا يجلس مجاناً
		notifyPayFail(player, method)
		openSeatMenu(player)  -- أعد فتح القائمة (اتساقاً مع مسار «chooseSeat»)
		return
	end
	notifyPaid(player, method)
	local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")

	-- العرض شغّال: اجلس كمتفرّج متأخّر واقفله، بدون إعادة تشغيل
	if playing or starting then
		if hum and CONFIG.LockViewers then lockHumanoid(hum, seat) end
		return
	end

	-- لا يوجد عرض: العرض يبدأ الآن
	-- ملاحظة: starting يُصفَّر داخل playMovie بعد ضبط playing=true (يمنع سباق التشغيل المزدوج)
	-- وlaunchMovie يضمن تصفيره أيضاً حتى لو فشل playMovie (طبقة حماية إضافية ضد التعليق)
	if _G.NotifyPlayer then
		_G.NotifyPlayer(player, "🎬 مقعد " .. rowName[row] .. " — يبدأ العرض الآن!")
	end
	launchMovie(player)
end)

------------------------------------------------------------------------
-- POPCORN — give a popcorn tool
------------------------------------------------------------------------
local popcornPrompt = popcorn and popcorn:FindFirstChildWhichIsA("ProximityPrompt", true)

-- صوت قضم/قرمشة (اختياري) — يُشغَّل على القطعة المعطاة إن وُجد رقم asset
local function playCrunch(parentPart, speed)
	if CONFIG.PopcornSoundId == 0 or not parentPart then return end
	local s = Instance.new("Sound")
	s.SoundId = "rbxassetid://" .. tostring(CONFIG.PopcornSoundId)
	s.Volume = 0.7
	s.PlaybackSpeed = speed or 1
	s.Parent = parentPart
	s:Play()
	s.Ended:Once(function() s:Destroy() end)
	task.delay(4, function() if s.Parent then s:Destroy() end end)
end

local function makePopcornTool()
	local tool = Instance.new("Tool")
	tool.Name = "فشار"
	tool.RequiresHandle = true
	tool.CanBeDropped = true
	tool.ToolTip = "اضغط زر الماوس لتأكل 🍿"

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(1.6, 2, 1.6)
	handle.Color = Color3.fromRGB(220, 60, 50)
	handle.Material = Enum.Material.SmoothPlastic
	handle.Parent = tool

	local kernels = Instance.new("Part")
	kernels.Name = "Kernels"
	kernels.Shape = Enum.PartType.Ball
	kernels.Size = Vector3.new(1.7, 1.2, 1.7)
	kernels.Color = Color3.fromRGB(255, 235, 170)
	kernels.Material = Enum.Material.SmoothPlastic
	kernels.CanCollide = false
	kernels.Massless = true
	kernels.Parent = tool

	local weld = Instance.new("WeldConstraint")
	weld.Part0 = handle
	weld.Part1 = kernels
	weld.Parent = handle
	kernels.CFrame = handle.CFrame * CFrame.new(0, 1.1, 0)

	-- رشّة "قضم" بصرية عند الأكل
	local att = Instance.new("Attachment")
	att.Parent = kernels
	local emit = Instance.new("ParticleEmitter")
	emit.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	emit.Rate = 0
	emit.Lifetime = NumberRange.new(0.3, 0.55)
	emit.Speed = NumberRange.new(2, 5)
	emit.SpreadAngle = Vector2.new(40, 40)
	emit.Color = ColorSequence.new(Color3.fromRGB(255, 236, 170))
	emit.Size = NumberSequence.new(0.45)
	emit.Parent = kernels

	local bites = Instance.new("IntValue")
	bites.Name = "Bites"
	bites.Value = CONFIG.PopcornBites
	bites.Parent = tool

	local fullY = kernels.Size.Y
	local busy = false

	-- الأكل بالنقر بزر الماوس (Tool.Activated)
	tool.Activated:Connect(function()
		if busy or bites.Value <= 0 then return end
		busy = true
		bites.Value -= 1

		local frac = math.clamp(bites.Value / CONFIG.PopcornBites, 0, 1)
		kernels.Size = Vector3.new(kernels.Size.X, math.max(0.12, fullY * (0.25 + 0.75 * frac)), kernels.Size.Z)
		emit:Emit(12)
		playCrunch(handle, 0.92 + math.random() * 0.16)

		-- تغذية بسيطة كإحساس بالأكل
		local char = tool.Parent
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum and hum.Health < hum.MaxHealth then
			hum.Health = math.min(hum.MaxHealth, hum.Health + 4)
		end

		task.wait(0.3)
		busy = false
		if bites.Value <= 0 then
			tool:Destroy() -- خلصت العلبة
		end
	end)

	return tool
end

-- مشروب غازي بسيط (كوب + غطاء + شفّاطة)
local function makeDrinkTool()
	local tool = Instance.new("Tool")
	tool.Name = "مشروب"
	tool.RequiresHandle = true
	tool.CanBeDropped = true
	tool.ToolTip = "اضغط زر الماوس لترتشف 🥤"

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(1.4, 2.2, 1.4)
	handle.Color = Color3.fromRGB(220, 55, 65)
	handle.Material = Enum.Material.SmoothPlastic
	handle.Parent = tool

	local lid = Instance.new("Part")
	lid.Name = "Lid"
	lid.Size = Vector3.new(1.55, 0.25, 1.55)
	lid.Color = Color3.fromRGB(245, 245, 250)
	lid.Material = Enum.Material.SmoothPlastic
	lid.CanCollide = false
	lid.Massless = true
	lid.Parent = tool
	local w1 = Instance.new("WeldConstraint"); w1.Part0 = handle; w1.Part1 = lid; w1.Parent = handle
	lid.CFrame = handle.CFrame * CFrame.new(0, 1.15, 0)

	local straw = Instance.new("Part")
	straw.Name = "Straw"
	straw.Size = Vector3.new(0.18, 1.6, 0.18)
	straw.Color = Color3.fromRGB(255, 255, 255)
	straw.Material = Enum.Material.SmoothPlastic
	straw.CanCollide = false
	straw.Massless = true
	straw.Parent = tool
	local w2 = Instance.new("WeldConstraint"); w2.Part0 = handle; w2.Part1 = straw; w2.Parent = handle
	straw.CFrame = handle.CFrame * CFrame.new(0.3, 1.95, 0)

	-- سائل المشروب داخل الكوب (ينقص مع كل رشفة)
	local liquid = Instance.new("Part")
	liquid.Name = "Liquid"
	liquid.Size = Vector3.new(1.25, 1.9, 1.25)
	liquid.Color = Color3.fromRGB(120, 30, 40)
	liquid.Material = Enum.Material.Glass
	liquid.Transparency = 0.15
	liquid.CanCollide = false
	liquid.Massless = true
	liquid.Parent = tool
	local w3 = Instance.new("WeldConstraint"); w3.Part0 = handle; w3.Part1 = liquid; w3.Parent = handle

	-- رشّة فقاعات عند الرشف
	local att = Instance.new("Attachment")
	att.Parent = handle
	local emit = Instance.new("ParticleEmitter")
	emit.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	emit.Rate = 0
	emit.Lifetime = NumberRange.new(0.3, 0.55)
	emit.Speed = NumberRange.new(2, 5)
	emit.SpreadAngle = Vector2.new(40, 40)
	emit.Color = ColorSequence.new(Color3.fromRGB(255, 255, 255))
	emit.Size = NumberSequence.new(0.4)
	emit.Parent = handle

	local sips = Instance.new("IntValue")
	sips.Name = "Sips"
	sips.Value = CONFIG.PopcornBites
	sips.Parent = tool

	local fullY = liquid.Size.Y
	local busy = false

	-- الرشف بالنقر بزر الماوس (Tool.Activated)
	tool.Activated:Connect(function()
		if busy or sips.Value <= 0 then return end
		busy = true
		sips.Value -= 1

		local frac = math.clamp(sips.Value / CONFIG.PopcornBites, 0, 1)
		local newY = math.max(0.1, fullY * frac)
		liquid.Size = Vector3.new(liquid.Size.X, newY, liquid.Size.Z)
		liquid.CFrame = handle.CFrame * CFrame.new(0, -(fullY - newY) / 2, 0)
		emit:Emit(10)
		playCrunch(handle, 1.4)

		local char = tool.Parent
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum and hum.Health < hum.MaxHealth then
			hum.Health = math.min(hum.MaxHealth, hum.Health + 3)
		end

		task.wait(0.3)
		busy = false
		if sips.Value <= 0 then
			tool:Destroy() -- خلص المشروب
		end
	end)
	return tool
end

-- يعطي اللاعب أداة من المصنع المعطى إن لم يكن يملكها مسبقاً
local function giveTool(player, factory, toolName: string)
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack then return false end
	local char = player.Character
	local already = backpack:FindFirstChild(toolName) or (char and char:FindFirstChild(toolName))
	if already then return false end
	factory().Parent = backpack
	return true
end

-- API: منح طلب الأكل (فشار + مشروب) — يستخدمه لاونج VIP وغيره
_G.GiveCinemaFood = function(player): boolean
	local g1 = giveTool(player, makePopcornTool, "فشار")
	local g2 = giveTool(player, makeDrinkTool, "مشروب")
	return g1 or g2
end

if popcornPrompt then
	popcornPrompt.Triggered:Connect(function(player)
		giveTool(player, makePopcornTool, "فشار")
		playCrunch(popcorn, 1)
	end)
else
	warn("[CinemaSystem] Popcorn ProximityPrompt not found.")
end

------------------------------------------------------------------------
-- NPCs — خدّامون لتقديم الأكل + مرشد عند المدخل (يُبنون برمجياً)
------------------------------------------------------------------------
local floorPart = get("Floor")
local groundY = floorPart and (floorPart.Position.Y + floorPart.Size.Y / 2) or 0

local function buildNPC(opts)
	local model = Instance.new("Model")
	model.Name = opts.name

	local function part(n, size, color, mat)
		local p = Instance.new("Part")
		p.Name = n
		p.Size = size
		p.Color = color
		p.Material = mat or Enum.Material.SmoothPlastic
		p.Anchored = true
		p.CanCollide = false
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = model
		return p
	end

	local skin    = Color3.fromRGB(255, 209, 163)
	local uniform = opts.uniform or Color3.fromRGB(150, 30, 40)
	local pants   = Color3.fromRGB(35, 32, 48)
	local cf      = opts.footCFrame
	local s       = opts.scale or 1   -- معامل التكبير (هيكل أطول/أكبر للمرشد)

	local hrp = part("HumanoidRootPart", Vector3.new(2, 2, 1) * s, uniform); hrp.Transparency = 1
	hrp.CFrame = cf * CFrame.new(0, 3 * s, 0)
	part("Torso", Vector3.new(2, 2, 1) * s, uniform).CFrame = cf * CFrame.new(0, 3 * s, 0)
	part("Collar", Vector3.new(2.05, 0.4, 1.05) * s, Color3.fromRGB(245, 245, 250)).CFrame = cf * CFrame.new(0, 3.85 * s, 0)
	part("LeftArm",  Vector3.new(1, 2, 1) * s, uniform).CFrame = cf * CFrame.new(-1.5 * s, 3 * s, 0)
	local rArm = part("RightArm", Vector3.new(1, 2, 1) * s, uniform); rArm.CFrame = cf * CFrame.new(1.5 * s, 3 * s, 0)
	part("LeftLeg",  Vector3.new(1, 2, 1) * s, pants).CFrame = cf * CFrame.new(-0.5 * s, 1 * s, 0)
	part("RightLeg", Vector3.new(1, 2, 1) * s, pants).CFrame = cf * CFrame.new(0.5 * s, 1 * s, 0)
	part("Hair", Vector3.new(1.35, 0.5, 1.35) * s, Color3.fromRGB(40, 30, 25)).CFrame = cf * CFrame.new(0, 5.3 * s, 0)

	local head = part("Head", Vector3.new(1.25, 1.25, 1.25) * s, skin)
	head.CFrame = cf * CFrame.new(0, 4.6 * s, 0)
	local face = Instance.new("Decal")
	face.Name = "face"; face.Texture = "rbxasset://textures/face.png"; face.Face = Enum.NormalId.Front; face.Parent = head
	model.PrimaryPart = hrp

	-- لوحة الاسم فوق الرأس
	local bb = Instance.new("BillboardGui")
	bb.Name = "NameTag"; bb.Adornee = head; bb.Size = UDim2.fromOffset(230, 52)
	bb.StudsOffset = Vector3.new(0, 2.3 * s, 0); bb.AlwaysOnTop = true; bb.Parent = head
	local tagLbl = Instance.new("TextLabel")
	tagLbl.BackgroundTransparency = 1; tagLbl.Size = UDim2.fromScale(1, 1)
	tagLbl.Font = Enum.Font.GothamBlack; tagLbl.TextScaled = true; tagLbl.Text = opts.tag
	tagLbl.TextColor3 = opts.tagColor or Color3.fromRGB(255, 205, 90)
	tagLbl.TextStrokeTransparency = 0.4; tagLbl.Parent = bb

	-- صينية طعام (للخدّام فقط)
	if opts.tray then
		local tray = part("Tray", Vector3.new(2.6, 0.2, 1.6), Color3.fromRGB(120, 120, 130), Enum.Material.Metal)
		tray.CFrame = cf * CFrame.new(0, 3.1, -1.2)
		part("TrayBox", Vector3.new(0.9, 1.0, 0.9), Color3.fromRGB(220, 60, 50)).CFrame = tray.CFrame * CFrame.new(-0.7, 0.6, 0)
		part("TrayPopcorn", Vector3.new(0.95, 0.6, 0.95), Color3.fromRGB(255, 235, 170)).CFrame = tray.CFrame * CFrame.new(-0.7, 1.2, 0)
		part("TrayCup", Vector3.new(0.7, 1.1, 0.7), Color3.fromRGB(220, 55, 65)).CFrame = tray.CFrame * CFrame.new(0.7, 0.65, 0)
	end

	-- زر التفاعل
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = opts.promptText or "تحدّث"
	prompt.ObjectText = opts.promptObj or opts.tag
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.HoldDuration = 0.3
	prompt.MaxActivationDistance = 12
	prompt.RequiresLineOfSight = false
	prompt.Parent = hrp
	if opts.onTrigger then prompt.Triggered:Connect(opts.onTrigger) end

	model.Parent = cinema

	-- حركة خفيفة: تمايل الرأس + تلويح اليد (للمرشد)
	task.spawn(function()
		local phase = math.random() * 6.28
		while model.Parent do
			local t = os.clock() + phase
			head.CFrame = cf * CFrame.new(0, 4.6 * s, 0) * CFrame.Angles(0, math.sin(t * 1.1) * 0.13, 0)
			if opts.wave then
				rArm.CFrame = cf * CFrame.new(1.5 * s, 3 * s, 0) * CFrame.Angles(0, 0, -math.abs(math.sin(t * 2.2)) * 1.3)
			end
			task.wait(0.06)
		end
	end)

	return model
end

-- سلوك الخدّام: يقدّم فشار + مشروب
local function waiterServe(player)
	local g1 = giveTool(player, makePopcornTool, "فشار")
	local g2 = giveTool(player, makeDrinkTool, "مشروب")
	playCrunch(popcorn, 1)
	if _G.NotifyPlayer then
		if g1 or g2 then
			_G.NotifyPlayer(player, "🍿 تفضّل طلبك! فشار ومشروب — استمتع بالمشاهدة.")
		else
			_G.NotifyPlayer(player, "🙂 معك فشار ومشروب بالفعل، استمتع!")
		end
	end
end

-- سلوك المرشد: يفتح نافذة الحوار لدى اللاعب
local function guideTalk(player)
	seatRemote:FireClient(player, { action = "dialog" })
end

pcall(function()
	local gatePos = gate and gate.Position or cinema:GetPivot().Position
	local popPos  = popcorn and popcorn.Position or gatePos

	-- مرشد خارج المدخل (أمام البوابة، يستقبل القادمين قبل الدخول)
	-- دُفِع للأمام (Z+) وجانباً (X+) ليبتعد عن عمود المدخل الأسود خلفه،
	-- فلا يتداخل وسمه العلوي «مرشد السينما» مع العمود من زاوية الكاميرا.
	local guideFoot = CFrame.lookAt(
		Vector3.new(gatePos.X + 13, groundY, gatePos.Z + 17),
		Vector3.new(gatePos.X + 13, groundY, gatePos.Z + 40)
	)
	buildNPC({
		name = "CinemaGuide", tag = "👋 مرشد السينما", tagColor = Color3.fromRGB(120, 220, 255),
		uniform = Color3.fromRGB(70, 60, 150), footCFrame = guideFoot, scale = 1.5,
		promptText = "تحدّث", promptObj = "مرشد السينما", wave = true, onTrigger = guideTalk,
	})

	-- خادم واحد عند بسطة الفشار يقدّم الطلبات
	local waiterFoot = CFrame.lookAt(
		Vector3.new(popPos.X + 4, groundY, popPos.Z - 2),
		Vector3.new(popPos.X + 4, groundY, popPos.Z - 25)
	)
	buildNPC({
		name = "CinemaWaiter", tag = "🍿 خادم السينما", uniform = Color3.fromRGB(150, 30, 40),
		footCFrame = waiterFoot, promptText = "اطلب طلبك", promptObj = "خادم السينما",
		tray = true, onTrigger = waiterServe,
	})
end)

------------------------------------------------------------------------
-- واجهات الإدارة (تُستدعى من لوحة التحكم في CinemaServices)
------------------------------------------------------------------------
_G.AdminIsPlaying = function(): boolean
	return playing
end
_G.AdminPlayMovie = function(): boolean
	if playing or starting then return false end
	launchMovie(nil)  -- نمرّ عبر المُشغّل الآمن (قفل البدء + تنظيف عند الفشل) بدل استدعاء playMovie مباشرة
	return true
end
_G.AdminStopMovie = function(): boolean
	if not playing then return false end
	stopRequested = true
	return true
end
_G.AdminSetLights = function(on: boolean)
	setLights(on == true)
end
-- متدرّج: مستوى الإضاءة ٠..١ (٠ = أجواء عرض خافتة، ١ = إضاءة كاملة)
_G.AdminSetLightLevel = function(level: number)
	local lv = math.clamp(tonumber(level) or 1, 0, 1)
	local floor = CONFIG.DimBrightness
	for _, e in ipairs(lightStore) do
		if e.light then
			e.light.Enabled = true
			e.light.Brightness = e.bright * (floor + (1 - floor) * lv)
		end
		if e.part then
			e.part.Material = Enum.Material.Neon
			e.part.Color = e.color:Lerp(DIM_TINT, 0.78 * (1 - lv))
		end
	end
end
-- لون الأجواء العام عبر ColorCorrection (tint خفيف)
local _ambientCC
_G.AdminSetAmbient = function(r: number, g: number, b: number)
	local Lighting = game:GetService("Lighting")
	if not _ambientCC then
		_ambientCC = Lighting:FindFirstChild("AdminAmbientTint")
		if not _ambientCC then
			_ambientCC = Instance.new("ColorCorrectionEffect")
			_ambientCC.Name = "AdminAmbientTint"
			_ambientCC.Parent = Lighting
		end
	end
	if r == nil then
		_ambientCC.TintColor = Color3.new(1, 1, 1)
		_ambientCC.Saturation = 0
	else
		_ambientCC.TintColor = Color3.fromRGB(r, g, b)
		_ambientCC.Saturation = 0.06
	end
end
-- تخطّي العرض الحالي (مثل إيقافه فوراً)
_G.AdminSkipMovie = function(): boolean
	if not playing then return false end
	stopRequested = true
	return true
end
-- إعادة العرض من البداية
_G.AdminRestartMovie = function(): boolean
	task.spawn(function()
		if playing then
			stopRequested = true
			local t0 = os.clock()
			while playing and (os.clock() - t0) < 20 do task.wait(0.2) end
		end
		if not playing and not starting then launchMovie(nil) end  -- المُشغّل الآمن: قفل البدء + تنظيف عند الفشل
	end)
	return true
end
-- موسيقى اللوبي (تُتحكّم من لوحة الإدارة)
local lobbyMusic
local function ensureLobbyMusic()
	if lobbyMusic then return lobbyMusic end
	local SoundService = game:GetService("SoundService")
	lobbyMusic = SoundService:FindFirstChild("LobbyMusic")
	if not lobbyMusic then
		lobbyMusic = Instance.new("Sound")
		lobbyMusic.Name = "LobbyMusic"
		lobbyMusic.Looped = true
		lobbyMusic.Volume = 0.4
		if (CONFIG.LobbyMusicId or 0) ~= 0 then
			lobbyMusic.SoundId = "rbxassetid://" .. tostring(CONFIG.LobbyMusicId)
		end
		lobbyMusic.Parent = SoundService
	end
	return lobbyMusic
end
_G.AdminSetMusic = function(on: boolean, volume: number?)
	local m = ensureLobbyMusic()
	if volume ~= nil then m.Volume = math.clamp(tonumber(volume) or 0.4, 0, 1) end
	if on and m.SoundId ~= "" then
		if not m.IsPlaying then m:Play() end
	else
		m:Stop()
	end
end
_G.AdminGetMusic = function()
	local m = ensureLobbyMusic()
	return { on = m.IsPlaying, volume = m.Volume, hasId = m.SoundId ~= "" }
end
local MARQUEE_DEFAULT = "🎬 سينما مدينة التبرعات"
local marqueeToken = 0
_G.AdminSetMarquee = function(text: string)
	if not (marqueeLabel and type(text) == "string" and #text > 0) then return end
	-- لا تطغَ على لافتة «العرض جارٍ الآن»
	if marqueeLabel.Text == "🔴 العرض جارٍ الآن" then return end
	marqueeToken += 1
	local myToken = marqueeToken
	marqueeLabel.Text = string.sub(text, 1, 60)
	-- يرجع لاسم السينما تلقائياً بعد ١٢ ثانية (ما يبقى الإعلان عالقاً على المبنى)
	task.delay(12, function()
		if marqueeToken == myToken and marqueeLabel and marqueeLabel.Text ~= "🔴 العرض جارٍ الآن" then
			marqueeLabel.Text = MARQUEE_DEFAULT
		end
	end)
end

-- نشر حالة السينما كسمات على نموذج Cinema (يستخدمها شباك التذاكر ولوحة العروض)
task.spawn(function()
	while true do
		local front, back = classifySeats()
		cinema:SetAttribute("Playing", playing)
		cinema:SetAttribute("Remain", playing and math.max(0, math.floor(movieEndsAt - os.clock())) or 0)
		cinema:SetAttribute("FreeFront", freeCount(front))
		cinema:SetAttribute("FreeBack", freeCount(back))
		task.wait(1)
	end
end)

print("[CinemaSystem] Cinema ready.")
