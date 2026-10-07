'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { breadcrumbs, bulkEditFieldLabels, getFieldsToRender, getFilterFields, getPlatformQuickFilters, visibilityFields } from './table-config'
import { getColumns } from './columns'
import TableComponent from './table'
import useFormSchema, { bulkEditFieldSchema, type SystemDetailBulkEditAssociations, type SystemDetailFormData } from '../hooks/use-form-schema'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { usePlatformSelect } from '@/lib/graphql-hooks/platform'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { SystemDetailSystemSensitivityLevel, type CreateSystemDetailInput, type SystemDetailQuery, type UpdateSystemDetailInput } from '@repo/codegen/src/schema'
import { type SystemDetailsNodeNonNull, useBulkDeleteSystemDetail, useBulkEditSystemDetail, useCreateSystemDetail, useSystemDetail, useUpdateSystemDetail } from '@/lib/graphql-hooks/system-detail'
import { defaultSorting, exportType, objectName, objectType, orderFieldEnum, tableKey, type SystemDetailFieldProps, type SystemDetailSheetConfig, type SystemDetailTablePageConfig } from './types'
import { getEdgeIds, buildAssociationPayload, getAssociationInput } from '@/components/shared/object-association/utils'
import { SYSTEM_DETAIL_ASSOCIATION_KEYS } from '@/components/shared/object-association/association-configs'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { associationsInput, dateOrClear, orClear, richTextOrClear, type TFieldMappers } from '@/hooks/useDirtyInput'

const normalizeData = (data: SystemDetailQuery['systemDetail']) => {
  if (!data) {
    return {}
  }

  const normalized = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value]))
  const revisionHistory = Array.isArray(data.revisionHistory) ? (data.revisionHistory[0] as string | undefined) : undefined

  return {
    ...normalized,
    revisionHistory,
    platformIDs: getEdgeIds(data.platforms?.edges),
    programIDs: getEdgeIds(data.programs?.edges),
  }
}

const SYSTEM_DETAIL_UPDATE_FIELDS = {
  description: richTextOrClear('clearDescription'),
  revisionHistory: async (value, _values, { converter }) => {
    const revisionHistory = await plateToHtmlOrNull(value, converter)
    return revisionHistory ? { revisionHistory: [revisionHistory] } : { clearRevisionHistory: true }
  },
  authorizationBoundary: orClear('clearAuthorizationBoundary'),
  sensitivityLevel: orClear('clearSensitivityLevel'),
  lastReviewed: dateOrClear('clearLastReviewed'),
  tags: orClear('clearTags'),
  platformIDs: associationsInput('platformIDs'),
  programIDs: associationsInput('programIDs'),
} satisfies TFieldMappers<SystemDetailFormData, UpdateSystemDetailInput>

const SystemDetailPage: React.FC = () => {
  const { form } = useFormSchema()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { data, isLoading } = useSystemDetail(id || undefined)
  const plateEditorHelper = usePlateEditor()

  const getName = (systemDetail: SystemDetailsNodeNonNull) => {
    return systemDetail?.systemName
  }

  const baseUpdateMutation = useUpdateSystemDetail()
  const baseCreateMutation = useCreateSystemDetail()
  const baseBulkDeleteMutation = useBulkDeleteSystemDetail()
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

  const { platformOptions } = usePlatformSelect({})
  const { programOptions, hasProgramAccess } = useProgramSelect()
  const sensitivityLevelOptions = enumToOptions(SystemDetailSystemSensitivityLevel)
  const { tagOptions } = useGetTags()

  const enumOpts = {
    sensitivityLevelOptions,
    tagOptions,
    platformIDsOptions: platformOptions,
    programIDsOptions: programOptions,
  }

  const quickFilters = React.useMemo(() => getPlatformQuickFilters(platformOptions), [platformOptions])

  const sheetConfig: SystemDetailSheetConfig = {
    objectType,
    form,
    data: id ? data?.systemDetail : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (formData) => {
      const description = (await plateToHtmlOrNull(formData.description, plateEditorHelper)) ?? undefined
      const revisionHistoryHtml = await plateToHtmlOrNull(formData.revisionHistory, plateEditorHelper)
      const { platformIDs, programIDs, ...rest } = formData

      return {
        ...rest,
        description,
        revisionHistory: revisionHistoryHtml ? [revisionHistoryHtml] : undefined,
        lastReviewed: formData.lastReviewed instanceof Date ? formData.lastReviewed.toISOString() : formData.lastReviewed || undefined,
        ...buildAssociationPayload(SYSTEM_DETAIL_ASSOCIATION_KEYS, { platformIDs, programIDs }, true, {}),
      }
    },
    updateFields: SYSTEM_DETAIL_UPDATE_FIELDS,
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
    filterFields: getFilterFields(enumOpts, hasProgramAccess),
    searchFields: ['systemNameContainsFold', 'descriptionContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      return deleteMutation.mutateAsync({ ids })
    },
    onBulkEdit: async (ids: string[], input: UpdateSystemDetailInput & SystemDetailBulkEditAssociations) => {
      const { platformIDs, programIDs, ...rest } = input
      const payload: UpdateSystemDetailInput = { ...rest, ...getAssociationInput({}, { platformIDs, programIDs }) }
      const result = await baseBulkEditMutation.mutateAsync({ ids, input: payload })
      return result.updateBulkSystemDetail
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    bulkEditFieldLabels,
    quickFilters,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default SystemDetailPage
