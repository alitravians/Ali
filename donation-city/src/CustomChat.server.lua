--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام دردشة مخصّص — CUSTOM CHAT (Server)                                ║
║  المكان: ServerScriptService   ·   النوع: Script                       ║
║                                                                        ║
║  ليش مخصّص؟ دردشة روبلوكس الرسمية (TextChatService) مقيّدة في كثير من    ║
║  دول الخليج، فما تظهر لأغلب اللاعبين. هذا النظام واجهة من تصميمنا        ║
║  تشتغل لكل اللاعبين بغضّ النظر عن قيود روبلوكس.                          ║
║                                                                        ║
║  الأمان (إلزامي من روبلوكس): كل رسالة تُمرَّر عبر فلتر النصوص الرسمي      ║
║  TextService:FilterStringAsync ثم تُفلتر لكل مستلِم على حدة قبل بثّها،   ║
║  وفيه حدّ سرعة (rate-limit) وحدّ طول لمنع السبام.                        ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TextService       = game:GetService("TextService")
local DataStoreService  = game:GetService("DataStoreService")

------------------------------------------------------------------------
-- الإعدادات
------------------------------------------------------------------------
local MAX_LEN        = 200    -- أقصى طول للرسالة (حرف)
local MIN_INTERVAL   = 0.6    -- أقل فاصل بين رسالتين لنفس اللاعب (ثانية)
local DISPLAY_PREFIX = ""     -- بادئة اختيارية قبل الاسم

------------------------------------------------------------------------
-- الريموتات (تُنشأ مرة واحدة في ReplicatedStorage)
------------------------------------------------------------------------
local folder = ReplicatedStorage:FindFirstChild("CustomChat")
if not folder then
	folder = Instance.new("Folder")
	folder.Name = "CustomChat"
	folder.Parent = ReplicatedStorage
end

local sayRemote = folder:FindFirstChild("Say")          -- العميل → السيرفر
if not sayRemote then
	sayRemote = Instance.new("RemoteEvent")
	sayRemote.Name = "Say"
	sayRemote.Parent = folder
end

local pushRemote = folder:FindFirstChild("Push")        -- السيرفر → العميل
if not pushRemote then
	pushRemote = Instance.new("RemoteEvent")
	pushRemote.Name = "Push"
	pushRemote.Parent = folder
end

-- 🔒 الدردشة الخاصة (هَمس): العميل يرسل (targetUserId, text)، والسيرفر يبثّ
-- الرسالة للطرفين فقط (المرسِل + المستقبِل) — لا أحد غيرهما يراها.
local whisperRemote = folder:FindFirstChild("Whisper")
if not whisperRemote then
	whisperRemote = Instance.new("RemoteEvent")
	whisperRemote.Name = "Whisper"
	whisperRemote.Parent = folder
end

------------------------------------------------------------------------
-- حدّ السرعة لكل لاعب
------------------------------------------------------------------------
local lastSpoke: { [number]: number } = {}

------------------------------------------------------------------------
-- الكتم (يُتحكَّم به من لوحة الإدارة): المكتوم يقرأ لكن ما يقدر يرسل.
-- يدعم مدداً زمنية (دقيقة/٥/١٠/٣٠/ساعة) أو دائماً حتى يفكّه إداري.
-- نكشف دوالّ عامة تستدعيها لوحة الإدارة في CinemaServices.
------------------------------------------------------------------------
local PERMANENT = 4102444800 -- ختم زمني بعيد جداً (سنة ٢١٠٠) = كتم دائم
local mutedUntil: { [number]: number } = {}  -- userId -> ختم زمني لنهاية الكتم

-- حفظ دائم للكتم (يبقى عبر إعادة الدخول وإعادة تشغيل السيرفر) — يمنع تجاوز الكتم بالخروج والدخول.
-- يعمل تلقائياً في اللعبة المنشورة (نفس آلية حفظ الرتب في CinemaServices).
local muteStore
pcall(function() muteStore = DataStoreService:GetDataStore("CinemaMutes_v1") end)

-- يخزّن/يحذف ختم الكتم في DataStore (غير حاجب — داخل task.spawn مع pcall)
local function persistMute(uid: number)
	if not muteStore then return end
	local until_ = mutedUntil[uid]
	task.spawn(function()
		pcall(function()
			if until_ then
				muteStore:SetAsync("m_" .. uid, until_)
			else
				muteStore:RemoveAsync("m_" .. uid)
			end
		end)
	end)
end

local function remainingFor(uid: number): number
	local until_ = mutedUntil[uid]
	if not until_ then return 0 end
	if until_ >= PERMANENT then return math.huge end
	return math.max(0, until_ - os.time())
end

_G.ChatIsMuted = function(userId): boolean
	local uid = tonumber(userId) or -1
	local until_ = mutedUntil[uid]
	if not until_ then return false end
	if until_ < os.time() then mutedUntil[uid] = nil; return false end
	return true
end

-- on=true: اكتم. seconds = مدة بالثواني (nil/0 = دائم). on=false: فكّ الكتم.
_G.ChatSetMuted = function(userId, on: boolean, seconds)
	local uid = tonumber(userId)
	if not uid then return end
	local secs = tonumber(seconds)
	if on then
		if secs and secs > 0 then
			mutedUntil[uid] = os.time() + math.floor(secs)
		else
			mutedUntil[uid] = PERMANENT
		end
	else
		mutedUntil[uid] = nil
	end
	persistMute(uid)  -- حفظ دائم: يبقى الكتم حتى لو خرج اللاعب ودخل من جديد
	-- أبلغ اللاعب المستهدف ليُعطّل/يُفعّل صندوق الكتابة عنده + الوقت المتبقي
	local target = Players:GetPlayerByUserId(uid)
	if target then
		local rem = remainingFor(uid)
		pushRemote:FireClient(target, {
			muteState = on == true,
			remaining = (rem == math.huge) and -1 or rem,  -- -1 = دائم
		})
	end
