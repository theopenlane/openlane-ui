import { ColumnDef } from '@tanstack/react-table'
import { TTableDataResponse } from '@/components/pages/protected/tasks/table/types/TTableDataResponse'
import { format } from 'date-fns'

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
      return !firstName && !lastName ? row.original.assigner?.displayName : `${firstName ?? ''} ${lastName ?? ''}`
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
  },
]
