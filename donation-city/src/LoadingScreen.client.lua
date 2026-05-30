--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  مدينة التبرعات — شاشة تحميل احترافية (Premium Loading Screen)         ║
	║  Theme: Dark Neon (deep black + purple/cyan glow) · واجهة عربية RTL    ║
	║                                                                        ║
	║  المكان:  ReplicatedFirst                                              ║
	║  النوع:   LocalScript                                                  ║
	║                                                                        ║
	║  السكربت يبني كامل الواجهة برمجياً. فقط ضعه داخل ReplicatedFirst.        ║
	║  يدعم: PC / Mobile / Tablet                                            ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

------------------------------------------------------------------------
-- SERVICES
------------------------------------------------------------------------
local ReplicatedFirst   = game:GetService("ReplicatedFirst")
local Players           = game:GetService("Players")
local TweenService      = game:GetService("TweenService")
local RunService        = game:GetService("RunService")
local Lighting          = game:GetService("Lighting")
local ContentProvider   = game:GetService("ContentProvider")
local SoundService      = game:GetService("SoundService")

local LocalPlayer = Players.LocalPlayer
ReplicatedFirst:RemoveDefaultLoadingScreen()

------------------------------------------------------------------------
-- CONFIG  (عدّل بحرية)
------------------------------------------------------------------------
local CONFIG = {
	GameName = "مدينة التبرعات",
	Tagline  = "تبرّع • اكسب • استمتع",

	Theme = "DarkNeon", -- "DarkNeon" | "WhiteCyan"

	-- 🖼️ خلفية مخصّصة لشاشة التحميل (صورة مرفوعة على روبلوكس).
	-- ضع رقم الـ Asset ID هنا (0 = بدون خلفية، تظهر الخلفية النيون الافتراضية).
	BackgroundImageId      = 93628047304202, -- خلفية اللودينغ (كارتونية، مرفوعة كـ Decal)
	BackgroundImageDim     = 0.5, -- درجة تعتيم الصورة (0 = واضحة، 1 = سوداء) لإبقاء النص مقروءاً

	MinDisplayTime = 4.5,
	MaxDisplayTime = 15.0,
	FadeOutTime    = 1.5,
	IntroTime      = 0.9,

	BlurSize = 26,

	AmbientMusicId  = 0, -- مثال: 1837849285  (0 = مغلق)
	CompletionSound = 0, -- مثال: 9125402735  (0 = مغلق)
	MusicVolume     = 0.35,

	PreloadInstances = {}, -- فاضي = يحمّل كل اللعبة تلقائياً

	StatusMessages = {
		"جارٍ تحميل العناصر...",
		"تجهيز بوثات التبرع...",
		"الاتصال بالخوادم...",
		"تحسين التجربة...",
		"تحميل الواجهة...",
		"تهيئة المؤثرات...",
		"اللمسات الأخيرة...",
	},

	Tips = {
		"نصيحة: اقترب من البوث واضغط E للتبرع.",
		"نصيحة: زُر قاعة السينما واستمتع بفيلم مع الأصدقاء!",
		"نصيحة: المتبرعون الأوائل يظهرون على لوحة الصدارة.",
		"نصيحة: اشكر من تبرّع لك — اللطف لا يُنسى.",
		"نصيحة: ادخل يومياً لتحصل على مكافآت إضافية.",
		"نصيحة: ادعُ أصدقاءك لترتقي بسرعة أكبر.",
	},

	------------------------------------------------------------------
	-- القائمة الرئيسية (Main Menu) — تظهر بعد اللودينغ وقبل دخول اللعبة
	------------------------------------------------------------------
	MenuEnabled   = true,                 -- false = ادخل اللعبة مباشرة بدون قائمة
	MenuVersion   = "الإصدار ٢.٩.١٦",          -- يظهر أسفل القائمة
	FreezeOnMenu  = true,                 -- تجميد حركة اللاعب أثناء القائمة

	-- أصوات الزجاج (أرقام Roblox Sound — استبدلها بأرقامك المفضّلة، 0 = صامت)
	MenuSounds = {
		Hover = 9118823105,   -- رنّة زجاج خفيفة عند مرور الماوس
		Click = 9125402735,   -- كسر زجاج عند الضغط على زر
		Start = 9114066858,   -- تحطّم زجاج عند "بدء اللعبة"
	},
	MenuSoundVolume = 0.55,

	RulesTitle = "قوانين و هدف اللعبة",
	RulesLines = {
		"🎯 الهدف: تبرّع للاعبين الآخرين، اكسب السمعة، واستمتع بتجربة اجتماعية ممتعة.",
		"",
		"• احجز بوثاً فارغاً (اضغط E) واعرض Gamepasses الخاصة فيك للبيع.",
		"• ادعم بوثات اللاعبين بالشراء — يرفعك في لوحة «الأكثر دعماً».",
		"• زُر قاعة السينما واحجز مقعدك لمشاهدة العرض مع الأصدقاء.",
		"• اجمع التذاكر واستبدلها، واحصل على شارات تلقائية بتقدّمك.",
		"",
		"📜 القوانين:",
		"• احترم جميع اللاعبين — ممنوع الإساءة أو الإزعاج.",
		"• ممنوع الغش أو استغلال الثغرات.",
		"• اللعب النظيف يصنع مجتمعاً أجمل للجميع.",
	},

	UpdatesTitle = "تحديثات اللعبة",
	UpdatesLines = {
		"🎉 تحديث ٢.٧.٩ — دردشة: وسم 👑 للمالك و⭐ لـ VIP + كتم من الإدارة",
		"",
		"👑 لوحة الإدارة الجديدة (٤ تبويبات):",
		"• 📊 إحصائيات حية: لاعبون · بوثات محجوزة · إجمالي الدعم · أكثر بوث.",
		"• 🎬 العرض: تشغيل/تخطّي/إعادة · سلايدر إضاءة + لون أجواء · موسيقى وصوت.",
		"• 👥 اللاعبون: بحث · تحذير · طرد (بتأكيد وسبب) · VIP · منع حجز · انتقال.",
		"• ⚙️ الإعدادات: قوالب إعلانات · إدارة وتحرير البوثات · وضع الصيانة.",
		"• 📜 سجل أوامر الإدارة (شفافية) + إشعارات فورية بكل أمر.",
		"• 🛠️ وضع صيانة برسالة مخصّصة — مع بقاء دخول الإدارة متاحاً دائماً.",
		"",
		"🎉 تحديث ٢.٦ — جلوس البوث والتفاعل",
		"",
		"🪑 جلوس داخل البوث (جديد):",
		"• احجز بوثك واجلس على الكرسي لاستقبال الزوار.",
		"• الكرسي لصاحب البوث فقط — يظهر «🟢 صاحب البوث موجود».",
		"• بريق وإضاءة على البوث المحجوز + عدّاد الدعم على اللوحة.",
		"• زر «🔔 نادِ صاحب البوث» للزائر + شارة «🏆 الأكثر مبيعاً».",
		"",
		"🏪 بوثات يملكها اللاعبون:",
		"• احجز بوثاً فارغاً واضغط E — يظهر اسمك وصورتك.",
		"• اعرض Gamepasses الخاصة فيك (رابط أو رقم) للبيع.",
		"• إدارة كاملة: إضافة/حذف منتجات · لون · نص ترحيبي.",
		"• الزوار يشترون منك مع 🎉 احتفال ورسالة شكر.",
		"• لوحتا «الأكثر دعماً» و«أكثر البوثات» مباشرة.",
		"• يُصفّر البوث تلقائياً عند خروجك (حماية كاملة).",
		"",
		"🖥️ تحسين الواجهة:",
		"• أزرار الشاشة (المتجر/الإدارة/المزيد) انرتّبت بأرصفة بلا تداخل.",
		"• صورة مخصّصة كخلفية لشاشة التحميل.",
		"",
		"💡 الإضاءة والأجواء:",
		"• قاعة مضيئة بالكامل تخفت وقت العرض + نيون جدران.",
		"• مؤثرات Bloom وتصحيح ألوان بإحساس Cyber-Neon.",
		"",
		"💰 الاقتصاد واللوبي:",
		"• عملة «كوينز» مع حفظ + دخل تلقائي + HUD.",
		"• شبّاك تذاكر + قائمة أفلام + لوحة عروض حيّة.",
		"",
		"🎬 تجربة العرض:",
		"• عدّاد تنازلي + انتقال سينمائي + شريط ليتربوكس.",
		"• اهتزاز كاميرا خفيف + دعم فيديو متزامن.",
		"",
		"⭐ VIP والمقاعد:",
		"• عضوية VIP (Robux أو كوينز): لاونج وتاج ودخل مضاعف.",
		"• حجز مقعد محدّد + صفّ انتظار بأولوية لـ VIP.",
		"",
		"🛒 المتجر و٤ باقات دائمة جديدة:",
		"• متجر يسار الشاشة يجمع كل المميزات بأزرار شراء.",
		"• 🍿 بوفيه مفتوح · 🎬 مالك العرض · ✨ أثر نيون · 📢 مايك الإعلان.",
		"• حزم كوينز + تذكرة فورية (Developer Products).",
		"",
		"👑 الإدارة والواجهة والإضافات:",
		"• لوحة إدارة محمية (تشغيل/إيقاف/إضاءة/إعلان/طرد).",
		"• واجهة خارجية: أبواب أوتوماتيك · بوسترات · شاشة LED · موقف · مارّة.",
		"• إنجازات · تقييم أفلام · أركيد · ركن تصوير · فعاليات دورية.",
		"",
		"🌊 ديكور جديد:",
		"• نافورة واقعية بماء متساقط ورذاذ وإضاءة.",
		"• حوض سمك زجاجي بأسماك تسبح + ركن سلفي للتصوير.",
		"",
		"🛠️ إصلاحات هذا التحديث:",
		"• شبّاك التذاكر صار بمكان مرتّب بلا تداخل مع المقعد، ولافتته تُقرأ من جهة اللاعبين.",
		"• الدخول للوحة الإدارة بالرتبة فقط (مشرف فأعلى) — بلا كود.",
		"• اللوحة المضيئة ترجع لاسم السينما تلقائياً بعد الإعلان.",
		"",
		"🔜 قادم قريباً:",
		"• مظاهر وإكسسوارات جديدة + لوحة صدارة موسمية.",
	},
}

