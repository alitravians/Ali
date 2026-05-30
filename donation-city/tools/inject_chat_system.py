import sys

RBXLX = "DonationCity_FINAL.rbxlx"

with open(RBXLX, "r", encoding="utf-8") as f:
    content = f.read()

with open("src/CustomChat.server.lua", "r", encoding="utf-8") as f:
    server_src = f.read()
with open("src/CustomChat.client.lua", "r", encoding="utf-8") as f:
    client_src = f.read()

for name, src in (("server", server_src), ("client", client_src)):
    if "]]>" in src:
        sys.exit(f"ERROR: {name} source contains ]]> which breaks CDATA")

if 'referent="CustomChatServerRef"' in content or 'referent="CustomChatClientRef"' in content:
    sys.exit("ERROR: CustomChat already injected — aborting to avoid duplicate")

# --- 1) server Script into ServerScriptService ---
ss_anchor = '''  <Item class="ServerScriptService" referent="6">
    <Properties>
      <string name="Name">ServerScriptService</string>
    </Properties>
'''
if ss_anchor not in content:
    sys.exit("ERROR: ServerScriptService anchor not found")

server_item = (
    '    <Item class="Script" referent="CustomChatServerRef">\n'
    '      <Properties>\n'
    '        <string name="Name">CustomChat</string>\n'
    '        <token name="RunContext">0</token>\n'
    '        <string name="Source"><![CDATA[' + server_src + ']]></string>\n'
    '      </Properties>\n'
    '    </Item>\n'
)
content = content.replace(ss_anchor, ss_anchor + server_item, 1)

# --- 2) client LocalScript into StarterPlayerScripts ---
sps_anchor = '''    <Item class="StarterPlayerScripts" referent="15">
      <Properties>
        <string name="Name">StarterPlayerScripts</string>
      </Properties>
'''
if sps_anchor not in content:
    sys.exit("ERROR: StarterPlayerScripts anchor not found")

client_item = (
    '      <Item class="LocalScript" referent="CustomChatClientRef">\n'
    '        <Properties>\n'
    '          <string name="Name">CustomChat</string>\n'
    '          <string name="Source"><![CDATA[' + client_src + ']]></string>\n'
    '        </Properties>\n'
    '      </Item>\n'
)
content = content.replace(sps_anchor, sps_anchor + client_item, 1)

with open(RBXLX, "w", encoding="utf-8") as f:
    f.write(content)

print("Injected CustomChat server + client scripts.")
print("server ref present:", 'referent="CustomChatServerRef"' in content)
print("client ref present:", 'referent="CustomChatClientRef"' in content)
