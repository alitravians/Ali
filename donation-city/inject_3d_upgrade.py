#!/usr/bin/env python3
# 3D upgrade assembly: replaces the old primitive map elements with the 22
# Blender-made MeshPart models that were uploaded through Studio's 3D Importer
# (they sit as staging Models at the world origin inside DonationCity_FINAL.rbxlx).
#
# What it does, in order:
#   1. Reads the 22 staging Models from Workspace as templates (MeshIds already
#      point at the uploaded Roblox assets).
#   2. Deletes the OLD primitives: DonationBooth_* (6), Tree1-6, Balloon1-6
#      (user instruction: remove old models so there is no overlap/lag).
#   3. Clones + scales (~2.3x, imports come in at 1 stud/metre) + yaw-rotates +
#      places the new models at the exact old positions, recolouring every part
#      by name (FBX colours do NOT survive the importer — parts arrive grey).
#   4. Booths keep the BoothSystem contract: Model "DonationBooth_<Tier>" with
#      children Body / Sign / Counter (renamed from Back_Wall / Sign_Board /
#      Counter_Top).
#   5. Adds the NEW content: cinema facade (in front of the Cinema), welcome
#      gate on the path, low wall ring around the map edge, construction props
#      in both construction zones.
#   6. Installs src/CinemaMarquee.server.lua into ServerScriptService
#      (marquee bulb chase + searchlight sway animation).
#   7. Removes the staging models.
#
# Axis mapping measured from the actual imports (Blender -> Roblox):
#   R.x = -B.x ; R.y = B.z ; R.z = B.y ; rotations are baked (identity R).
import copy, math, sys
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"

STAGING = [
    "booth_bronze", "booth_silver", "booth_gold", "booth_emerald", "booth_ruby",
    "booth_diamond", "tree_classic", "tree_pine", "tree_palm", "tree_blossom",
    "balloon_round", "balloon_heart", "balloon_star", "cinema_facade", "gate",
    "wall_segment", "crane", "scaffold", "barrier", "cone", "mixer", "dirtpile",
    "sign",
]

# Roblox Material enum values
PLASTIC, SMOOTH, NEON, WOOD, WOODP = 256, 272, 288, 512, 528
MARBLE, SLATE, CONCRETE, GRANITE = 784, 800, 816, 832
METAL, GRASS, SAND, ICE, GLASS = 1088, 1280, 1296, 1536, 1568

def C(r, g, b):
    return (0xFF << 24) | (int(r * 255) << 16) | (int(g * 255) << 8) | int(b * 255)

TIER_COLORS = {
    "bronze":  C(0.72, 0.45, 0.20), "silver": C(0.80, 0.82, 0.86),
    "gold":    C(1.00, 0.78, 0.20), "emerald": C(0.10, 0.85, 0.45),
    "ruby":    C(0.90, 0.15, 0.30), "diamond": C(0.65, 0.90, 1.00),
}
WOOD_C, WOODD_C, STONE_C = C(0.45, 0.30, 0.16), C(0.28, 0.18, 0.10), C(0.75, 0.74, 0.72)
GOLD_C = C(1.0, 0.78, 0.2)

# style: list of (name-prefix match, (color, material, transparency, cancollide))
def booth_style(tier):
    a = TIER_COLORS[tier]
    return [
        ("Base_", (STONE_C, GRANITE, 0, True)),
        ("Counter_Body", (WOOD_C, WOOD, 0, True)),
        ("Counter_Top", (a, METAL if tier in ("bronze", "silver", "gold") else SMOOTH, 0, True)),
        ("Counter_Skirt", (WOODD_C, WOOD, 0, True)),
        ("Back_Wall", (WOODD_C, WOODP, 0, True)),
        ("Back_Shelf", (WOOD_C, WOOD, 0, True)),
        ("Pillar_", (a, METAL, 0, True)),
        ("Canopy", (a, GLASS, 0.55, False)),
        ("Sign_Board", (a, NEON if tier in ("emerald", "ruby", "diamond") else SMOOTH, 0, False)),
        ("Sign_Frame", (WOODD_C, WOOD, 0, False)),
        ("DonationBox_Slot", (WOODD_C, SMOOTH, 0, False)),
        ("DonationBox", (a, SMOOTH, 0, True)),
        ("Flag_", (a, SMOOTH, 0, False)),
        ("Orb", (a, NEON, 0, False)),
        ("Crystal_", (a, GLASS, 0.35, False)),
    ]

