@echo off
echo ========================================
echo   Testing Production-Ready Backend
echo ========================================
echo.

REM Check if .env exists, if not create from production template
if not exist backend\.env (
    echo Creating backend/.env from template...
    copy backend\.env.production backend\.env
    echo.
    echo IMPORTANT: Please edit backend/.env and add:
    echo - MONGO_URI (your MongoDB connection string)
    echo - JWT_SECRET (run: openssl rand -base64 64)
    echo.
    pause
)

REM Start backend with production file
echo Starting production backend...
echo.
cd backend
node index.production.js
