--[[
    ╔══════════════════════════════════════════════════════════════╗
    ║   OG School Hub  —  لوحة تحكم سكربت المدرسة                     ║
    ║   واجهة مخصّصة من الصفر (Luau) بثيم السبورة                      ║
    ║   للعبة: OG-School (PlaceId 139529206391254)                    ║
    ╚══════════════════════════════════════════════════════════════╝

    سكربت عام (Universal) يشتغل بأي لعبة، مصمّم خصيصًا للمدرسة.
    كل العمليات محميّة بـ pcall وتعمل بعد الـ Respawn.

    Made for alitravians.
]]

--==[ منع التشغيل المزدوج ]==--
if _G.__OG_SCHOOL_HUB_LOADED then
    pcall(function()
        if _G.__OG_SCHOOL_HUB_UNLOAD then _G.__OG_SCHOOL_HUB_UNLOAD() end
    end)
end
_G.__OG_SCHOOL_HUB_LOADED = true

local VERSION = "1.0"

--==[ الخدمات ]==--
local Players            = game:GetService("Players")
local RunService         = game:GetService("RunService")
local UserInputService   = game:GetService("UserInputService")
local TweenService       = game:GetService("TweenService")
local Lighting           = game:GetService("Lighting")
local StarterGui         = game:GetService("StarterGui")
local TeleportService    = game:GetService("TeleportService")
local HttpService        = game:GetService("HttpService")
local CoreGui            = game:GetService("CoreGui")
local VirtualUser        = game:GetService("VirtualUser")

local LocalPlayer = Players.LocalPlayer
local Camera      = workspace.CurrentCamera

--==[ دوال المنفّذ (آمنة) ]==--
local function safe(fnName)
    local f = rawget(getfenv(), fnName) or (getgenv and rawget(getgenv(), fnName))
    return type(f) == "function" and f or nil
end

local gethui_fn     = safe("gethui")
local protectgui_fn = safe("protect_gui") or (syn and syn.protect_gui)
local writefile_fn  = safe("writefile")
local readfile_fn   = safe("readfile")
local isfile_fn     = safe("isfile")
local makefolder_fn = safe("makefolder")
local isfolder_fn   = safe("isfolder")
local setclip_fn    = safe("setclipboard") or safe("toclipboard")

-- رفع صلاحية الـ Thread (بعض المنفّذات تحتاجها للوصول إلى CoreGui/gethui)
local function elevate()
    for _, name in ipairs({ "setthreadidentity", "setidentity", "set_thread_identity" }) do
        local fn = safe(name)
        if fn then pcall(fn, 8) end
    end
end
elevate()

--==[ تتبّع الاتصالات لإلغائها عند الإغلاق ]==--
local CONNS = {}
local function track(conn)
    table.insert(CONNS, conn)
    return conn
end

local function notify(title, text, duration)
    pcall(function()
        StarterGui:SetCore("SendNotification", {
            Title = title or "OG School Hub",
            Text = text or "",
            Duration = duration or 4,
        })
    end)
end

--==[ ثيم السبورة ]==--
local THEME = {
    Bg       = Color3.fromRGB(26, 31, 40),
    Bg2      = Color3.fromRGB(31, 37, 48),
    Side     = Color3.fromRGB(21, 25, 33),
    Card     = Color3.fromRGB(35, 42, 54),
    Card2    = Color3.fromRGB(40, 48, 62),
    Stroke   = Color3.fromRGB(54, 64, 80),
    Accent   = Color3.fromRGB(74, 196, 209),
    AccentD  = Color3.fromRGB(40, 120, 130),
    Green    = Color3.fromRGB(66, 198, 130),
    Red      = Color3.fromRGB(224, 96, 96),
    Track    = Color3.fromRGB(60, 68, 82),
    Txt      = Color3.fromRGB(232, 238, 245),
    Sub      = Color3.fromRGB(150, 162, 178),
    Mut      = Color3.fromRGB(104, 116, 132),
    Chalk    = Color3.fromRGB(224, 233, 238),
}

local ACCENT_PRESETS = {
    { name = "سماوي طباشيري", color = Color3.fromRGB(74, 196, 209) },
    { name = "أخضر",          color = Color3.fromRGB(66, 198, 130) },
    { name = "بنفسجي",        color = Color3.fromRGB(150, 120, 230) },
    { name = "برتقالي",       color = Color3.fromRGB(235, 150, 70)  },
    { name = "وردي",          color = Color3.fromRGB(232, 110, 160) },
}

--==[ الحالة (State) ]==--
local State = {
    -- Movement
    SpeedEnabled = false, WalkSpeed = 75,
    FlyEnabled = false, FlySpeed = 60,
    NoclipEnabled = false,
    InfJumpEnabled = false,
    SpiderEnabled = false,
    -- Visual
    EspEnabled = false,
    Fullbright = false,
    NoFog = false,
    Fov = 70,
    FreecamEnabled = false,
    -- Server
    AntiAfk = false,
    -- Settings
    ToggleKey = Enum.KeyCode.K,
    AccentIndex = 1,
}

--==[ حفظ الإعدادات ]==--
local CFG_FOLDER = "OGSchoolHub"
local CFG_PATH = CFG_FOLDER .. "/config.json"

local SAVE_KEYS = {
    "WalkSpeed", "FlySpeed", "Fov", "AccentIndex",
    "SpeedEnabled", "FlyEnabled", "EspEnabled", "Fullbright", "NoFog", "AntiAfk",
}

local function saveConfig()
    if not writefile_fn then return end
    pcall(function()
        if makefolder_fn and isfolder_fn and not isfolder_fn(CFG_FOLDER) then
            makefolder_fn(CFG_FOLDER)
        end
        local data = {}
        for _, k in ipairs(SAVE_KEYS) do data[k] = State[k] end
        writefile_fn(CFG_PATH, HttpService:JSONEncode(data))
    end)
end

local function loadConfig()
    if not (readfile_fn and isfile_fn) then return end
    pcall(function()
        if not isfile_fn(CFG_PATH) then return end
        local data = HttpService:JSONDecode(readfile_fn(CFG_PATH))
        for _, k in ipairs(SAVE_KEYS) do
            if data[k] ~= nil then State[k] = data[k] end
        end
    end)
end

--==[ مساعدات الشخصية ]==--
local function getChar()
    local char = LocalPlayer.Character
    if not char then return nil end
    local hum  = char:FindFirstChildWhichIsA("Humanoid")
    local root = char:FindFirstChild("HumanoidRootPart") or char:FindFirstChild("Torso") or char:FindFirstChild("UpperTorso")
    return char, hum, root
end

track(LocalPlayer.CharacterAdded:Connect(function()
    task.wait(0.4)
    Camera = workspace.CurrentCamera
end))

--==[ مصنع عناصر الواجهة ]==--
local function new(class, props, children)
    local inst = Instance.new(class)
    if props then
        for k, v in pairs(props) do
            if k ~= "Parent" then inst[k] = v end
        end
    end
    if children then
        for _, c in ipairs(children) do c.Parent = inst end
    end
    if props and props.Parent then inst.Parent = props.Parent end
    return inst
