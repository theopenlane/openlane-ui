import React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Folder, FolderTree, Layers, Tag } from 'lucide-react'
import { formatEnumLabel } from '@/utils/enumToLabel'
import type { FilterField } from '@/types'

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

export const getSubcontrolsColumns = (controlId: string, convertToReadOnly: (value: string, index: number) => React.ReactNode): ColumnDef<SubcontrolRow>[] => [
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
    cell: ({ row }) => <div className="line-clamp-2 text-justify">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</div>,
    size: 320,
  },
  {
    accessorKey: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    cell: ({ row }) => <span className="block truncate">{row.original.status ? formatEnumLabel(row.original.status) : '-'}</span>,
    size: 120,
    minSize: 120,
    maxSize: 120,
  },
  {
    accessorKey: 'type',
    header: () => <span className="whitespace-nowrap">Type</span>,
    cell: ({ row }) => <span className="block truncate">{row.original.type ? formatEnumLabel(row.original.type) : '-'}</span>,
    size: 120,
    minSize: 120,
    maxSize: 120,
  },
]

export const getSubcontrolsFilterFields = (typeOptions: string[], sourceOptions: string[]): FilterField[] => [
  {
    key: 'subcontrolKindNameIn',
    label: 'Type',
    type: 'multiselect',
    icon: Tag,
    options: typeOptions.map((value) => ({ value, label: formatEnumLabel(value) })),
  },
  {
    key: 'sourceIn',
    label: 'Source',
    type: 'multiselect',
    icon: Layers,
    options: sourceOptions.map((value) => ({ value, label: formatEnumLabel(value) })),
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
