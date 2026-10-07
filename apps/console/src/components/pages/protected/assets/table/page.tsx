'use client'

import React, { useMemo, useState } from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type AssetsNodeNonNull, useAsset, useUpdateAsset, useCreateAsset, useBulkDeleteAsset, useBulkEditAsset } from '@/lib/graphql-hooks/asset'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type AssetSheetConfig, type AssetTablePageConfig, type AssetFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { AssetAssetType, AssetSourceType, type AssetQuery, type CreateAssetInput, type UpdateAssetInput } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatableEnumOptions, GLOBAL_ENUM_FIELD } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { ASSET_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { MergeRecordsSheet } from '@/components/shared/merge-records/merge-records-sheet'
import { mergeMenuAction } from '@/components/shared/crud-base/slideout-header'
import { assetMergeConfig } from '@/components/shared/merge-records/configs/asset-merge-config'
import { useCanEditObject } from '@/components/shared/crud-base/use-object-permission'
import { ASSET_UPDATE_FIELDS } from '../hooks/asset-update-fields'

const normalizeData = (data: AssetQuery['asset']) =>
  normalizeEntityData(data, {
    internalOwner: {
      personnel: data?.internalOwnerIdentityHolder,
      user: data?.internalOwnerUser,
      group: data?.internalOwnerGroup,
      stringValue: data?.internalOwner,
    },
  })

const AssetPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [isMergeOpen, setIsMergeOpen] = useState(false)
  const isCreate = searchParams.get('create') === 'true'
  const scanId = searchParams.get('scanId')
  const { data, isLoading } = useAsset(id || undefined)
  const canEditAsset = useCanEditObject(objectType, id)

  const plateEditorHelper = usePlateEditor()

  const getName = (data: AssetsNodeNonNull) => {
    return data?.name
  }

  const baseUpdateMutation = useUpdateAsset()
  const baseCreateMutation = useCreateAsset()
  const baseBulkDeleteMutation = useBulkDeleteAsset()
  const baseBulkEditMutation = useBulkEditAsset()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateAssetInput }) => baseUpdateMutation.mutateAsync({ updateAssetId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateAssetInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkAsset
    },
  }

  const bulkEditMutation = baseBulkEditMutation

  const { enumOptions: accessModelOptions, onCreateOption: createAccessModel } = useCreatableEnumOptions({
    field: GLOBAL_ENUM_FIELD.accessModel,
  })

  const { enumOptions: assetDataClassificationOptions, onCreateOption: createDataClassification } = useCreatableEnumOptions({
    objectType: ObjectTypes.ASSET.toLowerCase(),
    field: 'dataClassification',
  })

  const { enumOptions: assetSubtypeOptions, onCreateOption: createSubtype } = useCreatableEnumOptions({
    objectType: ObjectTypes.ASSET.toLowerCase(),
    field: 'subtype',
  })

  const { enumOptions: criticalityOptions, onCreateOption: createCriticality } = useCreatableEnumOptions({
    field: GLOBAL_ENUM_FIELD.criticality,
  })

  const { enumOptions: encryptionStatusOptions, onCreateOption: createEncryptionStatus } = useCreatableEnumOptions({
    field: GLOBAL_ENUM_FIELD.encryptionStatus,
  })

  const assetSourceTypeOptions = Object.values(AssetSourceType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const assetTypeOptions = Object.values(AssetAssetType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({
    field: 'environment',
  })

  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({
    field: 'scope',
  })

  const { enumOptions: securityTierOptions, onCreateOption: createSecurityTier } = useCreatableEnumOptions({
    field: GLOBAL_ENUM_FIELD.securityTier,
  })

  const tagOptions = useGetTags()

  const { vendorNodes } = useVendorsWithFilter({})
  const vendorIDsOptions = useMemo(() => vendorNodes.map((v) => ({ value: v.id, label: v.displayName ?? v.name ?? v.id })), [vendorNodes])

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
    vendorIDsOptions,
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

  const sheetConfig: AssetSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.asset : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (data) => {
      const { controlIDs, subcontrolIDs, internalPolicyIDs, scanIDs, entityIDs, identityHolderIDs, internalOwner, ...rest } = data
      const description = (await plateToHtmlOrNull(rest.description, plateEditorHelper)) ?? undefined
      const associationPayload = buildAssociationPayload(ASSET_ASSOCIATION_CONFIG.associationKeys, { controlIDs, subcontrolIDs, internalPolicyIDs, scanIDs, entityIDs, identityHolderIDs }, true, {})

      return {
        ...rest,
        description,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: 'create' }),
      }
    },
    updateFields: ASSET_UPDATE_FIELDS,
    normalizeData,
    getName,
    renderFields: (props: AssetFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
    extraMenuActions: id && !isCreate && canEditAsset ? [mergeMenuAction(() => setIsMergeOpen(true))] : undefined,
  }

  const tableConfig: AssetTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['nameContainsFold', 'descriptionContainsFold'],
    additionalWhereFilter: scanId ? { hasScansWith: [{ id: scanId }] } : undefined,
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      return deleteMutation.mutateAsync({ ids })
    },
    onBulkEdit: async (ids: string[], input: UpdateAssetInput & { vendorIDs?: string[] }) => {
      const { vendorIDs, ...rest } = input
      const payload: UpdateAssetInput = {
        ...rest,
        ...(vendorIDs && vendorIDs.length > 0 ? { addEntityIDs: vendorIDs } : {}),
      }
      const result = await bulkEditMutation.mutateAsync({ ids, input: payload })
      return result.updateBulkAsset
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    bulkEditFieldLabels: { vendorIDs: 'Vendors' },
    enumOpts,
    responsibilityFields: {
      internalOwner: { fieldBaseName: 'internalOwner' },
    },
  }

  return (
    <>
      <GenericTablePage {...tableConfig} />
      {id && canEditAsset && <MergeRecordsSheet open={isMergeOpen} onOpenChange={setIsMergeOpen} config={assetMergeConfig} primaryId={id} />}
    </>
  )
}

export default AssetPage