TRUNK_C = C(0.42, 0.28, 0.15)
TREE_STYLE = {
    "tree_classic": [("Trunk", (TRUNK_C, WOOD, 0, True)), ("Leaf", (C(0.35, 0.70, 0.35), GRASS, 0, False))],
    "tree_pine":    [("Trunk", (TRUNK_C, WOOD, 0, True)), ("Layer", (C(0.55, 0.80, 0.50), GRASS, 0, False))],
    "tree_palm":    [("Trunk", (TRUNK_C, WOOD, 0, True)), ("Frond", (C(0.40, 0.75, 0.45), GRASS, 0, False)),
                     ("Coconut", (TRUNK_C, WOOD, 0, False))],
    "tree_blossom": [("Trunk", (TRUNK_C, WOOD, 0, True)), ("Blossom", (C(0.95, 0.70, 0.80), GRASS, 0, False))],
}
STRING_C = C(0.85, 0.85, 0.9)
BALLOON_STYLE = {
    "balloon_round": [("String", (STRING_C, SMOOTH, 0.2, False)), ("", (C(0.9, 0.3, 0.3), SMOOTH, 0.05, False))],
    "balloon_heart": [("String", (STRING_C, SMOOTH, 0.2, False)), ("", (C(0.95, 0.35, 0.45), SMOOTH, 0.05, False))],
    "balloon_star":  [("String", (STRING_C, SMOOTH, 0.2, False)), ("", (C(0.95, 0.85, 0.30), SMOOTH, 0.05, False))],
}
CINEMA_STYLE = [
    ("Main_Building", (C(0.35, 0.33, 0.40), CONCRETE, 0, True)),
    ("Entrance_Block", (C(0.78, 0.15, 0.22), SMOOTH, 0, True)),
    ("Marquee_Band", (C(0.95, 0.95, 0.95), SMOOTH, 0, False)),
    ("Marquee_Trim", (GOLD_C, METAL, 0, False)),
    ("Letter", (C(1.0, 0.95, 0.7), NEON, 0, False)),
    ("Bulb", (C(1.0, 0.95, 0.7), NEON, 0, False)),
    ("VSign", (C(1.0, 0.25, 0.3), NEON, 0, False)),
    ("Column_", (GOLD_C, METAL, 0, True)),
    ("DoorFrame", (GOLD_C, METAL, 0, False)),
    ("Door", (C(0.6, 0.8, 0.9), GLASS, 0.5, False)),
    ("Poster_A_Frame", (GOLD_C, METAL, 0, False)),
    ("Poster_B_Frame", (GOLD_C, METAL, 0, False)),
    ("Poster_A", (C(0.95, 0.65, 0.25), SMOOTH, 0, False)),
    ("Poster_B", (C(0.35, 0.55, 0.9), SMOOTH, 0, False)),
    ("TicketWindow_Glass", (C(0.6, 0.8, 0.9), GLASS, 0.5, False)),
    ("TicketWindow", (C(0.95, 0.95, 0.95), SMOOTH, 0, True)),
    ("Carpet", (C(0.75, 0.10, 0.18), PLASTIC, 0, True)),
    ("PostBall_", (GOLD_C, METAL, 0, False)),
    ("Post_", (GOLD_C, METAL, 0, True)),
    ("Searchlight_Beam", (C(1.0, 1.0, 0.85), NEON, 0.75, False)),
    ("Searchlight_Base", (C(0.35, 0.33, 0.40), METAL, 0, True)),
]
GATE_STONE = C(0.93, 0.92, 0.88)
GATE_STYLE = [
    ("Tower_L_Roof", (C(0.35, 0.6, 0.9), SLATE, 0, True)),
    ("Tower_R_Roof", (C(0.35, 0.6, 0.9), SLATE, 0, True)),
    ("Tower_L_Orb", (GOLD_C, METAL, 0, False)), ("Tower_R_Orb", (GOLD_C, METAL, 0, False)),
    ("Tower_L_Pole", (C(0.55, 0.55, 0.55), METAL, 0, False)),
    ("Tower_R_Pole", (C(0.55, 0.55, 0.55), METAL, 0, False)),
    ("Tower_L_Flag", (C(0.85, 0.3, 0.35), SMOOTH, 0, False)),
    ("Tower_R_Flag", (C(0.85, 0.3, 0.35), SMOOTH, 0, False)),
    ("Tower_", (GATE_STONE, GRANITE, 0, True)),
    ("Arch", (GATE_STONE, GRANITE, 0, True)),
    ("Sign_Board", (C(0.35, 0.22, 0.12), WOOD, 0, False)),
    ("Sign_Panel", (C(0.4, 0.9, 1.0), NEON, 0, False)),
    ("Sign_Chain", (C(0.55, 0.55, 0.55), METAL, 0, False)),
]
WALL_STYLE = [
    ("Wall_Pillar_Ball", (C(0.35, 0.6, 0.9), SMOOTH, 0, False)),
    ("Wall_", (GATE_STONE, GRANITE, 0, True)),
]
STEEL_C, STEELD_C = C(0.95, 0.65, 0.1), C(0.85, 0.55, 0.05)
WARN_C, WARND_C = C(0.95, 0.8, 0.1), C(0.15, 0.15, 0.15)
CONC_C, GREY_C = C(0.8, 0.8, 0.78), C(0.6, 0.6, 0.62)
CONSTR_STYLE = {
    "crane": [("Crane_Base", (CONC_C, CONCRETE, 0, True)), ("Crane_Cable", (WARND_C, METAL, 0, False)),
              ("Crane_Cab", (WARN_C, METAL, 0, True)),
              ("Crane_Counterweight", (CONC_C, CONCRETE, 0, True)),
              ("Crane_Load", (CONC_C, CONCRETE, 0, True)), ("Crane_Brace", (STEELD_C, METAL, 0, False)),
              ("Crane_", (STEEL_C, METAL, 0, True))],
    "scaffold": [("Pole", (STEEL_C, METAL, 0, True)), ("Plank", (C(0.6, 0.42, 0.25), WOODP, 0, True)),
                 ("RailX", (STEELD_C, METAL, 0, False))],
    "barrier": [("Barrier_Stripe", (WARND_C, SMOOTH, 0, False)), ("Barrier_Leg", (WARND_C, SMOOTH, 0, True)),
                ("Barrier_Board", (WARN_C, SMOOTH, 0, True))],
    "cone": [("Cone_Stripe", (C(0.95, 0.95, 0.95), SMOOTH, 0, False)), ("Cone_Base", (WARND_C, SMOOTH, 0, True)),
             ("Cone_Body", (C(0.95, 0.45, 0.1), SMOOTH, 0, True))],
    "mixer": [("Mixer_Drum", (WARN_C, METAL, 0, True)), ("Mixer_Mouth", (WARND_C, METAL, 0, True)),
              ("Mixer_Base", (GREY_C, METAL, 0, True)), ("Mixer_Wheel", (WARND_C, SMOOTH, 0, False))],
    "dirtpile": [("DirtPile", (C(0.5, 0.35, 0.2), SAND, 0, True))],
    "sign": [("Sign_Post", (C(0.6, 0.42, 0.25), WOOD, 0, True)), ("Sign_Trim", (WARND_C, SMOOTH, 0, False)),
             ("Sign_Board", (WARN_C, SMOOTH, 0, False))],
}

