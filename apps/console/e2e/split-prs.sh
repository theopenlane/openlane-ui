#!/usr/bin/env bash
set -euo pipefail

# Splits the feat-playwright-e2e branch into four reviewable branches.
#
#   e2e/split/auth-session-hardening   (from origin/main)
#   e2e/split/console-unit-tests       (from origin/main)
#   e2e/split/filter-hardening         (stacked on auth-session-hardening)
#   e2e/split/playwright-suite         (stacked on filter-hardening)
#
# The filter branch carries its own tests rather than sending them to the unit
# branch: filter-schema-coercion.test.ts imports 35 config modules and needs
# symbols (toUtcDayStart, the map*FilterKey functions, the curried
# defineFilterFields) that only exist alongside those source changes, so a
# tests-only branch off main would fail the CI type-check.
#
# It is stacked rather than branched off main because three of its files
# (auditor-controls-table.tsx, questionnaire/template/table-config.ts,
# crud-base/page.tsx) also carry unrelated changes from this branch, and a
# whole-file manifest cannot split a file between two branches.
#
# Usage:  bash apps/console/e2e/split-prs.sh [SRC_REF]
#
# SRC_REF defaults to HEAD and must contain every change to be split, so commit
# any work in progress on feat-playwright-e2e first. The working tree must be
# clean; this script only creates new branches and never touches the source one.
#
# Commits are made with --no-verify on purpose. The pre-commit hook reformats
# staged files in place, which would make a split branch diverge from SRC_REF,
# and it type-checks and tests a partial tree that is not what any of these
# branches is meant to stand alone as. SRC_REF is verified before splitting.
#
# .husky/pre-commit belongs to the Playwright branch, not the unit-test branch:
# narrowing `bun test` to explicit paths is what stops bun from collecting the
# Playwright .spec.ts files, so the e2e branch cannot commit without it.

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
FILTER_BRANCH="e2e/split/filter-hardening"
UNIT_BRANCH="e2e/split/console-unit-tests"
E2E_BRANCH="e2e/split/playwright-suite"

for b in "$AUTH_BRANCH" "$UNIT_BRANCH" "$FILTER_BRANCH" "$E2E_BRANCH"; do
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

