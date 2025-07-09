// columns.tsx

import { ColumnDef } from '@tanstack/react-table'
import { Task, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'
import { TaskStatusIconMapper } from '@/components/shared/icon-enum/task-enum.tsx'
import { TaskStatusMapper } from '@/components/pages/protected/tasks/util/task.ts'
import AssigneeCell from './assignee-cell'
import { Badge } from '@repo/ui/badge'

type ColumnOptions = {
  userMap: Record<string, User>
  convertToReadOnly?: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
}

export const getTaskColumns = ({ userMap, convertToReadOnly }: ColumnOptions): ColumnDef<Task>[] => [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ cell }) => <div className="font-bold">{cell.getValue() as string}</div>,
    size: 200,
  },
  {
    accessorKey: 'category',
    header: 'Type',
    size: 140,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status!
      return (
        <div className="flex items-center space-x-2">
          {TaskStatusIconMapper[status]}
          <p>{TaskStatusMapper[status]}</p>
        </div>
      )
    },
    size: 100,
  },
  {
    accessorKey: 'assigner',
    header: 'Assigner',
    cell: ({ row }) => {
      const fullName = row.original.assigner?.displayName
      return (
        <div className="flex items-center space-x-1">
          <Avatar entity={row.original.assigner} className="w-[28px] h-[28px]" />
          <p>{fullName}</p>
        </div>
      )
    },
    size: 160,
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    cell: ({ row }) => <AssigneeCell assignee={row.original.assignee!} taskId={row.original.id!} />,
    size: 160,
  },
  {
    accessorKey: 'due',
    header: 'Due Date',
    cell: ({ cell }) => formatDate(cell.getValue() as string | null),
    size: 100,
  },
  {
    accessorKey: 'details',
    header: 'Details',
    cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string, 0) || '',
    size: 200,
  },
  {
    accessorKey: 'completed',
    header: 'Completed',
    cell: ({ cell }) => formatDate(cell.getValue() as string | null),
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    size: 140,
    cell: ({ row }) => {
      const tags = row?.original?.tags
      if (!tags?.length) {
        return '-'
      }
      return (
        <div className="flex gap-2">
          {row?.original?.tags?.map((tag, i) => (
            <Badge variant={'outline'} key={i}>
              {tag}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdBy',
    header: 'Created By',
    cell: ({ row }) => {
      const user = userMap[row.original.createdBy ?? '']
      return user ? (
        <div className="flex items-center space-x-1">
          <Avatar entity={user} className="w-[24px] h-[24px]" />
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
      const user = userMap[row.original.updatedBy ?? '']
      return user ? (
        <div className="flex items-center space-x-1">
          <Avatar entity={user} className="w-[24px] h-[24px]" />
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
    header: 'Updated At',
    cell: ({ cell }) => formatDate(cell.getValue() as string),
    size: 130,
  },
]
