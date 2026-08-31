'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { type ControlListStandardFieldsFragment } from '@repo/codegen/src/schema'
import { type ColumnDef } from '@repo/ui/table-types'
import { TruncatedCell } from '@repo/ui/data-table'

type ControlSelection = { id: string; refCode: string }

type GetColumnsProps = {
  selectedControls: ControlSelection[]
  toggleSelection: (control: ControlSelection) => void
  setSelectedControls: React.Dispatch<React.SetStateAction<ControlSelection[]>>
  controls: ControlListStandardFieldsFragment[]
  convertToReadOnly: (value: string, depth: number) => React.ReactNode
  showSubcontrolsColumn: boolean
}

export const getColumns = ({
  controls,
  setSelectedControls,
  toggleSelection,
  selectedControls,
  convertToReadOnly,
  showSubcontrolsColumn,
}: GetColumnsProps): ColumnDef<ControlListStandardFieldsFragment>[] => {
  const columns: ColumnDef<ControlListStandardFieldsFragment>[] = [
    {
      id: 'select',
      header: () => {
        const isAllSelected = controls.length > 0 && controls.every((c) => selectedControls.some((sel) => sel.id === c.id))
        return (
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={(checked: boolean) => {
              setSelectedControls((prev) => {
                const categoryItems = controls.map((c) => ({ id: c.id, refCode: c.refCode }))
                const categoryIds = new Set(categoryItems.map((item) => item.id))
                if (checked) {
                  const newItems = categoryItems.filter((item) => !prev.some((p) => p.id === item.id))
                  return [...prev, ...newItems]
                } else {
                  return prev.filter((item) => !categoryIds.has(item.id))
                }
              })
            }}
          />
        )
      },
      cell: ({ row }) => {
        const { id, refCode } = row.original
        const isChecked = selectedControls.some((c) => c.id === id)
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id, refCode })} />
          </div>
        )
      },
      size: 50,
      maxSize: 50,
      enableResizing: false,
    },
    {
      accessorKey: 'refCode',
      header: 'Ref Code',
      cell: ({ row }) => (
        <TruncatedCell portal className="font-bold">
          {row.getValue('refCode')}
        </TruncatedCell>
      ),
      size: 160,
      maxSize: 260,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ cell }) => {
        const value = cell.getValue<string | null>()
        if (!value) return '-'
        const description = convertToReadOnly(value, 0)
        return (
          <TruncatedCell portal lineClamp={2} tooltipContent={description}>
            {description}
          </TruncatedCell>
        )
      },
    },
  ]

  if (showSubcontrolsColumn) {
    columns.push({
      accessorKey: 'subcontrols.totalCount',
      header: '# of Subcontrols',
      cell: (info) => info.row.original.subcontrols.totalCount,
      size: 190,
      maxSize: 260,
    })
  }

  return columns
}
