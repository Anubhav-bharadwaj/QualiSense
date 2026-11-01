#!/usr/bin/env bash
# QualiSense AI — Backend API Launcher (Linux / macOS)
set -e
cd "$(dirname "$0")/.."

export OPENBLAS_NUM_THREADS=1
export MKL_NUM_THREADS=1
export OMP_NUM_THREADS=1

if [ -f "./backend/venv/bin/activate" ]; then
    source "./backend/venv/bin/activate"
elif [ -f "./venv/bin/activate" ]; then
    source "./venv/bin/activate"
elif [ -f "./.venv/bin/activate" ]; then
    source "./.venv/bin/activate"
fi

echo "Starting QualiSense AI FastAPI backend..."
python3 -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

