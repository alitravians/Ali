#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────
# Injector: Presidential Palace systems.
#   1) Adds/updates Script  "PalaceSystem"  in ServerScriptService
#      (source = src/PalaceSystem.server.lua).
#   2) Adds/updates LocalScript "PalaceClient" in StarterPlayer.StarterPlayerScripts
#      (source = src/PalaceClient.client.lua).
#   3) Mounts the CLEAN store fingerprint device (audited, pure geometry) at the
#      entrance scanner, uniformly scaled + translated, all parts anchored.
#
# Idempotent: re-running first strips the previously injected instances.
# Uses lxml with strip_cdata=False so embedded <Script> CDATA is preserved.
# ──────────────────────────────────────────────────────────────────────────
import lxml.etree as ET
import os, sys

HERE   = os.path.dirname(__file__)
RBXLX  = os.path.join(HERE, "DonationCity_FINAL.rbxlx")
DEVICE = os.path.join(HERE, "assets", "fingerprint.rbxmx")

SCRIPTS = [
    ("Script",      "PalaceSystem", "PalaceSystemRef", os.path.join(HERE, "src", "PalaceSystem.server.lua"), "ServerScriptService"),
    ("LocalScript", "PalaceClient", "PalaceClientRef", os.path.join(HERE, "src", "PalaceClient.client.lua"), "StarterPlayerScripts"),
]

# fingerprint device mount (matches the scanner pad built by PalaceSystem)
DEV_TARGET = (94.7, 5.1, 28.6)
DEV_SCALE  = 2.2

PART_CLASSES = {
    'Part','UnionOperation','WedgePart','MeshPart','TrussPart',
    'CornerWedgePart','SpawnLocation','Seat','VehicleSeat','NegateOperation',
}

def name_of(item):
    props = item.find('Properties')
    if props is None:
        return ''
    for p in props:
        if p.get('name') == 'Name' and p.tag == 'string':
            return p.text or ''
    return ''

def find_service(root, cls):
    for it in root.iter('Item'):
        if it.get('class') == cls:
            return it
    return None

def set_bool(props, name, value):
    for p in props:
        if p.tag == 'bool' and p.get('name') == name:
            p.text = 'true' if value else 'false'
            return
    e = ET.SubElement(props, 'bool'); e.set('name', name)
    e.text = 'true' if value else 'false'

def make_script_item(cls, name, referent, source):
    if "]]>" in source:
        sys.exit(f"ERROR: {name} source contains ]]> which breaks CDATA")
    item = ET.Element('Item'); item.set('class', cls); item.set('referent', referent)
    props = ET.SubElement(item, 'Properties')
    nm = ET.SubElement(props, 'string'); nm.set('name', 'Name'); nm.text = name
    src = ET.SubElement(props, 'string'); src.set('name', 'Source')
    src.text = ET.CDATA(source)
    return item

def inject_scripts(root):
    for cls, name, referent, path, svc_name in SCRIPTS:
        svc = find_service(root, svc_name)
        if svc is None:
            sys.exit(f"ERROR: service {svc_name} not found")
        for ch in list(svc):
            if ch.tag == 'Item' and name_of(ch) == name:
                svc.remove(ch)
        with open(path, 'r', encoding='utf-8') as f:
            source = f.read()
        svc.append(make_script_item(cls, name, referent, source))
        print(f"injected {cls} {name} -> {svc_name} ({len(source)} chars)")

# ---- device transform (uniform scale about its own center -> world target) ----
def gf(p, t):
    e = p.find(t)
    return float(e.text) if (e is not None and e.text is not None) else 0.0

def device_center(dev_root):
    mn = [1e18, 1e18, 1e18]; mx = [-1e18, -1e18, -1e18]
    for it in dev_root.iter('Item'):
        if it.get('class') in PART_CLASSES:
            pr = it.find('Properties')
            if pr is None: continue
            cf = sz = None
            for p in pr:
                if p.tag == 'CoordinateFrame' and p.get('name') == 'CFrame': cf = p
                elif p.tag == 'Vector3' and p.get('name') in ('size','Size'): sz = p
            if cf is not None and sz is not None:
                for i, ax in enumerate(('X','Y','Z')):
                    c = gf(cf, ax); h = gf(sz, ax) / 2.0
                    mn[i] = min(mn[i], c - h); mx[i] = max(mx[i], c + h)
    return [(mn[i] + mx[i]) / 2.0 for i in range(3)]

def inject_device(root):
    if not os.path.exists(DEVICE):
        print("WARN: fingerprint device xml not found, skipping device mount")
        return
    ws = find_service(root, 'Workspace')
    for ch in list(ws):
        if ch.tag == 'Item' and name_of(ch) == 'FingerprintDevice':
            ws.remove(ch)
    parser = ET.XMLParser(strip_cdata=False, huge_tree=True)
    dev = ET.parse(DEVICE, parser).getroot()
    model = dev.find('Item')
    if model is None:
        print("WARN: device model root missing, skipping"); return
    cx, cy, cz = device_center(dev)
    S = DEV_SCALE
    off = (DEV_TARGET[0] - S*cx, DEV_TARGET[1] - S*cy, DEV_TARGET[2] - S*cz)
    nparts = 0
    for it in model.iter('Item'):
        cls = it.get('class'); pr = it.find('Properties')
        if pr is None: continue
        if cls in PART_CLASSES:
            for p in pr:
                if p.tag == 'CoordinateFrame' and p.get('name') == 'CFrame':
                    for i, ax in enumerate(('X','Y','Z')):
                        e = p.find(ax)
                        if e is not None and e.text is not None:
                            e.text = repr(S*float(e.text) + off[i])
                elif p.tag == 'Vector3' and p.get('name') in ('size','Size'):
                    for ax in ('X','Y','Z'):
                        e = p.find(ax)
                        if e is not None and e.text is not None:
                            e.text = repr(S*float(e.text))
            set_bool(pr, 'Anchored', True)
            nparts += 1
        elif cls in ('SpecialMesh','CylinderMesh','BlockMesh','FileMesh'):
            for p in pr:
                if p.tag == 'Vector3' and p.get('name') == 'Scale':
                    for ax in ('X','Y','Z'):
                        e = p.find(ax)
                        if e is not None and e.text is not None:
                            e.text = repr(S*float(e.text))
    # rename model
    mp = model.find('Properties')
    for p in mp:
        if p.get('name') == 'Name' and p.tag == 'string':
            p.text = 'FingerprintDevice'; break
    else:
        nm = ET.SubElement(mp, 'string'); nm.set('name','Name'); nm.text='FingerprintDevice'
    ws.append(model)
    print(f"mounted FingerprintDevice: {nparts} parts (scale={S}, target={DEV_TARGET})")

def main():
    parser = ET.XMLParser(strip_cdata=False, huge_tree=True, remove_blank_text=False)
    tree = ET.parse(RBXLX, parser)
    root = tree.getroot()
    inject_scripts(root)
    inject_device(root)
    tmp = RBXLX + ".tmp"
    tree.write(tmp, xml_declaration=True, encoding='utf-8')
    os.replace(tmp, RBXLX)
    print("wrote", RBXLX, os.path.getsize(RBXLX), "bytes")

if __name__ == "__main__":
    main()
