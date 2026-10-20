import { defineFilterFields } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import { type ActionPlanQuery, ActionPlanOrderField, ActionPlanDocumentStatus, ActionPlanPriority, type ActionPlanWhereInput } from '@repo/codegen/src/schema'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type ActionPlanFieldProps } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import NameField from '../create/form/fields/name-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import { identityFilterKey } from '@/components/shared/table-filter/where-generator'
import { responsibilityFilterFor, type TResponsibilityFilterOption } from '@/components/shared/table-filter/responsibility-filter'

export const formId = 'edit' + ObjectNames.ACTION_PLAN

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Exposure', href: '/exposure/overview' },
]

const statusOptions = enumToOptions(ActionPlanDocumentStatus)
const priorityOptions = enumToOptions(ActionPlanPriority)

export const ACTION_PLAN_INTERNAL_OWNER_FILTER = responsibilityFilterFor<ActionPlanWhereInput>()('internalOwner')

export const mapActionPlanFilterKey = (key: string, value: unknown): ActionPlanWhereInput =>
  ACTION_PLAN_INTERNAL_OWNER_FILTER.toWhere(key, value) ?? identityFilterKey<ActionPlanWhereInput>(key, value)

export const getFilterFields = (internalOwnerOptions: TResponsibilityFilterOption[]) =>
  defineFilterFields<ActionPlanWhereInput, typeof ACTION_PLAN_INTERNAL_OWNER_FILTER.key>()([
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
    ACTION_PLAN_INTERNAL_OWNER_FILTER.field('Internal Owner', internalOwnerOptions),
    {
      key: 'sourceContainsFold',
      label: 'Source',
      type: 'text',
      icon: FilterIcons.Source,
    },
  ])

export const ACTION_PLANS_SORT_FIELDS = enumToSortFields(ActionPlanOrderField)

export const visibilityFields = {
  id: false,
  title: false,
  summary: false,
  source: false,
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
