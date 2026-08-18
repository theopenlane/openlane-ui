'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronsUpDown, ListChecks, SlidersHorizontal, SquarePlus, Upload, FileSearch, FolderKanban } from 'lucide-react'
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
import { REPORT_FILTER_OPTIONS, type ReportFilterId } from './report-filter-options'
import ReportFilterCheckbox from './report-filter-checkbox'
import ReportToolbarAction from './report-toolbar-action'
import ReportToolbarFilterLabel from './report-toolbar-filter-label'
import { HIDE_BELOW_1300, HIDE_BELOW_1400, ICON_ONLY_BELOW_1300, TOOLBAR_CONTAINER } from '@/constants/toolbar'

type ReportToolbarProps = {
  active: 'dashboard' | 'table'
  setActive: (tab: 'dashboard' | 'table') => void
  allExpanded: boolean
  onToggleExpandAll: () => void
  isSelectionMode: boolean
  onToggleSelectionMode: () => void
  effectiveStandard: string
  standardOptions: { value: string; label: string }[]
  onSelectFilter: (value: string) => void
  programOptions: { value: string; label: string }[]
  selectedPrograms: string[]
  onToggleProgram: (id: string) => void
  isCustomView: boolean
  reportFilters: Set<ReportFilterId>
  onToggleReportFilter: (id: ReportFilterId) => void
  onClearReportFilters: () => void
  createAllowed: boolean
  hasNoControls: boolean
  hasVisibleControls: boolean
  canSelect: boolean
}

