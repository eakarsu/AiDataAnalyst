#!/usr/bin/env bash
set -euo pipefail
[[ "${ALLOW_DEVELOPMENT_SEED:-}" == yes ]]||{ echo "Refusing to seed without ALLOW_DEVELOPMENT_SEED=yes" >&2;exit 1;};echo "No users, credentials, repositories, exports, documents, or answers are seeded."
