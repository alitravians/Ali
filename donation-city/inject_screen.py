#!/usr/bin/env python3
# Adds a "CustomImageScreen" SurfaceGui on the TOP face of the city's main
# SpawnLocation pad (the glowing light-cyan square at ~(0,1.3,60) the user
# pointed at) so a custom user image can be displayed on it. Idempotent:
# removes any prior CustomImageScreen on that part before re-adding.
#
# The user's image (93628047304202) is a Decal asset, which does NOT render
# directly in an ImageLabel. So this static SurfaceGui starts as a dark screen
# with a brief "loading" hint, and CinemaServices.server.lua resolves the decal
# to its real Texture (via InsertService, reusing the loading-screen resolver)
# and assigns it to this screen's Image at runtime — replicating to all clients.
# IMAGE_ASSET_ID below is kept for documentation/reference only.
import sys
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SCREEN_NAME = "CustomImageScreen"
IMAGE_ASSET_ID = "93628047304202"   # user's uploaded image (Decal; resolved server-side)

P = etree.XMLParser(strip_cdata=False, huge_tree=True)
tree = etree.parse(MAIN, P)
root = tree.getroot()
ws = next(it for it in root.iter("Item") if it.get("class") == "Workspace")


def name_of(it):
    return it.findtext("Properties/string[@name='Name']") or ""


# locate the main SpawnLocation pad (top-level child of Workspace).
pad = None
for it in ws.findall("Item"):
    if it.get("class") in ("SpawnLocation", "Part") and name_of(it) == "SpawnLocation":
        pad = it
        break
if pad is None:
    # fall back to the known glowing pad by referent
    for it in ws.iter("Item"):
        if it.get("referent") == "348":
            pad = it
            break
if pad is None:
    sys.exit("ERROR: SpawnLocation pad not found")
print("pad:", name_of(pad), pad.get("class"), "ref", pad.get("referent"))

# idempotent: drop any prior screen we added.
removed = 0
for c in list(pad):
    if c.tag == "Item" and c.get("class") == "SurfaceGui" and name_of(c) == SCREEN_NAME:
        pad.remove(c)
        removed += 1
print(f"removed {removed} prior '{SCREEN_NAME}'")


def el(parent, tag, name=None, text=None):
    e = etree.SubElement(parent, tag)
    if name is not None:
        e.set("name", name)
    if text is not None:
        e.text = text
    return e


def udim2(props, name, xs, xo, ys, yo):
    u = el(props, "UDim2", name)
    el(u, "XS", text=str(xs)); el(u, "XO", text=str(xo))
    el(u, "YS", text=str(ys)); el(u, "YO", text=str(yo))
    return u


def color_uint(r, g, b):
    return str((r << 16) | (g << 8) | b)


REF = ["SCREEN%04d" % i for i in range(100)]
ri = [0]
def nref():
    ri[0] += 1
    return "SCREEN%04d" % ri[0]

# ---- SurfaceGui ----
sg = etree.SubElement(pad, "Item"); sg.set("class", "SurfaceGui"); sg.set("referent", nref())
p = el(sg, "Properties")
el(p, "string", "Name", SCREEN_NAME)
el(p, "token", "Face", "1")            # NormalId.Top
el(p, "bool", "Enabled", "true")
el(p, "float", "LightInfluence", "0")  # full-bright image (ignores world light)
el(p, "bool", "AlwaysOnTop", "false")
el(p, "token", "SizingMode", "1")      # PixelsPerStud
el(p, "float", "PixelsPerStud", "50")
el(p, "bool", "ResetOnSpawn", "false")

# ---- ImageLabel (fills the surface) ----
img = etree.SubElement(sg, "Item"); img.set("class", "ImageLabel"); img.set("referent", nref())
pi = el(img, "Properties")
el(pi, "string", "Name", "Image")
udim2(pi, "Size", 1, 0, 1, 0)
udim2(pi, "Position", 0, 0, 0, 0)
el(pi, "Color3uint8", "BackgroundColor3", color_uint(18, 38, 66))
el(pi, "float", "BackgroundTransparency", "0")   # dark screen until server resolves the decal
el(pi, "token", "ScaleType", "4")      # Crop: fills the square fully, no distortion
img_content = el(pi, "Content", "Image")
el(img_content, "null")               # server sets the resolved Texture at runtime

# ---- placeholder hint (hidden once a real image is set) ----
hint = etree.SubElement(img, "Item"); hint.set("class", "TextLabel"); hint.set("referent", nref())
ph = el(hint, "Properties")
el(ph, "string", "Name", "Hint")
udim2(ph, "Size", 1, 0, 1, 0)
udim2(ph, "Position", 0, 0, 0, 0)
el(ph, "float", "BackgroundTransparency", "1")
el(ph, "bool", "Visible", "true")     # server hides this once the image is applied
el(ph, "Color3uint8", "TextColor3", color_uint(225, 245, 255))
el(ph, "bool", "TextScaled", "true")
el(ph, "string", "Text", "🖼️ جارٍ تحميل صورتك...")

tree.write(MAIN, encoding="utf-8", xml_declaration=False)
print("wrote", MAIN, "| image asset id:", IMAGE_ASSET_ID or "(placeholder)")