------------------------------------------------------------------------
-- THEME
------------------------------------------------------------------------
local THEMES = {
	DarkNeon = {
		BgTop = Color3.fromRGB(12, 9, 26), BgBottom = Color3.fromRGB(3, 2, 8),
		Card = Color3.fromRGB(18, 14, 34), CardStroke = Color3.fromRGB(120, 80, 220),
		Accent = Color3.fromRGB(168, 92, 255), AccentAlt = Color3.fromRGB(70, 226, 255),
		Text = Color3.fromRGB(244, 242, 255), SubText = Color3.fromRGB(176, 170, 208),
		BarTrack = Color3.fromRGB(34, 28, 56), Particle = Color3.fromRGB(168, 92, 255),
	},
	WhiteCyan = {
		BgTop = Color3.fromRGB(247, 250, 255), BgBottom = Color3.fromRGB(214, 228, 246),
		Card = Color3.fromRGB(255, 255, 255), CardStroke = Color3.fromRGB(0, 160, 230),
		Accent = Color3.fromRGB(0, 174, 239), AccentAlt = Color3.fromRGB(0, 122, 255),
		Text = Color3.fromRGB(18, 26, 44), SubText = Color3.fromRGB(96, 110, 134),
		BarTrack = Color3.fromRGB(202, 216, 234), Particle = Color3.fromRGB(0, 174, 239),
	},
}
local PAL = THEMES[CONFIG.Theme] or THEMES.DarkNeon

------------------------------------------------------------------------
-- HELPERS
------------------------------------------------------------------------
local function new(class, props, children)
	local inst = Instance.new(class)
	for k, v in pairs(props or {}) do inst[k] = v end
	for _, c in ipairs(children or {}) do c.Parent = inst end
	return inst
end
local function tween(inst, info, goal)
	local t = TweenService:Create(inst, info, goal)
	t:Play()
	return t
end

