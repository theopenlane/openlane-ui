'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TaskTaskStatus, useTasksWithFilterQuery } from '@repo/codegen/src/schema'
import TaskTableToolbar from '@/components/pages/protected/tasks/table/task-table-toolbar'
import { TTableDataResponse } from '@/components/pages/protected/tasks/table/types/TTableDataResponse'
import { taskColumns } from '@/components/pages/protected/tasks/util/columns'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { TaskStatusMapper } from '@/components/pages/protected/tasks/util/task'

const TaskTable: React.FC = () => {
  const { setSelectedTask } = useTaskStore()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [{ data, fetching }] = useTasksWithFilterQuery({ variables: { where: filters }, requestPolicy: 'network-only' })
  const [tableData, setTableData] = useState<TTableDataResponse[]>([])

  useEffect(() => {
    if (data) {
      const updatedData =
        data.tasks?.edges?.map((item: any) => {
          return {
            id: item?.node?.id,
            displayID: item?.node?.displayID,
            name: item?.node?.name,
            description: item?.node?.description,
            due: item?.node?.due,
            status: TaskStatusMapper[item?.node?.status as TaskTaskStatus],
            title: item?.node?.title,
            assigner: item?.node?.assigner,
            category: item?.node?.category,
          }
        }) || []

      setTableData(updatedData)
    }
  }, [data!!])

  const handleFilterChange = (filters: Record<string, any>) => {
    setFilters(filters)
  }

  const handleRowClick = (task: TTableDataResponse) => {
    setSelectedTask(task.id ?? null)
  }

  return (
    <>
      <TaskTableToolbar onFilterChange={handleFilterChange} isLoading={false} />
      <DataTable columns={taskColumns} data={tableData} loading={fetching} onRowClick={handleRowClick} />
    </>
  )
}

export default TaskTable
