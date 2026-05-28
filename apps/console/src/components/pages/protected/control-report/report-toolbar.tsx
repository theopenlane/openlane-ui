'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronsUpDown, ListChecks, SlidersHorizontal, SquarePlus, Upload, FileSearch } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Checkbox } from '@repo/ui/checkbox'
import TabSwitcher from '@/components/shared/tab-switcher/tab-switcher.tsx'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys.ts'
import Menu from '@/components/shared/menu/menu'
import { BulkCSVCloneControlDialog } from '../controls/bulk-csv-clone-control-dialog'
import { BulkCSVCreateControlDialog } from '../controls/bulk-csv-create-control-dialog'
import { BulkCSVCreateMappedControlDialog } from '../controls/bulk-csv-create-map-control-dialog'
import { REPORT_FILTER_OPTIONS } from './report-filter-options'

type ReportToolbarProps = {
  active: 'dashboard' | 'table'
  setActive: (tab: 'dashboard' | 'table') => void
  showActions: boolean
  allExpanded: boolean
  onToggleExpandAll: () => void
  isSelectionMode: boolean
  onToggleSelectionMode: () => void
  effectiveStandard: string
  standardOptions: { value: string; label: string }[]
  onSelectFilter: (value: string) => void
  isCustomView: boolean
  reportFilters: Set<string>
  onToggleReportFilter: (id: string) => void
  onClearReportFilters: () => void
  createAllowed: boolean
  hasNoControls: boolean
}

const ReportToolbar: React.FC<ReportToolbarProps> = ({
  active,
  setActive,
  showActions,
  allExpanded,
  onToggleExpandAll,
  isSelectionMode,
  onToggleSelectionMode,
  effectiveStandard,
  standardOptions,
  onSelectFilter,
  isCustomView,
  reportFilters,
  onToggleReportFilter,
  onClearReportFilters,
  createAllowed,
  hasNoControls,
}) => {
  const [reportPopoverOpen, setReportPopoverOpen] = useState(false)

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl tracking-[-0.056rem] text-header">Controls</h1>
        <TabSwitcher active={active} setActive={setActive} storageKey={TabSwitcherStorageKeys.CONTROL} />
        {showActions ? (
          <>
            <Button type="button" variant="outline" className="h-7.5 px-3 gap-1.5" onClick={onToggleExpandAll}>
              <ChevronsUpDown size={15} />
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </Button>
            <Button type="button" className={`h-7.5 px-3 gap-1.5 ${isSelectionMode ? 'border border-primary' : ''}`} variant="outline" onClick={onToggleSelectionMode}>
              <ListChecks size={15} />
              Select
            </Button>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" icon={<SlidersHorizontal />} iconPosition="left" className={`h-7.5 px-2! pl-3! ${effectiveStandard ? 'border border-primary' : ''}`}>
              <span className="text-muted-foreground">Filter by:</span>
              <span>
                {effectiveStandard === 'CUSTOM' ? 'Organization Controls' : effectiveStandard ? (standardOptions.find((o) => o.value === effectiveStandard)?.label ?? 'Framework') : 'Framework'}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto min-w-56">
            <DropdownMenuRadioGroup value={effectiveStandard} onValueChange={(v) => onSelectFilter(v)}>
              <DropdownMenuRadioItem value="CUSTOM">Organization Controls</DropdownMenuRadioItem>
              {standardOptions.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  <span className="truncate">{opt.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {showActions && (
          <Popover open={reportPopoverOpen} onOpenChange={setReportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className={`h-7.5 px-2! pl-3! gap-1.5 ${reportFilters.size > 0 ? 'border border-primary' : ''}`}>
                <FileSearch size={15} />
                <span className="text-muted-foreground">Report on:</span>
                <span>
                  {reportFilters.size === 0
                    ? 'All controls'
                    : reportFilters.size === 1
                      ? (REPORT_FILTER_OPTIONS.find((o) => reportFilters.has(o.id))?.label ?? 'Custom')
                      : `${reportFilters.size} criteria`}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4 space-y-2">
              <p className="text-sm font-medium">Show controls that:</p>
              {REPORT_FILTER_OPTIONS.filter((opt) => {
                if (opt.viewRestriction === 'framework') return !isCustomView
                if (opt.viewRestriction === 'custom') return isCustomView
                return true
              }).map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={reportFilters.has(opt.id)} onCheckedChange={() => onToggleReportFilter(opt.id)} />
                  {opt.label}
                </label>
              ))}
              {reportFilters.size > 0 && (
                <Button variant="outline" className="w-full h-8 mt-1" onClick={onClearReportFilters}>
                  Clear filters
                </Button>
              )}
            </PopoverContent>
          </Popover>
        )}
        {showActions ? (
          <Menu
            closeOnSelect={true}
            content={() => (
              <>
                <BulkCSVCloneControlDialog
                  trigger={
                    <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                      <Upload size={16} strokeWidth={2} />
                      <span>Upload From Standard</span>
                    </Button>
                  }
                />
                <BulkCSVCreateControlDialog
                  trigger={
                    <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                      <Upload size={16} strokeWidth={2} />
                      <span>Upload Custom Controls</span>
                    </Button>
                  }
                />
                <BulkCSVCreateMappedControlDialog
                  trigger={
                    <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                      <Upload size={16} strokeWidth={2} />
                      <span>Upload Control Mappings</span>
                    </Button>
                  }
                />
              </>
            )}
          />
        ) : null}
        {createAllowed && !hasNoControls && (
          <Link href="/controls/create-control" aria-label="Create Control">
            <Button variant="primary" className="h-8 px-2! pl-3!" icon={<SquarePlus />} iconPosition="left">
              Create
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

export default ReportToolbar
