@echo off
title Iskolar ng Mariveles - Dev + Cloudflare Tunnel
echo ============================================
echo   Iskolar ng Mariveles - Dev + Tunnel
echo ============================================
echo.

:: Kill any process using port 3000
echo Checking port 3000...
set "PORT_IN_USE=0"
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr /I "LISTENING"') do (
    set "PORT_IN_USE=1"
    echo Killing process on port 3000 ^(PID: %%a^)...
    taskkill /F /PID %%a >nul 2>&1
)
if "%PORT_IN_USE%"=="0" echo Port 3000 is already free.
if "%PORT_IN_USE%"=="1" echo Port 3000 has been freed.
echo.

echo Starting Next.js dev server + Cloudflare Tunnel...
echo   Local:  http://localhost:3000
echo   Tunnel: https://dev.cjaayy.dev
echo.

:: Open both local and tunnel URLs after a short delay
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
start "" cmd /c "timeout /t 8 /nobreak >nul && start https://dev.cjaayy.dev"

:: Start dev server + tunnel concurrently
cd /d "%~dp0.."
npm run dev:tunnel
