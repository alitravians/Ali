#!/usr/bin/env bash
# End-to-end deploy of n8n + gateway bridge on Fly.io
# Pre-reqs: flyctl installed and logged in (`flyctl auth login`)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Step 1: deploy n8n ==="
cd "$ROOT/n8n"
flyctl apps create alitravians-n8n 2>/dev/null || true

# Only create the volume if it does not already exist. The previous
# `2>/dev/null || true` form swallowed real errors (quota, region down, auth)
# alongside the expected "already exists" case, which made the eventual
# `flyctl deploy` fail with an opaque "missing mount" message instead.
if ! flyctl volumes list -a alitravians-n8n 2>/dev/null | awk '{print $2}' | grep -qx 'n8n_data'; then
  flyctl volumes create n8n_data --region fra --size 1 --yes -a alitravians-n8n
fi

if [[ -z "${N8N_ENCRYPTION_KEY:-}" ]]; then
  echo "Generating N8N_ENCRYPTION_KEY..."
  N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
  echo "  -> $N8N_ENCRYPTION_KEY (save this!)"
fi

# Build secret args as an array so spaces/special chars in the password
# are preserved without word-splitting issues.
secret_args=(N8N_ENCRYPTION_KEY="$N8N_ENCRYPTION_KEY")
if [[ -n "${N8N_BASIC_AUTH_PASSWORD:-}" ]]; then
  secret_args+=(N8N_BASIC_AUTH_ACTIVE=true)
  secret_args+=(N8N_BASIC_AUTH_USER=admin)
  secret_args+=(N8N_BASIC_AUTH_PASSWORD="$N8N_BASIC_AUTH_PASSWORD")
fi
flyctl secrets set "${secret_args[@]}" -a alitravians-n8n

flyctl deploy -a alitravians-n8n --config fly.toml --remote-only

N8N_URL="https://alitravians-n8n.fly.dev"
echo "n8n deployed at $N8N_URL"

echo ""
echo "=== Step 2: deploy gateway bridge ==="
cd "$ROOT/gateway-bridge"
flyctl apps create alitravians-discord-bridge 2>/dev/null || true

required=(DISCORD_BOT_TOKEN DISCORD_GUILD_ID)
for v in "${required[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "ERROR: missing env var $v" >&2
    exit 1
  fi
done

BRIDGE_SECRET="${BRIDGE_SECRET:-$(openssl rand -hex 16)}"

flyctl secrets set \
  DISCORD_BOT_TOKEN="$DISCORD_BOT_TOKEN" \
  DISCORD_GUILD_ID="$DISCORD_GUILD_ID" \
  N8N_WEBHOOK_BASE="$N8N_URL" \
  BRIDGE_SECRET="$BRIDGE_SECRET" \
  -a alitravians-discord-bridge

flyctl deploy -a alitravians-discord-bridge --config fly.toml --remote-only

echo ""
echo "=== Done ==="
echo "n8n UI:           $N8N_URL"
echo "Bridge app:       https://alitravians-discord-bridge.fly.dev"
echo "BRIDGE_SECRET:    $BRIDGE_SECRET (set on both, share with n8n workflows that verify)"
echo ""
echo "Next steps:"
echo "1) Open $N8N_URL, set up admin account"
echo "2) Settings > n8n API > create key, then:"
echo "   export N8N_API_KEY=<key>"
echo "   N8N_URL=$N8N_URL ./scripts/setup-credentials.sh"
echo "   N8N_URL=$N8N_URL ./scripts/import-workflows.sh"
echo "3) Register slash commands:"
echo "   cd gateway-bridge && npm run register-commands"
echo "4) Activate workflows in n8n UI"
