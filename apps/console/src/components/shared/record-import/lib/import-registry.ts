import { ObjectTypes } from '@repo/codegen/src/type-names'
import {
  AssetSourceType,
  ControlControlSource,
  MappedControlMappingSource,
  type CreateActionPlanInput,
  type CreateAssetInput,
  type CreateCheckResultInput,
  type CreateContactInput,
  type CreateControlInput,
  type CreateEntityInput,
  type CreateEvidenceInput,
  type CreateFindingInput,
  type CreateGroupInput,
  type CreateIdentityHolderInput,
  type CreateInternalPolicyInput,
  type CreateMappedControlInput,
  type CreateProcedureInput,
  type CreateRemediationInput,
  type CreateReviewInput,
  type CreateRiskInput,
  type CreateScanInput,
  type CreateSlaDefinitionInput,
  type CreateSubscriberInput,
  type CreateSystemDetailInput,
  type CreateTaskInput,
  type CreateTemplateInput,
  type CreateTrustCenterNdaRequestInput,
  type CreateVulnerabilityInput,
} from '@repo/codegen/src/schema'
import type { TDestinationField } from './types'

type TRequiredInputKeys<TInput> = { [K in keyof TInput]-?: object extends Pick<TInput, K> ? never : K }[keyof TInput]

type TInputKeysOfType<TInput, TValue> = { [K in keyof TInput]-?: NonNullable<TInput[K]> extends TValue ? K : never }[keyof TInput]

type TStringInputKeys<TInput> = TInputKeysOfType<TInput, string>

type TRequiredOneOf<TInput> = readonly [TStringInputKeys<TInput>, TStringInputKeys<TInput>, ...TStringInputKeys<TInput>[]]

type TImportEntityDefinition<TInput> = {
  required: Record<TRequiredInputKeys<TInput>, true>
  requiredOneOf?: readonly TRequiredOneOf<TInput>[]
  primaryField?: TStringInputKeys<TInput>
  autoValues?: { [K in TStringInputKeys<TInput>]?: NonNullable<TInput[K]> }
  fixedValues?: { [K in TInputKeysOfType<TInput, string | boolean>]?: NonNullable<TInput[K]> }
  uniqueFields?: readonly TStringInputKeys<TInput>[]
  aliases?: Record<string, readonly string[]>
}

export type TImportEntityConfig = {
  requiredFields: string[]
  requiredOneOf: string[][]
  primaryField?: string
  autoValues: Record<string, string>
  fixedValues: Record<string, string | boolean>
  uniqueFields: string[]
  aliases: Record<string, readonly string[]>
}

const isFixedValue = (entry: [string, unknown]): entry is [string, string | boolean] => typeof entry[1] === 'string' || typeof entry[1] === 'boolean'

