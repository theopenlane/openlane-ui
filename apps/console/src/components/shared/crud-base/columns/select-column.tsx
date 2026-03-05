import { useMemo } from 'react'
import { type ColumnDef, type Row } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import React from 'react'

function buildSelectColumn<T extends { id: string }>(selectedItems: { id: string }[], setSelectedItems: React.Dispatch<React.SetStateAction<{ id: string }[]>>): ColumnDef<T> {
  return {
    id: 'select',
    header: ({ table }) => {
      const currentPageItems = table.getRowModel().rows.map((row) => row.original)
      const allSelected = currentPageItems.length > 0 && currentPageItems.every((item) => selectedItems.some((sc) => sc.id === item.id))

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked: boolean) => {
              const newSelections = checked
                ? [...selectedItems.filter((sc) => !currentPageItems.some((c) => c.id === sc.id)), ...currentPageItems.map((c) => ({ id: c.id }))]
                : selectedItems.filter((sc) => !currentPageItems.some((c) => c.id === sc.id))
              setSelectedItems(newSelections)
            }}
          />
        </div>
      )
    },
    cell: ({ row }: { row: Row<T> }) => {
      const { id } = row.original
      const isChecked = selectedItems.some((c) => c.id === id)

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => {
              setSelectedItems((prev) => {
                const exists = prev.some((c) => c.id === id)
                return exists ? prev.filter((c) => c.id !== id) : [...prev, { id }]
              })
            }}
          />
        </div>
      )
    },
    size: 50,
    maxSize: 50,
  }
}

export function useSelectColumn<T extends { id: string }>(selectedItems: { id: string }[], setSelectedItems: React.Dispatch<React.SetStateAction<{ id: string }[]>>): ColumnDef<T> {
  return useMemo(() => buildSelectColumn<T>(selectedItems, setSelectedItems), [selectedItems, setSelectedItems])
}

export function createSelectColumn<T extends { id: string }>(selectedItems: { id: string }[], setSelectedItems: React.Dispatch<React.SetStateAction<{ id: string }[]>>): ColumnDef<T> {
  return buildSelectColumn<T>(selectedItems, setSelectedItems)
}
