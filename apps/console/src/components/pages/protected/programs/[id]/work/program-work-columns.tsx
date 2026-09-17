'use client'

import React from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@repo/ui/table-types'
import { TruncatedCell } from '@repo/ui/data-table'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { type TWorkItem } from './work-item'
import { WorkAttentionCell, WorkOwnerCell, WorkRelationCell, WorkStatusCell, WorkTypeChip } from './work-cells'

export const PROGRAM_WORK_COLUMNS: ColumnDef<TWorkItem>[] = [
  {
    accessorKey: 'item',
    header: 'Item',
    size: 240,
    cell: ({ row }) => (
      <TruncatedCell portal>
        <Link href={row.original.href} prefetch={false} className="text-link hover:underline">
          {row.original.item}
        </Link>
      </TruncatedCell>
    ),
  },
  {
    accessorKey: 'objectType',
    header: 'Type',
    size: 135,
    cell: ({ row }) => <WorkTypeChip objectType={row.original.objectType} />,
  },
  {
    accessorKey: 'workStatus',
    header: 'Work status',
    size: 140,
    cell: ({ row }) => <WorkStatusCell workStatus={row.original.workStatus} />,
  },
  {
    accessorKey: 'attention',
    header: 'Attention',
    size: 160,
    cell: ({ row }) => <WorkAttentionCell item={row.original} />,
  },
  {
    accessorKey: 'owners',
    header: 'Owner',
    size: 180,
    cell: ({ row }) => <WorkOwnerCell owners={row.original.owners} />,
  },
  {
    accessorKey: 'due',
    header: 'Due date',
    size: 150,
    cell: ({ row }) => (row.original.due ? <DateCell value={row.original.due} /> : <span className="text-muted-foreground">—</span>),
  },
  {
    accessorKey: 'relatedTo',
    header: 'Related to',
    size: 160,
    cell: ({ row }) => <WorkRelationCell relatedTo={row.original.relatedTo} />,
  },
]

export const PROGRAM_WORK_MAPPED_COLUMNS = getMappedColumns(PROGRAM_WORK_COLUMNS)
