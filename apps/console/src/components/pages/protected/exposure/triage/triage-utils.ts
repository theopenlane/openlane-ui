import { type VulnerabilityWhereInput } from '@repo/codegen/src/schema'
import { type VulnerabilitiesNodeNonNull } from '@/lib/graphql-hooks/vulnerability'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { getVulnerabilityDueDate, type DueDateInfo } from '@/utils/vulnerability-due-date'

export type TriageVuln = VulnerabilitiesNodeNonNull & { dueInfo: DueDateInfo }

export type TriageFacet = 'all' | 'pastdue' | 'critical'

const SEARCH_FIELDS = ['displayNameContainsFold', 'displayIDContainsFold', 'externalIDContainsFold', 'cveIDContainsFold', 'scopeNameContainsFold', 'packageNameContainsFold'] as const

export const buildVulnerabilitySearchFilter = (query: string): VulnerabilityWhereInput | null => {
  const trimmed = query.trim()
  if (!trimmed) return null
  return { or: SEARCH_FIELDS.map((field) => ({ [field]: trimmed }) as VulnerabilityWhereInput) }
}

export const combineVulnerabilityWhere = (base: VulnerabilityWhereInput, ...filters: (VulnerabilityWhereInput | null | undefined)[]): VulnerabilityWhereInput => {
  const active = filters.filter((filter): filter is VulnerabilityWhereInput => Boolean(filter))
  if (active.length === 0) return base
  if (active.length === 1) return { ...base, ...active[0] }
  return { ...base, and: active }
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  med: 2,
  low: 3,
  none: 4,
}

export const getSeverityRank = (vuln: Pick<VulnerabilitiesNodeNonNull, 'securityLevel' | 'severity'>): number => {
  const key = (vuln.securityLevel || vuln.severity || '').toLowerCase()
  return SEVERITY_RANK[key] ?? 5
}

const bySeverityThenScore = (a: TriageVuln, b: TriageVuln): number => {
  const rank = getSeverityRank(a) - getSeverityRank(b)
  if (rank !== 0) return rank
  return (b.score ?? 0) - (a.score ?? 0)
}

export const getSeverityLabel = (vuln: Pick<VulnerabilitiesNodeNonNull, 'securityLevel' | 'severity'>): string => {
  return vuln.securityLevel || vuln.severity || 'None'
}

export const getVulnerabilityName = (vuln: Pick<VulnerabilitiesNodeNonNull, 'displayName' | 'cveID' | 'externalID' | 'displayID'>): string => {
  return vuln.displayName || vuln.cveID || vuln.externalID || vuln.displayID || ''
}

export type TriageGroups = {
  pastDue: TriageVuln[]
  open: TriageVuln[]
  ordered: TriageVuln[]
}

export const buildTriageGroups = (vulnerabilities: VulnerabilitiesNodeNonNull[], slaDefinitions: SlaDefinitionsNodeNonNull[]): TriageGroups => {
  const withDueInfo: TriageVuln[] = vulnerabilities.map((vuln) => ({ ...vuln, dueInfo: getVulnerabilityDueDate(vuln, slaDefinitions) }))

  const pastDue = withDueInfo.filter((v) => v.dueInfo.pastDue).sort(bySeverityThenScore)
  const open = withDueInfo.filter((v) => !v.dueInfo.pastDue).sort(bySeverityThenScore)

  return { pastDue, open, ordered: [...pastDue, ...open] }
}
