import { Circle, CircleCheck, CircleOff, CirclePlus, ScanEye, Timer } from 'lucide-react'
import { TaskTaskStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'

export const TaskStatusIconMapper: Record<TaskTaskStatus, React.ReactNode> = {
  [TaskTaskStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-task-complete" />,
  [TaskTaskStatus.IN_PROGRESS]: <Timer height={16} width={16} className="text-task-in-progress" />,
  [TaskTaskStatus.IN_REVIEW]: <ScanEye height={16} width={16} className="text-task-in-review" />,
  [TaskTaskStatus.OPEN]: <Circle height={16} width={16} className="text-task-open" />,
  [TaskTaskStatus.WONT_DO]: <CircleOff height={16} width={16} className="text-task-wont-do" />,
}

// Status options for select dropdowns
export const TaskStatusOptions = Object.values(TaskTaskStatus).map((status) => ({
  label: status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value: status,
}))

export const TaskTypesOptions = Object.values(TaskTypes).map((value) => ({
  label: value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value,
}))

export const TaskIconBtn = (
  <div className="flex items-center space-x-2 hover:bg-muted">
    <CirclePlus size={16} strokeWidth={2} />
    <span>Task</span>
  </div>
)
