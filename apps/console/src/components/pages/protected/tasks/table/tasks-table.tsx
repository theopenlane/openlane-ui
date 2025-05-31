'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { forwardRef, useImperativeHandle } from 'react'
import { TaskOrder } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { taskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'
import { TASK_SORT_FIELDS } from '@/components/pages/protected/tasks/table/table-config.ts'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks.ts'
import { useRouter } from 'next/navigation'

type TTasksTableProps = {
  onSortChange?: (sortCondition: any[]) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: Record<string, any> | null
  orderByFilter: TaskOrder[] | TaskOrder | undefined
}
const TasksTable = forwardRef(({ onSortChange, pagination, onPaginationChange, whereFilter, orderByFilter }: TTasksTableProps, ref) => {
  const { replace } = useRouter()
  const { tasks, isLoading: fetching, data, isFetching, isError } = useTasksWithFilter({ where: whereFilter, orderBy: orderByFilter, pagination, enabled: !!whereFilter })

  useImperativeHandle(ref, () => ({
    exportData: () => tasks,
  }))

  if (isError) {
    return <p className="text-red-500">Error loading tasks</p>
  }

  return (
    <div className="mt-5">
      <DataTable
        columns={taskColumns}
        sortFields={TASK_SORT_FIELDS}
        onSortChange={onSortChange}
        data={tasks}
        loading={fetching}
        onRowClick={(task) => {
          const params = new URLSearchParams(window.location.search)
          params.set('id', task.id)
          replace(`?${params.toString()}`)
        }}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={{ totalCount: data?.tasks.totalCount, pageInfo: data?.tasks?.pageInfo, isLoading: isFetching }}
      />
    </div>
  )
})

TasksTable.displayName = 'TasksTable'

export default TasksTable
