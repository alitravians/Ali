--[[
╔══════════════════════════════════════════════════════════════════════╗
║  نظام الباركور — PARKOUR SYSTEM (Server)                              ║
║  المكان: ServerScriptService     ·     النوع: Script                   ║
║                                                                        ║
║  برج تسلّق احترافي (مستورد من متجر Roblox: Tower Of Hell Kit)          ║
║  ─ الهندسة فقط (سلالم/سقالات/جدران/مناطق موت/لوحة فوز) مأخوذة من        ║
║    الموديل الأصلي ومُعاد توضيعها في مكان الباركور القديم بالضبط.        ║
║  ─ كل سكربتات الـ kit الأصلية (حلقة الجولات/اقتصاد منفصل/متجر الأثَر)    ║
║    أُسقطت تماماً ومُنع تعارضها؛ المنطق هنا من عندنا فقط.                 ║
║                                                                        ║
║  • منصّة دخول في المدينة تنقل اللاعب لقاعدة البرج وتبدأ الجولة.          ║
║  • نقاط حفظ تلقائية حسب الارتفاع (تلمس درجة أعلى = تتحدّث نقطتك).         ║
║  • تلمس منطقة موت / تسقط → ترجع لآخر نقطة حفظ (وليس طرد لكل اللاعبين).    ║
║  • تلمس لوحة الفوز → كوينز + إنجاز + احتساب مهمة + تهنئة + خروج آمن.      ║
║  • زر «إيقاف» يرجّعك للمدينة. أفضل وقت شخصي محفوظ (DataStore).           ║
║                                                                        ║
║  ⚙️ الأداء: لا توجد أجزاء متحركة ولا أي حلقة دائمة على السيرفر؛ كل شيء   ║
║     مبني على أحداث Touched فقط، وحلقة التقدّم تعمل فقط أثناء جولة لاعب    ║
║     نشِطة وتنتهي تلقائياً → صفر استهلاك أثناء الخمول (لا لاق نهائياً).    ║
╚══════════════════════════════════════════════════════════════════════╝
]]

local Workspace         = game:GetService("Workspace")
local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService        = game:GetService("RunService")
local DataStoreService  = game:GetService("DataStoreService")

local V = Vector3.new

----------------------------------------------------------------------
-- RemoteEvents (نفس عقد الواجهة القديمة: Progress / Stop)
----------------------------------------------------------------------
local remotes = ReplicatedStorage:FindFirstChild("ParkourRemotes")
if not remotes then
	remotes = Instance.new("Folder"); remotes.Name = "ParkourRemotes"; remotes.Parent = ReplicatedStorage
end
local progressRemote = remotes:FindFirstChild("Progress")
if not progressRemote then
	progressRemote = Instance.new("RemoteEvent"); progressRemote.Name = "Progress"; progressRemote.Parent = remotes
end
local stopRemote = remotes:FindFirstChild("Stop")
if not stopRemote then
	stopRemote = Instance.new("RemoteEvent"); stopRemote.Name = "Stop"; stopRemote.Parent = remotes
end

----------------------------------------------------------------------
-- أفضل وقت شخصي (اختياري، آمن بـ pcall)
----------------------------------------------------------------------
local bestStore
pcall(function() bestStore = DataStoreService:GetDataStore("ParkourBest_v2") end)

