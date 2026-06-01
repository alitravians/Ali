#!/usr/bin/env python3
# CDATA-preserving (lxml) replacement of the old PROCEDURAL ticket booth (built
# at runtime by CinemaServices.server.lua, removed there) with a Creator Store
# model ("Ticket Booth", asset 105621582718050) injected as STATIC geometry.
#
# AUDIT RESULT (per the user's model-integration rule — keep clean scripts AS-IS,
# remove ONLY proven malicious parts):
#   MALICIOUS (removed): Script "Structure" + ModuleScript "Type" + ModuleScript
#     "Layout" + NumberPose "Pose".  This is the @Quenty-disguised backdoor family
#     (Structure does require(script.Type); Layout holds a NumberPose named "Pose"
#     whose .Value is a numeric asset id that getArchetype/checkChild require() —
#     i.e. remote code execution). Same family as the aquarium/parkour backdoors.
#   CLEAN (kept AS-IS): the two door "Main" scripts (open/close the door by
#     toggling DO/DOC/DC) and the two "Script" sound scripts (ClickDetector ->
#     Ding:play()). These are the model's own legitimate door behaviour, so we
#     keep them untouched. No Devin scripts are added inside the model; the
#     ticket-purchase ProximityPrompt lives in CinemaServices.server.lua.
import sys, copy, math
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SRC  = "ticketbooth_new.rbxmx"     # repo-local copy of the Creator Store model (asset 105621582718050)

MODEL_NAME = "TicketBooth"         # stable name (no space) for the injected model
TX, TZ    = -15.0, -100.0          # same plaza spot as the old procedural booth
GROUND_Y  = 1.0                    # plaza floor (model foot sits here)
ROT_Y_DEG = -90.0                  # native screen faces +X; rotate -90deg so it faces +Z (toward the plaza/players)
PREF      = "TB"                   # unique-referent prefix

# Backdoor items to remove, matched by (class, Name). Everything else is kept.
BACKDOOR = {
    ("Script", "Structure"),
    ("ModuleScript", "Type"),
    ("ModuleScript", "Layout"),
    ("NumberPose", "Pose"),
}
DANGER = ("loadstring", "getfenv", "setfenv", "HttpGet", "HttpGetAsync",
          "GetObjects", "require(")
BASEPARTS = {"Part","MeshPart","WedgePart","CornerWedgePart","TrussPart",
             "UnionOperation","Seat","VehicleSeat"}

P = etree.XMLParser(strip_cdata=False, huge_tree=True)

def nm(it):
    return it.findtext("Properties/string[@name='Name']") or ""

def remove_backdoor(item):
    removed = []
    for child in list(item):
        if child.tag != "Item":
            continue
        if (child.get("class"), nm(child)) in BACKDOOR:
            item.remove(child); removed.append((child.get("class"), nm(child)))
        else:
            removed += remove_backdoor(child)
    return removed

def baseparts(item):
    for it in item.iter("Item"):
        if it.get("class") in BASEPARTS:
            yield it

def get(cf, t, default=0.0):
    v = cf.findtext(t)
    return float(v) if v not in (None, "") else default

def rmat(cf):
    return [get(cf, k, 1.0 if k in ("R00","R11","R22") else 0.0)
            for k in ("R00","R01","R02","R10","R11","R12","R20","R21","R22")]

def script_source(it):
    s = it.find("Properties/ProtectedString[@name='Source']")
    if s is None:
        s = it.find("Properties/string[@name='Source']")
    return (s.text or "") if s is not None else ""

# ---------- load source model + remove backdoor ----------
sroot = etree.parse(SRC, P).getroot()
model = next((it for it in sroot if it.tag == "Item" and it.get("class") == "Model"), None)
if model is None:
    sys.exit("Model not found in source rbxmx")

removed = remove_backdoor(model)
print("removed backdoor items:", removed)

# verify the surviving scripts are clean (no remote-code-exec patterns)
bad = []
for it in model.iter("Item"):
    if it.get("class") in ("Script","LocalScript","ModuleScript"):
        src = script_source(it)
        for pat in DANGER:
            if pat in src:
                bad.append((it.get("class"), nm(it), pat))
if bad:
    sys.exit(f"ERROR: dangerous pattern still present after cleanup: {bad}")
kept = [(it.get("class"), nm(it)) for it in model.iter("Item")
        if it.get("class") in ("Script","LocalScript","ModuleScript")]
print("kept clean scripts AS-IS:", kept)

# ---------- model bbox (rotation-aware AABB, for centring) ----------
mnx=mny=mnz=1e18; mxx=mxy=mxz=-1e18
for it in baseparts(model):
    pr = it.find("Properties")
    cf = pr.find("CoordinateFrame[@name='CFrame']") if pr is not None else None
    sz = (pr.find("Vector3[@name='size']") or pr.find("Vector3[@name='Size']")) if pr is not None else None
    if cf is None or sz is None: continue
    cx, cy, cz = get(cf,"X"), get(cf,"Y"), get(cf,"Z")
    hx, hy, hz = get(sz,"X")/2, get(sz,"Y")/2, get(sz,"Z")/2
    R = rmat(cf)
    ex = abs(R[0])*hx + abs(R[1])*hy + abs(R[2])*hz
    ey = abs(R[3])*hx + abs(R[4])*hy + abs(R[5])*hz
    ez = abs(R[6])*hx + abs(R[7])*hy + abs(R[8])*hz
    mnx=min(mnx,cx-ex); mxx=max(mxx,cx+ex)
    mny=min(mny,cy-ey); mxy=max(mxy,cy+ey)
    mnz=min(mnz,cz-ez); mxz=max(mxz,cz+ez)
