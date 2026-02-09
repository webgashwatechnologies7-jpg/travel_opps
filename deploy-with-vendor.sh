#!/bin/bash

# Deployment Script with Vendor Folder
echo "Starting Deployment with Vendor..."

# Navigate to project directory
cd /var/www/html/

# Clone repository
git clone https://github.com/parasjaswal/crm_project.git
cd crm_project

# Install vendor locally (for pushing)
cd backend
composer install --no-dev --optimize-autoloader

# Add vendor to git temporarily
git add backend/vendor/
git commit -m "Add vendor dependencies for deployment"
git push origin main

echo "Vendor folder added and pushed!"
echo "Remember to remove vendor from .gitignore temporarily"
