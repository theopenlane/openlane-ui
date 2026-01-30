'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { ControlListStandardFieldsFragment } from '@repo/codegen/src/schema'
import { ColumnDef } from '@tanstack/react-table'

type ControlSelection = { id: string; refCode: string }

type GetColumnsProps = {
  selectedControls: ControlSelection[]
  toggleSelection: (control: ControlSelection) => void
  setSelectedControls: React.Dispatch<React.SetStateAction<ControlSelection[]>>
  controls: ControlListStandardFieldsFragment[]
  convertToReadOnly: (value: string, depth: number) => React.ReactNode
}

export const getColumns = ({ controls, setSelectedControls, toggleSelection, selectedControls, convertToReadOnly }: GetColumnsProps): ColumnDef<ControlListStandardFieldsFragment>[] => {
  return [
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
      meta: {
        className: 'max-w-[2%] w-[2%]',
      },
      enableResizing: false,
    },
    {
      accessorKey: 'refCode',
      header: 'Ref Code',
      cell: ({ row }) => <div className="font-bold">{row.getValue('refCode')}</div>,
      meta: {
        className: 'max-w-[5%] w-[5%]',
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
      meta: {
        className: 'max-w-[50%] w-[50%]',
      },
    },
    {
      accessorKey: 'subcontrols.totalCount',
      header: '# of Subcontrols',
      cell: (info) => info.row.original.subcontrols.totalCount,
      meta: {
        className: 'max-w-[5%] w-[5%]',
      },
    },
  ]
}