end

local function corner(inst, r)
    new("UICorner", { CornerRadius = UDim.new(0, r or 8), Parent = inst })
    return inst
end

local function stroke(inst, color, thickness)
    return new("UIStroke", {
        Color = color or THEME.Stroke,
        Thickness = thickness or 1,
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
        Parent = inst,
    })
end

local function pad(inst, l, r, t, b)
    new("UIPadding", {
        PaddingLeft = UDim.new(0, l or 0),
        PaddingRight = UDim.new(0, r or 0),
        PaddingTop = UDim.new(0, t or 0),
        PaddingBottom = UDim.new(0, b or 0),
        Parent = inst,
    })
    return inst
end

-- عناصر تتلوّن مع تغيّر الـ Accent
local accentText = {}
local accentBg = {}
local accentStroke = {}

local function trackAccentText(o) table.insert(accentText, o) end
local function trackAccentBg(o) table.insert(accentBg, o) end
local function trackAccentStroke(o) table.insert(accentStroke, o) end

local function applyAccent(color)
    THEME.Accent = color
    for _, o in ipairs(accentText) do pcall(function() o.TextColor3 = color end) end
    for _, o in ipairs(accentBg) do pcall(function() o.BackgroundColor3 = color end) end
    for _, o in ipairs(accentStroke) do pcall(function() o.Color = color end) end
end

--==[ بناء الواجهة ]==--
local function getGuiParent()
    if gethui_fn then
        local ok, hui = pcall(gethui_fn)
        if ok and hui then return hui end
    end
    return CoreGui
end

local screenGui = new("ScreenGui", {
    Name = "OGSchoolHub_" .. tostring(math.random(1000, 9999)),
    ResetOnSpawn = false,
    ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
    IgnoreGuiInset = true,
})
if protectgui_fn then pcall(protectgui_fn, screenGui) end
screenGui.Parent = getGuiParent()

-- النافذة الرئيسية
local WIN_W, WIN_H = 660, 430
local window = new("Frame", {
    Name = "Window",
    Size = UDim2.new(0, WIN_W, 0, WIN_H),
    Position = UDim2.new(0.5, -WIN_W / 2, 0.5, -WIN_H / 2),
    BackgroundColor3 = THEME.Bg,
    BorderSizePixel = 0,
    Parent = screenGui,
})
corner(window, 14)
stroke(window, THEME.Stroke, 2)
new("UIScale", { Name = "Scale", Parent = window })

-- شريط العنوان
local titleBar = new("Frame", {
    Name = "TitleBar",
    Size = UDim2.new(1, 0, 0, 50),
    BackgroundColor3 = THEME.Bg2,
    BorderSizePixel = 0,
    Parent = window,
})
corner(titleBar, 14)
new("Frame", { -- يغطي الأركان السفلية للعنوان
    Size = UDim2.new(1, 0, 0, 16),
    Position = UDim2.new(0, 0, 1, -16),
    BackgroundColor3 = THEME.Bg2,
    BorderSizePixel = 0,
    Parent = titleBar,
})

local logo = new("Frame", {
    Size = UDim2.new(0, 32, 0, 32),
    Position = UDim2.new(0, 12, 0.5, -16),
    BackgroundColor3 = THEME.AccentD,
    BorderSizePixel = 0,
    Parent = titleBar,
})
corner(logo, 8)
trackAccentStroke(stroke(logo, THEME.Accent, 1.5))
new("TextLabel", {
    Size = UDim2.new(1, 0, 1, 0),
    BackgroundTransparency = 1,
    Text = "SC",
    Font = Enum.Font.GothamBold,
    TextSize = 14,
    TextColor3 = THEME.Chalk,
    Parent = logo,
})

new("TextLabel", {
    Size = UDim2.new(0, 220, 0, 20),
    Position = UDim2.new(0, 54, 0, 8),
    BackgroundTransparency = 1,
    Text = "OG School Hub",
    Font = Enum.Font.GothamBold,
    TextSize = 16,
    TextColor3 = THEME.Txt,
    TextXAlignment = Enum.TextXAlignment.Left,
    Parent = titleBar,
})
new("TextLabel", {
    Size = UDim2.new(0, 220, 0, 16),
    Position = UDim2.new(0, 54, 0, 28),
    BackgroundTransparency = 1,
    Text = "لوحة تحكم احترافية",
    Font = Enum.Font.Gotham,
    TextSize = 12,
    TextColor3 = THEME.Sub,
    TextXAlignment = Enum.TextXAlignment.Left,
    Parent = titleBar,
})

-- عدّاد اللاعبين
local onlinePill = new("Frame", {
    Size = UDim2.new(0, 120, 0, 26),
    Position = UDim2.new(1, -210, 0.5, -13),
    BackgroundColor3 = THEME.Card,
    BorderSizePixel = 0,
    Parent = titleBar,
})
corner(onlinePill, 13)
stroke(onlinePill, THEME.Stroke, 1)
new("Frame", {
    Size = UDim2.new(0, 8, 0, 8),
    Position = UDim2.new(0, 10, 0.5, -4),
    BackgroundColor3 = THEME.Green,
    BorderSizePixel = 0,
    Parent = onlinePill,
}).Name = "Dot"
local onlineLabel = new("TextLabel", {
    Size = UDim2.new(1, -28, 1, 0),
    Position = UDim2.new(0, 22, 0, 0),
    BackgroundTransparency = 1,
    Text = "متصل: --",
    Font = Enum.Font.GothamMedium,
    TextSize = 12,
    TextColor3 = THEME.Txt,
    TextXAlignment = Enum.TextXAlignment.Left,
    Parent = onlinePill,
})

-- أزرار تصغير/إغلاق
local function titleButton(xOff, txt, color)
    local b = new("TextButton", {
        Size = UDim2.new(0, 30, 0, 30),
        Position = UDim2.new(1, xOff, 0.5, -15),
        BackgroundColor3 = THEME.Card,
        BorderSizePixel = 0,
        AutoButtonColor = true,
        Text = txt,
        Font = Enum.Font.GothamBold,
        TextSize = 16,
        TextColor3 = color or THEME.Sub,
        Parent = titleBar,
    })
    corner(b, 8)
    stroke(b, THEME.Stroke, 1)
    return b
end
local closeBtn = titleButton(-40, "✕", THEME.Red)
local minBtn = titleButton(-76, "—", THEME.Sub)

-- الشريط الجانبي
local SIDE_W = 168
local sidebar = new("Frame", {
    Name = "Sidebar",
    Size = UDim2.new(0, SIDE_W, 1, -50),
    Position = UDim2.new(0, 0, 0, 50),
    BackgroundColor3 = THEME.Side,
    BorderSizePixel = 0,
    Parent = window,
})
new("Frame", { -- خط فاصل
    Size = UDim2.new(0, 2, 1, 0),
    Position = UDim2.new(1, -2, 0, 0),
    BackgroundColor3 = THEME.Stroke,
    BorderSizePixel = 0,
    Parent = sidebar,
})
local sideList = new("Frame", {
    Size = UDim2.new(1, 0, 1, -56),
    BackgroundTransparency = 1,
    Parent = sidebar,
})
pad(sideList, 12, 12, 12, 0)
new("UIListLayout", {
    Padding = UDim.new(0, 8),
    SortOrder = Enum.SortOrder.LayoutOrder,
    Parent = sideList,
})

