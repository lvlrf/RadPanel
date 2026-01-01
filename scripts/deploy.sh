#!/bin/bash
# Production deployment script

set -e

echo "=== RAD Panel Production Deployment ==="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check for production environment file
if [ ! -f ".env.prod" ]; then
    echo "Error: .env.prod file not found."
    echo "Please create .env.prod with your production settings:"
    echo "  - DB_PASSWORD"
    echo "  - SECRET_KEY"
    echo "  - MARZBAN_URL"
    echo "  - MARZBAN_USERNAME"
    echo "  - MARZBAN_PASSWORD"
    exit 1
fi

# Load environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Validate required variables
required_vars=("DB_PASSWORD" "SECRET_KEY" "MARZBAN_URL" "MARZBAN_USERNAME" "MARZBAN_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env.prod"
        exit 1
    fi
done

# Create backup directory
mkdir -p ./backups

# Backup existing database (if running)
if docker compose -f docker-compose.prod.yml ps db --status running > /dev/null 2>&1; then
    echo "Creating database backup..."
    docker compose -f docker-compose.prod.yml exec db pg_dump -U ${DB_USER:-radpanel} ${DB_NAME:-radpanel} > ./backups/backup_$(date +%Y%m%d_%H%M%S).sql || true
fi

# Pull latest images
echo "Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

# Build and deploy
echo "Building and deploying..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for database
echo "Waiting for services to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head || true

# Clean up old images
echo "Cleaning up old images..."
docker image prune -f

echo ""
echo "=== Production Deployment Complete ==="
echo ""
echo "Application is running at your configured domain"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Status:        docker compose -f docker-compose.prod.yml ps"
echo "  Stop:          docker compose -f docker-compose.prod.yml down"
echo "  Restart:       docker compose -f docker-compose.prod.yml restart"
echo ""
