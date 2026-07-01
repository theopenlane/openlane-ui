'use client'

import React, { useEffect, useState } from 'react'
import { type TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys'
import { STORAGE_KEY_PREFIX } from '@/components/shared/tab-switcher/tab-switcher'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'

type TTab = 'dashboard' | 'table'

type TTabSwitcherWrapperProps = {
  storageKey: TabSwitcherStorageKeys
  children: (props: { active: TTab; setActive: (tab: TTab) => void }) => React.ReactNode
}

const TabSwitcherWrapper: React.FC<TTabSwitcherWrapperProps> = ({ storageKey, children }) => {
  const { currentOrgId } = useOrganization()
  const fullKey = getOrganizationStorageKey(`${STORAGE_KEY_PREFIX}-${storageKey}`, currentOrgId)

  const [active, setActive] = useState<TTab>(() => {
    if (typeof window === 'undefined') return 'dashboard'

    const saved = localStorage.getItem(fullKey)
    if (saved === 'dashboard' || saved === 'table') {
      return saved
    }
    return 'dashboard'
  })

  useEffect(() => {
    const saved = localStorage.getItem(fullKey)
    setActive(saved === 'dashboard' || saved === 'table' ? saved : 'dashboard')
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
