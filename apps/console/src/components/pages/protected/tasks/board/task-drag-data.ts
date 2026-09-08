import { type Active, type Over } from '@dnd-kit/core'
import { type TaskTaskStatus } from '@repo/codegen/src/schema'
import { type TasksWithFilterNode } from '@/lib/graphql-hooks/task'

export const TASK_DRAG_TYPE = 'task-card'

export const TASK_COLUMN_DROP_TYPE = 'task-column'

export type TaskDragData = { type: typeof TASK_DRAG_TYPE; task: TasksWithFilterNode }

export type TaskColumnDropData = { type: typeof TASK_COLUMN_DROP_TYPE; status: TaskTaskStatus }

type DndData = TaskDragData | TaskColumnDropData | Record<string, unknown> | null | undefined

const isTaskDragData = (data: DndData): data is TaskDragData => !!data && data.type === TASK_DRAG_TYPE && 'task' in data

const isTaskColumnDropData = (data: DndData): data is TaskColumnDropData => !!data && data.type === TASK_COLUMN_DROP_TYPE && 'status' in data

export const readDraggedTask = (active: Active | null): TasksWithFilterNode | null => {
  const data = active?.data.current
  return isTaskDragData(data) ? data.task : null
}

export const readDropStatus = (over: Over | null): TaskTaskStatus | null => {
  const data = over?.data.current
  return isTaskColumnDropData(data) ? data.status : null
}

export const canMoveTaskTo = (task: TasksWithFilterNode, status: TaskTaskStatus): boolean => task.status !== status
