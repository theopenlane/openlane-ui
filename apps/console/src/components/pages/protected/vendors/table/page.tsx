'use client'
import React from 'react'
import { CreateEntityInput, EntityOrderField, ExportExportType, UpdateEntityInput } from '@repo/codegen/src/schema'
import { OrderDirection } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import useFormSchema from '../hooks/use-form-schema'
import { useEntity, useUpdateEntity, useCreateEntity, useBulkDeleteEntity } from '@/lib/graphql-hooks/entity'
import { buildPayload } from '../create/utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import NameField from '../create/form/fields/name-field'
import DescriptionField from '../create/form/fields/description-field'
import Properties from '../create/form/fields/properties'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { AdditionalFields } from '../create/form/fields/additional-fields'
import VendorsTable from './table'
import { getVendorColumns } from './columns'
import { breadcrumbs, getFilterFields } from './table-config'

const formId = 'editVendor'

const EntityPage: React.FC = () => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useEntity(id || undefined)

  const baseUpdateMutation = useUpdateEntity()
  const baseCreateMutation = useCreateEntity()
  const baseBulkDeleteMutation = useBulkDeleteEntity()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateEntityInput }) => baseUpdateMutation.mutateAsync({ updateEntityId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (params: { input: CreateEntityInput; entityTypeName: string }) => baseCreateMutation.mutateAsync({ input: params.input, entityTypeName: 'vendor' }),
  }
  const deleteMutation = baseBulkDeleteMutation

  return (
    <GenericTablePage
      objectType={ObjectTypes.ENTITY}
      objectName={ObjectNames.ENTITY}
      tableKey={TableKeyEnum.VENDOR}
      exportType={ExportExportType.ENTITY}
      orderFieldEnum={EntityOrderField}
      defaultSorting={[{ field: EntityOrderField.name, direction: OrderDirection.ASC }]}
      defaultVisibility={{}}
      breadcrumbs={breadcrumbs}
      form={form}
      getColumns={getVendorColumns}
      filterFields={getFilterFields()}
      TableComponent={VendorsTable}
      sheetConfig={{
        objectType: ObjectTypes.ENTITY,
        data: id ? data?.entity : undefined,
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

export default EntityPage
