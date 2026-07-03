#!/usr/bin/env python3
# ──────────────────────────────────────────────────────────────────────────
# Injector: موديل الكلبشات ثلاثي الأبعاد (Creator Store asset 721245449)
#   يُدرج الموديل داخل ReplicatedStorage باسم CuffModel3D ليستنسخه
#   السيرفر (شكل القيد على المكلبش) والعميل (الأداة الممسوكة باليد).
#
#   الملف الخام: assets/handcuffs_721245449.rbxmx — فُحص أمنياً: لا يحتوي
#   أي سكربت إطلاقاً (مجسمات Parts/Unions/SpecialMesh فقط).
#
# Idempotent: يزيل أي نسخة محقونة سابقاً ثم يعيد الحقن.
# ──────────────────────────────────────────────────────────────────────────
import lxml.etree as ET
import os, sys

HERE = os.path.dirname(__file__)
RBXLX = os.path.join(HERE, "DonationCity_FINAL.rbxlx")
ASSET = os.path.join(HERE, "assets", "handcuffs_721245449.rbxmx")
MODEL_NAME = "CuffModel3D"
REF_PREFIX = "CuffModel3D_"


def name_of(item):
    props = item.find('Properties')
    if props is None:
        return ''
    for p in props:
        if p.get('name') == 'Name' and p.tag == 'string':
            return p.text or ''
    return ''


def set_name(item, name):
    props = item.find('Properties')
    if props is None:
        props = ET.SubElement(item, 'Properties')
    for p in props:
        if p.get('name') == 'Name' and p.tag == 'string':
            p.text = name
            return
    nm = ET.SubElement(props, 'string')
    nm.set('name', 'Name')
    nm.text = name


def build_model_item():
    asset_root = ET.parse(ASSET, ET.XMLParser(strip_cdata=False)).getroot()
    shared = asset_root.find('SharedStrings')
    top = asset_root.find('Item')
    if top is None or top.get('class') != 'Model':
        sys.exit("ERROR: asset rbxmx top item is not a Model")

    # إزالة كاميرا الثمبنيل — لا حاجة لها داخل اللعبة
    for cam in list(top.iter('Item')):
        if cam.get('class') == 'Camera':
            cam.getparent().remove(cam)

    # أسماء واضحة للأجزاء الرئيسية: حلقتان + سلسلة
    set_name(top, MODEL_NAME)
    ring_i, chain_i = 0, 0
    for child in top:
        if child.tag != 'Item':
            continue
        if child.get('class') == 'Model':
            ring_i += 1
            set_name(child, "Ring" + ("A" if ring_i == 1 else "B"))
        elif child.get('class') == 'UnionOperation':
            chain_i += 1
            set_name(child, f"Chain{chain_i}")

    # referents فريدة كي لا تتعارض مع بقية الملف
    i = 0
    for it in top.iter('Item'):
        it.set('referent', f"{REF_PREFIX}{i}")
        i += 1
    return top, shared


def merge_shared_strings(root, asset_shared):
    """نقل SharedStrings الخاصة بالموديل (بيانات هندسة الـUnions) إلى ملف اللعبة —
    بدونها تفسد مراجع SharedString ويتعطل تحميل اللعبة."""
    if asset_shared is None:
        return
    dest = root.find('SharedStrings')
    if dest is None:
        dest = ET.SubElement(root, 'SharedStrings')
    existing = {s.get('md5') for s in dest}
    added = 0
    for s in asset_shared:
        if s.get('md5') not in existing:
            dest.append(s)
            added += 1
    print(f"merged {added} shared string(s)")


def prune_unreferenced_shared_strings(root):
    """إزالة SharedStrings غير المُشار إليها من أي خاصية بعد حذف الموديل."""
    referenced = set()
    for el in root.iter('SharedString'):
        if el.get('name') is not None and el.text:
            referenced.add(el.text.strip())
    dest = root.find('SharedStrings')
    if dest is None:
        return
    removed = 0
    for s in list(dest):
        if (s.get('md5') or '') not in referenced:
            dest.remove(s)
            removed += 1
    print(f"pruned {removed} unreferenced shared string(s)")


def main():
    remove_only = '--remove' in sys.argv
    parser = ET.XMLParser(strip_cdata=False)
    tree = ET.parse(RBXLX, parser)
    root = tree.getroot()

    rs = None
    for it in root.iter('Item'):
        if it.get('class') == 'ReplicatedStorage':
            rs = it
            break
    if rs is None:
        sys.exit("ERROR: ReplicatedStorage not found")

    for ch in list(rs):
        if ch.tag == 'Item' and (name_of(ch) == MODEL_NAME
                                 or (ch.get('referent') or '').startswith(REF_PREFIX)):
            rs.remove(ch)

    if remove_only:
        prune_unreferenced_shared_strings(root)
        tree.write(RBXLX, encoding='utf-8', xml_declaration=True)
        print(f"removed {MODEL_NAME} from ReplicatedStorage")
        return

    model, asset_shared = build_model_item()
    rs.append(model)
    merge_shared_strings(root, asset_shared)
    tree.write(RBXLX, encoding='utf-8', xml_declaration=True)
    print(f"injected {MODEL_NAME} into ReplicatedStorage")


if __name__ == '__main__':
    main()
