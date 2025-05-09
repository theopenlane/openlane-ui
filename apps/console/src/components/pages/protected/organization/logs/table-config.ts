import { FilterField, SelectFilterField } from '@/types'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { TaskTaskStatus } from '@repo/codegen/src/schema'

export const LOGS_FILTER_FIELDS: FilterField[] = [
  { key: 'displayID', label: 'Task', type: 'text' },
  { key: 'title', label: 'Title', type: 'text' },
  {
    key: 'category',
    label: 'Type',
    type: 'select',
    options: [
      { label: 'Evidence', value: TaskTypes.EVIDENCE },
      { label: 'Policy review', value: TaskTypes.POLICY_REVIEW },
      { label: 'Risk review', value: TaskTypes.RISK_REVIEW },
      { label: 'Other', value: TaskTypes.OTHER },
    ],
  } as SelectFilterField,
  { key: 'due', label: 'Due Date', type: 'date' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Open', value: TaskTaskStatus.OPEN },
      { label: 'In progress', value: TaskTaskStatus.IN_PROGRESS },
      { label: 'In review', value: TaskTaskStatus.IN_REVIEW },
      { label: 'Completed', value: TaskTaskStatus.COMPLETED },
      { label: "Won't do", value: TaskTaskStatus.WONT_DO },
    ],
  } as SelectFilterField,
]
