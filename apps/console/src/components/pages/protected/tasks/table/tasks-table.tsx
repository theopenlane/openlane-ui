'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react'
import { OrderDirection, TaskOrder, TaskWhereInput } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { getTaskColumns } from '@/components/pages/protected/tasks/table/columns.tsx'
import { TASK_SORT_FIELDS } from '@/components/pages/protected/tasks/table/table-config.ts'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks.ts'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { VisibilityState } from '@tanstack/react-table'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { TAccessRole, TData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'

type TTasksTableProps = {
  onSortChange?: (sortCondition: TaskOrder[] | TaskOrder | undefined) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: TaskWhereInput | null
  orderByFilter: TaskOrder[] | TaskOrder | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  onHasTasksChange?: (hasTasks: boolean) => void
  selectedTasks: { id: string }[]
  setSelectedTasks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TData | undefined
  defaultSorting: { field: string; direction?: OrderDirection }[] | undefined
}

const TasksTable = forwardRef(
  (
    {
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
    }: TTasksTableProps,
    ref,
  ) => {
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
          select: canEdit(permission.roles),
        }))
      }
    }, [permission?.roles, setColumnVisibility, canEdit])

    useEffect(() => {
      if (isError) {
        errorNotification({
          title: 'Error',
          description: 'Failed to load tasks',
        })
      }
    }, [isError, errorNotification])

    const { users, isFetching: fetchingUsers } = useGetOrgUserList({
      where: { hasUserWith: [{ idIn: userIds }] },
    })

    const userMap = useMemo(() => {
      const map: Record<string, (typeof users)[0]> = {}
      users?.forEach((u) => {
        map[u.id] = u
      })
      return map
    }, [users])

    useImperativeHandle(ref, () => ({
      exportData: () => tasks,
    }))

    const columns = useMemo(
      () => getTaskColumns({ userMap, convertToReadOnly, selectedTasks, setSelectedTasks, taskKindOptions }),
      [userMap, convertToReadOnly, selectedTasks, setSelectedTasks, taskKindOptions],
    )

    return (
      <DataTable
        columns={columns}
        sortFields={TASK_SORT_FIELDS}
        onSortChange={onSortChange}
        data={tasks}
        loading={fetching || fetchingUsers}
        defaultSorting={defaultSorting}
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
  },
)

TasksTable.displayName = 'TasksTable'
export default TasksTable
