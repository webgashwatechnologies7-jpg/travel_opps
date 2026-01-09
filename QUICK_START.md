# ⚡ Quick Start - Hostinger Deployment

Yeh ek quick reference guide hai. Detailed steps ke liye `STEP_BY_STEP_DEPLOYMENT.md` dekhein.

## 🚀 Quick Steps

### 1️⃣ Frontend Build
```bash
cd frontend
npm install
npm run build
```

### 2️⃣ Database Create
- Hostinger hPanel > MySQL Databases > Create Database
- Credentials note karein

### 3️⃣ Backend Upload
- `backend` folder ko zip karein
- Hostinger File Manager > `public_html` > Upload & Extract

### 4️⃣ .env File Setup
- `public_html/backend/.env` create karein
- Database credentials add karein
- Domain URL add karein

### 5️⃣ SSH Commands
```bash
cd public_html/backend
php artisan key:generate
php artisan storage:link
php artisan migrate --force
php artisan config:cache
```

### 6️⃣ Frontend Upload
- `frontend/dist` ki files `public_html/` mein upload karein
- `.htaccess` file create karein (root mein)

### 7️⃣ CORS Update
- `backend/config/cors.php` mein production domain add karein

### 8️⃣ Test
- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/backend/public/api`

---

**Detailed Guide:** `STEP_BY_STEP_DEPLOYMENT.md` dekhein

