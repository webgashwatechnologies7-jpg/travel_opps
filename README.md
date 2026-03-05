# TravelOps - Travel Management System

TravelOps is a comprehensive travel management system built with Laravel (Backend) and React (Frontend).

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
```

## 🚀 Getting Started

### Prerequisites
- PHP >= 8.1
- Composer
- Node.js >= 16
- MySQL Database
- WAMP/XAMPP (Windows) or Apache server

### Backend Setup (Laravel)

1. **Go to the backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   composer install
   ```

3. **Setup environment file:**
   ```bash
   copy .env.example .env
   php artisan key:generate
   ```

4. **Configure database in `.env` file:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=your_database_name
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

5. **Run database migrations:**
   ```bash
   php artisan migrate
   ```

6. **Start Laravel server:**
   ```bash
   php artisan serve
   ```
   The server will run at `http://localhost:8000`.

### Frontend Setup (React)

1. **Go to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The server will run at `http://localhost:5173`.

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
   - Upload files to the server
   - Configure `.env` file
   - Setup database
   - Run `php artisan migrate`

2. **Frontend:**
   - Create production build with `npm run build`
   - Upload build files
   - Configure API URL

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
