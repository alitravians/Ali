#!/usr/bin/env python3
"""
inject_cinema_new.py — Replace the Cinema building with the new modern model.

Steps:
1. Remove all old Cinema model children (old building shell + old seats)
2. Inject transformed geometry from cinema_modern.rbxmx
3. Organize seats into "Seats" model, lights into "CeilingLights"
4. Add functional anchor Parts (Screen, Projector, GateBarrier, etc.)
   that CinemaSystem.server.lua references by name.

Transform: Rotate -90° about Y (glass entrance faces +Z toward plaza), then
translate. Result: entrance at Z≈-100, screen at Z≈-166, width X≈[-28,+27]
"""
import copy
from lxml import etree

GAME = "DonationCity_FINAL.rbxlx"
MODEL = "cinema_modern.rbxmx"

# Model center (rotation pivot) in model-space coords
CX, CZ = -199.6, -83.8
# Translation applied AFTER rotation
DY = -9.9

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


def _rotate_translate_cf(cf):
    """Rotate -90° about Y around model center, then translate.

    Position transform (model→world):
        finalX = -(Z - CZ) + CX + 199.6 = -Z - 83.8   (simplifies: DX cancels CX)
        finalY = Y + DY
        finalZ = (X - CX) + CZ + (-47) = X + 68.8
    Rotation matrix: R_y(-90°) * oldR
        new_R00=-old_R20, new_R01=-old_R21, new_R02=-old_R22
        new_R10= old_R10, new_R11= old_R11, new_R12= old_R12
        new_R20= old_R00, new_R21= old_R01, new_R22= old_R02
    """
    if cf is None:
        return
    xel = cf.find("X"); yel = cf.find("Y"); zel = cf.find("Z")
    if xel is None or yel is None or zel is None:
        return
    ox = float(xel.text); oy = float(yel.text); oz = float(zel.text)
    # Position
    xel.text = str(-oz - 83.8)
    yel.text = str(oy + DY)
    zel.text = str(ox + 68.8)
    # Rotation matrix (if present)
    r00 = cf.find("R00"); r01 = cf.find("R01"); r02 = cf.find("R02")
    r10 = cf.find("R10"); r11 = cf.find("R11"); r12 = cf.find("R12")
    r20 = cf.find("R20"); r21 = cf.find("R21"); r22 = cf.find("R22")
    if r00 is None:  # no rotation components (e.g. WorldPivotData position-only)
        return
    # Read old values
    o00=float(r00.text); o01=float(r01.text); o02=float(r02.text)
    o10=float(r10.text); o11=float(r11.text); o12=float(r12.text)
    o20=float(r20.text); o21=float(r21.text); o22=float(r22.text)
    # Apply R_y(-90°) * old
    r00.text=str(-o20); r01.text=str(-o21); r02.text=str(-o22)
    r10.text=str(o10);  r11.text=str(o11);  r12.text=str(o12)
    r20.text=str(o00);  r21.text=str(o01);  r22.text=str(o02)


def _rotate_translate_pivot(cf):
    """Same transform for WorldPivotData: rotates the position, and also the
    rotation matrix when one is present (identical to _rotate_translate_cf)."""
    if cf is None:
        return
    xel = cf.find("X"); yel = cf.find("Y"); zel = cf.find("Z")
    if xel is None or yel is None or zel is None:
        return
    ox = float(xel.text); oy = float(yel.text); oz = float(zel.text)
    xel.text = str(-oz - 83.8)
    yel.text = str(oy + DY)
    zel.text = str(ox + 68.8)
    # Rotation matrix in WorldPivotData CFrame (if present)
    r00 = cf.find("R00")
    if r00 is None:
        return
    r01=cf.find("R01");r02=cf.find("R02")
    r10=cf.find("R10");r11=cf.find("R11");r12=cf.find("R12")
    r20=cf.find("R20");r21=cf.find("R21");r22=cf.find("R22")
    o00=float(r00.text);o01=float(r01.text);o02=float(r02.text)
    o10=float(r10.text);o11=float(r11.text);o12=float(r12.text)
    o20=float(r20.text);o21=float(r21.text);o22=float(r22.text)
    r00.text=str(-o20);r01.text=str(-o21);r02.text=str(-o22)
    r10.text=str(o10); r11.text=str(o11); r12.text=str(o12)
    r20.text=str(o00); r21.text=str(o01); r22.text=str(o02)


