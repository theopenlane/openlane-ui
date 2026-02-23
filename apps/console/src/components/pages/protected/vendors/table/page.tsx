'use client'

import React from 'react'
import { buildPayload } from '../create/utils'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useSearchParams } from 'next/navigation'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import { EntityEntityStatus, EntityFrequency, UpdateEntityInput, CreateEntityInput } from '@repo/codegen/src/schema'
import { useUpdateEntity, useCreateEntity, useBulkDeleteEntity, useCreateBulkCSVEntity, useBulkEditEntity, EntitiesNodeNonNull } from '@/lib/graphql-hooks/entity'
import { useEntity } from '@/lib/graphql-hooks/entity'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { EntitySheetConfig, EntityTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting, EntityFieldProps } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

const VendorPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useEntity(id || undefined)

  const plateEditorHelper = usePlateEditor()

  function getName(data: EntitiesNodeNonNull) {
    return data?.name
  }

  const baseUpdateMutation = useUpdateEntity()
  const baseCreateMutation = useCreateEntity()
  const baseBulkDeleteMutation = useBulkDeleteEntity()
  const baseBulkCreateMutation = useCreateBulkCSVEntity()
  const baseBulkEditMutation = useBulkEditEntity()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateEntityInput }) => baseUpdateMutation.mutateAsync({ updateEntityId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateEntityInput) => {
      const result = await baseCreateMutation.mutateAsync({ input, entityTypeName: 'vendor' })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkEntity.deletedIDs
    },
  }

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input, entityTypeName: 'vendor' })
      return result
    },
  }

  const bulkEditMutation = baseBulkEditMutation

  const { enumOptions: securityQuestionnaireStatusOptions } = useGetCustomTypeEnums({
    where: { objectType: 'entity', field: 'entitySecurityQuestionnaireStatus' },
  })

  const { enumOptions: sourceTypeOptions } = useGetCustomTypeEnums({
    where: { objectType: 'entity', field: 'entitySourceType' },
  })

  const { enumOptions: relationshipStateOptions } = useGetCustomTypeEnums({
    where: { objectType: 'entity', field: 'relationshipState' },
  })

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { field: 'scope' },
  })

  const reviewFrequencyOptions = Object.values(EntityFrequency).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const entityStatusOptions = Object.values(EntityEntityStatus).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const { tagOptions } = useGetTags()

  const enumOpts = {
    relationshipStateOptions,
    securityQuestionnaireStatusOptions,
    sourceTypeOptions,
    environmentOptions,
    scopeOptions,
    reviewFrequencyOptions,
    entityStatusOptions,
    tagOptions,
  }

  const sheetConfig: EntitySheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.entity : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: (data) => buildPayload(data, plateEditorHelper),
    getName,
    renderFields: (props: EntityFieldProps) => getFieldsToRender(props, enumOpts),
  }

  const tableConfig: EntityTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['displayNameContainsFold', 'descriptionContainsFold'],
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
    onBulkEdit: async (ids: string[], input: UpdateEntityInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default VendorPage
