import { FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { FieldValues } from 'react-hook-form'
import { EntityQuery, UpdateEntityInput } from '@repo/codegen/src/schema'
import NameField from '../create/form/fields/name-field'
import DescriptionField from '../create/form/fields/description-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'

type CustomEnumOption = { label: string; value: string }

export const getFilterFields = (environmentOptions: CustomEnumOption[] = [], tagOptions: CustomEnumOption[] = []): FilterField[] => [
  {
    key: 'environmentNameIn',
    label: 'Environment',
    type: 'multiselect',
    icon: FilterIcons.Environment,
    options: environmentOptions,
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

export const VENDORS_SORT_FIELDS = [{ key: 'name', label: 'Name' }]

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/vendors' },
  { label: 'Vendors', href: '/vendors' },
]

export const visibilityFields = {}

export const getFieldsToRender = (
  isEditing: boolean,
  isEditAllowed: boolean,
  isCreate: boolean,
  data: FieldValues | EntityQuery['entity'] | undefined,
  internalEditing: string | null,
  setInternalEditing: (field: string | null) => void,
  handleUpdateField?: (input: UpdateEntityInput) => Promise<void>,
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
        data={data as EntityQuery['entity'] | undefined}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
        handleUpdateField={handleUpdateField}
      />
      <Properties
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        data={data as EntityQuery['entity'] | undefined}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
        handleUpdateField={handleUpdateField}
      />
    </>
  )
}