-- footer الشريط الجانبي
local sideFooter = new("Frame", {
    Size = UDim2.new(1, -24, 0, 40),
    Position = UDim2.new(0, 12, 1, -48),
    BackgroundTransparency = 1,
    Parent = sidebar,
})
local keyHintLabel = new("TextLabel", {
    Size = UDim2.new(1, 0, 0, 16),
    BackgroundTransparency = 1,
    Text = "مفتاح القائمة: K",
    Font = Enum.Font.Gotham,
    TextSize = 11,
    TextColor3 = THEME.Mut,
    TextXAlignment = Enum.TextXAlignment.Right,
    Parent = sideFooter,
})
new("TextLabel", {
    Size = UDim2.new(1, 0, 0, 14),
    Position = UDim2.new(0, 0, 0, 18),
    BackgroundTransparency = 1,
    Text = "Made for alitravians",
    Font = Enum.Font.Gotham,
    TextSize = 10,
    TextColor3 = THEME.Mut,
    TextXAlignment = Enum.TextXAlignment.Right,
    Parent = sideFooter,
})

-- منطقة المحتوى
local content = new("Frame", {
    Name = "Content",
    Size = UDim2.new(1, -SIDE_W - 2, 1, -50),
    Position = UDim2.new(0, SIDE_W + 2, 0, 50),
    BackgroundTransparency = 1,
    Parent = window,
})

-- إنشاء التبويبات
local tabs = {}        -- name -> { button, page }
local tabOrder = {}
local currentTab

local function makeTabPage()
    local page = new("ScrollingFrame", {
        Size = UDim2.new(1, 0, 1, 0),
        BackgroundTransparency = 1,
        BorderSizePixel = 0,
        ScrollBarThickness = 4,
        ScrollBarImageColor3 = THEME.Stroke,
        CanvasSize = UDim2.new(0, 0, 0, 0),
        AutomaticCanvasSize = Enum.AutomaticSize.Y,
        Visible = false,
        Parent = content,
    })
    pad(page, 18, 18, 14, 14)
    new("UIListLayout", {
        Padding = UDim.new(0, 12),
        SortOrder = Enum.SortOrder.LayoutOrder,
        Parent = page,
    })
    return page
end

local function selectTab(name)
    for n, t in pairs(tabs) do
        local sel = (n == name)
        t.page.Visible = sel
        t.button.BackgroundColor3 = sel and THEME.Card or THEME.Side
        t.label.TextColor3 = sel and THEME.Txt or THEME.Sub
        t.accent.Visible = sel
        local st = t.button:FindFirstChildWhichIsA("UIStroke")
        if st then st.Transparency = sel and 0 or 1 end
    end
    currentTab = name
end

local function addTab(name, icon, order)
    local btn = new("TextButton", {
        Name = name,
        Size = UDim2.new(1, 0, 0, 46),
        BackgroundColor3 = THEME.Side,
        BorderSizePixel = 0,
        AutoButtonColor = false,
        Text = "",
        LayoutOrder = order,
        Parent = sideList,
    })
    corner(btn, 10)
    local btnStroke = stroke(btn, THEME.Accent, 1.5)
    btnStroke.Transparency = 1
    trackAccentStroke(btnStroke)

    local accentBar = new("Frame", {
        Size = UDim2.new(0, 3, 0, 24),
        Position = UDim2.new(0, 4, 0.5, -12),
        BackgroundColor3 = THEME.Accent,
        BorderSizePixel = 0,
        Visible = false,
        Parent = btn,
    })
    corner(accentBar, 2)
    trackAccentBg(accentBar)

    new("TextLabel", {
        Size = UDim2.new(0, 28, 1, 0),
        Position = UDim2.new(1, -38, 0, 0),
        BackgroundTransparency = 1,
        Text = icon,
        Font = Enum.Font.GothamBold,
        TextSize = 16,
        TextColor3 = THEME.Sub,
        Parent = btn,
    })
    local lbl = new("TextLabel", {
        Size = UDim2.new(1, -52, 1, 0),
        Position = UDim2.new(0, 8, 0, 0),
        BackgroundTransparency = 1,
        Text = name,
        Font = Enum.Font.GothamMedium,
        TextSize = 14,
        TextColor3 = THEME.Sub,
        TextXAlignment = Enum.TextXAlignment.Right,
        Parent = btn,
    })

    local page = makeTabPage()
    tabs[name] = { button = btn, page = page, label = lbl, accent = accentBar }
    table.insert(tabOrder, name)

    btn.MouseButton1Click:Connect(function() selectTab(name) end)
    return page
end

--==[ مكوّنات داخل الصفحات ]==--
local function sectionHeader(parent, title, order)
    local f = new("Frame", {
        Size = UDim2.new(1, 0, 0, 40),
        BackgroundTransparency = 1,
        LayoutOrder = order or 0,
        Parent = parent,
    })
    new("TextLabel", {
        Size = UDim2.new(1, 0, 0, 22),
        BackgroundTransparency = 1,
        Text = title,
        Font = Enum.Font.GothamBold,
        TextSize = 18,
        TextColor3 = THEME.Txt,
        TextXAlignment = Enum.TextXAlignment.Right,
        Parent = f,
    })
    new("Frame", {
        Size = UDim2.new(1, 0, 0, 1),
        Position = UDim2.new(0, 0, 1, -2),
        BackgroundColor3 = THEME.Stroke,
        BorderSizePixel = 0,
        Parent = f,
    })
    return f
end

local function makeCard(parent, height, order)
    local c = new("Frame", {
        Size = UDim2.new(1, 0, 0, height),
        BackgroundColor3 = THEME.Card,
        BorderSizePixel = 0,
        LayoutOrder = order or 0,
        Parent = parent,
    })
    corner(c, 12)
    stroke(c, THEME.Stroke, 1)
    return c
end

