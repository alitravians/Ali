import sys, shutil

SRC = "DonationCity_FINAL.rbxlx"
CLIENT_SRC = "src/CinemaClient.client.lua"
MARKER = "CINEMA CLIENT"

with open(SRC, "r", encoding="utf-8") as f:
    content = f.read()
with open(CLIENT_SRC, "r", encoding="utf-8") as f:
    client_source = f.read()

if "]]>" in client_source:
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
    sys.exit("ERROR: located block is not CinemaClient")

shutil.copy(SRC, SRC + ".prevclient.bak")
content = content[:start_inner] + client_source + content[end_inner:]
with open(SRC, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Updated CinemaClient source: old={len(old)} -> new={len(client_source)} chars; file={len(content)} bytes")
