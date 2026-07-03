--[[
╔══════════════════════════════════════════════════════════════════════╗
║  TIC TAC TOE — لعبة إكس-أو ثلاثية الأبعاد (Server)                     ║
║                                                                        ║
║  ٣ طاولات ملكية قرب نقطة الانطلاق. لكل طاولة:                          ║
║   • سطح خشبي + إطار/أرجل ذهبية + لوح ٣×٣ محفور.                        ║
║   • كرسيّان متقابلان (أحمر = X، أزرق = O). تقعد على الكرسي → تنضمّ.     ║
║   • تضغط على المربّع في دورك → ينبثق رمزك مجسّماً (X بارّين / O حلقة).  ║
║   • كشف الفائز (مع إبراز الخط) أو التعادل، ولوحة حالة خلفية، وإعادة لعب.║
║                                                                        ║
║  كل شيء قطع روبلوكس أصلية ومثبّتة (Anchored) = صفر لاق.                 ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

----------------------------------------------------------------------
-- الألوان والثوابت
----------------------------------------------------------------------
local WOOD       = Color3.fromRGB(74, 48, 28)
local WOOD_DARK  = Color3.fromRGB(52, 33, 19)
local GOLD       = Color3.fromRGB(214, 175, 92)
local GOLD_HI    = Color3.fromRGB(245, 220, 150)
local FELT       = Color3.fromRGB(28, 36, 30)
local LINE_COL   = Color3.fromRGB(232, 224, 205)
local X_COL      = Color3.fromRGB(232, 86, 86)    -- أحمر
local O_COL      = Color3.fromRGB(86, 150, 240)   -- أزرق
local SEAT_X_COL = Color3.fromRGB(120, 40, 40)
local SEAT_O_COL = Color3.fromRGB(36, 60, 110)

-- مؤثّرات صوتية (أصول موجودة فعلاً في اللعبة — أصوات قائمة الزجاج)
local SND_PLACE = "rbxassetid://9125402735"  -- نقرة عند وضع رمز
local SND_WIN   = "rbxassetid://9114066858"  -- نغمة فوز

local CELL      = 1.7        -- مسافة بين مراكز المربّعات
local TABLE_TOP_Y = 3.0      -- ارتفاع سطح الطاولة فوق الأرضية
local WIN_LINES = {
	{ 1, 2, 3 }, { 4, 5, 6 }, { 7, 8, 9 },   -- صفوف
	{ 1, 4, 7 }, { 2, 5, 8 }, { 3, 6, 9 },   -- أعمدة
	{ 1, 5, 9 }, { 3, 5, 7 },                -- أقطار
}

-- مواقع طاولات إكس-أو داخل «منطقة إكس-أو» (يسار الصالة) مصفوفة على عمق z،
-- لإفساح يمين الصالة لـ«منطقة الشطرنج». (تقسيم ركن الألعاب لمنطقتين مستقلّتين.)
local TABLES = {
	Vector3.new(-15, 0.8, 99.0),
	Vector3.new(-15, 0.8, 110.0),
	Vector3.new(-15, 0.8, 121.0),
}

----------------------------------------------------------------------
-- أدوات بناء عامة
----------------------------------------------------------------------
local function part(props): BasePart
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = props.CanCollide ~= false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = props.Material or Enum.Material.SmoothPlastic
	p.Color = props.Color or WOOD
	p.Size = props.Size or Vector3.new(1, 1, 1)
	p.CFrame = props.CFrame or CFrame.new()
	if props.Transparency then p.Transparency = props.Transparency end
	if props.Shape then p.Shape = props.Shape end
	p.Name = props.Name or "Part"
	p.Parent = props.Parent
	return p
end

----------------------------------------------------------------------
-- مؤثّرات: صوت ثلاثي الأبعاد + أنيميشن انبثاق ناعم للرمز
----------------------------------------------------------------------
local function playSound(adornee: BasePart, id: string, volume: number, speed: number)
	local s = Instance.new("Sound")
	s.SoundId = id
	s.Volume = volume
	s.PlaybackSpeed = speed
	s.RollOffMaxDistance = 60
	s.Parent = adornee
	s:Play()
	Debris:AddItem(s, 5)
end

-- انبثاق ناعم: يكبر الرمز من نقطته المركزية إلى حجمه الكامل بحركة Back لطيفة
local function popIn(model: Model, center: Vector3)
	local info = TweenInfo.new(0.24, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
	for _, p in ipairs(model:GetDescendants()) do
		if p:IsA("BasePart") then
			local fullSize, fullCF = p.Size, p.CFrame
			local rot = fullCF - fullCF.Position
			local offset = fullCF.Position - center
			p.Size = fullSize * 0.06
			p.CFrame = CFrame.new(center + offset * 0.06) * rot
			TweenService:Create(p, info, { Size = fullSize, CFrame = fullCF }):Play()
		end
	end
end

----------------------------------------------------------------------
-- رموز اللعب المجسّمة (X / O) فوق مربّع
----------------------------------------------------------------------
local function buildX(center: CFrame, parent: Instance): Model
	local m = Instance.new("Model")
	m.Name = "Mark_X"
	m.Parent = parent
	local base = center * CFrame.new(0, 0.75, 0)
	for _, rot in ipairs({ 45, -45 }) do
		local arm = base * CFrame.Angles(0, 0, math.rad(rot))
		part({
			Name = "Bar", Parent = m, Color = X_COL, Material = Enum.Material.Neon,
			Size = Vector3.new(0.32, 1.5, 0.32), CanCollide = false, CFrame = arm,
		})
		-- كرتان على الطرفين تعطيان أطرافاً مدوّرة ناعمة بدل الزوايا الحادّة
		for _, t in ipairs({ 0.75, -0.75 }) do
			part({
				Name = "Cap", Parent = m, Color = X_COL, Material = Enum.Material.Neon,
				Shape = Enum.PartType.Ball, Size = Vector3.new(0.32, 0.32, 0.32),
				CanCollide = false, CFrame = arm * CFrame.new(0, t, 0),
			})
		end
	end
	return m
end

local function buildO(center: CFrame, parent: Instance): Model
	local m = Instance.new("Model")
	m.Name = "Mark_O"
	m.Parent = parent
	-- حلقة ملساء: كرات صغيرة متقاربة متداخلة تعطي حافة ناعمة (بدل المجزّأة كالترس)
	local seg = 30
	local r = 0.6
	local base = center * CFrame.new(0, 0.7, 0)
	for i = 0, seg - 1 do
		local a = (i / seg) * math.pi * 2
		part({
			Name = "Seg", Parent = m, Color = O_COL, Material = Enum.Material.Neon,
			Shape = Enum.PartType.Ball, Size = Vector3.new(0.34, 0.34, 0.34),
			CanCollide = false, CFrame = base * CFrame.new(math.cos(a) * r, 0, math.sin(a) * r),
		})
	end
	return m
end

----------------------------------------------------------------------
-- لوحة الحالة الخلفية (SurfaceGui)
----------------------------------------------------------------------
local function buildStatusBoard(origin: Vector3, parent: Instance)
	local boardCX = origin.X
	local boardCY = origin.Y + 6.0
	local boardZ = origin.Z + 4.6
	local W, H = 8.2, 3.0

	-- عمودان معدنيّان يحملان اللوحة
	for _, dx in ipairs({ -W / 2 + 0.3, W / 2 - 0.3 }) do
		part({
			Name = "StatusPole", Parent = parent, Color = GOLD, Material = Enum.Material.Metal,
			Size = Vector3.new(0.32, boardCY - origin.Y, 0.32),
			CFrame = CFrame.new(boardCX + dx, origin.Y + (boardCY - origin.Y) / 2, boardZ),
		})
	end

	-- زجاج داكن (لوح العرض)
	local board = part({
		Name = "StatusBoard", Parent = parent, Color = Color3.fromRGB(14, 18, 26),
		Material = Enum.Material.Glass,
		Size = Vector3.new(W, H, 0.22),
		CFrame = CFrame.new(boardCX, boardCY, boardZ),
	})
	board.Reflectance = 0.15

	-- إطار ذهبي حول اللوح
	local fr = 0.22
	for _, d in ipairs({
		{ Vector3.new(0, H / 2, 0), Vector3.new(W + fr * 2, fr, 0.34) },
		{ Vector3.new(0, -H / 2, 0), Vector3.new(W + fr * 2, fr, 0.34) },
		{ Vector3.new(-W / 2, 0, 0), Vector3.new(fr, H, 0.34) },
		{ Vector3.new(W / 2, 0, 0), Vector3.new(fr, H, 0.34) },
	}) do
		part({
			Name = "BoardFrame", Parent = parent, Color = GOLD_HI, Material = Enum.Material.Metal,
			Size = d[2], CFrame = CFrame.new(boardCX, boardCY, boardZ) * CFrame.new(d[1]),
		})
	end

	-- تاج ذهبي صغير أعلى اللوح
	for i = -2, 2 do
		local spike = 0.5 + (i == 0 and 0.45 or (math.abs(i) == 1 and 0.2 or 0))
		part({
			Name = "CrownSpike", Parent = parent, Color = GOLD_HI, Material = Enum.Material.Neon,
			Size = Vector3.new(0.34, spike, 0.34),
			CFrame = CFrame.new(boardCX + i * 0.7, boardCY + H / 2 + 0.2 + spike / 2, boardZ),
		})
	end

	local gui = Instance.new("SurfaceGui")
	gui.Name = "StatusFace"
	gui.AutoLocalize = false
	gui.Face = Enum.NormalId.Front
	gui.CanvasSize = Vector2.new(1024, 384)
	gui.LightInfluence = 0
	gui.Adornee = board
	gui.Parent = board

	local pad = Instance.new("Frame")
	pad.BackgroundTransparency = 1
	pad.Size = UDim2.new(1, 0, 1, 0)
	pad.Parent = gui

	-- العنوان «إكس · أو» بتدرّج ذهبي + توهّج
	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1
	title.Size = UDim2.new(1, -40, 0.38, 0)
	title.Position = UDim2.new(0, 20, 0.05, 0)
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.Text = "إكس · أو"
	title.TextColor3 = Color3.fromRGB(255, 245, 215)
	title.Parent = pad
	local tg = Instance.new("UIGradient")
	tg.Color = ColorSequence.new(GOLD_HI, GOLD)
	tg.Rotation = 90
	tg.Parent = title
	local ts = Instance.new("UIStroke")
	ts.Thickness = 3
	ts.Color = Color3.fromRGB(60, 42, 12)
	ts.Transparency = 0.2
	ts.Parent = title

	-- صف النتيجة: عدّاد فوز X (أحمر) و O (أزرق) — يحدّث بعد كل مباراة
	local scoreRow = Instance.new("Frame")
	scoreRow.BackgroundTransparency = 1
	scoreRow.Size = UDim2.new(1, -40, 0.15, 0)
	scoreRow.Position = UDim2.new(0, 20, 0.40, 0)
	scoreRow.Parent = pad

	local function scoreChip(side: number, col: Color3): TextLabel
		local lbl = Instance.new("TextLabel")
		lbl.BackgroundTransparency = 1
		lbl.Size = UDim2.new(0.46, 0, 1, 0)
		lbl.Position = UDim2.new(side < 0 and 0.04 or 0.5, 0, 0, 0)
		lbl.Font = Enum.Font.GothamBlack
		lbl.TextScaled = true
		lbl.TextXAlignment = side < 0 and Enum.TextXAlignment.Right or Enum.TextXAlignment.Left
		lbl.TextColor3 = col
		lbl.Text = (side < 0 and "X  0" or "O  0")
		lbl.Parent = scoreRow
		local stk = Instance.new("UIStroke")
		stk.Thickness = 2
		stk.Color = Color3.fromRGB(10, 14, 22)
		stk.Transparency = 0.25
		stk.Parent = lbl
		return lbl
	end
	local scoreXLabel = scoreChip(-1, X_COL)
	local scoreOLabel = scoreChip(1, O_COL)
	-- فاصل ذهبي بين العدّادين
	local dot = Instance.new("TextLabel")
	dot.BackgroundTransparency = 1
	dot.AnchorPoint = Vector2.new(0.5, 0.5)
	dot.Position = UDim2.new(0.5, 0, 0.5, 0)
	dot.Size = UDim2.new(0.08, 0, 1, 0)
	dot.Font = Enum.Font.GothamBlack
	dot.TextScaled = true
	dot.Text = "·"
	dot.TextColor3 = GOLD_HI
	dot.Parent = scoreRow

	-- شريحة الحالة (خلفية داكنة + إطار + نص)
	local pill = Instance.new("Frame")
	pill.Name = "StatusPill"
	pill.AnchorPoint = Vector2.new(0.5, 0)
	pill.Position = UDim2.new(0.5, 0, 0.56, 0)
	pill.Size = UDim2.new(0.92, 0, 0.36, 0)
	pill.BackgroundColor3 = Color3.fromRGB(8, 12, 20)
	pill.BackgroundTransparency = 0.15
	pill.Parent = pad
	local pc = Instance.new("UICorner")
	pc.CornerRadius = UDim.new(0.5, 0)
	pc.Parent = pill
	local pstk = Instance.new("UIStroke")
	pstk.Name = "PillStroke"
	pstk.Thickness = 2.5
	pstk.Color = GOLD
	pstk.Transparency = 0.1
	pstk.Parent = pill

	local status = Instance.new("TextLabel")
	status.Name = "Status"
	status.BackgroundTransparency = 1
	status.Size = UDim2.new(1, -36, 1, -14)
	status.Position = UDim2.new(0, 18, 0, 7)
	status.Font = Enum.Font.GothamBold
	status.TextScaled = true
	status.Text = "اجلس على كرسيّ للّعب"
	status.TextColor3 = LINE_COL
	status.Parent = pill

	return status, scoreXLabel, scoreOLabel
end

----------------------------------------------------------------------
-- حالة كل طاولة
----------------------------------------------------------------------
type Game = {
	cells: { BasePart },
	marks: { Model? },
	board: { string },     -- "", "X", "O"
	seatX: Seat,
	seatO: Seat,
	playerX: Player?,
	playerO: Player?,
	turn: string,          -- "X" | "O"
	active: boolean,
	statusLabel: TextLabel,
	scoreXLabel: TextLabel,
	scoreOLabel: TextLabel,
	scoreX: number,
	scoreO: number,
	pieceFolder: Folder,
	lineGlow: { BasePart },
	winFx: { BasePart },
	winTweens: { Tween },
}

local games: { Game } = {}

local function tintPill(lbl: TextLabel, col: Color3)
	local pill = lbl.Parent
	if pill then
		local stk = pill:FindFirstChild("PillStroke")
		if stk and stk:IsA("UIStroke") then stk.Color = col end
	end
end

local function setStatus(g: Game)
	local lbl = g.statusLabel
	if not g.active then
		if g.playerX or g.playerO then
			lbl.Text = "بانتظار لاعب ثانٍ…"
			lbl.TextColor3 = GOLD
			tintPill(lbl, GOLD)
		else
			lbl.Text = "اجلس على كرسيّ للّعب"
			lbl.TextColor3 = LINE_COL
			tintPill(lbl, GOLD)
		end
		return
	end
	local who = g.turn == "X" and "🔴 دور الأحمر (X)" or "🔵 دور الأزرق (O)"
	lbl.Text = who
	lbl.TextColor3 = g.turn == "X" and X_COL or O_COL
	tintPill(lbl, g.turn == "X" and X_COL or O_COL)
end

local function clearBoard(g: Game)
	for _, tw in ipairs(g.winTweens) do pcall(function() tw:Cancel() end) end
	g.winTweens = {}
	for _, p in ipairs(g.winFx) do
		if p and p.Parent then p:Destroy() end
	end
	g.winFx = {}
	for i = 1, 9 do
		g.board[i] = ""
		if g.marks[i] then
			g.marks[i]:Destroy()
			g.marks[i] = nil
		end
	end
	for _, cell in ipairs(g.cells) do
		local glow = cell:FindFirstChild("CellGlow")
		if glow and glow:IsA("BasePart") then glow.Transparency = 1 end
	end
end

local function checkWin(g: Game): (string?, { number }?)
	for _, line in ipairs(WIN_LINES) do
		local a, b, c = line[1], line[2], line[3]
		local va = g.board[a]
		if va ~= "" and va == g.board[b] and va == g.board[c] then
			return va, line
		end
	end
	for i = 1, 9 do
		if g.board[i] == "" then return nil, nil end
	end
	return "draw", nil
end

local function startMatch(g: Game)
	clearBoard(g)
	g.active = true
	g.turn = "X"
	setStatus(g)
end

local function updateScore(g: Game)
	if g.scoreXLabel then g.scoreXLabel.Text = "X  " .. g.scoreX end
	if g.scoreOLabel then g.scoreOLabel.Text = "O  " .. g.scoreO end
end

-- إبراز خط الفوز: شعاع نيون يمتدّ عبر المربّعات الثلاثة + نبض توهّجها
local function spawnWinFx(g: Game, line: { number }, col: Color3)
	local pulse = TweenInfo.new(0.55, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
	for _, idx in ipairs(line) do
		local glow = g.cells[idx]:FindFirstChild("CellGlow") :: BasePart?
		if glow then
			glow.Color = col
			glow.Transparency = 0.1
			local tw = TweenService:Create(glow, pulse, { Transparency = 0.55 })
			tw:Play()
			table.insert(g.winTweens, tw)
		end
	end
	local a = g.cells[line[1]].CFrame.Position
	local b = g.cells[line[3]].CFrame.Position
	local fa = Vector3.new(a.X, a.Y + 0.09, a.Z)
	local fb = Vector3.new(b.X, b.Y + 0.09, b.Z)
	local len = (fb - fa).Magnitude + (CELL - 0.4)
	local beam = part({
		Name = "WinBeam", Parent = g.pieceFolder, Color = col, Material = Enum.Material.Neon,
		CanCollide = false, Size = Vector3.new(0.42, 0.07, len),
		CFrame = CFrame.lookAt((fa + fb) / 2, fb),
	})
	table.insert(g.winFx, beam)
	local btw = TweenService:Create(beam, pulse, { Transparency = 0.5 })
	beam.Transparency = 0
	btw:Play()
	table.insert(g.winTweens, btw)
end

local function endMatch(g: Game, result: string, line: { number }?)
	g.active = false
	if result == "draw" then
		g.statusLabel.Text = "🤝 تعادل! اضغط أي مربّع لإعادة اللعب"
		g.statusLabel.TextColor3 = GOLD
		tintPill(g.statusLabel, GOLD)
		playSound(g.cells[5], SND_PLACE, 0.4, 0.7)
		return
	end
	local col = result == "X" and X_COL or O_COL
	g.statusLabel.Text = (result == "X" and "🔴 فاز الأحمر (X)!" or "🔵 فاز الأزرق (O)!")
	g.statusLabel.TextColor3 = col
	tintPill(g.statusLabel, col)
	if result == "X" then g.scoreX += 1 else g.scoreO += 1 end
	updateScore(g)
	if line then spawnWinFx(g, line, col) end
	playSound(g.cells[5], SND_WIN, 0.5, 1)
end

local function placeMark(g: Game, idx: number, symbol: string)
	g.board[idx] = symbol
	local cellCF = g.cells[idx].CFrame
	local mark = symbol == "X" and buildX(cellCF, g.pieceFolder) or buildO(cellCF, g.pieceFolder)
	g.marks[idx] = mark
	popIn(mark, (cellCF * CFrame.new(0, 0.73, 0)).Position)
	playSound(g.cells[idx], SND_PLACE, 0.45, symbol == "X" and 1.0 or 0.9)
end

local function onCellClicked(g: Game, idx: number, player: Player)
	-- إعادة اللعب: لو انتهت المباراة وكلا اللاعبين موجودين
	if not g.active then
		if g.playerX and g.playerO and (player == g.playerX or player == g.playerO) then
			startMatch(g)
		end
		return
	end
	-- يجب أن يكون اللاعب مشاركاً ودوره
	local symbol = nil
	if player == g.playerX then symbol = "X"
	elseif player == g.playerO then symbol = "O" end
	if not symbol then return end
	if symbol ~= g.turn then return end
	if g.board[idx] ~= "" then return end

	placeMark(g, idx, symbol)
	local result, line = checkWin(g)
	if result then
		endMatch(g, result, line)
	else
		g.turn = g.turn == "X" and "O" or "X"
		setStatus(g)
	end
end

----------------------------------------------------------------------
-- إدارة المقاعد (الانضمام/المغادرة)
----------------------------------------------------------------------
local function seatPlayer(seat: Seat): Player?
	local occ = seat.Occupant
	if not occ then return nil end
	return Players:GetPlayerFromCharacter(occ.Parent)
end

local function refreshSeats(g: Game)
	g.playerX = seatPlayer(g.seatX)
	g.playerO = seatPlayer(g.seatO)
	if g.playerX and g.playerO then
		if not g.active then startMatch(g) end
	else
		-- لاعب غادر أثناء اللعب → إنهاء وإعادة ضبط
		g.active = false
		clearBoard(g)
		setStatus(g)
	end
end

----------------------------------------------------------------------
-- بناء طاولة كاملة
----------------------------------------------------------------------
local function buildSeat(origin: Vector3, side: number, col: Color3, parent: Instance, label: string): Seat
	-- side: -1 (جهة -X) أو +1 (جهة +X)
	local sx = origin.X + side * 5.4
	local base = origin + Vector3.new(side * 5.4, 0, 0)
	-- قاعدة الكرسي
	part({
		Name = "ChairPost", Parent = parent, Color = WOOD_DARK, Material = Enum.Material.Wood,
		Size = Vector3.new(0.5, 1.8, 0.5), CFrame = CFrame.new(base + Vector3.new(0, 0.9, 0)),
	})
	local seat = Instance.new("Seat")
	seat.Name = "PlayerSeat"
	seat.Anchored = true
	seat.Size = Vector3.new(1.9, 0.4, 1.9)
	seat.Material = Enum.Material.SmoothPlastic
	seat.Color = col
	-- يواجه اللاعب الجالس مركز الطاولة (اللوح) — جهة -X تنظر +X والعكس
	seat.CFrame = CFrame.new(Vector3.new(sx, origin.Y + 1.9, origin.Z))
		* CFrame.Angles(0, math.rad(side > 0 and 90 or -90), 0)
	seat.Parent = parent
	-- ظهر الكرسي
	part({
		Name = "ChairBack", Parent = parent, Color = col, Material = Enum.Material.SmoothPlastic,
		Size = Vector3.new(0.4, 2.2, 1.9),
		CFrame = CFrame.new(Vector3.new(sx + side * 0.85, origin.Y + 2.9, origin.Z)),
	})
	-- شارة اللون فوق الظهر
	local badge = part({
		Name = "ChairBadge", Parent = parent, Color = col, Material = Enum.Material.Neon,
		Size = Vector3.new(0.2, 0.6, 0.6),
		CFrame = CFrame.new(Vector3.new(sx + side * 0.85, origin.Y + 4.1, origin.Z)),
	})
	local _ = label
	local _ = badge

	-- زر صريح للجلوس (يعمل على الجوال أيضاً)
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "SitPrompt"
	prompt.ActionText = "🪑 اجلس للّعب"
	prompt.ObjectText = label
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 8
	prompt.RequiresLineOfSight = false
	prompt.Parent = seat
	prompt.Triggered:Connect(function(plr)
		if seat.Occupant then return end   -- الكرسي مشغول: لا تطرد اللاعب الجالس
		local char = plr.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then pcall(function() seat:Sit(hum) end) end
	end)

	return seat
end

local function buildTable(origin: Vector3, parent: Instance): Game
	local model = Instance.new("Model")
	model.Name = "TicTacToeTable"
	model.Parent = parent

	-- أرجل الطاولة
	for _, dx in ipairs({ -2.6, 2.6 }) do
		for _, dz in ipairs({ -2.6, 2.6 }) do
			part({
				Name = "Leg", Parent = model, Color = GOLD, Material = Enum.Material.Metal,
				Size = Vector3.new(0.45, TABLE_TOP_Y, 0.45),
				CFrame = CFrame.new(origin + Vector3.new(dx, TABLE_TOP_Y / 2, dz)),
			})
		end
	end
	-- سطح الطاولة
	part({
		Name = "TableTop", Parent = model, Color = WOOD, Material = Enum.Material.Wood,
		Size = Vector3.new(6.6, 0.5, 6.6),
		CFrame = CFrame.new(origin + Vector3.new(0, TABLE_TOP_Y, 0)),
	})
	-- إطار ذهبي حول السطح
	for _, d in ipairs({
		{ Vector3.new(0, 0, 3.25), Vector3.new(7.0, 0.35, 0.5) },
		{ Vector3.new(0, 0, -3.25), Vector3.new(7.0, 0.35, 0.5) },
		{ Vector3.new(3.25, 0, 0), Vector3.new(0.5, 0.35, 7.0) },
		{ Vector3.new(-3.25, 0, 0), Vector3.new(0.5, 0.35, 7.0) },
	}) do
		part({
			Name = "Trim", Parent = model, Color = GOLD_HI, Material = Enum.Material.Metal,
			Size = d[2], CFrame = CFrame.new(origin + Vector3.new(0, TABLE_TOP_Y + 0.25, 0) + d[1]),
		})
	end

	-- لبادة اللوح (felt) فوق السطح
	local topY = origin.Y + TABLE_TOP_Y + 0.3
	part({
		Name = "Felt", Parent = model, Color = FELT, Material = Enum.Material.Fabric, CanCollide = false,
		Size = Vector3.new(5.6, 0.08, 5.6), CFrame = CFrame.new(origin.X, topY, origin.Z),
	})
	-- خطوط الشبكة ٣×٣
	for _, off in ipairs({ -CELL / 2, CELL / 2 }) do
		part({
			Name = "GridLine", Parent = model, Color = LINE_COL, Material = Enum.Material.Neon, CanCollide = false,
			Size = Vector3.new(5.2, 0.06, 0.14), CFrame = CFrame.new(origin.X, topY + 0.05, origin.Z + off),
		})
		part({
			Name = "GridLine", Parent = model, Color = LINE_COL, Material = Enum.Material.Neon, CanCollide = false,
			Size = Vector3.new(0.14, 0.06, 5.2), CFrame = CFrame.new(origin.X + off, topY + 0.05, origin.Z),
		})
	end

	local cells: { BasePart } = {}
	local pieceFolder = Instance.new("Folder")
	pieceFolder.Name = "Pieces"
	pieceFolder.Parent = model

	-- بناء المقاعد ولوحة الحالة
	local seatX = buildSeat(origin, -1, SEAT_X_COL, model, "🔴 لاعب X")
	local seatO = buildSeat(origin, 1, SEAT_O_COL, model, "🔵 لاعب O")
	local statusLabel, scoreXLabel, scoreOLabel = buildStatusBoard(origin, model)

	local game: Game = {
		cells = cells, marks = {}, board = {},
		seatX = seatX, seatO = seatO,
		playerX = nil, playerO = nil,
		turn = "X", active = false,
		statusLabel = statusLabel,
		scoreXLabel = scoreXLabel, scoreOLabel = scoreOLabel,
		scoreX = 0, scoreO = 0,
		pieceFolder = pieceFolder, lineGlow = {},
		winFx = {}, winTweens = {},
	}
	for i = 1, 9 do game.board[i] = "" end

	-- المربّعات التسعة + كاشف الضغط
	local idx = 0
	for row = -1, 1 do
		for col = -1, 1 do
			idx += 1
			local cx = origin.X + col * CELL
			local cz = origin.Z + row * CELL
			local cell = part({
				Name = "Cell", Parent = model, Color = FELT, Material = Enum.Material.Fabric,
				Size = Vector3.new(CELL - 0.18, 0.1, CELL - 0.18),
				CFrame = CFrame.new(cx, topY + 0.06, cz),
			})
			cell:SetAttribute("Index", idx)
			local glow = part({
				Name = "CellGlow", Parent = cell, Color = GOLD, Material = Enum.Material.Neon, CanCollide = false,
				Transparency = 1, Size = Vector3.new(CELL - 0.1, 0.04, CELL - 0.1),
				CFrame = CFrame.new(cx, topY + 0.02, cz),
			})
			local _ = glow
			cells[idx] = cell

			local cd = Instance.new("ClickDetector")
			cd.MaxActivationDistance = 14
			cd.Parent = cell
			local capturedIdx = idx
			cd.MouseClick:Connect(function(plr)
				onCellClicked(game, capturedIdx, plr)
			end)
		end
	end

	-- مراقبة المقاعد
	seatX:GetPropertyChangedSignal("Occupant"):Connect(function() refreshSeats(game) end)
	seatO:GetPropertyChangedSignal("Occupant"):Connect(function() refreshSeats(game) end)

	setStatus(game)
	return game
end

----------------------------------------------------------------------
-- 🎮 ركن الألعاب — مبنى 3D حقيقي (FBX عبر Open Cloud) مغلق متكامل.
--   رفع الـ3D جرّد الخامات → كل القطع تصل رمادية، فنعيد صبغها بالاسم.
--   المدخل (الباب + اللافتة) يواجه الجنوب نحو السبون. باب يفتح بـE.
----------------------------------------------------------------------
local InsertService = game:GetService("InsertService")

local HALL_ASSET_ID = 85565802606403         -- أصل المبنى (مُعتمَد/Approved)
local STAGE_LIGHT_ASSET_ID = 99786459202092   -- stage_light_asset_id.txt
local HALL_CENTER = Vector3.new(0, 0, 110)   -- مركز أفقي + قاع الأرضية على y=0
local HALL_YAW = math.rad(0)                  -- المدخل يواجه -Z (نحو السبون)
local LEAF_H = 10.6

-- ألوان القطع (RGB) — تُطبّق بالاسم لإعادة صبغ المبنى المُجرَّد
local C = {
	CREAM = { 237, 227, 204 }, NAVY = { 23, 31, 66 }, GOLD = { 217, 171, 69 },
	GOLDE = { 245, 205, 110 }, MARBLE = { 237, 232, 222 }, PINK = { 255, 158, 199 },
	GLASS = { 153, 199, 224 }, WOOD = { 84, 54, 31 }, REDS = { 158, 52, 52 },
	GREEN = { 64, 140, 72 },
	-- جدران كريمي دافئ (sandstone) وأرضية رخام أدفأ — أوضح من الأبيض فتبان مصبوغة
	WALL = { 222, 202, 162 }, FLOORC = { 209, 192, 162 },
}
local function rgb(t: { number }): Color3
	return Color3.fromRGB(t[1], t[2], t[3])
end

-- صبغ قطعة واحدة حسب اسمها (مطابقة بالبادئة)
local function paintPart(p: BasePart)
	local n = p.Name
	local function is(pre: string): boolean
		return string.sub(n, 1, #pre) == pre
	end
	if n == "SignTex" or n == "LBtex" or n == "CLKtex" then
		p.Transparency = 1 -- خامة النص المفقودة → تُستبدَل بـSurfaceGui
		p.CanCollide = false -- لوح شفاف: نمنع جداراً خفيّاً يصطدم به اللاعب
		return
	end
	if is("WN") then
		-- نوافذ الجدار الخلفي تتداخل مع لوحة المتصدّرين والساعة (نفس الجدار)،
		-- فيبان زجاجها كأنه لوح أزرق فوق اللوحة → نخفيها (الجدار المصمت يفضل خلفها).
		p.Transparency = 1
		p.CanCollide = false
		return
	end
	local col, mat, tr = C.GOLD, Enum.Material.Metal, 0
	if n == "Floor" or n == "Step" then
		col, mat = C.FLOORC, Enum.Material.Marble
	elseif n == "RoofSlab" or n == "RoofPyr" then
		col, mat = C.NAVY, Enum.Material.Slate
	elseif is("Wall") then
		col, mat = C.WALL, Enum.Material.SmoothPlastic
	elseif n == "Ceiling" or n == "Lintel" or is("Rugi") or is("ArtOi") then
		col, mat = C.CREAM, Enum.Material.SmoothPlastic
	elseif n == "Carpet" or is("Rug") then
		col, mat = C.REDS, Enum.Material.Fabric
	elseif is("Bench") then
		col, mat = C.WOOD, Enum.Material.WoodPlanks
	elseif is("Bush") then
		col, mat = C.GREEN, Enum.Material.Grass
	elseif is("WE") then
		col, mat, tr = C.GLASS, Enum.Material.Glass, 0.45
	elseif is("Tr") or is("Sk") or n == "SignNeon" then
		col, mat = C.PINK, Enum.Material.Neon
	elseif is("Lan") or is("ChBulb") or n == "ChDisc" then
		col, mat = C.GOLDE, Enum.Material.Neon
	end
	p.Color = rgb(col)
	p.Material = mat
	p.Transparency = tr
end

-- لوحة نصّية على واجهة قطعة (بديل خامة النص التي جُرِّدت)
local function signGui(adornee: BasePart, text: string, ratio: number)
	local g = Instance.new("SurfaceGui")
	g.Name = "Face"
	g.Face = Enum.NormalId.Front
	g.AutoLocalize = false
	g.LightInfluence = 0
	g.CanvasSize = Vector2.new(1024, math.floor(1024 * ratio))
	g.Adornee = adornee
	g.Parent = adornee
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Size = UDim2.fromScale(1, 1)
	l.Font = Enum.Font.GothamBlack
	l.Text = text
	l.RichText = true
	l.TextScaled = true
	l.TextColor3 = GOLD_HI
	l.Parent = g
	local st = Instance.new("UIStroke")
	st.Color = Color3.fromRGB(70, 48, 0)
	st.Thickness = 3
	st.Parent = l
end

local function loadHall(parent: Instance): Model?
	local ok, model
	for attempt = 1, 5 do
		ok, model = pcall(function()
			return InsertService:LoadAsset(HALL_ASSET_ID)
		end)
		if ok and model then break end
		warn("[GamesHall] محاولة تحميل الأصل فشلت", attempt, model)
		task.wait(2)
	end
	if not (ok and model) then
		warn("[GamesHall] تعذّر تحميل أصل المبنى — الطاولات فقط")
		return nil
	end
	model.Name = "GamesHall"
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			d.Anchored = true
			d.CanCollide = true
			paintPart(d)
		end
	end
	local sb = model:FindFirstChild("SignBack", true)
	if sb and sb:IsA("BasePart") then signGui(sb, "🎮 ركن الألعاب", 0.24) end
	local lb = model:FindFirstChild("LBframe", true)
	if lb and lb:IsA("BasePart") then signGui(lb, "🏆 المتصدّرون", 1.25) end
	-- وضع المبنى في مكانه قبل الإظهار (نتفادى وميض إطار واحد)
	local cf, size = model:GetBoundingBox()
	local halfY = size.Y / 2
	local targetCF = CFrame.new(HALL_CENTER.X, HALL_CENTER.Y + halfY, HALL_CENTER.Z)
		* CFrame.Angles(0, HALL_YAW, 0)
	model.WorldPivot = cf
	model:PivotTo(targetCF)
	model.Parent = parent
	return model
end

-- باب مزدوج زجاجي بإطار ذهبي يملأ فتحة المبنى، يفتح بـE للداخل ويُغلق تلقائياً.
local function buildDoor(parent: Instance, model: Model)
	local fL = model:FindFirstChild("DFL", true)
	local fR = model:FindFirstChild("DFR", true)
	if not (fL and fR and fL:IsA("BasePart") and fR:IsA("BasePart")) then return end
	local pL, pR = fL.Position, fR.Position
	local cx = (pL.X + pR.X) / 2
	local dz = pL.Z
	local dh = pL.Y
	local leafW = math.abs(pR.X - pL.X) / 2 - 0.15

	local doorModel = Instance.new("Model")
	doorModel.Name = "EntranceDoor"
	doorModel.Parent = parent

	local leaves: { [number]: { model: Model, closed: CFrame, open: CFrame } } = {}
	for _, s in ipairs({ -1, 1 }) do
		local glassX = cx + s * (leafW / 2)
		local leaf = Instance.new("Model")
		leaf.Name = "Leaf" .. (if s < 0 then "L" else "R")
		leaf.Parent = doorModel
		-- لوح الباب: مصمت كحلي (يُعرَض بوضوح تام مهما كانت الإضاءة/البلوم؛
		-- اللوح الشفاف القديم كان يذوب في الوهج الأبيض فيبان الباب فارغاً)
		-- الأوراق تزيينية فقط (CanCollide=false)؛ الاصطدام موكول لحاجز واحد ثابت
		-- (DoorBarrier) حتى لا تبقى الفتحة قابلة للمرور بعد دوران الأوراق.
		local pane = part({
			Name = "Pane", Parent = leaf, Color = rgb(C.NAVY),
			Material = Enum.Material.SmoothPlastic, Transparency = 0, CanCollide = false,
			Size = Vector3.new(leafW, LEAF_H, 0.22), CFrame = CFrame.new(glassX, dh, dz),
		})
		leaf.PrimaryPart = pane
		-- نافذة زجاجية صغيرة بالأعلى للمسة أنيقة (مؤطّرة فلا تذوب بالوهج)
		local vh = LEAF_H * 0.36
		part({
			Name = "Window", Parent = leaf, Color = Color3.fromRGB(150, 198, 224),
			Material = Enum.Material.SmoothPlastic, Transparency = 0.4, CanCollide = false,
			Size = Vector3.new(leafW - 1.6, vh, 0.12),
			CFrame = CFrame.new(glassX, dh + LEAF_H * 0.22, dz - 0.07),
		})
		-- لوح سفلي مصمت كريمي يعطي ثِقَل الباب ويوضّحه
		local kh = LEAF_H * 0.34
		part({
			Name = "Kick", Parent = leaf, Color = rgb(C.CREAM), Material = Enum.Material.SmoothPlastic,
			CanCollide = false, Size = Vector3.new(leafW - 0.2, kh, 0.34),
			CFrame = CFrame.new(glassX, dh - LEAF_H / 2 + kh / 2, dz),
		})
		-- إطار ذهبي سميك + عارضة وسطية أفقية ورأسية (مَنتِن) لوضوح الباب
		for _, f in ipairs({
			{ Vector3.new(s * (leafW / 2 - 0.35), 0, 0), Vector3.new(0.7, LEAF_H, 0.5) },
			{ Vector3.new(-s * (leafW / 2 - 0.35), 0, 0), Vector3.new(0.7, LEAF_H, 0.5) },
			{ Vector3.new(0, LEAF_H / 2 - 0.35, 0), Vector3.new(leafW, 0.7, 0.5) },
			{ Vector3.new(0, -LEAF_H / 2 + 0.35, 0), Vector3.new(leafW, 0.7, 0.5) },
			{ Vector3.new(0, -LEAF_H / 2 + kh, 0), Vector3.new(leafW, 0.45, 0.5) },
			{ Vector3.new(0, kh / 2, 0), Vector3.new(0.4, LEAF_H - kh, 0.5) },
		}) do
			part({
				Name = "Bar", Parent = leaf, Color = GOLD, Material = Enum.Material.Metal,
				CanCollide = false, Size = f[2],
				CFrame = CFrame.new(glassX + f[1].X, dh + f[1].Y, dz),
			})
		end
		part({
			Name = "Handle", Parent = leaf, Color = GOLD_HI, Material = Enum.Material.Metal,
			CanCollide = false, Size = Vector3.new(0.22, 2.4, 0.45),
			CFrame = CFrame.new(cx - s * 0.55, dh, dz - 0.45),
		})
		-- باب منزلق: لكل ورقة وضعان مطلقان (مغلق=بالوسط، مفتوح=منزلق داخل الجدار).
		-- استبدلنا الدوران بالانزلاق لأن الدوران كان يترك الورقة عالقة على الجانب
		-- (كأنها فاصل) إن انقطعت الحركة؛ الانزلاق دائماً يرجع للوضع المسطّح تماماً.
		local closedCF = CFrame.new(glassX, dh, dz)
		local openCF = CFrame.new(glassX + s * (leafW + 0.6), dh, dz)
		leaf.WorldPivot = closedCF
		leaf:PivotTo(closedCF)
		leaves[s] = { model = leaf, closed = closedCF, open = openCF }
	end

	local anim = Instance.new("NumberValue")
	anim.Parent = doorModel
	local function applyT(t: number)
		for _, s in ipairs({ -1, 1 }) do
			leaves[s].model:PivotTo(leaves[s].closed:Lerp(leaves[s].open, t))
		end
	end
	anim.Changed:Connect(applyT)

	-- حاجز اصطدام غير مرئي يملأ الفتحة: صلب عند الإغلاق فقط.
	-- يفصل الاصطدام عن الأوراق المتحركة فيصير الفتح/الإغلاق حاسماً كل مرة.
	local barrier = part({
		Name = "DoorBarrier", Parent = doorModel, Transparency = 1, CanCollide = true,
		Size = Vector3.new(math.abs(pR.X - pL.X), LEAF_H, 0.6),
		CFrame = CFrame.new(cx, dh, dz),
	})

	local isOpen = false
	local closeTok = 0
	local activeTween: Tween? = nil
	local function setDoor(open: boolean)
		isOpen = open
		barrier.CanCollide = not open
		local goal = open and 1 or 0
		-- إلغاء أي حركة جارية حتى لا تتعارض حركتان (فتح/إغلاق متتاليان)
		if activeTween then activeTween:Cancel() end
		local tw = TweenService:Create(anim,
			TweenInfo.new(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ Value = goal })
		activeTween = tw
		-- ضمان وصول الأوراق لوضعها النهائي بدقّة (مغلق=مسطّح، مفتوح=للجانب)
		-- حتى لو لم تُطلق آخر إشارة Changed → الباب يُقفل بالكامل كل مرة.
		tw.Completed:Connect(function()
			if activeTween == tw then applyT(goal) end
		end)
		tw:Play()
	end

	local hub = part({
		Name = "DoorPrompt", Parent = doorModel, Transparency = 1, CanCollide = false,
		Size = Vector3.new(math.abs(pR.X - pL.X), LEAF_H, 1),
		CFrame = CFrame.new(cx, dh, dz),
	})
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "DoorPrompt"
	prompt.ActionText = "افتح/أغلق الباب"
	prompt.ObjectText = "🎮 ركن الألعاب"
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 12
	prompt.RequiresLineOfSight = false
	prompt.Parent = hub
	prompt.Triggered:Connect(function()
		setDoor(not isOpen)
		if isOpen then
			closeTok += 1
			local mine = closeTok
			task.delay(10, function()
				if mine == closeTok and isOpen then setDoor(false) end
			end)
		end
	end)
end

----------------------------------------------------------------------
-- تأثيث إضافي (قطع أصلية) يكمّل تصميم الميش: ميدالية ترحيب وسط الصالة،
-- إطارات ذهبية للسجاد، أحواض كرز، إضاءة أعمدة، ومدخل خارجي مؤثَّث.
----------------------------------------------------------------------
local FY = 0.86 -- سطح أرضية المبنى (المرمر)
local GY = 0.3  -- أرضية الخارج (العشب)

-- قرص مسطّح (أسطوانة محورها رأسي): props.Size = (السُّمك, القطر, القطر)
local function disc(props): BasePart
	props.Shape = Enum.PartType.Cylinder
	local center = props.CFrame or CFrame.new()
	props.CFrame = center * CFrame.Angles(0, 0, math.rad(90))
	return part(props)
end

-- حوض كرز ثلاثي الأبعاد: إناء ذهبي + جذع + تاج أخضر + أزهار وردية نيون
local function topiary(parent: Instance, x: number, z: number, g: number)
	disc({
		Name = "Pot", Parent = parent, Color = GOLD, Material = Enum.Material.Metal,
		Size = Vector3.new(1.6, 2.0, 2.0), CFrame = CFrame.new(x, g + 0.8, z),
	})
	part({
		Name = "Trunk", Parent = parent, Color = WOOD_DARK, Material = Enum.Material.Wood,
		Size = Vector3.new(0.5, 2.4, 0.5), CFrame = CFrame.new(x, g + 2.6, z),
	})
	local cy = g + 4.4
	local crown = part({
		Name = "Crown", Parent = parent, Color = rgb(C.GREEN), Material = Enum.Material.Grass,
		CanCollide = false, Size = Vector3.new(3.0, 3.0, 3.0), CFrame = CFrame.new(x, cy, z),
	})
	crown.Shape = Enum.PartType.Ball
	for _, o in ipairs({
		Vector3.new(1.0, 0.7, 0), Vector3.new(-1.0, 0.5, 0.7),
		Vector3.new(0, 1.0, -0.9), Vector3.new(0.3, 0.4, 1.0),
	}) do
		local b = part({
			Name = "Blossom", Parent = parent, Color = rgb(C.PINK), Material = Enum.Material.Neon,
			CanCollide = false, Size = Vector3.new(1.7, 1.7, 1.7),
			CFrame = CFrame.new(x + o.X, cy + o.Y, z + o.Z),
		})
		b.Shape = Enum.PartType.Ball
	end
end

local function buildStageLightFallback(parent: Instance): Model
	local model = Instance.new("Model")
	model.Name = "StageLightFixture"
	model.Parent = parent

	part({
		Name = "Base", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Size = Vector3.new(1.4, 1.4, 0.28), CFrame = CFrame.new(0, 0, 0.14),
	})
	disc({
		Name = "BaseRing", Parent = model, Color = GOLD, Material = Enum.Material.Metal,
		Size = Vector3.new(0.18, 1.10, 1.10), CFrame = CFrame.new(0, 0, 0.40),
	})
	part({
		Name = "Post", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Size = Vector3.new(0.54, 0.54, 6.0), CFrame = CFrame.new(0, 0, 3.20),
	})
	part({
		Name = "PostBandLow", Parent = model, Color = GOLD_HI, Material = Enum.Material.Metal,
		CanCollide = false, Size = Vector3.new(0.62, 0.62, 0.12), CFrame = CFrame.new(0, 0, 1.16),
	})
	part({
		Name = "PostBandHigh", Parent = model, Color = GOLD, Material = Enum.Material.Metal,
		CanCollide = false, Size = Vector3.new(0.64, 0.64, 0.12), CFrame = CFrame.new(0, 0, 5.36),
	})
	part({
		Name = "YokeBlock", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Size = Vector3.new(0.90, 0.90, 0.72), CFrame = CFrame.new(0, 0, 6.90),
	})
	part({
		Name = "YokeArmL", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Size = Vector3.new(0.98, 0.24, 0.24), CFrame = CFrame.new(-0.84, 0, 6.90),
	})
	part({
		Name = "YokeArmR", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Size = Vector3.new(0.98, 0.24, 0.24), CFrame = CFrame.new(0.84, 0, 6.90),
	})
	part({
		Name = "YokeJointL", Parent = model, Color = GOLD, Material = Enum.Material.Metal,
		CanCollide = false, Size = Vector3.new(0.18, 0.40, 0.40), CFrame = CFrame.new(-1.17, 0, 6.80),
	})
	part({
		Name = "YokeJointR", Parent = model, Color = GOLD, Material = Enum.Material.Metal,
		CanCollide = false, Size = Vector3.new(0.18, 0.40, 0.40), CFrame = CFrame.new(1.17, 0, 6.80),
	})
	part({
		Name = "HeadPivot", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Size = Vector3.new(0.78, 0.78, 0.66), CFrame = CFrame.new(0, 0, 6.72),
	})
	part({
		Name = "HeadShell", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Size = Vector3.new(1.60, 1.36, 1.00), CFrame = CFrame.new(0, 0, 7.18),
	})
	part({
		Name = "HeadShellBand", Parent = model, Color = GOLD_HI, Material = Enum.Material.Metal,
		CanCollide = false, Size = Vector3.new(0.86, 0.14, 0.86), CFrame = CFrame.new(0, 0, 7.28),
	})
	part({
		Name = "Bezel", Parent = model, Color = GOLD_HI, Material = Enum.Material.Metal,
		Size = Vector3.new(0.62, 0.62, 0.16), CFrame = CFrame.new(0, 0, 7.96),
	})
	part({
		Name = "Lens", Parent = model, Color = rgb(C.GOLDE), Material = Enum.Material.Neon,
		CanCollide = false, Size = Vector3.new(0.68, 0.68, 0.18), CFrame = CFrame.new(0, 0, 8.10),
	})
	part({
		Name = "BeamTip", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Transparency = 1, CanCollide = false, Size = Vector3.new(0.18, 0.18, 0.18), CFrame = CFrame.new(0, 0, 8.58),
	})
	part({
		Name = "RearCap", Parent = model, Color = rgb(C.NAVY), Material = Enum.Material.Metal,
		Size = Vector3.new(0.60, 0.46, 0.46), CFrame = CFrame.new(0, -0.16, 6.98),
	})
	return model
end

local function loadStageLightFixture(parent: Instance): Model
	local ok, model
	for attempt = 1, 5 do
		ok, model = pcall(function()
			return InsertService:LoadAsset(STAGE_LIGHT_ASSET_ID)
		end)
		if ok and model then break end
		warn("[StageLight] محاولة تحميل الأصل فشلت", attempt, model)
		task.wait(2)
	end
	if not (ok and model) then
		warn("[StageLight] تعذّر تحميل الأصل — استخدام بناء احتياطي")
		return buildStageLightFallback(parent)
	end
	model.Name = "StageLightFixture"
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			d.Anchored = true
			d.CanCollide = d.Name == "Post" or d.Name == "Base"
			d.Massless = true
			local n = d.Name
			if n == "Lens" then
				d.Color = rgb(C.GOLDE)
				d.Material = Enum.Material.Neon
				d.CanCollide = false
				d.Transparency = 0.05
			elseif n == "BeamTip" then
				d.Color = rgb(C.NAVY)
				d.Material = Enum.Material.SmoothPlastic
				d.Transparency = 1
				d.CanCollide = false
			elseif n == "Ring" or n == "Bezel" or n == "BaseRing" or n == "PostBandLow" or n == "PostBandHigh" or n == "YokeJointL" or n == "YokeJointR" or n == "HeadShellBand" then
				d.Color = rgb(C.GOLD)
				d.Material = Enum.Material.Metal
				d.CanCollide = false
			else
				d.Color = rgb(C.NAVY)
				d.Material = Enum.Material.Metal
			end
		end
	end
	model.Parent = parent
	return model
end

local function colorForPhase(phase: number): Color3
	local p = phase % 3
	local magenta = Color3.fromRGB(255, 62, 184)
	local gold = Color3.fromRGB(255, 210, 90)
	local cyan = Color3.fromRGB(77, 236, 255)
	if p < 1 then
		return magenta:Lerp(gold, p)
	elseif p < 2 then
		return gold:Lerp(cyan, p - 1)
	else
		return cyan:Lerp(magenta, p - 2)
	end
end

local function attachStageLightFX(model: Model, side: number)
	local headPivot = model:FindFirstChild("HeadPivot", true)
	local lens = model:FindFirstChild("Lens", true)
	local beamTip = model:FindFirstChild("BeamTip", true)
	if not (headPivot and headPivot:IsA("BasePart") and lens and lens:IsA("BasePart") and beamTip and beamTip:IsA("BasePart")) then
		return
	end

	local headParts = {}
	for _, name in ipairs({
		"HeadPivot", "HeadShell", "HeadShellBand", "Bezel", "Lens", "BeamTip", "RearCap",
	}) do
		local p = model:FindFirstChild(name, true)
		if p and p:IsA("BasePart") then
			headParts[#headParts + 1] = p
		end
	end

	local basePivot = headPivot.CFrame
	local baseOffsets = {}
	for _, p in ipairs(headParts) do
		baseOffsets[p] = basePivot:ToObjectSpace(p.CFrame)
	end
	local baseAim = CFrame.Angles(math.rad(-90), 0, 0)

	local origin = lens:FindFirstChild("BeamOrigin")
	if not origin then
		origin = Instance.new("Attachment")
		origin.Name = "BeamOrigin"
		origin.Position = Vector3.new(0, 0, -0.05)
		origin.Parent = lens
	end
	local target = beamTip:FindFirstChild("BeamTarget")
	if not target then
		target = Instance.new("Attachment")
		target.Name = "BeamTarget"
		target.Position = Vector3.new(0, 0, 0.05)
		target.Parent = beamTip
	end

	local beam = lens:FindFirstChild("StageBeam")
	if not beam then
		beam = Instance.new("Beam")
		beam.Name = "StageBeam"
		beam.Attachment0 = origin
		beam.Attachment1 = target
		beam.FaceCamera = true
		beam.LightEmission = 1
		beam.LightInfluence = 0
		beam.Segments = 10
		beam.Width0 = 0.18
		beam.Width1 = 2.0
		beam.Transparency = NumberSequence.new({
			NumberSequenceKeypoint.new(0, 0.15),
			NumberSequenceKeypoint.new(1, 0.94),
		})
		beam.Parent = lens
	end

	local spot = lens:FindFirstChild("StageSpot")
	if not spot then
		spot = Instance.new("SpotLight")
		spot.Name = "StageSpot"
		spot.Angle = 40
		spot.Range = 30
		spot.Brightness = 2.2
		spot.Shadows = false
		spot.Parent = lens
	end

	local sweep = Instance.new("NumberValue")
	sweep.Name = "Sweep"
	sweep.Value = if side < 0 then -24 else 24
	sweep.Parent = model
	local tilt = Instance.new("NumberValue")
	tilt.Name = "Tilt"
	tilt.Value = if side < 0 then -4 else 4
	tilt.Parent = model
	local phase = Instance.new("NumberValue")
	phase.Name = "Phase"
	phase.Value = if side < 0 then 0 else 2
	phase.Parent = model
	local pulse = Instance.new("NumberValue")
	pulse.Name = "Pulse"
	pulse.Value = 1
	pulse.Parent = model

	local function refreshPose()
		local rot = CFrame.Angles(0, math.rad(sweep.Value), 0) * CFrame.Angles(math.rad(tilt.Value), 0, 0) * baseAim
		for p, offset in pairs(baseOffsets) do
			p.CFrame = basePivot * rot * offset
		end
	end
	local function refreshFX()
		local c = colorForPhase(phase.Value)
		beam.Color = ColorSequence.new(c)
		beam.Width0 = 0.18 * pulse.Value
		beam.Width1 = 2.2 * pulse.Value
		spot.Color = c
		spot.Brightness = 2.0 * pulse.Value
		spot.Range = 28 + (pulse.Value * 4)
	end

	sweep.Changed:Connect(refreshPose)
	tilt.Changed:Connect(refreshPose)
	phase.Changed:Connect(refreshFX)
	pulse.Changed:Connect(refreshFX)
	refreshPose()
	refreshFX()

	local sweepTween = TweenService:Create(
		sweep,
		TweenInfo.new(2.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
		{ Value = if side < 0 then 24 else -24 }
	)
	local tiltTween = TweenService:Create(
		tilt,
		TweenInfo.new(1.9, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
		{ Value = if side < 0 then 4 else -4 }
	)
	local phaseTween = TweenService:Create(
		phase,
		TweenInfo.new(6.0, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, -1, false),
		{ Value = if side < 0 then 3 else 5 }
	)
	local pulseTween = TweenService:Create(
		pulse,
		TweenInfo.new(1.4, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
		{ Value = 1.14 }
	)
	sweepTween:Play()
	tiltTween:Play()
	phaseTween:Play()
	pulseTween:Play()
end

local function spawnStageLight(parent: Instance, template: Model, x: number, z: number, g: number, side: number)
	local fixture = template:Clone()
	fixture.Parent = parent
	fixture:PivotTo(CFrame.new(x, g + 3.5, z) * CFrame.Angles(0, math.rad(180), 0))
	attachStageLightFX(fixture, side)
	return fixture
end

-- مقعد خشبي خارجي بسيط
local function bench(parent: Instance, x: number, z: number, g: number)
	part({
		Name = "BenchSeat", Parent = parent, Color = WOOD, Material = Enum.Material.WoodPlanks,
		Size = Vector3.new(5.0, 0.4, 1.6), CFrame = CFrame.new(x, g + 1.6, z),
	})
	part({
		Name = "BenchBack", Parent = parent, Color = WOOD, Material = Enum.Material.WoodPlanks,
		Size = Vector3.new(5.0, 1.6, 0.3), CFrame = CFrame.new(x, g + 2.5, z - 0.65),
	})
	for _, dx in ipairs({ -2.2, 2.2 }) do
		part({
			Name = "BenchLeg", Parent = parent, Color = GOLD, Material = Enum.Material.Metal,
			Size = Vector3.new(0.3, 1.6, 1.4), CFrame = CFrame.new(x + dx, g + 0.8, z),
		})
	end
end

-- مقاطع الجدران (مركز كل جدار + طوله ومتجه «للخارج»). تُستعمل لإضافة
-- حزام كحلي سفلي + خط ذهبي + كورنيش علوي على وجهي كل جدار (داخل وخارج).
-- منسوب أساس الجدار ≈ FY، وقمته ≈ 15.8.
local WALL_SEGMENTS = {
	-- {x, z, axis ("X"|"Z"), length, nx, nz}  (nx,nz = متجه للخارج)
	{ 0, 129.2, "X", 56.8, 0, 1 },     -- الجدار الخلفي
	{ 28, 110.2, "Z", 38.4, 1, 0 },    -- الجدار الجانبي
	{ -28, 110.2, "Z", 38.4, -1, 0 },  -- الجدار الجانبي
	{ 17, 91.2, "X", 22, 0, -1 },      -- واجهة يمين الباب
	{ -17, 91.2, "X", 22, 0, -1 },     -- واجهة يسار الباب
}

-- شريط أفقي على وجه جدار (للخارج بإشارة +1، للداخل بإشارة -1)
local function wallStrip(parent, seg, side, yc, h, t, color, mat)
	local x, z, axis, len, nx, nz = seg[1], seg[2], seg[3], seg[4], seg[5], seg[6]
	local off = (t / 2 + 0.06) * side
	local cx = x + nx * off
	local cz = z + nz * off
	local size = if axis == "X" then Vector3.new(len, h, t) else Vector3.new(t, h, len)
	part({
		Name = "WallTrim", Parent = parent, Color = rgb(color), Material = mat,
		CanCollide = false, Size = size, CFrame = CFrame.new(cx, yc, cz),
	})
end

-- تأطير الجدران: حزام كحلي سفلي + خط ذهبي فوقه (داخل وخارج) + كورنيش ذهبي علوي
local function dressWalls(parent: Instance)
	for _, seg in ipairs(WALL_SEGMENTS) do
		for _, side in ipairs({ 1, -1 }) do
			wallStrip(parent, seg, side, FY + 0.75, 1.5, 0.32, C.NAVY, Enum.Material.SmoothPlastic)
			wallStrip(parent, seg, side, FY + 1.62, 0.18, 0.40, C.GOLD, Enum.Material.Metal)
		end
		-- كورنيش ذهبي علوي (خارجي فقط، تحت السقف)
		wallStrip(parent, seg, 1, 15.3, 0.55, 0.46, C.GOLD, Enum.Material.Metal)
	end
end

-- إطار ذهبي على الأرضية الداخلية حول المحيط (يبيّن الأرضية مصمّمة)
local function dressFloor(parent: Instance)
	local frame = {
		{ 0, 127.5, 53, 0.5 }, { 0, 92.8, 53, 0.5 },
		{ 26.5, 110.2, 0.5, 35 }, { -26.5, 110.2, 0.5, 35 },
	}
	for _, f in ipairs(frame) do
		part({
			Name = "FloorTrim", Parent = parent, Color = GOLD, Material = Enum.Material.Metal,
			CanCollide = false, Size = Vector3.new(f[3], 0.12, f[4]),
			CFrame = CFrame.new(f[1], FY + 0.06, f[2]),
		})
	end
end

local function furnishHall(parent: Instance)
	dressWalls(parent)
	dressFloor(parent)
	-- ميدالية ترحيب وسط الصالة (بين الباب والطاولات) z≈99
	disc({
		Name = "MedalEdge", Parent = parent, Color = GOLD, Material = Enum.Material.Metal,
		Size = Vector3.new(0.12, 11, 11), CFrame = CFrame.new(0, FY + 0.06, 99),
	})
	disc({
		Name = "MedalInner", Parent = parent, Color = rgb(C.CREAM), Material = Enum.Material.Marble,
		CanCollide = false, Size = Vector3.new(0.16, 9.4, 9.4), CFrame = CFrame.new(0, FY + 0.08, 99),
	})
	disc({
		Name = "MedalRing", Parent = parent, Color = rgb(C.PINK), Material = Enum.Material.Neon,
		CanCollide = false, Size = Vector3.new(0.2, 7.6, 7.6), CFrame = CFrame.new(0, FY + 0.10, 99),
	})
	disc({
		Name = "MedalRing2", Parent = parent, Color = rgb(C.CREAM), Material = Enum.Material.Marble,
		CanCollide = false, Size = Vector3.new(0.24, 6.8, 6.8), CFrame = CFrame.new(0, FY + 0.12, 99),
	})
	-- شعار O على يسار الميدالية
	disc({
		Name = "EmblemO", Parent = parent, Color = GOLD, Material = Enum.Material.Neon,
		CanCollide = false, Size = Vector3.new(0.3, 2.6, 2.6), CFrame = CFrame.new(-1.9, FY + 0.16, 99),
	})
	disc({
		Name = "EmblemOc", Parent = parent, Color = rgb(C.CREAM), Material = Enum.Material.Marble,
		CanCollide = false, Size = Vector3.new(0.34, 1.5, 1.5), CFrame = CFrame.new(-1.9, FY + 0.18, 99),
	})
	-- شعار X على يمين الميدالية
	for _, a in ipairs({ 45, -45 }) do
		part({
			Name = "EmblemX", Parent = parent, Color = GOLD, Material = Enum.Material.Neon,
			CanCollide = false, Size = Vector3.new(2.6, 0.12, 0.55),
			CFrame = CFrame.new(1.9, FY + 0.16, 99) * CFrame.Angles(0, math.rad(a), 0),
		})
	end
	-- إطار ذهبي على جانبي ممر السجاد الأحمر
	for _, sx in ipairs({ -1, 1 }) do
		part({
			Name = "RunnerTrim", Parent = parent, Color = GOLD, Material = Enum.Material.Neon,
			CanCollide = false, Size = Vector3.new(0.18, 0.08, 16),
			CFrame = CFrame.new(sx * 3.7, FY + 0.05, 101),
		})
	end
	-- حوضا كرز يحيطان الميدالية
	topiary(parent, 7, 99, FY)
	topiary(parent, -7, 99, FY)
	-- إضاءة وردية عند قواعد الأعمدة الأربعة
	for _, cxp in ipairs({ -26, 26 }) do
		for _, czp in ipairs({ 94, 126 }) do
			local pk = disc({
				Name = "Uplight", Parent = parent, Color = rgb(C.PINK), Material = Enum.Material.Neon,
				CanCollide = false, Size = Vector3.new(0.14, 2.2, 2.2), CFrame = CFrame.new(cxp, FY + 0.05, czp),
			})
			local pl = Instance.new("PointLight")
			pl.Color = Color3.fromRGB(255, 150, 200)
			pl.Range = 12
			pl.Brightness = 1.4
			pl.Parent = pk
		end
	end

	-- ===== مدخل خارجي مؤثَّث =====
	-- سجادة ترحيب حمراء من الدرجة نحو السبون
	part({
		Name = "WelcomeRunner", Parent = parent, Color = rgb(C.REDS), Material = Enum.Material.Fabric,
		CanCollide = false, Size = Vector3.new(7, 0.14, 11), CFrame = CFrame.new(0, GY + 0.07, 83),
	})
	for _, sx in ipairs({ -1, 1 }) do
		part({
			Name = "RunnerTrimO", Parent = parent, Color = GOLD, Material = Enum.Material.Neon,
			CanCollide = false, Size = Vector3.new(0.18, 0.1, 11), CFrame = CFrame.new(sx * 3.4, GY + 0.1, 83),
		})
	end
	local stageLightTemplate = loadStageLightFixture(parent)
	-- كشافان ضوئيان متحرّكان يحيطان الباب + حوضا كرز + مقعدان
	spawnStageLight(parent, stageLightTemplate, 7, 87, GY, 1)
	spawnStageLight(parent, stageLightTemplate, -7, 87, GY, -1)
	stageLightTemplate:Destroy()
	topiary(parent, 9.5, 85, GY)
	topiary(parent, -9.5, 85, GY)
	bench(parent, 13, 83, GY)
	bench(parent, -13, 83, GY)
end

----------------------------------------------------------------------
-- التهيئة
----------------------------------------------------------------------
local root = Instance.new("Folder")
root.Name = "TicTacToeArea"
root.Parent = Workspace

local hall = loadHall(root)
if hall then
	buildDoor(root, hall)
	furnishHall(root)
end

for _, origin in ipairs(TABLES) do
	games[#games + 1] = buildTable(origin, root)
end

-- تنظيف عند خروج لاعب (يحرّر مقعده ويعيد ضبط طاولته)
Players.PlayerRemoving:Connect(function(player)
	for _, g in ipairs(games) do
		if g.playerX == player or g.playerO == player then
			task.defer(function() refreshSeats(g) end)
		end
	end
end)

print("[TicTacToe] جاهز — " .. #games .. " طاولات إكس-أو ثلاثية الأبعاد.")
