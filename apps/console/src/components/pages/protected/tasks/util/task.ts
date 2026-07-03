import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { type TFilterState } from '@/components/shared/table-filter/filter-storage'

export const TASK_DEFAULT_STATUSES: TaskTaskStatus[] = [TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW]

export const taskDefaultFilterValues: TFilterState = {
  statusIn: TASK_DEFAULT_STATUSES,
}
