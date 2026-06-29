--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  مدينة شهد — شاشة تحميل احترافية (Premium Loading Screen)         ║
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
	GameName = "مدينة شهد",
	Tagline  = "مهام • تحديات • باركور • مكافآت",

	Theme = "DarkNeon", -- "DarkNeon" | "WhiteCyan"

	-- 🖼️ خلفية مخصّصة لشاشة التحميل (صورة مرفوعة على روبلوكس).
	-- ضع رقم الـ Asset ID هنا (0 = بدون خلفية، تظهر الخلفية النيون الافتراضية).
	BackgroundImageId      = 74406236742129, -- خلفية بوابة القصر 3D (رندر بلندر) — النافورة تبقى بصورتها الأصلية
	BackgroundImageDim     = 0.42, -- درجة تعتيم الصورة (0 = واضحة، 1 = سوداء) لإبقاء النص مقروءاً

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
		"نصيحة: افتح لوحة «📋 المهام» وأكمل مهامك اليومية لتكسب الكوينز.",
		"نصيحة: جرّب تحدّي الباركور وحطّم رقمك القياسي في الوقت.",
		"نصيحة: أكمل الأنشطة المتنوّعة في المدينة لفتح المكافآت.",
		"نصيحة: ادخل يومياً لتحصل على مكافآت إضافية.",
		"نصيحة: المتصدّرون في الأنشطة يظهرون على لوحة الصدارة.",
		"نصيحة: زُر قاعة السينما للاستراحة بين التحديات.",
	},

	------------------------------------------------------------------
	-- القائمة الرئيسية (Main Menu) — تظهر بعد اللودينغ وقبل دخول اللعبة
	------------------------------------------------------------------
	MenuEnabled   = true,                 -- false = ادخل اللعبة مباشرة بدون قائمة
	MenuVersion   = "الإصدار ٢.٩.٦٠",          -- يظهر أسفل القائمة
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
		"🎯 الهدف: أكمل المهام والتحديات، تسلّق الباركور، واجمع الكوينز والشارات بنشاطك.",
		"",
		"• افتح لوحة «📋 المهام» وأكمل المهام اليومية والأسبوعية لتكسب الكوينز.",
		"• خُض تحدّي الباركور وحاول تحطيم رقمك القياسي في الوقت.",
		"• أكمل الأنشطة المتنوّعة في المدينة واحصل على شارات تلقائية بتقدّمك.",
		"• استثمر الكوينز في بوثك الخاص، وزُر السينما للاستراحة بين التحديات.",
		"",
		"📜 القوانين:",
		"• احترم جميع اللاعبين — ممنوع الإساءة أو الإزعاج.",
		"• ممنوع الغش أو استغلال الثغرات.",
		"• اللعب النظيف يصنع مجتمعاً أجمل للجميع.",
	},

	UpdatesTitle = "تحديثات اللعبة",
	UpdatesLog = {
		{
			version = "٢.٩.٦٠", date = "٢٩ يونيو",
			items = {
				{ "new", "أشجار الكرز أصبحت موديلات 3D مصمّمة في بلندر (جذع متفرّع + تاج وردي كثيف واقعي) بدل الأشجار الإجرائية القديمة — أقرب بكثير للشكل الطبيعي، مع تمايل مع الريح وتساقط بتلات وردية." },
			},
		},
		{
			version = "٢.٩.٥٩", date = "٢٩ يونيو",
			items = {
				{ "fix", "باب «ركن الألعاب» صار باباً منزلقاً: بدل ما تدور الأوراق (وكانت تعلق على الجانب كأنها فاصل بعد الفتح/الإغلاق)، صارت تنزلق داخل الجدار عند الفتح وترجع مسطّحة تماماً عند الإغلاق — فيقفل بالكامل وبشكل صحيح كل مرة، بلا أي جزء مكشوف." },
			},
		},
		{
			version = "٢.٩.٥٨", date = "٢٩ يونيو",
			items = {
				{ "fix", "إصلاح جذري لإغلاق باب «ركن الألعاب»: كانت أوراق الباب أحياناً ما ترجع لوضع الإغلاق الكامل فتبقى مفتوحة على الجانب كأنها فاصل. الآن أي حركة جارية تُلغى عند الضغط، والأوراق تُثبَّت بدقّة على وضعها النهائي (مغلق=مسطّح، مفتوح=للجانب) عند انتهاء الحركة — فيقفل ويفتح بالكامل وبشكل صحيح كل مرة." },
			},
		},
		{
			version = "٢.٩.٥٧", date = "٢٩ يونيو",
			items = {
				{ "fix", "إصلاح جذري لاصطدام باب «ركن الألعاب»: كانت الفتحة تبقى قابلة للمرور بعد فتح الباب حتى بعد إغلاقه. الآن الاصطدام موكول لحاجز ثابت يصبح صلباً عند الإغلاق ويفتح عند الفتح — فصار الباب يسّكر ويفتح بشكل صحيح كل مرة." },
			},
		},
		{
			version = "٢.٩.٥٦", date = "٢٩ يونيو",
			items = {
				{ "fix", "إصلاح جذري لباب «ركن الألعاب»: كان لوح الباب شفافاً فيذوب في وهج الإضاءة ويبان المدخل فارغاً. صار الباب لوحاً كحلياً مصمتاً بإطار ذهبي + نافذة زجاجية ومقبض — واضح تماماً ويفتح/يغلق بـE." },
				{ "fix", "تقليل الوهج الأبيض الزائد حول المدخل (تخفيف النيون في الخطوط الذهبية وإطار الأرضية) فصارت التفاصيل أوضح." },
			},
		},
		{
			version = "٢.٩.٥٥", date = "٢٩ يونيو",
			items = {
				{ "new", "أشجار كرز وردية 3D حقيقية تتمايل مع الريح: استُبدلت الأشجار الخضراء القديمة في الماب بأشجار كرز متفرّعة بتاج وردي كثيف وتساقط بتلات، مع زوجين يحضنان مدخل «ركن الألعاب»." },
				{ "fix", "تنسيق «ركن الألعاب»: صبغ أوضح للجدران (كريمي دافئ) داخل وخارج + حزام كحلي وخط ذهبي وكورنيش علوي، وأرضية رخام أدفأ بإطار ذهبي محيطي — صار المبنى يبان مؤطّراً ومصمّماً لا باهتاً." },
			},
		},
		{
			version = "٢.٩.٥٤", date = "٢٩ يونيو",
			items = {
				{ "fix", "إصلاح تداخل بصري في «ركن الألعاب»: نوافذ الجدار الخلفي الزجاجية كانت تتداخل مع لوحة «المتصدّرون» والساعة فتبان كأنها لوح أزرق فوقها — أُخفيت نوافذ الجدار الخلفي فصارت اللوحة والساعة واضحتين." },
			},
		},
		{
			version = "٢.٩.٥٣", date = "٢٩ يونيو",
			items = {
				{ "fix", "إصلاح باب «ركن الألعاب»: كان يبان فارغاً لأن خامة الزجاج تختفي على بعض الأجهزة — صار لوحاً واضحاً بإطار ذهبي سميك وعارضات ولوح سفلي كريمي ومقبض، يفتح/يُغلق بـE." },
				{ "new", "تأثيث داخلي وخارجي متكامل للمبنى: ميدالية ترحيب ذهبية بشعار X/O وحلقة نيون وردية وسط الصالة، إطارات ذهبية لممر السجاد، أحواض كرز مزهّرة، وإضاءة وردية عند الأعمدة. ومن الخارج: سجادة ترحيب حمراء، فانوسان مضيئان عند الباب، أحواض كرز، ومقاعد انتظار." },
			},
		},
		{
			version = "٢.٩.٥٢", date = "٢٩ يونيو",
			items = {
				{ "fix", "إصلاح مبنى «ركن الألعاب» 3D: إعادة صبغه بالكامل (كان يصل رماديّاً بلا ألوان لأن الرفع جرّد الخامات) — جدران كريمية، أعمدة وأطراف ذهبية، سقف كحلي، نيون وردي، أرضية رخام، نوافذ زجاجية. وتصحيح الاتجاه: المدخل والباب واللافتة صاروا يواجهون المدخل (السبون) بدل الجهة الخلفية، مع إعادة الباب المزدوج ليملأ الفتحة ويفتح بـE، وإعادة نص اللافتة «🎮 ركن الألعاب»." },
			},
		},
		{
			version = "٢.٩.٥١", date = "٢٩ يونيو",
			items = {
				{ "new", "🎮 مبنى «ركن الألعاب» الجديد ثلاثي الأبعاد (3D): جناح مغلق متكامل بجدران ونوافذ وسقف هرمي ملكي، بُني بتقنية بلندر ورُكّب في زاوية مخصّصة شمال المدينة. باب زجاجي مزدوج بإطار ذهبي يفتح بالضغط على E ويُغلق تلقائياً. طاولات إكس-أو الثلاث صارت بداخله، مع ثُريّا وفوانيس وإضاءة نيون ولافتة وأحواض نباتات." },
			},
		},
		{
			version = "٢.٩.٥٠", date = "٢٩ يونيو",
			items = {
				{ "fix", "إصلاح تلميحات مشهد القفز بالمظلّة: فصل تام بين الجوال والكمبيوتر — الجوال يرى أزرار لمس فقط (اقفز / افتح المظلّة / تسريع)، والكمبيوتر يرى تلميح «اضغط E / Shift» فقط دون تكرار أو ظهور أزرار الجوال على الكمبيوتر." },
			},
		},
		{
			version = "٢.٩.٤٩", date = "٢٩ يونيو",
			items = {
				{ "new", "🕐 ساعة السيرفر صارت مصغّرة وأنيقة بجانب «كوينز» أعلى-اليمين بنفس الستايل (زجاج داكن وإطار ذهبي) — تعرض الوقت بأرقام عربية مع شمس نهاراً تتحوّل هلالاً ليلاً، ولا تتداخل مع الإشعارات نهائياً." },
			},
		},
		{
			version = "٢.٩.٤٨", date = "٢٩ يونيو",
			items = {
				{ "fix", "إصلاح جذري لميزة VIP: ما تختفي أبداً بالموت أو الريست أو الخروج وإعادة الدخول — تُعاد كل مزاياها (التاج الذهبي، الأزرار، الدخول المجاني للقصر) تلقائياً عند كل ظهور، ولا تُسحب إلا من لوحة الإدارة." },
				{ "new", "🎮 ركن الألعاب: جناح مفتوح أنيق يضمّ طاولات إكس-أو الثلاث مع أعمدة رخامية وسقف ملكي وأرضية بإطار نيون، مُفرَّش بسجاد دائري وفوانيس ذهبية معلّقة وأحواض نباتات — مفتوح لكل اللاعبين." },
				{ "fix", "الساعة العلوية ما تعود تغطّي الإشعارات: تنزاح لأعلى بسلاسة فور ظهور أي إشعار علوي وترجع مكانها بعد اختفائه." },
			},
		},
		{
			version = "٢.٩.٤٧", date = "٢٩ يونيو",
			items = {
				{ "fix", "تعزيز حماية «إعطاء/خصم كوينز»: التحقق من رتبة اللاعب صار عبر معرّفه (userId) فيعمل حتى لو كان غير متصل — فما يقدر أدمن يعدّل رصيد إداري برتبته أو أعلى وهو أوفلاين." },
			},
		},
		{
			version = "٢.٩.٤٦", date = "٢٩ يونيو",
			items = {
				{ "improve", "تصميم جديد احترافي لساعة السيرفر: شريحة زجاجية بظل ناعم وإطار ذهبي متدرّج، شمس بأشعة دوّارة نهاراً تتحوّل لهلال ليلاً، توهّج نابض، واسم المرحلة (الفجر/الصباح/الظهر/العصر/المغرب/الليل) بانتقالات ألوان سلسة." },
			},
		},
		{
			version = "٢.٩.٤٥", date = "٢٩ يونيو",
			items = {
				{ "new", "أعضاء VIP يدخلون قصر شهد مجاناً بدون رسوم — بصمة الدخول تتعرّف عليهم وتفتح الباب فوراً." },
			},
		},
		{
			version = "٢.٩.٤٤", date = "٢٩ يونيو",
			items = {
				{ "new", "زر «💰 كوينز» في لوحة الإدارة: الأدمن فأعلى يقدر يضيف أو يخصم كوينز لأي لاعب فوراً (مبالغ سريعة + مبلغ مخصّص)." },
			},
		},
		{
			version = "٢.٩.٤٣", date = "٢٨ يونيو",
			items = {
				{ "fix", "وضع «المغرب» في تحكم الأدمن بوقت اليوم صار غروباً ذهبياً دافئاً بدل إضاءة الليل الكاملة." },
			},
		},
		{
			version = "٢.٩.٤٢", date = "٢٨ يونيو",
			items = {
				{ "fix", "إصلاح الطيران: تسريع السرعة (Shift) صار يُصفّر عند إيقاف الطيران، فما يبقى الطيران سريعاً في المرة الجاية." },
			},
		},
		{
			version = "٢.٩.٤١", date = "٢٨ يونيو",
			items = {
				{ "fix", "تنسيق قسم «وقت اليوم» في لوحة الإدارة للجوال: أزرار أصغر ومتناسقة، ونص «تلقائي» ما عاد يطفح، وشريحة الحالة أنظف." },
			},
		},
		{
			version = "٢.٩.٤٠", date = "٢٨ يونيو",
			items = {
				{ "fix", "أمر /fly صار يشتغل على الجوال: أزرار لمسية ⬆/⬇ للصعود والهبوط و⚡ للتسريع، والحركة الأفقية من عصا التحكم. على الكمبيوتر يبقى WASD + مسافة/Ctrl/Shift." },
			},
		},
		{
			version = "٢.٩.٣٩", date = "٢٨ يونيو",
			items = {
				{ "new", "تحكّم الأدمن بوقت اليوم من لوحة الإدارة (تبويب «🎬 العرض»): صباح / ظهر / مغرب / ليل، أو «تلقائي» للرجوع لتوقيت البحرين. يُطبَّق فوراً على كل اللاعبين، ويبقى بعد إعادة التشغيل، ويتزامن عبر كل السيرفرات. متاح للأدمن فأعلى فقط." },
			},
		},
		{
			version = "٢.٩.٣٨", date = "٢٨ يونيو",
			items = {
				{ "fix", "ضبط حاجز حافة المدينة: صار يلتفّ تلقائياً على حدود الماب الفعلية عند آخر نقطة أرض (خفيّ تماماً)، بدل ما يوقف اللاعب في النص." },
			},
		},
		{
			version = "٢.٩.٣٧", date = "٢٨ يونيو",
			items = {
				{ "new", "حماية حافة المدينة: حاجز خفي يمنع اللاعب من الخروج أو رمي نفسه برّا الماب." },
				{ "new", "شبكة أمان للسقوط: لو نزل تحت الحدّ لأي سبب يُعاد للسبون بنعومة بلا موت." },
			},
		},
		{
			version = "٢.٩.٣٦", date = "٢٨ يونيو",
			items = {
				{ "new", "تسريع النزول من الطائرة: استمر بالضغط على Shift (كمبيوتر) أو زر «تسريع ⬇» (جوال) لزيادة سرعة الهبوط." },
			},
		},
		{
			version = "٢.٩.٣٥", date = "٢٨ يونيو",
			items = {
				{ "fix", "جعل لافتة «أفضل وقت» عند الباركور صلبة فلا يمر اللاعب من خلالها." },
			},
		},
		{
			version = "٢.٩.٣٤", date = "٢٨ يونيو",
			items = {
				{ "fix", "فصل طاولات إكس-أو عن منارة الباركور: نُقل صفّ الطاولات لليمين فلا يتداخل الكرسي مع المنارة الملوّنة." },
				{ "fix", "منع طرد لاعب من كرسيّه: لا يمكن الجلوس على كرسيّ مشغول أثناء المباراة." },
			},
		},
		{
			version = "٢.٩.٣٣", date = "٢٨ يونيو",
			items = {
				{ "improve", "لافتة «أفضل وقت» عند برج الباركور بحُلّة ملكية: زجاج داكن + إطار وتاج ذهبي + شريحة حالة واضحة." },
				{ "fix", "تصحيح عرض لافتة «أفضل وقت»: إبعاد العمود عن النص وتوسيع الشريحة لعرض واضح بلا تداخل." },
			},
		},
		{
			version = "٢.٩.٣١", date = "٢٨ يونيو",
			items = {
				{ "new", "لعبة إكس-أو (X·O) ثلاثية الأبعاد: ٣ طاولات ملكية قرب الساحة." },
				{ "new", "اقعد على كرسيّ (أحمر X / أزرق O) واضغط المربّع في دورك ليظهر رمزك مجسّماً." },
				{ "new", "كشف الفائز مع إبراز الخط، تعادل، وإعادة لعب فوريّة." },
			},
		},
		{
			version = "٢.٩.٣٠", date = "٢٧ يونيو",
			items = {
				{ "new", "قائمة رئيسية ملكية جديدة: بطاقات فاخرة + شعار تاج + أيقونات." },
				{ "new", "نظام تعاقب الليل والنهار (٥ مراحل) بتوقيت البحرين الحقيقي." },
				{ "new", "ساعة السيرفر أعلى الشاشة تتحدّث لحظياً لكل اللاعبين." },
				{ "improve", "سجلّ التحديثات صار احترافياً بخطّ زمني ووسوم تصنيف ملوّنة." },
			},
		},
		{
			version = "٢.٩.٢٩", date = "٢٦ يونيو",
			items = {
				{ "improve", "جهاز بصمة القصر: لوحة جدارية بيومترية + شاشة مسح واقعية." },
				{ "fix", "يُخصم ٢٥٠ كوينز عند كل محاولة دخول + منع الدخول المجاني خلف الدافع." },
				{ "fix", "جهاز الخروج الداخلي ما ينضغط من خارج القصر." },
			},
		},
		{
			version = "٢.٩.٢٨", date = "٢٤ يونيو",
			items = {
				{ "new", "ريسبون ملكي على طريقة ببجي: طائرة شهد + قفز ومظلّة واقعية." },
				{ "improve", "وضعية الهبوط بالمظلّة صارت واقعية ومركّبة صح على اللاعب." },
				{ "new", "صندوق المكافآت: ٤ مهام تفاعلية + ١٠٠٠ كوينز + إنجاز داعم." },
			},
		},
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
	-- 🌐 إيقاف الترجمة التلقائية على حاويات الواجهة (النص العربي يظهر للجميع)
	if class == "ScreenGui" or class == "BillboardGui" or class == "SurfaceGui" then inst.AutoLocalize = false end
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
		ScaleType = Enum.ScaleType.Crop,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromScale(1.12, 1.12), -- تجاوز بسيط للإطار لإخفاء الحواف أثناء التحريك
		Parent = parent,
	})
	-- 🎬 حركة سينمائية بطيئة (Ken Burns): زوم + بان ناعم ذهاباً وإياباً
	task.spawn(function()
		local kb = TweenInfo.new(14, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
		tween(bgImg, kb, {
			Size = UDim2.fromScale(1.26, 1.26),
			Position = UDim2.fromScale(0.5, 0.44),
		})
	end)
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

-- 🔥 توهّج دافئ نابض يحاكي الضوء المتسرّب من باب البوابة (يعطي إحساس حياة وعمق)
if CONFIG.BackgroundImageId and CONFIG.BackgroundImageId > 0 then
	local doorGlow = new("ImageLabel", {
		Name = "DoorGlow", BackgroundTransparency = 1, Image = "rbxassetid://5028857084",
		ImageColor3 = Color3.fromRGB(255, 196, 110), ImageTransparency = 0.55,
		Size = UDim2.fromScale(0.95, 1.05), Position = UDim2.fromScale(0.5, 0.52),
		AnchorPoint = Vector2.new(0.5, 0.5), Parent = root,
	})
	task.spawn(function()
		tween(doorGlow, TweenInfo.new(2.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true), {
			ImageTransparency = 0.32, Size = UDim2.fromScale(1.05, 1.18),
		})
	end)
end

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

	-- لوحة ألوان ملكية ذهبية خاصة بالقائمة (بدل النيون البنفسجي)
	local ROYAL = {
		Gold     = Color3.fromRGB(214, 175, 92),
		GoldHi   = Color3.fromRGB(245, 220, 150),
		GoldDeep = Color3.fromRGB(150, 116, 52),
		CardBg   = Color3.fromRGB(24, 30, 46),
		CardStrk = Color3.fromRGB(74, 88, 116),
		Text     = Color3.fromRGB(238, 242, 250),
		Sub      = Color3.fromRGB(168, 182, 205),
		Dark     = Color3.fromRGB(26, 22, 14),
	}

	-- شعار التاج الذهبي فوق العنوان (مبني من قطع — لا صورة خارجية)
	local crown = new("Frame", {
		Name = "Crown", BackgroundTransparency = 1, Size = UDim2.fromOffset(96, 56),
		Position = UDim2.fromScale(0.5, 0.085), AnchorPoint = Vector2.new(0.5, 0.5), Parent = mRoot,
	})
	local crownParts = {}
	do
		local base = new("Frame", {
			BackgroundColor3 = ROYAL.Gold, BorderSizePixel = 0, BackgroundTransparency = 1,
			AnchorPoint = Vector2.new(0.5, 1), Size = UDim2.fromOffset(64, 16),
			Position = UDim2.new(0.5, 0, 1, -4), Parent = crown,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 4), Parent = base })
		crownParts[#crownParts + 1] = base
		-- ثلاث قمم على شكل معيّن (مربّعات مدوّرة)
		for _, dx in ipairs({ -26, 0, 26 }) do
			local peak = new("Frame", {
				BackgroundColor3 = ROYAL.GoldHi, BorderSizePixel = 0, BackgroundTransparency = 1,
				AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.fromOffset(22, 22), Rotation = 45,
				Position = UDim2.new(0.5, dx, 1, (dx == 0) and -22 or -16), Parent = crown,
			})
			new("UICorner", { CornerRadius = UDim.new(0, 5), Parent = peak })
			crownParts[#crownParts + 1] = peak
		end
	end

	local title = new("TextLabel", {
		Name = "Title", BackgroundTransparency = 1, Text = CONFIG.GameName, RichText = true,
		Font = Enum.Font.GothamBlack, TextSize = 64, TextColor3 = ROYAL.GoldHi, TextTransparency = 1,
		Size = UDim2.new(1, -80, 0, 88), Position = UDim2.fromScale(0.5, 0.18),
		AnchorPoint = Vector2.new(0.5, 0.5), Parent = mRoot,
	})
	new("UIGradient", { Color = ColorSequence.new(ROYAL.GoldHi, ROYAL.Gold), Rotation = 12, Parent = title })
	local titleStroke = new("UIStroke", { Color = ROYAL.GoldDeep, Thickness = 2, Transparency = 1, Parent = title })

	local sub = new("TextLabel", {
		BackgroundTransparency = 1, Text = "بوّابة المدينة الملكية", Font = Enum.Font.GothamMedium,
		TextSize = 20, TextColor3 = ROYAL.Sub, TextTransparency = 1,
		Size = UDim2.new(1, -80, 0, 26), Position = UDim2.fromScale(0.5, 0.275), AnchorPoint = Vector2.new(0.5, 0.5),
		Parent = mRoot,
	})

	local ver = new("TextLabel", {
		BackgroundTransparency = 1, Text = CONFIG.MenuVersion or "", Font = Enum.Font.Gotham,
		TextSize = 14, TextColor3 = PAL.SubText, TextTransparency = 1,
		Size = UDim2.new(1, -40, 0, 20), Position = UDim2.fromScale(0.5, 0.95), AnchorPoint = Vector2.new(0.5, 0.5),
		Parent = mRoot,
	})

	local CARD_W, CARD_H = 468, 104

	local btnHolder = new("Frame", {
		Name = "Buttons", BackgroundTransparency = 1, Size = UDim2.fromOffset(CARD_W + 20, 360),
		Position = UDim2.fromScale(0.5, 0.62), AnchorPoint = Vector2.new(0.5, 0.5), Parent = mRoot,
	})
	new("UIListLayout", {
		FillDirection = Enum.FillDirection.Vertical, HorizontalAlignment = Enum.HorizontalAlignment.Center,
		VerticalAlignment = Enum.VerticalAlignment.Center, Padding = UDim.new(0, 22),
		SortOrder = Enum.SortOrder.LayoutOrder, Parent = btnHolder,
	})

	local menuClosing = false
	local charConn

	-- شريط مدوّر الأطراف (لِبِناء الأيقونات من قطع فقط — لا رموز نصّية)
	local function bar(parent, color, w, h, ox, oy, rot, shownBT)
		local b = new("Frame", {
			BackgroundColor3 = color, BorderSizePixel = 0, BackgroundTransparency = 1,
			AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.fromOffset(w, h),
			Position = UDim2.new(0.5, ox, 0.5, oy), Rotation = rot, ZIndex = 6, Parent = parent,
		})
		b:SetAttribute("ShownBT", shownBT or 0)
		new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = b })
		return b
	end

	-- يرسم أيقونة الخيار داخل وسام دائري
	local function makeIcon(badge, kind, color)
		if kind == "play" then            -- شيفرون يمين «ادخل»
			bar(badge, color, 7, 22, -2, -10, 48)
			bar(badge, color, 7, 22, -2, 10, -48)
		elseif kind == "scroll" then      -- وثيقة قوانين
			local doc = new("Frame", {
				BackgroundTransparency = 1, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5),
				Size = UDim2.fromOffset(30, 36), Position = UDim2.fromScale(0.5, 0.5), ZIndex = 6, Parent = badge,
			})
			new("UICorner", { CornerRadius = UDim.new(0, 5), Parent = doc })
			local ds = new("UIStroke", { Color = color, Thickness = 2.5, Transparency = 1, Parent = doc })
			ds:SetAttribute("ShownT", 0)
			for _, yy in ipairs({ -8, 0, 8 }) do bar(doc, color, 16, 3, 0, yy, 0) end
		elseif kind == "spark" then       -- نجمة تحديثات
			bar(badge, color, 6, 34, 0, 0, 0)
			bar(badge, color, 34, 6, 0, 0, 0)
			bar(badge, color, 6, 20, 0, 0, 45)
			bar(badge, color, 6, 20, 0, 0, 135)
		end
	end

	local META = {
		[1] = { kind = "play",   sub = "ادخل المدينة الآن" },
		[2] = { kind = "scroll", sub = "تعرّف على الهدف والقوانين" },
		[3] = { kind = "spark",  sub = "آخر ما أضفناه للّعبة" },
	}

	local function makeButton(text: string, primary: boolean, order: number)
		local meta = META[order]
		local btn = new("TextButton", {
			Name = "Btn_" .. order, Text = "", AutoButtonColor = false,
			BackgroundColor3 = primary and ROYAL.Gold or ROYAL.CardBg, BackgroundTransparency = 1,
			Size = UDim2.fromOffset(CARD_W, CARD_H), LayoutOrder = order, Parent = btnHolder,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 24), Parent = btn })
		local stroke = new("UIStroke", {
			Color = primary and ROYAL.GoldHi or ROYAL.CardStrk, Thickness = primary and 2 or 1.5, Transparency = 1, Parent = btn,
		})
		stroke:SetAttribute("ShownT", primary and 0 or 0.35)
		if primary then
			new("UIGradient", { Color = ColorSequence.new(ROYAL.Gold, ROYAL.GoldHi), Rotation = 18, Parent = btn })
		end

		local accent = primary and ROYAL.Dark or ROYAL.Gold
		local tcol = primary and ROYAL.Dark or ROYAL.Text
		local scol = primary and Color3.fromRGB(78, 62, 30) or ROYAL.Sub

		-- وسام دائري للأيقونة (يمين البطاقة — RTL)
		local badge = new("Frame", {
			Name = "Badge", BackgroundColor3 = Color3.fromRGB(0, 0, 0), BackgroundTransparency = 1, BorderSizePixel = 0,
			AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.fromOffset(66, 66),
			Position = UDim2.new(1, -52, 0.5, 0), ZIndex = 6, Parent = btn,
		})
		badge:SetAttribute("ShownBT", primary and 0.78 or 0.62)
		new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = badge })
		local bStroke = new("UIStroke", { Color = accent, Thickness = 2, Transparency = 1, Parent = badge })
		bStroke:SetAttribute("ShownT", 0.1)
		makeIcon(badge, meta.kind, accent)

		-- العنوان + السطر الوصفي (محاذاة يمين، يسار الوسام)
		new("TextLabel", {
			Name = "Label", BackgroundTransparency = 1, Text = text, Font = Enum.Font.GothamBold,
			TextSize = 27, TextColor3 = tcol, TextTransparency = 1, TextXAlignment = Enum.TextXAlignment.Right,
			Size = UDim2.new(1, -200, 0, 32), Position = UDim2.new(0, 110, 0, 26), ZIndex = 6, Parent = btn,
		})
		new("TextLabel", {
			Name = "Sub", BackgroundTransparency = 1, Text = meta.sub, Font = Enum.Font.GothamMedium,
			TextSize = 16, TextColor3 = scol, TextTransparency = 1, TextXAlignment = Enum.TextXAlignment.Right,
			Size = UDim2.new(1, -130, 0, 22), Position = UDim2.new(0, 40, 0, 58), ZIndex = 6, Parent = btn,
		})

		-- شيفرون «<» يسار البطاقات الفرعية فقط
		if not primary then
			local chev = new("Frame", {
				Name = "Chev", BackgroundTransparency = 1, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5),
				Size = UDim2.fromOffset(20, 24), Position = UDim2.new(0, 40, 0.5, 0), ZIndex = 6, Parent = btn,
			})
			bar(chev, ROYAL.Gold, 4, 14, 3, -6, 45)
			bar(chev, ROYAL.Gold, 4, 14, 3, 6, -45)
		end

		btn.MouseEnter:Connect(function()
			if menuClosing then return end
			playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Hover)
			tween(btn, TweenInfo.new(0.15), { Size = UDim2.fromOffset(CARD_W + 14, CARD_H + 4) })
			tween(stroke, TweenInfo.new(0.15), { Transparency = 0 })
		end)
		btn.MouseLeave:Connect(function()
			if menuClosing then return end
			tween(btn, TweenInfo.new(0.15), { Size = UDim2.fromOffset(CARD_W, CARD_H) })
			tween(stroke, TweenInfo.new(0.15), { Transparency = stroke:GetAttribute("ShownT") or 0.35 })
		end)
		return btn
	end

	-- يجمع كل العناصر المرئية داخل حاوية ويُخفيها مبدئياً (ليُكشف عنها تدريجياً)
	local function collectReveal(container)
		local reveal = {}
		for _, d in ipairs(container:GetDescendants()) do
			if d:IsA("TextLabel") or d:IsA("TextButton") then
				reveal[#reveal + 1] = { inst = d, key = "TextTransparency", shown = d.TextTransparency }
				d.TextTransparency = 1
			end
			if d:IsA("UIStroke") then
				reveal[#reveal + 1] = { inst = d, key = "Transparency", shown = d.Transparency }
				d.Transparency = 1
			end
			if (d:IsA("Frame") or d:IsA("TextButton") or d:IsA("TextLabel")) and d.BackgroundTransparency < 1 then
				reveal[#reveal + 1] = { inst = d, key = "BackgroundTransparency", shown = d.BackgroundTransparency }
				d.BackgroundTransparency = 1
			end
		end
		return reveal
	end

	-- هيكل البانل المشترك: إطار + عنوان (+ سطر وصفي اختياري) + زر رجوع. يرجّع الحاوية القابلة للتمرير.
	local function panelShell(titleText: string, subText: string?)
		local panel = new("Frame", {
			Name = "Panel", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
			Size = UDim2.fromOffset(660, 520), BackgroundColor3 = ROYAL.CardBg, BackgroundTransparency = 1,
			Visible = false, ZIndex = 5, Parent = mRoot,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 24), Parent = panel })
		new("UIStroke", { Color = ROYAL.CardStrk, Thickness = 1.5, Transparency = 0.25, Parent = panel })
		local pTitle = new("TextLabel", {
			BackgroundTransparency = 1, Text = titleText, Font = Enum.Font.GothamBlack,
			TextSize = 32, TextColor3 = ROYAL.GoldHi, TextTransparency = 0,
			Size = UDim2.new(1, -48, 0, 44), Position = UDim2.new(0.5, 0, 0, 26), AnchorPoint = Vector2.new(0.5, 0),
			ZIndex = 6, Parent = panel,
		})
		new("UIGradient", { Color = ColorSequence.new(ROYAL.GoldHi, ROYAL.Gold), Rotation = 8, Parent = pTitle })
		local headBottom = 80
		if subText then
			new("TextLabel", {
				BackgroundTransparency = 1, Text = subText, Font = Enum.Font.GothamMedium,
				TextSize = 18, TextColor3 = ROYAL.Sub, TextTransparency = 0,
				Size = UDim2.new(1, -48, 0, 24), Position = UDim2.new(0.5, 0, 0, 70), AnchorPoint = Vector2.new(0.5, 0),
				ZIndex = 6, Parent = panel,
			})
			headBottom = 104
		end
		-- خط ذهبي تحت الرأس
		new("Frame", {
			BackgroundColor3 = ROYAL.Gold, BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0),
			Size = UDim2.fromOffset(120, 4), Position = UDim2.new(0.5, 0, 0, headBottom - 6), ZIndex = 6, Parent = panel,
		})
		local scroll = new("ScrollingFrame", {
			Name = "Content", BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.new(1, -44, 1, -(headBottom + 80)),
			Position = UDim2.new(0.5, 0, 0, headBottom + 4), AnchorPoint = Vector2.new(0.5, 0),
			CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y,
			ScrollBarThickness = 5, ScrollBarImageColor3 = ROYAL.Gold, ZIndex = 6, Parent = panel,
		})
		local back = new("TextButton", {
			Text = "رجوع", Font = Enum.Font.GothamBold, TextSize = 20, TextColor3 = ROYAL.Dark, TextTransparency = 0,
			AutoButtonColor = false, BackgroundColor3 = ROYAL.Gold, BackgroundTransparency = 0,
			Size = UDim2.fromOffset(200, 48), Position = UDim2.new(0.5, 0, 1, -24), AnchorPoint = Vector2.new(0.5, 1),
			ZIndex = 6, Parent = panel,
		})
		new("UICorner", { CornerRadius = UDim.new(0, 14), Parent = back })
		new("UIGradient", { Color = ColorSequence.new(ROYAL.Gold, ROYAL.GoldHi), Rotation = 18, Parent = back })
		local backStroke = new("UIStroke", { Color = ROYAL.GoldHi, Thickness = 1.5, Transparency = 0.3, Parent = back })
		back.MouseEnter:Connect(function() playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Hover); tween(backStroke, TweenInfo.new(0.15), { Transparency = 0 }) end)
		back.MouseLeave:Connect(function() tween(backStroke, TweenInfo.new(0.15), { Transparency = 0.3 }) end)
		return panel, scroll, back
	end

	-- بانل القوانين: قائمة أسطر نصّية
	local function makePanel(titleText: string, lines: { string })
		local panel, scroll, back = panelShell(titleText)
		new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder, Parent = scroll })
		new("UIPadding", { PaddingRight = UDim.new(0, 12), PaddingLeft = UDim.new(0, 12), Parent = scroll })
		for i, ln in ipairs(lines) do
			new("TextLabel", {
				BackgroundTransparency = 1, Text = ln, Font = Enum.Font.GothamMedium,
				TextSize = 18, TextColor3 = ROYAL.Text, TextWrapped = true,
				TextXAlignment = Enum.TextXAlignment.Right, AutomaticSize = Enum.AutomaticSize.Y,
				Size = UDim2.new(1, 0, 0, 0), LayoutOrder = i, ZIndex = 6, Parent = scroll,
			})
		end
		return { frame = panel, back = back, reveal = collectReveal(panel) }
	end

	-- ألوان وأسماء وسوم التصنيف في سجلّ التحديثات
	local TAGS = {
		new     = { col = Color3.fromRGB(56, 196, 130), label = "جديد" },
		improve = { col = Color3.fromRGB(86, 162, 240), label = "تحسين" },
		fix     = { col = Color3.fromRGB(232, 176, 86), label = "إصلاح" },
	}

	-- بانل التحديثات: سجلّ احترافي (خطّ زمني + شرائح إصدار + وسوم تصنيف)
	local function makeUpdatesPanel(titleText: string, log)
		local panel, scroll, back = panelShell(titleText, "آخر ما طوّرناه في مدينة شهد")
		new("UIListLayout", { Padding = UDim.new(0, 20), SortOrder = Enum.SortOrder.LayoutOrder, Parent = scroll })
		new("UIPadding", { PaddingRight = UDim.new(0, 14), PaddingLeft = UDim.new(0, 8), PaddingTop = UDim.new(0, 4), Parent = scroll })

		for vi, entry in ipairs(log) do
			local block = new("Frame", {
				Name = "Ver_" .. vi, BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0),
				AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = vi, ZIndex = 6, Parent = scroll,
			})
			new("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder, Parent = block })

			-- صفّ رأس الإصدار: نقطة + شريحة إصدار + تاريخ (RTL → يمين)
			local header = new("Frame", {
				Name = "Head", BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 40), LayoutOrder = 1, ZIndex = 6, Parent = block,
			})
			local dot = new("Frame", {
				BackgroundColor3 = ROYAL.Gold, BorderSizePixel = 0, AnchorPoint = Vector2.new(1, 0.5),
				Size = UDim2.fromOffset(16, 16), Position = UDim2.new(1, 0, 0.5, 0), ZIndex = 7, Parent = header,
			})
			new("UICorner", { CornerRadius = UDim.new(1, 0), Parent = dot })
			new("UIStroke", { Color = ROYAL.GoldHi, Thickness = 2, Parent = dot })
			local pill = new("TextLabel", {
				Name = "Pill", BackgroundColor3 = Color3.fromRGB(58, 46, 20), BackgroundTransparency = 0,
				Text = "الإصدار " .. entry.version, Font = Enum.Font.GothamBold, TextSize = 20, TextColor3 = ROYAL.GoldHi,
				TextXAlignment = Enum.TextXAlignment.Center, AnchorPoint = Vector2.new(1, 0.5),
				Size = UDim2.fromOffset(166, 36), Position = UDim2.new(1, -32, 0.5, 0), ZIndex = 7, Parent = header,
			})
			new("UICorner", { CornerRadius = UDim.new(0, 18), Parent = pill })
			new("UIStroke", { Color = ROYAL.Gold, Thickness = 1, Parent = pill })
			new("TextLabel", {
				BackgroundTransparency = 1, Text = entry.date, Font = Enum.Font.GothamMedium, TextSize = 16, TextColor3 = ROYAL.Sub,
				TextXAlignment = Enum.TextXAlignment.Right, AnchorPoint = Vector2.new(1, 0.5),
				Size = UDim2.fromOffset(120, 24), Position = UDim2.new(1, -210, 0.5, 0), ZIndex = 7, Parent = header,
			})

			-- بطاقة بنود الإصدار
			local vcard = new("Frame", {
				Name = "Card", BackgroundColor3 = Color3.fromRGB(30, 37, 55), BackgroundTransparency = 0, BorderSizePixel = 0,
				Size = UDim2.new(1, -32, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, LayoutOrder = 2, ZIndex = 6, Parent = block,
			})
			new("UICorner", { CornerRadius = UDim.new(0, 16), Parent = vcard })
			new("UIStroke", { Color = Color3.fromRGB(64, 76, 102), Thickness = 1, Parent = vcard })
			new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder, Parent = vcard })
			new("UIPadding", {
				PaddingRight = UDim.new(0, 14), PaddingLeft = UDim.new(0, 14),
				PaddingTop = UDim.new(0, 12), PaddingBottom = UDim.new(0, 12), Parent = vcard,
			})

			for ii, item in ipairs(entry.items) do
				local tag = TAGS[item[1]] or TAGS.new
				local row = new("Frame", {
					BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y,
					LayoutOrder = ii, ZIndex = 6, Parent = vcard,
				})
				local chip = new("TextLabel", {
					BackgroundColor3 = tag.col, BackgroundTransparency = 0.82, Text = tag.label, Font = Enum.Font.GothamBold,
					TextSize = 14, TextColor3 = tag.col, TextXAlignment = Enum.TextXAlignment.Center,
					AnchorPoint = Vector2.new(1, 0), Size = UDim2.fromOffset(62, 26), Position = UDim2.new(1, 0, 0, 1), ZIndex = 7, Parent = row,
				})
				new("UICorner", { CornerRadius = UDim.new(0, 13), Parent = chip })
				new("UIStroke", { Color = tag.col, Thickness = 1, Parent = chip })
				new("TextLabel", {
					BackgroundTransparency = 1, Text = item[2], Font = Enum.Font.GothamMedium, TextSize = 17, TextColor3 = ROYAL.Text,
					TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Right, TextYAlignment = Enum.TextYAlignment.Top,
					AutomaticSize = Enum.AutomaticSize.Y, AnchorPoint = Vector2.new(1, 0),
					Size = UDim2.new(1, -78, 0, 0), Position = UDim2.new(1, -76, 0, 2), ZIndex = 6, Parent = row,
				})
			end
		end

		return { frame = panel, back = back, reveal = collectReveal(panel) }
	end

	local function setPanelVisible(p, visible: boolean)
		local t = visible and 0.3 or 0.25
		if visible then p.frame.Visible = true end
		tween(p.frame, TweenInfo.new(t), { BackgroundTransparency = visible and 0.02 or 1 })
		for _, r in ipairs(p.reveal) do
			tween(r.inst, TweenInfo.new(t), { [r.key] = visible and r.shown or 1 })
		end
		if not visible then
			task.delay(0.26, function() if p.frame then p.frame.Visible = false end end)
		end
	end

	local startBtn = makeButton("بدء اللعبة", true, 1)
	local rulesBtn = makeButton(CONFIG.RulesTitle, false, 2)
	local updatesBtn = makeButton(CONFIG.UpdatesTitle, false, 3)

	local rulesPanel = makePanel(CONFIG.RulesTitle, CONFIG.RulesLines)
	local updatesPanel = makeUpdatesPanel(CONFIG.UpdatesTitle, CONFIG.UpdatesLog)
	rulesPanel.back.MouseButton1Click:Connect(function() playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Click); setPanelVisible(rulesPanel, false) end)
	updatesPanel.back.MouseButton1Click:Connect(function() playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Click); setPanelVisible(updatesPanel, false) end)
	rulesBtn.MouseButton1Click:Connect(function() if menuClosing then return end playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Click); setPanelVisible(rulesPanel, true) end)
	updatesBtn.MouseButton1Click:Connect(function() if menuClosing then return end playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Click); setPanelVisible(updatesPanel, true) end)

	startBtn.MouseButton1Click:Connect(function()
		if menuClosing then return end
		menuClosing = true
		playSound(CONFIG.MenuSounds and CONFIG.MenuSounds.Start, (CONFIG.MenuSoundVolume or 0.5) + 0.2)
		-- إشارة للريسبون الملكي (SpawnCinematic) — يُشغَّل مرّة واحدة عند الدخول فقط.
		-- نرجّع سرعة المشي/القفز لكن نُبقي التحكّم معطّلاً: الريسبون يملك حالة التحكّم
		-- (يعطّله عند البداية ويعيده عند الهبوط) فلا توجد لحظة يتحرّك فيها اللاعب قبل
		-- أن يسيطر المشهد عليه ويرفعه للطائرة.
		LocalPlayer:SetAttribute("RoyalSpawnStart", true)
		-- شبكة أمان: لو لم يتولَّ SpawnCinematic السيطرة خلال مهلة (سكربت مفقود
		-- من البناء أو خطأ في تعريفاته قبل تسجيل المستمع) نُعيد التحكّم حتى لا
		-- يعلق اللاعب بلا حركة. المشهد يضبط RoyalSpawnActive=true عند توليه فعلاً.
		if CONFIG.FreezeOnMenu then
			task.delay(8, function()
				if not LocalPlayer:GetAttribute("RoyalSpawnActive") then setControls(true) end
			end)
		end
		if CONFIG.FreezeOnMenu then freezeChar(nil, false) end
		if charConn then charConn:Disconnect() end
		local shatter = TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		tween(title, shatter, { TextTransparency = 1, TextSize = 42 })
		tween(titleStroke, shatter, { Transparency = 1 })
		tween(sub, shatter, { TextTransparency = 1 })
		tween(ver, shatter, { TextTransparency = 1 })
		for _, cp in ipairs(crownParts) do tween(cp, shatter, { BackgroundTransparency = 1 }) end
		tween(glowA, shatter, { ImageTransparency = 1 })
		tween(glowB, shatter, { ImageTransparency = 1 })
		for _, child in ipairs(btnHolder:GetChildren()) do
			if child:IsA("TextButton") then
				tween(child, shatter, { BackgroundTransparency = 1, Rotation = math.random(-12, 12) })
				for _, d in ipairs(child:GetDescendants()) do
					if d:IsA("TextLabel") then tween(d, shatter, { TextTransparency = 1 })
					elseif d:IsA("UIStroke") then tween(d, shatter, { Transparency = 1 })
					elseif d:IsA("Frame") then tween(d, shatter, { BackgroundTransparency = 1 })
					elseif d:IsA("ImageLabel") then tween(d, shatter, { ImageTransparency = 1 }) end
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
	for _, cp in ipairs(crownParts) do tween(cp, fin, { BackgroundTransparency = 0 }) end
	tween(sub, fin, { TextTransparency = 0 })
	tween(ver, fin, { TextTransparency = 0.3 })
	task.delay(0.15, function()
		for _, child in ipairs(btnHolder:GetChildren()) do
			if child:IsA("TextButton") then
				tween(child, TweenInfo.new(0.4), { BackgroundTransparency = (child.Name == "Btn_1") and 0 or 0.04 })
				for _, d in ipairs(child:GetDescendants()) do
					if d:IsA("TextLabel") then tween(d, TweenInfo.new(0.4), { TextTransparency = d:GetAttribute("ShownTT") or 0 })
					elseif d:IsA("UIStroke") then tween(d, TweenInfo.new(0.4), { Transparency = d:GetAttribute("ShownT") or 0.2 })
					elseif d:IsA("Frame") then tween(d, TweenInfo.new(0.4), { BackgroundTransparency = d:GetAttribute("ShownBT") or 0 })
					elseif d:IsA("ImageLabel") then tween(d, TweenInfo.new(0.4), { ImageTransparency = d:GetAttribute("ShownIT") or 0 }) end
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
	else
		-- لا توجد قائمة: شغّل الريسبون الملكي مباشرةً عند انتهاء التحميل
		LocalPlayer:SetAttribute("RoyalSpawnStart", true)
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