# ---------------------------------------------------------------- xml helpers
parser = etree.XMLParser(strip_cdata=False, huge_tree=True)
tree = etree.parse(MAIN, parser)
root = tree.getroot()

def pname(it):
    e = it.find("./Properties/string[@name='Name']")
    return e.text if e is not None else "?"

def fset(parent_props, tag, name, text):
    e = parent_props.find(f"./{tag}[@name='{name}']")
    if e is None:
        e = etree.SubElement(parent_props, tag)
        e.set("name", name)
    e.text = text
    return e

ws = next(i for i in root.findall("./Item") if i.get("class") == "Workspace")
sss = next(i for i in root.findall("./Item") if i.get("class") == "ServerScriptService")

REF = [0]
def newref():
    REF[0] += 1
    return f"RBX3DUPG{REF[0]:08d}"

def get_part_geo(p):
    pr = p.find("./Properties")
    cf = pr.find("./CoordinateFrame[@name='CFrame']")
    sz = pr.find("./Vector3[@name='size']")
    pos = [float(cf.find(a).text) for a in "XYZ"]
    size = [float(sz.find(a).text) for a in "XYZ"]
    return pos, size

def yaw_rot(v, th):
    c, s = math.cos(th), math.sin(th)
    return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]

def make_model(template, name, target, k, yaw_deg, style, renames=None,
               drop=None, parent=None):
    """Clone staging template, scale about its bottom-centre, yaw, move bottom-
    centre to `target` (y = ground), restyle, anchor. Returns the model Item."""
    th = math.radians(yaw_deg)
    parts = [it for it in template.findall("./Item") if it.get("class") in ("MeshPart", "Part")]
    xs, ys, zs = [], [], []
    for p in parts:
        pos, size = get_part_geo(p)
        xs += [pos[0] - size[0] / 2, pos[0] + size[0] / 2]
        ys += [pos[1] - size[1] / 2]
        zs += [pos[2] - size[2] / 2, pos[2] + size[2] / 2]
    ref = [(min(xs) + max(xs)) / 2, min(ys), (min(zs) + max(zs)) / 2]

    model = etree.Element("Item")
    model.set("class", "Model")
    model.set("referent", newref())
    props = etree.SubElement(model, "Properties")
    fset(props, "string", "Name", name)

    c, s = math.cos(th), math.sin(th)
    for p in parts:
        nm = pname(p)
        if drop and any(nm.startswith(d) for d in drop):
            continue
        q = copy.deepcopy(p)
        q.set("referent", newref())
        qpr = q.find("./Properties")
        for uid in qpr.findall("./UniqueId"):
            qpr.remove(uid)
        pos, size = get_part_geo(q)
        rel = [(pos[i] - ref[i]) * k for i in range(3)]
        rel = yaw_rot(rel, th)
        npos = [target[0] + rel[0], target[1] + rel[1], target[2] + rel[2]]
        pr = q.find("./Properties")
        cf = pr.find("./CoordinateFrame[@name='CFrame']")
        for a, v in zip("XYZ", npos):
            cf.find(a).text = repr(v)
        for el, v in (("R00", c), ("R01", 0), ("R02", s), ("R10", 0), ("R11", 1),
                      ("R12", 0), ("R20", -s), ("R21", 0), ("R22", c)):
            cf.find(el).text = repr(float(v))
        sz = pr.find("./Vector3[@name='size']")
        for a, v in zip("XYZ", [size[i] * k for i in range(3)]):
            sz.find(a).text = repr(v)
        fset(pr, "bool", "Anchored", "true")
        for pref, (col, mat, tr, cancol) in style:
            if nm.startswith(pref):
                fset(pr, "Color3uint8", "Color3uint8", str(col))
                fset(pr, "token", "Material", str(mat))
                fset(pr, "float", "Transparency", repr(float(tr)))
                fset(pr, "bool", "CanCollide", "true" if cancol else "false")
                break
        if renames and nm in renames:
            fset(pr, "string", "Name", renames[nm])
        model.append(q)
    (parent if parent is not None else ws).append(model)
    return model

