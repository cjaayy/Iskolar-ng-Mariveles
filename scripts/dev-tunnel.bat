@echo off
setlocal enabledelayedexpansion
title Iskolar ng Mariveles - Dev + Cloudflare Tunnel
echo ============================================
echo   Iskolar ng Mariveles - Dev + Tunnel
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

:: Navigate to frontend directory (uppercase drive letter to avoid webpack warnings)
cd /d "%~dp0..\frontend"
for %%i in ("%CD%") do set "DRIVE=%%~di"
set "DRIVE=%DRIVE:c:=C:%"
cd /d "%DRIVE%%CD:~2%"

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

:: Check if cloudflared is available
where cloudflared >nul 2>&1
if errorlevel 1 (
    echo [WARN] cloudflared not found in PATH.
    echo        Falling back to quick tunnel ^(random URL^)...
    echo        Install cloudflared for a fixed tunnel URL.
    echo.
    set "NPM_SCRIPT=dev:quick"
) else (
    :: Check if named tunnel config exists
    if not exist "%USERPROFILE%\.cloudflared\config-iskolar-dev.yml" (
        echo [WARN] Tunnel config not found: %USERPROFILE%\.cloudflared\config-iskolar-dev.yml
        echo        Falling back to quick tunnel ^(random URL^)...
        echo.
        set "NPM_SCRIPT=dev:quick"
    ) else (
        set "NPM_SCRIPT=dev:tunnel"
    )
)

echo Starting Next.js dev server + Cloudflare Tunnel...
echo   Local:  http://localhost:3000
if "!NPM_SCRIPT!"=="dev:tunnel" echo   Tunnel: https://dev.cjaayy.dev
echo.

:: Open browser after a short delay
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"
if "!NPM_SCRIPT!"=="dev:tunnel" (
    start "" cmd /c "timeout /t 10 /nobreak >nul && start https://dev.cjaayy.dev"
)

npm run !NPM_SCRIPT!
endlocal
