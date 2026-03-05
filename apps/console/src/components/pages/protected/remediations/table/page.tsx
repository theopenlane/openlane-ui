'use client'

import React from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import {
  RemediationsNodeNonNull,
  useRemediation,
  useCreateRemediation,
  useUpdateRemediation,
  useCreateBulkCSVRemediation,
  useBulkEditRemediation,
  useBulkDeleteRemediation,
} from '@/lib/graphql-hooks/remediation'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { RemediationSheetConfig, RemediationTablePageConfig, RemediationFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { CreateRemediationInput, UpdateRemediationInput } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'

const RemediationPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useRemediation(id || undefined)

  function getName(remediation: RemediationsNodeNonNull) {
    return remediation?.title || remediation?.displayID || remediation?.externalID
  }

  const baseUpdateMutation = useUpdateRemediation()
  const baseCreateMutation = useCreateRemediation()
  const baseBulkCreateMutation = useCreateBulkCSVRemediation()
  const baseBulkDeleteMutation = useBulkDeleteRemediation()
  const baseBulkEditMutation = useBulkEditRemediation()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateRemediationInput }) => baseUpdateMutation.mutateAsync({ updateRemediationId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateRemediationInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input })
      return result
    },
  }

  const { data: orgPermission } = useOrganizationRoles()
  const canEditOrg = canEdit(orgPermission?.roles)

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({
    field: 'environment',
    isEditAllowed: canEditOrg,
  })

  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({
    field: 'scope',
    isEditAllowed: canEditOrg,
  })

  const enumOpts = {
    environmentOptions,
    scopeOptions,
  }

  const enumCreateHandlers = {
    environmentName: createEnvironment,
    scopeName: createScope,
  }

  const sheetConfig: RemediationSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.remediation : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => data,
    getName,
    renderFields: (props: RemediationFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  const tableConfig: RemediationTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['titleContainsFold', 'summaryContainsFold', 'externalIDContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      await baseBulkDeleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateRemediationInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default RemediationPage
