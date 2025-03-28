'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import TaskTableToolbar from '@/components/pages/protected/tasks/table/task-table-toolbar'
import { TTableDataResponse } from '@/components/pages/protected/tasks/table/types/TTableDataResponse'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { TaskStatusMapper } from '@/components/pages/protected/tasks/util/task'
import TaskCards from '@/components/pages/protected/tasks/cards/task-cards'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks'
import { OrderDirection, TaskOrderField, TasksWithFilterQueryVariables, TaskTaskStatus } from '@repo/codegen/src/schema'
import { taskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'

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

  const { data, isLoading: fetching } = useTasksWithFilter(whereFilter, orderByFilter)
  const [tableData, setTableData] = useState<TTableDataResponse[]>([])

  useEffect(() => {
    if (data) {
      const updatedData =
        data?.tasks?.edges?.map((item: any) => {
          return {
            id: item?.node?.id,
            displayID: item?.node?.displayID,
            name: item?.node?.name,
            details: item?.node?.details,
            due: item?.node?.due,
            status: TaskStatusMapper[item?.node?.status as TaskTaskStatus],
            title: item?.node?.title,
            assigner: item?.node?.assigner,
            category: item?.node?.category,
            assignee: item?.node?.assignee,
          }
        }) || []

      setTableData(updatedData)
    }
  }, [data!!])

  const handleRowClick = (task: TTableDataResponse) => {
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
      <TaskTableToolbar onFilterChange={setFilters} members={orgMembers} onSortChange={setOrderBy} onTabChange={handleTabChange} onShowCompletedTasksChange={handleShowCompletedTasks} />
      {activeTab === 'table' ? <DataTable columns={taskColumns} data={tableData} loading={fetching} onRowClick={handleRowClick} /> : <TaskCards tasks={tableData} loading={fetching} />}
    </>
  )
}

export default TaskTable
