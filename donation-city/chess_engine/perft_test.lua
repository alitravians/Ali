package.path = package.path .. ";/home/ubuntu/chess/?.lua"
local C = require("chess_core")

local tests = {
	{ name = "startpos", fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
	  expect = { [1] = 20, [2] = 400, [3] = 8902, [4] = 197281 } },
	{ name = "kiwipete", fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
	  expect = { [1] = 48, [2] = 2039, [3] = 97862 } },
	{ name = "position3", fen = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
	  expect = { [1] = 14, [2] = 191, [3] = 2812, [4] = 43238 } },
	{ name = "position4", fen = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
	  expect = { [1] = 6, [2] = 264, [3] = 9467 } },
	{ name = "position5", fen = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
	  expect = { [1] = 44, [2] = 1486, [3] = 62379 } },
	{ name = "position6", fen = "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
	  expect = { [1] = 46, [2] = 2079 } },
}

local allok = true
for _, t in ipairs(tests) do
	for depth, exp in pairs(t.expect) do
		local s = C.fromFEN(t.fen)
		local got = C.perft(s, depth)
		local ok = (got == exp)
		if not ok then allok = false end
		print(string.format("%-10s d%d  expect=%-9d got=%-9d  %s",
			t.name, depth, exp, got, ok and "OK" or "FAIL"))
	end
end
print(allok and "\nALL PERFT TESTS PASSED" or "\nSOME TESTS FAILED")
os.exit(allok and 0 or 1)
