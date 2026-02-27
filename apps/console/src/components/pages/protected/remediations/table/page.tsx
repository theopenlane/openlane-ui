'use client'

import React from 'react'
import useFormSchema from '../hooks/use-form-schema'
import { RemediationsNodeNonNull, useRemediation, useCreateRemediation, useUpdateRemediation, useDeleteRemediation, useCreateBulkCSVRemediation } from '@/lib/graphql-hooks/remediation'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { RemediationSheetConfig, RemediationTablePageConfig, RemediationFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { buildPayload } from '../create/utils'
import { CreateRemediationInput, UpdateRemediationInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'

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
  const baseDeleteMutation = useDeleteRemediation()
  const baseBulkCreateMutation = useCreateBulkCSVRemediation()

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

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { field: 'scope' },
  })

  const enumOpts = {
    environmentOptions,
    scopeOptions,
  }

  const sheetConfig: RemediationSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.remediation : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: (data) => buildPayload(data),
    getName,
    renderFields: (props: RemediationFieldProps) => getFieldsToRender(props, enumOpts),
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
      await Promise.all(ids.map((remediationId) => baseDeleteMutation.mutateAsync({ deleteRemediationId: remediationId })))
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default RemediationPage