local function makeToggle(parent, title, desc, key, order, onChange)
    local card = makeCard(parent, 64, order)
    new("TextLabel", {
        Size = UDim2.new(1, -90, 0, 22),
        Position = UDim2.new(0, 14, 0, 10),
        BackgroundTransparency = 1,
        Text = title,
        Font = Enum.Font.GothamBold,
        TextSize = 15,
        TextColor3 = THEME.Txt,
        TextXAlignment = Enum.TextXAlignment.Right,
        Parent = card,
    })
    if desc then
        new("TextLabel", {
            Size = UDim2.new(1, -90, 0, 18),
            Position = UDim2.new(0, 14, 0, 34),
            BackgroundTransparency = 1,
            Text = desc,
            Font = Enum.Font.Gotham,
            TextSize = 12,
            TextColor3 = THEME.Sub,
            TextXAlignment = Enum.TextXAlignment.Right,
            Parent = card,
        })
    end

    local track = new("TextButton", {
        Size = UDim2.new(0, 50, 0, 26),
        Position = UDim2.new(1, -66, 0.5, -13),
        BackgroundColor3 = THEME.Track,
        BorderSizePixel = 0,
        AutoButtonColor = false,
        Text = "",
        Parent = card,
    })
    corner(track, 13)
    local knob = new("Frame", {
        Size = UDim2.new(0, 22, 0, 22),
        Position = UDim2.new(0, 2, 0.5, -11),
        BackgroundColor3 = THEME.Chalk,
        BorderSizePixel = 0,
        Parent = track,
    })
    corner(knob, 11)

    local function render()
        local on = State[key]
        TweenService:Create(track, TweenInfo.new(0.18), {
            BackgroundColor3 = on and THEME.Green or THEME.Track,
        }):Play()
        TweenService:Create(knob, TweenInfo.new(0.18), {
            Position = on and UDim2.new(1, -24, 0.5, -11) or UDim2.new(0, 2, 0.5, -11),
        }):Play()
    end

    track.MouseButton1Click:Connect(function()
        State[key] = not State[key]
        render()
        if onChange then task.spawn(onChange, State[key]) end
        saveConfig()
    end)
    render()

    return { Set = function(v) State[key] = v render() end, Render = render }
end

local function makeSlider(parent, title, key, minV, maxV, suffix, order, onChange)
    local card = makeCard(parent, 70, order)
    new("TextLabel", {
        Size = UDim2.new(1, -28, 0, 22),
        Position = UDim2.new(0, 14, 0, 8),
        BackgroundTransparency = 1,
        Text = title,
        Font = Enum.Font.GothamBold,
        TextSize = 15,
        TextColor3 = THEME.Txt,
        TextXAlignment = Enum.TextXAlignment.Right,
        Parent = card,
    })
    local valLabel = new("TextLabel", {
        Size = UDim2.new(0, 120, 0, 22),
        Position = UDim2.new(0, 14, 0, 8),
        BackgroundTransparency = 1,
        Text = "",
        Font = Enum.Font.GothamBold,
        TextSize = 14,
        TextColor3 = THEME.Accent,
        TextXAlignment = Enum.TextXAlignment.Left,
        Parent = card,
    })
    trackAccentText(valLabel)

    local barBg = new("Frame", {
        Size = UDim2.new(1, -28, 0, 8),
        Position = UDim2.new(0, 14, 0, 44),
        BackgroundColor3 = THEME.Track,
        BorderSizePixel = 0,
        Parent = card,
    })
    corner(barBg, 4)
    local fill = new("Frame", {
        Size = UDim2.new(0, 0, 1, 0),
        BackgroundColor3 = THEME.Accent,
        BorderSizePixel = 0,
        Parent = barBg,
    })
    corner(fill, 4)
    trackAccentBg(fill)
    local knob = new("Frame", {
        Size = UDim2.new(0, 14, 0, 14),
        AnchorPoint = Vector2.new(0.5, 0.5),
        Position = UDim2.new(0, 0, 0.5, 0),
        BackgroundColor3 = THEME.Chalk,
        BorderSizePixel = 0,
        ZIndex = 3,
        Parent = barBg,
    })
    corner(knob, 7)
    trackAccentStroke(stroke(knob, THEME.Accent, 2))

    local function render()
        local v = math.clamp(State[key], minV, maxV)
        local frac = (v - minV) / (maxV - minV)
        fill.Size = UDim2.new(frac, 0, 1, 0)
        knob.Position = UDim2.new(frac, 0, 0.5, 0)
        valLabel.Text = tostring(math.floor(v)) .. (suffix or "")
    end

    local dragging = false
    local function setFromX(x)
        local frac = math.clamp((x - barBg.AbsolutePosition.X) / barBg.AbsoluteSize.X, 0, 1)
        State[key] = math.floor(minV + (maxV - minV) * frac)
        render()
        if onChange then task.spawn(onChange, State[key]) end
    end

    barBg.InputBegan:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            setFromX(i.Position.X)
        end
    end)
    track(UserInputService.InputChanged:Connect(function(i)
        if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
            setFromX(i.Position.X)
        end
    end))
    track(UserInputService.InputEnded:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
            if dragging then saveConfig() end
            dragging = false
        end
    end))

    render()
    return { Set = function(v) State[key] = v render() end, Render = render }
end

local function makeButton(parent, text, order, color, onClick)
    local b = new("TextButton", {
        Size = UDim2.new(1, 0, 0, 42),
        BackgroundColor3 = color or THEME.Card2,
        BorderSizePixel = 0,
        AutoButtonColor = true,
        Text = text,
        Font = Enum.Font.GothamBold,
        TextSize = 15,
        TextColor3 = THEME.Txt,
        LayoutOrder = order or 0,
        Parent = parent,
    })
    corner(b, 10)
    stroke(b, THEME.Stroke, 1)
    b.MouseButton1Click:Connect(function()
        if onClick then task.spawn(onClick) end
    end)
    return b
end

--==[ التبويبات والصفحات ]==--
local pageMain    = addTab("الرئيسية", "⌂", 1)
local pageMove    = addTab("الحركة", "↗", 2)
local pagePlayers = addTab("اللاعبون", "☻", 3)
local pageVisual  = addTab("الرؤية", "◉", 4)
local pageServer  = addTab("السيرفر", "⛁", 5)
local pageSettings= addTab("الإعدادات", "⚙", 6)

------------------------------------------------------------
-- صفحة: الرئيسية
------------------------------------------------------------
sectionHeader(pageMain, "نظرة عامة", 1)
do
    local card = makeCard(pageMain, 96, 2)
    pad(card, 14, 14, 12, 12)
    new("UIListLayout", { Padding = UDim.new(0, 6), Parent = card })
    local function infoRow(txt)
        local l = new("TextLabel", {
            Size = UDim2.new(1, 0, 0, 22),
            BackgroundTransparency = 1,
            Text = txt,
            Font = Enum.Font.GothamMedium,
            TextSize = 13,
            TextColor3 = THEME.Sub,
            TextXAlignment = Enum.TextXAlignment.Right,
            Parent = card,
        })
        return l
    end
    infoRow("اللعبة: المدرسة | OG-School")
    infoRow("معرّف اللعبة (PlaceId): " .. tostring(game.PlaceId))
    local serverRow = infoRow("معرّف السيرفر (JobId): ...")
    task.defer(function()
        serverRow.Text = "معرّف السيرفر (JobId): " .. string.sub(tostring(game.JobId), 1, 8) .. "..."
    end)
end
sectionHeader(pageMain, "تشغيل سريع", 3)
local quickSpeed = makeToggle(pageMain, "السرعة", "تحكم بسرعة الجري داخل المدرسة", "SpeedEnabled", 4)
local quickFly   = makeToggle(pageMain, "الطيران", "طيران حر بالكاميرا", "FlyEnabled", 5)
local quickEsp   = makeToggle(pageMain, "أسماء اللاعبين (ESP)", "إظهار أسماء وصناديق فوق الجميع", "EspEnabled", 6)

