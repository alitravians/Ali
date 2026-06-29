--!strict
-- ChessCore: a self-contained, Roblox/Luau-compatible chess rules engine.
-- No Roblox APIs are used here so it can be unit-tested under plain Lua (perft).
--
-- Board: 64 squares, index 1..64, sq = rank*8 + file + 1  (file,rank are 0..7).
-- Piece: signed integer. type 1..6 = P,N,B,R,Q,K. white = +type, black = -type, 0 = empty.

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

-- direction offsets expressed as (df, dr)
local KNIGHT_D = { {1,2},{2,1},{2,-1},{1,-2},{-1,-2},{-2,-1},{-2,1},{-1,2} }
local KING_D   = { {1,0},{1,1},{0,1},{-1,1},{-1,0},{-1,-1},{0,-1},{1,-1} }
local BISHOP_D = { {1,1},{-1,1},{-1,-1},{1,-1} }
local ROOK_D   = { {1,0},{-1,0},{0,1},{0,-1} }

-- ---------------------------------------------------------------- state
local State = {}
State.__index = State
M.State = State

function M.newGame()
	local s = setmetatable({}, State)
	s.board = {}
	for i = 1, 64 do s.board[i] = 0 end
	local back = { ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK }
	for f = 0, 7 do
		s.board[sqOf(f, 0)] = back[f + 1]      -- white back rank (rank 0)
		s.board[sqOf(f, 1)] = PAWN             -- white pawns
		s.board[sqOf(f, 6)] = -PAWN            -- black pawns
		s.board[sqOf(f, 7)] = -back[f + 1]     -- black back rank
	end
	s.side = 1
	s.castle = { wk = true, wq = true, bk = true, bq = true }
	s.ep = 0           -- en-passant target square (0 = none)
	s.half = 0
	s.full = 1
	return s
end

function M.fromFEN(fen)
	local s = setmetatable({}, State)
	s.board = {}
	for i = 1, 64 do s.board[i] = 0 end
	local parts = {}
	for w in string.gmatch(fen, "%S+") do parts[#parts + 1] = w end
	local placement, active, castle, ep = parts[1], parts[2], parts[3], parts[4]
	local rank = 7
	local file = 0
	local map = { p = PAWN, n = KNIGHT, b = BISHOP, r = ROOK, q = QUEEN, k = KING }
	for i = 1, #placement do
		local ch = string.sub(placement, i, i)
		if ch == "/" then
			rank = rank - 1; file = 0
		elseif tonumber(ch) then
			file = file + tonumber(ch)
		else
			local lower = string.lower(ch)
			local t = map[lower]
			local col = (ch == lower) and -1 or 1
			s.board[sqOf(file, rank)] = col * t
			file = file + 1
		end
	end
	s.side = (active == "w") and 1 or -1
	s.castle = {
		wk = string.find(castle, "K", 1, true) ~= nil,
		wq = string.find(castle, "Q", 1, true) ~= nil,
		bk = string.find(castle, "k", 1, true) ~= nil,
		bq = string.find(castle, "q", 1, true) ~= nil,
	}
	if ep and ep ~= "-" then
		local ef = string.byte(ep, 1) - string.byte("a", 1)
		local er = tonumber(string.sub(ep, 2, 2)) - 1
		s.ep = sqOf(ef, er)
	else
		s.ep = 0
	end
	s.half = tonumber(parts[5] or "0") or 0
	s.full = tonumber(parts[6] or "1") or 1
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

-- ------------------------------------------------------- attack detection
-- Is square `sq` attacked by side `by` (1 or -1) on the given board?
function State:isAttacked(sq, by)
	local b = self.board
	local tf, tr = fileOf(sq), rankOf(sq)
	-- pawn attacks: a `by` pawn attacks diagonally forward. White pawns move +rank.
	local pr = tr - by        -- the rank a `by` pawn would sit on to attack `sq`
	for _, df in ipairs({ -1, 1 }) do
		local f = tf + df
		if inBoard(f, pr) then
			if b[sqOf(f, pr)] == by * PAWN then return true end
		end
	end
	-- knights
	for _, d in ipairs(KNIGHT_D) do
		local f, r = tf + d[1], tr + d[2]
		if inBoard(f, r) and b[sqOf(f, r)] == by * KNIGHT then return true end
	end
	-- king
	for _, d in ipairs(KING_D) do
		local f, r = tf + d[1], tr + d[2]
		if inBoard(f, r) and b[sqOf(f, r)] == by * KING then return true end
	end
	-- bishop/queen diagonals
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
	-- rook/queen orthogonals
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

-- ------------------------------------------------------- move generation
-- move = { from=, to=, promo=type|nil, flag=("normal"|"double"|"ep"|"cK"|"cQ") }
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

-- generate pseudo-legal moves for the side to move
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
				local dir = me                       -- white +1 rank, black -1
				local startRank = (me == 1) and 1 or 6
				local promoRank = (me == 1) and 7 or 0
				local r1 = r0 + dir
				-- single push
				if inBoard(f0, r1) and b[sqOf(f0, r1)] == 0 then
					if r1 == promoRank then
						for _, pr in ipairs({ QUEEN, ROOK, BISHOP, KNIGHT }) do
							moves[#moves + 1] = { from = from, to = sqOf(f0, r1), promo = pr, flag = "promo" }
						end
					else
						moves[#moves + 1] = { from = from, to = sqOf(f0, r1), flag = "normal" }
						-- double push
						if r0 == startRank and b[sqOf(f0, r0 + 2 * dir)] == 0 then
							moves[#moves + 1] = { from = from, to = sqOf(f0, r0 + 2 * dir), flag = "double" }
						end
					end
				end
				-- captures (incl. en passant)
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
				-- castling
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

-- Apply a move in place; returns an undo record.
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
	-- move piece
	b[to] = moving
	b[from] = 0
	-- en-passant capture removes the pawn behind `to`
	if mv.flag == "ep" then
		local capSq = sqOf(fileOf(to), rankOf(from))
		undo.epCapSq = capSq
		undo.captured = b[capSq]
		b[capSq] = 0
	end
	-- promotion
	if mv.flag == "promo" then
		b[to] = me * mv.promo
	end
	-- castling: move the rook too
	if mv.flag == "cK" then
		local rank = rankOf(from)
		b[sqOf(5, rank)] = me * ROOK
		b[sqOf(7, rank)] = 0
	elseif mv.flag == "cQ" then
		local rank = rankOf(from)
		b[sqOf(3, rank)] = me * ROOK
		b[sqOf(0, rank)] = 0
	end
	-- update castling rights
	local function lose(sq)
		if sq == sqOf(4, 0) then self.castle.wk = false; self.castle.wq = false end
		if sq == sqOf(4, 7) then self.castle.bk = false; self.castle.bq = false end
		if sq == sqOf(7, 0) then self.castle.wk = false end
		if sq == sqOf(0, 0) then self.castle.wq = false end
		if sq == sqOf(7, 7) then self.castle.bk = false end
		if sq == sqOf(0, 7) then self.castle.bq = false end
	end
	lose(from); lose(to)
	-- set ep target
	if mv.flag == "double" then
		self.ep = sqOf(fileOf(from), rankOf(from) + me)
	else
		self.ep = 0
	end
	-- clocks
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
	-- restore moving piece
	b[from] = undo.moving
	if undo.flag == "ep" then
		b[to] = 0
		b[undo.epCapSq] = undo.captured
	else
		b[to] = undo.captured
	end
	-- undo castling rook
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

-- legal moves = pseudo moves filtered so the mover's king is not in check
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

-- "checkmate" | "stalemate" | "check" | "ok"
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