def part_geo_in_model(model, name):
    for p in model.findall("./Item"):
        if pname(p) == name:
            return p
    return None

# ------------------------------------------------------------------ templates
tmpl = {}
for it in list(ws.findall("./Item")):
    if pname(it) in STAGING and it.get("class") == "Model":
        tmpl[pname(it)] = it
missing = [n for n in STAGING if n not in tmpl]
if missing:
    sys.exit(f"FATAL: staging models missing: {missing}")

# -------------------------------------------------------- delete old elements
OLD = (["DonationBooth_Bronze", "DonationBooth_Silver", "DonationBooth_Gold",
        "DonationBooth_Emerald", "DonationBooth_Ruby", "DonationBooth_Diamond"]
       + [f"Tree{i}" for i in range(1, 7)] + [f"Balloon{i}" for i in range(1, 7)])
removed = 0
for it in list(ws.findall("./Item")):
    if pname(it) in OLD:
        ws.remove(it)
        removed += 1
print(f"removed {removed} old elements")

# ---------------------------------------------------------------- 1) booths
TIERS = ["Bronze", "Silver", "Gold", "Emerald", "Ruby", "Diamond"]
BOOTH_Z = [-40, -24, -8, 8, 24, 40]
for tier, z in zip(TIERS, BOOTH_Z):
    make_model(tmpl[f"booth_{tier.lower()}"], f"DonationBooth_{tier}",
               (-52.4, 0.0, float(z)), 2.3, 90, booth_style(tier.lower()),
               renames={"Back_Wall": "Body", "Sign_Board": "Sign", "Counter_Top": "Counter"})
