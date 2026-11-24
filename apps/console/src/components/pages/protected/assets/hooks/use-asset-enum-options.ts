'use client'

import { AssetAssetType, AssetSourceType } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { GLOBAL_ENUM_FIELD, useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { type EnumCreateHandlers, type EnumOptions } from '../table/types'

const ASSET_TYPE_OPTIONS = enumToOptions(AssetAssetType)
const ASSET_SOURCE_TYPE_OPTIONS = enumToOptions(AssetSourceType)

export const useAssetEnumOptions = (): { enumOpts: EnumOptions; enumCreateHandlers: EnumCreateHandlers } => {
  const { enumOptions: accessModelOptions, onCreateOption: createAccessModel } = useCreatableEnumOptions({ field: GLOBAL_ENUM_FIELD.accessModel })
  const { enumOptions: assetDataClassificationOptions, onCreateOption: createDataClassification } = useCreatableEnumOptions({ objectType: 'asset', field: 'dataClassification' })
  const { enumOptions: assetSubtypeOptions, onCreateOption: createSubtype } = useCreatableEnumOptions({ objectType: 'asset', field: 'subtype' })
  const { enumOptions: criticalityOptions, onCreateOption: createCriticality } = useCreatableEnumOptions({ field: GLOBAL_ENUM_FIELD.criticality })
  const { enumOptions: encryptionStatusOptions, onCreateOption: createEncryptionStatus } = useCreatableEnumOptions({ field: GLOBAL_ENUM_FIELD.encryptionStatus })
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const { enumOptions: securityTierOptions, onCreateOption: createSecurityTier } = useCreatableEnumOptions({ field: GLOBAL_ENUM_FIELD.securityTier })
  const { tagOptions } = useGetTags()

  return {
    enumOpts: {
      assetTypeOptions: ASSET_TYPE_OPTIONS,
      accessModelOptions,
      assetDataClassificationOptions,
      assetSubtypeOptions,
      assetSourceTypeOptions: ASSET_SOURCE_TYPE_OPTIONS,
      criticalityOptions,
      encryptionStatusOptions,
      environmentOptions,
      scopeOptions,
      securityTierOptions,
      tagOptions,
    },
    enumCreateHandlers: {
      accessModelName: createAccessModel,
      assetDataClassificationName: createDataClassification,
      assetSubtypeName: createSubtype,
      criticalityName: createCriticality,
      encryptionStatusName: createEncryptionStatus,
      environmentName: createEnvironment,
      scopeName: createScope,
      securityTierName: createSecurityTier,
    },
  }
}
