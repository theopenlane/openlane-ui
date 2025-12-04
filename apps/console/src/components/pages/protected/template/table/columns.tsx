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
      size: 100,
      minSize: 100,
      maxSize: 200,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => {
        const userId = row.original.createdBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
            {user.displayName}
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => formatDate(cell.getValue() as string),
      size: 120,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const user = userMap?.[userId ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
            {user.displayName}
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last updated',
      cell: ({ cell }) => formatTimeSince(cell.getValue() as string),
      size: 120,
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
