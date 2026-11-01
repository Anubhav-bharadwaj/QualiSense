#!/usr/bin/env bash
# QualiSense AI — Frontend Launcher (Linux / macOS)
set -e
cd "$(dirname "$0")/../frontend"

echo "Starting QualiSense AI Next.js frontend..."
npm run dev
