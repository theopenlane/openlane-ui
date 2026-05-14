import React from 'react'
import Link from 'next/link'
import type { ColumnDef, Row } from '@tanstack/react-table'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { FileBadge2, Folder, FolderTree, Layers, Link2, MoreHorizontal, Pencil, Tag } from 'lucide-react'
import { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import type { FilterField } from '@/types'
import type { MappedControlRow } from './mapped-controls-types'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'

const getMappedControlSelectionKey = (row: MappedControlRow) => `${row.nodeType}:${row.targetId}`

const getEditableRows = (rows: MappedControlRow[]) => {
  const seen = new Set<string>()

  return rows.filter((row) => {
    if (!row.isEditableTarget) return false
    const key = getMappedControlSelectionKey(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const getMappedControlsSelectColumn = (selectedRows: MappedControlRow[], setSelectedRows: React.Dispatch<React.SetStateAction<MappedControlRow[]>>): ColumnDef<MappedControlRow> => ({
  id: 'select',
  header: ({ table }) => {
    const currentPageRows = getEditableRows(table.getRowModel().rows.map((row) => row.original))
    const allSelected = currentPageRows.length > 0 && currentPageRows.every((row) => selectedRows.some((selected) => getMappedControlSelectionKey(selected) === getMappedControlSelectionKey(row)))

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked: boolean) => {
            const currentPageKeys = new Set(currentPageRows.map(getMappedControlSelectionKey))
            const newSelections = checked
              ? [...selectedRows.filter((selected) => !currentPageKeys.has(getMappedControlSelectionKey(selected))), ...currentPageRows]
              : selectedRows.filter((selected) => !currentPageKeys.has(getMappedControlSelectionKey(selected)))

            setSelectedRows(newSelections)
          }}
        />
      </div>
    )
  },
  cell: ({ row }: { row: Row<MappedControlRow> }) => {
    const isSelectable = !!row.original.isEditableTarget
    const isChecked = selectedRows.some((selected) => getMappedControlSelectionKey(selected) === getMappedControlSelectionKey(row.original))

    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isChecked}
          disabled={!isSelectable}
          onCheckedChange={() => {
            if (!isSelectable) return
            setSelectedRows((prev) => {
              const selectedKey = getMappedControlSelectionKey(row.original)
              const exists = prev.some((selected) => getMappedControlSelectionKey(selected) === selectedKey)
              return exists ? prev.filter((selected) => getMappedControlSelectionKey(selected) !== selectedKey) : [...prev, row.original]
            })
          }}
        />
      </div>
    )
  },
  size: 50,
  maxSize: 50,
})

export const getMappedControlsBaseColumns = (convertToReadOnly: (value: string, index: number) => React.ReactNode): ColumnDef<MappedControlRow>[] => [
  {
    accessorKey: 'refCode',
    header: () => <span className="whitespace-nowrap">Ref Code</span>,
    cell: ({ row }) => {
      if (!row.original.targetHref) return <span className="block truncate">{row.original.refCode}</span>
      return (
        <Link href={row.original.targetHref} className="block truncate text-blue-500 hover:underline">
          {row.original.refCode}
        </Link>
      )
    },
    size: 90,
    minSize: 90,
  },
  {
    accessorKey: 'description',
    header: () => <span className="whitespace-nowrap">Description</span>,
    cell: ({ row }) => <div className="line-clamp-2 text-justify">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</div>,
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

export const getMappedControlsFrameworkColumns = (baseColumns: ColumnDef<MappedControlRow>[]): ColumnDef<MappedControlRow>[] => [
  ...baseColumns,
  {
    accessorKey: 'referenceFramework',
    header: () => <span className="whitespace-nowrap">Framework</span>,
    cell: ({ row }) => (
      <span className="block truncate">
        {row.original.referenceFramework ? <StandardChip referenceFramework={row.original.referenceFramework} /> : <span className="text-muted-foreground">Custom</span>}
      </span>
    ),
    size: 160,
    minSize: 160,
    maxSize: 160,
  },
]

export const getMappedControlsActionsColumn = (basePath: string): ColumnDef<MappedControlRow> => ({
  id: 'actions',
  header: '',
  size: 50,
  cell: ({ row }) => {
    if (row.original.isSystemOwnedMapping) return null
    const href = `${basePath}/edit-map-control?mappedControlId=${row.original.mappedControlId}`
    return (
      <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem asChild>
              <Link href={href}>
                <Pencil className="h-4 w-4" />
                Edit Mapping
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  },
})

export const getMappedControlsFilterFields = (rows: MappedControlRow[], showFrameworkFilter: boolean): FilterField[] => {
  const typeOptions = Array.from(new Set(rows.map((row) => row.type).filter(Boolean))).sort() as string[]
  const sourceOptions = Array.from(new Set(rows.map((row) => row.controlSource).filter(Boolean))).sort() as string[]
  const frameworkOptions = Array.from(new Set(rows.map((row) => row.referenceFramework).filter(Boolean))).sort() as string[]

  const fields: FilterField[] = [
    {
      key: 'typeIn',
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
    {
      key: 'mappingTypeIn',
      label: 'Mapping Type',
      type: 'multiselect',
      icon: Link2,
      options: Object.values(MappedControlMappingType).map((value) => ({ value, label: getEnumLabel(value) })),
    },
    {
      key: 'mappingSourceIn',
      label: 'Mapping Source',
      type: 'multiselect',
      icon: Layers,
      options: Object.values(MappedControlMappingSource).map((value) => ({ value, label: getEnumLabel(value) })),
    },
  ]

  if (showFrameworkFilter) {
    fields.push({
      key: 'referenceFrameworkIn',
      label: 'Framework',
      type: 'multiselect',
      icon: FileBadge2,
      options: frameworkOptions.map((framework) => ({ value: framework, label: framework })),
    })
  }

  return fields
}
