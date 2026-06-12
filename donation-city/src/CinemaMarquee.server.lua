--[[
	CINEMA MARQUEE — حركة واجهة السينما (Server)
	يوضع في: ServerScriptService     ·     النوع: Script

	يحرّك واجهة السينما ثلاثية الأبعاد (CinemaFacade3D):
	  1. وميض متتابع لمصابيح الماركي (Bulb0..Bulb8) بأسلوب هوليوود
	  2. نبض خفيف لأحرف اللافتة (Letter0..Letter5)
	  3. تمايل شعاعي الكشافات (Searchlight_Beam_L/R) يمسحان السماء
]]

local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

local facade = Workspace:WaitForChild("CinemaFacade3D", 30)
if not facade then
	warn("CinemaMarquee: CinemaFacade3D not found")
	return
end

----------------------------------------------------------------------
-- 1) وميض المصابيح المتتابع
----------------------------------------------------------------------
local LIT = Color3.fromRGB(255, 242, 178)
local DIM = Color3.fromRGB(120, 100, 60)

local bulbs = {}
for i = 0, 8 do
	local b = facade:FindFirstChild("Bulb" .. i)
	if b then table.insert(bulbs, b) end
end

task.spawn(function()
	local step = 0
	while facade.Parent do
		step += 1
		for i, b in ipairs(bulbs) do
			local on = (i + step) % 3 ~= 0
			b.Color = on and LIT or DIM
			b.Material = on and Enum.Material.Neon or Enum.Material.SmoothPlastic
		end
		task.wait(0.22)
	end
end)

----------------------------------------------------------------------
-- 2) نبض أحرف اللافتة
----------------------------------------------------------------------
local letters = {}
for i = 0, 5 do
	local l = facade:FindFirstChild("Letter" .. i)
	if l then table.insert(letters, l) end
end

task.spawn(function()
	local t = 0
	while facade.Parent do
		t += 0.1
		local k = 0.5 + 0.5 * math.sin(t * 2)
		local c = Color3.fromRGB(255, 230 + math.floor(20 * k), 150 + math.floor(60 * k))
		for _, l in ipairs(letters) do
			l.Color = c
		end
		task.wait(0.1)
	end
end)

----------------------------------------------------------------------
-- 3) تمايل الكشافات
----------------------------------------------------------------------
local beams = {}
for _, nm in ipairs({ "Searchlight_Beam_L", "Searchlight_Beam_R" }) do
	local beam = facade:FindFirstChild(nm)
	if beam then
		-- نثبّت نقطة أسفل الشعاع (عند قاعدة الكشاف) وندوّر حولها
		local baseCF = beam.CFrame
		local halfLen = beam.Size.Y / 2
		local pivot = baseCF * CFrame.new(0, -halfLen, 0)
		table.insert(beams, {
			part = beam,
			pivotPos = pivot.Position,
			baseRot = baseCF - baseCF.Position,
			halfLen = halfLen,
			dir = (nm == "Searchlight_Beam_L") and 1 or -1,
		})
	end
end

if #beams > 0 then
	local t = 0
	RunService.Heartbeat:Connect(function(dt)
		t += dt
		for _, b in ipairs(beams) do
			local sway = math.sin(t * 0.7 * b.dir) * 0.45
			local tilt = math.sin(t * 0.45 + b.dir) * 0.12
			b.part.CFrame = CFrame.new(b.pivotPos)
				* CFrame.Angles(tilt, sway, 0)
				* b.baseRot
				* CFrame.new(0, b.halfLen, 0)
		end
	end)
end
