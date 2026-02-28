@echo off
setlocal enabledelayedexpansion
title Iskolar ng Mariveles - Local Dev
echo ============================================
echo   Iskolar ng Mariveles - Local Development
echo ============================================
echo.

:: Kill any process using port 3000
echo Checking port 3000...
set "PORT_IN_USE=0"
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /R ":3000[ $]" ^| findstr /I "LISTENING"') do (
    set "PID=%%a"
    echo !PID! | findstr /R "^[0-9][0-9]*$" >nul 2>&1
    if !errorlevel!==0 (
        set "PORT_IN_USE=1"
        echo Killing process on port 3000 ^(PID: !PID!^)...
        taskkill /F /PID !PID! >nul 2>&1
    )
)
if "!PORT_IN_USE!"=="0" echo Port 3000 is already free.
if "!PORT_IN_USE!"=="1" echo Port 3000 has been freed.
echo.

:: Navigate to project root (drive letter already uppercase via %~dp0)
cd /d "%~dp0.."

:: Suppress punycode deprecation warning
set NODE_OPTIONS=--no-deprecation

:: Optionally clear stale webpack cache (pass --clean flag to force)
if /i "%~1"=="--clean" (
    if exist ".next" (
        echo Clearing .next cache...
        rmdir /s /q ".next"
        echo Done.
        echo.
    )
)

echo Starting Next.js dev server on localhost:3000...
echo.

:: Open browser after a short delay
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"

npm run dev
endlocal
