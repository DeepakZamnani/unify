#!/usr/bin/env bash
# Starts all UNIFY services. Ctrl+C stops everything.
#   Express API  (Firestore CRUD)       http://localhost:5000
#   FastAPI      (COMS + chatbot, AI)   http://127.0.0.1:8000
#   Frontend     (Vite)                 http://localhost:5173
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDS=()
trap 'kill "${PIDS[@]}" 2>/dev/null' EXIT INT TERM

# Vite 8 needs Node >= 20.19; switch via nvm if the current node is older.
if [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -lt 20 ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22 >/dev/null
fi
echo "Using node $(node -v)"

cd "$ROOT/unify/backend"
[ -d node_modules ] || npm install
[ -e .env ] || ln -s ../../backend/.env .env   # shares backend/.env
npm run dev &
PIDS+=($!)

cd "$ROOT/backend"
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
# Export only KEY=VALUE lines (skips comments/stray text in .env).
set -a; . <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env); set +a
.venv/bin/python -m uvicorn app.main:app --reload --port 8000 &
PIDS+=($!)

cd "$ROOT/frontend"
[ -d node_modules ] || npm install
npm run dev
