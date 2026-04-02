import { type FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { WorkflowDefinitionOrderField, WorkflowDefinitionWorkflowKind } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { enumToSortFields } from '@/components/shared/crud-base/utils'

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Automation', href: '/automation/workflows' },
  { label: 'Workflows', href: '/automation/workflows' },
]

export const getFilterFields = (): FilterField[] => [
  {
    key: 'active',
    label: 'Active',
    type: 'radio',
    icon: FilterIcons.Status,
    radioOptions: [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' },
    ],
  },
  {
    key: 'draft',
    label: 'Draft',
    type: 'radio',
    icon: FilterIcons.Status,
    radioOptions: [
      { value: true, label: 'Draft' },
      { value: false, label: 'Published' },
    ],
  },
  {
    key: 'isDefault',
    label: 'Default',
    type: 'radio',
    icon: FilterIcons.Status,
    radioOptions: [
      { value: true, label: 'Default' },
      { value: false, label: 'Not Default' },
    ],
  },
  {
    key: 'workflowKindIn',
    label: 'Kind',
    type: 'multiselect',
    icon: FilterIcons.Type,
    options: enumToOptions(WorkflowDefinitionWorkflowKind),
  },
]

export const WORKFLOW_SORT_FIELDS = enumToSortFields(WorkflowDefinitionOrderField)

export const visibilityFields = {
  select: false,
  displayID: false,
  revision: false,
  systemOwned: false,
  createdAt: false,
}
