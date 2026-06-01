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

Players.PlayerAdded:Connect(function(player)
	state[player.UserId] = {
		visited = {}, visitCount = 0, activeSecs = 0,
		sprintSecs = 0, jumps = 0, lastPos = nil,
		doneExplorer = false, doneMarathon = false, doneSprint = false, doneJump = false,
	}
end)

Players.PlayerRemoving:Connect(function(player)
	state[player.UserId] = nil
end)

----------------------------------------------------------------------
-- تقارير العميل (جري/قفز) — مع حدّ لمنع الإساءة
----------------------------------------------------------------------
reportRemote.OnServerEvent:Connect(function(player, kind, value)
	local s = state[player.UserId]
	if not s then return end
	if kind == "sprint" then
		-- value = ثوانٍ منذ آخر تقرير؛ نقصّها لحدّ معقول (≤ 2 ثانية/رسالة)
		local secs = tonumber(value)
		if not secs then return end
		secs = math.clamp(secs, 0, 2)
		s.sprintSecs += secs
		if not s.doneSprint and s.sprintSecs >= SPRINT_SECONDS then
			s.doneSprint = true
			award(player, "sprinter")
		end
	elseif kind == "jump" then
		s.jumps += 1
		if not s.doneJump and s.jumps >= JUMP_COUNT then
			s.doneJump = true
			award(player, "jumper")
		end
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
