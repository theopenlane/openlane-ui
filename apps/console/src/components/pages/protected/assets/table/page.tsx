'use client'

import React, { useEffect, useRef } from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

import { AssetsNodeNonNull, useAsset, useUpdateAsset, useCreateAsset, useBulkDeleteAsset, useCreateBulkCSVAsset, useBulkEditAsset, useGetAssetAssociations } from '@/lib/graphql-hooks/asset'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { AssetSheetConfig, AssetTablePageConfig, AssetFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from 'platejs'
import { AssetAssetType, AssetSourceType, AssetQuery, CreateAssetInput, UpdateAssetInput } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'

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
  const initialAssociationsRef = useRef<TObjectAssociationMap>({})

  useEffect(() => {
    if (associationsData?.asset) {
      initialAssociationsRef.current = {
        scanIDs: (associationsData.asset.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        entityIDs: (associationsData.asset.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        identityHolderIDs: (associationsData.asset.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        controlIDs: (associationsData.asset.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      }
    }
  }, [associationsData])

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

  const { enumOptions: accessModelOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'accessModel' },
  })

  const { enumOptions: assetDataClassificationOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'dataClassification' },
  })

  const { enumOptions: assetSubtypeOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'subtype' },
  })

  const { enumOptions: criticalityOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'criticality' },
  })

  const { enumOptions: encryptionStatusOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'encryptionStatus' },
  })

  const assetSourceTypeOptions = Object.values(AssetSourceType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const assetTypeOptions = Object.values(AssetAssetType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { field: 'scope' },
  })

  const { enumOptions: securityTierOptions } = useGetCustomTypeEnums({
    where: { objectType: 'asset', field: 'securityTier' },
  })

  const tagOptions = useGetTags()

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

  const sheetConfig: AssetSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.asset : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => {
      const { controlIDs, scanIDs, entityIDs, identityHolderIDs, internalOwner, ...rest } = data
      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined

      const associationFields: Record<string, string[] | undefined> = { controlIDs, scanIDs, entityIDs, identityHolderIDs }
      let associationPayload: Record<string, string[]> = {}

      if (isCreate) {
        Object.entries(associationFields).forEach(([key, ids]) => {
          if (ids?.length) associationPayload[key] = ids
        })
      } else {
        const currentAssociations: TObjectAssociationMap = {}
        Object.entries(associationFields).forEach(([key, ids]) => {
          if (ids) currentAssociations[key] = ids
        })
        if (Object.keys(currentAssociations).length > 0) {
          associationPayload = getAssociationInput(initialAssociationsRef.current, currentAssociations)
        }
      }

      return {
        ...rest,
        description,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: isCreate ? 'create' : 'update' }),
      }
    },
    normalizeData,
    getName,
    renderFields: (props: AssetFieldProps) => getFieldsToRender(props, enumOpts),
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
    onBulkEdit: async (ids: string[], input: UpdateAssetInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default AssetPage