def transform_cframes(item):
    """Rotate -90° about Y + translate all CFrame positions in item tree.

    Handles both part CFrames and Model WorldPivotData.
    """
    for it in item.iter("Item"):
        _rotate_translate_cf(it.find("Properties/CoordinateFrame[@name='CFrame']"))
        _rotate_translate_pivot(
            it.find("Properties/OptionalCoordinateFrame[@name='WorldPivotData']/CFrame")
        )


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
              can_collide=True, anchored=True, rot=None):
    """Create a Part Item element with Properties.

    rot: optional 9-tuple (R00..R22) rotation matrix; defaults to identity.
    Use rot=ROT_Y_NEG90 for parts whose Back (+Z) face must point world -X
    (e.g. the cinema Screen mounted on the +X wall, facing the audience).
    """
    if rot is None:
        rot = (1, 0, 0, 0, 1, 0, 0, 0, 1)
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
                     ("R00", rot[0]), ("R01", rot[1]), ("R02", rot[2]),
                     ("R10", rot[3]), ("R11", rot[4]), ("R12", rot[5]),
                     ("R20", rot[6]), ("R21", rot[7]), ("R22", rot[8])]:
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
    el.text = "5"  # Front face (NormalId.Front, -Z direction)


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

# ─── Step 4b: Make entrance door parts passable ───────────────────────
# The model's door parts block player entry. Players must be able to walk through
# the front entrance. Coords are already world-space (transform ran in Step 2), so
# the entrance face is at Z≈-100. Make passable only:
#   (a) parts inside the door sub-models (Door / DoubleDoors / FrontDoors), and
#   (b) transparent glass on the FRONT entrance face (Z >= -108),
# so interior/back/side glass walls stay solid (no clipping into the building).
# The GateBarrier (added below) handles blocking during movies.
def _cframe_z(el):
    cf = el.find("Properties/CoordinateFrame[@name='CFrame']")
    if cf is None:
        return None
    z = cf.find("Z")
    return float(z.text) if z is not None and z.text else None

passable = 0
for it in cinema.iter("Item"):
    if it.get("class") not in BP_CLASSES:
        continue
    props = it.find("Properties")
    if props is None:
        continue
    in_door = False
    p = it.getparent()
    while p is not None and p.tag == "Item":
        if name_of(p) in ("Door", "DoubleDoors", "FrontDoors"):
            in_door = True
            break
        p = p.getparent()
    trans = props.findtext("float[@name='Transparency']")
    try:
        tr = float(trans) if trans else 0
    except ValueError:
        tr = 0
    z = _cframe_z(it)
    front_glass = (tr > 0.2 and z is not None and z >= -108)
    if in_door or front_glass:
        cc = props.find("bool[@name='CanCollide']")
        if cc is None:
            cc = etree.SubElement(props, "bool")
            cc.set("name", "CanCollide")
        cc.text = "false"
        passable += 1
print(f"Set CanCollide=false on {passable} door/front-glass parts (entrance passable)")

# ─── Step 5: Add functional anchor Parts ──────────────────────────────
# Positions are for the ROTATED building: entrance at Z≈-100 facing +Z,
# screen at Z≈-166, width X≈[-28,+27].
print("Adding functional anchor Parts...")

# Rotation so a part's Back (+Z) face points world -X (toward the audience).
# The model's 37 seats face +X (LookVector≈+X) toward the +X wall (X≈27.5),
# so the Screen/Projector live on the X axis — NOT the -Z wall.
ROT_Y_NEG90 = (0, 0, -1, 0, 1, 0, 1, 0, 0)
SEAT_CENTER_Z = -151.8

# Screen — projection surface (SurfaceGui added at runtime by CinemaSystem).
# Mounted flush on the +X wall, display facing -X toward the seated audience.
screen = make_part("Screen", (27.0, 8, SEAT_CENTER_Z), (24, 14, 0.5),
                   color=(10, 10, 12), transparency=0, material="SmoothPlastic",
                   rot=ROT_Y_NEG90)
cinema.append(screen)

