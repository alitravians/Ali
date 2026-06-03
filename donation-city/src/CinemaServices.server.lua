--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  خدمات السينما — CINEMA SERVICES (Server)                             ║
	║  المكان: ServerScriptService   ·   النوع: Script                       ║
	║                                                                        ║
	║  المرحلة ٢ — اللوبي والاقتصاد:                                          ║
	║   • عملة «كوينز» (leaderstats) مع حفظ DataStore + دخل تلقائي.          ║
	║   • شبّاك تذاكر (Box Office) أمام المدخل: شراء تذكرة بالكوينز.          ║
	║   • لوحة عروض (Showtimes) حيّة تعرض الفيلم الحالي وحالته.               ║
	║   • قائمة أفلام احترافية (Movie Selection GUI) عبر CinemaClient.       ║
	║                                                                        ║
	║  API:  _G.GetCoins(p) · _G.AddCoins(p,n) · _G.SpendCoins(p,n)->bool    ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local Players            = game:GetService("Players")
local Workspace          = game:GetService("Workspace")
local ServerScriptService= game:GetService("ServerScriptService")
local ReplicatedStorage  = game:GetService("ReplicatedStorage")
local DataStoreService   = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")

------------------------------------------------------------------------
-- CONFIG
------------------------------------------------------------------------
local CONFIG = {
	StartCoins    = 100,   -- رصيد اللاعب الجديد
	IncomeAmount  = 5,     -- كوينز كل دورة دخل
	IncomeEvery   = 30,    -- ثواني بين كل دخل تلقائي
	TicketPrice   = 30,    -- سعر التذكرة بالكوينز
	VipTicketPrice= 15,    -- سعر التذكرة لأعضاء VIP (خصم)
	VipPrice      = 500,   -- سعر عضوية VIP بالكوينز (الترقية داخل اللعبة)
	VipGamePassId = 1859204767, -- ⬅️ Game Pass «⭐ عضوية VIP» — تفعيل الشراء بالـ Robux (دخل حقيقي)
	-- 🎟️ باقات دائمة إضافية (Game Passes) — تظهر تلقائياً في المتجر وتُفعّل مزاياها برمجياً
	BuffetGamePassId     = 1861433203, -- 🍿 بوفيه مفتوح — 99 R$
	ShowrunnerGamePassId = 1860580500, -- 🎬 مالك العرض — 199 R$
	NeonTrailGamePassId  = 1862887909, -- ✨ أثر نيون — 79 R$
	AnnouncerGamePassId  = 1860172487, -- 📢 مايك الإعلان — 89 R$
	SpeedGamePassId      = 1861667386, -- ⚡ سرعة البرق — 60 R$ (تحكّم بسرعة المشي)
	-- حدود سرعة المشي لباقة «سرعة البرق» — السيرفر يثبّت القيمة دائماً (حماية من الغش)
	SpeedMin      = 16,    -- السرعة الافتراضية في روبلوكس (الحد الأدنى)
	SpeedMax      = 32,    -- أقصى سرعة مسموحة لحامل الباقة (زيادة واقعية لا «طيران»)
	SpeedDefault  = 24,    -- سرعة البداية بعد الشراء
	VipIncomeMult = 2,     -- مضاعف الدخل لأعضاء VIP
	SaveEvery     = 60,    -- حفظ دوري (ثواني)
	CurrencyName  = "كوينز",
	AdminIds      = { [2771986878] = true }, -- 👑 المخوّلون بلوحة الإدارة (Queen_Tarif)
	-- فتح لوحة الإدارة يعتمد على الرتبة فقط (مشرف فأعلى)، والمالك ثابت بالـ UserId.
	-- لا يوجد «كود دخول» مخزّن في الكود — فلا توجد بصمة قابلة للتخمين من المستودع.
}

-- أفلام السينما (Modular — أضف أفلاماً جديدة هنا مستقبلاً)
local FILMS = {
	{
		id = "donation_city",
		title = "مدينة التبرعات",
		genre = "دراما · عائلي",
		duration = "دقيقة — دقيقتان",
		rating = "للعائلة",
		synopsis = "رحلة كرمٍ تجمع أهل المدينة... كل تبرّع يصنع فرقاً.",
		accent = { 168, 92, 255 },
	},
}

------------------------------------------------------------------------
-- DataStore (محمي بـ pcall — يعمل بأمان حتى لو تعطّل المتجر)
------------------------------------------------------------------------
local coinStore
pcall(function() coinStore = DataStoreService:GetDataStore("CinemaCoins_v1") end)

local applyAllPasses  -- forward declaration (فحص ومنح الباقات الدائمة عند الدخول)
local applySpeed      -- forward declaration: تثبيت سرعة المشي لحامل باقة «سرعة البرق»
local canUseAnnouncer -- forward declaration: من يحق له الإعلان (مشرف فأعلى / VIP / حامل الباقة)
local sendPerks       -- forward declaration: إبلاغ العميل بالأزرار الخاصة (يُستدعى من منح VIP أيضاً)
local drainPendingGrants -- forward declaration: تسليم مشتريات Robux المؤجّلة (لمن خرج أثناء المعالجة) عند عودته
local sessions = {}  -- userId -> { coins = n, value = IntValue, vip = bool, passes = {} }

local function loadCoins(userId: number): number
	if not coinStore then return CONFIG.StartCoins end
	local ok, data = pcall(function() return coinStore:GetAsync("c_" .. userId) end)
	if ok and type(data) == "number" then return data end
	return CONFIG.StartCoins
end

local function loadVip(userId: number): boolean
	if not coinStore then return false end
	local ok, data = pcall(function() return coinStore:GetAsync("v_" .. userId) end)
	return (ok and data == true) or false
end

-- تحميل سرعة المشي المحفوظة لحامل باقة «سرعة البرق» (افتراضي إن لم تُحفظ بعد)
local function loadSpeed(userId: number): number
	if not coinStore then return CONFIG.SpeedDefault end
	local ok, data = pcall(function() return coinStore:GetAsync("spd_" .. userId) end)
	if ok and type(data) == "number" then return data end
	return CONFIG.SpeedDefault
end

-- حفظ مع إعادة المحاولة (3 محاولات) — يصمد أمام تذبذب الشبكة/خنق DataStore
-- خصوصاً عند الخروج (PlayerRemoving) وإغلاق السيرفر (BindToClose).
local function setAsyncRetry(key: string, value)
	for _ = 1, 3 do
		if pcall(function() coinStore:SetAsync(key, value) end) then return true end
		task.wait(1)
	end
	return false
end

-- حفظ ذكي: نكتب فقط المفاتيح التي تغيّرت فعلاً عن آخر حفظ ناجح (s._saved)
-- لتخفيف ضغط طلبات DataStore (ميزانية ~60+10×لاعب/دقيقة) وتجنّب الخنق.
local HttpService = game:GetService("HttpService")
local function saveCoins(userId: number)
	local s = sessions[userId]
	if not s or not coinStore then return end
	s._saved = s._saved or {}
	if s._saved.coins ~= s.coins then
		if setAsyncRetry("c_" .. userId, s.coins) then s._saved.coins = s.coins end
	end
	local vip = s.vip == true
	if s._saved.vip ~= vip then
		if setAsyncRetry("v_" .. userId, vip) then s._saved.vip = vip end
	end
	local achEnc = HttpService:JSONEncode(s.ach or {})
	if s._saved.ach ~= achEnc then
		if setAsyncRetry("a_" .. userId, s.ach or {}) then s._saved.ach = achEnc end
	end
	local rated = s.rated == true
	if s._saved.rated ~= rated then
		if setAsyncRetry("rt_" .. userId, rated) then s._saved.rated = rated end
	end
	local spd = math.floor(tonumber(s.speed) or CONFIG.SpeedDefault)
	if s._saved.speed ~= spd then
		if setAsyncRetry("spd_" .. userId, spd) then s._saved.speed = spd end
	end
end

local function setCoins(player: Player, amount: number)
	local s = sessions[player.UserId]
	if not s then return end
	s.coins = math.max(0, math.floor(amount))
	if s.value then s.value.Value = s.coins end
	player:SetAttribute("Coins", s.coins)
	if s.coins >= 1000 and _G.AwardAchievement then _G.AwardAchievement(player, "rich") end
end

------------------------------------------------------------------------
-- public API
------------------------------------------------------------------------
_G.GetCoins = function(player: Player): number
	local s = sessions[player.UserId]
	return s and s.coins or 0
end

_G.AddCoins = function(player: Player, n: number)
	local s = sessions[player.UserId]
	if not s then return end
	setCoins(player, s.coins + n)
end

_G.SpendCoins = function(player: Player, n: number): boolean
	local s = sessions[player.UserId]
	if not s or s.coins < n then return false end
	setCoins(player, s.coins - n)
	return true
end

_G.IsVIP = function(player: Player): boolean
	local s = sessions[player.UserId]
	return (s and s.vip == true) or false
end

local function ticketPriceFor(player: Player): number
	return _G.IsVIP(player) and CONFIG.VipTicketPrice or CONFIG.TicketPrice
end

-- شارة VIP فوق رأس اللاعب (BillboardGui ذهبية)
local function applyVipTag(player: Player)
	local function tag(char: Model)
		local s = sessions[player.UserId]
		if not (s and s.vip) then return end  -- لا تعرض التاج لمن سُحبت منه VIP
		local head = char:WaitForChild("Head", 8)
		if not head or head:FindFirstChild("VipTag") then return end
		local bb = Instance.new("BillboardGui")
		bb.Name = "VipTag"; bb.Adornee = head; bb.Size = UDim2.fromOffset(120, 34)
		bb.StudsOffsetWorldSpace = Vector3.new(0, 2.6, 0); bb.AlwaysOnTop = true
		bb.Parent = head
		local lbl = Instance.new("TextLabel")
		lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
		lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
		lbl.TextColor3 = Color3.fromRGB(255, 205, 90)
		lbl.TextStrokeTransparency = 0.3
		lbl.Text = "⭐ VIP"
		lbl.Parent = bb
	end
	if player.Character then task.spawn(tag, player.Character) end
	player.CharacterAdded:Connect(function(char) task.spawn(tag, char) end)
end

-- منح عضوية VIP (تُستدعى من شراء الكوينز أو امتلاك الـ Game Pass)
local function grantVip(player: Player, announce: boolean?): boolean
	local s = sessions[player.UserId]
	if not s or s.vip then return false end
	s.vip = true
	player:SetAttribute("VIP", true)
	applyVipTag(player)
	if _G.AwardAchievement then _G.AwardAchievement(player, "vip") end
	if sendPerks then sendPerks(player) end  -- 📢 يظهر زر الإعلان فوراً لعضو VIP الجديد
	pcall(function() saveCoins(player.UserId) end)
	if announce ~= false and _G.NotifyPlayer then
		_G.NotifyPlayer(player, "⭐ مبروك! صرت عضو VIP — لاونج خاص، تذاكر بنص السعر، دخل مضاعف، وتاج ذهبي.")
	end
	return true
end

-- سحب عضوية VIP (من لوحة الإدارة)
local function revokeVip(player: Player): boolean
	local s = sessions[player.UserId]
	if not s or not s.vip then return false end
	s.vip = false
	player:SetAttribute("VIP", false)
	if player.Character then
		local head = player.Character:FindFirstChild("Head")
		local t = head and head:FindFirstChild("VipTag")
		if t then t:Destroy() end
	end
	if sendPerks then sendPerks(player) end  -- 📢 يخفي زر الإعلان فوراً عند سحب VIP (إن لم يكن مشرفاً)
	pcall(function() saveCoins(player.UserId) end)
	return true
end

------------------------------------------------------------------------
-- player lifecycle
------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player)
	local coins = loadCoins(player.UserId)
	local stats = player:FindFirstChild("leaderstats")
	if not stats then
		stats = Instance.new("Folder")
		stats.Name = "leaderstats"
		stats.Parent = player
	end
	local value = stats:FindFirstChild(CONFIG.CurrencyName)
	if not value then
		value = Instance.new("IntValue")
		value.Name = CONFIG.CurrencyName
		value.Parent = stats
	end
	local vip = loadVip(player.UserId)
	local ach, rated = {}, false
	if coinStore then
		pcall(function() local d = coinStore:GetAsync("a_" .. player.UserId); if type(d) == "table" then ach = d end end)
		pcall(function() rated = coinStore:GetAsync("rt_" .. player.UserId) == true end)
	end
	local speed = loadSpeed(player.UserId)
	sessions[player.UserId] = { coins = coins, value = value, vip = vip, ach = ach, rated = rated, passes = {}, speed = speed,
		-- بصمة آخر قيم محفوظة (تُهيّأ بالقيم المُحمّلة) كي لا نعيد كتابة ما لم يتغيّر
		_saved = { coins = coins, vip = vip == true, ach = HttpService:JSONEncode(ach), rated = rated == true, speed = math.floor(speed) } }
	setCoins(player, coins)
	player:SetAttribute("VIP", vip)
	if vip then applyVipTag(player) end

	-- من يملك الـ Game Pass يحصل على VIP تلقائياً (دخل حقيقي بالـ Robux)
	if CONFIG.VipGamePassId ~= 0 then
		task.spawn(function()
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, CONFIG.VipGamePassId)
			end)
			if ok and owns then grantVip(player, not vip) end
		end)
	end

	-- فحص ومنح الباقات الدائمة الإضافية (بوفيه/مالك العرض/أثر نيون/مايك الإعلان)
	if applyAllPasses then task.spawn(applyAllPasses, player) end

	-- 🛟 سلّم أي مشتريات Robux مؤجّلة (لو خرج اللاعب أثناء معالجة الإيصال سابقاً)
	if drainPendingGrants then task.spawn(drainPendingGrants, player) end
end)

Players.PlayerRemoving:Connect(function(player)
	saveCoins(player.UserId)
	sessions[player.UserId] = nil
end)

game:BindToClose(function()
	-- حفظ متوازٍ لكل اللاعبين: يتفادى تجاوز مهلة الإغلاق (30s) لو فيه عدد كبير باللحظة الأخيرة
	local pending = 0
	for userId in pairs(sessions) do
		pending += 1
		task.spawn(function()
			pcall(saveCoins, userId)
			pending -= 1
		end)
	end
	local t0 = os.clock()
	while pending > 0 and (os.clock() - t0) < 25 do
		task.wait(0.1)
	end
end)

-- حفظ دوري (بلا دخل تلقائي — اقتصاد قائم على النشاط فقط)
-- ملاحظة اقتصادية: أُلغي الدخل التلقائي «+كوينز لمجرد البقاء» نهائياً.
-- الكوينز تُكتسب الآن من نشاط فعلي فقط (المهام/الباركور/الأركيد).
task.spawn(function()
	while true do
		task.wait(CONFIG.SaveEvery)
		-- حفظ دوري متوازٍ (خيط لكل لاعب) — يتفادى خنق DataStore عند عدد لاعبين كبير،
		-- مع الحفظ الذكي (saveCoins يكتب المتغيّر فقط) يبقى الضغط ضمن الميزانية.
		for userId in pairs(sessions) do
			task.spawn(function() pcall(saveCoins, userId) end)
		end
	end
end)

------------------------------------------------------------------------
-- Remotes
------------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("CinemaRemotes")
if not remotes then
	remotes = Instance.new("Folder")
	remotes.Name = "CinemaRemotes"
	remotes.Parent = ReplicatedStorage
end
local lobbyRemote = remotes:FindFirstChild("Lobby")
if not lobbyRemote then
	lobbyRemote = Instance.new("RemoteEvent")
	lobbyRemote.Name = "Lobby"
	lobbyRemote.Parent = remotes
end

------------------------------------------------------------------------
-- 🖼️ محوّل خلفية اللودينغ: رقم الـ Decal لا يُرسَم مباشرة في ImageLabel،
-- نحتاج رقم الصورة الداخلي (Texture). نحمّل الـ Decal على السيرفر عبر
-- InsertService ونستخرج رقم الصورة الحقيقي، ونخزّنه في StringValue يقرأه
-- العميل (شاشة اللودينغ + القائمة الرئيسية). الطريقة الرسمية الموصى بها.
------------------------------------------------------------------------
-- 🎯 مصدران منفصلان للصورة (مفصولان عمداً):
--   • القائمة الرئيسية (شاشة اللودينغ) → خلفية «الشفق القطبي» الجديدة.
--   • شاشة النافورة (CustomImageScreen) → تبقى صورة البنت الأصلية بدون تغيير.
local MENU_BG_DECAL_ID     = 80412693584456 -- خلفية القائمة الرئيسية (شفق قطبي، Decal جديد)
local FOUNTAIN_BG_DECAL_ID = 93628047304202 -- صورة النافورة الأصلية (تبقى كما هي)
local bgValue = ReplicatedStorage:FindFirstChild("LoadingBgImage")
if not bgValue then
	bgValue = Instance.new("StringValue")
	bgValue.Name = "LoadingBgImage"
	bgValue.Value = "" -- يبقى فارغاً حتى يُحلّ الرقم، فيستخدم العميل خلفيته النيون مؤقتاً
	bgValue.Parent = ReplicatedStorage