----------------------------------------------------------------------
-- بيانات هندسة البرج (مُولّدة آلياً من الموديل الأصلي، مُعاد توضيعها)
-- المركز الأفقي ≈ (-138, 42)، القاعدة عند Y=18 (نفس مكان الباركور القديم).
----------------------------------------------------------------------
local TOWER = {
{cls="Part",grp="Finish",nm="Finish",cf={-151.084,63.1431,69.8956,0.9239,0,-0.3827,0,1,0,0.3827,0,0.9239},sz={12.9793,14.2862,1.0383},c={0,255,0},mat="Neon",tr=0.85,col=false,shape="Block"},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-119.6213,30.893,64.8454,0.7071,0,0.7071,0,1,0,-0.7071,0,0.7071},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-121.0355,30.893,63.4312,0.7071,0,0.7071,0,1,0,-0.7071,0,0.7071},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-122.4497,30.893,62.017,0.7071,0,0.7071,0,1,0,-0.7071,0,0.7071},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-153.0136,40.893,16.0178,-0.3827,0,0.9239,0,1,0,-0.9239,0,-0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-151.1658,40.893,15.2525,-0.3827,0,0.9239,0,1,0,-0.9239,0,-0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-149.3181,40.893,14.4871,-0.3827,0,0.9239,0,1,0,-0.9239,0,-0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-145.6225,40.893,12.9564,-0.3827,0,0.9239,0,1,0,-0.9239,0,-0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-147.4703,40.893,13.7217,-0.3827,0,0.9239,0,1,0,-0.9239,0,-0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-140.128,50.393,47.7604,0.3827,0,0.9239,0,1,0,-0.9239,0,0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-136.4325,50.393,49.2911,0.3827,0,0.9239,0,1,0,-0.9239,0,0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-138.2803,50.393,48.5257,0.3827,0,0.9239,0,1,0,-0.9239,0,0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="TrussPart",grp="Trusses",nm="Truss",cf={-141.9758,50.393,46.995,0.3827,0,0.9239,0,1,0,-0.9239,0,0.3827},sz={2,10,2},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,style=0},
{cls="Part",grp="Steps",nm="Part",cf={-138,19.8931,7.4896,-1,0,-0,0,1,0,0,0,-1},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-109.8292,22.8931,26.3127,-0.3827,0,0.9239,0,1,0,-0.9239,0,-0.3827},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-149.6687,18.8931,9.8106,-0.9239,0,-0.3827,0,1,0,0.3827,0,-0.9239},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-107.5081,23.8931,37.9814,-0,0,1,0,1,0,-1,0,-0},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-116.439,25.8931,59.5424,0.7071,0,0.7071,0,1,0,-0.7071,0,0.7071},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-116.439,21.8931,16.4204,-0.7071,0,0.7071,0,1,0,-0.7071,0,-0.7071},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-126.3313,20.8931,9.8106,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-109.8292,24.8931,49.6502,0.3827,0,0.9239,0,1,0,-0.9239,0,0.3827},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-127.661,35.8931,67.5149,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,6.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-130.7225,35.8931,60.1238,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,2.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-132.8273,35.8931,55.0425,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,2.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-137.0368,35.8931,44.8798,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,2.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-134.932,35.8931,49.9611,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,2.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-145.6472,35.8931,24.0925,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,2.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-143.5424,35.8931,29.1738,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,2.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-139.3329,35.8931,39.3365,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,2.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-141.4376,35.8931,34.2552,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,2.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-148.7086,35.8931,16.7015,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={10.2293,0.7862,7.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-144.6468,55.3931,61.2144,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,3.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-149.6687,45.3931,9.8106,-0.9239,0,-0.3827,0,1,0,0.3827,0,-0.9239},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-138,45.3931,7.4896,-1,0,-0,0,1,0,0,0,-1},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-126.3313,45.3931,9.8106,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={13.7293,0.7862,8.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-130.9659,45.3931,28.1857,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,45.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-140.246,55.3931,50.5898,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,3.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-142.5421,55.3931,56.1331,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,3.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Steps",nm="Part",cf={-146.9429,55.3931,66.7577,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,3.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-138,44.3931,71.9733,1,0,0,0,1,0,0,0,1},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-106.5956,44.3931,24.9733,-0.3827,0,0.9239,0,1,0,-0.9239,0,-0.3827},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-104.0081,44.3931,37.9814,-0,0,1,0,1,0,-1,0,-0},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-113.9641,44.3931,62.0173,0.7071,0,0.7071,0,1,0,-0.7071,0,0.7071},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-124.9919,44.3931,69.3858,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-106.5956,44.3931,50.9895,0.3827,0,0.9239,0,1,0,-0.9239,0,0.3827},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-162.0359,44.3931,13.9456,-0.7071,0,-0.7071,0,1,0,0.7071,0,-0.7071},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-138,44.3931,3.9896,-1,0,-0,0,1,0,0,0,-1},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-169.4044,44.3931,24.9733,-0.3827,0,-0.9239,0,1,0,0.9239,0,-0.3827},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-151.0081,44.3931,6.577,-0.9239,0,-0.3827,0,1,0,0.3827,0,-0.9239},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-113.9641,44.3931,13.9455,-0.7071,0,0.7071,0,1,0,-0.7071,0,-0.7071},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-124.9919,44.3931,6.577,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-171.9919,44.3931,37.9814,0,0,-1,0,1,0,1,0,0},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-169.4044,44.3931,50.9896,0.3827,0,-0.9239,0,1,0,0.9239,0,0.3827},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-151.0081,36.8931,69.3858,0.9239,0,-0.3827,0,1,0,0.3827,0,0.9239},sz={13.7293,38.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-162.0359,44.3931,62.0173,0.7071,0,-0.7071,0,1,0,0.7071,0,0.7071},sz={13.7293,53.7862,1.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-153.3042,56.1431,74.9291,0.9239,0,-0.3827,0,1,0,0.3827,0,0.9239},sz={13.7293,0.2862,13.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-155.409,63.3931,80.0104,0.9239,0,-0.3827,0,1,0,0.3827,0,0.9239},sz={13.7293,14.7862,2.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-147.068,63.3931,77.5122,0.9239,0,-0.3827,0,1,0,0.3827,0,0.9239},sz={0.2293,14.7862,13.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-159.3094,63.3931,72.4417,0.9239,0,-0.3827,0,1,0,0.3827,0,0.9239},sz={0.7293,14.7862,13.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-153.3042,70.6431,74.9291,0.9239,0,-0.3827,0,1,0,0.3827,0,0.9239},sz={13.7293,1.2862,13.0383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-153.9294,71.1431,31.3833,-0.3827,0,-0.9239,0,1,0,0.9239,0,-0.3827},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-120.7581,71.1431,37.9814,-0,0,1,0,1,0,-1,0,-0},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-122.0706,71.1431,44.5796,0.3827,0,0.9239,0,1,0,-0.9239,0,0.3827},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-131.4018,71.1431,22.052,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-153.9294,71.1431,44.5796,0.3827,0,-0.9239,0,1,0,0.9239,0,0.3827},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-144.5982,71.1431,22.052,-0.9239,0,-0.3827,0,1,0,0.3827,0,-0.9239},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-144.5982,71.1431,53.9108,0.9239,0,-0.3827,0,1,0,0.3827,0,0.9239},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-125.8082,71.1431,25.7896,-0.7071,0,0.7071,0,1,0,-0.7071,0,-0.7071},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-131.4018,71.1431,53.9108,0.9239,0,0.3827,0,1,0,-0.3827,0,0.9239},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-125.8082,71.1431,50.1733,0.7071,0,0.7071,0,1,0,-0.7071,0,0.7071},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-138,71.1431,20.7396,-1,0,-0,0,1,0,0,0,-1},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-122.0706,71.1431,31.3832,-0.3827,0,0.9239,0,1,0,-0.9239,0,-0.3827},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-138,71.1431,55.2233,1,0,0,0,1,0,0,0,1},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-150.1918,71.1431,50.1733,0.7071,0,-0.7071,0,1,0,0.7071,0,0.7071},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-155.2419,71.1431,37.9814,0,0,-1,0,1,0,1,0,0},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="Walls",nm="Part",cf={-150.1919,71.1431,25.7896,-0.7071,0,-0.7071,0,1,0,0.7071,0,-0.7071},sz={13.7293,0.2862,34.5383},c={13,105,172},mat="SmoothPlastic",tr=0,col=true,shape="Block"},
{cls="Part",grp="KillParts",nm="Part",cf={-125.5127,46.1784,15.0204,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,1.0383},c={255,0,0},mat="Neon",tr=0,col=true,shape="Block"},
{cls="Part",grp="KillParts",nm="Part",cf={-127.2348,46.1784,19.1779,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,1.0383},c={255,0,0},mat="Neon",tr=0,col=true,shape="Block"},
{cls="Part",grp="KillParts",nm="Part",cf={-130.8702,46.1784,27.9548,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,1.0383},c={255,0,0},mat="Neon",tr=0,col=true,shape="Block"},
{cls="Part",grp="KillParts",nm="Part",cf={-129.1482,46.1784,23.7973,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,1.0383},c={255,0,0},mat="Neon",tr=0,col=true,shape="Block"},
{cls="Part",grp="KillParts",nm="Part",cf={-137.9499,46.1784,45.0465,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,1.0383},c={255,0,0},mat="Neon",tr=0,col=true,shape="Block"},
{cls="Part",grp="KillParts",nm="Part",cf={-136.2278,46.1784,40.8891,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,1.0383},c={255,0,0},mat="Neon",tr=0,col=true,shape="Block"},
{cls="Part",grp="KillParts",nm="Part",cf={-134.3144,46.1784,36.2697,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,1.0383},c={255,0,0},mat="Neon",tr=0,col=true,shape="Block"},
{cls="Part",grp="KillParts",nm="Part",cf={-132.5923,46.1784,32.1122,-0.9239,0,0.3827,0,1,0,-0.3827,0,-0.9239},sz={8.2293,0.7862,1.0383},c={255,0,0},mat="Neon",tr=0,col=true,shape="Block"},
{cls="SpawnLocation",grp="Spawn",nm="Spawn",cf={-140.1053,18,37.4541,1,0,0,0,1,0,0,0,1},sz={12,1,12},c={163,162,165},mat="Plastic",tr=1,col=false},
}

