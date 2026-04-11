'use client'

import React, { useCallback, useMemo } from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type AssetsNodeNonNull, useAsset, useUpdateAsset, useCreateAsset, useBulkDeleteAsset, useCreateBulkCSVAsset, useBulkEditAsset, useGetAssetAssociations } from '@/lib/graphql-hooks/asset'
import { useEntitiesWithFilter } from '@/lib/graphql-hooks/entity'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type AssetSheetConfig, type AssetTablePageConfig, type AssetFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import { AssetAssetType, AssetSourceType, type AssetQuery, type CreateAssetInput, type UpdateAssetInput, type GetAssetAssociationsQuery } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { ASSET_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const normalizeData = (data: AssetQuery['asset']) =>
  normalizeEntityData(data, {
    internalOwner: { user: data?.internalOwnerUser, group: data?.internalOwnerGroup, stringValue: data?.internalOwner },
  })

const AssetPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useAsset(id || undefined)
  const { data: associationsData } = useGetAssetAssociations(id || undefined)
  const extractAssociations = useCallback((assocData: GetAssetAssociationsQuery) => {
    const asset = assocData.asset
    return {
      scanIDs: (asset.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      entityIDs: (asset.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      identityHolderIDs: (asset.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      controlIDs: (asset.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (asset.subcontrols?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      internalPolicyIDs: (asset.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, id)

  const plateEditorHelper = usePlateEditor()

  function getName(data: AssetsNodeNonNull) {
    return data?.name
  }

  const baseUpdateMutation = useUpdateAsset()
  const baseCreateMutation = useCreateAsset()
  const baseBulkDeleteMutation = useBulkDeleteAsset()
  const baseBulkCreateMutation = useCreateBulkCSVAsset()
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

      return result.deleteBulkAsset.deletedIDs
    },
  }

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input })
      return result
    },
  }

  const bulkEditMutation = baseBulkEditMutation

  const { enumOptions: accessModelOptions, onCreateOption: createAccessModel } = useCreatableEnumOptions({
    field: 'accessModel',
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
    field: 'criticality',
  })

  const { enumOptions: encryptionStatusOptions, onCreateOption: createEncryptionStatus } = useCreatableEnumOptions({
    field: 'encryptionStatus',
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
    field: 'securityTier',
  })

  const tagOptions = useGetTags()

  const { entitiesNodes: vendorNodes } = useEntitiesWithFilter({
    where: { hasEntityTypeWith: [{ name: 'vendor' }] },
  })
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
      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined
      const associationPayload = buildAssociationPayload(
        ASSET_ASSOCIATION_CONFIG.associationKeys,
        { controlIDs, subcontrolIDs, internalPolicyIDs, scanIDs, entityIDs, identityHolderIDs },
        isCreate,
        initialAssociationsRef.current,
      )

      return {
        ...rest,
        description,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: isCreate ? 'create' : 'update' }),
      }
    },
    normalizeData,
    getName,
    renderFields: (props: AssetFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
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
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      await deleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateAssetInput & { vendorIDs?: string[] }) => {
      const { vendorIDs, ...rest } = input
      const payload: UpdateAssetInput = {
        ...rest,
        ...(vendorIDs && vendorIDs.length > 0 ? { addEntityIDs: vendorIDs } : {}),
      }
      await bulkEditMutation.mutateAsync({ ids, input: payload })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    bulkEditFieldLabels: { vendorIDs: 'Vendors' },
    enumOpts,
    responsibilityFields: {
      internalOwner: { fieldBaseName: 'internalOwner' },
    },
  }

  return <GenericTablePage {...tableConfig} />
}

export default AssetPage
