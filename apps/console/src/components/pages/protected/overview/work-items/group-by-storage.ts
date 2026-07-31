import { createOrgPersistedStore, parseStringUnion } from '@/lib/storage/org-persisted-store'
import { DEFAULT_GROUP_BY, isGroupBy, type GroupBy } from './types'

const WORK_ITEMS_GROUP_BY_KEY = 'dashboard-work-items-group-by'

export const workItemsGroupByStore = createOrgPersistedStore<GroupBy>(
  WORK_ITEMS_GROUP_BY_KEY,
  (raw) => parseStringUnion(raw, isGroupBy),
  () => DEFAULT_GROUP_BY,
)