end

------------------------------------------------------------------------
-- تفعيل/تعطيل الدردشة كاملةً (من لوحة الإدارة) — الإداريون يتجاوزون التعطيل.
------------------------------------------------------------------------
local chatEnabled = true

_G.ChatIsEnabled = function(): boolean
	return chatEnabled
end

_G.ChatSetEnabled = function(on: boolean)
	chatEnabled = on ~= false
	for _, recipient in ipairs(Players:GetPlayers()) do
		pushRemote:FireClient(recipient, {
			system = true,
			text = chatEnabled and "✅ الدردشة مفتوحة الآن." or "🔒 أُغلقت الدردشة مؤقتاً من الإدارة.",
		})
	end
end

-- دور المتحدّث (لتلوين الاسم + الوسوم): owner/admin/mod/staff/vip/""
local function roleOf(player: Player): string
	if _G.GetChatRank then
		local r = _G.GetChatRank(player)
		if typeof(r) == "string" and r ~= "" then return r end
	end
	-- احتياطي لو خدمة الرتب غير جاهزة
	if _G.IsGameAdmin and _G.IsGameAdmin(player) then return "owner" end
	if _G.IsVIP and _G.IsVIP(player) then return "vip" end
	return ""
end

-- صلاحية الكتابة الإدارية ($رسالة): owner/admin/mod فقط
local ADMIN_LABEL = { owner = "OWNER", admin = "ADMIN", mod = "MODERATOR" }

-- بثّ رسالة نظام لكل اللاعبين (تُستدعى من لوحة الإدارة)
_G.ChatSystemBroadcast = function(text)
	if typeof(text) ~= "string" or text == "" then return end
	for _, recipient in ipairs(Players:GetPlayers()) do
		pushRemote:FireClient(recipient, { system = true, text = text })
	end
end

-- بثّ رسالة إدارية منسّقة [LABEL] لكل اللاعبين (من لوحة الإدارة)
_G.ChatBroadcastAdmin = function(label, name, text)
	if typeof(text) ~= "string" or text == "" then return end
	for _, recipient in ipairs(Players:GetPlayers()) do
		pushRemote:FireClient(recipient, {
			name = DISPLAY_PREFIX .. tostring(name or "الإدارة"),
			role = "owner",
			adminMsg = tostring(label or "ADMIN"),
			text = text,
		})
	end
end

Players.PlayerRemoving:Connect(function(plr)
	lastSpoke[plr.UserId] = nil
	-- ملاحظة: لا نحذف mutedUntil هنا عمداً — حتى لا يتجاوز المكتوم كتمه بمجرد الخروج والدخول.
	-- الكتم الزمني ينتهي تلقائياً بانقضاء وقته (os.time)، والدائم يبقى حتى يفكّه إداري.
end)

-- حمّل حالة الكتم المحفوظة عند دخول اللاعب (تبقى مقفلة عبر الجلسات وإعادة التشغيل)
Players.PlayerAdded:Connect(function(plr)
	if not muteStore then return end
	task.spawn(function()
		local ok, val = pcall(function() return muteStore:GetAsync("m_" .. plr.UserId) end)
		if not (ok and type(val) == "number") then return end
		if val >= PERMANENT or val > os.time() then
			mutedUntil[plr.UserId] = val
			-- أبلغ اللاعب بحالة الكتم بعد جهوزية واجهته
			task.delay(2.5, function()
				if plr and plr.Parent and mutedUntil[plr.UserId] then
					local rem = remainingFor(plr.UserId)
					pushRemote:FireClient(plr, {
						muteState = true,
						remaining = (rem == math.huge) and -1 or rem,
					})
				end
			end)
		else
			-- انقضى الكتم الزمني أثناء غيابه: نظّفه من التخزين
			pcall(function() muteStore:RemoveAsync("m_" .. plr.UserId) end)
		end
	end)
end)

------------------------------------------------------------------------
-- فلترة النص للبثّ العام (آمن ضد الأخطاء)
-- نستخدم GetNonChatStringForBroadcastAsync لأنها أبسط وأنسب للبثّ للجميع.
-- ⚠️ الفلترة إلزامية من روبلوكس: لو فشل الفلتر أو رجّع نصاً فارغاً، نُرجّع nil
-- (نحجب الرسالة) بدل بثّ نص غير مُفلتر — حماية للّاعبين والتزاماً بسياسات روبلوكس.
------------------------------------------------------------------------
-- فلترة النص مع إعادة محاولة واحدة عند الفشل المؤقت (الشبكة/الـAPI)
local function tryFilter(text: string, fromUserId: number)
	for attempt = 1, 2 do
		local ok, result = pcall(function()
			return TextService:FilterStringAsync(text, fromUserId)
		end)
		if ok and result then return result end
		warn("[CustomChat] FilterStringAsync فشل (محاولة " .. attempt .. "): " .. tostring(result))
		if attempt == 1 then task.wait(0.35) end
	end
	return nil
end

