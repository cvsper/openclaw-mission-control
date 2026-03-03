#!/bin/bash
# Nexus PostgreSQL backup — daily, 30-day retention
set -euo pipefail

BACKUP_DIR="$HOME/services/nexus/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/nexus_${TIMESTAMP}.sql.gz"

cd ~/services/nexus
docker compose exec -T db pg_dump -U nexus nexus | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Prune backups older than 30 days
find "$BACKUP_DIR" -name "nexus_*.sql.gz" -mtime +30 -delete
echo "Old backups pruned (30-day retention)"