# ScreenFrame — decorative frame around screen
screen_frame = make_part("ScreenFrame", (27.3, 8, SEAT_CENTER_Z), (28, 18, 0.4),
                         color=(20, 20, 22), transparency=0, material="Metal",
                         rot=ROT_Y_NEG90)
cinema.append(screen_frame)

# ScreenWall — wall behind screen
screen_wall = make_part("ScreenWall", (27.6, 8, SEAT_CENTER_Z), (32, 20, 0.3),
                        color=(35, 35, 38), transparency=0, material="Concrete",
                        rot=ROT_Y_NEG90)
cinema.append(screen_wall)

# Projector — behind the back row on the -X wall, aimed +X at the screen, with
# its ProximityPrompt co-located with the model's decorative projector so the
# "E" prompt appears on the visible projector. Step 2b renamed the decorative
# model → "ProjectorDecor", so there is no name collision.
projector = make_part("Projector", (-18, 10, -152), (3, 3, 3),
                      color=(30, 30, 35), transparency=0, material="Metal",
                      rot=ROT_Y_NEG90)
add_proximity_prompt(projector, "شغّل العرض", "البروجكتر", hold=0.6, dist=20,
                     name="PlayMoviePrompt")  # match WorldBuilder's prompt name
cinema.insert(1, projector)

# GateBarrier — blocks entrance during movie (at glass-door opening, Z≈-100)
gate = make_part("GateBarrier", (0, 3, -100), (20, 6, 1),
                 color=(40, 40, 45), transparency=0.95, material="Glass",
                 can_collide=False)
cinema.append(gate)

# PopcornStand — lobby area with ProximityPrompt for popcorn
popcorn = make_part("PopcornStand", (15, 1.5, -108), (3, 4, 3),
                    color=(180, 60, 30), transparency=0.95, material="SmoothPlastic")
add_proximity_prompt(popcorn, "خذ فشار", "بسطة الفشار", hold=0.3, dist=8,
                     name="PopcornPrompt")
cinema.append(popcorn)

# Floor — reference for groundY calculation
floor = make_part("Floor", (0, 0.45, -133), (55, 0.1, 66),
                  color=(50, 50, 55), transparency=1, can_collide=False)
cinema.append(floor)

# Marquee — exterior sign above entrance (red neon), below the FINEST letters
# Placed at Y=12.5 (above doors, below the model's vertical sign letters at Y15+)
# Z=-96.5 sits in front of facade so text is visible from the plaza.
marquee = make_part("Marquee", (0, 12.5, -96.5), (22, 3.2, 0.6),
                    color=(200, 40, 50), transparency=0, material="Neon")
cinema.append(marquee)

# InfoBoard — exterior information panel (left of entrance, grounded)
# At Y=4 the board's bottom sits at ~Y0.5 (ground level), so it doesn't float.
# Z=-97 places it just in front of the facade (facade ~Z-100.6) beside the
# entrance, facing the plaza (+Z) where approaching players naturally see it.
info_board = make_part("InfoBoard", (-14, 4, -97), (5, 7, 0.4),
                       color=(25, 25, 30), transparency=0, material="SmoothPlastic")
cinema.append(info_board)

# ScreenWash lights (above each side of the +X screen, spotlights aimed +X)
wash_l = make_part("ScreenWashL", (20, 14, -145), (2, 0.3, 2),
                   color=(50, 50, 60), transparency=0, material="Metal",
                   rot=ROT_Y_NEG90)
add_spotlight(wash_l, brightness=3, range_val=25, angle=50, name="WashLight")
cinema.append(wash_l)

wash_r = make_part("ScreenWashR", (20, 14, -158), (2, 0.3, 2),
                   color=(50, 50, 60), transparency=0, material="Metal",
                   rot=ROT_Y_NEG90)
add_spotlight(wash_r, brightness=3, range_val=25, angle=50, name="WashLight")
cinema.append(wash_r)

# AisleRunner — decorative floor strip for the aisle (visible indicator)
aisle = make_part("AisleRunner", (0, 0.52, -133), (2, 0.05, 60),
                  color=(180, 50, 50), transparency=0, material="Neon",
                  can_collide=False)
cinema.append(aisle)

print("All functional anchors added.")