------------------------------------------------------------
-- صفحة: الحركة
------------------------------------------------------------
sectionHeader(pageMove, "الحركة والتنقل", 1)
local tSpeed = makeToggle(pageMove, "السرعة", "تحكم بسرعة الجري داخل المدرسة", "SpeedEnabled", 2)
local sSpeed = makeSlider(pageMove, "سرعة المشي", "WalkSpeed", 16, 250, " ", 3)
local tFly   = makeToggle(pageMove, "الطيران", "طيران حر بالكاميرا — مثالي للتنقل بين الفصول", "FlyEnabled", 4)
local sFly   = makeSlider(pageMove, "سرعة الطيران", "FlySpeed", 20, 250, " ", 5)
makeToggle(pageMove, "اختراق الجدران", "المرور عبر الجدران والأبواب بدون اصطدام", "NoclipEnabled", 6)
makeToggle(pageMove, "قفز لا نهائي", "اقفز بدون توقّف", "InfJumpEnabled", 7)
makeToggle(pageMove, "المشي على الجدران", "تسلّق الجدران عند الاقتراب منها", "SpiderEnabled", 8)

------------------------------------------------------------
-- صفحة: اللاعبون
------------------------------------------------------------
sectionHeader(pagePlayers, "اللاعبون في السيرفر", 1)
local tEsp = makeToggle(pagePlayers, "أسماء اللاعبين (ESP)", "إظهار أسماء وصناديق فوق الجميع", "EspEnabled", 2)
local playerListCard = makeCard(pagePlayers, 250, 3)
pad(playerListCard, 8, 8, 8, 8)
local playerScroll = new("ScrollingFrame", {
    Size = UDim2.new(1, 0, 1, 0),
    BackgroundTransparency = 1,
    BorderSizePixel = 0,
    ScrollBarThickness = 4,
    ScrollBarImageColor3 = THEME.Stroke,
    CanvasSize = UDim2.new(0, 0, 0, 0),
    AutomaticCanvasSize = Enum.AutomaticSize.Y,
    Parent = playerListCard,
})
new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.Name, Parent = playerScroll })

local function teleportToPlayer(target)
    local _, _, root = getChar()
    local tchar = target.Character
    local troot = tchar and (tchar:FindFirstChild("HumanoidRootPart") or tchar:FindFirstChild("Torso"))
    if root and troot then
        root.CFrame = troot.CFrame * CFrame.new(0, 0, 3)
        notify("انتقال", "تم الانتقال إلى " .. target.DisplayName, 3)
    else
        notify("انتقال", "تعذّر إيجاد اللاعب", 3)
    end
end

local spectating = nil
local function spectatePlayer(target)
    if target == LocalPlayer then return end
    local tchar = target.Character
    local thum = tchar and tchar:FindFirstChildWhichIsA("Humanoid")
    if thum then
        Camera.CameraSubject = thum
        spectating = target
        notify("مراقبة", "تراقب الآن " .. target.DisplayName .. " — اضغط زر المراقبة مجددًا للإيقاف", 4)
    end
end
local function stopSpectate()
    local _, hum = getChar()
    if hum then Camera.CameraSubject = hum end
    spectating = nil
end

local function makePlayerRow(plr)
    local row = new("Frame", {
        Name = plr.Name,
        Size = UDim2.new(1, 0, 0, 40),
        BackgroundColor3 = THEME.Card2,
        BorderSizePixel = 0,
        Parent = playerScroll,
    })
    corner(row, 8)
    new("TextLabel", {
        Size = UDim2.new(1, -180, 1, 0),
        Position = UDim2.new(0, 0, 0, 0),
        BackgroundTransparency = 1,
        Text = plr.DisplayName .. "  (@" .. plr.Name .. ")",
        Font = Enum.Font.GothamMedium,
        TextSize = 12,
        TextColor3 = THEME.Txt,
        TextXAlignment = Enum.TextXAlignment.Right,
        TextTruncate = Enum.TextTruncate.AtEnd,
        Parent = row,
    }).Name = "NameLbl"
    new("UIPadding", { PaddingRight = UDim.new(0, 10), Parent = row })

    local tpBtn = new("TextButton", {
        Size = UDim2.new(0, 70, 0, 28),
        Position = UDim2.new(0, 8, 0.5, -14),
        BackgroundColor3 = THEME.AccentD,
        BorderSizePixel = 0,
        Text = "انتقال",
        Font = Enum.Font.GothamBold,
        TextSize = 12,
        TextColor3 = THEME.Chalk,
        Parent = row,
    })
    corner(tpBtn, 7)
    tpBtn.MouseButton1Click:Connect(function() teleportToPlayer(plr) end)

    local specBtn = new("TextButton", {
        Size = UDim2.new(0, 80, 0, 28),
        Position = UDim2.new(0, 84, 0.5, -14),
        BackgroundColor3 = THEME.Card,
        BorderSizePixel = 0,
        Text = "مراقبة",
        Font = Enum.Font.GothamBold,
        TextSize = 12,
        TextColor3 = THEME.Txt,
        Parent = row,
    })
    corner(specBtn, 7)
    stroke(specBtn, THEME.Stroke, 1)
    specBtn.MouseButton1Click:Connect(function()
        if spectating == plr then stopSpectate() else spectatePlayer(plr) end
    end)

    return row
end

local function refreshPlayerList()
    for _, c in ipairs(playerScroll:GetChildren()) do
        if c:IsA("Frame") then c:Destroy() end
    end
    for _, plr in ipairs(Players:GetPlayers()) do
        if plr ~= LocalPlayer then
            pcall(makePlayerRow, plr)
        end
    end
end
track(Players.PlayerAdded:Connect(function() task.wait(0.3) refreshPlayerList() end))
track(Players.PlayerRemoving:Connect(function() task.wait(0.3) refreshPlayerList() end))
task.defer(refreshPlayerList)

------------------------------------------------------------
-- صفحة: الرؤية
------------------------------------------------------------
sectionHeader(pageVisual, "الرؤية والإضاءة", 1)
makeToggle(pageVisual, "إضاءة كاملة", "إزالة الظلام لرؤية كل المدرسة", "Fullbright", 2)
makeToggle(pageVisual, "إزالة الضباب", "مسح الضباب لرؤية أوضح", "NoFog", 3)
local sFov  = makeSlider(pageVisual, "زاوية الرؤية (FOV)", "Fov", 40, 120, "°", 4)
makeToggle(pageVisual, "كاميرا حرة", "WASD للحركة • الأسهم للنظر • مسافة/Ctrl للأعلى والأسفل", "FreecamEnabled", 5)

