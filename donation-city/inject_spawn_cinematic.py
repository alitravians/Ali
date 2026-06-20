#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────
# Injector: Royal PUBG-style spawn cinematic (الريسبون الملكي).
#   1) Adds/updates Script  "SpawnCinematic" in ServerScriptService
#      (source = src/SpawnCinematic.server.lua).
#   2) Adds/updates LocalScript "SpawnCinematic" in
#      StarterPlayer.StarterPlayerScripts (source = src/SpawnCinematic.client.lua).
#
# Idempotent: re-running first strips the previously injected instances.
# Uses lxml with strip_cdata=False so embedded <Script> CDATA is preserved.
# After injecting, build_all.py keeps the embedded sources in sync via markers.
# ──────────────────────────────────────────────────────────────────────────
import lxml.etree as ET
import os, sys

HERE  = os.path.dirname(__file__)
RBXLX = os.path.join(HERE, "DonationCity_FINAL.rbxlx")

SCRIPTS = [
    ("Script",      "SpawnCinematic", "SpawnCinematicServerRef",
     os.path.join(HERE, "src", "SpawnCinematic.server.lua"), "ServerScriptService"),
    ("LocalScript", "SpawnCinematic", "SpawnCinematicClientRef",
     os.path.join(HERE, "src", "SpawnCinematic.client.lua"), "StarterPlayerScripts"),
]


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


def make_script_item(cls, name, referent, source):
    if "]]>" in source:
        sys.exit(f"ERROR: {name} source contains ]]> which breaks CDATA")
    item = ET.Element('Item'); item.set('class', cls); item.set('referent', referent)
    props = ET.SubElement(item, 'Properties')
    nm = ET.SubElement(props, 'string'); nm.set('name', 'Name'); nm.text = name
    # RunContext=0 (Legacy) هو الافتراضي، لكن نكتبه صراحةً ليطابق بقية السكربتات في الملف
    # (Script في السيرفر، LocalScript في العميل) ويتجنّب لبس أدوات الـdiff/التحويل لاحقاً.
    rc = ET.SubElement(props, 'token'); rc.set('name', 'RunContext'); rc.text = '0'
    src = ET.SubElement(props, 'string'); src.set('name', 'Source')
    src.text = ET.CDATA(source)
    return item


def inject_scripts(root):
    for cls, name, referent, path, svc_name in SCRIPTS:
        svc = find_service(root, svc_name)
        if svc is None:
            sys.exit(f"ERROR: service {svc_name} not found")
        for ch in list(svc):
            if ch.tag == 'Item' and ch.get('class') == cls and name_of(ch) == name:
                svc.remove(ch)
        with open(path, 'r', encoding='utf-8') as f:
            source = f.read()
        svc.append(make_script_item(cls, name, referent, source))
        print(f"injected {cls} {name} -> {svc_name} ({len(source)} chars)")


def main():
    parser = ET.XMLParser(strip_cdata=False, huge_tree=True, remove_blank_text=False)
    tree = ET.parse(RBXLX, parser)
    root = tree.getroot()
    inject_scripts(root)
    tmp = RBXLX + ".tmp"
    tree.write(tmp, xml_declaration=True, encoding='utf-8')
    os.replace(tmp, RBXLX)
    print("wrote", RBXLX, os.path.getsize(RBXLX), "bytes")


if __name__ == "__main__":
    main()
