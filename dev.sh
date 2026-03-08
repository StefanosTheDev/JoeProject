#!/bin/bash

# Load Homebrew into PATH
eval "$(/opt/homebrew/bin/brew shellenv)"

# Start backend and frontend together — Ctrl+C kills both
trap 'kill 0' EXIT

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting backend (FastAPI) and frontend (Vite)..."

# Backend - uvicorn with auto-reload
cd "$DIR/backend"
/opt/homebrew/bin/python3.12 -m uvicorn app.main:app --reload --port 8000 &

# Frontend - vite dev server with hot reload
cd "$DIR/frontend"
npm run dev &

wait
