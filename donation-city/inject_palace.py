#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────
# Injector: Presidential Palace (قصر جمهوري) — replaces the beach plot.
#   1) Removes the beach "under construction" assets:
#        - Folder  BEACH_CONSTRUCTION
#        - Model   PoliceGuard_Beach
#   2) Merges the CLEAN store palace model (palace1.rbxmx) into Workspace,
#      uniformly scaled + translated onto the beach plot, all parts anchored.
#   3) Enlarges the Ground part eastward so the palace stands on solid ground.
#
# Idempotent: re-running first strips any previously injected PresidentialPalace.
# Uses lxml with strip_cdata=False so embedded <Script> CDATA is preserved.
# ──────────────────────────────────────────────────────────────────────────
import lxml.etree as ET
import sys, os, copy

RBXLX  = "DonationCity_FINAL.rbxlx"
PALACE = os.path.join(os.path.dirname(__file__), "assets", "palace1.rbxmx")

# placement (uniform scale + world translation of the model center)
S  = 0.42                       # uniform scale
CX, CY, CZ = 168.0, 0.50, 18.0  # model min-corner → world (base rests on the ground y≈0.5)

PART_CLASSES = {
    'Part','UnionOperation','WedgePart','MeshPart','TrussPart',
    'CornerWedgePart','SpawnLocation','Seat','VehicleSeat','NegateOperation',
}

# ── interior cavity to carve out of the model (world coords, AFTER transform) ──
# Keeps the grand exterior, wings and upper floors; clears only the central
# ground-floor clutter where the custom furnished rooms (PalaceSystem) are built,
# plus a west entrance corridor. Must stay in sync with PalaceSystem.server.lua
# (FX0/FX1=96/240, FZ0/FZ1=-36/72, FLOOR_Y=0.6, CEIL_Y=11.6, entrance on -X).
CARVE_INTERIOR = dict(x=(95.0, 241.0), z=(-37.0, 73.0), ytop=12.5, ybot=-2.0)
CARVE_CORRIDOR = dict(x=(60.0, 96.0), z=(8.0, 28.0),  ytop=12.5, ybot=-2.0)

def name_of(item):
    props = item.find('Properties')
    if props is None:
        return ''
    for p in props:
        if p.get('name') == 'Name' and p.tag == 'string':
            return p.text or ''
    return ''

def set_bool(props, name, value):
    for p in props:
        if p.tag == 'bool' and p.get('name') == name:
            p.text = 'true' if value else 'false'
            return
    e = ET.SubElement(props, 'bool'); e.set('name', name)
    e.text = 'true' if value else 'false'

def scale_cframe(cf):
    for ax, val in (('X', CX), ('Y', CY), ('Z', CZ)):
        e = cf.find(ax)
        if e is not None and e.text is not None:
            e.text = repr(S * float(e.text) + val)

def scale_vec3(v):
    for ax in ('X', 'Y', 'Z'):
        e = v.find(ax)
        if e is not None and e.text is not None:
            e.text = repr(S * float(e.text))

def transform_palace(model):
    nparts = nmesh = 0
    for item in model.iter('Item'):
        cls = item.get('class')
        props = item.find('Properties')
        if props is None:
            continue
        if cls in PART_CLASSES:
            for p in props:
                if p.tag == 'CoordinateFrame' and p.get('name') == 'CFrame':
                    scale_cframe(p)
                elif p.tag == 'Vector3' and p.get('name') in ('size', 'Size'):
                    scale_vec3(p)
            set_bool(props, 'Anchored', True)
            nparts += 1
        elif cls in ('SpecialMesh', 'CylinderMesh', 'BlockMesh', 'FileMesh'):
            for p in props:
                if p.tag == 'Vector3' and p.get('name') == 'Scale':
                    scale_vec3(p)
            nmesh += 1
    return nparts, nmesh

def _overlap(a0, a1, b0, b1):
    return a0 < b1 and b0 < a1