end
-- يطبّق رقم الصورة المُحلّ على شاشة الصورة المخصّصة. الشاشة الآن على «المربّع
-- المضيء» داخل النافورة الجديدة (SurfaceGui اسمها CustomImageScreen). نبحث عنها
-- في أي مكان بالـ Workspace، نضبط Image على السيرفر فيتكرّر للجميع، ونخفي
-- نص التلميح بمجرّد ظهور الصورة.
local function applyCustomScreen(texture)
	if not texture or texture == "" then return false end
	local applied = false
	for _, sg in ipairs(Workspace:GetDescendants()) do
		if sg:IsA("SurfaceGui") and sg.Name == "CustomImageScreen" then
			local img = sg:FindFirstChild("Image", true)
			if img and img:IsA("ImageLabel") then
				img.Image = texture
				img.BackgroundTransparency = 1
				local hint = img:FindFirstChild("Hint")
				if hint then hint.Visible = false end
				applied = true
			end
		end
	end
	return applied
end

-- يحوّل رقم الـ Decal إلى رقم الصورة الداخلي (Texture) عبر InsertService.
-- يُعيد سلسلة rbxassetid أو nil. (الـ Decal لا يُرسَم مباشرة في ImageLabel.)
local function resolveDecalTexture(decalId)
	local InsertService = game:GetService("InsertService")
	local ok, model = pcall(function()
		return InsertService:LoadAsset(decalId)
	end)
	if ok and model then
		local decal = model:FindFirstChildWhichIsA("Decal", true)
		local tex = decal and decal.Texture
		model:Destroy()
		if tex and tex ~= "" then return tex end
	end
	return nil
end

-- محاولات متكرّرة: الصورة (Decal) قد تكون جديدة جداً (تحت المعالجة/المراجعة) أو
-- يتأخّر تحميلها، فنعيد المحاولة عدّة مرّات بفواصل متزايدة بدل محاولة واحدة.
-- طبقة احتياطية: نجرّب أيضاً ضبط رقم الـ Decal مباشرة (بعض الإصدارات تحلّه ذاتياً).
-- (أ) خلفية القائمة الرئيسية → الشفق القطبي الجديد. نحلّه ونخزّنه في
--     LoadingBgImage فقط (يقرأه عميل القائمة) — لا يمسّ شاشة النافورة.
task.spawn(function()
	local delays = { 0, 3, 5, 8, 12, 20, 30 }   -- ~78s إجمالاً عبر عدة محاولات
	for _, wait_s in ipairs(delays) do
		if wait_s > 0 then task.wait(wait_s) end
		local tex = resolveDecalTexture(MENU_BG_DECAL_ID)
		if tex then
			bgValue.Value = tex                  -- رقم الصورة الحقيقي (rbxassetid://...)
			return
		end
	end
	warn("[MenuBG] تعذّر تحويل رقم الـ Decal " .. MENU_BG_DECAL_ID ..
		" إلى صورة بعد عدّة محاولات — تأكّد أنّ الصورة Public ومُعتمدة، وأنّ اللعبة لنفس الحساب المالك.")
end)

-- (ب) شاشة النافورة (CustomImageScreen) → تبقى صورة البنت الأصلية بدون تغيير.
task.spawn(function()
	local idStr = "rbxassetid://" .. FOUNTAIN_BG_DECAL_ID
	-- طبقة أولى فورية: اعرض رقم الـ Decal مباشرة (يظهر فوراً لو حلّه المحرّك).
	applyCustomScreen(idStr)

	local delays = { 0, 3, 5, 8, 12, 20, 30 }   -- ~78s إجمالاً عبر عدة محاولات
	for _, wait_s in ipairs(delays) do
		if wait_s > 0 then task.wait(wait_s) end
		local tex = resolveDecalTexture(FOUNTAIN_BG_DECAL_ID)
		if tex then
			applyCustomScreen(tex)
			return
		end
	end
	warn("[FountainImage] تعذّر تحويل رقم الـ Decal " .. FOUNTAIN_BG_DECAL_ID ..
		" إلى صورة بعد عدّة محاولات — تأكّد أنّ الصورة Public ومُعتمدة، وأنّ اللعبة لنفس الحساب المالك.")
end)

local cinema = Workspace:WaitForChild("Cinema")

local function notify(player, text)
	if _G.NotifyPlayer then _G.NotifyPlayer(player, text) else print(text) end
end

local freeTicketAt = {}  -- [UserId] = os.clock() لآخر تذكرة مجانية (كولداون دقيقتين)
-- نظّف مؤقّت التذكرة المجانية عند خروج اللاعب (تفادي نموّ الجدول بلا حدّ)
Players.PlayerRemoving:Connect(function(player) freeTicketAt[player.UserId] = nil end)

local function openBoxOffice(player)
	lobbyRemote:FireClient(player, {
		action      = "boxoffice",
		films       = FILMS,
		coins       = _G.GetCoins(player),
		tickets     = _G.GetTickets and _G.GetTickets(player) or 0,
		ticketPrice = ticketPriceFor(player),
		vip         = _G.IsVIP(player),
		vipPrice    = CONFIG.VipPrice,
		playing     = cinema:GetAttribute("Playing") or false,
		remain      = cinema:GetAttribute("Remain") or 0,
	})
end

------------------------------------------------------------------------
-- 🎟️ الباقات الدائمة الإضافية (Game Passes): بوفيه · مالك العرض · أثر نيون · مايك الإعلان
------------------------------------------------------------------------
local PASS_DEFS = {
	{ key = "buffet",     id = CONFIG.BuffetGamePassId,     badge = "🍿",
	  msg = "🍿 تم تفعيل «بوفيه مفتوح» — أكل ومشروب مجاني بلا حدود من بسطة الوجبات!" },
	{ key = "showrunner", id = CONFIG.ShowrunnerGamePassId, badge = "🎬",
	  msg = "🎬 تم تفعيل «مالك العرض» — تقدر تبدأ الفيلم بأي وقت من زر «ابدأ العرض»." },
	{ key = "neon",       id = CONFIG.NeonTrailGamePassId,  badge = "✨",
	  msg = "✨ تم تفعيل «أثر نيون» — توهّج حصري سماوي↔وردي يتبع خطواتك!" },
	{ key = "announcer",  id = CONFIG.AnnouncerGamePassId,  badge = "📢",
	  msg = "📢 تم تفعيل «مايك الإعلان» — تقدر تبثّ إعلاناتك لكل اللاعبين." },
	{ key = "speed",      id = CONFIG.SpeedGamePassId,      badge = "⚡",
	  msg = "⚡ تم تفعيل «سرعة البرق» — تحكّم بسرعة مشيك من شريط التمرير داخل المتجر!" },
}

local function ownsPassKey(player: Player, key: string): boolean
	local s = sessions[player.UserId]
	return (s and s.passes and s.passes[key]) == true
end
_G.OwnsCinemaPass = ownsPassKey

-- ⚡ سرعة البرق: تثبيت سرعة المشي على السيرفر (حماية من الغش)
-- القيمة دائماً محصورة بين SpeedMin و SpeedMax وتُطبّق فقط لمن يملك الباقة.
local function clampSpeed(v: number?): number
	local n = tonumber(v) or CONFIG.SpeedDefault
	return math.clamp(math.floor(n), CONFIG.SpeedMin, CONFIG.SpeedMax)
end

applySpeed = function(player: Player)
	local s = sessions[player.UserId]
	if not s then return end
	local owns = s.passes ~= nil and s.passes.speed == true
	-- السرعة الأساسية: المالك = اختياره (محصور)، غير المالك = الحد الأدنى (16)
	local base = owns and clampSpeed(s.speed) or CONFIG.SpeedMin
	-- نُعلن السرعة الأساسية كسِمة كي يبني عليها نظام الجري (SprintJump) بدل رقم ثابت
	-- (السِمات التي يضبطها السيرفر تتزامن للعميل تلقائياً)
	player:SetAttribute("BaseWalkSpeed", base)
	local char = player.Character
	if not char then return end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum then return end
	-- نطبّق السرعة فقط للمالك؛ غير المالك يُترك لبقية الأنظمة (الجري/السينما) كما هو
	if owns then
		hum.WalkSpeed = base
	end
end

-- ✨ أثر نيون يتبع اللاعب (Trail على الجذع)
local function applyNeonTrail(player: Player)
	local char = player.Character
	if not char then return end
	task.spawn(function()
		local root = char:FindFirstChild("HumanoidRootPart") or char:WaitForChild("HumanoidRootPart", 8)
		if not root or root:FindFirstChild("NeonTrail") then return end
		local a0 = Instance.new("Attachment"); a0.Name = "NeonTrailTop";    a0.Position = Vector3.new(0,  1.6, 0); a0.Parent = root
		local a1 = Instance.new("Attachment"); a1.Name = "NeonTrailBottom"; a1.Position = Vector3.new(0, -1.6, 0); a1.Parent = root
		local trail = Instance.new("Trail")
		trail.Name = "NeonTrail"
		trail.Attachment0 = a0; trail.Attachment1 = a1
		trail.Lifetime = 0.65; trail.MinLength = 0.05; trail.LightEmission = 1; trail.FaceCamera = true
		trail.Color = ColorSequence.new(Color3.fromRGB(70, 226, 255), Color3.fromRGB(255, 90, 200))
		trail.Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.05),
			NumberSequenceKeypoint.new(1, 1),
		})
		trail.WidthScale = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 1),
			NumberSequenceKeypoint.new(1, 0),
		})
		trail.Parent = root
	end)
end

-- شارة الباقات فوق الرأس (تجمع رموز الباقات المملوكة في سطر واحد)
local function refreshBadge(player: Player)
	local s = sessions[player.UserId]
	if not s then return end
	local emojis = {}
	for _, d in ipairs(PASS_DEFS) do
		if s.passes and s.passes[d.key] then table.insert(emojis, d.badge) end
	end
	local char = player.Character
	if not char then return end
	local head = char:FindFirstChild("Head")
	if not head then return end
	local bb = head:FindFirstChild("PassBadge")
	if #emojis == 0 then if bb then bb:Destroy() end return end
	if not bb then
		bb = Instance.new("BillboardGui")
		bb.Name = "PassBadge"; bb.Adornee = head; bb.Size = UDim2.fromOffset(150, 30)
		bb.StudsOffsetWorldSpace = Vector3.new(0, 3.4, 0); bb.AlwaysOnTop = true
		bb.Parent = head
		local lbl = Instance.new("TextLabel")
		lbl.Name = "L"; lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
		lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
		lbl.TextColor3 = Color3.fromRGB(255, 205, 90); lbl.TextStrokeTransparency = 0.3
		lbl.Parent = bb
	end
	local L = bb:FindFirstChild("L")
	if L then L.Text = table.concat(emojis, " ") end
end

-- إبلاغ العميل بالباقات لإظهار الأزرار الخاصة (مالك العرض / مايك الإعلان)
sendPerks = function(player: Player)
	-- 📢 الإعلان متاح لحاملي الباقة + كل مشرف فأعلى (يُحسب عبر canUseAnnouncer)
	local mayAnnounce = ownsPassKey(player, "announcer")
		or (canUseAnnouncer ~= nil and canUseAnnouncer(player))
	local s = sessions[player.UserId]
	lobbyRemote:FireClient(player, {
		action     = "perks",
		showrunner = ownsPassKey(player, "showrunner"),
		announcer  = mayAnnounce,
		buffet     = ownsPassKey(player, "buffet"),
		neon       = ownsPassKey(player, "neon"),
		-- ⚡ تحكّم السرعة: العميل يعرف هل يملك الباقة + القيمة الحالية والحدود
		speed      = ownsPassKey(player, "speed"),
		speedValue = clampSpeed(s and s.speed),
		speedMin   = CONFIG.SpeedMin,
		speedMax   = CONFIG.SpeedMax,
	})
end

-- منح باقة (تُستدعى عند الدخول لمن يملكها أو بعد إتمام الشراء)
local function grantPass(player: Player, key: string, announce: boolean?)
	local s = sessions[player.UserId]
	if not s then return end
	s.passes = s.passes or {}
	if s.passes[key] then return end
	s.passes[key] = true
	if key == "neon" then applyNeonTrail(player) end
	if key == "speed" then
		-- أول مرة: ابدأ بالسرعة الافتراضية إن لم تكن محفوظة، ثم طبّق
		if not tonumber(s.speed) then s.speed = CONFIG.SpeedDefault end
		applySpeed(player)
	end
	refreshBadge(player)
	if _G.AwardAchievement then _G.AwardAchievement(player, "buyer") end
	for _, d in ipairs(PASS_DEFS) do
		if d.key == key and announce ~= false then notify(player, d.msg) end
	end
end

-- معرّف الباقة → مفتاحها (للتحقق عند الشراء)
local function passKeyById(id: number): string?
	for _, d in ipairs(PASS_DEFS) do
		if d.id ~= 0 and d.id == id then return d.key end
	end
	return nil
end

-- فحص كل الباقات عند دخول اللاعب + تثبيت المؤثرات على كل ظهور للشخصية
applyAllPasses = function(player: Player)
	local s = sessions[player.UserId]
	if not s then return end
	s.passes = s.passes or {}
	for _, d in ipairs(PASS_DEFS) do
		if d.id ~= 0 then
			local ok, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, d.id)
			end)
			if ok and owns then grantPass(player, d.key, false) end
		end
	end
	sendPerks(player)
	applySpeed(player)  -- ⚡ ثبّت السرعة فوراً لو الشخصية موجودة
	-- أعد تطبيق الأثر/الشارة/السرعة عند كل ولادة للشخصية
	player.CharacterAdded:Connect(function()
		task.wait(0.5)
		if s.passes.neon then applyNeonTrail(player) end
		refreshBadge(player)
		applySpeed(player)
	end)
end

------------------------------------------------------------------------
-- لوحة الإدارة (محمية: UserId مخوّل + كود دخول)
------------------------------------------------------------------------
local function isAdmin(player: Player): boolean
	return CONFIG.AdminIds[player.UserId] == true
end

-- كشف للدردشة المخصّصة لتمييز اسم صاحب الماب 👑
_G.IsGameAdmin = function(player: Player): boolean
	return player ~= nil and isAdmin(player)
end

------------------------------------------------------------------------
-- 🏷️ نظام الرتب الإدارية (Owner > Admin > Moderator > Staff)
-- محفوظة بـ DataStore (تعمل تلقائياً في اللعبة المنشورة) مع احتياطي بالذاكرة.
--   • Owner   : كل الصلاحيات + إدارة الأدمن والمشرفين (CONFIG.AdminIds — ثابت).
--   • Admin   : كتم/فك/تحذير/طرد + إدارة المشرفين (Mod/Staff) + رسائل إدارية.
--   • Moderator: كتم/فك/تحذير + رسائل إدارية.
--   • Cinema Staff: استقبال فقط — بدون صلاحيات (وسم ذهبي).
------------------------------------------------------------------------
local RANK_W = { owner = 4, admin = 3, mod = 2, staff = 1, [""] = 0 }

local rankStore
pcall(function() rankStore = DataStoreService:GetDataStore("CinemaRanks_v1") end)

-- الكاش بالذاكرة: [userId(number)] = { rank = "admin"/"mod"/"staff", name = "..." }
local ranks = {}

local function loadRanks()
	if not rankStore then return end
	local ok, data = pcall(function() return rankStore:GetAsync("index") end)
	if ok and type(data) == "table" then
		for k, v in pairs(data) do
			local uid = tonumber(k)
			if uid and type(v) == "table" and RANK_W[v.rank] then
				ranks[uid] = { rank = v.rank, name = tostring(v.name or ("#" .. uid)) }
			end
		end
	end
end

local function saveRanks()
	if not rankStore then return end
	local out = {}
	for uid, v in pairs(ranks) do
		out[tostring(uid)] = { rank = v.rank, name = v.name }  -- مفاتيح نصية آمنة للـ JSON
	end
	pcall(function() rankStore:SetAsync("index", out) end)
end

loadRanks()

-- رتبة لاعب (يدمج: المالك من CONFIG ثم المخزّنة)
local function rankOfId(uid: number?): string
	if not uid then return "" end
	if CONFIG.AdminIds[uid] then return "owner" end
	local r = ranks[uid]
	return (r and r.rank) or ""
end

local function rankOf(player: Player): string
	return player and rankOfId(player.UserId) or ""
end

local function weightOf(player: Player): number
	return RANK_W[rankOf(player)] or 0
end

-- 📢 يحق له الإعلان: كل مشرف فأعلى (مشرف/أدمن/مالك) أو عضو VIP. تُستخدم في sendPerks وأمر announcerSay.
canUseAnnouncer = function(player: Player): boolean
	if weightOf(player) >= RANK_W.mod then return true end
	return (_G.IsVIP and _G.IsVIP(player)) == true
end

-- كشف للدردشة المخصّصة: رتبة الاسم (owner/admin/mod/staff/vip/"")
_G.GetChatRank = function(player: Player): string
	local r = rankOf(player)
	if r ~= "" then return r end
	if _G.IsVIP and _G.IsVIP(player) then return "vip" end
	return ""
end

