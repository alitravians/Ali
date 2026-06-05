--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام النشاط والإنجازات الموسّعة — ACTIVITY SYSTEM (Server)            ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  • تتبّع زيارة مناطق الماب (سينما/شاطئ/باركور/ألعاب أطفال)             ║
║    → إنجاز «مستكشف» عند زيارة كل المناطق.                              ║
║  • تتبّع وقت البقاء (تفاعليّاً) → إنجاز «ماراثوني» بعد ساعة.            ║
║  • استقبال تقارير الجري/القفز من العميل (RemoteEvent) بأمان (مع حدّ)    ║
║    → إنجازَا «عدّاء» (٥ دقائق جري) و«قفّاز» (١٠٠ قفزة).                ║
║  • كل الإنجازات تُمنح عبر _G.AwardAchievement (نظام السينما).          ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players          = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService       = game:GetService("RunService")

----------------------------------------------------------------------
-- مناطق الماب (مركز X,Z + نصف قطر) — للكشف عن الزيارة بالموقع
----------------------------------------------------------------------
local AREAS = {
	{ key = "cinema",     cx = 0,    cz = 30,   r = 70  },  -- الساحة + السينما + البوثات
	{ key = "beach",      cx = 150,  cz = 20,   r = 95  },  -- الشاطئ
	{ key = "parkour",    cx = -130, cz = 70,   r = 100 },  -- الباركور (غرب)
	{ key = "playground", cx = 0,    cz = 130,  r = 60  },  -- ألعاب الأطفال (شمال)
}
local TOTAL_AREAS = #AREAS

local MARATHON_SECONDS = 3600   -- ساعة كاملة تفاعليّة → إنجاز ماراثوني
local SPRINT_SECONDS   = 300    -- ٥ دقائق جري تراكمي → إنجاز عدّاء
local JUMP_COUNT       = 100    -- ١٠٠ قفزة → إنجاز قفّاز
local IDLE_RADIUS      = 6      -- إن تحرّك اللاعب أقل من هذا منذ آخر فحص نعتبره ساكناً (مكافحة AFK لوقت الماراثون)

----------------------------------------------------------------------
-- RemoteEvent لتقارير الجري/القفز من العميل
----------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("ActivityRemotes")
if not remotes then
	remotes = Instance.new("Folder")
	remotes.Name = "ActivityRemotes"
	remotes.Parent = ReplicatedStorage
end
local reportRemote = remotes:FindFirstChild("Report")
if not reportRemote then
	reportRemote = Instance.new("RemoteEvent")
	reportRemote.Name = "Report"
	reportRemote.Parent = remotes
end

----------------------------------------------------------------------
-- حالة كل لاعب
----------------------------------------------------------------------
local state = {}  -- [userId] = { visited = {set}, visitCount, activeSecs, sprintSecs, jumps, lastPos, doneExplorer, doneMarathon, doneSprint, doneJump }

local function award(player, key)
	if _G.AwardAchievement then _G.AwardAchievement(player, key) end
end

-- وقت آخر تقرير جري لكل لاعب (مكافحة الإغراق: نحتسب فقط الزمن الحقيقي المنقضي)
local lastSprintAt = {}  -- [userId] = os.clock()

-- 🛡️ مكافحة إغراق الـRemotes: حدّ نداءات لكل لاعب (token-bucket بسيط) يمنع قصف
-- السيرفر بآلاف النداءات/ثانية. الحدود سخيّة جداً مقارنة بالاستخدام الطبيعي.
local _rl = {}
local RL_REFILL, RL_BURST = 15, 25  -- نداء/ثانية (تعبئة) + سعة قصوى للدفعات
local function rlAllow(userId: number): boolean
	local now = os.clock()
	local b = _rl[userId]
	if not b then b = { t = RL_BURST, at = now }; _rl[userId] = b end
	b.t = math.min(RL_BURST, b.t + (now - b.at) * RL_REFILL)
	b.at = now
	if b.t < 1 then return false end
	b.t -= 1
	return true
end

-- 🦘 عدّ القفزات على السيرفر (لا نثق بعدّاد العميل): نلتقط حدث Humanoid.Jumping
-- الفعلي عند صعود القفزة مع مانع ارتداد، فيستحيل تزوير القفزات بإرسال remote.
local JUMP_DEBOUNCE = 0.25  -- ثانية بين قفزتين محتسبتين (قفزة واحدة لا تُعدّ مرّتين)
local function countJump(player: Player)
	local s = state[player.UserId]
	if not s then return end
	local now = os.clock()
	if s.lastJumpAt and (now - s.lastJumpAt) < JUMP_DEBOUNCE then return end
	s.lastJumpAt = now
	s.jumps += 1
	if not s.doneJump and s.jumps >= JUMP_COUNT then
		s.doneJump = true
		award(player, "jumper")
	end
end

local function hookJumps(player: Player, char: Model)
	local hum = char:FindFirstChildOfClass("Humanoid") or char:WaitForChild("Humanoid", 5)
	if not hum then return end
	hum.Jumping:Connect(function(active)
		if active then countJump(player) end
	end)
end

