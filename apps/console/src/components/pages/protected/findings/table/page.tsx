'use client'

import React from 'react'
import useFormSchema from '../hooks/use-form-schema'
import { FindingsNodeNonNull, useFinding, useCreateFinding, useUpdateFinding, useDeleteFinding } from '@/lib/graphql-hooks/finding'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { FindingSheetConfig, FindingTablePageConfig, FindingFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { buildPayload } from '../create/utils'
import { CreateFindingInput, UpdateFindingInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'

const FindingPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useFinding(id || undefined)

  function getName(finding: FindingsNodeNonNull) {
    return finding?.displayName || finding?.displayID || finding?.externalID
  }

  const baseUpdateMutation = useUpdateFinding()
  const baseCreateMutation = useCreateFinding()
  const baseDeleteMutation = useDeleteFinding()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateFindingInput }) => baseUpdateMutation.mutateAsync({ updateFindingId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateFindingInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
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

  const sheetConfig: FindingSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.finding : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: (data) => buildPayload(data),
    getName,
    renderFields: (props: FindingFieldProps) => getFieldsToRender(props, enumOpts),
  }

  const tableConfig: FindingTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['displayNameContainsFold', 'descriptionContainsFold', 'externalIDContainsFold', 'categoryContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      await Promise.all(ids.map((findingId) => baseDeleteMutation.mutateAsync({ deleteFindingId: findingId })))
    },
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default FindingPage
