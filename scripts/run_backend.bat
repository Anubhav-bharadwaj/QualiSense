@echo off
title QualiSense AI — Backend API
cd /d "%~dp0.."
set OPENBLAS_NUM_THREADS=1
set MKL_NUM_THREADS=1
set OMP_NUM_THREADS=1
echo Starting QualiSense AI FastAPI backend...
if exist ".\backend\venv\Scripts\activate.bat" (
    call .\backend\venv\Scripts\activate.bat
) else if exist ".\venv\Scripts\activate.bat" (
    call .\venv\Scripts\activate.bat
)
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
pause

