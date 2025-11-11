'use client'

import React, { useState } from 'react'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys'
import { STORAGE_KEY_PREFIX } from '@/components/shared/tab-switcher/tab-switcher'

type TTab = 'dashboard' | 'table'

type TTabSwitcherWrapperProps = {
  storageKey: TabSwitcherStorageKeys
  children: (props: { active: TTab; setActive: (tab: TTab) => void }) => React.ReactNode
}

const TabSwitcherWrapper: React.FC<TTabSwitcherWrapperProps> = ({ storageKey, children }) => {
  const fullKey = `${STORAGE_KEY_PREFIX}-${storageKey}`

  const [active, setActive] = useState<TTab>(() => {
    if (typeof window === 'undefined') return 'dashboard'

    const saved = localStorage.getItem(fullKey)
    if (saved === 'dashboard' || saved === 'table') {
      return saved
    }
    return 'dashboard'
  })

  const handleSetActive = (tab: TTab) => {
    setActive(tab)
    if (typeof window !== 'undefined') {
      localStorage.setItem(fullKey, tab)
    }
  }

  return <>{children({ active, setActive: handleSetActive })}</>
}

export default TabSwitcherWrapper
