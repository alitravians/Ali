#!/usr/bin/env python3
"""
inject_cinema_new.py — Replace the Cinema building with the new modern model.

Steps:
1. Remove all old Cinema model children (old building shell + old seats)
2. Inject transformed geometry from cinema_modern.rbxmx
3. Organize seats into "Seats" model, lights into "CeilingLights"
4. Add functional anchor Parts (Screen, Projector, GateBarrier, etc.)
   that CinemaSystem.server.lua references by name.

Transform: ΔX=+199.6, ΔY=-9.9, ΔZ=-47 (no rotation — both aligned on Z axis)
Result: new building centered at X≈0, entrance at Z≈-103, screen wall at Z≈-158
"""
import copy
from lxml import etree

GAME = "DonationCity_FINAL.rbxlx"
MODEL = "cinema_modern.rbxmx"

# Translation to map model coords → game world coords
DX, DY, DZ = 199.6, -9.9, -47.0

BP_CLASSES = frozenset([
    "Part", "MeshPart", "WedgePart", "CornerWedgePart", "TrussPart",
    "UnionOperation", "Seat", "VehicleSeat", "SpawnLocation",
])


def name_of(it):
    return it.findtext("Properties/string[@name='Name']") or ""


def set_name(it, n):
    el = it.find("Properties/string[@name='Name']")
    if el is not None:
        el.text = n


def transform_cframes(item):
    """Recursively translate all CFrame positions in item and descendants."""
    for it in item.iter("Item"):
        cf = it.find("Properties/CoordinateFrame[@name='CFrame']")
        if cf is None:
            continue
        xel = cf.find("X")
        yel = cf.find("Y")
        zel = cf.find("Z")
        if xel is not None and xel.text:
            xel.text = str(float(xel.text) + DX)
        if yel is not None and yel.text:
            yel.text = str(float(yel.text) + DY)
        if zel is not None and zel.text:
            zel.text = str(float(zel.text) + DZ)


def anchor_all(item):
    """Set Anchored=true on all BaseParts."""
    for it in item.iter("Item"):
        if it.get("class") not in BP_CLASSES:
            continue
        props = it.find("Properties")
        if props is None:
            continue
        anch = props.find("bool[@name='Anchored']")
        if anch is None:
            anch = etree.SubElement(props, "bool")
            anch.set("name", "Anchored")
        anch.text = "true"


# ─── Helpers to create XML elements ───────────────────────────────────

_ref_counter = [9000]


def nref():
    _ref_counter[0] += 1
    return f"NEWCIN{_ref_counter[0]:05d}"


def make_part(name, pos, size, color=None, transparency=0, material="SmoothPlastic",
              can_collide=True, anchored=True):
    """Create a Part Item element with Properties."""
    item = etree.Element("Item")
    item.set("class", "Part")
    item.set("referent", nref())
    props = etree.SubElement(item, "Properties")
    # Name
    el = etree.SubElement(props, "string")
    el.set("name", "Name")
    el.text = name
    # CFrame
    cf = etree.SubElement(props, "CoordinateFrame")
    cf.set("name", "CFrame")
    for tag, val in [("X", pos[0]), ("Y", pos[1]), ("Z", pos[2]),
                     ("R00", 1), ("R01", 0), ("R02", 0),
                     ("R10", 0), ("R11", 1), ("R12", 0),
                     ("R20", 0), ("R21", 0), ("R22", 1)]:
        e = etree.SubElement(cf, tag)
        e.text = str(val)
    # size
    sz = etree.SubElement(props, "Vector3")
    sz.set("name", "size")
    for tag, val in [("X", size[0]), ("Y", size[1]), ("Z", size[2])]:
        e = etree.SubElement(sz, tag)
        e.text = str(val)
    # Anchored
    el = etree.SubElement(props, "bool")
    el.set("name", "Anchored")
    el.text = "true" if anchored else "false"
    # CanCollide
    el = etree.SubElement(props, "bool")
    el.set("name", "CanCollide")
    el.text = "true" if can_collide else "false"
    # Transparency
    el = etree.SubElement(props, "float")
    el.set("name", "Transparency")
    el.text = str(transparency)
    # Color
    if color:
        el = etree.SubElement(props, "Color3uint8")
        el.set("name", "Color3uint8")
        el.text = str((color[0] << 16) | (color[1] << 8) | color[2])
    # Material
    mat_map = {"SmoothPlastic": "256", "Neon": "288", "Metal": "1088",
               "Glass": "1568", "Concrete": "816", "Wood": "512"}
    el = etree.SubElement(props, "token")
    el.set("name", "Material")
    el.text = mat_map.get(material, "256")
    # TopSurface/BottomSurface smooth
    for surf in ("TopSurface", "BottomSurface"):
        el = etree.SubElement(props, "token")
        el.set("name", surf)
        el.text = "0"
    return item


