#!/usr/bin/env python3
# One-time injector: adds a new <Item class="Script"> named "BeachArea" into the
# rbxlx, as a sibling right after the CinemaExterior script Item. The script body
# is read from src/BeachArea.server.lua. Idempotent: skips if already present.
import sys

RBXLX = "DonationCity_FINAL.rbxlx"
SRC = "src/BeachArea.server.lua"

with open(RBXLX, "r", encoding="utf-8") as f:
    d = f.read()
with open(SRC, "r", encoding="utf-8") as f:
    src = f.read()

if "]]>" in src:
    sys.exit("ERROR: source contains ]]> which breaks CDATA")

if 'referent="BeachAreaRef"' in d:
    print("BeachArea already injected — nothing to do.")
    sys.exit(0)

# Locate end of the CinemaExterior script Item
ref = d.find('referent="CinemaExteriorRef"')
if ref == -1:
    sys.exit("ERROR: CinemaExterior Item not found")
marker = d.find("CINEMA EXTERIOR", ref)
if marker == -1:
    sys.exit("ERROR: CINEMA EXTERIOR marker not found after referent")
cdata_end = d.find("]]>", marker)
if cdata_end == -1:
    sys.exit("ERROR: CDATA end not found after CINEMA EXTERIOR marker")
item_end = d.find("</Item>", cdata_end)
if item_end == -1:
    sys.exit("ERROR: could not find </Item> for CinemaExterior")
insert_at = item_end + len("</Item>")

new_item = (
    '\n    <Item class="Script" referent="BeachAreaRef">\n'
    "      <Properties>\n"
    '        <string name="Name">BeachArea</string>\n'
    '        <string name="Source"><![CDATA[' + src + "]]></string>\n"
    "      </Properties>\n"
    "    </Item>"
)

d = d[:insert_at] + new_item + d[insert_at:]
with open(RBXLX, "w", encoding="utf-8") as f:
    f.write(d)
print("Injected BeachArea script (%d chars). File now %d bytes." % (len(src), len(d.encode("utf-8"))))
