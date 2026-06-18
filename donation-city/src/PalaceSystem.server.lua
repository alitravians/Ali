--[[
╔══════════════════════════════════════════════════════════════════════╗
║  القصر الجمهوري — PALACE SYSTEM (Server)                               ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  يبني داخل «القصر الجمهوري» (الموديل الفخم موضوع مكان الشاطئ) كامل      ║
║  التجربة برمجياً وكهندسة ثابتة خفيفة (كلها Anchored = صفر لاق):         ║
║    • بهو + قاعة استقبال + غرفة ضيوف + مكتب رئاسي — تأثيث كامل لكل غرفة   ║
║      بأثاث وديكور وإضاءة وألوان مميّزة.                                  ║
║    • لافتة ذهبية متوهّجة «مكتب القصر الجمهوري لشهد» فوق المدخل.          ║
║    • قفل بصمة واقعي: تضغط الجهاز → شاشة مسح متحرّكة + صوت → الباب يفتح   ║
║      تدريجياً ثم يقفل. للأدمن فقط، والتحقق على السيرفر (آمن).            ║
║    • سجلّ دخول (الاسم + الوقت) يُحفظ بالـDataStore، يشوفه الأدمن.        ║
║    • حرّاس يرحّبون بالضيوف عند الاقتراب.                                ║
║                                                                        ║
║  منطق التكامل كله في هذا السكربت (سكربتي الخاص) — موديل القصر يبقى       ║
║  كما هو دون تعديل، حسب قاعدة الدمج الآمنة.                              ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace          = game:GetService("Workspace")
local ReplicatedStorage  = game:GetService("ReplicatedStorage")
local TweenService       = game:GetService("TweenService")
local DataStoreService   = game:GetService("DataStoreService")

----------------------------------------------------------------------
-- ⚙️ إعدادات عامة + تحقّق الصلاحية (للأدمن فقط)
----------------------------------------------------------------------
local SCAN_TIME   = 2.3    -- مدة «المسح» قبل ظهور النتيجة (إحساس واقعي)
local DOOR_OPEN_T = 2.6    -- مدة فتح الباب تدريجياً
local DOOR_HOLD   = 5.0    -- يبقى الباب مفتوحاً قبل أن يقفل تلقائياً

local function isAdmin(player: Player): boolean
	if type(_G.GetChatRank) == "function" then
		local ok, rank = pcall(_G.GetChatRank, player)
		if ok and (rank == "owner" or rank == "admin") then
			return true
		end
	end
	return false
end

----------------------------------------------------------------------
-- 🗺️ هندسة القصر الداخلية (إحداثيات عالمية) — تحت كتلة الموديل الفخم
----------------------------------------------------------------------
local FX0, FX1 = 96, 240    -- حدود الأرضية على محور X
local FZ0, FZ1 = -36, 72    -- حدود الأرضية على محور Z
local FLOOR_Y  = 0.6        -- سطح الأرضية
local CEIL_Y   = 11.6       -- ارتفاع السقف الداخلي
local WT       = 1          -- سُمك الجدار

-- فتحة المدخل الرئيسي على الجهة المقابلة للمدينة (-X)
local ENT_Z0, ENT_Z1 = 11, 25     -- عرض المدخل (١٤)
local ENT_X = FX0                  -- x = 96

-- ألوان/خامات (نُعومة هادئة — لا أبيض ثلجي فاقع)
local MARBLE   = Color3.fromRGB(206, 200, 188)
local WALL_C   = Color3.fromRGB(228, 224, 214)
local TRIM_GOLD= Color3.fromRGB(214, 175, 92)
local CEIL_C   = Color3.fromRGB(234, 230, 222)
local STONE    = Color3.fromRGB(176, 170, 158)   -- بلاط حجري للساحة الخارجية
local WOOD     = Color3.fromRGB(86, 56, 34)
local WOOD_D   = Color3.fromRGB(64, 40, 24)

----------------------------------------------------------------------
-- 🧱 حاوية + مساعدو البناء
----------------------------------------------------------------------
local old = Workspace:FindFirstChild("PalaceInterior")
if old then old:Destroy() end

local ROOT = Instance.new("Model")
ROOT.Name = "PalaceInterior"
ROOT.Parent = Workspace

local function part(name: string, cf: CFrame, size: Vector3, color: Color3, mat: Enum.Material?, parent: Instance?): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.CanCollide = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = mat or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent or ROOT
	return p
end

-- صندوق من حدود min..max (مريح لبناء الجدران/الأرضية/الأثاث)
local function box(name, x0, x1, y0, y1, z0, z1, color, mat, parent): Part
	local sx, sy, sz = math.abs(x1 - x0), math.abs(y1 - y0), math.abs(z1 - z0)
	local cf = CFrame.new((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
	return part(name, cf, Vector3.new(sx, sy, sz), color, mat, parent)
end

-- مقعد قابل للجلوس فعلاً (Seat) — يجلس عليه اللاعب عند لمسه
local function seatPart(name: string, cf: CFrame, size: Vector3, color: Color3, mat: Enum.Material?): Seat
	local s = Instance.new("Seat")
	s.Name = name
	s.Anchored = true
	s.CanCollide = true
	s.Size = size
	s.CFrame = cf
	s.Color = color
	s.Material = mat or Enum.Material.Fabric
	s.TopSurface = Enum.SurfaceType.Smooth
	s.BottomSurface = Enum.SurfaceType.Smooth
	s.Parent = ROOT
	return s
end

local function pointLight(parent: BasePart, color: Color3, bright: number, range: number)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Brightness = bright
	l.Range = range
	l.Parent = parent
	return l
end

-- شريط ذهبي زخرفي (إفريز) أفقي
local function goldStrip(x0, x1, y, z0, z1)
	local s = box("Trim", x0, x1, y, y + 0.4, z0, z1, TRIM_GOLD, Enum.Material.Metal)
	s.CanCollide = false
	return s
end

----------------------------------------------------------------------
-- 🏛️ القشرة: أرضية + سقف + جدران خارجية (بفتحة مدخل) + جدران داخلية
----------------------------------------------------------------------
-- أرضية رخامية (تغطّي كامل منطقة النحت لإغلاق أي فجوة يظهر منها العشب)
box("Floor", 95, 241, 0, FLOOR_Y, -37, 73, MARBLE, Enum.Material.Marble)
-- سقف
box("Ceiling", FX0, FX1, CEIL_Y, CEIL_Y + 0.7, FZ0, FZ1, CEIL_C, Enum.Material.SmoothPlastic)

-- ساحة/ممرّ المدخل الحجري أمام الباب (يقفل الحفرة التي خلّفها نحت الممر الغربي
-- ويعطي انتقالاً نظيفاً من العشب إلى القصر — بدل سقوط اللاعب في فجوة).
box("EntryPlaza", 78, FX0, 0, FLOOR_Y, 2, 34, STONE, Enum.Material.Concrete)
-- درجتان منخفضتان عند مقدّمة الساحة
box("EntryStep1", 74, 78, 0, FLOOR_Y - 0.2, 4, 32, STONE, Enum.Material.Concrete)
box("EntryStep2", 71, 74, 0, FLOOR_Y - 0.4, 6, 30, STONE, Enum.Material.Concrete)

local function wall(x0, x1, z0, z1)
	box("Wall", x0, x1, FLOOR_Y, CEIL_Y, z0, z1, WALL_C, Enum.Material.SmoothPlastic)
end

-- جدار -X (مدخل المدينة) بفتحة المدخل
wall(ENT_X - WT, ENT_X, FZ0, ENT_Z0)
wall(ENT_X - WT, ENT_X, ENT_Z1, FZ1)
-- جدار +X (الخلفي)
wall(FX1, FX1 + WT, FZ0, FZ1)
-- جدار -Z و +Z
wall(FX0, FX1, FZ0 - WT, FZ0)
wall(FX0, FX1, FZ1, FZ1 + WT)

-- جدران داخلية + فتحات الأبواب
local DOOR_W0, DOOR_W1 = 126, 142        -- فتحة باب البهو↔القاعات
-- z = 34 (بهو ↔ قاعة استقبال)
wall(FX0, DOOR_W0, 34, 34 + WT)
wall(DOOR_W1, 176, 34, 34 + WT)
-- z = 2 (بهو ↔ غرفة ضيوف)
wall(FX0, DOOR_W0, 2 - WT, 2)
wall(DOOR_W1, 176, 2 - WT, 2)
-- x = 176 (بهو ↔ مكتب رئاسي) بفتحة z[11,25]
wall(176, 176 + WT, FZ0, ENT_Z0)
wall(176, 176 + WT, ENT_Z1, FZ1)

-- عتبات (لينتل) فوق فتحات الأبواب الداخلية لإظهارها كمداخل
local function lintel(x0, x1, z0, z1)
	box("Lintel", x0, x1, 9.2, CEIL_Y, z0, z1, WALL_C, Enum.Material.SmoothPlastic)
end
lintel(DOOR_W0, DOOR_W1, 34, 34 + WT)
lintel(DOOR_W0, DOOR_W1, 2 - WT, 2)
lintel(176, 176 + WT, ENT_Z0, ENT_Z1)

-- إفريز ذهبي محيطي عند أعلى الجدران (لمسة فخامة)
goldStrip(FX0, FX1, CEIL_Y - 0.6, FZ0 - WT, FZ0)
goldStrip(FX0, FX1, CEIL_Y - 0.6, FZ1, FZ1 + WT)
goldStrip(FX1, FX1 + WT, CEIL_Y - 0.6, FZ0, FZ1)

----------------------------------------------------------------------
-- 🪑 مكتبة الأثاث (دوال قابلة لإعادة الاستخدام)
----------------------------------------------------------------------
local function rug(x0, x1, z0, z1, color)
	local r = box("Rug", x0, x1, FLOOR_Y, FLOOR_Y + 0.06, z0, z1, color, Enum.Material.Fabric)
	r.CanCollide = false
	local border = box("RugBorder", x0 - 0.6, x1 + 0.6, FLOOR_Y, FLOOR_Y + 0.04, z0 - 0.6, z1 + 0.6, TRIM_GOLD, Enum.Material.Fabric)
	border.CanCollide = false
end

local function chandelier(x, z, color)
	local chain = part("Chain", CFrame.new(x, CEIL_Y - 1.0, z), Vector3.new(0.2, 2, 0.2), Color3.fromRGB(60,60,60), Enum.Material.Metal)
	chain.CanCollide = false
	local orb = part("Chandelier", CFrame.new(x, CEIL_Y - 2.4, z), Vector3.new(2.6, 1.6, 2.6), Color3.fromRGB(255, 240, 200), Enum.Material.Neon)
	orb.Shape = Enum.PartType.Ball
	orb.CanCollide = false
	pointLight(orb, color, 1.0, 20)
	for i = 0, 5 do
		local a = math.rad(i * 60)
		local arm = part("Crystal", CFrame.new(x + math.cos(a) * 1.6, CEIL_Y - 2.6, z + math.sin(a) * 1.6), Vector3.new(0.3, 1.2, 0.3), Color3.fromRGB(255, 250, 220), Enum.Material.Neon)
		arm.CanCollide = false
	end
end

-- كنبة (قاعدة + ظهر + مسندان)
local function sofa(cx, cz, rotY, color)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	local function place(name, off, size, c, mat)
		local p = part(name, cf * CFrame.new(off), size, c, mat)
		return p
	end
	place("SofaBase", Vector3.new(0, 0.9, 0), Vector3.new(7, 1.4, 3), color, Enum.Material.Fabric)
	seatPart("SofaSeat", cf * CFrame.new(0, 1.7, 0.2), Vector3.new(7, 0.5, 2.6), color, Enum.Material.Fabric)
	place("SofaBack", Vector3.new(0, 2.4, -1.2), Vector3.new(7, 2.4, 0.6), color, Enum.Material.Fabric)
	place("SofaArmL", Vector3.new(-3.2, 1.9, 0), Vector3.new(0.6, 2, 3), color, Enum.Material.Fabric)
	place("SofaArmR", Vector3.new(3.2, 1.9, 0), Vector3.new(0.6, 2, 3), color, Enum.Material.Fabric)
end

local function armchair(cx, cz, rotY, color)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	part("ChairBase", cf * CFrame.new(0, 0.9, 0), Vector3.new(3, 1.4, 3), color, Enum.Material.Fabric)
	seatPart("ChairSeat", cf * CFrame.new(0, 1.7, 0.2), Vector3.new(3, 0.5, 2.6), color, Enum.Material.Fabric)
	part("ChairBack", cf * CFrame.new(0, 2.4, -1.2), Vector3.new(3, 2.4, 0.6), color, Enum.Material.Fabric)
	part("ChairArmL", cf * CFrame.new(-1.3, 1.9, 0), Vector3.new(0.5, 2, 3), color, Enum.Material.Fabric)
	part("ChairArmR", cf * CFrame.new(1.3, 1.9, 0), Vector3.new(0.5, 2, 3), color, Enum.Material.Fabric)
end

-- كرسي زائر بسيط (للحضور أمام المكتب)
local function visitorChair(cx, cz, rotY, color)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	seatPart("VChairSeat", cf * CFrame.new(0, 1.5, 0), Vector3.new(2.2, 0.4, 2.2), color, Enum.Material.Fabric)
	part("VChairBack", cf * CFrame.new(0, 2.6, -0.9), Vector3.new(2.2, 2.2, 0.4), color, Enum.Material.Fabric)
	for _, dx in ipairs({-0.9, 0.9}) do
		for _, dz in ipairs({-0.9, 0.9}) do
			local leg = part("VChairLeg", cf * CFrame.new(dx, 0.75, dz), Vector3.new(0.25, 1.5, 0.25), WOOD_D, Enum.Material.Wood)
			leg.CanCollide = false
		end
	end
end

local function coffeeTable(cx, cz, color)
	local top = part("TableTop", CFrame.new(cx, FLOOR_Y + 1.6, cz), Vector3.new(5, 0.3, 3), color, Enum.Material.Wood)
	top.Reflectance = 0.05
	for _, dx in ipairs({-2.1, 2.1}) do
		for _, dz in ipairs({-1.1, 1.1}) do
			part("TableLeg", CFrame.new(cx + dx, FLOOR_Y + 0.8, cz + dz), Vector3.new(0.4, 1.6, 0.4), WOOD_D, Enum.Material.Wood)
		end
	end
end

local function bigDesk(cx, cz, rotY)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	part("DeskTop", cf * CFrame.new(0, 2.4, 0), Vector3.new(8, 0.4, 4), WOOD, Enum.Material.Wood)
	part("DeskFront", cf * CFrame.new(0, 1.2, 1.8), Vector3.new(8, 2.4, 0.4), WOOD_D, Enum.Material.Wood)
	part("DeskSideL", cf * CFrame.new(-3.8, 1.2, 0), Vector3.new(0.4, 2.4, 4), WOOD_D, Enum.Material.Wood)
	part("DeskSideR", cf * CFrame.new(3.8, 1.2, 0), Vector3.new(0.4, 2.4, 4), WOOD_D, Enum.Material.Wood)
	-- لمسة: مجسم صغير ذهبي على المكتب
	part("DeskOrnament", cf * CFrame.new(2.4, 2.9, 0), Vector3.new(0.8, 0.8, 0.8), TRIM_GOLD, Enum.Material.Metal)
end

local function deskChair(cx, cz, rotY, color)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	seatPart("DChairSeat", cf * CFrame.new(0, 1.7, 0), Vector3.new(2.6, 0.5, 2.6), color, Enum.Material.Fabric)
	part("DChairBack", cf * CFrame.new(0, 3.2, -1.1), Vector3.new(2.6, 3, 0.5), color, Enum.Material.Fabric)
	part("DChairPole", cf * CFrame.new(0, 0.8, 0), Vector3.new(0.4, 1.6, 0.4), Color3.fromRGB(40,40,40), Enum.Material.Metal)
end

local function bookshelf(cx, cz, rotY)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	part("ShelfBody", cf * CFrame.new(0, 4, 0), Vector3.new(6, 8, 1.4), WOOD_D, Enum.Material.Wood)
	for i = 1, 4 do
		part("ShelfBoard", cf * CFrame.new(0, 1 + i * 1.7, 0.1), Vector3.new(5.6, 0.2, 1.2), WOOD, Enum.Material.Wood)
		-- كتب ملوّنة
		for j = -2, 2 do
			local cols = {Color3.fromRGB(150,40,40), Color3.fromRGB(40,80,150), Color3.fromRGB(40,120,70), Color3.fromRGB(180,150,60)}
			local bk = part("Book", cf * CFrame.new(j * 1.0, 1.9 + i * 1.7, 0.2), Vector3.new(0.8, 1.3, 0.9), cols[((i + j) % 4) + 1], Enum.Material.SmoothPlastic)
			bk.CanCollide = false
		end
	end
end

local function plant(cx, cz)
	part("Pot", CFrame.new(cx, FLOOR_Y + 1, cz), Vector3.new(1.8, 2, 1.8), Color3.fromRGB(60, 45, 35), Enum.Material.Slate)
	local foliage = part("Foliage", CFrame.new(cx, FLOOR_Y + 3.4, cz), Vector3.new(3.4, 4, 3.4), Color3.fromRGB(48, 120, 60), Enum.Material.Grass)
	foliage.Shape = Enum.PartType.Ball
	foliage.CanCollide = false
end

-- لوحة جدارية مؤطّرة
local function painting(cf, w, h, img)
	local frame = part("Frame", cf, Vector3.new(0.4, h + 0.8, w + 0.8), TRIM_GOLD, Enum.Material.Metal)
	frame.CanCollide = false
	local canvas = part("Canvas", cf * CFrame.new(-0.25, 0, 0), Vector3.new(0.15, h, w), Color3.fromRGB(235, 230, 220), Enum.Material.SmoothPlastic)
	canvas.CanCollide = false
	if img then
		local d = Instance.new("Decal")
		d.Texture = img
		d.Face = Enum.NormalId.Left
		d.Parent = canvas
	end
end

-- سارية علم (الديكور الرسمي)
local function flag(cx, cz, accent)
	part("FlagPole", CFrame.new(cx, FLOOR_Y + 4.5, cz), Vector3.new(0.3, 9, 0.3), Color3.fromRGB(200,200,200), Enum.Material.Metal)
	local cloth = part("FlagCloth", CFrame.new(cx + 1.7, FLOOR_Y + 7.4, cz), Vector3.new(0.15, 2.4, 3.2), accent, Enum.Material.Fabric)
	cloth.CanCollide = false
	part("FlagTop", CFrame.new(cx, FLOOR_Y + 9.1, cz), Vector3.new(0.5, 0.5, 0.5), TRIM_GOLD, Enum.Material.Metal)
end

----------------------------------------------------------------------
-- 🎨 تأثيث الغرف الأربع — كل غرفة بنمط ولون مميّز
----------------------------------------------------------------------
-- 1) البهو الكبير (lobby) — رخامي ذهبي/كحلي
do
	local NAVY = Color3.fromRGB(28, 42, 78)
	rug(112, 160, 8, 30, NAVY)
	chandelier(136, 18, Color3.fromRGB(255, 236, 200))
	-- مكتب استقبال
	part("ReceptionDesk", CFrame.new(150, FLOOR_Y + 1.8, 18), Vector3.new(2.5, 3.6, 12), Color3.fromRGB(70, 78, 110), Enum.Material.Marble)
	goldStrip(149, 151.5, FLOOR_Y + 3.5, 12, 24)
	plant(104, 10); plant(104, 28)
	flag(170, 8, NAVY); flag(170, 28, NAVY)
end

-- 2) قاعة الاستقبال (reception) — بنفسجي/أرجواني
do
	local PURPLE = Color3.fromRGB(120, 55, 150)
	local SOFA_C = Color3.fromRGB(95, 45, 120)
	rug(108, 164, 42, 66, Color3.fromRGB(70, 35, 90))
	chandelier(120, 54, Color3.fromRGB(225, 190, 255))
	chandelier(154, 54, Color3.fromRGB(225, 190, 255))
	sofa(120, 64, 180, SOFA_C)
	sofa(150, 64, 180, SOFA_C)
	sofa(108, 50, 90, SOFA_C)
	armchair(165, 46, 270, SOFA_C)
	armchair(165, 58, 270, SOFA_C)
	coffeeTable(135, 54, WOOD)
	plant(104, 68); plant(170, 68)
	flag(112, 70, PURPLE); flag(160, 70, PURPLE)
	painting(CFrame.new(FX0 + 0.4, 6, 54) , 6, 4, nil)
end

-- 3) غرفة الضيوف (guest) — أخضر مخضرّ هادئ
do
	local SEAT = Color3.fromRGB(55, 145, 130)
	rug(108, 164, -30, -4, Color3.fromRGB(30, 90, 84))
	chandelier(136, -16, Color3.fromRGB(200, 245, 235))
	armchair(116, -10, 180, SEAT)
	armchair(132, -10, 180, SEAT)
	armchair(150, -10, 180, SEAT)
	sofa(140, -30, 0, SEAT)
	coffeeTable(132, -18, WOOD)
	plant(104, -32); plant(168, -32); plant(168, -8)
	painting(CFrame.new(FX0 + 0.4, 6, -18), 5, 3.5, nil)
	painting(CFrame.new(176 - 0.4, 6, -24), 5, 3.5, nil)
end

-- 4) المكتب الرئاسي (office) — ذهبي/بُنّي فخم + صفّ كراسي للزوّار
do
	local GOLDC = Color3.fromRGB(150, 120, 50)
	rug(186, 232, 4, 40, Color3.fromRGB(90, 70, 30))
	chandelier(208, 22, Color3.fromRGB(255, 226, 170))
	-- المكتب الرئاسي في الصدارة (يواجه الباب -X)
	bigDesk(224, 22, 90)
	deskChair(230, 22, 270, Color3.fromRGB(60, 40, 25))
	-- شعار/ختم على الجدار الخلفي
	local emblem = part("Emblem", CFrame.new(FX1 - 0.5, 6.5, 22), Vector3.new(0.4, 5, 5), TRIM_GOLD, Enum.Material.Metal)
	emblem.Shape = Enum.PartType.Cylinder
	emblem.CFrame = CFrame.new(FX1 - 0.5, 6.5, 22) * CFrame.Angles(0, 0, math.rad(90))
	emblem.CanCollide = false
	pointLight(emblem, Color3.fromRGB(255, 220, 150), 1.0, 12)
	bookshelf(190, 64, 0)
	bookshelf(198, 64, 0)
	flag(214, 6, GOLDC); flag(214, 38, GOLDC)
	-- 🪑 صفّ كراسي الزوّار والحضور أمام المكتب (طلب المالك)
	for i = 0, 3 do
		visitorChair(206, 10 + i * 7, 90, Color3.fromRGB(80, 55, 35))
	end
	for i = 0, 3 do
		visitorChair(200, 10 + i * 7, 90, Color3.fromRGB(80, 55, 35))
	end
	plant(186, 68); plant(232, 68)