-- يبلّغ العميل برتبته (لإظهار زر الإدارة + إخفاء/إظهار الأزرار حسب الصلاحية)
local function pushRankInfo(player: Player)
	if not player then return end
	lobbyRemote:FireClient(player, { action = "rankInfo", rank = rankOf(player) })
end

-- تصريح مسبق (تُعرّف لاحقاً في وحدة الفريق) — لتفادي مشكلة المرجع الأمامي في Lua
local broadcastTeam, rememberTeamName

-- تعيين/إزالة رتبة (target = userId). rank = nil أو "" للإزالة.
local function setRank(uid: number, rank: string?, name: string?)
	if not uid then return end
	if CONFIG.AdminIds[uid] then return end  -- المالك ثابت لا يُعدّل
	if rank == nil or rank == "" then
		ranks[uid] = nil
	elseif RANK_W[rank] and rank ~= "owner" then
		ranks[uid] = { rank = rank, name = tostring(name or (ranks[uid] and ranks[uid].name) or ("#" .. uid)) }
	end
	saveRanks()
	-- حدّث وسم الرتبة في الدردشة عند اللاعب المستهدف (إن كان حاضراً)
	local target = Players:GetPlayerByUserId(uid)
	if target then
		target:SetAttribute("Rank", rank or "")
		pushRankInfo(target)
		sendPerks(target)  -- 📢 يظهر/يختفي زر الإعلان فوراً حسب الرتبة الجديدة (بدون إعادة دخول)
		if rememberTeamName then rememberTeamName(target) end
	end
	-- صفحة الفريق تتحدّث تلقائياً عند تغيّر الرتب
	if broadcastTeam then broadcastTeam() end
end

local function authedAdmin(player: Player): boolean
	-- الحماية بالرتبة فقط: المالك (ثابت بالـ UserId) + الأدمن + المشرف.
	-- ألغينا «كود الدخول» نهائياً لأن أي بصمة لكود قصير قابلة للتخمين من المستودع؛
	-- الرتبة هي الحماية الفعلية ولا تُمنح إلا من مخوّل أعلى.
	return weightOf(player) >= RANK_W.mod
end

-- عند الدخول: عيّن سمة الرتبة وبلّغ العميل (بعد جهوزية الجلسة)
Players.PlayerAdded:Connect(function(player)
	task.delay(2, function()
		if player and player.Parent then
			player:SetAttribute("Rank", rankOf(player))
			pushRankInfo(player)
			if rememberTeamName then rememberTeamName(player) end
			if broadcastTeam then broadcastTeam() end
		end
	end)
end)

-- حدّث حالة الاتصال في صفحة الفريق عند خروج عضو
Players.PlayerRemoving:Connect(function(player)
	task.delay(0.5, function()
		if broadcastTeam then broadcastTeam() end
	end)
end)

------------------------------------------------------------------------
-- 🔨 حظر اللاعبين من الماب (بنمط الأيام) — متاح للأدمن فأعلى فقط
-- محفوظ بـ DataStore (كل لاعب بمفتاح مستقل) فيعمل عبر كل السيرفرات وبعد
-- إعادة التشغيل. عند دخول لاعب حظره ساري → يُطرد فوراً برسالة تبيّن المدة.
--   • القيمة المخزّنة: { until=<epoch> (0 = دائم), name, by, reason }
------------------------------------------------------------------------
local banStore
pcall(function() banStore = DataStoreService:GetDataStore("CinemaMapBans_v1") end)

-- كاش بالذاكرة: [uid(number)] = { until=number, name=string, by=string, reason=string }
local mapBans = {}

local function normBan(uid: number, v): any
	if type(v) ~= "table" then return nil end
	return {
		["until"] = tonumber(v["until"]) or 0,
		name      = tostring(v.name or ("#" .. uid)),
		by        = tostring(v.by or ""),
		reason    = tostring(v.reason or ""),
	}
end

-- قراءة طازجة من DataStore (تُحدّث الكاش). على خطأ شبكة ترجع الكاش الحالي.
local function readBan(uid: number?)
	if not uid then return nil end
	if not banStore then return mapBans[uid] end
	local ok, v = pcall(function() return banStore:GetAsync("u" .. uid) end)
	if ok then
		mapBans[uid] = normBan(uid, v)  -- v=nil → يمسح الكاش
		return mapBans[uid]
	end
	return mapBans[uid]
end

-- يُرجع سجل الحظر الساري من الكاش (ويحذف المنتهي تلقائياً)، أو nil لو غير محظور
local function mapBanActive(uid: number?)
	if not uid then return nil end
	local b = mapBans[uid]
	if not b then return nil end
	local untilT = b["until"] or 0
	if untilT ~= 0 and os.time() >= untilT then
		mapBans[uid] = nil
		if banStore then pcall(function() banStore:RemoveAsync("u" .. uid) end) end
		return nil
	end
	return b
end

-- نص المدة المتبقية للحظر (يوم/ساعة/دقيقة) لرسالة الطرد
local function banRemainingText(b): string
	local untilT = b["until"] or 0
	if untilT == 0 then return "بشكل دائم" end
	local secs  = math.max(0, untilT - os.time())
	local days  = math.floor(secs / 86400)
	local hours = math.floor((secs % 86400) / 3600)
	if days >= 1 then
		return "لمدة " .. tostring(days) .. " يوم" .. (hours > 0 and (" و" .. tostring(hours) .. " ساعة") or "")
	elseif hours >= 1 then
		return "لمدة " .. tostring(hours) .. " ساعة"
	end
	local mins = math.max(1, math.floor((secs % 3600) / 60))
	return "لمدة " .. tostring(mins) .. " دقيقة"
end

local function banKickMsg(b): string
	local msg = "🔨 أنت محظور من «مدينة التبرعات» " .. banRemainingText(b) .. "."
	if b.reason and #b.reason > 0 then msg = msg .. "\nالسبب: " .. b.reason end
	return msg
end

-- تعيين حظر: days=0 → دائم. يحفظ ويطرد اللاعب فوراً لو كان حاضراً.
local function setMapBan(uid: number, days: number?, name: string?, by: string?, reason: string?)
	if not uid then return end
	if CONFIG.AdminIds[uid] then return end  -- المالك لا يُحظر
	local d = math.max(0, tonumber(days) or 0)
	local rec = {
		["until"] = (d > 0) and (os.time() + math.floor(d * 86400)) or 0,
		name   = tostring(name or (mapBans[uid] and mapBans[uid].name) or ("#" .. uid)),
		by     = tostring(by or ""),
		reason = string.sub(tostring(reason or ""), 1, 140),
	}
	mapBans[uid] = rec
	if banStore then pcall(function() banStore:SetAsync("u" .. uid, rec) end) end
	local target = Players:GetPlayerByUserId(uid)
	if target then
		task.delay(0.3, function()
			if target and target.Parent then target:Kick(banKickMsg(rec)) end
		end)
	end
end

local function clearMapBan(uid: number)
	if not uid then return end
	mapBans[uid] = nil
	if banStore then pcall(function() banStore:RemoveAsync("u" .. uid) end) end
end

-- تطبيق الحظر عند الدخول: فحص طازج من DataStore ثم طرد لو الحظر ساري
local function enforceBanOnJoin(player: Player)
	if not player then return end
	if CONFIG.AdminIds[player.UserId] then return end
	readBan(player.UserId)
	local b = mapBanActive(player.UserId)
	if b and player.Parent then
		player:Kick(banKickMsg(b))
	end
end

Players.PlayerAdded:Connect(enforceBanOnJoin)
-- لاعبون حاضرون لحظة بدء السيرفر (نادر) — افحصهم أيضاً
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(enforceBanOnJoin, p)
end

-- قائمة المشرفين الحاليين (للوحة) — تدمج الحاضرين والمخزّنين
local function rankList()
	local out = {}
	for uid, v in pairs(ranks) do
		local online = Players:GetPlayerByUserId(uid)
		table.insert(out, {
			userId = uid,
			name = (online and (online.DisplayName ~= "" and online.DisplayName or online.Name)) or v.name,
			rank = v.rank,
			online = online ~= nil,
		})
	end
	table.sort(out, function(a, b)
		if (RANK_W[a.rank] or 0) ~= (RANK_W[b.rank] or 0) then
			return (RANK_W[a.rank] or 0) > (RANK_W[b.rank] or 0)
		end
		return a.name < b.name
	end)
	return out
end

------------------------------------------------------------------------
-- 👥 صفحة فريق العمل (Team Page) — أيقونة يسار الشاشة لكل اللاعبين.
-- تعرض الإدارة (Owner/Admin/Mod/Staff) بصورة الأفتار + الرتبة + الحالة.
-- التحكم الكامل من لوحة الإدارة (إظهار/إخفاء الأيقونة، إخفاء عضو، ترتيب،
-- عنوان مخصّص) ومحفوظ بـ DataStore. مصدر الأعضاء = نظام الرتب نفسه.
------------------------------------------------------------------------
local teamStore
pcall(function() teamStore = DataStoreService:GetDataStore("CinemaTeam_v1") end)

-- الإعداد بالذاكرة (احتياطي لو DataStore متعطّل)
local teamCfg = {
	enabled = true,
	title   = "فريق عمل سينما مدينة التبرعات",
	hidden  = {},   -- [tostring(uid)] = true  (عضو مخفي من الصفحة)
	order   = {},   -- [tostring(uid)] = number (ترتيب مخصّص؛ الأصغر أعلى)
	names   = {},   -- [tostring(uid)] = "الاسم" (احتياطي للأعضاء غير المتصلين)
	sections = {},  -- مصفوفة مرتّبة { id=string, title=string } (أقسام مخصّصة)
	memberSection = {}, -- [tostring(uid)] = sectionId (قسم العضو)
	roles   = {},   -- [tostring(uid)] = "المسؤولية" (نص مخصّص لكل عضو)
	secSeq  = 0,    -- عدّاد لتوليد معرّفات أقسام مخصّصة فريدة
}

-- أقسام افتراضية (تُزرع أول مرّة فقط) — معرّفاتها = أسماء الرتب لتوزيع تلقائي مريح
local DEFAULT_SECTIONS = {
	{ id = "owner", title = "الإدارة العليا" },
	{ id = "admin", title = "الإدارة" },
	{ id = "mod",   title = "الإشراف" },
	{ id = "staff", title = "طاقم السينما" },
}
local TEAM_AR_RANK = { owner = "المالك", admin = "أدمن", mod = "مشرف", staff = "طاقم السينما" }

local function loadTeam()
	if not teamStore then return end
	local ok, data = pcall(function() return teamStore:GetAsync("config") end)
	if ok and type(data) == "table" then
		if type(data.title) == "string" and #data.title > 0 then teamCfg.title = data.title end
		teamCfg.enabled = data.enabled ~= false
		if type(data.hidden) == "table" then teamCfg.hidden = data.hidden end
		if type(data.order)  == "table" then teamCfg.order  = data.order end
		if type(data.names)  == "table" then teamCfg.names  = data.names end
		if type(data.sections) == "table" then teamCfg.sections = data.sections end
		if type(data.memberSection) == "table" then teamCfg.memberSection = data.memberSection end
		if type(data.roles) == "table" then teamCfg.roles = data.roles end
		if type(data.secSeq) == "number" then teamCfg.secSeq = data.secSeq end
	end
end

-- ازرع الأقسام الافتراضية لو القائمة فاضية (أول تشغيل)
local function seedSections()
	if #teamCfg.sections == 0 then
		for _, s in ipairs(DEFAULT_SECTIONS) do
			table.insert(teamCfg.sections, { id = s.id, title = s.title })
		end
	end
end

local function saveTeam()
	if not teamStore then return end
	pcall(function()
		teamStore:SetAsync("config", {
			enabled = teamCfg.enabled, title = teamCfg.title,
			hidden = teamCfg.hidden, order = teamCfg.order, names = teamCfg.names,
			sections = teamCfg.sections, memberSection = teamCfg.memberSection,
			roles = teamCfg.roles, secSeq = teamCfg.secSeq,
		})
	end)
end

loadTeam()
seedSections()

-- ترتيب افتراضي مشتقّ من الرتبة (المالك أعلى): owner=60, admin=70, mod=80, staff=90
local function defaultTeamOrder(rank: string): number
	return 100 - (RANK_W[rank] or 0) * 10
end
local function effTeamOrder(uid: number, rank: string): number
	return teamCfg.order[tostring(uid)] or defaultTeamOrder(rank)
end

-- يبني قائمة الفريق (المالك من CONFIG + كل المرتّبين). includeHidden=true للوحة الإدارة.
local function teamFullList(includeHidden: boolean)
	local seen, out = {}, {}
	local function add(uid: number, rank: string)
		if not uid or seen[uid] then return end
		seen[uid] = true
		local isHidden = teamCfg.hidden[tostring(uid)] == true
		if isHidden and not includeHidden then return end
		local online = Players:GetPlayerByUserId(uid)
		local nm = (online and (online.DisplayName ~= "" and online.DisplayName or online.Name))
			or teamCfg.names[tostring(uid)] or ("#" .. uid)
		table.insert(out, {
			userId = uid, rank = rank, name = nm,
			online = online ~= nil, hidden = isHidden,
			order = effTeamOrder(uid, rank),
		})
	end
	for uid in pairs(CONFIG.AdminIds) do add(uid, "owner") end
	for uid, v in pairs(ranks) do add(uid, v.rank) end
	table.sort(out, function(a, b)
		if a.order ~= b.order then return a.order < b.order end
		return a.name < b.name
	end)
	return out
end

-- ===== الأقسام (Sections) =====
local function sectionExists(id: string): boolean
	for _, s in ipairs(teamCfg.sections) do if s.id == id then return true end end
	return false
end

-- قسم العضو (المخصّص → ثم الافتراضي حسب الرتبة → ثم أول قسم)
local function memberSectionId(uid: number, rank: string): string
	local sid = teamCfg.memberSection[tostring(uid)]
	if sid and sectionExists(sid) then return sid end
	if sectionExists(rank) then return rank end
	return teamCfg.sections[1] and teamCfg.sections[1].id or "owner"
end

-- مسؤولية العضو (نص مخصّص أو اسم الرتبة تلقائياً)
local function memberRole(uid: number, rank: string): string
	local r = teamCfg.roles[tostring(uid)]
	if type(r) == "string" and #r > 0 then return r end
	return TEAM_AR_RANK[rank] or "عضو"
end

-- يبني الفريق مجمّعاً حسب الأقسام (مصفوفة مرتّبة من { id, title, members }).
-- includeHidden=true للوحة الإدارة (يشمل المخفيين والأقسام الفارغة).
local function teamGrouped(includeHidden: boolean, includeEmpty: boolean)
	local buckets, seen = {}, {}
	local function add(uid: number, rank: string)
		if not uid or seen[uid] then return end
		seen[uid] = true
		local isHidden = teamCfg.hidden[tostring(uid)] == true
		if isHidden and not includeHidden then return end
		local online = Players:GetPlayerByUserId(uid)
		local nm = (online and (online.DisplayName ~= "" and online.DisplayName or online.Name))
			or teamCfg.names[tostring(uid)] or ("#" .. uid)
		local sid = memberSectionId(uid, rank)
		buckets[sid] = buckets[sid] or {}
		table.insert(buckets[sid], {
			userId = uid, rank = rank, name = nm, online = online ~= nil, hidden = isHidden,
			role = memberRole(uid, rank), section = sid, order = effTeamOrder(uid, rank),
		})
	end
	for uid in pairs(CONFIG.AdminIds) do add(uid, "owner") end
	for uid, v in pairs(ranks) do add(uid, v.rank) end
	local out = {}
	for _, s in ipairs(teamCfg.sections) do
		local mem = buckets[s.id] or {}
		table.sort(mem, function(a, b)
			if a.order ~= b.order then return a.order < b.order end
			return a.name < b.name
		end)
		if includeEmpty or #mem > 0 then
			table.insert(out, { id = s.id, title = s.title, members = mem })
		end
	end
	return out
end

-- بثّ بيانات الفريق العامّة لكل اللاعبين (الأعضاء الظاهرون فقط، مجمّعين حسب القسم)
function broadcastTeam()
	local groups = teamGrouped(false, true)
	for _, p in ipairs(Players:GetPlayers()) do
		lobbyRemote:FireClient(p, {
			action = "teamData", enabled = teamCfg.enabled,
			title = teamCfg.title, sections = groups,
		})
	end
end

-- خزّن اسم العضو (للعرض وهو غير متصل لاحقاً)
function rememberTeamName(player: Player)
	if not player then return end
	local r = rankOfId(player.UserId)
	if r == "" then return end  -- ليس عضو فريق
	local nm = player.DisplayName ~= "" and player.DisplayName or player.Name
	if teamCfg.names[tostring(player.UserId)] ~= nm then
		teamCfg.names[tostring(player.UserId)] = nm
		saveTeam()
	end
end

-- حالة الصيانة + سجل أوامر الإدارة
local maintenanceOn = false
local maintenanceMsg = "🛠️ السينما تحت الصيانة مؤقتاً — نرجع لكم بأسرع وقت."
local adminLog = {}

