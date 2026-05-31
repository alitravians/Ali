--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام الباركور — PARKOUR SYSTEM (Server)                              ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  الباركور القديم (البرج المُولّد برمجياً) أُلغي بالكامل بناءً على طلبك،   ║
║  واستُبدل بموديل «Obby» احترافي من متجر روبلوكس (٣٠ مرحلة، ارتفاع        ║
║  ~٣٧٠ ستد) مُركّب كهندسة ثابتة باسم "ParkourCourse" في Workspace:        ║
║  ─ كل سكربتات الـ kit الأصلية (٤٢ سكربت + موديولات مُقنّعة باك-دور)      ║
║    أُسقطت نهائياً، وكل قطعة Anchored=true (صفر فيزياء = صفر لاق).         ║
║  ─ SpawnLocation الموديل مُبقاة لكن Enabled=false (لا تخطف نقطة ظهور      ║
║    اللاعبين)؛ نقرأ موقعها فقط كبداية المسار.                            ║
║  ─ هذا السكربت لا يبني أي هندسة؛ يقرأ القاعدة/القمة/المنصّات من الموديل   ║
║    المُركّب مباشرةً، فالمنطق يعمل مع أي تخطيط Obby.                       ║
║                                                                        ║
║  • منصّة دخول في المدينة تنقل اللاعب لقاعدة المسار وتبدأ الجولة.         ║
║  • نقاط حفظ تلقائية حسب الارتفاع (تلمس منصّة أعلى = تتحدّث نقطتك).        ║
║  • تسقط أسفل القاعدة → ترجع لآخر نقطة حفظ (وليس طرد لكل اللاعبين).        ║
║  • تصل القمة → كوينز + إنجاز + احتساب مهمة + تهنئة + خروج آمن.            ║
║  • زر «إيقاف» يرجّعك للمدينة. أفضل وقت شخصي محفوظ (DataStore).           ║
║                                                                        ║
║  ⚙️ الأداء: لا أجزاء متحركة ولا أي حلقة دائمة على السيرفر؛ كل شيء مبني   ║
║     على أحداث Touched فقط، وحلقتا التقدّم/السقوط تعملان فقط أثناء جولة    ║
║     لاعب نشِطة وتتوقّفان تلقائياً → صفر استهلاك أثناء الخمول (لا لاق).    ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace         = game:GetService("Workspace")
local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")
local DataStoreService  = game:GetService("DataStoreService")

local V = Vector3.new

----------------------------------------------------------------------
-- RemoteEvents (نفس عقد الواجهة القديمة: Progress / Stop)
----------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("ParkourRemotes")
if not remotes then
	remotes = Instance.new("Folder"); remotes.Name = "ParkourRemotes"; remotes.Parent = ReplicatedStorage
end
local progressRemote = remotes:FindFirstChild("Progress")
if not progressRemote then
	progressRemote = Instance.new("RemoteEvent"); progressRemote.Name = "Progress"; progressRemote.Parent = remotes
end
local stopRemote = remotes:FindFirstChild("Stop")
if not stopRemote then
	stopRemote = Instance.new("RemoteEvent"); stopRemote.Name = "Stop"; stopRemote.Parent = remotes
end

----------------------------------------------------------------------
-- أفضل وقت شخصي (اختياري، آمن بـ pcall)
----------------------------------------------------------------------
local bestStore
pcall(function() bestStore = DataStoreService:GetDataStore("ParkourBest_v2") end)

----------------------------------------------------------------------
-- قراءة هندسة المسار من الموديل المُركّب "ParkourCourse"
-- (لا نبني أي شيء هنا؛ كل القطع جاهزة وثابتة داخل الموديل)
----------------------------------------------------------------------
local course = Workspace:WaitForChild("ParkourCourse", 30)

-- بداية المسار: SpawnLocation الموديل (مُعطّلة) أو أي قطعة باسم Spawn.
local function findSpawnPart(model)
	local sl = model:FindFirstChildWhichIsA("SpawnLocation", true)
	if sl then return sl end
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") and d.Name == "Spawn" then return d end
	end
	return nil
end

