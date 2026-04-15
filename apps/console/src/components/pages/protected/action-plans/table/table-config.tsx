import { type FilterField } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import { type ActionPlanQuery, ActionPlanOrderField, ActionPlanDocumentStatus, ActionPlanPriority } from '@repo/codegen/src/schema'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type ActionPlanFieldProps } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import NameField from '../create/form/fields/name-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'

export const formId = 'edit' + ObjectNames.ACTION_PLAN

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Exposure', href: '/exposure/overview' },
]

const statusOptions = enumToOptions(ActionPlanDocumentStatus)
const priorityOptions = enumToOptions(ActionPlanPriority)

export const getFilterFields = (): FilterField[] => [
  {
    key: 'nameContainsFold',
    label: 'Name',
    type: 'text',
    icon: FilterIcons.Source,
  },
  {
    key: 'titleContainsFold',
    label: 'Title',
    type: 'text',
    icon: FilterIcons.Source,
  },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: statusOptions,
  },
  {
    key: 'priorityIn',
    label: 'Priority',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: priorityOptions,
  },
  {
    key: 'sourceContainsFold',
    label: 'Source',
    type: 'text',
    icon: FilterIcons.Source,
  },
]

export const ACTION_PLANS_SORT_FIELDS = enumToSortFields(ActionPlanOrderField)

export const visibilityFields = {
  id: false,
  name: true,
  title: false,
  summary: false,
  status: true,
  priority: true,
  source: false,
  dueDate: true,
  reviewDue: false,
  completedAt: false,
  createdAt: false,
  createdBy: false,
  updatedAt: false,
  updatedBy: false,
}

export const getFieldsToRender = (props: ActionPlanFieldProps) => {
  return (
    <div className="mr-6">
      <div className="mb-6">
        <NameField
          isEditing={props.isEditing}
          isEditAllowed={props.isEditAllowed}
          initialValue={props.isCreate ? '' : ((props.data as ActionPlanQuery['actionPlan'])?.name ?? '')}
          internalEditing={props.internalEditing}
          setInternalEditing={props.setInternalEditing}
          handleUpdateField={props.handleUpdateField}
        />
      </div>
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        isCreate={props.isCreate}
        data={props.data}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
      />
    </div>
  )
}
