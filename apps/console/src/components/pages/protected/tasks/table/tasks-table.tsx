'use client'

import { DataTable, type SortCondition } from '@repo/ui/data-table'
import React, { useEffect, useImperativeHandle, useMemo } from 'react'
import type { OrderDirection, TaskOrder, TaskOrderField, TaskWhereInput } from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { getTaskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'
import { TASK_SORT_FIELDS } from '@/components/pages/protected/tasks/table/table-config.ts'
import { useTasksWithFilter } from '@/lib/graphql-hooks/task'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { type VisibilityState } from '@tanstack/react-table'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useSession } from 'next-auth/react'
import { type Session } from 'next-auth'

type TTasksTableProps = {
  onSortChange?: (next: SortCondition<TaskOrderField>[]) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: TaskWhereInput | null
  orderByFilter: TaskOrder[] | TaskOrder | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  onHasTasksChange?: (hasTasks: boolean) => void
  selectedTasks: { id: string }[]
  setSelectedTasks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined, session?: Session | null) => boolean
  permission: TPermissionData | undefined
  defaultSorting: { field: string; direction?: OrderDirection }[] | undefined
}

const TasksTable = ({
  onSortChange,
  pagination,
  onPaginationChange,
  whereFilter,
  orderByFilter,
  columnVisibility,
  setColumnVisibility,
  onHasTasksChange,
  selectedTasks,
  setSelectedTasks,
  canEdit,
  permission,
  defaultSorting,
  ref,
}: TTasksTableProps & { ref?: React.Ref<{ exportData: () => unknown }> }) => {
  const { replace } = useSmartRouter()
  const {
    tasks,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useTasksWithFilter({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination,
    enabled: !!whereFilter,
  })

  const { convertToReadOnly } = usePlateEditor()
  const { errorNotification } = useNotification()
  const { data: session } = useSession()

  const { enumOptions: taskKindOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })

  const userIds = useMemo(() => {
    if (!tasks) return []
    const ids = new Set<string>()
    tasks.forEach((task) => {
      if (task.createdBy) ids.add(task.createdBy)
      if (task.updatedBy) ids.add(task.updatedBy)
    })
    return Array.from(ids)
  }, [tasks])

  const hasTasks = useMemo(() => {
    return tasks && tasks.length > 0
  }, [tasks])

  useEffect(() => {
    if (onHasTasksChange) {
      onHasTasksChange(hasTasks)
    }
  }, [hasTasks, onHasTasksChange])

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles, session),
      }))
    }
  }, [permission?.roles, setColumnVisibility, canEdit, session])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load tasks',
      })
    }
  }, [isError, errorNotification])

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(userIds)

  useImperativeHandle(ref, () => ({
    exportData: () => tasks,
  }))

  const columns = useMemo(
    () => getTaskColumns({ userMap, tokenMap, convertToReadOnly, selectedTasks, setSelectedTasks, taskKindOptions }),
    [userMap, tokenMap, convertToReadOnly, selectedTasks, setSelectedTasks, taskKindOptions],
  )

  return (
    <DataTable
      columns={columns}
      sortFields={TASK_SORT_FIELDS}
      onSortChange={onSortChange}
      data={tasks}
      loading={fetching || fetchingUsers}
      sorting={defaultSorting}
      onRowClick={(task) => {
        replace({ id: task.id })
      }}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{
        totalCount: data?.tasks.totalCount,
        pageInfo: data?.tasks?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={TableKeyEnum.TASK}
    />
  )
}

export default TasksTable
