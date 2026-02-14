'use client'

import React from 'react'
import { AssetOrderField, ExportExportType } from '@repo/codegen/src/schema'
import { OrderDirection } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { getAssetColumns } from './columns'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import AssetsTable from './table'
import useFormSchema from '../hooks/use-form-schema'
import { useAsset, useUpdateAsset, useCreateAsset, useBulkDeleteAsset } from '@/lib/graphql-hooks/asset'
import { buildPayload } from '../create/utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import NameField from '../create/form/fields/name-field'
import DescriptionField from '../create/form/fields/description-field'
import Properties from '../create/form/fields/properties'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { AdditionalFields } from '../create/form/fields/additional-fields'

const formId = 'edit' + ObjectNames.ASSET

const AssetPage: React.FC = () => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useAsset(id || undefined)

  const baseUpdateMutation = useUpdateAsset()
  const baseCreateMutation = useCreateAsset()
  const baseBulkDeleteMutation = useBulkDeleteAsset()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: any }) => baseUpdateMutation.mutateAsync({ updateAssetId: params.id, input: params.input }),
  }

  const createMutation = baseCreateMutation
  const deleteMutation = baseBulkDeleteMutation

  return (
    <GenericTablePage
      objectType={ObjectTypes.ASSET}
      objectName={ObjectNames.ASSET}
      tableKey={TableKeyEnum.ASSET}
      exportType={ExportExportType.ASSET}
      orderFieldEnum={AssetOrderField}
      defaultSorting={[{ field: AssetOrderField.name, direction: OrderDirection.ASC }]}
      defaultVisibility={{
        id: false,
        name: true,
        description: true,
        accessModelName: true,
        assetDataClassificationName: true,
        assetSubtypeName: true,
        assetType: true,
        costCenter: false,
        cpe: false,
        criticalityName: true,
        containsPii: true,
        encryptionStatusName: true,
        environmentName: true,
        estimatedMonthlyCost: false,
        identifier: false,
        physicalLocation: false,
        purchaseDate: false,
        region: false,
        scopeName: true,
        securityTierName: true,
        sourceIdentifier: true,
        sourceType: true,
        tags: true,
        updatedAt: true,
        updatedBy: true,
        website: false,
      }}
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Registry', href: '/assets' },
        { label: 'Assets', href: '/assets' },
      ]}
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
        renderFields: ({ isEditing, isCreate, data, isFormInitialized, internalEditing, setInternalEditing, isEditAllowed }) => (
          <>
            <NameField isEditing={isEditing} isEditAllowed={isEditAllowed} initialValue={isCreate ? '' : data?.name ?? ''} internalEditing={internalEditing} setInternalEditing={setInternalEditing} />
            <DescriptionField
              key={isCreate ? 'create-description' : `${id}-description`}
              isEditing={isEditing}
              isCreate={isCreate}
              initialValue={isCreate ? '' : data?.description ?? ''}
              isFormInitialized={isFormInitialized}
            />
            <AdditionalFields isEditing={isEditing} isEditAllowed={isEditAllowed} data={data} internalEditing={internalEditing} setInternalEditing={setInternalEditing} />
            <Properties isEditing={isEditing} data={data} internalEditing={internalEditing} setInternalEditing={setInternalEditing} isEditAllowed={isEditAllowed} />
          </>
        ),
      }}
      onBulkDelete={async (ids) => {
        await deleteMutation.mutateAsync({ ids })
      }}
    />
  )
}

export default AssetPage
