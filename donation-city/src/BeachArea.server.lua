--[[
╔══════════════════════════════════════════════════════════════════════╗
║  BEACH AREA (Server) — معطّل + تنظيف بقايا الشاطئ القديم               ║
║                                                                        ║
║  الشاطئ القديم (الرمل/البحر/النخيل/المظلات) أُزيل بالكامل بناءً على     ║
║  طلب المالك، واستُبدل بموديل «منطقة الشاطئ المتكاملة» الجاهز من المتجر  ║
║  الذي أُدرج كهندسة ثابتة داخل الـ Workspace مباشرة.                      ║
║  هذا السكربت لم يعد يبني أي شيء؛ مهمّته الوحيدة الآن: مسح ماء الـ        ║
║  Terrain القديم (Water) الذي كان الشاطئ القديم يملؤه عبر FillBlock —    ║
║  لأنه قد يكون «مخبوزاً» في النسخة المنشورة ويتداخل مع الموديل الجديد.    ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace = game:GetService("Workspace")
local terrain = Workspace:FindFirstChildOfClass("Terrain")

-- منطقة بحر الشاطئ القديم كانت تقريباً: المركز X≈285، Z≈20، عمق حتى -16.
-- نمسح أي ماء Terrain متبقٍّ في نطاق سخيّ يغطّيها (يستبدل Water بـ Air فقط،
-- فلا يمسّ أي تضاريس أخرى). عملية لمرة واحدة عند الإقلاع، بلا أي حلقة.
if terrain then
	pcall(function()
		local region = Region3.new(
			Vector3.new(160, -28, -90),
			Vector3.new(390, 8, 130)
		):ExpandToGrid(4)
		terrain:ReplaceMaterial(region, 4, Enum.Material.Water, Enum.Material.Air)
	end)
end

print("[BeachArea] old beach disabled; cleared leftover Terrain water. New beach is a static model in Workspace.")
