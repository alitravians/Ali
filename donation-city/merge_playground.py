#!/usr/bin/env python3
"""
One-time merge: inject the user-provided "RP Hangout / Playground" model
(soro.rbxmx, asset 95008257928137) into DonationCity_FINAL.rbxlx as static
Workspace geometry, positioned where the old (code-built) playground was
(PlaygroundArea.server.lua: CX=0, CZ=130, ground Y≈0.8).

Cleaning (per owner request "افحص السكربتات وركّبه بعد التنظيف"):
- STRIP every Script / LocalScript / ModuleScript. Deep scan found NO backdoor
  (no loadstring / HttpGet / require(AssetId) / getfenv / obfuscation). The 44
  scripts are just two legacy Quenty/Zeimi utilities duplicated many times:
  qTexture (night-lamp + texture applier, hooks Lighting.Changed ×18 = redundant
  startup cost) and qPerfectionWeld (runtime welder). Neither is needed for a
  static decorative area, so we drop all of them for a zero-lag install.
- ANCHOR every BasePart so the geometry stays put with no physics simulation
  (neutralizes the model's VehicleSeats / AlignPosition / LinearVelocity /
  BodyThrust constraints — no welds needed, no drift, no lag).

Safe-merge mechanics (same as merge_beach.py):
- Prefix every referent + <Ref> with "PLGND" so they never collide with the
  rbxlx's own referents (incl. the beach model's "BCHPG" ones).
- Translate ONLY real BasePart CFrames (+ BodyPosition targets) by the offset.
- Splice the model in as the first child of <Workspace> via string splice so the
  rest of the rbxlx (incl. CDATA script blocks) stays byte-for-byte intact.
- Merge the model's <SharedString> entries into the single existing
  <SharedStrings> section (deduped by md5); create one only if none exists.
- Idempotent: refuses to run twice (guards on the PLGND referent prefix).
"""
import re
import xml.etree.ElementTree as ET

RBXMX = "/home/ubuntu/attachments/7bbbe2d4-8489-4910-aaf1-9d1aec279e7d/soro.rbxmx"
RBXLX = "DonationCity_FINAL.rbxlx"

# target center where the old playground lived (PlaygroundArea.server.lua)
TARGET_CX, TARGET_CZ = 0.0, 130.0
TARGET_BOTTOM_Y = 0.8

PREFIX = "PLGND"

BASEPART_CLASSES = {
    "Part", "MeshPart", "WedgePart", "CornerWedgePart", "UnionOperation",
    "NegateOperation", "TrussPart", "Seat", "VehicleSeat", "SpawnLocation",
}
SCRIPT_CLASSES = {"Script", "LocalScript", "ModuleScript"}


def fmt(v):
    s = f"{v:.4f}".rstrip("0").rstrip(".")
    return s if s not in ("", "-0") else "0"


# ---- idempotency guard ----
with open(RBXLX, "r", encoding="utf-8") as f:
    d = f.read()
if f'referent="{PREFIX}' in d:
    raise SystemExit(
        f"ABORT: rbxlx already contains '{PREFIX}'-prefixed referents — model "
        "appears already merged. Nothing changed."
    )

print("parsing model rbxmx...")
mtree = ET.parse(RBXMX)
mroot = mtree.getroot()

model_item = None
shared = None
for ch in mroot:
    if ch.tag == "Item" and model_item is None:
        model_item = ch
    elif ch.tag == "SharedStrings":
        shared = ch
assert model_item is not None, "no model Item found"

# ---- 0) STRIP all scripts (walk parents, remove matching child Items) ----
nstrip = 0
for parent in model_item.iter():
    to_remove = [c for c in list(parent)
                 if c.tag == "Item" and c.get("class") in SCRIPT_CLASSES]
    for c in to_remove:
        parent.remove(c)
        nstrip += 1
# also handle the (unlikely) case the model root itself is a script — it isn't
print(f"stripped {nstrip} scripts")

# ---- 1) bounding box from real BaseParts ----
xs, ys, zs = [], [], []
for it in model_item.iter("Item"):
    if it.get("class") in BASEPART_CLASSES:
        props = it.find("Properties")
        if props is None:
            continue
        cf = props.find("CoordinateFrame[@name='CFrame']")
        if cf is not None:
            xs.append(float(cf.findtext("X", "0")))
            ys.append(float(cf.findtext("Y", "0")))
            zs.append(float(cf.findtext("Z", "0")))
