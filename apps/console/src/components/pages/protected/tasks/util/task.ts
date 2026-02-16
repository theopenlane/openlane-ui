import { TaskTaskStatus } from '@repo/codegen/src/schema'

export const TaskStatusWithoutCompletedAndOpen = Object.fromEntries(Object.entries(TaskTaskStatus).filter(([key]) => key !== 'COMPLETED' && key !== 'OPEN')) as Omit<
  typeof TaskTaskStatus,
  'COMPLETED' | 'OPEN'
>
