import { type FilterField } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import NameField from '../create/form/fields/name-field'
import { type FindingQuery, FindingOrderField } from '@repo/codegen/src/schema'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type FindingFieldProps, type EnumOptions, type EnumCreateHandlers } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { FindingAssociationSection } from '../create/form/fields/association-section'

export const formId = 'edit' + ObjectNames.FINDING

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Exposure', href: '/exposure/overview' },
  { label: 'Findings', href: '/exposure/findings' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'categoryContainsFold',
    label: 'Category',
    type: 'text',
    icon: FilterIcons.Category,
  },
  {
    key: 'severityContainsFold',
    label: 'Severity',
    type: 'text',
    icon: FilterIcons.Criticality,
  },
  {
    key: 'findingStatusNameContainsFold',
    label: 'Status',
    type: 'text',
    icon: FilterIcons.Status,
  },
  {
    key: 'priorityContainsFold',
    label: 'Priority',
    type: 'text',
    icon: FilterIcons.Tier,
  },
  {
    key: 'sourceContainsFold',
    label: 'Source',
    type: 'text',
    icon: FilterIcons.Source,
  },
  {
    key: 'open',
    label: 'Open',
    type: 'radio',
    icon: FilterIcons.Access,
    radioOptions: [
      { value: true, label: 'Open' },
      { value: false, label: 'Closed' },
    ],
  },
  {
    key: 'production',
    label: 'Production',
    type: 'radio',
    icon: FilterIcons.Environment,
    radioOptions: [
      { value: true, label: 'Production' },
      { value: false, label: 'Non-production' },
    ],
  },
  {
    key: 'validated',
    label: 'Validated',
    type: 'radio',
    icon: FilterIcons.ID,
    radioOptions: [
      { value: true, label: 'Validated' },
      { value: false, label: 'Unvalidated' },
    ],
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

export const FINDINGS_SORT_FIELDS = enumToSortFields(FindingOrderField)

export const visibilityFields = {
  id: false,
  displayID: false,
  displayName: true,
  category: true,
  severity: true,
  securityLevel: true,
  findingStatusName: true,
  numericSeverity: false,
  status: false,
  priority: true,
  score: false,
  exploitability: false,
  impact: false,
  vector: false,
  open: true,
  production: false,
  validated: false,
  public: false,
  blocksProduction: true,
  externalID: false,
  externalOwnerID: false,
  externalURI: false,
  source: true,
  findingClass: false,
  remediationSLA: true,
  environmentName: false,
  scopeName: false,
  reportedAt: true,
  eventTime: false,
  sourceUpdatedAt: false,
  createdAt: false,
  createdBy: false,
  updatedAt: false,
  updatedBy: false,
}

export const getFieldsToRender = (props: FindingFieldProps, enumOptions: EnumOptions, enumCreateHandlers?: EnumCreateHandlers, riskScoresAction?: React.ReactNode) => {
  return (
    <div className="mr-6">
      <div className="mb-6">
        <NameField
          isEditing={props.isEditing}
          isEditAllowed={props.isEditAllowed}
          initialValue={props.isCreate ? '' : ((props.data as FindingQuery['finding'])?.displayName ?? '')}
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
        riskScoresAction={riskScoresAction}
      />
      <FindingAssociationSection data={props.data} isEditing={props.isEditing} isCreate={props.isCreate} isEditAllowed={props.isEditAllowed} />
    </div>
  )
}
