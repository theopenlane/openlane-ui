'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { HIDDEN_DETAIL_TABS_STORES, type TDetailTabsPage } from './hidden-detail-tabs-store'

const TAB_QUERY_PARAM = 'tab'

export type TDetailTab<T extends string> = {
  value: T
  label: string
}

type TUseDetailTabsArgs<T extends string> = {
  page: TDetailTabsPage
  tabs: readonly TDetailTab<T>[]
  defaultTab: T
  unavailableTabs?: ReadonlySet<T>
  isResolving?: boolean
}

export type TDetailTabsState<T extends string> = {
  activeTab: T
  shownTabs: TDetailTab<T>[]
  menuTabs: TDetailTab<T>[]
  hiddenTabs: ReadonlySet<T>
  onTabChange: (nextTab: string) => void
  canHideTab: (value: T) => boolean
  setTabHidden: (value: T, hidden: boolean) => void
  resetHiddenTabs: () => void
}

export const useDetailTabs = <T extends string>({ page, tabs, defaultTab, unavailableTabs, isResolving = false }: TUseDetailTabsArgs<T>): TDetailTabsState<T> => {
  const searchParams = useSearchParams()
  const { replace } = useSmartRouter()
  const { currentOrgId } = useOrganization()
  const { value: storedHiddenTabs, isHydrated, setValue: setStoredHiddenTabs } = useOrgPersistedState(HIDDEN_DETAIL_TABS_STORES[page], currentOrgId)

  const tabValues = useMemo(() => tabs.map((tab) => tab.value), [tabs])
  const available = useMemo(() => tabValues.filter((value) => !unavailableTabs?.has(value)), [tabValues, unavailableTabs])
  const hiddenTabs = useMemo(() => new Set(tabValues.filter((value) => storedHiddenTabs.includes(value))), [storedHiddenTabs, tabValues])

  const urlDefaultTab = available.includes(defaultTab) ? defaultTab : (available[0] ?? defaultTab)

  const resolvePool = useCallback(
    (hidden: ReadonlySet<T>) => {
      const visible = available.filter((value) => !hidden.has(value))
      const pool = visible.length > 0 ? visible : available
      return { pool, landingTab: pool.includes(defaultTab) ? defaultTab : (pool[0] ?? defaultTab) }
    },
    [available, defaultTab],
  )

  const { pool, landingTab } = resolvePool(hiddenTabs)

  const toTab = (raw: string | null) => available.find((value) => value === raw) ?? landingTab

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  const activeTab = toTab(tabParamValue)

  const shownTabs = tabs.filter(({ value }) => pool.includes(value) || value === activeTab)

  const writeTabParam = useCallback(
    (tab: T) => {
      const nextParam = tab === urlDefaultTab ? null : tab
      if (nextParam !== tabParamValue) replace({ [TAB_QUERY_PARAM]: nextParam })
    },
    [replace, tabParamValue, urlDefaultTab],
  )

  useEffect(() => {
    if (!isHydrated || !currentOrgId || isResolving) return
    writeTabParam(activeTab)
  }, [activeTab, currentOrgId, isHydrated, isResolving, writeTabParam])

  const onTabChange = (nextTab: string) => writeTabParam(toTab(nextTab))

  const menuTabs = tabs.filter(({ value }) => available.includes(value))

  const canHideTab = (value: T) => !hiddenTabs.has(value) && available.some((other) => other !== value && !hiddenTabs.has(other))

  const setTabHidden = (value: T, hidden: boolean) => {
    if (hidden && !canHideTab(value)) return

    const nextHidden = new Set(hiddenTabs)
    if (hidden) {
      nextHidden.add(value)
    } else {
      nextHidden.delete(value)
    }
    setStoredHiddenTabs(tabValues.filter((tab) => nextHidden.has(tab)))

    if (hidden && value === activeTab) writeTabParam(resolvePool(nextHidden).landingTab)
  }

  const resetHiddenTabs = () => setStoredHiddenTabs([])

  return { activeTab, shownTabs, menuTabs, hiddenTabs, onTabChange, canHideTab, setTabHidden, resetHiddenTabs }
}
