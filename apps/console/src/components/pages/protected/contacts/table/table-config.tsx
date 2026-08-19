import { type FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { ObjectNames } from '@repo/codegen/src/type-names'
import { ContactOrderField, type ContactQuery, type UpdateContactInput } from '@repo/codegen/src/schema'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import { type ContactFieldProps, type EnumOptions } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'

export const formId = 'edit' + ObjectNames.CONTACT

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/contacts' },
  { label: 'Contacts', href: '/registry/contacts' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: enumOptions.statusOptions,
  },
  {
    key: 'tagsHas',
    label: 'Tags',
    type: 'dropdownSearchSingleSelect',
    icon: FilterIcons.Tag,
    options: enumOptions.tagOptions,
  },
]

export const CONTACTS_SORT_FIELDS = enumToSortFields(ContactOrderField)

export const visibilityFields = {
  id: false,
  address: false,
  tags: false,
  createdAt: false,
  createdBy: false,
  updatedBy: false,
}

export const getFieldsToRender = (props: ContactFieldProps, enumOptions: EnumOptions) => {
  const contactData = props.data as ContactQuery['contact'] | undefined
  const handleUpdateField = props.handleUpdateField as ((input: UpdateContactInput) => Promise<void>) | undefined

  return (
    <div className="mr-6">
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        isCreate={props.isCreate}
        data={contactData}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={handleUpdateField}
        enumOptions={enumOptions}
      />
    </div>
  )
}
