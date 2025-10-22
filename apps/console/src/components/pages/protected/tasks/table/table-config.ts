import { FilterField } from '@/types'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { OrderDirection, TaskTaskStatus } from '@repo/codegen/src/schema'
import { TOrgMembers } from '../hooks/useTaskStore'
import { FilterIcons } from '@/components/shared/enum-mapper/task-enum'

export const getTasksFilterFields = (orgMembers: TOrgMembers[], programOptions: { value: string; label: string }[]): FilterField[] => [
  { key: 'displayID', label: 'DisplayID', type: 'text', icon: FilterIcons.DisplayID },
  { key: 'title', label: 'Title', type: 'text', icon: FilterIcons.Title },
  {
    key: 'category',
    label: 'Type',
    type: 'select',
    icon: FilterIcons.Type,
    options: [
      { label: 'Evidence', value: TaskTypes.EVIDENCE },
      { label: 'Policy review', value: TaskTypes.POLICY_REVIEW },
      { label: 'Risk review', value: TaskTypes.RISK_REVIEW },
      { label: 'Other', value: TaskTypes.OTHER },
    ],
  },
  { key: 'due', label: 'Due Date', type: 'dateRange', icon: FilterIcons.DueDate },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    multiple: true,
    icon: FilterIcons.Status,
    options: [
      { label: 'Open', value: TaskTaskStatus.OPEN },
      { label: 'In progress', value: TaskTaskStatus.IN_PROGRESS },
      { label: 'In review', value: TaskTaskStatus.IN_REVIEW },
      { label: 'Completed', value: TaskTaskStatus.COMPLETED },
      { label: "Won't do", value: TaskTaskStatus.WONT_DO },
    ],
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
    forceKeyOperator: true,
    childrenObjectKey: 'id',
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