const defineImportEntity = <TInput>({ required, requiredOneOf, primaryField, autoValues, fixedValues, uniqueFields, aliases }: TImportEntityDefinition<TInput>): TImportEntityConfig => ({
  requiredFields: Object.keys(required),
  requiredOneOf: (requiredOneOf ?? []).map((group) => group.map(String)),
  primaryField: primaryField === undefined ? undefined : String(primaryField),
  autoValues: Object.fromEntries(Object.entries(autoValues ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
  fixedValues: Object.fromEntries(Object.entries(fixedValues ?? {}).filter(isFixedValue)),
  uniqueFields: (uniqueFields ?? []).map(String),
  aliases: aliases ?? {},
})

const SHARED_ALIASES: Record<string, readonly string[]> = {
  name: ['vendorname', 'companyname', 'organisationname', 'organizationname', 'displayname', 'fullname', 'accountname', 'label'],
  title: ['subject', 'heading'],
  description: ['desc', 'summary', 'details'],
  details: ['description'],
  tags: ['labels', 'keywords'],
  status: ['state', 'currentstatus'],
  category: ['family'],
  subcategory: ['subfamily'],
  email: ['emailaddress', 'contactemail', 'workemail'],
  phonenumber: ['phone', 'telephone', 'mobile'],
  domains: ['domain', 'website', 'websiteurl', 'url', 'homepage', 'site'],
  duedate: ['due', 'deadline', 'targetdate'],
  severity: ['risklevel'],
  externalid: ['sourceid', 'externalreference'],
  lastreviewedat: ['reviewcompletedat', 'reviewdate', 'lastreviewdate'],
}

const CONTROL_ALIASES: Record<string, readonly string[]> = {
  refcode: ['controlid', 'controlids', 'controlnumber', 'controlref', 'controlreference', 'controlcode', 'referencecode', 'reference', 'identifier', 'code'],
  referenceframework: ['framework', 'standard'],
  implementationstatus: ['implementation'],
  mappedcategories: ['mappings'],
}

const NDA_REQUEST_ALIASES: Record<string, readonly string[]> = {
  firstname: ['first', 'givenname', 'forename'],
  lastname: ['last', 'surname', 'familyname'],
  companyname: ['company', 'organization', 'organisation', 'employer'],
  signedat: ['signed', 'signedon', 'signeddate', 'datesigned', 'signaturedate', 'executedon', 'executiondate'],
}

const IMPORT_ENTITIES: Partial<Record<ObjectTypes, TImportEntityConfig>> = {
  [ObjectTypes.ACTION_PLAN]: defineImportEntity<CreateActionPlanInput>({ required: { name: true, title: true } }),
  [ObjectTypes.ASSET]: defineImportEntity<CreateAssetInput>({ required: { name: true }, autoValues: { sourceType: AssetSourceType.IMPORTED } }),
  [ObjectTypes.CHECK_RESULT]: defineImportEntity<CreateCheckResultInput>({ required: { source: true } }),
  [ObjectTypes.CONTACT]: defineImportEntity<CreateContactInput>({ required: {} }),
  [ObjectTypes.CONTROL]: defineImportEntity<CreateControlInput>({
    required: { refCode: true },
    primaryField: 'refCode',
    autoValues: { source: ControlControlSource.IMPORTED },
    aliases: CONTROL_ALIASES,
  }),
  [ObjectTypes.ENTITY]: defineImportEntity<CreateEntityInput>({ required: {}, requiredOneOf: [['name', 'displayName']] }),
  [ObjectTypes.EVIDENCE]: defineImportEntity<CreateEvidenceInput>({ required: { name: true } }),
  [ObjectTypes.FINDING]: defineImportEntity<CreateFindingInput>({ required: {} }),
  [ObjectTypes.GROUP]: defineImportEntity<CreateGroupInput>({ required: { name: true } }),
  [ObjectTypes.IDENTITY_HOLDER]: defineImportEntity<CreateIdentityHolderInput>({ required: { email: true, fullName: true } }),
  [ObjectTypes.INTERNAL_POLICY]: defineImportEntity<CreateInternalPolicyInput>({ required: { name: true } }),
  [ObjectTypes.MAPPED_CONTROL]: defineImportEntity<CreateMappedControlInput>({ required: {}, autoValues: { source: MappedControlMappingSource.IMPORTED } }),
  [ObjectTypes.PROCEDURE]: defineImportEntity<CreateProcedureInput>({ required: { name: true } }),
  [ObjectTypes.REMEDIATION]: defineImportEntity<CreateRemediationInput>({ required: {} }),
  [ObjectTypes.REVIEW]: defineImportEntity<CreateReviewInput>({ required: { title: true } }),
  [ObjectTypes.RISK]: defineImportEntity<CreateRiskInput>({ required: { name: true } }),
  [ObjectTypes.SCAN]: defineImportEntity<CreateScanInput>({ required: { target: true } }),
  [ObjectTypes.SLA_DEFINITION]: defineImportEntity<CreateSlaDefinitionInput>({ required: { slaDays: true } }),
  [ObjectTypes.SUBSCRIBER]: defineImportEntity<CreateSubscriberInput>({ required: { email: true }, fixedValues: { verifiedEmail: true } }),
  [ObjectTypes.SYSTEM_DETAIL]: defineImportEntity<CreateSystemDetailInput>({ required: { systemName: true } }),
  [ObjectTypes.TASK]: defineImportEntity<CreateTaskInput>({ required: { title: true } }),
  [ObjectTypes.TEMPLATE]: defineImportEntity<CreateTemplateInput>({ required: { jsonconfig: true, name: true } }),
  [ObjectTypes.TRUST_CENTER_NDA_REQUEST]: defineImportEntity<CreateTrustCenterNdaRequestInput>({
    required: { email: true, firstName: true, lastName: true },
    primaryField: 'email',
    uniqueFields: ['email'],
    aliases: NDA_REQUEST_ALIASES,
  }),
  [ObjectTypes.VULNERABILITY]: defineImportEntity<CreateVulnerabilityInput>({ required: { externalID: true } }),
}

export const defineFixedImportField = <TInput>({ field, label, value, valueLabel }: { field: TStringInputKeys<TInput>; label: string; value: string; valueLabel: string }): TDestinationField => ({
  name: String(field),
  label,
  autoValue: value,
  autoValueLabel: valueLabel,
  fuzzyMatchable: false,
})

const EMPTY_ENTITY_CONFIG: TImportEntityConfig = { requiredFields: [], requiredOneOf: [], autoValues: {}, fixedValues: {}, uniqueFields: [], aliases: {} }

export const getImportEntityConfig = (entityType: ObjectTypes): TImportEntityConfig => IMPORT_ENTITIES[entityType] ?? EMPTY_ENTITY_CONFIG

export const getImportAliases = (entityType: ObjectTypes): Record<string, readonly string[]> => {
  const { aliases } = getImportEntityConfig(entityType)
  const merged: Record<string, readonly string[]> = { ...SHARED_ALIASES }

  Object.entries(aliases).forEach(([field, entityAliases]) => {
    merged[field] = [...(merged[field] ?? []), ...entityAliases]
  })

  return merged
}
