#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────
# Injector: Presidential Palace guards.
#   1) Removes any previously-injected "GuardCap" template from ServerStorage.
#      The guards now build their bearskin cap from simple primitives at
#      runtime (GuardSystem.server.lua), so no fragile baked Union template is
#      needed — this also drops the scatter-prone 15-part hat.
#   2) Adds/updates Script "GuardSystem" in ServerScriptService
#      (source = src/GuardSystem.server.lua).
#   3) Repairs every dangling SharedString reference in the place (palace /
#      fingerprint Union meshes) so Studio can open the file.
#
# Idempotent. Uses lxml with strip_cdata=False so embedded <Script> CDATA is
# preserved.
# ──────────────────────────────────────────────────────────────────────────
import lxml.etree as ET
import os, sys

HERE  = os.path.dirname(__file__)
RBXLX = os.path.join(HERE, "DonationCity_FINAL.rbxlx")
GSRC  = os.path.join(HERE, "src", "GuardSystem.server.lua")

# Models whose Union/Mesh parts were injected into the place. Their mesh/CSG
# blobs live in a top-level <SharedStrings> block keyed by md5; the backing data
# must be present or Studio fails to open the file. Pull any missing blob here.
SHARED_SOURCES = [
    os.path.join(HERE, "assets", "palace1.rbxmx"),
    os.path.join(HERE, "assets", "fingerprint.rbxmx"),
]


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


def _clone(el):
    # deep copy via serialize/parse to detach from source tree
    return ET.fromstring(ET.tostring(el))


def remove_guard_cap(root):
    ss = find_service(root, 'ServerStorage')
    if ss is None:
        return
    removed = 0
    for ch in list(ss):
        if ch.tag == 'Item' and name_of(ch) == 'GuardCap':
            ss.remove(ch); removed += 1
    if removed:
        print(f"removed {removed} stale GuardCap template(s) from ServerStorage")


def merge_shared_strings(root):
    parser = ET.XMLParser(strip_cdata=False, huge_tree=True)
    src_map = {}
    for path in SHARED_SOURCES:
        if not os.path.exists(path):
            continue
        g = ET.parse(path, parser).getroot()
        blk = g.find('SharedStrings')
        if blk is None:
            continue
        for s in blk.findall('SharedString'):
            md5 = s.get('md5')
            if md5 and md5 not in src_map:
                src_map[md5] = s

    # all md5s referenced anywhere in the place
    needed = set()
    for sref in root.iter('SharedString'):
        if sref.get('name') is not None and sref.text:
            needed.add(sref.text.strip())

    dst = root.find('SharedStrings')
    if dst is None:
        dst = ET.SubElement(root, 'SharedStrings')
        print("created SharedStrings block in target")
    existing = {s.get('md5') for s in dst.findall('SharedString')}

    added, missing = 0, []
    for md5 in needed:
        if md5 in existing:
            continue
        if md5 in src_map:
            dst.append(_clone(src_map[md5]))
            existing.add(md5)
            added += 1
        else:
            missing.append(md5)
    print(f"SharedStrings: {len(needed)} referenced, {added} repaired from asset models")
    if missing:
        sys.exit(f"ERROR: {len(missing)} referenced SharedStrings not found in any asset: {missing}")


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
    remove_guard_cap(root)
    merge_shared_strings(root)
    inject_script(root)
    tmp = RBXLX + ".tmp"
    tree.write(tmp, xml_declaration=True, encoding='utf-8')
    os.replace(tmp, RBXLX)
    print("wrote", RBXLX, os.path.getsize(RBXLX), "bytes")


if __name__ == "__main__":
    main()
