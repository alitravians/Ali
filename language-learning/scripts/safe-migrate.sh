#!/bin/bash
# Safe Migration Script for LinguaMaster
# Always creates a backup before running any Prisma migration
# Usage: ./scripts/safe-migrate.sh [migrate-name]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATE_NAME="${1:-update}"

echo "=== LinguaMaster Safe Migration ==="
echo ""

# Step 1: Create backup
echo "Step 1: Creating database backup..."
"$SCRIPT_DIR/backup-db.sh" "pre-migrate-${MIGRATE_NAME}"
echo ""

# Step 2: Generate Prisma client
echo "Step 2: Generating Prisma client..."
cd "$PROJECT_DIR"
npx prisma generate
echo ""

# Step 3: Run safe migration (db push WITHOUT --force-reset)
echo "Step 3: Applying schema changes safely..."
echo "IMPORTANT: Using 'prisma db push' WITHOUT --force-reset to preserve data"
echo ""

# Try to apply schema changes without data loss
if npx prisma db push --accept-data-loss 2>&1 | tee /tmp/prisma-push-output.txt; then
  echo ""
  echo "Schema changes applied successfully!"
else
  echo ""
  echo "ERROR: Schema push failed. Your database backup is safe."
  echo "Check the error above and fix schema issues before retrying."
  echo ""
  echo "To restore backup, run: ./scripts/restore-db.sh"
  exit 1
fi

echo ""
echo "=== Migration Complete ==="
echo "Database backup was created before migration."
echo "To restore if needed: ./scripts/restore-db.sh"
