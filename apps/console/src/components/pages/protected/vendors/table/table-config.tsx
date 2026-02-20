import { FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { ObjectNames } from '@repo/codegen/src/type-names'
import { EntityQuery, EntityOrderField } from '@repo/codegen/src/schema'
import NameField from '../create/form/fields/name-field'
import DescriptionField from '../create/form/fields/description-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'
import { EntityFieldProps, EnumOptions } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'

export const formId = 'edit' + ObjectNames.ENTITY

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/vendors' },
  { label: 'Vendors', href: '/vendors' },
]
export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
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

export const VENDORS_SORT_FIELDS = enumToSortFields(EntityOrderField)

export const visibilityFields = {
  id: false,
  name: true,
  description: true,
  environment: true,
  tags: true,
  updatedAt: true,
  createdAt: true,
}

export const getFieldsToRender = (props: EntityFieldProps, enumOptions: EnumOptions) => {
  return (
    <>
      <NameField
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        initialValue={props.isCreate ? '' : props.data?.name ?? ''}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
      />
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
        data={props.data as EntityQuery['entity'] | undefined}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
        enumOptions={enumOptions}
      />
      <Properties
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        data={props.data as EntityQuery['entity'] | undefined}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
      />
    </>
  )
}
