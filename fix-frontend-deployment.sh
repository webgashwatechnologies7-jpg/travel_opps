#!/bin/bash

echo "🔧 Fixing Frontend Deployment..."

# Navigate to project
cd /var/www/html/crm_project

# Check if frontend build exists
if [ ! -d "frontend/dist" ]; then
    echo "📦 Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Fix Nginx configuration for Hostinger
echo "🌐 Updating Nginx config..."
cat > /etc/nginx/sites-available/crm_travel << 'EOF'
server {
    listen 80;
    server_name sienna-antelope-219105.hostingersite.com;
    root /var/www/html/crm_project/frontend/dist;
    index index.html;

    # Serve frontend files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # API routes to backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # PHP files (if needed)
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/crm_travel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    echo "✅ Nginx restarted successfully"
else
    echo "❌ Nginx config error"
    exit 1
fi

# Set correct permissions
chown -R www-data:www-data /var/www/html/crm_project/frontend/dist
chmod -R 755 /var/www/html/crm_project/frontend/dist

# Check if frontend files exist
if [ -f "/var/www/html/crm_project/frontend/dist/index.html" ]; then
    echo "✅ Frontend build found"
    echo "🌐 Frontend should be working now"
else
    echo "❌ Frontend build not found"
    echo "📦 Building frontend manually..."
    cd /var/www/html/crm_project/frontend
    npm install
    npm run build
fi

echo "🎉 Frontend deployment fix completed!"
echo "🌐 Visit: http://sienna-antelope-219105.hostingersite.com"
