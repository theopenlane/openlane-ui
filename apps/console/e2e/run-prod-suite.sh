#!/usr/bin/env bash
# Build the console, serve it, run the suite against it, tear it down.
# Port MUST be one of core's CORS `alloworigins` (3001 or 3004) or every GraphQL POST is blocked.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${E2E_PORT:-3004}"
BASE_URL="http://localhost:${PORT}"
SERVER_LOG="${TMPDIR:-/tmp}/openlane-e2e-prod-server.log"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "==> stopping server (pid $SERVER_PID)"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

case "$PORT" in
  3001 | 3004) ;;
  *)
    echo "ERROR: port ${PORT} is not in core's CORS alloworigins (3001, 3004)." >&2
    echo "       The browser calls core directly, so every GraphQL POST would be" >&2
    echo "       blocked and onboarding would stall. Use 3001 or 3004." >&2
    exit 1
    ;;
esac

if lsof -i ":${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "ERROR: port ${PORT} is already in use. Free it or set E2E_PORT." >&2
  exit 1
fi

if ! curl -sf --max-time 5 http://localhost:17608/livez >/dev/null; then
  echo "ERROR: theopenlane/core is not answering on :17608. Start it with 'task run-dev'." >&2
  exit 1
fi

if [[ -z "${E2E_SKIP_BUILD:-}" ]]; then
  echo "==> building console (this needs several GB of RAM and a few minutes)"
  COOKIE_PLAYWRIGHT_INSECURE=true bun run build
else
  echo "==> E2E_SKIP_BUILD set — reusing the existing build"
fi

echo "==> starting production server on ${BASE_URL}"
COOKIE_PLAYWRIGHT_INSECURE=true AUTH_TRUST_HOST=true bunx next start -p "$PORT" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 60); do
  if curl -sf --max-time 2 "${BASE_URL}/login" >/dev/null; then break; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "ERROR: server exited during startup. Log:" >&2
    tail -40 "$SERVER_LOG" >&2
    exit 1
  fi
  sleep 2
done

if ! curl -sf --max-time 2 "${BASE_URL}/login" >/dev/null; then
  echo "ERROR: server never became ready on ${BASE_URL}. Log:" >&2
  tail -40 "$SERVER_LOG" >&2
  exit 1
fi

echo "==> running suite against ${BASE_URL}"
set +e
E2E_BASE_URL="$BASE_URL" bunx playwright test "$@"
STATUS=$?
set -e

echo "==> done (exit ${STATUS}); server log at ${SERVER_LOG}"
exit "$STATUS"