local steps      = {}      -- منصّات أفقية يمكن الوقوف عليها (لنقاط الحفظ بالارتفاع)
local cpPads     = {}      -- أقراص نقاط الحفظ الرسمية بالموديل (مجلد CheckPoints)
local killParts  = {}      -- هذا الموديل بلا مناطق موت؛ نعتمد السقوط فقط
local finishPart           -- مُحفِّز الفوز (نُنشئه عند القمة)
local SPAWN_POS, SPAWN_CF, BASE_Y, FINISH_Y, FALL_Y
local EXIT_POS  = V(0, 5, 45)        -- خروج آمن قرب الانطلاق الرئيسي
local ENTRY_POS = V(-95, 0.3, 70)    -- منصّة دخول أرضية في المدينة (أرض المدينة Y=0)

if course then
	local spawnPart = findSpawnPart(course)
	if spawnPart then
		SPAWN_POS = spawnPart.Position
		BASE_Y    = SPAWN_POS.Y
	else
		SPAWN_POS = V(-140, 1.5, 37)   -- احتياطي
		BASE_Y    = 1.5
	end
	SPAWN_CF = CFrame.new(SPAWN_POS + V(0, 5, 0))

	-- منصّة أفقية يمكن الوقوف عليها فعلاً (نتفادى الجدران/الأعمدة/السلالم)
	local function isWalkable(p)
		if not p.CanCollide then return false end
		if p:IsA("TrussPart") then return false end
		if p.Size.Y > 6 then return false end
		if (p.Size.X * p.Size.Z) < 16 then return false end
		if p.CFrame.UpVector.Y < 0.9 then return false end
		return true
	end

	-- القمة = أعلى منصّة يمكن الوقوف عليها فعلاً (نتجاهل العناصر الزخرفية العالية
	-- كالأعلام/الهوائيات حتى لا يرتفع مُحفِّز الفوز فوق متناول اللاعب). نجمع كذلك
	-- المنصّات وأقراص نقاط الحفظ في نفس المرور.
	local topWalkableY = -math.huge
	local maxAnyY = -math.huge
	for _, d in ipairs(course:GetDescendants()) do
		if d:IsA("BasePart") then
			local topY = d.Position.Y + d.Size.Y / 2
			if topY > maxAnyY then maxAnyY = topY end
			if d ~= spawnPart and isWalkable(d) then
				table.insert(steps, d)
				if topY > topWalkableY then topWalkableY = topY end
			end
			local par = d.Parent
			if par and par.Name == "CheckPoints" then
				table.insert(cpPads, d)
			end
		end
	end
	-- لو لم نجد أي منصّة (موديل غير متوقّع) نرجع لأعلى نقطة عامة كاحتياط.
	local summitY = (topWalkableY > -math.huge) and topWalkableY or maxAnyY
	FINISH_Y = summitY
	FALL_Y   = BASE_Y - 14

	-- مركز القمة الأفقي: متوسط المنصّات القريبة من القمة (لا أي قطعة)
	local sumX, sumZ, nTop = 0, 0, 0
	for _, d in ipairs(steps) do
		local topY = d.Position.Y + d.Size.Y / 2
		if topY >= summitY - 8 then
			sumX += d.Position.X; sumZ += d.Position.Z; nTop += 1
		end
	end
	local fx = nTop > 0 and (sumX / nTop) or SPAWN_POS.X
	local fz = nTop > 0 and (sumZ / nTop) or SPAWN_POS.Z

	-- مُحفِّز الفوز: صندوق شفاف غير صلب فوق أعلى منصّة (يلمسه اللاعب عند الوصول)
	finishPart = Instance.new("Part")
	finishPart.Name = "ParkourFinish"; finishPart.Anchored = true; finishPart.CanCollide = false
	finishPart.CanTouch = true; finishPart.Transparency = 1
	finishPart.Size = V(34, 12, 34)
	finishPart.CFrame = CFrame.new(fx, summitY + 3, fz)
	finishPart.Parent = course
else
	warn("[ParkourSystem] لم يُعثر على موديل ParkourCourse — تأكد من حقن الموديل في Workspace.")
	SPAWN_POS = V(-140, 1.5, 37); BASE_Y = 1.5
	SPAWN_CF  = CFrame.new(SPAWN_POS + V(0, 5, 0))
	FINISH_Y  = BASE_Y + 360; FALL_Y = BASE_Y - 14
