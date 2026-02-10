import { ColumnDef } from '@tanstack/react-table'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Template, User } from '@repo/codegen/src/schema'
import { SquareCheck, SquareX } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDateSince } from '@/utils/date'

type GetQuestionnaireColumnsArgs = {
  userMap: Record<string, User>
}

export const getQuestionnaireColumns = ({ userMap }: GetQuestionnaireColumnsArgs) => {
  const columns: ColumnDef<Template>[] = [
    {
      header: 'Questionnaire',
      accessorKey: 'name',
      cell: ({ row }) => {
        const id = row.original.id
        const name = row.getValue('name')

        return (
          <Link href={`/questionnaires/questionnaire-viewer?id=${id}`} className="text-blue-600 hover:underline">
            {name as string}
          </Link>
        )
      },
    },
    {
      header: 'Questionnaire Created',
      accessorKey: 'created',
    },
    {
      header: 'Pending Response',
      accessorKey: 'pending',
    },
    {
      header: 'Completed',
      accessorKey: 'completed',
    },
    {
      header: 'Completed Pending Review',
      accessorKey: 'pendingReview',
      cell: () => (
        <div className="flex items-center gap-2">
          <SquareX size={16} /> <span>Deny</span>
        </div>
      ),
    },
    {
      header: 'Completed Accepted',
      accessorKey: 'accepted',
      cell: () => (
        <div className="flex items-center gap-2">
          <SquareCheck size={16} /> <span>Approve</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const user = userMap?.[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center gap-1">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
      size: 200,
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
            <Avatar entity={user} className="w-[24px] h-[24px]" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
      size: 200,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ cell }) => formatDateSince(cell.getValue() as string),
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
