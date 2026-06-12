#!/usr/bin/env python3
# Moves the 3D construction props out of the unfinished-building skeleton
# (BEACH_/GAMEHALL_CONSTRUCTION occupy x 101.6..178.4): crane goes east of the
# building, the rest onto the street strip west of it. Pure x-translation of
# every part in each prop model, applied to both zone folders in-place.
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
DX = {"Crane": 38.0, "Scaffold1": -13.9, "Scaffold2": -13.9, "Mixer": -19.0,
      "DirtPile": -23.0, "ConstructionSign": -8.0, "Barrier0": -8.0,
      "Barrier1": -8.0, "Barrier2": -8.0, "Cone0": -8.0, "Cone1": -8.0,
      "Cone2": -8.0, "Cone3": -8.0}

parser = etree.XMLParser(strip_cdata=False, huge_tree=True)
tree = etree.parse(MAIN, parser)
ws = [i for i in tree.getroot().findall("./Item") if i.get("class") == "Workspace"][0]

def pname(it):
    n = it.find("./Properties/string[@name='Name']")
    return n.text if n is not None else "?"

moved = 0
for folder in ws.findall("./Item"):
    if pname(folder) not in ("BeachConstructionProps3D", "GamehallConstructionProps3D"):
        continue
    for model in folder.findall("./Item"):
        dx = DX.get(pname(model))
        if dx is None:
            continue
        for cf in model.iter("CoordinateFrame"):
            if cf.get("name") != "CFrame":
                continue
            x = cf.find("X")
            x.text = repr(float(x.text) + dx)
        moved += 1
print(f"moved {moved} prop models")
tree.write(MAIN, encoding="utf-8", xml_declaration=True)
