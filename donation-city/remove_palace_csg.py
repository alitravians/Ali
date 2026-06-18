#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────
# Remove the ready-made CSG/Union models that produced "checkered cubes" in
# Studio (their embedded mesh blobs sometimes fail to load and render as a
# checkerboard placeholder). The palace exterior shell + the fingerprint
# console are now built from native Roblox primitives at runtime inside
# src/PalaceSystem.server.lua, so these baked models are no longer needed.
#
#   1) Strips Workspace > Model "PresidentialPalace"  (CSG palace).
#   2) Strips Workspace > Model "FingerprintDevice"   (CSG scanner).
#   3) Prunes any <SharedString> blob that is no longer referenced anywhere
#      (the Union mesh data), which also greatly shrinks the .rbxlx.
#
# Idempotent. Uses lxml with strip_cdata=False so embedded <Script> CDATA is
# preserved.
# ──────────────────────────────────────────────────────────────────────────
import lxml.etree as ET
import os

HERE  = os.path.dirname(__file__)
RBXLX = os.path.join(HERE, "DonationCity_FINAL.rbxlx")
REMOVE_NAMES = {"PresidentialPalace", "FingerprintDevice"}


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


def remove_models(root):
    ws = find_service(root, 'Workspace')
    if ws is None:
        print("WARN: Workspace not found")
        return 0
    removed = 0
    for ch in list(ws):
        if ch.tag == 'Item' and name_of(ch) in REMOVE_NAMES:
            ws.remove(ch)
            removed += 1
            print(f"removed Workspace model: {name_of(ch) or '?'}")
    return removed


def prune_shared_strings(root):
    block = root.find('SharedStrings')
    if block is None:
        return 0
    # md5s still referenced by any remaining instance (<SharedString name="..">md5</..>)
    needed = set()
    for ref in root.iter('SharedString'):
        if ref.get('name') is not None and ref.text:
            needed.add(ref.text.strip())
    pruned = 0
    for s in list(block.findall('SharedString')):
        if s.get('md5') not in needed:
            block.remove(s)
            pruned += 1
    print(f"SharedStrings: {len(needed)} still referenced, pruned {pruned} orphaned blob(s)")
    return pruned


def main():
    parser = ET.XMLParser(strip_cdata=False, huge_tree=True, remove_blank_text=False)
    tree = ET.parse(RBXLX, parser)
    root = tree.getroot()
    n = remove_models(root)
    prune_shared_strings(root)
    tmp = RBXLX + ".tmp"
    tree.write(tmp, xml_declaration=True, encoding='utf-8')
    os.replace(tmp, RBXLX)
    print(f"removed {n} model(s); wrote {RBXLX} ({os.path.getsize(RBXLX)} bytes)")


if __name__ == "__main__":
    main()
