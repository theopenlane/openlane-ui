import { ColumnDef } from '@tanstack/react-table'
import { TTableDataResponse } from '@/components/pages/protected/tasks/table/types/TTableDataResponse'
import { format } from 'date-fns'
import { CircleCheck, CircleX, ListTodo, MessageSquareCode, PanelTopOpen, Timer, View } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar'
import AssigneeCell from '@/components/pages/protected/tasks/table/assignee-cell.tsx'

export const taskColumns: ColumnDef<TTableDataResponse>[] = [
  {
    accessorKey: 'displayID',
    header: 'Task',
  },
  {
    accessorKey: 'category',
    header: 'Type',
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'assigner',
    header: 'Assigner',
    cell: ({ row }) => {
      const firstName = row.original.assigner?.firstName
      const lastName = row.original.assigner?.lastName
      const fullName = !firstName && !lastName ? row.original.assigner?.displayName : `${firstName ?? ''} ${lastName ?? ''}`

      return (
        <div className="flex items-center space-x-1">
          <Avatar entity={row?.original?.assigner} />
          <p>{fullName}</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    cell: ({ row }) => {
      return <AssigneeCell assignee={row.original.assignee} taskId={row.original.id!} />
    },
  },
  {
    accessorKey: 'due',
    header: 'Due Date',
    cell: ({ cell }) => {
      const value = cell.getValue() as string | null
      return value ? format(new Date(value), 'd MMM, yyyy') : null
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ cell, row }) => {
      const status = row.original.status!
      return (
        <div className="flex items-center space-x-2">
          {TaskStatusIconMapper[status]}
          <p>{status}</p>
        </div>
      )
    },
  },
]

export const TaskStatusIconMapper: Record<string, React.ReactNode> = {
  ['Completed']: <CircleCheck height={16} width={16} className="text-task-complete" />,
  ['In progress']: <Timer height={16} width={16} className="text-task-in-progress" />,
  ['In review']: <View height={16} width={16} className="text-task-in-review" />,
  ['Open']: <ListTodo height={16} width={16} className="text-task-open" />,
  ["Won't do"]: <CircleX height={16} width={16} className="text-task-wont-do" />,
}
