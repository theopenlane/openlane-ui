'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ControlReportPage from '@/components/pages/protected/control-report/control-report-page'
import ControlsTable from '@/components/pages/protected/controls/table/controls-table'
import { Presentation, Table } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

export const ControlSwitcher: React.FC = () => {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as 'report' | 'controls') ?? 'report'

  const [active, setActive] = useState<'report' | 'controls'>(initialTab)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', active)
    window.history.replaceState({}, '', url.toString())
  }, [active])

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Presentation className={`cursor-pointer p-1 ${active === 'report' ? 'btn-secondary rounded-md' : 'text-muted-foreground'}`} onClick={() => setActive('report')} size={30} />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Dashboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Table className={`cursor-pointer p-1 ${active === 'controls' ? 'btn-secondary rounded-md' : 'text-muted-foreground'}`} onClick={() => setActive('controls')} size={30} />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Table View</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {active === 'report' ? <ControlReportPage /> : <ControlsTable />}
    </div>
  )
}
