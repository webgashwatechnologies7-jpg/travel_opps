#!/bin/bash

# TravelOps CRM Deployment Script
echo "Starting TravelOps CRM Deployment..."

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y git nginx php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd php8.2-json php8.2-tokenizer unzip curl software-properties-common

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# Navigate to project directory
cd /var/www/html/

# Clone or update repository
if [ ! -d "crm_project" ]; then
    echo "Cloning repository..."
    git clone https://github.com/parasjaswal/crm_project.git
else
    echo "Updating repository..."
    cd crm_project
    git pull origin main
fi

cd /var/www/html/crm_project

# Backend setup
echo "Setting up backend..."
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend build
echo "Building frontend..."
cd ../frontend
npm install
npm run build

# Set permissions
echo "Setting permissions..."
chown -R www-data:www-data /var/www/html/crm_project
chmod -R 755 /var/www/html/crm_project
chmod -R 775 /var/www/html/crm_project/backend/storage
chmod -R 775 /var/www/html/crm_project/backend/bootstrap/cache

# Setup Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/crm_travel << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/crm_project/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/crm_travel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "Deployment completed successfully!"
echo "Your CRM is now live!"
echo "Don't forget to:"
echo "   1. Setup your domain DNS"
echo "   2. Configure SSL certificate"
echo "   3. Update .env with your database credentials"
