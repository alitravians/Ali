#!/usr/bin/env python3
"""Restyle the old Cinema building exterior to match the new facade design.

Colors/materials ONLY — no geometry moves, no renames, no deletions.
Palette (from CinemaFacade3D): slate walls 0x595466 (Slate), dark roof 0x2F2B3A,
gold trim 0xFFC633 (Metal).
Targets every Part inside Workspace/Cinema whose color is the old concrete
grey 0x9FA1AC (Color3uint8 == 4288651692):
  - roof slabs  (flat, y-pos > 13, footprint > 30 studs) -> dark roof
  - thin trim strips (height <= 0.6)                      -> gold
  - everything else (walls)                               -> slate
"""
from lxml import etree

F = "DonationCity_FINAL.rbxlx"
GREY = 4288651692
ALPHA = 0xFF000000

SLATE = ALPHA | 0x595466
ROOF = ALPHA | 0x2F2B3A
GOLD = ALPHA | 0xFFC633
MAT_SLATE = "816"
MAT_PLASTIC = "272"
MAT_METAL = "1088"

p = etree.XMLParser(strip_cdata=False, huge_tree=True)
t = etree.parse(F, p)
ws = [i for i in t.getroot().findall("./Item") if i.get("class") == "Workspace"][0]

def nm(it):
    n = it.find("./Properties/string[@name='Name']")
    return n.text if n is not None else "?"

cin = [i for i in ws.findall("./Item") if nm(i) == "Cinema"][0]

counts = {"roof": 0, "trim": 0, "wall": 0}
for c in cin.iter("Item"):
    if c.get("class") != "Part":
        continue
    pr = c.find("./Properties")
    col = pr.find("./Color3uint8[@name='Color3uint8']")
    if col is None or int(col.text) != GREY:
        continue
    cf = pr.find("./CoordinateFrame[@name='CFrame']")
    sz = pr.find("./Vector3[@name='size']")
    pos = [float(cf.find(a).text) for a in "XYZ"]
    s = [float(sz.find(a).text) for a in "XYZ"]
    mat = pr.find("./token[@name='Material']")
    if pos[1] > 13 and s[1] <= 1.0 and s[0] > 30 and s[2] > 30:
        col.text = str(ROOF); mat.text = MAT_PLASTIC; counts["roof"] += 1
    elif s[1] <= 0.6:
        col.text = str(GOLD); mat.text = MAT_METAL; counts["trim"] += 1
    else:
        col.text = str(SLATE); mat.text = MAT_SLATE; counts["wall"] += 1

print("recolored:", counts)
t.write(F, encoding="utf-8", xml_declaration=False)
print("saved", F)
