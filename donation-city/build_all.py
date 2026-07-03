#!/usr/bin/env python3
# Unified builder: replaces ALL embedded script sources in the rbxlx from src/
# by locating a unique marker inside each script's CDATA block.
import sys
import shutil
import os
from lxml import etree as ET

SRC = "DonationCity_FINAL.rbxlx"

# (source file, unique marker that appears inside that script's CDATA)
#
# NOTE: src/WorldBuilder.server.lua is intentionally NOT in this list. It is a
# one-time map generator: its output (floor, chairs, booths, cinema building,
# etc.) was already "baked" into DonationCity_FINAL.rbxlx as static instances,
# and the script itself is not embedded as a live Script in the rbxlx. There is
# therefore no CDATA marker to target, and editing src/WorldBuilder.server.lua
# will NOT affect the shipped game. It is kept in src/ for reference only. To
# regenerate the map from scratch, run it manually in Studio on an empty place
# and save the result. See README.md ("طريقة الاستخدام") for details.
UPDATES = [
    ("src/BadgeAwards.server.lua",    "BADGE AWARDS (Server)"),
    ("src/CinemaSystem.server.lua",   "CINEMA SYSTEM"),
    ("src/CinemaServices.server.lua", "CINEMA SERVICES"),
    ("src/CinemaClient.client.lua",   "CINEMA CLIENT"),
    ("src/CinemaExterior.server.lua", "CINEMA EXTERIOR"),
    ("src/CinemaDecor.server.lua",    "CINEMA DECOR"),
    ("src/CustomChat.server.lua",     "CUSTOM CHAT (Server)"),
    ("src/CustomChat.client.lua",     "CUSTOM CHAT (Client)"),
    ("src/LoadingScreen.client.lua",  "Premium Loading Screen"),
    ("src/TicketSystem.server.lua",   "TICKET SYSTEM (Server)"),
    ("src/BoothSystem.server.lua",    "BOOTH SYSTEM — SERVER LOGIC"),
    ("src/BeachArea.server.lua",      "BEACH AREA (Server)"),
    ("src/ParkourSystem.server.lua",  "PARKOUR SYSTEM (Server)"),
    ("src/ParkourClient.client.lua",  "PARKOUR CLIENT (Client)"),
    ("src/PlaygroundArea.server.lua", "PLAYGROUND (Server)"),
    ("src/ActivitySystem.server.lua", "ACTIVITY SYSTEM (Server)"),
    ("src/SprintJump.client.lua",    "SPRINT & JUMP (Client)"),
    ("src/MissionSystem.server.lua", "MISSION SYSTEM (Server)"),
    ("src/MissionClient.client.lua", "MISSION CLIENT (Client)"),
    ("src/PalaceSystem.server.lua",  "PALACE SYSTEM (Server)"),
    ("src/PalaceClient.client.lua",  "PALACE CLIENT (Client)"),
    ("src/GuardSystem.server.lua",   "GUARD SYSTEM (Server)"),
    ("src/SpawnCinematic.server.lua", "SPAWN CINEMATIC (Server)"),
    ("src/SpawnCinematic.client.lua", "SPAWN CINEMATIC (Client)"),
    ("src/RewardBoxSystem.server.lua", "REWARD BOX SYSTEM (Server)"),
    ("src/RewardBoxClient.client.lua", "REWARD BOX CLIENT (Client)"),
    ("src/DayNightCycle.server.lua",  "DAY NIGHT CYCLE (Server)"),
    ("src/DayNightClient.client.lua", "DAY NIGHT CLIENT (Client)"),
    ("src/TicTacToe.server.lua",      "TIC TAC TOE — لعبة إكس-أو"),
    ("src/BoundarySystem.server.lua", "BOUNDARY SYSTEM (Server)"),
    ("src/CherryTrees.server.lua",    "CHERRY TREES (Server)"),
    ("src/CherryTrees.client.lua",    "CHERRY TREES (Client)"),
]

parser = ET.XMLParser(remove_blank_text=False, strip_cdata=False)
tree = ET.parse(SRC, parser)
root = tree.getroot()

for path, marker in UPDATES:
    with open(path, "r", encoding="utf-8") as f:
        source = f.read()
    if "]]>" in source:
        sys.exit(f"ERROR: {path} contains ]]> which breaks CDATA")
    matches = []
    for item in root.xpath("//Item[@class='Script' or @class='LocalScript' or @class='ModuleScript']"):
        src_node = item.find("Properties/string[@name='Source']")
        if src_node is not None and src_node.text and marker in src_node.text:
            matches.append((item, src_node))
    if len(matches) != 1:
        sys.exit(f"ERROR: marker '{marker}' found in {len(matches)} script source(s) (expected 1)")
    _, src_node = matches[0]
    old = src_node.text or ""
    src_node.text = ET.CDATA(source)
    print(f"updated {marker}: {len(old)} -> {len(source)} chars")

# نسخة احتياطية قبل الكتابة + كتابة ذرّية (ملف مؤقّت ثم استبدال) — تحمي من تلف الملف لو انقطعت العملية
if os.path.exists(SRC):
    shutil.copy(SRC, SRC + ".bak")
tmp = SRC + ".tmp"
tree.write(tmp, encoding="utf-8", xml_declaration=True)
os.replace(tmp, SRC)
print(f"file now {os.path.getsize(SRC)} bytes")
print("Build complete.")
