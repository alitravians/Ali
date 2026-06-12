#!/usr/bin/env python3
# Reshapes CinemaFacade3D so it decorates the OLD Cinema building's real front
# instead of standing as a solid block that walls off the entrance.
#
# The old Cinema (kept — CinemaSystem/CinemaClient scripts depend on its
# projector, screen and seats) has its front wall at z=-90.7 and a recessed
# lobby whose FrontDoors sit at z=-100.5 spanning x -11..11. The facade is
# rebuilt as: an overhead header band across the full front, an entrance arch
# ABOVE the door opening, marquee + letters + bulbs on that arch, columns and
# posters flanking the doorway, and a red carpet leading from the plaza into
# the open doorway. Nothing collidable is left inside the x -11..11 corridor
# below y=9.
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
WALL_Z = -90.7          # old building front face
CIN_W, CIN_CX = 75.5, 5.85

parser = etree.XMLParser(strip_cdata=False, huge_tree=True)
tree = etree.parse(MAIN, parser)
ws = [i for i in tree.getroot().findall("./Item") if i.get("class") == "Workspace"][0]

def pname(it):
    n = it.find("./Properties/string[@name='Name']")
    return n.text if n is not None else "?"

def setgeo(p, pos=None, size=None):
    pr = p.find("./Properties")
    cf = pr.find("./CoordinateFrame[@name='CFrame']")
    sz = pr.find("./Vector3[@name='size']")
    if pos:
        for a, v in zip("XYZ", pos):
            if v is not None:
                cf.find(a).text = repr(float(v))
    if size:
        for a, v in zip("XYZ", size):
            if v is not None:
                sz.find(a).text = repr(float(v))

fac = next(i for i in ws.findall("./Item") if pname(i) == "CinemaFacade3D")
parts = {pname(p): p for p in fac.findall("./Item")}

# everything that used to sit mid-plaza moves back against the wall
DZ = WALL_Z + 4.0 - (-61.8)   # marquee assembly: old z -61.8 -> wall + 4.0

# 1) header band across the whole front, above door height (doors top y=7.2)
setgeo(parts["Main_Building"], pos=(CIN_CX, 17.0, WALL_Z + 1.7), size=(CIN_W, 14.0, 3.4))
# 2) entrance arch header above the real doorway (x -11..11)
setgeo(parts["Entrance_Block"], pos=(0.0, 11.5, WALL_Z + 3.0), size=(30.0, 6.5, 6.0))

# 3) marquee assembly + letters + bulbs: recentre on x=0, translate to wall
for nm, p in parts.items():
    if nm.startswith(("Marquee_", "Letter", "Bulb")):
        pr = p.find("./Properties")
        cf = pr.find("./CoordinateFrame[@name='CFrame']")
        x = float(cf.find("X").text) - 5.8           # recentre 5.8 -> 0
        z = float(cf.find("Z").text) + DZ
        setgeo(p, pos=(x, None, z))

# 4) vertical CINEMA sign: flat against the wall, right of the doorway
setgeo(parts["VSign"], pos=(26.0, 16.3, WALL_Z + 0.7))

# 5) gold columns flanking the doorway (outside the x -11..11 corridor)
for side, cx in (("L", 13.5), ("R", -13.5)):
    setgeo(parts[f"Column_{side}"], pos=(cx, 7.1, WALL_Z + 2.0))
    setgeo(parts[f"Column_{side}_Base"], pos=(cx, 0.8, WALL_Z + 2.0))
    setgeo(parts[f"Column_{side}_Cap"], pos=(cx, 13.6, WALL_Z + 2.0))

# 6) drop the decorative glass doors — the building has its own real doors
for nm in list(parts):
    if nm.startswith(("Door", "DoorFrame")):
        fac.remove(parts.pop(nm))

# 7) posters flat on the wall either side of the entrance
setgeo(parts["Poster_A"], pos=(20.0, 8.0, WALL_Z + 0.4))
setgeo(parts["Poster_A_Frame"], pos=(20.0, 8.0, WALL_Z + 0.3))
setgeo(parts["Poster_B"], pos=(-20.0, 8.0, WALL_Z + 0.4))
setgeo(parts["Poster_B_Frame"], pos=(-20.0, 8.0, WALL_Z + 0.3))

# 8) ticket window against the wall, left of the doorway
setgeo(parts["TicketWindow"], pos=(-19.5, 4.8, WALL_Z + 0.9))
setgeo(parts["TicketWindow_Glass"], pos=(-19.5, 5.2, WALL_Z + 1.2))

# 9) red carpet: plaza edge (z=-54, clear of the Aquarium) into the doorway
CAR_NEAR, CAR_FAR = -54.0, -90.0
setgeo(parts["Carpet"], pos=(0.0, 0.3, (CAR_NEAR + CAR_FAR) / 2),
       size=(13.8, None, abs(CAR_FAR - CAR_NEAR)))
# rope posts along the carpet edges
for i, z in enumerate((-58.0, -69.0, -80.0)):
    for side, px in (("L", 8.5), ("R", -8.5)):
        post, ball = parts.get(f"Post_{side}{i}"), parts.get(f"PostBall_{side}{i}")
        if post is None:
            continue
        setgeo(post, pos=(px, 1.8, z))
        setgeo(ball, pos=(px, 3.5, z))

# 10) searchlights: bases at the building corners, beams above the roof line
for side, sx in (("L", 38.0), ("R", -27.0)):
    setgeo(parts[f"Searchlight_Base_{side}"], pos=(sx, 1.3, WALL_Z + 4.0))
    setgeo(parts[f"Searchlight_Beam_{side}"], pos=(sx, 32.0, WALL_Z + 3.0))

tree.write(MAIN, encoding="utf-8", xml_declaration=True)
print("facade reshaped onto the old building front; entrance corridor clear")