end

----------------------------------------------------------------------
-- منصّة الدخول في المدينة + لافتة
----------------------------------------------------------------------
local entryPad = Instance.new("Part")
entryPad.Name = "ParkourEntry"; entryPad.Anchored = true; entryPad.CanCollide = true
entryPad.Size = V(10, 0.6, 10); entryPad.Position = ENTRY_POS
entryPad.Color = Color3.fromRGB(255, 205, 70); entryPad.Material = Enum.Material.Neon
entryPad.Transparency = 0.15; entryPad.TopSurface = Enum.SurfaceType.Smooth
entryPad.Parent = Workspace

do
	local sign = Instance.new("Part")
	sign.Name = "ParkourEntrySign"; sign.Anchored = true; sign.CanCollide = false
	sign.Size = V(8, 3.4, 0.4); sign.Position = ENTRY_POS + V(0, 4, 0)
	sign.Color = Color3.fromRGB(24, 30, 46); sign.Material = Enum.Material.SmoothPlastic
	sign.Parent = Workspace
	local sg = Instance.new("SurfaceGui"); sg.Face = Enum.NormalId.Front
	sg.CanvasSize = Vector2.new(720, 300); sg.LightInfluence = 0; sg.Parent = sign
	local lbl = Instance.new("TextLabel"); lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
	lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
	lbl.TextColor3 = Color3.fromRGB(255, 205, 70)
	lbl.Text = "🧗 برج الباركور\n<font size=\"30\">قف هنا للانتقال للبداية</font>"
	lbl.Parent = sg
end

----------------------------------------------------------------------
-- أدوات
----------------------------------------------------------------------
local function fmtTime(sec)
	local m = math.floor(sec / 60)
	local s = sec - m * 60
	return string.format("%d:%05.2f", m, s)
end

local function teleportTo(player, cf)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if hrp then hrp.CFrame = cf end
end

local function playerFromHit(hit)
	local char = hit and hit.Parent
	if not char then return nil end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then return nil end
	return Players:GetPlayerFromCharacter(char)
end

----------------------------------------------------------------------
-- حالة الجولة لكل لاعب
----------------------------------------------------------------------
local runState = {}   -- [userId] = { inRun, startT, cpCF, cpY, best, loop }
local updateFallWatcher   -- forward declaration (يُعرّف لاحقاً)
local finishRun           -- forward declaration

local function progressPercent(player)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if not hrp then return 0 end
	local pct = (hrp.Position.Y - BASE_Y) / math.max(FINISH_Y - BASE_Y, 1) * 100
	return math.clamp(math.floor(pct), 0, 100)
end

local function sendProgress(player, state)
	local st = runState[player.UserId]
	local elapsed = (st and st.inRun) and (os.clock() - st.startT) or 0
	local pct = (st and st.inRun) and progressPercent(player) or 0
	progressRemote:FireClient(player, {
		state   = state or ((st and st.inRun) and "run" or "idle"),
		stage   = math.clamp(math.floor(pct / 25) + 1, 1, 4),
		cp      = math.clamp(math.floor(pct / 25) + 1, 1, 4),
		total   = 4,
		percent = pct,
		time    = elapsed,
	})
end

local function stopProgressLoop(st)
	if st and st.loop then
		-- pcall: قد تكون الحلقة قد انتهت بنفسها (خرجت بـ return) فلا تُلغى مرتين
		pcall(task.cancel, st.loop)
		st.loop = nil
	end
end

