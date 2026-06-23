--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام صندوق المكافآت — REWARD BOX SYSTEM (Server)                     ║
║  المكان: ServerScriptService   ·   النوع: Script                       ║
║                                                                        ║
║  صندوق مكافآت "مدينة شهد" — يمنح اللاعب 1000 كوينز + إنجاز            ║
║  "داعم مدينة شهد" عند إكمال 4 مهام تفاعلية:                             ║
║    1. لايك للعبة                                                       ║
║    2. تفضيل (Favorite) للعبة                                           ║
║    3. تفعيل الإشعارات (Notifications)                                    ║
║    4. الانضمام لقروب Shahad-Jori                                       ║
║                                                                        ║
║  المكافأة لمرة واحدة فقط (DataStore). الصندوق يُبنى برمجياً            ║
║  بقطع روبلوكس أصلية بستايل ملكي بنفسجي/ذهبي متناسق مع الماب.          ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace        = game:GetService("Workspace")
local Players          = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

------------------------------------------------------------------------
-- ثوابت
------------------------------------------------------------------------
local GROUP_ID     = 134977710                -- قروب Shahad-Jori
local REWARD_COINS = 1000                     -- المكافأة بالكوينز
local LOGO_DECAL   = 87423442650122           -- ديكال شعار مدينة شهد

-- موقع الصندوق (قرب الريسبون، على الساحة المرصوفة)
local CX, CZ = 20, 30
local BASE_Y = 0.5

-- ألوان الستايل الملكي
local PURPLE      = Color3.fromRGB(75, 13, 140)
local DEEP_PURPLE = Color3.fromRGB(50, 8, 100)
local GOLD        = Color3.fromRGB(242, 190, 40)
local MARBLE_COL  = Color3.fromRGB(224, 216, 205)
local GLOW_PURPLE = Color3.fromRGB(168, 85, 247)

------------------------------------------------------------------------
-- DataStore (محمي بـ pcall — يعمل بأمان حتى لو تعطّل المتجر)
------------------------------------------------------------------------
local claimStore
pcall(function() claimStore = DataStoreService:GetDataStore("RewardBox_v1") end)

local claimedCache = {}  -- [userId] = true (ذاكرة مؤقتة)

local function hasClaimed(userId: number): boolean
	if claimedCache[userId] then return true end
	if not claimStore then return false end
	local ok, data = pcall(function() return claimStore:GetAsync("rb_" .. userId) end)
	if ok and data then
		claimedCache[userId] = true
		return true
	end
	return false
end

local function markClaimed(userId: number)
	claimedCache[userId] = true
	if not claimStore then return end
	for _ = 1, 3 do
		if pcall(function() claimStore:SetAsync("rb_" .. userId, true) end) then return end
		task.wait(1)
	end
end

------------------------------------------------------------------------
-- RemoteEvents / RemoteFunction
------------------------------------------------------------------------
local remotes = Instance.new("Folder")
remotes.Name = "RewardRemotes"
remotes.Parent = ReplicatedStorage

local showUIRemote   = Instance.new("RemoteEvent");    showUIRemote.Name   = "ShowUI";     showUIRemote.Parent   = remotes
local checkGroupFunc = Instance.new("RemoteFunction"); checkGroupFunc.Name = "CheckGroup"; checkGroupFunc.Parent = remotes
local claimRemote    = Instance.new("RemoteEvent");    claimRemote.Name    = "Claim";      claimRemote.Parent    = remotes
local resultRemote   = Instance.new("RemoteEvent");    resultRemote.Name   = "Result";     resultRemote.Parent   = remotes
local effectRemote   = Instance.new("RemoteEvent");    effectRemote.Name   = "Effect";     effectRemote.Parent   = remotes

------------------------------------------------------------------------
-- أدوات بناء
------------------------------------------------------------------------
local function np(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.Material = Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do (p :: any)[k] = v end
	return p
end

------------------------------------------------------------------------
-- بناء الصندوق ثلاثي الأبعاد
------------------------------------------------------------------------
local function buildBox()
	local city = Workspace:WaitForChild("City", 30) or Workspace
	local model = Instance.new("Model")
	model.Name = "RewardBox"

	-- === القاعدة الرخامية (3 طبقات دائرية) ===
	for _, d in ipairs({
		{ h = 1.2, dia = 14, cy = BASE_Y + 0.6 },
		{ h = 0.8, dia = 11, cy = BASE_Y + 1.6 },
		{ h = 0.6, dia = 8,  cy = BASE_Y + 2.3 },
	}) do
		np({
			Name = "Tier", Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(d.h, d.dia, d.dia),
			CFrame = CFrame.new(CX, d.cy, CZ) * CFrame.Angles(0, 0, math.rad(90)),
			Color = MARBLE_COL, Material = Enum.Material.Marble,
			CanCollide = true, Parent = model,
		})
	end

	-- حلقة ذهبية بين الطبقات
	np({
		Name = "GoldRing", Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.15, 11.5, 11.5),
		CFrame = CFrame.new(CX, BASE_Y + 1.15, CZ) * CFrame.Angles(0, 0, math.rad(90)),
		Color = GOLD, Material = Enum.Material.Metal, Parent = model,
	})

	-- حلقة نيون بنفسجية متوهّجة
	np({
		Name = "NeonRing", Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.12, 12.2, 12.2),
		CFrame = CFrame.new(CX, BASE_Y + 2.0, CZ) * CFrame.Angles(0, 0, math.rad(90)),
		Color = GLOW_PURPLE, Material = Enum.Material.Neon, Parent = model,
	})

	-- === جسم الصندوق (مكعّب بنفسجي) ===
	local BW, BH, BD = 5.5, 4.0, 4.5
	local boxBot = BASE_Y + 2.6
	local boxMid = boxBot + BH / 2
	local boxTop = boxBot + BH

	local body = np({
		Name = "BoxBody",
		Size = Vector3.new(BW, BH, BD),
		Position = Vector3.new(CX, boxMid, CZ),
		Color = PURPLE, CanCollide = true, Parent = model,
	})

	-- === حواف ذهبية عمودية (4 أعمدة على الزوايا) ===
	local e = 0.18
	for _, dx in ipairs({ -BW / 2, BW / 2 }) do
		for _, dz in ipairs({ -BD / 2, BD / 2 }) do
			np({
				Name = "VEdge", Size = Vector3.new(e, BH + 0.1, e),
				Position = Vector3.new(CX + dx, boxMid, CZ + dz),
				Color = GOLD, Material = Enum.Material.Metal, Parent = model,
			})
		end
	end

	-- حواف ذهبية أفقية (أعلى وأسفل الصندوق — 4 شرائط لكل طبقة)
	for _, yOff in ipairs({ boxBot + 0.05, boxTop - 0.05 }) do
		np({ Name = "HE", Size = Vector3.new(BW + 0.1, e, e),    Position = Vector3.new(CX, yOff, CZ - BD / 2), Color = GOLD, Material = Enum.Material.Metal, Parent = model })
		np({ Name = "HE", Size = Vector3.new(BW + 0.1, e, e),    Position = Vector3.new(CX, yOff, CZ + BD / 2), Color = GOLD, Material = Enum.Material.Metal, Parent = model })
		np({ Name = "HE", Size = Vector3.new(e, e, BD + 0.1),    Position = Vector3.new(CX - BW / 2, yOff, CZ), Color = GOLD, Material = Enum.Material.Metal, Parent = model })
		np({ Name = "HE", Size = Vector3.new(e, e, BD + 0.1),    Position = Vector3.new(CX + BW / 2, yOff, CZ), Color = GOLD, Material = Enum.Material.Metal, Parent = model })
	end

	-- === لوحة الشعار (الوجه +Z يواجه الريسبون) ===
	local panelW = BW * 0.72
	local panelH = BH * 0.68
	local panelZ = CZ + BD / 2 + 0.04

	local panel = np({
		Name = "LogoPanel",
		Size = Vector3.new(panelW, panelH, 0.06),
		Position = Vector3.new(CX, boxMid, panelZ),
		Color = DEEP_PURPLE, Parent = model,
	})

	-- إطار ذهبي حول اللوحة
	local fw = 0.12
	np({ Name = "FT", Size = Vector3.new(panelW + fw * 2, fw, 0.1), Position = Vector3.new(CX, boxMid + panelH / 2, panelZ),            Color = GOLD, Material = Enum.Material.Metal, Parent = model })
	np({ Name = "FB", Size = Vector3.new(panelW + fw * 2, fw, 0.1), Position = Vector3.new(CX, boxMid - panelH / 2, panelZ),            Color = GOLD, Material = Enum.Material.Metal, Parent = model })
	np({ Name = "FL", Size = Vector3.new(fw, panelH, 0.1),          Position = Vector3.new(CX - panelW / 2, boxMid, panelZ), Color = GOLD, Material = Enum.Material.Metal, Parent = model })
	np({ Name = "FR", Size = Vector3.new(fw, panelH, 0.1),          Position = Vector3.new(CX + panelW / 2, boxMid, panelZ), Color = GOLD, Material = Enum.Material.Metal, Parent = model })

	-- SurfaceGui للشعار (Face = Back = وجه +Z الذي يواجه الريسبون)
	local logoGui = Instance.new("SurfaceGui")
	logoGui.Name = "LogoGui"
	logoGui.Face = Enum.NormalId.Back
	logoGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	logoGui.PixelsPerStud = 80
	logoGui.Parent = panel

	local logoImg = Instance.new("ImageLabel")
	logoImg.Name = "Logo"
	logoImg.Size = UDim2.new(1, 0, 1, 0)
	logoImg.BackgroundTransparency = 1
	logoImg.Image = "rbxthumb://type=Asset&id=" .. LOGO_DECAL .. "&w=420&h=420"
	logoImg.ScaleType = Enum.ScaleType.Fit
	logoImg.Parent = logoGui

	-- === الفيونكة (ربطة بنفسجية + عقدة ذهبية) ===
	np({ Name = "Ribbon", Size = Vector3.new(BW * 0.8, 0.3, 0.6),  Position = Vector3.new(CX, boxTop + 0.15, CZ),             Color = DEEP_PURPLE, Parent = model })
	np({ Name = "LoopL",  Size = Vector3.new(1.2, 0.8, 0.5),       CFrame = CFrame.new(CX - 1.0, boxTop + 0.6, CZ) * CFrame.Angles(0, 0, math.rad(15)),  Color = DEEP_PURPLE, Parent = model })
	np({ Name = "LoopR",  Size = Vector3.new(1.2, 0.8, 0.5),       CFrame = CFrame.new(CX + 1.0, boxTop + 0.6, CZ) * CFrame.Angles(0, 0, math.rad(-15)), Color = DEEP_PURPLE, Parent = model })
	np({ Name = "Knot",   Shape = Enum.PartType.Ball, Size = Vector3.new(0.6, 0.6, 0.6), Position = Vector3.new(CX, boxTop + 0.4, CZ), Color = GOLD, Material = Enum.Material.Metal, Parent = model })

	-- === التاج الذهبي العائم ===
	local crownY = boxTop + 2.5
	np({
		Name = "CrownBase", Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.4, 2.5, 2.5),
		CFrame = CFrame.new(CX, crownY, CZ) * CFrame.Angles(0, 0, math.rad(90)),
		Color = GOLD, Material = Enum.Material.Metal, Parent = model,
	})
	for i = 0, 4 do
		local a = math.rad(i * 72)
		local px = CX + math.sin(a) * 1.0
		local pz = CZ + math.cos(a) * 1.0
		np({ Name = "CPoint",    Size = Vector3.new(0.25, 0.7, 0.25),       Position = Vector3.new(px, crownY + 0.55, pz),  Color = GOLD, Material = Enum.Material.Metal, Parent = model })
		np({ Name = "CPointTip", Shape = Enum.PartType.Ball, Size = Vector3.new(0.3, 0.3, 0.3), Position = Vector3.new(px, crownY + 1.0, pz), Color = GOLD, Material = Enum.Material.Metal, Parent = model })
	end

	-- شعاع سحري بنفسجي بين الفيونكة والتاج
	np({
		Name = "Beam", Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(2.5, 0.3, 0.3),
		CFrame = CFrame.new(CX, (boxTop + crownY) / 2, CZ) * CFrame.Angles(0, 0, math.rad(90)),
		Color = GLOW_PURPLE, Material = Enum.Material.Neon, Transparency = 0.4,
		Parent = model,
	})

	-- === 4 أعمدة ركنية رخامية ===
	local pillarR = 5.5
	for i = 0, 3 do
		local a = math.rad(i * 90 + 45)
		local px = CX + math.sin(a) * pillarR
		local pz = CZ + math.cos(a) * pillarR
		local pillar = np({
			Name = "Pillar", Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(4.5, 0.5, 0.5),
			CFrame = CFrame.new(px, BASE_Y + 4.85, pz) * CFrame.Angles(0, 0, math.rad(90)),
			Color = MARBLE_COL, Material = Enum.Material.Marble, Parent = model,
		})
		np({
			Name = "PCap", Shape = Enum.PartType.Ball,
			Size = Vector3.new(0.7, 0.7, 0.7),
			Position = Vector3.new(px, BASE_Y + 7.3, pz),
			Color = GOLD, Material = Enum.Material.Metal, Parent = model,
		})
		local pl = Instance.new("PointLight")
		pl.Color = Color3.fromRGB(255, 215, 90)
		pl.Range = 6; pl.Brightness = 0.4; pl.Parent = pillar
	end

	-- === تأثيرات بصرية ===
	local sparkle = Instance.new("ParticleEmitter")
	sparkle.Name = "Sparkle"
	sparkle.Color = ColorSequence.new(Color3.fromRGB(255, 215, 90))
	sparkle.Size = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.2),
		NumberSequenceKeypoint.new(1, 0),
	})
	sparkle.Lifetime = NumberRange.new(1, 2)
	sparkle.Rate = 12
	sparkle.Speed = NumberRange.new(0.5, 1.5)
	sparkle.SpreadAngle = Vector2.new(180, 180)
	sparkle.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0),
		NumberSequenceKeypoint.new(0.8, 0),
		NumberSequenceKeypoint.new(1, 1),
	})
	sparkle.LightEmission = 1
	sparkle.Parent = body

	local mainLight = Instance.new("PointLight")
	mainLight.Color = Color3.fromRGB(255, 215, 90)
	mainLight.Range = 20; mainLight.Brightness = 1.2
	mainLight.Parent = body

	-- === ProximityPrompt ===
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "RewardPrompt"
	prompt.ActionText = "افتح"
	prompt.ObjectText = "صندوق المكافآت"
	prompt.MaxActivationDistance = 12
	prompt.HoldDuration = 0
	prompt.RequiresLineOfSight = false
	prompt.Parent = body

	-- === اسم الصندوق (BillboardGui) ===
	local bb = Instance.new("BillboardGui")
	bb.Name = "BoxLabel"; bb.Size = UDim2.fromOffset(300, 50)
	bb.StudsOffset = Vector3.new(0, 6, 0)
	bb.AlwaysOnTop = true; bb.MaxDistance = 50; bb.Parent = body

	local lbl = Instance.new("TextLabel")
	lbl.Size = UDim2.new(1, 0, 1, 0); lbl.BackgroundTransparency = 1
	lbl.Text = "صندوق مكافآت مدينة شهد"
	lbl.TextColor3 = Color3.fromRGB(255, 215, 90)
	lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.Parent = bb

	local lblStroke = Instance.new("UIStroke")
	lblStroke.Color = Color3.fromRGB(50, 10, 80)
	lblStroke.Thickness = 2; lblStroke.Parent = lbl

	model.PrimaryPart = body
	model.Parent = city
	return prompt
end

------------------------------------------------------------------------
-- التحقق من القروب (Server-side — موثوق)
------------------------------------------------------------------------
checkGroupFunc.OnServerInvoke = function(player: Player)
	local ok, inGroup = pcall(function() return player:IsInGroup(GROUP_ID) end)
	return ok and inGroup or false
end

------------------------------------------------------------------------
-- استلام المكافأة
------------------------------------------------------------------------
local cooldowns = {}

claimRemote.OnServerEvent:Connect(function(player: Player)
	local uid = player.UserId

	-- كولداون (مرة كل 5 ثوانٍ)
	if cooldowns[uid] and os.clock() - cooldowns[uid] < 5 then return end
	cooldowns[uid] = os.clock()

	-- هل استلمها قبل؟
	if hasClaimed(uid) then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "سبق لك استلام مكافأة الصندوق.") end
		resultRemote:FireClient(player, "already")
		return
	end

	-- تحقق من القروب (الشرط الوحيد القابل للتحقق من السيرفر)
	local ok, inGroup = pcall(function() return player:IsInGroup(GROUP_ID) end)
	if not (ok and inGroup) then
		resultRemote:FireClient(player, "need_group")
		return
	end

	-- منح المكافأة
	markClaimed(uid)
	if _G.AddCoins then _G.AddCoins(player, REWARD_COINS) end
	if _G.AwardAchievement then _G.AwardAchievement(player, "supporter") end
	if _G.AwardBadge then _G.AwardBadge(player, "SUPPORTER") end
	if _G.ReportMission then _G.ReportMission(player, "reward_box", 1) end
	if _G.NotifyPlayer then
		_G.NotifyPlayer(player, "مبروك! حصلت على " .. REWARD_COINS .. " كوينز + إنجاز «داعم مدينة شهد»!")
	end

	resultRemote:FireClient(player, "success")
	effectRemote:FireAllClients(player.Name)
end)

------------------------------------------------------------------------
-- البدء
------------------------------------------------------------------------
local prompt = buildBox()

prompt.Triggered:Connect(function(player)
	if hasClaimed(player.UserId) then
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "سبق لك استلام مكافأة الصندوق.") end
		return
	end
	local ok, inGroup = pcall(function() return player:IsInGroup(GROUP_ID) end)
	showUIRemote:FireClient(player, { inGroup = ok and inGroup or false })
end)

-- تحميل مسبق لحالة الاستلام عند دخول اللاعب
Players.PlayerAdded:Connect(function(player)
	task.spawn(function() hasClaimed(player.UserId) end)
end)

Players.PlayerRemoving:Connect(function(player)
	claimedCache[player.UserId] = nil
	cooldowns[player.UserId] = nil
end)

print("[RewardBoxSystem] جاهز — صندوق المكافآت مفعّل (1000 كوينز + إنجاز «داعم مدينة شهد»).")
