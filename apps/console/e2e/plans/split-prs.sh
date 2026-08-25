#!/usr/bin/env bash
set -euo pipefail

# Splits the feat-playwright-e2e branch into three reviewable branches.
#
#   e2e/split/auth-session-hardening   (from origin/main)
#   e2e/split/console-unit-tests       (from origin/main)
#   e2e/split/playwright-suite         (stacked on auth-session-hardening)
#
# Usage:  bash apps/console/e2e/plans/split-prs.sh [SRC_REF]
#
# SRC_REF defaults to HEAD and must contain every change to be split, so commit
# any work in progress on feat-playwright-e2e first. The working tree must be
# clean; this script only creates new branches and never touches the source one.

SRC_REF="${1:-HEAD}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "ERROR: working tree has uncommitted tracked changes. Commit them onto" >&2
  echo "       feat-playwright-e2e first, then re-run with that commit as SRC_REF." >&2
  exit 1
fi

SRC="$(git rev-parse "$SRC_REF")"
BASE="origin/main"
START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

AUTH_BRANCH="e2e/split/auth-session-hardening"
UNIT_BRANCH="e2e/split/console-unit-tests"
E2E_BRANCH="e2e/split/playwright-suite"

for b in "$AUTH_BRANCH" "$UNIT_BRANCH" "$E2E_BRANCH"; do
  if git show-ref --verify --quiet "refs/heads/$b"; then
    echo "ERROR: branch $b already exists. Delete it or rename it first." >&2
    exit 1
  fi
done

manifest_auth() {
  cat <<'FILES'
apps/console/src/components/shared/session-expired-modal/session-expired-modal.tsx
apps/console/src/lib/auth/utils/redirect.test.ts
apps/console/src/lib/auth/utils/refresh-classification.test.ts
apps/console/src/lib/auth/utils/refresh-token.ts
apps/console/src/lib/auth/utils/secure-fetch.test.ts
apps/console/src/lib/auth/utils/session-health.ts
apps/console/src/lib/auth/utils/session-refresh.test.ts
apps/console/src/lib/auth/utils/session-refresh.ts
apps/console/src/lib/auth/utils/set-csrf-cookie.ts
apps/console/src/lib/auth/utils/set-session-cookie.ts
apps/console/src/lib/auth/utils/sso-token-storage.test.ts
apps/console/src/lib/auth/utils/sso-token-storage.ts
apps/console/src/lib/graphqlClient.ts
packages/dally/src/index.ts
FILES
}

manifest_unit() {
  git diff --name-only "$BASE" "$SRC" \
    | grep -E '\.test\.ts$' \
    | grep -v '^apps/console/src/lib/auth/utils/'
  echo ".husky/pre-commit"
}

manifest_e2e() {
  local assigned
  assigned="$( { manifest_auth; manifest_unit; } | sort -u)"
  git diff --name-only "$BASE" "$SRC" | sort -u | comm -23 - <(echo "$assigned")
}

build_branch() {
  local branch="$1" base="$2" subject="$3" manifest_fn="$4"
  local files
  files="$($manifest_fn | sort -u)"

  git switch --quiet -c "$branch" "$base"
  # shellcheck disable=SC2086
  echo "$files" | tr '\n' '\0' | xargs -0 git checkout "$SRC" --
  echo "$files" | tr '\n' '\0' | xargs -0 git add --
  git commit --quiet -s -m "$subject"
  echo "==> $branch: $(echo "$files" | wc -l) files, $(git rev-parse --short HEAD)"
}

build_branch "$AUTH_BRANCH" "$BASE" \
  "fix(auth): stop a single 401 from revoking a live session" manifest_auth

build_branch "$UNIT_BRANCH" "$BASE" \
  "test(console): unit coverage for filters, storage, formatting and plan helpers" manifest_unit

build_branch "$E2E_BRANCH" "$AUTH_BRANCH" \
  "test(e2e): Playwright suite, prod-build runner and CI workflows" manifest_e2e

git switch --quiet "$START_BRANCH"

echo
echo "Created:"
echo "  $AUTH_BRANCH   -> PR into main"
echo "  $UNIT_BRANCH   -> PR into main"
echo "  $E2E_BRANCH    -> PR into $AUTH_BRANCH (stacked; retarget to main after that merges)"
echo
echo "Verification: the three branches together must reproduce $SRC exactly."
echo "  git diff --stat $SRC $E2E_BRANCH -- . ':(exclude).husky' ':(exclude)*.test.ts'"
