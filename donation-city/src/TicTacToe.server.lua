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

local CELL      = 1.7        -- مسافة بين مراكز المربّعات
local TABLE_TOP_Y = 3.0      -- ارتفاع سطح الطاولة فوق الأرضية
local WIN_LINES = {
	{ 1, 2, 3 }, { 4, 5, 6 }, { 7, 8, 9 },   -- صفوف
	{ 1, 4, 7 }, { 2, 5, 8 }, { 3, 6, 9 },   -- أعمدة
	{ 1, 5, 9 }, { 3, 5, 7 },                -- أقطار
}

-- مواقع الطاولات الثلاث (قرب السبون عند z=45، النافورة بالوسط) — صفّ خلف السبون
local TABLES = {
	Vector3.new(-26, 0, 70),
	Vector3.new(0,   0, 70),
	Vector3.new(26,  0, 70),
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
-- رموز اللعب المجسّمة (X / O) فوق مربّع
----------------------------------------------------------------------
local function buildX(center: CFrame, parent: Instance): Model
	local m = Instance.new("Model")
	m.Name = "Mark_X"
	m.Parent = parent
	for _, rot in ipairs({ 45, -45 }) do
		part({
			Name = "Bar", Parent = m, Color = X_COL, Material = Enum.Material.Neon,
			Size = Vector3.new(0.34, 1.5, 0.34), CanCollide = false,
			CFrame = center * CFrame.new(0, 0.75, 0) * CFrame.Angles(0, 0, math.rad(rot)),
		})
	end
	return m
end

local function buildO(center: CFrame, parent: Instance): Model
	local m = Instance.new("Model")
	m.Name = "Mark_O"
	m.Parent = parent
	local seg = 14
	local r = 0.62
	for i = 0, seg - 1 do
		local a = (i / seg) * math.pi * 2
		part({
			Name = "Seg", Parent = m, Color = O_COL, Material = Enum.Material.Neon,
			Size = Vector3.new(0.30, 0.30, 0.32), CanCollide = false,
			CFrame = center * CFrame.new(math.cos(a) * r, 0.7, math.sin(a) * r),
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

	-- سطر وصفي صغير
	local sub = Instance.new("TextLabel")
	sub.BackgroundTransparency = 1
	sub.Size = UDim2.new(1, -40, 0.13, 0)
	sub.Position = UDim2.new(0, 20, 0.40, 0)
	sub.Font = Enum.Font.GothamMedium
	sub.TextScaled = true
	sub.Text = "طاولة المدينة الملكية"
	sub.TextColor3 = Color3.fromRGB(190, 200, 215)
	sub.TextTransparency = 0.15
	sub.Parent = pad

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

	return status
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
	pieceFolder: Folder,
	lineGlow: { BasePart },
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

local function endMatch(g: Game, result: string, line: { number }?)
	g.active = false
	if result == "draw" then
		g.statusLabel.Text = "🤝 تعادل! اضغط أي مربّع لإعادة اللعب"
		g.statusLabel.TextColor3 = GOLD
	else
		local col = result == "X" and X_COL or O_COL
		g.statusLabel.Text = (result == "X" and "🔴 فاز الأحمر (X)!" or "🔵 فاز الأزرق (O)!")
		g.statusLabel.TextColor3 = col
		if line then
			for _, idx in ipairs(line) do
				local cell = g.cells[idx]
				local glow = cell:FindFirstChild("CellGlow") :: BasePart?
				if glow then
					glow.Color = col
					glow.Transparency = 0.15
				end
			end
		end
	end
end

local function placeMark(g: Game, idx: number, symbol: string)
	g.board[idx] = symbol
	local cellCF = g.cells[idx].CFrame
	local mark = symbol == "X" and buildX(cellCF, g.pieceFolder) or buildO(cellCF, g.pieceFolder)
	g.marks[idx] = mark
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
	local statusLabel = buildStatusBoard(origin, model)

	local game: Game = {
		cells = cells, marks = {}, board = {},
		seatX = seatX, seatO = seatO,
		playerX = nil, playerO = nil,
		turn = "X", active = false,
		statusLabel = statusLabel, pieceFolder = pieceFolder, lineGlow = {},
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
-- التهيئة
----------------------------------------------------------------------
local root = Instance.new("Folder")
root.Name = "TicTacToeArea"
root.Parent = Workspace

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
