import sys

RBXLX = "DonationCity_FINAL.rbxlx"
REF = 'referent="CustomChatClientRef"'

with open(RBXLX, "r", encoding="utf-8") as f:
    content = f.read()
with open("src/CustomChat.client.lua", "r", encoding="utf-8") as f:
    new_src = f.read()

if "]]>" in new_src:
    sys.exit("ERROR: new source contains ]]> which breaks CDATA")

idx = content.find(REF)
if idx == -1:
    sys.exit("ERROR: CustomChatClientRef not found")

cdata_open = "<![CDATA["
start = content.find(cdata_open, idx)
if start == -1:
    sys.exit("ERROR: CDATA open not found after client ref")
start_inner = start + len(cdata_open)
end_inner = content.find("]]>", start_inner)
if end_inner == -1:
    sys.exit("ERROR: CDATA close not found")

old = content[start_inner:end_inner]
if "CUSTOM CHAT (Client)" not in old:
    sys.exit("ERROR: located block is not the CustomChat client script")

content = content[:start_inner] + new_src + content[end_inner:]
with open(RBXLX, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Replaced CustomChat client source: old={len(old)} chars, new={len(new_src)} chars")
