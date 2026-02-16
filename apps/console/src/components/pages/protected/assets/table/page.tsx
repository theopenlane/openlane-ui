'use client'

import React from 'react'
import { AssetOrderField, ExportExportType, UpdateAssetInput } from '@repo/codegen/src/schema'
import { OrderDirection } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { getAssetColumns } from './columns'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import AssetsTable from './table'
import useFormSchema from '../hooks/use-form-schema'
import { useAsset, useUpdateAsset, useCreateAsset, useBulkDeleteAsset, useCreateBulkCSVAsset } from '@/lib/graphql-hooks/asset'
import { buildPayload } from '../create/utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { visibilityFields, getFilterFields, formId, breadcrumbs, getFieldsToRender } from './table-config'

const AssetPage: React.FC = () => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useAsset(id || undefined)

  const baseUpdateMutation = useUpdateAsset()
  const baseCreateMutation = useCreateAsset()
  const baseBulkDeleteMutation = useBulkDeleteAsset()
  const baseBulkCreateMutation = useCreateBulkCSVAsset()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateAssetInput }) => baseUpdateMutation.mutateAsync({ updateAssetId: params.id, input: params.input }),
  }

  const createMutation = baseCreateMutation
  const deleteMutation = baseBulkDeleteMutation
  const bulkCreateMutation = baseBulkCreateMutation

  return (
    <GenericTablePage
      objectType={ObjectTypes.ASSET}
      objectName={ObjectNames.ASSET}
      tableKey={TableKeyEnum.ASSET}
      exportType={ExportExportType.ASSET}
      orderFieldEnum={AssetOrderField}
      defaultSorting={[{ field: AssetOrderField.name, direction: OrderDirection.ASC }]}
      defaultVisibility={visibilityFields}
      filterFields={getFilterFields()}
      breadcrumbs={breadcrumbs}
      form={form}
      getColumns={getAssetColumns}
      TableComponent={AssetsTable}
      sheetConfig={{
        objectType: ObjectTypes.ASSET,
        data: id ? data?.asset : undefined,
        isFetching: isLoading,
        updateMutation,
        createMutation,
        deleteMutation,
        buildPayload: (data) => buildPayload(data, plateEditorHelper),
        getName: (data) => data?.name,
        formId: formId,
        renderFields: ({ isEditing, isCreate, data, isFormInitialized, internalEditing, setInternalEditing, isEditAllowed, handleUpdateField }) =>
          getFieldsToRender(isEditing, isEditAllowed, isCreate, data, internalEditing, setInternalEditing, handleUpdateField, isFormInitialized),
      }}
      onBulkDelete={async (ids) => {
        await deleteMutation.mutateAsync({ ids })
      }}
      onBulkCreate={async (file) => {
        await bulkCreateMutation.mutateAsync({ input: file })
      }}
    />
  )
}

export default AssetPage