local function logAdmin(adminName: string, text: string)
	table.insert(adminLog, 1, (os.date("%H:%M") .. " · " .. adminName .. " · " .. text))
	while #adminLog > 14 do table.remove(adminLog) end
end

-- إشعار فوري للاعب يظهر كبانر مركزي (يعيد استخدام معالج "announce" في العميل)
local function adminNotify(player, text)
	lobbyRemote:FireClient(player, { action = "announce", text = text })
end

local function sendAdminPanel(player)
	local list = {}
	for _, p in ipairs(Players:GetPlayers()) do
		local bi = mapBanActive(p.UserId)
		table.insert(list, {
			name = p.Name, display = p.DisplayName, userId = p.UserId,
			vip = (_G.IsVIP and _G.IsVIP(p)) or false,
			banned = (_G.BoothIsBanned and _G.BoothIsBanned(p.UserId)) or false,
			muted = (_G.ChatIsMuted and _G.ChatIsMuted(p.UserId)) or false,
			mapBanned = bi ~= nil,
			mapBanUntil = bi and (bi["until"] or 0) or nil,
			rank = rankOfId(p.UserId),
		})
	end
	lobbyRemote:FireClient(player, {
		action  = "adminOpen",
		myRank  = rankOf(player),
		players = list,
		mods    = rankList(),
		chatEnabled = (_G.ChatIsEnabled == nil) or (_G.ChatIsEnabled() == true),
		playing = (_G.AdminIsPlaying and _G.AdminIsPlaying()) or (cinema:GetAttribute("Playing") == true),
		stats   = (_G.BoothAdminStats and _G.BoothAdminStats()) or {},
		booths  = (_G.BoothAdminList and _G.BoothAdminList()) or {},
		boothsEnabled = (_G.BoothIsEnabled == nil) or (_G.BoothIsEnabled() == true),
		music   = (_G.AdminGetMusic and _G.AdminGetMusic()) or { on = false, volume = 0.4, hasId = false },
		maintenance = maintenanceOn,
		maintenanceMsg = maintenanceMsg,
		log     = adminLog,
		-- صفحة الفريق (للوحة الإدارة): مجمّعة حسب الأقسام + قائمة الأقسام + الإعداد
		teamEnabled  = teamCfg.enabled,
		teamTitle    = teamCfg.title,
		teamSections = teamGrouped(true, true),
		teamSecList  = teamCfg.sections,
		-- ⌘ صلاحيات أوامر الدردشة (قابلة للتحكم من اللوحة) — من CustomChat
		cmdPerms = (_G.ChatCmdConfigGet and _G.ChatCmdConfigGet()) or {},
	})
end

-- حفظ/تحميل حالة الصيانة (دائمة عبر إعادة التشغيل وكل السيرفرات) عبر DataStore
local MessagingService = game:GetService("MessagingService")
local MAINT_TOPIC = "CinemaMaintenance"

local function saveMaintenance()
	if not teamStore then return end
	-- محاولات متعددة لضمان ثبات الحفظ حتى مع تذبذب الشبكة
	for _ = 1, 3 do
		local ok = pcall(function()
			teamStore:SetAsync("maint", { on = maintenanceOn, msg = maintenanceMsg })
		end)
		if ok then return end
		task.wait(1)
	end
end

local function loadMaintenance()
	if not teamStore then return end
	local ok, data = pcall(function() return teamStore:GetAsync("maint") end)
	if ok and type(data) == "table" then
		maintenanceOn = data.on == true
		if type(data.msg) == "string" and #data.msg > 0 then maintenanceMsg = data.msg end
	end
end

-- يطبّق الحالة محلياً على هذا السيرفر ويبلّغ لاعبيه
local function applyMaintenance(on: boolean, msg: string?)
	maintenanceOn = on == true
	if msg and #msg > 0 then maintenanceMsg = string.sub(msg, 1, 140) end
	for _, p in ipairs(Players:GetPlayers()) do
		lobbyRemote:FireClient(p, {
			action = "maintenance",
			on = maintenanceOn,
			text = maintenanceMsg,
			-- «admin» = من يحق له فتح اللوحة لإلغاء الصيانة (مشرف فأعلى)، لا المالك فقط
			admin = authedAdmin(p),
		})
	end
end

local function setMaintenance(on: boolean, msg: string?)
	applyMaintenance(on, msg)
	saveMaintenance()  -- يبقى دائماً حتى بعد إعادة التشغيل
	-- بثّ فوري لباقي السيرفرات الشغّالة
	pcall(function()
		MessagingService:PublishAsync(MAINT_TOPIC, { on = maintenanceOn, msg = maintenanceMsg, src = game.JobId })
	end)
end

-- حمّل الحالة المحفوظة عند بدء السيرفر (تبقى مقفلة لو كانت مقفلة)
loadMaintenance()

-- استقبل تغييرات الصيانة من السيرفرات الأخرى وطبّقها فوراً
pcall(function()
	MessagingService:SubscribeAsync(MAINT_TOPIC, function(message)
		local d = message.Data
		if type(d) == "table" and d.src ~= game.JobId then
			applyMaintenance(d.on, d.msg)
		end
	end)
end)

-- أبلغ اللاعب الجديد بحالة الصيانة الحالية (إن كانت مُفعّلة)
Players.PlayerAdded:Connect(function(p)
	task.delay(2.5, function()
		if maintenanceOn and p and p.Parent then
			lobbyRemote:FireClient(p, { action = "maintenance", on = true, text = maintenanceMsg, admin = authedAdmin(p) })
		end
	end)
end)

local function broadcast(text: string, fromName: string?)
	local msg = "📢 " .. tostring(text)
	for _, p in ipairs(Players:GetPlayers()) do
		lobbyRemote:FireClient(p, { action = "announce", text = msg, from = fromName })
	end
end

