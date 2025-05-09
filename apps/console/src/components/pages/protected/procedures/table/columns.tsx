import { ColumnDef } from '@tanstack/react-table'
import React from 'react'
import { Procedure } from '@repo/codegen/src/schema.ts'
import { formatTimeSince } from '@/utils/date'

export const proceduresColumns: ColumnDef<Procedure>[] = [
  {
    accessorKey: 'displayID',
    header: 'Display ID',
    cell: ({ cell }) => {
      return <span className="whitespace-nowrap">{cell.getValue() as string}</span>
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ cell }) => {
      return <div>{cell.getValue() as string}</div>
    },
  },
  {
    accessorKey: 'summary',
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
    size: 140,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    size: 140,
  },
]
