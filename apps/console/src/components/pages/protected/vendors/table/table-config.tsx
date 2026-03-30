import { type FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { ObjectNames } from '@repo/codegen/src/type-names'
import { type EntityQuery, EntityOrderField } from '@repo/codegen/src/schema'
import NameField from '../create/form/fields/name-field'
import DescriptionField from '../create/form/fields/description-field'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import Properties from '../create/form/fields/properties'
import { type EntityFieldProps, type EnumOptions, type EnumCreateHandlers } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { EntityAssociationSection } from '../create/form/fields/association-section'
import { EntityDocumentsSection } from '../create/form/fields/documents-section'

export const formId = 'edit' + ObjectNames.ENTITY

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/vendors' },
  { label: 'Vendors', href: '/registry/vendors' },
]
export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: enumOptions.entityStatusOptions,
  },
  {
    key: 'tagsHas',
    label: 'Tags',
    type: 'dropdownSearchSingleSelect',
    icon: FilterIcons.Tag,
    options: enumOptions.tagOptions,
  },
  {
    key: 'scopeNameIn',
    label: 'Scope',
    type: 'multiselect',
    icon: FilterIcons.Scope,
    options: enumOptions.scopeOptions,
  },
  {
    key: 'environmentNameIn',
    label: 'Environment',
    type: 'multiselect',
    icon: FilterIcons.Environment,
    options: enumOptions.environmentOptions,
  },
  {
    key: 'entitySourceTypeNameIn',
    label: 'Source Type',
    type: 'multiselect',
    icon: FilterIcons.Source,
    options: enumOptions.sourceTypeOptions,
  },
  {
    key: 'entityRelationshipStateNameIn',
    label: 'Relationship State',
    type: 'multiselect',
    icon: FilterIcons.Relationships,
    options: enumOptions.relationshipStateOptions,
  },
  {
    key: 'entitySecurityQuestionnaireStatusNameIn',
    label: 'Security Questionnaire Status',
    type: 'multiselect',
    icon: FilterIcons.Security,
    options: enumOptions.securityQuestionnaireStatusOptions,
  },
  {
    key: 'mfaSupported',
    label: 'MFA Supported',
    type: 'radio',
    icon: FilterIcons.SecurityFeatureSupported,
    radioOptions: [
      { value: true, label: 'MFA Supported' },
      { value: false, label: 'MFA Not Supported' },
    ],
  },
  {
    key: 'mfaEnforced',
    label: 'MFA Enforced',
    type: 'radio',
    icon: FilterIcons.SecurityFeatureEnforced,
    radioOptions: [
      { value: true, label: 'MFA Enforced' },
      { value: false, label: 'MFA Not Enforced' },
    ],
  },
  {
    key: 'ssoEnforced',
    label: 'SSO Enforced',
    type: 'radio',
    icon: FilterIcons.SSO,
    radioOptions: [
      { value: true, label: 'SSO Enforced' },
      { value: false, label: 'SSO Not Enforced' },
    ],
  },
  {
    key: 'hasSoc2',
    label: 'Has SOC 2',
    type: 'radio',
    icon: FilterIcons.Security,
    radioOptions: [
      { value: true, label: 'Has SOC 2' },
      { value: false, label: 'No SOC 2' },
    ],
  },
]

export const VENDORS_SORT_FIELDS = enumToSortFields(EntityOrderField)

export const visibilityFields = {
  id: false,
  name: false,
  displayName: true,
  description: true,
  domains: false,
  status: true,
  tags: false,
  annualSpend: false,
  approvedForUse: false,
  autoRenews: false,
  billingModel: false,
  contractEndDate: false,
  contractRenewalAt: false,
  contractStartDate: false,
  entityRelationshipStateName: false,
  entitySecurityQuestionnaireStatusName: false,
  entitySourceTypeName: false,
  environmentName: false,
  environment: true,
  hasSoc2: true,
  internalOwner: false,
  lastReviewedAt: false,
  mfaEnforced: false,
  mfaSupported: false,
  nextReviewAt: false,
  renewalRisk: false,
  reviewedBy: false,
  riskRating: false,
  riskScore: false,
  scopeName: false,
  soc2PeriodEnd: false,
  ssoEnforced: false,
  spendCurrency: false,
  statusPageURL: false,
  terminationNoticeDays: false,
  tier: false,
  updatedAt: true,
  createdAt: false,
}

export const getFieldsToRender = (
  props: EntityFieldProps,
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
            initialValue={props.isCreate ? '' : (props.data?.name ?? '')}
            internalEditing={props.internalEditing}
            setInternalEditing={props.setInternalEditing}
            handleUpdateField={props.handleUpdateField}
          />
        </div>
        <div className="ml-20 mt-6">
          <Properties
            isEditing={props.isEditing}
            isEditAllowed={props.isEditAllowed}
            data={props.data as EntityQuery['entity'] | undefined}
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
        initialValue={props.isCreate ? '' : (props.data?.description ?? '')}
      />
      <AdditionalFields
        isEditing={props.isEditing}
        isEditAllowed={props.isEditAllowed}
        data={props.data as EntityQuery['entity'] | undefined}
        internalEditing={props.internalEditing}
        setInternalEditing={props.setInternalEditing}
        handleUpdateField={props.handleUpdateField}
        enumOptions={enumOptions}
        enumCreateHandlers={enumCreateHandlers}
      />
      <EntityDocumentsSection
        entityId={props.data?.id}
        isEditAllowed={props.isEditAllowed}
        isCreate={props.isCreate}
        onStagedFilesChange={onStagedFilesChange}
        onExistingFileIdsChange={onExistingFileIdsChange}
      />
      <EntityAssociationSection data={props.data} isEditing={props.isEditing} isCreate={props.isCreate} isEditAllowed={props.isEditAllowed} />
    </div>
  )
}
