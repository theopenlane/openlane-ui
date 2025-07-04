import { ColumnDef } from '@tanstack/react-table'
import React from 'react'
import { ApiToken, Procedure, User } from '@repo/codegen/src/schema.ts'
import { formatTimeSince } from '@/utils/date'
import { KeyRound } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'

type TProceduresColumnsProps = {
  users?: User[]
  tokens?: ApiToken[]
}

export const getProceduresColumns = ({ users, tokens }: TProceduresColumnsProps) => {
  const columns: ColumnDef<Procedure>[] = [
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
      accessorKey: 'updatedBy',
      header: 'Last Updated By',
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const token = tokens?.find((item) => item.id === userId)
        const user = users?.find((item) => item.id === userId)

        if (!token && !user) {
          return 'Deleted user'
        }

        return (
          <div className="flex items-center gap-2">
            {token ? <KeyRound size={18} /> : <Avatar entity={user} />}
            {token ? token.name : user?.displayName || '—'}
          </div>
        )
      },
      size: 150,
      maxSize: 180,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
      size: 120,
      maxSize: 120,
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
