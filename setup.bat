@echo off
echo ===================================================
echo   TIME TICK STORE - Local Environment Setup
echo ===================================================
echo.

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please install Node.js v18 or newer and try again.
    pause
    exit /b 1
)

echo [1/3] Installing dependencies for backend server...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

echo [2/3] Installing dependencies for dashboard...
cd dashbourd
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dashboard dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

echo [3/3] Installing dependencies for main app TIME TICK...
cd "TIME TICK"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install main app dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ===================================================
echo   Setup completed successfully!
echo   All dependencies have been installed.
echo   Please make sure to configure your .env files.
echo ===================================================
pause
