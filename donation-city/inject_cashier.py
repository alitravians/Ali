#!/usr/bin/env python3
# CDATA-preserving (lxml) insertion of the ticket-booth cashier character model
# ("Cashier", user-supplied Creator Store asset 6821242503 by @Stixxal) as a
# hidden TEMPLATE under ServerScriptService, named "CashierModel".
#
# AUDIT RESULT (per the project model-integration rule — keep clean scripts AS-IS,
# remove ONLY proven malicious parts):
#   The model holds a single Script "Animate" — the standard Roblox R6 character
#   animation script (plays idle/walk/run from roblox.com animation assets). It
#   contains ZERO malicious patterns (no loadstring / require / getfenv / HttpGet /
#   InsertService / GetObjects). So the model is CLEAN and we adopt it AS-IS: we do
#   NOT strip the Animate script and we do NOT add any game logic inside the model.
#
#   We DO set Animate.Disabled = true, for two reasons (display-only, not a code
#   change to the script): (1) the cashier is a STATIC seated NPC posed by our own
#   CinemaServices.server.lua, so the walking/idle animation must not override the
#   seated pose; (2) a template living under ServerScriptService would otherwise
#   run the Animate script needlessly. The script itself is kept untouched.
#
# The cashier behaviour (seated pose on the booth chair + name tag + the box-office
# ProximityPrompt) lives in our own CinemaServices.server.lua, which clones this
# template and seats it on the chair nearest the ticket window, facing players.
#
# Why a ServerScriptService template (not Workspace): the cashier's world position
# is computed at runtime from the injected "TicketBooth" model's chair, so we keep
# a single source of truth in the server script and clone the template into place.
# A ServerScriptService child never replicates/renders, so there is no stray model.
#
# Idempotent: re-running removes any previous "CashierModel" first.
import sys, copy
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SRC  = "cashier_worker.rbxmx"
MODEL_NAME = "CashierModel"
PREF = "CASH_"   # unique referent prefix to avoid clashes with the main file

BASEPARTS = {"Part", "MeshPart", "WedgePart", "CornerWedgePart", "TrussPart",
             "UnionOperation", "Seat", "VehicleSeat"}
SCRIPTY = {"Script", "LocalScript", "ModuleScript"}
# Backdoor / remote-code-execution patterns. `require(` catches require-by-asset-id
# (the disguised-module backdoor family); the rest catch dynamic code + remote IO.
MALICIOUS = ("loadstring", "getfenv", "setfenv", "HttpGet", "HttpGetAsync",
             "GetObjects", "InsertService", "require(")

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


def script_source(item):
    """Return the source text of a Script-like Item (handles ProtectedString)."""
    src = item.find("./Properties/ProtectedString[@name='Source']")
    if src is None:
        src = item.find("./Properties/string[@name='Source']")
    return (src.text or "") if src is not None else ""


def audit(model):
    """Per-script malicious-pattern scan. Clean scripts are allowed (kept AS-IS).
    Returns (scripts_found, malicious_hits)."""
    scripts, bad = [], []
    for it in model.iter("Item"):
        if it.get("class") in SCRIPTY:
            name = it.findtext("Properties/string[@name='Name']") or "?"
            scripts.append(f"{it.get('class')}:{name}")
            srclow = script_source(it).lower()
            for pat in MALICIOUS:
                if pat.lower() in srclow:
                    bad.append(f"{it.get('class')} '{name}' -> {pat}")
    # defence-in-depth: scan the whole serialised model too (values, attributes...)
    raw = etree.tostring(model, encoding="unicode").lower()
    for pat in MALICIOUS:
        if pat.lower() in raw and not any(pat in b for b in bad):
            # only flag if it is NOT already accounted for by a script source hit
            # (avoids duplicate noise); a raw-only hit is still suspicious.
            bad.append(f"raw -> {pat}")
    return scripts, bad


def disable_animate(model):
    """Display-only: disable the standard 'Animate' script so it does not override
    our seated pose (the script is kept, just not running)."""
    done = 0
    for it in model.iter("Item"):
        if it.get("class") == "Script" and \
                (it.findtext("Properties/string[@name='Name']") or "") == "Animate":
            set_prop_bool(it, "Disabled", True)
            done += 1
    return done


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

    scripts, bad = audit(model)
    if bad:
        sys.exit("ABORT: model is NOT clean — malicious hits: " + ", ".join(bad))
    print("audit: scripts found =", scripts or "none",
          "| malicious patterns = NONE -> adopting AS-IS")

    disabled = disable_animate(model)
    print(f"display-only: disabled {disabled} 'Animate' script(s) (kept, not removed)")

    # name + unique referents
    nm = model.find("./Properties/string[@name='Name']")
    if nm is None:
        nm = etree.SubElement(model.find("Properties"), "string"); nm.set("name", "Name")
    nm.text = MODEL_NAME
    reprefix(model)

    # static display: anchor every BasePart, no collisions (runtime re-tunes which
    # parts stay anchored for the seated pose, but a safe anchored default avoids
    # any physics on the hidden template).
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