def _part_box(props):
    cx = cy = cz = 0.0
    sx = sy = sz = 1.0
    for p in props:
        if p.tag == 'CoordinateFrame' and p.get('name') == 'CFrame':
            for ax, set_c in (('X', 'cx'), ('Y', 'cy'), ('Z', 'cz')):
                e = p.find(ax)
                if e is not None and e.text is not None:
                    v = float(e.text)
                    if set_c == 'cx': cx = v
                    elif set_c == 'cy': cy = v
                    else: cz = v
        elif p.tag == 'Vector3' and p.get('name') in ('size', 'Size'):
            for ax in ('X', 'Y', 'Z'):
                e = p.find(ax)
                if e is not None and e.text is not None:
                    v = float(e.text)
                    if ax == 'X': sx = v
                    elif ax == 'Y': sy = v
                    else: sz = v
    return (cx - sx/2, cx + sx/2, cy - sy/2, cy + sy/2, cz - sz/2, cz + sz/2)

def carve_interior(model):
    """Remove model BaseParts whose bounding box intrudes into the interior
    cavity (or the west entrance corridor) so the custom furnished rooms sit in
    clean, unobstructed space. The exterior shell, wings and upper floors stay."""
    removed = 0
    for item in list(model.iter('Item')):
        if item.get('class') not in PART_CLASSES:
            continue
        props = item.find('Properties')
        if props is None:
            continue
        x0, x1, y0, y1, z0, z1 = _part_box(props)
        hit = False
        for reg in (CARVE_INTERIOR, CARVE_CORRIDOR):
            if (_overlap(x0, x1, reg['x'][0], reg['x'][1])
                    and _overlap(z0, z1, reg['z'][0], reg['z'][1])
                    and y0 < reg['ytop'] and y1 > reg['ybot']):
                hit = True
                break
        if hit:
            parent = item.getparent()
            if parent is not None:
                parent.remove(item)
                removed += 1
    return removed

def main():
    if not os.path.exists(PALACE):
        sys.exit(f"ERROR: palace model not found at {PALACE}")

    parser = ET.XMLParser(strip_cdata=False, huge_tree=True, remove_blank_text=False)
    tree = ET.parse(RBXLX, parser)
    root = tree.getroot()

    ws = None
    for it in root.iter('Item'):
        if it.get('class') == 'Workspace':
            ws = it; break
    if ws is None:
        sys.exit("ERROR: no Workspace found")

    # (1) remove beach assets + any prior palace (idempotent)
    removed = []
    for child in list(ws):
        if child.tag != 'Item':
            continue
        nm = name_of(child)
        if nm in ('BEACH_CONSTRUCTION', 'PoliceGuard_Beach', 'PresidentialPalace'):
            ws.remove(child); removed.append(nm)
    print("removed from Workspace:", removed)

    # (2) enlarge Ground eastward to hold the palace (x: -250..250 -> -250..350)
    for it in ws.iter('Item'):
        if name_of(it) == 'Ground' and it.get('class') == 'Part':
            props = it.find('Properties')
            for p in props:
                if p.tag == 'Vector3' and p.get('name') in ('size','Size'):
                    x = p.find('X')
                    if x is not None: x.text = '700'
                if p.tag == 'CoordinateFrame' and p.get('name') == 'CFrame':
                    x = p.find('X')
                    if x is not None: x.text = '100'
            print("enlarged Ground -> size.X=700 center.X=100 (covers x -250..450)")
            break

    # (3) load + transform palace, then parent into Workspace
    pal_tree = ET.parse(PALACE, parser)
    pal_root = pal_tree.getroot()
    model = pal_root.find('Item')
    if model is None or model.get('class') != 'Model':
        sys.exit("ERROR: palace root model not found")

    # rename to PresidentialPalace
    mprops = model.find('Properties')
    renamed = False
    for p in mprops:
        if p.get('name') == 'Name' and p.tag == 'string':
            p.text = 'PresidentialPalace'; renamed = True
    if not renamed:
        e = ET.SubElement(mprops, 'string'); e.set('name', 'Name')
        e.text = 'PresidentialPalace'

    nparts, nmesh = transform_palace(model)
    print(f"transformed palace: {nparts} parts, {nmesh} meshes (scale={S}, center=({CX},{CY},{CZ}))")

    carved = carve_interior(model)
    print(f"carved interior cavity + entrance corridor: removed {carved} model parts")

    ws.append(copy.deepcopy(model))

    # (4) write atomically with backup
    if os.path.exists(RBXLX):
        import shutil; shutil.copy(RBXLX, RBXLX + ".bak")
    tmp = RBXLX + ".tmp"
    tree.write(tmp, xml_declaration=True, encoding="utf-8")
    os.replace(tmp, RBXLX)
    print("wrote", RBXLX, os.path.getsize(RBXLX), "bytes")

if __name__ == "__main__":
    main()
