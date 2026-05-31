import sys

SRC = "DonationCity_FINAL.rbxlx"

with open(SRC, "r", encoding="utf-8") as f:
    content = f.read()

if 'class="TextChatService"' in content:
    sys.exit("TextChatService already present — aborting to avoid duplicate")

# Anchor: insert right after the SoundService service Item block.
anchor = '''  <Item class="SoundService" referent="12">
    <Properties>
      <string name="Name">SoundService</string>
    </Properties>
  </Item>'''

if anchor not in content:
    sys.exit("ERROR: SoundService anchor block not found (format changed)")

node = '''
  <Item class="TextChatService" referent="RBX_TextChatService">
    <Properties>
      <string name="Name">TextChatService</string>
      <token name="ChatVersion">1</token>
    </Properties>
  </Item>'''

content = content.replace(anchor, anchor + node, 1)

with open(SRC, "w", encoding="utf-8") as f:
    f.write(content)

print("Injected TextChatService node with ChatVersion=1 (TextChatService)")
print("TextChatService count:", content.count('class="TextChatService"'))
