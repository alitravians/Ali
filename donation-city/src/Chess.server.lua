--[[
╔══════════════════════════════════════════════════════════════════════╗
║  CHESS — لعبة الشطرنج ثلاثية الأبعاد (Server)                          ║
║                                                                        ║
║  لوح 8×8 احترافي في «منطقة الشطرنج» بركن الألعاب، بقطع Staunton مجسّمة  ║
║  مصمّمة في بلندر (FBX عبر Open Cloud) ومُعاد صبغها أبيض/أسود.           ║
║                                                                        ║
║  • محرّك شطرنج لوا نقي مُتحقَّق منه باختبار perft (٦ أوضاع دولية).        ║
║    يطبّق كل القواعد: حركات قانونية، كش/كش مات/جمود، تبييت،              ║
║    أخذ بالمرور، ترقية البيدق، ومنع أي نقلة تترك الملك في كش.            ║
║  • كرسيّان (أبيض/أسود). تجلس → تنضمّ. تنقر قطعتك → تُبرَز النقلات        ║
║    القانونية (نقاط خضراء/حلقات حمراء للأسر) ثم تنقر الوجهة فتنتقل بنعومة.║
║  • لوحة حالة: دور من؟ كش؟ النتيجة + عدّاد الأسرى + آخر نقلة + أصوات.     ║
║                                                                        ║
║  القطع ميش بلندر؛ بقية الهيكل قطع روبلوكس مثبّتة = صفر لاق.              ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")
local InsertService = game:GetService("InsertService")

----------------------------------------------------------------------
-- ⚙️ محرّك الشطرنج (منقول حرفيّاً من chess_core.lua المُتحقَّق منه perft)
--    اللوح: 64 مربّعاً 1..64، sq = rank*8 + file + 1 (file,rank = 0..7).
--    القطعة عدد بإشارة: النوع 1..6 = P,N,B,R,Q,K، أبيض +، أسود -، 0 فارغ.
----------------------------------------------------------------------
local Chess = (function()
	local M = {}

	local PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING = 1, 2, 3, 4, 5, 6
	M.PAWN, M.KNIGHT, M.BISHOP, M.ROOK, M.QUEEN, M.KING = PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING
	M.WHITE, M.BLACK = 1, -1

	local function fileOf(sq) return (sq - 1) % 8 end
	local function rankOf(sq) return math.floor((sq - 1) / 8) end
	local function sqOf(file, rank) return rank * 8 + file + 1 end
	local function inBoard(file, rank) return file >= 0 and file <= 7 and rank >= 0 and rank <= 7 end
	M.fileOf, M.rankOf, M.sqOf = fileOf, rankOf, sqOf

	local function ptype(p) return p < 0 and -p or p end
	local function pcolor(p) if p > 0 then return 1 elseif p < 0 then return -1 else return 0 end end
	M.ptype, M.pcolor = ptype, pcolor

	local KNIGHT_D = { {1,2},{2,1},{2,-1},{1,-2},{-1,-2},{-2,-1},{-2,1},{-1,2} }
	local KING_D   = { {1,0},{1,1},{0,1},{-1,1},{-1,0},{-1,-1},{0,-1},{1,-1} }
	local BISHOP_D = { {1,1},{-1,1},{-1,-1},{1,-1} }
	local ROOK_D   = { {1,0},{-1,0},{0,1},{0,-1} }

	local State = {}
	State.__index = State
	M.State = State

	function M.newGame()
		local s = setmetatable({}, State)
		s.board = {}
		for i = 1, 64 do s.board[i] = 0 end
		local back = { ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK }
		for f = 0, 7 do
			s.board[sqOf(f, 0)] = back[f + 1]
			s.board[sqOf(f, 1)] = PAWN
			s.board[sqOf(f, 6)] = -PAWN
			s.board[sqOf(f, 7)] = -back[f + 1]
		end
		s.side = 1
		s.castle = { wk = true, wq = true, bk = true, bq = true }
		s.ep = 0
		s.half = 0
		s.full = 1
		return s
	end

	function State:clone()
		local s = setmetatable({}, State)
		s.board = {}
		for i = 1, 64 do s.board[i] = self.board[i] end
		s.side = self.side
		s.castle = { wk = self.castle.wk, wq = self.castle.wq, bk = self.castle.bk, bq = self.castle.bq }
		s.ep = self.ep
		s.half = self.half
		s.full = self.full
		return s
	end

	function State:isAttacked(sq, by)
		local b = self.board
		local tf, tr = fileOf(sq), rankOf(sq)
		local pr = tr - by
		for _, df in ipairs({ -1, 1 }) do
			local f = tf + df
			if inBoard(f, pr) then
				if b[sqOf(f, pr)] == by * PAWN then return true end
			end
		end
		for _, d in ipairs(KNIGHT_D) do
			local f, r = tf + d[1], tr + d[2]
			if inBoard(f, r) and b[sqOf(f, r)] == by * KNIGHT then return true end
		end
		for _, d in ipairs(KING_D) do
			local f, r = tf + d[1], tr + d[2]
			if inBoard(f, r) and b[sqOf(f, r)] == by * KING then return true end
		end
		for _, d in ipairs(BISHOP_D) do
			local f, r = tf + d[1], tr + d[2]
			while inBoard(f, r) do
				local p = b[sqOf(f, r)]
				if p ~= 0 then
					if pcolor(p) == by and (ptype(p) == BISHOP or ptype(p) == QUEEN) then return true end
					break
				end
				f, r = f + d[1], r + d[2]
			end
		end
		for _, d in ipairs(ROOK_D) do
			local f, r = tf + d[1], tr + d[2]
			while inBoard(f, r) do
				local p = b[sqOf(f, r)]
				if p ~= 0 then
					if pcolor(p) == by and (ptype(p) == ROOK or ptype(p) == QUEEN) then return true end
					break
				end
				f, r = f + d[1], r + d[2]
			end
		end
		return false
	end

	function State:kingSquare(color)
		for i = 1, 64 do
			if self.board[i] == color * KING then return i end
		end
		return 0
	end

	function State:inCheck(color)
		local ks = self:kingSquare(color)
		if ks == 0 then return false end
		return self:isAttacked(ks, -color)
	end

	local function addSliding(s, from, dirs, moves, me)
		local b = s.board
		local f0, r0 = fileOf(from), rankOf(from)
		for _, d in ipairs(dirs) do
			local f, r = f0 + d[1], r0 + d[2]
			while inBoard(f, r) do
				local to = sqOf(f, r)
				local p = b[to]
				if p == 0 then
					moves[#moves + 1] = { from = from, to = to, flag = "normal" }
				else
					if pcolor(p) ~= me then moves[#moves + 1] = { from = from, to = to, flag = "normal" } end
					break
				end
				f, r = f + d[1], r + d[2]
			end
		end
	end

	function State:pseudoMoves()
		local moves = {}
		local b = self.board
		local me = self.side
		for from = 1, 64 do
			local p = b[from]
			if p ~= 0 and pcolor(p) == me then
				local t = ptype(p)
				local f0, r0 = fileOf(from), rankOf(from)
				if t == PAWN then
					local dir = me
					local startRank = (me == 1) and 1 or 6
					local promoRank = (me == 1) and 7 or 0
					local r1 = r0 + dir
					if inBoard(f0, r1) and b[sqOf(f0, r1)] == 0 then
						if r1 == promoRank then
							for _, pr in ipairs({ QUEEN, ROOK, BISHOP, KNIGHT }) do
								moves[#moves + 1] = { from = from, to = sqOf(f0, r1), promo = pr, flag = "promo" }
							end
						else
							moves[#moves + 1] = { from = from, to = sqOf(f0, r1), flag = "normal" }
							if r0 == startRank and b[sqOf(f0, r0 + 2 * dir)] == 0 then
								moves[#moves + 1] = { from = from, to = sqOf(f0, r0 + 2 * dir), flag = "double" }
							end
						end
					end
					for _, df in ipairs({ -1, 1 }) do
						local f = f0 + df
						if inBoard(f, r1) then
							local to = sqOf(f, r1)
							local cp = b[to]
							if cp ~= 0 and pcolor(cp) ~= me then
								if r1 == promoRank then
									for _, pr in ipairs({ QUEEN, ROOK, BISHOP, KNIGHT }) do
										moves[#moves + 1] = { from = from, to = to, promo = pr, flag = "promo" }
									end
								else
									moves[#moves + 1] = { from = from, to = to, flag = "normal" }
								end
							elseif to == self.ep and self.ep ~= 0 then
								moves[#moves + 1] = { from = from, to = to, flag = "ep" }
							end
						end
					end
				elseif t == KNIGHT then
					for _, d in ipairs(KNIGHT_D) do
						local f, r = f0 + d[1], r0 + d[2]
						if inBoard(f, r) then
							local to = sqOf(f, r)
							if b[to] == 0 or pcolor(b[to]) ~= me then
								moves[#moves + 1] = { from = from, to = to, flag = "normal" }
							end
						end
					end
				elseif t == BISHOP then
					addSliding(self, from, BISHOP_D, moves, me)
				elseif t == ROOK then
					addSliding(self, from, ROOK_D, moves, me)
				elseif t == QUEEN then
					addSliding(self, from, BISHOP_D, moves, me)
					addSliding(self, from, ROOK_D, moves, me)
				elseif t == KING then
					for _, d in ipairs(KING_D) do
						local f, r = f0 + d[1], r0 + d[2]
						if inBoard(f, r) then
							local to = sqOf(f, r)
							if b[to] == 0 or pcolor(b[to]) ~= me then
								moves[#moves + 1] = { from = from, to = to, flag = "normal" }
							end
						end
					end
					local rank = (me == 1) and 0 or 7
					if from == sqOf(4, rank) and not self:isAttacked(from, -me) then
						local canK, canQ
						if me == 1 then canK, canQ = self.castle.wk, self.castle.wq else canK, canQ = self.castle.bk, self.castle.bq end
						if canK and b[sqOf(5, rank)] == 0 and b[sqOf(6, rank)] == 0
							and b[sqOf(7, rank)] == me * ROOK
							and not self:isAttacked(sqOf(5, rank), -me)
							and not self:isAttacked(sqOf(6, rank), -me) then
							moves[#moves + 1] = { from = from, to = sqOf(6, rank), flag = "cK" }
						end
						if canQ and b[sqOf(3, rank)] == 0 and b[sqOf(2, rank)] == 0 and b[sqOf(1, rank)] == 0
							and b[sqOf(0, rank)] == me * ROOK
							and not self:isAttacked(sqOf(3, rank), -me)
							and not self:isAttacked(sqOf(2, rank), -me) then
							moves[#moves + 1] = { from = from, to = sqOf(2, rank), flag = "cQ" }
						end
					end
				end
			end
		end
		return moves
	end

	function State:make(mv)
		local b = self.board
		local me = self.side
		local from, to = mv.from, mv.to
		local moving = b[from]
		local undo = {
			from = from, to = to, moving = moving, captured = b[to],
			flag = mv.flag, promo = mv.promo,
			ep = self.ep, castle = { wk = self.castle.wk, wq = self.castle.wq, bk = self.castle.bk, bq = self.castle.bq },
			half = self.half, full = self.full, epCapSq = 0,
		}
		b[to] = moving
		b[from] = 0
		if mv.flag == "ep" then
			local capSq = sqOf(fileOf(to), rankOf(from))
			undo.epCapSq = capSq
			undo.captured = b[capSq]
			b[capSq] = 0
		end
		if mv.flag == "promo" then
			b[to] = me * mv.promo
		end
		if mv.flag == "cK" then
			local rank = rankOf(from)
			b[sqOf(5, rank)] = me * ROOK
			b[sqOf(7, rank)] = 0
		elseif mv.flag == "cQ" then
			local rank = rankOf(from)
			b[sqOf(3, rank)] = me * ROOK
			b[sqOf(0, rank)] = 0
		end
		local function lose(sq)
			if sq == sqOf(4, 0) then self.castle.wk = false; self.castle.wq = false end
			if sq == sqOf(4, 7) then self.castle.bk = false; self.castle.bq = false end
			if sq == sqOf(7, 0) then self.castle.wk = false end
			if sq == sqOf(0, 0) then self.castle.wq = false end
			if sq == sqOf(7, 7) then self.castle.bk = false end
			if sq == sqOf(0, 7) then self.castle.bq = false end
		end
		lose(from); lose(to)
		if mv.flag == "double" then
			self.ep = sqOf(fileOf(from), rankOf(from) + me)
		else
			self.ep = 0
		end
		if ptype(moving) == PAWN or undo.captured ~= 0 then self.half = 0 else self.half = self.half + 1 end
		if me == -1 then self.full = self.full + 1 end
		self.side = -me
		return undo
	end

	function State:unmake(undo)
		local b = self.board
		self.side = -self.side
		local me = self.side
		local from, to = undo.from, undo.to
		b[from] = undo.moving
		if undo.flag == "ep" then
			b[to] = 0
			b[undo.epCapSq] = undo.captured
		else
			b[to] = undo.captured
		end
		if undo.flag == "cK" then
			local rank = rankOf(from)
			b[sqOf(7, rank)] = me * ROOK
			b[sqOf(5, rank)] = 0
		elseif undo.flag == "cQ" then
			local rank = rankOf(from)
			b[sqOf(0, rank)] = me * ROOK
			b[sqOf(3, rank)] = 0
		end
		self.ep = undo.ep
		self.castle = undo.castle
		self.half = undo.half
		self.full = undo.full
	end

	function State:legalMoves()
		local me = self.side
		local out = {}
		local pseudo = self:pseudoMoves()
		for _, mv in ipairs(pseudo) do
			local undo = self:make(mv)
			if not self:inCheck(me) then out[#out + 1] = mv end
			self:unmake(undo)
		end
		return out
	end

	function State:status()
		local legal = self:legalMoves()
		local chk = self:inCheck(self.side)
		if #legal == 0 then
			if chk then return "checkmate" else return "stalemate" end
		end
		if chk then return "check" end
		return "ok"
	end

	function M.perft(s, depth)
		if depth == 0 then return 1 end
		local nodes = 0
		local moves = s:legalMoves()
		for _, mv in ipairs(moves) do
			local undo = s:make(mv)
			nodes = nodes + M.perft(s, depth - 1)
			s:unmake(undo)
		end
		return nodes
	end

	return M
end)()

----------------------------------------------------------------------
-- 🎨 الثوابت والألوان
----------------------------------------------------------------------
local CHESS_ASSET_ID = 129013574031834       -- مجموعة قطع Staunton (مُعتمَدة)

local WOOD      = Color3.fromRGB(74, 48, 28)
local GOLD      = Color3.fromRGB(214, 175, 92)
local GOLD_HI   = Color3.fromRGB(245, 220, 150)
local LIGHT_SQ  = Color3.fromRGB(232, 214, 178)   -- مربّع فاتح
local DARK_SQ   = Color3.fromRGB(120, 80, 48)     -- مربّع غامق
local WHITE_PC  = Color3.fromRGB(236, 224, 192)   -- قطعة بيضاء (عاج/بقس)
local BLACK_PC  = Color3.fromRGB(40, 37, 40)      -- قطعة سوداء (أبنوس)
local SEAT_W    = Color3.fromRGB(206, 196, 170)
local SEAT_B    = Color3.fromRGB(44, 42, 48)
local HINT_MOVE = Color3.fromRGB(96, 220, 120)    -- وجهة فارغة
local HINT_CAP  = Color3.fromRGB(232, 96, 96)     -- وجهة أسر
local SEL_COL   = Color3.fromRGB(240, 214, 96)    -- المربّع المحدّد

-- مؤثّرات صوتية (أصول موجودة فعلاً باللعبة)
local SND_MOVE = "rbxassetid://9125402735"
local SND_WIN  = "rbxassetid://9114066858"

local CELL = 1.85                  -- مقاس المربّع (studs)
local N = 8
local HALF = N * CELL / 2
local TABLE_TOP_Y = 3.0            -- ارتفاع سطح الطاولة فوق الأرضية
local KING_TARGET_H = 2.5          -- ارتفاع الملك المطلوب (تُقاس بقيّة القطع نسبةً له)

-- مركز اللوح داخل «منطقة الشطرنج» (يمين الصالة). الأبيض جهة -Z (جنوب).
-- y=0.8 = سطح أرضية الصالة (نفس ارتفاع طاولات إكس-أو).
local ORIGIN = Vector3.new(14, 0.8, 110)
local TOP_Y = ORIGIN.Y + TABLE_TOP_Y + 0.32   -- سطح اللعب (فوق اللبادة)

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

local function playSound(adornee: BasePart, id: string, volume: number, speed: number)
	local s = Instance.new("Sound")
	s.SoundId = id
	s.Volume = volume
	s.PlaybackSpeed = speed
	s.RollOffMaxDistance = 70
	s.Parent = adornee
	s:Play()
	Debris:AddItem(s, 5)
end

-- إحداثيّات مركز سطح المربّع sq (1..64)
local function squareCenter(sq: number): Vector3
	local f, r = Chess.fileOf(sq), Chess.rankOf(sq)
	local x = ORIGIN.X - HALF + (f + 0.5) * CELL
	local z = ORIGIN.Z - HALF + (r + 0.5) * CELL
	return Vector3.new(x, TOP_Y, z)
end

-- ترميز جبري لمربّع (a1..h8)
local FILE_CH = { "a", "b", "c", "d", "e", "f", "g", "h" }
local function algebraic(sq: number): string
	return FILE_CH[Chess.fileOf(sq) + 1] .. tostring(Chess.rankOf(sq) + 1)
end

----------------------------------------------------------------------
-- قوالب القطع (ميش بلندر عبر Open Cloud) — تُحمَّل مرّة وتُستنسَخ
----------------------------------------------------------------------
local PIECE_NAME = {
	[Chess.PAWN] = "Pawn", [Chess.KNIGHT] = "Knight", [Chess.BISHOP] = "Bishop",
	[Chess.ROOK] = "Rook", [Chess.QUEEN] = "Queen", [Chess.KING] = "King",
}
local pieceTemplates: { [string]: BasePart } = {}
local pieceScale = 1.0

local function loadPieceTemplates(): boolean
	local ok, model
	for attempt = 1, 5 do
		ok, model = pcall(function()
			return InsertService:LoadAsset(CHESS_ASSET_ID)
		end)
		if ok and model then break end
		warn("[Chess] فشل تحميل أصل القطع، محاولة", attempt, model)
		task.wait(2)
	end
	if not (ok and model) then
		warn("[Chess] تعذّر تحميل أصل القطع")
		return false
	end
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			for _, name in pairs(PIECE_NAME) do
				if d.Name == name and not pieceTemplates[name] then
					d.Anchored = true
					pieceTemplates[name] = d
				end
			end
		end
	end
	model:Destroy()  -- أبقينا القوالب فقط؛ نستنسخها عند الحاجة
	local king = pieceTemplates["King"]
	if not king then
		warn("[Chess] قالب الملك مفقود في الأصل")
		return false
	end
	pieceScale = KING_TARGET_H / king.Size.Y
	return true
end

----------------------------------------------------------------------
-- حالة اللعبة (طاولة واحدة)
----------------------------------------------------------------------
type Game = {
	state: any,
	models: { BasePart? },            -- نموذج القطعة على كل مربّع (1..64)
	cells: { BasePart },
	active: boolean,
	over: boolean,
	whiteSeat: Seat,
	blackSeat: Seat,
	whitePlayer: Player?,
	blackPlayer: Player?,
	selected: number?,                -- المربّع المحدّد حاليّاً
	hintTargets: { [number]: any },   -- destSq -> move (للنقلة المختارة)
	hintParts: { BasePart },
	statusLabel: TextLabel,
	lastLabel: TextLabel,
	capWLabel: TextLabel,
	capBLabel: TextLabel,
	capW: number,                     -- عدد القطع التي أسرها الأبيض
	capB: number,
	pieceFolder: Folder,
	statusOverText: string?,
}

local G: Game

----------------------------------------------------------------------
-- إنشاء/إزالة نماذج القطع
----------------------------------------------------------------------
local function makePiece(pieceVal: number, sq: number): BasePart?
	local t = Chess.ptype(pieceVal)
	local template = pieceTemplates[PIECE_NAME[t]]
	if not template then return nil end
	local pc = template:Clone()
	pc.Name = "Piece"
	pc.Anchored = true
	pc.CanCollide = false
	pc.CastShadow = true
	pc.Material = Enum.Material.SmoothPlastic
	pc.Color = (pieceVal > 0) and WHITE_PC or BLACK_PC
	pc.Size = template.Size * pieceScale
	local center = squareCenter(sq)
	local yaw = (pieceVal > 0) and 0 or math.pi  -- الأسود يستدير ليواجه الأبيض
	pc.CFrame = CFrame.new(center.X, TOP_Y + pc.Size.Y / 2, center.Z) * CFrame.Angles(0, yaw, 0)
	pc.Parent = G.pieceFolder
	return pc
end

local function clearModels()
	for i = 1, 64 do
		local m = G.models[i]
		if m then m:Destroy() end
		G.models[i] = nil
	end
end

local function buildPosition()
	clearModels()
	for sq = 1, 64 do
		local v = G.state.board[sq]
		if v ~= 0 then
			G.models[sq] = makePiece(v, sq)
		end
	end
end

----------------------------------------------------------------------
-- تظليل النقلات القانونية
----------------------------------------------------------------------
local function clearHints()
	for _, p in ipairs(G.hintParts) do
		if p and p.Parent then p:Destroy() end
	end
	G.hintParts = {}
	G.hintTargets = {}
	if G.selected then
		local glow = G.cells[G.selected]:FindFirstChild("CellGlow")
		if glow and glow:IsA("BasePart") then glow.Transparency = 1 end
	end
end

local function showHints(fromSq: number)
	clearHints()
	G.selected = fromSq
	-- إبراز المربّع المحدّد
	local glow = G.cells[fromSq]:FindFirstChild("CellGlow")
	if glow and glow:IsA("BasePart") then
		glow.Color = SEL_COL
		glow.Transparency = 0.35
	end
	-- النقلات القانونية من هذا المربّع (نختار الترقية وزيراً افتراضاً)
	for _, mv in ipairs(G.state:legalMoves()) do
		if mv.from == fromSq then
			local existing = G.hintTargets[mv.to]
			if not existing or mv.promo == Chess.QUEEN then
				G.hintTargets[mv.to] = mv
			end
		end
	end
	for destSq, mv in pairs(G.hintTargets) do
		local center = squareCenter(destSq)
		local isCap = (G.state.board[destSq] ~= 0) or mv.flag == "ep"
		if isCap then
			-- حلقة حمراء حول قطعة الأسر
			local ring = part({
				Name = "Hint", Parent = G.pieceFolder, Color = HINT_CAP, Material = Enum.Material.Neon,
				CanCollide = false, Transparency = 0.25,
				Size = Vector3.new(CELL * 0.92, 0.08, CELL * 0.92),
				CFrame = CFrame.new(center.X, TOP_Y + 0.06, center.Z),
			})
			G.hintParts[#G.hintParts + 1] = ring
		else
			-- نقطة خضراء على المربّع الفارغ
			local dot = part({
				Name = "Hint", Parent = G.pieceFolder, Color = HINT_MOVE, Material = Enum.Material.Neon,
				CanCollide = false, Transparency = 0.15, Shape = Enum.PartType.Cylinder,
				Size = Vector3.new(0.12, CELL * 0.42, CELL * 0.42),
				CFrame = CFrame.new(center.X, TOP_Y + 0.1, center.Z) * CFrame.Angles(0, 0, math.rad(90)),
			})
			G.hintParts[#G.hintParts + 1] = dot
		end
	end
end

----------------------------------------------------------------------
-- لوحة الحالة
----------------------------------------------------------------------
local function setStatus()
	local lbl = G.statusLabel
	if not G.active then
		if G.over then
			lbl.Text = G.statusOverText or "انتهت المباراة — اجلسا للّعب مجدّداً"
		elseif G.whitePlayer or G.blackPlayer then
			lbl.Text = "بانتظار لاعب ثانٍ…"
			lbl.TextColor3 = GOLD
		else
			lbl.Text = "اجلس على كرسيّ للّعب"
			lbl.TextColor3 = LIGHT_SQ
		end
		return
	end
	local chk = G.state:inCheck(G.state.side)
	if G.state.side == 1 then
		lbl.Text = chk and "♔ دور الأبيض — كش!" or "♔ دور الأبيض"
		lbl.TextColor3 = Color3.fromRGB(245, 240, 220)
	else
		lbl.Text = chk and "♚ دور الأسود — كش!" or "♚ دور الأسود"
		lbl.TextColor3 = Color3.fromRGB(170, 170, 180)
	end
end

local function updateCaptures()
	G.capWLabel.Text = "♔ أسر: " .. G.capW
	G.capBLabel.Text = "♚ أسر: " .. G.capB
end

----------------------------------------------------------------------
-- بدء/إنهاء المباراة
----------------------------------------------------------------------
local function startMatch()
	G.state = Chess.newGame()
	G.active = true
	G.over = false
	G.selected = nil
	G.statusOverText = nil
	G.capW = 0
	G.capB = 0
	clearHints()
	buildPosition()
	updateCaptures()
	G.lastLabel.Text = "آخر نقلة: —"
	setStatus()
end

local function endMatch(kind: string, mover: number)
	G.active = false
	G.over = true
	clearHints()
	if kind == "checkmate" then
		local winner = (mover == 1) and "الأبيض ♔" or "الأسود ♚"
		G.statusOverText = "كش مات! فاز " .. winner
		G.statusLabel.TextColor3 = GOLD_HI
		playSound(G.cells[28], SND_WIN, 0.5, 1)
	else
		G.statusOverText = "تعادل (جمود) 🤝"
		G.statusLabel.TextColor3 = GOLD
		playSound(G.cells[28], SND_MOVE, 0.4, 0.7)
	end
	G.statusLabel.Text = G.statusOverText
end

----------------------------------------------------------------------
-- تنفيذ نقلة (مع التحريك البصري والأسر والتبييت والترقية)
----------------------------------------------------------------------
local function tweenPieceTo(pc: BasePart, sq: number)
	local center = squareCenter(sq)
	local goal = Vector3.new(center.X, TOP_Y + pc.Size.Y / 2, center.Z)
	local info = TweenInfo.new(0.28, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	TweenService:Create(pc, info, { Position = goal }):Play()
end

local function despawnCaptured(pc: BasePart)
	local info = TweenInfo.new(0.22, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
	local tw = TweenService:Create(pc, info, { Size = pc.Size * 0.05, Transparency = 1 })
	tw:Play()
	Debris:AddItem(pc, 0.4)
end

local function doMove(mv)
	local mover = G.state.side
	local fromSq, toSq = mv.from, mv.to
	local movingModel = G.models[fromSq]

	-- معالجة الأسر (عادي / بالمرور)
	local capturedModel: BasePart? = nil
	if mv.flag == "ep" then
		local capSq = Chess.sqOf(Chess.fileOf(toSq), Chess.rankOf(fromSq))
		capturedModel = G.models[capSq]
		G.models[capSq] = nil
	else
		capturedModel = G.models[toSq]
		G.models[toSq] = nil
	end

	-- نقل النموذج from → to
	G.models[fromSq] = nil
	G.models[toSq] = movingModel
	if movingModel then tweenPieceTo(movingModel, toSq) end

	-- تبييت: حرّك الرخ أيضاً
	if mv.flag == "cK" or mv.flag == "cQ" then
		local rank = Chess.rankOf(fromSq)
		local rFrom = (mv.flag == "cK") and Chess.sqOf(7, rank) or Chess.sqOf(0, rank)
		local rTo = (mv.flag == "cK") and Chess.sqOf(5, rank) or Chess.sqOf(3, rank)
		local rookModel = G.models[rFrom]
		G.models[rFrom] = nil
		G.models[rTo] = rookModel
		if rookModel then tweenPieceTo(rookModel, rTo) end
	end

	-- صوت
	if capturedModel then
		despawnCaptured(capturedModel)
		if mover == 1 then G.capW += 1 else G.capB += 1 end
		updateCaptures()
		playSound(G.cells[toSq], SND_MOVE, 0.5, 0.7)
	else
		playSound(G.cells[toSq], SND_MOVE, 0.45, 1.0)
	end

	-- طبّق النقلة على المحرّك
	G.state:make(mv)

	-- ترقية: استبدل البيدق بالقطعة المرقّاة
	if mv.flag == "promo" then
		local promoted = G.models[toSq]
		if promoted then promoted:Destroy() end
		G.models[toSq] = makePiece(mover * (mv.promo or Chess.QUEEN), toSq)
	end

	G.selected = nil
	clearHints()
	G.lastLabel.Text = "آخر نقلة: " .. algebraic(fromSq) .. " → " .. algebraic(toSq)

	-- حالة ما بعد النقلة
	local st = G.state:status()
	if st == "checkmate" then
		endMatch("checkmate", mover)
	elseif st == "stalemate" then
		endMatch("stalemate", mover)
	else
		if st == "check" then playSound(G.cells[toSq], SND_MOVE, 0.5, 1.3) end
		setStatus()
	end
end

----------------------------------------------------------------------
-- نقر المربّع
----------------------------------------------------------------------
local function colorOfPlayer(player: Player): number?
	if player == G.whitePlayer then return 1 end
	if player == G.blackPlayer then return -1 end
	return nil
end

local function onSquareClicked(sq: number, player: Player)
	local myColor = colorOfPlayer(player)
	if not myColor then return end                 -- المتفرّجون لا يلعبون

	if not G.active then
		-- إعادة لعب: لو انتهت والمباراة ولاعباها موجودان
		if G.over and G.whitePlayer and G.blackPlayer then startMatch() end
		return
	end
	if myColor ~= G.state.side then return end      -- ليس دورك

	local piece = G.state.board[sq]

	if not G.selected then
		if piece ~= 0 and Chess.pcolor(piece) == myColor then
			showHints(sq)
		end
		return
	end

	if sq == G.selected then
		-- إلغاء التحديد
		G.selected = nil
		clearHints()
		return
	end

	if piece ~= 0 and Chess.pcolor(piece) == myColor then
		-- إعادة تحديد قطعة أخرى
		G.selected = nil
		clearHints()
		showHints(sq)
		return
	end

	local mv = G.hintTargets[sq]
	if mv then
		doMove(mv)
	else
		-- نقرة غير صالحة → ألغِ التحديد
		G.selected = nil
		clearHints()
	end
end

----------------------------------------------------------------------
-- المقاعد
----------------------------------------------------------------------
local function seatPlayer(seat: Seat): Player?
	local occ = seat.Occupant
	if not occ then return nil end
	return Players:GetPlayerFromCharacter(occ.Parent)
end

local function refreshSeats()
	G.whitePlayer = seatPlayer(G.whiteSeat)
	G.blackPlayer = seatPlayer(G.blackSeat)
	if G.whitePlayer and G.blackPlayer then
		if not G.active and not G.over then startMatch() end
	else
		-- نقص لاعب → أعِد الضبط لوضع الانتظار
		G.active = false
		G.over = false
		G.selected = nil
		clearHints()
		G.state = Chess.newGame()
		buildPosition()
		setStatus()
	end
end

----------------------------------------------------------------------
-- بناء الكرسيّ
----------------------------------------------------------------------
local function buildSeat(zside: number, col: Color3, label: string): Seat
	-- zside: -1 = جنوب (أبيض) يواجه +Z، +1 = شمال (أسود) يواجه -Z
	local sz = ORIGIN.Z + zside * (HALF + 3.2)
	part({
		Name = "ChairPost", Parent = G.pieceFolder, Color = WOOD, Material = Enum.Material.Wood,
		Size = Vector3.new(0.5, 1.8, 0.5), CFrame = CFrame.new(ORIGIN.X, ORIGIN.Y + 0.9, sz),
	})
	local seat = Instance.new("Seat")
	seat.Name = "PlayerSeat"
	seat.Anchored = true
	seat.Size = Vector3.new(1.9, 0.4, 1.9)
	seat.Material = Enum.Material.SmoothPlastic
	seat.Color = col
	seat.CFrame = CFrame.new(Vector3.new(ORIGIN.X, ORIGIN.Y + 1.9, sz))
		* CFrame.Angles(0, math.rad(zside < 0 and 0 or 180), 0)
	seat.Parent = G.pieceFolder
	part({
		Name = "ChairBack", Parent = G.pieceFolder, Color = col, Material = Enum.Material.SmoothPlastic,
		Size = Vector3.new(1.9, 2.2, 0.4),
		CFrame = CFrame.new(Vector3.new(ORIGIN.X, ORIGIN.Y + 2.9, sz + zside * 0.85)),
	})
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "SitPrompt"
	prompt.ActionText = "🪑 اجلس للّعب"
	prompt.ObjectText = label
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 8
	prompt.RequiresLineOfSight = false
	prompt.Parent = seat
	prompt.Triggered:Connect(function(plr)
		if seat.Occupant then return end
		local char = plr.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if hum then pcall(function() seat:Sit(hum) end) end
	end)
	return seat
end

----------------------------------------------------------------------
-- لوحة الحالة الخلفية (SurfaceGui)
----------------------------------------------------------------------
local function buildStatusBoard()
	local boardCY = ORIGIN.Y + 6.2
	local boardZ = ORIGIN.Z + HALF + 5.6
	local W, H = 8.6, 3.4
	for _, dx in ipairs({ -W / 2 + 0.3, W / 2 - 0.3 }) do
		part({
			Name = "StatusPole", Parent = G.pieceFolder, Color = GOLD, Material = Enum.Material.Metal,
			Size = Vector3.new(0.32, boardCY - ORIGIN.Y, 0.32),
			CFrame = CFrame.new(ORIGIN.X + dx, ORIGIN.Y + (boardCY - ORIGIN.Y) / 2, boardZ),
		})
	end
	local board = part({
		Name = "StatusBoard", Parent = G.pieceFolder, Color = Color3.fromRGB(14, 18, 26),
		Material = Enum.Material.Glass, Size = Vector3.new(W, H, 0.22),
		CFrame = CFrame.new(ORIGIN.X, boardCY, boardZ) * CFrame.Angles(0, math.rad(180), 0),
	})
	board.Reflectance = 0.15
	local fr = 0.22
	for _, d in ipairs({
		{ Vector3.new(0, H / 2, 0), Vector3.new(W + fr * 2, fr, 0.34) },
		{ Vector3.new(0, -H / 2, 0), Vector3.new(W + fr * 2, fr, 0.34) },
		{ Vector3.new(-W / 2, 0, 0), Vector3.new(fr, H, 0.34) },
		{ Vector3.new(W / 2, 0, 0), Vector3.new(fr, H, 0.34) },
	}) do
		part({
			Name = "BoardFrame", Parent = G.pieceFolder, Color = GOLD_HI, Material = Enum.Material.Metal,
			Size = d[2], CFrame = CFrame.new(ORIGIN.X, boardCY, boardZ) * CFrame.new(d[1]),
		})
	end

	local gui = Instance.new("SurfaceGui")
	gui.Name = "StatusFace"
	gui.AutoLocalize = false
	gui.Face = Enum.NormalId.Front
	gui.CanvasSize = Vector2.new(1024, 405)
	gui.LightInfluence = 0
	gui.Adornee = board
	gui.Parent = board

	local pad = Instance.new("Frame")
	pad.BackgroundTransparency = 1
	pad.Size = UDim2.new(1, 0, 1, 0)
	pad.Parent = gui

	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1
	title.Size = UDim2.new(1, -40, 0.3, 0)
	title.Position = UDim2.new(0, 20, 0.03, 0)
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.Text = "♟ الشطرنج"
	title.TextColor3 = Color3.fromRGB(255, 245, 215)
	title.Parent = pad
	local tg = Instance.new("UIGradient")
	tg.Color = ColorSequence.new(GOLD_HI, GOLD)
	tg.Rotation = 90
	tg.Parent = title
	local ts = Instance.new("UIStroke")
	ts.Thickness = 3
	ts.Color = Color3.fromRGB(60, 42, 12)
	ts.Parent = title

	-- صف عدّاد الأسرى
	local capRow = Instance.new("Frame")
	capRow.BackgroundTransparency = 1
	capRow.Size = UDim2.new(1, -40, 0.16, 0)
	capRow.Position = UDim2.new(0, 20, 0.34, 0)
	capRow.Parent = pad
	local function chip(side: number, txtCol: Color3): TextLabel
		local lbl = Instance.new("TextLabel")
		lbl.BackgroundTransparency = 1
		lbl.Size = UDim2.new(0.48, 0, 1, 0)
		lbl.Position = UDim2.new(side < 0 and 0.02 or 0.5, 0, 0, 0)
		lbl.Font = Enum.Font.GothamBold
		lbl.TextScaled = true
		lbl.TextXAlignment = side < 0 and Enum.TextXAlignment.Left or Enum.TextXAlignment.Right
		lbl.TextColor3 = txtCol
		lbl.Text = (side < 0 and "♔ أسر: 0" or "♚ أسر: 0")
		lbl.Parent = capRow
		local stk = Instance.new("UIStroke")
		stk.Thickness = 2
		stk.Color = Color3.fromRGB(10, 14, 22)
		stk.Parent = lbl
		return lbl
	end
	local capWLabel = chip(-1, Color3.fromRGB(240, 235, 215))
	local capBLabel = chip(1, Color3.fromRGB(170, 170, 180))

	-- شريحة الحالة
	local pill = Instance.new("Frame")
	pill.AnchorPoint = Vector2.new(0.5, 0)
	pill.Position = UDim2.new(0.5, 0, 0.52, 0)
	pill.Size = UDim2.new(0.94, 0, 0.3, 0)
	pill.BackgroundColor3 = Color3.fromRGB(8, 12, 20)
	pill.BackgroundTransparency = 0.15
	pill.Parent = pad
	local pc = Instance.new("UICorner")
	pc.CornerRadius = UDim.new(0.5, 0)
	pc.Parent = pill
	local pstk = Instance.new("UIStroke")
	pstk.Thickness = 2.5
	pstk.Color = GOLD
	pstk.Parent = pill
	local status = Instance.new("TextLabel")
	status.BackgroundTransparency = 1
	status.Size = UDim2.new(1, -30, 1, -10)
	status.Position = UDim2.new(0, 15, 0, 5)
	status.Font = Enum.Font.GothamBold
	status.TextScaled = true
	status.Text = "اجلس على كرسيّ للّعب"
	status.TextColor3 = LIGHT_SQ
	status.Parent = pill

	-- آخر نقلة
	local last = Instance.new("TextLabel")
	last.BackgroundTransparency = 1
	last.Size = UDim2.new(1, -40, 0.14, 0)
	last.Position = UDim2.new(0, 20, 0.85, 0)
	last.Font = Enum.Font.Gotham
	last.TextScaled = true
	last.Text = "آخر نقلة: —"
	last.TextColor3 = Color3.fromRGB(200, 196, 180)
	last.Parent = pad

	return status, last, capWLabel, capBLabel
end

----------------------------------------------------------------------
-- بناء الطاولة واللوح والمربّعات
----------------------------------------------------------------------
local function buildTable()
	local model = Instance.new("Model")
	model.Name = "ChessTable"
	model.Parent = G.pieceFolder

	-- أرجل
	for _, dx in ipairs({ -HALF + 0.8, HALF - 0.8 }) do
		for _, dz in ipairs({ -HALF + 0.8, HALF - 0.8 }) do
			part({
				Name = "Leg", Parent = model, Color = GOLD, Material = Enum.Material.Metal,
				Size = Vector3.new(0.5, TABLE_TOP_Y, 0.5),
				CFrame = CFrame.new(ORIGIN + Vector3.new(dx, TABLE_TOP_Y / 2, dz)),
			})
		end
	end
	-- سطح خشبي
	part({
		Name = "TableTop", Parent = model, Color = WOOD, Material = Enum.Material.Wood,
		Size = Vector3.new(N * CELL + 1.6, 0.5, N * CELL + 1.6),
		CFrame = CFrame.new(ORIGIN + Vector3.new(0, TABLE_TOP_Y, 0)),
	})
	-- إطار ذهبي محيط
	local fw = N * CELL + 1.6
	for _, d in ipairs({
		{ Vector3.new(0, 0, fw / 2 - 0.4), Vector3.new(fw, 0.4, 0.8) },
		{ Vector3.new(0, 0, -fw / 2 + 0.4), Vector3.new(fw, 0.4, 0.8) },
		{ Vector3.new(fw / 2 - 0.4, 0, 0), Vector3.new(0.8, 0.4, fw) },
		{ Vector3.new(-fw / 2 + 0.4, 0, 0), Vector3.new(0.8, 0.4, fw) },
	}) do
		part({
			Name = "Trim", Parent = model, Color = GOLD_HI, Material = Enum.Material.Metal,
			Size = d[2], CFrame = CFrame.new(ORIGIN + Vector3.new(0, TABLE_TOP_Y + 0.28, 0) + d[1]),
		})
	end

	-- المربّعات الـ64 + كاشف الضغط
	for sq = 1, 64 do
		local center = squareCenter(sq)
		local f, r = Chess.fileOf(sq), Chess.rankOf(sq)
		local light = (f + r) % 2 == 1
		local cell = part({
			Name = "Square", Parent = model, Material = Enum.Material.SmoothPlastic,
			Color = light and LIGHT_SQ or DARK_SQ,
			Size = Vector3.new(CELL, 0.12, CELL),
			CFrame = CFrame.new(center.X, TOP_Y - 0.06, center.Z),
		})
		cell:SetAttribute("Square", sq)
		part({
			Name = "CellGlow", Parent = cell, Color = SEL_COL, Material = Enum.Material.Neon,
			CanCollide = false, Transparency = 1,
			Size = Vector3.new(CELL - 0.06, 0.05, CELL - 0.06),
			CFrame = CFrame.new(center.X, TOP_Y + 0.02, center.Z),
		})
		G.cells[sq] = cell
		local cd = Instance.new("ClickDetector")
		cd.MaxActivationDistance = 20
		cd.Parent = cell
		local capSq = sq
		cd.MouseClick:Connect(function(plr)
			onSquareClicked(capSq, plr)
		end)
	end
end

----------------------------------------------------------------------
-- 🏷️ لافتات المنطقتين + الفاصل الأوسط (تقسيم ركن الألعاب لمساحتين)
----------------------------------------------------------------------
local PINK = Color3.fromRGB(236, 120, 170)

local function hangingSign(x: number, z: number, text: string, col: Color3)
	local cy = 8.6
	local W, H = 7.0, 1.9
	-- قضيبا تعليق من السقف
	for _, dx in ipairs({ -W / 2 + 0.5, W / 2 - 0.5 }) do
		part({
			Name = "SignRod", Parent = G.pieceFolder, Color = GOLD, Material = Enum.Material.Metal,
			Size = Vector3.new(0.16, 2.4, 0.16),
			CFrame = CFrame.new(x + dx, cy + H / 2 + 1.2, z),
		})
	end
	local panel = part({
		Name = "ZoneSign", Parent = G.pieceFolder, Color = Color3.fromRGB(16, 20, 30),
		Material = Enum.Material.Glass, Size = Vector3.new(W, H, 0.3),
		CFrame = CFrame.new(x, cy, z),
	})
	panel.Reflectance = 0.12
	-- إطار ذهبي
	for _, d in ipairs({
		{ Vector3.new(0, H / 2, 0), Vector3.new(W + 0.4, 0.24, 0.42) },
		{ Vector3.new(0, -H / 2, 0), Vector3.new(W + 0.4, 0.24, 0.42) },
		{ Vector3.new(-W / 2, 0, 0), Vector3.new(0.24, H, 0.42) },
		{ Vector3.new(W / 2, 0, 0), Vector3.new(0.24, H, 0.42) },
	}) do
		part({
			Name = "SignFrame", Parent = G.pieceFolder, Color = GOLD_HI, Material = Enum.Material.Metal,
			Size = d[2], CFrame = CFrame.new(x, cy, z) * CFrame.new(d[1]),
		})
	end
	-- نص على الوجهين (يُرى من الجهتين)
	for _, face in ipairs({ Enum.NormalId.Front, Enum.NormalId.Back }) do
		local gui = Instance.new("SurfaceGui")
		gui.Name = "SignFace"
		gui.AutoLocalize = false
		gui.Face = face
		gui.CanvasSize = Vector2.new(700, 190)
		gui.LightInfluence = 0
		gui.Adornee = panel
		gui.Parent = panel
		local lbl = Instance.new("TextLabel")
		lbl.BackgroundTransparency = 1
		lbl.Size = UDim2.new(1, -30, 1, -20)
		lbl.Position = UDim2.new(0, 15, 0, 10)
		lbl.Font = Enum.Font.GothamBlack
		lbl.TextScaled = true
		lbl.Text = text
		lbl.TextColor3 = col
		lbl.Parent = gui
		local stk = Instance.new("UIStroke")
		stk.Thickness = 3
		stk.Color = Color3.fromRGB(40, 28, 10)
		stk.Parent = lbl
	end
end

local function buildZoneSignage()
	hangingSign(-14, 100, "🔴 منطقة إكس–أو 🔵", Color3.fromRGB(255, 235, 200))
	hangingSign(14, 100, "♛ منطقة الشطرنج ♚", Color3.fromRGB(255, 240, 210))
	-- فاصل أوسط منخفض: أعمدة ذهبية بكرات نيون وردية (لا يعيق الحركة)
	for _, z in ipairs({ 96, 104, 112, 120 }) do
		part({
			Name = "DividerPost", Parent = G.pieceFolder, Color = GOLD, Material = Enum.Material.Metal,
			Size = Vector3.new(0.42, 2.6, 0.42),
			CFrame = CFrame.new(0, 0.8 + 1.3, z),
		})
		part({
			Name = "DividerOrb", Parent = G.pieceFolder, Color = PINK, Material = Enum.Material.Neon,
			CanCollide = false, Shape = Enum.PartType.Ball,
			Size = Vector3.new(0.7, 0.7, 0.7),
			CFrame = CFrame.new(0, 0.8 + 2.75, z),
		})
	end
end

----------------------------------------------------------------------
-- التهيئة
----------------------------------------------------------------------
local function init()
	local folder = Instance.new("Folder")
	folder.Name = "ChessArea"
	folder.Parent = Workspace

	G = {
		state = Chess.newGame(),
		models = {}, cells = {},
		active = false, over = false,
		whiteSeat = nil :: any, blackSeat = nil :: any,
		whitePlayer = nil, blackPlayer = nil,
		selected = nil,
		hintTargets = {}, hintParts = {},
		statusLabel = nil :: any, lastLabel = nil :: any,
		capWLabel = nil :: any, capBLabel = nil :: any,
		capW = 0, capB = 0,
		pieceFolder = folder,
		statusOverText = nil,
	}

	if not loadPieceTemplates() then
		warn("[Chess] لم تُحمَّل القطع — أُلغيت اللعبة")
		return
	end

	buildTable()
	buildZoneSignage()
	G.whiteSeat = buildSeat(-1, SEAT_W, "♔ اللاعب الأبيض")
	G.blackSeat = buildSeat(1, SEAT_B, "♚ اللاعب الأسود")
	G.statusLabel, G.lastLabel, G.capWLabel, G.capBLabel = buildStatusBoard()

	buildPosition()
	setStatus()

	G.whiteSeat:GetPropertyChangedSignal("Occupant"):Connect(refreshSeats)
	G.blackSeat:GetPropertyChangedSignal("Occupant"):Connect(refreshSeats)

	Players.PlayerRemoving:Connect(function(player)
		if player == G.whitePlayer or player == G.blackPlayer then
			task.defer(refreshSeats)
		end
	end)

	print("[Chess] جاهز — لوح شطرنج ثلاثي الأبعاد في منطقة الشطرنج.")
end

init()
