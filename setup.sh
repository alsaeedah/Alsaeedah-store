#!/bin/bash
set -e

echo "==================================================="
echo "  TIME TICK STORE - Local Environment Setup"
echo "==================================================="
echo

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed! Please install Node.js (v18+) and try again."
    exit 1
fi

echo "[1/3] Installing dependencies for backend server..."
cd server
npm install
cd ..

echo "[2/3] Installing dependencies for dashboard..."
cd dashbourd
npm install
cd ..

echo "[3/3] Installing dependencies for main app (TIME TICK)..."
cd "TIME TICK"
npm install
cd ..

echo
echo "==================================================="
echo "  Setup completed successfully!"
echo "  All dependencies have been installed."
echo "  Please make sure to configure your .env files."
echo "==================================================="
