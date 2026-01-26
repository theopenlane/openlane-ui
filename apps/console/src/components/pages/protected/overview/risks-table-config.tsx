import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Group, User } from '@repo/codegen/src/schema'
import { formatDate } from '@/utils/date'

export type Stakeholder = {
  id: string
  displayName: string
  avatarUrl?: string
}

export type FormattedRisk = {
  id: string
  name: string
  for: string[]
  score: number | null
  stakeholder?: Stakeholder | null
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}

type GetRiskColumnsArgs = {
  userMap: Record<string, User>
}

export const getRiskColumns = ({ userMap }: GetRiskColumnsArgs) => {
  const columns: ColumnDef<FormattedRisk>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => {
        const id = row.original.id
        const name: string = row.getValue('name')

        return (
          <Link href={`/risks/${id}`} className="text-blue-600 hover:underline">
            {name}
          </Link>
        )
      },
    },
    {
      header: 'For',
      accessorKey: 'for',
      cell: ({ row }) => row.original.for?.join(', ') || '-',
    },
    {
      header: 'Stakeholder',
      accessorKey: 'stakeholder',
      cell: ({ row }) => {
        const stakeholder = row.getValue('stakeholder') as Stakeholder | null

        return (
          <div className="flex items-center gap-2">
            {stakeholder && <Avatar entity={stakeholder as Group} />}
            {stakeholder?.displayName || '-'}
          </div>
        )
      },
    },
    {
      header: 'Score',
      accessorKey: 'score',
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const user = userMap?.[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center gap-1">
            <Avatar entity={user} className="w-6 h-6" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
      size: 160,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => formatDate(cell.getValue() as string),
      size: 130,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      cell: ({ row }) => {
        const user = userMap?.[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center gap-1">
            <Avatar entity={user} className="w-6 h-6" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
      size: 160,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last updated',
      cell: ({ cell }) => formatDate(cell.getValue() as string),
      size: 130,
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