local MATERIALS = {
	Plastic       = Enum.Material.Plastic,
	SmoothPlastic = Enum.Material.SmoothPlastic,
	Neon          = Enum.Material.Neon,
	Metal         = Enum.Material.Metal,
	Wood          = Enum.Material.Wood,
	Ice           = Enum.Material.Ice,
	Brick         = Enum.Material.Brick,
}
local SHAPES = {
	Block    = Enum.PartType.Block,
	Ball     = Enum.PartType.Ball,
	Cylinder = Enum.PartType.Cylinder,
}

----------------------------------------------------------------------
-- ثوابت التوضيع
----------------------------------------------------------------------
local SPAWN_POS  = V(-140.1053, 18, 37.4541)        -- قاعدة البرج (من الموديل الأصلي)
local SPAWN_CF   = CFrame.new(SPAWN_POS + V(0, 3.5, 0))
local BASE_Y     = 18
local FINISH_Y   = 63.1431
local FALL_Y     = BASE_Y - 12                       -- أقل من القاعدة = سقوط
local EXIT_POS   = V(0, 5, 45)                        -- خروج آمن قرب الانطلاق الرئيسي
local ENTRY_POS  = V(-95, 4.5, 70)                    -- منصّة دخول أرضية (نفس مكان مدخل الباركور القديم)

