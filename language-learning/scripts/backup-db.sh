#!/bin/bash
# Database Backup Script for LinguaMaster
# Creates a timestamped backup of the SQLite database before any migrations or schema changes
# Usage: ./scripts/backup-db.sh [optional-label]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_FILE="$PROJECT_DIR/prisma/dev.db"
BACKUP_DIR="$PROJECT_DIR/prisma/backups"
LABEL="${1:-manual}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dev.db.backup.${TIMESTAMP}.${LABEL}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
  echo "WARNING: Database file not found at $DB_FILE"
  echo "No backup needed (database will be created on first run)"
  exit 0
fi

# Create backup
cp "$DB_FILE" "$BACKUP_FILE"
DB_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "=== Database Backup Created ==="
echo "Source: $DB_FILE"
echo "Backup: $BACKUP_FILE"
echo "Size: $DB_SIZE"
echo "Timestamp: $(date)"
echo ""

# Keep only the last 10 backups to save disk space
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/dev.db.backup.* 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
  echo "Cleaning old backups (keeping last 10)..."
  ls -1t "$BACKUP_DIR"/dev.db.backup.* | tail -n +11 | xargs rm -f
  echo "Old backups cleaned."
fi

echo "Backup completed successfully!"
