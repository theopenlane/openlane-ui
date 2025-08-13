'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { ControlListFieldsFragment } from '@repo/codegen/src/schema'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

type ControlSelection = { id: string; refCode: string }

type GetColumnsProps = {
  selectedControls: ControlSelection[]
  toggleSelection: (control: ControlSelection) => void
  setSelectedControls: React.Dispatch<React.SetStateAction<ControlSelection[]>>
  controls: ControlListFieldsFragment[]
  convertToReadOnly: (value: string, depth: number) => React.ReactNode
}

export const getColumns = ({ controls, setSelectedControls, toggleSelection, selectedControls, convertToReadOnly }: GetColumnsProps): ColumnDef<ControlListFieldsFragment>[] => {
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
        return <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id, refCode })} />
      },
      size: 50,
    },
    {
      accessorKey: 'refCode',
      header: 'Ref Code',
      cell: ({ row, cell }) => {
        const control = row.original
        return (
          <Link href={`?controlId=${control.id}`}>
            <span className="text-blue-500 whitespace-nowrap">{cell.getValue() as string}</span>
          </Link>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
    },
    {
      accessorKey: 'subcategory',
      header: 'Subdomain',
    },
    {
      accessorKey: 'mappedCategories',
      header: 'Mapped Categories',
      cell: (info) => (info.getValue() as string[])?.join(', '),
    },
    {
      accessorKey: 'subcontrols.totalCount',
      header: '# of Sub controls',
      cell: (info) => info.row.original.subcontrols.totalCount,
    },
  ]
}
