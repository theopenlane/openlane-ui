import { type FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { ObjectNames } from '@repo/codegen/src/type-names'
import { type IdentityHolderQuery, IdentityHolderOrderField } from '@repo/codegen/src/schema'
import NameField from '../create/form/fields/name-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'
import { type PersonnelFieldProps, type EnumOptions, type EnumCreateHandlers } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { IdentityHolderAssociationSection } from '../create/form/fields/association-section'
import { IdentityHolderDocumentsSection } from '../create/form/fields/documents-section'

export const formId = 'edit' + ObjectNames.IDENTITY_HOLDER

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/personnel' },
  { label: 'Personnel', href: '/personnel' },
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
    key: 'identityHolderTypeIn',
    label: 'Type',
    type: 'multiselect',
    icon: FilterIcons.Type,
    options: enumOptions.identityHolderTypeOptions,
  },
  {
    key: 'isActive',
    label: 'Active',
    type: 'radio',
    icon: FilterIcons.Status,
    radioOptions: [
      { value: true, label: 'Active' },
      { value: false, label: 'Not Active' },
    ],
  },
  {
    key: 'isOpenlaneUser',
    label: 'Openlane User',
    type: 'radio',
    icon: FilterIcons.Access,
    radioOptions: [
      { value: true, label: 'Openlane User' },
      { value: false, label: 'Not Openlane User' },
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
    icon: FilterIcons.Tag,
    options: enumOptions.tagOptions,
  },
]

export const PERSONNEL_SORT_FIELDS = enumToSortFields(IdentityHolderOrderField)

export const visibilityFields = {
  id: false,
  displayID: false,
  alternateEmail: false,
  title: false,
  team: false,
  location: false,
  phoneNumber: false,
  isOpenlaneUser: false,
  startDate: false,
  endDate: false,
  externalUserID: false,
  externalReferenceID: false,
  environmentName: false,
  scopeName: false,
  internalOwner: false,
  tags: false,
  createdAt: false,
  createdBy: false,
  updatedBy: false,
}

export const getFieldsToRender = (
  props: PersonnelFieldProps,
  enumOptions: EnumOptions,
  onStagedFilesChange?: (files: File[]) => void,
  onExistingFileIdsChange?: (fileIds: string[]) => void,
  enumCreateHandlers?: EnumCreateHandlers,
) => {
  return (
    <div className="mr-6">
      <div className="flex flex-row items-center mb-6">
        <div className="min-w-[300px]">
          <NameField
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            initialValue={props.isCreate ? '' : (props.data?.fullName ?? '')}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
          />
        </div>
        <div className="ml-20 mt-6">
          <Properties
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            data={props.data as IdentityHolderQuery['identityHolder'] | undefined}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
          />
        </div>
      </div>
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        data={props.data as IdentityHolderQuery['identityHolder'] | undefined}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
        enumOptions={enumOptions}
        enumCreateHandlers={enumCreateHandlers}
      />
      <IdentityHolderDocumentsSection
        identityHolderId={props.data?.id}
        isEditAllowed={props.isEditAllowed}
        isCreate={props.isCreate}
        onStagedFilesChange={onStagedFilesChange}
        onExistingFileIdsChange={onExistingFileIdsChange}
      />
      <IdentityHolderAssociationSection data={props.data} isEditing={props.isEditing} isCreate={props.isCreate} isEditAllowed={props.isEditAllowed} />
    </div>
  )
}
