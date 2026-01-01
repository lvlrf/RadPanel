#!/bin/bash
# Database backup script

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/radpanel_$TIMESTAMP.sql"

# Load environment variables
if [ -f ".env.prod" ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
fi

DB_USER=${DB_USER:-radpanel}
DB_NAME=${DB_NAME:-radpanel}

echo "=== RAD Panel Database Backup ==="
echo ""

# Create backup directory
mkdir -p $BACKUP_DIR

# Check if database container is running
if ! docker compose -f docker-compose.prod.yml ps db --status running > /dev/null 2>&1; then
    echo "Error: Database container is not running."
    exit 1
fi

# Create backup
echo "Creating backup..."
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_FILE

echo ""
echo "Backup created: ${BACKUP_FILE}.gz"
echo ""

# Keep only last 7 days of backups
echo "Cleaning old backups (keeping last 7 days)..."
find $BACKUP_DIR -name "radpanel_*.sql.gz" -mtime +7 -delete

echo "Done!"
