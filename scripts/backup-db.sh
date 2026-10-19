#!/usr/bin/env bash
# Copies the live SQLite database to a timestamped snapshot — cheap insurance
# against corruption, a bad deploy, or the dev.db-being-committed-to-git
# footgun (see the DATABASE_URL comment in .env) overwriting live event data.
# Meant to run on a schedule via cron during the live 2-day event, not as a
# one-off. Keeps the most recent 200 snapshots so the folder doesn't grow
# unbounded (at a 15-min cadence that's ~50 hours of history).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="$APP_DIR/prisma/dev.db"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [ ! -f "$DB_FILE" ]; then
  echo "backup-db.sh: no database file at $DB_FILE, skipping" >&2
  exit 0
fi

mkdir -p "$BACKUP_DIR"
# sqlite3's own backup command (if available) takes a consistent snapshot
# even mid-write; plain cp is a reasonable fallback but could, in rare cases,
# copy a half-written page if a transaction is committing at that exact instant.
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_FILE" ".backup '$BACKUP_DIR/dev-$TIMESTAMP.db'"
else
  cp "$DB_FILE" "$BACKUP_DIR/dev-$TIMESTAMP.db"
fi

ls -1t "$BACKUP_DIR"/dev-*.db 2>/dev/null | tail -n +201 | xargs -r rm --
