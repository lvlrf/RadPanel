#!/bin/bash
# Database restore script

set -e

# Check for backup file argument
if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -la ./backups/*.sql* 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Load environment variables
if [ -f ".env.prod" ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
fi

DB_USER=${DB_USER:-radpanel}
DB_NAME=${DB_NAME:-radpanel}

echo "=== RAD Panel Database Restore ==="
echo ""
echo "WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (yes/no) " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -k $BACKUP_FILE
    BACKUP_FILE=${BACKUP_FILE%.gz}
fi

# Check if database container is running
if ! docker compose -f docker-compose.prod.yml ps db --status running > /dev/null 2>&1; then
    echo "Error: Database container is not running."
    exit 1
fi

# Restore database
echo "Restoring database..."
cat $BACKUP_FILE | docker compose -f docker-compose.prod.yml exec -T db psql -U $DB_USER $DB_NAME

echo ""
echo "Database restored successfully!"
