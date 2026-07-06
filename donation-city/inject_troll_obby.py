#!/usr/bin/env python3
# CDATA-preserving (lxml) insertion of the user's Creator-Store "Troll Obby
# Tower Hell Laser Map Course" (asset 125285407522732, repo copy
# troll_obby.rbxmx) as STATIC anchored geometry named "ParkourCourse",
# replacing the OLD procedural spiral course that ParkourSystem.server.lua
# used to build at runtime (removed from the script in the same change).
#
# SECURITY AUDIT RESULT (per the standing integration rule):
#   The model ships with a CONFIRMED BACKDOOR of the known SkyLink/EZConfig
#   disguise family, hidden inside a 10-deep folder chain x64..x73 under a
#   "Bomb" tool Handle:
#     Configuration > SkyLink(BloomEffect) > EZConfig(Script)
#       > Type / EasyConfiguration (ModuleScripts)
#       > Pose (NumberPose) whose Value = 104499173334928 (numeric asset id
#         intended for a disguised require() = remote code execution)
#     ... nested TWICE recursively.
#   Additionally: a "PartAxis" Script under a disguised "AxisOrientation"
#   AudioRecorder whose source Roblox itself already stripped ("removed for
#   security reasons"), and a "DO NOT REMOVE" folder holding a bare
#   "Utilities" BloomEffect (same disguise family).
# We remove ONLY those malicious/disguise items. The model has NO other
# scripts (it is pure geometry: KILLPART-* kill bricks, AutoSpeed pads,
# givers, decor); everything clean is kept AS-IS, anchored.
import sys, copy
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SRC  = "troll_obby.rbxmx"

MODEL_NAME = "ParkourCourse"
PREF = "TO"

# Land the 70x70 base plate (native center 882.79, 642.70, 1546.30) here:
# same isolated SW corner as the old course, high in the sky so the tower's
# ~350x120 footprint can never clash with city buildings.
BASE_NATIVE = (882.7894, 642.70306, 1546.3049)
BASE_TARGET = (-150.0, 110.0, -150.0)

# Malicious / disguise items to remove (audited above).
# "admin" = the two HD Admin advertisement display stands (user asked to drop).
BAD_NAMES = {"x64", "AxisOrientation", "DO NOT REMOVE", "ThumbnailCamera",
             "admin"}
BAD_CLASSES = {"Script", "LocalScript", "ModuleScript", "NumberPose",
               "AudioRecorder"}

BASEPARTS = {"Part","MeshPart","WedgePart","CornerWedgePart","TrussPart",
             "UnionOperation","Seat","VehicleSeat","SpawnLocation"}

P = etree.XMLParser(strip_cdata=False, huge_tree=True)

def name_of(item):
    return item.findtext("Properties/string[@name='Name']") or ""

def strip_tree(item):
    removed = 0
    for child in list(item):
        if child.tag != "Item":
            continue
        if child.get("class") in BAD_CLASSES or name_of(child) in BAD_NAMES:
            item.remove(child); removed += 1
        else:
            removed += strip_tree(child)
    return removed

def get(cf, t, default=0.0):
    v = cf.findtext(t)
    return float(v) if v not in (None, "") else default

def cf_el(pr):
    e = pr.find("CoordinateFrame[@name='CFrame']")
    return e if e is not None else pr.find("CFrame[@name='CFrame']")

# ---------- load source; top container is the Folder "Model" ----------
sroot = etree.parse(SRC, P).getroot()
top = next((it for it in sroot if it.tag == "Item"
            and it.get("class") in ("Folder", "Model")), None)
if top is None:
    sys.exit("obby container not found in troll_obby.rbxmx")

n_removed = strip_tree(top)
left = [it for it in top.iter("Item")
        if it.get("class") in BAD_CLASSES or name_of(it) in BAD_NAMES]
print(f"removed {n_removed} malicious/disguise item(s); remaining bad = {len(left)} (must be 0)")
if left:
    sys.exit("ERROR: unsafe items remain after strip")

