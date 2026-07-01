'use client'

import React, { useEffect, useState } from 'react'
import { Presentation, Table } from 'lucide-react'
import { type TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys.ts'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'

type TTab = 'dashboard' | 'table'

type TTabSwitcherProps = {
  storageKey: TabSwitcherStorageKeys
  active?: TTab
  setActive?: (tab: TTab) => void
  labels?: { dashboard?: string; table?: string }
}

const DEFAULT_LABELS = { dashboard: 'Report', table: 'Table' }

export const STORAGE_KEY_PREFIX = 'tab-switch'

const TabSwitcher: React.FC<TTabSwitcherProps> = ({ storageKey, active: externalActive, setActive: externalSetActive, labels }) => {
  const { currentOrgId } = useOrganization()
  const storageKeyWithPrefix = getOrganizationStorageKey(`${STORAGE_KEY_PREFIX}-${storageKey}`, currentOrgId)
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels }

  const [internalActive, setInternalActive] = useState<TTab>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem(storageKeyWithPrefix)
      if (savedTab === 'dashboard' || savedTab === 'table') {
        return savedTab
      }
    }
    return 'dashboard'
  })

  useEffect(() => {
    const savedTab = localStorage.getItem(storageKeyWithPrefix)
    setInternalActive(savedTab === 'dashboard' || savedTab === 'table' ? savedTab : 'dashboard')
  }, [storageKeyWithPrefix])

  const active = externalActive ?? internalActive
  const setActive =
    externalSetActive ??
    ((tab: TTab) => {
      setInternalActive(tab)
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKeyWithPrefix, tab)
      }
    })

  return (
    <div className="flex items-center p-[3px] gap-1 border rounded-md cursor-pointer overflow-hidden bg-background">
      <button
        type="button"
        className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-1 rounded-md text-sm ${active === 'dashboard' ? 'bg-btn-secondary' : 'text-muted-foreground'}`}
        onClick={() => setActive('dashboard')}
      >
        <Presentation size={16} />
        <span>{resolvedLabels.dashboard}</span>
      </button>

      <button
        type="button"
        className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-1 rounded-md text-sm ${active === 'table' ? 'bg-btn-secondary' : 'text-muted-foreground'}`}
        onClick={() => setActive('table')}
      >
        <Table size={16} />
        <span>{resolvedLabels.table}</span>
      </button>
    </div>
  )
}

export default TabSwitcher
