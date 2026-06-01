#!/usr/bin/env python3
# CDATA-preserving (lxml) insertion of the ticket-booth employee model (user-supplied
# ready-seated Creator Store model, asset 8284847763, "dave lol") as a hidden TEMPLATE
# under ServerScriptService, named "CashierModel".
#
# AUDIT RESULT (per the project model-integration rule — keep clean scripts AS-IS,
# remove ONLY proven malicious parts):
#   The model is a STATIC PROP: 27 BaseParts (Part/MeshPart) of an employee already
#   posed sitting on his own chair, with ZERO scripts, ZERO LinkedSource, and ZERO
#   malicious patterns. There is therefore no possible backdoor; we adopt it AS-IS
#   and add NO game logic inside the model.
#
# The employee behaviour (placement behind the counter facing players + name tag +
# the box-office ProximityPrompt) lives in our own CinemaServices.server.lua, which
# clones this template, scales it to a moderate size, rotates it to face the ticket
# window (+X), and rests it on the booth floor via a downward raycast.
#
# Why a ServerScriptService template (not Workspace): the employee's world position
# is computed at runtime relative to the injected "TicketBooth" model, so we keep a
# single source of truth in the server script and clone the template into place.
# A ServerScriptService child never replicates/renders, so there is no stray model.
#
# Idempotent: re-running removes any previous "CashierModel" first.
import sys, copy, re
from lxml import etree

MAIN = "DonationCity_FINAL.rbxlx"
SRC  = "employee_seated.rbxmx"
MODEL_NAME = "CashierModel"
PREF = "CASH_"   # unique referent prefix to avoid clashes with the main file

BASEPARTS = {"Part", "MeshPart", "WedgePart", "CornerWedgePart", "TrussPart",
             "UnionOperation", "Seat", "VehicleSeat"}
SCRIPTY = {"Script", "LocalScript", "ModuleScript"}
# Substring backdoor / remote-code-execution patterns (dynamic code + remote IO).
MALICIOUS = ("loadstring", "getfenv", "setfenv", "HttpGet", "HttpGetAsync",
             "GetObjects", "InsertService")
# require(...) in ANY Lua calling convention: require(x), require"x", require'x',
# require[[x]] (no parentheses), plus aliasing (`local r = require`). This catches
# the require-by-asset-id backdoor family even when obfuscated, closing the gap a
# plain "require(" substring would miss.
REQUIRE_RX = re.compile(r"""require\s*[(\"'\[]|=\s*require\b""")


def scan_text(text):
    """Return the list of malicious-pattern labels found in `text`."""
    low = text.lower()
    hits = [pat for pat in MALICIOUS if pat.lower() in low]
    if REQUIRE_RX.search(text):
        hits.append("require")
    return hits

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
    seen = set()   # exact pattern tokens already reported (dedup by token, not substring)
    for it in model.iter("Item"):
        if it.get("class") in SCRIPTY:
            name = it.findtext("Properties/string[@name='Name']") or "?"
            scripts.append(f"{it.get('class')}:{name}")
            for pat in scan_text(script_source(it)):
                bad.append(f"{it.get('class')} '{name}' -> {pat}")
                seen.add(pat)
            # defence-in-depth: reject any non-null LinkedSource (external code ref).
            # The value lives in a child element (<url>rbxassetid://..</url>) or is
            # <null/>; lxml's .text on the parent is empty, so we must inspect children.
            for ls in it.findall("./Properties/*[@name='LinkedSource']"):
                val = (ls.text or "").strip()
                for child in ls:
                    if child.tag.lower() != "null" and (child.text or "").strip():
                        val = child.text.strip()
                if val:
                    bad.append(f"{it.get('class')} '{name}' -> LinkedSource:{val}")
    # defence-in-depth: scan the whole serialised model too (values, attributes...)
    raw = etree.tostring(model, encoding="unicode")
    for pat in scan_text(raw):
        if pat not in seen:
            # flag raw-only hits not already reported from a script source. Dedup is
            # only to avoid duplicate diagnostic lines; it never affects the security
            # gate (any entry in `bad` => reject below). Note scan_text is substring
            # based, so a script "HttpGetAsync" hit also adds "HttpGet" to `seen` — a
            # later raw-only "HttpGet" would be deduped, but the model is rejected
            # regardless since both are already in `bad`.
            bad.append(f"raw -> {pat}")
            seen.add(pat)
    return scripts, bad


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

    # Merge SharedStrings blobs (md5-dedup): the model's MeshParts reference mesh +
    # physics data (PhysicalConfigData / ModelMeshData) by md5 in <SharedStrings>.
    # Without merging those blobs into the main file, the refs dangle and the meshes
    # render broken. Same step as inject_ticketbooth / inject_aquarium / inject_fountain.
    main_ss = root.find("SharedStrings")
    if main_ss is None:
        main_ss = etree.SubElement(root, "SharedStrings")
    have = {e.get("md5") for e in main_ss}
    src_ss = src_root.find("SharedStrings")
    added = 0
    if src_ss is not None:
        for e in src_ss:
            md5 = e.get("md5")
            if md5 not in have:
                main_ss.append(copy.deepcopy(e)); have.add(md5); added += 1

    tree.write(MAIN, xml_declaration=False, encoding="utf-8")
    print(f"injected '{MODEL_NAME}' into ServerScriptService "
          f"({parts} BaseParts anchored, removed {removed} old); "
          f"merged SharedStrings +{added}.")


if __name__ == "__main__":
    main()