----------------------------------------------------------------------
-- بناء الهندسة
----------------------------------------------------------------------
local course = Instance.new("Model")
course.Name = "ParkourCourse"
course.Parent = Workspace

local steps, killParts = {}, {}
local finishPart

for _, d in ipairs(TOWER) do
	if d.grp == "Spawn" then
		-- لا نُنشئ SpawnLocation حقيقي (لئلا يُحيا كل اللاعبين داخل البرج)؛
		-- نستخدم إحداثيتها فقط، ونضع منصّة بداية صغيرة مرئية.
		local pad = Instance.new("Part")
		pad.Name = "ParkourBasePad"; pad.Anchored = true; pad.CanCollide = true
		pad.Size = V(d.sz[1], 1, d.sz[3]); pad.Position = SPAWN_POS
		pad.Color = Color3.fromRGB(70, 200, 120); pad.Material = Enum.Material.Neon
		pad.Transparency = 0.35; pad.TopSurface = Enum.SurfaceType.Smooth
		pad.Parent = course
	else
		local cls = d.cls == "TrussPart" and "TrussPart" or "Part"
		local p = Instance.new(cls)
		p.Anchored = true
		p.CanCollide = d.col ~= false
		p.Name = d.nm or d.grp
		p.Size = V(d.sz[1], d.sz[2], d.sz[3])
		local cf = d.cf
		p.CFrame = CFrame.new(cf[1], cf[2], cf[3], cf[4], cf[5], cf[6], cf[7], cf[8], cf[9], cf[10], cf[11], cf[12])
		p.Color = Color3.fromRGB(d.c[1], d.c[2], d.c[3])
		p.Material = MATERIALS[d.mat] or Enum.Material.SmoothPlastic
		p.Transparency = d.tr or 0
		if cls == "Part" then
			p.TopSurface = Enum.SurfaceType.Smooth
			p.BottomSurface = Enum.SurfaceType.Smooth
			if d.shape and SHAPES[d.shape] then p.Shape = SHAPES[d.shape] end
		end
		p.Parent = course

		if d.grp == "Steps" then
			table.insert(steps, p)
		elseif d.grp == "KillParts" then
			p.CanCollide = false                 -- مناطق موت تُلمس فقط
			table.insert(killParts, p)
		elseif d.grp == "Finish" then
			p.CanCollide = false
			finishPart = p
		end
	end
