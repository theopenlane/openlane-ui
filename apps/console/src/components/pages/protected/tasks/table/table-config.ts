import { FilterField } from '@/types'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { OrderDirection, TaskTaskStatus } from '@repo/codegen/src/schema'
import { Calendar, FileQuestion, Key, ScrollText, Tags } from 'lucide-react'

export const TASK_FILTER_FIELDS: FilterField[] = [
  { key: 'displayID', label: 'Task', type: 'text', icon: Key },
  { key: 'title', label: 'Title', type: 'text', icon: ScrollText },
  {
    key: 'category',
    label: 'Type',
    type: 'select',
    icon: FileQuestion,
    options: [
      { label: 'Evidence', value: TaskTypes.EVIDENCE },
      { label: 'Policy review', value: TaskTypes.POLICY_REVIEW },
      { label: 'Risk review', value: TaskTypes.RISK_REVIEW },
      { label: 'Other', value: TaskTypes.OTHER },
    ],
  },
  { key: 'due', label: 'Due Date', type: 'date', icon: Calendar },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    icon: Tags,
    options: [
      { label: 'Open', value: TaskTaskStatus.OPEN },
      { label: 'In progress', value: TaskTaskStatus.IN_PROGRESS },
      { label: 'In review', value: TaskTaskStatus.IN_REVIEW },
      { label: 'Completed', value: TaskTaskStatus.COMPLETED },
      { label: "Won't do", value: TaskTaskStatus.WONT_DO },
    ],
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