def make_model(name):
    item = etree.Element("Item")
    item.set("class", "Model")
    item.set("referent", nref())
    props = etree.SubElement(item, "Properties")
    el = etree.SubElement(props, "string")
    el.set("name", "Name")
    el.text = name
    return item


def add_proximity_prompt(parent_item, action_text, obj_text, hold=0.4, dist=10,
                         name="ProximityPrompt"):
    """Add a ProximityPrompt child inside a Part Item."""
    pp = etree.SubElement(parent_item, "Item")
    pp.set("class", "ProximityPrompt")
    pp.set("referent", nref())
    props = etree.SubElement(pp, "Properties")
    el = etree.SubElement(props, "string")
    el.set("name", "Name")
    el.text = name
    el = etree.SubElement(props, "string")
    el.set("name", "ActionText")
    el.text = action_text
    el = etree.SubElement(props, "string")
    el.set("name", "ObjectText")
    el.text = obj_text
    el = etree.SubElement(props, "float")
    el.set("name", "HoldDuration")
    el.text = str(hold)
    el = etree.SubElement(props, "float")
    el.set("name", "MaxActivationDistance")
    el.text = str(dist)
    el = etree.SubElement(props, "bool")
    el.set("name", "RequiresLineOfSight")
    el.text = "false"
    el = etree.SubElement(props, "token")
    el.set("name", "KeyboardKeyCode")
    el.text = "101"  # Enum.KeyCode.E
    return pp


def add_spotlight(parent_item, brightness=3, range_val=30, angle=60,
                  name="SpotLight"):
    """Add a SpotLight child."""
    sl = etree.SubElement(parent_item, "Item")
    sl.set("class", "SpotLight")
    sl.set("referent", nref())
    props = etree.SubElement(sl, "Properties")
    el = etree.SubElement(props, "string")
    el.set("name", "Name")
    el.text = name
    el = etree.SubElement(props, "float")
    el.set("name", "Brightness")
    el.text = str(brightness)
    el = etree.SubElement(props, "float")
    el.set("name", "Range")
    el.text = str(range_val)
    el = etree.SubElement(props, "float")
    el.set("name", "Angle")
    el.text = str(angle)
    el = etree.SubElement(props, "bool")
    el.set("name", "Enabled")
    el.text = "true"
    el = etree.SubElement(props, "token")
    el.set("name", "Face")
    el.text = "5"  # Bottom face


# ═══════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════

print("Parsing game file...")
P = etree.XMLParser(strip_cdata=False, huge_tree=True)
game_tree = etree.parse(GAME, P)
game_root = game_tree.getroot()

print("Parsing new cinema model...")
model_tree = etree.parse(MODEL, P)
model_root = model_tree.getroot()

# Find Workspace and Cinema model in game
ws = next(it for it in game_root.iter("Item") if it.get("class") == "Workspace")
cinema = None
for c in ws.findall("Item"):
    if c.get("class") == "Model" and name_of(c) == "Cinema":
        cinema = c
        break
if cinema is None:
    raise SystemExit("ERROR: Cinema model not found in Workspace")

