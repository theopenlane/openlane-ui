'use client'

import React, { useEffect, useState } from 'react'
import { type TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys'
import { STORAGE_KEY_PREFIX, readStoredTab } from '@/components/shared/tab-switcher/tab-switcher'
import { useOrganizationStorageKey } from '@/hooks/useOrganizationStorageKey'

type TTab = 'dashboard' | 'table'

type TTabSwitcherWrapperProps = {
  storageKey: TabSwitcherStorageKeys
  children: (props: { active: TTab; setActive: (tab: TTab) => void }) => React.ReactNode
}

const TabSwitcherWrapper: React.FC<TTabSwitcherWrapperProps> = ({ storageKey, children }) => {
  const fullKey = useOrganizationStorageKey(`${STORAGE_KEY_PREFIX}-${storageKey}`)

  const [active, setActive] = useState<TTab>(() => readStoredTab(fullKey))

  useEffect(() => {
    setActive(readStoredTab(fullKey))
  }, [fullKey])

  const handleSetActive = (tab: TTab) => {
    setActive(tab)
    if (typeof window !== 'undefined') {
      localStorage.setItem(fullKey, tab)
    }
  }

  return <>{children({ active, setActive: handleSetActive })}</>
}

export default TabSwitcherWrapper
