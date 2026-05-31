#!/usr/bin/env python3
# Removes the obsolete standalone "TicketHud" LocalScript from the place.
# Its left-center panel overlapped the new dock buttons. Ticket UI is now
# integrated into the box-office / store, so this HUD is redundant.
SRC = "DonationCity_FINAL.rbxlx"

with open(SRC, "r", encoding="utf-8") as f:
    data = f.read()

NAME = '<string name="Name">TicketHud</string>'
idx = data.find(NAME)
if idx == -1:
    print("TicketHud not present — nothing to remove")
else:
    start = data.rfind('<Item class="LocalScript"', 0, idx)
    cdata = data.find("<![CDATA[", start)
    cdata_end = data.find("]]>", cdata)
    item_end = data.find("</Item>", cdata_end)
    end = item_end + len("</Item>")
    # also swallow a trailing newline/indentation for cleanliness
    block = data[start:end]
    assert "TicketHud" in block, "located block is not TicketHud"
    data = data[:start] + data[end:]
    with open(SRC, "w", encoding="utf-8") as f:
        f.write(data)
    print(f"removed TicketHud LocalScript ({len(block)} chars)")
