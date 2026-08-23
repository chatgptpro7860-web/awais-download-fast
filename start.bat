@echo off
title Awais Download Fast - Universal Video & Audio Downloader
color 0B

echo =========================================================
echo       AWAIS DOWNLOAD FAST - HIGH SPEED DOWNLOADER
echo       Special 14 August Independence Day Release
echo =========================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ to run this app.
    echo.
    pause
    exit /b
)

:: Check node_modules
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
    echo.
)

:: Ensure engine exists
if not exist "bin\yt-dlp.exe" (
    echo [INFO] Setting up core download engine...
    call node scripts\init-engine.js
    echo.
)

:: Ensure native Windows EXE launcher exists
if not exist "Awais-Download-Fast.exe" (
    echo [INFO] Building native Windows executable launcher...
    call node scripts\build-exe.js
    echo.
)

echo [INFO] Starting Awais Download Fast Server on http://localhost:3000 ...
echo [INFO] Press Ctrl+C in this window anytime to stop the server.
echo.

:: Open browser automatically after 1.5 seconds
start "" http://localhost:3000

:: Start Node Server
call node server.js

pause