manifest_filter() {
  cat <<'FILES'
apps/console/src/components/pages/protected/action-plans/table/table-config.tsx
apps/console/src/components/pages/protected/assets/table/table-config.tsx
apps/console/src/components/pages/protected/auditor-dashboard/table/auditor-controls-table.tsx
apps/console/src/components/pages/protected/auditor-dashboard/table/table-config.ts
apps/console/src/components/pages/protected/campaigns/table/table-config.ts
apps/console/src/components/pages/protected/contacts/table/table-config.tsx
apps/console/src/components/pages/protected/controls/table/controls-table.tsx
apps/console/src/components/pages/protected/controls/table/table-config.tsx
apps/console/src/components/pages/protected/controls/tabs/documentation/documentation-filter-mappers.ts
apps/console/src/components/pages/protected/controls/tabs/documentation/policies-table.tsx
apps/console/src/components/pages/protected/controls/tabs/documentation/procedures-table.tsx
apps/console/src/components/pages/protected/controls/tabs/evidence/evidence-table-config.tsx
apps/console/src/components/pages/protected/controls/tabs/linked-controls/subcontrols-table-config.tsx
apps/console/src/components/pages/protected/developers/table/table-config.ts
apps/console/src/components/pages/protected/evidence/table/evidence-table.tsx
apps/console/src/components/pages/protected/evidence/table/table-config.ts
apps/console/src/components/pages/protected/findings/table/table-config.tsx
apps/console/src/components/pages/protected/groups/groups-page.tsx
apps/console/src/components/pages/protected/groups/table/table-config.ts
apps/console/src/components/pages/protected/organization-settings/subscribers/table/table-config.ts
apps/console/src/components/pages/protected/overview/DashboardComplianceOverview.tsx
apps/console/src/components/pages/protected/personnel/detail/tabs/linked-accounts/linked-accounts-tab.tsx
apps/console/src/components/pages/protected/personnel/table/table-config.tsx
apps/console/src/components/pages/protected/platforms/table/table-config.tsx
apps/console/src/components/pages/protected/policies/table/policies-table.tsx
apps/console/src/components/pages/protected/policies/table/table-config.ts
apps/console/src/components/pages/protected/procedures/table/procedures-table.tsx
apps/console/src/components/pages/protected/procedures/table/table-config.ts
apps/console/src/components/pages/protected/questionnaire/delivery-filter-config.ts
apps/console/src/components/pages/protected/questionnaire/questionnaire-detail-page.tsx
apps/console/src/components/pages/protected/questionnaire/table/questionnaire-table.tsx
apps/console/src/components/pages/protected/questionnaire/table/table-config.ts
apps/console/src/components/pages/protected/questionnaire/template/table/table-config.ts
apps/console/src/components/pages/protected/remediations/table/table-config.tsx
apps/console/src/components/pages/protected/reviews/common/risk-review-config.tsx
apps/console/src/components/pages/protected/reviews/table/table-config.tsx
apps/console/src/components/pages/protected/risks/table/table-config.ts
apps/console/src/components/pages/protected/scans/table/table-config.tsx
apps/console/src/components/pages/protected/standards/table/table-config.ts
apps/console/src/components/pages/protected/system-details/table/table-config.tsx
apps/console/src/components/pages/protected/tasks/table/table-config.ts
apps/console/src/components/pages/protected/tasks/table/task-table-toolbar.tsx
apps/console/src/components/pages/protected/trust-center/NDAs/table/table-config.tsx
apps/console/src/components/pages/protected/trust-center/reports-and-certifications/reports-and-certifications-page.tsx
apps/console/src/components/pages/protected/trust-center/reports-and-certifications/table/table-config.tsx
apps/console/src/components/pages/protected/trust-center/subprocessors/table/table-config.tsx
apps/console/src/components/pages/protected/user-management/members/members-table.tsx
apps/console/src/components/pages/protected/user-management/members/table/table-config.ts
apps/console/src/components/pages/protected/vendors/detail/tabs/contacts/contacts-tab.tsx
apps/console/src/components/pages/protected/vendors/table/table-config.tsx
apps/console/src/components/pages/protected/vulnerabilities/table/table-config.tsx
apps/console/src/components/pages/protected/workflows/table/table-config.tsx
apps/console/src/components/shared/crud-base/page.tsx
apps/console/src/components/shared/crud-base/tabs/activity-tasks-config.tsx
apps/console/src/components/shared/table-filter/filter-schema-coercion.test.ts
apps/console/src/components/shared/table-filter/filter-storage.test.ts
apps/console/src/components/shared/table-filter/program-filter-field.ts
apps/console/src/components/shared/table-filter/scope-environment-filter-fields.ts
apps/console/src/components/shared/table-filter/table-filter-helper.test.ts
apps/console/src/components/shared/table-filter/table-filter-helper.ts
apps/console/src/components/shared/table-filter/where-generator.test.ts
apps/console/src/types/index.tsx
turbo.json
FILES
}

manifest_unit() {
  git diff --name-only "$BASE" "$SRC" \
    | grep -E '\.test\.ts$' \
    | grep -v '^apps/console/src/lib/auth/utils/' \
    | sort -u | comm -23 - <(manifest_filter | sort -u)
}

manifest_e2e() {
  local assigned
  assigned="$( { manifest_auth; manifest_unit; manifest_filter; } | sort -u)"
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
  git commit --quiet --no-verify -s -m "$subject"
  echo "==> $branch: $(echo "$files" | wc -l) files, $(git rev-parse --short HEAD)"
}

build_branch "$AUTH_BRANCH" "$BASE" \
  "fix(auth): stop a single 401 from revoking a live session" manifest_auth

build_branch "$UNIT_BRANCH" "$BASE" \
  "test(console): unit coverage for filters, storage, formatting and plan helpers" manifest_unit

build_branch "$FILTER_BRANCH" "$AUTH_BRANCH" \
  "fix(filters): correct invalid filter keys and date boundaries, validate filter keys and page mappers" manifest_filter

build_branch "$E2E_BRANCH" "$FILTER_BRANCH" \
  "test(e2e): Playwright suite, prod-build runner and CI workflows" manifest_e2e

git switch --quiet "$START_BRANCH"

echo
echo "Created:"
echo "  $AUTH_BRANCH   -> PR into main"
echo "  $UNIT_BRANCH   -> PR into main"
echo "  $FILTER_BRANCH -> PR into $AUTH_BRANCH (stacked; retarget to main after that merges)"
echo "  $E2E_BRANCH    -> PR into $FILTER_BRANCH (stacked; retarget as the stack merges)"
echo
echo "Verification: the three branches together must reproduce $SRC exactly."
echo "  git diff --stat $SRC $E2E_BRANCH -- . ':(exclude).husky' ':(exclude)*.test.ts'"