-- 🖼️ خلفية مخصّصة قابلة لإعادة الاستخدام (شاشة اللودينغ + القائمة الرئيسية).
-- رقم الـ Decal لا يُرسَم مباشرة، فالسيرفر يحوّله إلى رقم الصورة الحقيقي
-- ويخزّنه في ReplicatedStorage.LoadingBgImage — نقرأه هنا ونحدّث الصورة فور وصوله.
local function addCustomBackground(parent, palette)
	if not (CONFIG.BackgroundImageId and CONFIG.BackgroundImageId > 0) then return end
	local RS = game:GetService("ReplicatedStorage")
	local resolved = RS:FindFirstChild("LoadingBgImage")
	local function pickImage()
		if resolved and typeof(resolved.Value) == "string" and resolved.Value ~= "" then
			return resolved.Value
		end
		return "rbxassetid://" .. tostring(CONFIG.BackgroundImageId) -- احتياطي ريثما يُحلّ الرقم
	end
	local bgImg = new("ImageLabel", {
		Name = "CustomBackground", BackgroundTransparency = 1,
		Image = pickImage(),
		ScaleType = Enum.ScaleType.Crop, Size = UDim2.fromScale(1, 1), Parent = parent,
	})
	local dim = new("Frame", {
		Name = "BgDim", BackgroundColor3 = palette.BgBottom,
		BackgroundTransparency = 1 - math.clamp(CONFIG.BackgroundImageDim or 0.5, 0, 1),
		BorderSizePixel = 0, Size = UDim2.fromScale(1, 1), Parent = bgImg,
	})
	new("UIGradient", {
		Rotation = 90,
		Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.25),
			NumberSequenceKeypoint.new(0.5, 0.55),
			NumberSequenceKeypoint.new(1, 0.0),
		}),
		Parent = dim,
	})
	-- لو ما كان StringValue موجوداً بعد، انتظره ثم اربط التحديث
	if not resolved then
		task.spawn(function()
			resolved = RS:WaitForChild("LoadingBgImage", 10)
			if resolved then
				bgImg.Image = pickImage()
				resolved:GetPropertyChangedSignal("Value"):Connect(function()
					bgImg.Image = pickImage()
				end)
			end
		end)
	else
		resolved:GetPropertyChangedSignal("Value"):Connect(function()
			bgImg.Image = pickImage()
		end)
	end
	return bgImg
end

local viewport = workspace.CurrentCamera and workspace.CurrentCamera.ViewportSize or Vector2.new(1280, 720)
local isSmall = math.min(viewport.X, viewport.Y) <= 500
local UI_SCALE = isSmall and 0.8 or 1

------------------------------------------------------------------------
-- ROOT
------------------------------------------------------------------------
local screenGui = new("ScreenGui", {
	Name = "DonationLoadingScreen", IgnoreGuiInset = true, ResetOnSpawn = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling, DisplayOrder = 1000,
	Parent = LocalPlayer:WaitForChild("PlayerGui"),
})
new("UIScale", { Scale = UI_SCALE, Parent = screenGui })

local root = new("Frame", {
	Name = "Root", Size = UDim2.fromScale(1, 1), BackgroundColor3 = PAL.BgBottom,
	BorderSizePixel = 0, Parent = screenGui,
})
new("UIGradient", { Rotation = 90, Color = ColorSequence.new(PAL.BgTop, PAL.BgBottom), Parent = root })

-- 🖼️ خلفية الصورة المخصّصة (تظهر فقط إذا حُدّد BackgroundImageId)
addCustomBackground(root, PAL)

-- Animated radial accent glow
local accentGlow = new("ImageLabel", {
	Name = "AccentGlow", BackgroundTransparency = 1, Image = "rbxassetid://5028857084",
	ImageColor3 = PAL.Accent, ImageTransparency = 0.5, Size = UDim2.fromScale(1.5, 1.5),
	Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), Parent = root,
})
local accentGlow2 = new("ImageLabel", {
	Name = "AccentGlow2", BackgroundTransparency = 1, Image = "rbxassetid://5028857084",
	ImageColor3 = PAL.AccentAlt, ImageTransparency = 0.75, Size = UDim2.fromScale(1.1, 1.1),
	Position = UDim2.fromScale(0.5, 0.55), AnchorPoint = Vector2.new(0.5, 0.5), Parent = root,
})

------------------------------------------------------------------------
-- PARTICLES
------------------------------------------------------------------------
local particleHolder = new("Frame", { Name = "Particles", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = root })
local function spawnParticle()
	local sz = math.random(4, 12)
	local dot = new("Frame", {
		BackgroundColor3 = PAL.Particle, BackgroundTransparency = math.random(40, 80) / 100,
		Size = UDim2.fromOffset(sz, sz), Position = UDim2.fromScale(math.random(), 1.05),
		AnchorPoint = Vector2.new(0.5, 0.5), Parent = particleHolder,
	})
	new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = dot })
	local dur = math.random(40, 90) / 10
	local drift = (math.random() - 0.5) * 0.18
	tween(dot, TweenInfo.new(dur, Enum.EasingStyle.Linear), {
		Position = UDim2.fromScale(dot.Position.X.Scale + drift, -0.1), BackgroundTransparency = 1,
	}).Completed:Connect(function() dot:Destroy() end)
end

------------------------------------------------------------------------
-- FROSTED CARD (premium)
------------------------------------------------------------------------
local card = new("Frame", {
	Name = "Card", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.47),
	Size = UDim2.fromOffset(620, 380), BackgroundColor3 = PAL.Card, BackgroundTransparency = 0.12,
	Parent = root,
})
new("UICorner", { CornerRadius = UDim.new(0, 26), Parent = card })
local cardStroke = new("UIStroke", { Color = PAL.CardStroke, Thickness = 1.5, Transparency = 0.35, Parent = card })
new("UIGradient", {
	Rotation = 90,
	Color = ColorSequence.new(Color3.fromRGB(255,255,255), PAL.Card),
	Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.9), NumberSequenceKeypoint.new(1, 1) }),
	Parent = card,
})
-- Top accent line
local topLine = new("Frame", {
	BackgroundColor3 = PAL.Accent, Size = UDim2.new(1, -60, 0, 3), Position = UDim2.new(0.5, 0, 0, 18),
	AnchorPoint = Vector2.new(0.5, 0), BorderSizePixel = 0, Parent = card,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = topLine })
new("UIGradient", { Color = ColorSequence.new(PAL.AccentAlt, PAL.Accent), Parent = topLine })