lobbyRemote.OnServerEvent:Connect(function(player, payload)
	if type(payload) ~= "table" then return end
	if payload.action == "buyTicket" then
		local have = _G.GetTickets and _G.GetTickets(player) or 0
		if have >= (_G.TicketMax or 10) then
			notify(player, "🎟️ تذاكرك ممتلئة — استخدم تذكرة قبل الشراء.")
			return
		end
		local price = ticketPriceFor(player)
		if _G.SpendCoins(player, price) then
			if _G.AddTickets then _G.AddTickets(player, 1) end
			if _G.AwardAchievement then _G.AwardAchievement(player, "first_ticket") end
			if _G.ReportMission then _G.ReportMission(player, "ticket_buy", 1) end
			notify(player, "✅ اشتريت تذكرة بـ " .. price .. " كوينز — استمتع!")
		else
			notify(player, "❌ لا تملك كوينز كافية. أكمل المهام والأنشطة لتجمع المزيد.")
		end
		openBoxOffice(player)  -- تحديث الأرقام في الواجهة

	elseif payload.action == "claimFreeTicket" then
		-- 🎁 تذكرة مجانية كل دقيقتين (بديل لوحة التذاكر الجانبية القديمة)
		local have = _G.GetTickets and _G.GetTickets(player) or 0
		if have >= (_G.TicketMax or 10) then
			notify(player, "🎟️ تذاكرك ممتلئة — استخدم تذكرة قبل أخذ غيرها.")
			openBoxOffice(player)
			return
		end
		local now = os.clock()
		local last = freeTicketAt[player.UserId] or -1e9
		local remain = 120 - (now - last)
		if remain > 0 then
			notify(player, "⏳ تذكرتك المجانية القادمة بعد " .. math.ceil(remain) .. " ثانية.")
			openBoxOffice(player)
			return
		end
		freeTicketAt[player.UserId] = now
		if _G.AddTickets then _G.AddTickets(player, 1) end
		notify(player, "🎁 حصلت على تذكرة مجانية! القادمة بعد دقيقتين.")
		openBoxOffice(player)

	elseif payload.action == "buyVip" then
		if _G.IsVIP(player) then
			notify(player, "⭐ أنت بالفعل عضو VIP.")
			openBoxOffice(player)
			return
		end
		if _G.SpendCoins(player, CONFIG.VipPrice) then
			grantVip(player)
		else
			notify(player, "❌ تحتاج " .. CONFIG.VipPrice .. " كوينز للترقية إلى VIP.")
		end
		openBoxOffice(player)

	elseif payload.action == "buyVipRobux" then
		-- شراء VIP عبر الـ Game Pass (دخل حقيقي بالـ Robux)
		if CONFIG.VipGamePassId == 0 then
			notify(player, "ℹ️ الشراء بالـ Robux غير مفعّل بعد. استخدم الترقية بالكوينز حالياً.")
			return
		end
		if _G.IsVIP(player) then
			notify(player, "⭐ أنت بالفعل عضو VIP.")
			return
		end
		pcall(function()
			MarketplaceService:PromptGamePassPurchase(player, CONFIG.VipGamePassId)
		end)

	elseif payload.action == "openStore" then
		_G.OpenStore(player)

	elseif payload.action == "buyProduct" then
		-- شراء Developer Product بالـ Robux (متكرر)
		local pid = tonumber(payload.productId)
		if not pid or pid <= 0 then
			notify(player, "⚠️ هذا المنتج غير مفعّل بعد.")
			return
		end
		-- نطلب نافذة الشراء مباشرة (روبلوكس نفسه يتحقق من صلاحية المنتج).
		-- لا نعتمد على جدول PRODUCTS هنا حتى لا يفشل الطلب بصمت.
		local ok, err = pcall(function()
			MarketplaceService:PromptProductPurchase(player, pid)
		end)
		if not ok then
			notify(player, "❌ تعذّر فتح نافذة الشراء. حاول مرة ثانية بعد قليل.")
			warn("[Store] PromptProductPurchase failed for " .. pid .. ": " .. tostring(err))
		end

	elseif payload.action == "buyGamePass" then
		-- شراء أي Game Pass دائم بالـ Robux من المتجر
		local pid = tonumber(payload.passId)
		if pid and (pid == CONFIG.VipGamePassId or passKeyById(pid)) then
			pcall(function()
				MarketplaceService:PromptGamePassPurchase(player, pid)
			end)
		end

	elseif payload.action == "setSpeed" then
		-- ⚡ سرعة البرق: ضبط سرعة المشي — التحقق من الملكية + تثبيت القيمة على السيرفر
		if not ownsPassKey(player, "speed") then
			notify(player, "⚡ تحكّم السرعة متاح لحاملي باقة «سرعة البرق» فقط.")
			return
		end
		local s = sessions[player.UserId]
		if not s then return end
		local v = clampSpeed(payload.speed)   -- السيرفر هو من يحصر القيمة (حماية من الغش)
		s.speed = v
		applySpeed(player)
		-- اعكس القيمة المثبّتة للعميل ليضبط شريط التمرير على نفس القيمة الفعلية
		lobbyRemote:FireClient(player, { action = "speedSet", speed = v })

	elseif payload.action == "showrunnerPlay" then
		-- 🎬 مالك العرض: بدء الفيلم بأي وقت
		if not ownsPassKey(player, "showrunner") then
			notify(player, "🎬 هذه الميزة لحاملي باقة «مالك العرض» فقط.")
			return
		end
		if _G.AdminPlayMovie and _G.AdminPlayMovie() then
			notify(player, "🎬 بدأت العرض الآن — استمتعوا!")
		else
			notify(player, "ℹ️ العرض جارٍ بالفعل.")
		end

	elseif payload.action == "announcerSay" then
		-- 📢 مايك الإعلان: بثّ رسالة لكل اللاعبين (حاملو الباقة + كل مشرف فأعلى)
		if not (ownsPassKey(player, "announcer") or canUseAnnouncer(player)) then
			notify(player, "📢 الإعلان متاح لحاملي باقة «مايك الإعلان» أو للمشرفين فأعلى فقط.")
			return
		end
		local text = tostring(payload.text or "")
		if #text > 0 then
			text = string.sub(text, 1, 140)
			broadcast(text, player.DisplayName)
			if _G.AdminSetMarquee then _G.AdminSetMarquee("📢 " .. text) end
			notify(player, "✅ تم بثّ إعلانك لكل اللاعبين.")
		end

	elseif payload.action == "getProfile" then
		if _G.SendProfile then _G.SendProfile(player) end

	elseif payload.action == "rate" then
		if _G.RatePlayer then _G.RatePlayer(player, tonumber(payload.value)) end

	elseif payload.action == "arcadePlay" then
		if _G.ArcadePlay then _G.ArcadePlay(player) end

	elseif payload.action == "teamRequest" then
		-- أي لاعب يطلب بيانات صفحة الفريق (الأعضاء الظاهرون فقط، مجمّعين حسب القسم)
		lobbyRemote:FireClient(player, {
			action = "teamData", enabled = teamCfg.enabled,
			title = teamCfg.title, sections = teamGrouped(false, true),
		})

	elseif payload.action == "adminAuth" then
		-- فتح لوحة الإدارة — التحقق بالرتبة فقط (مشرف فأعلى)
		if authedAdmin(player) then
			sendAdminPanel(player)
		else
			lobbyRemote:FireClient(player, { action = "adminDenied" })
		end

	elseif payload.action == "admin" then
		-- تنفيذ أمر إداري (يُتحقق من الرتبة في كل مرة)
		if not authedAdmin(player) then
			lobbyRemote:FireClient(player, { action = "adminDenied" })
			return
		end
		local cmd = payload.cmd
		local adminName = player.DisplayName
		local myW = weightOf(player)
		local function targetOf()
			local tid = tonumber(payload.userId)
			if tid then return Players:GetPlayerByUserId(tid), tid end
			return nil, nil
		end
		-- تحقّق صلاحية: w = الوزن المطلوب. يُرجع true لو مسموح، وإلا يُبلّغ ويرفض.
		local function canDo(w: number): boolean
			if myW >= w then return true end
			adminNotify(player, "🚫 ليس لديك صلاحية لهذا الإجراء.")
			return false
		end
		-- أوامر التحكم بالماب (عرض/إضاءة/موسيقى/بوثات/صيانة/إعلان) للأدمن فأعلى
		local MAP_CMDS = {
			play=true, stop=true, skip=true, restart=true,
			lightsOn=true, lightsOff=true, lightLevel=true, ambient=true, music=true,
			broadcast=true, boothsEnable=true, boothsDisable=true, boothRelease=true,
			maintenanceOn=true, maintenanceOff=true, vipGrant=true, vipRevoke=true,
			ban=true, unban=true, mapBan=true, mapUnban=true,
		}
		if MAP_CMDS[cmd] and not canDo(RANK_W.admin) then return end
		-- ===== العرض =====
		if cmd == "play" then
			if _G.AdminPlayMovie and _G.AdminPlayMovie() then
				adminNotify(player, "▶️ بدأ العرض الآن."); logAdmin(adminName, "بدأ العرض")
			else
				adminNotify(player, "ℹ️ العرض جارٍ بالفعل.")
			end
		elseif cmd == "stop" then
			if _G.AdminStopMovie and _G.AdminStopMovie() then
				adminNotify(player, "⏹️ تم إيقاف العرض."); logAdmin(adminName, "أوقف العرض")
			else
				adminNotify(player, "ℹ️ لا يوجد عرض جارٍ.")
			end
		elseif cmd == "skip" then
			if _G.AdminSkipMovie and _G.AdminSkipMovie() then
				adminNotify(player, "⏭️ تم تخطّي العرض الحالي."); logAdmin(adminName, "تخطّى العرض")
			else
				adminNotify(player, "ℹ️ لا يوجد عرض لتخطّيه.")
			end
		elseif cmd == "restart" then
			if _G.AdminRestartMovie then _G.AdminRestartMovie() end
			adminNotify(player, "🔄 إعادة العرض من البداية."); logAdmin(adminName, "أعاد العرض")
		-- ===== الإضاءة / الأجواء =====
		elseif cmd == "lightsOn" then
			if _G.AdminSetLights then _G.AdminSetLights(true) end
			adminNotify(player, "💡 إضاءة كاملة."); logAdmin(adminName, "إضاءة كاملة")
		elseif cmd == "lightsOff" then
			if _G.AdminSetLights then _G.AdminSetLights(false) end
			adminNotify(player, "🌙 خُفِّضت الإضاءة."); logAdmin(adminName, "خفض الإضاءة")
		elseif cmd == "lightLevel" then
			local lv = math.clamp(tonumber(payload.value) or 100, 0, 100)
			if _G.AdminSetLightLevel then _G.AdminSetLightLevel(lv / 100) end
			adminNotify(player, "🔆 مستوى الإضاءة: " .. tostring(math.floor(lv)) .. "%")
		elseif cmd == "ambient" then
			if payload.reset then
				if _G.AdminSetAmbient then _G.AdminSetAmbient(nil) end
				adminNotify(player, "🎨 رجعت الأجواء الطبيعية.")
			else
				local r = math.clamp(tonumber(payload.r) or 255, 0, 255)
				local g = math.clamp(tonumber(payload.g) or 255, 0, 255)
				local b = math.clamp(tonumber(payload.b) or 255, 0, 255)
				if _G.AdminSetAmbient then _G.AdminSetAmbient(r, g, b) end
				adminNotify(player, "🎨 تغيّر لون الأجواء.")
			end
			logAdmin(adminName, "غيّر الأجواء")
		-- ===== موسيقى اللوبي =====
		elseif cmd == "music" then
			local on = payload.on == true
			local vol = payload.volume ~= nil and (math.clamp(tonumber(payload.volume) or 40, 0, 100) / 100) or nil
			if _G.AdminSetMusic then _G.AdminSetMusic(on, vol) end
			local m = _G.AdminGetMusic and _G.AdminGetMusic() or {}
			if on and not m.hasId then
				adminNotify(player, "🎵 لا يوجد رقم صوت — ضع LobbyMusicId في الإعدادات لتشغيل الموسيقى.")
			else
				adminNotify(player, on and "🎵 شُغّلت موسيقى اللوبي." or "🔇 أُوقفت الموسيقى.")
			end
			logAdmin(adminName, "موسيقى اللوبي")
		-- ===== إعلان =====
		elseif cmd == "broadcast" then
			local text = tostring(payload.text or "")
			if #text > 0 then
				broadcast(text, player.DisplayName)
				if _G.AdminSetMarquee then _G.AdminSetMarquee("📢 " .. text) end
				adminNotify(player, "✅ تم إرسال الإعلان لكل اللاعبين.")
				logAdmin(adminName, "إعلان: " .. string.sub(text, 1, 30))
			end
		-- ===== أدوات اللاعبين =====
		elseif cmd == "kick" then
			if not canDo(RANK_W.admin) then return end  -- الطرد: أدمن فأعلى
			local target, tid = targetOf()
			if target and tid ~= player.UserId then
				if weightOf(target) >= myW then
					adminNotify(player, "🚫 لا يمكنك طرد إداري برتبة مثلك أو أعلى."); sendAdminPanel(player); return
				end
				local reason = tostring(payload.reason or payload.text or "")
				if #reason == 0 then reason = "تمت إزالتك من السينما بواسطة الإدارة." end
				local nm = target.Name
				target:Kick(string.sub(reason, 1, 140))
				adminNotify(player, "👢 تم طرد " .. nm .. "."); logAdmin(adminName, "طرد " .. nm)
			end
		elseif cmd == "warn" then
			if not canDo(RANK_W.mod) then return end  -- التحذير: مشرف فأعلى
			local target = targetOf()
			if target then
				local reason = string.sub(tostring(payload.reason or payload.text or "تنبيه من الإدارة."), 1, 140)
				-- إشعار تحذير إداري مميّز عند اللاعب (نافذة) + رسالة دردشة
				lobbyRemote:FireClient(target, { action = "warn", reason = reason, by = adminName })
				adminNotify(target, "⚠️ تحذير إداري — السبب: " .. reason)
				adminNotify(player, "⚠️ أُرسل التحذير إلى " .. target.Name .. ".")
				logAdmin(adminName, "حذّر " .. target.Name .. " — " .. reason)
			end
		elseif cmd == "vipGrant" then
			local target = targetOf()
			if target then
				if grantVip(target, false) then
					adminNotify(target, "⭐ منحتك الإدارة عضوية VIP! استمتع بالمزايا.")
					adminNotify(player, "⭐ مُنح " .. target.Name .. " VIP.")
					logAdmin(adminName, "منح VIP لـ " .. target.Name)
				else
					adminNotify(player, "ℹ️ " .. target.Name .. " عضو VIP بالفعل.")
				end
			end
		elseif cmd == "vipRevoke" then
			local target = targetOf()
			if target then
				if revokeVip(target) then
					adminNotify(target, "ℹ️ تم سحب عضوية VIP بواسطة الإدارة.")
					adminNotify(player, "🚫 سُحبت VIP من " .. target.Name .. ".")
					logAdmin(adminName, "سحب VIP من " .. target.Name)
				else
					adminNotify(player, "ℹ️ " .. target.Name .. " ليس عضو VIP.")
				end
			end
		elseif cmd == "ban" then
			local target, tid = targetOf()
			if tid and tid ~= player.UserId then
				if _G.BoothSetBanned then _G.BoothSetBanned(tid, true) end
				if target then adminNotify(target, "🚫 مُنعت من حجز البوثات بواسطة الإدارة.") end
				adminNotify(player, "🚫 مُنع " .. (target and target.Name or ("#" .. tid)) .. " من الحجز.")
				logAdmin(adminName, "منع حجز " .. (target and target.Name or tostring(tid)))
			end
		elseif cmd == "unban" then
			local target, tid = targetOf()
			if tid then
				if _G.BoothSetBanned then _G.BoothSetBanned(tid, false) end
				if target then adminNotify(target, "✅ رُفِع المنع — تقدر تحجز بوثاً الآن.") end
				adminNotify(player, "✅ رُفِع المنع عن " .. (target and target.Name or ("#" .. tid)) .. ".")
				logAdmin(adminName, "رفع منع " .. (target and target.Name or tostring(tid)))
			end
		elseif cmd == "mapBan" then
			-- 🔨 حظر من الماب بنمط الأيام (days=0 → دائم) — أدمن فأعلى (محمي بـ MAP_CMDS)
			local target, tid = targetOf()
			if tid and tid ~= player.UserId then
				if CONFIG.AdminIds[tid] then
					adminNotify(player, "🚫 لا يمكن حظر المالك."); sendAdminPanel(player); return
				end
				-- استخدم رتبة الـ userId (تعمل حتى لو الهدف غير متصل) لمنع حظر إداري أعلى
				if (RANK_W[rankOfId(tid)] or 0) >= myW then
					adminNotify(player, "🚫 لا يمكنك حظر إداري برتبة مثلك أو أعلى."); sendAdminPanel(player); return
				end
				local days = math.max(0, math.floor(tonumber(payload.days) or 0))
				local nm = (target and target.Name) or (mapBans[tid] and mapBans[tid].name) or ("#" .. tid)
				local reason = string.sub(tostring(payload.reason or ""), 1, 140)
				setMapBan(tid, days, nm, adminName, reason)
				local when = (days > 0) and ("لمدة " .. tostring(days) .. " يوم") or "بشكل دائم"
				adminNotify(player, "🔨 حُظر " .. nm .. " من الماب " .. when .. ".")
				logAdmin(adminName, "حظر من الماب " .. nm .. " (" .. when .. ")")
			end
		elseif cmd == "mapUnban" then
			local _, tid = targetOf()
			if tid then
				local nm = (mapBans[tid] and mapBans[tid].name) or ("#" .. tid)
				clearMapBan(tid)
				adminNotify(player, "♻️ رُفِع حظر الماب عن " .. nm .. ".")
				logAdmin(adminName, "رفع حظر الماب عن " .. nm)
			end
		elseif cmd == "mute" then
			if not canDo(RANK_W.mod) then return end  -- الكتم: مشرف فأعلى
			local target, tid = targetOf()
			if tid and tid ~= player.UserId then
				-- استخدم رتبة الـ userId (تعمل حتى لو الهدف غير متصل) لمنع تجاوز الصلاحية على إداري مفصول
				if (RANK_W[rankOfId(tid)] or 0) >= myW then
					adminNotify(player, "🚫 لا يمكنك كتم إداري برتبة مثلك أو أعلى."); sendAdminPanel(player); return
				end
				-- مدة الكتم بالدقائق (nil/0 = دائم)؛ نحوّلها لثوانٍ
				local mins = tonumber(payload.minutes)
				local secs = (mins and mins > 0) and math.floor(mins * 60) or nil
				if _G.ChatSetMuted then _G.ChatSetMuted(tid, true, secs) end
				local when = secs and ("لمدة " .. tostring(mins) .. " دقيقة") or "بشكل دائم (حتى يفكّه إداري)"
				local nm = (target and target.Name) or ("#" .. tid)
				if target then adminNotify(target, "🔇 كتمتك الإدارة في الدردشة " .. when .. " — تقدر تقرأ بس ما تقدر ترسل.") end
				adminNotify(player, "🔇 كُتم " .. nm .. " " .. when .. ".")
				logAdmin(adminName, "كتم بالدردشة " .. nm .. " (" .. when .. ")")
			end
		elseif cmd == "unmute" then
			if not canDo(RANK_W.mod) then return end  -- فك الكتم: مشرف فأعلى
			local target, tid = targetOf()
			if tid then
				if _G.ChatSetMuted then _G.ChatSetMuted(tid, false) end
				if target then adminNotify(target, "🔊 رُفع الكتم عنك — تقدر ترسل بالدردشة الآن.") end
				adminNotify(player, "🔊 رُفع الكتم عن " .. (target and target.Name or ("#" .. tid)) .. ".")
				logAdmin(adminName, "رفع كتم " .. (target and target.Name or tostring(tid)))
			end
		elseif cmd == "teleport" then
			if not canDo(RANK_W.admin) then return end  -- الانتقال: أدمن فأعلى
			local target = targetOf()
			local ac = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
			local tc = target and target.Character and target.Character:FindFirstChild("HumanoidRootPart")
			if ac and tc then
				ac.CFrame = tc.CFrame * CFrame.new(0, 0, 4)
				adminNotify(player, "📍 انتقلت إلى " .. target.Name .. ".")
				logAdmin(adminName, "انتقل إلى " .. target.Name)
			else
				adminNotify(player, "ℹ️ تعذّر الانتقال (اللاعب غير متاح).")
			end
		-- ===== إدارة البوثات =====
		elseif cmd == "boothRelease" then
			local key = tostring(payload.key or "")
			if _G.BoothForceRelease and _G.BoothForceRelease(key) then
				adminNotify(player, "🧹 تم تحرير البوث (" .. key .. ").")
				logAdmin(adminName, "حرّر بوث " .. key)
			else
				adminNotify(player, "ℹ️ هذا البوث غير محجوز.")
			end
		elseif cmd == "boothsEnable" then
			if _G.BoothSetEnabled then _G.BoothSetEnabled(true) end
			adminNotify(player, "✅ نظام البوثات مُفعّل."); logAdmin(adminName, "فعّل البوثات")
		elseif cmd == "boothsDisable" then
			if _G.BoothSetEnabled then _G.BoothSetEnabled(false) end
			adminNotify(player, "⛔ عُطّل نظام البوثات (حُرِّرت كل البوثات)."); logAdmin(adminName, "عطّل البوثات")
		-- ===== الصيانة =====
		elseif cmd == "maintenanceOn" then
			setMaintenance(true, tostring(payload.text or ""))
			adminNotify(player, "🛠️ وضع الصيانة مُفعّل."); logAdmin(adminName, "فعّل الصيانة")
		elseif cmd == "maintenanceOff" then
			setMaintenance(false)
			adminNotify(player, "✅ انتهى وضع الصيانة."); logAdmin(adminName, "أنهى الصيانة")
		-- ===== إدارة المشرفين (Admin/Mod/Staff) — للأدمن فأعلى =====
		elseif cmd == "setRank" then
			if not canDo(RANK_W.admin) then return end
			local target, tid = targetOf()
			local newRank = tostring(payload.rank or "")
			if not RANK_W[newRank] or newRank == "owner" or newRank == "" then
				adminNotify(player, "ℹ️ رتبة غير صالحة."); sendAdminPanel(player); return
			end
			if not tid then adminNotify(player, "ℹ️ اختر لاعباً."); sendAdminPanel(player); return end
			if tid == player.UserId then adminNotify(player, "🚫 لا يمكنك تغيير رتبتك."); sendAdminPanel(player); return end
			if CONFIG.AdminIds[tid] then adminNotify(player, "🚫 لا يمكن تعديل رتبة المالك."); sendAdminPanel(player); return end
			-- لا تمنح رتبة ≥ رتبتك، ولا تعدّل من هو برتبة ≥ رتبتك
			if (RANK_W[newRank] or 0) >= myW then
				adminNotify(player, "🚫 لا يمكنك منح رتبة مثل رتبتك أو أعلى."); sendAdminPanel(player); return
			end
			-- رتبة الهدف عبر userId (تعمل حتى لو غير متصل) لمنع تجاوز الصلاحية على إداري مفصول
			if (RANK_W[rankOfId(tid)] or 0) >= myW then
				adminNotify(player, "🚫 لا يمكنك تعديل إداري برتبة مثلك أو أعلى."); sendAdminPanel(player); return
			end
			local nm = (target and (target.DisplayName ~= "" and target.DisplayName or target.Name)) or ("#" .. tid)
			setRank(tid, newRank, nm)
			local LBL = { admin = "Admin", mod = "Moderator", staff = "Cinema Staff" }
			if target then adminNotify(target, "🏷️ عيّنتك الإدارة برتبة " .. (LBL[newRank] or newRank) .. ".") end
			adminNotify(player, "🏷️ صار " .. nm .. " — " .. (LBL[newRank] or newRank) .. ".")
			logAdmin(adminName, "رتبة " .. (LBL[newRank] or newRank) .. " لـ " .. nm)
		elseif cmd == "removeRank" then
			if not canDo(RANK_W.admin) then return end
			local target, tid = targetOf()
			if not tid then adminNotify(player, "ℹ️ اختر لاعباً."); sendAdminPanel(player); return end
			if CONFIG.AdminIds[tid] then adminNotify(player, "🚫 لا يمكن إزالة رتبة المالك."); sendAdminPanel(player); return end
			if rankOfId(tid) == "" then adminNotify(player, "ℹ️ هذا اللاعب بلا رتبة."); sendAdminPanel(player); return end
			if (RANK_W[rankOfId(tid)] or 0) >= myW then
				adminNotify(player, "🚫 لا يمكنك إزالة إداري برتبة مثلك أو أعلى."); sendAdminPanel(player); return
			end
			local nm = (target and (target.DisplayName ~= "" and target.DisplayName or target.Name)) or (ranks[tid] and ranks[tid].name) or ("#" .. tid)
			setRank(tid, nil)
			if target then adminNotify(target, "🏷️ أُزيلت رتبتك الإدارية.") end
			adminNotify(player, "🏷️ أُزيلت رتبة " .. nm .. ".")
			logAdmin(adminName, "أزال رتبة " .. nm)
		-- ===== الشات: رسالة إدارية + تفعيل/تعطيل =====
		elseif cmd == "adminMsg" then
			if not canDo(RANK_W.mod) then return end  -- رسالة إدارية: مشرف فأعلى
			local text = string.sub(tostring(payload.text or ""), 1, 200)
			if #text > 0 then
				local LBL = { owner = "OWNER", admin = "ADMIN", mod = "MODERATOR" }
				local label = LBL[rankOf(player)] or "ADMIN"
				if _G.ChatBroadcastAdmin then _G.ChatBroadcastAdmin(label, adminName, text) end
				adminNotify(player, "✅ أُرسلت الرسالة الإدارية للدردشة.")
				logAdmin(adminName, "رسالة إدارية: " .. string.sub(text, 1, 30))
			end
		elseif cmd == "chatEnable" then
			if not canDo(RANK_W.admin) then return end
			if _G.ChatSetEnabled then _G.ChatSetEnabled(true) end
			adminNotify(player, "💬 الدردشة مُفعّلة الآن."); logAdmin(adminName, "فعّل الدردشة")
		elseif cmd == "chatDisable" then
			if not canDo(RANK_W.admin) then return end
			if _G.ChatSetEnabled then _G.ChatSetEnabled(false) end
			adminNotify(player, "🔒 الدردشة مُغلقة الآن (الإداريون فقط يكتبون)."); logAdmin(adminName, "أغلق الدردشة")
		-- ===== صفحة الفريق (👥 الفريق) — للأدمن فأعلى =====
		elseif cmd == "teamToggle" then
			if not canDo(RANK_W.admin) then return end
			teamCfg.enabled = payload.on == true
			saveTeam()
			if broadcastTeam then broadcastTeam() end
			adminNotify(player, teamCfg.enabled and "👥 أيقونة الفريق ظاهرة للّاعبين." or "👥 أُخفيت أيقونة الفريق.")
			logAdmin(adminName, teamCfg.enabled and "فعّل صفحة الفريق" or "عطّل صفحة الفريق")
		elseif cmd == "teamTitle" then
			if not canDo(RANK_W.admin) then return end
			local t = string.sub(tostring(payload.text or ""), 1, 60)
			if #t > 0 then
				teamCfg.title = t; saveTeam()
				if broadcastTeam then broadcastTeam() end
				adminNotify(player, "👥 تم تحديث عنوان صفحة الفريق.")
				logAdmin(adminName, "غيّر عنوان الفريق")
			end
		elseif cmd == "teamHide" or cmd == "teamShow" then
			if not canDo(RANK_W.admin) then return end
			local tid = tonumber(payload.userId)
			if tid then
				teamCfg.hidden[tostring(tid)] = (cmd == "teamHide") and true or nil
				saveTeam()
				if broadcastTeam then broadcastTeam() end
				sendAdminPanel(player)
				return
			end
		elseif cmd == "teamMove" then
			if not canDo(RANK_W.admin) then return end
			local tid = tonumber(payload.userId)
			local dir = tostring(payload.dir)
			if tid and (dir == "up" or dir == "down") then
				-- رتّب داخل قسم العضو نفسه (الترتيب موضعي ضمن القسم)
				local groups = teamGrouped(true, true)
				local mem
				for _, g in ipairs(groups) do
					for i, m in ipairs(g.members) do if m.userId == tid then mem = g.members; break end end
					if mem then break end
				end
				if mem then
					local idx
					for i, m in ipairs(mem) do if m.userId == tid then idx = i; break end end
					local j = idx and ((dir == "up") and (idx - 1) or (idx + 1))
					if idx and j and j >= 1 and j <= #mem then
						-- ثبّت ترتيباً صريحاً متسلسلاً داخل القسم ثم بدّل الجارين
						for i, m in ipairs(mem) do teamCfg.order[tostring(m.userId)] = i end
						local ka, kb = tostring(mem[idx].userId), tostring(mem[j].userId)
						teamCfg.order[ka], teamCfg.order[kb] = teamCfg.order[kb], teamCfg.order[ka]
						saveTeam()
						if broadcastTeam then broadcastTeam() end
					end
				end
				sendAdminPanel(player)
				return
			end
		-- ===== الأقسام: إضافة/تسمية/حذف/ترتيب + توزيع العضو ومسؤوليته =====
		elseif cmd == "teamSecAdd" then
			if not canDo(RANK_W.admin) then return end
			local t = string.sub(tostring(payload.text or ""), 1, 40)
			if #t > 0 and #teamCfg.sections < 16 then
				teamCfg.secSeq += 1
				table.insert(teamCfg.sections, { id = "c" .. teamCfg.secSeq, title = t })
				saveTeam()
				if broadcastTeam then broadcastTeam() end
				logAdmin(adminName, "أضاف قسم «" .. t .. "»")
				sendAdminPanel(player)
				return
			end
		elseif cmd == "teamSecRename" then
			if not canDo(RANK_W.admin) then return end
			local sid = tostring(payload.section or "")
			local t = string.sub(tostring(payload.text or ""), 1, 40)
			if #t > 0 then
				for _, s in ipairs(teamCfg.sections) do
					if s.id == sid then s.title = t; break end
				end
				saveTeam()
				if broadcastTeam then broadcastTeam() end
				logAdmin(adminName, "أعاد تسمية قسم")
			end
			sendAdminPanel(player)
			return
		elseif cmd == "teamSecDelete" then
			if not canDo(RANK_W.admin) then return end
			local sid = tostring(payload.section or "")
			if #teamCfg.sections > 1 then
				for i, s in ipairs(teamCfg.sections) do
					if s.id == sid then table.remove(teamCfg.sections, i); break end
				end
				-- ألغِ توزيع الأعضاء على القسم المحذوف (يرجعون لقسمهم الافتراضي)
				for uid, v in pairs(teamCfg.memberSection) do
					if v == sid then teamCfg.memberSection[uid] = nil end
				end
				saveTeam()
				if broadcastTeam then broadcastTeam() end
				logAdmin(adminName, "حذف قسماً")
			else
				adminNotify(player, "⚠️ لا يمكن حذف آخر قسم — أضف قسماً آخر أولاً.")
			end
			sendAdminPanel(player)
			return
		elseif cmd == "teamSecMove" then
			if not canDo(RANK_W.admin) then return end
			local sid = tostring(payload.section or "")
			local dir = tostring(payload.dir)
			local idx
			for i, s in ipairs(teamCfg.sections) do if s.id == sid then idx = i; break end end
			if idx and (dir == "up" or dir == "down") then
				local j = (dir == "up") and (idx - 1) or (idx + 1)
				if j >= 1 and j <= #teamCfg.sections then
					teamCfg.sections[idx], teamCfg.sections[j] = teamCfg.sections[j], teamCfg.sections[idx]
					saveTeam()
					if broadcastTeam then broadcastTeam() end
				end
			end
			sendAdminPanel(player)
			return
		elseif cmd == "teamAssign" then
			if not canDo(RANK_W.admin) then return end
			local tid = tonumber(payload.userId)
			local sid = tostring(payload.section or "")
			if tid and sectionExists(sid) then
				teamCfg.memberSection[tostring(tid)] = sid
				teamCfg.order[tostring(tid)] = nil  -- صفّر الترتيب الموضعي عند نقل القسم
				saveTeam()
				if broadcastTeam then broadcastTeam() end
				logAdmin(adminName, "نقل عضواً لقسم آخر")
			end
			sendAdminPanel(player)
			return
		elseif cmd == "teamRole" then
			if not canDo(RANK_W.admin) then return end
			local tid = tonumber(payload.userId)
			if tid then
				local t = string.sub(tostring(payload.text or ""), 1, 40)
				teamCfg.roles[tostring(tid)] = (#t > 0) and t or nil
				saveTeam()
				if broadcastTeam then broadcastTeam() end
				logAdmin(adminName, "حدّث مسؤولية عضو")
			end
			sendAdminPanel(player)
			return
		elseif cmd == "setCmdPerm" then
			-- ⌘ تغيير مستوى أمر دردشة (الأداريون فأعلى فقط)
			if not canDo(RANK_W.admin) then return end
			local key = tostring(payload.key or "")
			local level = tonumber(payload.level)
			if key ~= "" and level and _G.ChatCmdConfigSet then
				local ok = _G.ChatCmdConfigSet(key, level) == true
				if ok then
					logAdmin(adminName, "ضبط صلاحية الأمر /" .. key .. " = " .. tostring(level))
				else
					adminNotify(player, "ℹ️ تعذّر ضبط هذا الأمر.")
				end
			end
			sendAdminPanel(player)
			return
		elseif cmd == "refresh" then
			-- لا شيء؛ يُعاد الإرسال أدناه
		end
		sendAdminPanel(player)  -- حدّث اللوحة بعد أي أمر
	end
end)

-- إتمام شراء الـ Game Pass → منح VIP فوراً
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
	if not purchased then return end
	if passId == CONFIG.VipGamePassId then
		grantVip(player)
		openBoxOffice(player)
		return
	end
	local key = passKeyById(passId)
	if key then
		grantPass(player, key, true)
		sendPerks(player)
		if _G.OpenStore then _G.OpenStore(player) end  -- حدّث المتجر ليظهر «مملوك»
	end
end)

