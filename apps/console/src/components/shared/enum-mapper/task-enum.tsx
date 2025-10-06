import { Circle, CircleCheck, CircleCheckBig, CircleOff, CirclePlus, ScanEye, Timer } from 'lucide-react'
import { TaskTaskStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'

export const TaskStatusIconMapper: Record<TaskTaskStatus, React.ReactNode> = {
  [TaskTaskStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-completed" />,
  [TaskTaskStatus.IN_PROGRESS]: <Timer height={16} width={16} className="text-in-progress" />,
  [TaskTaskStatus.IN_REVIEW]: <ScanEye height={16} width={16} className="text-in-review" />,
  [TaskTaskStatus.OPEN]: <Circle height={16} width={16} className="text-open" />,
  [TaskTaskStatus.WONT_DO]: <CircleOff height={16} width={16} className="text-wont-do" />,
}

export const TaskStatusMapper: Record<TaskTaskStatus, string> = {
  [TaskTaskStatus.COMPLETED]: 'Completed',
  [TaskTaskStatus.IN_PROGRESS]: 'In progress',
  [TaskTaskStatus.IN_REVIEW]: 'In review',
  [TaskTaskStatus.OPEN]: 'Open',
  [TaskTaskStatus.WONT_DO]: "Won't do",
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
  <div className="flex items-center space-x-2">
    <CirclePlus size={16} strokeWidth={2} />
    <span>Task</span>
  </div>
)
export const TaskIconPrefixBtn = (
  <div className="flex items-center space-x-2">
    <CircleCheckBig size={16} strokeWidth={2} />
    <span>Create Task</span>
  </div>
)
