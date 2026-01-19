@echo off
echo 🔧 Hostinger Frontend Fix Script
echo.

REM Create deployment package with proper structure
echo 📦 Creating deployment package...
if not exist "hostinger-deploy" mkdir "hostinger-deploy"

REM Build frontend first
echo 🎨 Building frontend...
cd frontend
call npm install
call npm run build
cd ..

REM Copy frontend build to root
echo 📋 Copying frontend to root...
xcopy "frontend\dist" "hostinger-deploy\" /E /I /Y

REM Copy backend to subdirectory
echo 📋 Copying backend...
xcopy "backend" "hostinger-deploy\backend\" /E /I /Y

REM Create .htaccess for frontend routing
echo 🌐 Creating .htaccess...
(
echo RewriteEngine On
echo RewriteCond %{REQUEST_FILENAME} !-f
echo RewriteCond %{REQUEST_FILENAME} !-d
echo RewriteRule ^(.*)$ index.html [QSA,L]
echo.
echo # API routes to backend
echo RewriteRule ^api/(.*)$ backend/index.php [QSA,L]
) > "hostinger-deploy\.htaccess"

REM Create index.html if not exists
if not exist "hostinger-deploy\index.html" (
    echo ❌ Frontend build failed - index.html not found
    pause
    exit /b 1
)

echo ✅ Deployment package ready!
echo 📁 Location: hostinger-deploy folder
echo.
echo 📤 Upload Instructions:
echo 1. Upload all files from hostinger-deploy folder to your hosting root
echo 2. Make sure .htaccess is uploaded
echo 3. Backend will be in /backend/ subdirectory
echo 4. Frontend will serve from root
echo.
echo 🌐 Your site: http://sienna-antelope-219105.hostingersite.com
pause