------------------------------------------------------------------------
-- DEVELOPER PRODUCTS (شراء متكرر بالـ Robux — دخل مستمر)
-- ضع أرقام المنتجات هنا بعد إنشائها في Creator Dashboard (٠ = معطّل).
------------------------------------------------------------------------
local PRODUCTS = {
	-- [ProductId] = { kind = "coins", amount = 250, label = "حزمة ٢٥٠ كوينز" },
	-- [ProductId] = { kind = "ticket", label = "تذكرة فورية" },
}
local PRODUCT_IDS = {
	Coins250  = 3600876419, -- 💰 حزمة ٢٥٠ كوينز — 25 R$
	Coins600  = 3600876741, -- 💰 حزمة ٦٠٠ كوينز — 50 R$
	Coins1500 = 3600877201, -- 💎 حزمة ١٥٠٠ كوينز — 100 R$
	Ticket    = 3600878112, -- 🎟️ تذكرة سينما فورية — 15 R$
}
-- اربط الأرقام (إن وُجدت) بمحتواها تلقائياً
do
	local map = {
		{ id = PRODUCT_IDS.Coins250,  kind = "coins",  amount = 250,  label = "حزمة ٢٥٠ كوينز" },
		{ id = PRODUCT_IDS.Coins600,  kind = "coins",  amount = 600,  label = "حزمة ٦٠٠ كوينز" },
		{ id = PRODUCT_IDS.Coins1500, kind = "coins",  amount = 1500, label = "حزمة ١٥٠٠ كوينز" },
		{ id = PRODUCT_IDS.Ticket,    kind = "ticket", label = "تذكرة فورية" },
	}
	for _, m in ipairs(map) do
		if m.id ~= 0 then PRODUCTS[m.id] = m end
	end
end

local receiptStore
pcall(function() receiptStore = DataStoreService:GetDataStore("CinemaReceipts_v1") end)

local function grantProduct(player: Player, info)
	if _G.AwardAchievement then _G.AwardAchievement(player, "buyer") end
	if info.kind == "coins" then
		_G.AddCoins(player, info.amount)
		notify(player, "✅ تم شحن " .. info.amount .. " كوينز — استمتع!")
	elseif info.kind == "ticket" then
		if _G.AddTickets then _G.AddTickets(player, 1) end
		notify(player, "🎟️ حصلت على تذكرة فورية!")
	end
end

------------------------------------------------------------------------
-- 🛟 طابور تسليم مؤجّل لمشتريات الـ Robux (Developer Products)
-- جذر المشكلة: ProcessReceipt يحفظ مفتاح الإيصال أولاً (at-most-once) ثم يمنح،
-- فلو خرج اللاعب أثناء مهلة الحفظ (yield) تُمسح جلسته فيضيع المنتج رغم خصم الـ Robux.
-- الحل الكامل: لو لم تكن الجلسة جاهزة وقت المنح، نخزّن المنتج في طابور دائم بالـ
-- DataStore يُسلَّم تلقائياً فور عودة اللاعب — فلا يضيع أي شراء أبداً.
------------------------------------------------------------------------
local function pendKey(userId: number): string
	return "pend_" .. userId
end

-- يضيف منتجاً للطابور الدائم (UpdateAsync ذرّي مع إعادة محاولة)
local function enqueuePendingGrant(userId: number, info): boolean
	if not coinStore then return false end
	for _ = 1, 3 do
		local ok = pcall(function()
			coinStore:UpdateAsync(pendKey(userId), function(old)
				old = (type(old) == "table") and old or {}
				table.insert(old, { kind = info.kind, amount = info.amount })
				return old
			end)
		end)
		if ok then return true end
		task.wait(1)
	end
	return false
end

-- يمنح المنتج إن كان اللاعب حاضراً، وإلا يخزّنه في الطابور الدائم لتسليمه عند عودته.
-- يُعيد true لو سُلّم أو خُزّن بأمان (يمكن إغلاق الإيصال)، false لو تعذّر الأمران.
local function deliverOrQueue(userId: number, info): boolean
	local player = Players:GetPlayerByUserId(userId)
	if player and sessions[userId] then
		grantProduct(player, info)
		return true
	end
	return enqueuePendingGrant(userId, info)
end

-- يُستدعى عند دخول اللاعب: يقرأ الطابور، يسلّم المنتجات، ثم يزيل المُسلَّم فقط ذرّياً.
function drainPendingGrants(player: Player)
	if not coinStore then return end
	local items
	local ok = pcall(function() items = coinStore:GetAsync(pendKey(player.UserId)) end)
	if not ok or type(items) ~= "table" or #items == 0 then return end
	-- نسلّم لقطة الطابور ونعدّ كم منتجاً سُلّم فعلاً (نتوقّف لو غادر اللاعب أثناء التسليم)
	local delivered = 0
	for _, info in ipairs(items) do
		if sessions[player.UserId] and player.Parent then
			grantProduct(player, info)
			delivered += 1
		else
			break
		end
	end
	if delivered == 0 then return end
	-- إزالة ذرّية لأوّل (delivered) عناصر فقط عبر UpdateAsync بدل RemoveAsync للمفتاح كله:
	-- لو أضاف سيرفر آخر منتجاً جديداً بين القراءة والإزالة، يبقى محفوظاً في ذيل الطابور
	-- (لأن enqueue يُلحق في النهاية) فلا يضيع أي شراء حتى مع سباق نادر عبر السيرفرات.
	for _ = 1, 3 do
		local okTrim = pcall(function()
			coinStore:UpdateAsync(pendKey(player.UserId), function(old)
				if type(old) ~= "table" then return {} end
				local rest = {}
				for i = delivered + 1, #old do
					rest[#rest + 1] = old[i]
				end
				return rest  -- الباقي (أو {} فارغ) — لا نُعيد nil كي لا تُلغى الكتابة
			end)
		end)
		if okTrim then break end
		task.wait(1)
	end
end

MarketplaceService.ProcessReceipt = function(receipt)
	local info = PRODUCTS[receipt.ProductId]
	if not info then return Enum.ProductPurchaseDecision.NotProcessedYet end
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end

	-- منع التكرار: خزّن مفتاح الشراء
	local key = "r_" .. receipt.PlayerId .. "_" .. receipt.PurchaseId
	if receiptStore then
		local ok, already = pcall(function() return receiptStore:GetAsync(key) end)
		if ok and already then return Enum.ProductPurchaseDecision.PurchaseGranted end
	end

	-- نخزّن مفتاح الإيصال أولاً ثم نمنح (at-most-once): لو فشل الحفظ نُعيد NotProcessedYet
	-- بدون منح، فيُعيد روبلوكس المحاولة بأمان. ومنح المنتج تزامني (لا yield) فلا توجد
	-- نافذة سباق بعد نجاح الحفظ — يُغلق احتمال المنح المزدوج تماماً.
	if receiptStore then
		local saveOk = pcall(function() receiptStore:SetAsync(key, true) end)
		if not saveOk then
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
	end

	-- التسليم: لو خرج اللاعب أثناء مهلة الحفظ أعلاه (سباق نادر) فجلسته اختفت،
	-- فبدل أن يضيع المنتج بصمت نخزّنه في طابور دائم يُسلَّم فور عودته.
	if not deliverOrQueue(receipt.PlayerId, info) then
		-- تعذّر التسليم والتخزين معاً (نادر جداً) — نحذف مفتاح الإيصال المحفوظ أعلاه
		-- قبل الإعادة، وإلا فإن محاولة روبلوكس التالية ستجد المفتاح فتُعيد PurchaseGranted
		-- بلا تسليم → يضيع الشراء المدفوع. الحذف يضمن إعادة المحاولة الكاملة لاحقاً (at-least-once).
		if receiptStore then
			-- إعادة المحاولة (٣ مرّات) مثل بقية كتابات المتجر: محاولة واحدة قد تفشل
			-- تحت ضغط/خنق DataStore فيبقى المفتاح ويُعاد PurchaseGranted بلا تسليم.
			local removed = false
			for _ = 1, 3 do
				if pcall(function() receiptStore:RemoveAsync(key) end) then removed = true break end
				task.wait(1)
			end
			if not removed then
				warn("[Store] CRITICAL: تعذّر حذف مفتاح الإيصال " .. key .. " بعد فشل التسليم — قد يضيع الشراء")
			end
		end
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	return Enum.ProductPurchaseDecision.PurchaseGranted
end

------------------------------------------------------------------------
-- المتجر (Store) — قائمة احترافية تظهر للاعب على يسار الشاشة
-- تعرض كل المميزات القابلة للشراء بالـ Robux (Game Pass + Developer Products).
-- تُجلب الأسعار والأيقونات تلقائياً من Roblox (GetProductInfo) مع قيم احتياطية.
------------------------------------------------------------------------
-- cat: تصنيف العنصر في المتجر (speed=السرعة · packs=الباقات · coins=حزم كوينز) — يستخدمه العميل للفلترة
-- featured: العنصر المميّز الذي يظهر في بانر العرض الكبير (Hero) بأعلى المتجر
local STORE_ITEMS = {
	{ kind = "gamepass", id = CONFIG.SpeedGamePassId,      name = "⚡ سرعة البرق",     price = 60,  emoji = "⚡", cat = "speed",  featured = true, desc = "تحكّم بسرعة مشيك وزِدها عبر شريط تمرير خاص داخل المتجر — مشتراة مرة وتبقى لك للأبد" },
	{ kind = "gamepass", id = CONFIG.VipGamePassId,    name = "⭐ عضوية VIP",        price = 149, emoji = "⭐", cat = "packs", desc = "لاونج خاص · تذاكر بنص السعر · دخل مضاعف · تاج ذهبي · وجبة مجانية" },
	{ kind = "gamepass", id = CONFIG.BuffetGamePassId,     name = "🍿 بوفيه مفتوح",   price = 99,  emoji = "🍿", cat = "packs", desc = "أكل ومشروب مجاني بلا حدود + أصناف حصرية" },
	{ kind = "gamepass", id = CONFIG.ShowrunnerGamePassId, name = "🎬 مالك العرض",    price = 199, emoji = "🎬", cat = "packs", desc = "ابدأ أي فيلم بأي وقت + زر تحكّم خاص" },
	{ kind = "gamepass", id = CONFIG.NeonTrailGamePassId,  name = "✨ أثر نيون",       price = 79,  emoji = "✨", cat = "packs", desc = "توهّج نيون حصري سماوي↔وردي يتبع شخصيتك" },
	{ kind = "gamepass", id = CONFIG.AnnouncerGamePassId,  name = "📢 مايك الإعلان",   price = 89,  emoji = "📢", cat = "packs", desc = "بثّ رسائل إعلان تظهر لكل اللاعبين" },
	{ kind = "product",  id = PRODUCT_IDS.Coins250,    name = "💰 حزمة ٢٥٠ كوينز",   price = 25,  emoji = "💰", cat = "coins", desc = "٢٥٠ كوينز تُضاف فوراً لرصيدك" },
	{ kind = "product",  id = PRODUCT_IDS.Coins600,    name = "💰 حزمة ٦٠٠ كوينز",   price = 50,  emoji = "💰", cat = "coins", desc = "٦٠٠ كوينز — وفّر ٢٠٪" },
	{ kind = "product",  id = PRODUCT_IDS.Coins1500,   name = "💎 حزمة ١٥٠٠ كوينز",  price = 100, emoji = "💎", cat = "coins", desc = "١٥٠٠ كوينز — أفضل قيمة" },
	{ kind = "product",  id = PRODUCT_IDS.Ticket,      name = "🎟️ تذكرة فورية",       price = 15,  emoji = "🎟️", cat = "coins", desc = "تذكرة سينما فورية بضغطة واحدة" },
}

-- كاش معلومات المتجر: النجاح يُحفظ دائماً (المعلومات نادراً ما تتغيّر)،
-- والفشل يُحفظ مؤقتاً (TTL) فقط حتى نتعافى تلقائياً من أعطال API العابرة بدل
-- تثبيت قيمة فاشلة للأبد.
local infoCache = {}
local INFO_FAIL_TTL = 60  -- ثانية
local function getInfoCached(id: number, infoType)
	if not id or id == 0 then return nil end
	local cached = infoCache[id]
	if cached ~= nil then
		if cached.fail then
			if os.clock() < cached.expiry then return nil end  -- ضمن مهلة الفشل المؤقت
		else
			return cached.info                          -- نجاح محفوظ دائماً
		end
	end
	local ok, info = pcall(function() return MarketplaceService:GetProductInfo(id, infoType) end)
	if ok and info then
		infoCache[id] = { info = info }
		return info
	end
	infoCache[id] = { fail = true, expiry = os.clock() + INFO_FAIL_TTL }
	return nil
end

local function ownsGamePass(player: Player, passId: number): boolean
	if not passId or passId == 0 then return false end
	local ok, owns = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, passId)
	end)
	return ok and owns == true