------------------------------------------------------------------------
-- LOGO + TAGLINE  (Arabic, RTL-friendly center)
------------------------------------------------------------------------
local logo = new("TextLabel", {
	Name = "Logo", BackgroundTransparency = 1, Text = CONFIG.GameName, RichText = true,
	Font = Enum.Font.GothamBlack, TextSize = 54, TextColor3 = PAL.Text, TextTransparency = 1,
	Size = UDim2.new(1, -40, 0, 72), Position = UDim2.fromScale(0.5, 0.12),
	AnchorPoint = Vector2.new(0.5, 0), Parent = card,
})
new("UIGradient", { Color = ColorSequence.new(PAL.AccentAlt, PAL.Accent), Rotation = 12, Parent = logo })
local logoStroke = new("UIStroke", { Color = PAL.Accent, Thickness = 2, Transparency = 0.4, Parent = logo })

local tagline = new("TextLabel", {
	Name = "Tagline", BackgroundTransparency = 1, Text = CONFIG.Tagline,
	Font = Enum.Font.GothamMedium, TextSize = 19, TextColor3 = PAL.SubText, TextTransparency = 1,
	Size = UDim2.new(1, -40, 0, 26), Position = UDim2.fromScale(0.5, 0.36), AnchorPoint = Vector2.new(0.5, 0),
	Parent = card,
})

------------------------------------------------------------------------
-- PROGRESS BAR
------------------------------------------------------------------------
local barWidth = 520
local barContainer = new("Frame", {
	Name = "BarContainer", BackgroundColor3 = PAL.BarTrack, BackgroundTransparency = 0.1,
	Size = UDim2.fromOffset(barWidth, 18), Position = UDim2.fromScale(0.5, 0.62),
	AnchorPoint = Vector2.new(0.5, 0.5), Parent = card,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = barContainer })
new("UIStroke", { Color = PAL.Accent, Thickness = 1, Transparency = 0.55, Parent = barContainer })

local barFill = new("Frame", { Name = "Fill", BackgroundColor3 = PAL.Accent, Size = UDim2.fromScale(0, 1), Parent = barContainer })
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = barFill })
local fillGradient = new("UIGradient", { Color = ColorSequence.new(PAL.Accent, PAL.AccentAlt), Parent = barFill })

local shine = new("Frame", {
	Name = "Shine", BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 0.7,
	Size = UDim2.fromScale(0.18, 1), Position = UDim2.fromScale(-0.2, 0), Parent = barFill,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = shine })
new("UIGradient", {
	Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.5, 0), NumberSequenceKeypoint.new(1, 1),
	}), Parent = shine,
})

-- Percentage (left) + status (right) — RTL: status on right
local percentLabel = new("TextLabel", {
	Name = "Percent", BackgroundTransparency = 1, Text = "٠٪", Font = Enum.Font.GothamBold,
	TextSize = 16, TextColor3 = PAL.Text, TextXAlignment = Enum.TextXAlignment.Left,
	Size = UDim2.fromOffset(barWidth * 0.3, 22), Position = UDim2.new(0.5, -barWidth/2, 0.74, 0),
	AnchorPoint = Vector2.new(0, 0), Parent = card,
})
local statusLabel = new("TextLabel", {
	Name = "Status", BackgroundTransparency = 1, Text = CONFIG.StatusMessages[1], Font = Enum.Font.Gotham,
	TextSize = 16, TextColor3 = PAL.SubText, TextXAlignment = Enum.TextXAlignment.Right,
	Size = UDim2.fromOffset(barWidth * 0.7, 22), Position = UDim2.new(0.5, barWidth/2, 0.74, 0),
	AnchorPoint = Vector2.new(1, 0), Parent = card,
})

------------------------------------------------------------------------
-- TOP CHIPS: player (right) + count (left)
------------------------------------------------------------------------
local function makeChip(name, onRight)
	local chip = new("Frame", {
		Name = name, BackgroundColor3 = PAL.Card, BackgroundTransparency = 0.2,
		Size = UDim2.fromOffset(240, 46),
		Position = onRight and UDim2.new(1, -24, 0, 24) or UDim2.fromOffset(24, 24),
		AnchorPoint = onRight and Vector2.new(1, 0) or Vector2.new(0, 0), Parent = root,
	})
	new("UICorner", { CornerRadius = UDim.new(0, 13), Parent = chip })
	new("UIStroke", { Color = PAL.Accent, Thickness = 1, Transparency = 0.5, Parent = chip })
	return chip
end

-- Player chip (right, RTL): avatar on right, text aligned right
local playerChip = makeChip("PlayerChip", true)
local avatar = new("ImageLabel", {
	BackgroundColor3 = PAL.BarTrack, Size = UDim2.fromOffset(34, 34),
	Position = UDim2.new(1, -40, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Parent = playerChip,
})
new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = avatar })
pcall(function()
	avatar.Image = Players:GetUserThumbnailAsync(LocalPlayer.UserId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size48x48)
end)
new("TextLabel", {
	BackgroundTransparency = 1, Text = "أهلاً، " .. LocalPlayer.DisplayName, Font = Enum.Font.GothamMedium,
	TextSize = 14, TextColor3 = PAL.Text, TextXAlignment = Enum.TextXAlignment.Right, TextTruncate = Enum.TextTruncate.AtEnd,
	Size = UDim2.new(1, -52, 1, 0), Position = UDim2.fromOffset(8, 0), Parent = playerChip,
})

-- Count chip (left)
local countChip = makeChip("CountChip", false)
local countLabel = new("TextLabel", {
	BackgroundTransparency = 1, Font = Enum.Font.GothamBold, TextSize = 14, TextColor3 = PAL.AccentAlt,
	Size = UDim2.fromScale(1, 1), Parent = countChip,
})
local function refreshCount()
	countLabel.Text = "● " .. #Players:GetPlayers() .. " متصل الآن"
end
refreshCount()
Players.PlayerAdded:Connect(refreshCount)
Players.PlayerRemoving:Connect(refreshCount)

