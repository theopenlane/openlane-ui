'use client'

import React from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { type ScansNodeNonNull, useScan, useCreateScan, useUpdateScan, useCreateBulkCSVScan, useBulkEditScan, useBulkDeleteScan } from '@/lib/graphql-hooks/scan'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type ScanSheetConfig, type ScanTablePageConfig, type ScanFieldProps, objectType, objectName, tableKey, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { type CreateScanInput, type ScanQuery, ScanScanStatus, ScanScanType, type UpdateScanInput } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ScanAssociationsSection } from '../create/form/fields/association-section'

const normalizeData = (data: ScanQuery['scan']) =>
  normalizeEntityData(data, {
    assignedTo: { user: data?.assignedToUser, group: data?.assignedToGroup, stringValue: data?.assignedTo },
    performedBy: { user: data?.performedByUser, group: data?.performedByGroup, stringValue: data?.performedBy },
    reviewedBy: { user: data?.reviewedByUser, group: data?.reviewedByGroup, stringValue: data?.reviewedBy },
  })

const ScanPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useScan(id || undefined)

  function getName(scan: ScansNodeNonNull) {
    return scan?.target
  }

  const baseUpdateMutation = useUpdateScan()
  const baseCreateMutation = useCreateScan()
  const baseBulkDeleteMutation = useBulkDeleteScan()
  const baseBulkCreateMutation = useCreateBulkCSVScan()
  const baseBulkEditMutation = useBulkEditScan()

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

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkScan.deletedIDs
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

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({
    field: 'environment',
  })

  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({
    field: 'scope',
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

  const enumCreateHandlers = {
    environmentName: createEnvironment,
    scopeName: createScope,
  }

  const sheetConfig: ScanSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.scan : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    normalizeData,
    extraContent: id ? <ScanAssociationsSection scanId={id} /> : undefined,
    buildPayload: async (data) => {
      const { assignedTo, performedBy, reviewedBy, ...rest } = data
      const mode = isCreate ? 'create' : 'update'
      return {
        ...rest,
        ...buildResponsibilityPayload('assignedTo', assignedTo, { mode }),
        ...buildResponsibilityPayload('performedBy', performedBy, { mode }),
        ...buildResponsibilityPayload('reviewedBy', reviewedBy, { mode }),
      }
    },
    getName,
    renderFields: (props: ScanFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
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
    onBulkDelete: async (ids: string[]) => {
      await deleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateScanInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default ScanPage
