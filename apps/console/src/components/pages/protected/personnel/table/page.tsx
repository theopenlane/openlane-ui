'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import { IdentityHolderUserStatus, IdentityHolderIdentityHolderType, UpdateIdentityHolderInput, CreateIdentityHolderInput } from '@repo/codegen/src/schema'
import {
  useUpdateIdentityHolder,
  useCreateIdentityHolder,
  useBulkDeleteIdentityHolder,
  useCreateBulkCSVIdentityHolder,
  useBulkEditIdentityHolder,
  useIdentityHolder,
  IdentityHoldersNodeNonNull,
} from '@/lib/graphql-hooks/identity-holder'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { PersonnelSheetConfig, PersonnelTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting, PersonnelFieldProps } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

const PersonnelPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useIdentityHolder(id || undefined)

  function getName(data: IdentityHoldersNodeNonNull) {
    return data?.fullName
  }

  const baseUpdateMutation = useUpdateIdentityHolder()
  const baseCreateMutation = useCreateIdentityHolder()
  const baseBulkDeleteMutation = useBulkDeleteIdentityHolder()
  const baseBulkCreateMutation = useCreateBulkCSVIdentityHolder()
  const baseBulkEditMutation = useBulkEditIdentityHolder()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateIdentityHolderInput }) => baseUpdateMutation.mutateAsync({ updateIdentityHolderId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateIdentityHolderInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkIdentityHolder.deletedIDs
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

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { field: 'scope' },
  })

  const statusOptions = Object.values(IdentityHolderUserStatus).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const identityHolderTypeOptions = Object.values(IdentityHolderIdentityHolderType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const { tagOptions } = useGetTags()

  const enumOpts = {
    statusOptions,
    identityHolderTypeOptions,
    environmentOptions,
    scopeOptions,
    tagOptions,
  }

  const sheetConfig: PersonnelSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.identityHolder : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => data as UpdateIdentityHolderInput,
    getName,
    renderFields: (props: PersonnelFieldProps) => getFieldsToRender(props, enumOpts),
  }

  const tableConfig: PersonnelTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['fullNameContainsFold', 'emailContainsFold'],
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
    onBulkEdit: async (ids: string[], input: UpdateIdentityHolderInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default PersonnelPage
