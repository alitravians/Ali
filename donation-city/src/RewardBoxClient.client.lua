--[[
╔══════════════════════════════════════════════════════════════════════╗
║  واجهة صندوق المكافآت — REWARD BOX CLIENT (Client)                    ║
║  المكان: StarterPlayerScripts    ·     النوع: LocalScript              ║
║                                                                        ║
║  • واجهة قائمة المهام (لايك / فيفورت / إشعارات / قروب)                 ║
║  • فقاعة شكر احترافية بعد استلام المكافأة مع أنيميشن                   ║
║  • تتواصل مع RewardBoxSystem عبر RewardRemotes                       ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService      = game:GetService("TweenService")
local Workspace         = game:GetService("Workspace")

local player = Players.LocalPlayer
local pg     = player:WaitForChild("PlayerGui")

local remotes = ReplicatedStorage:WaitForChild("RewardRemotes", 30)
if not remotes then return end

local showUIRemote   = remotes:WaitForChild("ShowUI", 10)
local checkGroupFunc = remotes:WaitForChild("CheckGroup", 10)
local claimRemote    = remotes:WaitForChild("Claim", 10)
local resultRemote   = remotes:WaitForChild("Result", 10)
local effectRemote   = remotes:WaitForChild("Effect", 10)
if not showUIRemote or not resultRemote then return end

------------------------------------------------------------------------
-- ألوان
------------------------------------------------------------------------
local BG_COL     = Color3.fromRGB(18, 12, 35)
local PANEL_COL  = Color3.fromRGB(30, 18, 55)
local ROW_COL    = Color3.fromRGB(22, 14, 42)
local GOLD_COL   = Color3.fromRGB(255, 215, 90)
local PURPLE_COL = Color3.fromRGB(168, 85, 247)
local GREEN_COL  = Color3.fromRGB(90, 220, 120)
local RED_COL    = Color3.fromRGB(220, 70, 70)
local TEXT_COL   = Color3.fromRGB(240, 240, 250)
local DIM_COL    = Color3.fromRGB(140, 140, 160)

------------------------------------------------------------------------
-- أدوات UI
------------------------------------------------------------------------
local function corner(parent, r)
	local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, r or 12); c.Parent = parent; return c
end

local function stroke(parent, col, th)
	local s = Instance.new("UIStroke"); s.Color = col or GOLD_COL; s.Thickness = th or 2; s.Parent = parent; return s
end

local function tweenTo(obj, props, dur)
	TweenService:Create(obj, TweenInfo.new(dur or 0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), props):Play()
end

------------------------------------------------------------------------
-- إشعار محلي بسيط (لا يعتمد على _G)
------------------------------------------------------------------------
local function showNotify(text)
	local g = Instance.new("ScreenGui")
	g.Name = "RBNotify"; g.ResetOnSpawn = false; g.IgnoreGuiInset = true; g.DisplayOrder = 120; g.Parent = pg

	local lbl = Instance.new("TextLabel")
	lbl.AnchorPoint = Vector2.new(0.5, 0)
	lbl.Position = UDim2.new(0.5, 0, 0, 60)
	lbl.Size = UDim2.fromOffset(420, 42)
	lbl.BackgroundColor3 = PANEL_COL; lbl.BackgroundTransparency = 0.1
	lbl.Text = text; lbl.TextColor3 = GOLD_COL
	lbl.Font = Enum.Font.GothamBold; lbl.TextScaled = true; lbl.Parent = g
	corner(lbl, 10); stroke(lbl, GOLD_COL, 1)

	task.delay(3, function()
		tweenTo(lbl, { BackgroundTransparency = 1, TextTransparency = 1 }, 0.5)
		task.wait(0.6); g:Destroy()
	end)
end

------------------------------------------------------------------------
-- حالة
------------------------------------------------------------------------
local TASKS = {
	{ key = "like",   icon = "👍", label = "لايك للعبة" },
	{ key = "fav",    icon = "⭐", label = "تفضيل اللعبة" },
	{ key = "notify", icon = "🔔", label = "تفعيل الإشعارات" },
	{ key = "group",  icon = "👥", label = "الانضمام للقروب" },
}

local done = {}        -- [key] = true
local activeGui = nil
local claimBtnRef = nil

------------------------------------------------------------------------
-- بناء واجهة قائمة المهام
------------------------------------------------------------------------
local function showChecklist(data)
	if activeGui then activeGui:Destroy() end
	done = {}
	claimBtnRef = nil

	-- forward-declare markDone so the async check below can call it
	local markDone

	local gui = Instance.new("ScreenGui")
	gui.Name = "RewardBoxUI"; gui.ResetOnSpawn = false
	gui.IgnoreGuiInset = true; gui.DisplayOrder = 100
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling; gui.Parent = pg
	activeGui = gui

	-- خلفية شبه شفافة
	local bg = Instance.new("Frame")
	bg.Size = UDim2.new(1, 0, 1, 0); bg.BackgroundColor3 = Color3.new(0, 0, 0)
	bg.BackgroundTransparency = 0.5; bg.BorderSizePixel = 0; bg.Parent = gui

	-- اللوحة المركزية
	local panel = Instance.new("Frame")
	panel.AnchorPoint = Vector2.new(0.5, 0.5)
	panel.Position = UDim2.new(0.5, 0, 0.5, 0)
	panel.Size = UDim2.fromOffset(420, 440)
	panel.BackgroundColor3 = PANEL_COL; panel.Parent = gui
	corner(panel, 16); stroke(panel, GOLD_COL, 2.5)

	-- أنيميشن دخول
	panel.Size = UDim2.fromOffset(0, 0)
	tweenTo(panel, { Size = UDim2.fromOffset(420, 440) }, 0.4)

	-- العنوان
	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, -40, 0, 38); title.Position = UDim2.new(0, 10, 0, 12)
	title.BackgroundTransparency = 1; title.Text = "صندوق مكافآت مدينة شهد"
	title.TextColor3 = GOLD_COL; title.Font = Enum.Font.GothamBlack; title.TextScaled = true; title.Parent = panel

	-- العنوان الفرعي
	local sub = Instance.new("TextLabel")
	sub.Size = UDim2.new(1, -20, 0, 20); sub.Position = UDim2.new(0, 10, 0, 52)
	sub.BackgroundTransparency = 1; sub.Text = "أكمل المهام الأربع لاستلام المكافأة"
	sub.TextColor3 = DIM_COL; sub.Font = Enum.Font.GothamMedium; sub.TextScaled = true; sub.Parent = panel

	-- فاصل
	local sep = Instance.new("Frame")
	sep.Size = UDim2.new(0.9, 0, 0, 1); sep.Position = UDim2.new(0.05, 0, 0, 78)
	sep.BackgroundColor3 = GOLD_COL; sep.BackgroundTransparency = 0.5; sep.BorderSizePixel = 0; sep.Parent = panel

	-- مراجع لتحديث الحالة لاحقاً
	local statusRefs = {}
	local btnRefs = {}

	local function refreshClaimBtn()
		local allDone = done.like and done.fav and done.notify and done.group
		if claimBtnRef then
			claimBtnRef.BackgroundColor3 = allDone and GOLD_COL or Color3.fromRGB(60, 40, 80)
			claimBtnRef.TextColor3 = allDone and BG_COL or DIM_COL
			claimBtnRef.AutoButtonColor = allDone == true
		end
	end

	markDone = function(key)
		done[key] = true
		if statusRefs[key] then statusRefs[key].Text = "✅"; statusRefs[key].TextColor3 = GREEN_COL end
		if btnRefs[key] then btnRefs[key].Text = "تم"; btnRefs[key].BackgroundColor3 = Color3.fromRGB(40, 100, 60); btnRefs[key].AutoButtonColor = false end
		refreshClaimBtn()
	end

	-- تحقق من الإشعارات (إن كان اللاعب مشتركاً بالفعل، CanPromptOptIn يرجع false)
	task.spawn(function()
		local ok, svc = pcall(function() return game:GetService("ExperienceNotificationService") end)
		if ok and svc then
			local canPrompt = true
			pcall(function() canPrompt = svc:CanPromptOptInAsync() end)
			if not canPrompt then markDone("notify") end
		end
	end)

	-- تحقق حالة القروب بعد بناء الواجهة
	if data.inGroup then markDone("group") end

	-- صفوف المهام
	for i, t in ipairs(TASKS) do
		local row = Instance.new("Frame")
		row.Size = UDim2.new(0.9, 0, 0, 50)
		row.Position = UDim2.new(0.05, 0, 0, 86 + (i - 1) * 58)
		row.BackgroundColor3 = ROW_COL; row.BorderSizePixel = 0; row.Parent = panel
		corner(row, 10)

		local st = Instance.new("TextLabel")
		st.Size = UDim2.fromOffset(34, 34); st.Position = UDim2.new(0, 8, 0.5, -17)
		st.BackgroundTransparency = 1; st.Font = Enum.Font.GothamBold; st.TextScaled = true
		st.Text = done[t.key] and "✅" or "⬜"
		st.TextColor3 = done[t.key] and GREEN_COL or DIM_COL; st.Parent = row
		statusRefs[t.key] = st

		local txt = Instance.new("TextLabel")
		txt.Size = UDim2.new(0.48, 0, 1, 0); txt.Position = UDim2.new(0, 46, 0, 0)
		txt.BackgroundTransparency = 1; txt.Text = t.icon .. " " .. t.label
		txt.TextColor3 = TEXT_COL; txt.Font = Enum.Font.GothamMedium; txt.TextScaled = true
		txt.TextXAlignment = Enum.TextXAlignment.Right; txt.Parent = row

		local btn = Instance.new("TextButton")
		btn.Size = UDim2.fromOffset(80, 32); btn.AnchorPoint = Vector2.new(1, 0.5)
		btn.Position = UDim2.new(1, -8, 0.5, 0)
		btn.BackgroundColor3 = done[t.key] and Color3.fromRGB(40, 100, 60) or PURPLE_COL
		btn.Text = done[t.key] and "تم" or (t.key == "group" and "تحقّق" or "تنفيذ")
		btn.TextColor3 = Color3.new(1, 1, 1)
		btn.Font = Enum.Font.GothamBold; btn.TextSize = 14
		btn.AutoButtonColor = not done[t.key]; btn.Parent = row
		corner(btn, 8)
		btnRefs[t.key] = btn

		if not done[t.key] then
			if t.key == "like" or t.key == "fav" then
				btn.MouseButton1Click:Connect(function()
					if done[t.key] then return end
					btn.Text = "جارٍ..."; btn.AutoButtonColor = false
					task.wait(2)
					markDone(t.key)
				end)

			elseif t.key == "notify" then
				btn.MouseButton1Click:Connect(function()
					if done[t.key] then return end
					btn.Text = "جارٍ..."
					local okS, svc = pcall(function() return game:GetService("ExperienceNotificationService") end)
					if okS and svc then
						local canP = false
						pcall(function() canP = svc:CanPromptOptInAsync() end)
						if canP then
							pcall(function() svc:PromptOptIn() end)
							task.wait(3)
						end
					end
					markDone("notify")
				end)

			elseif t.key == "group" then
				btn.MouseButton1Click:Connect(function()
					if done[t.key] then return end
					btn.Text = "جارٍ..."
					local inGroup = false
					if checkGroupFunc then
						pcall(function() inGroup = checkGroupFunc:InvokeServer() end)
					end
					if inGroup then
						markDone("group")
					else
						btn.Text = "انضم أولاً"
						btn.BackgroundColor3 = RED_COL
						task.wait(2)
						if not done.group then
							btn.Text = "تحقّق"
							btn.BackgroundColor3 = PURPLE_COL
						end
					end
				end)
			end
		end
	end

	-- فاصل سفلي
	local sep2 = Instance.new("Frame")
	sep2.Size = UDim2.new(0.9, 0, 0, 1); sep2.Position = UDim2.new(0.05, 0, 0, 326)
	sep2.BackgroundColor3 = GOLD_COL; sep2.BackgroundTransparency = 0.5; sep2.BorderSizePixel = 0; sep2.Parent = panel

	-- نص المكافأة
	local rwdLbl = Instance.new("TextLabel")
	rwdLbl.Size = UDim2.new(0.9, 0, 0, 22); rwdLbl.Position = UDim2.new(0.05, 0, 0, 334)
	rwdLbl.BackgroundTransparency = 1; rwdLbl.Text = "المكافأة: 1000 كوينز + إنجاز «داعم مدينة شهد»"
	rwdLbl.TextColor3 = GOLD_COL; rwdLbl.Font = Enum.Font.GothamMedium; rwdLbl.TextScaled = true; rwdLbl.Parent = panel

	-- زر الاستلام
	local claimBtn = Instance.new("TextButton")
	claimBtn.AnchorPoint = Vector2.new(0.5, 0)
	claimBtn.Position = UDim2.new(0.5, 0, 0, 366)
	claimBtn.Size = UDim2.fromOffset(260, 42)
	claimBtn.BackgroundColor3 = Color3.fromRGB(60, 40, 80)
	claimBtn.Text = "🎁 استلم المكافأة"
	claimBtn.TextColor3 = DIM_COL; claimBtn.Font = Enum.Font.GothamBlack; claimBtn.TextSize = 18
	claimBtn.AutoButtonColor = false; claimBtn.Parent = panel
	corner(claimBtn, 10); stroke(claimBtn, GOLD_COL, 1.5)
	claimBtnRef = claimBtn

	claimBtn.MouseButton1Click:Connect(function()
		if not (done.like and done.fav and done.notify and done.group) then return end
		claimBtn.Text = "جارٍ الاستلام..."; claimBtn.AutoButtonColor = false
		if claimRemote then claimRemote:FireServer() end
	end)

	refreshClaimBtn()

	-- زر الإغلاق
	local closeBtn = Instance.new("TextButton")
	closeBtn.AnchorPoint = Vector2.new(1, 0)
	closeBtn.Position = UDim2.new(1, -8, 0, 8)
	closeBtn.Size = UDim2.fromOffset(32, 32)
	closeBtn.BackgroundColor3 = RED_COL; closeBtn.Text = "✕"
	closeBtn.TextColor3 = Color3.new(1, 1, 1); closeBtn.Font = Enum.Font.GothamBold
	closeBtn.TextSize = 16; closeBtn.Parent = panel
	corner(closeBtn, 8)

	closeBtn.MouseButton1Click:Connect(function()
		if activeGui then activeGui:Destroy(); activeGui = nil end
	end)
