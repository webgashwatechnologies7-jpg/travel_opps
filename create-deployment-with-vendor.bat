@echo off
echo Creating Deployment Package with Vendor...

REM Create deployment directory
if not exist "deployment-ready" mkdir "deployment-ready"
cd /d "deployment-ready"

REM Copy frontend build
echo Building frontend...
cd ..\frontend
call npm run build
xcopy "dist" "..\deployment-ready\frontend\dist" /E /I /Y

REM Copy backend with vendor
echo Copying backend with vendor...
cd ..\backend
if not exist "..\deployment-ready\backend" mkdir "..\deployment-ready\backend"
xcopy "app" "..\deployment-ready\backend\app" /E /I /Y
xcopy "config" "..\deployment-ready\backend\config" /E /I /Y
xcopy "database" "..\deployment-ready\backend\database" /E /I /Y
xcopy "routes" "..\deployment-ready\backend\routes" /E /I /Y
xcopy "public" "..\deployment-ready\backend\public" /E /I /Y
xcopy "resources" "..\deployment-ready\backend\resources" /E /I /Y
xcopy "storage" "..\deployment-ready\backend\storage" /E /I /Y
xcopy "vendor" "..\deployment-ready\backend\vendor" /E /I /Y
xcopy "*.php" "..\deployment-ready\backend\" /Y
xcopy "composer.json" "..\deployment-ready\backend\" /Y
xcopy "composer.lock" "..\deployment-ready\backend\" /Y

REM Copy .env.example
echo 📋 Copying environment files...
xcopy ".env.example" "..\deployment-ready\backend\" /Y

echo ✅ Deployment package ready!
echo 📁 Location: deployment-ready folder
echo 🌐 Upload this folder to your hosting
