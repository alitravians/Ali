import sys, shutil

SRC = "DonationCity_FINAL.rbxlx"
SERVICES_SRC = "src/CinemaServices.server.lua"
MARKER = "CINEMA SERVICES"

with open(SRC, "r", encoding="utf-8") as f:
    content = f.read()
with open(SERVICES_SRC, "r", encoding="utf-8") as f:
    services_source = f.read()

if "]]>" in services_source:
    sys.exit("ERROR: source contains ]]> which breaks CDATA")

idx = content.find(MARKER)
if idx == -1:
    sys.exit("ERROR: marker not found in rbxlx")
start = content.rfind("<![CDATA[", 0, idx)
if start == -1:
    sys.exit("ERROR: CDATA open not found")
start_inner = start + len("<![CDATA[")
end_inner = content.find("]]>", start_inner)
if end_inner == -1:
    sys.exit("ERROR: CDATA close not found")
old = content[start_inner:end_inner]
if MARKER not in old:
    sys.exit("ERROR: located block is not CinemaServices")

shutil.copy(SRC, SRC + ".prevpass.bak")
content = content[:start_inner] + services_source + content[end_inner:]
with open(SRC, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Updated CinemaServices source: old={len(old)} -> new={len(services_source)} chars; file={len(content)} bytes")
