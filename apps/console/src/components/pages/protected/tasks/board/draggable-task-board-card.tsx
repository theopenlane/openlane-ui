'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@theopenlane/ui/lib/utils'
import { type TasksWithFilterNode } from '@/lib/graphql-hooks/task'
import TaskBoardCard from '@/components/pages/protected/tasks/board/task-board-card'
import { TASK_DRAG_TYPE, type TaskDragData } from '@/components/pages/protected/tasks/board/task-drag-data'

type TDraggableTaskBoardCardProps = {
  task: TasksWithFilterNode
  disabled: boolean
}

const DraggableTaskBoardCard = ({ task, disabled }: TDraggableTaskBoardCardProps) => {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: task.id, data: { type: TASK_DRAG_TYPE, task } satisfies TaskDragData, disabled })

  return <TaskBoardCard ref={setNodeRef} task={task} {...listeners} className={cn('touch-manipulation', isDragging && 'opacity-40')} />
}

export default DraggableTaskBoardCard
