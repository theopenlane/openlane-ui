import { type FilterField } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import TitleField from '../create/form/fields/title-field'
import { type RemediationQuery, RemediationOrderField } from '@repo/codegen/src/schema'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type RemediationFieldProps, type EnumOptions, type EnumCreateHandlers } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'

export const formId = 'edit' + ObjectNames.REMEDIATION

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Exposure', href: '/exposure/overview' },
  { label: 'Remediations', href: '/exposure/remediations' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'titleContainsFold',
    label: 'Title',
    type: 'text',
    icon: FilterIcons.Source,
  },
  {
    key: 'stateContainsFold',
    label: 'State',
    type: 'text',
    icon: FilterIcons.Status,
  },
  {
    key: 'sourceContainsFold',
    label: 'Source',
    type: 'text',
    icon: FilterIcons.Source,
  },
  {
    key: 'externalIDContainsFold',
    label: 'External ID',
    type: 'text',
    icon: FilterIcons.ID,
  },
  {
    key: 'environmentNameIn',
    label: 'Environment',
    type: 'multiselect',
    icon: FilterIcons.Environment,
    options: enumOptions.environmentOptions,
  },
  {
    key: 'scopeNameIn',
    label: 'Scope',
    type: 'multiselect',
    icon: FilterIcons.Scope,
    options: enumOptions.scopeOptions,
  },
]

export const REMEDIATIONS_SORT_FIELDS = enumToSortFields(RemediationOrderField)

export const visibilityFields = {
  id: false,
  displayID: false,
  title: true,
  summary: false,
  state: true,
  source: true,
  externalID: false,
  externalOwnerID: false,
  externalURI: false,
  ownerReference: false,
  ticketReference: false,
  pullRequestURI: false,
  repositoryURI: false,
  environmentName: false,
  scopeName: false,
  dueAt: true,
  completedAt: false,
  prGeneratedAt: false,
  createdAt: false,
  createdBy: false,
  updatedAt: true,
  updatedBy: false,
}

export const getFieldsToRender = (props: RemediationFieldProps, enumOptions: EnumOptions, enumCreateHandlers?: EnumCreateHandlers) => {
  return (
    <div className="mr-6">
      <div className="mb-6">
        <TitleField
          isEditing={props.isEditing}
          isEditAllowed={props.isEditAllowed}
          initialValue={props.isCreate ? '' : ((props.data as RemediationQuery['remediation'])?.title ?? '')}
          internalEditing={props.internalEditing}
          setInternalEditing={props.setInternalEditing}
          handleUpdateField={props.handleUpdateField}
        />
      </div>
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        data={props.data}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
        enumOptions={enumOptions}
        enumCreateHandlers={enumCreateHandlers}
      />
    </div>
  )
}
