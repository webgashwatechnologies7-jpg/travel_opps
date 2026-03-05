@echo off
REM Push from local to Git - run by double-clicking or from cmd
cd /d "%~dp0"

echo.
echo === Git: add, commit, push ===
echo.

git status
if errorlevel 1 (
    echo Git not found or folder is not a git repo.
    pause
    exit /b 1
)

set /p MSG="Commit message (Enter = 'Latest code for live'): " || set MSG=Latest code for live
if "%MSG%"=="" set MSG=Latest code for live

git add .
git commit -m "%MSG%"
if errorlevel 1 (
    echo No changes to commit or commit failed.
    goto push
)
echo Commit successful.

:push
set /p BRANCH="Branch name (Enter = main): " || set BRANCH=main
if "%BRANCH%"=="" set BRANCH=main

git push origin %BRANCH%
if errorlevel 1 (
    echo Push failed - check remote and branch. If the branch is master, run again and type 'master'.
    pause
    exit /b 1
)

echo.
echo Done. Now SSH into the server and run deploy-live-pull.sh.
pause
