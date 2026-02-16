import { FilterField } from '@/types'
import { TaskStatusWithoutCompletedAndOpen } from '@/components/pages/protected/tasks/util/task'
import { TOrgMembers } from '../hooks/useTaskStore'
import { TaskFilterIcons } from '@/components/shared/enum-mapper/task-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

export const getTasksFilterFields = (orgMembers: TOrgMembers[], programOptions: { value: string; label: string }[], taskKindOptions: { value: string; label: string }[]): FilterField[] => [
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
    options: enumToOptions(TaskStatusWithoutCompletedAndOpen),
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

  {
    key: 'hasProgramsWith',
    label: 'Program Name',
    type: 'multiselect',
    options: programOptions,
    icon: TaskFilterIcons.ProgramName,
  },
]

export const TASK_SORT_FIELDS = [
  { key: 'title', label: 'Title' },
  {
    key: 'due',
    label: 'Due Date',
  },
  { key: 'STATUS', label: 'Status' },
]
