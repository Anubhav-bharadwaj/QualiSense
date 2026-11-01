#!/usr/bin/env bash
# QualiSense AI — Dual App Launcher (Linux / macOS)
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================"
echo "  Launching QualiSense AI Platform (Backend + Frontend) "
echo "========================================================"

# Launch backend in background
bash "$SCRIPT_DIR/run_backend.sh" &
BACKEND_PID=$!

sleep 3

# Launch frontend in background
bash "$SCRIPT_DIR/run_frontend.sh" &
FRONTEND_PID=$!

echo ""
echo "QualiSense AI is booting!"
echo "Frontend will be accessible at: http://localhost:3000"
echo "Backend API and Swagger docs at: http://127.0.0.1:8000/docs"
echo "Press [Ctrl+C] to stop all services."
echo ""

# Trap Ctrl+C to kill both background processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
