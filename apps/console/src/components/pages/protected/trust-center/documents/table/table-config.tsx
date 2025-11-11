'use client'
import { ColumnDef } from '@tanstack/react-table'
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

export const trustCenterDocsColumns: ColumnDef<TTrustCenterDoc>[] = [
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
    cell: ({ row }) => {
      return <span className="capitalize">{row.original.visibility.split('_').join(' ').toLowerCase()}</span>
    },
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
            <Badge key={idx} variant={'outline'}>
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
    cell: ({ row }) => {
      const createdAt = row.original.createdAt
      return <span>{formatDate(createdAt)}</span>
    },
    size: 120,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    cell: ({ row }) => {
      const createdAt = row.original.updatedAt
      return <span>{formatDate(createdAt)}</span>
    },
    size: 120,
  },
]

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
