--[[
	╔══════════════════════════════════════════════════════════════════════╗
	║  واجهة الكلبشات — CUFF SYSTEM (Client)                                ║
	║  المكان: StarterPlayer > StarterPlayerScripts   ·   النوع: LocalScript ║
	║                                                                        ║
	║  • Tool خفيف باسم «كلبشات» يفعّله اللاعب ليمسك لاعباً قريباً.          ║
	║  • لوحة حالة صغيرة توضّح الكلبشة المجهّزة/المسجون/الفك.               ║
	║  • إشعارات عربية صغيرة متناسقة مع واجهة المدينة.                    ║
	╚══════════════════════════════════════════════════════════════════════╝
]]

local Players          = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local TweenService     = game:GetService("TweenService")
local RunService       = game:GetService("RunService")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local remotes = ReplicatedStorage:WaitForChild("CuffRemotes")
local cuffRemote = remotes:WaitForChild("Action")
local stateRemote = remotes:WaitForChild("State")
local notifyRemote = remotes:WaitForChild("Notify")

local function new(class, props, children)
	local o = Instance.new(class)
	if class == "ScreenGui" or class == "BillboardGui" or class == "SurfaceGui" then
		o.AutoLocalize = false
	end
	for k, v in pairs(props or {}) do o[k] = v end
	for _, c in ipairs(children or {}) do c.Parent = o end
	return o
end

local THEME = {
	Card = Color3.fromRGB(18, 14, 32),
	Card2 = Color3.fromRGB(30, 22, 54),
	Gold = Color3.fromRGB(255, 205, 90),
	Text = Color3.fromRGB(244, 242, 255),
	Sub = Color3.fromRGB(182, 176, 214),
}

local function styled(_parent, props, children)
	local frame = new("Frame", props, children)
	new("UICorner", { CornerRadius = UDim.new(0, 14), Parent = frame })
	new("UIStroke", { Color = THEME.Gold, Thickness = 1.2, Transparency = 0.45, Parent = frame })
	new("UIGradient", { Rotation = 25, Color = ColorSequence.new(THEME.Card2, THEME.Card), Parent = frame })
	return frame
end

local gui = new("ScreenGui", {
	Name = "CuffHUD",
	ResetOnSpawn = false,
	IgnoreGuiInset = true,
	DisplayOrder = 65,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	Parent = PlayerGui,
})

local toastLayer = new("Frame", {
	Name = "ToastLayer",
	BackgroundTransparency = 1,
	Size = UDim2.fromScale(1, 1),
	Parent = gui,
})

local statusLayer = new("Frame", {
	Name = "StatusLayer",
	BackgroundTransparency = 1,
	Size = UDim2.fromScale(1, 1),
	Parent = gui,
})

local statusPanel = styled(statusLayer, {
	Name = "StatusPanel",
	BackgroundColor3 = THEME.Card,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -22),
	Size = UDim2.fromOffset(320, 122),
	Visible = false,
	Parent = statusLayer,
}, {})

local statusTitle = new("TextLabel", {
	BackgroundTransparency = 1,
	Text = "",
	Font = Enum.Font.GothamBlack,
	TextSize = 19,
	TextColor3 = THEME.Gold,
	TextXAlignment = Enum.TextXAlignment.Right,
	Size = UDim2.new(1, -20, 0, 24),
	Position = UDim2.fromOffset(10, 10),
	Parent = statusPanel,
})

local statusBody = new("TextLabel", {
	BackgroundTransparency = 1,
	Text = "",
	Font = Enum.Font.GothamMedium,
	TextSize = 14,
	TextWrapped = true,
	TextColor3 = THEME.Sub,
	TextXAlignment = Enum.TextXAlignment.Right,
	TextYAlignment = Enum.TextYAlignment.Top,
	Size = UDim2.new(1, -20, 0, 44),
	Position = UDim2.fromOffset(10, 38),
	Parent = statusPanel,
})

local actionButton = new("TextButton", {
	Name = "ActionButton",
	AutoButtonColor = false,
	BackgroundColor3 = THEME.Gold,
	TextColor3 = Color3.fromRGB(24, 18, 8),
	Font = Enum.Font.GothamBlack,
	TextSize = 15,
	Text = "",
	Size = UDim2.new(1, -20, 0, 30),
	Position = UDim2.new(0, 10, 1, -40),
	Parent = statusPanel,
}, {
	new("UICorner", { CornerRadius = UDim.new(0, 10) }),
})

