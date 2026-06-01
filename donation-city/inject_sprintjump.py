#!/usr/bin/env python3
# Injects ActivitySystem (Script, after VolleyballSystem) and SprintJump
# (LocalScript, after ParkourClient) into the rbxlx. Idempotent.
import sys

RBXLX = "DonationCity_FINAL.rbxlx"

def read(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

d = read(RBXLX)

def item_end_after(text, ref):
    i = text.find('referent="%s"' % ref)
    if i == -1:
        sys.exit("ERROR: ref %s not found" % ref)
    cdata = text.find("]]></string>", i)
    if cdata == -1:
        sys.exit("ERROR: cdata end not found for %s" % ref)
    ie = text.find("</Item>", cdata)
    if ie == -1:
        sys.exit("ERROR: </Item> not found for %s" % ref)
    return ie + len("</Item>")

def make_item(cls, ref, name, src, indent):
    if "]]>" in src:
        sys.exit("ERROR: source for %s contains ]]>" % name)
    pad = " " * indent
    inner = " " * (indent + 2)
    inner2 = " " * (indent + 4)
    return (
        "\n%s<Item class=\"%s\" referent=\"%s\">\n" % (pad, cls, ref)
        + "%s<Properties>\n" % inner
        + "%s<string name=\"Name\">%s</string>\n" % (inner2, name)
        + "%s<string name=\"Source\"><![CDATA[%s]]></string>\n" % (inner2, src)
        + "%s</Properties>\n" % inner
        + "%s</Item>" % pad
    )

# 1) ActivitySystem (server) after PlaygroundArea
#    (was anchored after VolleyballSystem, but volleyball was removed from the game)
if 'referent="ActivitySystemRef"' not in d:
    src = read("src/ActivitySystem.server.lua")
    at = item_end_after(d, "PlaygroundAreaRef")
    d = d[:at] + make_item("Script", "ActivitySystemRef", "ActivitySystem", src, 4) + d[at:]
    print("Injected ActivitySystem (%d chars)" % len(src))
else:
    print("ActivitySystem already present")

# 2) SprintJump (LocalScript) after ParkourClient
if 'referent="SprintJumpRef"' not in d:
    src = read("src/SprintJump.client.lua")
    at = item_end_after(d, "ParkourClientRef")
    d = d[:at] + make_item("LocalScript", "SprintJumpRef", "SprintJump", src, 6) + d[at:]
    print("Injected SprintJump (%d chars)" % len(src))
else:
    print("SprintJump already present")

with open(RBXLX, "w", encoding="utf-8") as f:
    f.write(d)
print("File now %d bytes." % len(d.encode("utf-8")))