end

local function openStore(player)
	local items = {}
	for _, it in ipairs(STORE_ITEMS) do
		if it.id ~= 0 then
			local infoType = it.kind == "gamepass" and Enum.InfoType.GamePass or Enum.InfoType.Product
			local info = getInfoCached(it.id, infoType)
			local price = (info and info.PriceInRobux) or it.price
			local icon  = (info and info.IconImageAssetId) or 0
			local owned = false
			if it.kind == "gamepass" then
				-- «مملوك» فقط للباقة نفسها — لا تُعلّم كل الباقات مملوكة لأعضاء VIP
				owned = (it.id == CONFIG.VipGamePassId and _G.IsVIP(player)) or ownsGamePass(player, it.id)
			end
			table.insert(items, {
				kind = it.kind, id = it.id, name = it.name, emoji = it.emoji,
				desc = it.desc, price = price, icon = icon, owned = owned,
				cat = it.cat, featured = it.featured == true,
			})
		end
	end
	local s = sessions[player.UserId]
	lobbyRemote:FireClient(player, {
		action = "store",
		items  = items,
		coins  = _G.GetCoins(player),
		vip    = _G.IsVIP(player),
		-- ⚡ حالة باقة السرعة لعرض شريط التمرير في بطاقتها داخل المتجر
		speedValue = clampSpeed(s and s.speed),
		speedMin   = CONFIG.SpeedMin,
		speedMax   = CONFIG.SpeedMax,
	})
end
_G.OpenStore = openStore

------------------------------------------------------------------------
-- ☆ المرحلة ٧ — الإضافات: الإنجازات، تقييم الأفلام، الأركيد، الفعاليات
------------------------------------------------------------------------
_G.EventIncomeMult = 1

-- تعريف الإنجازات (Modular)
local ACH = {
	first_ticket = { emoji = "🎟️", name = "أول تذكرة",  desc = "اشتريت أول تذكرة" },
	first_movie  = { emoji = "🎬", name = "أول فيلم",   desc = "حضرت أول عرض سينمائي" },
	vip          = { emoji = "⭐", name = "عضو VIP",    desc = "أصبحت عضو VIP" },
	rich         = { emoji = "💰", name = "ثريّ",       desc = "جمعت ١٠٠٠ كوينز" },
	buyer        = { emoji = "🛒", name = "داعم",       desc = "دعمت اللعبة بشراء بالـ Robux" },
	rater        = { emoji = "🗳️", name = "ناقد",       desc = "قيّمت فيلماً" },
	arcade       = { emoji = "🕹️", name = "لاعب أركيد", desc = "لعبت في صالة الأركيد" },
	parkour_first = { emoji = "🧗", name = "متسلّق",     desc = "أنهيت أول مرحلة باركور" },
	parkour_done  = { emoji = "🏁", name = "بطل الباركور", desc = "أكملت مسار الباركور كاملاً" },
	explorer      = { emoji = "🗺️", name = "مستكشف",     desc = "زرت جميع مناطق الماب" },
	marathon      = { emoji = "⏱️", name = "ماراثوني",    desc = "قضيت ساعة كاملة من اللعب النشط" },
	sprinter      = { emoji = "🏃", name = "عدّاء",       desc = "ركضت 5 دقائق متراكمة" },
	jumper        = { emoji = "🦘", name = "قفّاز",       desc = "قفزت 100 قفزة" },
	daily_master  = { emoji = "🎯", name = "منجِز اليوم",  desc = "أكملت كل المهام اليومية" },
	weekly_hero   = { emoji = "🏅", name = "بطل الأسبوع",  desc = "أكملت المهمة الأسبوعية الكبرى" },
}
local ACH_ORDER = { "first_ticket", "first_movie", "vip", "rich", "buyer", "rater", "arcade", "parkour_first", "parkour_done", "explorer", "marathon", "sprinter", "jumper", "daily_master", "weekly_hero" }

_G.AwardAchievement = function(player: Player, key: string)
	local s = sessions[player.UserId]
	if not s or not ACH[key] then return end
	s.ach = s.ach or {}
	if s.ach[key] then return end
	s.ach[key] = true
	pcall(function() saveCoins(player.UserId) end)
	local a = ACH[key]
	notify(player, "🏆 إنجاز جديد: " .. a.emoji .. " " .. a.name .. " — " .. a.desc)
end

-- تقييم الأفلام (إجمالي عام يُحفظ في DataStore)
local ratingAgg = { sum = 0, count = 0 }
if coinStore then
	pcall(function()
		local d = coinStore:GetAsync("rating_donation_city")
		if type(d) == "table" and d.sum then ratingAgg = d end
	end)
end
local function ratingAvg(): number
	if ratingAgg.count == 0 then return 0 end
	return ratingAgg.sum / ratingAgg.count
end

_G.SendProfile = function(player: Player)
	local s = sessions[player.UserId]
	if not s then return end
	local list = {}
	for _, key in ipairs(ACH_ORDER) do
		local a = ACH[key]
		table.insert(list, {
			key = key, emoji = a.emoji, name = a.name, desc = a.desc,
			owned = (s.ach and s.ach[key]) == true,
		})
	end
	lobbyRemote:FireClient(player, {
		action       = "profile",
		achievements = list,
		coins        = _G.GetCoins(player),
		vip          = _G.IsVIP(player),
		ratingAvg    = ratingAvg(),
		ratingCount  = ratingAgg.count,
		rated        = s.rated == true,
	})
end

_G.RatePlayer = function(player: Player, value: number?)
	local s = sessions[player.UserId]
	if not s then return end
	if s.rated then
		notify(player, "🗳️ لقد قيّمت الفيلم من قبل — شكراً لك!")
		_G.SendProfile(player)
		return
	end
	local v = math.floor(tonumber(value) or 0)
	if v < 1 or v > 5 then return end
	ratingAgg.sum += v
	ratingAgg.count += 1
	s.rated = true
	pcall(function() saveCoins(player.UserId) end)
	if coinStore then pcall(function() coinStore:SetAsync("rating_donation_city", ratingAgg) end) end
	_G.AwardAchievement(player, "rater")
	notify(player, "🗳️ شكراً لتقييمك (" .. v .. "/5)! متوسط التقييم الآن " .. string.format("%.1f", ratingAvg()))
	_G.SendProfile(player)
end

-- الأركيد: مكافأة كوينز ثابتة مع فترة انتظار (آمنة من الاستغلال)
local ARCADE_REWARD = 15
local ARCADE_COOLDOWN = 30
_G.ArcadePlay = function(player: Player)
	local s = sessions[player.UserId]
	if not s then return end
	local now = os.clock()
	if s.arcadeAt and (now - s.arcadeAt) < ARCADE_COOLDOWN then
		local left = math.ceil(ARCADE_COOLDOWN - (now - s.arcadeAt))
		lobbyRemote:FireClient(player, { action = "arcadeResult", ok = false, wait = left })
		return
	end
	s.arcadeAt = now
	_G.AddCoins(player, ARCADE_REWARD)
	_G.AwardAchievement(player, "arcade")
	lobbyRemote:FireClient(player, { action = "arcadeResult", ok = true, reward = ARCADE_REWARD, coins = _G.GetCoins(player) })
end

