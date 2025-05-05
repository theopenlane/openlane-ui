'use client'
import React, { useMemo, useRef, useState } from 'react'
import TaskTableToolbar from '@/components/pages/protected/tasks/table/task-table-toolbar'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { OrderDirection, Task, TaskOrderField, TasksWithFilterQueryVariables, TaskTaskStatus } from '@repo/codegen/src/schema'
import { taskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { exportToCSV } from '@/utils/exportToCSV'
import { ColumnDef } from '@tanstack/react-table'
import TaskInfiniteCards from '@/components/pages/protected/tasks/cards/task-infinite-cards.tsx'
import TasksTable from '@/components/pages/protected/tasks/table/tasks-table.tsx'
import { formatDate } from '@/utils/date'

const TasksPage: React.FC = () => {
  const { orgMembers } = useTaskStore()
  const tableRef = useRef<{ exportData: () => Task[] }>(null)
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false)
  const [filters, setFilters] = useState<Record<string, any> | null>(null)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [orderBy, setOrderBy] = useState<TasksWithFilterQueryVariables['orderBy']>([
    {
      field: TaskOrderField.due,
      direction: OrderDirection.ASC,
    },
  ])
  const allStatuses = useMemo(() => [TaskTaskStatus.COMPLETED, TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW, TaskTaskStatus.WONT_DO], [])
  const statusesWithoutComplete = useMemo(() => [TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW, TaskTaskStatus.WONT_DO], [])

  const whereFilter = useMemo(() => {
    if (!filters) {
      return null
    }
    const conditions: Record<string, any> = {
      ...(showCompletedTasks ? { statusIn: allStatuses } : { statusIn: statusesWithoutComplete }),
      ...filters,
    }

    return conditions
  }, [filters, showCompletedTasks, allStatuses, statusesWithoutComplete])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

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
    const tasks = tableRef.current?.exportData?.() ?? []

    const exportableColumns = taskColumns.filter(isAccessorKeyColumn).map((col) => {
      const key = col.accessorKey as keyof Task
      const label = col.header

      return {
        label,
        accessor: (task: Task) => {
          const value = task[key]

          if (key === 'due' && value) {
            return formatDate(value)
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
        <TasksTable ref={tableRef} orderByFilter={orderByFilter} pagination={pagination} onPaginationChange={setPagination} whereFilter={whereFilter} onSortChange={setOrderBy} />
      ) : (
        <TaskInfiniteCards ref={tableRef} whereFilter={whereFilter} orderByFilter={orderByFilter} />
      )}
    </>
  )
}

export default TasksPage
