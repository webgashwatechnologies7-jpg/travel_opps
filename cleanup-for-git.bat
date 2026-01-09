@echo off
echo ========================================
echo   Code Cleanup for Git Push
echo ========================================
echo.

echo Removing deployment files...
if exist "hostinger-deploy-ready" rmdir /s /q "hostinger-deploy-ready"
if exist "hostinger-deploy-ready.zip" del /q "hostinger-deploy-ready.zip"

echo Removing deployment scripts...
if exist "deploy-to-hostinger.bat" del /q "deploy-to-hostinger.bat"
if exist "deploy-to-hostinger.sh" del /q "deploy-to-hostinger.sh"
if exist "create-deployment-zip.bat" del /q "create-deployment-zip.bat"
if exist "build-frontend.bat" del /q "build-frontend.bat"
if exist "build-frontend.sh" del /q "build-frontend.sh"

echo Removing deployment documentation...
if exist "AGE_KYA_KAREIN.md" del /q "AGE_KYA_KAREIN.md"
if exist "HOSTINGER_PE_ZIP_BANAYE.md" del /q "HOSTINGER_PE_ZIP_BANAYE.md"
if exist "ZIP_KIASE_BANAYE.md" del /q "ZIP_KIASE_BANAYE.md"
if exist "YOUR_PROJECT_GUIDE.md" del /q "YOUR_PROJECT_GUIDE.md"
if exist "ZIP_CREATION_GUIDE.md" del /q "ZIP_CREATION_GUIDE.md"
if exist "VISUAL_GUIDE.md" del /q "VISUAL_GUIDE.md"
if exist "FILE_PATHS_REFERENCE.md" del /q "FILE_PATHS_REFERENCE.md"
if exist "COMPLETE_CODE_GUIDE.md" del /q "COMPLETE_CODE_GUIDE.md"
if exist "NEXT_STEPS.md" del /q "NEXT_STEPS.md"
if exist "NPM_BUILD_DEPLOY.md" del /q "NPM_BUILD_DEPLOY.md"
if exist "DUMMY_DOMAIN_CHECKLIST.md" del /q "DUMMY_DOMAIN_CHECKLIST.md"
if exist "DUMMY_DOMAIN_SETUP.md" del /q "DUMMY_DOMAIN_SETUP.md"
if exist "QUICK_DEPLOY.md" del /q "QUICK_DEPLOY.md"
if exist "HOSTINGER_DEPLOYMENT.md" del /q "HOSTINGER_DEPLOYMENT.md"
if exist "STEP_BY_STEP_DEPLOYMENT.md" del /q "STEP_BY_STEP_DEPLOYMENT.md"
if exist "DEPLOYMENT_GUIDE.md" del /q "DEPLOYMENT_GUIDE.md"
if exist "CLEANUP_SUMMARY.md" del /q "CLEANUP_SUMMARY.md"

echo Cleaning build artifacts...
if exist "frontend\dist" rmdir /s /q "frontend\dist"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"
if exist "frontend\.vite" rmdir /s /q "frontend\.vite"

echo Removing .env files...
if exist ".env" del /q ".env"
if exist "backend\.env" del /q "backend\.env"
if exist "frontend\.env" del /q "frontend\.env"
if exist "frontend\.env.production" del /q "frontend\.env.production"

echo.
echo ========================================
echo   Cleanup Complete!
echo ========================================
echo.
echo Files removed:
echo - Deployment folders and ZIP files
echo - Deployment scripts (.bat, .sh)
echo - Deployment documentation (.md)
echo - Build artifacts (dist, node_modules)
echo - Environment files (.env)
echo.
echo Next: Initialize git and push to GitHub
echo.
pause
