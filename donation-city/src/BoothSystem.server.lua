--[[
╔══════════════════════════════════════════════════════════════════════╗
║  BOOTH SYSTEM — SERVER LOGIC  (player-owned booths)                    ║
║                                                                        ║
║  PLACEMENT:  ServerScriptService  ·  TYPE: Script (server-side)        ║
║                                                                        ║
║  Repurposes the six existing booths (Bronze/Silver/Gold/Emerald/       ║
║  Ruby/Diamond) into player-claimable showcase booths:                  ║
║    • a player walks up and presses E to CLAIM a free booth             ║
║    • the booth shows the owner's name + avatar + "Claimed" status      ║
║    • the owner adds their own Game Passes / products (by URL or ID)    ║
║    • visitors press E to open the booth's shop and buy                 ║
║    • everything is wiped automatically when the owner leaves           ║
║                                                                        ║
║  SECURITY: every action is validated server-side. A player may only    ║
║  showcase passes they CREATED, BELONG TO (group) or already OWN.       ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace          = game:GetService("Workspace")
local Players             = game:GetService("Players")
local MarketplaceService  = game:GetService("MarketplaceService")
local ReplicatedStorage   = game:GetService("ReplicatedStorage")

local MAX_PRODUCTS = 6
local CLAIM_DISTANCE = 0  -- prompt handles distance

-- Booth tiers (must match the Model names "DonationBooth_<key>" in Workspace)
local BOOTH_KEYS = { "Bronze", "Silver", "Gold", "Emerald", "Ruby", "Diamond" }

-- Palette used for the default "available" glow of each booth
local DEFAULT_COLORS = {
	Bronze  = Color3.fromRGB(242, 115, 89),
	Silver  = Color3.fromRGB(150, 200, 255),
	Gold    = Color3.fromRGB(255, 209, 71),
	Emerald = Color3.fromRGB(92, 217, 140),
	Ruby    = Color3.fromRGB(255, 115, 179),
	Diamond = Color3.fromRGB(166, 140, 255),
}

-- Colors the owner can pick from in the management GUI (index-based, anti-exploit)
local SWATCHES = {
	Color3.fromRGB(168, 92, 255),  -- purple
	Color3.fromRGB(70, 226, 255),  -- cyan
	Color3.fromRGB(255, 205, 90),  -- gold
	Color3.fromRGB(92, 217, 140),  -- emerald
	Color3.fromRGB(255, 115, 179), -- pink
	Color3.fromRGB(255, 130, 70),  -- orange
	Color3.fromRGB(120, 255, 120), -- lime
	Color3.fromRGB(244, 242, 255), -- white
}

------------------------------------------------------------------------
-- Remotes (re-use the shared CinemaRemotes folder)
------------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("CinemaRemotes")
if not remotes then
	remotes = Instance.new("Folder")
	remotes.Name = "CinemaRemotes"
	remotes.Parent = ReplicatedStorage
end

local boothRemote = remotes:FindFirstChild("Booth")
if not boothRemote then
	boothRemote = Instance.new("RemoteEvent")
	boothRemote.Name = "Booth"
	boothRemote.Parent = remotes
end

local boothInfoFn = remotes:FindFirstChild("BoothInfo")
if not boothInfoFn then
	boothInfoFn = Instance.new("RemoteFunction")
	boothInfoFn.Name = "BoothInfo"
	boothInfoFn.Parent = remotes
end

------------------------------------------------------------------------
-- State
------------------------------------------------------------------------
-- booths[key] = {
--   model, body, sign, parts={}, defaults={[part]={Color,Material}},
--   ownerId=0, ownerName=nil, welcome="", colorIndex=nil,
--   products = { {id, name, price, icon, kind}, ... },
--   visits = 0, sales = 0,
-- }
local booths = {}
local ownerToBooth = {}            -- userId -> key
local donorTotals  = {}            -- userId -> { name, robux }
local infoCache    = {}            -- "kind:id" -> productInfo (server cache)

------------------------------------------------------------------------
-- Helpers
------------------------------------------------------------------------
local AR_DIGITS = { ["0"]="٠",["1"]="١",["2"]="٢",["3"]="٣",["4"]="٤",["5"]="٥",["6"]="٦",["7"]="٧",["8"]="٨",["9"]="٩" }
local function toArS(v): string
	return (tostring(v):gsub("%d", function(d) return AR_DIGITS[d] or d end))
end

local function getAvatarThumb(userId: number): string
	local ok, url = pcall(function()
		local content = Players:GetUserThumbnailAsync(
			userId,
			Enum.ThumbnailType.HeadShot,
			Enum.ThumbnailSize.Size150x150
		)
		return content
	end)
	if ok and url then return url end
	return ""
end

-- Parse a Game Pass / product id out of a raw id or a Roblox URL
local function parseId(input: string): number?
	if type(input) ~= "string" then return nil end
	input = input:gsub("%s+", "")
	if input == "" then return nil end
	-- direct number
	local direct = tonumber(input)
	if direct and direct > 0 and math.floor(direct) == direct then
		return math.floor(direct)
	end
	-- pull the first long number out of a URL (…/game-pass/123456/…  or  ?id=123)
	local fromId = input:match("[?&]id=(%d+)")
	if fromId then return tonumber(fromId) end
	local nums = {}
	for n in input:gmatch("(%d+)") do
		table.insert(nums, n)
	end
	-- choose the longest run of digits (the asset id), avoids matching small path bits
	local best
	for _, n in ipairs(nums) do
		if not best or #n > #best then best = n end
	end
	if best then return tonumber(best) end
	return nil
end

-- Fetch product info for a Game Pass first, then a Developer Product.
local function fetchInfo(id: number)
	local cacheGP = infoCache["GamePass:" .. id]
	if cacheGP then return cacheGP, "GamePass" end
	local cacheDP = infoCache["Product:" .. id]
	if cacheDP then return cacheDP, "Product" end
	-- معرّف مُتحقَّق سابقاً أنه خاطئ — نتذكّره لتجنّب تكرار طلبات GetProductInfo (حماية من حدود روبلوكس)
	if infoCache["bad:" .. id] then return nil, nil end

	local ok, info = pcall(function()
		return MarketplaceService:GetProductInfo(id, Enum.InfoType.GamePass)
	end)
	if ok and info then
		infoCache["GamePass:" .. id] = info
		return info, "GamePass"
	end

	ok, info = pcall(function()
		return MarketplaceService:GetProductInfo(id, Enum.InfoType.Product)
	end)
	if ok and info then
		infoCache["Product:" .. id] = info
		return info, "Product"
	end

	-- لا Game Pass ولا Product صالح — خزّن النتيجة السلبية فلا نعيد الطلب لنفس المعرّف
	infoCache["bad:" .. id] = true
	return nil, nil
end

-- Verify the player is allowed to showcase this pass:
--   creator (user)  OR  member of the creator group  OR  already owns the pass.
local function playerMayShowcase(player: Player, info, kind: string, id: number): boolean
	if not info then return false end
	local creator = info.Creator
	if creator then
		if creator.CreatorType == "User" and tonumber(creator.Id) == player.UserId then
			return true
		end
		if creator.CreatorType == "Group" and creator.Id then
			local okIn, isIn = pcall(function()
				return player:IsInGroup(tonumber(creator.Id))
			end)
			if okIn and isIn then return true end
		end
	end
	-- last resort: they personally own the pass
	if kind == "GamePass" then
		local okOwn, owns = pcall(function()
			return MarketplaceService:UserOwnsGamePassAsync(player.UserId, id)
		end)
		if okOwn and owns then return true end
	end
	return false
end

------------------------------------------------------------------------
-- Capture booth parts + their original look so we can restore on release
------------------------------------------------------------------------
local applyVisual   -- forward declarations (used by the seat guard below)
local setPresence

local function indexBooth(key: string)
	local model = Workspace:FindFirstChild("DonationBooth_" .. key)
	if not model then
		warn("[BoothSystem] missing booth model DonationBooth_" .. key)
		return
	end
	local body = model:FindFirstChild("Body") or model:FindFirstChildWhichIsA("BasePart")
	local sign = model:FindFirstChild("Sign")

	local parts, defaults = {}, {}
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			table.insert(parts, d)
			defaults[d] = { Color = d.Color, Material = d.Material }
		end
	end

	-- remove the old donation price tag if present
	if body then
		local old = body:FindFirstChild("PriceTag")
		if old then old:Destroy() end
	end

	booths[key] = {
		key = key, model = model, body = body, sign = sign,
		parts = parts, defaults = defaults,
		ownerId = 0, ownerName = nil, welcome = "", colorIndex = nil,
		products = {}, visits = 0, sales = 0,
		ownerPresent = false, seat = nil,
	}

	-- repurpose the proximity prompt
	local prompt = model:FindFirstChildWhichIsA("ProximityPrompt", true)
	if prompt then
		prompt.Name = "BoothPrompt"
		prompt.ActionText = "احجز هذا البوث"
		prompt.ObjectText = key .. " Booth"
		prompt.KeyboardKeyCode = Enum.KeyCode.E
		prompt.RequiresLineOfSight = false
		prompt.MaxActivationDistance = 12
		prompt.HoldDuration = 0
	end

	-- the floating name/avatar/status board (BillboardGui = always faces camera,
	-- so the text can never appear mirrored)
	if body then
		local bb = Instance.new("BillboardGui")
		bb.Name = "BoothBoard"
		bb.Adornee = body
		bb.Size = UDim2.fromOffset(240, 120)
		bb.StudsOffset = Vector3.new(0, 8.5, 0)
		bb.AlwaysOnTop = true
		bb.MaxDistance = 140
		bb.LightInfluence = 0
		bb.Parent = body

		local card = Instance.new("Frame")
		card.Name = "Card"
		card.Size = UDim2.fromScale(1, 1)
		card.BackgroundColor3 = Color3.fromRGB(18, 14, 32)
		card.BackgroundTransparency = 0.15
		card.Parent = bb
		local corner = Instance.new("UICorner"); corner.CornerRadius = UDim.new(0, 14); corner.Parent = card
		local stroke = Instance.new("UIStroke"); stroke.Thickness = 2; stroke.Color = DEFAULT_COLORS[key] or Color3.new(1,1,1); stroke.Transparency = 0.1; stroke.Parent = card
		stroke.Name = "Edge"

		local avatar = Instance.new("ImageLabel")
		avatar.Name = "Avatar"
		avatar.BackgroundColor3 = Color3.fromRGB(30, 22, 54)
		avatar.Position = UDim2.fromOffset(10, 10)
		avatar.Size = UDim2.fromOffset(64, 64)
		avatar.Image = ""
		avatar.Visible = false
		avatar.Parent = card
		local ac = Instance.new("UICorner"); ac.CornerRadius = UDim.new(1, 0); ac.Parent = avatar

		local title = Instance.new("TextLabel")
		title.Name = "Title"
		title.BackgroundTransparency = 1
		title.Position = UDim2.fromOffset(10, 12)
		title.Size = UDim2.new(1, -20, 0, 34)
		title.Font = Enum.Font.GothamBlack
		title.TextScaled = false
		title.TextSize = 18
		title.TextWrapped = true
		title.TextColor3 = Color3.fromRGB(244, 242, 255)
		title.Text = key .. " Booth"
		title.Parent = card

		local status = Instance.new("TextLabel")
		status.Name = "Status"
		status.BackgroundTransparency = 1
		status.Position = UDim2.new(0, 10, 1, -40)
		status.Size = UDim2.new(1, -20, 0, 30)
		status.Font = Enum.Font.GothamBold
		status.TextScaled = false
		status.TextSize = 14
		status.TextWrapped = true
		status.TextColor3 = Color3.fromRGB(120, 255, 160)
		status.Text = "✅ متاح — اضغط E للحجز"
		status.Parent = card

		local hint = Instance.new("TextLabel")
		hint.Name = "Hint"
		hint.BackgroundTransparency = 1
		hint.Position = UDim2.new(0, 80, 0, 46)
		hint.Size = UDim2.new(1, -90, 0, 26)
		hint.Font = Enum.Font.Gotham
		hint.TextScaled = false
		hint.TextSize = 12
		hint.TextWrapped = true
		hint.TextColor3 = Color3.fromRGB(182, 176, 214)
		hint.Text = ""
		hint.Visible = false
		hint.Parent = card
	end

	-- owner seat: a chair behind the counter so the owner can sit and
	-- "receive" visitors. Only the owner may sit (others get ejected).
	local b = booths[key]
	local counter = model:FindFirstChild("Counter")
	if body then
		-- نلتقط الشكل الأصلي للجسم قبل تعديله (المحور +Z المحلي = واجهة البوث نحو الزوار)
		local origCF   = body.CFrame
		local origSize = body.Size
		local frontDir = origCF:VectorToWorldSpace(Vector3.new(0, 0, 1))
		frontDir = Vector3.new(frontDir.X, 0, frontDir.Z)
		if frontDir.Magnitude < 0.05 then frontDir = origCF.LookVector end
		frontDir = frontDir.Unit

		-- البوث أصلاً كتلة صلبة مقفلة بلا «داخل» — نفتحه ككشك: نقلّص الجسم إلى جدار
		-- خلفي رفيع (نُثبّت وجهه الخلفي) فتنفتح أمامه أرضية يجلس فيها صاحب البوث خلف
		-- الكاونتر ويستقبل الزوار، بدل ما يُحشر الكرسي بين الجدار والكاونتر.
		local halfDepth = origSize.Z / 2
		local backWall  = 1.5
		if origSize.Z > backWall + 2 then
			body.Size   = Vector3.new(origSize.X, origSize.Y, backWall)
			body.CFrame = origCF * CFrame.new(0, 0, -(halfDepth - backWall / 2))

			-- أرضية داخلية أنيقة تملأ جوف الكشك
			local floorPart = Instance.new("Part")
			floorPart.Name = "BoothFloor"
			floorPart.Anchored = true
			floorPart.CanCollide = true
			floorPart.Size = Vector3.new(origSize.X - 1, 0.4, math.max(2, halfDepth * 1.3))
			floorPart.Material = Enum.Material.WoodPlanks
			floorPart.Color = Color3.fromRGB(58, 44, 86)
			floorPart.CFrame = origCF * CFrame.new(0, -origSize.Y / 2 + 0.2, 0.4)
			floorPart.Parent = model
		end

		-- موضع الكرسي: داخل الكشك خلف الكاونتر على الأرض، يواجه الزوار (+Z المحلي)
		local base = (origCF * CFrame.new(0, -origSize.Y / 2 + 0.4, 1.0)).Position

		local seat = Instance.new("Seat")
		seat.Name = "OwnerSeat"
		seat.Size = Vector3.new(2.2, 1, 2.2)
		seat.Anchored = true
		seat.CanCollide = true
		seat.Material = Enum.Material.SmoothPlastic
		seat.Color = Color3.fromRGB(48, 38, 78)
		seat.CFrame = CFrame.lookAt(base + Vector3.new(0, 1.2, 0), base + Vector3.new(0, 1.2, 0) + frontDir)
		seat.Parent = model
		b.seat = seat

		local back = Instance.new("Part")
		back.Name = "OwnerSeatBack"
		back.Anchored = true
		back.CanCollide = true
		back.Size = Vector3.new(2.2, 2.4, 0.4)
		back.Material = Enum.Material.SmoothPlastic
		back.Color = Color3.fromRGB(40, 32, 64)
		back.CFrame = CFrame.lookAt(base + Vector3.new(0, 2.0, 0) - frontDir * 0.95, base + Vector3.new(0, 2.0, 0) - frontDir * 0.95 + frontDir)
		back.Parent = model

		local pedestal = Instance.new("Part")
		pedestal.Name = "OwnerSeatBase"
		pedestal.Anchored = true
		pedestal.CanCollide = true
		pedestal.Size = Vector3.new(1, 1.4, 1)
		pedestal.Material = Enum.Material.Metal
		pedestal.Color = Color3.fromRGB(60, 50, 92)
		pedestal.CFrame = CFrame.new(base + Vector3.new(0, 0.7, 0))
		pedestal.Parent = model

		-- guard: only the owner may occupy the seat
		seat:GetPropertyChangedSignal("Occupant"):Connect(function()
			local occ = seat.Occupant
			if occ then
				local pl = Players:GetPlayerFromCharacter(occ.Parent)
				if not pl or pl.UserId ~= b.ownerId then
					task.defer(function()
						if seat.Occupant == occ then
							occ.Sit = false
							occ.Jump = true
						end
					end)
					setPresence(b, false)
				else
					setPresence(b, true)
				end
			else
				setPresence(b, false)
			end
		end)

		-- زر صريح للجلوس (لصاحب البوث فقط) — أكثر وضوحاً ويعمل على الجوال أيضاً
		local sitPrompt = Instance.new("ProximityPrompt")
		sitPrompt.Name = "SitPrompt"
		sitPrompt.ActionText = "🪑 اجلس"
		sitPrompt.ObjectText = "كرسي صاحب البوث"
		sitPrompt.KeyboardKeyCode = Enum.KeyCode.E
		sitPrompt.HoldDuration = 0
		sitPrompt.RequiresLineOfSight = false
		sitPrompt.MaxActivationDistance = 7
		sitPrompt.Parent = seat
		sitPrompt.Triggered:Connect(function(plr)
			if not plr or plr.UserId ~= b.ownerId then return end
			local char = plr.Character
			local hum = char and char:FindFirstChildWhichIsA("Humanoid")
			if not hum then return end
			local ok = pcall(function() seat:Sit(hum) end)
			if not ok and hum.RootPart then
				hum.Sit = true
				hum.RootPart.CFrame = seat.CFrame + Vector3.new(0, 2.4, 0)
			end
		end)
	end
end

------------------------------------------------------------------------
-- Visual refresh of a booth (color + board) based on its state
------------------------------------------------------------------------
function applyVisual(b)
	local claimed = b.ownerId ~= 0
	local glow = DEFAULT_COLORS[b.key] or Color3.new(1, 1, 1)
	if claimed and b.colorIndex and SWATCHES[b.colorIndex] then
		glow = SWATCHES[b.colorIndex]
	elseif claimed then
		glow = Color3.fromRGB(120, 255, 160)
	end

	for _, part in ipairs(b.parts) do
		if part.Name == "Sign" or part.Name == "RoofTrim" then
			part.Color = glow
			part.Material = Enum.Material.Neon
		end
	end

	-- presence spotlight + sparkles on the Sign when claimed
	if b.sign then
		local light = b.sign:FindFirstChild("BoothGlow")
		if not light then
			light = Instance.new("PointLight")
			light.Name = "BoothGlow"
			light.Range = 16
			light.Brightness = 0
			light.Parent = b.sign
		end
		light.Color = glow
		light.Brightness = claimed and 2.2 or 0
		local sparkle = b.sign:FindFirstChild("BoothSparkle")
		if claimed then
			if not sparkle then
				sparkle = Instance.new("Sparkles")
				sparkle.Name = "BoothSparkle"
				sparkle.Parent = b.sign
			end
			sparkle.SparkleColor = glow
		elseif sparkle then
			sparkle:Destroy()
		end
	end

	local body = b.body
	if body then
		local bb = body:FindFirstChild("BoothBoard")
		if bb then
			local card = bb:FindFirstChild("Card")
			if card then
				local edge = card:FindFirstChild("Edge")
				if edge then edge.Color = glow end
				local title  = card:FindFirstChild("Title")
				local status = card:FindFirstChild("Status")
				local avatar = card:FindFirstChild("Avatar")
				local hint   = card:FindFirstChild("Hint")
				if claimed then
					if title then title.Text = (b.ownerName or "Player") .. "'s Booth" end
					if status then
						if b.ownerPresent then
							status.Text = "🟢 صاحب البوث موجود — اضغط E"
							status.TextColor3 = Color3.fromRGB(120, 255, 160)
						else
							status.Text = "🔒 محجوز — اضغط E للمتجر"
							status.TextColor3 = glow
						end
					end
					if avatar then
						-- fetch the thumbnail only once per owner (avoid repeat yields)
						if avatar.Image == "" then avatar.Image = getAvatarThumb(b.ownerId) end
						avatar.Visible = true
					end
					if title then title.Position = UDim2.fromOffset(80, 12); title.Size = UDim2.new(1, -90, 0, 34) end
					if hint then
						hint.Visible = true
						hint.Text = toArS(#b.products) .. " منتج · " .. toArS(b.sales) .. " دعم"
					end
				else
					if title then title.Text = b.key .. " Booth"; title.Position = UDim2.fromOffset(10, 12); title.Size = UDim2.new(1, -20, 0, 34) end
					if status then status.Text = "✅ متاح — اضغط E للحجز"; status.TextColor3 = Color3.fromRGB(120, 255, 160) end
					if avatar then avatar.Visible = false; avatar.Image = "" end
					if hint then hint.Visible = false end
				end
			end
		end
	end

	-- update prompt verb (استهدف BoothPrompt تحديداً حتى لا نعدّل SitPrompt الخاص بالمقعد)
	local prompt = b.model:FindFirstChild("BoothPrompt", true)
	if prompt then
		if claimed then
			prompt.ActionText = "افتح المتجر"
			prompt.ObjectText = (b.ownerName or "Player") .. "'s Booth"
		else
			prompt.ActionText = "احجز هذا البوث"
			prompt.ObjectText = b.key .. " Booth"
		end
	end
end

-- owner presence (sitting in the booth seat)
function setPresence(b, present: boolean)
	if b.ownerPresent == present then return end
	b.ownerPresent = present
	applyVisual(b)
end

------------------------------------------------------------------------
-- Serialize state for clients
------------------------------------------------------------------------
local function snapshot()
	local out = {}
	for key, b in pairs(booths) do
		local prods = {}
		for i, p in ipairs(b.products) do
			prods[i] = { id = p.id, name = p.name, price = p.price, icon = p.icon, kind = p.kind, sold = p.sold or 0 }
		end
		out[key] = {
			ownerId = b.ownerId,
			ownerName = b.ownerName,
			welcome = b.welcome,
			colorIndex = b.colorIndex,
			products = prods,
			sales = b.sales,
			visits = b.visits,
			present = b.ownerPresent,
		}
	end
	return out
end

local function broadcastState()
	local snap = snapshot()
	for _, pl in ipairs(Players:GetPlayers()) do
		boothRemote:FireClient(pl, { action = "state", booths = snap, myBooth = ownerToBooth[pl.UserId] or nil })
	end
end

local function leaderboards()
	-- Top donators
	local donors = {}
	for uid, rec in pairs(donorTotals) do
		table.insert(donors, { name = rec.name, robux = rec.robux })
	end
	table.sort(donors, function(a, b) return a.robux > b.robux end)
	while #donors > 8 do table.remove(donors) end

	-- Most popular booths (by sales then visits)
	local popular = {}
	for key, b in pairs(booths) do
		if b.ownerId ~= 0 then
			table.insert(popular, { key = key, ownerName = b.ownerName, sales = b.sales, visits = b.visits })
		end
	end
	table.sort(popular, function(a, b)
		if a.sales == b.sales then return a.visits > b.visits end
		return a.sales > b.sales
	end)
	while #popular > 8 do table.remove(popular) end

	return donors, popular
end

local function broadcastLeaderboards()
	local donors, popular = leaderboards()
	for _, pl in ipairs(Players:GetPlayers()) do
		boothRemote:FireClient(pl, { action = "leaderboard", donors = donors, popular = popular })
	end
end

local function notify(player: Player, text: string, kind: string?)
	boothRemote:FireClient(player, { action = "notify", text = text, kind = kind or "ok" })
end

-- admin-controlled flags (toggled from the owner admin panel)
local boothsEnabled = true
local bannedFromClaim = {}

------------------------------------------------------------------------
-- Claim / release
------------------------------------------------------------------------
local function releaseBooth(key: string, silent: boolean?)
	local b = booths[key]
	if not b then return end
	if b.ownerId ~= 0 then
		ownerToBooth[b.ownerId] = nil
	end
	b.ownerId = 0
	b.ownerName = nil
	b.welcome = ""
	b.colorIndex = nil
	b.products = {}
	b.visits = 0
	b.sales = 0
	b.buyers = {}
	b.ownerPresent = false
	-- kick anyone off the seat and reset it
	if b.seat then
		local occ = b.seat.Occupant
		if occ then occ.Sit = false end
	end
	-- restore original part looks
	for part, def in pairs(b.defaults) do
		if part and part.Parent then
			part.Color = def.Color
			part.Material = def.Material
		end
	end
	applyVisual(b)
	if not silent then
		broadcastState()
		broadcastLeaderboards()
	end
end

local function claimBooth(player: Player, key: string)
	local b = booths[key]
	if not b then return end
	if not boothsEnabled then
		notify(player, "نظام البوثات معطّل مؤقتاً من الإدارة.", "error")
		return
	end
	if bannedFromClaim[player.UserId] then
		notify(player, "تم منعك من حجز البوثات بواسطة الإدارة.", "error")
		return
	end
	if ownerToBooth[player.UserId] then
		notify(player, "تملك بوثاً بالفعل — حرّره أولاً قبل حجز غيره.", "error")
		return
	end
	if b.ownerId ~= 0 then
		notify(player, "هذا البوث محجوز لاعب آخر.", "error")
		return
	end
	b.ownerId = player.UserId
	b.ownerName = player.DisplayName
	b.welcome = "أهلاً بكم في بوثي! 🎬"
	b.colorIndex = nil
	b.products = {}
	ownerToBooth[player.UserId] = key
	applyVisual(b)
	notify(player, "تم حجز البوث! افتح الإدارة لإضافة منتجاتك.", "ok")
	broadcastState()
	broadcastLeaderboards()
end

------------------------------------------------------------------------
-- Products
------------------------------------------------------------------------
local function addProduct(player: Player, input: string)
	local key = ownerToBooth[player.UserId]
	if not key then notify(player, "احجز بوثاً أولاً.", "error"); return end
	local b = booths[key]
	if #b.products >= MAX_PRODUCTS then
		notify(player, "وصلت الحد الأقصى (" .. MAX_PRODUCTS .. " منتجات).", "error")
		return
	end
	local id = parseId(input)
	if not id then
		notify(player, "رابط/رقم غير صالح. الصق رابط الـ Gamepass أو رقمه.", "error")
		return
	end
	for _, p in ipairs(b.products) do
		if p.id == id then notify(player, "هذا المنتج مُضاف بالفعل.", "error"); return end
	end
	local info, kind = fetchInfo(id)
	if not info then
		notify(player, "ما قدرت أجيب بيانات هذا الرقم. تأكد أنه Gamepass/منتج صحيح.", "error")
		return
	end
	if not playerMayShowcase(player, info, kind, id) then
		notify(player, "تقدر تعرض فقط Gamepasses أنت منشئها أو تملكها.", "error")
		return
	end
	local icon = ""
	if info.IconImageAssetId and info.IconImageAssetId ~= 0 then
		icon = "rbxassetid://" .. tostring(info.IconImageAssetId)
	end
	table.insert(b.products, {
		id = id,
		name = info.Name or ("#" .. id),
		price = info.PriceInRobux or 0,
		icon = icon,
		kind = kind,
	})
	notify(player, "تمت إضافة: " .. (info.Name or id), "ok")
	applyVisual(b)
	broadcastState()
end

local function removeProduct(player: Player, index: number)
	local key = ownerToBooth[player.UserId]
	if not key then return end
	local b = booths[key]
	if type(index) ~= "number" then return end
	if b.products[index] then
		table.remove(b.products, index)
		applyVisual(b)
		broadcastState()
		notify(player, "تم حذف المنتج.", "ok")
	end
end

local function setColor(player: Player, index: number)
	local key = ownerToBooth[player.UserId]
	if not key then return end
	if type(index) ~= "number" or not SWATCHES[index] then return end
	booths[key].colorIndex = index
	applyVisual(booths[key])
	broadcastState()
end

local function setWelcome(player: Player, text: string)
	local key = ownerToBooth[player.UserId]
	if not key then return end
	if type(text) ~= "string" then return end
	text = text:sub(1, 80)
	booths[key].welcome = text
	applyVisual(booths[key])
	broadcastState()
end

------------------------------------------------------------------------
-- Buying  (server holds the real id → cannot be spoofed by client)
------------------------------------------------------------------------
local function buy(player: Player, key: string, index: number)
	if type(index) ~= "number" then return end
	local b = booths[key]
	if not b or b.ownerId == 0 then return end
	local p = b.products[index]
	if not p then return end
	-- عدّاد الزيارات = عدد الزوّار الفريدين (لا عدد الضغطات) — حتى لا يُضخّم بتكرار الطلب
	b.buyers = b.buyers or {}
	if not b.buyers[player.UserId] then
		b.buyers[player.UserId] = true
		b.visits += 1
	end
	local ok, err = pcall(function()
		if p.kind == "Product" then
			MarketplaceService:PromptProductPurchase(player, p.id)
		else
			MarketplaceService:PromptGamePassPurchase(player, p.id)
		end
	end)
	if not ok then
		warn("[BoothSystem] prompt failed: " .. tostring(err))
	end
end

------------------------------------------------------------------------
-- Purchase completion → record donor + popularity + celebrate
------------------------------------------------------------------------
local function recordSale(buyerPlayer: Player, productId: number, robux: number)
	-- find booth that showcases this product
	for key, b in pairs(booths) do
		if b.ownerId ~= 0 then
			for _, p in ipairs(b.products) do
				if p.id == productId then
					b.sales += 1
					p.sold = (p.sold or 0) + 1
					local rec = donorTotals[buyerPlayer.UserId] or { name = buyerPlayer.DisplayName, robux = 0 }
					rec.robux += (robux or p.price or 0)
					donorTotals[buyerPlayer.UserId] = rec

					-- celebrate everyone in server
					for _, pl in ipairs(Players:GetPlayers()) do
						boothRemote:FireClient(pl, {
							action = "thank",
							buyerName = buyerPlayer.DisplayName,
							ownerName = b.ownerName,
							productName = p.name,
							robux = robux or p.price or 0,
							forMe = (pl.UserId == buyerPlayer.UserId),
						})
					end

					-- feed the loading-screen "recent donors" ticker if present
					if _G.RecordDonation then
						pcall(function() _G.RecordDonation(buyerPlayer.DisplayName, robux or p.price or 0) end)
					end
					if _G.AwardBadge then
						pcall(function() _G.AwardBadge(buyerPlayer, "DONOR") end)
					end

					broadcastState()
					broadcastLeaderboards()
					return
				end
			end
		end
	end
end

-- visitor "calls" the booth owner (notifies them someone is interested)
local lastRing = {}
local function ringOwner(player: Player, key: string)
	local b = booths[key]
	if not b or b.ownerId == 0 then return end
	if b.ownerId == player.UserId then return end
	local now = os.clock()
	local prev = lastRing[player.UserId]
	if prev and (now - prev) < 12 then return end
	lastRing[player.UserId] = now
	local owner = Players:GetPlayerByUserId(b.ownerId)
	if owner then
		notify(owner, "🔔 " .. player.DisplayName .. " مهتم ببوثك — تعال استقبله!", "ok")
	end
	notify(player, "تم تنبيه صاحب البوث ✅", "ok")
end

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamePassId, wasPurchased)
	if not wasPurchased then return end
	local price = 0
	local info = infoCache["GamePass:" .. gamePassId]
	if info then price = info.PriceInRobux or 0 end
	recordSale(player, gamePassId, price)
end)

MarketplaceService.PromptProductPurchaseFinished:Connect(function(userId, productId, isPurchased)
	if not isPurchased then return end
	local player = Players:GetPlayerByUserId(userId)
	if not player then return end
	local price = 0
	local info = infoCache["Product:" .. productId]
	if info then price = info.PriceInRobux or 0 end
	recordSale(player, productId, price)
end)

------------------------------------------------------------------------
-- Remote handling
------------------------------------------------------------------------
boothRemote.OnServerEvent:Connect(function(player, payload)
	if type(payload) ~= "table" then return end
	local action = payload.action
	if action == "claim" then
		if type(payload.boothKey) == "string" and booths[payload.boothKey] then
			claimBooth(player, payload.boothKey)
		end
	elseif action == "release" then
		local key = ownerToBooth[player.UserId]
		if key then releaseBooth(key) end
	elseif action == "addPass" then
		addProduct(player, tostring(payload.input or ""))
	elseif action == "removeProduct" then
		removeProduct(player, payload.index)
	elseif action == "setColor" then
		setColor(player, payload.index)
	elseif action == "setWelcome" then
		setWelcome(player, tostring(payload.text or ""))
	elseif action == "buy" then
		if type(payload.boothKey) == "string" then
			buy(player, payload.boothKey, payload.index)
		end
	elseif action == "ring" then
		if type(payload.boothKey) == "string" then
			ringOwner(player, payload.boothKey)
		end
	elseif action == "requestState" then
		boothRemote:FireClient(player, { action = "state", booths = snapshot(), myBooth = ownerToBooth[player.UserId] or nil })
		local donors, popular = leaderboards()
		boothRemote:FireClient(player, { action = "leaderboard", donors = donors, popular = popular })
	end
end)

-- Validate-and-fetch a pass before the owner commits to adding it (live preview)
boothInfoFn.OnServerInvoke = function(player, input)
	local id = parseId(tostring(input or ""))
	if not id then return { ok = false, reason = "رقم/رابط غير صالح" } end
	local info, kind = fetchInfo(id)
	if not info then return { ok = false, reason = "تعذّر جلب بيانات هذا الرقم" } end
	local allowed = playerMayShowcase(player, info, kind, id)
	local icon = ""
	if info.IconImageAssetId and info.IconImageAssetId ~= 0 then
		icon = "rbxassetid://" .. tostring(info.IconImageAssetId)
	end
	return {
		ok = allowed,
		reason = allowed and nil or "تقدر تعرض فقط ما أنت منشئه أو تملكه",
		id = id, name = info.Name, price = info.PriceInRobux or 0, icon = icon, kind = kind,
	}
end

------------------------------------------------------------------------
-- Cleanup on leave
------------------------------------------------------------------------
Players.PlayerRemoving:Connect(function(player)
	local key = ownerToBooth[player.UserId]
	if key then releaseBooth(key) end
	lastRing[player.UserId] = nil  -- نظّف مؤقّت النداء فلا تتراكم مدخلات للاعبين الخارجين
	-- نُبقي donorTotals طوال عمر السيرفر حتى لا يختفي المتبرّع من لوحة كبار المتبرّعين عند خروجه
end)

Players.PlayerAdded:Connect(function(player)
	task.delay(2, function()
		boothRemote:FireClient(player, { action = "state", booths = snapshot(), myBooth = ownerToBooth[player.UserId] or nil })
		local donors, popular = leaderboards()
		boothRemote:FireClient(player, { action = "leaderboard", donors = donors, popular = popular })
	end)
end)

------------------------------------------------------------------------
-- Boot
------------------------------------------------------------------------
for _, key in ipairs(BOOTH_KEYS) do
	indexBooth(key)
end
for _, b in pairs(booths) do
	applyVisual(b)
end

-- periodic leaderboard refresh (cheap, every 15s)
task.spawn(function()
	while true do
		task.wait(15)
		broadcastLeaderboards()
	end
end)

------------------------------------------------------------------------
-- Admin API (consumed by the owner admin panel in CinemaServices)
------------------------------------------------------------------------
_G.BoothAdminStats = function()
	local claimed, totalSupport, products = 0, 0, 0
	for _, b in pairs(booths) do
		if b.ownerId ~= 0 then
			claimed += 1
			products += #b.products
		end
	end
	for _, rec in pairs(donorTotals) do
		totalSupport += (rec.robux or 0)
	end
	local _, popular = leaderboards()
	local top = popular[1]
	return {
		players = #Players:GetPlayers(),
		claimed = claimed,
		total = #BOOTH_KEYS,
		products = products,
		support = totalSupport,
		topBooth = top and (top.ownerName .. " (" .. tostring(top.sales) .. " دعم)") or "—",
		enabled = boothsEnabled,
	}
end

_G.BoothAdminList = function()
	local out = {}
	for _, key in ipairs(BOOTH_KEYS) do
		local b = booths[key]
		if b and b.ownerId ~= 0 then
			table.insert(out, {
				key = key,
				ownerName = b.ownerName,
				ownerId = b.ownerId,
				products = #b.products,
				sales = b.sales,
				present = b.ownerPresent == true,
			})
		end
	end
	return out
end

_G.BoothForceRelease = function(key: string): boolean
	if booths[key] and booths[key].ownerId ~= 0 then
		releaseBooth(key)
		return true
	end
	return false
end

_G.BoothSetEnabled = function(on: boolean)
	boothsEnabled = on == true
	if not boothsEnabled then
		-- releasing everyone keeps the map clean while the system is off
		for _, key in ipairs(BOOTH_KEYS) do
			if booths[key] and booths[key].ownerId ~= 0 then releaseBooth(key, true) end
		end
		broadcastState()
		broadcastLeaderboards()
	end
end

_G.BoothIsEnabled = function(): boolean
	return boothsEnabled
end

_G.BoothSetBanned = function(userId: number, banned: boolean)
	if type(userId) ~= "number" then return end
	if banned then
		bannedFromClaim[userId] = true
		local key = ownerToBooth[userId]
		if key then releaseBooth(key) end
	else
		bannedFromClaim[userId] = nil
	end
end

_G.BoothIsBanned = function(userId: number): boolean
	return bannedFromClaim[userId] == true
end

print("[BoothSystem] ready — " .. tostring(#BOOTH_KEYS) .. " booths claimable.")
