#!/usr/bin/env bash
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

PORT="${E2E_PORT:-3001}"
SHARD_SIZE="${E2E_SHARD_SIZE:-8}"
RSS_LIMIT_MB="${E2E_RSS_LIMIT_MB:-6000}"
BASE_URL="http://localhost:${PORT}"
DEV_LOG="/tmp/e2e-sharded-dev.log"
DEV_PID=""
LISTENER_PID=""

strip_ansi() { sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g'; }

listener_on_port() {
  ss -ltnp 2>/dev/null | grep ":${PORT} " | grep -oP 'pid=\K[0-9]+' | head -1
}

wait_for_login() {
  local code
  for _ in $(seq 1 90); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "${BASE_URL}/login" || true)"
    [ "$code" = "200" ] && return 0
    sleep 2
  done
  return 1
}

stop_dev() {
  [ -n "${DEV_PID}" ] && kill -- "-${DEV_PID}" 2>/dev/null || true
  [ -n "${LISTENER_PID}" ] && kill "${LISTENER_PID}" 2>/dev/null || true
  local leftover
  leftover="$(listener_on_port)"
  [ -n "${leftover}" ] && kill "${leftover}" 2>/dev/null || true
  for _ in $(seq 1 30); do
    [ -z "$(listener_on_port)" ] && break
    sleep 1
  done
  LISTENER_PID=""
  DEV_PID=""
}

start_dev() {
  local attempt
  for attempt in 1 2 3; do
    stop_dev
    echo "[sharded] starting dev server on :${PORT} (attempt ${attempt}) ..."
    echo "===== start_dev attempt ${attempt} @ $(date '+%H:%M:%S') =====" >>"${DEV_LOG}"
    setsid bash -c 'exec bun run dev' >>"${DEV_LOG}" 2>&1 &
    DEV_PID=$!
    if wait_for_login && [ -n "$(listener_on_port)" ]; then
      LISTENER_PID="$(listener_on_port)"
      curl -s -o /dev/null --max-time 50 "${BASE_URL}/login" || true
      echo "[sharded] dev server ready (listener ${LISTENER_PID:-unknown})"
      return 0
    fi
    echo "[sharded] dev server did not come up on attempt ${attempt}; retrying"
  done
  echo "[sharded] dev server never became ready; tail of ${DEV_LOG}:"
  tail -20 "${DEV_LOG}" | strip_ansi
  return 1
}

dev_rss_mb() {
  [ -z "${LISTENER_PID}" ] && { echo 0; return; }
  local kb
  kb="$(ps -o rss= -p "${LISTENER_PID}" 2>/dev/null | tr -d ' ')"
  echo "$(( ${kb:-0} / 1024 ))"
}

ensure_fresh_dev() {
  if [ -z "${LISTENER_PID}" ] || ! kill -0 "${LISTENER_PID}" 2>/dev/null; then
    start_dev
    return
  fi
  local rss
  rss="$(dev_rss_mb)"
  if [ "${rss}" -gt "${RSS_LIMIT_MB}" ]; then
    echo "[sharded] dev server at ${rss}MB > ${RSS_LIMIT_MB}MB — restarting to shed memory"
    start_dev
  else
    echo "[sharded] dev server healthy at ${rss}MB"
  fi
}

keep_auth_fresh() {
  [ -f e2e/.auth/manifest.json ] && touch e2e/.auth/manifest.json || true
}

seed_auth() {
  echo "[sharded] seeding auth via smoke spec (global-setup) ..."
  local i
  for i in 1 2 3; do
    if bun run e2e tests/smoke.spec.ts --reporter=line >/tmp/e2e-sharded-seed.log 2>&1; then
      echo "[sharded] seed ok"
      return 0
    fi
    echo "[sharded] seed attempt ${i} failed (cold compile?) — retrying"
  done
  echo "[sharded] seeding failed after 3 attempts; tail:"
  tail -25 /tmp/e2e-sharded-seed.log | strip_ansi
  return 1
}

trap stop_dev EXIT

if [ "$#" -gt 0 ]; then
  SPECS=("$@")
else
  mapfile -t SPECS < <(ls e2e/tests/*.spec.ts | grep -v '/smoke.spec.ts$' | sort)
fi

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_FLAKY=0
FAILED_BATCHES=()

start_dev || exit 1
seed_auth || exit 1

batch_idx=0
i=0
while [ "$i" -lt "${#SPECS[@]}" ]; do
  batch=("${SPECS[@]:$i:$SHARD_SIZE}")
  batch_idx=$((batch_idx + 1))
  names=""
  for s in "${batch[@]}"; do names+="${s##*/} "; done
  echo "=================================================================="
  echo "[sharded] batch ${batch_idx}: ${names}"

  if ! ensure_fresh_dev; then
    echo "[sharded] could not bring up dev server for batch ${batch_idx} — skipping"
    FAILED_BATCHES+=("batch ${batch_idx}: dev server unavailable")
    i=$((i + SHARD_SIZE))
    continue
  fi
  keep_auth_fresh

  out="/tmp/e2e-sharded-batch-${batch_idx}.log"
  bun run e2e "${batch[@]}" --reporter=line >"${out}" 2>&1 || true

  summary="$(strip_ansi <"${out}" | grep -E '[0-9]+ (passed|failed|flaky)' | tail -1)"
  echo "[sharded] batch ${batch_idx} result: ${summary:-<no summary — see ${out}>}"

  p="$(echo "${summary}" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' || true)"
  f="$(echo "${summary}" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' || true)"
  fl="$(echo "${summary}" | grep -oE '[0-9]+ flaky' | grep -oE '[0-9]+' || true)"
  TOTAL_PASS=$((TOTAL_PASS + ${p:-0}))
  TOTAL_FAIL=$((TOTAL_FAIL + ${f:-0}))
  TOTAL_FLAKY=$((TOTAL_FLAKY + ${fl:-0}))
  if [ "${f:-0}" != "0" ]; then
    FAILED_BATCHES+=("batch ${batch_idx} (${names}): ${summary}")
  fi

  i=$((i + SHARD_SIZE))
done

stop_dev

echo "=================================================================="
echo "[sharded] TOTAL: ${TOTAL_PASS} passed · ${TOTAL_FAIL} failed · ${TOTAL_FLAKY} flaky"
if [ "${#FAILED_BATCHES[@]}" -gt 0 ]; then
  echo "[sharded] batches with failures:"
  printf '  - %s\n' "${FAILED_BATCHES[@]}"
  echo "[sharded] per-batch logs: /tmp/e2e-sharded-batch-*.log"
  exit 1
fi
echo "[sharded] all batches green"
