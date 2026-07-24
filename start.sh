#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test -f "$project_dir/.env" || { echo "Missing .env" >&2; exit 1; }
set -a
. "$project_dir/.env"
set +a
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
cleanup() {
  trap - INT TERM EXIT
  [[ -n "${backend_pid:-}" ]] && kill "$backend_pid" 2>/dev/null || true
  [[ -n "${frontend_pid:-}" ]] && kill "$frontend_pid" 2>/dev/null || true
  [[ -n "${backend_pid:-}" ]] && wait "$backend_pid" 2>/dev/null || true
  [[ -n "${frontend_pid:-}" ]] && wait "$frontend_pid" 2>/dev/null || true
}
case "${1:-start}" in
check) test -d "$project_dir/backend/node_modules"||{ echo "Run scripts/bootstrap.sh explicitly." >&2;exit 1;};test -d "$project_dir/frontend/node_modules"||{ echo "Run scripts/bootstrap.sh explicitly." >&2;exit 1;};;
migrate) exec "$project_dir/scripts/migrate.sh";;
start)
  "$0" check
  trap cleanup INT TERM EXIT
  (cd "$project_dir/backend" && exec env BACKEND_PORT="$BACKEND_PORT" PORT="$BACKEND_PORT" npm start) &
  backend_pid=$!
  (cd "$project_dir/frontend" && exec npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT") &
  frontend_pid=$!
  wait "$backend_pid"
  ;;
*) echo "Usage: ./start.sh [check|migrate|start]" >&2;exit 64;;esac
