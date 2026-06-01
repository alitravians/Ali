#!/usr/bin/env python3
# CDATA-preserving (lxml) insertion of the cinema-guide character model
# ("Black Mesa Scientist", user-supplied Creator Store asset) as a hidden
# TEMPLATE under ServerScriptService, named "CinemaGuideModel".
#
# The model is fully CLEAN (audited: zero Script/LocalScript/ModuleScript, zero
# loadstring/getfenv/HttpGet/require-by-id), so per the project integration rule
# we adopt it AS-IS — we do NOT strip anything and we do NOT add game logic
# inside it. The guide behaviour (name tag + ProximityPrompt + Arabic dialog +
# idle sway) lives in our own CinemaSystem.server.lua, which clones this template
# and positions it at the cinema entrance.
#
# Why a ServerScriptService template (not Workspace): the guide's world position
# is computed at runtime from the gate, so we keep a single source of truth in
# the server script and clone the template into place. A ServerScriptService
# child never replicates/renders, so there is no stray model at the origin.
#
# Idempotent: re-running removes any previous "CinemaGuideModel" first.
import sys, copy, re
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SRC  = "guide_scientist.rbxmx"
MODEL_NAME = "CinemaGuideModel"
PREF = "GUIDE_"   # unique referent prefix to avoid clashes with the main file

BASEPARTS = {"Part", "MeshPart", "WedgePart", "CornerWedgePart", "TrussPart",
             "UnionOperation", "Seat", "VehicleSeat"}
# Substring backdoor / remote-code-execution patterns (dynamic code + remote IO).
MALICIOUS = ("loadstring", "getfenv", "setfenv", "HttpGet", "HttpGetAsync",
             "GetObjects", "InsertService")
# require(...) in ANY Lua calling convention: require(x), require"x", require'x',
# require[[x]] (no parentheses), plus aliasing (`local r = require`). Catches the
# require-by-asset-id backdoor family even when obfuscated.
REQUIRE_RX = re.compile(r"""require\s*[(\"'\[]|=\s*require\b""")
SCRIPTY = {"Script", "LocalScript", "ModuleScript"}

P = etree.XMLParser(strip_cdata=False, huge_tree=True)


def set_prop_bool(item, name, value):
    """Set/insert a <bool name=...> in the item's own <Properties>."""
    props = item.find("Properties")
    if props is None:
        props = etree.SubElement(item, "Properties")
    el = props.find(f"./bool[@name='{name}']")
    if el is None:
        el = etree.SubElement(props, "bool")
        el.set("name", name)
    el.text = "true" if value else "false"


def audit(model):
    """Fail loudly if the supposedly-clean model hides scripts / backdoors."""
    bad = []
    for it in model.iter("Item"):
        if it.get("class") in SCRIPTY:
            bad.append(f"script:{it.get('class')}")
    raw = etree.tostring(model, encoding="unicode")
    for pat in MALICIOUS:
        if pat.lower() in raw.lower():
            bad.append(f"pattern:{pat}")
    if REQUIRE_RX.search(raw):
        bad.append("pattern:require")
    return bad


def reprefix(model):
    """Make every referent in the model unique and keep all <Ref>/joint links valid."""
    mapping = {}
    for it in model.iter("Item"):
        r = it.get("referent")
        if r:
            mapping[r] = PREF + r
            it.set("referent", PREF + r)
    for ref in model.iter("Ref"):
        if ref.text and ref.text.strip() in mapping:
            ref.text = mapping[ref.text.strip()]
    return mapping


def main():
    tree = etree.parse(MAIN, P)
    root = tree.getroot()

    src_root = etree.parse(SRC, P).getroot()
    model = next((it for it in src_root.iter("Item") if it.get("class") == "Model"), None)
    if model is None:
        sys.exit("ERROR: no Model item found in " + SRC)
    model = copy.deepcopy(model)

    bad = audit(model)
    if bad:
        sys.exit("ABORT: model is not clean — found: " + ", ".join(bad))
    print("audit: CLEAN (no scripts / no backdoor patterns) -> adopting AS-IS")

    # name + unique referents
    nm = model.find("./Properties/string[@name='Name']")
    if nm is None:
        nm = etree.SubElement(model.find("Properties"), "string"); nm.set("name", "Name")
    nm.text = MODEL_NAME
    reprefix(model)

    # static display: anchor every BasePart, no collisions
    parts = 0
    for it in model.iter("Item"):
        if it.get("class") in BASEPARTS:
            set_prop_bool(it, "Anchored", True)
            set_prop_bool(it, "CanCollide", False)
            parts += 1

    sss = next((it for it in root.iter("Item")
                if it.get("class") == "ServerScriptService"), None)
    if sss is None:
        sys.exit("ERROR: ServerScriptService not found in " + MAIN)

    # idempotent: drop any previous template
    removed = 0
    for ch in list(sss):
        if ch.tag == "Item" and ch.get("class") == "Model":
            cn = ch.find("./Properties/string[@name='Name']")
            if cn is not None and cn.text == MODEL_NAME:
                sss.remove(ch); removed += 1

    sss.append(model)
    tree.write(MAIN, xml_declaration=False, encoding="utf-8")
    print(f"injected '{MODEL_NAME}' into ServerScriptService "
          f"({parts} BaseParts anchored, removed {removed} old).")


if __name__ == "__main__":
    main()