assert xs, f"no BasePart CFrames found in model (searched classes: {BASEPART_CLASSES})"
cx = (min(xs) + max(xs)) / 2.0
cz = (min(zs) + max(zs)) / 2.0
dx = TARGET_CX - cx
dz = TARGET_CZ - cz
dy = TARGET_BOTTOM_Y - min(ys)
print(f"model parts={len(xs)} centerX={cx:.1f} centerZ={cz:.1f} bottomY={min(ys):.1f}")
print(f"offset dx={dx:.2f} dy={dy:.2f} dz={dz:.2f}")

# ---- 2) prefix referents + Ref links ----
nref = 0
for el in model_item.iter():
    r = el.get("referent")
    if r is not None and r != "null":
        el.set("referent", PREFIX + r)
        nref += 1
for ref in model_item.iter("Ref"):
    t = (ref.text or "").strip()
    if t and t != "null":
        ref.text = PREFIX + t
print(f"prefixed {nref} referents")

# ---- 3) translate BasePart CFrames + BodyPosition; ANCHOR every BasePart ----
def offset_xyz(node, ddx, ddy, ddz):
    x = node.find("X"); y = node.find("Y"); z = node.find("Z")
    if x is not None: x.text = fmt(float(x.text) + ddx)
    if y is not None: y.text = fmt(float(y.text) + ddy)
    if z is not None: z.text = fmt(float(z.text) + ddz)

def set_anchored(props):
    a = props.find("bool[@name='Anchored']")
    if a is None:
        a = ET.SubElement(props, "bool")
        a.set("name", "Anchored")
    a.text = "true"

nparts = nbody = nanchor = 0
for it in model_item.iter("Item"):
    cls = it.get("class")
    props = it.find("Properties")
    if props is None:
        continue
    if cls in BASEPART_CLASSES:
        cf = props.find("CoordinateFrame[@name='CFrame']")
        if cf is not None:
            offset_xyz(cf, dx, dy, dz)
            nparts += 1
        set_anchored(props)
        nanchor += 1
    elif cls == "BodyPosition":
        v = props.find("Vector3[@name='Position']")
        if v is not None:
            offset_xyz(v, dx, dy, dz)
            nbody += 1
print(f"repositioned parts={nparts} bodyPositions={nbody} anchored={nanchor}")

# ---- 4) serialize the cleaned model fragment ----
model_xml = ET.tostring(model_item, encoding="unicode")

# ---- 5) splice into <Workspace> ----
ws = d.find('<Item class="Workspace"')
assert ws != -1, "Workspace Item not found"
pe = d.find("</Properties>", ws)
assert pe != -1, "Workspace </Properties> not found"
ins = pe + len("</Properties>")
d = d[:ins] + "\n" + model_xml + "\n" + d[ins:]

# ---- 6) merge SharedStrings into a single section ----
if shared is not None and len(list(shared)) > 0:
    existing_md5 = set()
    se = d.find("<SharedStrings>")
    if se != -1:
        ee = d.find("</SharedStrings>", se)
        existing_md5 = set(re.findall(r'<SharedString md5="([^"]+)"', d[se:ee]))
    entries = []
    for child in shared:
        md5 = child.get("md5")
        if md5 and md5 in existing_md5:
            continue
        entries.append(ET.tostring(child, encoding="unicode").strip())
    payload = "\n".join(entries)
    if payload:
        close = d.find("</SharedStrings>")
        if close != -1:
            d = d[:close] + payload + "\n" + d[close:]
            print(f"merged {len(entries)} SharedString entries into existing section")
        else:
            rb = d.rfind("</roblox>")
            assert rb != -1
            d = d[:rb] + "<SharedStrings>\n" + payload + "\n</SharedStrings>\n" + d[rb:]
            print(f"created new SharedStrings section with {len(entries)} entries")

with open(RBXLX, "w", encoding="utf-8") as f:
    f.write(d)
print(f"merged. rbxlx now {len(d.encode('utf-8'))} bytes")
