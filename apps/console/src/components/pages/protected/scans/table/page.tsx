'use client'

import React from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { ScansNodeNonNull, useScan, useCreateScan, useUpdateScan } from '@/lib/graphql-hooks/scan'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { ScanSheetConfig, ScanTablePageConfig, ScanFieldProps, objectType, objectName, tableKey, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { buildPayload } from '../create/utils'
import { CreateScanInput, ScanScanStatus, ScanScanType, UpdateScanInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

const ScanPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useScan(id || undefined)

  function getName(scan: ScansNodeNonNull) {
    return scan?.target
  }

  const baseUpdateMutation = useUpdateScan()
  const baseCreateMutation = useCreateScan()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateScanInput }) => baseUpdateMutation.mutateAsync({ updateScanId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateScanInput) => {
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

  const statusOptions = Object.values(ScanScanStatus).map((value) => ({
    value,
    label: getEnumLabel(value),
  }))

  const scanTypeOptions = Object.values(ScanScanType).map((value) => ({
    value,
    label: getEnumLabel(value),
  }))

  const enumOpts = {
    environmentOptions,
    scopeOptions,
    statusOptions,
    scanTypeOptions,
  }

  const sheetConfig: ScanSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.scan : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: (data) => buildPayload(data),
    getName,
    renderFields: (props: ScanFieldProps) => getFieldsToRender(props, enumOpts),
  }

  const tableConfig: ScanTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['targetContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default ScanPage
