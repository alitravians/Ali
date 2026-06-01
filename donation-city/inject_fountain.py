#!/usr/bin/env python3
# CDATA-preserving (lxml) insertion of the Creator-Store fountain the user chose,
# "Fountain of Sidon" (asset 5498475416), as STATIC decor at the plaza centre,
# replacing whatever "CityFountain" model was injected before (idempotent by name).
#
# This model is CLEAN: it ships with ZERO scripts and NO backdoor family
# (no LightConfig/EasyConfiguration/require-by-id). Its water is ALIVE on its own
# via 42 Beam objects with TextureSpeed = -1 (scrolling water texture) — so NO
# runtime animation script is needed; CinemaDecor only attaches a soft 3D water
# sound (it auto-detects the Beams and skips the particle/Neon fallback used for
# carved-static fountains).
#
# The source was uploaded as a BINARY .rbxm; we converted it once to XML with
# rbxmk ( fs.read(.rbxm) -> fs.write(.rbxmx) ) and committed the XML as
# fountain_new.rbxmx so this injector is reproducible without the binary.
#
# We keep geometry + Beams + Attachments + PointLights, anchor every BasePart,
# strip only scripts/sounds/guis/cameras/spawns/joints, remap referents so the
# Beam Attachment0/Attachment1 refs stay valid, and MERGE the model's
# SharedStrings (Union/Mesh physical data) into the main file.
import sys, copy
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SRC  = "fountain_new.rbxmx"          # repo-local XML (converted from the user's .rbxm)

MODEL_NAME = "CityFountain"
TX, TZ = 0.0, 0.0       # plaza centre
GROUND_Y = 0.0          # plaza floor (model foot sits here)
SCALE = 1.0             # native (~39 wide x ~31.5 tall x ~37 deep)
PREF = "FS"             # unique-referent prefix (Fountain of Sidon)

# Remove scripts / audio / gui / camera / spawn / animation-pose / joints+movers.
# IMPORTANT: we deliberately KEEP Beam, Attachment, PointLight, BlockMesh and all
# BaseParts (Beams + their attachments are what make the water look alive).
STRIP = {
    "Script","LocalScript","ModuleScript","Sound","SoundGroup",
    "Camera","SurfaceGui","BillboardGui","ScreenGui","TextBox","SelectionBox",
    "SpawnLocation",            # never let a store model hijack player spawns
    "NumberPose","Pose","Keyframe","KeyframeSequence","Animation",
    "AnimationController","Animator",
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

def size_el(pr):
    return pr.find("Vector3[@name='size']") or pr.find("Vector3[@name='Size']")

# ---------- load + strip source model ----------
sroot = etree.parse(SRC, P).getroot()
model = next((it for it in sroot if it.tag == "Item" and it.get("class") == "Model"), None)
if model is None:
    sys.exit("Model not found in fountain source xml")
n_scr_before = sum(1 for it in model.iter("Item")
                   if it.get("class") in ("Script","LocalScript","ModuleScript"))
strip_tree(model)
n_scr_after = sum(1 for it in model.iter("Item")
                  if it.get("class") in ("Script","LocalScript","ModuleScript"))
n_beam = sum(1 for it in model.iter("Item") if it.get("class") == "Beam")
print(f"scripts {n_scr_before} -> {n_scr_after} (must be 0); kept Beams = {n_beam}")
if n_scr_after != 0:
    sys.exit("ERROR: scripts remain after strip")

# ---------- rotation-aware bounding box (for centring + foot on ground) ----------
mnx=mny=mnz=1e18; mxx=mxy=mxz=-1e18
for it in baseparts(model):
    pr = it.find("Properties")
    cf = pr.find("CoordinateFrame[@name='CFrame']")
    sz = size_el(pr)
    if cf is None or sz is None:
        continue
    x,y,z = get(cf,"X"),get(cf,"Y"),get(cf,"Z")
    sx,sy,szz = get(sz,"X"),get(sz,"Y"),get(sz,"Z")
    r00,r01,r02 = get(cf,"R00",1.0),get(cf,"R01"),get(cf,"R02")
    r10,r11,r12 = get(cf,"R10"),get(cf,"R11",1.0),get(cf,"R12")
    r20,r21,r22 = get(cf,"R20"),get(cf,"R21"),get(cf,"R22",1.0)
    hx = 0.5*(abs(r00)*sx + abs(r01)*sy + abs(r02)*szz)
    hy = 0.5*(abs(r10)*sx + abs(r11)*sy + abs(r12)*szz)
    hz = 0.5*(abs(r20)*sx + abs(r21)*sy + abs(r22)*szz)
    mnx=min(mnx,x-hx); mxx=max(mxx,x+hx)
    mny=min(mny,y-hy); mxy=max(mxy,y+hy)
    mnz=min(mnz,z-hz); mxz=max(mxz,z+hz)
cx=(mnx+mxx)/2; cz=(mnz+mxz)/2; footY=mny
print(f"fountain bbox X{mnx:.2f}..{mxx:.2f} ({mxx-mnx:.1f}) "
      f"Y{mny:.2f}..{mxy:.2f} ({mxy-mny:.1f}) Z{mnz:.2f}..{mxz:.2f} ({mxz-mnz:.1f})")
print(f"centre=({cx:.2f},{cz:.2f}) footY={footY:.2f} -> target=({TX},{TZ}) groundY={GROUND_Y}")

# ---------- main file ----------
tree = etree.parse(MAIN, P); root = tree.getroot()
ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")

# idempotent: remove any prior injected fountain (by name)
removed = 0
for it in list(ws.findall("Item")):
    pr = it.find("Properties")
    if pr is None: continue
    if (pr.findtext("string[@name='Name']") or "") == MODEL_NAME:
        ws.remove(it); removed += 1
print(f"removed {removed} prior '{MODEL_NAME}' model(s)")

cp = copy.deepcopy(model)
cp.find("Properties/string[@name='Name']").text = MODEL_NAME

# unique referents + internal Ref remap (keep SharedString refs untouched).
# This is essential so Beam Attachment0/Attachment1 (and Model PrimaryPart) refs
# resolve to the copied subtree and never collide with the main file's referents.
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

# anchor + translate every BasePart (rotation preserved, SCALE=1).
# Attachments are children of parts with LOCAL CFrames, so they move with the
# part automatically — we must NOT translate them.
for it in baseparts(cp):
    pr = it.find("Properties")
    anc = pr.find("bool[@name='Anchored']")
    if anc is None:
        anc = etree.SubElement(pr, "bool"); anc.set("name", "Anchored")
    anc.text = "true"
    cf = pr.find("CoordinateFrame[@name='CFrame']")
    if cf is None: continue
    x,y,z = get(cf,"X"),get(cf,"Y"),get(cf,"Z")
    cf.find("X").text=f"{(x-cx)*SCALE+TX:.5f}"
    cf.find("Y").text=f"{(y-footY)*SCALE+GROUND_Y:.5f}"
    cf.find("Z").text=f"{(z-cz)*SCALE+TZ:.5f}"

ws.append(cp)
print(f"inserted '{MODEL_NAME}' items={n}")

# ---------- merge SharedStrings blobs (md5-dedup) ----------
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
print("wrote", MAIN)
