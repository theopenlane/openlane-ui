import { ColumnDef } from '@tanstack/react-table'
import React from 'react'
import { InternalPolicy } from '@repo/codegen/src/schema.ts'
import { formatTimeSince } from '@/utils/date'

export const policiesColumns: ColumnDef<InternalPolicy>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ cell }) => {
      return <div className="font-bold">{cell.getValue() as string}</div>
    },
    minSize: 100,
    size: 180,
  },
  {
    accessorKey: 'summary',
    header: 'Summary',
    enableResizing: true,
    minSize: 300,
    size: 400,
    cell: ({ cell }) => {
      const summary = cell.getValue() as string
      return <div className="line-clamp-4 text-justify ">{summary === '' ? 'N/A' : summary}</div>
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    size: 100,
    maxSize: 120,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    size: 100,
    maxSize: 120,
  },
]
