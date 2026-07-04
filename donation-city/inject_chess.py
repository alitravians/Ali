#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────
# Injector: لعبة الشطرنج ثلاثية الأبعاد (Chess) — Script واحد إلى
#   ServerScriptService (source = src/Chess.server.lua).
#   يبني لوحاً 8×8 احترافياً في «منطقة الشطرنج» بقطع Staunton مجسّمة
#   (FBX عبر Open Cloud) مع محرّك شطرنج لوا مُتحقَّق منه perft.
#
# Idempotent: إعادة التشغيل تزيل النسخة المحقونة سابقاً أولاً.
# بعد الحقن، build_all.py يبقي المصدر متزامناً عبر العلامة (marker).
# ──────────────────────────────────────────────────────────────────────────
import lxml.etree as ET
import os, sys, shutil

HERE = os.path.dirname(__file__)
RBXLX = os.path.join(HERE, "DonationCity_FINAL.rbxlx")

SCRIPTS = [
    ("Script", "Chess", "ChessServerRef",
     os.path.join(HERE, "src", "Chess.server.lua"), "ServerScriptService", "0"),
    ("LocalScript", "ChessClient", "ChessClientRef",
     os.path.join(HERE, "src", "ChessClient.client.lua"), "StarterPlayerScripts", None),
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


def make_script_item(cls, name, referent, source, run_context):
    if "]]>" in source:
        sys.exit(f"ERROR: {name} source contains ]]> which breaks CDATA")
    item = ET.Element('Item'); item.set('class', cls); item.set('referent', referent)
    props = ET.SubElement(item, 'Properties')
    nm = ET.SubElement(props, 'string'); nm.set('name', 'Name'); nm.text = name
    if run_context is not None:
        rc = ET.SubElement(props, 'token'); rc.set('name', 'RunContext'); rc.text = run_context
    src = ET.SubElement(props, 'string'); src.set('name', 'Source')
    src.text = ET.CDATA(source)
    return item


def inject_scripts(root):
    for cls, name, referent, path, svc_name, run_context in SCRIPTS:
        svc = find_service(root, svc_name)
        if svc is None:
            sys.exit(f"ERROR: service {svc_name} not found")
        for ch in list(svc):
            if ch.tag == 'Item' and ch.get('class') == cls and \
               (name_of(ch) == name or ch.get('referent') == referent):
                svc.remove(ch)
        with open(path, 'r', encoding='utf-8') as f:
            source = f.read()
        svc.append(make_script_item(cls, name, referent, source, run_context))
        print(f"injected {cls} {name} -> {svc_name} ({len(source)} chars)")


def main():
    parser = ET.XMLParser(strip_cdata=False, huge_tree=True, remove_blank_text=False)
    tree = ET.parse(RBXLX, parser)
    root = tree.getroot()
    inject_scripts(root)
    if os.path.exists(RBXLX):
        shutil.copy(RBXLX, RBXLX + ".bak")
    tmp = RBXLX + ".tmp"
    tree.write(tmp, xml_declaration=True, encoding='utf-8')
    os.replace(tmp, RBXLX)
    print("wrote", RBXLX, os.path.getsize(RBXLX), "bytes")


if __name__ == "__main__":
    main()
