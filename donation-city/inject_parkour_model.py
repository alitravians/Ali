#!/usr/bin/env python3
# CDATA-preserving (lxml) insertion of the user's Creator-Store parkour ("Obby",
# asset 115527378110698) as STATIC anchored geometry named "ParkourCourse",
# replacing the OLD procedural tower that ParkourSystem.server.lua used to build
# at runtime (that TOWER data is removed from the script in the same change).
#
# The model ships with 42 Scripts + a disguised "Package"/"TextureConfiguration"
# require-style module pair (same backdoor family as the other store assets), a
# Camera and a NumberPose. We STRIP ALL of that and keep only geometry + lights.
# Every BasePart is Anchored = true (zero physics = zero lag). The model's
# SpawnLocation is KEPT (ParkourSystem reads its position as the course start)
# but DISABLED (Enabled=false) so it can never hijack the city's player spawns.
#
# Layout: a 30-stage vertical obby (~370 studs tall) with a Spawn folder, a
# CheckPoints folder (5 numbered pads) and Stages/Stage 1..30. We translate the
# whole model so its Spawn lands at the OLD parkour base (-140, 37) with the foot
# on the ground, keeping the obby in its original NW plaza zone. ParkourSystem
# then derives BASE_Y / FINISH_Y / checkpoints / finish directly from the model.
import sys, copy
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SRC  = "parkour_obby.rbxmx"   # repo-local copy of Creator-Store asset 115527378110698

MODEL_NAME = "ParkourCourse"
# Land the Spawn pad here (old tower base) so the obby occupies the same NW zone.
SPAWN_TX, SPAWN_TZ = -140.0, 37.0
PREF = "PK"

STRIP = {
    "Script","LocalScript","ModuleScript","Sound","SoundGroup",
    "Camera","SurfaceGui","BillboardGui","ScreenGui","TextBox","SelectionBox",
    "NumberPose","Pose","Keyframe","KeyframeSequence","Animation",
    "AnimationController","Animator",
    "Weld","ManualWeld","Snap","Motor","Motor6D","JointInstance","Glue","RigidConstraint",
    "WeldConstraint","NoCollisionConstraint","HingeConstraint","BallSocketConstraint",
    "AlignPosition","AlignOrientation","VectorForce","Torque","LinearVelocity",
    "AngularVelocity","BodyVelocity","BodyAngularVelocity","BodyForce","BodyGyro",
    "BodyPosition","BodyThrust",
}
# SpawnLocation is a BasePart but handled specially (kept + disabled).
BASEPARTS = {"Part","MeshPart","WedgePart","CornerWedgePart","TrussPart",
             "UnionOperation","Seat","VehicleSeat","SpawnLocation"}

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

def cf_el(pr):
    e = pr.find("CoordinateFrame[@name='CFrame']")
    return e if e is not None else pr.find("CFrame[@name='CFrame']")

def size_el(pr):
    e = pr.find("Vector3[@name='size']")
    return e if e is not None else pr.find("Vector3[@name='Size']")

# ---------- load source; find top container (Folder "Obby") ----------
sroot = etree.parse(SRC, P).getroot()
top = next((it for it in sroot if it.tag == "Item"
            and it.get("class") in ("Folder", "Model")
            and (it.findtext("Properties/string[@name='Name']") or "") == "Obby"), None)
if top is None:
    top = next((it for it in sroot if it.tag == "Item"
                and it.get("class") in ("Folder", "Model")), None)
if top is None:
    sys.exit("Obby container not found in parkour source xml")

n_scr_before = sum(1 for it in top.iter("Item")
                   if it.get("class") in ("Script","LocalScript","ModuleScript"))
strip_tree(top)
n_scr_after = sum(1 for it in top.iter("Item")
                  if it.get("class") in ("Script","LocalScript","ModuleScript"))
n_spawn = sum(1 for it in top.iter("Item") if it.get("class") == "SpawnLocation")
print(f"scripts {n_scr_before} -> {n_scr_after} (must be 0); SpawnLocations kept = {n_spawn}")
if n_scr_after != 0:
    sys.exit("ERROR: scripts remain after strip")

# ---------- locate spawn part to compute the translation delta ----------
spawn_pos = None
for it in top.iter("Item"):
    if it.get("class") == "SpawnLocation":
        cf = cf_el(it.find("Properties"))
        if cf is not None:
            spawn_pos = (get(cf,"X"), get(cf,"Y"), get(cf,"Z")); break
if spawn_pos is None:
    sys.exit("ERROR: SpawnLocation not found (needed as course start)")
# Move spawn to target X/Z; keep native Y so the model foot stays on the ground.
dx = SPAWN_TX - spawn_pos[0]
dz = SPAWN_TZ - spawn_pos[2]
dy = 0.0
print(f"spawn native=({spawn_pos[0]:.1f},{spawn_pos[1]:.1f},{spawn_pos[2]:.1f}) "
      f"delta=({dx:.1f},{dy:.1f},{dz:.1f}) -> spawn target=({SPAWN_TX},{spawn_pos[1]:.1f},{SPAWN_TZ})")

# ---------- main file ----------
tree = etree.parse(MAIN, P); root = tree.getroot()
ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")

# idempotent: remove any prior injected course (by name)
removed = 0
for it in list(ws.findall("Item")):
    pr = it.find("Properties")
    if pr is None: continue
    if (pr.findtext("string[@name='Name']") or "") == MODEL_NAME:
        ws.remove(it); removed += 1
print(f"removed {removed} prior '{MODEL_NAME}' model(s)")

cp = copy.deepcopy(top)
cp.set("class", "Model")                       # Folder -> Model container
nm_el = cp.find("Properties/string[@name='Name']")
if nm_el is None:
    pr = cp.find("Properties")
    nm_el = etree.SubElement(pr, "string"); nm_el.set("name", "Name")
nm_el.text = MODEL_NAME

# unique referents + internal Ref remap
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

# anchor + translate every BasePart; disable any SpawnLocation
n_parts = 0
for it in baseparts(cp):
    pr = it.find("Properties")
    anc = pr.find("bool[@name='Anchored']")
    if anc is None:
        anc = etree.SubElement(pr, "bool"); anc.set("name", "Anchored")
    anc.text = "true"
    if it.get("class") == "SpawnLocation":
        en = pr.find("bool[@name='Enabled']")
        if en is None:
            en = etree.SubElement(pr, "bool"); en.set("name", "Enabled")
        en.text = "false"
    cf = cf_el(pr)
    if cf is None: continue
    cf.find("X").text = f"{get(cf,'X')+dx:.5f}"
    cf.find("Y").text = f"{get(cf,'Y')+dy:.5f}"
    cf.find("Z").text = f"{get(cf,'Z')+dz:.5f}"
    n_parts += 1

ws.append(cp)
print(f"inserted '{MODEL_NAME}' items={n} (anchored baseparts={n_parts})")

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
