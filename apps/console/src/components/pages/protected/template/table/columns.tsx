import { ColumnDef } from '@tanstack/react-table'
import { Template, User } from '@repo/codegen/src/schema'
import { formatDate, formatTimeSince } from '@/utils/date'
import { Avatar } from '@/components/shared/avatar/avatar'

type Params = {
  userMap?: Record<string, User>
}

export const getTemplateColumns = (params?: Params) => {
  const userMap = params?.userMap || {}

  const columns: ColumnDef<Template>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => <div className="font-bold">{cell.getValue() as string}</div>,
      size: 200,
      minSize: 100,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => {
        const userId = row.original.createdBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatDate(cell.getValue() as string)}</span>,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
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
