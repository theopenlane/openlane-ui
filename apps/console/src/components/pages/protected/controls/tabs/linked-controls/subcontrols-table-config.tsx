import React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { CircleDot, Folder, FolderTree, Layers, Tag } from 'lucide-react'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { SubcontrolControlStatus } from '@repo/codegen/src/schema'
import type { FilterField } from '@/types'
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
}

export const getSubcontrolsColumns = ({ controlId, convertToReadOnly }: GetSubcontrolsColumnsParams): ColumnDef<SubcontrolRow>[] => [
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
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: CircleDot,
    options: enumToOptions(SubcontrolControlStatus),
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
