import xml.etree.ElementTree as ET
import os, html

SRC = "DonationCity_FINAL.rbxlx"
OUT = "extracted"
os.makedirs(OUT, exist_ok=True)

tree = ET.parse(SRC)
root = tree.getroot()

count = 0
def walk(item):
    global count
    cls = item.get("class")
    if cls in ("Script", "LocalScript", "ModuleScript"):
        name = "unknown"
        source = ""
        props = item.find("Properties")
        if props is not None:
            for child in props:
                if child.get("name") == "Name":
                    name = child.text or "unnamed"
                if child.get("name") in ("Source",) and child.tag in ("ProtectedString", "string"):
                    source = child.text or ""
        count += 1
        fn = f"{OUT}/{count:02d}_{cls}_{name}.lua"
        with open(fn, "w") as f:
            f.write(source)
        print(f"{fn}  ({len(source)} chars)")
    for sub in item.findall("Item"):
        walk(sub)

for item in root.findall("Item"):
    walk(item)
print("done")