------------------------------------------------------------
-- صفحة: السيرفر
------------------------------------------------------------
sectionHeader(pageServer, "أدوات السيرفر", 1)
makeToggle(pageServer, "منع الطرد بالخمول", "يمنع طردك بسبب عدم النشاط", "AntiAfk", 2)
makeButton(pageServer, "إعادة الانضمام (Rejoin)", 3, THEME.Card2, function()
    notify("سيرفر", "جاري إعادة الانضمام...", 3)
    pcall(function() TeleportService:TeleportToPlaceInstance(game.PlaceId, game.JobId, LocalPlayer) end)
end)
makeButton(pageServer, "تبديل سيرفر (Server Hop)", 4, THEME.AccentD, function()
    notify("سيرفر", "جاري البحث عن سيرفر آخر...", 3)
    task.spawn(function()
        local url = ("https://games.roblox.com/v1/games/%d/servers/Public?sortOrder=Desc&limit=100"):format(game.PlaceId)
        local ok, body = pcall(function() return game:HttpGet(url) end)
        if not ok then notify("سيرفر", "تعذّر جلب قائمة السيرفرات", 4) return end
        local okj, data = pcall(function() return HttpService:JSONDecode(body) end)
        if not okj or not data.data then notify("سيرفر", "خطأ في البيانات", 4) return end
        local servers = {}
        for _, s in ipairs(data.data) do
            if s.id ~= game.JobId and s.playing and s.maxPlayers and s.playing < s.maxPlayers then
                table.insert(servers, s)
            end
        end
        if #servers == 0 then notify("سيرفر", "لا يوجد سيرفر متاح حاليًا", 4) return end
        local pick = servers[math.random(1, #servers)]
        pcall(function() TeleportService:TeleportToPlaceInstance(game.PlaceId, pick.id, LocalPlayer) end)
    end)
end)
makeButton(pageServer, "نسخ معرّف السيرفر (Job ID)", 5, THEME.Card2, function()
    if setclip_fn then
        pcall(setclip_fn, game.JobId)
        notify("نسخ", "تم نسخ معرّف السيرفر", 3)
    else
        notify("نسخ", "النسخ غير مدعوم في هذا المنفّذ", 4)
    end
end)

------------------------------------------------------------
-- صفحة: الإعدادات
------------------------------------------------------------
sectionHeader(pageSettings, "الإعدادات", 1)
do
    local card = makeCard(pageSettings, 70, 2)
    new("TextLabel", {
        Size = UDim2.new(1, -28, 0, 22),
        Position = UDim2.new(0, 14, 0, 8),
        BackgroundTransparency = 1,
        Text = "لون الواجهة (Accent)",
        Font = Enum.Font.GothamBold,
        TextSize = 15,
        TextColor3 = THEME.Txt,
        TextXAlignment = Enum.TextXAlignment.Right,
        Parent = card,
    })
    local holder = new("Frame", {
        Size = UDim2.new(1, -28, 0, 26),
        Position = UDim2.new(0, 14, 0, 36),
        BackgroundTransparency = 1,
        Parent = card,
    })
    new("UIListLayout", {
        FillDirection = Enum.FillDirection.Horizontal,
        Padding = UDim.new(0, 8),
        Parent = holder,
    })
    for i, preset in ipairs(ACCENT_PRESETS) do
        local sw = new("TextButton", {
            Size = UDim2.new(0, 26, 0, 26),
            BackgroundColor3 = preset.color,
            BorderSizePixel = 0,
            Text = "",
            LayoutOrder = i,
            Parent = holder,
        })
        corner(sw, 13)
        stroke(sw, THEME.Stroke, 1)
        sw.MouseButton1Click:Connect(function()
            State.AccentIndex = i
            applyAccent(preset.color)
            saveConfig()
        end)
    end
end
makeButton(pageSettings, "حفظ الإعدادات", 3, THEME.AccentD, function()
    saveConfig()
    notify("إعدادات", "تم حفظ الإعدادات", 3)
end)
makeButton(pageSettings, "إغلاق السكربت (Unload)", 4, THEME.Card2, function()
    if _G.__OG_SCHOOL_HUB_UNLOAD then _G.__OG_SCHOOL_HUB_UNLOAD() end
end)
new("TextLabel", {
    Size = UDim2.new(1, 0, 0, 40),
    BackgroundTransparency = 1,
    Text = "نسخة " .. VERSION .. " • سكربت عام يعمل بأي لعبة\nاضغط مفتاح K لإظهار/إخفاء القائمة",
    Font = Enum.Font.Gotham,
    TextSize = 12,
    TextColor3 = THEME.Mut,
    TextWrapped = true,
    TextXAlignment = Enum.TextXAlignment.Right,
    LayoutOrder = 5,
    Parent = pageSettings,
})

--==[ سحب النافذة ]==--
do
    local dragging, dragStart, startPos = false, nil, nil
    titleBar.InputBegan:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = i.Position
            startPos = window.Position
        end
    end)
    track(UserInputService.InputChanged:Connect(function(i)
        if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
            local delta = i.Position - dragStart
            window.Position = UDim2.new(
                startPos.X.Scale, startPos.X.Offset + delta.X,
                startPos.Y.Scale, startPos.Y.Offset + delta.Y
            )
        end
    end))
    track(UserInputService.InputEnded:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
            dragging = false
        end
    end))
end

--==[ تصغير / إغلاق / مفتاح ]==--
local minimized = false
minBtn.MouseButton1Click:Connect(function()
    minimized = not minimized
    local targetH = minimized and 50 or WIN_H
    TweenService:Create(window, TweenInfo.new(0.2), { Size = UDim2.new(0, WIN_W, 0, targetH) }):Play()
    content.Visible = not minimized
    sidebar.Visible = not minimized
end)

local guiVisible = true
local function setGuiVisible(v)
    guiVisible = v
    window.Visible = v
end
closeBtn.MouseButton1Click:Connect(function() setGuiVisible(false) end)

track(UserInputService.InputBegan:Connect(function(input, gpe)
    if gpe then return end
    if input.KeyCode == State.ToggleKey then
        setGuiVisible(not guiVisible)
    end
end))

------------------------------------------------------------
-- تنفيذ الميزات
------------------------------------------------------------

--==[ الطيران ]==--
local flyBV, flyBG
local flyControls = { F = 0, B = 0, L = 0, R = 0, U = 0, D = 0 }

local function stopFly()
    if flyBV then flyBV:Destroy() flyBV = nil end
    if flyBG then flyBG:Destroy() flyBG = nil end
    local _, hum = getChar()
    if hum then hum.PlatformStand = false end
end

local function startFly()
    local _, hum, root = getChar()
    if not (hum and root) then return end
    stopFly()
    hum.PlatformStand = true
    flyBG = Instance.new("BodyGyro")
    flyBG.P = 9e4
    flyBG.MaxTorque = Vector3.new(9e9, 9e9, 9e9)
    flyBG.CFrame = root.CFrame
    flyBG.Parent = root
    flyBV = Instance.new("BodyVelocity")
    flyBV.MaxForce = Vector3.new(9e9, 9e9, 9e9)
    flyBV.Velocity = Vector3.zero
    flyBV.Parent = root
end

