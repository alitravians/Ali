import sys

SRC_RBXLX = "DonationCity_FINAL.rbxlx"
OUT_RBXLX = "DonationCity_FINAL.rbxlx"  # in-place update
NEW_SOURCE_FILE = "src/LoadingScreen.client.lua"
MARKER = "Premium Loading Screen"

with open(SRC_RBXLX, "r", encoding="utf-8") as f:
    content = f.read()

with open(NEW_SOURCE_FILE, "r", encoding="utf-8") as f:
    new_source = f.read()

if "]]>" in new_source:
    sys.exit("ERROR: new source contains ]]> which breaks CDATA")

idx_marker = content.find(MARKER)
if idx_marker == -1:
    sys.exit("ERROR: could not find LoadingScreen marker")
if content.find(MARKER, idx_marker + 1) != -1:
    sys.exit("ERROR: marker is not unique")

cdata_open = "<![CDATA["
start = content.rfind(cdata_open, 0, idx_marker)
if start == -1:
    sys.exit("ERROR: could not find CDATA open before marker")
start_inner = start + len(cdata_open)

end_inner = content.find("]]>", start_inner)
if end_inner == -1:
    sys.exit("ERROR: could not find CDATA close")

old_block = content[start_inner:end_inner]
if MARKER not in old_block:
    sys.exit("ERROR: located block is not LoadingScreen")

new_content = content[:start_inner] + new_source + content[end_inner:]

with open(OUT_RBXLX, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Replaced LoadingScreen source: old={len(old_block)} chars, new={len(new_source)} chars")
print(f"Wrote {OUT_RBXLX} ({len(new_content)} bytes)")
