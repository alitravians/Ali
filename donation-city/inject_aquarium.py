#!/usr/bin/env python3
# CDATA-preserving (lxml) insertion of a SIMPLE flat fish-tank model from the
# Creator Store ("Big Flat Aquarium - Fish Tank Ocean Decor", asset 134151351475382)
# as STATIC decor, replacing the previous aquarium. The model ships with a
# backdoor family (LightConfig + Type + EasyConfiguration ModuleScripts that
# require-by-id) plus 4 scale-flip animation Scripts and 12 Timer / 1 NumberPose
# animation objects + a Camera + 3 Decals. We strip ALL of that, anchor every
# BasePart, and keep only geometry + meshes.
#
# IMPORTANT (root-cause fix for "fish escape glass"): this tank's glass is TWO
# thin parallel panes (~1-stud interior depth) and the largest single part is an
# OFF-CENTRE pane. The old CinemaDecor heuristic ("largest part = centre") then
# centred fish on a glass plane and pushed them THROUGH it. So here we compute
# the TRUE interior cavity (rotation-aware AABB of the transparent glass panes,
# inset for wall thickness + fish margin) and BAKE it into the model as explicit
# NumberValue children (AQMinX..AQMaxZ + AQWaterTopY). CinemaDecor.server.lua
# reads those exact bounds, so fish are clamped to the real cavity and can never
# leave the glass from any angle/state.
import sys, copy, math
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SRC  = "/home/ubuntu/attachments/60018371-51e0-4ec9-a1a2-e92f5a972545/134151351475382.rbxmx"

MODEL_NAME = "Aquarium"
TX, TZ   = 0.0, -48.0   # spot 2: NORTH of the centre fountain (user pick), clear of the plaza.
ROT_Y_DEG = 90.0        # rotate 90deg about Y so the long (27-stud) face spans the plaza, not its thin side.
GROUND_Y = 0.0          # plaza floor (model foot sits here)
SCALE    = 1.0          # native size (27 long x ~9.6 tall x 3 deep)
PREF     = "AQ"         # unique-referent prefix

# Interior insets (studs) applied to the transparent glass shell AABB to get the
# real swim cavity. X is the thin depth axis; Z is the long axis; Y is height.
INSET_X, INSET_Z = 1.0, 1.5
INSET_Y_BOT, INSET_Y_TOP = 1.0, 1.0

# Remove anything that is a script / sound / gui / camera / animation / joint.
STRIP = {
    "Script","LocalScript","ModuleScript","Sound","SoundGroup",
    "Camera","SurfaceGui","BillboardGui","ScreenGui","TextBox","SelectionBox",
    "Decal","Texture",
    # animation-system junk shipped by this model
    "Timer","NumberPose","Pose","Keyframe","KeyframeSequence","Animation",
    "AnimationController","Animator","NumberValue","StringValue","ObjectValue",
    "BoolValue","IntValue","Folder",
    # joints / movers
    "Weld","ManualWeld","Snap","Motor","Motor6D","JointInstance","Glue","RigidConstraint",
    "WeldConstraint","NoCollisionConstraint","HingeConstraint","BallSocketConstraint",
    "AlignPosition","AlignOrientation","VectorForce","Torque","LinearVelocity",
    "AngularVelocity","BodyVelocity","BodyAngularVelocity","BodyForce","BodyGyro",
    "BodyPosition","BodyThrust",
}
BASEPARTS = {"Part","MeshPart","WedgePart","CornerWedgePart","TrussPart",
             "UnionOperation","Seat","VehicleSeat"}

P = etree.XMLParser(strip_cdata=False, huge_tree=True)

def strip_tree(item):
    for child in list(item):
        if child.tag == "Item":
            if child.get("class") in STRIP:
                item.remove(child)
            else:
                strip_tree(child)

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

def world_aabb_of(it):
    """rotation-aware world AABB (cx,cy,cz, ex,ey,ez) of a BasePart Item."""
    pr = it.find("Properties")
    cf = pr.find("CoordinateFrame[@name='CFrame']") or pr.find("CFrame[@name='CFrame']")
    sz = pr.find("Vector3[@name='size']") or pr.find("Vector3[@name='Size']")
    if cf is None or sz is None:
        return None
    cx, cy, cz = get(cf,"X"), get(cf,"Y"), get(cf,"Z")
    hx, hy, hz = get(sz,"X")/2, get(sz,"Y")/2, get(sz,"Z")/2
    R = rmat(cf)
    ex = abs(R[0])*hx + abs(R[1])*hy + abs(R[2])*hz
    ey = abs(R[3])*hx + abs(R[4])*hy + abs(R[5])*hz
    ez = abs(R[6])*hx + abs(R[7])*hy + abs(R[8])*hz
    return cx, cy, cz, ex, ey, ez