end

----------------------------------------------------------------------
-- ✨ اللافتة الذهبية المتوهّجة فوق المدخل «مكتب القصر الجمهوري لشهد»
----------------------------------------------------------------------
do
	local backing = box("SignBacking", ENT_X - 0.9, ENT_X - 0.3, 9.4, 13.2, 4, 32, Color3.fromRGB(22, 20, 16), Enum.Material.SmoothPlastic)
	-- إطار نيون ذهبي
	box("SignFrameT", ENT_X - 1.0, ENT_X - 0.2, 13.0, 13.4, 3.6, 32.4, TRIM_GOLD, Enum.Material.Neon).CanCollide = false
	box("SignFrameB", ENT_X - 1.0, ENT_X - 0.2, 9.2, 9.6, 3.6, 32.4, TRIM_GOLD, Enum.Material.Neon).CanCollide = false
	local glow = pointLight(backing, Color3.fromRGB(255, 205, 110), 1.5, 18)

	local sg = Instance.new("SurfaceGui")
	sg.Name = "PalaceSignGui"
	sg.AutoLocalize = false
	sg.Face = Enum.NormalId.Left          -- يواجه المدينة (-X)
	sg.CanvasSize = Vector2.new(1100, 320)
	sg.LightInfluence = 0
	sg.AlwaysOnTop = false
	sg.Adornee = backing
	sg.Parent = backing

	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.new(1, -30, 1, -30)
	label.Position = UDim2.new(0, 15, 0, 15)
	label.Font = Enum.Font.GothamBlack
	label.Text = "مكتب القصر الجمهوري لشهد"
	label.RichText = true
	label.TextScaled = true
	label.TextColor3 = Color3.fromRGB(255, 224, 150)
	local grad = Instance.new("UIGradient")
	grad.Color = ColorSequence.new({
		ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 240, 190)),
		ColorSequenceKeypoint.new(0.5, Color3.fromRGB(247, 200, 110)),
		ColorSequenceKeypoint.new(1, Color3.fromRGB(214, 160, 70)),
	})
	grad.Rotation = 90
	grad.Parent = label
	local stroke = Instance.new("UIStroke")
	stroke.Color = Color3.fromRGB(120, 80, 20)
	stroke.Thickness = 3
	stroke.Parent = label
	label.Parent = sg

	-- نبض ناعم للتوهّج
	task.spawn(function()
		while backing.Parent do
			TweenService:Create(glow, TweenInfo.new(1.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Brightness = 3.0}):Play()
			task.wait(1.6)
			TweenService:Create(glow, TweenInfo.new(1.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {Brightness = 1.6}):Play()
			task.wait(1.6)
		end
	end)
end

----------------------------------------------------------------------
-- 🚪 أبواب المدخل (مصراعان) — تفتح تدريجياً بحركة سلسة
----------------------------------------------------------------------
local DOOR_H = 9
local doorColor = Color3.fromRGB(60, 44, 28)
local function makeLeaf(name, hingeZ, dir)
	-- المفصلة عند hingeZ، والمصراع يمتدّ نحو المركز بمقدار 3.5
	local hinge = CFrame.new(ENT_X - 0.3, FLOOR_Y + DOOR_H / 2, hingeZ)
	local closed = hinge * CFrame.new(0, 0, dir * 3.5)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.CanCollide = true
	p.Size = Vector3.new(0.6, DOOR_H, 7)
	p.CFrame = closed
	p.Color = doorColor
	p.Material = Enum.Material.Wood
	p.Parent = ROOT
	-- مقبض ذهبي
	local handle = part("Handle", closed * CFrame.new(-0.4, 0, dir * 2.6), Vector3.new(0.4, 1.2, 0.4), TRIM_GOLD, Enum.Material.Metal)
	handle.CanCollide = false
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = p; weld.Part1 = handle; weld.Parent = p
	handle.Anchored = false
	local open = hinge * CFrame.Angles(0, math.rad(-dir * 95), 0) * CFrame.new(0, 0, dir * 3.5)
	return p, closed, open
end

local leafL, closedL, openL = makeLeaf("DoorLeafL", ENT_Z0, 1)
local leafR, closedR, openR = makeLeaf("DoorLeafR", ENT_Z1, -1)

local doorOpen = false
local function setDoors(targetL, targetR, dur)
	local info = TweenInfo.new(dur, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	TweenService:Create(leafL, info, {CFrame = targetL}):Play()
	TweenService:Create(leafR, info, {CFrame = targetR}):Play()
end

local function openDoorsSequence()
	if doorOpen then return end
	doorOpen = true
	setDoors(openL, openR, DOOR_OPEN_T)
	task.delay(DOOR_OPEN_T + DOOR_HOLD, function()
		setDoors(closedL, closedR, DOOR_OPEN_T)
		task.delay(DOOR_OPEN_T, function() doorOpen = false end)
	end)
end

----------------------------------------------------------------------
-- 🔐 جهاز/لوحة البصمة + شبكة الـRemotes + التحقق على السيرفر
----------------------------------------------------------------------
local net = Instance.new("Folder")
net.Name = "PalaceNet"
net.Parent = ReplicatedStorage
local evStartScan = Instance.new("RemoteEvent"); evStartScan.Name = "StartScan"; evStartScan.Parent = net
local evScanResult = Instance.new("RemoteEvent"); evScanResult.Name = "ScanResult"; evScanResult.Parent = net
local evLogReq = Instance.new("RemoteEvent"); evLogReq.Name = "LogRequest"; evLogReq.Parent = net
local evLogData = Instance.new("RemoteEvent"); evLogData.Name = "LogData"; evLogData.Parent = net

-- لوحة البصمة على الجدار يمين الباب
local panelFrame = box("ScannerFrame", ENT_X - 0.9, ENT_X - 0.1, 3.2, 7.0, 27, 30.2, Color3.fromRGB(18, 18, 22), Enum.Material.Metal)
box("ScannerEdge", ENT_X - 1.0, ENT_X - 0.05, 3.0, 7.2, 26.8, 30.4, TRIM_GOLD, Enum.Material.Neon).CanCollide = false
local pad = box("ScannerPad", ENT_X - 1.0, ENT_X - 0.6, 4.0, 6.2, 27.6, 29.6, Color3.fromRGB(20, 60, 90), Enum.Material.Neon)
pad.CanCollide = false
local padLight = pointLight(pad, Color3.fromRGB(80, 170, 230), 0.8, 6)

-- أيقونة بصمة على اللوحة
local padGui = Instance.new("SurfaceGui")
padGui.Name = "PadGui"; padGui.AutoLocalize = false
padGui.Face = Enum.NormalId.Left
padGui.CanvasSize = Vector2.new(220, 300)
padGui.LightInfluence = 0
padGui.Adornee = pad
padGui.Parent = pad
local padIcon = Instance.new("TextLabel")
padIcon.BackgroundTransparency = 1
padIcon.Size = UDim2.new(1, 0, 0.7, 0)
padIcon.Position = UDim2.new(0, 0, 0.02, 0)
padIcon.Font = Enum.Font.GothamBlack
padIcon.Text = "🖐️"
padIcon.TextScaled = true
padIcon.TextColor3 = Color3.fromRGB(180, 230, 255)
padIcon.Parent = padGui
local padText = Instance.new("TextLabel")
padText.BackgroundTransparency = 1
padText.Size = UDim2.new(1, 0, 0.28, 0)
padText.Position = UDim2.new(0, 0, 0.72, 0)
padText.Font = Enum.Font.GothamBold
padText.Text = "ضع بصمتك"
padText.TextScaled = true
padText.TextColor3 = Color3.fromRGB(210, 240, 255)
padText.Parent = padGui

-- ProximityPrompt للتفاعل
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "ضع بصمتك"
prompt.ObjectText = "🔐 قفل القصر الرئاسي"
prompt.HoldDuration = 0
prompt.KeyboardKeyCode = Enum.KeyCode.E
prompt.RequiresLineOfSight = false
prompt.MaxActivationDistance = 9
prompt.Parent = panelFrame

----------------------------------------------------------------------
-- 🗒️ سجلّ الدخول (الاسم + الوقت) — يُحفظ بالـDataStore
----------------------------------------------------------------------
local MAX_LOG = 60
local accessLog: { { name: string, t: number } } = {}
local logStore
do
	local ok, store = pcall(function() return DataStoreService:GetDataStore("PalaceAccessLog_v1") end)
	if ok then
		logStore = store
		local ok2, saved = pcall(function() return store:GetAsync("log") end)
		if ok2 and type(saved) == "table" then
			accessLog = saved
		end
	end
end

local function saveLog()
	if not logStore then return end
	pcall(function() logStore:SetAsync("log", accessLog) end)
end

local function recordEntry(player: Player)
	table.insert(accessLog, 1, { name = player.Name, t = os.time() })
	while #accessLog > MAX_LOG do
		table.remove(accessLog)
	end
	task.spawn(saveLog)
end

----------------------------------------------------------------------
-- 🔁 منطق البصمة (السيرفر مرجع التحقق)
----------------------------------------------------------------------
prompt.Triggered:Connect(function(player)
	-- ابدأ شاشة المسح عند اللاعب فوراً (إحساس واقعي)
	evStartScan:FireClient(player)
	task.wait(SCAN_TIME)
	if isAdmin(player) then
		evScanResult:FireClient(player, true)
		-- تغذية بصرية على اللوحة (أخضر)
		pad.Color = Color3.fromRGB(40, 200, 110)
		padLight.Color = Color3.fromRGB(60, 230, 120)
		recordEntry(player)
		openDoorsSequence()
		task.delay(2, function()
			pad.Color = Color3.fromRGB(20, 60, 90)
			padLight.Color = Color3.fromRGB(80, 170, 230)
		end)
	else
		evScanResult:FireClient(player, false)
		pad.Color = Color3.fromRGB(210, 50, 50)
		padLight.Color = Color3.fromRGB(230, 60, 60)
		task.delay(2, function()
			pad.Color = Color3.fromRGB(20, 60, 90)
			padLight.Color = Color3.fromRGB(80, 170, 230)
		end)
	end
end)

-- طلب عرض السجلّ (للأدمن فقط)
evLogReq.OnServerEvent:Connect(function(player)
	if isAdmin(player) then
		evLogData:FireClient(player, accessLog)
	else
		evLogData:FireClient(player, false)
	end
end)

-- 🖥️ شاشة سجلّ الدخول داخل البهو (للأدمن — ProximityPrompt)
do
	local kiosk = box("LogKiosk", 100, 102.4, FLOOR_Y, FLOOR_Y + 5.2, 6, 10, Color3.fromRGB(24, 26, 34), Enum.Material.Metal)
	box("LogScreen", 99.6, 100, FLOOR_Y + 2.2, FLOOR_Y + 4.8, 6.3, 9.7, Color3.fromRGB(20, 90, 130), Enum.Material.Neon).CanCollide = false
	local lp = Instance.new("ProximityPrompt")
	lp.ActionText = "عرض السجلّ"
	lp.ObjectText = "🗒️ سجلّ دخول القصر (للأدمن)"
	lp.HoldDuration = 0
	lp.KeyboardKeyCode = Enum.KeyCode.E
	lp.RequiresLineOfSight = false
	lp.MaxActivationDistance = 9
	lp.Parent = kiosk
	lp.Triggered:Connect(function(player)
		if isAdmin(player) then
			evLogData:FireClient(player, accessLog)
		else
			evLogData:FireClient(player, false)
		end
	end)
	local sgg = Instance.new("SurfaceGui")
	sgg.AutoLocalize = false; sgg.Face = Enum.NormalId.Left; sgg.CanvasSize = Vector2.new(300, 360)
	sgg.Adornee = kiosk; sgg.Parent = kiosk
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1; t.Size = UDim2.new(1,0,1,0)
	t.Font = Enum.Font.GothamBold; t.Text = "🗒️\nسجلّ\nالدخول"; t.TextScaled = true
	t.TextColor3 = Color3.fromRGB(150, 220, 255); t.Parent = sgg
end

----------------------------------------------------------------------
-- 💂 الحرّاس
----------------------------------------------------------------------
-- الحرّاس المرحّبون/المرافقون يُبنون الآن في GuardSystem.server.lua كشخصيات
-- R6 حقيقية تمشي بزيّ الحرس الملكي. أُزيلت نسخة البلوكات القديمة من هنا لأنها
-- كانت تتداخل مع حرّاس GuardSystem ومع جهاز البصمة فتظهر «أشكالاً مقطوعة».

print("[Palace] القصر الجمهوري جاهز: غرف مؤثّثة + لافتة + قفل بصمة + سجلّ دخول ✓")
