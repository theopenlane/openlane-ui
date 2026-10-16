#!/usr/bin/env bash
# Runs inside the e2e service (docker-compose.yml): one Playwright shard of the console
# suite. Buildkite's parallelism picks the shard; Playwright splits the tests.
set -euo pipefail

# the container runs as root; give the checkout back to the agent's user whatever happens
trap 'chown -R "$(stat -c %u:%g /workdir)" /workdir' EXIT

SHARD=$((${BUILDKITE_PARALLEL_JOB:-0} + 1))
TOTAL="${BUILDKITE_PARALLEL_JOB_COUNT:-1}"

apt-get update -qq && apt-get install -y -qq curl lsof >/dev/null
npm install -g bun@1.3.13 >/dev/null

for _ in $(seq 1 90); do
  curl -sf --max-time 2 http://localhost:17608/livez >/dev/null && break
  sleep 2
done

bun install --frozen-lockfile

AUTH_SECRET="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))")"
export AUTH_SECRET NEXTAUTH_SECRET="${AUTH_SECRET}"

# run-prod-suite.sh writes the console server log under TMPDIR; keep it with the artifacts
mkdir -p /workdir/e2e-logs
export TMPDIR=/workdir/e2e-logs

export PLAYWRIGHT_BLOB_OUTPUT_DIR=e2e/blob-report
export PLAYWRIGHT_BLOB_OUTPUT_NAME="report-${SHARD}.zip"
export PLAYWRIGHT_JUNIT_OUTPUT_NAME="e2e/results/junit-${SHARD}.xml"

cd apps/console

# the console build step's production build (.next), shared by every shard
if [[ -f /workdir/console-next.tgz ]]; then
  tar -xzf /workdir/console-next.tgz
  export E2E_SKIP_BUILD=1
fi

bash e2e/run-prod-suite.sh --shard="${SHARD}/${TOTAL}" --reporter=blob,junit