-- فعاليات دورية (Special Events)
task.spawn(function()
	-- ملاحظة: حُذف حدث «الدخل المضاعف» مع إلغاء الدخل التلقائي — بقيت الأحداث الاحتفالية فقط.
	local kinds = {
		{ kind = "fireworks", text = "🎆 احتفال في ساحة المدينة — استمتعوا بالألعاب النارية!" },
		{ kind = "popcorn",   text = "🍿 عرض اليوم: مرّوا على بسطة الفشار!" },
		{ kind = "missions",  text = "📋 لا تنسَ مهامك اليومية — أكملها لتجمع الكوينز!" },
	}
	while true do
		task.wait(math.random(180, 300))
		if #Players:GetPlayers() == 0 then continue end
		local e = kinds[math.random(1, #kinds)]
		broadcast(e.text)
		for _, p in ipairs(Players:GetPlayers()) do
			lobbyRemote:FireClient(p, { action = "event", kind = e.kind })
		end
	end
end)

------------------------------------------------------------------------
-- BUILD — شبّاك التذاكر + لوحة العروض (أمام المدخل، في الساحة)
------------------------------------------------------------------------
local GROUND_Y = 1            -- سطح ساحة المدينة
local DARK   = Color3.fromRGB(20, 16, 34)
local PANEL  = Color3.fromRGB(12, 10, 22)
local PURPLE = Color3.fromRGB(168, 92, 255)
local CYAN   = Color3.fromRGB(70, 226, 255)
local GOLD   = Color3.fromRGB(255, 205, 90)

local services = Instance.new("Model")
services.Name = "CinemaServices"
services.Parent = Workspace

local function part(name, size, pos, color, material)
	local p = Instance.new("Part")
	p.Name = name; p.Anchored = true; p.CanCollide = true
	p.Size = size; p.Position = pos
	p.Color = color or DARK; p.Material = material or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth; p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = services
	return p
end

local function surface(parent, face)
	local sg = Instance.new("SurfaceGui")
	sg.Face = face or Enum.NormalId.Front
	sg.CanvasSize = Vector2.new(800, 480)
	sg.LightInfluence = 0
	-- ملاحظة: لا نضبط Adornee. الـ SurfaceGui المُلصق مباشرةً بالجزء (Parent = part)
	-- يلتصق بوجهه ويُحجَب صحيحاً بجسم الجزء المعتم — فلا يَنفُذ نص الوجه الخلفي للأمام.
	-- ضبط Adornee (حتى على نفس الجزء) كان يجعله يتجاوز الحجب فيظهر النص مزدوجاً/معكوساً.
	sg.Parent = parent
	return sg
end

-- ينشئ واجهة على وجهَي اللوح (Back نحو الجمهور +Z و Front) فلا يظهر النص معكوساً من أي جهة
local function dualSurface(parent, builder)
	for _, face in ipairs({ Enum.NormalId.Back, Enum.NormalId.Front }) do
		builder(surface(parent, face))
	end
end

-- 👤 كاشير شباك التذاكر: نستنسخ موديل الموظف الجاهز (مُتحقَّق منه — نظيف 100%: صفر
-- سكربتات، مجرد قطع Parts/Meshes جالس على كرسيّه) من قالب مخفي في ServerScriptService،
-- ونضعه خلف كاونتر الشباك مواجهاً اللاعبين عبر النافذة، كقطعة ديكور ثابتة. لا منطق
-- داخل الموديل — زر الشراء + لوحة الاسم يُربطان هنا في سكربتنا. التموضع يُحسب وقت التشغيل.
local CASHIER_SCALE = 0.5    -- تصغير الموديل (أصله ~12 ستد) لحجم معتدل يناسب خلف الكاونتر
local function buildCashierModel(opts)
	-- ننتظر القالب والشباك حتى لو تأخّر تحميلهما (حماية من سباق التهيئة) بمهلة قصيرة
	local template = ServerScriptService:WaitForChild("CashierModel", 10)
	if not template then return nil end

	local booth = Workspace:WaitForChild("TicketBooth", 10)
	if not booth then return nil end

	local model = template:Clone()
	model.Name = opts.name or "TicketCashier"

	-- موديل ثابت: نُثبّت كل القطع (Anchored) بلا اصطدام؛ ونرصد أكبر قطعة (لربط زر التفاعل)
	-- وأعلى قطعة (الرأس — لتعليق لوحة الاسم). لا نضبط PrimaryPart حتى يبقى محور الموديل
	-- محاذياً للعالم فيصحّ حساب الدوران والإسقاط على الأرض.
	local biggest, bestVol = nil, -1
	local topPart, bestY = nil, -math.huge
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			d.Anchored = true
			d.CanCollide = false
			d.Massless = true
			local v = d.Size.X * d.Size.Y * d.Size.Z
			if v > bestVol then bestVol = v; biggest = d end
			if d.Position.Y > bestY then bestY = d.Position.Y; topPart = d end
		end
	end
	if not biggest then model:Destroy(); return nil end

	-- الحجم المعتدل قبل التموضع (مع تحذير إن فشل ScaleTo فلا يبقى الموديل ضخماً بصمت)
	local scaled = pcall(function() model:ScaleTo(CASHIER_SCALE) end)
	if not scaled then warn("[TicketCashier] ScaleTo فشل؛ قد يظهر الموديل بحجمه الأصلي") end

	-- التوجيه: الموديل مُصمَّم ووجهه نحو محور -Z؛ ندوّره (yaw حول Y) ليطابق faceDir
	-- (افتراضياً +X نحو نافذة/كاونتر الشباك حيث يقف اللاعبون)، ثم نُسقطه على الأرضية.
	local faceDir = opts.faceDir or Vector3.new(1, 0, 0)
	local authored = Vector3.new(0, 0, -1)                 -- اتجاه وجه الموديل الأصلي
	local yaw = math.atan2(faceDir.X, faceDir.Z) - math.atan2(authored.X, authored.Z)
	local target = opts.target or Vector3.new(0, GROUND_Y, 0)
	local pivot = model:GetPivot()
	model:PivotTo(CFrame.new(target.X, pivot.Position.Y, target.Z) * CFrame.Angles(0, yaw, 0))

	-- الاستقرار على الأرضية الفعلية: شعاع لأسفل يبدأ تحت السقف ويتجاهل الموديل نفسه،
	-- ثم نرفع الموديل حتى تلامس أدنى نقطة فيه سطح الأرض (بلا طيران ولا غرق).
	local rp = RaycastParams.new()
	rp.FilterType = Enum.RaycastFilterType.Exclude
	rp.FilterDescendantsInstances = { model }
	local from = Vector3.new(target.X, target.Y + 8, target.Z)
	local hit = Workspace:Raycast(from, Vector3.new(0, -30, 0), rp)
	local bcf, bsize = model:GetBoundingBox()
	local floorY = hit and hit.Position.Y or target.Y
	local lift = floorY - (bcf.Position.Y - bsize.Y / 2)
	model:PivotTo(CFrame.new(0, lift, 0) * model:GetPivot())

	model.Parent = booth

	-- لوحة الاسم فوق الرأس (أعلى قطعة)
	local head = topPart or biggest
	if head then
		local bb = Instance.new("BillboardGui")
		bb.Name = "NameTag"; bb.Adornee = head; bb.Size = UDim2.fromOffset(230, 52)
		-- ارتفاع اللوحة محسوب من حجم الرأس الفعلي (بعد ScaleTo) فلا تطفو عالياً عند التصغير
		bb.StudsOffset = Vector3.new(0, head.Size.Y / 2 + 0.6, 0)
		bb.AlwaysOnTop = true; bb.Parent = head
		local tagLbl = Instance.new("TextLabel")
		tagLbl.BackgroundTransparency = 1; tagLbl.Size = UDim2.fromScale(1, 1)
		tagLbl.Font = Enum.Font.GothamBlack; tagLbl.TextScaled = true
		tagLbl.Text = opts.tag or "🎟️ موظف التذاكر"
		tagLbl.TextColor3 = opts.tagColor or Color3.fromRGB(255, 205, 90)
		tagLbl.TextStrokeTransparency = 0.4; tagLbl.Parent = bb
	end

	-- زر التفاعل: التحدث مع الكاشير يفتح شباك التذاكر (يُربط بأكبر قطعة في الموديل)
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "TicketBoothPrompt"
	prompt.ActionText = opts.promptText or "شبّاك التذاكر"
	prompt.ObjectText = opts.promptObj or "اشترِ تذكرة"
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = opts.maxDist or 16
	prompt.RequiresLineOfSight = false
	prompt.Parent = biggest
	if opts.onTrigger then prompt.Triggered:Connect(opts.onTrigger) end

	return model
end

-- 🎫 شبّاك التذاكر — صار موديل من المتجر (مُنظّف من الباك-دور) محقون في Workspace
-- باسم "TicketBooth" عبر inject_ticketbooth.py. لا نعدّل سكربتات الموديل الأصلية؛
-- منطق الشراء يبقى في سكربتنا: يُربط بزر تفاعل على الكاشير الجالس، وإن تعذّر نرجع
-- لنقطة تفاعل شفّافة أمام الموديل كاحتياط.
-- نُشغّله في خيط منفصل (task.spawn) حتى لا تُعطّل مهلة WaitForChild — في الحالة
-- النادرة لغياب الشباك — تهيئة بقية عناصر السينما (لوحة العروض/الطابور/كبار الزوار).
task.spawn(function()
	-- موضع الموظف خلف الكاونتر (نافذة الشباك على المحور +X عند x≈-8.6)، في منتصف
	-- الشباك تقريباً، مواجهاً اللاعبين الواقفين أمام النافذة (+X).
	local bx, bz = -12.5, -99.7
	local target = Vector3.new(bx, GROUND_Y, bz)

	-- نضع الموظف الجاهز (الجالس على كرسيّه) خلف الكاونتر ونربط زر الشراء به (الأكثر واقعية)
	local cashier = buildCashierModel({
		name = "TicketCashier", tag = "🎟️ موظف التذاكر",
		tagColor = Color3.fromRGB(255, 205, 90),
		target = target, faceDir = Vector3.new(1, 0, 0),   -- يواجه نافذة الشباك/اللاعبين (+X)
		promptText = "شبّاك التذاكر", promptObj = "اشترِ تذكرة",
		maxDist = 16, onTrigger = openBoxOffice,
	})

	-- احتياطي: لو غاب قالب الكاشير أو الكرسي، نُبقي نقطة تفاعل شفّافة أمام الموديل
	if not cashier then
		local hub = Instance.new("Part")
		hub.Name = "TicketBoothInteract"
		hub.Anchored = true
		hub.CanCollide = false
		hub.CanQuery = false
		hub.CanTouch = false
		hub.Transparency = 1
		hub.Size = Vector3.new(8, 10, 8)
		hub.CFrame = CFrame.new(bx, GROUND_Y + 5, bz + 7)
		hub.Parent = Workspace

		local prompt = Instance.new("ProximityPrompt")
		prompt.Name = "TicketBoothPrompt"
		prompt.ActionText = "شبّاك التذاكر"
		prompt.ObjectText = "اشترِ تذكرة"
		prompt.KeyboardKeyCode = Enum.KeyCode.E
		prompt.HoldDuration = 0
		prompt.MaxActivationDistance = 14
		prompt.RequiresLineOfSight = false
		prompt.Parent = hub
		prompt.Triggered:Connect(openBoxOffice)
	end
end)

-- لوحة العروض الحيّة (يمين المدخل) — نص على الوجهين فلا يظهر معكوساً من الخلف
local showLabels, subLabels = {}, {}
do
	local sx = 22
	local sz = -100
	-- دعامتان جانبيتان خلف اللوحة (لا تغطّيان النص) بدل عمود وسطي أمامها
	part("ShowtimesPostL", Vector3.new(1.2, 12, 1.2), Vector3.new(sx - 7.2, GROUND_Y + 6, sz - 0.6), DARK, Enum.Material.Metal)
	part("ShowtimesPostR", Vector3.new(1.2, 12, 1.2), Vector3.new(sx + 7.2, GROUND_Y + 6, sz - 0.6), DARK, Enum.Material.Metal)
	local panel = part("ShowtimesPanel", Vector3.new(13, 7.5, 0.6), Vector3.new(sx, GROUND_Y + 10, sz), PANEL)
	part("ShowtimesFrame", Vector3.new(13.5, 0.35, 0.7), Vector3.new(sx, GROUND_Y + 13.9, sz), CYAN, Enum.Material.Neon)
	part("ShowtimesFrameB", Vector3.new(13.5, 0.35, 0.7), Vector3.new(sx, GROUND_Y + 6.1, sz), PURPLE, Enum.Material.Neon)
	dualSurface(panel, function(sg)
		local pad = Instance.new("Frame")
		pad.BackgroundTransparency = 1; pad.Size = UDim2.fromScale(1, 1); pad.Parent = sg
		local layout = Instance.new("UIListLayout")
		layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
		layout.VerticalAlignment = Enum.VerticalAlignment.Center
		layout.Padding = UDim.new(0, 14); layout.Parent = pad

		local title = Instance.new("TextLabel")
		title.BackgroundTransparency = 1; title.Size = UDim2.new(1, -40, 0, 90)
		title.Font = Enum.Font.GothamBlack; title.TextScaled = true; title.RichText = true
		title.TextColor3 = GOLD; title.Text = "🎬 الآن في العرض"; title.LayoutOrder = 1; title.Parent = pad

		local showLabel = Instance.new("TextLabel")
		showLabel.BackgroundTransparency = 1; showLabel.Size = UDim2.new(1, -40, 0, 110)
		showLabel.Font = Enum.Font.GothamBold; showLabel.TextScaled = true
		showLabel.TextColor3 = Color3.fromRGB(244, 242, 255); showLabel.Text = FILMS[1].title
		showLabel.LayoutOrder = 2; showLabel.Parent = pad
		showLabels[#showLabels + 1] = showLabel

		local subLabel = Instance.new("TextLabel")
		subLabel.BackgroundTransparency = 1; subLabel.Size = UDim2.new(1, -40, 0, 70)
		subLabel.Font = Enum.Font.GothamMedium; subLabel.TextScaled = true
		subLabel.TextColor3 = CYAN; subLabel.Text = "متاح الآن — توجّه للبروجكتر"
		subLabel.LayoutOrder = 3; subLabel.Parent = pad
		subLabels[#subLabels + 1] = subLabel
	end)
end

------------------------------------------------------------------------
-- نظام صفّ الانتظار (Queue) — ينضمّ اللاعب وقت العرض ويُستدعى عند انتهائه
-- أعضاء VIP لهم أولوية في مقدّمة الصف.
------------------------------------------------------------------------
local queueLabels = {}  -- لوحات الوجهين (نُحدّثها كلها معاً)
local queue = {}  -- مصفوفة userId بالترتيب

local function inQueue(userId)
	for i, id in ipairs(queue) do if id == userId then return i end end
	return nil
end

local function updateQueueSign()
	local txt = (#queue > 0) and ("⏳ بالانتظار: " .. #queue) or "🟢 لا يوجد انتظار"
	for _, ql in ipairs(queueLabels) do ql.Text = txt end
end

local function joinQueue(player)
	if not (cinema:GetAttribute("Playing") or false) then
		notify(player, "🟢 العرض متاح الآن — توجّه للبروجكتر مباشرةً، لا حاجة للانتظار.")
		return
	end
	local pos = inQueue(player.UserId)
	if pos then
		notify(player, "⏳ أنت في الصف — ترتيبك " .. pos .. " من " .. #queue .. ".")
		return
	end
	if _G.IsVIP(player) then
		-- ضعه قبل أول لاعب عادي (بعد أعضاء VIP الموجودين)
		local insertAt = #queue + 1
		for i, id in ipairs(queue) do
			local p = Players:GetPlayerByUserId(id)
			if not (p and _G.IsVIP(p)) then insertAt = i; break end
		end
		table.insert(queue, insertAt, player.UserId)
		notify(player, "⭐ انضممت لصفّ الانتظار بأولوية VIP — ترتيبك " .. insertAt .. ".")
	else
		queue[#queue + 1] = player.UserId
		notify(player, "⏳ انضممت لصفّ الانتظار — ترتيبك " .. #queue .. ". بننبّهك عند انتهاء العرض.")
	end
	updateQueueSign()
end

local function flushQueue()
	for _, id in ipairs(queue) do
		local p = Players:GetPlayerByUserId(id)
		if p then notify(p, "✅ انتهى العرض — تفضّل بالدخول واختر مقعدك من البروجكتر!") end
	end
	table.clear(queue)
	updateQueueSign()
end

Players.PlayerRemoving:Connect(function(player)
	local pos = inQueue(player.UserId)
	if pos then table.remove(queue, pos); updateQueueSign() end
end)

-- لافتة صفّ الانتظار + زر الانضمام (وسط المدخل)
do
	local qx, qz = 0, -94
	-- دعامتان جانبيتان خلف اللوحة (لا تغطّيان النص)
	part("QueuePostL", Vector3.new(1, 9, 1), Vector3.new(qx - 4.6, GROUND_Y + 4.5, qz - 0.5), DARK, Enum.Material.Metal)
	part("QueuePostR", Vector3.new(1, 9, 1), Vector3.new(qx + 4.6, GROUND_Y + 4.5, qz - 0.5), DARK, Enum.Material.Metal)
	local panel = part("QueuePanel", Vector3.new(8, 3, 0.5), Vector3.new(qx, GROUND_Y + 8.5, qz), PANEL)
	part("QueueTrim", Vector3.new(8.4, 0.3, 0.6), Vector3.new(qx, GROUND_Y + 10.2, qz), CYAN, Enum.Material.Neon)
	-- شريط أرضي يرشد لمكان الوقوف
	part("QueueMat", Vector3.new(3, 0.1, 10), Vector3.new(qx, GROUND_Y + 0.06, qz - 6), Color3.fromRGB(40, 30, 64), Enum.Material.Neon).CanCollide = false
	dualSurface(panel, function(sg)
		local box = Instance.new("Frame")
		box.BackgroundTransparency = 1; box.Size = UDim2.fromScale(1, 1); box.Parent = sg
		local lay = Instance.new("UIListLayout")
		lay.HorizontalAlignment = Enum.HorizontalAlignment.Center
		lay.VerticalAlignment = Enum.VerticalAlignment.Center; lay.Padding = UDim.new(0, 6); lay.Parent = box
		local t = Instance.new("TextLabel")
		t.BackgroundTransparency = 1; t.Size = UDim2.new(1, -20, 0, 70); t.Font = Enum.Font.GothamBlack
		t.TextScaled = true; t.TextColor3 = GOLD; t.Text = "🎟️ صفّ الدخول"; t.LayoutOrder = 1; t.Parent = box
		local ql = Instance.new("TextLabel")
		ql.BackgroundTransparency = 1; ql.Size = UDim2.new(1, -20, 0, 60)
		ql.Font = Enum.Font.GothamBold; ql.TextScaled = true
		ql.TextColor3 = CYAN; ql.Text = "🟢 لا يوجد انتظار"; ql.LayoutOrder = 2; ql.Parent = box
		queueLabels[#queueLabels + 1] = ql
	end)

	-- منطقة تفاعل غير مرئية على مستوى اللاعب فوق شريط الوقوف
	-- (الزر السابق كان على اللوحة المرتفعة فيختفي حسب بُعد الوقوف)
	local zone = part("QueueZone", Vector3.new(6, 8, 12), Vector3.new(qx, GROUND_Y + 4, qz - 6), DARK)
	zone.Transparency = 1; zone.CanCollide = false; zone.CanQuery = false
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "انضم للصف"; prompt.ObjectText = "صفّ الدخول"
	prompt.KeyboardKeyCode = Enum.KeyCode.E; prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 16; prompt.RequiresLineOfSight = false
	prompt.UIOffset = Vector2.new(0, 0)
	prompt.Parent = zone
	prompt.Triggered:Connect(joinQueue)
end

------------------------------------------------------------------------
-- لاونج VIP — مقاعد ذهبية فاخرة + وجبة VIP مجانية (لأعضاء VIP فقط)
------------------------------------------------------------------------
do
	local lx, lz = -42, -100
	local floor = part("VipLoungeFloor", Vector3.new(16, 1, 12), Vector3.new(lx, GROUND_Y + 0.5, lz), Color3.fromRGB(28, 20, 8), Enum.Material.WoodPlanks)
	local rug = part("VipLoungeRug", Vector3.new(14, 0.12, 10), Vector3.new(lx, GROUND_Y + 1.06, lz), GOLD, Enum.Material.Neon)
	rug.CanCollide = false
	for _, ox in ipairs({ -7, 7 }) do
		for _, oz in ipairs({ -5.5, 5.5 }) do
			part("VipPost", Vector3.new(0.6, 4, 0.6), Vector3.new(lx + ox, GROUND_Y + 3, lz + oz), GOLD, Enum.Material.Neon)
		end
	end
	local sign = part("VipSign", Vector3.new(10, 2.4, 0.4), Vector3.new(lx, GROUND_Y + 7, lz - 5.9), PANEL)
	part("VipSignTrim", Vector3.new(10.4, 0.3, 0.55), Vector3.new(lx, GROUND_Y + 8.4, lz - 5.9), GOLD, Enum.Material.Neon)
	local sg = surface(sign, Enum.NormalId.Front)
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1; l.Size = UDim2.fromScale(1, 1); l.Font = Enum.Font.GothamBlack
	l.TextScaled = true; l.RichText = true; l.TextColor3 = GOLD; l.Text = "⭐ لاونج VIP"; l.Parent = sg

	local function vipSeat(px, pz)
		local seat = Instance.new("Seat")
		seat.Name = "VipSeat"; seat.Anchored = true; seat.CanCollide = true
		seat.Size = Vector3.new(3, 1.4, 3); seat.Color = GOLD; seat.Material = Enum.Material.Neon
		seat.CFrame = CFrame.new(px, GROUND_Y + 2.1, pz)
		seat.TopSurface = Enum.SurfaceType.Smooth
		seat.Parent = floor.Parent
		local back = Instance.new("Part")
		back.Anchored = true; back.CanCollide = false; back.Size = Vector3.new(3, 2.6, 0.5)
		back.Color = Color3.fromRGB(120, 86, 20); back.Material = Enum.Material.SmoothPlastic
		back.CFrame = CFrame.new(px, GROUND_Y + 3.2, pz + 1.25); back.Parent = services
		seat:GetPropertyChangedSignal("Occupant"):Connect(function()
			local occ = seat.Occupant
			if not occ then return end
			local pl = Players:GetPlayerFromCharacter(occ.Parent)
			if pl and not _G.IsVIP(pl) then
				occ.Sit = false
				notify(pl, "⭐ لاونج VIP لأعضاء VIP فقط — ترقَّ من شبّاك التذاكر.")
			end
		end)
		return seat
	end
	vipSeat(lx - 4.5, lz + 1); vipSeat(lx, lz + 1); vipSeat(lx + 4.5, lz + 1)

	-- موزّع الوجبة الخاصة (فشار + مشروب مجاناً لأعضاء VIP)
	local snack = part("VipSnackBar", Vector3.new(5, 3, 2), Vector3.new(lx, GROUND_Y + 2, lz - 4.5), Color3.fromRGB(60, 44, 14), Enum.Material.Metal)
	local sp = Instance.new("ProximityPrompt")
	sp.ActionText = "وجبة VIP"; sp.ObjectText = "احصل على الوجبة الخاصة"
	sp.KeyboardKeyCode = Enum.KeyCode.E; sp.HoldDuration = 0
	sp.MaxActivationDistance = 10; sp.RequiresLineOfSight = false; sp.Parent = snack
	sp.Triggered:Connect(function(player)
		local hasBuffet = _G.OwnsCinemaPass and _G.OwnsCinemaPass(player, "buffet")
		if not (_G.IsVIP(player) or hasBuffet) then
			notify(player, "⭐ الوجبة الخاصة لأعضاء VIP أو حاملي باقة «بوفيه مفتوح» — ترقَّ من الشبّاك أو المتجر.")
			return
		end
		if _G.GiveCinemaFood and _G.GiveCinemaFood(player) then
			notify(player, hasBuffet and "🍿 بوفيه مفتوح: فشار ومشروب مجاناً — بالهنا والشفا!" or "⭐ وجبة VIP الخاصة: فشار ومشروب — بالهنا والشفا!")
		else
			notify(player, "🙂 معك الوجبة بالفعل، استمتع!")
		end
	end)
end

-- تحديث لوحة العروض حسب حالة السينما + كشف انتهاء العرض لاستدعاء الصف
local function fmt(sec: number): string
	sec = math.max(0, math.floor(sec))
	return string.format("%d:%02d", math.floor(sec / 60), sec % 60)
end
task.spawn(function()
	local lastPlaying = false
	while true do
		local playing = cinema:GetAttribute("Playing") or false
		if lastPlaying and not playing then flushQueue() end
		lastPlaying = playing
		for _, sl in ipairs(showLabels) do sl.Text = FILMS[1].title end
		for _, sub in ipairs(subLabels) do
			if playing then
				sub.TextColor3 = Color3.fromRGB(255, 130, 130)
				sub.Text = "🔴 العرض جارٍ — يتبقّى " .. fmt(cinema:GetAttribute("Remain") or 0)
			else
				sub.TextColor3 = CYAN
				sub.Text = "🟢 متاح الآن — توجّه للبروجكتر لبدء العرض"
			end
		end
		task.wait(1)
	end
end)

print("[CinemaServices] Lobby + economy + VIP + queue ready.")
