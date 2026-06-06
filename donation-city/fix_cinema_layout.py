#!/usr/bin/env python3
"""Fix cinema geometry: screen/projector → +X wall (where seats face),
remove TicketBooth visual clutter, reposition washlights."""
from lxml import etree
import sys, copy

FILE = "DonationCity_FINAL.rbxlx"
P = etree.XMLParser(strip_cdata=False, huge_tree=True)
tree = etree.parse(FILE, P)
root = tree.getroot()

def name_of(it):
    return it.findtext("Properties/string[@name='Name']") or ""

def set_cframe(item, x, y, z, r00=1,r01=0,r02=0,r10=0,r11=1,r12=0,r20=0,r21=0,r22=1):
    cf = item.find("Properties/CoordinateFrame[@name='CFrame']")
    if cf is None:
        props = item.find("Properties")
        cf = etree.SubElement(props, "CoordinateFrame")
        cf.set("name", "CFrame")
    vals = {"X":x,"Y":y,"Z":z,"R00":r00,"R01":r01,"R02":r02,"R10":r10,"R11":r11,"R12":r12,"R20":r20,"R21":r21,"R22":r22}
    for tag, val in vals.items():
        el = cf.find(tag)
        if el is None:
            el = etree.SubElement(cf, tag)
        el.text = str(val)

def set_size(item, x, y, z):
    s = item.find("Properties/Vector3[@name='size']")
    if s is None:
        props = item.find("Properties")
        s = etree.SubElement(props, "Vector3")
        s.set("name", "size")
    for tag, val in [("X",x),("Y",y),("Z",z)]:
        el = s.find(tag)
        if el is None:
            el = etree.SubElement(s, tag)
        el.text = str(val)

ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")
cinema = None
for c in ws.findall("Item"):
    if c.get("class") == "Model" and name_of(c) == "Cinema":
        cinema = c
        break
assert cinema is not None, "Cinema model not found"

# ──────────────────────────────────────────────────────────────────────────────
# 1. Reposition screen, screenframe, screenwall to +X wall
#    Rotation R_y(-90°): R00=0,R01=0,R02=-1, R10=0,R11=1,R12=0, R20=1,R21=0,R22=0
#    This makes the Back face (+Z local) point to world -X (toward audience)
# ──────────────────────────────────────────────────────────────────────────────
RY = dict(r00=0, r01=0, r02=-1, r10=0, r11=1, r12=0, r20=1, r21=0, r22=0)
SEAT_CENTER_Z = -151.8

for it in cinema.iter("Item"):
    nm = name_of(it)
    if nm == "Screen":
        set_cframe(it, 27.0, 8.0, SEAT_CENTER_Z, **RY)
        set_size(it, 24, 14, 0.5)
        print("Screen → +X wall (27, 8, -151.8)")
    elif nm == "ScreenFrame":
        set_cframe(it, 27.3, 8.0, SEAT_CENTER_Z, **RY)
        set_size(it, 28, 18, 0.4)
        print("ScreenFrame → (27.3, 8, -151.8)")
    elif nm == "ScreenWall":
        set_cframe(it, 27.6, 8.0, SEAT_CENTER_Z, **RY)
        set_size(it, 32, 20, 0.3)
        print("ScreenWall → (27.6, 8, -151.8)")
    elif nm == "Projector":
        # Place at decorative projector location (behind back row, facing +X)
        set_cframe(it, -18, 10, -152, **RY)
        set_size(it, 3, 3, 3)
        # Update MaxActivationDistance on its ProximityPrompt
        for pp in it.iter("Item"):
            if pp.get("class") == "ProximityPrompt":
                for el in pp.find("Properties"):
                    if el.get("name") == "MaxActivationDistance":
                        el.text = "20"
                        print("  Projector MaxActivationDistance → 20")
        print("Projector → (-18, 10, -152) at decorative projector")
    elif nm == "ScreenWashL":
        # Above audience side, spotlight aims +X (toward screen)
        set_cframe(it, 20, 14, -145, **RY)
        print("ScreenWashL → (20, 14, -145)")
    elif nm == "ScreenWashR":
        set_cframe(it, 20, 14, -158, **RY)
        print("ScreenWashR → (20, 14, -158)")

