import { type ColumnDef } from '@tanstack/react-table'
import { type Task, type User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'
import { TaskStatusIconMapper } from '@/components/shared/enum-mapper/task-enum'
import AssigneeCell from './assignee-cell'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'

type ColumnOptions = {
  userMap: Record<string, User>
  convertToReadOnly?: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  selectedTasks: { id: string }[]
  setSelectedTasks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  taskKindOptions: CustomTypeEnumOption[]
}

export const getTaskColumns = ({ userMap, convertToReadOnly, selectedTasks, setSelectedTasks, taskKindOptions }: ColumnOptions): ColumnDef<Task>[] => {
  return [
    createSelectColumn<Task>(selectedTasks, setSelectedTasks),
    {
      accessorKey: 'id',
      header: 'ID',
      size: 270,
      minSize: 270,
      maxSize: 270,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ cell }) => <div>{cell.getValue() as string}</div>,
      size: 200,
    },
    {
      accessorKey: 'taskKindName',
      header: 'Type',
      size: 140,
      cell: ({ cell }) => <CustomTypeEnumValue value={(cell.getValue() as string) ?? ''} options={taskKindOptions} placeholder="-" />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="flex items-center space-x-2">
            {status && TaskStatusIconMapper[status]}
            <p>{status ? getEnumLabel(status) : ''}</p>
          </div>
        )
      },
      size: 100,
    },
    {
      accessorKey: 'assigner',
      header: 'Assigner',
      meta: {
        exportPrefix: 'assigner.displayName',
      },
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
      meta: {
        exportPrefix: 'assignee.displayName',
      },
      cell: ({ row }) => <AssigneeCell assignee={row.original.assignee ?? undefined} taskId={row.original.id ?? ''} />,
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
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string) || '',
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
      cell: ({ row }) => <TagsCell tags={row.original.tags} />,
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" />,
    },
  ]
}