local function safeFilter(text: string, fromUserId: number): string?
	local result = tryFilter(text, fromUserId)
	if not result then
		warn("[CustomChat] FilterStringAsync فشل — حُجبت الرسالة (الفلترة إلزامية)")
		return nil
	end

	local ok2, broadcastStr = pcall(function()
		return result:GetNonChatStringForBroadcastAsync()
	end)
	if ok2 and typeof(broadcastStr) == "string" and broadcastStr ~= "" then
		return broadcastStr
	end

	warn("[CustomChat] نتيجة الفلتر فارغة — حُجبت الرسالة")
	return nil
end

-- فلترة مخصّصة لمستلِم معيّن (GetChatForUserAsync) — أقل تشدّداً من البثّ العام
-- وأنسب للرسائل الخاصة (همس).
local function safeFilterForUser(text: string, fromUserId: number, targetUserId: number): string?
	local result = tryFilter(text, fromUserId)
	if not result then
		warn("[CustomChat] FilterStringAsync فشل (همس) — حُجبت الرسالة")
		return nil
	end

	-- ١) الفلترة المخصّصة للمستلِم (الأفضل للرسائل الخاصة)
	local ok2, filtered = pcall(function()
		return result:GetChatForUserAsync(targetUserId)
	end)
	if ok2 and typeof(filtered) == "string" and filtered ~= "" then
		return filtered
	end

	-- ٢) احتياطي: لو فشلت الفلترة المخصّصة، نستخدم فلتر البثّ العام بدل حجب الرسالة كلياً
	warn("[CustomChat] GetChatForUserAsync فشل (همس) — التحوّل لفلتر البثّ العام")
	local ok3, broadcastStr = pcall(function()
		return result:GetNonChatStringForBroadcastAsync()
	end)
	if ok3 and typeof(broadcastStr) == "string" and broadcastStr ~= "" then
		return broadcastStr
	end

	warn("[CustomChat] تعذّرت فلترة رسالة الهمس بكل الطرق — حُجبت")
	return nil
end

------------------------------------------------------------------------
-- ⌘ نظام أوامر الدردشة (Chat Commands)
--   أي رسالة تبدأ بـ "/" تُعالَج كأمر ولا تُبَثّ كرسالة عادية.
--   الصلاحيات تُحسَب من رتبة المتحدّث (owner/admin/mod) عبر roleOf.
------------------------------------------------------------------------
local Workspace = game:GetService("Workspace")

local RANK_WEIGHT = { owner = 4, admin = 3, mod = 2, staff = 1, vip = 0, [""] = 0 }
local function weightOf(player: Player): number
	return RANK_WEIGHT[roleOf(player)] or 0
end

-- رسالة نظام موجّهة للمرسِل فقط (رد على الأمر)
local function tellSender(player: Player, text: string)
	pushRemote:FireClient(player, { system = true, text = text })
end

-- بثّ رسالة نظام لكل اللاعبين (لأوامر مرئية مثل /roll و/me)
local function broadcastSystem(text: string)
	for _, recipient in ipairs(Players:GetPlayers()) do
		pushRemote:FireClient(recipient, { system = true, text = text })
	end
end

