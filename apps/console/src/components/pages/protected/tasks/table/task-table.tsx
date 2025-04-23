'use client'
import React, { useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import TaskTableToolbar from '@/components/pages/protected/tasks/table/task-table-toolbar'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import TaskCards from '@/components/pages/protected/tasks/cards/task-cards'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks'
import { OrderDirection, Task, TaskOrderField, TasksWithFilterQueryVariables, TaskTaskStatus } from '@repo/codegen/src/schema'
import { taskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'
import { TASK_SORT_FIELDS } from '@/components/pages/protected/tasks/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { exportToCSV } from '@/utils/exportToCSV'
import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'

const TaskTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false)
  const { setSelectedTask, orgMembers } = useTaskStore()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [orderBy, setOrderBy] = useState<TasksWithFilterQueryVariables['orderBy']>([
    {
      field: TaskOrderField.due,
      direction: OrderDirection.ASC,
    },
  ])
  const allStatuses = [TaskTaskStatus.COMPLETED, TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW, TaskTaskStatus.WONT_DO]
  const statusesWithoutComplete = [TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW, TaskTaskStatus.WONT_DO]

  const whereFilter = useMemo(() => {
    const conditions: Record<string, any> = {
      ...(showCompletedTasks ? { statusIn: allStatuses } : { statusIn: statusesWithoutComplete }),
      ...filters,
    }

    return conditions
  }, [filters, showCompletedTasks])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { tasks, isLoading: fetching, data, isFetching } = useTasksWithFilter({ where: whereFilter, orderBy: orderByFilter, pagination })

  const handleRowClick = (task: Task) => {
    setSelectedTask(task.id ?? null)
  }

  const handleTabChange = (tab: 'table' | 'card') => {
    setActiveTab(tab)
  }

  const handleShowCompletedTasks = (val: boolean) => {
    setShowCompletedTasks(val)
  }

  function isAccessorKeyColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string'
  }

  const handleExport = () => {
    const exportableColumns = taskColumns.filter(isAccessorKeyColumn).map((col) => {
      const key = col.accessorKey as keyof Task
      const label = col.header

      return {
        label,
        accessor: (task: Task) => {
          const value = task[key]

          if (key === 'due' && value) {
            return format(new Date(value as string), 'yyyy-MM-dd')
          }

          if (key === 'assignee') {
            return task.assignee?.displayName || '-'
          }

          if (key === 'assigner') {
            const firstName = task.assigner?.firstName
            const lastName = task.assigner?.lastName
            return !firstName && !lastName ? task.assigner?.displayName : `${firstName ?? ''} ${lastName ?? ''}`.trim()
          }

          return typeof value === 'string' || typeof value === 'number' ? value : ''
        },
      }
    })

    exportToCSV(tasks, exportableColumns, 'task_list')
  }

  return (
    <>
      <TaskTableToolbar onFilterChange={setFilters} members={orgMembers} onTabChange={handleTabChange} onShowCompletedTasksChange={handleShowCompletedTasks} handleExport={handleExport} />
      {activeTab === 'table' ? (
        <DataTable
          columns={taskColumns}
          sortFields={TASK_SORT_FIELDS}
          onSortChange={setOrderBy}
          data={tasks}
          loading={fetching}
          onRowClick={handleRowClick}
          pagination={pagination}
          onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
          paginationMeta={{ totalCount: data?.tasks.totalCount, pageInfo: data?.tasks?.pageInfo, isLoading: isFetching }}
        />
      ) : (
        <TaskCards tasks={tasks} loading={fetching} />
      )}
    </>
  )
}

export default TaskTable