local toolInstance: Tool? = nil
local toolConn: RBXScriptConnection? = nil
local state = {
	ownedKeys = {},
	ownedCount = 0,
	equippedKey = "",
	heldTargetUserId = 0,
	cuffedByUserId = 0,
	isAdmin = false,
	hasCuffs = false,
	defs = {},
}

local function destroyTool()
	if toolConn then
		pcall(function() toolConn:Disconnect() end)
		toolConn = nil
	end
	if toolInstance then
		pcall(function() toolInstance:Destroy() end)
		toolInstance = nil
	end
end

local function clearStaleTool()
	if toolInstance and not toolInstance:IsDescendantOf(game) then
		destroyTool()
	end
end

local function currentDef()
	for _, def in ipairs(state.defs or {}) do
		if def.key == state.equippedKey then
			return def
		end
	end
	return nil
end

-- تثبيت نسخة من موديل الكلبشات (Creator Store 721245449) على مقبض الأداة
local function attachModelClone(tool: Tool, handle: BasePart, def, template: Model): boolean
	local clone = template:Clone()
	local primary: BasePart? = nil
	for _, inst in ipairs(clone:GetDescendants()) do
		if inst:IsA("BasePart") then
			inst.Anchored = false
			inst.CanCollide = false
			inst.CanQuery = false
			inst.CanTouch = false
			inst.Massless = true
			if def and def.metal then
				inst.Color = def.metal
			end
			if primary == nil then
				primary = inst
			else
				local w = Instance.new("WeldConstraint")
				w.Part0 = primary
				w.Part1 = inst
				w.Parent = inst
			end
		end
	end
	if not primary then
		clone:Destroy()
		return false
	end
	clone:ScaleTo(0.7)
	-- تتدلى الكلبشات من قبضة اليد بشكل متناسق (الحلقتان للأمام والسلسلة للأسفل)
	clone:PivotTo(handle.CFrame * CFrame.new(0, -0.15, 0) * CFrame.Angles(math.rad(90), 0, math.rad(90)))
	local w = Instance.new("WeldConstraint")
	w.Part0 = handle
	w.Part1 = primary
	w.Parent = primary
	if def and def.glow then
		local light = Instance.new("PointLight")
		light.Color = def.glow
		light.Brightness = 0.5
		light.Range = 5
		light.Parent = primary
	end
	clone.Name = "CuffVisual"
	clone.Parent = tool
	return true
end

-- شكل احتياطي فوري (حلقتان + سلسلة) يظهر ريثما يصل الموديل الأصلي
local function buildFallbackVisual(tool: Tool, handle: BasePart, def)
	local metal = (def and def.metal) or Color3.fromRGB(190, 190, 200)
	local glow = (def and def.glow) or Color3.fromRGB(235, 235, 245)
	local model = Instance.new("Model")
	model.Name = "FallbackCuff"

	local function fpart(name: string, size: Vector3, cf: CFrame, color: Color3, material: Enum.Material)
		local p = Instance.new("Part")
		p.Name = name
		p.Size = size
		p.Color = color
		p.Material = material
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.Massless = true
		p.Anchored = false
		p.CFrame = cf
		p.Parent = model
		local w = Instance.new("WeldConstraint")
		w.Part0 = handle
		w.Part1 = p
		w.Parent = p
		return p
	end

	local base = handle.CFrame * CFrame.new(0, -0.35, 0)
	for side = -1, 1, 2 do
		local center = base * CFrame.new(side * 0.24, 0, 0)
		local segs = 8
		for i = 1, segs do
			local a = (i / segs) * math.pi * 2
			fpart(
				"RingSeg",
				Vector3.new(0.06, 0.12, 0.08),
				center * CFrame.new(math.cos(a) * 0.18, math.sin(a) * 0.18, 0) * CFrame.Angles(0, 0, a + math.rad(90)),
				metal,
				Enum.Material.Metal
			)
		end
	end
	for i = 1, 3 do
		fpart(
			"ChainLink",
			Vector3.new(0.05, 0.14, 0.05),
			base * CFrame.new((i - 2) * 0.12, 0.02, 0.02) * CFrame.Angles(0, 0, math.rad((i % 2 == 0) and 90 or 0)),
			metal,
			Enum.Material.Metal
		)
	end
	local light = Instance.new("PointLight")
	light.Color = glow
	light.Brightness = 0.5
	light.Range = 5
	light.Parent = model:FindFirstChildWhichIsA("BasePart")
	model.Parent = tool
end

