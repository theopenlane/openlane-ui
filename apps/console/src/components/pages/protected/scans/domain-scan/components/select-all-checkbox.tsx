'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { setAllSelected } from '../selection-utils'

type SelectAllCheckboxProps = {
  ids: string[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
}

export const SelectAllCheckbox = ({ ids, selected, setSelected }: SelectAllCheckboxProps) => {
  if (ids.length === 0) return null

  const selectedCount = ids.filter((id) => selected.has(id)).length
  const allSelected = selectedCount === ids.length
  const checkedState: boolean | 'indeterminate' = allSelected ? true : selectedCount > 0 ? 'indeterminate' : false

  return (
    <div role="presentation" onClick={(event) => event.stopPropagation()}>
      <label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <Checkbox checked={checkedState} onCheckedChange={() => setAllSelected(setSelected, ids, !allSelected)} />
        {selectedCount} of {ids.length} selected
      </label>
    </div>
  )
}
