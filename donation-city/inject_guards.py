#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────
# Injector: Presidential Palace guards.
#   1) Builds a "GuardCap" template (the bearskin hat from the audited store
#      model 6875688893) baked into HEAD-LOCAL coordinates, so it welds cleanly
#      onto any standard R6 head at runtime. Strips the model's Humanoid / joints
#      / scripts (incl. the kill-on-touch "Damage" script) — only clean visual
#      geometry is kept. Injected under ServerStorage.
#   2) Adds/updates Script "GuardSystem" in ServerScriptService
#      (source = src/GuardSystem.server.lua).
#
# Idempotent: re-running first strips previously injected instances.
# Uses lxml with strip_cdata=False so embedded <Script> CDATA is preserved.
# ──────────────────────────────────────────────────────────────────────────
import lxml.etree as ET
import os, sys

HERE  = os.path.dirname(__file__)
RBXLX = os.path.join(HERE, "DonationCity_FINAL.rbxlx")
GUARD = os.path.join(HERE, "assets", "guard.rbxmx")
GSRC  = os.path.join(HERE, "src", "GuardSystem.server.lua")

PART_CLASSES = {
    'Part', 'UnionOperation', 'WedgePart', 'MeshPart', 'TrussPart',
    'CornerWedgePart', 'NegateOperation',
}
# children of a part that we keep (pure visuals); everything else is dropped
KEEP_CHILD = {'SpecialMesh', 'CylinderMesh', 'BlockMesh', 'FileMesh', 'Decal', 'Texture'}


def name_of(item):
    props = item.find('Properties')
    if props is None:
        return ''
    for p in props:
        if p.get('name') == 'Name' and p.tag in ('string', 'ProtectedString'):
            return p.text or ''
    return ''


def find_service(root, cls):
    for it in root.iter('Item'):
        if it.get('class') == cls:
            return it
    return None


def gf(cf, t):
    e = cf.find(t)
    return float(e.text) if (e is not None and e.text is not None) else 0.0


def get_cframe(props):
    for p in props:
        if p.tag == 'CoordinateFrame' and p.get('name') == 'CFrame':
            return p
    return None


def matT(R):                       # transpose 3x3 (row-major flat 9)
    return [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]


def matmul(A, B):                  # 3x3 * 3x3 (row-major)
    out = [0.0] * 9
    for i in range(3):
        for j in range(3):
            out[i * 3 + j] = sum(A[i * 3 + k] * B[k * 3 + j] for k in range(3))
    return out


def matvec(A, v):                  # 3x3 * vec3
    return [sum(A[i * 3 + k] * v[k] for k in range(3)) for i in range(3)]


def read_cf(cf):
    p = (gf(cf, 'X'), gf(cf, 'Y'), gf(cf, 'Z'))
    R = [gf(cf, 'R00'), gf(cf, 'R01'), gf(cf, 'R02'),
         gf(cf, 'R10'), gf(cf, 'R11'), gf(cf, 'R12'),
         gf(cf, 'R20'), gf(cf, 'R21'), gf(cf, 'R22')]
    return p, R


def write_cf(cf, p, R):
    vals = {'X': p[0], 'Y': p[1], 'Z': p[2],
            'R00': R[0], 'R01': R[1], 'R02': R[2],
            'R10': R[3], 'R11': R[4], 'R12': R[5],
            'R20': R[6], 'R21': R[7], 'R22': R[8]}
    for k, v in vals.items():
        e = cf.find(k)
        if e is None:
            e = ET.SubElement(cf, k)
        e.text = repr(v)


def set_bool(props, name, value):
    for p in props:
        if p.tag == 'bool' and p.get('name') == name:
            p.text = 'true' if value else 'false'
            return
    e = ET.SubElement(props, 'bool'); e.set('name', name)
    e.text = 'true' if value else 'false'


