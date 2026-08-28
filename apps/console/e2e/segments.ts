import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const TESTS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'tests')

export const SEGMENTS: Record<string, string[]> = {
  smoke: ['smoke.spec.ts'],

  auth: ['auth.spec.ts', 'onboarding.spec.ts', 'org-lifecycle-fresh.spec.ts', 'public.spec.ts', 'storage-state.spec.ts', 'user-settings.spec.ts'],

  permissions: ['permissions-matrix.spec.ts', 'permissions-programs-controls.spec.ts', 'permissions.spec.ts'],

  controls: [
    'comments-flows.spec.ts',
    'control-implementations.spec.ts',
    'control-objectives-list.spec.ts',
    'control-objectives.spec.ts',
    'controls-bulk-upload.spec.ts',
    'controls-crud.spec.ts',
    'controls-mapping.spec.ts',
    'controls.spec.ts',
    'map-control-edit-flows.spec.ts',
    'map-control-flows.spec.ts',
    'standards-adoption.spec.ts',
    'standards.spec.ts',
    'subcontrol-detail-flows.spec.ts',
    'subcontrols-flows.spec.ts',
  ],

  documents: [
    'policies-create-form.spec.ts',
    'policies-crud.spec.ts',
    'policies.spec.ts',
    'procedures-create-form.spec.ts',
    'procedures-crud.spec.ts',
    'procedures-edit-form.spec.ts',
    'procedures-table.spec.ts',
    'procedures.spec.ts',
  ],

  programs: ['programs-crud.spec.ts', 'programs-wizard.spec.ts', 'programs.spec.ts'],

  evidence: ['evidence-crud.spec.ts', 'evidence.spec.ts'],

  automation: [
    'automation-campaigns.spec.ts',
    'automation-communications.spec.ts',
    'automation-crud.spec.ts',
    'automation-other.spec.ts',
    'automation-questionnaires.spec.ts',
    'automation-tasks.spec.ts',
    'automation-templates.spec.ts',
    'automation-workflows.spec.ts',
    'tasks-flows.spec.ts',
    'tasks.spec.ts',
  ],

  exposure: [
    'exposure-action-plans-crud.spec.ts',
    'exposure-crud.spec.ts',
    'exposure-entities-crud.spec.ts',
    'exposure-flows.spec.ts',
    'exposure-overview-flows.spec.ts',
    'exposure.spec.ts',
    'reviews-flows.spec.ts',
    'risk-detail-flows.spec.ts',
    'risk-properties-flows.spec.ts',
  ],

  registry: [
    'bulk-csv-imports.spec.ts',
    'bulk-edit-dialogs.spec.ts',
    'documents-and-evidence-flows.spec.ts',
    'platforms-flows.spec.ts',
    'registry-crud.spec.ts',
    'registry-flows.spec.ts',
    'registry-tables.spec.ts',
    'registry.spec.ts',
    'system-details-filters.spec.ts',
    'vendors-flows.spec.ts',
  ],

  'trust-center': ['trust-center-crud.spec.ts', 'trust-center-documents-flows.spec.ts', 'trust-center.spec.ts'],

  admin: [
    'custom-data-crud.spec.ts',
    'developers-tokens.spec.ts',
    'developers.spec.ts',
    'integrations-config-form.spec.ts',
    'integrations.spec.ts',
    'org-authentication-domains.spec.ts',
    'organization-settings.spec.ts',
    'organization.spec.ts',
    'subscribers-crud.spec.ts',
    'user-management-crud.spec.ts',
    'user-management.spec.ts',
  ],

  platform: [
    'bulk-import-and-pagination.spec.ts',
    'cross-cutting.spec.ts',
    'dashboard.spec.ts',
    'global-search.spec.ts',
    'journeys.spec.ts',
    'new-routes.spec.ts',
    'notifications.spec.ts',
    'remaining-mutations.spec.ts',
    'table-preferences.spec.ts',
  ],
}

export const SEGMENT_NAMES = Object.keys(SEGMENTS)

const listSpecFiles = (): string[] => readdirSync(TESTS_DIR).filter((name) => name.endsWith('.spec.ts'))

export const assertSegmentsCoverAllSpecs = (): void => {
  const onDisk = new Set(listSpecFiles())
  const seen = new Map<string, string>()
  const problems: string[] = []

  for (const [segment, files] of Object.entries(SEGMENTS)) {
    for (const file of files) {
      const owner = seen.get(file)
      if (owner) {
        problems.push(`"${file}" is claimed by both "${owner}" and "${segment}" — a spec must belong to exactly one segment`)
        continue
      }
      seen.set(file, segment)
      if (!onDisk.has(file)) {
        problems.push(`"${file}" is listed under segment "${segment}" but does not exist in e2e/tests`)
      }
    }
  }

  for (const file of [...onDisk].sort()) {
    if (!seen.has(file)) {
      problems.push(`"${file}" is not assigned to any segment — add it to a segment in e2e/segments.ts`)
    }
  }

  if (problems.length > 0) {
    throw new Error(`e2e/segments.ts is out of sync with e2e/tests:\n  - ${problems.join('\n  - ')}`)
  }
}

const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const segmentTestMatch = (segment: string): RegExp => {
  const files = SEGMENTS[segment]
  return new RegExp(`[\\\\/](?:${files.map(escapeForRegExp).join('|')})$`)
}
