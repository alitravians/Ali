import sys

SRC = "DonationCity_FINAL.rbxlx"
OUT = "DonationCity_FINAL_new.rbxlx"
CINEMA_SRC = "src/CinemaSystem.server.lua"
CLIENT_SRC = "src/CinemaClient.client.lua"
SERVICES_SRC = "src/CinemaServices.server.lua"

with open(SRC, "r", encoding="utf-8") as f:
    content = f.read()
with open(CINEMA_SRC, "r", encoding="utf-8") as f:
    cinema_source = f.read()
with open(CLIENT_SRC, "r", encoding="utf-8") as f:
    client_source = f.read()
with open(SERVICES_SRC, "r", encoding="utf-8") as f:
    services_source = f.read()

for name, src in (("CinemaSystem", cinema_source), ("CinemaClient", client_source), ("CinemaServices", services_source)):
    if "]]>" in src:
        sys.exit(f"ERROR: {name} source contains ]]> which breaks CDATA")

# ----------------------------------------------------------------------
# 1) Replace CinemaSystem Script source (anchor on unique header marker)
# ----------------------------------------------------------------------
marker = "CINEMA SYSTEM"
idx_marker = content.find(marker)
if idx_marker == -1:
    sys.exit("ERROR: could not find CINEMA SYSTEM marker")
cdata_open = "<![CDATA["
start = content.rfind(cdata_open, 0, idx_marker)
if start == -1:
    sys.exit("ERROR: could not find CDATA open before CinemaSystem marker")
start_inner = start + len(cdata_open)
end_inner = content.find("]]>", start_inner)
if end_inner == -1:
    sys.exit("ERROR: could not find CinemaSystem CDATA close")
old_block = content[start_inner:end_inner]
if "CINEMA SYSTEM" not in old_block:
    sys.exit("ERROR: located block is not CinemaSystem")
content = content[:start_inner] + cinema_source + content[end_inner:]
print(f"[1] CinemaSystem source replaced: old={len(old_block)} -> new={len(cinema_source)} chars")

# ----------------------------------------------------------------------
# 2) Insert a new LocalScript 'CinemaClient' after the TicketHud item,
#    as a sibling inside StarterPlayerScripts.
# ----------------------------------------------------------------------
if "CINEMA CLIENT" in content:
    sys.exit("ERROR: CinemaClient already present")

th_marker = "TICKET HUD"
idx_th = content.find(th_marker)
if idx_th == -1:
    sys.exit("ERROR: could not find TICKET HUD marker")
# end of TicketHud source CDATA
th_cdata_close = content.find("]]>", idx_th)
if th_cdata_close == -1:
    sys.exit("ERROR: could not find TicketHud CDATA close")
# the </Item> that closes the TicketHud LocalScript follows shortly after
close_tag = "</Item>"
th_item_close = content.find(close_tag, th_cdata_close)
if th_item_close == -1:
    sys.exit("ERROR: could not find TicketHud </Item>")
insert_at = th_item_close + len(close_tag)

new_item = (
    "\n      <Item class=\"LocalScript\" referent=\"CinemaClientRef\">\n"
    "        <Properties>\n"
    "          <string name=\"Name\">CinemaClient</string>\n"
    "          <string name=\"Source\"><![CDATA[" + client_source + "]]></string>\n"
    "        </Properties>\n"
    "      </Item>"
)
content = content[:insert_at] + new_item + content[insert_at:]
print(f"[2] CinemaClient LocalScript inserted ({len(client_source)} chars)")

# ----------------------------------------------------------------------
# 3) Insert a new server Script 'CinemaServices' after the TicketSystem
#    item, as a sibling inside ServerScriptService.
# ----------------------------------------------------------------------
if "CINEMA SERVICES" in content:
    sys.exit("ERROR: CinemaServices already present")

ts_marker = "TICKET SYSTEM"
idx_ts = content.find(ts_marker)
if idx_ts == -1:
    sys.exit("ERROR: could not find TICKET SYSTEM marker")
ts_cdata_close = content.find("]]>", idx_ts)
if ts_cdata_close == -1:
    sys.exit("ERROR: could not find TicketSystem CDATA close")
ts_item_close = content.find(close_tag, ts_cdata_close)
if ts_item_close == -1:
    sys.exit("ERROR: could not find TicketSystem </Item>")
insert_at2 = ts_item_close + len(close_tag)

new_item2 = (
    "\n    <Item class=\"Script\" referent=\"CinemaServicesRef\">\n"
    "      <Properties>\n"
    "        <string name=\"Name\">CinemaServices</string>\n"
    "        <string name=\"Source\"><![CDATA[" + services_source + "]]></string>\n"
    "      </Properties>\n"
    "    </Item>"
)
content = content[:insert_at2] + new_item2 + content[insert_at2:]
print(f"[3] CinemaServices Script inserted ({len(services_source)} chars)")

with open(OUT, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Wrote {OUT} ({len(content)} bytes)")
