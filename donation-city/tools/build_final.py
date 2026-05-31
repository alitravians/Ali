import sys, shutil

SRC = "DonationCity_FINAL.rbxlx"

UPDATES = [
    ("src/CinemaSystem.server.lua",   "CINEMA SYSTEM"),
    ("src/CinemaServices.server.lua", "CINEMA SERVICES"),
    ("src/CinemaClient.client.lua",   "CINEMA CLIENT"),
]

with open(SRC, "r", encoding="utf-8") as f:
    content = f.read()

shutil.copy(SRC, SRC + ".prebuild.bak")

# 1) replace existing embedded scripts by marker
for path, marker in UPDATES:
    with open(path, "r", encoding="utf-8") as f:
        source = f.read()
    if "]]>" in source:
        sys.exit(f"ERROR: {path} contains ]]> which breaks CDATA")
    idx = content.find(marker)
    if idx == -1:
        sys.exit(f"ERROR: marker '{marker}' not found")
    start = content.rfind("<![CDATA[", 0, idx)
    start_inner = start + len("<![CDATA[")
    end_inner = content.find("]]>", start_inner)
    old = content[start_inner:end_inner]
    if marker not in old:
        sys.exit(f"ERROR: located block is not {marker}")
    content = content[:start_inner] + source + content[end_inner:]
    print(f"updated {marker}: {len(old)} -> {len(source)} chars")

# 2) insert CinemaExterior as a NEW Script item in ServerScriptService
EXT_PATH = "src/CinemaExterior.server.lua"
EXT_MARKER = "CINEMA EXTERIOR"
with open(EXT_PATH, "r", encoding="utf-8") as f:
    ext_source = f.read()
if "]]>" in ext_source:
    sys.exit("ERROR: exterior source contains ]]>")

if EXT_MARKER in content:
    # already present -> just replace its CDATA
    idx = content.find(EXT_MARKER)
    start = content.rfind("<![CDATA[", 0, idx)
    start_inner = start + len("<![CDATA[")
    end_inner = content.find("]]>", start_inner)
    content = content[:start_inner] + ext_source + content[end_inner:]
    print(f"updated CINEMA EXTERIOR (existing)")
else:
    anchor = content.find('referent="CinemaServicesRef"')
    cdata_open = content.find("<![CDATA[", anchor)
    cdata_close = content.find("]]>", cdata_open)
    item_close = content.find("</Item>", cdata_close)
    insert_at = item_close + len("</Item>")
    new_item = (
        '\n    <Item class="Script" referent="CinemaExteriorRef">\n'
        '      <Properties>\n'
        '        <string name="Name">CinemaExterior</string>\n'
        '        <string name="Source"><![CDATA[' + ext_source + ']]></string>\n'
        '      </Properties>\n'
        '    </Item>'
    )
    content = content[:insert_at] + new_item + content[insert_at:]
    print(f"inserted CinemaExterior ({len(ext_source)} chars)")

# 3) insert CinemaDecor (fountain + aquarium) as a NEW Script item
DEC_PATH = "src/CinemaDecor.server.lua"
DEC_MARKER = "CINEMA DECOR"
with open(DEC_PATH, "r", encoding="utf-8") as f:
    dec_source = f.read()
if "]]>" in dec_source:
    sys.exit("ERROR: decor source contains ]]>")

if DEC_MARKER in content:
    idx = content.find(DEC_MARKER)
    start = content.rfind("<![CDATA[", 0, idx)
    start_inner = start + len("<![CDATA[")
    end_inner = content.find("]]>", start_inner)
    content = content[:start_inner] + dec_source + content[end_inner:]
    print(f"updated CINEMA DECOR (existing)")
else:
    anchor = content.find('referent="CinemaServicesRef"')
    cdata_open = content.find("<![CDATA[", anchor)
    cdata_close = content.find("]]>", cdata_open)
    item_close = content.find("</Item>", cdata_close)
    insert_at = item_close + len("</Item>")
    new_item = (
        '\n    <Item class="Script" referent="CinemaDecorRef">\n'
        '      <Properties>\n'
        '        <string name="Name">CinemaDecor</string>\n'
        '        <string name="Source"><![CDATA[' + dec_source + ']]></string>\n'
        '      </Properties>\n'
        '    </Item>'
    )
    content = content[:insert_at] + new_item + content[insert_at:]
    print(f"inserted CinemaDecor ({len(dec_source)} chars)")

with open(SRC, "w", encoding="utf-8") as f:
    f.write(content)
print(f"file now {len(content)} bytes")