------------------------------------------------------------------------
-- TIP + RECENT DONORS (bottom)
------------------------------------------------------------------------
local tipLabel = new("TextLabel", {
	Name = "Tip", BackgroundTransparency = 1, Text = CONFIG.Tips[1], Font = Enum.Font.GothamMedium,
	TextSize = 16, TextColor3 = PAL.SubText, TextTransparency = 0.1,
	Size = UDim2.new(1, -40, 0, 24), Position = UDim2.fromScale(0.5, 0.9), AnchorPoint = Vector2.new(0.5, 0.5), Parent = root,
})
local donorLabel = new("TextLabel", {
	Name = "RecentDonors", BackgroundTransparency = 1, Text = "", Font = Enum.Font.Gotham,
	TextSize = 14, TextColor3 = PAL.Accent, TextTransparency = 0.2,
	Size = UDim2.new(1, -40, 0, 20), Position = UDim2.fromScale(0.5, 0.95), AnchorPoint = Vector2.new(0.5, 0.5), Parent = root,
})
local function refreshDonors()
	local data = ReplicatedFirst:GetAttribute("RecentDonors")
	if typeof(data) == "string" and #data > 0 then
		donorLabel.Text = "آخر المتبرعين:  " .. data
	end
end
refreshDonors()
ReplicatedFirst:GetAttributeChangedSignal("RecentDonors"):Connect(refreshDonors)

------------------------------------------------------------------------
-- BLUR + AUDIO
------------------------------------------------------------------------
local blur = new("BlurEffect", { Name = "LoadingBlur", Size = 0, Parent = Lighting })
tween(blur, TweenInfo.new(0.6), { Size = CONFIG.BlurSize })

local ambient
if CONFIG.AmbientMusicId ~= 0 then
	ambient = new("Sound", {
		Name = "LoadingAmbient", SoundId = "rbxassetid://" .. tostring(CONFIG.AmbientMusicId),
		Looped = true, Volume = 0, Parent = SoundService,
	})
	ambient:Play()
	tween(ambient, TweenInfo.new(1.2), { Volume = CONFIG.MusicVolume })
end

