import { type FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { ObjectNames } from '@repo/codegen/src/type-names'
import { type SystemDetailQuery, SystemDetailOrderField, type UpdateSystemDetailInput } from '@repo/codegen/src/schema'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import NameField from '../create/form/fields/name-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'
import { type EnumOptions, type SystemDetailFieldProps } from './types'

export const formId = 'edit' + ObjectNames.SYSTEM_DETAIL

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/system-details' },
  { label: 'System Details', href: '/registry/system-details' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'sensitivityLevelIn',
    label: 'Sensitivity Level',
    type: 'multiselect',
    icon: FilterIcons.Security,
    options: enumOptions.sensitivityLevelOptions,
  },
  {
    key: 'tagsHas',
    label: 'Tags',
    type: 'dropdownSearchSingleSelect',
    icon: FilterIcons.Tag,
    options: enumOptions.tagOptions,
  },
]

export const SYSTEM_DETAILS_SORT_FIELDS = enumToSortFields(SystemDetailOrderField)

export const visibilityFields = {
  id: false,
  displayID: false,
  version: false,
  authorizationBoundary: false,
  revisionHistory: false,
  program: false,
  tags: false,
  lastReviewed: false,
  createdAt: false,
  createdBy: false,
  updatedBy: false,
}

export const getFieldsToRender = (props: SystemDetailFieldProps, enumOptions: EnumOptions) => {
  return (
    <div className="mr-6">
      <div className="flex flex-row items-center mb-6">
        <div className="min-w-[300px]">
          <NameField
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            initialValue={props.isCreate ? '' : (props.data?.systemName ?? '')}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField as ((input: UpdateSystemDetailInput) => Promise<void>) | undefined}
          />
        </div>
        <div className="ml-20 mt-6">
          <Properties
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            data={props.data as SystemDetailQuery['systemDetail'] | undefined}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField as ((input: UpdateSystemDetailInput) => Promise<void>) | undefined}
          />
        </div>
      </div>
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        isCreate={props.isCreate}
        data={props.data as SystemDetailQuery['systemDetail'] | undefined}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField as ((input: UpdateSystemDetailInput) => Promise<void>) | undefined}
        enumOptions={enumOptions}
        isFormInitialized={props.isFormInitialized}
      />
    </div>
  )
}
