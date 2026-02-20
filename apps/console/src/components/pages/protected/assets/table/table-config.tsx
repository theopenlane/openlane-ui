import { FilterField } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import NameField from '../create/form/fields/name-field'
import { AssetAssetType, AssetQuery, AssetSourceType, AssetOrderField } from '@repo/codegen/src/schema'
import DescriptionField from '../create/form/fields/description-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { AssetFieldProps, EnumOptions } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'

export const formId = 'edit' + ObjectNames.ASSET

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/assets' },
  { label: 'Assets', href: '/assets' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'assetTypeIn',
    label: 'Asset Type',
    type: 'multiselect',
    icon: FilterIcons.Type,
    options: enumToOptions(AssetAssetType),
  },
  {
    key: 'subtypeNameIn',
    label: 'Subtype',
    type: 'multiselect',
    options: enumOptions.assetSubtypeOptions,
    icon: FilterIcons.Subcategory,
  },
  {
    key: 'sourceTypeIn',
    label: 'Source Type',
    type: 'multiselect',
    icon: FilterIcons.Source,
    options: enumToOptions(AssetSourceType),
  },
  {
    key: 'containsPii',
    label: 'Contains PII',
    type: 'radio',
    icon: FilterIcons.ID,
    radioOptions: [
      { value: true, label: 'Has PII' },
      { value: false, label: 'No PII' },
    ],
  },
  {
    key: 'accessModelNameIn',
    label: 'Access Model',
    type: 'multiselect',
    options: enumOptions.accessModelOptions,
    icon: FilterIcons.Access,
  },
  {
    key: 'dataClassificationNameIn',
    label: 'Data Classification',
    type: 'multiselect',
    options: enumOptions.assetDataClassificationOptions,
    icon: FilterIcons.Category,
  },
  {
    key: 'costCenterNameContains',
    label: 'Cost Center',
    type: 'text',
    icon: FilterIcons.Team,
  },
  {
    key: 'criticalityNameIn',
    label: 'Criticality',
    type: 'multiselect',
    icon: FilterIcons.Criticality,
    options: enumOptions.criticalityOptions,
  },
  {
    key: 'encryptionStatusNameIn',
    label: 'Encryption Status',
    type: 'multiselect',
    icon: FilterIcons.Security,
    options: enumOptions.encryptionStatusOptions,
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
    key: 'physicalLocationContains',
    label: 'Physical Location',
    type: 'text',
    icon: FilterIcons.Location,
  },
  {
    key: 'securityTierNameIn',
    label: 'Security Tier',
    type: 'multiselect',
    icon: FilterIcons.Tier,
    options: enumOptions.securityTierOptions,
  },
  {
    key: 'regionNameContains',
    label: 'Region',
    type: 'text',
    icon: FilterIcons.Region,
  },
  {
    key: 'tagsHas',
    label: 'Tags',
    type: 'dropdownSearchSingleSelect',
    icon: FilterIcons.Status,
    options: enumOptions.tagOptions,
  },
]

export const ASSETS_SORT_FIELDS = enumToSortFields(AssetOrderField)
export const visibilityFields = {
  id: false,
  name: true,
  description: true,
  accessModelName: true,
  assetDataClassificationName: true,
  assetSubtypeName: true,
  assetType: true,
  costCenter: false,
  cpe: false,
  criticalityName: true,
  containsPii: true,
  encryptionStatusName: true,
  environmentName: true,
  estimatedMonthlyCost: false,
  identifier: false,
  physicalLocation: false,
  purchaseDate: false,
  region: false,
  scopeName: true,
  securityTierName: true,
  sourceIdentifier: true,
  sourceType: true,
  tags: true,
  updatedAt: true,
  updatedBy: true,
  website: false,
}

export const getFieldsToRender = (props: AssetFieldProps, enumOptions: EnumOptions) => {
  return (
    <div className="mr-6">
      <div className="flex flex-row items-center mb-6">
        <div className="min-w-[300px]">
          <NameField
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            initialValue={props.isCreate ? '' : props.data?.name ?? ''}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
          />
        </div>
        <div className="ml-20 mt-6">
          <Properties
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            data={props.data as AssetQuery['asset'] | undefined}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
          />
        </div>
      </div>
      <DescriptionField
        key={props.isCreate ? 'create-description' : `${props.data?.id}-description`}
        isEditing={props.isEditing}
        isCreate={props.isCreate}
        initialValue={props.isCreate ? '' : props.data?.description ?? ''}
        isFormInitialized={props.isFormInitialized}
      />
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        data={props.data}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
        enumOptions={enumOptions}
      />
    </div>
  )
}
