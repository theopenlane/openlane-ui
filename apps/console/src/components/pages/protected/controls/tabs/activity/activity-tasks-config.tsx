import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Task } from '@repo/codegen/src/schema'
import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { TaskFilterIcons, TaskStatusIconMapper } from '@/components/shared/enum-mapper/task-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { formatDate } from '@/utils/date'
import type { FilterField } from '@/types'
import type { TOrgMembers } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export type ActivityTaskRow = Pick<Task, 'id' | 'title' | 'taskKindName' | 'status' | 'assignee' | 'due'>

type TaskKindOption = { label: string; value: string }

export const getActivityTaskFilterFields = (taskKindOptions: TaskKindOption[] = [], orgMembers: TOrgMembers[] = []): FilterField[] => [
  {
    key: 'taskKindNameIn',
    label: 'Type',
    type: 'multiselect',
    options: taskKindOptions,
    icon: TaskFilterIcons.Type,
  },
  {
    key: 'due',
    label: 'Due Date',
    type: 'dateRange',
    icon: TaskFilterIcons.DueDate,
  },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    options: enumToOptions(TaskTaskStatus),
    icon: TaskFilterIcons.Status,
  },
  {
    key: 'assignerIDIn',
    label: 'Assigner',
    type: 'multiselect',
    options: orgMembers,
    icon: TaskFilterIcons.Assigner,
  },
  {
    key: 'assigneeIDIn',
    label: 'Assignee',
    type: 'multiselect',
    options: orgMembers,
    icon: TaskFilterIcons.Assignee,
  },
]

export const getActivityTaskColumns = (taskKindOptions: TaskKindOption[] = [], onTaskOpen?: (taskId: string) => void): ColumnDef<ActivityTaskRow>[] => [
  {
    accessorKey: 'title',
    header: () => <span className="whitespace-nowrap">Title</span>,
    cell: ({ row }) => (
      <button type="button" className="text-blue-500 text-left hover:underline  whitespace-nowrap" onClick={() => onTaskOpen?.(row.original.id)}>
        {row.original.title}
      </button>
    ),
  },
  {
    accessorKey: 'taskKindName',
    header: () => <span className="whitespace-nowrap">Type</span>,
    cell: ({ row }) => <CustomTypeEnumValue value={(row.original.taskKindName as string) ?? ''} options={taskKindOptions ?? []} placeholder="-" />,
    size: 140,
  },
  {
    accessorKey: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    cell: ({ row }) => {
      const status = row.original.status ?? TaskTaskStatus.OPEN
      return (
        <div className="flex items-center space-x-2">
          {TaskStatusIconMapper[status]}
          <p>{getEnumLabel(status)}</p>
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: 'assignee',
    header: () => <span className="whitespace-nowrap">Assignee</span>,
    cell: ({ row }) => {
      const assignee = row.original.assignee
      if (!assignee) {
        return <span className="text-muted-foreground">Not assigned</span>
      }
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Avatar entity={assignee} className="w-6 h-6" />
          <span>{assignee.displayName}</span>
        </div>
      )
    },
    size: 180,
  },
  {
    accessorKey: 'due',
    header: () => <span className="whitespace-nowrap">Due Date</span>,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.due)}</span>,
    size: 120,
  },
]
