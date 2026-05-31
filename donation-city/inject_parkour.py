#!/usr/bin/env python3
# Injects ParkourSystem (Script, after BeachArea) and ParkourClient (LocalScript,
# after CinemaClient) into the rbxlx. Idempotent.
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

# 1) ParkourSystem (server) after BeachArea
if 'referent="ParkourSystemRef"' not in d:
    src = read("src/ParkourSystem.server.lua")
    at = item_end_after(d, "BeachAreaRef")
    d = d[:at] + make_item("Script", "ParkourSystemRef", "ParkourSystem", src, 4) + d[at:]
    print("Injected ParkourSystem (%d chars)" % len(src))
else:
    print("ParkourSystem already present")

# 2) ParkourClient (LocalScript) after CinemaClient
if 'referent="ParkourClientRef"' not in d:
    src = read("src/ParkourClient.client.lua")
    at = item_end_after(d, "CinemaClientRef")
    d = d[:at] + make_item("LocalScript", "ParkourClientRef", "ParkourClient", src, 6) + d[at:]
    print("Injected ParkourClient (%d chars)" % len(src))
else:
    print("ParkourClient already present")

with open(RBXLX, "w", encoding="utf-8") as f:
    f.write(d)
print("File now %d bytes." % len(d.encode("utf-8")))
