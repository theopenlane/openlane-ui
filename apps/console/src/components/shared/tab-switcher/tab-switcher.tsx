'use client'

import React, { useState } from 'react'
import { Presentation, Table } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys.ts'

type TTab = 'dashboard' | 'table'

type TTabSwitcherProps = {
  storageKey: TabSwitcherStorageKeys
  active?: TTab
  setActive?: (tab: TTab) => void
}

export const STORAGE_KEY_PREFIX = 'tab-switch'

const TabSwitcher: React.FC<TTabSwitcherProps> = ({ storageKey, active: externalActive, setActive: externalSetActive }) => {
  const storageKeyWithPrefix = `${STORAGE_KEY_PREFIX}-${storageKey}`

  const [internalActive, setInternalActive] = useState<TTab>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem(storageKeyWithPrefix)
      if (savedTab === 'dashboard' || savedTab === 'table') {
        return savedTab
      }
    }
    return 'dashboard'
  })

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
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Presentation className={`cursor-pointer p-1 ${active === 'dashboard' ? 'bg-btn-secondary rounded-md' : 'text-muted-foreground'}`} onClick={() => setActive('dashboard')} size={24} />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Dashboard</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Table className={`cursor-pointer p-1 ${active === 'table' ? 'bg-btn-secondary rounded-md' : 'text-muted-foreground'}`} onClick={() => setActive('table')} size={24} />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Table View</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default TabSwitcher
