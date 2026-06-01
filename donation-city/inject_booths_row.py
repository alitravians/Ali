#!/usr/bin/env python3
# Arrange the six static DonationBooth_<key> models into a single clean ROW on
# the WEST side (x = ROW_X), evenly spaced along Z, every booth FACING EAST
# (toward the centre fountain). Order north->south: Bronze, Silver, Gold,
# Emerald, Ruby, Diamond.
#
# Facing: the booths are authored FACING the plaza centre at their current
# positions. A booth that faces centre at angle phi_old will face centre at
# phi=180deg (i.e. due EAST, +X) after rotating the rigid model about its own
# centre by  a = phi_old - 180  (same convention as the old arc placer). We then
# translate the model centre to (ROW_X, z_i) WITHOUT touching rotation, so all
# six end up parallel, facing east, in a tidy row.
#
# Idempotent: if the booths are already row-placed (centre x ~ ROW_X) we apply
# a = 0 and only re-translate to the canonical slots, so re-runs are stable.
import math, copy
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
ROW_X = -50.0                                   # west row line
SPACING = 16.0                                  # gap between booth centres (~4-stud gap; no crowding)
ORDER = ["Bronze", "Silver", "Gold", "Emerald", "Ruby", "Diamond"]   # north -> south
BP = {"Part","MeshPart","UnionOperation","WedgePart","TrussPart","Seat","CornerWedgePart"}

# centred symmetric Z slots: 6 booths, spacing 16 -> z in [-40 .. +40]
N = len(ORDER)
ZS = [(i - (N - 1) / 2.0) * SPACING for i in range(N)]   # [-40,-24,-8,8,24,40]

P = etree.XMLParser(strip_cdata=False, huge_tree=True)
def fget(cf, t, d=0.0):
    v = cf.findtext(t); return float(v) if v not in (None, "") else d

tree = etree.parse(MAIN, P); root = tree.getroot()
ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")

# collect the six booth models (may be nested under folders)
booths = {}
for it in ws.iter("Item"):
    if it.get("class") != "Model": continue
    pr = it.find("Properties")
    nm = pr.findtext('string[@name="Name"]') if pr is not None else None
    if nm and nm.startswith("DonationBooth_"):
        booths[nm.split("_", 1)[1]] = it
assert len(booths) == 6, f"expected 6 booths, found {sorted(booths)}"

def centre_of(parts):
    xs = []; zs = []
    for it in parts:
        cf = it.find("Properties/CoordinateFrame[@name='CFrame']")
        if cf is None: continue
        xs.append(fget(cf, "X")); zs.append(fget(cf, "Z"))
    return (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2

# detect prior row placement (all booth centres already near ROW_X) -> idempotent
already_row = True
for key in ORDER:
    parts = [it for it in booths[key].iter("Item") if it.get("class") in BP]
    cx0, _ = centre_of(parts)
    if abs(cx0 - ROW_X) > 3.0:
        already_row = False; break
print(f"already_row={already_row} (idempotent re-run)" if already_row else "first row placement")

for key, z1 in zip(ORDER, ZS):
    m = booths[key]
    parts = [it for it in m.iter("Item") if it.get("class") in BP]
    cx0, cz0 = centre_of(parts)
    if already_row:
        a = 0.0                                  # already facing east; only re-translate
    else:
        phi_old = math.degrees(math.atan2(cz0, cx0))
        a = math.radians(phi_old - 180.0)        # face centre-from-west == face EAST (+X)
    ca, sa = math.cos(a), math.sin(a)
    cx1, cz1 = ROW_X, z1
    for it in parts:
        pr = it.find("Properties"); cf = pr.find("CoordinateFrame[@name='CFrame']")
        if cf is None: continue
        x, y, z = fget(cf, "X"), fget(cf, "Y"), fget(cf, "Z")
        lx, lz = x - cx0, z - cz0
        nx = lx * ca + lz * sa; nz = -lx * sa + lz * ca   # rotate position about Y
        cf.find("X").text = f"{nx + cx1:.5f}"
        cf.find("Z").text = f"{nz + cz1:.5f}"
        # compose new rotation matrix  Ry(a) * R
        R = {k: fget(cf, k) for k in ("R00","R01","R02","R10","R11","R12","R20","R21","R22")}
        new = {
            "R00": ca*R["R00"]+sa*R["R20"], "R01": ca*R["R01"]+sa*R["R21"], "R02": ca*R["R02"]+sa*R["R22"],
            "R10": R["R10"],                "R11": R["R11"],                "R12": R["R12"],
            "R20": -sa*R["R00"]+ca*R["R20"],"R21": -sa*R["R01"]+ca*R["R21"],"R22": -sa*R["R02"]+ca*R["R22"],
        }
        for k, v in new.items():
            el = cf.find(k)
            if el is None:
                el = etree.SubElement(cf, k)
            el.text = f"{v:.6f}"
    print(f"{key:8} centre ({cx0:7.1f},{cz0:7.1f}) -> ({cx1:6.1f},{cz1:6.1f})  rot {math.degrees(a):7.1f}")

tree.write(MAIN, encoding="utf-8", xml_declaration=False)
print("wrote", MAIN)