-- يركّب الشكل باليد فوراً: الموديل الأصلي إذا كان جاهزاً، وإلا شكل احتياطي
-- يُستبدل تلقائياً أول ما يصل الموديل من السيرفر.
local function attachHandVisuals(tool: Tool, handle: BasePart, def)
	local template = ReplicatedStorage:FindFirstChild("CuffModel3D")
	if template and template:IsA("Model") then
		if attachModelClone(tool, handle, def, template) then
			return
		end
	end
	buildFallbackVisual(tool, handle, def)
	task.spawn(function()
		local t = ReplicatedStorage:WaitForChild("CuffModel3D", 120)
		if not (t and t:IsA("Model")) then return end
		if not tool:IsDescendantOf(game) then return end
		if attachModelClone(tool, handle, def, t) then
			local fb = tool:FindFirstChild("FallbackCuff")
			if fb then fb:Destroy() end
		end
	end)
end

local function makeEquippedCuffTool(def)
	local tool = Instance.new("Tool")
	tool.Name = "كلبشات"
	tool.RequiresHandle = true
	tool.CanBeDropped = false
	tool.ToolTip = (def and (def.name .. " — " .. tostring(def.rarity or ""))) or "كلبشات"
	tool:SetAttribute("CuffKey", def and def.key or "")

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.4, 0.4, 0.4)
	handle.Transparency = 1
	handle.CanCollide = false
	handle.CanQuery = false
	handle.CanTouch = false
	handle.Massless = true
	handle.Parent = tool

	attachHandVisuals(tool, handle, def)

	tool.Grip = CFrame.new(0, -0.25, 0) * CFrame.Angles(math.rad(-90), 0, 0)
	return tool
end

local function ownedAny()
	return state.ownedCount and state.ownedCount > 0
end

local function showToast(text, color)
	local toast = new("Frame", {
		BackgroundColor3 = THEME.Card,
		BorderSizePixel = 0,
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, -20),
		Size = UDim2.fromOffset(420, 56),
		Parent = toastLayer,
	}, {})
	new("UICorner", { CornerRadius = UDim.new(0, 14), Parent = toast })
	new("UIStroke", { Color = color or THEME.Gold, Thickness = 1.5, Transparency = 0.35, Parent = toast })
	new("UIGradient", { Rotation = 20, Color = ColorSequence.new(THEME.Card2, THEME.Card), Parent = toast })
	new("TextLabel", {
		BackgroundTransparency = 1,
		Text = tostring(text or ""),
		Font = Enum.Font.GothamBold,
		TextSize = 16,
		TextColor3 = THEME.Text,
		TextWrapped = true,
		Size = UDim2.new(1, -20, 1, -12),
		Position = UDim2.fromOffset(10, 6),
		Parent = toast,
	})
	toast.Position = UDim2.new(0.5, 0, 0, -20)
	TweenService:Create(toast, TweenInfo.new(0.22, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Position = UDim2.new(0.5, 0, 0, 12) }):Play()
	task.delay(3.2, function()
		if toast and toast.Parent then
			local tw = TweenService:Create(toast, TweenInfo.new(0.18), { Position = UDim2.new(0.5, 0, 0, -20) })
			tw:Play()
			tw.Completed:Once(function()
				if toast then toast:Destroy() end
			end)
		end
	end)
end

local function updateStatus()
	local cuffed = state.cuffedByUserId and state.cuffedByUserId ~= 0
	local holding = state.heldTargetUserId and state.heldTargetUserId ~= 0
	if cuffed then
		statusPanel.Visible = true
		statusTitle.Text = "أنت مكلبش"
		statusBody.Text = "اضغط R أو زر المقاومة لتخفيف التوتر بصرياً — والفك يتم فقط بواسطة صاحب الكلبشة أو الإدارة."
		actionButton.Text = "قاوم"
		actionButton.Visible = true
		statusPanel.BackgroundColor3 = Color3.fromRGB(28, 16, 26)
	elseif holding then
		statusPanel.Visible = true
		statusTitle.Text = "التحكم بالكبشة"
		statusBody.Text = "أنت تمسك لاعباً حالياً. يمكنك تحريره من هنا متى شئت، والإدارة تستطيع فك أي لاعب مباشرة."
		actionButton.Text = "فك الكلبشة"
		actionButton.Visible = true
		statusPanel.BackgroundColor3 = THEME.Card
	else
		statusPanel.Visible = false
	end
end

