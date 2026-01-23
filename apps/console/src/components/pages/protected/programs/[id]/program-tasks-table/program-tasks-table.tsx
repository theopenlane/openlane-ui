'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/utils/date'
import { Button } from '@repo/ui/button'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks'
import { OrderDirection, TaskOrderField, TasksWithFilterQueryVariables, TaskTaskStatus, TaskWhereInput, User } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TASK_SORT_FIELDS } from '../../../tasks/table/table-config.ts'
import { useParams } from 'next/navigation'
import Frame from '@/assets/Frame'
import { TaskStatusIconMapper } from '@/components/shared/enum-mapper/task-enum'
import { TaskStatusMapper } from '@/components/pages/protected/tasks/util/task.ts'
import { saveFilters, TFilterState } from '@/components/shared/table-filter/filter-storage.ts'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums.ts'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip.tsx'

type FormattedTask = {
  id: string
  title: string
  taskKindName: string
  status: TaskTaskStatus
  due?: string
  assignee?: User
}

const ProgramTasksTable = () => {
  const { id } = useParams<{ id: string | undefined }>()
  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.PROGRAM, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
    }),
  )

  const { enumOptions: taskKindOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })

  const columns: ColumnDef<FormattedTask>[] = useMemo(
    () => [
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
        accessorKey: 'taskKindName',
        cell: ({ cell }) => <CustomTypeEnumValue value={(cell.getValue() as string) ?? ''} options={taskKindOptions} placeholder="Select" />,
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
    ],
    [taskKindOptions],
  )

  const where: TaskWhereInput = id
    ? {
        hasProgramsWith: [{ id }],
        statusNotIn: [TaskTaskStatus.COMPLETED, TaskTaskStatus.WONT_DO],
      }
    : {}
  const defaultSorting = getInitialSortConditions(TableKeyEnum.PROGRAM, TaskOrderField, [
    {
      field: TaskOrderField.due,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<TasksWithFilterQueryVariables['orderBy']>(defaultSorting)

  const { data, tasks, isLoading, isFetching } = useTasksWithFilter({ where, pagination, orderBy, enabled: !!id })

  const formattedTasks: FormattedTask[] = useMemo(() => {
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      taskKindName: task.taskKindName ?? '—',
      status: task.status,
      due: task.due ?? undefined,
      assignee: task.assignee as User,
    }))
  }, [tasks])

  const handleClick = () => {
    if (!id) {
      return
    }

    const filters: TFilterState = {
      hasProgramsWith: [id],
    }

    saveFilters(TableFilterKeysEnum.TASK, filters)
  }

  return (
    <div className="p-6 bg-card rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Outstanding tasks</h2>
        <Link href={`/tasks`} onClick={handleClick}>
          <Button variant="secondary" icon={<Frame size={16} />} iconPosition="left">
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
        defaultSorting={defaultSorting}
        tableKey={TableKeyEnum.PROGRAM}
      />
    </div>
  )
}

export default ProgramTasksTable
