import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { associationsInput, dateOrClear, orClear, richTextOrClear, type TFieldMappers, passthrough } from '@/hooks/useDirtyInput'
import { responsibilityInput, responsibilityTargetFor } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { type AssetFormData } from './use-form-schema'

const ASSET_INTERNAL_OWNER = responsibilityTargetFor<UpdateAssetInput>()('internalOwner')

export const ASSET_UPDATE_FIELDS = {
  description: richTextOrClear('clearDescription'),
  displayName: orClear('clearDisplayName'),
  tags: orClear('clearTags'),
  accessModelName: orClear('clearAccessModelName'),
  assetDataClassificationName: orClear('clearAssetDataClassificationName'),
  assetSubtypeName: orClear('clearAssetSubtypeName'),
  criticalityName: orClear('clearCriticalityName'),
  encryptionStatusName: orClear('clearEncryptionStatusName'),
  environmentName: orClear('clearEnvironmentName'),
  scopeName: orClear('clearScopeName'),
  securityTierName: orClear('clearSecurityTierName'),
  costCenter: orClear('clearCostCenter'),
  cpe: orClear('clearCpe'),
  containsPii: orClear('clearContainsPii'),
  estimatedMonthlyCost: orClear('clearEstimatedMonthlyCost'),
  identifier: orClear('clearIdentifier'),
  physicalLocation: orClear('clearPhysicalLocation'),
  purchaseDate: dateOrClear('clearPurchaseDate'),
  region: orClear('clearRegion'),
  sourceIdentifier: orClear('clearSourceIdentifier'),
  website: orClear('clearWebsite'),
  internalOwner: responsibilityInput(ASSET_INTERNAL_OWNER),
  controlIDs: associationsInput('controlIDs'),
  subcontrolIDs: associationsInput('subcontrolIDs'),
  internalPolicyIDs: associationsInput('internalPolicyIDs'),
  scanIDs: associationsInput('scanIDs'),
  entityIDs: associationsInput('entityIDs'),
  identityHolderIDs: associationsInput('identityHolderIDs'),
  assetType: passthrough,
  name: passthrough,
  sourceType: passthrough,
} satisfies TFieldMappers<AssetFormData, UpdateAssetInput>