track(UserInputService.InputBegan:Connect(function(i, gpe)
    if gpe or not State.FlyEnabled then return end
    local k = i.KeyCode
    if k == Enum.KeyCode.W then flyControls.F = 1
    elseif k == Enum.KeyCode.S then flyControls.B = 1
    elseif k == Enum.KeyCode.A then flyControls.L = 1
    elseif k == Enum.KeyCode.D then flyControls.R = 1
    elseif k == Enum.KeyCode.Space then flyControls.U = 1
    elseif k == Enum.KeyCode.LeftShift then flyControls.D = 1 end
end))
track(UserInputService.InputEnded:Connect(function(i)
    local k = i.KeyCode
    if k == Enum.KeyCode.W then flyControls.F = 0
    elseif k == Enum.KeyCode.S then flyControls.B = 0
    elseif k == Enum.KeyCode.A then flyControls.L = 0
    elseif k == Enum.KeyCode.D then flyControls.R = 0
    elseif k == Enum.KeyCode.Space then flyControls.U = 0
    elseif k == Enum.KeyCode.LeftShift then flyControls.D = 0 end
end))

--==[ ESP ]==--
local espObjects = {}  -- player -> { highlight, billboard }

local function removeEsp(plr)
    local e = espObjects[plr]
    if e then
        if e.highlight then pcall(function() e.highlight:Destroy() end) end
        if e.billboard then pcall(function() e.billboard:Destroy() end) end
        espObjects[plr] = nil
    end
end

local function addEsp(plr)
    if plr == LocalPlayer then return end
    local char = plr.Character
    if not char then return end
    if espObjects[plr] then return end
    local head = char:FindFirstChild("Head")
    if not head then return end

    local hl = Instance.new("Highlight")
    hl.FillColor = THEME.Accent
    hl.FillTransparency = 0.7
    hl.OutlineColor = THEME.Chalk
    hl.OutlineTransparency = 0
    pcall(function() hl.Adornee = char hl.Parent = char end)

    local bb = Instance.new("BillboardGui")
    bb.Size = UDim2.new(0, 120, 0, 20)
    bb.StudsOffset = Vector3.new(0, 2.6, 0)
    bb.AlwaysOnTop = true
    bb.Adornee = head
    local tl = Instance.new("TextLabel")
    tl.Size = UDim2.new(1, 0, 1, 0)
    tl.BackgroundTransparency = 1
    tl.Text = plr.DisplayName
    tl.Font = Enum.Font.GothamBold
    tl.TextSize = 13
    tl.TextColor3 = THEME.Chalk
    tl.TextStrokeTransparency = 0.4
    tl.Parent = bb
    pcall(function() bb.Parent = head end)

    espObjects[plr] = { highlight = hl, billboard = bb }
end

local function refreshEsp()
    if State.EspEnabled then
        for _, plr in ipairs(Players:GetPlayers()) do
            if plr ~= LocalPlayer then pcall(addEsp, plr) end
        end
    else
        for plr in pairs(espObjects) do removeEsp(plr) end
    end
end

for _, plr in ipairs(Players:GetPlayers()) do
    track(plr.CharacterAdded:Connect(function()
        task.wait(0.6)
        if State.EspEnabled then pcall(addEsp, plr) end
    end))
end
track(Players.PlayerAdded:Connect(function(plr)
    track(plr.CharacterAdded:Connect(function()
        task.wait(0.6)
        if State.EspEnabled then pcall(addEsp, plr) end
    end))
end))
track(Players.PlayerRemoving:Connect(function(plr) removeEsp(plr) end))

--==[ الإضاءة الكاملة وإزالة الضباب ]==--
local savedLighting
local savedFog

local function restoreFullbright()
    if not savedLighting then return end
    pcall(function()
        Lighting.Brightness = savedLighting.Brightness
        Lighting.ClockTime = savedLighting.ClockTime
        Lighting.Ambient = savedLighting.Ambient
        Lighting.OutdoorAmbient = savedLighting.OutdoorAmbient
        Lighting.GlobalShadows = savedLighting.GlobalShadows
    end)
    savedLighting = nil
end

local function restoreFog()
    if not savedFog then return end
    pcall(function()
        Lighting.FogEnd = savedFog.FogEnd
        Lighting.FogStart = savedFog.FogStart
        for atmos, density in pairs(savedFog.atmos) do
            if atmos and atmos.Parent then atmos.Density = density end
        end
    end)
    savedFog = nil
end

local function applyLighting()
    if State.Fullbright then
        if not savedLighting then
            savedLighting = {
                Brightness = Lighting.Brightness,
                ClockTime = Lighting.ClockTime,
                Ambient = Lighting.Ambient,
                OutdoorAmbient = Lighting.OutdoorAmbient,
                GlobalShadows = Lighting.GlobalShadows,
            }
        end
        Lighting.Brightness = 2
        Lighting.ClockTime = 14
        Lighting.Ambient = Color3.fromRGB(178, 178, 178)
        Lighting.OutdoorAmbient = Color3.fromRGB(178, 178, 178)
        Lighting.GlobalShadows = false
    else
        restoreFullbright()
    end

    if State.NoFog then
        if not savedFog then
            savedFog = { FogEnd = Lighting.FogEnd, FogStart = Lighting.FogStart, atmos = {} }
            for _, v in ipairs(Lighting:GetChildren()) do
                if v:IsA("Atmosphere") then savedFog.atmos[v] = v.Density end
            end
        end
        Lighting.FogEnd = 1e9
        Lighting.FogStart = 1e9
        for _, v in ipairs(Lighting:GetChildren()) do
            if v:IsA("Atmosphere") then v.Density = 0 end
        end
    else
        restoreFog()
    end
end

--==[ كاميرا حرة (Freecam) ]==--
local freecamPos = nil
local freecamYaw, freecamPitch = 0, 0
local savedSubject, savedCamType
local function startFreecam()
    savedSubject = Camera.CameraSubject
    savedCamType = Camera.CameraType
    local cf = Camera.CFrame
    freecamPos = cf.Position
    local px, yy = cf:ToOrientation()
    freecamPitch = px
    freecamYaw = yy
    Camera.CameraType = Enum.CameraType.Scriptable
end
local function stopFreecam()
    pcall(function()
        Camera.CameraType = savedCamType or Enum.CameraType.Custom
        Camera.CameraSubject = savedSubject
    end)
end

--==[ منع الطرد بالخمول ]==--
track(LocalPlayer.Idled:Connect(function()
    if State.AntiAfk then
        pcall(function()
            VirtualUser:CaptureController()
            VirtualUser:ClickButton2(Vector2.new())
        end)
    end
end))

--==[ قفز لا نهائي ]==--
track(UserInputService.JumpRequest:Connect(function()
    if State.InfJumpEnabled then
        local _, hum = getChar()
        if hum then pcall(function() hum:ChangeState(Enum.HumanoidStateType.Jumping) end) end
    end
end))

