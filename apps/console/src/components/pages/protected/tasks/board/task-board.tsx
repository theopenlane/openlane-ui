'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { type TaskOrder, type TaskTaskStatus, type TaskWhereInput } from '@repo/codegen/src/schema'
import { resolveAllowedStatuses } from '@/components/shared/table-filter/allowed-statuses'
import { TaskStatusOrder } from '@/components/shared/enum-mapper/task-enum'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import TaskBoardColumn from '@/components/pages/protected/tasks/board/task-board-column'

type TTaskBoardProps = {
  whereFilter: TaskWhereInput | null
  orderByFilter: TaskOrder[] | TaskOrder | undefined
  onHasTasksChange?: (hasTasks: boolean) => void
}

const TaskBoard = ({ whereFilter, orderByFilter, onHasTasksChange }: TTaskBoardProps) => {
  const statuses = useMemo(() => resolveAllowedStatuses(whereFilter, TaskStatusOrder), [whereFilter])
  const [statusesWithTasks, setStatusesWithTasks] = useState<Partial<Record<TaskTaskStatus, boolean>>>({})

  const handleColumnHasTasksChange = useCallback((status: TaskTaskStatus, hasTasks: boolean) => {
    setStatusesWithTasks((prev) => (prev[status] === hasTasks ? prev : { ...prev, [status]: hasTasks }))
  }, [])

  const hasTasks = useMemo(() => statuses.some((status) => statusesWithTasks[status]), [statuses, statusesWithTasks])

  useEffect(() => {
    onHasTasksChange?.(hasTasks)
  }, [hasTasks, onHasTasksChange])

  if (!whereFilter) {
    return <SkeletonRows count={1} height={320} />
  }

  if (statuses.length === 0) {
    return <p className="text-sm text-muted-foreground">No statuses match the current filters.</p>
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-start">
      {statuses.map((status) => (
        <TaskBoardColumn key={status} status={status} whereFilter={whereFilter} orderByFilter={orderByFilter} onHasTasksChange={handleColumnHasTasksChange} />
      ))}
    </div>
  )
}

export default TaskBoard
