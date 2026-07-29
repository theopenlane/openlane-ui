import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { type TFilterState } from '@/components/shared/table-filter/filter-storage'
import { toDayStartIso, type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'
import { TASK_TERMINAL_STATUSES } from '@/lib/suggested-tasks/types'

export const TASK_DEFAULT_STATUSES: TaskTaskStatus[] = [TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW]

export const taskDefaultFilterValues: TFilterState = {
  statusIn: TASK_DEFAULT_STATUSES,
}

export const overdueTaskDueCutoff = () => toDayStartIso(new Date())

export const overdueTaskQuickFilter = (isActive: boolean): TQuickFilter => ({
  label: 'Overdue',
  key: 'overdue',
  type: 'custom',
  getCondition: () => ({ dueLT: overdueTaskDueCutoff(), statusNotIn: TASK_TERMINAL_STATUSES }),
  isActive,
})
