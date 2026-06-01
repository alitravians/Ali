--[[
	CINEMA DECOR — نافورة (موديل ثابت من المتجر) + حوض سمك تفاعلي (Server)
	يوضع في: ServerScriptService     ·     النوع: Script
	النافورة والحوض موديلان احترافيان ثابتان يُحقنان في الملف (inject_fountain.py
	/ inject_aquarium.py)؛ هنا فقط: حذف أي نافورة قديمة + سلوك تغذية السمك بزر E.
]]

local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

----------------------------------------------------------------------
-- 1) حذف أي نافورة قديمة (إجرائية كانت أو ثابتة)
----------------------------------------------------------------------
local OLD_NAMES = {
	FountainBase = true, FountainPillar = true, FountainPool = true,
	FountainTop = true, Fountain = true,
}
for _, inst in ipairs(Workspace:GetDescendants()) do
	if inst:IsA("BasePart") or inst:IsA("Model") then
		if OLD_NAMES[inst.Name] then
			pcall(function() inst:Destroy() end)
		end
	end
end

----------------------------------------------------------------------
-- 2) النافورة: موديل احترافي ثابت من المتجر يُحقن باسم "CityFountain"
--    (inject_fountain.py) في مركز الساحة. حلقة (1) فوق تحذف أي نافورة
--    قديمة. لا نبني نافورة إجرائية هنا = صفر لاق.
--    نضيف هنا فقط «حياة» خفيفة: رذاذ ماء متحرّك + صوت ماء ناعم ٣D محلي.
----------------------------------------------------------------------
task.spawn(function()
	local fountain = Workspace:WaitForChild("CityFountain", 30)
	if not fountain then return end
	local okBB, cf, size = pcall(function() return fountain:GetBoundingBox() end)
	if not okBB or not cf then return end

	-- حيوية الماء (طلب صريح من المستخدم: «حركة الماء ثابته... تبرمج لها سكربت»):
	-- نُضيف نوّافات جسيمات واضحة فوق النافورة دائماً (سواء فيها Beams أو منحوتة)
	-- فالحركة مضمونة للعين، ونُقوّي حركة الـBeams الأصلية للموديل. تموّج أعمدة
	-- Neon الثقيل يبقى فقط للنافورة المنحوتة بلا Beams (selfAnimated=false).
	local selfAnimated = fountain:FindFirstChildWhichIsA("Beam", true) ~= nil

	-- جزء مُصدِر غير مرئي قرب أعلى النافورة (محور المركز)
	local top = cf.Position + Vector3.new(0, size.Y * 0.28, 0)
	local emitter = Instance.new("Part")
	emitter.Name = "FountainSpray"
	emitter.Size = Vector3.new(1.6, 1, 1.6)
	emitter.CFrame = CFrame.new(top)
	emitter.Anchored = true
	emitter.CanCollide = false
	emitter.CanQuery = false
	emitter.CanTouch = false
	emitter.Transparency = 1
	emitter.Parent = fountain

	-- ماء النافورة الحيّ (يُفعَّل دائماً): نوّافات جسيمات واضحة (تطلع لأعلى وتتقوّس وتتساقط).
	-- الجسيمات تتحرّك دائماً فيُرى الماء «حيّاً» مهما كانت هندسة الموديل ثابتة.
	local WATER1 = Color3.fromRGB(215, 242, 255)
	local WATER2 = Color3.fromRGB(120, 195, 245)
	local function makeJet(rate, speed, spread, sz0, sz1)
		local e = Instance.new("ParticleEmitter")
		e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
		e.Color = ColorSequence.new(WATER1, WATER2)
		e.LightEmission = 0.6
		e.LightInfluence = 0
		e.Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.05),
			NumberSequenceKeypoint.new(0.75, 0.3),
			NumberSequenceKeypoint.new(1, 1),
		})
		e.Size = NumberSequence.new({
			NumberSequenceKeypoint.new(0, sz0),
			NumberSequenceKeypoint.new(1, sz1),
		})
		e.Lifetime = NumberRange.new(1.0, 1.6)
		e.Rate = rate
		e.Speed = NumberRange.new(speed, speed + 4)
		e.SpreadAngle = Vector2.new(spread, spread)
		e.Acceleration = Vector3.new(0, -48, 0)        -- جاذبية: يرجع يتساقط مثل الماء
		e.EmissionDirection = Enum.NormalId.Top
		e.Rotation = NumberRange.new(0, 360)
		e.RotSpeed = NumberRange.new(-50, 50)
		e.Drag = 1.0
		e.Parent = emitter
		return e
	end
	makeJet(150, 24, 9, 0.9, 0.35)   -- عمود مركزي قوي صاعد
	makeJet(90, 15, 38, 0.8, 0.3)    -- تاج يتفرّع للخارج ويتساقط (شكل النافورة الكلاسيكي)

	-- ضباب/رذاذ ناعم يلفّ القمة (إحساس ببخار الماء)
	local mist = Instance.new("ParticleEmitter")
	mist.Texture = "rbxasset://textures/particles/smoke_main.dds"
	mist.Color = ColorSequence.new(Color3.fromRGB(228, 246, 255))
	mist.LightEmission = 0.2
	mist.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.65),
		NumberSequenceKeypoint.new(1, 1),
	})
	mist.Size = NumberSequence.new(1.6, 3.2)
	mist.Lifetime = NumberRange.new(1.2, 1.9)
	mist.Rate = 12
	mist.Speed = NumberRange.new(0.5, 1.4)
	mist.SpreadAngle = Vector2.new(50, 50)
	mist.Parent = emitter

	-- نُقوّي حركة الـBeams الأصلية للموديل (ماء الموديل نفسه) فيبان جريانها واضحاً.
	if selfAnimated then
		for _, d in ipairs(fountain:GetDescendants()) do
			if d:IsA("Beam") then
				d.Enabled = true
				local ts = d.TextureSpeed
				if ts == 0 then ts = -1 end
				-- نضاعف السرعة مع الإبقاء على الاتجاه لحركة ماء أوضح للعين.
				local dir = ts < 0 and -1 or 1
				d.TextureSpeed = dir * math.max(2.5, math.abs(ts) * 2.5)
			end
		end
	end

	-- صوت ماء ناعم ٣D محلي: يُسمع وأنت قريب، واطي وغير مزعج.
	-- نجرّب عدة أصوات ماء ونثبّت أول واحد يتحمّل فعلاً (تفادي قيود خصوصية الصوت).
	local ContentProvider = game:GetService("ContentProvider")
	local sound = Instance.new("Sound")
	sound.Name = "FountainWater"
	sound.Looped = true
	sound.Volume = 0.4
	sound.RollOffMode = Enum.RollOffMode.Linear
	sound.RollOffMinDistance = 10
	sound.RollOffMaxDistance = 55
	sound.Parent = emitter

	local CANDIDATES = { 6701027086, 155966555, 167674390, 9112627118 }
	local loaded = false
	for _, id in ipairs(CANDIDATES) do
		sound.SoundId = "rbxassetid://" .. id
		pcall(function() ContentProvider:PreloadAsync({ sound }) end)
		if sound.TimeLength and sound.TimeLength > 0 then
			loaded = true
			break
		end
	end
	if loaded then
		pcall(function() sound:Play() end)
	else
		warn("[CinemaDecor] fountain water sound failed to load (audio privacy?)")
	end

	if not selfAnimated then
	------------------------------------------------------------------
	-- حيوية الماء (بديل للنافورة المنحوتة الثابتة فقط): موجة شفافية تنزل
	-- من الأعلى للأسفل عبر أعمدة الماء + تمايل رأسي بسيط. خفيف (~٢٠ مرة/ث).
	------------------------------------------------------------------
	local streams = {}              -- أعمدة/أقواس الماء (قطع شفافة رفيعة)
	local minY, maxY = math.huge, -math.huge
	for _, d in ipairs(fountain:GetDescendants()) do
		if d:IsA("BasePart") and d.Transparency > 0.05 and d.Transparency < 0.98
			and d.Size.X <= 1.2 and d.Size.Z <= 1.2 and d.Size.Y >= 0.4 then
			-- نلوّن أعمدة الماء أزرق متوهّج (Neon) فتبدو ماءً حقيقياً لا أعمدة رمادية
			pcall(function()
				d.Color = Color3.fromRGB(150, 205, 245)
				d.Material = Enum.Material.Neon
			end)
			streams[#streams + 1] = { part = d, baseT = d.Transparency, y0 = d.Position.Y, cf0 = d.CFrame }
			minY = math.min(minY, d.Position.Y)
			maxY = math.max(maxY, d.Position.Y)
		end
	end
	if #streams > 0 then
		local span = math.max(1, maxY - minY)
		local clk, acc = 0, 0
		RunService.Heartbeat:Connect(function(dt)
			clk = clk + dt
			acc = acc + dt
			if acc < 0.05 then return end       -- ~٢٠ إطار/ث (تخفيف الحمل)
			acc = 0
			for _, s in ipairs(streams) do
				-- موجة تنزل للأسفل (ماء يتدفّق): الطور حسب الارتفاع
				local h = (s.y0 - minY) / span
				local w = math.sin(clk * 4.0 + h * 10.0)
				-- موجة تدفّق واضحة: شفافية تنبض + ارتفاع يتمايل فيبدو الماء جارياً
				s.part.Transparency = math.clamp(s.baseT + w * 0.35, 0.05, 0.92)
				s.part.CFrame = s.cf0 + Vector3.new(0, w * 0.18, 0)
			end
		end)
	end
	end  -- if not selfAnimated (تموّج الأعمدة)
end)

----------------------------------------------------------------------
-- 3) حوض السمك (Aquarium) — موديل احترافي ثابت من المتجر + تغذية واقعية بزر E
--    الموديل يُحقن ثابتاً باسم "Aquarium" (inject_aquarium.py). هنا نضيف فقط
--    السلوك وقت التشغيل: سباحة هادئة + عند ضغط E ينزل أكل ويغوص، والسمك يلتفّ
--    ويسبح نحوه ويتجمّع ويقضمه مع فقاعات، ثم يتفرّق ويرجع يسبح طبيعي.
----------------------------------------------------------------------
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

task.spawn(function()
	local aquarium = Workspace:WaitForChild("Aquarium", 30)
	if not aquarium then return end

	local okBB, bbCF, bbSize = pcall(function()
		return aquarium:GetBoundingBox()
	end)
	if not okBB or not bbCF then return end

	-- حدود السباحة الداخلية: نقرأها **مباشرة** من قيم محقونة في الموديل وقت
	-- التركيب (AQMinX..AQMaxZ) — وهي تجويف الزجاج الحقيقي محسوباً بدقّة من
	-- ألواح الزجاج الشفافة. هذا يلغي أي «تخمين» (مثل اعتبار أكبر قطعة هي
	-- المركز، وهو ما كان يدفع السمك داخل لوح زجاج مزاح عن المركز ويُخرجه).
	local function nv(name)
		local o = aquarium:FindFirstChild(name)
		return (o and o:IsA("NumberValue")) and o.Value or nil
	end
	local mnx, mxx = nv("AQMinX"), nv("AQMaxX")
	local mny, mxy = nv("AQMinY"), nv("AQMaxY")
	local mnz, mxz = nv("AQMinZ"), nv("AQMaxZ")
	local C, innerHalf, waterTopY
	if mnx and mxx and mny and mxy and mnz and mxz then
		C = Vector3.new((mnx + mxx) * 0.5, (mny + mxy) * 0.5, (mnz + mxz) * 0.5)
		innerHalf = Vector3.new((mxx - mnx) * 0.5, (mxy - mny) * 0.5, (mxz - mnz) * 0.5)
		waterTopY = nv("AQWaterTopY") or (mxy - 0.4)
	else
		-- احتياطي (موديل قديم بلا قيم محقونة): نقدّر من صندوق الموديل.
		local glass, bestVol = nil, -1
		for _, d in ipairs(aquarium:GetDescendants()) do
			if d:IsA("BasePart") then
				local v = d.Size.X * d.Size.Y * d.Size.Z
				if v > bestVol then bestVol = v; glass = d end
			end
		end
		C = glass and glass.Position or bbCF.Position
		local gsz = glass and glass.Size or bbSize
		local WALL = 0.6
		innerHalf = Vector3.new(
			math.max(0.5, gsz.X * 0.5 - WALL),
			math.max(0.5, gsz.Y * 0.5 - WALL),
			math.max(0.5, gsz.Z * 0.5 - WALL)
		)
		waterTopY = C.Y + innerHalf.Y * 0.78
	end
	local feedCenter = Vector3.new(C.X, waterTopY, C.Z)

	-- يقصّ مركز السمكة بحيث يبقى جسمها كامل (نصف أبعادها العالمية = m) داخل
	-- الزجاج. m تُحسب لكل سمكة حسب دورانها الحالي فلا يخترق أي طرف الزجاج.
	-- الحوض المسطّح عمقه الداخلي ~ستد واحد، فأرضية القصّ الدنيا صغيرة جداً
	-- (0.05) حتى يبقى السمك مركزياً في العمق ولا يلمس لوحَي الزجاج.
	local function clampBody(p, m)
		local hx = math.max(0.05, innerHalf.X - m.X)
		local hy = math.max(0.05, innerHalf.Y - m.Y)
		local hz = math.max(0.05, innerHalf.Z - m.Z)
		return Vector3.new(
			math.clamp(p.X, C.X - hx, C.X + hx),
			math.clamp(p.Y, C.Y - hy, C.Y + hy),
			math.clamp(p.Z, C.Z - hz, C.Z + hz)
		)
	end
	-- نصف الأبعاد العالمية لجسم السمكة عند دوران معيّن (يحسب الميل/الالتفاف)
	local function worldHalf(cframe, size)
		local r = cframe - cframe.Position           -- دوران فقط
		local rx, ry, rz = r.RightVector, r.UpVector, r.LookVector
		local hx, hy, hz = size.X * 0.5, size.Y * 0.5, size.Z * 0.5
		return Vector3.new(
			math.abs(rx.X)*hx + math.abs(ry.X)*hy + math.abs(rz.X)*hz,
			math.abs(rx.Y)*hx + math.abs(ry.Y)*hy + math.abs(rz.Y)*hz,
			math.abs(rx.Z)*hx + math.abs(ry.Z)*hy + math.abs(rz.Z)*hz
		)
	end
	-- clamp مبسّط بهامش ثابت (للأكل/الفقاعات)
	local function clamp(p)
		return clampBody(p, Vector3.new(0.6, 0.6, 0.6))
	end

	-- جمع الأسماك (MeshParts الاستوائية) — نتجاهل القناديل والمرجان والصخور
	local fishes = {}
	local function isFish(part)
		if not part:IsA("BasePart") then return false end
		local n = part.Name:lower()
		local underFish = false
		local anc = part
		while anc and anc ~= aquarium do
			local an = anc.Name:lower()
			if an:find("jelly") or an:find("star") or an:find("crab") then return false end
			if an == "fish" then underFish = true end
			anc = anc.Parent
		end
		if n:find("jelly") or n:find("star") or n:find("crab") then return false end
		if n:find("fish") or n:find("tropical") or underFish then return true end
		return false
	end
	for _, d in ipairs(aquarium:GetDescendants()) do
		if isFish(d) then
			local cf = d.CFrame
			local sz = d.Size
			-- المحور الطولي للجسم (الأطول أفقياً) → اتجاه السباحة الطبيعي
			local axisLocal = (sz.X >= sz.Z) and Vector3.new(1, 0, 0) or Vector3.new(0, 0, 1)
			local wd = cf:VectorToWorldSpace(axisLocal)
			wd = Vector3.new(wd.X, 0, wd.Z)
			if wd.Magnitude < 1e-3 then wd = Vector3.new(0, 0, 1) end
			local baseAngle = math.atan2(wd.Unit.X, wd.Unit.Z)
			d.Anchored = true
			d.CanCollide = false
			-- نصف قطر أمان لجسم السمكة (أطول بُعد) + هامش بصري بسيط
			local bodyR = math.max(sz.X, sz.Y, sz.Z) * 0.5 + 0.35
			-- بيت السمكة = موقعها الأصلي لكن مقصوص لمنتصف الحوض بهامش جسمها،
			-- حتى أبعدها عن الزجاج من البداية (لا تبدأ ملاصقة للجدار).
			local home = clampBody(cf.Position, Vector3.new(bodyR, bodyR, bodyR))
			d.CFrame = cf - cf.Position + home        -- انقلها لبيتها الآمن فوراً
			table.insert(fishes, {
				part = d,
				size = sz,
				bodyR = bodyR,
				home = home,
				pos = home,
				rot0 = cf - cf.Position,             -- دوران أصلي (يحفظ الميل)
				baseAngle = baseAngle,                -- زاوية المحور الطولي عالمياً
				angle = baseAngle,
				phase = math.random() * 6.28,
				sp = 0.7 + math.random() * 0.5,       -- سرعة هدوء
				homeR = 0.8 + math.random() * 1.0,    -- نطاق تجوال أهدأ حول البيت
				nibble = 0,
			})
		end
	end
	if #fishes == 0 then return end

	-- زاوية اتجاه المحور الطولي مع اختيار الطرف الأقرب (تفادي السباحة للخلف)
	local function headingFor(self, dir)
		dir = Vector3.new(dir.X, 0, dir.Z)
		if dir.Magnitude < 1e-3 then return self.angle end
		dir = dir.Unit
		local a = math.atan2(dir.X, dir.Z)
		-- اختر بين a و a+π الأقرب للزاوية الحالية (التفاتة سلسة)
		local function norm(x) return (x + math.pi) % (2 * math.pi) - math.pi end
		local d1 = math.abs(norm(a - self.angle))
		local d2 = math.abs(norm(a + math.pi - self.angle))
		return (d2 < d1) and (a + math.pi) or a
	end
	local function lerpAngle(cur, target, alpha)
		local function norm(x) return (x + math.pi) % (2 * math.pi) - math.pi end
		return cur + norm(target - cur) * alpha
	end

	-- فقاعات: باعث صغير جاهز للانفجار عند القضم
	local function bubbleBurst(atPos, n)
		local a = Instance.new("Part")
		a.Size = Vector3.new(0.2, 0.2, 0.2); a.Transparency = 1; a.Anchored = true
		a.CanCollide = false; a.CanQuery = false; a.CFrame = CFrame.new(atPos); a.Parent = aquarium
		local pe = Instance.new("ParticleEmitter")
		pe.Texture = "rbxasset://textures/particles/smoke_main.dds"
		pe.Color = ColorSequence.new(Color3.fromRGB(220, 245, 255))
		pe.LightEmission = 0.6; pe.Transparency = NumberSequence.new(0.25, 1)
		pe.Size = NumberSequence.new(0.25, 0.7); pe.Lifetime = NumberRange.new(0.6, 1.1)
		pe.Speed = NumberRange.new(2, 4); pe.SpreadAngle = Vector2.new(18, 18)
		pe.Acceleration = Vector3.new(0, 6, 0); pe.Rate = 0; pe.Parent = a
		pe:Emit(n or 8)
		Debris:AddItem(a, 1.5)
	end

	-- حالة التغذية
	local feeding = false
	local foodParts = {}      -- {part=, pos=, alive=}

	-- منطقة الضغط (ProximityPrompt) على واجهة الحوض
	local promptPart = Instance.new("Part")
	promptPart.Name = "AqFeedZone"
	promptPart.Size = Vector3.new(3, 3, 3)
	promptPart.Transparency = 1; promptPart.Anchored = true
	promptPart.CanCollide = false; promptPart.CanQuery = false
	promptPart.CFrame = CFrame.new(C.X, C.Y, C.Z)
	promptPart.Parent = aquarium
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "إطعام السمك"
	prompt.ObjectText = "🐟 الحوض"
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.GamepadKeyCode = Enum.KeyCode.ButtonX
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = math.max(14, bbSize.Magnitude * 0.6)
	prompt.RequiresLineOfSight = false
	prompt.Parent = promptPart

	local function spawnFood()
		foodParts = {}
		local count = 7
		for i = 1, count do
			local off = Vector3.new((math.random() - 0.5) * innerHalf.X * 1.2, 0, (math.random() - 0.5) * innerHalf.Z * 1.2)
			local start = clamp(feedCenter + off + Vector3.new(0, innerHalf.Y * 0.5, 0))
			local pel = Instance.new("Part")
			pel.Name = "FishFood"
			pel.Shape = Enum.PartType.Ball
			pel.Size = Vector3.new(0.35, 0.35, 0.35)
			pel.Color = Color3.fromRGB(225, 170, 90)
			pel.Material = Enum.Material.Sand
			pel.Anchored = true; pel.CanCollide = false; pel.CanQuery = false
			pel.CFrame = CFrame.new(start)
			pel.Parent = aquarium
			local sink = clamp(start - Vector3.new(0, innerHalf.Y * 1.2, 0))
			TweenService:Create(pel, TweenInfo.new(3.2, Enum.EasingStyle.Sine), { Position = sink }):Play()
			table.insert(foodParts, { part = pel, alive = true })
		end
	end

	prompt.Triggered:Connect(function()
		if feeding then return end
		feeding = true
		bubbleBurst(feedCenter, 6)
		spawnFood()
		-- ينتهي وضع التغذية بعد فترة (حتى لو بقي أكل، نظّفه)
		task.delay(7, function()
			for _, f in ipairs(foodParts) do
				if f.part and f.part.Parent then f.part:Destroy() end
				f.alive = false
			end
			foodParts = {}
			feeding = false
		end)
	end)

	-- الحلقة الرئيسية: هدوء أو تغذية
	local clock = 0
	RunService.Heartbeat:Connect(function(dt)
		clock += dt
		dt = math.min(dt, 1 / 20)

		-- أقرب أكل حيّ لكل سمكة (للتجمّع والقضم)
		for _, f in ipairs(fishes) do
			local target, speed
			if feeding then
				-- اختر أقرب قطعة أكل حيّة
				local best, bestD = nil, 1e9
				for _, fd in ipairs(foodParts) do
					if fd.alive and fd.part and fd.part.Parent then
						local d = (fd.part.Position - f.pos).Magnitude
						if d < bestD then bestD = d; best = fd end
					end
				end
				if best then
					target = best.part.Position
					speed = 9
					-- وصل للأكل → قضمة + فقاعة + يختفي الأكل
					if bestD < 1.4 then
						best.alive = false
						bubbleBurst(best.part.Position, 5)
						best.part:Destroy()
						f.nibble = 0.35
					end
				else
					target = f.home; speed = f.sp * 2
				end
			else
				-- هدوء: تجوال ناعم حول البيت
				target = f.home + Vector3.new(
					math.sin(clock * 0.5 + f.phase) * f.homeR,
					math.sin(clock * 0.7 + f.phase) * f.homeR * 0.4,
					math.cos(clock * 0.45 + f.phase) * f.homeR
				)
				speed = f.sp
			end

			local toT = target - f.pos
			local dir = toT
			local dist = dir.Magnitude
			if dist > 0.05 then dir = dir / dist else dir = Vector3.new(0, 0, 1) end
			local step = math.min(speed * dt, dist)
			f.pos = clampBody(f.pos + dir * step, Vector3.new(f.bodyR, f.bodyR, f.bodyR))

			-- التفاتة سلسة نحو الاتجاه
			local desired = headingFor(f, dir)
			local turn = feeding and 6 or 2.2
			f.angle = lerpAngle(f.angle, desired, math.clamp(turn * dt, 0, 1))

			-- قضمة: نبضة أمامية صغيرة
			local lunge = 0
			if f.nibble > 0 then
				f.nibble = math.max(0, f.nibble - dt)
				lunge = math.sin((0.35 - f.nibble) / 0.35 * math.pi) * 0.35
			end
			-- ميلان جسم خفيف أثناء السباحة (إحساس حيّ)
			local roll = math.rad(math.sin(clock * 6 + f.phase) * (feeding and 10 or 5))

			local yaw = f.angle - f.baseAngle
			local rot = CFrame.Angles(0, yaw, 0) * f.rot0 * CFrame.Angles(0, 0, roll)
			-- حاجز أمان لحظي صارم: نحسب نصف أبعاد الجسم العالمية بعد الدوران،
			-- ونقصّ الموقع النهائي (مع نبضة القضم) بهذا الهامش فعلياً — فمهما لفّت
			-- السمكة أو اندفعت، يستحيل أن يتعدّى أي ركن من جسمها الزجاج.
			local wh = worldHalf(rot, f.size)
			local finalPos = clampBody(f.pos + rot.LookVector * lunge, wh)
			f.pos = clampBody(f.pos, wh)
			f.part.CFrame = rot + finalPos
		end
	end)
end)
