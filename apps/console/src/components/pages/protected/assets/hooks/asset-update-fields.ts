import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { associationsInput, dateOrClear, isEmptyInputValue, orClear, richTextOrClear, type TFieldMappers, passthrough, toInlineInput } from '@/hooks/useDirtyInput'
import { responsibilityInput, responsibilityTargetFor } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { type AssetFormData } from './use-form-schema'

export const ASSET_INTERNAL_OWNER = responsibilityTargetFor<UpdateAssetInput>()('internalOwner')

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

const inlineCostInput = (cost: UpdateAssetInput['estimatedMonthlyCost']): UpdateAssetInput => {
  if (cost === undefined) return {}
  if (isEmptyInputValue(cost)) return { clearEstimatedMonthlyCost: true }
  const value = Number(cost)
  if (!Number.isFinite(value)) throw new UserFacingError('Enter the cost as a number, such as 1240.50.')
  return { estimatedMonthlyCost: value }
}

export const toAssetInlineInput = ({ estimatedMonthlyCost, ...input }: UpdateAssetInput): UpdateAssetInput => ({
  ...toInlineInput<AssetFormData, UpdateAssetInput>(input, ASSET_UPDATE_FIELDS),
  ...inlineCostInput(estimatedMonthlyCost),
})