def is_transparent(it):
    pr = it.find("Properties")
    t = pr.findtext("float[@name='Transparency']") if pr is not None else None
    try:
        return float(t) > 0.05 if t not in (None, "") else False
    except ValueError:
        return False

# ---------- load + strip source model ----------
sroot = etree.parse(SRC, P).getroot()
model = next((it for it in sroot if it.tag == "Item" and it.get("class") == "Model"), None)
if model is None:
    sys.exit("Model not found in source rbxmx")
n_before = sum(1 for it in model.iter("Item")
               if it.get("class") in ("Script","LocalScript","ModuleScript"))
strip_tree(model)
n_after = sum(1 for it in model.iter("Item")
              if it.get("class") in ("Script","LocalScript","ModuleScript"))
print(f"stripped scripts: {n_before} -> {n_after} (must be 0)")
if n_after != 0:
    sys.exit("ERROR: scripts remain after strip")

# ---------- rotation-aware model bbox (for centring) ----------
mnx=mny=mnz=1e18; mxx=mxy=mxz=-1e18
for it in baseparts(model):
    b = world_aabb_of(it)
    if b is None: continue
    cx, cy, cz, ex, ey, ez = b
    mnx=min(mnx,cx-ex); mxx=max(mxx,cx+ex)
    mny=min(mny,cy-ey); mxy=max(mxy,cy+ey)
    mnz=min(mnz,cz-ez); mxz=max(mxz,cz+ez)
cx=(mnx+mxx)/2; cz=(mnz+mxz)/2; footY=mny
print(f"native bbox X{mnx:.2f}..{mxx:.2f} Y{mny:.2f}..{mxy:.2f} Z{mnz:.2f}..{mxz:.2f}")
print(f"centre=({cx:.2f},{cz:.2f}) footY={footY:.2f} -> target=({TX},{TZ}) groundY={GROUND_Y}")

# ---------- main file ----------
tree = etree.parse(MAIN, P); root = tree.getroot()
ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")

# idempotent: remove any prior injected aquarium
removed = 0
for it in list(ws):
    if it.tag == "Item":
        pr = it.find("Properties")
        nm = pr.findtext("string[@name='Name']") if pr is not None else None
        if nm == MODEL_NAME:
            ws.remove(it); removed += 1
print(f"removed {removed} prior '{MODEL_NAME}' model(s)")

cp = copy.deepcopy(model)
cp.find("Properties/string[@name='Name']").text = MODEL_NAME

# unique referents + internal Ref remap (keep SharedString refs untouched)
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

# Y-rotation applied to the whole model about its vertical centre axis.
# Ry(theta) rows; rotating an offset (lx,ly,lz): rx=c*lx+s*lz, rz=-s*lx+c*lz.
_th = math.radians(ROT_Y_DEG)
_c, _s = math.cos(_th), math.sin(_th)
RY = [[_c, 0.0, _s], [0.0, 1.0, 0.0], [-_s, 0.0, _c]]

def set_r(cf, idx, val):
    el = cf.find(idx)
    if el is None:
        el = etree.SubElement(cf, idx)
    el.text = f"{val:.6f}"

