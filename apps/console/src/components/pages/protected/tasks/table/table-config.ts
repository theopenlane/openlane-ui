import { FilterField } from '@/types'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { OrderDirection, TaskTaskStatus } from '@repo/codegen/src/schema'
import { TOrgMembers } from '../hooks/useTaskStore'
import { FilterIcons } from '@/components/shared/enum-mapper/task-enum'

function prettifyEnum(key: string) {
  return key
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

function enumToOptions<T extends Record<string, string>>(e: T, labels?: Partial<Record<T[keyof T], string>>) {
  return Object.entries(e).map(([key, value]) => ({
    value,
    label: labels?.[value as T[keyof T]] ?? prettifyEnum(key),
  }))
}

export const getTasksFilterFields = (orgMembers: TOrgMembers[], programOptions: { value: string; label: string }[]): FilterField[] => [
  { key: 'displayID', label: 'DisplayID', type: 'text', icon: FilterIcons.DisplayID },
  { key: 'title', label: 'Title', type: 'text', icon: FilterIcons.Title },
  {
    key: 'category',
    label: 'Type',
    type: 'select',
    icon: FilterIcons.Type,
    options: enumToOptions(TaskTypes),
  },
  { key: 'due', label: 'Due Date', type: 'dateRange', icon: FilterIcons.DueDate },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: enumToOptions(TaskTaskStatus),
  },
  {
    key: 'assignerID',
    label: 'Assigner',
    type: 'select',
    options: orgMembers,
    icon: FilterIcons.Assigner,
  },
  {
    key: 'assigneeID',
    label: 'Assignee',
    type: 'select',
    options: orgMembers,
    icon: FilterIcons.Assignee,
  },
  {
    key: 'hasProgramsWith',
    label: 'Program Name',
    type: 'select',
    options: programOptions,
    icon: FilterIcons.ProgramName,
  },
]

export const TASK_SORT_FIELDS = [
  { key: 'title', label: 'Title' },
  {
    key: 'due',
    label: 'Due Date',
    default: {
      key: 'due',
      direction: OrderDirection.ASC,
    },
  },
  { key: 'STATUS', label: 'Status' },
  { key: 'category', label: 'Type' },
]
