'use client'
import React, { useEffect, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useTasksWithFilterQuery } from '@repo/codegen/src/schema'
import TaskTableToolbar from '@/components/pages/protected/tasks/table/task-table-toolbar'

const TaskTable: React.FC = () => {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [{ data, fetching }] = useTasksWithFilterQuery({ variables: { where: filters }, requestPolicy: 'network-only' })
  const [tableData, setTableData] = useState<TTableDataResponse[]>([])

  useEffect(() => {
    if (data) {
      const updatedData =
        data.tasks?.edges?.map((item: any) => {
          return {
            id: item?.node?.id,
            name: item?.node?.name,
          }
        }) || []

      setTableData(updatedData)
    }
  }, [data!!])

  const handleFilterChange = (filters: Record<string, any>) => {
    setFilters(filters)
  }

  const columns: ColumnDef<TTableDataResponse>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
  ]

  return (
    <>
      <TaskTableToolbar onFilterChange={handleFilterChange} isLoading={false} />
      <DataTable columns={columns} data={tableData} loading={fetching} />
    </>
  )
}

export default TaskTable
