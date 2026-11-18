import { type TDetailTab } from '@/components/shared/detail-tabs/use-detail-tabs'

export type TFindingTabValue = 'overview' | 'remediation' | 'comments' | 'history'

export const FINDING_TABS: TDetailTab<TFindingTabValue>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'remediation', label: 'Remediation' },
  { value: 'comments', label: 'Comments' },
  { value: 'history', label: 'History' },
]
