#!/usr/bin/env bash
# Create the n8n credentials needed by the workflows via REST API
# Usage:
#   export N8N_URL=https://alitravians-n8n.fly.dev
#   export N8N_API_KEY=...
#   export DISCORD_BOT_TOKEN=...
#   export GROQ_API_KEY=...
#   ./setup-credentials.sh

set -euo pipefail

required=(N8N_URL N8N_API_KEY DISCORD_BOT_TOKEN GROQ_API_KEY)
for v in "${required[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "ERROR: missing env var: $v" >&2
    exit 1
  fi
done

create_header_auth() {
  local name="$1"
  local header_value="$2"

  curl -sS -X POST "$N8N_URL/api/v1/credentials" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg name "$name" --arg val "$header_value" '{
      name: $name,
      type: "httpHeaderAuth",
      data: { name: "Authorization", value: $val }
    }')"
  echo ""
}

echo "Creating: Discord Bot Auth"
create_header_auth "Discord Bot Auth" "Bot $DISCORD_BOT_TOKEN"

echo "Creating: Groq API Key"
create_header_auth "Groq API Key" "Bearer $GROQ_API_KEY"

echo ""
echo "Done. Credentials are created. Next: open each workflow in the n8n UI and"
echo "verify the credentials are selected on the HTTP Request nodes, then activate."
