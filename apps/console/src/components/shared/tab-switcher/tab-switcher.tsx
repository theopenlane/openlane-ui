'use client'

import React, { useEffect, useState } from 'react'
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
  const [internalActive, setInternalActive] = useState<TTab>('dashboard')
  const active = externalActive ?? internalActive
  const setActive = externalSetActive ?? setInternalActive
  const storageKeyWithPrefix = `${STORAGE_KEY_PREFIX}-${storageKey}`

  useEffect(() => {
    console.log('hi 1')
    if (!storageKey) {
      return
    }
    const savedTab = localStorage.getItem(storageKeyWithPrefix) as TTab | null
    if (savedTab === 'dashboard' || savedTab === 'table') {
      setActive(savedTab)
    }
  }, [setActive, storageKey, storageKeyWithPrefix])

  useEffect(() => {
    console.log('hi 2')
    if (!storageKey) {
      return
    }
    localStorage.setItem(storageKeyWithPrefix, active)
  }, [storageKey, active, storageKeyWithPrefix])

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
