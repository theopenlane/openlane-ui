import { ColumnDef } from '@tanstack/react-table'
import { TTableDataResponse } from '@/components/pages/protected/tasks/table/types/TTableDataResponse'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { CircleCheck, CircleX, ListTodo, MessageSquareCode, PanelTopOpen, Timer, View } from 'lucide-react'

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
      const image = row.original.assigner?.avatarFile?.presignedURL || row.original.assigner?.avatarRemoteURL
      const firstName = row.original.assigner?.firstName
      const lastName = row.original.assigner?.lastName
      const fullName = !firstName && !lastName ? row.original.assigner?.displayName : `${firstName ?? ''} ${lastName ?? ''}`
      const initials = fullName
        ? fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
        : 'N/A'

      return (
        <div className="flex items-center space-x-1">
          <Avatar>
            {image && <AvatarImage src={image} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <p>{fullName}</p>
        </div>
      )
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
  ['Completed']: <CircleCheck height={16} width={16} color="#2CCBAB" />,
  ['In progress']: <Timer height={16} width={16} color="#EAB308" />,
  ['In review']: <View height={16} width={16} color="#EAB308" />,
  ['Open']: <ListTodo height={16} width={16} color="#2CCBAB" />,
  ["Won't do"]: <CircleX height={16} width={16} color="#c70000" />,
}
