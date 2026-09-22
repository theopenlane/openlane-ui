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
  type CreateVulnerabilityInput,
} from '@repo/codegen/src/schema'

type TRequiredInputKeys<TInput> = { [K in keyof TInput]-?: object extends Pick<TInput, K> ? never : K }[keyof TInput]

type TStringInputKeys<TInput> = { [K in keyof TInput]-?: NonNullable<TInput[K]> extends string ? K : never }[keyof TInput]

type TImportEntityDefinition<TInput> = {
  required: Record<TRequiredInputKeys<TInput>, true>
  autoValues?: { [K in TStringInputKeys<TInput>]?: NonNullable<TInput[K]> }
  aliases?: Record<string, readonly string[]>
}

export type TImportEntityConfig = {
  requiredFields: string[]
  autoValues: Record<string, string>
  aliases: Record<string, readonly string[]>
}

const defineImportEntity = <TInput>({ required, autoValues, aliases }: TImportEntityDefinition<TInput>): TImportEntityConfig => ({
  requiredFields: Object.keys(required),
  autoValues: Object.fromEntries(Object.entries(autoValues ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string')),
  aliases: aliases ?? {},
})

const SHARED_ALIASES: Record<string, readonly string[]> = {
  name: ['vendorname', 'companyname', 'organisationname', 'organizationname', 'displayname', 'fullname', 'accountname', 'label'],
  title: ['subject', 'heading'],
  description: ['desc', 'details', 'notes', 'summary'],
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
}

const CONTROL_ALIASES: Record<string, readonly string[]> = {
  refcode: ['controlid', 'controlref', 'controlreference', 'controlcode', 'referencecode', 'reference', 'identifier', 'code'],
  controlkindname: ['type', 'controltype', 'kind'],
  referenceframework: ['framework', 'standard'],
  implementationstatus: ['implementation'],
  mappedcategories: ['mappings'],
}

const IMPORT_ENTITIES: Partial<Record<ObjectTypes, TImportEntityConfig>> = {
  [ObjectTypes.ACTION_PLAN]: defineImportEntity<CreateActionPlanInput>({ required: { name: true, title: true } }),
  [ObjectTypes.ASSET]: defineImportEntity<CreateAssetInput>({ required: { name: true }, autoValues: { sourceType: AssetSourceType.IMPORTED } }),
  [ObjectTypes.CHECK_RESULT]: defineImportEntity<CreateCheckResultInput>({ required: { source: true } }),
  [ObjectTypes.CONTACT]: defineImportEntity<CreateContactInput>({ required: {} }),
  [ObjectTypes.CONTROL]: defineImportEntity<CreateControlInput>({ required: { refCode: true }, autoValues: { source: ControlControlSource.IMPORTED }, aliases: CONTROL_ALIASES }),
  [ObjectTypes.ENTITY]: defineImportEntity<CreateEntityInput>({ required: {} }),
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
  [ObjectTypes.SUBSCRIBER]: defineImportEntity<CreateSubscriberInput>({ required: { email: true } }),
  [ObjectTypes.SYSTEM_DETAIL]: defineImportEntity<CreateSystemDetailInput>({ required: { systemName: true } }),
  [ObjectTypes.TASK]: defineImportEntity<CreateTaskInput>({ required: { title: true } }),
  [ObjectTypes.TEMPLATE]: defineImportEntity<CreateTemplateInput>({ required: { jsonconfig: true, name: true } }),
  [ObjectTypes.VULNERABILITY]: defineImportEntity<CreateVulnerabilityInput>({ required: { externalID: true } }),
}

const EMPTY_ENTITY_CONFIG: TImportEntityConfig = { requiredFields: [], autoValues: {}, aliases: {} }

export const getImportEntityConfig = (entityType: ObjectTypes): TImportEntityConfig => IMPORT_ENTITIES[entityType] ?? EMPTY_ENTITY_CONFIG

export const getImportAliases = (entityType: ObjectTypes): Record<string, readonly string[]> => {
  const { aliases } = getImportEntityConfig(entityType)
  const merged: Record<string, readonly string[]> = { ...SHARED_ALIASES }

  Object.entries(aliases).forEach(([field, entityAliases]) => {
    merged[field] = [...(merged[field] ?? []), ...entityAliases]
  })

  return merged
}
