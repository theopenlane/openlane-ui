'use client'

import React from 'react'
import { DragOverlay, useDndContext } from '@dnd-kit/core'
import TaskBoardCard from '@/components/pages/protected/tasks/board/task-board-card'
import { readDraggedTask } from '@/components/pages/protected/tasks/board/task-drag-data'

const TaskDragOverlay = () => {
  const { active } = useDndContext()
  const task = readDraggedTask(active)

  return <DragOverlay dropAnimation={null}>{task && <TaskBoardCard task={task} className="cursor-grabbing shadow-lg ring-2 ring-primary" />}</DragOverlay>
}

export default TaskDragOverlay
