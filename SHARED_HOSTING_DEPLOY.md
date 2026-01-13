# 🚀 Shared Hosting Deployment Guide

## 📋 Files to Upload:

### Frontend (React):
1. Run locally: `npm run build`
2. Upload `frontend/dist/*` to `public_html/`

### Backend (Laravel):
1. Run locally: `composer install --no-dev`
2. Zip `backend/` folder (exclude node_modules)
3. Upload to `public_html/` and extract

## 🔧 Configuration:

### .env file setup:
```
APP_ENV=production
APP_DEBUG=false
DB_HOST=localhost
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

### Database:
1. Create database via Hostinger panel
2. Import tables via phpMyAdmin
3. Run migrations if needed

## 🌐 Access:
- Frontend: https://your-domain.com
- Backend API: https://your-domain.com/backend/public/api
