export type ReportFilterOption = {
  id: string
  label: string
  viewRestriction?: 'framework' | 'custom'
}

export const REPORT_FILTER_OPTIONS: ReportFilterOption[] = [
  { id: 'NOT_APPROVED', label: 'Not approved' },
  { id: 'NO_OWNER', label: 'No owner' },
  { id: 'NO_EVIDENCE', label: 'No evidence' },
  { id: 'EVIDENCE_NON_APPROVED', label: 'Evidence in non-approved state' },
  { id: 'NO_POLICIES', label: 'No policies linked' },
  { id: 'NO_ORG_CONTROLS', label: 'No org controls linked', viewRestriction: 'framework' },
  { id: 'NO_FRAMEWORK_CONTROLS', label: 'No framework controls linked', viewRestriction: 'custom' },
]
