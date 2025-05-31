import { ColumnDef } from '@tanstack/react-table'
import { InternalPolicy, User } from '@repo/codegen/src/schema.ts'
import { formatTimeSince } from '@/utils/date'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'

type TPoliciesColumnsProps = {
  users?: User[]
}

export const getPoliciesColumns = ({ users }: TPoliciesColumnsProps): ColumnDef<InternalPolicy>[] => {
  return [
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
        return <div className="line-clamp-4 text-justify">{summary === '' ? 'N/A' : summary}</div>
      },
    },
    {
      accessorKey: 'updatedBy',
      header: 'Last Updated By',
      cell: ({ row }) => {
        const userId = row.original.updatedBy
        const user = users?.find((item) => item.id === userId)
        return (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user?.displayName || '—'}
          </div>
        )
      },
      size: 130,
      maxSize: 130,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
      size: 120,
      maxSize: 120,
    },
  ]
}
