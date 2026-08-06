import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { format, startOfDay } from 'date-fns'
import { type TFilterState } from '@/components/shared/table-filter/filter-storage'
import { DateFormatStorage, type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'

export const TASK_DEFAULT_STATUSES: TaskTaskStatus[] = [TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW]

export const taskDefaultFilterValues: TFilterState = {
  statusIn: TASK_DEFAULT_STATUSES,
}

export const overdueTaskDueCutoff = () => format(startOfDay(new Date()), DateFormatStorage)

export const overdueTaskQuickFilter = (isActive: boolean): TQuickFilter => ({
  label: 'Overdue',
  key: 'overdue',
  type: 'custom',
  getCondition: () => ({ dueLT: overdueTaskDueCutoff() }),
  isActive,
})