# anchor + rotate(Y) + translate every BasePart (no scale: SCALE==1.0)
for it in baseparts(cp):
    pr = it.find("Properties")
    anc = pr.find("bool[@name='Anchored']")
    if anc is None:
        anc = etree.SubElement(pr, "bool"); anc.set("name", "Anchored")
    anc.text = "true"
    cf = pr.find("CoordinateFrame[@name='CFrame']")
    if cf is None: continue
    # 1) rotate the position offset (about model centre cx,cz) then translate
    x,y,z = get(cf,"X"),get(cf,"Y"),get(cf,"Z")
    lx, lz = (x-cx)*SCALE, (z-cz)*SCALE
    rx = _c*lx + _s*lz
    rz = -_s*lx + _c*lz
    cf.find("X").text=f"{rx + TX:.5f}"
    cf.find("Y").text=f"{(y-footY)*SCALE + GROUND_Y:.5f}"
    cf.find("Z").text=f"{rz + TZ:.5f}"
    # 2) rotate the orientation: R_new = RY * R_old
    O = rmat(cf)  # [R00,R01,R02,R10,R11,R12,R20,R21,R22]
    Old = [[O[0],O[1],O[2]],[O[3],O[4],O[5]],[O[6],O[7],O[8]]]
    New = [[sum(RY[i][k]*Old[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
    keys = ("R00","R01","R02","R10","R11","R12","R20","R21","R22")
    flat = [New[0][0],New[0][1],New[0][2],New[1][0],New[1][1],New[1][2],New[2][0],New[2][1],New[2][2]]
    for k, v in zip(keys, flat):
        set_r(cf, k, v)

# ---------- compute TRUE interior cavity from transparent glass panes ----------
gx0=gy0=gz0=1e18; gx1=gy1=gz1=-1e18; npane=0
for it in baseparts(cp):
    if not is_transparent(it):
        continue
    b = world_aabb_of(it)
    if b is None: continue
    cxx, cyy, czz, ex, ey, ez = b
    gx0=min(gx0,cxx-ex); gx1=max(gx1,cxx+ex)
    gy0=min(gy0,cyy-ey); gy1=max(gy1,cyy+ey)
    gz0=min(gz0,czz-ez); gz1=max(gz1,czz+ez)
    npane += 1
if npane == 0:
    sys.exit("ERROR: no transparent glass panes found to derive bounds")
# rotation-aware insets: the SMALL inset must go on the THIN (depth) axis so it
# never collapses, regardless of how the tank was rotated. Pick by world span.
spanX, spanZ = (gx1 - gx0), (gz1 - gz0)
if spanX <= spanZ:           # world X is the thin (depth) axis
    iX, iZ = INSET_X, INSET_Z
else:                        # world Z is the thin (depth) axis (after 90deg rot)
    iX, iZ = INSET_Z, INSET_X
inX0, inX1 = gx0 + iX, gx1 - iX
inZ0, inZ1 = gz0 + iZ, gz1 - iZ
inY0, inY1 = gy0 + INSET_Y_BOT, gy1 - INSET_Y_TOP
# guard against inverted/too-thin axes
if inX0 > inX1: inX0 = inX1 = (gx0+gx1)/2
if inZ0 > inZ1: inZ0 = inZ1 = (gz0+gz1)/2
if inY0 > inY1: inY0 = inY1 = (gy0+gy1)/2
waterTopY = inY1 - 0.4
print(f"glass shell X{gx0:.2f}..{gx1:.2f} Y{gy0:.2f}..{gy1:.2f} Z{gz0:.2f}..{gz1:.2f} ({npane} panes)")
print(f"INTERIOR  X{inX0:.2f}..{inX1:.2f} Y{inY0:.2f}..{inY1:.2f} Z{inZ0:.2f}..{inZ1:.2f} waterTop={waterTopY:.2f}")

def add_number(parent, name, value, ref):
    item = etree.SubElement(parent, "Item"); item.set("class","NumberValue"); item.set("referent",ref)
    props = etree.SubElement(item, "Properties")
    s = etree.SubElement(props, "string"); s.set("name","Name"); s.text = name
    d = etree.SubElement(props, "double"); d.set("name","Value"); d.text = f"{value:.5f}"

bounds = [("AQMinX",inX0),("AQMaxX",inX1),("AQMinY",inY0),("AQMaxY",inY1),
          ("AQMinZ",inZ0),("AQMaxZ",inZ1),("AQWaterTopY",waterTopY)]
for i,(nm,val) in enumerate(bounds):
    add_number(cp, nm, val, f"{PREF}BND{i:03d}")
print(f"baked {len(bounds)} interior-bound NumberValues into model")

ws.append(cp)
print(f"inserted '{MODEL_NAME}' items={n}")

# ---------- merge SharedStrings blobs (md5-dedup) ----------
def shared_section(r):
    s = r.find("SharedStrings")
    if s is None:
        s = etree.SubElement(r, "SharedStrings")
    return s
main_ss = shared_section(root)
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
print("wrote", MAIN)
