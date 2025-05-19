import { ColumnDef } from '@tanstack/react-table'
import { Avatar } from '@/components/shared/avatar/avatar'
import AssigneeCell from '@/components/pages/protected/tasks/table/assignee-cell.tsx'
import { Task } from '@repo/codegen/src/schema.ts'
import { formatDate } from '@/utils/date'
import { TaskStatusIconMapper } from '@/components/shared/icon-enum/task-enum.tsx'
import { TaskStatusMapper } from '@/components/pages/protected/tasks/util/task.ts'

export const taskColumns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ cell }) => {
      return <div className="font-bold">{cell.getValue() as string}</div>
    },
    size: 200,
    minSize: 100,
  },
  {
    accessorKey: 'category',
    header: 'Type',
    size: 140,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ cell, row }) => {
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
          <Avatar entity={row?.original?.assigner} className="w-[28px] h-[28px]" />
          <p>{fullName}</p>
        </div>
      )
    },
    size: 160,
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    cell: ({ row }) => {
      return <AssigneeCell assignee={row.original.assignee!} taskId={row.original.id!} />
    },
    size: 160,
  },
  {
    accessorKey: 'due',
    header: 'Due Date',
    cell: ({ cell }) => {
      const value = cell.getValue() as string | null
      return formatDate(value)
    },
    size: 100,
  },
]