# ─── Step 1: Remove all children of Cinema ────────────────────────────
old_children = list(cinema.findall("Item"))
print(f"Removing {len(old_children)} old Cinema children...")
for ch in old_children:
    cinema.remove(ch)

# ─── Step 2: Copy new model geometry into Cinema ──────────────────────
model_cinema = None
for it in model_root.findall("Item"):
    if it.get("class") == "Model" and name_of(it) == "Cinema":
        model_cinema = it
        break
if model_cinema is None:
    raise SystemExit("ERROR: Cinema model not found in .rbxmx")

# Safety: transform_cframes() world-translates every CFrame. That is only valid
# for world-space CFrames. Attachments/constraints store parent-LOCAL CFrames and
# must NOT be translated. This model contains none, but a future revision might —
# abort loudly instead of silently corrupting their offsets.
LOCAL_CFRAME_CLASSES = frozenset([
    "Attachment", "Bone", "Weld", "Motor6D", "WeldConstraint", "Constraint",
])
found_local = {it.get("class") for it in model_cinema.iter("Item")
               if it.get("class") in LOCAL_CFRAME_CLASSES}
if found_local:
    raise SystemExit(
        f"ERROR: model contains local-space CFrame class(es) {sorted(found_local)}; "
        f"transform_cframes() would corrupt their offsets. Add a class filter to "
        f"transform_cframes (skip these) before re-running."
    )

# Deep-copy children and transform
copied = 0
for child in model_cinema.findall("Item"):
    clone = copy.deepcopy(child)
    transform_cframes(clone)
    anchor_all(clone)
    cinema.append(clone)
    copied += 1
print(f"Injected {copied} top-level items from new model (transformed)")

# ─── Step 2b: Resolve name collisions with functional anchors ────────
# The model ships a decorative Model named "Projector"; CinemaSystem expects a
# BasePart named "Projector" (with a ProximityPrompt). Rename the decorative one
# so FindFirstChild("Projector") resolves to our functional Part (added below).
renamed = 0
for c in cinema.findall("Item"):
    if name_of(c) == "Projector":
        set_name(c, "ProjectorDecor")
        renamed += 1
if renamed:
    print(f"Renamed {renamed} decorative 'Projector' → 'ProjectorDecor'")

# ─── Step 3: Organize Seats → "Seats" model ──────────────────────────
seats_model = make_model("Seats")
# Collect all Seat class items that are direct children of Cinema.
# Safety: this model ships its 37 Seats as direct children of Cinema, so a
# direct-child scan captures them all. Guard against a model whose Seats are
# nested deeper (which a direct-child scan would silently drop) by comparing
# against the count of Seat descendants in the whole Cinema subtree.
seats_to_move = [c for c in cinema.findall("Item") if c.get("class") == "Seat"]
total_seats = sum(1 for it in cinema.iter("Item") if it.get("class") == "Seat")
if len(seats_to_move) != total_seats:
    raise SystemExit(
        f"ERROR: {total_seats - len(seats_to_move)} Seat(s) are nested inside "
        f"sub-models, not direct children of Cinema. getSeats() would miss them. "
        f"Update Step 3 to collect nested Seats before re-running."
    )
for i, s in enumerate(seats_to_move):
    cinema.remove(s)
    # Wrap in a container model for compatibility with getSeats() pattern
    wrapper = make_model(f"Chair_{i+1}")
    wrapper.append(s)
    seats_model.append(wrapper)
cinema.append(seats_model)
print(f"Organized {len(seats_to_move)} seats into 'Seats' model")

# ─── Step 4: Organize Lights → "CeilingLights" model ─────────────────
ceiling_lights = make_model("CeilingLights")
lights_to_move = [c for c in cinema.findall("Item")
                  if c.get("class") == "Model" and name_of(c) == "Light"]
for lt in lights_to_move:
    cinema.remove(lt)
    ceiling_lights.append(lt)
cinema.append(ceiling_lights)
print(f"Organized {len(lights_to_move)} light models into 'CeilingLights'")

# ─── Step 5: Add functional anchor Parts ──────────────────────────────
print("Adding functional anchor Parts...")

