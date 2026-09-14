'use client'

import React, { memo } from 'react'
import { History } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import type { TReportQueryConfig } from '@/lib/report/report-config'
import type { TReportHistoryOption } from './use-report-history'

type TReportHistoryMenuProps = {
  options: TReportHistoryOption[]
  onSelect: (config: TReportQueryConfig) => void
}

const ReportHistoryMenu: React.FC<TReportHistoryMenuProps> = ({ options, onSelect }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="button" variant="outline" icon={<History size={14} />} iconPosition="left">
        History
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
      <DropdownMenuLabel>Recent reports</DropdownMenuLabel>
      {options.map(({ id, label, runAtLabel, config }) => (
        <DropdownMenuItem key={id} className="items-start" onSelect={() => onSelect(config)}>
          <History className="shrink-0 mt-0.5 text-muted-foreground" size={14} />
          <span className="flex flex-col gap-0.5 min-w-0">
            <span className="break-words">{label}</span>
            <span className="text-xs text-muted-foreground">{runAtLabel}</span>
          </span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

export default memo(ReportHistoryMenu)
