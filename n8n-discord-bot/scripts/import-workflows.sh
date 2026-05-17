#!/usr/bin/env bash
# Bulk-import all n8n workflows via REST API
# Usage:
#   export N8N_URL=https://alitravians-n8n.fly.dev
#   export N8N_API_KEY=...  # generate from n8n UI: Settings > n8n API
#   ./import-workflows.sh

set -euo pipefail

if [[ -z "${N8N_URL:-}" || -z "${N8N_API_KEY:-}" ]]; then
  echo "ERROR: set N8N_URL and N8N_API_KEY env vars" >&2
  exit 1
fi

WORKFLOWS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/workflows"

if [[ ! -d "$WORKFLOWS_DIR" ]]; then
  echo "ERROR: workflows directory not found at $WORKFLOWS_DIR" >&2
  exit 1
fi

echo "Importing workflows from $WORKFLOWS_DIR to $N8N_URL"
echo ""

count=0
for f in "$WORKFLOWS_DIR"/*.json; do
  name=$(basename "$f")
  echo -n "[$((++count))] $name ... "

  payload=$(jq '{name: .name, nodes: .nodes, connections: .connections, settings: (.settings // {}), staticData: null}' "$f")

  resp=$(curl -sS -X POST "$N8N_URL/api/v1/workflows" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")

  id=$(echo "$resp" | jq -r '.id // .data.id // empty')
  if [[ -n "$id" ]]; then
    echo "imported (id=$id)"
  else
    echo "FAILED"
    echo "$resp" | jq . >&2
  fi
done

echo ""
echo "Done. Imported $count workflows."
echo "Next: open $N8N_URL, configure credentials (Discord Bot Auth, Groq API Key), then activate workflows."
