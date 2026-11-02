import { type VulnerabilityWhereInput } from '@repo/codegen/src/schema'
import { type VulnerabilitiesNodeNonNull, type VulnerabilityDueDateSource, type VulnerabilityTriageGroupNode } from '@/lib/graphql-hooks/vulnerability'
import { pluralizeWithCount } from '@/utils/strings'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { getVulnerabilityDueDate, type DueDateInfo } from '@/utils/vulnerability-due-date'

export type TriageVuln = VulnerabilitiesNodeNonNull & { dueInfo: DueDateInfo }

export type TriageFacet = 'all' | 'pastdue' | 'critical'

export const TRIAGE_PAGE_SIZE = 20

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

type TSeverityRanked = Pick<VulnerabilitiesNodeNonNull, 'securityLevel' | 'severity' | 'score'>

const bySeverityThenScore = (a: TSeverityRanked, b: TSeverityRanked): number => {
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

export type TriageRailRow = {
  id: string
  title: string
  subline: string
  score?: number | null
  severityLabel: string
  pastDue: boolean
}

export type TriageRailSection = { key: string; title: string; rows: TriageRailRow[] }

export const toRailSections = <T>(groups: { pastDue: T[]; open: T[] }, toRow: (item: T) => TriageRailRow): TriageRailSection[] => [
  { key: 'pastdue', title: 'Past Due', rows: groups.pastDue.map(toRow) },
  { key: 'open', title: 'Open', rows: groups.open.map(toRow) },
]

export type TTriageQueueArgs = {
  enabled: boolean
  facet: TriageFacet
  listWhere: VulnerabilityWhereInput | null
  allWhere: VulnerabilityWhereInput
  criticalWhere: VulnerabilityWhereInput
  pastDueWhere: VulnerabilityWhereInput | null
  pastDueFilter: VulnerabilityWhereInput | null
  slaDefinitions: SlaDefinitionsNodeNonNull[]
}

export type TTriageQueue<T extends { id: string }> = {
  ordered: T[]
  sections: TriageRailSection[]
  counts: { all: number; pastDue: number; critical: number }
  notice?: string
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

export const getTriageSubline = (vuln: Pick<VulnerabilitiesNodeNonNull, 'scopeName' | 'packageName' | 'source' | 'category'>): string => {
  const parts = [vuln.scopeName, vuln.packageName].filter(Boolean) as string[]
  if (parts.length) return parts.join(' · ')
  return vuln.source || vuln.category || '—'
}

export const toVulnRailRow = (vuln: TriageVuln): TriageRailRow => ({
  id: vuln.id,
  title: getVulnerabilityName(vuln),
  subline: getTriageSubline(vuln),
  score: vuln.score,
  severityLabel: getSeverityLabel(vuln),
  pastDue: vuln.dueInfo.pastDue,
})

type TriageGroupRepresentative = NonNullable<NonNullable<NonNullable<VulnerabilityTriageGroupNode['vulnerabilities']['edges']>[number]>['node']>

export type TriageCveGroup = {
  id: string
  count: number
  pastDueCount: number
  dueInfo: DueDateInfo | null
  representative: TriageGroupRepresentative
}

export type TriageCveGroups = {
  pastDue: TriageCveGroup[]
  open: TriageCveGroup[]
  ordered: TriageCveGroup[]
}

const summarizeGroupDue = (reports: VulnerabilityDueDateSource[], slaDefinitions: SlaDefinitionsNodeNonNull[]) => {
  const dueInfos = reports.map((report) => getVulnerabilityDueDate(report, slaDefinitions))
  const worst = dueInfos.reduce<DueDateInfo | null>((current, info) => (info.dueDate && (!current?.dueDate || info.dueDate < current.dueDate) ? info : current), null)
  return { pastDueCount: dueInfos.filter((info) => info.pastDue).length, dueInfo: worst }
}

export const buildTriageCveGroups = (nodes: VulnerabilityTriageGroupNode[], dueSources: VulnerabilityDueDateSource[], slaDefinitions: SlaDefinitionsNodeNonNull[]): TriageCveGroups => {
  const sourcesByCve = new Map<string, VulnerabilityDueDateSource[]>()
  dueSources.forEach((source) => {
    if (!source.cveID) return
    sourcesByCve.set(source.cveID, [...(sourcesByCve.get(source.cveID) ?? []), source])
  })

  const groups = nodes.flatMap((node): TriageCveGroup[] => {
    const representative = node.vulnerabilities.edges?.[0]?.node
    if (!representative || !node.key) return []
    return [{ id: node.key, count: node.count, ...summarizeGroupDue(sourcesByCve.get(node.key) ?? [], slaDefinitions), representative }]
  })

  const byRepresentative = (a: TriageCveGroup, b: TriageCveGroup) => bySeverityThenScore(a.representative, b.representative)
  const pastDue = groups.filter((group) => group.pastDueCount > 0).sort(byRepresentative)
  const open = groups.filter((group) => group.pastDueCount === 0).sort(byRepresentative)

  return { pastDue, open, ordered: [...pastDue, ...open] }
}

export const toCveGroupRailRow = (group: TriageCveGroup): TriageRailRow => {
  const reports = pluralizeWithCount(group.count, 'report')
  const pastDueSuffix = group.pastDueCount > 0 ? ` · ${group.pastDueCount} past due` : ''
  return {
    id: group.id,
    title: group.id,
    subline: `${reports}${pastDueSuffix} · ${getVulnerabilityName(group.representative)}`,
    score: group.representative.score,
    severityLabel: getSeverityLabel(group.representative),
    pastDue: group.pastDueCount > 0,
  }
}
