#!/usr/bin/env python3
# يزيل موديل ParkourCourse الثابت المستورد (Obby القديم) من ملف اللعبة.
# نظام الباركور الجديد يبني مساره بالكامل برمجياً داخل ParkourSystem.server.lua،
# فلا حاجة للموديل الثابت (270 قطعة + 41 سكربت داخلية). idempotent: يعمل مرة واحدة.
import re
import sys
import shutil
import os

SRC = "DonationCity_FINAL.rbxlx"

with open(SRC, "r", encoding="utf-8") as f:
    data = f.read()

needle = '<string name="Name">ParkourCourse</string>'
idx = data.find(needle)
if idx == -1:
    print("ParkourCourse model already absent — nothing to do.")
    sys.exit(0)

# افتح وسم <Item class="Model"...> الأقرب قبل اسم الموديل
opn = data.rfind('<Item class="Model"', 0, idx)
if opn == -1:
    sys.exit("ERROR: could not find opening <Item class=\"Model\"> for ParkourCourse")

# جد </Item> المطابق عبر عدّ العمق
depth = 0
endpos = None
for m in re.finditer(r"<Item\b|</Item>", data[opn:]):
    if m.group() == "</Item>":
        depth -= 1
        if depth == 0:
            endpos = opn + m.end()
            break
    else:
        depth += 1

if endpos is None:
    sys.exit("ERROR: could not find matching </Item> for ParkourCourse model")

# تخلّص من أي مسافات بيضاء/سطر زائد بعد الإغلاق
tail = data[endpos:]
tail = re.sub(r"^[ \t]*\n", "", tail, count=1)
removed = endpos - opn
new_data = data[:opn] + tail

if os.path.exists(SRC):
    shutil.copy(SRC, SRC + ".bak")
tmp = SRC + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    f.write(new_data)
os.replace(tmp, SRC)
print(f"removed ParkourCourse model: {removed} bytes  ({len(data)} -> {len(new_data)})")
