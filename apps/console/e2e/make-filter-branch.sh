#!/usr/bin/env bash
# Builds e2e/split/filter-hardening from origin/main.
#
# Run from the repo root, with the filter work committed on feat-playwright-e2e
# and passed as SRC_REF. The tree must be clean; untracked working notes are
# left alone because every add is path-scoped.
#
# Three files are excluded from the manifest and handled below instead:
#   split-prs.sh          does not exist on main
#   filter-storage.test.ts belongs to the e2e branch that created it
#   crud-base/page.tsx    also carries an unrelated createPermission change
#   turbo.json            main has no globalEnv block at all
set -euo pipefail

SRC_REF="${1:?usage: bash apps/console/e2e/make-filter-branch.sh <SRC_REF>}"
SRC="$(git rev-parse "$SRC_REF")"
BRANCH="e2e/split/filter-hardening"
PAGE="apps/console/src/components/shared/crud-base/page.tsx"

cd "$(git rev-parse --show-toplevel)"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "ERROR: working tree has uncommitted tracked changes." >&2
  exit 1
fi
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "ERROR: branch $BRANCH already exists. Delete or rename it first." >&2
  exit 1
fi

manifest() {
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
apps/console/src/components/shared/crud-base/tabs/activity-tasks-config.tsx
apps/console/src/components/shared/table-filter/filter-schema-coercion.test.ts
apps/console/src/components/shared/table-filter/filter-storage-validation.test.ts
apps/console/src/components/shared/table-filter/program-filter-field.ts
apps/console/src/components/shared/table-filter/scope-environment-filter-fields.ts
apps/console/src/components/shared/table-filter/table-filter-helper.test.ts
apps/console/src/components/shared/table-filter/table-filter-helper.ts
apps/console/src/components/shared/table-filter/where-generator.test.ts
apps/console/src/types/index.tsx
FILES
}

START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git switch --quiet -c "$BRANCH" origin/main

manifest | tr '\n' '\0' | xargs -0 git checkout "$SRC" --

sed -i \
  -e "s|^import { type FilterField } from '@/types'$|import { type FilterField, type WhereInputKey } from '@/types'|" \
  -e 's|^  searchFields?: string\[\]$|  searchFields?: WhereInputKey<TWhereInput>[]|' \
  "$PAGE"
grep -q 'WhereInputKey<TWhereInput>\[\]' "$PAGE" || { echo "ERROR: page.tsx patch did not apply" >&2; exit 1; }

sed -i '/^  "globalDependencies":/a\  "globalEnv": ["TZ"],' turbo.json
grep -q '"globalEnv": \["TZ"\]' turbo.json || { echo "ERROR: turbo.json patch did not apply" >&2; exit 1; }

manifest | tr '\n' '\0' | xargs -0 git add --
git add -- "$PAGE" turbo.json
git commit --quiet --no-verify -s -m "fix(filters): correct invalid filter keys and date boundaries, validate filter keys and page mappers"

echo "==> $BRANCH built on origin/main: $(git rev-parse --short HEAD)"
echo "    $(manifest | wc -l) manifest files + $PAGE + turbo.json"
echo
echo "Verify before pushing:"
echo "  cd apps/console && npx tsc --noEmit && bun test src"
echo "  git switch $START_BRANCH   # to come back"
