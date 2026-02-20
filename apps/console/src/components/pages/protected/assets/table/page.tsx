'use client'

import React from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

import { AssetsNodeNonNull, useAsset, useUpdateAsset, useCreateAsset, useBulkDeleteAsset, useCreateBulkCSVAsset, useBulkEditAsset } from '@/lib/graphql-hooks/asset'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { AssetSheetConfig, AssetTablePageConfig, AssetFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { buildPayload } from '../create/utils'
import { AssetAssetType, AssetSourceType, UpdateAssetInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

const AssetPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useAsset(id || undefined)

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

  const createMutation = baseCreateMutation

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkAsset.deletedIDs
    },
  }
  const bulkCreateMutation = baseBulkCreateMutation
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
    buildPayload: (data) => buildPayload(data, plateEditorHelper),
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