Players.PlayerAdded:Connect(function(player)
	state[player.UserId] = {
		visited = {}, visitCount = 0, activeSecs = 0,
		sprintSecs = 0, jumps = 0, lastJumpAt = nil, lastPos = nil,
		doneExplorer = false, doneMarathon = false, doneSprint = false, doneJump = false,
	}
	-- اربط عدّ القفزات على كل شخصية (تتجدّد عند كل ولادة)
	if player.Character then hookJumps(player, player.Character) end
	player.CharacterAdded:Connect(function(char) hookJumps(player, char) end)
end)

Players.PlayerRemoving:Connect(function(player)
	state[player.UserId] = nil
	lastSprintAt[player.UserId] = nil
	_rl[player.UserId] = nil
end)

----------------------------------------------------------------------
-- تقارير العميل (جري/قفز) — مع حدّ لمنع الإساءة
----------------------------------------------------------------------
reportRemote.OnServerEvent:Connect(function(player, kind, value)
	if not rlAllow(player.UserId) then return end
	local s = state[player.UserId]
	if not s then return end
	if kind == "sprint" then
		-- value = ثوانٍ منذ آخر تقرير. لا نثق بالقيمة وحدها: نحصرها بـ ٢ ثانية/رسالة
		-- **و** بالزمن الحقيقي المنقضي منذ آخر تقرير. هكذا لو أرسل العميل آلاف الرسائل
		-- في نفس اللحظة (إغراق/تزوير) فالزمن الحقيقي بينها ≈ ٠ فلا يُحتسب شيء يُذكر،
		-- ويستحيل فتح إنجاز «عدّاء» أسرع من الجري الفعلي.
		local secs = tonumber(value)
		if not secs then return end
		local now = os.clock()
		local last = lastSprintAt[player.UserId]
		lastSprintAt[player.UserId] = now
		local credit = math.clamp(secs, 0, 2)
		if last then
			credit = math.min(credit, math.max(0, now - last))
		end
		s.sprintSecs += credit
		if not s.doneSprint and s.sprintSecs >= SPRINT_SECONDS then
			s.doneSprint = true
			award(player, "sprinter")
		end
	-- ملاحظة: تقارير «القفز» من العميل لم تعد موثوقة وتُتجاهَل؛ القفز يُعدّ على
	-- السيرفر عبر Humanoid.Jumping (انظر countJump أعلاه) فلا يمكن تزويره.
	end
end)

----------------------------------------------------------------------
-- فحص دوري: زيارة المناطق + وقت البقاء التفاعلي
----------------------------------------------------------------------
local TICK = 3  -- ثوانٍ بين كل فحص

task.spawn(function()
	while true do
		task.wait(TICK)
		for _, player in ipairs(Players:GetPlayers()) do
			local s = state[player.UserId]
			local char = player.Character
			local hrp = char and char:FindFirstChild("HumanoidRootPart")
			if s and hrp then
				local pos = hrp.Position
				local hum = char:FindFirstChildOfClass("Humanoid")

				-- عضوية المناطق (نحسبها مرّة لإعادة استخدامها للزيارة + المهام)
				local inZone = {}
				for _, a in ipairs(AREAS) do
					local dx, dz = pos.X - a.cx, pos.Z - a.cz
					inZone[a.key] = (dx * dx + dz * dz) <= (a.r * a.r)
				end

				-- زيارة المناطق (إنجاز «مستكشف»)
				for _, a in ipairs(AREAS) do
					if not s.visited[a.key] and inZone[a.key] then
						s.visited[a.key] = true
						s.visitCount += 1
						if _G.NotifyPlayer then
							_G.NotifyPlayer(player, string.format("🗺️ اكتشفت منطقة جديدة! (%d/%d)", s.visitCount, TOTAL_AREAS))
						end
					end
				end
				if not s.doneExplorer and s.visitCount >= TOTAL_AREAS then
					s.doneExplorer = true
					award(player, "explorer")
					if _G.AwardBadge then _G.AwardBadge(player, "EXPLORER") end
				end

				-- مهام المناطق (نظام المهام)
				if _G.ReportMission then
					-- 🏖️ زيارة الشاطئ (مرّة واحدة عبر tag) + البقاء فيه (وقت)
					if inZone["beach"] then
						_G.ReportMission(player, "beach_visit", 1, "beach")
						_G.ReportMission(player, "beach_time", TICK)
					end
					-- 🎬 الجلوس داخل قاعة السينما (يتطلّب جلوساً فعلياً لا مجرّد القرب — مكافحة AFK)
					if inZone["cinema"] and hum and hum.Sit then
						_G.ReportMission(player, "cinema_sit", TICK)
					end
				end

				-- وقت البقاء التفاعلي (يُحتسب فقط إن تحرّك اللاعب — مكافحة AFK)
				if s.lastPos then
					local moved = (pos - s.lastPos).Magnitude
					if moved >= IDLE_RADIUS then
						s.activeSecs += TICK
						if not s.doneMarathon and s.activeSecs >= MARATHON_SECONDS then
							s.doneMarathon = true
							award(player, "marathon")
						end
					end
				end
				s.lastPos = pos
			end
		end
	end
end)

print("[ActivitySystem] ready — tracking areas, playtime, sprint & jumps.")