end

------------------------------------------------------------------------
-- فقاعة الشكر الاحترافية
------------------------------------------------------------------------
local function showThankYou()
	if activeGui then activeGui:Destroy(); activeGui = nil end

	local gui = Instance.new("ScreenGui")
	gui.Name = "RewardThankYou"; gui.ResetOnSpawn = false
	gui.IgnoreGuiInset = true; gui.DisplayOrder = 110
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling; gui.Parent = pg

	local bg = Instance.new("Frame")
	bg.Size = UDim2.new(1, 0, 1, 0); bg.BackgroundColor3 = Color3.new(0, 0, 0)
	bg.BackgroundTransparency = 0.4; bg.BorderSizePixel = 0; bg.Parent = gui

	local card = Instance.new("Frame")
	card.AnchorPoint = Vector2.new(0.5, 0.5)
	card.Position = UDim2.new(0.5, 0, 0.5, 0)
	card.Size = UDim2.fromOffset(460, 360)
	card.BackgroundColor3 = PANEL_COL; card.Parent = gui
	corner(card, 20); stroke(card, GOLD_COL, 3)

	-- أنيميشن دخول
	card.BackgroundTransparency = 1; card.Size = UDim2.fromOffset(0, 0)
	tweenTo(card, { Size = UDim2.fromOffset(460, 360), BackgroundTransparency = 0 }, 0.5)

	-- عنوان "مبروك!"
	local h = Instance.new("TextLabel")
	h.Size = UDim2.new(1, 0, 0, 60); h.Position = UDim2.new(0, 0, 0, 16)
	h.BackgroundTransparency = 1; h.Text = "مبروك!"
	h.TextColor3 = GOLD_COL; h.Font = Enum.Font.GothamBlack; h.TextScaled = true; h.Parent = card

	-- المكافأة
	local rwd = Instance.new("TextLabel")
	rwd.Size = UDim2.new(0.9, 0, 0, 30); rwd.Position = UDim2.new(0.05, 0, 0, 80)
	rwd.BackgroundTransparency = 1
	rwd.Text = "حصلت على 1000 كوينز + إنجاز «داعم مدينة شهد»"
	rwd.TextColor3 = GOLD_COL; rwd.Font = Enum.Font.GothamBold; rwd.TextScaled = true; rwd.Parent = card

	-- فاصل
	local sep = Instance.new("Frame")
	sep.Size = UDim2.new(0.8, 0, 0, 1); sep.Position = UDim2.new(0.1, 0, 0, 118)
	sep.BackgroundColor3 = GOLD_COL; sep.BackgroundTransparency = 0.5; sep.BorderSizePixel = 0; sep.Parent = card

	-- رسالة الشكر مع تفاصيل المهام
	local msg = Instance.new("TextLabel")
	msg.Size = UDim2.new(0.85, 0, 0, 160); msg.Position = UDim2.new(0.075, 0, 0, 130)
	msg.BackgroundTransparency = 1
	msg.Text = "شكراً لدعمك مدينة شهد!\n\n"
		.. "✅ سوّيت لايك\n"
		.. "✅ فضّلت اللعبة\n"
		.. "✅ فعّلت الإشعارات\n"
		.. "✅ انضممت للقروب"
	msg.TextColor3 = TEXT_COL; msg.Font = Enum.Font.GothamMedium; msg.TextScaled = true
	msg.TextYAlignment = Enum.TextYAlignment.Top; msg.Parent = card

	-- توقيع
	local sig = Instance.new("TextLabel")
	sig.Size = UDim2.new(0.9, 0, 0, 20); sig.Position = UDim2.new(0.05, 0, 1, -30)
	sig.BackgroundTransparency = 1; sig.Text = "— مدينة شهد —"
	sig.TextColor3 = PURPLE_COL; sig.Font = Enum.Font.GothamBold; sig.TextScaled = true; sig.Parent = card

	-- إغلاق تلقائي بعد 6 ثوانٍ
	task.delay(6, function()
		if not gui.Parent then return end
		tweenTo(card, { BackgroundTransparency = 1, Size = UDim2.fromOffset(0, 0) }, 0.4)
		tweenTo(bg, { BackgroundTransparency = 1 }, 0.4)
		task.wait(0.5)
		if gui.Parent then gui:Destroy() end
	end)
