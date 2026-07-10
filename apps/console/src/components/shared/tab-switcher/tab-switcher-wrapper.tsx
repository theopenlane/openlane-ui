'use client'

import React, { useEffect, useState } from 'react'
import { type TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys'
import { STORAGE_KEY_PREFIX, readStoredTab } from '@/components/shared/tab-switcher/tab-switcher'
import { useOrganization } from '@/hooks/useOrganization'
import { setOrganizationStorageItem } from '@/lib/storage/organization-storage'

type TTab = 'dashboard' | 'table'

type TTabSwitcherWrapperProps = {
  storageKey: TabSwitcherStorageKeys
  children: (props: { active: TTab; setActive: (tab: TTab) => void }) => React.ReactNode
}

const TabSwitcherWrapper: React.FC<TTabSwitcherWrapperProps> = ({ storageKey, children }) => {
  const { currentOrgId } = useOrganization()
  const fullKey = `${STORAGE_KEY_PREFIX}-${storageKey}`

  const [active, setActive] = useState<TTab>(() => readStoredTab(fullKey, currentOrgId))

  useEffect(() => {
    setActive(readStoredTab(fullKey, currentOrgId))
  }, [fullKey, currentOrgId])

  const handleSetActive = (tab: TTab) => {
    setActive(tab)
    setOrganizationStorageItem(fullKey, tab, currentOrgId)
  }

  return <>{children({ active, setActive: handleSetActive })}</>
}

export default TabSwitcherWrapper
