-- ════════════════════════════════════════════════════════════════════════
-- CHERRY TREES (Server) — أشجار كرز وردية مصمّمة في بلندر (FBX) تُحمَّل عبر
-- Open Cloud وتُركَّب بأماكن الأشجار الخضراء القديمة + تحضن مدخل «ركن الألعاب».
-- كل شجرة: ميش جذع متفرّع (Trunk) + ميش تاج وردي كثيف (Canopy). يُلوَّن وقت
-- التشغيل، والتاج يُلفّ في Model محوره قمة الجذع ويُوسَم "CherryCanopy" ليتمايل
-- مع الريح (السكربت العميل). سياسة الماب: كل العناصر تُصمَّم في بلندر.
-- ════════════════════════════════════════════════════════════════════════
local Workspace = game:GetService("Workspace")
local CollectionService = game:GetService("CollectionService")
local InsertService = game:GetService("InsertService")

local CHERRY_ASSET_ID = 109100596073469

local BARK = Color3.fromRGB(96, 64, 42)
local PINKS = {
	Color3.fromRGB(255, 158, 199),
	Color3.fromRGB(255, 184, 214),
	Color3.fromRGB(238, 132, 182),
	Color3.fromRGB(255, 170, 206),
}

-- تحميل قالب الشجرة مرّة واحدة (ثم نستنسخه لكل موقع)
local function loadTemplate(): Model?
	local ok, loaded
	for attempt = 1, 5 do
		ok, loaded = pcall(function()
			return InsertService:LoadAsset(CHERRY_ASSET_ID)
		end)
		if ok and loaded then
			break
		end
		warn("[CherryTrees] محاولة تحميل الأصل فشلت", attempt, loaded)
		task.wait(2)
	end
	if not (ok and loaded) then
		warn("[CherryTrees] تعذّر تحميل أصل شجرة الكرز")
		return nil
	end
	local trunk = loaded:FindFirstChild("Trunk", true)
	local canopy = loaded:FindFirstChild("Canopy", true)
	if not (trunk and canopy and trunk:IsA("BasePart") and canopy:IsA("BasePart")) then
		warn("[CherryTrees] الأصل لا يحوي Trunk/Canopy")
		loaded:Destroy()
		return nil
	end
	loaded.Name = "CherryTemplate"
	return loaded
end

local function petals(parent: BasePart)
	local emit = Instance.new("ParticleEmitter")
	emit.Name = "Petals"
	emit.Color = ColorSequence.new(Color3.fromRGB(255, 183, 212))
	emit.Texture = "rbxassetid://6234266408"
	emit.Lifetime = NumberRange.new(4, 6)
	emit.Rate = 5
	emit.Speed = NumberRange.new(0.6, 1.4)
	emit.SpreadAngle = Vector2.new(40, 40)
	emit.Rotation = NumberRange.new(0, 360)
	emit.RotSpeed = NumberRange.new(-40, 40)
	emit.Acceleration = Vector3.new(0.4, -2.2, 0.2)
	emit.Size = NumberSequence.new(0.5)
	emit.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.1),
		NumberSequenceKeypoint.new(0.8, 0.2),
		NumberSequenceKeypoint.new(1, 1),
	})
	emit.EmissionDirection = Enum.NormalId.Bottom
	emit.Parent = parent
end

local function placeTree(template: Model, parent: Instance, x: number, z: number, gy: number, seed: number)
	local rng = Random.new(seed)
	local tree = template:Clone()
	tree.Name = "CherryTree"
	tree:ScaleTo(rng:NextNumber(0.7, 0.9))
	tree.Parent = parent

	local trunk = tree:FindFirstChild("Trunk", true) :: BasePart
	local canopyPart = tree:FindFirstChild("Canopy", true) :: BasePart

	-- صبغ: جذع بنّي صلب + تاج وردي (درجة عشوائية لكل شجرة)
	trunk.Color = BARK
	trunk.Material = Enum.Material.Wood
	trunk.Anchored = true
	trunk.CanCollide = true
	local pink = PINKS[rng:NextInteger(1, #PINKS)]
	canopyPart.Color = pink
	canopyPart.Material = Enum.Material.SmoothPlastic
	canopyPart.Anchored = true
	canopyPart.CanCollide = false

	-- إنزال الشجرة على الأرض عند (x, z): محاذاة قاع الصندوق المحيط للنقطة
	local cf, size = tree:GetBoundingBox()
	local bottomCenter = Vector3.new(cf.X, cf.Y - size.Y / 2, cf.Z)
	tree:PivotTo(tree:GetPivot() + (Vector3.new(x, gy, z) - bottomCenter))
	-- دوران عشوائي حول محور الجذع للتنويع
	local base = Vector3.new(x, gy, z)
	local yaw = rng:NextNumber(0, math.pi * 2)
	tree:PivotTo(CFrame.new(base) * CFrame.Angles(0, yaw, 0) * CFrame.new(-base) * tree:GetPivot())

	-- لفّ التاج في Model محوره قمة الجذع ليتمايل كالبندول مع الريح
	local trunkTop = Vector3.new(trunk.Position.X, trunk.Position.Y + trunk.Size.Y / 2, trunk.Position.Z)
	local canopy = Instance.new("Model")
	canopy.Name = "Canopy"
	canopy.Parent = tree
	canopyPart.Parent = canopy
	canopy.WorldPivot = CFrame.new(trunkTop)
	CollectionService:AddTag(canopy, "CherryCanopy")

	petals(canopyPart)
	return tree
end

-- إزالة الأشجار الخضراء القديمة المخبوزة (Tree1..N) من الماب
local function removeOldTrees()
	for _, inst in ipairs(Workspace:GetDescendants()) do
		if inst:IsA("Model") and string.match(inst.Name, "^Tree%d+$") then
			inst:Destroy()
		end
	end
end

local root = Instance.new("Folder")
root.Name = "CherryTrees"
root.Parent = Workspace

removeOldTrees()

-- مواقع الأشجار الخضراء القديمة (نستبدلها بكرز) + حضن مدخل ركن الألعاب
local SPOTS = {
	{ -65, -65, 0 },
	{ 65, -65, 0 },
	{ -65, 65, 0 },
	{ 65, 65, 0 },
	{ -72, 0, 0 },
	{ 72, 0, 0 },
	-- تحضن مدخل «ركن الألعاب» (المدخل يواجه -Z، المبنى عند z=110)
	{ 19, 79, 0.3 },
	{ -19, 79, 0.3 },
	{ 27, 96, 0.3 },
	{ -27, 96, 0.3 },
}

local template = loadTemplate()
if template then
	for i, s in ipairs(SPOTS) do
		local ok, err = pcall(function()
			placeTree(template, root, s[1], s[2], s[3], i * 7919 + 13)
		end)
		if not ok then
			warn("[CherryTrees] فشل تركيب شجرة", i, err)
		end
	end
	template:Destroy()
end