end

------------------------------------------------------------------------
-- المعالجات
------------------------------------------------------------------------
showUIRemote.OnClientEvent:Connect(function(data)
	showChecklist(data)
end)

resultRemote.OnClientEvent:Connect(function(status)
	if status == "success" then
		showThankYou()
	elseif status == "already" then
		if activeGui then activeGui:Destroy(); activeGui = nil end
	elseif status == "need_group" then
		showNotify("يجب الانضمام لقروب Shahad-Jori أولاً")
		if claimBtnRef then claimBtnRef.Text = "🎁 استلم المكافأة" end
	end
end)

-- تأثيرات بصرية عند استلام أي لاعب (يراها الكل)
if effectRemote then
	effectRemote.OnClientEvent:Connect(function()
		local city = Workspace:FindFirstChild("City")
		local box = city and city:FindFirstChild("RewardBox")
		local body = box and box:FindFirstChild("BoxBody")
		if not body then return end

		local burst = Instance.new("ParticleEmitter")
		burst.Color = ColorSequence.new(GOLD_COL)
		burst.Size = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.5),
			NumberSequenceKeypoint.new(1, 0),
		})
		burst.Lifetime = NumberRange.new(0.8, 1.5)
		burst.Speed = NumberRange.new(8, 15)
		burst.SpreadAngle = Vector2.new(180, 180)
		burst.LightEmission = 1
		burst.Parent = body
		burst:Emit(40)
		task.delay(2, function() burst:Destroy() end)
	end)
end

print("[RewardBoxClient] جاهز.")
