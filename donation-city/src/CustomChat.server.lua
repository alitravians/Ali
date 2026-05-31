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