# ---------- localize creator signage to Arabic / our group ----------
# The model ships with the original creator's ad GUIs ("press like / join
# the group") and Korean hint signs; re-text them for our map & group
# (Shahad-Jori, group id 134977710 — see RewardBoxSystem.server.lua).
TEXT_MAP = {
    "please press like \U0001F44D for the game!":
        "\u0644\u0627 \u062a\u0646\u0633 \u0644\u0627\u064a\u0643 \U0001F44D \u0644\u0644\u0645\u0627\u0628!",
    "Press the like button and join the group!":
        "\u0627\u0636\u063a\u0637 \u0644\u0627\u064a\u0643 \U0001F44D \u0648\u0627\u0646\u0636\u0645 \u0644\u0642\u0631\u0648\u0628 Shahad-Jori!",
    "Congratulations! Troll X Tower Clear!":
        "\u0645\u0628\u0631\u0648\u0643! \u0623\u0646\u0647\u064a\u062a \u0628\u0631\u062c \u0627\u0644\u0628\u0627\u0631\u0643\u0648\u0631! \U0001F3C6",
    "\ud2b8\ub864 \ubc84\ud2bc\uc744 \ub204\ub974\uc9c0 \ub9d0\uace0 \ud30c\ub780 \ubc84\ud2bc\uc744 \ub20c\ub7ec\ubcf4\uc138\uc694!":
        "\u0644\u0627 \u062a\u0636\u063a\u0637 \u0632\u0631 \u0627\u0644\u062e\u062f\u0639\u0629\u2026 \u0627\u0636\u063a\u0637 \u0627\u0644\u0632\u0631 \u0627\u0644\u0623\u062e\u0636\u0631!",
    "<<< \uc124\ub9c8 \uc6d4\ud649\uc73c\ub85c \uac00\ub2a5\ud55c\uac74\uac00\uc694..? ":
        "<<< \u062a\u0642\u062f\u0631 \u062a\u0639\u062f\u064a\u0647\u0627 \u0628\u0642\u0641\u0632\u0629 \u062c\u062f\u0627\u0631\u061f",
    "\ub458 \uc911\uc5d0 \uc5b4\ub5a4 \ubc84\ud2bc\uc744 \ub204\ub974\uc2e4 \uac74\uac00\uc694?":
        "\u0623\u064a \u0632\u0631 \u0628\u062a\u062e\u062a\u0627\u0631\u061f \u0627\u062e\u062a\u0631 \u0628\u062d\u0630\u0631!",
    "\uba48\ucd94\uc9c0 \ub9d0\uace0 \ub2ec\ub824!! >>>":
        "\u0644\u0627 \u062a\u062a\u0648\u0642\u0641\u2026 \u0627\u0631\u0643\u0636!! >>>",
    "\ud2b8\ub864\uc774 \ub9ce\uc740 \uacc4\ub2e8\uc774\uc5d0\uc694! \uc870\uc2ec\ud558\uc138\uc694! >>>":
        "\u062f\u0631\u062c \u0645\u0644\u064a\u0621 \u0628\u0627\u0644\u062e\u062f\u0639! \u0627\u0646\u062a\u0628\u0647! >>>",
}

def localize_texts(item):
    n = 0
    for el in item.iter("string"):
        if el.get("name") == "Text" and el.text in TEXT_MAP:
            el.text = TEXT_MAP[el.text]; n += 1
    return n

# ---------- translation delta ----------
dx = BASE_TARGET[0] - BASE_NATIVE[0]
dy = BASE_TARGET[1] - BASE_NATIVE[1]
dz = BASE_TARGET[2] - BASE_NATIVE[2]
print(f"delta = ({dx:.2f}, {dy:.2f}, {dz:.2f})")

# ---------- main file ----------
tree = etree.parse(MAIN, P); root = tree.getroot()
ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")

removed = 0
for it in list(ws.findall("Item")):
    if name_of(it) == MODEL_NAME:
        ws.remove(it); removed += 1
print(f"removed {removed} prior '{MODEL_NAME}' model(s)")

n_txt = localize_texts(top)
print(f"localized {n_txt} sign text(s) to Arabic (expected 8)")
if n_txt != 8:
    sys.exit("ERROR: unexpected sign-text count")

cp = copy.deepcopy(top)
cp.set("class", "Model")
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

# drop empty legacy BinaryString props that are Content-typed today — the
# rbxlx→rbxl converter's ContentIdToContent migration rejects them
LEGACY_CONTENT_PROPS = {"MetalnessMap", "NormalMap", "RoughnessMap", "TexturePack"}
n_legacy = 0
for it in cp.iter("Item"):
    pr = it.find("Properties")
    if pr is None: continue
    for bs in list(pr.findall("BinaryString")):
        if bs.get("name") in LEGACY_CONTENT_PROPS and not (bs.text or "").strip():
            pr.remove(bs); n_legacy += 1
print(f"dropped {n_legacy} empty legacy content BinaryString prop(s)")

# anchor + translate every BasePart; disable the SpawnLocation
n_parts = 0; n_spawn = 0
for it in cp.iter("Item"):
    if it.get("class") not in BASEPARTS:
        continue
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
        n_spawn += 1
    cf = cf_el(pr)
    if cf is None: continue
    cf.find("X").text = f"{get(cf,'X')+dx:.5f}"
    cf.find("Y").text = f"{get(cf,'Y')+dy:.5f}"
    cf.find("Z").text = f"{get(cf,'Z')+dz:.5f}"
    n_parts += 1

if n_spawn != 1:
    sys.exit(f"ERROR: expected exactly 1 SpawnLocation, found {n_spawn}")

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
