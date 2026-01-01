#!/bin/bash
# SSL Certificate Setup Script (Let's Encrypt)

set -e

echo "=== RAD Panel SSL Setup ==="
echo ""

# Check for domain argument
if [ -z "$1" ]; then
    echo "Usage: ./scripts/setup-ssl.sh <your-domain.com>"
    exit 1
fi

DOMAIN=$1
SSL_DIR="./docker/nginx/ssl"

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Create SSL directory
mkdir -p $SSL_DIR

# Stop nginx temporarily to free port 80
docker compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

# Get certificate
echo "Obtaining SSL certificate for $DOMAIN..."
certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Copy certificates
echo "Installing certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/key.pem

# Set permissions
chmod 600 $SSL_DIR/*.pem

# Start nginx
docker compose -f docker-compose.prod.yml start nginx

echo ""
echo "SSL certificate installed successfully!"
echo ""
echo "Add this cron job for auto-renewal:"
echo "0 0 1 * * certbot renew && cp /etc/letsencrypt/live/$DOMAIN/*.pem ./docker/nginx/ssl/ && docker compose -f docker-compose.prod.yml restart nginx"
echo ""
