'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/utils/date'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks'
import { OrderDirection, TaskOrderField, TasksWithFilterQueryVariables, TaskTaskStatus, TaskWhereInput, User } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TASK_SORT_FIELDS } from '../protected/tasks/table/table-config'
import { useSearchParams } from 'next/navigation'
import Frame from '@/assets/Frame'
import { TaskStatusIconMapper } from '@/components/shared/enum-mapper/task-enum'
import { TaskStatusMapper } from '@/components/pages/protected/tasks/util/task.ts'

type FormattedTask = {
  id: string
  title: string
  category: string
  status: TaskTaskStatus
  due?: string
  assignee?: User
}

const columns: ColumnDef<FormattedTask>[] = [
  {
    header: 'Title',
    accessorKey: 'title',
    cell: ({ row }) => {
      const task = row.original
      return (
        <Link href={`/tasks?id=${task.id}`} className="text-blue-500 hover:underline">
          {task.title}
        </Link>
      )
    },
  },
  {
    header: 'Type',
    accessorKey: 'category',
    cell: ({ row }) => row.original.category || '—',
  },

  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.original.status
      const icon = TaskStatusIconMapper[status] ?? null

      return (
        <span className="flex items-center gap-2 capitalize">
          {icon}
          {TaskStatusMapper[status]}
        </span>
      )
    },
  },
  {
    header: 'Due Date',
    accessorKey: 'due',
    cell: ({ row }) => {
      const due = row.original.due
      return formatDate(due)
    },
  },
  {
    header: 'Assignee',
    accessorKey: 'assignee',
    cell: ({ row }) => {
      const assignee = row.original.assignee
      return (
        <div className="flex items-center gap-2">
          <Avatar entity={assignee as User} />
          {assignee?.displayName || '—'}
        </div>
      )
    },
  },
]

const TasksTable = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const [pagination, setPagination] = useState<TPagination>({ ...DEFAULT_PAGINATION, pageSize: 5 })
  const where: TaskWhereInput = programId
    ? {
        hasProgramsWith: [{ id: programId }],
        statusNotIn: [TaskTaskStatus.COMPLETED, TaskTaskStatus.WONT_DO],
      }
    : {}
  const [orderBy, setOrderBy] = useState<TasksWithFilterQueryVariables['orderBy']>([
    {
      field: TaskOrderField.due,
      direction: OrderDirection.ASC,
    },
  ])

  const { data, tasks, isLoading, isFetching } = useTasksWithFilter({ where, pagination, orderBy, enabled: !!programId })

  const formattedTasks: FormattedTask[] = useMemo(() => {
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      category: task.category ?? '—',
      status: task.status,
      due: task.due ?? undefined,
      assignee: task.assignee as User,
    }))
  }, [tasks])

  const filters = [
    {
      field: 'hasProgramsWith',
      value: programId,
      type: 'selectIs',
      operator: 'EQ',
    },
  ]

  const encodedFilters = encodeURIComponent(JSON.stringify(filters))

  return (
    <div className="p-6 bg-muted rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Outstanding tasks</h2>
        <Link href={`/tasks?regularFilters=${encodedFilters}`}>
          <Button icon={<Frame size={16} />} iconPosition="left">
            View Tasks
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={formattedTasks}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: data?.tasks.totalCount, pageInfo: data?.tasks?.pageInfo, isLoading: isFetching }}
        loading={isLoading}
        sortFields={TASK_SORT_FIELDS}
        onSortChange={setOrderBy}
      />
    </div>
  )
}

export default TasksTable
