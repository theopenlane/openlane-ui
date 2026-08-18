export type ReportFilterId = 'MY_CONTROLS' | 'NOT_APPROVED' | 'NO_OWNER' | 'NO_EVIDENCE' | 'EVIDENCE_NON_APPROVED' | 'NO_POLICIES' | 'NO_ORG_CONTROLS' | 'NO_FRAMEWORK_CONTROLS'

export type ReportFilterScope = 'query' | 'client'

export type ReportFilterOption = {
  id: ReportFilterId
  label: string
  scope: ReportFilterScope
  viewRestriction?: 'framework' | 'custom'
}

export const REPORT_FILTER_OPTIONS: ReportFilterOption[] = [
  { id: 'MY_CONTROLS', label: 'My controls', scope: 'query' },
  { id: 'NOT_APPROVED', label: 'Not approved', scope: 'client' },
  { id: 'NO_OWNER', label: 'No owner', scope: 'client' },
  { id: 'NO_EVIDENCE', label: 'No evidence', scope: 'client' },
  { id: 'EVIDENCE_NON_APPROVED', label: 'Evidence in non-approved state', scope: 'client' },
  { id: 'NO_POLICIES', label: 'No policies linked', scope: 'client' },
  { id: 'NO_ORG_CONTROLS', label: 'No org controls linked', scope: 'client', viewRestriction: 'framework' },
  { id: 'NO_FRAMEWORK_CONTROLS', label: 'No framework controls linked', scope: 'client', viewRestriction: 'custom' },
]

export const QUERY_REPORT_FILTER_IDS: ReadonlySet<ReportFilterId> = new Set(REPORT_FILTER_OPTIONS.filter((option) => option.scope === 'query').map((option) => option.id))