--==[ الحلقة الرئيسية ]==--
track(RunService.RenderStepped:Connect(function(dt)
    local char, hum, root = getChar()

    -- FOV
    pcall(function() Camera.FieldOfView = State.Fov end)

    -- السرعة
    if State.SpeedEnabled and hum then
        if hum.WalkSpeed ~= State.WalkSpeed then hum.WalkSpeed = State.WalkSpeed end
    end

    -- Noclip
    if State.NoclipEnabled and char then
        for _, p in ipairs(char:GetDescendants()) do
            if p:IsA("BasePart") and p.CanCollide then p.CanCollide = false end
        end
    end

    -- الطيران
    if State.FlyEnabled then
        if not flyBV then startFly() end
        if flyBV and flyBG and root then
            local camCF = Camera.CFrame
            local move = Vector3.zero
            move += camCF.LookVector * (flyControls.F - flyControls.B)
            move += camCF.RightVector * (flyControls.R - flyControls.L)
            move += Vector3.new(0, flyControls.U - flyControls.D, 0)
            if move.Magnitude > 0 then move = move.Unit end
            flyBV.Velocity = move * State.FlySpeed
            flyBG.CFrame = camCF
        end
    else
        if flyBV then stopFly() end
    end

    -- المشي على الجدران (Spider)
    if State.SpiderEnabled and hum and root then
        local params = RaycastParams.new()
        params.FilterDescendantsInstances = { char }
        params.FilterType = Enum.RaycastFilterType.Exclude
        local dirs = { root.CFrame.LookVector, root.CFrame.RightVector, -root.CFrame.RightVector }
        for _, dir in ipairs(dirs) do
            local res = workspace:Raycast(root.Position, dir * 3.5, params)
            if res then
                root.CFrame = root.CFrame + Vector3.new(0, 1.2, 0)
                break
            end
        end
    end

    -- كاميرا حرة
    if State.FreecamEnabled then
        if Camera.CameraType ~= Enum.CameraType.Scriptable then startFreecam() end
        if freecamPos then
            local rot = 1.6 * dt
            if UserInputService:IsKeyDown(Enum.KeyCode.Left)  then freecamYaw += rot end
            if UserInputService:IsKeyDown(Enum.KeyCode.Right) then freecamYaw -= rot end
            if UserInputService:IsKeyDown(Enum.KeyCode.Up)    then freecamPitch += rot end
            if UserInputService:IsKeyDown(Enum.KeyCode.Down)  then freecamPitch -= rot end
            freecamPitch = math.clamp(freecamPitch, -1.4, 1.4)
            local rotCF = CFrame.fromOrientation(freecamPitch, freecamYaw, 0)
            local speed = 60 * dt
            local move = Vector3.zero
            if UserInputService:IsKeyDown(Enum.KeyCode.W) then move += rotCF.LookVector end
            if UserInputService:IsKeyDown(Enum.KeyCode.S) then move -= rotCF.LookVector end
            if UserInputService:IsKeyDown(Enum.KeyCode.D) then move += rotCF.RightVector end
            if UserInputService:IsKeyDown(Enum.KeyCode.A) then move -= rotCF.RightVector end
            if UserInputService:IsKeyDown(Enum.KeyCode.Space) then move += Vector3.new(0, 1, 0) end
            if UserInputService:IsKeyDown(Enum.KeyCode.LeftControl) then move -= Vector3.new(0, 1, 0) end
            freecamPos = freecamPos + move * speed
            Camera.CFrame = CFrame.new(freecamPos) * rotCF
        end
    elseif Camera.CameraType == Enum.CameraType.Scriptable and savedCamType then
        stopFreecam()
        freecamPos = nil
    end

    -- تحديث عدّاد اللاعبين
    onlineLabel.Text = "متصل: " .. tostring(#Players:GetPlayers())
end))

-- مراقبة الإضاءة باستمرار (بعض الألعاب تعيد ضبطها)
track(RunService.Heartbeat:Connect(function()
    if State.Fullbright or State.NoFog then applyLighting() end
end))

------------------------------------------------------------
-- ربط الـ onChange بالميزات + المزامنة بين التبويبات
------------------------------------------------------------
local function syncToggles()
    quickSpeed.Render(); tSpeed.Render()
    quickFly.Render(); tFly.Render()
    quickEsp.Render(); tEsp.Render()
end

-- مزامنة حالة التوغلات عبر مراقبة التغيّر كل إطار
do
    local last = { SpeedEnabled = State.SpeedEnabled, FlyEnabled = State.FlyEnabled, EspEnabled = State.EspEnabled,
                   Fullbright = State.Fullbright, NoFog = State.NoFog, FreecamEnabled = State.FreecamEnabled }
    track(RunService.Heartbeat:Connect(function()
        if last.SpeedEnabled ~= State.SpeedEnabled then last.SpeedEnabled = State.SpeedEnabled syncToggles()
            if not State.SpeedEnabled then local _, hum = getChar() if hum then hum.WalkSpeed = 16 end end
        end
        if last.FlyEnabled ~= State.FlyEnabled then last.FlyEnabled = State.FlyEnabled syncToggles() end
        if last.EspEnabled ~= State.EspEnabled then last.EspEnabled = State.EspEnabled refreshEsp() syncToggles() end
        if last.Fullbright ~= State.Fullbright then last.Fullbright = State.Fullbright applyLighting() end
        if last.NoFog ~= State.NoFog then last.NoFog = State.NoFog applyLighting() end
        if last.FreecamEnabled ~= State.FreecamEnabled then last.FreecamEnabled = State.FreecamEnabled
            if not State.FreecamEnabled then stopFreecam() freecamPos = nil end
        end
    end))
end

------------------------------------------------------------
-- إلغاء التحميل (Unload)
------------------------------------------------------------
_G.__OG_SCHOOL_HUB_UNLOAD = function()
    for _, c in ipairs(CONNS) do pcall(function() c:Disconnect() end) end
    table.clear(CONNS)
    pcall(stopFly)
    pcall(stopFreecam)
    for plr in pairs(espObjects) do removeEsp(plr) end
    restoreFullbright()
    restoreFog()
    pcall(function() Camera.FieldOfView = 70 end)
    local _, hum = getChar()
    if hum then pcall(function() hum.WalkSpeed = 16 end) end
    pcall(function() screenGui:Destroy() end)
    _G.__OG_SCHOOL_HUB_LOADED = false
    _G.__OG_SCHOOL_HUB_UNLOAD = nil
end

------------------------------------------------------------
-- التهيئة
------------------------------------------------------------
loadConfig()
applyAccent(ACCENT_PRESETS[State.AccentIndex] and ACCENT_PRESETS[State.AccentIndex].color or THEME.Accent)
selectTab("الحركة")
syncToggles()
sSpeed.Render(); sFly.Render(); sFov.Render()
if State.Fullbright or State.NoFog then applyLighting() end
refreshEsp()

-- ظهور بحركة
window.Size = UDim2.new(0, WIN_W, 0, 0)
TweenService:Create(window, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
    Size = UDim2.new(0, WIN_W, 0, WIN_H),
}):Play()

notify("OG School Hub", "تم التحميل بنجاح! اضغط K لإظهار/إخفاء القائمة", 6)
print("[OG School Hub] v" .. VERSION .. " loaded.")
