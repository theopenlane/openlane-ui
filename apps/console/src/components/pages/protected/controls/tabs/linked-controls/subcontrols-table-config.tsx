import React from 'react'
import Link from 'next/link'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { Folder, FolderTree, Layers, Tag } from 'lucide-react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { FilterField } from '@/types'
import { Checkbox } from '@repo/ui/checkbox'
import { TruncatedCell } from '@repo/ui/data-table'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'

export type SubcontrolRow = {
  id: string
  refCode: string
  description?: string | null
  status?: string | null
  type?: string | null
  source?: string | null
  category?: string | null
  subcategory?: string | null
}

type GetSubcontrolsColumnsParams = {
  controlId: string
  convertToReadOnly: (value: string, index: number) => React.ReactNode
  selectedSubcontrols: { id: string; refCode: string }[]
  setSelectedSubcontrols: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
  canSelect: boolean
}

export const getSubcontrolsColumns = ({ controlId, convertToReadOnly, selectedSubcontrols, setSelectedSubcontrols, canSelect }: GetSubcontrolsColumnsParams): ColumnDef<SubcontrolRow>[] => {
  const toggleSelection = (subcontrol: { id: string; refCode: string }) => {
    setSelectedSubcontrols((prev) => {
      const exists = prev.some((item) => item.id === subcontrol.id)
      return exists ? prev.filter((item) => item.id !== subcontrol.id) : [...prev, subcontrol]
    })
  }

  const selectColumn: ColumnDef<SubcontrolRow> = {
    id: 'select',
    header: ({ table }) => {
      const currentPageSubcontrols = table.getRowModel().rows.map((row) => row.original)
      const allSelected = currentPageSubcontrols.length > 0 && currentPageSubcontrols.every((subcontrol) => selectedSubcontrols.some((selected) => selected.id === subcontrol.id))

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked: boolean) => {
              const newSelections = checked
                ? [
                    ...selectedSubcontrols.filter((selected) => !currentPageSubcontrols.some((subcontrol) => subcontrol.id === selected.id)),
                    ...currentPageSubcontrols.map(({ id, refCode }) => ({ id, refCode })),
                  ]
                : selectedSubcontrols.filter((selected) => !currentPageSubcontrols.some((subcontrol) => subcontrol.id === selected.id))

              setSelectedSubcontrols(newSelections)
            }}
          />
        </div>
      )
    },
    cell: ({ row }: { row: Row<SubcontrolRow> }) => {
      const { id, refCode } = row.original
      const isChecked = selectedSubcontrols.some((subcontrol) => subcontrol.id === id)

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id, refCode })} />
        </div>
      )
    },
    maxSize: 50,
    size: 50,
  }

  const columns: ColumnDef<SubcontrolRow>[] = [
    {
      accessorKey: 'refCode',
      header: () => <span className="whitespace-nowrap">Ref Code</span>,
      cell: ({ row }) => (
        <Link href={`/controls/${controlId}/${row.original.id}`} className="block truncate text-blue-500 hover:underline">
          {row.original.refCode}
        </Link>
      ),
      size: 90,
      minSize: 90,
    },
    {
      accessorKey: 'description',
      header: () => <span className="whitespace-nowrap">Description</span>,
      cell: ({ row }) => <TruncatedCell className="line-clamp-2 text-justify whitespace-normal">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</TruncatedCell>,
      size: 320,
    },
    {
      accessorKey: 'status',
      header: () => <span className="whitespace-nowrap">Status</span>,
      cell: ({ row }) => <span className="block truncate">{row.original.status ? getEnumLabel(row.original.status) : '-'}</span>,
      size: 120,
      minSize: 120,
    },
    {
      accessorKey: 'type',
      header: () => <span className="whitespace-nowrap">Type</span>,
      cell: ({ row }) => <CustomEnumChipCell value={row.original.type} objectType="control" field="kind" />,
      size: 120,
      minSize: 120,
    },
  ]

  return canSelect ? [selectColumn, ...columns] : columns
}

export const getSubcontrolsFilterFields = (typeOptions: string[], sourceOptions: string[]): FilterField[] => [
  {
    key: 'subcontrolKindNameIn',
    label: 'Type',
    type: 'multiselect',
    icon: Tag,
    options: typeOptions.map((value) => ({ value, label: getEnumLabel(value) })),
  },
  {
    key: 'sourceIn',
    label: 'Source',
    type: 'multiselect',
    icon: Layers,
    options: sourceOptions.map((value) => ({ value, label: getEnumLabel(value) })),
  },
  {
    key: 'categoryContainsFold',
    label: 'Category',
    type: 'text',
    icon: Folder,
  },
  {
    key: 'subcategoryContainsFold',
    label: 'Subcategory',
    type: 'text',
    icon: FolderTree,
  },
]
