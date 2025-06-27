'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { forwardRef, useImperativeHandle } from 'react'
import { TaskOrder } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { taskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'
import { TASK_SORT_FIELDS } from '@/components/pages/protected/tasks/table/table-config.ts'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks.ts'
import { VisibilityState } from '@tanstack/react-table'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type TTasksTableProps = {
  onSortChange?: (sortCondition: any[]) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: Record<string, any> | null
  orderByFilter: TaskOrder[] | TaskOrder | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
}
const TasksTable = forwardRef(({ onSortChange, pagination, onPaginationChange, whereFilter, orderByFilter, columnVisibility, setColumnVisibility }: TTasksTableProps, ref) => {
  const { replace } = useSmartRouter()
  const { tasks, isLoading: fetching, data, isFetching, isError } = useTasksWithFilter({ where: whereFilter, orderBy: orderByFilter, pagination, enabled: !!whereFilter })

  useImperativeHandle(ref, () => ({
    exportData: () => tasks,
  }))

  if (isError) {
    return <p className="text-red-500">Error loading tasks</p>
  }

  return (
    <DataTable
      columns={taskColumns}
      sortFields={TASK_SORT_FIELDS}
      onSortChange={onSortChange}
      data={tasks}
      loading={fetching}
      onRowClick={(task) => {
        replace({ id: task.id })
      }}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{ totalCount: data?.tasks.totalCount, pageInfo: data?.tasks?.pageInfo, isLoading: isFetching }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
    />
  )
})

TasksTable.displayName = 'TasksTable'

export default TasksTable