end

----------------------------------------------------------------------
-- منصّة الدخول في المدينة + لافتة
----------------------------------------------------------------------
local entryPad = Instance.new("Part")
entryPad.Name = "ParkourEntry"; entryPad.Anchored = true; entryPad.CanCollide = true
entryPad.Size = V(10, 0.6, 10); entryPad.Position = ENTRY_POS
entryPad.Color = Color3.fromRGB(255, 205, 70); entryPad.Material = Enum.Material.Neon
entryPad.Transparency = 0.15; entryPad.TopSurface = Enum.SurfaceType.Smooth
entryPad.Parent = course

do
	local sign = Instance.new("Part")
	sign.Name = "ParkourEntrySign"; sign.Anchored = true; sign.CanCollide = false
	sign.Size = V(8, 3.4, 0.4); sign.Position = ENTRY_POS + V(0, 4, 0)
	sign.Color = Color3.fromRGB(24, 30, 46); sign.Material = Enum.Material.SmoothPlastic
	sign.Parent = course
	local sg = Instance.new("SurfaceGui"); sg.Face = Enum.NormalId.Front
	sg.CanvasSize = Vector2.new(720, 300); sg.LightInfluence = 0; sg.Parent = sign
	local lbl = Instance.new("TextLabel"); lbl.BackgroundTransparency = 1; lbl.Size = UDim2.fromScale(1, 1)
	lbl.Font = Enum.Font.GothamBlack; lbl.TextScaled = true; lbl.RichText = true
	lbl.TextColor3 = Color3.fromRGB(255, 205, 70)
	lbl.Text = "🧗 برج الباركور\n<font size=\"30\">قف هنا للانتقال للبداية</font>"
	lbl.Parent = sg
end

----------------------------------------------------------------------
-- أدوات
----------------------------------------------------------------------
local function fmtTime(sec)
	local m = math.floor(sec / 60)
	local s = sec - m * 60
	return string.format("%d:%05.2f", m, s)
end

local function teleportTo(player, cf)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if hrp then hrp.CFrame = cf end
end

local function playerFromHit(hit)
	local char = hit and hit.Parent
	if not char then return nil end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then return nil end
	return Players:GetPlayerFromCharacter(char)
end

----------------------------------------------------------------------
-- حالة الجولة لكل لاعب
----------------------------------------------------------------------
local runState = {}   -- [userId] = { inRun, startT, cpCF, cpY, best, loop }
local updateFallWatcher   -- forward declaration (يُعرّف لاحقاً)