# BoothSystem repurposes an existing ProximityPrompt (FindFirstChildWhichIsA),
# so each booth must ship with one (hosted on the Counter part).
for it in ws.findall("./Item"):
    if pname(it).startswith("DonationBooth_"):
        host = next(c for c in it.findall("./Item") if pname(c) == "Counter")
        pp = etree.SubElement(host, "Item")
        pp.set("class", "ProximityPrompt")
        pp.set("referent", newref())
        ppr = etree.SubElement(pp, "Properties")
        fset(ppr, "string", "Name", "BoothPrompt")
print("booths placed")

# ----------------------------------------------------------------- 2) trees
TREES = [("Tree1", "tree_classic", (-65, 0, -65), 20), ("Tree2", "tree_pine", (65, 0, -65), 0),
         ("Tree3", "tree_blossom", (-65, 0, 65), 75), ("Tree4", "tree_palm", (65, 0, 65), 150),
         ("Tree5", "tree_blossom", (-72, 0, 0), 290), ("Tree6", "tree_classic", (72, 0, 0), 200)]
for name, kind, pos, yaw in TREES:
    make_model(tmpl[kind], name, [float(v) for v in pos], 3.2, yaw, TREE_STYLE[kind])
print("trees placed")

# -------------------------------------------------------------- 3) balloons
BALLOONS = [("Balloon1", "balloon_round", (58, 34, 0), None),
            ("Balloon2", "balloon_heart", (29, 37, 50.23), None),
            ("Balloon3", "balloon_star", (-29, 40, 50.23), None),
            ("Balloon4", "balloon_round", (-58, 34, 0), C(0.3, 0.55, 0.9)),
            ("Balloon5", "balloon_heart", (-29, 37, -50.23), C(0.6, 0.35, 0.85)),
            ("Balloon6", "balloon_star", (29, 40, -50.23), C(0.35, 0.85, 0.5))]
for name, kind, pos, recol in BALLOONS:
    m = make_model(tmpl[kind], name, [float(v) for v in pos], 3.0, 0, BALLOON_STYLE[kind])
    if recol:
        for p in m.findall("./Item"):
            if not pname(p).startswith("String"):
                fset(p.find("./Properties"), "Color3uint8", "Color3uint8", str(recol))
print("balloons placed")

# --------------------------------------------------------- 4) cinema facade
# place so the facade building back sits flush against the Cinema front (z=-91)
ft = tmpl["cinema_facade"]
parts = [it for it in ft.findall("./Item")]
xs = []; ys = []; zs = []
for p in parts:
    pos, size = get_part_geo(p)
    xs += [pos[0] - size[0] / 2, pos[0] + size[0] / 2]
    ys += [pos[1] - size[1] / 2]
    zs += [pos[2] - size[2] / 2, pos[2] + size[2] / 2]
refz = (min(zs) + max(zs)) / 2
mb_pos, mb_size = get_part_geo(part_geo_in_model(ft, "Main_Building"))
K_CIN = 2.3
# desired Main_Building back face at z=-90.8 -> centre = -90.8 + depth/2
want_center = -90.8 + (mb_size[2] * K_CIN) / 2
target_z = want_center - (mb_pos[2] - refz) * K_CIN
fac = make_model(ft, "CinemaFacade3D", (0.0, 0.0, target_z), K_CIN, 0, CINEMA_STYLE,
                 drop=["Post_L2", "Post_R2", "Post_L3", "Post_R3",
                       "PostBall_L2", "PostBall_R2", "PostBall_L3", "PostBall_R3"])
# shorten the red carpet so it cannot reach the Aquarium (z -49..-47)
cp = part_geo_in_model(fac, "Carpet")
pos, size = get_part_geo(cp)
far, near = pos[2] + size[2] / 2, pos[2] - size[2] / 2
if far > -54:
    far = -54.0
    nlen = far - near
    pr = cp.find("./Properties")
    pr.find("./CoordinateFrame[@name='CFrame']").find("Z").text = repr(near + nlen / 2)
    pr.find("./Vector3[@name='size']").find("Z").text = repr(nlen)
print("cinema facade placed at z target", round(target_z, 2))

# ------------------------------------------------------------- 5) gate+wall
make_model(tmpl["gate"], "WelcomeGate3D", (0.0, 0.0, 108.0), 2.0, 0, GATE_STYLE)
wallF = etree.SubElement(ws, "Item")
wallF.set("class", "Folder"); wallF.set("referent", newref())
fset(etree.SubElement(wallF, "Properties"), "string", "Name", "CityWall3D")
K_W = 3.0
wt = tmpl["wall_segment"]
wxs = []
for p in wt.findall("./Item"):
    pos, size = get_part_geo(p)
    wxs += [pos[0] - size[0] / 2, pos[0] + size[0] / 2]
