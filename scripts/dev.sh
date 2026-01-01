#!/bin/bash
# Development environment startup script

set -e

echo "=== RAD Panel Development Environment ==="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit .env file with your settings before continuing."
    exit 1
fi

# Start services
echo "Starting development environment..."
docker compose up -d

# Wait for database
echo "Waiting for database to be ready..."
sleep 5

# Run migrations
echo "Running database migrations..."
docker compose exec backend alembic upgrade head || true

echo ""
echo "=== Development Environment Started ==="
echo ""
echo "Backend API: http://localhost:8000"
echo "API Docs:    http://localhost:8000/docs"
echo "Frontend:    http://localhost:5173"
echo ""
echo "Logs: docker compose logs -f"
echo "Stop: docker compose down"
echo ""
