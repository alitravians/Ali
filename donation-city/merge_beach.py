#!/usr/bin/env python3
"""
One-time merge: inject the user-provided "BIG PLAYGROUND" beach model
(by.rbxmx) into DonationCity_FINAL.rbxlx as static Workspace geometry,
positioned where the old (code-built) beach was (~150, ~1, 20).

Safe approach:
- Parse the model rbxmx with ElementTree (no CDATA-preservation needed for the
  model fragment; Roblox reads escaped script text identically).
- Prefix every referent + <Ref> link with a long, unlikely-to-collide prefix
  ("BCHPG") so they never collide with the rbxlx's own numeric/named referents.
- Translate ONLY real BasePart CFrames (and BodyPosition world targets) by the
  offset; leave Attachment/Weld/CFrameValue (relative/rotation) untouched.
- Insert the serialized model Item as the first child of <Workspace> via a
  string splice (so the rest of the rbxlx — incl. CDATA script blocks — is left
  byte-for-byte intact and build_all.py keeps working).
- SharedStrings (CSG/mesh data): if the rbxlx ALREADY has a <SharedStrings>
  section, merge the model's individual <SharedString> entries into it (deduped
  by md5) so the file keeps exactly ONE <SharedStrings> section. Roblox ignores
  a second top-level <SharedStrings>, which would break the model's meshes.
- Idempotent: refuses to run twice (guards on the BCHPG referent prefix).
"""
import xml.etree.ElementTree as ET

RBXMX = "/home/ubuntu/attachments/369bfed0-2e5e-46be-ae0a-f26f166d3e0c/by.rbxmx"
RBXLX = "DonationCity_FINAL.rbxlx"

# target center where the old beach lived (BeachArea.server.lua: CX=150, CZ=20)
TARGET_CX, TARGET_CZ = 150.0, 20.0
TARGET_BOTTOM_Y = 1.0   # sit model on ground (old sand was Y≈0.9)

# long prefix so model referents (e.g. "BCHPG0", "BCHPGRBX...") never collide
# with the rbxlx's numeric ("0","1",...) or named ("ParkourSystemRef") referents
PREFIX = "BCHPG"

BASEPART_CLASSES = {
    "Part", "MeshPart", "WedgePart", "CornerWedgePart", "UnionOperation",
    "NegateOperation", "TrussPart", "Seat", "VehicleSeat", "SpawnLocation",
}


def fmt(v):
    """Compact fixed-point float (avoids repr()'s 17-digit noise that bloats the
    27MB file); trailing zeros trimmed. Roblox parses these identically."""
    s = f"{v:.4f}".rstrip("0").rstrip(".")
    return s if s not in ("", "-0") else "0"


# ---- idempotency guard: bail out if the model was already merged ----
with open(RBXLX, "r", encoding="utf-8") as f:
    d = f.read()
if f'referent="{PREFIX}' in d:
    raise SystemExit(
        f"ABORT: rbxlx already contains '{PREFIX}'-prefixed referents — model "
        "appears already merged. This script is one-time and not idempotent-safe "
        "to re-run (would duplicate the model). Nothing changed."
    )

print("parsing model rbxmx (27MB, may take a moment)...")
mtree = ET.parse(RBXMX)
mroot = mtree.getroot()

# locate the single top-level Model Item + the SharedStrings section
model_item = None
shared = None
for ch in mroot:
    if ch.tag == "Item" and model_item is None:
        model_item = ch
    elif ch.tag == "SharedStrings":
        shared = ch
assert model_item is not None, "no model Item found"

# ---- 1) compute bounding box from real BaseParts to derive the offset ----
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

# ---- 2) prefix referents + Ref links to avoid collisions ----
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

# ---- 3) translate only true BasePart CFrames + BodyPosition targets ----
def offset_xyz(node, ddx, ddy, ddz):
    x = node.find("X"); y = node.find("Y"); z = node.find("Z")
    if x is not None: x.text = fmt(float(x.text) + ddx)
    if y is not None: y.text = fmt(float(y.text) + ddy)
    if z is not None: z.text = fmt(float(z.text) + ddz)

nparts = nbody = 0
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
    elif cls == "BodyPosition":
        v = props.find("Vector3[@name='Position']")
        if v is not None:
            offset_xyz(v, dx, dy, dz)
            nbody += 1
print(f"repositioned parts={nparts} bodyPositions={nbody}")

# ---- 4) serialize the model fragment ----
model_xml = ET.tostring(model_item, encoding="unicode")

# ---- 5) splice the model in as the first child of <Workspace> ----
ws = d.find('<Item class="Workspace"')
assert ws != -1, "Workspace Item not found"
pe = d.find("</Properties>", ws)
assert pe != -1, "Workspace </Properties> not found"
ins = pe + len("</Properties>")
d = d[:ins] + "\n" + model_xml + "\n" + d[ins:]

# ---- 6) merge SharedStrings (CSG/mesh data) into a SINGLE section ----
if shared is not None and len(list(shared)) > 0:
    # which md5 keys already exist in the rbxlx? (dedupe)
    existing_md5 = set()
    se = d.find("<SharedStrings>")
    if se != -1:
        ee = d.find("</SharedStrings>", se)
        section = d[se:ee]
        import re
        existing_md5 = set(re.findall(r'<SharedString md5="([^"]+)"', section))

    # serialize each model <SharedString> child individually, skipping dups
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
            # merge into the existing section (keep exactly one <SharedStrings>)
            d = d[:close] + payload + "\n" + d[close:]
            print(f"merged {len(entries)} SharedString entries into existing section")
        else:
            # no existing section → create one before </roblox>
            rb = d.rfind("</roblox>")
            assert rb != -1
            block = "<SharedStrings>\n" + payload + "\n</SharedStrings>\n"
            d = d[:rb] + block + d[rb:]
            print(f"created new SharedStrings section with {len(entries)} entries")

with open(RBXLX, "w", encoding="utf-8") as f:
    f.write(d)
print(f"merged. rbxlx now {len(d.encode('utf-8'))} bytes")
