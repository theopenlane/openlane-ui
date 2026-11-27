import { type TDetailTab } from '@/components/shared/detail-tabs/use-detail-tabs'

export type TAssetTabValue = 'overview' | 'relationships' | 'exposure' | 'vendor' | 'history'

export const ASSET_TABS: TDetailTab<TAssetTabValue>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'exposure', label: 'Exposure' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'history', label: 'History' },
]
