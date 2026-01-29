@echo off
REM Local se Git pe push - isko double-click ya cmd se chalao
cd /d "%~dp0"

echo.
echo === Git: add, commit, push ===
echo.

git status
if errorlevel 1 (
    echo Git not found ya folder git repo nahi hai.
    pause
    exit /b 1
)

set /p MSG="Commit message (Enter = 'Latest code for live'): " || set MSG=Latest code for live
if "%MSG%"=="" set MSG=Latest code for live

git add .
git commit -m "%MSG%"
if errorlevel 1 (
    echo No changes to commit ya commit fail.
    goto push
)
echo Commit done.

:push
set /p BRANCH="Branch name (Enter = main): " || set BRANCH=main
if "%BRANCH%"=="" set BRANCH=main

git push origin %BRANCH%
if errorlevel 1 (
    echo Push fail - check remote aur branch. Agar branch master hai to dubara chala ke 'master' likho.
    pause
    exit /b 1
)

echo.
echo Done. Ab server pe SSH karke deploy-live-pull.sh chalao.
pause
