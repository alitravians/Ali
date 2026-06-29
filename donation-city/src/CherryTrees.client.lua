-- ════════════════════════════════════════════════════════════════════════
-- CHERRY TREES (Client) — تمايل تيجان الكرز مع «نسمة هواء» واقعية.
-- كل تاج موسوم "CherryCanopy" ومحوره عند قمة الجذع؛ ندوّره بزاوية صغيرة
-- بموجة جيبية + اختلاف طور لكل شجرة فلا تتمايل كلها بنفس اللحظة.
-- ════════════════════════════════════════════════════════════════════════
local CollectionService = game:GetService("CollectionService")
local RunService = game:GetService("RunService")

local AMP = math.rad(3.4) -- شدة التمايل
local SPEED = 1.05

local canopies: { [Model]: { pivot: CFrame, phase: number } } = {}

local function register(m: Instance)
	if not m:IsA("Model") then
		return
	end
	local pivot = m:GetPivot()
	canopies[m] = {
		pivot = pivot,
		phase = pivot.Position.X * 0.13 + pivot.Position.Z * 0.09,
	}
end

for _, m in ipairs(CollectionService:GetTagged("CherryCanopy")) do
	register(m)
end
CollectionService:GetInstanceAddedSignal("CherryCanopy"):Connect(register)
CollectionService:GetInstanceRemovedSignal("CherryCanopy"):Connect(function(m)
	canopies[m] = nil
end)

RunService.RenderStepped:Connect(function()
	local t = os.clock()
	for m, d in pairs(canopies) do
		if m.Parent then
			local sway = math.sin(t * SPEED + d.phase) * AMP
			local tilt = math.sin(t * SPEED * 0.66 + d.phase * 1.4) * AMP * 0.5
			m:PivotTo(d.pivot * CFrame.Angles(tilt, 0, sway))
		else
			canopies[m] = nil
		end
	end
end)
