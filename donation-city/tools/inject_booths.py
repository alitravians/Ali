import sys

SRC = "DonationCity_FINAL.rbxlx"
NEW_SOURCE_FILE = "src/BoothSystem.server.lua"
NAME_TAG = '<string name="Name">DonationBooths</string>'

with open(SRC, "r", encoding="utf-8") as f:
    content = f.read()

with open(NEW_SOURCE_FILE, "r", encoding="utf-8") as f:
    new_source = f.read()

if "]]>" in new_source:
    sys.exit("ERROR: new source contains ]]> which breaks CDATA")

idx_name = content.find(NAME_TAG)
if idx_name == -1:
    sys.exit("ERROR: could not find DonationBooths script Item")
if content.find(NAME_TAG, idx_name + 1) != -1:
    sys.exit("ERROR: DonationBooths name is not unique")

cdata_open = content.find("<![CDATA[", idx_name)
if cdata_open == -1:
    sys.exit("ERROR: could not find Source CDATA after DonationBooths name")
start_inner = cdata_open + len("<![CDATA[")
end_inner = content.find("]]>", start_inner)
if end_inner == -1:
    sys.exit("ERROR: could not find CDATA close for DonationBooths")

old_block = content[start_inner:end_inner]
new_content = content[:start_inner] + new_source + content[end_inner:]

with open(SRC, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Replaced DonationBooths -> BoothSystem: old={len(old_block)} chars, new={len(new_source)} chars")
print(f"Wrote {SRC} ({len(new_content)} bytes)")
