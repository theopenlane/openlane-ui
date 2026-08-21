import { CalendarClock, Circle, CircleCheck, CircleDot, CircleOff, FolderPen, Key, ScanEye, Shapes, ShieldCheck, Timer, UserRoundCheck, UserRoundPen, type LucideIcon } from 'lucide-react'
import { TaskTaskStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'

export const TaskStatusIconMapper: Record<TaskTaskStatus, React.ReactNode> = {
  [TaskTaskStatus.COMPLETED]: <CircleCheck height={16} width={16} className="text-completed" />,
  [TaskTaskStatus.IN_PROGRESS]: <Timer height={16} width={16} className="text-in-progress" />,
  [TaskTaskStatus.IN_REVIEW]: <ScanEye height={16} width={16} className="text-in-review" />,
  [TaskTaskStatus.OPEN]: <Circle height={16} width={16} className="text-open" />,
  [TaskTaskStatus.WONT_DO]: <CircleOff height={16} width={16} className="text-wont-do" />,
}

export const TaskStatusDotMapper: Record<TaskTaskStatus, string> = {
  [TaskTaskStatus.COMPLETED]: 'bg-completed',
  [TaskTaskStatus.IN_PROGRESS]: 'bg-in-progress',
  [TaskTaskStatus.IN_REVIEW]: 'bg-in-review',
  [TaskTaskStatus.OPEN]: 'bg-open',
  [TaskTaskStatus.WONT_DO]: 'bg-wont-do',
}

const TaskStatusRank: Record<TaskTaskStatus, number> = {
  [TaskTaskStatus.OPEN]: 0,
  [TaskTaskStatus.IN_PROGRESS]: 1,
  [TaskTaskStatus.IN_REVIEW]: 2,
  [TaskTaskStatus.COMPLETED]: 3,
  [TaskTaskStatus.WONT_DO]: 4,
}

export const TaskStatusOrder: readonly TaskTaskStatus[] = Object.values(TaskTaskStatus).sort((a, b) => TaskStatusRank[a] - TaskStatusRank[b])

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

export const TaskFilterIcons: Record<TasksFilterIconName, LucideIcon> = {
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