-- إيجاد لاعب بالاسم (تطابق تام ثم جزئي على الاسم أو الاسم المعروض)
local function findPlayer(query: string?): Player?
	if not query or query == "" then return nil end
	query = query:lower()
	local partial: Player? = nil
	for _, p in ipairs(Players:GetPlayers()) do
		local n, d = p.Name:lower(), p.DisplayName:lower()
		if n == query or d == query then return p end
		if not partial and (n:sub(1, #query) == query or d:sub(1, #query) == query) then partial = p end
	end
	return partial
end

local function rootOf(player: Player): BasePart?
	local ch = player.Character
	return ch and ch:FindFirstChild("HumanoidRootPart") :: BasePart? or nil
end
local function humanoidOf(player: Player): Humanoid?
	local ch = player.Character
	return ch and ch:FindFirstChildOfClass("Humanoid") or nil
end

------------------------------------------------------------------------
-- 🧊 التجميد: نثبّت اللاعب مكانه (لا يقدر يتحرك) ونعيد التطبيق عند كل ظهور
------------------------------------------------------------------------
local frozen: { [number]: boolean } = {}
-- مهلة /spawn لكل لاعب (تمنع تكرار LoadCharacter بسرعة)
local SPAWN_COOLDOWN = 5
local spawnCooldown: { [number]: number } = {}
local function applyFreeze(player: Player)
	local root, hum = rootOf(player), humanoidOf(player)
	if hum then hum.WalkSpeed = 0; hum.JumpPower = 0; hum.JumpHeight = 0 end
	if root then root.Anchored = true end
end
local function setFrozen(player: Player, on: boolean)
	if on then
		frozen[player.UserId] = true
		applyFreeze(player)
	else
		frozen[player.UserId] = nil
		local root, hum = rootOf(player), humanoidOf(player)
		if hum then hum.WalkSpeed = 16; hum.JumpPower = 50; hum.JumpHeight = 7.2 end
		if root then root.Anchored = false end
	end
end
Players.PlayerAdded:Connect(function(plr)
	plr.CharacterAdded:Connect(function()
		task.wait(0.4)
		if frozen[plr.UserId] then applyFreeze(plr) end
	end)
end)
Players.PlayerRemoving:Connect(function(plr) frozen[plr.UserId] = nil; spawnCooldown[plr.UserId] = nil end)

------------------------------------------------------------------------
-- ⚙️ صلاحيات الأوامر القابلة للتحكم (من لوحة الإدارة)
--   لكل أمر «مستوى مطلوب» يقرّره الأدمن: 0=الجميع · 2=المشرفون فأعلى ·
--   3=الأداريون فأعلى · 99=معطّل. يُحفظ في DataStore فيبقى ثابت بعد
--   إعادة التشغيل، ويُطبّق فوراً على كل اللاعبين.
------------------------------------------------------------------------
local CMD_EVERYONE, CMD_MOD, CMD_ADMIN, CMD_OFF = 0, 2, 3, 99

-- تعريف الأوامر القابلة للتحكم: المفتاح القانوني · الوصف للوحة · المستوى الافتراضي.
-- (help و clear متاحان دائماً للجميع وغير مدرجين هنا فلا يمكن تعطيلهما.)
local CMD_DEFS = {
	-- 🟢 ترفيهية/عامة
	{ key = "me",       label = "✦ /me — تعبير عن فعل",      def = CMD_EVERYONE },
	{ key = "roll",     label = "🎲 /roll — رمي نرد",          def = CMD_EVERYONE },
	{ key = "flip",     label = "🪙 /flip — قذف عملة",         def = CMD_EVERYONE },
	{ key = "coins",    label = "🪙 /coins — رصيدك",           def = CMD_EVERYONE },
	{ key = "tickets",  label = "🎟️ /tickets — تذاكرك",       def = CMD_EVERYONE },
	{ key = "online",   label = "👥 /online — عدد المتصلين",   def = CMD_EVERYONE },
	{ key = "spawn",    label = "🔄 /spawn — العودة للانطلاق", def = CMD_EVERYONE },
	{ key = "vip",      label = "⭐ /vip — حالة VIP",          def = CMD_EVERYONE },
	-- 🔰 إشراف
	{ key = "announce", label = "📢 /announce — إعلان للكل",   def = CMD_MOD },
	{ key = "mute",     label = "🔇 /mute — كتم لاعب",         def = CMD_MOD },
	{ key = "unmute",   label = "🔊 /unmute — فك الكتم",       def = CMD_MOD },
	-- 🛡️ إدارة
	{ key = "kick",     label = "👢 /kick — طرد لاعب",         def = CMD_ADMIN },
	{ key = "bring",    label = "🧲 /bring · /pull — سحب لاعب", def = CMD_ADMIN },
	{ key = "to",       label = "🏃 /to — الانتقال للاعب",     def = CMD_ADMIN },
	{ key = "freeze",   label = "🧊 /freeze — تجميد لاعب",     def = CMD_ADMIN },
	{ key = "unfreeze", label = "🌤️ /unfreeze — فك التجميد",   def = CMD_ADMIN },
	{ key = "fly",      label = "🕊️ /fly — طيران",            def = CMD_ADMIN },
	{ key = "give",     label = "🎁 /give — منح عملات",        def = CMD_ADMIN },
	{ key = "speed",    label = "⚡ /speed — سرعة المشي",       def = CMD_ADMIN },
	{ key = "heal",     label = "❤️ /heal — شفاء لاعب",        def = CMD_ADMIN },
}

-- كل المرادفات (عربي/إنجليزي) → المفتاح القانوني
local CMD_ALIAS: { [string]: string } = {
	help = "help", commands = "help", cmds = "help", ["اوامر"] = "help", ["أوامر"] = "help",
	clear = "clear", ["مسح"] = "clear",
	online = "online", ["المتصلين"] = "online",
	coins = "coins", ["رصيد"] = "coins",
	tickets = "tickets", ["تذاكر"] = "tickets",
	vip = "vip",
	spawn = "spawn", ["سبون"] = "spawn",
	flip = "flip", ["عملة"] = "flip",
	roll = "roll", ["نرد"] = "roll",
	me = "me",
	announce = "announce", ["اعلان"] = "announce", ["إعلان"] = "announce",
	mute = "mute", ["كتم"] = "mute",
	unmute = "unmute", ["فك"] = "unmute",
	kick = "kick", ["طرد"] = "kick",
	bring = "bring", pull = "bring", ["احضار"] = "bring", ["إحضار"] = "bring", ["سحب"] = "bring",
	to = "to", goto = "to", ["انتقال"] = "to",
	freeze = "freeze", ["تجميد"] = "freeze",
	unfreeze = "unfreeze", ["تذويب"] = "unfreeze", ["فك_تجميد"] = "unfreeze",
	fly = "fly", ["طيران"] = "fly",
	give = "give", ["منح"] = "give",
	speed = "speed", ["سرعة"] = "speed",
	heal = "heal", ["شفاء"] = "heal",
}

local CMD_DEF_BY_KEY: { [string]: { key: string, label: string, def: number } } = {}
for _, d in ipairs(CMD_DEFS) do CMD_DEF_BY_KEY[d.key] = d end

-- المستويات الحالية (تبدأ من الافتراضي ثم تُحدَّث من DataStore/الإدارة)
local cmdLevel: { [string]: number } = {}
for _, d in ipairs(CMD_DEFS) do cmdLevel[d.key] = d.def end

local cmdStore: DataStore? = nil
pcall(function() cmdStore = DataStoreService:GetDataStore("ChatCmdPerms_v1") end)
if cmdStore then
	local ok, saved = pcall(function() return (cmdStore :: DataStore):GetAsync("levels") end)
	if ok and typeof(saved) == "table" then
		for k, v in pairs(saved) do
			if CMD_DEF_BY_KEY[k] and typeof(v) == "number" then cmdLevel[k] = v end
		end
	end
end

local function saveCmdLevels()
	if not cmdStore then return end
	local out: { [string]: number } = {}
	for k, v in pairs(cmdLevel) do out[k] = v end
	pcall(function() (cmdStore :: DataStore):SetAsync("levels", out) end)
end

-- بناء قائمة الأوامر بمستوياتها الحالية (للوحة الأوامر/الإدارة)
local function buildCmdList()
	local list = {}
	for _, d in ipairs(CMD_DEFS) do
		table.insert(list, { key = d.key, label = d.label, level = cmdLevel[d.key] or d.def, def = d.def })
	end
	return list
end

-- إرسال الإعدادات للاعب واحد (مع وزن رتبته ليُعرف ما هو متاح له)
local function sendCmdConfig(p: Player)
	pushRemote:FireClient(p, { cmdConfig = buildCmdList(), myWeight = weightOf(p) })
end

-- بثّ تحديث الإعدادات لكل العملاء (لتحديث لوحة الأوامر فوراً)
local function broadcastCmdConfig()
	local list = buildCmdList()
	for _, p in ipairs(Players:GetPlayers()) do
		pushRemote:FireClient(p, { cmdConfig = list, myWeight = weightOf(p) })
	end
end

-- عند الدخول: أرسل إعدادات الأوامر للّاعب (بعد لحظة حتى يجهز العميل)
Players.PlayerAdded:Connect(function(plr)
	task.delay(2, function()
		if plr.Parent then sendCmdConfig(plr) end
	end)
end)

-- 🌐 واجهات للوحة الإدارة (CinemaServices) ---------------------------------
-- قائمة الأوامر بمستوياتها الحالية (لإرسالها مع لوحة الإدارة)
_G.ChatCmdConfigGet = function()
	local list = {}
	for _, d in ipairs(CMD_DEFS) do
		table.insert(list, { key = d.key, label = d.label, level = cmdLevel[d.key] or d.def, def = d.def })
	end
	return list
end
-- تغيير مستوى أمر (يستدعيها السيرفر بعد التحقق من رتبة الطالب)
_G.ChatCmdConfigSet = function(key: string, level: number): boolean
	if not CMD_DEF_BY_KEY[key] then return false end
	if not (level == CMD_EVERYONE or level == CMD_MOD or level == CMD_ADMIN or level == CMD_OFF) then
		return false
	end
	cmdLevel[key] = level
	saveCmdLevels()
	broadcastCmdConfig()
	return true
end

------------------------------------------------------------------------
-- المعالج الرئيسي للأوامر — يرجع true دائماً (الرسالة لا تُبَثّ كدردشة)
------------------------------------------------------------------------
local function handleCommand(sender: Player, raw: string)
	local cmd, rest = raw:sub(2):match("^(%S+)%s*(.*)$")
	if not cmd then return end
	cmd = cmd:lower()
	local w = weightOf(sender)
	local senderName = sender.DisplayName ~= "" and sender.DisplayName or sender.Name

	-- المفتاح القانوني للأمر (يدعم المرادفات العربية/الإنجليزية)
	local key = CMD_ALIAS[cmd]
	if not key then
		tellSender(sender, "❓ أمر غير معروف: /" .. cmd .. " — اكتب /help لعرض كل الأوامر.")
		return
	end

	-- بوابة الصلاحية الموحّدة: help و clear متاحان دائماً للجميع،
	-- وبقية الأوامر تخضع للمستوى المضبوط من لوحة الإدارة.
	if key ~= "help" and key ~= "clear" then
		local lvl = cmdLevel[key] or (CMD_DEF_BY_KEY[key] and CMD_DEF_BY_KEY[key].def) or CMD_EVERYONE
		if lvl >= CMD_OFF then
			tellSender(sender, "🚫 هذا الأمر معطّل حالياً من الإدارة.")
			return
		end
		if w < lvl then
			local who = (lvl >= CMD_ADMIN) and "للأداريين فأعلى" or "للمشرفين فأعلى"
			tellSender(sender, "🔒 هذا الأمر " .. who .. " فقط.")
			return
		end
	end

	-- ============ أوامر متاحة للجميع ============
	if cmd == "help" or cmd == "commands" or cmd == "cmds" or cmd == "اوامر" or cmd == "أوامر" then
		pushRemote:FireClient(sender, { openCommands = true })
	elseif cmd == "clear" or cmd == "مسح" then
		pushRemote:FireClient(sender, { clearChat = true })
	elseif cmd == "online" or cmd == "المتصلين" then
		tellSender(sender, "👥 عدد المتصلين الآن: " .. #Players:GetPlayers())
	elseif cmd == "coins" or cmd == "رصيد" then
		local c = (_G.GetCoins and _G.GetCoins(sender)) or 0
		tellSender(sender, "🪙 رصيدك: " .. tostring(c) .. " عملة")
	elseif cmd == "tickets" or cmd == "تذاكر" then
		local t = (_G.GetTickets and _G.GetTickets(sender)) or 0
		tellSender(sender, "🎟️ تذاكرك: " .. tostring(t))
	elseif cmd == "vip" then
		local v = (_G.IsVIP and _G.IsVIP(sender)) == true
		tellSender(sender, v and "⭐ أنت عضو VIP — استمتع بالمزايا!" or "⭐ لست VIP حالياً. زر متجر اللعبة للاشتراك.")
	elseif cmd == "spawn" or cmd == "سبون" then
		-- مهلة بسيطة تمنع تكرار LoadCharacter بسرعة (إجهاد السيرفر/حالات غير متوقّعة)
		local now = os.clock()
		local last = spawnCooldown[sender.UserId]
		if last and (now - last) < SPAWN_COOLDOWN then
			tellSender(sender, ("⏳ تمهّل — جرّب /spawn بعد %d ثانية."):format(math.ceil(SPAWN_COOLDOWN - (now - last))))
		else
			spawnCooldown[sender.UserId] = now
			if sender.Character then sender:LoadCharacter() end
			tellSender(sender, "🔄 رجّعناك لنقطة الانطلاق.")
		end
	elseif cmd == "flip" or cmd == "عملة" then
		local r = (math.random(2) == 1) and "صورة 👑" or "كتابة ✍️"
		broadcastSystem("🪙 " .. senderName .. " قذف العملة: " .. r)
	elseif cmd == "roll" or cmd == "نرد" then
		local maxN = math.clamp(math.floor(tonumber(rest) or 100), 2, 1000000)
		broadcastSystem("🎲 " .. senderName .. " رمى النرد (1–" .. maxN .. "): " .. math.random(1, maxN))
	elseif cmd == "me" then
		local act = rest:gsub("^%s+", "")
		if act == "" then tellSender(sender, "✍️ الاستخدام: /me <فعل> — مثال: /me يرقص"); return end
		local f = safeFilter(act, sender.UserId)
		if not f or f == "" then tellSender(sender, "⚠️ تعذّرت فلترة رسالتك."); return end
		broadcastSystem("💬 ✦ " .. senderName .. " " .. f)

	-- ============ أوامر المشرفين (Mod فأعلى) ============
	elseif cmd == "announce" or cmd == "اعلان" or cmd == "إعلان" then
		local msg = rest:gsub("^%s+", "")
		if msg == "" then tellSender(sender, "✍️ الاستخدام: /announce <النص>"); return end
		local f = safeFilter(msg, sender.UserId)
		if not f or f == "" then tellSender(sender, "⚠️ تعذّرت فلترة الإعلان."); return end
		if _G.ChatBroadcastAdmin then _G.ChatBroadcastAdmin("📢 إعلان", senderName, f) else broadcastSystem("📢 " .. f) end
		if _G.AdminSetMarquee then pcall(function() _G.AdminSetMarquee("📢 " .. f) end) end
	elseif cmd == "mute" or cmd == "كتم" then
		local who, a = rest:match("^(%S+)%s*(%S*)")
		local target = findPlayer(who)
		if not target then tellSender(sender, "❓ ما لقيت لاعباً بهذا الاسم."); return end
		if weightOf(target) >= w then tellSender(sender, "🚫 لا يمكنك كتم من رتبته مثلك أو أعلى."); return end
		local minutes = tonumber(a)
		if _G.ChatSetMuted then _G.ChatSetMuted(target.UserId, true, minutes and math.floor(minutes * 60) or 0) end
		tellSender(sender, "🔇 تم كتم " .. target.DisplayName .. " (" .. (minutes and (tostring(minutes) .. " دقيقة") or "دائم") .. ").")
	elseif cmd == "unmute" or cmd == "فك" then
		local target = findPlayer(rest:match("^(%S+)"))
		if not target then tellSender(sender, "❓ ما لقيت لاعباً بهذا الاسم."); return end
		if _G.ChatSetMuted then _G.ChatSetMuted(target.UserId, false) end
		tellSender(sender, "🔊 تم فك الكتم عن " .. target.DisplayName .. ".")

	-- ============ أوامر الأدمن (Admin فأعلى) ============
	elseif cmd == "kick" or cmd == "طرد" then
		local who, reason = rest:match("^(%S+)%s*(.*)$")
		local target = findPlayer(who)
		if not target then tellSender(sender, "❓ ما لقيت لاعباً بهذا الاسم."); return end
		if weightOf(target) >= w then tellSender(sender, "🚫 لا يمكنك طرد من رتبته مثلك أو أعلى."); return end
		local r = (reason ~= "" and reason) or "بدون سبب محدّد"
		target:Kick("🚫 طُردت من اللعبة.\nالسبب: " .. r)
		tellSender(sender, "👢 تم طرد " .. target.DisplayName .. " — السبب: " .. r)
	elseif cmd == "bring" or cmd == "pull" or cmd == "احضار" or cmd == "إحضار" or cmd == "سحب" then
		local target = findPlayer(rest:match("^(%S+)"))
		local sr, tr = rootOf(sender), target and rootOf(target)
		if not (target and sr and tr) then tellSender(sender, "❓ تعذّر السحب (تأكد من الاسم وأن اللاعب ظاهر)."); return end
		tr.CFrame = sr.CFrame * CFrame.new(0, 0, -4)
		tellSender(sender, "🧲 تم سحب " .. target.DisplayName .. " إليك.")
	elseif cmd == "to" or cmd == "goto" or cmd == "انتقال" then
		local target = findPlayer(rest:match("^(%S+)"))
		local sr, tr = rootOf(sender), target and rootOf(target)
		if not (target and sr and tr) then tellSender(sender, "❓ تعذّر الانتقال."); return end
		sr.CFrame = tr.CFrame * CFrame.new(0, 0, -4)
		tellSender(sender, "🏃 انتقلت إلى " .. target.DisplayName .. ".")
	elseif cmd == "freeze" or cmd == "تجميد" then
		local target = findPlayer(rest:match("^(%S+)"))
		if not target then tellSender(sender, "❓ ما لقيت لاعباً بهذا الاسم."); return end
		if weightOf(target) >= w and target ~= sender then tellSender(sender, "🚫 لا يمكنك تجميد من رتبته مثلك أو أعلى."); return end
		setFrozen(target, true)
		tellSender(sender, "🧊 تم تجميد " .. target.DisplayName .. ".")
		if target ~= sender and _G.NotifyPlayer then _G.NotifyPlayer(target, "🧊 تم تجميدك مؤقتاً من الإدارة.") end
	elseif cmd == "unfreeze" or cmd == "فك_تجميد" or cmd == "تذويب" then
		local target = findPlayer(rest:match("^(%S+)"))
		if not target then tellSender(sender, "❓ ما لقيت لاعباً بهذا الاسم."); return end
		setFrozen(target, false)
		tellSender(sender, "🌤️ تم فك تجميد " .. target.DisplayName .. ".")
		if target ~= sender and _G.NotifyPlayer then _G.NotifyPlayer(target, "🌤️ تم فك تجميدك — تقدر تتحرك الآن.") end
	elseif cmd == "fly" or cmd == "طيران" then
		local speed = math.clamp(math.floor(tonumber(rest) or 60), 16, 300)
		pushRemote:FireClient(sender, { flyToggle = true, flySpeed = speed })
	elseif cmd == "give" or cmd == "منح" then
		local who, amtStr = rest:match("^(%S+)%s*(%S*)$")
		local target = findPlayer(who)
		local amt = tonumber(amtStr)
		if not target then tellSender(sender, "❓ ما لقيت لاعباً بهذا الاسم."); return end
		if not amt or amt == 0 then tellSender(sender, "✍️ الاستخدام: /give <لاعب> <عدد العملات>"); return end
		amt = math.clamp(math.floor(amt), -1000000, 1000000)
		if _G.AddCoins then _G.AddCoins(target, amt) end
		tellSender(sender, "🪙 منحت " .. target.DisplayName .. " " .. tostring(amt) .. " عملة.")
		if target ~= sender and _G.NotifyPlayer then _G.NotifyPlayer(target, "🎁 استلمت " .. tostring(amt) .. " عملة من الإدارة!") end
	elseif cmd == "speed" or cmd == "سرعة" then
		local nStr, who = rest:match("^(%S+)%s*(.*)$")
		local n = tonumber(nStr)
		if not n then tellSender(sender, "✍️ الاستخدام: /speed <رقم> [لاعب]"); return end
		local target = (who ~= "" and findPlayer(who)) or sender
		local h = humanoidOf(target)
		if h then h.WalkSpeed = math.clamp(n, 0, 300); tellSender(sender, "🏃 سرعة " .. target.DisplayName .. " = " .. math.clamp(n, 0, 300)) else tellSender(sender, "❓ اللاعب غير ظاهر.") end
	elseif cmd == "heal" or cmd == "شفاء" then
		local target = (rest ~= "" and findPlayer(rest:match("^(%S+)"))) or sender
		local h = humanoidOf(target)
		if h then h.Health = h.MaxHealth; tellSender(sender, "❤️ تم شفاء " .. target.DisplayName .. ".") else tellSender(sender, "❓ اللاعب غير ظاهر.") end
	else
		tellSender(sender, "❓ أمر غير معروف: /" .. cmd .. " — اكتب /help لعرض كل الأوامر.")
	end
end

------------------------------------------------------------------------
-- استقبال رسالة من لاعب، فلترتها، وبثّها للجميع
------------------------------------------------------------------------
sayRemote.OnServerEvent:Connect(function(sender: Player, rawText)
	-- تحقّق صارم من المدخلات (لا نثق بالعميل أبداً)
	if typeof(rawText) ~= "string" then return end

	local senderRole = roleOf(sender)
	local isStaffPlus = ADMIN_LABEL[senderRole] ~= nil  -- owner/admin/mod (يحقّ له الرسالة الإدارية $)
	-- طاقم السينما (staff) يتجاوز إغلاق الدردشة ليستقبل/يجيب، لكن لا يملك الرسالة الإدارية
	local canBypassDisabled = isStaffPlus or senderRole == "staff"

	-- لو الدردشة مغلقة: الإداريون والطاقم فقط يتجاوزون
	if not chatEnabled and not canBypassDisabled then
		pushRemote:FireClient(sender, {
			system = true,
			text = "🔒 الدردشة مغلقة حالياً من الإدارة.",
		})
		return
	end

	-- المكتوم لا يقدر يرسل (يُبلَّغ فقط هو مع الوقت المتبقي)
	if _G.ChatIsMuted(sender.UserId) then
		local rem = remainingFor(sender.UserId)
		local when
		if rem == math.huge then
			when = "دائم (حتى يفكّه إداري)"
		else
			when = "المتبقّي: " .. tostring(math.ceil(rem / 60)) .. " دقيقة"
		end
		pushRemote:FireClient(sender, {
			system = true,
			text = "🚫 أنت مكتوم من الإدارة — لا يمكنك الإرسال. " .. when,
		})
		return
	end

	local text = rawText:gsub("[\r\n\t]", " ")           -- إزالة أسطر/تبويب
	text = text:gsub("^%s+", ""):gsub("%s+$", "")        -- قصّ الفراغات
	if text == "" then return end

	-- ⌘ الأوامر: أي رسالة تبدأ بـ "/" تُعالَج كأمر ولا تُبَثّ كدردشة
	if text:sub(1, 1) == "/" and text ~= "/" then
		handleCommand(sender, text)
		return
	end

	-- الكتابة الإدارية: تبدأ بـ "$" والمرسِل owner/admin/mod
	local adminLabel = nil
	if isStaffPlus and text:sub(1, 1) == "$" then
		adminLabel = ADMIN_LABEL[senderRole]
		text = text:sub(2):gsub("^%s+", "")   -- احذف الرمز والفراغ بعده
		if text == "" then return end
	end

	if #text > MAX_LEN then
		text = text:sub(1, MAX_LEN)
	end

	-- حدّ السرعة
	local now = os.clock()
	local last = lastSpoke[sender.UserId] or 0
	if now - last < MIN_INTERVAL then return end
	lastSpoke[sender.UserId] = now

	-- الفلترة الرسمية (إلزامية): إن فشلت أو رجعت فارغة نحجب الرسالة ونُعلم المرسِل فقط
	local shownText = safeFilter(text, sender.UserId)
	if not shownText or shownText == "" then
		pushRemote:FireClient(sender, {
			system = true,
			text = "⚠️ تعذّرت فلترة رسالتك الآن — لم تُرسَل. حاول مرة أخرى بعد قليل.",
		})
		return
	end

	local senderName = sender.DisplayName ~= "" and sender.DisplayName or sender.Name

	-- بثّ للجميع
	for _, recipient in ipairs(Players:GetPlayers()) do
		pushRemote:FireClient(recipient, {
			name = DISPLAY_PREFIX .. senderName,
			userId = sender.UserId,
			role = senderRole,
			adminMsg = adminLabel,       -- nil للرسالة العادية · OWNER/ADMIN/MODERATOR للإدارية
			text = shownText,
		})
	end

	-- مهمة اجتماعية: «أرسل رسالة بالدردشة»
	if _G.ReportMission then _G.ReportMission(sender, "chat_msg", 1) end
end)

------------------------------------------------------------------------
-- 🔒 استقبال رسالة خاصة (هَمس) — تُبثّ للطرفين فقط
------------------------------------------------------------------------
local lastWhisper: { [number]: number } = {}

whisperRemote.OnServerEvent:Connect(function(sender: Player, targetUserId, rawText)
	-- تحقّق صارم من المدخلات (لا نثق بالعميل أبداً)
	if typeof(rawText) ~= "string" then return end
	local targetId = tonumber(targetUserId)
	if not targetId then return end
	if targetId == sender.UserId then return end  -- لا يهمس لنفسه

	local target = Players:GetPlayerByUserId(targetId)
	if not target then
		pushRemote:FireClient(sender, { system = true, text = "⚠️ هذا اللاعب لم يعد في السيرفر." })
		return
	end

	local senderRole = roleOf(sender)
	local canBypassDisabled = (ADMIN_LABEL[senderRole] ~= nil) or senderRole == "staff"

	-- لو الدردشة مغلقة: الإداريون والطاقم فقط يتجاوزون
	if not chatEnabled and not canBypassDisabled then
		pushRemote:FireClient(sender, { system = true, text = "🔒 الدردشة مغلقة حالياً من الإدارة." })
		return
	end

	-- المكتوم لا يقدر يرسل خاص أيضاً
	if _G.ChatIsMuted(sender.UserId) then
		pushRemote:FireClient(sender, { system = true, text = "🚫 أنت مكتوم — لا يمكنك إرسال رسائل خاصة." })
		return
	end

	local text = rawText:gsub("[\r\n\t]", " ")
	text = text:gsub("^%s+", ""):gsub("%s+$", "")
	if text == "" then return end
	if #text > MAX_LEN then text = text:sub(1, MAX_LEN) end

	-- حدّ السرعة للهمس
	local now = os.clock()
	if now - (lastWhisper[sender.UserId] or 0) < MIN_INTERVAL then return end
	lastWhisper[sender.UserId] = now

	-- فلترة مخصّصة للمستلِم (GetChatForUserAsync) — أقل تشدّداً من البثّ العام، فلا تتحوّل كلمات
	-- عادية إلى #### بين لاعبين بالغين.
	local shownText = safeFilterForUser(text, sender.UserId, target.UserId)
	if not shownText or shownText == "" then
		pushRemote:FireClient(sender, { system = true, text = "⚠️ تعذّرت فلترة رسالتك الآن — لم تُرسَل." })
		return
	end

	local senderName = sender.DisplayName ~= "" and sender.DisplayName or sender.Name
	local targetName = target.DisplayName ~= "" and target.DisplayName or target.Name

	-- نسخة للمرسِل (mine=true) ونسخة للمستقبِل (mine=false) — لا أحد غيرهما
	pushRemote:FireClient(sender, {
		private = true, mine = true,
		fromName = senderName, toName = targetName,
		fromUserId = sender.UserId, toUserId = targetId,
		role = senderRole, text = shownText,
	})
	pushRemote:FireClient(target, {
		private = true, mine = false,
		fromName = senderName, toName = targetName,
		fromUserId = sender.UserId, toUserId = targetId,
		role = senderRole, text = shownText,
	})
end)

Players.PlayerRemoving:Connect(function(plr)
	lastWhisper[plr.UserId] = nil
end)

print("[CustomChat] السيرفر جاهز — دردشة مخصّصة مع فلترة رسمية + همس خاص.")
