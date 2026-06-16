--[[
    OG School Hub - Loader
    لوحة تحكم سكربت المدرسة | OG-School

    شغّل هذا السطر في المنفّذ (Executor):
    loadstring(game:HttpGet("https://raw.githubusercontent.com/alitravians/Ali/arabic-localization/roblox-scripts/og-school/loader.lua"))()

    اللودر يجلب أحدث نسخة من main.lua تلقائيًا من فرع arabic-localization،
    فأي تحديث على السكربت يوصلك بدون ما تغيّر الرابط.
]]

local MAIN_URL =
    "https://raw.githubusercontent.com/alitravians/Ali/arabic-localization/roblox-scripts/og-school/main.lua"

local ok, err = pcall(function()
    local src = game:HttpGet(MAIN_URL)
    local fn = loadstring(src)
    if type(fn) ~= "function" then
        error("loadstring returned " .. type(fn))
    end
    fn()
end)

if not ok then
    warn("[OG School Hub] فشل تحميل السكربت: " .. tostring(err))
    pcall(function()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = "OG School Hub",
            Text = "فشل التحميل — تأكد من الاتصال وأعد المحاولة",
            Duration = 6,
        })
    end)
end
