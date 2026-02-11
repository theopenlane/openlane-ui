'use client'
import { Checkbox } from '@repo/ui/checkbox'
import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { SelectedItem } from '../shared/program-settings-import-controls-shared-props'

type TGetColumnsForImportControlsDialogFrameworkProps = {
  selectedItems: SelectedItem[]
  setSelectedItems: React.Dispatch<React.SetStateAction<SelectedItem[]>>
  tableData: SelectedItem[]
}

export const getColumnsForImportControlsDialogFramework = ({ selectedItems, setSelectedItems, tableData }: TGetColumnsForImportControlsDialogFrameworkProps) => {
  const columns: ColumnDef<SelectedItem>[] = [
    {
      id: 'select',
      header: () => {
        const isAllSelected = tableData.length > 0 && tableData.every((item) => selectedItems.some((sel) => sel.id === item.id))
        const handleSelectAll = (checked: boolean) => {
          const pagedIds = new Set(tableData.map((i) => i.id))

          setSelectedItems((prev) => {
            if (checked) {
              const newItems = tableData.filter((item) => !prev.some((p) => p.id === item.id))
              return [...prev, ...newItems]
            } else {
              return prev.filter((item) => !pagedIds.has(item.id))
            }
          })
        }

        return <Checkbox checked={isAllSelected} onCheckedChange={(checked) => handleSelectAll(!!checked)} />
      },
      cell: ({ row }) => {
        const item = row.original
        const isChecked = selectedItems.some((sel) => sel.id === item.id)

        const handleToggle = (checked: boolean) => {
          setSelectedItems((prev) => {
            if (checked) {
              if (prev.some((p) => p.id === item.id)) return prev
              return [...prev, item]
            } else {
              return prev.filter((sel) => sel.id !== item.id)
            }
          })
        }

        return <Checkbox checked={isChecked} onCheckedChange={(checked) => handleToggle(!!checked)} />
      },
      size: 50,
      maxSize: 50,
    },
    {
      accessorKey: 'name',
      header: 'Ref Code',
    },
    {
      accessorKey: 'source',
      header: 'Source',
    },
  ]

  return columns
}
