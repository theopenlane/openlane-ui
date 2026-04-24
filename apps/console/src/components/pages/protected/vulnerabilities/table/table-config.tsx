import { type FilterField } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import NameField from '../create/form/fields/name-field'
import { type VulnerabilityQuery, VulnerabilityOrderField, VulnerabilitySecurityLevel } from '@repo/codegen/src/schema'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type VulnerabilityFieldProps, type EnumOptions, type EnumCreateHandlers } from './types'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { VulnerabilityAssociationSection } from '../create/form/fields/association-section'
import PastDueBadge from '@/components/shared/past-due-badge/past-due-badge'

export const formId = 'edit' + ObjectNames.VULNERABILITY

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Exposure', href: '/exposure/overview' },
  { label: 'Vulnerabilities', href: '/exposure/vulnerabilities' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'securityLevelIn',
    label: 'Security Level',
    type: 'multiselect',
    options: enumToOptions(VulnerabilitySecurityLevel),
    icon: FilterIcons.Criticality,
  },
  {
    key: 'vulnerabilityStatusNameIn',
    label: 'Status',
    type: 'multiselect',
    options: enumOptions.vulnerabilityStatusOptions,
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
    key: 'categoryContainsFold',
    label: 'Category',
    type: 'text',
    icon: FilterIcons.Category,
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
    key: 'blocking',
    label: 'Blocking',
    type: 'radio',
    icon: FilterIcons.Security,
    radioOptions: [
      { value: true, label: 'Blocking' },
      { value: false, label: 'Non-blocking' },
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
  {
    key: 'tagsHas',
    label: 'Tags',
    type: 'dropdownSearchSingleSelect',
    icon: FilterIcons.Status,
    options: enumOptions.tagOptions,
  },
]

export const VULNERABILITIES_SORT_FIELDS = enumToSortFields(VulnerabilityOrderField)

export const visibilityFields = {
  id: false,
  displayID: true,
  displayName: true,
  externalID: false,
  severity: false,
  securityLevel: true,
  vulnerabilityStatusName: true,
  status: false,
  priority: true,
  score: false,
  exploitability: false,
  impact: false,
  cveID: true,
  category: false,
  source: true,
  vector: false,
  remediationSLA: false,
  open: true,
  blocking: false,
  production: false,
  validated: false,
  public: false,
  environmentName: false,
  scopeName: false,
  externalOwnerID: false,
  externalURI: false,
  summary: false,
  description: false,
  discoveredAt: false,
  publishedAt: false,
  sourceUpdatedAt: false,
  createdAt: false,
  createdBy: false,
  updatedAt: true,
  updatedBy: false,
  tags: false,
}

export const getFieldsToRender = (props: VulnerabilityFieldProps, enumOptions: EnumOptions, enumCreateHandlers?: EnumCreateHandlers, riskScoresAction?: React.ReactNode) => {
  const vulnData = props.data as VulnerabilityQuery['vulnerability']
  const showBadge =
    !props.isCreate && !props.isEditing && (vulnData?.vulnerabilityStatusName === 'Open' || vulnData?.vulnerabilityStatusName === 'Triaged' || vulnData?.vulnerabilityStatusName === 'In Progress')
  return (
    <div className="mr-6">
      <div className="flex flex-row items-center mb-6">
        <div className="min-w-75">
          <NameField
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            initialValue={props.isCreate ? '' : (vulnData?.displayName ?? '')}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
            badge={showBadge ? <PastDueBadge severity={vulnData?.securityLevel} createdAt={vulnData?.createdAt} /> : undefined}
          />
        </div>
        <div className="ml-20 mt-6">
          <Properties
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed ?? false}
            data={props.data as VulnerabilityQuery['vulnerability'] | undefined}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
          />
        </div>
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
      <VulnerabilityAssociationSection data={props.data} isEditing={props.isEditing} isCreate={props.isCreate} isEditAllowed={props.isEditAllowed} />
    </div>
  )
}