# ─── Step 5c: Empty the standalone TicketBooth model entirely ─────────
# The Cinema building already ships a built-in ticket-booth alcove on the
# front-left (left wall X≈-23, interior counter rail X≈-14, front glass window).
# The cashier NPC is seated INSIDE that alcove by CinemaServices.server.lua
# (target (-18.5, GY, -108), facing +X toward the rail/players). The separate
# "TicketBooth" model — including its bright-yellow "TICKETS" neon letters and
# any counter geometry — overlapped the entrance and looked cluttered, so we
# strip it to an empty container. (This folds in what fix_cinema_layout.py did,
# making this script the single canonical builder — re-running it reproduces the
# shipped state without needing the legacy patch.)
tb = None
for c in ws.findall("Item"):
    if c.get("class") == "Model" and name_of(c) == "TicketBooth":
        tb = c
        break
if tb is not None:
    children_to_remove = list(tb.findall("Item"))
    for c in children_to_remove:
        tb.remove(c)
    print(f"TicketBooth: stripped {len(children_to_remove)} visual child item(s) "
          f"— using building's built-in alcove for the booth")
else:
    print("WARNING: TicketBooth model not found in Workspace")

# ─── Step 5d: (intentionally no static Marquee SurfaceGui) ────────────
# The red Marquee text "سينما مدينة التبرعات" is created at RUNTIME by
# CinemaSystem.server.lua (makeSurface → SurfaceGui "Display" on the Back/+Z
# face, white TextLabel). We deliberately do NOT bake a second static
# SurfaceGui here: two transparent labels on the same face overlap, and during
# movie playback the runtime label switches to "العرض جارٍ الآن" while a static
# label would keep showing the cinema name — rendering both texts on top of each
# other (unreadable). The runtime script is the single source of the marquee text.
print("Marquee text is handled at runtime by CinemaSystem (no static SurfaceGui baked)")

# ─── Step 5b: Merge missing SharedString definitions ──────────────────
# Injected parts (MeshParts/Unions) reference SharedStrings (PhysicalConfigData,
# mesh/physics blobs) by md5. The definitions live in the model file's
# <SharedStrings> block — they MUST be copied into the game file too, otherwise
# Studio refuses to open with "Unknown referenced shared string md5 ...".
model_ss = model_root.find("SharedStrings")
model_defs = {}
if model_ss is not None:
    for s in model_ss.findall("SharedString"):
        model_defs[s.get("md5")] = s

game_ss = game_root.find("SharedStrings")
if game_ss is None:
    game_ss = etree.SubElement(game_root, "SharedStrings")
game_def_md5 = {s.get("md5") for s in game_ss.findall("SharedString")}

# Collect md5 refs used inside the injected Cinema subtree
needed = set()
for s in cinema.iter("SharedString"):
    if s.get("md5") is None and s.text:  # a reference (has name=, not md5=)
        needed.add(s.text.strip())

added_ss = 0
for md5 in sorted(needed):
    if md5 in game_def_md5:
        continue
    src = model_defs.get(md5)
    if src is None:
        raise SystemExit(
            f"ERROR: SharedString md5 {md5} is referenced by an injected part but "
            f"has no definition in {MODEL}; cannot resolve orphan reference."
        )
    game_ss.append(copy.deepcopy(src))
    game_def_md5.add(md5)
    added_ss += 1
print(f"Merged {added_ss} missing SharedString definition(s) into game file")

# Verify no orphan references remain anywhere in the game file
all_defs = {s.get("md5") for s in game_ss.findall("SharedString")}
orphans = {s.text.strip() for s in game_root.iter("SharedString")
           if s.get("md5") is None and s.text and s.text.strip() not in all_defs}
if orphans:
    raise SystemExit(f"ERROR: {len(orphans)} orphan SharedString ref(s) remain: "
                     f"{sorted(orphans)[:5]}")
print("SharedString integrity OK — 0 orphan references")

# ─── Step 6: Write ────────────────────────────────────────────────────
# نكتب إعلان XML للحفاظ على نفس رأس الملف الأصلي (build_all.py يحافظ عليه نصياً)
game_tree.write(GAME, encoding="UTF-8", xml_declaration=True)
print(f"Done! Wrote {GAME}")
print("Next: update CinemaExterior.server.lua + CinemaSystem.server.lua, then run build_all.py")
