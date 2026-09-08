'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { DndContext, MouseSensor, TouchSensor, pointerWithin, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { type TaskTaskStatus, type TaskWhereInput } from '@repo/codegen/src/schema'
import { resolveAllowedStatuses } from '@/components/shared/table-filter/allowed-statuses'
import { TaskStatusOrder } from '@/components/shared/enum-mapper/task-enum'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import TaskBoardColumn from '@/components/pages/protected/tasks/board/task-board-column'
import TaskDragOverlay from '@/components/pages/protected/tasks/board/task-drag-overlay'
import { canMoveTaskTo, readDraggedTask, readDropStatus } from '@/components/pages/protected/tasks/board/task-drag-data'
import { type TaskBoardOrderBy } from '@/components/pages/protected/tasks/board/task-board-column-query'
import { useMoveTaskStatus } from '@/components/pages/protected/tasks/board/use-move-task-status'

const MOUSE_DRAG_ACTIVATION = { distance: 5 }

const TOUCH_DRAG_ACTIVATION = { delay: 250, tolerance: 5 }

type TTaskBoardProps = {
  whereFilter: TaskWhereInput | null
  orderByFilter: TaskBoardOrderBy
  onHasTasksChange?: (hasTasks: boolean) => void
}

const TaskBoard = ({ whereFilter, orderByFilter, onHasTasksChange }: TTaskBoardProps) => {
  const statuses = useMemo(() => resolveAllowedStatuses(whereFilter, TaskStatusOrder), [whereFilter])
  const [statusesWithTasks, setStatusesWithTasks] = useState<Partial<Record<TaskTaskStatus, boolean>>>({})
  const moveTaskStatus = useMoveTaskStatus({ whereFilter, orderByFilter })
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: MOUSE_DRAG_ACTIVATION }), useSensor(TouchSensor, { activationConstraint: TOUCH_DRAG_ACTIVATION }))

  const handleColumnHasTasksChange = useCallback((status: TaskTaskStatus, hasTasks: boolean) => {
    setStatusesWithTasks((prev) => (prev[status] === hasTasks ? prev : { ...prev, [status]: hasTasks }))
  }, [])

  const hasTasks = useMemo(() => statuses.some((status) => statusesWithTasks[status]), [statuses, statusesWithTasks])

  useEffect(() => {
    onHasTasksChange?.(hasTasks)
  }, [hasTasks, onHasTasksChange])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const task = readDraggedTask(event.active)
      const to = readDropStatus(event.over)
      if (!task || !to || !canMoveTaskTo(task, to)) return
      void moveTaskStatus(task, to)
    },
    [moveTaskStatus],
  )

  if (!whereFilter) {
    return <SkeletonRows count={1} height={320} />
  }

  if (statuses.length === 0) {
    return <p className="text-sm text-muted-foreground">No statuses match the current filters.</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {statuses.map((status) => (
          <TaskBoardColumn key={status} status={status} whereFilter={whereFilter} orderByFilter={orderByFilter} onHasTasksChange={handleColumnHasTasksChange} />
        ))}
      </div>
      <TaskDragOverlay />
    </DndContext>
  )
}

export default TaskBoard
