import {
  CalendarClock,
  Circle,
  CircleCheck,
  CircleCheckBig,
  CircleDot,
  CircleOff,
  CirclePlus,
  FolderPen,
  Key,
  ScanEye,
  Shapes,
  ShieldCheck,
  Timer,
  UserRoundCheck,
  UserRoundPen,
  type LucideIcon,
} from 'lucide-react'
import { TaskTaskStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { Button } from '@repo/ui/button'

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

export enum TasksFilterIconName {
  DisplayID = 'DisplayID',
  Title = 'Title',
  Type = 'Type',
  Status = 'Status',
  Assigner = 'Assigner',
  Assignee = 'Assignee',
  ProgramName = 'ProgramName',
  DueDate = 'DueDate',
}

export const FilterIcons: Record<TasksFilterIconName, LucideIcon> = {
  [TasksFilterIconName.DisplayID]: Key,
  [TasksFilterIconName.Title]: FolderPen,
  [TasksFilterIconName.Status]: CircleDot,
  [TasksFilterIconName.Assigner]: UserRoundCheck,
  [TasksFilterIconName.Assignee]: UserRoundPen,
  [TasksFilterIconName.ProgramName]: ShieldCheck,
  [TasksFilterIconName.Type]: Shapes,
  [TasksFilterIconName.DueDate]: CalendarClock,
}

// Status options for select dropdowns
export const TaskStatusOptions = Object.values(TaskTaskStatus).map((status) => ({
  label: status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' '),
  value: status,
}))

export const TaskIconBtn = (
  <div className="flex items-center space-x-2">
    <CirclePlus size={16} strokeWidth={2} />
    <span>Task</span>
  </div>
)
export const TaskIconPrefixBtn = (
  <Button size="sm" variant="transparent" className="flex items-center space-x-2 justify-start">
    <CircleCheckBig size={16} strokeWidth={2} />
    <span>Create Task</span>
  </Button>
)