------------------------------------------------------------------------
-- INTRO
------------------------------------------------------------------------
tween(logo, TweenInfo.new(CONFIG.IntroTime, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { TextTransparency = 0 })
task.delay(0.25, function() tween(tagline, TweenInfo.new(0.7), { TextTransparency = 0 }) end)

task.spawn(function()
	while screenGui.Parent and logo.Parent do
		tween(logoStroke, TweenInfo.new(1.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), { Transparency = 0.15 }).Completed:Wait()
		if not logo.Parent then break end
		tween(logoStroke, TweenInfo.new(1.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), { Transparency = 0.6 }).Completed:Wait()
	end
end)

------------------------------------------------------------------------
-- CONTINUOUS ANIMATIONS
------------------------------------------------------------------------
local running = true
task.spawn(function()
	local clock = 0
	while running do
		local dt = RunService.RenderStepped:Wait()
		clock += dt
		if clock >= 0.2 then clock = 0; spawnParticle() end
	end
end)
task.spawn(function()
	while running do
		fillGradient.Offset = Vector2.new((fillGradient.Offset.X + 0.01) % 1, 0)
		shine.Position = UDim2.fromScale(((tick() * 0.5) % 1.4) - 0.2, 0)
		accentGlow.Rotation = (accentGlow.Rotation + 0.05) % 360
		accentGlow2.Rotation = (accentGlow2.Rotation - 0.07) % 360
		cardStroke.Transparency = 0.35 + math.sin(tick() * 2) * 0.15
		RunService.RenderStepped:Wait()
	end
end)
task.spawn(function()
	local i = 1
	while running do
		task.wait(1.6); if not running then break end
		i += 1; statusLabel.Text = CONFIG.StatusMessages[((i - 1) % #CONFIG.StatusMessages) + 1]
	end
end)
task.spawn(function()
	local i = 1
	while running do
		task.wait(3.5); if not running then break end
		i += 1
		tween(tipLabel, TweenInfo.new(0.3), { TextTransparency = 1 }).Completed:Wait()
		tipLabel.Text = CONFIG.Tips[((i - 1) % #CONFIG.Tips) + 1]
		tween(tipLabel, TweenInfo.new(0.3), { TextTransparency = 0.1 })
	end
end)

------------------------------------------------------------------------
-- PROGRESS LOGIC
------------------------------------------------------------------------
-- Arabic-Indic digits for the percentage
local AR_DIGITS = { ["0"]="٠",["1"]="١",["2"]="٢",["3"]="٣",["4"]="٤",["5"]="٥",["6"]="٦",["7"]="٧",["8"]="٨",["9"]="٩" }
local function toArabicPercent(n)
	local s = tostring(n)
	s = s:gsub("%d", function(d) return AR_DIGITS[d] or d end)
	return s .. "٪"
end

local displayProgress, targetProgress = 0, 0
task.spawn(function()
	while running do
		local dt = RunService.RenderStepped:Wait()
		displayProgress += (targetProgress - displayProgress) * math.clamp(dt * 3.2, 0, 1)
		local pct = math.clamp(displayProgress, 0, 1)
		barFill.Size = UDim2.fromScale(pct, 1)
		percentLabel.Text = toArabicPercent(math.floor(pct * 100 + 0.5))
	end
end)

local function gatherAssets()
	local list = {}
	if #CONFIG.PreloadInstances > 0 then
		for _, item in ipairs(CONFIG.PreloadInstances) do table.insert(list, item) end
	else
		for _, n in ipairs({ "Workspace", "ReplicatedStorage", "StarterGui", "Lighting", "SoundService" }) do
			local svc = game:FindFirstChild(n) or game:GetService(n)
			if svc then table.insert(list, svc) end
		end
	end
	return list
end

local startTime = os.clock()
task.spawn(function()
	local assets = gatherAssets()
	local total = math.max(#assets, 1)
	for index, asset in ipairs(assets) do
		pcall(function() ContentProvider:PreloadAsync({ asset }) end)
		targetProgress = math.max(targetProgress, (index / total) * 0.85)
		task.wait()
	end
	if not game:IsLoaded() then game.Loaded:Wait() end
	targetProgress = 1
end)

------------------------------------------------------------------------
-- أصوات + تجميد اللاعب (للقائمة الرئيسية)
------------------------------------------------------------------------
local function playSound(id: number?, vol: number?)
	if not id or id <= 0 then return end
	pcall(function()
		local s = Instance.new("Sound")
		s.SoundId = "rbxassetid://" .. tostring(id)
		s.Volume = vol or CONFIG.MenuSoundVolume or 0.5
		s.Parent = SoundService
		s:Play()
		s.Ended:Once(function() s:Destroy() end)
		task.delay(6, function() if s then s:Destroy() end end)
	end)
end

local savedWalk, savedJumpP, savedJumpH
local function freezeChar(char: Instance?, freeze: boolean)
	char = char or LocalPlayer.Character
	if not char then return end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum then return end
	if freeze then
		if savedWalk == nil then
			savedWalk, savedJumpP, savedJumpH = hum.WalkSpeed, hum.JumpPower, hum.JumpHeight
		end
		hum.WalkSpeed = 0
		hum.JumpPower = 0
		hum.JumpHeight = 0
	else
		hum.WalkSpeed = savedWalk or 16
		hum.JumpPower = savedJumpP or 50
		hum.JumpHeight = savedJumpH or 7.2
	end
end

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

------------------------------------------------------------------------
-- القائمة الرئيسية (Main Menu)
------------------------------------------------------------------------
local function showMainMenu()
	local menuGui = new("ScreenGui", {
		Name = "DonationMainMenu", IgnoreGuiInset = true, ResetOnSpawn = false,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling, DisplayOrder = 1001,
		Parent = LocalPlayer:WaitForChild("PlayerGui"),
	})
	new("UIScale", { Scale = UI_SCALE, Parent = menuGui })

	local mRoot = new("Frame", {
		Name = "Root", Size = UDim2.fromScale(1, 1), BackgroundColor3 = PAL.BgBottom,
		BorderSizePixel = 0, BackgroundTransparency = 1, Parent = menuGui,
	})
	new("UIGradient", { Rotation = 90, Color = ColorSequence.new(PAL.BgTop, PAL.BgBottom), Parent = mRoot })

	-- 🖼️ نفس الخلفية المخصّصة تظهر خلف القائمة الرئيسية (مكان نظر اللاعب)
	addCustomBackground(mRoot, PAL)

	local glowA = new("ImageLabel", {
		BackgroundTransparency = 1, Image = "rbxassetid://5028857084", ImageColor3 = PAL.Accent,
		ImageTransparency = 1, Size = UDim2.fromScale(1.6, 1.6),
		Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), Parent = mRoot,
	})
	local glowB = new("ImageLabel", {
		BackgroundTransparency = 1, Image = "rbxassetid://5028857084", ImageColor3 = PAL.AccentAlt,
		ImageTransparency = 1, Size = UDim2.fromScale(1.15, 1.15),
		Position = UDim2.fromScale(0.5, 0.55), AnchorPoint = Vector2.new(0.5, 0.5), Parent = mRoot,
	})

	local title = new("TextLabel", {
		Name = "Title", BackgroundTransparency = 1, Text = CONFIG.GameName, RichText = true,
		Font = Enum.Font.GothamBlack, TextSize = 64, TextColor3 = PAL.Text, TextTransparency = 1,
		Size = UDim2.new(1, -80, 0, 88), Position = UDim2.fromScale(0.5, 0.17),
		AnchorPoint = Vector2.new(0.5, 0.5), Parent = mRoot,
	})
	new("UIGradient", { Color = ColorSequence.new(PAL.AccentAlt, PAL.Accent), Rotation = 12, Parent = title })
	local titleStroke = new("UIStroke", { Color = PAL.Accent, Thickness = 2, Transparency = 1, Parent = title })

	local sub = new("TextLabel", {
		BackgroundTransparency = 1, Text = CONFIG.Tagline, Font = Enum.Font.GothamMedium,
		TextSize = 20, TextColor3 = PAL.SubText, TextTransparency = 1,
		Size = UDim2.new(1, -80, 0, 26), Position = UDim2.fromScale(0.5, 0.27), AnchorPoint = Vector2.new(0.5, 0.5),
		Parent = mRoot,
	})

	local ver = new("TextLabel", {
		BackgroundTransparency = 1, Text = CONFIG.MenuVersion or "", Font = Enum.Font.Gotham,
		TextSize = 14, TextColor3 = PAL.SubText, TextTransparency = 1,
		Size = UDim2.new(1, -40, 0, 20), Position = UDim2.fromScale(0.5, 0.95), AnchorPoint = Vector2.new(0.5, 0.5),
		Parent = mRoot,
	})

	local btnHolder = new("Frame", {
		Name = "Buttons", BackgroundTransparency = 1, Size = UDim2.fromOffset(360, 220),
		Position = UDim2.fromScale(0.5, 0.58), AnchorPoint = Vector2.new(0.5, 0.5), Parent = mRoot,
	})
	new("UIListLayout", {
		FillDirection = Enum.FillDirection.Vertical, HorizontalAlignment = Enum.HorizontalAlignment.Center,
		VerticalAlignment = Enum.VerticalAlignment.Center, Padding = UDim.new(0, 16),
		SortOrder = Enum.SortOrder.LayoutOrder, Parent = btnHolder,
	})

	local menuClosing = false
	local charConn

	local function makeButton(text: string, primary: boolean, order: number)
		local btn = new("TextButton", {
			Name = "Btn_" .. order, Text = "", AutoButtonColor = false,
			BackgroundColor3 = primary and PAL.Accent or PAL.Card, BackgroundTransparency = 1,
			Size = UDim2.fromOffset(360, 58), LayoutOrder = order, Parent = btnHolder,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 14), Parent = btn })
		local stroke = new("UIStroke", { Color = primary and PAL.AccentAlt or PAL.CardStroke, Thickness = 1.5, Transparency = 1, Parent = btn })
		if primary then
			new("UIGradient", { Color = ColorSequence.new(PAL.Accent, PAL.AccentAlt), Rotation = 25, Parent = btn })
		end
		new("TextLabel", {
			Name = "Label", BackgroundTransparency = 1, Text = text, Font = Enum.Font.GothamBold,
			TextSize = 22, TextColor3 = primary and Color3.fromRGB(20, 12, 36) or PAL.Text, TextTransparency = 1,
			Size = UDim2.fromScale(1, 1), Parent = btn,
		})
		btn.MouseEnter:Connect(function()
			if menuClosing then return end
			playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Hover)
			tween(btn, TweenInfo.new(0.15), { Size = UDim2.fromOffset(376, 60) })
			tween(stroke, TweenInfo.new(0.15), { Transparency = 0 })
		end)
		btn.MouseLeave:Connect(function()
			if menuClosing then return end
			tween(btn, TweenInfo.new(0.15), { Size = UDim2.fromOffset(360, 58) })
			tween(stroke, TweenInfo.new(0.15), { Transparency = 0.2 })
		end)
		return btn
	end

	local function makePanel(titleText: string, lines: { string })
		local panel = new("Frame", {
			Name = "Panel", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
			Size = UDim2.fromOffset(640, 460), BackgroundColor3 = PAL.Card, BackgroundTransparency = 1,
			Visible = false, ZIndex = 5, Parent = mRoot,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 22), Parent = panel })
		local pStroke = new("UIStroke", { Color = PAL.CardStroke, Thickness = 1.5, Transparency = 1, Parent = panel })
		local pTitle = new("TextLabel", {
			BackgroundTransparency = 1, Text = titleText, Font = Enum.Font.GothamBlack,
			TextSize = 28, TextColor3 = PAL.Text, TextTransparency = 1,
			Size = UDim2.new(1, -48, 0, 50), Position = UDim2.new(0.5, 0, 0, 22), AnchorPoint = Vector2.new(0.5, 0),
			ZIndex = 6, Parent = panel,
		})
		new("UIGradient", { Color = ColorSequence.new(PAL.AccentAlt, PAL.Accent), Parent = pTitle })
		local scroll = new("ScrollingFrame", {
			BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.new(1, -48, 1, -150),
			Position = UDim2.new(0.5, 0, 0, 84), AnchorPoint = Vector2.new(0.5, 0),
			CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
			ScrollBarThickness = 5, ScrollBarImageColor3 = PAL.Accent, ZIndex = 6, Parent = panel,
		})
		new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder, Parent = scroll })
		new("UIPadding", { PaddingRight = UDim.new(0, 10), PaddingLeft = UDim.new(0, 10), Parent = scroll })
		local lineLabels = {}
		for i, ln in ipairs(lines) do
			lineLabels[#lineLabels + 1] = new("TextLabel", {
				BackgroundTransparency = 1, Text = ln, Font = Enum.Font.GothamMedium,
				TextSize = 18, TextColor3 = PAL.Text, TextTransparency = 1, TextWrapped = true,
				TextXAlignment = Enum.TextXAlignment.Right, AutomaticSize = Enum.AutomaticSize.Y,
				Size = UDim2.new(1, 0, 0, 0), LayoutOrder = i, ZIndex = 6, Parent = scroll,
			})
		end
		local back = new("TextButton", {
			Text = "", AutoButtonColor = false, BackgroundColor3 = PAL.Accent, BackgroundTransparency = 1,
			Size = UDim2.fromOffset(200, 48), Position = UDim2.new(0.5, 0, 1, -22), AnchorPoint = Vector2.new(0.5, 1),
			ZIndex = 6, Parent = panel,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 12), Parent = back })
		new("UIGradient", { Color = ColorSequence.new(PAL.Accent, PAL.AccentAlt), Parent = back })
		local backStroke = new("UIStroke", { Color = PAL.AccentAlt, Thickness = 1.5, Transparency = 1, Parent = back })
		local backLbl = new("TextLabel", {
			BackgroundTransparency = 1, Text = "رجوع", Font = Enum.Font.GothamBold, TextSize = 20,
			TextColor3 = Color3.fromRGB(20, 12, 36), TextTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 7, Parent = back,
		})
		back.MouseEnter:Connect(function() playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Hover); tween(backStroke, TweenInfo.new(0.15), { Transparency = 0 }) end)
		back.MouseLeave:Connect(function() tween(backStroke, TweenInfo.new(0.15), { Transparency = 0.2 }) end)
		return { frame = panel, stroke = pStroke, title = pTitle, lines = lineLabels, back = back, backLbl = backLbl, backStroke = backStroke }
	end

	local function setPanelVisible(p, visible: boolean)
		if visible then
			p.frame.Visible = true
			tween(p.frame, TweenInfo.new(0.3), { BackgroundTransparency = 0.05 })
			tween(p.stroke, TweenInfo.new(0.3), { Transparency = 0.25 })
			tween(p.title, TweenInfo.new(0.3), { TextTransparency = 0 })
			for _, l in ipairs(p.lines) do tween(l, TweenInfo.new(0.3), { TextTransparency = 0.05 }) end
			tween(p.back, TweenInfo.new(0.3), { BackgroundTransparency = 0 })
			tween(p.backStroke, TweenInfo.new(0.3), { Transparency = 0.2 })
			tween(p.backLbl, TweenInfo.new(0.3), { TextTransparency = 0 })
		else
			tween(p.frame, TweenInfo.new(0.25), { BackgroundTransparency = 1 })
			tween(p.stroke, TweenInfo.new(0.25), { Transparency = 1 })
			tween(p.title, TweenInfo.new(0.25), { TextTransparency = 1 })
			for _, l in ipairs(p.lines) do tween(l, TweenInfo.new(0.25), { TextTransparency = 1 }) end
			tween(p.back, TweenInfo.new(0.25), { BackgroundTransparency = 1 })
			tween(p.backStroke, TweenInfo.new(0.25), { Transparency = 1 })
			tween(p.backLbl, TweenInfo.new(0.25), { TextTransparency = 1 })
			task.delay(0.26, function() if p.frame then p.frame.Visible = false end end)
		end
	end

	local startBtn = makeButton("بدء اللعبة", true, 1)
	local rulesBtn = makeButton(CONFIG.RulesTitle, false, 2)
	local updatesBtn = makeButton(CONFIG.UpdatesTitle, false, 3)

	local rulesPanel = makePanel(CONFIG.RulesTitle, CONFIG.RulesLines)
	local updatesPanel = makePanel(CONFIG.UpdatesTitle, CONFIG.UpdatesLines)
	rulesPanel.back.MouseButton1Click:Connect(function() playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Click); setPanelVisible(rulesPanel, false) end)
	updatesPanel.back.MouseButton1Click:Connect(function() playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Click); setPanelVisible(updatesPanel, false) end)
	rulesBtn.MouseButton1Click:Connect(function() if menuClosing then return end playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Click); setPanelVisible(rulesPanel, true) end)
	updatesBtn.MouseButton1Click:Connect(function() if menuClosing then return end playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Click); setPanelVisible(updatesPanel, true) end)

	startBtn.MouseButton1Click:Connect(function()
		if menuClosing then return end
		menuClosing = true
		playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Start, (CONFIG.MenuSoundVolume or 0.5) + 0.2)
		setControls(true)
		if CONFIG.FreezeOnMenu then freezeChar(nil, false) end
		if charConn then charConn:Disconnect() end
		local shatter = TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		tween(title, shatter, { TextTransparency = 1, TextSize = 42 })
		tween(titleStroke, shatter, { Transparency = 1 })
		tween(sub, shatter, { TextTransparency = 1 })
		tween(ver, shatter, { TextTransparency = 1 })
		tween(glowA, shatter, { ImageTransparency = 1 })
		tween(glowB, shatter, { ImageTransparency = 1 })
		for _, child in ipairs(btnHolder:GetChildren()) do
			if child:IsA("TextButton") then
				tween(child, shatter, { BackgroundTransparency = 1, Rotation = math.random(-12, 12) })
				for _, d in ipairs(child:GetDescendants()) do
					if d:IsA("TextLabel") then tween(d, shatter, { TextTransparency = 1 })
					elseif d:IsA("UIStroke") then tween(d, shatter, { Transparency = 1 }) end
				end
			end
		end
		tween(mRoot, shatter, { BackgroundTransparency = 1 })
		task.delay(0.55, function() if menuGui then menuGui:Destroy() end end)
	end)

	-- تجميد اللاعب أثناء القائمة + إعادة التجميد لو ظهرت شخصية جديدة
	if CONFIG.FreezeOnMenu then
		freezeChar(nil, true)
		setControls(false)
		charConn = LocalPlayer.CharacterAdded:Connect(function(char)
			if not menuClosing then
				task.wait(0.2); freezeChar(char, true); setControls(false)
			end
		end)
	end

	-- تحميل الأصوات مسبقاً لتشغيل فوري
	pcall(function()
		local probes = {}
		for _, k in ipairs({ "Hover", "Click", "Start" }) do
			local id = CONFIG.MenuSounds and CONFIG.MenuSounds[k]
			if id and id > 0 then
				local s = Instance.new("Sound"); s.SoundId = "rbxassetid://" .. tostring(id); s.Parent = SoundService
				probes[#probes + 1] = s
			end
		end
		if #probes > 0 then ContentProvider:PreloadAsync(probes) end
		for _, s in ipairs(probes) do s:Destroy() end
	end)

	-- دوران التوهّج المستمر
	task.spawn(function()
		while menuGui.Parent and not menuClosing do
			glowA.Rotation = (glowA.Rotation + 0.05) % 360
			glowB.Rotation = (glowB.Rotation - 0.07) % 360
			RunService.RenderStepped:Wait()
		end
	end)

	-- ظهور تدريجي (يتزامن مع تلاشي اللودينغ)
	local fin = TweenInfo.new(CONFIG.FadeOutTime or 1.2, Enum.EasingStyle.Quad)
	tween(mRoot, fin, { BackgroundTransparency = 0 })
	tween(glowA, fin, { ImageTransparency = 0.5 })
	tween(glowB, fin, { ImageTransparency = 0.75 })
	tween(title, fin, { TextTransparency = 0 })
	tween(titleStroke, fin, { Transparency = 0.4 })
	tween(sub, fin, { TextTransparency = 0 })
	tween(ver, fin, { TextTransparency = 0.3 })
	task.delay(0.15, function()
		for _, child in ipairs(btnHolder:GetChildren()) do
			if child:IsA("TextButton") then
				tween(child, TweenInfo.new(0.4), { BackgroundTransparency = (child.Name == "Btn_1") and 0 or 0.15 })
				for _, d in ipairs(child:GetDescendants()) do
					if d:IsA("TextLabel") then tween(d, TweenInfo.new(0.4), { TextTransparency = 0 })
					elseif d:IsA("UIStroke") then tween(d, TweenInfo.new(0.4), { Transparency = 0.2 }) end
				end
			end
		end
	end)
end

local function finish()
	running = false
	if CONFIG.CompletionSound ~= 0 then
		local s = new("Sound", { SoundId = "rbxassetid://" .. tostring(CONFIG.CompletionSound), Volume = 0.6, Parent = SoundService })
		s:Play(); task.delay(3, function() s:Destroy() end)
	end
	targetProgress, displayProgress = 1, 1
	barFill.Size = UDim2.fromScale(1, 1)
	percentLabel.Text = toArabicPercent(100)
	statusLabel.Text = "جاهز!"

	if ambient then
		tween(ambient, TweenInfo.new(CONFIG.FadeOutTime), { Volume = 0 }).Completed:Connect(function() ambient:Destroy() end)
	end

	tween(logo, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { TextSize = 60 })
	tween(card, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.In), { Size = UDim2.fromOffset(660, 410) })

	local fadeInfo = TweenInfo.new(CONFIG.FadeOutTime, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut)
	tween(blur, fadeInfo, { Size = 0 }).Completed:Connect(function() if blur then blur:Destroy() end end)
	tween(root, fadeInfo, { BackgroundTransparency = 1 })
	for _, d in ipairs(root:GetDescendants()) do
		if d:IsA("TextLabel") then tween(d, fadeInfo, { TextTransparency = 1, TextStrokeTransparency = 1 })
		elseif d:IsA("Frame") then tween(d, fadeInfo, { BackgroundTransparency = 1 })
		elseif d:IsA("ImageLabel") then tween(d, fadeInfo, { ImageTransparency = 1, BackgroundTransparency = 1 })
		elseif d:IsA("UIStroke") then tween(d, fadeInfo, { Transparency = 1 }) end
	end
	if CONFIG.MenuEnabled then
		showMainMenu()
	end
	task.delay(CONFIG.FadeOutTime + 0.05, function() if screenGui then screenGui:Destroy() end end)
end

task.spawn(function()
	while running do
		local elapsed = os.clock() - startTime
		local realDone = (displayProgress >= 0.999) and game:IsLoaded()
		if (realDone and elapsed >= CONFIG.MinDisplayTime) or (elapsed >= CONFIG.MaxDisplayTime) then
			targetProgress = 1
			task.wait(0.35)
			finish()
			break
		end
		task.wait(0.1)
	end
end)
