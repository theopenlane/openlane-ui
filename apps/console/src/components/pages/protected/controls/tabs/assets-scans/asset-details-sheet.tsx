'use client'

import React, { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { type Value } from 'platejs'
import useFormSchema from '@/components/pages/protected/assets/hooks/use-form-schema'
import { type AssetsNodeNonNull, useAsset, useUpdateAsset, useCreateAsset, useGetAssetAssociations, useBulkDeleteAsset } from '@/lib/graphql-hooks/asset'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '@/components/pages/protected/assets/table/table-config'
import { type AssetSheetConfig, type AssetFieldProps, objectType } from '@/components/pages/protected/assets/table/types'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { AssetAssetType, AssetSourceType, type AssetQuery, type CreateAssetInput, type UpdateAssetInput, type GetAssetAssociationsQuery } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { ASSET_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type AssetDetailsSheetProps = {
  queryParamKey: string
}

const normalizeData = (data: AssetQuery['asset']) =>
  normalizeEntityData(data, {
    internalOwner: { user: data?.internalOwnerUser, group: data?.internalOwnerGroup, stringValue: data?.internalOwner },
  })

const AssetDetailsSheet: React.FC<AssetDetailsSheetProps> = ({ queryParamKey }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityId = searchParams.get(queryParamKey)

  const { form } = useFormSchema()
  const { data, isLoading } = useAsset(entityId || undefined)
  const { data: associationsData } = useGetAssetAssociations(entityId || undefined)

  const extractAssociations = useCallback((assocData: GetAssetAssociationsQuery) => {
    const asset = assocData.asset
    return {
      scanIDs: (asset.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      entityIDs: (asset.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      identityHolderIDs: (asset.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      controlIDs: (asset.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, entityId)

  const plateEditorHelper = usePlateEditor()

  const baseUpdateMutation = useUpdateAsset()
  const baseCreateMutation = useCreateAsset()
  const baseBulkDeleteMutation = useBulkDeleteAsset()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateAssetInput }) => baseUpdateMutation.mutateAsync({ updateAssetId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateAssetInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkAsset
    },
  }

  const { enumOptions: accessModelOptions, onCreateOption: createAccessModel } = useCreatableEnumOptions({ objectType: 'asset', field: 'accessModel' })
  const { enumOptions: assetDataClassificationOptions, onCreateOption: createDataClassification } = useCreatableEnumOptions({ objectType: 'asset', field: 'dataClassification' })
  const { enumOptions: assetSubtypeOptions, onCreateOption: createSubtype } = useCreatableEnumOptions({ objectType: 'asset', field: 'subtype' })
  const { enumOptions: criticalityOptions, onCreateOption: createCriticality } = useCreatableEnumOptions({ objectType: 'asset', field: 'criticality' })
  const { enumOptions: encryptionStatusOptions, onCreateOption: createEncryptionStatus } = useCreatableEnumOptions({ objectType: 'asset', field: 'encryptionStatus' })
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const { enumOptions: securityTierOptions, onCreateOption: createSecurityTier } = useCreatableEnumOptions({ objectType: 'asset', field: 'securityTier' })
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

  function getName(d: AssetsNodeNonNull) {
    return d?.name
  }

  const handleClose = () => {
    form.reset()
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  const sheetConfig: AssetSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.asset : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (formData) => {
      const { controlIDs, scanIDs, entityIDs, identityHolderIDs, internalOwner, ...rest } = formData
      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined
      const associationPayload = buildAssociationPayload(ASSET_ASSOCIATION_CONFIG.associationKeys, { controlIDs, scanIDs, entityIDs, identityHolderIDs }, false, initialAssociationsRef.current)
      return {
        ...rest,
        description,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: 'update' }),
      }
    },
    normalizeData,
    getName,
    renderFields: (props: AssetFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  return <GenericDetailsSheet onClose={handleClose} {...sheetConfig} />
}

export default AssetDetailsSheet