local function refreshTool()
	local backpack = LocalPlayer:FindFirstChildOfClass("Backpack")
	if not backpack then return end
	clearStaleTool()
	if not ownedAny() then
		destroyTool()
		return
	end
	local def = currentDef()
	local tooltip = def and (def.name .. " — " .. tostring(def.rarity or "")) or "كلبشات"
	local equippedKey = def and def.key or ""
	if toolInstance and toolInstance:IsDescendantOf(game) and toolInstance:GetAttribute("CuffKey") == equippedKey then
		toolInstance.ToolTip = tooltip
		if toolInstance.Parent ~= backpack and toolInstance.Parent ~= LocalPlayer.Character then
			toolInstance.Parent = backpack
		end
		return
	end
	destroyTool()
	toolInstance = makeEquippedCuffTool(def)
	toolInstance.Parent = backpack
	toolConn = toolInstance.Activated:Connect(function()
		local mouse = LocalPlayer:GetMouse()
		local targetPart = mouse and mouse.Target or nil
		local targetPlayer = nil
		if targetPart then
			local model = targetPart:FindFirstAncestorOfClass("Model")
			if model then
				targetPlayer = Players:GetPlayerFromCharacter(model)
			end
		end
		if not targetPlayer or targetPlayer == LocalPlayer then
			local cam = workspace.CurrentCamera
			if cam and mouse then
				local ray = cam:ScreenPointToRay(mouse.X, mouse.Y)
				local params = RaycastParams.new()
				params.FilterType = Enum.RaycastFilterType.Exclude
				params.FilterDescendantsInstances = { LocalPlayer.Character }
				local hit = workspace:Raycast(ray.Origin, ray.Direction * 18, params)
				if hit and hit.Instance then
					local model = hit.Instance:FindFirstAncestorOfClass("Model")
					if model then
						targetPlayer = Players:GetPlayerFromCharacter(model)
					end
				end
			end
		end
		if not targetPlayer then
			showToast("وجّه الكلبشات نحو لاعب قريب.", Color3.fromRGB(255, 190, 90))
			return
		end
		cuffRemote:FireServer({ action = "cuffPlayer", targetUserId = targetPlayer.UserId })
	end)
end

actionButton.MouseButton1Click:Connect(function()
	if state.cuffedByUserId and state.cuffedByUserId ~= 0 then
		cuffRemote:FireServer({ action = "struggle" })
	elseif state.heldTargetUserId and state.heldTargetUserId ~= 0 then
		cuffRemote:FireServer({ action = "releasePlayer", targetUserId = state.heldTargetUserId })
	end
end)

UserInputService.InputBegan:Connect(function(input, gp)
	if gp then return end
	if input.KeyCode == Enum.KeyCode.R and state.cuffedByUserId and state.cuffedByUserId ~= 0 then
		cuffRemote:FireServer({ action = "struggle" })
	end
end)

stateRemote.OnClientEvent:Connect(function(data)
	if type(data) ~= "table" then return end
	state.ownedKeys = type(data.ownedKeys) == "table" and data.ownedKeys or {}
	state.ownedCount = tonumber(data.ownedCount) or 0
	state.equippedKey = tostring(data.equippedKey or "")
	state.heldTargetUserId = tonumber(data.heldTargetUserId) or 0
	state.cuffedByUserId = tonumber(data.cuffedByUserId) or 0
	state.isAdmin = data.isAdmin == true
	state.hasCuffs = data.hasCuffs == true
	state.defs = type(data.defs) == "table" and data.defs or state.defs
	refreshTool()
	updateStatus()
end)

LocalPlayer.CharacterAdded:Connect(function()
	task.spawn(function()
		LocalPlayer:WaitForChild("Backpack")
		refreshTool()
	end)
end)

notifyRemote.OnClientEvent:Connect(function(text)
	local tint = THEME.Gold
	local s = tostring(text or "")
	if s:find("❌", 1, true) then tint = Color3.fromRGB(255, 120, 120) end
	if s:find("✅", 1, true) then tint = Color3.fromRGB(150, 235, 170) end
	if s:find("⚠️", 1, true) then tint = Color3.fromRGB(255, 194, 90) end
	showToast(s, tint)
end)

gui.AncestryChanged:Connect(function(_, parent)
	if not parent then
		destroyTool()
	end
end)

task.defer(function()
	cuffRemote:FireServer({ action = "requestState" })
end)

RunService.Heartbeat:Connect(function()
	if state.cuffedByUserId and state.cuffedByUserId ~= 0 then
		local pulse = math.sin(os.clock() * 4) * 0.04
		statusPanel.Position = UDim2.new(0.5, 0, 1, -22 + math.floor(pulse * 18))
	else
		statusPanel.Position = UDim2.new(0.5, 0, 1, -22)
	end
end)

print("[CuffClient] Ready — tool, hint panel, and notifications online.")