# Screen — projection surface (SurfaceGui added at runtime by CinemaSystem)
screen = make_part("Screen", (-21, 8, -157.5), (32, 16, 0.5),
                   color=(10, 10, 12), transparency=0, material="SmoothPlastic")
cinema.append(screen)

# ScreenFrame — decorative frame around screen
screen_frame = make_part("ScreenFrame", (-21, 8, -157.8), (36, 20, 0.4),
                         color=(20, 20, 22), transparency=0, material="Metal")
cinema.append(screen_frame)

# ScreenWall — wall behind screen
screen_wall = make_part("ScreenWall", (-21, 8, -158.1), (40, 22, 0.3),
                        color=(35, 35, 38), transparency=0, material="Concrete")
cinema.append(screen_wall)

# Projector — at ceiling, behind seats, with ProximityPrompt.
# Step 2b already renamed the decorative model → "ProjectorDecor", so there is no
# name collision; insert at index 1 (right after <Properties>) to keep the RBXLX
# convention that <Properties> is the first child of the <Item> element.
projector = make_part("Projector", (-21, 14, -120), (3, 3, 3),
                      color=(30, 30, 35), transparency=0, material="Metal")
add_proximity_prompt(projector, "شغّل العرض", "البروجكتر", hold=0.6, dist=14,
                     name="PlayMoviePrompt")  # match WorldBuilder's prompt name
cinema.insert(1, projector)

# GateBarrier — blocks entrance during movie
gate = make_part("GateBarrier", (-2, 3, -104), (12, 5, 1),
                 color=(40, 40, 45), transparency=0.95, material="Glass",
                 can_collide=False)
cinema.append(gate)

# PopcornStand — with ProximityPrompt for popcorn
popcorn = make_part("PopcornStand", (29, 1.5, -155), (3, 4, 3),
                    color=(180, 60, 30), transparency=0.95, material="SmoothPlastic")
add_proximity_prompt(popcorn, "خذ فشار", "بسطة الفشار", hold=0.3, dist=8,
                     name="PopcornPrompt")
cinema.append(popcorn)

# Floor — reference for groundY calculation
floor = make_part("Floor", (-5, 0.45, -131), (70, 0.1, 55),
                  color=(50, 50, 55), transparency=1, can_collide=False)
cinema.append(floor)

# Marquee — exterior sign
marquee = make_part("Marquee", (-2, 20, -102), (22, 3, 1),
                    color=(200, 40, 50), transparency=0, material="Neon")
cinema.append(marquee)

# InfoBoard — exterior information panel
info_board = make_part("InfoBoard", (15, 8, -102.5), (5, 7, 0.4),
                       color=(25, 25, 30), transparency=0, material="SmoothPlastic")
cinema.append(info_board)

# ScreenWash lights (left and right of screen, aimed at it)
wash_l = make_part("ScreenWashL", (-33, 14, -155), (2, 0.3, 2),
                   color=(50, 50, 60), transparency=0, material="Metal")
add_spotlight(wash_l, brightness=3, range_val=25, angle=50, name="WashLight")
cinema.append(wash_l)

wash_r = make_part("ScreenWashR", (-9, 14, -155), (2, 0.3, 2),
                   color=(50, 50, 60), transparency=0, material="Metal")
add_spotlight(wash_r, brightness=3, range_val=25, angle=50, name="WashLight")
cinema.append(wash_r)

# AisleRunner — decorative floor strip for the aisle (visible indicator)
aisle = make_part("AisleRunner", (-21, 0.52, -130), (2, 0.05, 30),
                  color=(180, 50, 50), transparency=0, material="Neon",
                  can_collide=False)
cinema.append(aisle)

print("All functional anchors added.")

# ─── Step 6: Write ────────────────────────────────────────────────────
game_tree.write(GAME, encoding="utf-8", xml_declaration=False)
print(f"Done! Wrote {GAME}")
print("Next: update CinemaExterior.server.lua + CinemaSystem.server.lua, then run build_all.py")
