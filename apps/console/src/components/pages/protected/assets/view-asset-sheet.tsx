'use client'

import React from 'react'
import useFormSchema from '@/components/pages/protected/assets/hooks/use-form-schema'
import { type AssetsNodeNonNull, useAsset, useUpdateAsset, useBulkDeleteAsset } from '@/lib/graphql-hooks/asset'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '@/components/pages/protected/assets/table/table-config'
import { type AssetSheetConfig, type AssetFieldProps, objectType } from '@/components/pages/protected/assets/table/types.tsx'
import { AssetAssetType, AssetSourceType, type AssetQuery, type UpdateAssetInput } from '@repo/codegen/src/schema'
import { normalizeEntityData } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatableEnumOptions, GLOBAL_ENUM_FIELD } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { ASSET_UPDATE_FIELDS } from '@/components/pages/protected/assets/hooks/asset-update-fields'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type Props = {
  entityId: string | null
  onClose: () => void
}

const normalizeData = (data: AssetQuery['asset']) =>
  normalizeEntityData(data, {
    internalOwner: { personnel: data?.internalOwnerIdentityHolder, user: data?.internalOwnerUser, group: data?.internalOwnerGroup, stringValue: data?.internalOwner },
  })

const ViewAssetSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useAsset(entityId || undefined)

  const baseUpdateMutation = useUpdateAsset()
  const baseBulkDeleteMutation = useBulkDeleteAsset()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateAssetInput }) => baseUpdateMutation.mutateAsync({ updateAssetId: params.id, input: params.input }),
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkAsset
    },
  }

  const { enumOptions: accessModelOptions, onCreateOption: createAccessModel } = useCreatableEnumOptions({ field: GLOBAL_ENUM_FIELD.accessModel })
  const { enumOptions: assetDataClassificationOptions, onCreateOption: createDataClassification } = useCreatableEnumOptions({ objectType: 'asset', field: 'dataClassification' })
  const { enumOptions: assetSubtypeOptions, onCreateOption: createSubtype } = useCreatableEnumOptions({ objectType: 'asset', field: 'subtype' })
  const { enumOptions: criticalityOptions, onCreateOption: createCriticality } = useCreatableEnumOptions({ field: GLOBAL_ENUM_FIELD.criticality })
  const { enumOptions: encryptionStatusOptions, onCreateOption: createEncryptionStatus } = useCreatableEnumOptions({ field: GLOBAL_ENUM_FIELD.encryptionStatus })
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const { enumOptions: securityTierOptions, onCreateOption: createSecurityTier } = useCreatableEnumOptions({ field: GLOBAL_ENUM_FIELD.securityTier })
  const tagOptions = useGetTags()

  const assetSourceTypeOptions = Object.values(AssetSourceType).map((value) => ({ value, label: getEnumLabel(value as string) }))
  const assetTypeOptions = Object.values(AssetAssetType).map((value) => ({ value, label: getEnumLabel(value as string) }))

  const enumOpts = {
    assetTypeOptions,
    accessModelOptions,
    assetDataClassificationOptions,
    assetSubtypeOptions,
    assetSourceTypeOptions,
    criticalityOptions,
    encryptionStatusOptions,
    environmentOptions,
    scopeOptions,
    securityTierOptions,
    tagOptions: tagOptions.tagOptions,
  }

  const enumCreateHandlers = {
    accessModelName: createAccessModel,
    assetDataClassificationName: createDataClassification,
    assetSubtypeName: createSubtype,
    criticalityName: createCriticality,
    encryptionStatusName: createEncryptionStatus,
    environmentName: createEnvironment,
    scopeName: createScope,
    securityTierName: createSecurityTier,
  }

  const getName = (d: AssetsNodeNonNull) => {
    return d?.name
  }

  const sheetConfig: AssetSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.asset : undefined,
    isFetching: isLoading,
    updateMutation,
    deleteMutation,
    updateFields: ASSET_UPDATE_FIELDS,
    normalizeData,
    getName,
    renderFields: (props: AssetFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewAssetSheet
