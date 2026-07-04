--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  نظام الكلبشات — CUFF SYSTEM (Server)                                 ║
	║  المكان: ServerScriptService   ·   النوع: Script                       ║
	║                                                                        ║
	║  • شراء كلبشات بروبلوكس مع حفظ دائم لتجهيز اللاعب المختار.            ║
	║  • قيد/فكّ قيود server-authoritative مع سلسلة جرّ مرئية.              ║
	║  • كلبشة من يد اللاعب تبقي الهدف مقيّداً حتى يفكّه صاحب القيد أو      ║
	║    أدمن، مع تحرير تلقائي آمن عند الموت/الخروج/إعادة الظهور.           ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local Players            = game:GetService("Players")
local ReplicatedStorage   = game:GetService("ReplicatedStorage")
local DataStoreService    = game:GetService("DataStoreService")
local MarketplaceService  = game:GetService("MarketplaceService")
local InsertService       = game:GetService("InsertService")

------------------------------------------------------------------------
-- CONFIG
------------------------------------------------------------------------
local CONFIG = {
	ToolName            = "كلبشات",
	StoreTitle          = "الكلبشات",
	ActionCooldown      = 20,
	CuffDistance        = 12,
	LeashDistance       = 2.65,
	LeashYOffset        = 0.12,
	ChainTextureId      = 0,   -- TODO: استبدل برقم خامة سلسلة إذا توفرت خامة مخصّصة
	HoldAnimationId     = 0,   -- TODO: ضع AnimationId لاحقاً إن وُجدت حركة جاهزة
	HoldAnimationSpeed  = 1,
	SaveEvery           = 60,
}

local CUFF_DEFS = {
	{
		key = "royal",
		name = "الكلبشة الملكية",
		passId = 1900237442,
		robux = 129,
		rarity = "أسطوري",
		metal = Color3.fromRGB(212, 181, 95),
		glow  = Color3.fromRGB(255, 229, 153),
		emoji = "👑",
		featured = true,
		desc = "تشطيب ذهبي فخم مع لمعان دافئ وملمس احتفالي",
	},
	{
		key = "neon",
		name = "كلبشة النيون",
		passId = 1898365443,
		robux = 79,
		rarity = "ملحمي",
		metal = Color3.fromRGB(72, 220, 255),
		glow  = Color3.fromRGB(190, 255, 255),
		emoji = "✨",
		desc = "نَفَس نيون أزرق/سماوي بطابع مستقبلي",
	},
	{
		key = "ice",
		name = "كلبشة الجليد",
		passId = 1898443472,
		robux = 59,
		rarity = "نادر",
		metal = Color3.fromRGB(146, 206, 255),
		glow  = Color3.fromRGB(225, 247, 255),
		emoji = "🧊",
		desc = "معدن بارد بلمعة ثلجية وهدوء أنيق",
	},
	{
		key = "flame",
		name = "كلبشة اللهب",
		passId = 1899085420,
		robux = 79,
		rarity = "ملحمي",
		metal = Color3.fromRGB(255, 154, 72),
		glow  = Color3.fromRGB(255, 218, 140),
		emoji = "🔥",
		desc = "معدن دافئ يوحي بالحرارة والحركة",
	},
	{
		key = "hearts",
		name = "كلبشة القلوب",
		passId = 1898611393,
		robux = 49,
		rarity = "نادر",
		metal = Color3.fromRGB(255, 146, 188),
		glow  = Color3.fromRGB(255, 208, 228),
		emoji = "💗",
		desc = "لمسة وردية ناعمة بطابع لطيف وخفيف",
	},
	{
		key = "shadow",
		name = "كلبشة الظل",
		passId = 1898647461,
		robux = 99,
		rarity = "أسطوري",
		metal = Color3.fromRGB(126, 94, 190),
		glow  = Color3.fromRGB(206, 181, 255),
		emoji = "🌑",
		desc = "أرجواني داكن بوهج غامض ومهيب",
	},
}

local CUFF_BY_KEY = {}
for _, def in ipairs(CUFF_DEFS) do
	CUFF_BY_KEY[def.key] = def
end

------------------------------------------------------------------------
-- DataStore
------------------------------------------------------------------------
local cuffStore
pcall(function()
	cuffStore = DataStoreService:GetDataStore("CuffOwnership_v1")
end)

------------------------------------------------------------------------
-- Remotes
------------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("CuffRemotes")
if not remotes then
	remotes = Instance.new("Folder")
	remotes.Name = "CuffRemotes"
	remotes.Parent = ReplicatedStorage
end

local cuffRemote = remotes:FindFirstChild("Action")
if not cuffRemote then
	cuffRemote = Instance.new("RemoteEvent")
	cuffRemote.Name = "Action"
	cuffRemote.Parent = remotes
end

local stateRemote = remotes:FindFirstChild("State")
if not stateRemote then
	stateRemote = Instance.new("RemoteEvent")
	stateRemote.Name = "State"
	stateRemote.Parent = remotes
end

local notifyRemote = remotes:FindFirstChild("Notify")
if not notifyRemote then
	notifyRemote = Instance.new("RemoteEvent")
	notifyRemote.Name = "Notify"
	notifyRemote.Parent = remotes
end

------------------------------------------------------------------------
-- Session state
------------------------------------------------------------------------
local profiles = {}           -- userId -> { owned = {[key]=true}, equipped = string?, loaded = bool, dataLoaded = bool, nextActionAt = number }
local cuffedTargets = {}      -- targetUserId -> state
local heldTargets = {}        -- cufferUserId -> targetUserId
local rlBuckets = {}          -- rate-limit buckets

local function notify(player: Player?, text: string)
	if player and player.Parent then
		notifyRemote:FireClient(player, tostring(text))
	end
end

local function rlAllow(userId: number): boolean
	local now = os.clock()
	local b = rlBuckets[userId]
	if not b then
		b = { t = 18, at = now }
		rlBuckets[userId] = b
	end
	b.t = math.min(18, b.t + (now - b.at) * 14)
	b.at = now
	if b.t < 1 then return false end
	b.t -= 1
	return true
end

local function isAdmin(player: Player): boolean
	if type(_G.GetChatRank) == "function" then
		local ok, rank = pcall(_G.GetChatRank, player)
		if ok and (rank == "owner" or rank == "admin") then
			return true
		end
	end
	return false
end

local function firstDef(): table
	return CUFF_DEFS[1]
end

local function defaultProfile()
	return {
		owned = {},
		equipped = "",
		loaded = true,
		dataLoaded = true,
		nextActionAt = 0,
	}
end

local function loadData(userId: number)
	if not cuffStore then return true, nil end
	for attempt = 1, 4 do
		local ok, data = pcall(function()
			return cuffStore:GetAsync("u_" .. userId)
		end)
		if ok then
			if type(data) == "table" then return true, data end
			return true, nil
		end
		if attempt < 4 then task.wait(0.5 * attempt) end
	end
	return false, nil
end

local function saveData(userId: number)
	if not cuffStore then return end
	local s = profiles[userId]
	if not s or s.dataLoaded == false then return end
	local payload = {
		equipped = s.equipped or "",
	}
	for _ = 1, 3 do
		local ok = pcall(function()
			cuffStore:SetAsync("u_" .. userId, payload)
		end)
		if ok then return end
		task.wait(1)
	end
end

local function syncProfile(player: Player)
	if not player or not player.Parent then return end
	local s = profiles[player.UserId]
	if not s then return end
	local ownedCount = 0
	local ownedKeys = {}
	for _, def in ipairs(CUFF_DEFS) do
		local owned = s.owned[def.key] == true
		if owned then ownedCount += 1 end
		ownedKeys[def.key] = owned
	end
	stateRemote:FireClient(player, {
		action = "state",
		ownedKeys = ownedKeys,
		ownedCount = ownedCount,
		equippedKey = s.equipped or "",
		hasCuffs = ownedCount > 0,
		heldTargetUserId = heldTargets[player.UserId] or 0,
		cuffedByUserId = (cuffedTargets[player.UserId] and cuffedTargets[player.UserId].cufferUserId) or 0,
		isAdmin = isAdmin(player),
		defs = CUFF_DEFS,
	})
end

local cuffDefByPassId = {}
for _, def in ipairs(CUFF_DEFS) do
	if def.passId then
		cuffDefByPassId[def.passId] = def
	end
end

local function sendStoreRefresh(player: Player)
	if type(_G.OpenStore) == "function" then
		pcall(function()
			_G.OpenStore(player)
		end)
	end
end

local function getProfile(player: Player)
	local s = profiles[player.UserId]
	if not s then
		s = defaultProfile()
		profiles[player.UserId] = s
	end
	return s
end

local function getOwnedState(player: Player)
	local s = getProfile(player)
	local items = {}
	for _, def in ipairs(CUFF_DEFS) do
		items[#items + 1] = {
			kind = "cuff",
			key = def.key,
			id = def.key,
			name = def.name,
			desc = def.desc,
			price = def.robux,
			passId = def.passId,
			rarity = def.rarity,
			emoji = def.emoji,
			cat = "cuffs",
			featured = def.featured == true,
			owned = s.owned[def.key] == true,
			equipped = s.equipped == def.key,
			active = s.equipped == def.key,
			metal = def.metal,
			glow = def.glow,
		}
	end
	return items
end

_G.GetCuffStoreItems = function(player: Player)
	return getOwnedState(player)
end

local function activeCuffDef(player: Player)
	local s = profiles[player.UserId]
	if not s then return nil end
	local key = s.equipped
	if key and key ~= "" then
		return CUFF_BY_KEY[key]
	end
	for _, def in ipairs(CUFF_DEFS) do
		if s.owned[def.key] then
			return def
		end
	end
	if isAdmin(player) then
		return firstDef()
	end
	return nil
end

local function clampEquipped(profile)
	if profile.equipped ~= "" and profile.owned[profile.equipped] ~= true then
		profile.equipped = ""
	end
	if profile.equipped == "" then
		for _, def in ipairs(CUFF_DEFS) do
			if profile.owned[def.key] then
				profile.equipped = def.key
				break
			end
		end
	end
end

local function updateStoreAndState(player: Player)
	syncProfile(player)
	sendStoreRefresh(player)
end

local function refreshOwnership(player: Player)
	if not player or not player.Parent then return end
	local profile = getProfile(player)
	profile.owned = {}
	for _, def in ipairs(CUFF_DEFS) do
		local ok, owns = pcall(function()
			return MarketplaceService:UserOwnsGamePassAsync(player.UserId, def.passId)
		end)
		if ok and owns then
			profile.owned[def.key] = true
		end
	end
	if not player or not player.Parent then return end
	clampEquipped(profile)
	updateStoreAndState(player)
	task.spawn(function()
		saveData(player.UserId)
	end)
end

------------------------------------------------------------------------
-- Character helpers
------------------------------------------------------------------------
local function findHumanoid(character: Model?)
	if not character then return nil end
	return character:FindFirstChildOfClass("Humanoid")
end

local function findRoot(character: Model?)
	if not character then return nil end
	return character:FindFirstChild("HumanoidRootPart")
end

local function bodyPart(character: Model?, names: {string})
	if not character then return nil end
	for _, name in ipairs(names) do
		local obj = character:FindFirstChild(name)
		if obj and obj:IsA("BasePart") then
			return obj
		end
	end
	return nil
end

local function findMotor(character: Model?, names: {string})
	if not character then return nil end
	for _, name in ipairs(names) do
		local obj = character:FindFirstChild(name, true)
		if obj and obj:IsA("Motor6D") then
			return obj
		end
	end
	return nil
end

local function captureHumanoidState(humanoid: Humanoid?)
	if not humanoid then return {} end
	local saved = {
		WalkSpeed = humanoid.WalkSpeed,
		JumpPower = humanoid.JumpPower,
		JumpHeight = humanoid.JumpHeight,
		UseJumpPower = humanoid.UseJumpPower,
		AutoRotate = humanoid.AutoRotate,
		PlatformStand = humanoid.PlatformStand,
	}
	return saved
end

local function ensureAnimation(humanoid: Humanoid?, state)
	if not humanoid or CONFIG.HoldAnimationId <= 0 then return false end
	local anim = Instance.new("Animation")
	anim.AnimationId = "rbxassetid://" .. tostring(CONFIG.HoldAnimationId)
	local track = nil
	local ok = pcall(function()
		track = humanoid:LoadAnimation(anim)
	end)
	if ok and track then
		track.Priority = Enum.AnimationPriority.Action
		track.Looped = true
		track:Play(0.1, 1, CONFIG.HoldAnimationSpeed)
		state.track = track
		state.anim = anim
		return true
	end
	anim:Destroy()
	return false
end

local function poseBehindBack(player: Player, state)
	local character = player.Character
	if not character then return end
	state.savedMotors = state.savedMotors or {}
	local function bend(nameList, cf)
		local motor = findMotor(character, nameList)
		if motor and state.savedMotors[motor] == nil then
			state.savedMotors[motor] = motor.C0
			motor.C0 = motor.C0 * cf
		end
	end
	local rPose = CFrame.new(0.12, 0.05, 0.25) * CFrame.Angles(math.rad(95), math.rad(15), math.rad(80))
	local lPose = CFrame.new(-0.12, 0.05, 0.25) * CFrame.Angles(math.rad(95), math.rad(-15), math.rad(-80))
	bend({ "RightShoulder", "Right Shoulder" }, rPose)
	bend({ "LeftShoulder", "Left Shoulder" }, lPose)
	bend({ "RightElbow" }, CFrame.Angles(math.rad(-55), 0, math.rad(10)))
	bend({ "LeftElbow" }, CFrame.Angles(math.rad(-55), 0, math.rad(-10)))
	bend({ "RightWrist" }, CFrame.Angles(math.rad(18), 0, 0))
	bend({ "LeftWrist" }, CFrame.Angles(math.rad(18), 0, 0))
end

local function makePart(parent: Instance, name: string, size: Vector3, color: Color3, material: Enum.Material, transparency: number?)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = false
	p.CanCollide = false
	p.CanTouch = false
	p.CanQuery = false
	p.Massless = true
	p.Size = size
	p.Color = color
	p.Material = material
	p.Transparency = transparency or 0
	p.Parent = parent
	return p
end

local function weldTo(part0: BasePart, part1: BasePart)
	local w = Instance.new("WeldConstraint")
	w.Part0 = part0
	w.Part1 = part1
	w.Parent = part1
	return w
end

local function setPartCFrame(part: BasePart, cf: CFrame)
	pcall(function()
		part.CFrame = cf
	end)
end

-- موديل الكلبشات ثلاثي الأبعاد (Creator Store 721245449) — يُحمّل وقت التشغيل
-- عبر InsertService ثم يوضع في ReplicatedStorage ليستنسخه السيرفر والعميل.
local CUFF_MODEL_ASSET_ID = 721245449

local function loadCuffTemplate()
	if ReplicatedStorage:FindFirstChild("CuffModel3D") then return end
	local asset = nil
	for attempt = 1, 5 do
		local ok, result = pcall(function()
			return InsertService:LoadAsset(CUFF_MODEL_ASSET_ID)
		end)
		if ok and result then
			asset = result
			break
		end
		task.wait(2 * attempt)
	end
	if not asset then
		warn("CuffSystem: تعذّر تحميل موديل الكلبشات — سيُستخدم الشكل الاحتياطي")
		return
	end
	local model = asset:FindFirstChildWhichIsA("Model")
	if not model then
		asset:Destroy()
		return
	end
	model.Name = "CuffModel3D"
	local ringI, chainI = 0, 0
	for _, child in ipairs(model:GetChildren()) do
		if child:IsA("Camera") then
			child:Destroy()
		elseif child:IsA("Model") then
			ringI += 1
			child.Name = (ringI == 1) and "RingA" or "RingB"
		elseif child:IsA("UnionOperation") then
			chainI += 1
			child.Name = "Chain" .. chainI
		end
	end
	for _, inst in ipairs(model:GetDescendants()) do
		if inst:IsA("BasePart") then
			inst.Anchored = true
		end
	end
	model.Parent = ReplicatedStorage
	asset:Destroy()
end

task.spawn(loadCuffTemplate)

local function getCuffTemplate(): Model?
	local m = ReplicatedStorage:FindFirstChild("CuffModel3D")
	if m and m:IsA("Model") then return m end
	return nil
end

local function prepCuffClone(model: Model, style)
	for _, inst in ipairs(model:GetDescendants()) do
		if inst:IsA("BasePart") then
			inst.Anchored = false
			inst.CanCollide = false
			inst.CanTouch = false
			inst.CanQuery = false
			inst.Massless = true
			inst.Color = style.metal
		end
	end
end

local function weldModelParts(model: Model): BasePart?
	local primary: BasePart? = nil
	for _, inst in ipairs(model:GetDescendants()) do
		if inst:IsA("BasePart") then
			if primary == nil then
				primary = inst
			else
				local w = Instance.new("WeldConstraint")
				w.Part0 = primary
				w.Part1 = inst
				w.Parent = inst
			end
		end
	end
	return primary
end

-- يُلبس نصف الكلبشة (حلقة واحدة من الموديل) على معصم/يد الهدف
local function attachRingFromTemplate(parent: Instance, ringName: string, style, hand: BasePart?): BasePart?
	local template = getCuffTemplate()
	if not template or not hand then return nil end
	local ring = template:FindFirstChild(ringName)
	if not ring or not ring:IsA("Model") then return nil end
	local clone = ring:Clone()
	clone.Parent = parent
	prepCuffClone(clone, style)
	local primary = weldModelParts(clone)
	if not primary then
		clone:Destroy()
		return nil
	end
	clone:ScaleTo(0.85)
	clone:PivotTo(hand.CFrame * CFrame.Angles(0, 0, math.rad(90)))
	local light = Instance.new("PointLight")
	light.Color = style.glow
	light.Brightness = 0.6
	light.Range = 6
	light.Parent = primary
	local w = Instance.new("WeldConstraint")
	w.Part0 = hand
	w.Part1 = primary
	w.Parent = primary
	return primary
end

-- سلسلة الموديل بين اليدين خلف الظهر
local function attachChainFromTemplate(parent: Instance, style, torso: BasePart?): BasePart?
	local template = getCuffTemplate()
	if not template or not torso then return nil end
	local chainModel = Instance.new("Model")
	chainModel.Name = "ChainLinks"
	chainModel.Parent = parent
	for _, child in ipairs(template:GetChildren()) do
		if child:IsA("UnionOperation") and child.Name:match("^Chain") then
			child:Clone().Parent = chainModel
		end
	end
	prepCuffClone(chainModel, style)
	local primary = weldModelParts(chainModel)
	if not primary then
		chainModel:Destroy()
		return nil
	end
	chainModel:ScaleTo(0.85)
	chainModel:PivotTo(torso.CFrame * CFrame.new(0, 0.02, 0.55) * CFrame.Angles(0, math.rad(90), 0))
	local w = Instance.new("WeldConstraint")
	w.Part0 = torso
	w.Part1 = primary
	w.Parent = primary
	return primary
end

local function buildRingAssembly(parent: Instance, prefix: string, style, baseOffset: CFrame)
	local root = makePart(parent, prefix .. "Root", Vector3.new(0.12, 0.12, 0.12), style.metal, Enum.Material.Metal, 1)
	setPartCFrame(root, baseOffset)
	local light = Instance.new("PointLight")
	light.Color = style.glow
	light.Brightness = 0.8
	light.Range = 7
	light.Parent = root

	local segCount = 10
	local radius = 0.26
	local thickness = 0.06
	for i = 1, segCount do
		local seg = makePart(parent, prefix .. "Seg" .. i, Vector3.new(thickness, 0.12, 0.08), style.metal, Enum.Material.Metal, 0)
		local a = ((i - 1) / segCount) * math.pi * 2
		local pos = Vector3.new(math.cos(a) * radius, math.sin(a) * radius, 0)
		setPartCFrame(seg, baseOffset * CFrame.new(pos) * CFrame.Angles(0, 0, a + math.rad(90)))
		weldTo(root, seg)
	end

	local glow = makePart(parent, prefix .. "Glow", Vector3.new(0.18, 0.5, 0.5), style.glow, Enum.Material.Neon, 0.65)
	setPartCFrame(glow, baseOffset * CFrame.new(0, 0, 0))
	weldTo(root, glow)
	return root
end

local function buildChainLinks(parent: Instance, prefix: string, style, baseOffset: CFrame)
	local root = makePart(parent, prefix .. "ChainRoot", Vector3.new(0.12, 0.12, 0.12), style.metal, Enum.Material.Metal, 1)
	setPartCFrame(root, baseOffset)
	local linkOffsets = {
		CFrame.new(-0.18, 0, 0.04) * CFrame.Angles(0, math.rad(15), math.rad(20)),
		CFrame.new(0, 0.03, 0) * CFrame.Angles(0, math.rad(-8), math.rad(82)),
		CFrame.new(0.18, -0.01, -0.04) * CFrame.Angles(0, math.rad(15), math.rad(20)),
	}
	for i, off in ipairs(linkOffsets) do
		local link = makePart(parent, prefix .. "Link" .. i, Vector3.new(0.08, 0.24, 0.08), style.metal, Enum.Material.Metal, 0)
		setPartCFrame(link, baseOffset * off)
		weldTo(root, link)
	end
	return root
end

local function buildCuffVisuals(player: Player, target: Player, style)
	local character = target.Character
	local cufferRoot = findRoot(player.Character)
	local targetRoot = findRoot(character)
	local model = Instance.new("Model")
	model.Name = "CuffVisuals"
	model.Parent = character

	local rightHand = bodyPart(character, { "RightHand", "Right Arm" })
	local leftHand = bodyPart(character, { "LeftHand", "Left Arm" })
	local torso = bodyPart(character, { "UpperTorso", "Torso", "HumanoidRootPart" })
	local rightRing = attachRingFromTemplate(model, "RingA", style, rightHand)
	local leftRing = attachRingFromTemplate(model, "RingB", style, leftHand)
	local chain = attachChainFromTemplate(model, style, torso)

	if not rightRing then
		rightRing = buildRingAssembly(model, "Right", style, CFrame.new(0.52, 0.02, -0.04) * CFrame.Angles(0, 0, math.rad(90)))
		if rightHand and rightRing then weldTo(rightHand, rightRing) end
	end
	if not leftRing then
		leftRing = buildRingAssembly(model, "Left", style, CFrame.new(-0.52, 0.02, 0.04) * CFrame.Angles(0, 0, math.rad(90)))
		if leftHand and leftRing then weldTo(leftHand, leftRing) end
	end
	if not chain then
		chain = buildChainLinks(model, "Chain", style, CFrame.new(0, 0.02, 0.18))
		if torso and chain then weldTo(torso, chain) end
	end

	local beamA = Instance.new("Attachment")
	beamA.Name = "CuffBeamA"
	beamA.Position = Vector3.new(0, 0.1, 0)
	beamA.Parent = cufferRoot or torso
	local beamB = Instance.new("Attachment")
	beamB.Name = "CuffBeamB"
	beamB.Position = Vector3.new(0, 0.1, 0)
	beamB.Parent = targetRoot or torso

	local beam = Instance.new("Beam")
	beam.Name = "CuffLeash"
	beam.Attachment0 = beamA
	beam.Attachment1 = beamB
	beam.FaceCamera = true
	beam.Width0 = 0.14
	beam.Width1 = 0.12
	beam.LightEmission = 0.5
	beam.Color = ColorSequence.new(style.metal, style.glow)
	beam.Transparency = NumberSequence.new(0.15)
	beam.TextureMode = Enum.TextureMode.Wrap
	beam.TextureLength = 1.2
	beam.Segments = 8
	if CONFIG.ChainTextureId > 0 then
		beam.Texture = "rbxassetid://" .. tostring(CONFIG.ChainTextureId)
	end
	beam.Parent = beamA

	return {
		model = model,
		beam = beam,
		beamA = beamA,
		beamB = beamB,
	}
end

local function restoreStateFromRecord(player: Player, record)
	local character = player.Character
	if not character then return end
	character:SetAttribute("CuffPosed", nil)
	local humanoid = findHumanoid(character)
	if humanoid and record.savedHumanoid then
		pcall(function() humanoid.WalkSpeed = record.savedHumanoid.WalkSpeed end)
		pcall(function() humanoid.JumpPower = record.savedHumanoid.JumpPower end)
		pcall(function() humanoid.JumpHeight = record.savedHumanoid.JumpHeight end)
		pcall(function() humanoid.UseJumpPower = record.savedHumanoid.UseJumpPower end)
		pcall(function() humanoid.AutoRotate = record.savedHumanoid.AutoRotate end)
		pcall(function() humanoid.PlatformStand = record.savedHumanoid.PlatformStand end)
	end
	if record.savedMotors then
		for motor, original in pairs(record.savedMotors) do
			if motor and motor.Parent then
				pcall(function() motor.C0 = original end)
			end
		end
	end
	if record.track then
		pcall(function() record.track:Stop(0.1) end)
		pcall(function() record.track:Destroy() end)
	end
	if record.visuals then
		for _, inst in pairs(record.visuals) do
			if typeof(inst) == "Instance" and inst.Parent then
				pcall(function() inst:Destroy() end)
			end
		end
	end
	if record.alignPos then pcall(function() record.alignPos:Destroy() end) end
	if record.alignOri then pcall(function() record.alignOri:Destroy() end) end
	if record.leaderAttach then pcall(function() record.leaderAttach:Destroy() end) end
	if record.targetAttach then pcall(function() record.targetAttach:Destroy() end) end
	if record.charConn then pcall(function() record.charConn:Disconnect() end) end
	if record.diedConn then pcall(function() record.diedConn:Disconnect() end) end
	if record.removeConn then pcall(function() record.removeConn:Disconnect() end) end
	if record.beam and record.beam.Parent then pcall(function() record.beam:Destroy() end) end
	if record.model and record.model.Parent then pcall(function() record.model:Destroy() end) end
	local targetRoot = findRoot(character)
	if targetRoot then
		pcall(function() targetRoot:SetNetworkOwner(player) end)
	end
	local cufferPlayer = Players:GetPlayerByUserId(record.cufferUserId or 0)
	if cufferPlayer then
		local cufferRoot = findRoot(cufferPlayer.Character)
		if cufferRoot then
			pcall(function() cufferRoot:SetNetworkOwner(cufferPlayer) end)
		end
	end
end

local function releaseTarget(targetPlayer: Player, reason: string?, _forceByAdmin: boolean?)
	local state = cuffedTargets[targetPlayer.UserId]
	if not state then return false end
	local cufferPlayer = Players:GetPlayerByUserId(state.cufferUserId)
	cuffedTargets[targetPlayer.UserId] = nil
	heldTargets[state.cufferUserId] = nil
	if cufferPlayer then
		syncProfile(cufferPlayer)
	end
	restoreStateFromRecord(targetPlayer, state)
	notify(targetPlayer, "🔓 فُكّت الكلبشة" .. (reason and (" — " .. reason) or "") .. ".")
	if cufferPlayer then
		notify(cufferPlayer, "✅ فُكّت كلبشة " .. targetPlayer.Name .. ".")
		syncProfile(cufferPlayer)
	end
	syncProfile(targetPlayer)
	return true
end

local function releaseByCuffer(cufferPlayer: Player, reason: string?, forceByAdmin: boolean?)
	local targetId = heldTargets[cufferPlayer.UserId]
	if not targetId then return false end
	local targetPlayer = Players:GetPlayerByUserId(targetId)
	if targetPlayer then
		return releaseTarget(targetPlayer, reason, forceByAdmin)
	end
	heldTargets[cufferPlayer.UserId] = nil
	return true
end

local function canCuffTarget(requester: Player, target: Player)
	if requester == target then
		return false, "لا يمكنك كلبشة نفسك."
	end
	local reqProfile = getProfile(requester)
	local targetState = cuffedTargets[target.UserId]
	if targetState then
		return false, "هذا اللاعب مكلبش بالفعل."
	end
	if heldTargets[requester.UserId] then
		return false, "تملك أسيراً واحداً بالفعل — فكّه أولاً."
	end
	if reqProfile.nextActionAt and os.clock() < reqProfile.nextActionAt then
		return false, "انتظر قليلاً قبل محاولة الكلبشة مرة أخرى."
	end
	if not isAdmin(requester) then
		local equipped = activeCuffDef(requester)
		if not equipped then
			return false, "يجب أن تمتلك وتجهّز كلبشة أولاً."
		end
		if getProfile(requester).owned[equipped.key] ~= true then
			return false, "الكبشة المجهّزة غير مملوكة."
		end
	end
	if not isAdmin(requester) and isAdmin(target) then
		return false, "اللاعب الإداري محمي من الكلبشة."
	end
	local reqChar = requester.Character
	local tgtChar = target.Character
	local reqRoot = findRoot(reqChar)
	local tgtRoot = findRoot(tgtChar)
	if not reqRoot or not tgtRoot then
		return false, "تعذّر التحقق من المسافة بين اللاعبين."
	end
	local dist = (reqRoot.Position - tgtRoot.Position).Magnitude
	if dist > CONFIG.CuffDistance then
		return false, "الهدف بعيد أكثر من اللازم."
	end
	return true
end

local function applyCuff(requester: Player, target: Player, style)
	local targetChar = target.Character
	local targetHum = findHumanoid(targetChar)
	local targetRoot = findRoot(targetChar)
	if not targetChar or not targetHum or not targetRoot then
		return false, "تعذّر الوصول إلى شخصية الهدف."
	end
	local cufferRoot = findRoot(requester.Character)
	if not cufferRoot then
		return false, "تعذّر الوصول إلى شخصية المكلّف."
	end

	local record = {
		cufferUserId = requester.UserId,
		targetUserId = target.UserId,
		styleKey = style.key,
		permanent = isAdmin(requester),
		savedHumanoid = captureHumanoidState(targetHum),
		savedMotors = {},
		visuals = {},
		track = nil,
		alignPos = nil,
		alignOri = nil,
		leaderAttach = nil,
		targetAttach = nil,
		charConn = nil,
		diedConn = nil,
		removeConn = nil,
		beam = nil,
		model = nil,
	}

	cuffedTargets[target.UserId] = record
	heldTargets[requester.UserId] = target.UserId
	getProfile(requester).nextActionAt = os.clock() + CONFIG.ActionCooldown

	pcall(function() targetHum.Sit = false end)
	pcall(function() targetHum.WalkSpeed = 0 end)
	pcall(function() targetHum.JumpPower = 0 end)
	pcall(function() targetHum.JumpHeight = 0 end)
	pcall(function() targetHum.AutoRotate = false end)
	pcall(function() targetHum.PlatformStand = false end)
	pcall(function() targetRoot:SetNetworkOwner(nil) end)
	pcall(function() targetRoot.AssemblyLinearVelocity = Vector3.zero end)
	pcall(function() targetRoot.AssemblyAngularVelocity = Vector3.zero end)

	if not ensureAnimation(targetHum, record) then
		poseBehindBack(target, record)
	end
	if target.Character then
		target.Character:SetAttribute("CuffPosed", true)
	end

	local visuals = buildCuffVisuals(requester, target, style)
	record.visuals = visuals
	record.model = visuals.model
	record.beam = visuals.beam
	local leaderAttach = Instance.new("Attachment")
	leaderAttach.Name = "CuffLeader"
	leaderAttach.Position = Vector3.new(0, CONFIG.LeashYOffset, CONFIG.LeashDistance)
	leaderAttach.Parent = cufferRoot
	local targetAttach = Instance.new("Attachment")
	targetAttach.Name = "CuffTarget"
	targetAttach.Position = Vector3.new(0, CONFIG.LeashYOffset, 0)
	targetAttach.Parent = targetRoot
	record.leaderAttach = leaderAttach
	record.targetAttach = targetAttach

	local alignPos = Instance.new("AlignPosition")
	alignPos.Name = "CuffAlignPosition"
	alignPos.Attachment0 = targetAttach
	alignPos.Attachment1 = leaderAttach
	alignPos.RigidityEnabled = true
	alignPos.ApplyAtCenterOfMass = true
	alignPos.MaxForce = 1e9
	alignPos.Responsiveness = 90
	alignPos.Parent = targetRoot
	record.alignPos = alignPos

	local alignOri = Instance.new("AlignOrientation")
	alignOri.Name = "CuffAlignOrientation"
	alignOri.Attachment0 = targetAttach
	alignOri.Attachment1 = leaderAttach
	alignOri.RigidityEnabled = true
	alignOri.MaxTorque = 1e9
	alignOri.Responsiveness = 90
	alignOri.Parent = targetRoot
	record.alignOri = alignOri

	local targetPlayer = target
	local cufferPlayer = requester
	record.charConn = targetPlayer.CharacterAdded:Connect(function()
		if cuffedTargets[targetPlayer.UserId] then
			releaseTarget(targetPlayer, "تمت إعادة الظهور", true)
		end
	end)
	record.diedConn = targetHum.Died:Connect(function()
		if cuffedTargets[targetPlayer.UserId] then
			releaseTarget(targetPlayer, "المُقيّد مات", true)
		end
	end)
	local cufferHum = findHumanoid(requester.Character)
	if cufferHum then
		record.removeConn = cufferHum.Died:Connect(function()
			if heldTargets[cufferPlayer.UserId] then
				releaseByCuffer(cufferPlayer, "خرج صاحب الكلبشة أو مات", true)
			end
		end)
	end

	syncProfile(targetPlayer)
	syncProfile(cufferPlayer)
	notify(targetPlayer, "⛓️ تم تقييدك بواسطة " .. cufferPlayer.Name .. "!")
	notify(cufferPlayer, "⛓️ أمسكت بـ " .. targetPlayer.Name .. " بنجاح.")
	return true
end

local function requestCuff(requester: Player, targetUserId: number)
	local target = Players:GetPlayerByUserId(targetUserId)
	if not target then
		return false, "اللاعب غير موجود حالياً."
	end
	local ok, reason = canCuffTarget(requester, target)
	if not ok then
		return false, reason
	end
	local style = activeCuffDef(requester)
	if not style then
		style = firstDef()
	end
	local success, err = applyCuff(requester, target, style)
	if not success then
		return false, err
	end
	return true, nil
end

local function equipCuff(player: Player, key: string)
	local profile = getProfile(player)
	if profile.owned[key] ~= true then
		return false, "يجب شراء هذه الكلبشة أولاً."
	end
	profile.equipped = key
	clampEquipped(profile)
	task.spawn(function() saveData(player.UserId) end)
	updateStoreAndState(player)
	return true, nil
end

local function buyCuff(player: Player, key: string)
	local profile = getProfile(player)
	local def = CUFF_BY_KEY[key]
	if not def then
		return false, "نوع الكلبشة غير صالح."
	end
	if profile.owned[key] == true then
		profile.equipped = profile.equipped ~= "" and profile.equipped or key
		clampEquipped(profile)
		task.spawn(function() saveData(player.UserId) end)
		updateStoreAndState(player)
		return true, "مملوك بالفعل."
	end
	local liveOwned = false
	pcall(function()
		liveOwned = MarketplaceService:UserOwnsGamePassAsync(player.UserId, def.passId)
	end)
	if liveOwned then
		profile.owned[key] = true
		if profile.equipped == "" then
			profile.equipped = key
		end
		clampEquipped(profile)
		task.spawn(function() saveData(player.UserId) end)
		updateStoreAndState(player)
		return true, "مملوك بالفعل."
	end
	pcall(function()
		MarketplaceService:PromptGamePassPurchase(player, def.passId)
	end)
	if _G.NotifyPlayer then
		_G.NotifyPlayer(player, "🛍️ تم فتح نافذة شراء «" .. def.name .. "».")
	end
	return true, nil
end

local function releaseRequest(requester: Player, targetUserId: number)
	local target = Players:GetPlayerByUserId(targetUserId)
	if not target then
		return false, "اللاعب غير موجود حالياً."
	end
	local state = cuffedTargets[target.UserId]
	if not state then
		return false, "هذا اللاعب غير مكلبش."
	end
	local admin = isAdmin(requester)
	if not admin and state.cufferUserId ~= requester.UserId then
		return false, "لا تملك صلاحية فك هذه الكلبشة."
	end
	return releaseTarget(target, admin and "أُفكّت بواسطة الإدارة" or "تم الفك", admin), nil
end

local function struggleRequest(player: Player)
	local state = cuffedTargets[player.UserId]
	if not state then
		return false, "أنت لست مكلبشاً حالياً."
	end
	local now = os.clock()
	if state.lastStruggleAt and (now - state.lastStruggleAt) < 0.9 then
		return false, nil
	end
	state.lastStruggleAt = now
	notify(player, "⚠️ تحاول المقاومة... لكن الكلبشات ثابتة.")
	if heldTargets[state.cufferUserId] then
		local cuffer = Players:GetPlayerByUserId(state.cufferUserId)
		if cuffer then
			notify(cuffer, "✋ " .. player.Name .. " يحاول المقاومة.")
		end
	end
	return true, nil
end

local function cleanPlayer(player: Player)
	if heldTargets[player.UserId] then
		releaseByCuffer(player, "غادر صاحب الكلبشة", true)
	end
	if cuffedTargets[player.UserId] then
		releaseTarget(player, "غادر اللاعب المكلبش", true)
	end
	rlBuckets[player.UserId] = nil
end

------------------------------------------------------------------------
-- Player lifecycle
------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player)
	local ok, saved = loadData(player.UserId)
	if not ok then
		profiles[player.UserId] = {
			owned = {},
			equipped = "",
			loaded = true,
			dataLoaded = false,
			nextActionAt = 0,
		}
		notify(player, "⚠️ تعذّر تحميل الكلبشات بسبب ضغط الخادم. سيتم حفظ التغييرات لاحقاً فقط إذا عاد المتجر للاتزان.")
	elseif type(saved) == "table" then
		profiles[player.UserId] = {
			owned = {},
			equipped = type(saved.equipped) == "string" and saved.equipped or "",
			loaded = true,
			dataLoaded = true,
			nextActionAt = 0,
		}
		clampEquipped(profiles[player.UserId])
	else
		profiles[player.UserId] = {
			owned = {},
			equipped = "",
			loaded = true,
			dataLoaded = true,
			nextActionAt = 0,
		}
	end
	updateStoreAndState(player)
	task.spawn(function()
		refreshOwnership(player)
	end)
	task.delay(0.3, function()
		if player and player.Parent then
			syncProfile(player)
		end
	end)

	player.CharacterAdded:Connect(function()
		if cuffedTargets[player.UserId] then
			releaseTarget(player, "تغيّر الشخصية", true)
		end
		if heldTargets[player.UserId] then
			releaseByCuffer(player, "تغيّر شخصية صاحب الكلبشة", true)
		end
		local profile = profiles[player.UserId]
		if profile then
			clampEquipped(profile)
			syncProfile(player)
		end
	end)
end)

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
	if not purchased then return end
	local def = cuffDefByPassId[passId]
	if not def then return end
	local profile = getProfile(player)
	profile.owned[def.key] = true
	if profile.equipped == "" then
		profile.equipped = def.key
	end
	clampEquipped(profile)
	task.spawn(function() saveData(player.UserId) end)
	updateStoreAndState(player)
	notify(player, "✅ تم تفعيل «" .. def.name .. "» — جاهزة للاستخدام.")
end)

Players.PlayerRemoving:Connect(function(player)
	task.spawn(function()
		saveData(player.UserId)
		cleanPlayer(player)
		profiles[player.UserId] = nil
	end)
end)

game:BindToClose(function()
	for _, player in ipairs(Players:GetPlayers()) do
		pcall(function() saveData(player.UserId) end)
	end
end)

------------------------------------------------------------------------
-- Remote handling
------------------------------------------------------------------------
local function sendStateWithReason(player: Player, reason: string?)
	syncProfile(player)
	if reason and reason ~= "" then
		notify(player, reason)
	end
end

cuffRemote.OnServerEvent:Connect(function(player, payload)
	if not rlAllow(player.UserId) then return end
	if type(payload) ~= "table" then return end

	local action = payload.action
	if action == "requestState" then
		sendStateWithReason(player)
		return
	elseif action == "buyCuff" then
		local key = tostring(payload.key or "")
		local ok, reason = buyCuff(player, key)
		if not ok then notify(player, "❌ " .. tostring(reason or "تعذّر شراء الكلبشة.")) end
		return
	elseif action == "equipCuff" then
		local key = tostring(payload.key or "")
		local ok, reason = equipCuff(player, key)
		if ok then
			notify(player, "✅ جُهّزت «" .. (CUFF_BY_KEY[key] and CUFF_BY_KEY[key].name or key) .. "».")
		else
			notify(player, "❌ " .. tostring(reason or "تعذّر التجهيز."))
		end
		return
	elseif action == "cuffPlayer" then
		local targetUserId = tonumber(payload.targetUserId)
		if not targetUserId then
			notify(player, "⚠️ هدف الكلبشة غير صالح.")
			return
		end
		local ok, reason = requestCuff(player, targetUserId)
		if not ok then
			notify(player, "❌ " .. tostring(reason or "تعذّر تقييد اللاعب."))
		end
		return
	elseif action == "releasePlayer" then
		local targetUserId = tonumber(payload.targetUserId)
		if not targetUserId then
			notify(player, "⚠️ هدف الفك غير صالح.")
			return
		end
		local ok, reason = releaseRequest(player, targetUserId)
		if not ok then
			notify(player, "❌ " .. tostring(reason or "تعذّر فك الكلبشة."))
		end
		return
	elseif action == "struggle" then
		local _ok, reason = struggleRequest(player)
		if reason then
			notify(player, reason)
		end
		return
	end
end)

------------------------------------------------------------------------
-- Autosave
------------------------------------------------------------------------
task.spawn(function()
	while true do
		task.wait(CONFIG.SaveEvery)
		for userId in pairs(profiles) do
			task.spawn(function()
				saveData(userId)
			end)
		end
	end
end)

print("[CuffSystem] Ready — 6 styles, coin-owned, drag-leash cuffing enabled.")
