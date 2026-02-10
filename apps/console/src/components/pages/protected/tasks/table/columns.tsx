// columns.tsx

import { ColumnDef, Row } from '@tanstack/react-table'
import { Task, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate, formatTimeSince } from '@/utils/date'
import { TaskStatusIconMapper } from '@/components/shared/enum-mapper/task-enum'
import AssigneeCell from './assignee-cell'
import { Checkbox } from '@repo/ui/checkbox'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enums'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type ColumnOptions = {
  userMap: Record<string, User>
  convertToReadOnly?: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  selectedTasks: { id: string }[]
  setSelectedTasks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  taskKindOptions: CustomTypeEnumOption[]
}

export const getTaskColumns = ({ userMap, convertToReadOnly, selectedTasks, setSelectedTasks, taskKindOptions }: ColumnOptions): ColumnDef<Task>[] => {
  const toggleSelection = (task: { id: string }) => {
    setSelectedTasks((prev) => {
      const exists = prev.some((c) => c.id === task.id)
      return exists ? prev.filter((c) => c.id !== task.id) : [...prev, task]
    })
  }
  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageTasks = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageTasks.every((task) => selectedTasks.some((sc) => sc.id === task.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedTasks.filter((sc) => !currentPageTasks.some((c) => c.id === sc.id)), ...currentPageTasks.map((c) => ({ id: c.id }))]
                  : selectedTasks.filter((sc) => !currentPageTasks.some((c) => c.id === sc.id))

                setSelectedTasks(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<Task> }) => {
        const { id } = row.original
        const isChecked = selectedTasks.some((c) => c.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 50,
      maxSize: 50,
    },
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
        const status = row.original.status!
        return (
          <div className="flex items-center space-x-2">
            {TaskStatusIconMapper[status]}
            <p>{getEnumLabel(status)}</p>
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
      cell: ({ row }) => {
        const tags = row?.original?.tags
        if (!tags?.length) {
          return '-'
        }
        return <div className="flex gap-2 flex-wrap">{row?.original?.tags?.map((tag, i) => <TagChip key={i} tag={tag} />)}</div>
      },
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
      size: 200,
      cell: ({ row }) => {
        const user = userMap[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 150,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatDate(cell.getValue() as string)}</span>,
    },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 200,
      cell: ({ row }) => {
        const user = userMap[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar entity={user} />
            {user.displayName || '-'}
          </div>
        ) : (
          'Deleted user'
        )
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    },
  ]
}
