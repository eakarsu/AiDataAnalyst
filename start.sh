#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-3001}"
case "${1:-start}" in
check) test -f "$project_dir/.env"||{ echo "Missing .env" >&2;exit 1;};test -d "$project_dir/backend/node_modules"||{ echo "Run scripts/bootstrap.sh explicitly." >&2;exit 1;};if [[ "${NODE_ENV:-}" != "test" ]];then test -d "$project_dir/frontend/node_modules"||{ echo "Run scripts/bootstrap.sh explicitly." >&2;exit 1;};fi;;
migrate) exec "$project_dir/scripts/migrate.sh";;
start) "$0" check;cd "$project_dir/backend";if [[ "${NODE_ENV:-}" == "test" ]];then exec env BACKEND_PORT="$BACKEND_PORT" PORT="$BACKEND_PORT" CLIENT_URL="${CLIENT_URL:-http://127.0.0.1:${FRONTEND_PORT:-5173}}" JWT_ISSUER="${JWT_ISSUER:-ai-data-analyst}" JWT_AUDIENCE="${JWT_AUDIENCE:-ai-data-analyst-api}" npm start;else exec env BACKEND_PORT="$BACKEND_PORT" PORT="$BACKEND_PORT" npm start;fi;;
*) echo "Usage: ./start.sh [check|migrate|start]" >&2;exit 64;;esac
