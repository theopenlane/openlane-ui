'use client'
import { ColumnDef, Row } from '@tanstack/react-table'
import { Badge } from '@repo/ui/badge'
import { formatDate } from '@/utils/date'
import { OrderDirection, TrustCenterDocOrderField, TrustCenterDocTrustCenterDocumentVisibility } from '@repo/codegen/src/schema'

export type TTrustCenterDoc = {
  id: string
  title: string
  category: string
  visibility: string
  tags?: string[] | null
  createdAt: string
  updatedAt: string
}

type Params = {
  selectedDocs: { id: string }[]
  setSelectedDocs: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getTrustCenterDocColumns = ({ selectedDocs, setSelectedDocs }: Params) => {
  const toggleSelection = (doc: { id: string }) => {
    setSelectedDocs((prev) => {
      const exists = prev.some((d) => d.id === doc.id)
      return exists ? prev.filter((d) => d.id !== doc.id) : [...prev, doc]
    })
  }

  const columns: ColumnDef<TTrustCenterDoc>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageDocs = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageDocs.every((doc) => selectedDocs.some((sd) => sd.id === doc.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedDocs.filter((sd) => !currentPageDocs.some((d) => d.id === sd.id)), ...currentPageDocs.map((d) => ({ id: d.id }))]
                  : selectedDocs.filter((sd) => !currentPageDocs.some((d) => d.id === sd.id))
                setSelectedDocs(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<TTrustCenterDoc> }) => {
        const { id } = row.original
        const isChecked = selectedDocs.some((d) => d.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 20,
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'visibility',
      header: 'Visibility',
      cell: ({ row }) => <span className="capitalize">{row.original.visibility.split('_').join(' ').toLowerCase()}</span>,
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => {
        const tags = row.original.tags
        if (!tags || tags.length === 0) return '-'
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, idx) => (
              <Badge key={idx} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => <span>{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ row }) => <span>{formatDate(row.original.updatedAt)}</span>,
    },
  ]

  const mappedColumns = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && 'header' in column && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  return { columns, mappedColumns }
}

export const TRUST_CENTER_DOCS_SORT_FIELDS = [
  {
    key: 'created_at',
    label: 'Created At',
  },
  {
    key: 'updated_at',
    label: 'Updated At',
    default: {
      key: TrustCenterDocOrderField.updated_at,
      direction: OrderDirection.DESC,
    },
  },
]

import { Eye, Folder } from 'lucide-react'
import { FilterField } from '@/types'
import { enumToOptions } from '../../../tasks/table/table-config'
import { Checkbox } from '@repo/ui/checkbox'

export const trustCenterDocsFilterFields: FilterField[] = [
  {
    key: 'categoryContainsFold',
    label: 'Category',
    type: 'text',
    icon: Folder,
  },
  {
    key: 'visibilityIn',
    label: 'Visibility',
    type: 'multiselect',
    options: enumToOptions(TrustCenterDocTrustCenterDocumentVisibility),
    icon: Eye,
  },
]
