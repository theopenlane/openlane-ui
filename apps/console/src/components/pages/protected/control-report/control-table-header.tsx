'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { getGridCols } from './control-report-grid'

type ControlTableHeaderProps = {
  isCustomView: boolean
  isSelectionMode: boolean
  allIds: string[]
  selectedIds: Set<string>
  onSelectAll: (ids: string[]) => void
}

const ControlTableHeader: React.FC<ControlTableHeaderProps> = ({ isCustomView, isSelectionMode, allIds, selectedIds, onSelectAll }) => {
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))
  const someSelected = allIds.some((id) => selectedIds.has(id)) && !allSelected
  return (
    <div className="grid gap-x-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b" style={{ gridTemplateColumns: getGridCols(isCustomView, isSelectionMode) }}>
      {isSelectionMode && (
        <div className="flex items-center">
          <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={(v) => onSelectAll(v ? allIds : [])} aria-label="Select all" />
        </div>
      )}
      <div />
      <div>Ref Code</div>
      <div>Description</div>
      <div>Owner</div>
      {!isCustomView && <div>Org coverage</div>}
      <div>Evidence</div>
      <div>Policies</div>
      <div>{isCustomView ? 'Framework controls' : 'Org controls'}</div>
    </div>
  )
}

export default ControlTableHeader
