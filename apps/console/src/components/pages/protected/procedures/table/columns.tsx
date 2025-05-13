import { ColumnDef } from '@tanstack/react-table'
import React from 'react'
import { Procedure } from '@repo/codegen/src/schema.ts'
import { formatTimeSince } from '@/utils/date'

export const proceduresColumns: ColumnDef<Procedure>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ cell }) => {
      return <div className="font-bold">{cell.getValue() as string}</div>
    },
    size: 180,
  },
  {
    accessorKey: 'summary',
    size: 300,
    header: 'Summary',
    cell: ({ cell }) => {
      const summary = cell.getValue() as string
      return <div className="line-clamp-4">{summary === '' ? 'N/A' : summary}</div>
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    size: 120,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    size: 120,
  },
]
