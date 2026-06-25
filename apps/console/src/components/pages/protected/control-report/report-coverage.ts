import { ControlControlStatus } from '@repo/codegen/src/schema'
import { ORG_COVERAGE_SEVERITY_ORDER } from '@/components/shared/enum-mapper/control-enum'
import { type ControlReportItem } from '@/lib/graphql-hooks/control'
import { type OrgCoverageData } from './org-coverage-cell'

export type RelatedControlItem = NonNullable<ControlReportItem['relatedControls']>[number]

const INACTIVE_STATUSES = new Set<string>([ControlControlStatus.ARCHIVED, ControlControlStatus.NOT_APPLICABLE])

const isOrgRelated = (related: RelatedControlItem): boolean => !related.referenceFramework || related.referenceFramework === 'CUSTOM'

export const getOrgRelatedControls = (related?: RelatedControlItem[] | null): RelatedControlItem[] => (related ?? []).filter((r) => isOrgRelated(r))

export const getFrameworkRelatedControls = (related?: RelatedControlItem[] | null): RelatedControlItem[] => (related ?? []).filter((r) => !isOrgRelated(r))

export const deriveOrgCoverage = (related?: RelatedControlItem[] | null): OrgCoverageData | null => {
  const orgRefs = getOrgRelatedControls(related)
  if (orgRefs.length === 0) return null

  const active = orgRefs.filter((r) => !INACTIVE_STATUSES.has(r.status ?? ''))
  const approvedCount = active.filter((r) => r.status === ControlControlStatus.APPROVED).length

  let worstStatus: ControlControlStatus | null = null
  let worstIdx = ORG_COVERAGE_SEVERITY_ORDER.length
  for (const r of active) {
    const idx = r.status ? ORG_COVERAGE_SEVERITY_ORDER.indexOf(r.status) : -1
    if (idx !== -1 && idx < worstIdx) {
      worstIdx = idx
      worstStatus = ORG_COVERAGE_SEVERITY_ORDER[idx]
    }
  }

  return {
    approvedCount,
    activeCount: active.length,
    worstStatus,
    orgControlRefs: orgRefs.map((r) => ({ id: r.id, refCode: r.refCode, status: r.status })),
  }
}
