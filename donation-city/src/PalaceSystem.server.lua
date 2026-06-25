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
local Players            = game:GetService("Players")

----------------------------------------------------------------------
-- ⚙️ إعدادات عامة + تحقّق الصلاحية (للأدمن فقط)
----------------------------------------------------------------------
local SCAN_TIME   = 2.3    -- مدة «المسح» قبل ظهور النتيجة (إحساس واقعي)
local DOOR_OPEN_T = 2.6    -- مدة فتح الباب تدريجياً
local DOOR_HOLD   = 5.0    -- يبقى الباب مفتوحاً قبل أن يقفل تلقائياً
local ENTRY_FEE   = 250    -- 🎟️ رسوم دخول القصر (كوينز) — تُخصم مرّة واحدة لكل جلسة من الجهاز الخارجي فقط

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
local WOOD     = Color3.fromRGB(86, 56, 34)
local WOOD_D   = Color3.fromRGB(64, 40, 24)

----------------------------------------------------------------------
-- 🧱 حاوية + مساعدو البناء
----------------------------------------------------------------------
local old = Workspace:FindFirstChild("PalaceInterior")
if old then old:Destroy() end
local oldExt = Workspace:FindFirstChild("PalaceExterior")
if oldExt then oldExt:Destroy() end

local ROOT = Instance.new("Model")
ROOT.Name = "PalaceInterior"
ROOT.Parent = Workspace

-- القشرة الخارجية الفخمة (قبّة + أعمدة + واجهة طابقين + أعلام) — تُبنى بأشكال
-- روبلوكس الأصلية فقط (Part/Cylinder/Ball/Wedge) بلا أي Union/Mesh، فمستحيل
-- أن تظهر «مكعّبات» أو تشوّه. نموذج منفصل ليُنظَّف ويُعاد بناؤه مع كل تشغيل.
local EXT = Instance.new("Model")
EXT.Name = "PalaceExterior"
EXT.Parent = Workspace

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

-- مقعد قابل للجلوس فعلاً (Seat) — يجلس عليه اللاعب عند لمسه.
-- مهم: اللاعب الجالس يواجه اتجاه LookVector للمقعد (محور -Z المحلي). كل قطع
-- الأثاث هنا تضع ظهر الكرسي عند -Z المحلي وتتوقّع أن يواجه اللاعب +Z (للأمام)،
-- لذا نلفّ المقعد 180° حتى يواجه اللاعب بعيداً عن الظهر (لا يجلس مقلوباً).
local function seatPart(name: string, cf: CFrame, size: Vector3, color: Color3, mat: Enum.Material?): Seat
	local s = Instance.new("Seat")
	s.Name = name
	s.Anchored = true
	s.CanCollide = true
	s.Size = size
	s.CFrame = cf * CFrame.Angles(0, math.rad(180), 0)
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

-- الجدران الخارجية المحيطة (القشرة الكاملة بطابقين + القاعدة + الساحة + الدرج)
-- تُبنى الآن في قسم «القشرة الخارجية» أدناه بأشكال أصلية، فأُزيلت الجدران
-- المفردة الطابق الواحد والساحة القديمة من هنا لتفادي ازدواج الأسطح (z-fighting).

local function wall(x0, x1, z0, z1)
	box("Wall", x0, x1, FLOOR_Y, CEIL_Y, z0, z1, WALL_C, Enum.Material.SmoothPlastic)
end

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
-- 🏰 القشرة الخارجية الفخمة — أشكال روبلوكس أصلية فقط (صفر Union/Mesh)
--    قبّة ذهبية + بورتيكو بأعمدة + واجهة طابقين + كورنيش + نوافذ + علمَا قطر
----------------------------------------------------------------------
do
	-- خامات/ألوان الخارج
	local STONE_E = Color3.fromRGB(220, 201, 160)   -- صباغة حجر رملي عاجي دافئ (بدل الأبيض الساطع)
	local COL_C   = Color3.fromRGB(236, 230, 212)
	local BASE_C  = Color3.fromRGB(138, 132, 122)
	local GOLD_E  = Color3.fromRGB(212, 168, 78)
	local DOME_C  = Color3.fromRGB(206, 160, 76)
	local ROOF_C  = Color3.fromRGB(190, 185, 174)
	local GLASS_C = Color3.fromRGB(44, 64, 88)
	local POLE_C  = Color3.fromRGB(206, 206, 212)
	local MAROON  = Color3.fromRGB(140, 26, 58)   -- عنّابي قطر
	local FLAG_W  = Color3.fromRGB(245, 244, 240)
	local RED_C   = Color3.fromRGB(140, 26, 31)
	local STAR_GOLD = Color3.fromRGB(236, 206, 128) -- ذهبي فاتح لنقوش النجوم/المشربيات

	-- أبعاد (تطابق تصميم البلندر المعتمد؛ Y هو الارتفاع، سطح الأرض عند 0)
	local GY = FLOOR_Y                 -- 0.6
	local F1, F2 = 12, 23              -- خط الطابقين + قمّة الجدران
	local OX0, OX1 = 94, 242           -- حدود الجدران الخارجية على X
	local OZ0, OZ1 = -38, 74           -- حدود الجدران الخارجية على Z
	local CXp, CZp = 168, 18           -- مركز القصر

	-- مساعدو الأشكال (كلها Anchored وبلا تصادم مزعج)
	local function ebox(name, x0, x1, y0, y1, z0, z1, color, mat)
		return box(name, x0, x1, y0, y1, z0, z1, color, mat, EXT)
	end
	local function cylV(name, x, z, y0, y1, r, color, mat)
		local p = Instance.new("Part")
		p.Name = name; p.Anchored = true; p.CanCollide = true
		p.Shape = Enum.PartType.Cylinder
		-- محور الأسطوانة الأصلي على X؛ نلفّها لتقف عمودية (طولها على محور Y)
		p.Size = Vector3.new(math.abs(y1 - y0), 2 * r, 2 * r)
		p.CFrame = CFrame.new(x, (y0 + y1) / 2, z) * CFrame.Angles(0, 0, math.rad(90))
		p.Color = color; p.Material = mat or Enum.Material.Marble
		p.TopSurface = Enum.SurfaceType.Smooth; p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = EXT
		return p
	end
	local function ballP(name, x, y, z, r, color, mat)
		local p = Instance.new("Part")
		p.Name = name; p.Anchored = true; p.CanCollide = true
		p.Shape = Enum.PartType.Ball
		p.Size = Vector3.new(2 * r, 2 * r, 2 * r)
		p.CFrame = CFrame.new(x, y, z)
		p.Color = color; p.Material = mat or Enum.Material.Metal
		p.Parent = EXT
		return p
	end
	-- إطار محيطي (شريط أفقي حول الجدران الخارجية فقط) — يتفادى شريحة صلبة تملأ
	-- كامل المسقط الأفقي (كانت تظهر كسطح ذهبي يعبر المبنى). أربع شرائح بلا تداخل.
	local function frameRing(prefix, y0, y1, pj, color, mat)
		ebox(prefix .. "F", OX0 - pj, OX0 + 2, y0, y1, OZ0 - pj, OZ1 + pj, color, mat).CanCollide = false
		ebox(prefix .. "B", OX1 - 2, OX1 + pj, y0, y1, OZ0 - pj, OZ1 + pj, color, mat).CanCollide = false
		ebox(prefix .. "A", OX0 + 2, OX1 - 2, y0, y1, OZ0 - pj, OZ0 + 2, color, mat).CanCollide = false
		ebox(prefix .. "C", OX0 + 2, OX1 - 2, y0, y1, OZ1 - 2, OZ1 + pj, color, mat).CanCollide = false
	end
	-- جبهة مثلّثة (pediment): نصفان من WedgePart يلتقيان في القمّة عند z = zc
	local function gable(name, x0, x1, ybot, ytop, z0, z1, zc, color, mat)
		local sx, sy = math.abs(x1 - x0), math.abs(ytop - ybot)
		local cx, cy = (x0 + x1) / 2, (ybot + ytop) / 2
		local wr = Instance.new("WedgePart")
		wr.Name = name; wr.Anchored = true; wr.CanCollide = true
		wr.Size = Vector3.new(sx, sy, math.abs(z1 - zc))
		wr.CFrame = CFrame.new(cx, cy, (zc + z1) / 2)
		wr.Color = color; wr.Material = mat or Enum.Material.Marble; wr.Parent = EXT
		local wl = Instance.new("WedgePart")
		wl.Name = name; wl.Anchored = true; wl.CanCollide = true
		wl.Size = Vector3.new(sx, sy, math.abs(zc - z0))
		wl.CFrame = CFrame.new(cx, cy, (z0 + zc) / 2) * CFrame.Angles(0, math.rad(180), 0)
		wl.Color = color; wl.Material = mat or Enum.Material.Marble; wl.Parent = EXT
	end

	------------------------------------------------------------------
	-- 🎨 مساعدو الصباغة والنقوش (كلها أشكال/واجهات أصلية بلا ميش/إيموجي)
	------------------------------------------------------------------
	-- نجمة ثمانية = مربّعان متقاطعان (عناصر UI أصلية)
	local function star8(parent: Instance, cxPx: number, sz: number)
		for _, rot in ipairs({ 0, 45 }) do
			local sq = Instance.new("Frame")
			sq.AnchorPoint = Vector2.new(0.5, 0.5)
			sq.Position = UDim2.new(0, cxPx, 0.5, 0)
			sq.Size = UDim2.new(0, sz, 0, sz)
			sq.Rotation = rot
			sq.BackgroundColor3 = STAR_GOLD
			sq.BorderSizePixel = 0
			sq.Parent = parent
		end
	end
	-- شريط زخرفي عنّابي على وجه القطعة: نجوم ثمانية أو أسنان ذهبية
	local function motifBand(name, x0, x1, y0, y1, z0, z1, face, lengthStuds, kind)
		local p = ebox(name, x0, x1, y0, y1, z0, z1, MAROON, Enum.Material.SmoothPlastic)
		p.CanCollide = false
		local g = Instance.new("SurfaceGui")
		g.Name = "MotifGui"; g.AutoLocalize = false
		g.Face = face
		g.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
		g.LightInfluence = 0
		local pps = 12
		local hPx = math.max(8, math.floor(math.abs(y1 - y0) * pps + 0.5))
		g.CanvasSize = Vector2.new(math.floor(lengthStuds * pps), hPx)
		g.Adornee = p; g.Parent = p
		if kind == "stars" then
			local n = math.max(4, math.floor(lengthStuds / 3.2))
			local sz = math.floor(hPx * 0.78)
			for i = 0, n - 1 do
				star8(g, math.floor((i + 0.5) / n * g.CanvasSize.X), sz)
			end
		else
			local n = math.max(8, math.floor(lengthStuds / 1.5))
			local w = math.max(2, math.floor(hPx * 0.42))
			for i = 0, n - 1 do
				local dteeth = Instance.new("Frame")
				dteeth.AnchorPoint = Vector2.new(0.5, 1)
				dteeth.Position = UDim2.new(0, math.floor((i + 0.5) / n * g.CanvasSize.X), 1, -2)
				dteeth.Size = UDim2.new(0, w, 0, math.floor(hPx * 0.62))
				dteeth.BackgroundColor3 = STAR_GOLD
				dteeth.BorderSizePixel = 0
				dteeth.Parent = g
			end
		end
		return p
	end
	-- مشربية: شبكة ذهبية رفيعة على زجاج النافذة (إحساس خليجي)
	local function latticeGui(glass: BasePart, face)
		local g = Instance.new("SurfaceGui")
		g.Name = "Mashrabiya"; g.AutoLocalize = false
		g.Face = face; g.LightInfluence = 0
		g.CanvasSize = Vector2.new(120, 150)
		g.Adornee = glass; g.Parent = glass
		for k = 1, 4 do
			local v = Instance.new("Frame")
			v.BackgroundColor3 = STAR_GOLD; v.BorderSizePixel = 0
			v.Size = UDim2.new(0, 2, 1, 0)
			v.Position = UDim2.new(k / 5, -1, 0, 0)
			v.Parent = g
		end
		for k = 1, 5 do
			local h = Instance.new("Frame")
			h.BackgroundColor3 = STAR_GOLD; h.BorderSizePixel = 0
			h.Size = UDim2.new(1, 0, 0, 2)
			h.Position = UDim2.new(0, 0, k / 6, -1)
			h.Parent = g
		end
	end
	-- عمود مسطّح أمامي (يبرز عن واجهة -X) بتاج وحزام ذهبيين
	local function pilasterFront(zc)
		ebox("Pilaster", 92.6, 94, GY, F2 - 2, zc - 0.9, zc + 0.9, COL_C, Enum.Material.Marble).CanCollide = false
		ebox("PilCap", 92.4, 94, F2 - 2.7, F2 - 2, zc - 1.1, zc + 1.1, GOLD_E, Enum.Material.Metal).CanCollide = false
		ebox("PilBelt", 92.5, 94, F1 - 0.4, F1 + 0.4, zc - 1.1, zc + 1.1, GOLD_E, Enum.Material.Metal).CanCollide = false
		ebox("PilFoot", 92.5, 94, GY, GY + 0.7, zc - 1.1, zc + 1.1, COL_C, Enum.Material.Marble).CanCollide = false
	end
	-- عمود مسطّح جانبي (outward = -1 لجهة OZ0، +1 لجهة OZ1)
	local function pilasterSide(xc, zEdge, outward)
		local z0 = math.min(zEdge, zEdge + outward * 1.4)
		local z1 = math.max(zEdge, zEdge + outward * 1.4)
		ebox("Pilaster", xc - 0.9, xc + 0.9, GY, F2 - 2, z0, z1, COL_C, Enum.Material.Marble).CanCollide = false
		ebox("PilCap", xc - 1.1, xc + 1.1, F2 - 2.7, F2 - 2, z0, z1, GOLD_E, Enum.Material.Metal).CanCollide = false
		ebox("PilBelt", xc - 1.1, xc + 1.1, F1 - 0.4, F1 + 0.4, z0, z1, GOLD_E, Enum.Material.Metal).CanCollide = false
	end

	------------------------------------------------------------------
	-- 1) القاعدة (تجلس تماماً على العشب عند Y=0) + أبرون حجري حول الأرضية
	------------------------------------------------------------------
	ebox("Foundation", 70, 246, -1.6, 0.0, -42, 78, BASE_C, Enum.Material.Slate)
	ebox("ApronFront", 70, 95, 0, GY, -41, 77, STONE_E, Enum.Material.Concrete)
	ebox("ApronBack",  241, 245, 0, GY, -41, 77, STONE_E, Enum.Material.Concrete)
	ebox("ApronZ0",    95, 241, 0, GY, -41, -37, STONE_E, Enum.Material.Concrete)
	ebox("ApronZ1",    95, 241, 0, GY, 73, 77, STONE_E, Enum.Material.Concrete)
	-- درج المدخل أمام البورتيكو (من العشب صعوداً إلى المنصّة)
	for i = 0, 2 do
		ebox("PorticoStep" .. i, 67.5 - i * 2.5, 70 - i * 2.5, 0, GY - i * 0.2, 4, 32, STONE_E, Enum.Material.Concrete)
	end

	------------------------------------------------------------------
	-- 2) الجدران الخارجية (طابقان) بفتحة المدخل على -X
	------------------------------------------------------------------
	ebox("WallBack",       OX1 - 2, OX1, GY, F2, OZ0, OZ1, STONE_E, Enum.Material.Marble)
	ebox("WallSideA",      OX0, OX1, GY, F2, OZ0, OZ0 + 2, STONE_E, Enum.Material.Marble)
	ebox("WallSideB",      OX0, OX1, GY, F2, OZ1 - 2, OZ1, STONE_E, Enum.Material.Marble)
	ebox("WallFrontA",     OX0, OX0 + 2, GY, F2, OZ0, ENT_Z0, STONE_E, Enum.Material.Marble)
	ebox("WallFrontB",     OX0, OX0 + 2, GY, F2, ENT_Z1, OZ1, STONE_E, Enum.Material.Marble)
	ebox("WallFrontLintel", OX0, OX0 + 2, 9.4, F2, ENT_Z0, ENT_Z1, STONE_E, Enum.Material.Marble)
	-- خط ذهبي فاصل بين الطابقين (شريط محيطي على الجدران فقط)
	frameRing("Belt", F1 - 0.3, F1 + 0.3, 0.5, GOLD_E, Enum.Material.Metal)

	-- أعمدة زاويّة (تمتدّ فوق السور) + قمم ذهبية
	for _, c in ipairs({ {OX0, OZ0, -1, -1}, {OX0, OZ1, -1, 1}, {OX1, OZ0, 1, -1}, {OX1, OZ1, 1, 1} }) do
		local px, pz, ox, oz = c[1], c[2], c[3], c[4]
		ebox("Quoin", px + ox * 1.2, px - ox * 2.6, GY, F2 + 3.4, pz + oz * 1.2, pz - oz * 2.6, COL_C, Enum.Material.Marble)
		ebox("QuoinCap", px + ox * 1.5, px - ox * 2.9, F2 + 3.4, F2 + 4.2, pz + oz * 1.5, pz - oz * 2.9, GOLD_E, Enum.Material.Metal)
	end

	------------------------------------------------------------------
	-- 3) الكورنيش + السور (parapet) + السقف
	------------------------------------------------------------------
	frameRing("Cornice", F2, F2 + 1, 1.2, GOLD_E, Enum.Material.Metal)
	ebox("ParB", OX1 - 1, OX1 + 1, F2 + 1, F2 + 3, OZ0 - 1, OZ1 + 1, STONE_E, Enum.Material.Marble)
	ebox("ParF", OX0 - 1, OX0 + 1, F2 + 1, F2 + 3, OZ0 - 1, OZ1 + 1, STONE_E, Enum.Material.Marble)
	ebox("ParA", OX0 - 1, OX1 + 1, F2 + 1, F2 + 3, OZ0 - 1, OZ0 + 1, STONE_E, Enum.Material.Marble)
	ebox("ParC", OX0 - 1, OX1 + 1, F2 + 1, F2 + 3, OZ1 - 1, OZ1 + 1, STONE_E, Enum.Material.Marble)
	ebox("Roof", OX0, OX1, F2, F2 + 0.5, OZ0, OZ1, ROOF_C, Enum.Material.Concrete)

	------------------------------------------------------------------
	-- 4) البورتيكو الكبير (٦ أعمدة عملاقة + إفريز + جبهة مثلّثة) على -X
	------------------------------------------------------------------
	local PORT_X = OX0 - 10            -- 84
	local COL_R, COL_TOP = 1.9, F2 - 1 -- 22
	for i, cz in ipairs({ CZp - 26, CZp - 17.3, CZp - 8.6, CZp + 8.6, CZp + 17.3, CZp + 26 }) do
		cylV("Column" .. i, PORT_X, cz, GY, COL_TOP, COL_R, COL_C, Enum.Material.Marble)
		ebox("ColBase" .. i, PORT_X - COL_R - 0.6, PORT_X + COL_R + 0.6, GY, GY + 0.9, cz - COL_R - 0.6, cz + COL_R + 0.6, STONE_E, Enum.Material.Marble)
		ebox("ColCap" .. i, PORT_X - COL_R - 0.7, PORT_X + COL_R + 0.7, COL_TOP - 0.9, COL_TOP, cz - COL_R - 0.7, cz + COL_R + 0.7, STONE_E, Enum.Material.Marble)
	end
	ebox("Entablature", PORT_X - COL_R - 1.2, OX0, COL_TOP, COL_TOP + 2.2, CZp - 28, CZp + 28, STONE_E, Enum.Material.Marble)
	ebox("EntGold", PORT_X - COL_R - 1.2, OX0, COL_TOP, COL_TOP + 0.6, CZp - 28, CZp + 28, GOLD_E, Enum.Material.Metal).CanCollide = false
	gable("Pediment", PORT_X - COL_R - 1.2, OX0, COL_TOP + 2.2, COL_TOP + 9, CZp - 28, CZp + 28, CZp, STONE_E, Enum.Material.Marble)
	-- سجادة حمراء من الدرج إلى داخل البهو
	ebox("RedCarpet", 67, 130, GY, GY + 0.08, ENT_Z0 + 2, ENT_Z1 - 2, RED_C, Enum.Material.Fabric).CanCollide = false

	------------------------------------------------------------------
	-- 5) القبّة الذهبية على طارة بأعمدة + قمرية + رمح ذهبي
	------------------------------------------------------------------
	local DRUM_R = 14.5                       -- = نصف قطر القبّة (يُخفي نصفها السفلي)
	local DRUM_Y0, DRUM_Y1 = F2 + 0.5, F2 + 9 -- 23.5 .. 32
	cylV("DomeDrum", CXp, CZp, DRUM_Y0, DRUM_Y1, DRUM_R, STONE_E, Enum.Material.Marble)
	for k = 0, 19 do
		local a = (k / 20) * 2 * math.pi
		cylV("DrumCol" .. k, CXp + math.cos(a) * (DRUM_R + 0.5), CZp + math.sin(a) * (DRUM_R + 0.5), DRUM_Y0 + 0.5, DRUM_Y1 - 0.5, 0.45, COL_C, Enum.Material.Marble)
	end
	cylV("DrumRing", CXp, CZp, DRUM_Y1 - 0.6, DRUM_Y1, DRUM_R + 0.8, GOLD_E, Enum.Material.Metal)
	local DOME_R = 14.5
	ballP("Dome", CXp, DRUM_Y1, CZp, DOME_R, DOME_C, Enum.Material.Metal)
	local DTOP = DRUM_Y1 + DOME_R             -- 46.5
	cylV("Cupola", CXp, CZp, DTOP - 0.3, DTOP + 3, 2.4, STONE_E, Enum.Material.Marble)
	ballP("CupolaCap", CXp, DTOP + 3, CZp, 2.6, DOME_C, Enum.Material.Metal)
	cylV("FinialRod", CXp, CZp, DTOP + 5.6, DTOP + 8.2, 0.28, GOLD_E, Enum.Material.Metal)
	ballP("FinialBall", CXp, DTOP + 8.6, CZp, 0.8, GOLD_E, Enum.Material.Metal)

	------------------------------------------------------------------
	-- 6) النوافذ (طابقان) — على الواجهة + الجانبين، بإطار ذهبي وزجاج داكن
	------------------------------------------------------------------
	local function winFront(zc, y0, y1): BasePart
		ebox("WinFrame", 93.5, 94.6, y0, y1, zc - 2.6, zc + 2.6, GOLD_E, Enum.Material.Metal)
		local gl = ebox("WinGlass", 93.3, 94.4, y0 + 0.6, y1 - 0.6, zc - 2.0, zc + 2.0, GLASS_C, Enum.Material.Glass)
		gl.CanCollide = false
		return gl
	end
	local function winSide(xc, zc, y0, y1): BasePart
		ebox("WinFrame", xc - 2.6, xc + 2.6, y0, y1, zc - 0.55, zc + 0.55, GOLD_E, Enum.Material.Metal)
		local gl = ebox("WinGlass", xc - 2.0, xc + 2.0, y0 + 0.6, y1 - 0.6, zc - 0.7, zc + 0.7, GLASS_C, Enum.Material.Glass)
		gl.CanCollide = false
		return gl
	end
	-- الطابق الأرضي يأخذ مشربية شبكية (نقش)، العلوي بدونها
	for _, zc in ipairs({ -27, -14, 50, 63 }) do
		latticeGui(winFront(zc, GY + 2.5, F1 - 1.5), Enum.NormalId.Left)
		winFront(zc, F1 + 1.5, F2 - 2)
	end
	for xc = 116, 220, 24 do
		latticeGui(winSide(xc, OZ0 + 1, GY + 2.5, F1 - 1.5), Enum.NormalId.Front); winSide(xc, OZ0 + 1, F1 + 1.5, F2 - 2)
		latticeGui(winSide(xc, OZ1 - 1, GY + 2.5, F1 - 1.5), Enum.NormalId.Back); winSide(xc, OZ1 - 1, F1 + 1.5, F2 - 2)
	end

	------------------------------------------------------------------
	-- 7) علمَا قطر على ساريتين تحفّان المدخل (عنّابي + حافة بيضاء عند السارية)
	------------------------------------------------------------------
	for _, fz in ipairs({ CZp - 40, CZp + 40 }) do
		cylV("FlagPole", PORT_X - 6, fz, GY, GY + 28, 0.32, POLE_C, Enum.Material.Metal)
		ballP("PoleTop", PORT_X - 6, GY + 28.4, fz, 0.55, GOLD_E, Enum.Material.Metal)
		ebox("FlagMaroon", PORT_X - 6.1, PORT_X - 5.8, GY + 22.3, GY + 27, fz, fz + 12, MAROON, Enum.Material.Fabric).CanCollide = false
		ebox("FlagWhite", PORT_X - 6.15, PORT_X - 5.75, GY + 22.3, GY + 27, fz, fz + 3.4, FLAG_W, Enum.Material.Fabric).CanCollide = false
	end

	------------------------------------------------------------------
	-- 7.5) الصباغة والنقوش: أعمدة مسطّحة + إفريز نجوم + أسنان + إطار مدخل + ميدالية
	------------------------------------------------------------------
	for _, zc in ipairs({ -34, -20.5, -7, 33, 56.5, 69 }) do pilasterFront(zc) end
	for xc = 104, 224, 24 do
		pilasterSide(xc, OZ0, -1)
		pilasterSide(xc, OZ1, 1)
	end

	local frzY0, frzY1 = F2 - 2.0, F2 - 0.5
	local dntY0, dntY1 = 10.6, 11.5
	motifBand("FriezeFL", 93.4, 94, frzY0, frzY1, OZ0, -11, Enum.NormalId.Left, math.abs(-11 - OZ0), "stars")
	motifBand("FriezeFR", 93.4, 94, frzY0, frzY1, 47, OZ1, Enum.NormalId.Left, math.abs(OZ1 - 47), "stars")
	motifBand("DentilFL", 93.6, 94, dntY0, dntY1, OZ0, -11, Enum.NormalId.Left, math.abs(-11 - OZ0), "dentils")
	motifBand("DentilFR", 93.6, 94, dntY0, dntY1, 47, OZ1, Enum.NormalId.Left, math.abs(OZ1 - 47), "dentils")
	motifBand("FriezeSA", OX0, OX1, frzY0, frzY1, OZ0, OZ0 + 0.6, Enum.NormalId.Front, math.abs(OX1 - OX0), "stars")
	motifBand("FriezeSB", OX0, OX1, frzY0, frzY1, OZ1 - 0.6, OZ1, Enum.NormalId.Back, math.abs(OX1 - OX0), "stars")
	motifBand("DentilSA", OX0, OX1, dntY0, dntY1, OZ0, OZ0 + 0.4, Enum.NormalId.Front, math.abs(OX1 - OX0), "dentils")
	motifBand("DentilSB", OX0, OX1, dntY0, dntY1, OZ1 - 0.4, OZ1, Enum.NormalId.Back, math.abs(OX1 - OX0), "dentils")
	motifBand("FriezeBk", OX1 - 0.6, OX1, frzY0, frzY1, OZ0, OZ1, Enum.NormalId.Right, math.abs(OZ1 - OZ0), "stars")

	-- إطار المدخل (قائمان عنّابيان + عتبة ذهبية)
	ebox("DoorJambL", 93.5, 94, GY, 9.6, ENT_Z0 - 1.1, ENT_Z0, MAROON, Enum.Material.SmoothPlastic).CanCollide = false
	ebox("DoorJambR", 93.5, 94, GY, 9.6, ENT_Z1, ENT_Z1 + 1.1, MAROON, Enum.Material.SmoothPlastic).CanCollide = false
	ebox("DoorLintel", 93.4, 94, 9.4, 10.4, ENT_Z0 - 1.1, ENT_Z1 + 1.1, GOLD_E, Enum.Material.Metal).CanCollide = false

	-- (مركز الجبهة المثلّثة صار يحمل شعار «مكتب القصر الجمهوري» كلوحة مؤطّرة أدناه)

	------------------------------------------------------------------
	-- 8) شعار الواجهة «مكتب القصر الجمهوري لشهد» — لوحة مؤطّرة في الجبهة
	------------------------------------------------------------------
	-- لوحة شعار مربّعة بإطار ذهبي في مركز الجبهة فوق المدخل تحمل شعار
	-- «مكتب القصر الجمهوري لشهد» (Decal مرفوع على روبلوكس) بدل النص القديم
	local SGN_HW = 3.8                              -- نصف ضلع اللوحة المربّعة
	local SGN_CY = COL_TOP + 3.9                    -- مركز اللوحة رأسياً (داخل الجبهة)
	local SGN_XF = PORT_X - COL_R - 2.0             -- الوجه الأمامي (-X)
	local SGN_XB = PORT_X - COL_R - 1.55            -- ظهر اللوحة
	local sbk = ebox("FacadeSignBack", SGN_XF, SGN_XB, SGN_CY - SGN_HW, SGN_CY + SGN_HW, CZp - SGN_HW, CZp + SGN_HW, Color3.fromRGB(20, 17, 13), Enum.Material.SmoothPlastic)
	local function goldBar(nm, y0, y1, z0, z1)
		ebox(nm, SGN_XF - 0.12, SGN_XB + 0.05, y0, y1, z0, z1, GOLD_E, Enum.Material.Neon).CanCollide = false
	end
	goldBar("FacadeSignFrameT", SGN_CY + SGN_HW, SGN_CY + SGN_HW + 0.45, CZp - SGN_HW - 0.45, CZp + SGN_HW + 0.45)
	goldBar("FacadeSignFrameB", SGN_CY - SGN_HW - 0.45, SGN_CY - SGN_HW, CZp - SGN_HW - 0.45, CZp + SGN_HW + 0.45)
	goldBar("FacadeSignFrameL", SGN_CY - SGN_HW, SGN_CY + SGN_HW, CZp - SGN_HW - 0.45, CZp - SGN_HW)
	goldBar("FacadeSignFrameR", SGN_CY - SGN_HW, SGN_CY + SGN_HW, CZp + SGN_HW, CZp + SGN_HW + 0.45)
	local fGlow = pointLight(sbk, Color3.fromRGB(255, 205, 110), 1.5, 16)
	-- الشعار: الأصل مرفوع كنوع Decal، ومعرّف الـDecal لا يُحمَّل مباشرةً في
	-- ImageLabel.Image ولا Decal.Texture على السيرفرات الحيّة (تحويله لمعرّف صورة
	-- يحدث داخل الاستوديو فقط). لذا نستعمل بروتوكول rbxthumb الذي يقبل معرّف الأصل
	-- مباشرةً ويعرض صورته بثبات داخل اللعبة مع الحفاظ على الشفافية (أكبر مقاس
	-- مربّع مدعوم للأصل هو 420×420).
	local fg = Instance.new("SurfaceGui")
	fg.Name = "FacadeSignGui"; fg.AutoLocalize = false
	fg.Face = Enum.NormalId.Left
	fg.CanvasSize = Vector2.new(1024, 1024)
	fg.LightInfluence = 0
	fg.Adornee = sbk; fg.Parent = sbk
	local logo = Instance.new("ImageLabel")
	logo.Name = "FacadeSignLogo"
	logo.BackgroundTransparency = 1
	logo.Size = UDim2.fromScale(1, 1)
	logo.ScaleType = Enum.ScaleType.Fit
	logo.Image = "rbxthumb://type=Asset&id=87423442650122&w=420&h=420"
	logo.Parent = fg
	task.spawn(function()
		while sbk.Parent do
			TweenService:Create(fGlow, TweenInfo.new(1.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), { Brightness = 3.0 }):Play()
			task.wait(1.8)
			TweenService:Create(fGlow, TweenInfo.new(1.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), { Brightness = 1.5 }):Play()
			task.wait(1.8)
		end
	end)
end

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
	local rose = part("ChandRose", CFrame.new(x, CEIL_Y - 0.3, z) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(0.5, 2.6, 2.6), TRIM_GOLD, Enum.Material.Metal)
	rose.Shape = Enum.PartType.Cylinder
	rose.CanCollide = false
	local chain = part("Chain", CFrame.new(x, CEIL_Y - 1.4, z), Vector3.new(0.18, 2.2, 0.18), Color3.fromRGB(70, 60, 40), Enum.Material.Metal)
	chain.CanCollide = false
	local orb = part("Chandelier", CFrame.new(x, CEIL_Y - 2.9, z), Vector3.new(1.7, 1.4, 1.7), Color3.fromRGB(255, 244, 214), Enum.Material.Neon)
	orb.Shape = Enum.PartType.Ball
	orb.CanCollide = false
	pointLight(orb, color, 1.6, 26)
	for i = 0, 7 do
		local a = math.rad(i * 45)
		local ax, az = x + math.cos(a) * 1.9, z + math.sin(a) * 1.9
		local arm = part("ChandArm", CFrame.new((x + ax) / 2, CEIL_Y - 2.6, (z + az) / 2) * CFrame.Angles(0, -a, 0), Vector3.new(2.0, 0.16, 0.16), TRIM_GOLD, Enum.Material.Metal)
		arm.CanCollide = false
		local bead = part("Crystal", CFrame.new(ax, CEIL_Y - 3.0, az), Vector3.new(0.5, 0.9, 0.5), Color3.fromRGB(255, 250, 226), Enum.Material.Neon)
		bead.Shape = Enum.PartType.Ball
		bead.CanCollide = false
	end
end

-- كنبة (قاعدة خشبية + وسائد + ظهر + مسندان + أرجل ذهبية)
local function sofa(cx, cz, rotY, color)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	local cushC = color:Lerp(Color3.new(1, 1, 1), 0.16)
	local function place(name, off, size, c, mat)
		return part(name, cf * CFrame.new(off), size, c, mat)
	end
	place("SofaBase", Vector3.new(0, 0.95, 0), Vector3.new(7, 1.1, 3), WOOD_D, Enum.Material.Wood)
	seatPart("SofaSeat", cf * CFrame.new(0, 1.65, 0.2), Vector3.new(7, 0.6, 2.6), color, Enum.Material.Fabric)
	place("SofaBack", Vector3.new(0, 2.7, -1.2), Vector3.new(7, 3.0, 0.6), color, Enum.Material.Fabric)
	place("SofaArmL", Vector3.new(-3.2, 1.9, 0), Vector3.new(0.6, 2.1, 3), color, Enum.Material.Fabric)
	place("SofaArmR", Vector3.new(3.2, 1.9, 0), Vector3.new(0.6, 2.1, 3), color, Enum.Material.Fabric)
	for _, dx in ipairs({ -2.1, 0, 2.1 }) do
		place("SofaCush", Vector3.new(dx, 2.15, 0.3), Vector3.new(1.9, 0.5, 2.2), cushC, Enum.Material.Fabric).CanCollide = false
		place("SofaPillow", Vector3.new(dx, 3.0, -0.9), Vector3.new(1.4, 1.2, 0.4), cushC, Enum.Material.Fabric).CanCollide = false
	end
	for _, dx in ipairs({ -3, 3 }) do
		for _, dz in ipairs({ -1.2, 1.2 }) do
			place("SofaFoot", Vector3.new(dx, 0.3, dz), Vector3.new(0.4, 0.6, 0.4), TRIM_GOLD, Enum.Material.Metal).CanCollide = false
		end
	end
end

local function armchair(cx, cz, rotY, color)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	local cushC = color:Lerp(Color3.new(1, 1, 1), 0.16)
	part("ChairBase", cf * CFrame.new(0, 0.95, 0), Vector3.new(3, 1.1, 3), WOOD_D, Enum.Material.Wood)
	seatPart("ChairSeat", cf * CFrame.new(0, 1.65, 0.2), Vector3.new(3, 0.6, 2.6), color, Enum.Material.Fabric)
	part("ChairCush", cf * CFrame.new(0, 2.1, 0.3), Vector3.new(2.6, 0.5, 2.2), cushC, Enum.Material.Fabric).CanCollide = false
	part("ChairBack", cf * CFrame.new(0, 2.7, -1.2), Vector3.new(3, 3.0, 0.6), color, Enum.Material.Fabric)
	part("ChairArmL", cf * CFrame.new(-1.3, 1.9, 0), Vector3.new(0.5, 2.1, 3), color, Enum.Material.Fabric)
	part("ChairArmR", cf * CFrame.new(1.3, 1.9, 0), Vector3.new(0.5, 2.1, 3), color, Enum.Material.Fabric)
	for _, dx in ipairs({ -1.2, 1.2 }) do
		for _, dz in ipairs({ -1.2, 1.2 }) do
			part("ChairFoot", cf * CFrame.new(dx, 0.3, dz), Vector3.new(0.35, 0.6, 0.35), TRIM_GOLD, Enum.Material.Metal).CanCollide = false
		end
	end
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
	top.Reflectance = 0.08
	part("TableTrim", CFrame.new(cx, FLOOR_Y + 1.44, cz), Vector3.new(5.1, 0.12, 3.1), TRIM_GOLD, Enum.Material.Metal).CanCollide = false
	for _, dx in ipairs({-2.1, 2.1}) do
		for _, dz in ipairs({-1.1, 1.1}) do
			part("TableLeg", CFrame.new(cx + dx, FLOOR_Y + 0.8, cz + dz), Vector3.new(0.4, 1.6, 0.4), WOOD_D, Enum.Material.Wood)
		end
	end
	part("Vase", CFrame.new(cx, FLOOR_Y + 2.2, cz), Vector3.new(0.9, 1.2, 0.9), TRIM_GOLD, Enum.Material.Metal).CanCollide = false
	local bloom = part("Bloom", CFrame.new(cx, FLOOR_Y + 3.1, cz), Vector3.new(1.4, 1.0, 1.4), Color3.fromRGB(200, 90, 110), Enum.Material.Grass)
	bloom.Shape = Enum.PartType.Ball
	bloom.CanCollide = false
end

-- مكتب تنفيذي فخم (واجهة حجب + شريط ذهبي + أدراج بمقابض ذهبية)
local function bigDesk(cx, cz, rotY)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	part("DeskTop", cf * CFrame.new(0, 2.9, 0), Vector3.new(9, 0.5, 4.4), WOOD, Enum.Material.Wood)
	part("DeskTrim", cf * CFrame.new(0, 2.62, 0), Vector3.new(9.1, 0.14, 4.5), TRIM_GOLD, Enum.Material.Metal).CanCollide = false
	part("DeskFront", cf * CFrame.new(0, 1.3, 1.95), Vector3.new(8.6, 2.6, 0.4), WOOD_D, Enum.Material.Wood)
	part("DeskSideL", cf * CFrame.new(-4.2, 1.3, 0), Vector3.new(0.5, 2.6, 4.2), WOOD_D, Enum.Material.Wood)
	part("DeskSideR", cf * CFrame.new(4.2, 1.3, 0), Vector3.new(0.5, 2.6, 4.2), WOOD_D, Enum.Material.Wood)
	for _, i in ipairs({ 0, 1, 2 }) do
		part("DeskKnob", cf * CFrame.new(3.4, 1.0 + i * 0.7, 1.97), Vector3.new(0.5, 0.18, 0.18), TRIM_GOLD, Enum.Material.Metal).CanCollide = false
	end
end

-- كرسي مدير جلدي بظهر عالٍ + قاعدة خماسية
local function deskChair(cx, cz, rotY, color)
	local cf = CFrame.new(cx, FLOOR_Y, cz) * CFrame.Angles(0, math.rad(rotY), 0)
	seatPart("DChairSeat", cf * CFrame.new(0, 2.4, 0), Vector3.new(3.0, 0.6, 3.0), color, Enum.Material.Fabric)
	part("DChairBack", cf * CFrame.new(0, 4.2, -1.3), Vector3.new(3.0, 3.6, 0.5), color, Enum.Material.Fabric)
	part("DChairHead", cf * CFrame.new(0, 6.0, -1.25), Vector3.new(2.6, 0.9, 0.5), color, Enum.Material.Fabric)
	part("DChairArmL", cf * CFrame.new(-1.6, 3.0, 0.1), Vector3.new(0.4, 0.4, 2.2), WOOD_D, Enum.Material.Wood)
	part("DChairArmR", cf * CFrame.new(1.6, 3.0, 0.1), Vector3.new(0.4, 0.4, 2.2), WOOD_D, Enum.Material.Wood)
	part("DChairPole", cf * CFrame.new(0, 1.3, 0), Vector3.new(0.5, 1.8, 0.5), Color3.fromRGB(40, 40, 40), Enum.Material.Metal)
	for i = 0, 4 do
		local a = math.rad(i * 72)
		part("DChairFoot", cf * CFrame.new(math.cos(a) * 1.4, 0.5, math.sin(a) * 1.4) * CFrame.Angles(0, -a, 0), Vector3.new(1.4, 0.4, 0.3), Color3.fromRGB(40, 40, 40), Enum.Material.Metal).CanCollide = false
	end
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
	part("PotRim", CFrame.new(cx, FLOOR_Y + 1.95, cz), Vector3.new(2.0, 0.3, 2.0), TRIM_GOLD, Enum.Material.Metal).CanCollide = false
	local foliage = part("Foliage", CFrame.new(cx, FLOOR_Y + 3.6, cz), Vector3.new(3.4, 4, 3.4), Color3.fromRGB(48, 120, 60), Enum.Material.Grass)
	foliage.Shape = Enum.PartType.Ball
	foliage.CanCollide = false
	local f2 = part("Foliage2", CFrame.new(cx - 0.8, FLOOR_Y + 2.9, cz + 0.5), Vector3.new(2.2, 2.6, 2.2), Color3.fromRGB(56, 132, 68), Enum.Material.Grass)
	f2.Shape = Enum.PartType.Ball
	f2.CanCollide = false
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

-- شمعدان جداري (سكونس) — توهّج دافئ على الجدران
local function sconce(x, z, faceDir, color)
	part("Sconce", CFrame.new(x, FLOOR_Y + 6.4, z), Vector3.new(0.6, 1.4, 0.6), TRIM_GOLD, Enum.Material.Metal).CanCollide = false
	local bulb = part("SconceBulb", CFrame.new(x + faceDir.X * 0.7, FLOOR_Y + 6.6, z + faceDir.Z * 0.7), Vector3.new(0.7, 0.9, 0.7), Color3.fromRGB(255, 240, 210), Enum.Material.Neon)
	bulb.Shape = Enum.PartType.Ball
	bulb.CanCollide = false
	pointLight(bulb, color, 0.8, 12)
end

-- ستارة فخمة (قماش + قضيب ذهبي) على جدار خلفي
local function drapes(axis, wallPos, c0, c1, color)
	local y0, y1 = FLOOR_Y + 2.0, CEIL_Y - 0.8
	if axis == "X" then
		box("DrapeRod", c0 - 0.4, c1 + 0.4, y1, y1 + 0.4, wallPos - 0.35, wallPos + 0.35, TRIM_GOLD, Enum.Material.Metal).CanCollide = false
		box("Drape", c0, c1, y0, y1, wallPos - 0.3, wallPos, color, Enum.Material.Fabric).CanCollide = false
	else
		box("DrapeRod", wallPos - 0.35, wallPos + 0.35, y1, y1 + 0.4, c0 - 0.4, c1 + 0.4, TRIM_GOLD, Enum.Material.Metal).CanCollide = false
		box("Drape", wallPos, wallPos + 0.3, y0, y1, c0, c1, color, Enum.Material.Fabric).CanCollide = false
	end
end

-- عمود مسطّح داخلي بتاج وقاعدة ذهبيين
local function pilasterIn(x, z)
	box("Pil", x - 0.7, x + 0.7, FLOOR_Y, CEIL_Y - 0.8, z - 0.5, z + 0.5, MARBLE, Enum.Material.Marble).CanCollide = false
	box("PilCap", x - 1.0, x + 1.0, CEIL_Y - 1.8, CEIL_Y - 1.2, z - 0.8, z + 0.8, TRIM_GOLD, Enum.Material.Metal).CanCollide = false
	box("PilBase", x - 1.0, x + 1.0, FLOOR_Y, FLOOR_Y + 0.7, z - 0.8, z + 0.8, TRIM_GOLD, Enum.Material.Metal).CanCollide = false
end

-- شريط إضاءة سقفي محيطي (كوة) — توهّج ناعم
local function coveLight(x0, x1, z0, z1, color)
	local function strip(a0, a1, b0, b1)
		box("Cove", a0, a1, CEIL_Y - 0.55, CEIL_Y - 0.35, b0, b1, Color3.fromRGB(255, 244, 224), Enum.Material.Neon).CanCollide = false
	end
	strip(x0, x1, z0, z0 + 0.4)
	strip(x0, x1, z1 - 0.4, z1)
	strip(x0, x0 + 0.4, z0, z1)
	strip(x1 - 0.4, x1, z0, z1)
	local core = box("CoveCore", (x0 + x1) / 2 - 0.3, (x0 + x1) / 2 + 0.3, CEIL_Y - 0.5, CEIL_Y - 0.4, (z0 + z1) / 2 - 0.3, (z0 + z1) / 2 + 0.3, Color3.fromRGB(255, 244, 224), Enum.Material.Neon)
	core.CanCollide = false; core.Transparency = 1
	local l = Instance.new("PointLight")
	l.Color = color; l.Brightness = 0.4; l.Range = 34; l.Parent = core
end

-- لابتوب واقعي على المكتب (الشاشة تواجه الكرسي الرئاسي عند +X)
local function laptop(cx, cz, topY)
	local body = Color3.fromRGB(176, 180, 188)
	local deckC = Color3.fromRGB(26, 28, 33)
	local keysC = Color3.fromRGB(12, 12, 15)
	local scrnC = Color3.fromRGB(70, 135, 210)
	box("LapBase", cx - 1.1, cx + 1.0, topY, topY + 0.16, cz - 1.15, cz + 1.15, body, Enum.Material.Metal)
	box("LapDeck", cx - 0.95, cx + 0.9, topY + 0.16, topY + 0.2, cz - 1.0, cz + 1.0, deckC, Enum.Material.SmoothPlastic).CanCollide = false
	for r = 0, 3 do
		local xx = cx - 0.75 + r * 0.42
		box("LapKeys", xx, xx + 0.3, topY + 0.2, topY + 0.24, cz - 0.85, cz + 0.85, keysC, Enum.Material.SmoothPlastic).CanCollide = false
	end
	box("LapPad", cx + 0.45, cx + 0.85, topY + 0.2, topY + 0.23, cz - 0.4, cz + 0.4, Color3.fromRGB(40, 42, 48), Enum.Material.SmoothPlastic).CanCollide = false
	local lidH = 2.4
	local lidCF = CFrame.new(cx - 1.0, topY, cz) * CFrame.Angles(0, 0, math.rad(14)) * CFrame.new(0, lidH / 2, 0)
	part("LapLid", lidCF, Vector3.new(0.1, lidH, 2.3), body, Enum.Material.Metal)
	local scr = part("LapScreen", lidCF * CFrame.new(0.08, 0, 0), Vector3.new(0.04, lidH - 0.4, 2.0), scrnC, Enum.Material.Neon)
	scr.CanCollide = false
	pointLight(scr, Color3.fromRGB(120, 170, 235), 0.6, 6)
	local emb = part("LapLogo", lidCF * CFrame.new(-0.07, 0, 0), Vector3.new(0.04, 0.5, 0.5), TRIM_GOLD, Enum.Material.Metal)
	emb.CanCollide = false
end

-- لافتة باسم الغرفة (نص حاد متوهّج بلا أي رموز) فوق الباب
local function roomSign(text, bx0, bx1, by0, by1, bz0, bz1, face)
	local back = box("RoomSignBack", bx0, bx1, by0, by1, bz0, bz1, Color3.fromRGB(24, 21, 17), Enum.Material.SmoothPlastic)
	back.CanCollide = false
	box("RoomSignFrameT", bx0 - 0.1, bx1 + 0.1, by1, by1 + 0.3, bz0 - 0.1, bz1 + 0.1, TRIM_GOLD, Enum.Material.Neon).CanCollide = false
	box("RoomSignFrameB", bx0 - 0.1, bx1 + 0.1, by0 - 0.3, by0, bz0 - 0.1, bz1 + 0.1, TRIM_GOLD, Enum.Material.Neon).CanCollide = false
	pointLight(back, Color3.fromRGB(255, 210, 130), 1.4, 12)
	local g = Instance.new("SurfaceGui")
	g.Name = "RoomSignGui"; g.AutoLocalize = false
	g.Face = face; g.LightInfluence = 0
	g.CanvasSize = Vector2.new(900, 230)
	g.Adornee = back; g.Parent = back
	local lbl = Instance.new("TextLabel")
	lbl.BackgroundTransparency = 1
	lbl.Size = UDim2.new(1, -28, 1, -20)
	lbl.Position = UDim2.new(0, 14, 0, 10)
	lbl.Font = Enum.Font.GothamBlack
	lbl.Text = text
	lbl.TextScaled = true
	lbl.TextColor3 = Color3.fromRGB(255, 224, 150)
	local grad = Instance.new("UIGradient")
	grad.Color = ColorSequence.new({
		ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 240, 190)),
		ColorSequenceKeypoint.new(0.5, Color3.fromRGB(247, 200, 110)),
		ColorSequenceKeypoint.new(1, Color3.fromRGB(214, 160, 70)),
	})
	grad.Rotation = 90; grad.Parent = lbl
	local stroke = Instance.new("UIStroke")
	stroke.Color = Color3.fromRGB(120, 80, 20); stroke.Thickness = 3; stroke.Parent = lbl
	lbl.Parent = g
end

-- باب غرفة بمصراعين خشبيين + مقابض ذهبية؛ يعيد دوال الفتح/الإغلاق
local RDOOR_H = 8.6
local RDOOR_Y = FLOOR_Y + RDOOR_H / 2
local RDOOR_C = Color3.fromRGB(74, 50, 30)
local function makeDoubleDoor(prefix, axis, wallPos, a, b, leftDeg, rightDeg)
	local mid = (a + b) / 2
	local leafW = (mid - a) - 0.15
	local leaves = {}
	local function leaf(name, hingePos, ext, angDeg)
		local hinge, closedOff, size, handleSide
		if axis == "X" then
			hinge = CFrame.new(hingePos, RDOOR_Y, wallPos)
			closedOff = CFrame.new(ext * leafW / 2, 0, 0)
			size = Vector3.new(leafW, RDOOR_H, 0.6)
			handleSide = "X"
		else
			hinge = CFrame.new(wallPos, RDOOR_Y, hingePos)
			closedOff = CFrame.new(0, 0, ext * leafW / 2)
			size = Vector3.new(0.6, RDOOR_H, leafW)
			handleSide = "Z"
		end
		local closed = hinge * closedOff
		local open = hinge * CFrame.Angles(0, math.rad(angDeg), 0) * closedOff
		local p = Instance.new("Part")
		p.Name = name; p.Anchored = true; p.CanCollide = true
		p.Size = size; p.CFrame = closed
		p.Color = RDOOR_C; p.Material = Enum.Material.Wood
		p.TopSurface = Enum.SurfaceType.Smooth; p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = ROOT
		for _, hd in ipairs({ -0.42, 0.42 }) do
			local hoff
			if handleSide == "X" then
				hoff = CFrame.new(-ext * (leafW / 2 - 0.55), 0, hd)
			else
				hoff = CFrame.new(hd, 0, -ext * (leafW / 2 - 0.55))
			end
			local handle = part(name .. "Handle", closed * hoff, Vector3.new(0.4, 1.2, 0.4), TRIM_GOLD, Enum.Material.Metal)
			handle.CanCollide = false
			local w = Instance.new("WeldConstraint"); w.Part0 = p; w.Part1 = handle; w.Parent = p; handle.Anchored = false
		end
		table.insert(leaves, { part = p, closed = closed, open = open })
	end
	leaf(prefix .. "L", a, 1, leftDeg)
	leaf(prefix .. "R", b, -1, rightDeg)
	local function setState(toOpen, dur)
		local info = TweenInfo.new(dur, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
		for _, lf in ipairs(leaves) do
			TweenService:Create(lf.part, info, { CFrame = if toOpen then lf.open else lf.closed }):Play()
		end
	end
	return setState
end

----------------------------------------------------------------------
-- 🎨 تأثيث الغرف الأربع — كل غرفة بنمط ولون مميّز
----------------------------------------------------------------------
-- 1) البهو الكبير (lobby) — رخامي ذهبي/كحلي
do
	local NAVY = Color3.fromRGB(28, 42, 78)
	local NAVY2 = Color3.fromRGB(70, 78, 110)
	local warm = Color3.fromRGB(255, 224, 175)
	coveLight(99, 173, 5, 31, warm)
	rug(110, 162, 6, 30, NAVY)
	chandelier(124, 18, Color3.fromRGB(255, 236, 200))
	chandelier(150, 18, Color3.fromRGB(255, 236, 200))
	-- كاونتر استقبال رخامي يواجه المدخل
	part("ReceptionDesk", CFrame.new(150, FLOOR_Y + 1.8, 18), Vector3.new(2.6, 3.6, 12), NAVY2, Enum.Material.Marble)
	part("ReceptionTop", CFrame.new(149.6, FLOOR_Y + 3.75, 18), Vector3.new(3.6, 0.4, 13), MARBLE, Enum.Material.Marble).CanCollide = false
	goldStrip(148.7, 151.3, FLOOR_Y + 3.45, 11.5, 24.5)
	plant(104, 7); plant(104, 29)
	flag(168, 6, NAVY); flag(168, 30, NAVY)
	pilasterIn(100, 8); pilasterIn(100, 28); pilasterIn(172, 8); pilasterIn(172, 28)
	sconce(174, 6, Vector3.new(-1, 0, 0), warm); sconce(174, 30, Vector3.new(-1, 0, 0), warm)
end

-- 2) قاعة الاستقبال (reception) — بنفسجي/أرجواني
do
	local PURPLE = Color3.fromRGB(120, 55, 150)
	local SOFA_C = Color3.fromRGB(102, 46, 133)
	local warm = Color3.fromRGB(235, 200, 255)
	coveLight(99, 173, 37, 69, warm)
	rug(108, 164, 42, 66, Color3.fromRGB(66, 31, 82))
	chandelier(120, 54, warm)
	chandelier(154, 54, warm)
	sofa(120, 64, 180, SOFA_C)
	sofa(150, 64, 180, SOFA_C)
	sofa(108, 50, 90, SOFA_C)
	armchair(165, 46, 270, SOFA_C)
	armchair(165, 58, 270, SOFA_C)
	coffeeTable(135, 54, WOOD)
	plant(104, 68); plant(170, 68)
	flag(112, 70, PURPLE); flag(160, 70, PURPLE)
	painting(CFrame.new(FX0 + 0.4, 6, 48), 6, 4, nil)
	painting(CFrame.new(FX0 + 0.4, 6, 60), 6, 4, nil)
	drapes("X", 71.4, 116, 158, PURPLE)
	sconce(98.8, 40, Vector3.new(1, 0, 0), warm); sconce(98.8, 66, Vector3.new(1, 0, 0), warm)
	pilasterIn(174, 44); pilasterIn(174, 62)
end

-- 3) غرفة الضيوف (guest) — أخضر مخضرّ هادئ
do
	local SEAT = Color3.fromRGB(51, 140, 128)
	local warm = Color3.fromRGB(205, 245, 235)
	coveLight(99, 173, -35, -3, warm)
	rug(108, 164, -30, -4, Color3.fromRGB(26, 77, 71))
	chandelier(120, -16, warm)
	chandelier(152, -16, warm)
	armchair(116, -10, 180, SEAT)
	armchair(132, -10, 180, SEAT)
	armchair(150, -10, 180, SEAT)
	sofa(140, -30, 0, SEAT)
	coffeeTable(132, -18, WOOD)
	plant(104, -32); plant(168, -32); plant(168, -8)
	painting(CFrame.new(FX0 + 0.4, 6, -22), 5, 3.5, nil)
	painting(CFrame.new(FX0 + 0.4, 6, -12), 5, 3.5, nil)
	drapes("X", -35.4, 116, 158, SEAT)
	sconce(98.8, -28, Vector3.new(1, 0, 0), warm); sconce(98.8, -6, Vector3.new(1, 0, 0), warm)
	pilasterIn(174, -28); pilasterIn(174, -10)
end

-- 4) المكتب الرئاسي (office) — ذهبي/بُنّي فخم + صفّ كراسي للزوّار
do
	local GOLDC = Color3.fromRGB(158, 117, 41)
	local warm = Color3.fromRGB(255, 226, 170)
	local LEATHER = Color3.fromRGB(51, 33, 18)
	coveLight(179, 237, 4, 40, warm)
	rug(190, 236, 6, 38, Color3.fromRGB(82, 61, 26))
	chandelier(206, 14, warm); chandelier(206, 30, warm)
	chandelier(206, -8, warm); chandelier(206, 58, warm)
	-- المكتب التنفيذي في الصدارة (يواجه الباب -X) + لابتوب يواجه الكرسي الرئاسي
	bigDesk(226, 22, 90)
	deskChair(231, 22, 270, LEATHER)
	laptop(225, 22, 3.75)
	local globe = part("DeskGlobe", CFrame.new(227.4, 4.1, 24.6), Vector3.new(1.2, 1.2, 1.2), TRIM_GOLD, Enum.Material.Metal)
	globe.Shape = Enum.PartType.Ball
	globe.CanCollide = false
	-- شعار رئاسي على الجدار الخلفي (أقراص متراكبة تواجه الغرفة -X)
	local emblem = part("Emblem", CFrame.new(FX1 - 0.4, 6.8, 22), Vector3.new(0.4, 5, 5), TRIM_GOLD, Enum.Material.Metal)
	emblem.Shape = Enum.PartType.Cylinder
	emblem.CanCollide = false
	local emblemI = part("EmblemI", CFrame.new(FX1 - 0.55, 6.8, 22), Vector3.new(0.3, 3.4, 3.4), Color3.fromRGB(120, 26, 58), Enum.Material.SmoothPlastic)
	emblemI.Shape = Enum.PartType.Cylinder
	emblemI.CanCollide = false
	local emblemC = part("EmblemC", CFrame.new(FX1 - 0.68, 6.8, 22), Vector3.new(0.3, 1.6, 1.6), TRIM_GOLD, Enum.Material.Metal)
	emblemC.Shape = Enum.PartType.Cylinder
	emblemC.CanCollide = false
	pointLight(emblem, warm, 1.2, 14)
	bookshelf(237, 10, 270); bookshelf(237, 34, 270)
	flag(214, 12, GOLDC); flag(214, 32, GOLDC)
	-- صفّ كراسي الزوّار يواجه المكتب (طلب المالك)
	for i = 0, 2 do
		visitorChair(204, 12 + i * 7, 90, Color3.fromRGB(86, 60, 38))
	end
	-- ركن جلوس جانبي شمالي
	armchair(192, 58, 90, Color3.fromRGB(96, 66, 40))
	armchair(192, 66, 90, Color3.fromRGB(96, 66, 40))
	coffeeTable(200, 62, WOOD)
	-- ركن جلوس جانبي جنوبي
	armchair(192, -6, 90, Color3.fromRGB(96, 66, 40))
	armchair(192, 2, 90, Color3.fromRGB(96, 66, 40))
	coffeeTable(200, -2, WOOD)
	plant(184, 8); plant(184, 38); plant(236, -12); plant(236, 52)
	sconce(178.2, 6, Vector3.new(1, 0, 0), warm); sconce(178.2, 30, Vector3.new(1, 0, 0), warm)
end

----------------------------------------------------------------------
-- 🚪 أبواب الغرف (تفتح/تغلق بالضغط على E) + لافتات بأسماء الغرف فوق كل باب
----------------------------------------------------------------------
do
	local function attachPrompt(setState, anchorCF, label)
		local anchor = part("DoorPrompt", anchorCF, Vector3.new(0.6, 0.6, 0.6), Color3.fromRGB(0, 0, 0), Enum.Material.SmoothPlastic)
		anchor.Transparency = 1
		anchor.CanCollide = false
		local isOpen = false
		local pr = Instance.new("ProximityPrompt")
		pr.ActionText = "فتح / إغلاق الباب"
		pr.ObjectText = label
		pr.KeyboardKeyCode = Enum.KeyCode.E
		pr.HoldDuration = 0
		pr.RequiresLineOfSight = false
		pr.MaxActivationDistance = 11
		pr.Parent = anchor
		pr.Triggered:Connect(function()
			isOpen = not isOpen
			setState(isOpen, 1.0)
			if isOpen then
				task.delay(8, function()
					if isOpen then
						isOpen = false
						setState(false, 1.0)
					end
				end)
			end
		end)
	end

	-- قاعة الاستقبال (شمال البهو، جدار z=34) — تفتح نحو القاعة (+z)
	local recDoor = makeDoubleDoor("RecepDoor", "X", 34.5, DOOR_W0, DOOR_W1, -90, 90)
	attachPrompt(recDoor, CFrame.new((DOOR_W0 + DOOR_W1) / 2, FLOOR_Y + 5, 34.5), "قاعة الاستقبال")
	roomSign("قاعة الاستقبال", DOOR_W0 + 2, DOOR_W1 - 2, 9.6, 11.1, 33.5, 33.8, Enum.NormalId.Front)

	-- غرفة الضيوف (جنوب البهو، جدار z=2) — تفتح نحو الغرفة (-z)
	local gstDoor = makeDoubleDoor("GuestDoor", "X", 1.5, DOOR_W0, DOOR_W1, 90, -90)
	attachPrompt(gstDoor, CFrame.new((DOOR_W0 + DOOR_W1) / 2, FLOOR_Y + 5, 1.5), "غرفة الضيوف")
	roomSign("غرفة الضيوف", DOOR_W0 + 2, DOOR_W1 - 2, 9.6, 11.1, 2.2, 2.5, Enum.NormalId.Back)

	-- المكتب الرئاسي (شرق البهو، جدار x=176) — تفتح نحو المكتب (+x)
	local offDoor = makeDoubleDoor("OfficeDoor", "Z", 176.5, ENT_Z0, ENT_Z1, 90, -90)
	attachPrompt(offDoor, CFrame.new(176.5, FLOOR_Y + 5, (ENT_Z0 + ENT_Z1) / 2), "المكتب الرئاسي")
	roomSign("المكتب الرئاسي", 175.5, 175.8, 9.6, 11.1, ENT_Z0 + 2, ENT_Z1 - 2, Enum.NormalId.Left)

	-- لافتة البهو فوق المدخل الرئيسي تواجه داخل البهو (+x)
	roomSign("البهو", 96.2, 96.5, 9.6, 11.1, ENT_Z0 + 3, ENT_Z1 - 3, Enum.NormalId.Right)
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

local doorCycle = 0          -- رمز الدورة الأحدث (يُلغي مؤقّت الإغلاق السابق عند كل تشغيل)
local function setDoors(targetL, targetR, dur)
	local info = TweenInfo.new(dur, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	TweenService:Create(leafL, info, {CFrame = targetL}):Play()
	TweenService:Create(leafR, info, {CFrame = targetR}):Play()
end

-- يفتح البابين دائماً ويُمدّد فترة البقاء مفتوحاً عند كل تشغيل (حتى لو كان بمنتصف الإغلاق).
-- كل تشغيل يحمل رمز دورة خاص؛ مؤقّت الإغلاق لا ينفّذ إلا إن كان رمزه هو الأحدث.
local function openDoorsSequence()
	doorCycle += 1
	local myCycle = doorCycle
	setDoors(openL, openR, DOOR_OPEN_T)
	task.delay(DOOR_OPEN_T + DOOR_HOLD, function()
		if doorCycle ~= myCycle then return end   -- تشغيل أحدث مدّد البقاء مفتوحاً
		setDoors(closedL, closedR, DOOR_OPEN_T)
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

----------------------------------------------------------------------
-- 🖐️ باني جهاز بصمة مدمج وأنيق (بستايل ZKTeco) — قابل لإعادة الاستخدام
--      جهاز نحيف صغير: قاعدة صغيرة + عنق رفيع + رأس مدمج بشاشة بصمة
--      + لوح مسح زجاجي بارز تضع فيه إصبعك. لا أعمدة ضخمة ولا أقراص عائمة.
----------------------------------------------------------------------
type ScannerRefs = {
	frame: BasePart,
	pad: BasePart,
	padLight: PointLight,
	glass: BasePart,
	status: TextLabel,
	scanLine: Frame,
	rings: { UIStroke },
}

local function buildScanner(o): ScannerRefs
	local cx, cz, fy, sgn = o.cx, o.cz, o.fy, o.sgn
	local body, bodyMat = o.body, o.bodyMat
	local accent, screenIdle = o.accent, o.screenIdle
	local glassColor, ringColor, textColor = o.glassColor, o.ringColor, o.textColor
	local name = o.name

	local fx = cx + sgn * 0.28          -- الوجه الأمامي للرأس (تتجه له الشاشة)
	local headY0, headY1 = fy + 2.6, fy + 4.55

	-- قاعدة صغيرة (بصمة قدم صغيرة) + شريط نيون رفيع
	box(name .. "Base", cx - 0.62, cx + 0.62, fy, fy + 0.28, cz - 0.78, cz + 0.78, body, bodyMat)
	box(name .. "BaseRing", cx - 0.66, cx + 0.66, fy + 0.26, fy + 0.36, cz - 0.82, cz + 0.82, accent, Enum.Material.Neon).CanCollide = false

	-- عنق رفيع يحمل الرأس
	box(name .. "Neck", cx - sgn * 0.12 - 0.26, cx - sgn * 0.12 + 0.26, fy + 0.28, fy + 2.62, cz - 0.32, cz + 0.32, body, bodyMat)

	-- رأس الجهاز المدمج (يحمل الشاشة) — الـProximityPrompt يلتصق به
	local frame = box(name .. "Head", cx - 0.28, cx + 0.28, headY0, headY1, cz - 0.85, cz + 0.85, body, bodyMat)
	-- إطار نيون رفيع حول الوجه الأمامي (تباين أنيق)
	box(name .. "Bezel", fx, fx + sgn * 0.05, headY0 + 0.08, headY1 - 0.08, cz - 0.82, cz + 0.82, accent, Enum.Material.Neon).CanCollide = false

	-- الشاشة المتوهّجة (الجزء العلوي) — يتغيّر لونها مع المسح
	local sy0, sy1 = fy + 3.18, fy + 4.42
	local pad = box(name .. "Pad", fx + sgn * 0.02, fx + sgn * 0.09, sy0, sy1, cz - 0.72, cz + 0.72, screenIdle, Enum.Material.Neon)
	pad.CanCollide = false
	local padLight = pointLight(pad, accent, 1.0, 7)

	-- لوح المسح الزجاجي البارز (الجزء السفلي) — تضع فيه إصبعك
	local glass = box(name .. "Glass", fx, fx + sgn * 0.18, fy + 2.78, fy + 3.06, cz - 0.46, cz + 0.46, glassColor, Enum.Material.Glass)
	glass.CanCollide = false
	glass.Reflectance = 0.2
	pointLight(glass, accent, 0.7, 4)

	-- واجهة الشاشة: عنوان + بصمة بحلقات + خط مسح متحرّك + سطر حالة
	local face = (sgn >= 0) and Enum.NormalId.Right or Enum.NormalId.Left
	local gui = Instance.new("SurfaceGui")
	gui.Name = name .. "Gui"; gui.AutoLocalize = false
	gui.Face = face
	gui.CanvasSize = Vector2.new(300, 420)
	gui.LightInfluence = 0
	gui.Adornee = pad
	gui.Parent = pad

	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1
	title.Size = UDim2.new(1, 0, 0.14, 0)
	title.Position = UDim2.new(0, 0, 0.015, 0)
	title.Font = Enum.Font.GothamBold
	title.Text = o.title
	title.TextScaled = true
	title.TextColor3 = textColor
	title.Parent = gui

	-- حلقات البصمة
	local holder = Instance.new("Frame")
	holder.BackgroundTransparency = 1
	holder.Size = UDim2.new(1, 0, 0.5, 0)
	holder.Position = UDim2.new(0, 0, 0.17, 0)
	holder.ClipsDescendants = true
	holder.Parent = gui
	local rings: { UIStroke } = {}
	for i = 0, 4 do
		local ring = Instance.new("Frame")
		ring.AnchorPoint = Vector2.new(0.5, 0.5)
		ring.Position = UDim2.new(0.5, 0, 0.5, 0)
		local s = 0.86 - i * 0.16
		ring.Size = UDim2.new(s, 0, s * 1.12, 0)
		ring.BackgroundTransparency = 1
		ring.Parent = holder
		Instance.new("UICorner", ring).CornerRadius = UDim.new(1, 0)
		local st = Instance.new("UIStroke")
		st.Thickness = 3
		st.Color = ringColor
		st.Parent = ring
		table.insert(rings, st)
	end
	-- خط المسح المتحرّك (يمر فوق البصمة)
	local scanLine = Instance.new("Frame")
	scanLine.AnchorPoint = Vector2.new(0.5, 0.5)
	scanLine.Position = UDim2.new(0.5, 0, 1.1, 0)   -- يبدأ خارج الإطار (مخفي)
	scanLine.Size = UDim2.new(0.92, 0, 0.05, 0)
	scanLine.BackgroundColor3 = accent
	scanLine.BackgroundTransparency = 0.15
	scanLine.BorderSizePixel = 0
	scanLine.Parent = holder
	local lineGlow = Instance.new("UIStroke")
	lineGlow.Thickness = 2
	lineGlow.Color = ringColor
	lineGlow.Parent = scanLine

	local status = Instance.new("TextLabel")
	status.BackgroundTransparency = 1
	status.Size = UDim2.new(1, 0, 0.16, 0)
	status.Position = UDim2.new(0, 0, 0.7, 0)
	status.Font = Enum.Font.GothamBold
	status.Text = o.sub
	status.TextScaled = true
	status.TextColor3 = textColor
	status.Parent = gui

	local hint = Instance.new("TextLabel")
	hint.BackgroundTransparency = 1
	hint.Size = UDim2.new(1, 0, 0.1, 0)
	hint.Position = UDim2.new(0, 0, 0.88, 0)
	hint.Font = Enum.Font.Gotham
	hint.Text = o.hint
	hint.TextScaled = true
	hint.TextColor3 = ringColor
	hint.Parent = gui

	return { frame = frame, pad = pad, padLight = padLight, glass = glass, status = status, scanLine = scanLine, rings = rings }
end

-- جهاز بصمة الدخول الخارجي (تذكرة دخول) — مدمج، يواجه المدينة (-X)
local CX_S, CZ_S = 89, 30
local SY = FLOOR_Y
local extScan = buildScanner({
	name = "Scanner", cx = CX_S, cz = CZ_S, fy = SY, sgn = -1,
	body = Color3.fromRGB(196, 156, 74), bodyMat = Enum.Material.Metal,
	accent = TRIM_GOLD, screenIdle = Color3.fromRGB(20, 60, 90),
	glassColor = Color3.fromRGB(120, 210, 245), ringColor = Color3.fromRGB(180, 230, 255),
	textColor = Color3.fromRGB(210, 240, 255),
	title = "قصر شهد", sub = "ضع إصبعك", hint = "تذكرة دخول · " .. ENTRY_FEE .. " كوينز",
})
local panelFrame = extScan.frame
local pad = extScan.pad
local padLight = extScan.padLight

-- ProximityPrompt للتفاعل
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "ادفع وادخل (" .. ENTRY_FEE .. " كوينز)"
prompt.ObjectText = "بوابة قصر شهد — تذكرة دخول"
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
-- 🎟️ تتبّع الدفع لكل جلسة — اللاعب اللي دفع ودخل ما يُخصم منه مرّة ثانية
--      في نفس الجلسة (يُمسح تلقائياً عند خروجه من السيرفر)
----------------------------------------------------------------------
local paidEntry: { [number]: boolean } = {}
-- 🚧 قفل لكل لاعب على حدة (يمنع تكرار الضغط لنفس اللاعب دون تعطيل بقية اللاعبين)
local scanningEntry: { [number]: boolean } = {}
local scanningExit: { [number]: boolean } = {}
Players.PlayerRemoving:Connect(function(player)
	paidEntry[player.UserId] = nil
	scanningEntry[player.UserId] = nil
	scanningExit[player.UserId] = nil
end)

local PAD_IDLE = Color3.fromRGB(20, 60, 90)
local PAD_IDLE_LIGHT = Color3.fromRGB(80, 170, 230)

local function setPad(c: Color3, l: Color3)
	pad.Color = c
	padLight.Color = l
end

local function resetPadSoon()
	task.delay(2, function() setPad(PAD_IDLE, PAD_IDLE_LIGHT) end)
end

----------------------------------------------------------------------
-- 🔁 منطق البصمة الخارجية = تذكرة دخول (الدفع يتم من هنا فقط)
--      • الأدمن يدخل مجاناً
--      • اللاعب اللي دفع هذه الجلسة يدخل مجاناً
--      • غير ذلك: يُخصم ENTRY_FEE إن كان رصيده كافياً، وإلا رفض
----------------------------------------------------------------------
prompt.Triggered:Connect(function(player)
	-- منع تكرار الضغط لنفس اللاعب أثناء المسح (لكل لاعب على حدة — لا يعطّل غيره)
	if scanningEntry[player.UserId] then return end
	scanningEntry[player.UserId] = true

	local function admit()
		evScanResult:FireClient(player, true)
		setPad(Color3.fromRGB(40, 200, 110), Color3.fromRGB(60, 230, 120))
		recordEntry(player)
		openDoorsSequence()
		resetPadSoon()
	end

	local ok, err = pcall(function()
		-- ابدأ شاشة المسح عند اللاعب فوراً (إحساس واقعي)
		evStartScan:FireClient(player)
		task.wait(SCAN_TIME)

		if isAdmin(player) then
			admit()
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "👑 أهلاً بك في قصر شهد — دخول الإدارة مجاني.") end
			return
		end

		if paidEntry[player.UserId] then
			admit()
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "✅ أهلاً بعودتك — تذكرتك سارية لهذه الجلسة.") end
			return
		end

		local coins = (type(_G.GetCoins) == "function") and _G.GetCoins(player) or 0
		if coins >= ENTRY_FEE and type(_G.SpendCoins) == "function" and _G.SpendCoins(player, ENTRY_FEE) then
			paidEntry[player.UserId] = true
			admit()
			if _G.NotifyPlayer then _G.NotifyPlayer(player, "🎟️ تم خصم " .. ENTRY_FEE .. " كوينز — أهلاً بك في قصر شهد 👑") end
		else
			-- رصيد غير كافٍ → رفض الدخول
			evScanResult:FireClient(player, false)
			setPad(Color3.fromRGB(210, 50, 50), Color3.fromRGB(230, 60, 60))
			resetPadSoon()
			if _G.NotifyPlayer then
				_G.NotifyPlayer(player, "❌ رصيدك غير كافٍ — تحتاج " .. ENTRY_FEE .. " كوينز لدخول القصر (رصيدك: " .. coins .. ").")
			end
		end
	end)
	-- يُحرّر القفل دائماً (حتى لو حصل خطأ) عشان اللاعب يقدر يعيد المحاولة
	if not ok then warn("[Palace] Entry scan error: " .. tostring(err)) end
	scanningEntry[player.UserId] = nil
end)

----------------------------------------------------------------------
-- 🟢 جهاز بصمة الخروج الداخلي — مدمج وأنيق (بستايل ZKTeco)، أوبسيديان زمردي
--      وظيفته: فتح الباب للخروج فقط (بدون أي خصم، للجميع) مع حركة مسح واقعية
----------------------------------------------------------------------
local OBSIDIAN     = Color3.fromRGB(18, 22, 28)
local EMERALD      = Color3.fromRGB(40, 220, 140)
local EMERALD_DEEP = Color3.fromRGB(14, 70, 52)

-- يُوضع داخل البهو بمحاذاة المدخل (المدخل عند x=96, z=[11..25]) على جهة +Z
local EX_X, EX_Z = 101, 29
local EY = FLOOR_Y

local exitScan = buildScanner({
	name = "Exit", cx = EX_X, cz = EX_Z, fy = EY, sgn = 1,
	body = OBSIDIAN, bodyMat = Enum.Material.Slate,
	accent = EMERALD, screenIdle = EMERALD_DEEP,
	glassColor = Color3.fromRGB(120, 245, 190), ringColor = Color3.fromRGB(170, 255, 215),
	textColor = Color3.fromRGB(190, 255, 220),
	title = "بوابة الخروج", sub = "ضع إصبعك للخروج", hint = "EXIT · اضغط E",
})
local exitFrame = exitScan.frame
local pad2 = exitScan.pad
local pad2Light = exitScan.padLight

local PAD2_IDLE = EMERALD_DEEP
local PAD2_IDLE_LIGHT = EMERALD
local EXIT_SCAN_TIME = 4.5            -- ⏱ مدة حركة المسح الواقعية (ثواني)

----------------------------------------------------------------------
-- 🖐️ حركة مسح واقعية على الشاشة (السيرفر يحرّك العناصر فتتزامن لكل اللاعبين)
--      خط مسح يمرّ فوق البصمة + نبض الحلقات + نسبة تقدّم 0→100٪
----------------------------------------------------------------------
local function runScanAnimation(refs, duration: number)
	local status, scanLine, rings = refs.status, refs.scanLine, refs.rings
	refs.pad.Color = Color3.fromRGB(24, 120, 90)
	refs.padLight.Color = EMERALD
	local steps = math.max(6, math.floor(duration / 0.06))
	for s = 0, steps do
		local t = s / steps
		-- خط المسح يتحرّك من الأسفل للأعلى ويتكرّر مرّتين
		local sweep = (t * 2) % 1
		scanLine.Position = UDim2.new(0.5, 0, 1 - sweep, 0)
		-- نبض الحلقات (إضاءة متتابعة)
		for i, st in rings do
			local on = (math.floor(t * 10) % #rings) == (i - 1)
			st.Thickness = on and 5 or 3
		end
		status.Text = "جارٍ المسح… " .. math.floor(t * 100) .. "٪"
		task.wait(duration / steps)
	end
	scanLine.Position = UDim2.new(0.5, 0, 1.1, 0)   -- إخفاء الخط بعد الانتهاء
	for _, st in rings do st.Thickness = 3 end
end

local exitPrompt = Instance.new("ProximityPrompt")
exitPrompt.ActionText = "افتح الباب واخرج"
exitPrompt.ObjectText = "بوابة الخروج"
exitPrompt.HoldDuration = 0
exitPrompt.KeyboardKeyCode = Enum.KeyCode.E
exitPrompt.RequiresLineOfSight = false
exitPrompt.MaxActivationDistance = 9
exitPrompt.Parent = exitFrame

-- منطق الخروج: حركة مسح واقعية (~4.5ث) → فتح الباب (بدون خصم، للجميع)
exitPrompt.Triggered:Connect(function(player)
	-- منع إعادة التشغيل لنفس اللاعب أثناء مسحه فقط (لا يعطّل بقية اللاعبين)
	if scanningExit[player.UserId] then return end
	scanningExit[player.UserId] = true
	local ok, err = pcall(function()
		evStartScan:FireClient(player)
		runScanAnimation(exitScan, EXIT_SCAN_TIME)
		evScanResult:FireClient(player, true)
		exitScan.status.Text = "تم ✓ — تفضّل بالخروج"
		pad2.Color = Color3.fromRGB(60, 245, 150)
		pad2Light.Color = Color3.fromRGB(80, 255, 170)
		openDoorsSequence()
		if _G.NotifyPlayer then _G.NotifyPlayer(player, "🚪 تم فتح الباب — مع السلامة 👋") end
	end)
	-- يُحرّر القفل فوراً (حتى لو حصل خطأ) عشان اللاعب يقدر يعيد المحاولة بدون انتظار — مطابق لجهاز الدخول
	if not ok then warn("[Palace] Exit scan error: " .. tostring(err)) end
	scanningExit[player.UserId] = nil
	task.delay(2.2, function()
		pad2.Color = PAD2_IDLE
		pad2Light.Color = PAD2_IDLE_LIGHT
		exitScan.status.Text = "ضع إصبعك للخروج"
	end)
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
	lp.ObjectText = "سجلّ دخول القصر (للأدمن)"
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
	t.Font = Enum.Font.GothamBold; t.Text = "سجلّ\nالدخول"; t.TextScaled = true
	t.TextColor3 = Color3.fromRGB(150, 220, 255); t.Parent = sgg
end

----------------------------------------------------------------------
-- 💂 الحرّاس
----------------------------------------------------------------------
-- الحرّاس المرحّبون/المرافقون يُبنون الآن في GuardSystem.server.lua كشخصيات
-- R6 حقيقية تمشي بزيّ الحرس الملكي. أُزيلت نسخة البلوكات القديمة من هنا لأنها
-- كانت تتداخل مع حرّاس GuardSystem ومع جهاز البصمة فتظهر «أشكالاً مقطوعة».

print("[Palace] القصر الجمهوري جاهز: غرف مؤثّثة + لافتة + قفل بصمة + سجلّ دخول ✓")
