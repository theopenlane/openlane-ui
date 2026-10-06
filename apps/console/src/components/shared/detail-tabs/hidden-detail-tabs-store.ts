import { createOrgPersistedStore, parseStringArray, type OrgPersistedStore } from '@/lib/storage/org-persisted-store'

export type TDetailTabsPage = 'control' | 'risk' | 'personnel' | 'vendor' | 'policy'

const EMPTY_HIDDEN_TABS: string[] = []

const createHiddenTabsStore = (page: TDetailTabsPage) => createOrgPersistedStore<string[]>(`detail-tabs-hidden:${page}`, parseStringArray, () => EMPTY_HIDDEN_TABS)

export const HIDDEN_DETAIL_TABS_STORES: Record<TDetailTabsPage, OrgPersistedStore<string[]>> = {
  control: createHiddenTabsStore('control'),
  risk: createHiddenTabsStore('risk'),
  personnel: createHiddenTabsStore('personnel'),
  vendor: createHiddenTabsStore('vendor'),
  policy: createHiddenTabsStore('policy'),
}
