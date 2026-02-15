import { FilterField } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import NameField from '../create/form/fields/name-field'
import { AssetAssetType, AssetQuery, AssetSourceType, UpdateAssetInput } from '@repo/codegen/src/schema'
import DescriptionField from '../create/form/fields/description-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'
import { FieldValues } from 'react-hook-form'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

export const formId = 'edit' + ObjectNames.ASSET

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/assets' },
  { label: 'Assets', href: '/assets' },
]

type CustomEnumOption = { label: string; value: string }

export const getFilterFields = (
  accessModelOptions: CustomEnumOption[] = [],
  assetDataClassificationOptions: CustomEnumOption[] = [],
  assetSubtypeOptions: CustomEnumOption[] = [],
  criticalityOptions: CustomEnumOption[] = [],
  encryptionStatusOptions: CustomEnumOption[] = [],
  environmentOptions: CustomEnumOption[] = [],
  tagOptions: CustomEnumOption[] = [],
  // scopeOptions: CustomEnumOption[] = [],
  // securityTierOptions: CustomEnumOption[] = [],
): FilterField[] => [
  {
    key: 'assetType',
    label: 'Asset Type',
    type: 'multiselect',
    icon: FilterIcons.Type,
    options: enumToOptions(AssetAssetType),
  },
  {
    key: 'subtypeNameIn',
    label: 'Subtype',
    type: 'multiselect',
    options: assetSubtypeOptions,
    icon: FilterIcons.Subcategory,
  },
  {
    key: 'sourceType',
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
    options: accessModelOptions,
    icon: FilterIcons.Access,
  },
  {
    key: 'dataClassificationNameIn',
    label: 'Data Classification',
    type: 'multiselect',
    options: assetDataClassificationOptions,
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
    options: criticalityOptions,
  },
  {
    key: 'encryptionStatusNameIn',
    label: 'Encryption Status',
    type: 'multiselect',
    icon: FilterIcons.Security,
    options: encryptionStatusOptions,
  },
  {
    key: 'environmentNameIn',
    label: 'Environment',
    type: 'multiselect',
    icon: FilterIcons.Environment,
    options: environmentOptions,
  },
  {
    key: 'physicalLocationContains',
    label: 'Physical Location',
    type: 'text',
    icon: FilterIcons.Location,
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
    type: 'multiselect',
    // type: 'dropdownSearchSingleSelect',
    icon: FilterIcons.Status,
    options: tagOptions,
  },
]

export const ASSETS_SORT_FIELDS = [{ key: 'name', label: 'Name' }]

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

export const getFieldsToRender = (
  isEditing: boolean,
  isEditAllowed: boolean,
  isCreate: boolean,
  data: FieldValues | AssetQuery['asset'] | undefined,
  internalEditing: string | null,
  setInternalEditing: (field: string | null) => void,
  handleUpdateField?: (input: UpdateAssetInput) => Promise<void>,
  isFormInitialized?: boolean,
  id?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.ReactElement<any, any> => {
  return (
    <>
      <NameField
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        initialValue={isCreate ? '' : data?.name ?? ''}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
        handleUpdateField={handleUpdateField}
      />
      <DescriptionField
        key={isCreate ? 'create-description' : `${id}-description`}
        isEditing={isEditing}
        isCreate={isCreate}
        initialValue={isCreate ? '' : data?.description ?? ''}
        isFormInitialized={isFormInitialized}
      />
      <AdditionalFields
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        data={data}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
        handleUpdateField={handleUpdateField}
      />
      <Properties
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        data={data as AssetQuery['asset'] | undefined}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
        handleUpdateField={handleUpdateField}
      />
    </>
  )
}
