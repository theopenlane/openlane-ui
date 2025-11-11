'use client'

import React, { useEffect, useState } from 'react'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys'
import { STORAGE_KEY_PREFIX } from '@/components/shared/tab-switcher/tab-switcher.tsx'

type TTab = 'dashboard' | 'table'

type TTabSwitcherWrapperProps = {
  storageKey: TabSwitcherStorageKeys
  children: (props: { active: TTab; setActive: (tab: TTab) => void }) => React.ReactNode
}

const TabSwitcherWrapper: React.FC<TTabSwitcherWrapperProps> = ({ storageKey, children }) => {
  const [active, setActive] = useState<TTab | null>(null)

  useEffect(() => {
    console.log('hi 3')
    if (typeof window === 'undefined') {
      return
    }

    const fullKey = `${STORAGE_KEY_PREFIX}-${storageKey}`
    const saved = localStorage.getItem(fullKey) as TTab | null

    if (saved === 'dashboard' || saved === 'table') {
      setActive(saved)
    } else {
      setActive('dashboard')
    }
  }, [storageKey])

  if (!active) {
    return null
  }

  return <>{children({ active, setActive })}</>
}

export default TabSwitcherWrapper
