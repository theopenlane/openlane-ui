'use client'

import React, { useEffect, useState } from 'react'
import { Presentation, Table, type LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip'
import { type TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys.ts'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'

type TTab = 'dashboard' | 'table'

export const readStoredTab = (key: string, organizationId?: string): TTab => {
  const saved = getOrganizationStorageItem(key, organizationId)
  return saved === 'dashboard' || saved === 'table' ? saved : 'dashboard'
}

type TTabSwitcherProps = {
  storageKey: TabSwitcherStorageKeys
  active?: TTab
  setActive?: (tab: TTab) => void
  labels?: { dashboard?: string; table?: string }
  labelClassName?: string
}

const DEFAULT_LABELS = { dashboard: 'Report', table: 'Table' }

const TABS: { id: TTab; Icon: LucideIcon }[] = [
  { id: 'dashboard', Icon: Presentation },
  { id: 'table', Icon: Table },
]

export const STORAGE_KEY_PREFIX = 'tab-switch'

const TabSwitcher: React.FC<TTabSwitcherProps> = ({ storageKey, active: externalActive, setActive: externalSetActive, labels, labelClassName }) => {
  const { currentOrgId } = useOrganization()
  const storageKeyWithPrefix = `${STORAGE_KEY_PREFIX}-${storageKey}`
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels }

  const [internalActive, setInternalActive] = useState<TTab>(() => readStoredTab(storageKeyWithPrefix, currentOrgId))

  useEffect(() => {
    setInternalActive(readStoredTab(storageKeyWithPrefix, currentOrgId))
  }, [storageKeyWithPrefix, currentOrgId])

  const active = externalActive ?? internalActive
  const setActive =
    externalSetActive ??
    ((tab: TTab) => {
      setInternalActive(tab)
      setOrganizationStorageItem(storageKeyWithPrefix, tab, currentOrgId)
    })

  return (
    <div className="flex items-center p-[3px] gap-1 border rounded-md cursor-pointer overflow-hidden bg-background">
      {TABS.map(({ id, Icon }) => {
        const label = resolvedLabels[id]
        const tab = (
          <button
            type="button"
            aria-label={label}
            className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-1 rounded-md text-sm ${active === id ? 'bg-btn-secondary' : 'text-muted-foreground'}`}
            onClick={() => setActive(id)}
          >
            <Icon size={16} />
            <span className={labelClassName}>{label}</span>
          </button>
        )

        return labelClassName ? (
          <Tooltip key={id}>
            <TooltipTrigger asChild>{tab}</TooltipTrigger>
            <TooltipContent portal side="bottom">
              {label}
            </TooltipContent>
          </Tooltip>
        ) : (
          <React.Fragment key={id}>{tab}</React.Fragment>
        )
      })}
    </div>
  )
}

export default TabSwitcher
