'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { type Value } from 'platejs'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { getColumns } from './columns'
import TableComponent from './table'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { usePlatformsWithFilter } from '@/lib/graphql-hooks/platform'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { SystemDetailSystemSensitivityLevel, type CreateSystemDetailInput, type SystemDetailQuery, type UpdateSystemDetailInput } from '@repo/codegen/src/schema'
import {
  type SystemDetailsNodeNonNull,
  useBulkDeleteSystemDetail,
  useBulkEditSystemDetail,
  useCreateBulkCSVSystemDetail,
  useCreateSystemDetail,
  useSystemDetail,
  useUpdateSystemDetail,
} from '@/lib/graphql-hooks/system-detail'
import { defaultSorting, exportType, objectName, objectType, orderFieldEnum, tableKey, type SystemDetailFieldProps, type SystemDetailSheetConfig, type SystemDetailTablePageConfig } from './types'

const normalizeData = (data: SystemDetailQuery['systemDetail']) => {
  if (!data) {
    return {}
  }

  const normalized = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value]))
  const revisionHistory = Array.isArray(data.revisionHistory) ? (data.revisionHistory[0] as string | undefined) : undefined

  return {
    ...normalized,
    revisionHistory,
  }
}

const normalizeOptionalId = (value: string | null | undefined, emptyValue: null | undefined) => {
  if (!value) {
    return emptyValue
  }

  return value
}

const normalizeDateValue = (value: string | Date | null | undefined, emptyValue: null | undefined) => {
  if (!value) {
    return emptyValue
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}

const SystemDetailPage: React.FC = () => {
  const { form } = useFormSchema()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useSystemDetail(id || undefined)
  const plateEditorHelper = usePlateEditor()

  const getName = (systemDetail: SystemDetailsNodeNonNull) => {
    return systemDetail?.systemName
  }

  const baseUpdateMutation = useUpdateSystemDetail()
  const baseCreateMutation = useCreateSystemDetail()
  const baseBulkDeleteMutation = useBulkDeleteSystemDetail()
  const baseBulkCreateMutation = useCreateBulkCSVSystemDetail()
  const baseBulkEditMutation = useBulkEditSystemDetail()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateSystemDetailInput }) => baseUpdateMutation.mutateAsync({ updateSystemDetailId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateSystemDetailInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkSystemDetail
    },
  }

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input })
      return result
    },
  }

  const { platformsNodes } = usePlatformsWithFilter({})
  const platformOptions = platformsNodes.map((platform) => ({
    value: platform.id,
    label: platform.name,
  }))

  const { programOptions } = useProgramSelect({})
  const sensitivityLevelOptions = enumToOptions(SystemDetailSystemSensitivityLevel)
  const { tagOptions } = useGetTags()

  const enumOpts = {
    sensitivityLevelOptions,
    tagOptions,
    platformOptions,
    programOptions,
  }

  const sheetConfig: SystemDetailSheetConfig = {
    objectType,
    form,
    data: id ? data?.systemDetail : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (formData) => {
      const emptyValue = isCreate ? undefined : null
      const description = formData.description ? await plateEditorHelper.convertToHtml(formData.description as Value) : emptyValue
      const revisionHistoryHtml = formData.revisionHistory ? await plateEditorHelper.convertToHtml(formData.revisionHistory as Value) : ''
      const revisionHistory = revisionHistoryHtml ? [revisionHistoryHtml] : emptyValue

      return {
        ...formData,
        description,
        revisionHistory,
        lastReviewed: normalizeDateValue(formData.lastReviewed, emptyValue),
        platformID: normalizeOptionalId(formData.platformID, emptyValue),
        programID: normalizeOptionalId(formData.programID, emptyValue),
      }
    },
    normalizeData,
    getName,
    renderFields: (props: SystemDetailFieldProps) => getFieldsToRender(props, enumOpts),
  }

  const tableConfig: SystemDetailTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['systemNameContainsFold', 'descriptionContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      return deleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateSystemDetailInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default SystemDetailPage