cx=(mnx+mxx)/2; cz=(mnz+mxz)/2; footY=mny
print(f"native bbox X{mnx:.2f}..{mxx:.2f} Y{mny:.2f}..{mxy:.2f} Z{mnz:.2f}..{mxz:.2f}")
print(f"centre=({cx:.2f},{cz:.2f}) footY={footY:.2f} -> target=({TX},{TZ}) groundY={GROUND_Y} rotY={ROT_Y_DEG}")

# ---------- main file ----------
tree = etree.parse(MAIN, P); root = tree.getroot()
ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")

# idempotent: remove any prior injected booth (and the old-name variant)
removed_prev = 0
for it in list(ws):
    if it.tag == "Item":
        pr = it.find("Properties")
        name = pr.findtext("string[@name='Name']") if pr is not None else None
        if name in (MODEL_NAME, "Ticket Booth"):
            ws.remove(it); removed_prev += 1
print(f"removed {removed_prev} prior '{MODEL_NAME}' model(s)")

cp = copy.deepcopy(model)
cp.find("Properties/string[@name='Name']").text = MODEL_NAME

# unique referents + internal Ref remap (so it never clashes with main-file refs)
refmap = {}; n = 0
for it in cp.iter("Item"):
    old = it.get("referent")
    if old is not None:
        n += 1; new = f"{PREF}{n:06d}"; refmap[old] = new; it.set("referent", new)
for it in cp.iter("Item"):
    pr = it.find("Properties")
    if pr is None: continue
    for refel in list(pr.findall("Ref")):
        txt = (refel.text or "").strip()
        refel.text = refmap.get(txt, "null")

# Y-rotation about the model's vertical centre axis.
_th = math.radians(ROT_Y_DEG)
_c, _s = math.cos(_th), math.sin(_th)
RY = [[_c, 0.0, _s], [0.0, 1.0, 0.0], [-_s, 0.0, _c]]

def set_r(cf, idx, val):
    el = cf.find(idx)
    if el is None:
        el = etree.SubElement(cf, idx)
    el.text = f"{val:.6f}"

# anchor + rotate(Y) + translate every BasePart
for it in baseparts(cp):
    pr = it.find("Properties")
    anc = pr.find("bool[@name='Anchored']")
    if anc is None:
        anc = etree.SubElement(pr, "bool"); anc.set("name", "Anchored")
    anc.text = "true"
    cf = pr.find("CoordinateFrame[@name='CFrame']")
    if cf is None: continue
    x,y,z = get(cf,"X"),get(cf,"Y"),get(cf,"Z")
    lx, lz = (x-cx), (z-cz)
    rx = _c*lx + _s*lz
    rz = -_s*lx + _c*lz
    cf.find("X").text=f"{rx + TX:.5f}"
    cf.find("Y").text=f"{(y-footY) + GROUND_Y:.5f}"
    cf.find("Z").text=f"{rz + TZ:.5f}"
    O = rmat(cf)
    Old = [[O[0],O[1],O[2]],[O[3],O[4],O[5]],[O[6],O[7],O[8]]]
    New = [[sum(RY[i][k]*Old[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    keys = ("R00","R01","R02","R10","R11","R12","R20","R21","R22")
    flat = [New[0][0],New[0][1],New[0][2],New[1][0],New[1][1],New[1][2],New[2][0],New[2][1],New[2][2]]
    for k, v in zip(keys, flat):
        set_r(cf, k, v)

ws.append(cp)

# ---------- merge SharedStrings blobs (md5-dedup) ----------
# MeshPart / UnionOperation physics+mesh data live in <SharedStrings> referenced
# by md5. Without merging the source model's blobs into the main file, those refs
# dangle and the booth's 32 unions/meshes render broken. Same step as the other
# injectors (inject_aquarium / inject_fountain / inject_parkour_model).
main_ss = root.find("SharedStrings")
if main_ss is None:
    main_ss = etree.SubElement(root, "SharedStrings")
have = {e.get("md5") for e in main_ss}
src_ss = sroot.find("SharedStrings")
added = 0
if src_ss is not None:
    for e in src_ss:
        md5 = e.get("md5")
        if md5 not in have:
            main_ss.append(copy.deepcopy(e)); have.add(md5); added += 1
print(f"merged SharedStrings: +{added} (total {len(main_ss)})")

tree.write(MAIN, encoding="utf-8", xml_declaration=False)
print(f"injected '{MODEL_NAME}' ({sum(1 for _ in cp.iter('Item'))} items) at ({TX},{GROUND_Y},{TZ}) rotY={ROT_Y_DEG}")
