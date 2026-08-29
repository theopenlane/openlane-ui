import { defineFilterFields } from '@/types'
import { toUtcDayStart, type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper'
import { addDays, endOfWeek, startOfWeek } from 'date-fns'
import { TaskTaskStatus, type TaskWhereInput } from '@repo/codegen/src/schema'
import { type TOrgMembers } from '../hooks/useTaskStore'
import { TaskFilterIcons } from '@/components/shared/enum-mapper/task-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { getProgramFilterFields } from '@/components/shared/table-filter/program-filter-field'

export const getTasksFilterFields = (orgMembers: TOrgMembers[], programOptions: { value: string; label: string }[], taskKindOptions: { value: string; label: string }[], hasProgramAccess: boolean) =>
  defineFilterFields<TaskWhereInput>()([
    { key: 'displayID', label: 'DisplayID', type: 'text', icon: TaskFilterIcons.DisplayID },
    { key: 'title', label: 'Title', type: 'text', icon: TaskFilterIcons.Title },

    {
      key: 'taskKindNameIn',
      label: 'Type',
      type: 'multiselect',
      icon: TaskFilterIcons.Type,
      options: taskKindOptions,
    },

    { key: 'due', label: 'Due Date', type: 'dateRange', icon: TaskFilterIcons.DueDate },

    {
      key: 'statusIn',
      label: 'Status',
      type: 'multiselect',
      icon: TaskFilterIcons.Status,
      options: enumToOptions(TaskTaskStatus),
    },

    {
      key: 'assignerIDIn',
      label: 'Assigner',
      type: 'multiselect',
      options: orgMembers,
      icon: TaskFilterIcons.Assigner,
    },

    {
      key: 'assigneeIDIn',
      label: 'Assignee',
      type: 'multiselect',
      options: orgMembers,
      icon: TaskFilterIcons.Assignee,
    },

    ...getProgramFilterFields(programOptions, hasProgramAccess),
  ])

export const TASK_SORT_FIELDS = [
  { key: 'title', label: 'Title' },
  {
    key: 'due',
    label: 'Due Date',
  },
  { key: 'STATUS', label: 'Status' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]

export const getTaskQuickFilters = (userId: string | undefined, showMyTasks: boolean): TQuickFilter[] => [
  {
    label: 'Completed',
    key: 'completed',
    type: 'custom',
    getCondition: () => ({ statusIn: [TaskTaskStatus.COMPLETED] }),
    isActive: false,
  },
  {
    label: 'Open',
    key: 'open',
    type: 'custom',
    getCondition: () => ({ statusIn: [TaskTaskStatus.OPEN] }),
    isActive: false,
  },
  {
    label: 'My Tasks',
    key: 'myTasks',
    type: 'custom',
    getCondition: () => ({ assigneeID: userId }),
    isActive: showMyTasks,
  },
  {
    label: 'Overdue',
    key: 'overdue',
    type: 'custom',
    getCondition: () => ({ dueLT: toUtcDayStart(new Date()) }),
    isActive: false,
  },
  {
    label: 'Due This Week',
    key: 'dueThisWeek',
    type: 'custom',
    getCondition: () => {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 })
      const end = endOfWeek(new Date(), { weekStartsOn: 1 })
      return {
        dueGTE: toUtcDayStart(start),
        dueLT: toUtcDayStart(addDays(end, 1)),
      }
    },
    isActive: false,
  },
  {
    label: 'Unassigned',
    key: 'unassigned',
    type: 'custom',
    getCondition: () => ({ assigneeIDIsNil: true }),
    isActive: false,
  },
  {
    label: 'Suggested',
    key: 'suggested',
    type: 'custom',
    getCondition: () => ({ isSuggested: true }),
    isActive: false,
  },
  {
    label: 'Templates',
    key: 'templates',
    type: 'custom',
    getCondition: () => ({ isTemplate: true }),
    isActive: false,
  },
]
