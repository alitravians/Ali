-- ════════════════════════════════════════════════════════════════════════
-- CHERRY TREES (Server) — أشجار كرز وردية 3D حقيقية تستبدل الأشجار الخضراء
-- في الماب، وتحضن مدخل «ركن الألعاب». لكل شجرة: جذع متفرّع + تاج وردي كثيف.
-- التاج يُوسَم "CherryCanopy" ليحرّكه السكربت العميل (تمايل مع الريح).
-- ════════════════════════════════════════════════════════════════════════
local Workspace = game:GetService("Workspace")
local CollectionService = game:GetService("CollectionService")

local BARK = Color3.fromRGB(96, 64, 42)
local BARK_D = Color3.fromRGB(72, 47, 30)
local PINKS = {
	Color3.fromRGB(255, 158, 199),
	Color3.fromRGB(255, 190, 216),
	Color3.fromRGB(236, 124, 174),
	Color3.fromRGB(255, 174, 208),
}

local function mkPart(props): BasePart
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = props.CanCollide == true
	p.CastShadow = props.CastShadow ~= false
	p.Material = props.Material or Enum.Material.SmoothPlastic
	p.Color = props.Color or Color3.new(1, 1, 1)
	p.Size = props.Size or Vector3.new(1, 1, 1)
	if props.Shape then
		p.Shape = props.Shape
	end
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.CFrame = props.CFrame or CFrame.new()
	p.Name = props.Name or "Part"
	p.Parent = props.Parent
	return p
end

-- أسطوانة بين نقطتين (محور الأسطوانة هو X محلياً)
local function cyl(parent, name, p0, p1, r, color, mat, collide): BasePart?
	local dir = p1 - p0
	local len = dir.Magnitude
	if len < 0.05 then
		return nil
	end
	local cf = CFrame.lookAt(p0 + dir * 0.5, p1) * CFrame.Angles(0, math.rad(90), 0)
	return mkPart({
		Parent = parent,
		Name = name,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(len, r * 2, r * 2),
		CFrame = cf,
		Color = color,
		Material = mat,
		CanCollide = collide == true,
	})
end

local function buildCherryTree(parent: Instance, x: number, z: number, gy: number, seed: number)
	local rng = Random.new(seed)
	local sc = rng:NextNumber(0.92, 1.15)
	local trunkH = 9 * sc
	local leanX = rng:NextNumber(-0.7, 0.7)
	local leanZ = rng:NextNumber(-0.7, 0.7)

	local tree = Instance.new("Model")
	tree.Name = "CherryTree"
	tree.Parent = parent

	local base = Vector3.new(x, gy, z)
	local mid = Vector3.new(x + leanX * 0.5, gy + trunkH * 0.55, z + leanZ * 0.5)
	local top = Vector3.new(x + leanX, gy + trunkH, z + leanZ)

	local trunkLow = cyl(tree, "CherryTrunk", base, mid, 0.95 * sc, BARK, Enum.Material.Wood, true)
	cyl(tree, "CherryTrunk", mid, top, 0.66 * sc, BARK, Enum.Material.Wood, true)
	if trunkLow then
		tree.PrimaryPart = trunkLow
	end

	-- توهّج جذور بسيط عند القاعدة
	for k = 1, 5 do
		local a = (k / 5) * math.pi * 2
		cyl(
			tree,
			"Root",
			Vector3.new(x, gy + 0.25, z),
			Vector3.new(x + math.cos(a) * 1.2 * sc, gy - 0.1, z + math.sin(a) * 1.2 * sc),
			0.35 * sc,
			BARK_D,
			Enum.Material.Wood,
			false
		)
	end

	-- أغصان متفرّعة + أطرافها مواضع تجمّع الأزهار
	local tips = {}
	local nB = 5
	for i = 1, nB do
		local ang = (i / nB) * math.pi * 2 + rng:NextNumber(-0.35, 0.35)
		local reach = rng:NextNumber(2.6, 4.2) * sc
		local up = rng:NextNumber(2.6, 3.6) * sc
		local tip = top + Vector3.new(math.cos(ang) * reach, up, math.sin(ang) * reach)
		cyl(tree, "Branch", top, tip, 0.4 * sc, BARK, Enum.Material.Wood, false)
		tips[#tips + 1] = tip
	end

	-- التاج: كرات وردية كثيفة داخل Model واحد يتمايل مع الريح
	local canopy = Instance.new("Model")
	canopy.Name = "Canopy"
	canopy.Parent = tree

	local function blossom(pos: Vector3, r: number)
		mkPart({
			Parent = canopy,
			Name = "Blossom",
			Shape = Enum.PartType.Ball,
			Size = Vector3.new(r, r, r),
			CFrame = CFrame.new(pos),
			Color = PINKS[rng:NextInteger(1, #PINKS)],
			Material = Enum.Material.SmoothPlastic,
			CanCollide = false,
		})
	end

	for _, tp in ipairs(tips) do
		for _ = 1, 4 do
			local o = Vector3.new(rng:NextNumber(-1.4, 1.4), rng:NextNumber(-1.0, 1.4), rng:NextNumber(-1.4, 1.4))
			blossom(tp + o, rng:NextNumber(2.0, 3.0) * sc)
		end
	end
	local domeC = top + Vector3.new(0, 3.2 * sc, 0)
	for _ = 1, 16 do
		local th = rng:NextNumber(0, math.pi * 2)
		local ph = math.acos(rng:NextNumber(-0.1, 1.0))
		local R = 4.7 * sc * math.sqrt(rng:NextNumber(0, 1))
		local p = domeC
			+ Vector3.new(R * math.sin(ph) * math.cos(th), R * math.cos(ph) * 0.82, R * math.sin(ph) * math.sin(th))
		blossom(p, rng:NextNumber(2.2, 3.3) * sc)
	end

	-- محور التمايل عند قمة الجذع (يدوّر التاج كالبندول)
	canopy.WorldPivot = CFrame.new(top)
	CollectionService:AddTag(canopy, "CherryCanopy")

	-- تساقط بتلات وردية خفيف (يُعرَض على جهة اللاعب)
	local anchor = canopy:FindFirstChildWhichIsA("BasePart")
	if anchor then
		local emit = Instance.new("ParticleEmitter")
		emit.Name = "Petals"
		emit.Color = ColorSequence.new(Color3.fromRGB(255, 183, 212))
		emit.Texture = "rbxassetid://6234266408"
		emit.Lifetime = NumberRange.new(4, 6)
		emit.Rate = 4
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
		emit.Parent = anchor
	end

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
	-- بدائل الأشجار الخضراء في الماب (نفس مواقعها)
	{ -65, -65, 0 },
	{ 65, -65, 0 },
	{ -65, 65, 0 },
	{ 65, 65, 0 },
	{ -72, 0, 0 },
	{ 72, 0, 0 },
	-- تحضن مدخل «ركن الألعاب» (المدخل يواجه -Z نحو السبون، المبنى عند z=110)
	{ 19, 79, 0.3 },
	{ -19, 79, 0.3 },
	{ 27, 96, 0.3 },
	{ -27, 96, 0.3 },
}

for i, s in ipairs(SPOTS) do
	buildCherryTree(root, s[1], s[2], s[3], i * 7919 + 13)
end