# ──────────────────────────────────────────────────────────────────────────────
# 2. Strip TicketBooth of all visual parts (keep empty model container)
# ──────────────────────────────────────────────────────────────────────────────
tb = None
for c in ws.findall("Item"):
    if c.get("class") == "Model" and name_of(c) == "TicketBooth":
        tb = c
        break

if tb is not None:
    # Remove all Item children (visual parts/models), keep Properties
    children_to_remove = [c for c in tb.findall("Item")]
    for c in children_to_remove:
        tb.remove(c)
    print(f"TicketBooth: stripped {len(children_to_remove)} visual children")
else:
    print("WARNING: TicketBooth not found in Workspace")

# ──────────────────────────────────────────────────────────────────────────────
# 3. Write result
# ──────────────────────────────────────────────────────────────────────────────
tree.write(FILE, xml_declaration=True, encoding="utf-8")
print(f"Written: {FILE}")

# ──────────────────────────────────────────────────────────────────────────────
# 4. Add a clean modern ticket counter inside the (now-empty) TicketBooth model
#    Cashier sits at (-8, GY, -104) facing +Z; counter goes in front (+Z side).
# ──────────────────────────────────────────────────────────────────────────────
_refc = [21000]
def nref():
    _refc[0] += 1
    return "RBX" + str(_refc[0])

def make_part(name, pos, size, color, material="SmoothPlastic", transparency=0,
              can_collide=True):
    item = etree.Element("Item")
    item.set("class", "Part")
    item.set("referent", nref())
    props = etree.SubElement(item, "Properties")
    el = etree.SubElement(props, "string"); el.set("name", "Name"); el.text = name
    cf = etree.SubElement(props, "CoordinateFrame"); cf.set("name", "CFrame")
    for tag, val in [("X",pos[0]),("Y",pos[1]),("Z",pos[2]),
                     ("R00",1),("R01",0),("R02",0),("R10",0),("R11",1),("R12",0),
                     ("R20",0),("R21",0),("R22",1)]:
        e = etree.SubElement(cf, tag); e.text = str(val)
    sz = etree.SubElement(props, "Vector3"); sz.set("name", "size")
    for tag, val in [("X",size[0]),("Y",size[1]),("Z",size[2])]:
        e = etree.SubElement(sz, tag); e.text = str(val)
    el = etree.SubElement(props, "bool"); el.set("name", "Anchored"); el.text = "true"
    el = etree.SubElement(props, "bool"); el.set("name", "CanCollide"); el.text = "true" if can_collide else "false"
    el = etree.SubElement(props, "float"); el.set("name", "Transparency"); el.text = str(transparency)
    el = etree.SubElement(props, "Color3uint8"); el.set("name", "Color3uint8")
    el.text = str((color[0] << 16) | (color[1] << 8) | color[2])
    mat_map = {"SmoothPlastic":"256","Neon":"288","Metal":"1088","Glass":"1568","Wood":"512"}
    el = etree.SubElement(props, "token"); el.set("name", "Material"); el.text = mat_map.get(material,"256")
    for surf in ("TopSurface","BottomSurface"):
        el = etree.SubElement(props, "token"); el.set("name", surf); el.text = "0"
    return item

# NOTE: we intentionally do NOT add our own counter parts here. The Cinema
# building already ships a built-in ticket-booth alcove on the front-left
# (left wall X≈-23, interior counter rail X≈-14, front glass ticket window).
# The cashier NPC is seated INSIDE that alcove by CinemaServices.server.lua
# (target (-18.5, GY, -108), facing +X toward the rail/players), so adding a
# second counter would clutter the entrance. Keeping TicketBooth empty avoids
# the overlap the user reported. (make_part is kept above for reference/reuse.)
_ = make_part  # silence "unused" without changing behavior

print("TicketBooth: left empty — using building's built-in alcove for the booth")