local function startRun(player)
	local st = runState[player.UserId]
	if st and st.inRun then return end
	st = { inRun = true, startT = os.clock(), cpCF = SPAWN_CF, cpY = BASE_Y, best = st and st.best }
	runState[player.UserId] = st
	teleportTo(player, SPAWN_CF)
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "🧗 بدأ الباركور! اطلع لأعلى ووصل للقمة.") end
	sendProgress(player, "run")
	-- حلقة تقدّم تعمل فقط أثناء جولة هذا اللاعب وتنتهي تلقائياً
	st.loop = task.spawn(function()
		while runState[player.UserId] == st and st.inRun do
			sendProgress(player, "run")
			-- احتياطي للفوز: لو وصل القمة دون لمس المُحفِّز. ننفّذه في خيط مستقل
			-- ونخرج من الحلقة بـ return (بدل استدعاء finishRun هنا الذي يُلغي هذا
			-- الخيط نفسه أثناء تنفيذه — نمط هشّ).
			local char = player.Character
			local hrp = char and char:FindFirstChild("HumanoidRootPart")
			if hrp and hrp.Position.Y >= FINISH_Y - 4 then
				if finishRun then task.spawn(finishRun, player) end
				return
			end
			task.wait(0.6)
		end
	end)
	if updateFallWatcher then updateFallWatcher() end
end

local function stopRun(player)
	local st = runState[player.UserId]
	if st then st.inRun = false; stopProgressLoop(st) end
	teleportTo(player, CFrame.new(EXIT_POS))
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "🛑 أوقفت الباركور وخرجت من المسار.") end
	progressRemote:FireClient(player, { state = "idle" })
	if updateFallWatcher then updateFallWatcher() end
end

stopRemote.OnServerEvent:Connect(function(player)
	stopRun(player)
end)

----------------------------------------------------------------------
-- منصّة الدخول: تبدأ الجولة وتنقل للقاعدة
----------------------------------------------------------------------
local entryCooldown = {}
entryPad.Touched:Connect(function(hit)
	local player = playerFromHit(hit)
	if not player then return end
	if entryCooldown[player.UserId] then return end
	entryCooldown[player.UserId] = true
	startRun(player)
	task.delay(2, function() entryCooldown[player.UserId] = nil end)
end)

----------------------------------------------------------------------
-- نقاط الحفظ التلقائية: تلمس منصّة أعلى من نقطتك الحالية = تتحدّث
----------------------------------------------------------------------
for _, step in ipairs(steps) do
	local topY = step.Position.Y + step.Size.Y / 2
	step.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		if topY > st.cpY + 1.5 then
			st.cpY = topY
			st.cpCF = CFrame.new(step.Position.X, topY + 3.5, step.Position.Z)
		end
	end)
end

-- نقاط الحفظ الرسمية بالموديل (CheckPoints): تثبّت نقطة الرجوع + تحتسب مهمة parkour_cp
for _, pad in ipairs(cpPads) do
	local topY = pad.Position.Y + pad.Size.Y / 2
	pad.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		st.cpHit = st.cpHit or {}
		if not st.cpHit[pad] then
			st.cpHit[pad] = true
			if _G.ReportMission then _G.ReportMission(player, "parkour_cp", 1) end
		end
		if topY > st.cpY + 1.5 then
			st.cpY = topY
			st.cpCF = CFrame.new(pad.Position.X, topY + 3.5, pad.Position.Z)
		end
	end)
end

----------------------------------------------------------------------
-- مناطق الموت (إن وُجدت): ترجع لآخر نقطة حفظ
----------------------------------------------------------------------
local killCooldown = {}
local function respawnAtCheckpoint(player)
	local st = runState[player.UserId]
	if not st or not st.inRun then return end
	if killCooldown[player.UserId] then return end
	killCooldown[player.UserId] = true
	teleportTo(player, st.cpCF or SPAWN_CF)
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "↩️ رجعناك لآخر نقطة حفظ.") end
	task.delay(0.6, function() killCooldown[player.UserId] = nil end)
end

for _, kp in ipairs(killParts) do
	kp.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if player then respawnAtCheckpoint(player) end
	end)
end

----------------------------------------------------------------------
-- الفوز: كوينز + إنجاز + مهمة + تهنئة + أفضل وقت + خروج
----------------------------------------------------------------------
local REWARD = 250
local finishCooldown = {}
finishRun = function(player)
	local st = runState[player.UserId]
	if not st or not st.inRun then return end
	if finishCooldown[player.UserId] then return end
	finishCooldown[player.UserId] = true

	st.inRun = false
	stopProgressLoop(st)
	if updateFallWatcher then updateFallWatcher() end
	local elapsed = os.clock() - st.startT

	-- أفضل وقت شخصي
	local isRecord = false
	if not st.best or elapsed < st.best then
		st.best = elapsed; isRecord = true
		if bestStore then
			pcall(function() bestStore:SetAsync(tostring(player.UserId), math.floor(elapsed * 100)) end)
		end
	end

	if _G.AddCoins then _G.AddCoins(player, REWARD) end
	if _G.AwardAchievement then
		_G.AwardAchievement(player, "parkour_first")
		_G.AwardAchievement(player, "parkour_done")
	end
	if _G.ReportMission then _G.ReportMission(player, "parkour_done", 1) end
	if _G.NotifyPlayer then
		_G.NotifyPlayer(player, string.format(
			"🏁 أكملت الباركور! الوقت %s%s — مكافأة %d كوينز + لقب «بطل الباركور» 🏆",
			fmtTime(elapsed), isRecord and " (رقم قياسي جديد!)" or "", REWARD))
	end

	progressRemote:FireClient(player, { state = "finish", time = elapsed, reward = REWARD, percent = 100, total = 4 })
	task.delay(2, function()
		teleportTo(player, CFrame.new(EXIT_POS))
		finishCooldown[player.UserId] = nil
	end)
end

if finishPart then
	finishPart.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if player then finishRun(player) end
	end)
end

----------------------------------------------------------------------
-- مراقبة السقوط أسفل القاعدة (للاعبين النشطين فقط) عبر Heartbeat واحد
-- يعمل فقط عند وجود لاعب نشِط واحد على الأقل، ويتوقّف تماماً عند الخمول.
----------------------------------------------------------------------
local fallConn
updateFallWatcher = function()
	local anyActive = false
	for _, st in pairs(runState) do
		if st.inRun then anyActive = true; break end
	end
	if anyActive and not fallConn then
		fallConn = RunService.Heartbeat:Connect(function()
			for _, player in ipairs(Players:GetPlayers()) do
				local st = runState[player.UserId]
				if st and st.inRun then
					local char = player.Character
					local hrp = char and char:FindFirstChild("HumanoidRootPart")
					if hrp and hrp.Position.Y < FALL_Y then
						respawnAtCheckpoint(player)
					end
				end
			end
		end)
	elseif not anyActive and fallConn then
		fallConn:Disconnect(); fallConn = nil
	end
end

----------------------------------------------------------------------
-- تنظيف عند خروج اللاعب + إعادة فحص المراقب
----------------------------------------------------------------------
Players.PlayerRemoving:Connect(function(player)
	local st = runState[player.UserId]
	stopProgressLoop(st)
	runState[player.UserId] = nil
	entryCooldown[player.UserId] = nil
	killCooldown[player.UserId] = nil
	finishCooldown[player.UserId] = nil
	updateFallWatcher()
end)

-- إيقاف الجولة عند الموت/إعادة الإحياء (لا تبقى الحالة عالقة)
Players.PlayerAdded:Connect(function(player)
	-- استرجاع أفضل وقت محفوظ (اختياري)
	if bestStore then
		task.spawn(function()
			local ok, v = pcall(function() return bestStore:GetAsync(tostring(player.UserId)) end)
			if ok and type(v) == "number" then
				runState[player.UserId] = runState[player.UserId] or {}
				runState[player.UserId].best = v / 100
			end
		end)
	end
	-- الموديل الأصلي فيه ٤١ «بلوك موت» (Touched -> Humanoid.Health = 0). نُبقي
	-- هذي السكربتات كما هي (نظيفة)، لكن بدل ما يرجع اللاعب لمركز المدينة عند الموت،
	-- نرجّعه لآخر نقطة حفظ ونُكمّل الجولة — فالموت داخل المسار = استئناف من الشيك بوينت.
	player.CharacterAdded:Connect(function(char)
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		local hrp = char:WaitForChild("HumanoidRootPart", 5)
		if hrp then
			task.wait()  -- إطار واحد حتى يستقرّ التحكّم قبل النقل
			hrp.CFrame = st.cpCF or SPAWN_CF
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "↩️ رجعناك لآخر نقطة حفظ.") end
		end
	end)
end)