seg_w = (max(wxs) - min(wxs)) * K_W
EDGE = 240.0
n_side = int((2 * EDGE) // seg_w)
count = 0
start = -EDGE + ((2 * EDGE) - n_side * seg_w) / 2 + seg_w / 2
for i in range(n_side):
    x = start + i * seg_w
    # south side (z=+EDGE): leave a gap aligned with the path/gate
    if abs(x) > 20:
        make_model(wt, f"Wall_S{i}", (x, 0.0, EDGE), K_W, 0, WALL_STYLE, parent=wallF)
        count += 1
    make_model(wt, f"Wall_N{i}", (x, 0.0, -EDGE), K_W, 0, WALL_STYLE, parent=wallF)
    make_model(wt, f"Wall_E{i}", (EDGE, 0.0, x), K_W, 90, WALL_STYLE, parent=wallF)
    make_model(wt, f"Wall_W{i}", (-EDGE, 0.0, x), K_W, 90, WALL_STYLE, parent=wallF)
    count += 3
print(f"gate + wall ring placed ({count} segments)")

# ------------------------------------------------------ 6) construction props
def constr_zone(folder_name, z0):
    f = etree.SubElement(ws, "Item")
    f.set("class", "Folder"); f.set("referent", newref())
    fset(etree.SubElement(f, "Properties"), "string", "Name", folder_name)
    # the unfinished building skeleton occupies x 101.6..178.4 — every prop
    # must stay OUTSIDE it: crane east of the building, the rest on the street
    # strip west of it (scaffolds flush against the facade).
    make_model(tmpl["crane"], "Crane", (203.0, 0.0, z0 + 24), 2.3, 180, CONSTR_STYLE["crane"], parent=f)
    make_model(tmpl["scaffold"], "Scaffold1", (98.1, 0.0, z0 - 18), 2.3, 90, CONSTR_STYLE["scaffold"], parent=f)
    make_model(tmpl["scaffold"], "Scaffold2", (98.1, 0.0, z0 + 18), 2.3, 90, CONSTR_STYLE["scaffold"], parent=f)
    make_model(tmpl["mixer"], "Mixer", (97.0, 0.0, z0 + 6), 2.0, 135, CONSTR_STYLE["mixer"], parent=f)
    make_model(tmpl["dirtpile"], "DirtPile", (97.0, 0.0, z0 - 8), 2.5, 0, CONSTR_STYLE["dirtpile"], parent=f)
    make_model(tmpl["sign"], "ConstructionSign", (91.0, 0.0, z0), 2.2, -90, CONSTR_STYLE["sign"], parent=f)
    for j, dz in enumerate((-22, 0, 22)):
        make_model(tmpl["barrier"], f"Barrier{j}", (89.0, 0.0, z0 + dz), 2.0, 90, CONSTR_STYLE["barrier"], parent=f)
    for j, (dx, dz) in enumerate(((-4, -12), (-4, 12), (2, -30), (2, 30))):
        make_model(tmpl["cone"], f"Cone{j}", (89.0 + dx, 0.0, z0 + dz), 2.0, 0, CONSTR_STYLE["cone"], parent=f)

constr_zone("BeachConstructionProps3D", 79.0)
constr_zone("GamehallConstructionProps3D", -111.0)
print("construction props placed")

# ------------------------------------------------- 7) CinemaMarquee script
with open("src/CinemaMarquee.server.lua", encoding="utf-8") as fh:
    src = fh.read()
for it in list(sss.findall("./Item")):
    if pname(it) == "CinemaMarquee":
        sss.remove(it)
sc = etree.SubElement(sss, "Item")
sc.set("class", "Script"); sc.set("referent", newref())
sp = etree.SubElement(sc, "Properties")
fset(sp, "string", "Name", "CinemaMarquee")
fset(sp, "bool", "Disabled", "false")
srcEl = etree.SubElement(sp, "ProtectedString")
srcEl.set("name", "Source")
srcEl.text = etree.CDATA(src)
print("CinemaMarquee script installed")

# -------------------------------------------------- 8) remove staging models
for nm, it in tmpl.items():
    ws.remove(it)
print("staging models removed")

tree.write(MAIN, encoding="utf-8", xml_declaration=True)
print("OK ->", MAIN)
