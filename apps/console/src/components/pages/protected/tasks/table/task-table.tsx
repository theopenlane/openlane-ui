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

const TaskTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false)
  const { setSelectedTask, orgMembers } = useTaskStore()
  const [filters, setFilters] = useState<Record<string, any>>({})
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

  const { tasks, isLoading: fetching } = useTasksWithFilter(whereFilter, orderByFilter)

  const handleRowClick = (task: Task) => {
    setSelectedTask(task.id ?? null)
  }

  const handleTabChange = (tab: 'table' | 'card') => {
    setActiveTab(tab)
  }

  const handleShowCompletedTasks = (val: boolean) => {
    setShowCompletedTasks(val)
  }

  return (
    <>
      <TaskTableToolbar onFilterChange={setFilters} members={orgMembers} onTabChange={handleTabChange} onShowCompletedTasksChange={handleShowCompletedTasks} />
      {activeTab === 'table' ? (
        <DataTable columns={taskColumns} sortFields={TASK_SORT_FIELDS} onSortChange={setOrderBy} data={tasks} loading={fetching} onRowClick={handleRowClick} />
      ) : (
        <TaskCards tasks={tasks} loading={fetching} />
      )}
    </>
  )
}

export default TaskTable
