import { type FilterField } from '@/types'
import { ObjectNames } from '@repo/codegen/src/type-names'
import React from 'react'
import NameField from '../create/form/fields/name-field'
import { type ReviewQuery, ReviewOrderField } from '@repo/codegen/src/schema'
import DescriptionField from '../create/form/fields/description-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type ReviewFieldProps, type EnumOptions } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { ReviewAssociationSection } from '../create/form/fields/association-section'
import { ReviewDocumentsSection } from '../create/form/fields/documents-section'

export const formId = 'edit' + ObjectNames.REVIEW

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Exposure', href: '/exposure/overview' },
  { label: 'Reviews', href: '/exposure/reviews' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'stateContainsFold',
    label: 'State',
    type: 'text',
    icon: FilterIcons.Status,
  },
  {
    key: 'categoryContainsFold',
    label: 'Category',
    type: 'text',
    icon: FilterIcons.Category,
  },
  {
    key: 'reporterContainsFold',
    label: 'Reporter',
    type: 'text',
    icon: FilterIcons.Assignee,
  },
  {
    key: 'approved',
    label: 'Approved',
    type: 'radio',
    icon: FilterIcons.Access,
    radioOptions: [
      { value: true, label: 'Approved' },
      { value: false, label: 'Not Approved' },
    ],
  },
  {
    key: 'sourceContainsFold',
    label: 'Source',
    type: 'text',
    icon: FilterIcons.Source,
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

export const REVIEWS_SORT_FIELDS = enumToSortFields(ReviewOrderField)

export const visibilityFields = {
  id: false,
  title: true,
  state: true,
  category: true,
  classification: false,
  source: true,
  reporter: true,
  approved: true,
  approvedAt: false,
  reportedAt: false,
  reviewedAt: false,
  summary: false,
  environmentName: false,
  scopeName: false,
  externalID: false,
  externalOwnerID: false,
  externalURI: false,
  systemOwned: false,
  createdAt: false,
  createdBy: false,
  updatedAt: true,
  updatedBy: false,
  tags: false,
}

export const getFieldsToRender = (props: ReviewFieldProps, enumOptions: EnumOptions, onStagedFilesChange?: (files: File[]) => void, onExistingFileIdsChange?: (fileIds: string[]) => void) => {
  return (
    <div className="mr-6">
      <div className="flex flex-row items-center mb-6">
        <div className="min-w-[300px]">
          <NameField
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            initialValue={props.isCreate ? '' : ((props.data as ReviewQuery['review'])?.title ?? '')}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
          />
        </div>
        <div className="ml-20 mt-6">
          <Properties
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed ?? false}
            data={props.data as ReviewQuery['review'] | undefined}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
          />
        </div>
      </div>
      <DescriptionField
        key={props.isCreate ? 'create-details' : `${(props.data as ReviewQuery['review'])?.id}-details`}
        isEditing={props.isEditing}
        isCreate={props.isCreate}
        initialValue={props.isCreate ? '' : ((props.data as ReviewQuery['review'])?.details ?? '')}
        isFormInitialized={props.isFormInitialized}
      />
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        isCreate={props.isCreate}
        data={props.data}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
        enumOptions={enumOptions}
      />
      <ReviewDocumentsSection
        reviewId={(props.data as ReviewQuery['review'])?.id}
        isEditAllowed={props.isEditAllowed ?? false}
        isCreate={props.isCreate ?? false}
        onStagedFilesChange={onStagedFilesChange}
        onExistingFileIdsChange={onExistingFileIdsChange}
      />
      <ReviewAssociationSection data={props.data} isEditing={props.isEditing} isCreate={props.isCreate} isEditAllowed={props.isEditAllowed} />
    </div>
  )
}