local function progressPercent(player)
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart")
	if not hrp then return 0 end
	local pct = (hrp.Position.Y - BASE_Y) / (FINISH_Y - BASE_Y) * 100
	return math.clamp(math.floor(pct), 0, 100)
end

local function sendProgress(player, state)
	local st = runState[player.UserId]
	local elapsed = (st and st.inRun) and (os.clock() - st.startT) or 0
	local pct = (st and st.inRun) and progressPercent(player) or 0
	progressRemote:FireClient(player, {
		state   = state or ((st and st.inRun) and "run" or "idle"),
		stage   = math.clamp(math.floor(pct / 25) + 1, 1, 4),
		cp      = math.clamp(math.floor(pct / 25) + 1, 1, 4),
		total   = 4,
		percent = pct,
		time    = elapsed,
	})
end

local function stopProgressLoop(st)
	if st and st.loop then
		task.cancel(st.loop)
		st.loop = nil
	end
end

local function startRun(player)
	local st = runState[player.UserId]
	if st and st.inRun then return end
	st = { inRun = true, startT = os.clock(), cpCF = SPAWN_CF, cpY = BASE_Y, best = st and st.best }
	runState[player.UserId] = st
	teleportTo(player, SPAWN_CF)
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "🧗 بدأ الباركور! اطلع لأعلى البرج ووصل للوحة الخضراء.") end
	sendProgress(player, "run")
	-- حلقة تقدّم تعمل فقط أثناء جولة هذا اللاعب وتنتهي تلقائياً
	st.loop = task.spawn(function()
		while runState[player.UserId] == st and st.inRun do
			sendProgress(player, "run")
			task.wait(0.6)
		end
	end)
	if updateFallWatcher then updateFallWatcher() end
end

local function stopRun(player)
	local st = runState[player.UserId]
	if st then st.inRun = false; stopProgressLoop(st) end
	teleportTo(player, CFrame.new(EXIT_POS))
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "🛑 أوقفت الباركور وخرجت من المسار.") end
	progressRemote:FireClient(player, { state = "idle" })
	if updateFallWatcher then updateFallWatcher() end
end

stopRemote.OnServerEvent:Connect(function(player)
	stopRun(player)
end)

----------------------------------------------------------------------
-- منصّة الدخول: تبدأ الجولة وتنقل للقاعدة
----------------------------------------------------------------------
local entryCooldown = {}
entryPad.Touched:Connect(function(hit)
	local player = playerFromHit(hit)
	if not player then return end
	if entryCooldown[player.UserId] then return end
	entryCooldown[player.UserId] = true
	startRun(player)
	task.delay(2, function() entryCooldown[player.UserId] = nil end)
end)

----------------------------------------------------------------------
-- نقاط الحفظ التلقائية: تلمس درجة أعلى من نقطتك الحالية = تتحدّث
----------------------------------------------------------------------
for _, step in ipairs(steps) do
	local topY = step.Position.Y + step.Size.Y / 2
	step.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		if topY > st.cpY + 1.5 then
			st.cpY = topY
			st.cpCF = CFrame.new(step.Position.X, topY + 3.5, step.Position.Z)
		end
	end)
end

----------------------------------------------------------------------
-- مناطق الموت: ترجع لآخر نقطة حفظ
----------------------------------------------------------------------
local killCooldown = {}
local function respawnAtCheckpoint(player)
	local st = runState[player.UserId]
	if not st or not st.inRun then return end
	if killCooldown[player.UserId] then return end
	killCooldown[player.UserId] = true
	teleportTo(player, st.cpCF or SPAWN_CF)
	if _G.NotifyPlayer then _G.NotifyPlayer(player, "↩️ رجعناك لآخر نقطة حفظ.") end
	task.delay(0.6, function() killCooldown[player.UserId] = nil end)
end

for _, kp in ipairs(killParts) do
	kp.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if player then respawnAtCheckpoint(player) end
	end)
end