def build_cap(root):
    parser = ET.XMLParser(strip_cdata=False, huge_tree=True)
    g = ET.parse(GUARD, parser).getroot()

    # head CFrame
    head_cf = None
    for it in g.iter('Item'):
        if it.get('class') == 'Part' and name_of(it) == 'Head':
            head_cf = get_cframe(it.find('Properties'))
            break
    if head_cf is None:
        sys.exit("ERROR: head not found in guard model")
    hp, hR = read_cf(head_cf)
    hRt = matT(hR)

    # locate the "Cap" model
    cap_model = None
    for it in g.iter('Item'):
        if it.get('class') == 'Model' and name_of(it) == 'Cap':
            cap_model = it
            break
    if cap_model is None:
        sys.exit("ERROR: 'Cap' model not found in guard model")

    new_cap = ET.Element('Item'); new_cap.set('class', 'Model'); new_cap.set('referent', 'GuardCapModel')
    cprops = ET.SubElement(new_cap, 'Properties')
    nm = ET.SubElement(cprops, 'string'); nm.set('name', 'Name'); nm.text = 'GuardCap'

    n = 0
    for it in list(cap_model.iter('Item')):
        if it.get('class') not in PART_CLASSES:
            continue
        props = it.find('Properties')
        cf = get_cframe(props) if props is not None else None
        if cf is None:
            continue
        # head-local transform: local = inverse(head) * part
        pp, pR = read_cf(cf)
        dp = [pp[0] - hp[0], pp[1] - hp[1], pp[2] - hp[2]]
        lp = matvec(hRt, dp)
        lR = matmul(hRt, pR)

        part = ET.Element('Item'); part.set('class', it.get('class'))
        part.set('referent', f'GuardCapPart_{n}')
        pprops = ET.SubElement(part, 'Properties')
        # copy scalar/visual props, drop Refs and joints
        for p in props:
            if p.tag == 'Ref':
                continue
            pprops.append(_clone(p))
        ncf = get_cframe(pprops)
        if ncf is None:
            ncf = ET.SubElement(pprops, 'CoordinateFrame'); ncf.set('name', 'CFrame')
        write_cf(ncf, lp, lR)
        set_bool(pprops, 'Anchored', False)
        set_bool(pprops, 'CanCollide', False)
        # keep only visual children (meshes/decals/textures)
        for ch in it.findall('Item'):
            if ch.get('class') in KEEP_CHILD:
                part.append(_clone(ch))
        new_cap.append(part)
        n += 1

    print(f"GuardCap: baked {n} visual parts (head-local), joints/scripts/Humanoid stripped")
    return new_cap


def _clone(el):
    # deep copy via serialize/parse to detach from source tree
    return ET.fromstring(ET.tostring(el))


def inject_cap(root):
    ss = find_service(root, 'ServerStorage')
    if ss is None:
        ws = find_service(root, 'Workspace')
        parent = ws.getparent() if ws is not None else root
        ss = ET.Element('Item'); ss.set('class', 'ServerStorage'); ss.set('referent', 'GuardServerStorage')
        ET.SubElement(ss, 'Properties')
        parent.append(ss)         # services are direct children of <roblox>
        print("created ServerStorage service")
    for ch in list(ss):
        if ch.tag == 'Item' and name_of(ch) == 'GuardCap':
            ss.remove(ch)
    ss.append(build_cap(root))


def make_script_item(cls, name, referent, source):
    if "]]>" in source:
        sys.exit(f"ERROR: {name} source contains ]]> which breaks CDATA")
    item = ET.Element('Item'); item.set('class', cls); item.set('referent', referent)
    props = ET.SubElement(item, 'Properties')
    nm = ET.SubElement(props, 'string'); nm.set('name', 'Name'); nm.text = name
    src = ET.SubElement(props, 'string'); src.set('name', 'Source')
    src.text = ET.CDATA(source)
    return item


def inject_script(root):
    sss = find_service(root, 'ServerScriptService')
    if sss is None:
        sys.exit("ERROR: ServerScriptService not found")
    for ch in list(sss):
        if ch.tag == 'Item' and name_of(ch) == 'GuardSystem':
            sss.remove(ch)
    with open(GSRC, 'r', encoding='utf-8') as f:
        source = f.read()
    sss.append(make_script_item('Script', 'GuardSystem', 'GuardSystemRef', source))
    print(f"injected Script GuardSystem -> ServerScriptService ({len(source)} chars)")


def main():
    parser = ET.XMLParser(strip_cdata=False, huge_tree=True, remove_blank_text=False)
    tree = ET.parse(RBXLX, parser)
    root = tree.getroot()
    inject_cap(root)
    inject_script(root)
    tmp = RBXLX + ".tmp"
    tree.write(tmp, xml_declaration=True, encoding='utf-8')
    os.replace(tmp, RBXLX)
    print("wrote", RBXLX, os.path.getsize(RBXLX), "bytes")


if __name__ == "__main__":
    main()
