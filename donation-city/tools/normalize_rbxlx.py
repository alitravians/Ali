#!/usr/bin/env python3
"""Normalize legacy Roblox ContentId props (<string> / <Content><url>)
into modern <Content><uri>/<null> form."""
import sys
from lxml import etree as ET

if len(sys.argv) != 3:
    raise SystemExit("usage: normalize_rbxlx.py <input.rbxlx> <output.rbxlx>")

SRC = sys.argv[1]
DST = sys.argv[2]

CONTENT_PROPS = {
    "FallbackImage", "AnimationId", "Asset", "TextureId", "TextureID",
    "CageMeshId", "Texture", "BaseTextureId", "MeshId", "CursorIcon",
    "ColorMap", "MetalnessMap", "NormalMap", "RoughnessMap",
    "ActivatedCursorIcon", "HoverImage", "Image", "PressedImage", "Icon",
    "PackageId", "CameraButtonIcon", "BottomImage", "MidImage", "TopImage",
    "MoonTextureId", "SkyboxBk", "SkyboxDn", "SkyboxFt", "SkyboxLf",
    "SkyboxRt", "SkyboxUp", "SunTextureId", "SoundId", "MouseIcon", "Video",
    "ReferenceMeshId",
    "PantsTemplate", "ShirtTemplate", "TexturePack", "MeshContent",
    "TextureContent",
}

parser = ET.XMLParser(strip_cdata=False, huge_tree=True, remove_blank_text=False)
tree = ET.parse(SRC, parser)
root = tree.getroot()

converted_string = 0
converted_url = 0

for el in list(root.iter()):
    name = el.get("name")
    if name not in CONTENT_PROPS:
        continue
    if el.tag == "string":
        val = (el.text or "").strip()
        c = ET.Element("Content")
        c.set("name", name)
        if val:
            u = ET.SubElement(c, "uri")
            u.text = val
        else:
            ET.SubElement(c, "null")
        el.getparent().replace(el, c)
        converted_string += 1
    elif el.tag == "Content":
        for child in list(el):
            if child.tag == "url":
                val = (child.text or "").strip()
                if val:
                    child.tag = "uri"
                else:
                    el.remove(child)
                    ET.SubElement(el, "null")
                converted_url += 1

print(f"string->Content: {converted_string}, url->uri: {converted_url}")

with open(DST, "wb") as f:
    f.write(ET.tostring(root, encoding="utf-8", xml_declaration=False, pretty_print=False))
