#!/bin/bash
# Run this script ON THE LIVE SERVER (e.g. after ssh root@145.223.23.45)
# It pulls latest code from Git, builds backend/frontend, and fixes permissions.
# It does NOT replace .env – your live .env is kept as is.

set -e

# Change this to your actual project path on the server (or set APP_DIR when running)
# Example: APP_DIR=/var/www/html/crm_project ./deploy-live-pull.sh
APP_DIR="${APP_DIR:-/var/www/html/travel_opps}"
cd "$APP_DIR" || { echo "Directory $APP_DIR not found"; exit 1; }

echo "=== Deploy: pull latest code (keep .env & permissions) ==="

# Optional: backup .env (already not in git, so just safety)
if [ -f backend/.env ]; then
  cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
  echo "Backed up backend/.env"
fi

# Pull latest ( .env is in .gitignore so it will not be overwritten )
git fetch origin
git pull origin main || git pull origin master || true

# Backend
echo "Backend: composer install..."
cd backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
cd ..

# Frontend
echo "Frontend: npm install & build..."
cd frontend
npm ci --production=false
npm run build
cd ..

# Permissions (do not replace – just ensure storage/cache are writable)
echo "Setting permissions..."
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 775 "$APP_DIR/backend/storage" "$APP_DIR/backend/bootstrap/cache"

echo "Done. .env was not replaced. Permissions set."
