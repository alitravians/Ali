#!/bin/bash
# Database Restore Script for LinguaMaster
# Restores a backup of the SQLite database
# Usage: ./scripts/restore-db.sh [backup-file]
# If no backup file is specified, lists available backups

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_FILE="$PROJECT_DIR/prisma/dev.db"
BACKUP_DIR="$PROJECT_DIR/prisma/backups"

# If no argument, list available backups
if [ -z "$1" ]; then
  echo "=== Available Backups ==="
  if [ -d "$BACKUP_DIR" ] && ls "$BACKUP_DIR"/dev.db.backup.* 1>/dev/null 2>&1; then
    ls -lt "$BACKUP_DIR"/dev.db.backup.* | awk '{print NR". "$NF" ("$5" bytes, "$6" "$7" "$8")"}'
  else
    echo "No backups found in $BACKUP_DIR"
  fi
  echo ""
  echo "Usage: ./scripts/restore-db.sh <backup-file-path>"
  exit 0
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  # Try with backup dir prefix
  BACKUP_FILE="$BACKUP_DIR/$1"
  if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $1"
    exit 1
  fi
fi

# Create a safety backup of current db before restoring
if [ -f "$DB_FILE" ]; then
  SAFETY_BACKUP="$BACKUP_DIR/dev.db.pre-restore.$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp "$DB_FILE" "$SAFETY_BACKUP"
  echo "Safety backup of current DB: $SAFETY_BACKUP"
fi

# Restore the backup
cp "$BACKUP_FILE" "$DB_FILE"

echo "=== Database Restored ==="
echo "From: $BACKUP_FILE"
echo "To: $DB_FILE"
echo "Timestamp: $(date)"
echo ""
echo "IMPORTANT: Restart the application after restoring the database."
echo "Restore completed successfully!"
