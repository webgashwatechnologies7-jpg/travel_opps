# 🚀 TravelOps CRM Live Deployment Guide

## Option 1: DigitalOcean VPS (Recommended)

### Server Requirements:
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 2GB Minimum
- **Storage:** 25GB SSD
- **Cost:** $6/month

### Step 1: Server Setup
```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx mysql-server php8.2 php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd php8.2-json php8.2-tokenizer unzip curl git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### Step 2: Database Setup
```bash
sudo mysql_secure_installation
sudo mysql -u root -p
```
```sql
CREATE DATABASE crm_travel;
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON crm_travel.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 🔄 Quick Deploy Commands:

### Production Build:
```bash
# Backend
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Frontend
cd frontend
npm ci
npm run build
```

## 📋 Pre-Deployment Checklist:

### 1. Code Preparation:
- [ ] Remove debug files (create_gashwa_admin.php, test files)
- [ ] Set production environment variables
- [ ] Enable rate limiting again
- [ ] Set up error logging
- [ ] Configure CORS properly

### 2. Security:
- [ ] Change default passwords
- [ ] Enable HTTPS
- [ ] Set up firewall
- [ ] Hide sensitive files

## 🎯 My Recommendation:
**Start with Hostinger Business Hosting** - Easy setup, good support, affordable ($3-5/month)

**Later upgrade to DigitalOcean VPS** - More control, better performance