const ReportToolbar: React.FC<ReportToolbarProps> = ({
  active,
  setActive,
  allExpanded,
  onToggleExpandAll,
  isSelectionMode,
  onToggleSelectionMode,
  effectiveStandard,
  standardOptions,
  onSelectFilter,
  programOptions,
  selectedPrograms,
  onToggleProgram,
  isCustomView,
  reportFilters,
  onToggleReportFilter,
  onClearReportFilters,
  createAllowed,
  hasNoControls,
  hasVisibleControls,
  canSelect,
}) => {
  const showActions = !hasNoControls

  const [reportPopoverOpen, setReportPopoverOpen] = useState(false)
  const [programPopoverOpen, setProgramPopoverOpen] = useState(false)
  const [isCloneOpen, setIsCloneOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)

  const expandLabel = allExpanded ? 'Collapse all' : 'Expand all'

  const frameworkValue = effectiveStandard === 'CUSTOM' ? 'Organization Controls' : effectiveStandard ? (standardOptions.find((o) => o.value === effectiveStandard)?.label ?? 'Framework') : 'Framework'

  const programValue =
    selectedPrograms.length === 0
      ? 'All programs'
      : selectedPrograms.length === 1
        ? (programOptions.find((o) => o.value === selectedPrograms[0])?.label ?? '1 program')
        : `${selectedPrograms.length} programs`

  const reportValue =
    reportFilters.size === 0 ? 'All controls' : reportFilters.size === 1 ? (REPORT_FILTER_OPTIONS.find((o) => reportFilters.has(o.id))?.label ?? 'Custom') : `${reportFilters.size} filters`

  const visibleOptions = REPORT_FILTER_OPTIONS.filter((opt) => {
    if (opt.viewRestriction === 'framework') return !isCustomView
    if (opt.viewRestriction === 'custom') return isCustomView
    return true
  })
  const scopeOptions = visibleOptions.filter((opt) => opt.scope === 'query')
  const criteriaOptions = visibleOptions.filter((opt) => opt.scope === 'client')

  return (
    <div className={`${TOOLBAR_CONTAINER} flex justify-between items-center gap-2 flex-wrap`}>
      <div className="flex items-center gap-4">
        <h1 className="text-2xl tracking-[-0.056rem] text-header">Controls</h1>
        <TabSwitcher active={active} setActive={setActive} storageKey={TabSwitcherStorageKeys.CONTROL} labelClassName={HIDE_BELOW_1400} />
        {showActions && (
          <>
            {hasVisibleControls && <ReportToolbarAction label={expandLabel} icon={<ChevronsUpDown size={15} />} onClick={onToggleExpandAll} />}
            {canSelect && (hasVisibleControls || isSelectionMode) && <ReportToolbarAction label="Select" icon={<ListChecks size={15} />} active={isSelectionMode} onClick={onToggleSelectionMode} />}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" icon={<SlidersHorizontal />} iconPosition="left" className={`h-7.5 px-2! pl-3! ${effectiveStandard ? 'border border-primary' : ''}`}>
              <ReportToolbarFilterLabel label="Filter by:" value={frameworkValue} />
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
        {programOptions.length > 0 && (
          <Popover open={programPopoverOpen} onOpenChange={setProgramPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" icon={<FolderKanban />} iconPosition="left" className={`h-7.5 px-2! pl-3! ${selectedPrograms.length > 0 ? 'border border-primary' : ''}`}>
                <ReportToolbarFilterLabel label="Program:" value={programValue} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-4 space-y-2">
              <div className="max-h-72 overflow-y-auto space-y-2">
                {programOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedPrograms.includes(opt.value)} onCheckedChange={() => onToggleProgram(opt.value)} />
                    <span className="truncate">{opt.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        {showActions && (
          <Popover open={reportPopoverOpen} onOpenChange={setReportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className={`h-7.5 px-2! pl-3! gap-1.5 ${reportFilters.size > 0 ? 'border border-primary' : ''}`}>
                <FileSearch size={15} />
                <ReportToolbarFilterLabel label="Report on:" value={reportValue} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-4 space-y-2">
              {scopeOptions.length > 0 && (
                <>
                  <p className="text-sm font-medium">Report scope:</p>
                  {scopeOptions.map((opt) => (
                    <ReportFilterCheckbox key={opt.id} option={opt} checked={reportFilters.has(opt.id)} onToggle={onToggleReportFilter} />
                  ))}
                  <div className="border-t border-border" />
                </>
              )}
              <p className="text-sm font-medium">Show controls that:</p>
              {criteriaOptions.map((opt) => (
                <ReportFilterCheckbox key={opt.id} option={opt} checked={reportFilters.has(opt.id)} onToggle={onToggleReportFilter} />
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
          <>
            <Menu
              closeOnSelect={true}
              content={(close) => (
                <>
                  <button
                    type="button"
                    className="flex items-center bg-transparent space-x-2 px-1 cursor-pointer"
                    onClick={() => {
                      setIsCloneOpen(true)
                      close()
                    }}
                  >
                    <Upload size={16} strokeWidth={2} />
                    <span>Upload From Standard</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center bg-transparent space-x-2 px-1 cursor-pointer"
                    onClick={() => {
                      setIsCreateOpen(true)
                      close()
                    }}
                  >
                    <Upload size={16} strokeWidth={2} />
                    <span>Upload Custom Controls</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center bg-transparent space-x-2 px-1 cursor-pointer"
                    onClick={() => {
                      setIsMapOpen(true)
                      close()
                    }}
                  >
                    <Upload size={16} strokeWidth={2} />
                    <span>Upload Control Mappings</span>
                  </button>
                </>
              )}
            />
            <BulkCSVCloneControlDialog open={isCloneOpen} onOpenChange={setIsCloneOpen} />
            <BulkCSVCreateControlDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            <BulkCSVCreateMappedControlDialog open={isMapOpen} onOpenChange={setIsMapOpen} />
          </>
        ) : null}
        {createAllowed && showActions && (
          <Link href="/controls/create-control">
            <Button variant="primary" className={`h-8 px-2! pl-3! ${ICON_ONLY_BELOW_1300}`} icon={<SquarePlus />} iconPosition="left" descriptiveTooltipText="Create control">
              <span className={HIDE_BELOW_1300}>Create</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

export default ReportToolbar
