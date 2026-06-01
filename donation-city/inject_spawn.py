#!/usr/bin/env python3
# ROOT-CAUSE FIX for "player spawns on top of the fountain":
# The plaza landing pad at (0,1.3,60) was only a decorative *Part* named
# "SpawnLocation" (not an actual SpawnLocation instance), and the single real
# SpawnLocation in the game (in the parkour model) is Enabled=false. With NO
# enabled SpawnLocation anywhere, Roblox spawns characters at the world origin
# (0,0) -> which sits on the centre fountain. The fix: promote the landing pad
# into a real, ENABLED, neutral SpawnLocation so every join/respawn lands on the
# pad. Idempotent: re-running just re-asserts the spawn properties.
import sys
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
PAD_NAME = "SpawnLocation"

P = etree.XMLParser(strip_cdata=False, huge_tree=True)
tree = etree.parse(MAIN, P); root = tree.getroot()
ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")
def nm(it): return it.findtext("Properties/string[@name='Name']") or ""

pad = None
for it in ws.findall("Item"):
    if it.get("class") in ("Part", "SpawnLocation") and nm(it) == PAD_NAME:
        pad = it; break
if pad is None:
    sys.exit("ERROR: landing pad 'SpawnLocation' not found in Workspace")

# 1) promote Part -> SpawnLocation (no-op if already done)
print("before:", pad.get("class"))
pad.set("class", "SpawnLocation")

pr = pad.find("Properties")
def set_bool(name, val):
    el = pr.find(f"bool[@name='{name}']")
    if el is None:
        el = etree.SubElement(pr, "bool"); el.set("name", name)
    el.text = "true" if val else "false"
def set_int(name, val):
    el = pr.find(f"int[@name='{name}']")
    if el is None:
        el = etree.SubElement(pr, "int"); el.set("name", name)
    el.text = str(val)

# 2) spawn behaviour: enabled, team-neutral, no lingering forcefield, solid pad
set_bool("Enabled", True)
set_bool("Neutral", True)
set_bool("AllowTeamChangeOnTouch", False)
set_bool("CanCollide", True)
set_bool("Anchored", True)
set_int("Duration", 0)

# 3) make sure no OTHER SpawnLocation is enabled (keep the parkour one disabled)
others = 0
for it in root.iter("Item"):
    if it.get("class") == "SpawnLocation" and it is not pad:
        opr = it.find("Properties")
        en = opr.find("bool[@name='Enabled']") if opr is not None else None
        if en is None:
            en = etree.SubElement(opr, "bool"); en.set("name", "Enabled")
        en.text = "false"
        others += 1
print(f"kept {others} other SpawnLocation(s) disabled (e.g. parkour start)")

tree.write(MAIN, encoding="utf-8", xml_declaration=False)
print("after:", pad.get("class"), "-> enabled neutral spawn at pad (0,1.3,60)")
print("wrote", MAIN)
