# TravelOps - Travel Management System

TravelOps ek comprehensive travel management system hai jo Laravel (Backend) aur React (Frontend) par built hai.

## 📁 Project Structure

```
travelops/
├── backend/          # Laravel Backend API
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── public/
│   └── ...
│
├── frontend/         # React Admin Panel
│   ├── src/
│   ├── public/
│   └── ...
<｜tool▁call▁end｜><｜tool▁call▁begin｜>
run_terminal_cmd
```

## 🚀 Getting Started

### Prerequisites
- PHP >= 8.1
- Composer
- Node.js >= 16
- MySQL Database
- WAMP/XAMPP (Windows) ya Apache server

### Backend Setup (Laravel)

1. **Backend folder mein jao:**
   ```bash
   cd backend
   ```

2. **Dependencies install karo:**
   ```bash
   composer install
   ```

3. **Environment file setup karo:**
   ```bash
   copy .env.example .env
   php artisan key:generate
   ```

4. **Database configure karo `.env` file mein:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=your_database_name
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

5. **Database migrations run karo:**
   ```bash
   php artisan migrate
   ```

6. **Laravel server start karo:**
   ```bash
   php artisan serve
   ```
   Server `http://localhost:8000` par chalega.

### Frontend Setup (React)

1. **Frontend folder mein jao:**
   ```bash
   cd frontend
   ```

2. **Dependencies install karo:**
   ```bash
   npm install
   ```

3. **Development server start karo:**
   ```bash
   npm run dev
   ```
   Server `http://localhost:5173` par chalega.

## 📝 Server Start Commands

### Backend Server:
```bash
cd backend
php artisan serve
```

### Frontend Server:
```bash
cd frontend
npm run dev
```

## 🔗 URLs

- **Backend API:** http://localhost:8000
- **Frontend Admin Panel:** http://localhost:5173

## 🚀 Production Deployment

1. **Backend:**
   - Files upload karein server pe
   - `.env` file configure karein
   - Database setup karein
   - `php artisan migrate` run karein

2. **Frontend:**
   - `npm run build` se production build banayein
   - Build files upload karein
   - API URL configure karein

## 🛠️ Tech Stack

**Backend:**
- Laravel 10
- PHP 8.1+
- MySQL
- Laravel Sanctum (Authentication)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

## 📄 License

MIT License