----------------------------------------------------------------------
-- لوحة الفوز: كوينز + إنجاز + مهمة + تهنئة + أفضل وقت + خروج
----------------------------------------------------------------------
local REWARD = 250
local finishCooldown = {}
if finishPart then
	finishPart.Touched:Connect(function(hit)
		local player = playerFromHit(hit)
		if not player then return end
		local st = runState[player.UserId]
		if not st or not st.inRun then return end
		if finishCooldown[player.UserId] then return end
		finishCooldown[player.UserId] = true

		st.inRun = false
		stopProgressLoop(st)
		if updateFallWatcher then updateFallWatcher() end
		local elapsed = os.clock() - st.startT

		-- أفضل وقت شخصي
		local isRecord = false
		if not st.best or elapsed < st.best then
			st.best = elapsed; isRecord = true
			if bestStore then
				pcall(function() bestStore:SetAsync(tostring(player.UserId), math.floor(elapsed * 100)) end)
			end
		end

		if _G.AddCoins then _G.AddCoins(player, REWARD) end
		if _G.AwardAchievement then
			_G.AwardAchievement(player, "parkour_first")
			_G.AwardAchievement(player, "parkour_done")
		end
		if _G.ReportMission then _G.ReportMission(player, "parkour_done", 1) end
		if _G.NotifyPlayer then
			_G.NotifyPlayer(player, string.format(
				"🏁 أكملت برج الباركور! الوقت %s%s — مكافأة %d كوينز + لقب «بطل الباركور» 🏆",
				fmtTime(elapsed), isRecord and " (رقم قياسي جديد!)" or "", REWARD))
		end

		progressRemote:FireClient(player, { state = "finish", time = elapsed, reward = REWARD, percent = 100, total = 4 })
		task.delay(2, function()
			teleportTo(player, CFrame.new(EXIT_POS))
			finishCooldown[player.UserId] = nil
		end)
	end)
end

----------------------------------------------------------------------
-- مراقبة السقوط أسفل القاعدة (للاعبين النشطين فقط) عبر Heartbeat واحد
-- يعمل فقط عند وجود لاعب نشِط واحد على الأقل، ويتوقّف تماماً عند الخمول.
----------------------------------------------------------------------
local fallConn
updateFallWatcher = function()
	local anyActive = false
	for _, st in pairs(runState) do
		if st.inRun then anyActive = true; break end
	end
	if anyActive and not fallConn then
		fallConn = RunService.Heartbeat:Connect(function()
			for _, player in ipairs(Players:GetPlayers()) do
				local st = runState[player.UserId]
				if st and st.inRun then
					local char = player.Character
					local hrp = char and char:FindFirstChild("HumanoidRootPart")
					if hrp and hrp.Position.Y < FALL_Y then
						respawnAtCheckpoint(player)
					end
				end
			end
		end)
	elseif not anyActive and fallConn then
		fallConn:Disconnect(); fallConn = nil
	end
end

----------------------------------------------------------------------
-- تنظيف عند خروج اللاعب + إعادة فحص المراقب
----------------------------------------------------------------------
Players.PlayerRemoving:Connect(function(player)
	local st = runState[player.UserId]
	stopProgressLoop(st)
	runState[player.UserId] = nil
	entryCooldown[player.UserId] = nil
	killCooldown[player.UserId] = nil
	finishCooldown[player.UserId] = nil
	updateFallWatcher()
end)

-- إيقاف الجولة عند الموت/إعادة الإحياء (لا تبقى الحالة عالقة)
Players.PlayerAdded:Connect(function(player)
	-- استرجاع أفضل وقت محفوظ (اختياري)
	if bestStore then
		task.spawn(function()
			local ok, v = pcall(function() return bestStore:GetAsync(tostring(player.UserId)) end)
			if ok and type(v) == "number" then
				runState[player.UserId] = runState[player.UserId] or {}
				runState[player.UserId].best = v / 100
			end
		end)
	end
	player.CharacterRemoving:Connect(function()
		local st = runState[player.UserId]
		if st and st.inRun then st.inRun = false; stopProgressLoop(st); updateFallWatcher() end
	end)
end)
