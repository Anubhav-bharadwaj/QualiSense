@echo off
title QualiSense AI Launcher
cd /d "%~dp0"
echo ========================================================
echo   Launching QualiSense AI Platform (Backend + Frontend)
echo ========================================================
start "QualiSense Backend (FastAPI)" cmd /c "run_backend.bat"
timeout /t 3 /nobreak >nul
start "QualiSense Frontend (Next.js)" cmd /c "run_frontend.bat"
echo.
echo QualiSense AI is booting!
echo Frontend will be accessible at: http://localhost:3000
echo Backend API and Swagger docs at: http://127.0.0.1:8000/docs
echo.

