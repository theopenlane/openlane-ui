'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { breadcrumbs, bulkEditFieldLabels, getFilterFields, getPlatformQuickFilters, visibilityFields } from './table-config'
import { getColumns } from './columns'
import TableComponent from './table'
import { bulkEditFieldSchema, type SystemDetailBulkEditAssociations } from '../hooks/use-form-schema'
import { type CreateSystemDetailInput, type UpdateSystemDetailInput } from '@repo/codegen/src/schema'
import { useBulkEditSystemDetail, useCreateSystemDetail } from '@/lib/graphql-hooks/system-detail'
import { defaultSorting, exportType, objectName, objectType, orderFieldEnum, tableKey, type SystemDetailSheetConfig, type SystemDetailTablePageConfig } from './types'
import { buildAssociationPayload, getAssociationInput } from '@/components/shared/object-association/utils'
import { SYSTEM_DETAIL_ASSOCIATION_KEYS } from '@/components/shared/object-association/association-configs'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { useSystemDetailSheetBase } from '../hooks/use-system-detail-sheet-base'

const SystemDetailPage: React.FC = () => {
  const searchParams = useSearchParams()
  const { enumOpts, hasProgramAccess, sheetBase } = useSystemDetailSheetBase(searchParams.get('id') ?? undefined)
  const { form, deleteMutation } = sheetBase
  const plateEditorHelper = usePlateEditor()
  const baseCreateMutation = useCreateSystemDetail()
  const baseBulkEditMutation = useBulkEditSystemDetail()

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateSystemDetailInput) => baseCreateMutation.mutateAsync({ input }),
  }

  const platformOptions = enumOpts.platformIDsOptions
  const quickFilters = React.useMemo(() => getPlatformQuickFilters(platformOptions), [platformOptions])

  const sheetConfig: SystemDetailSheetConfig = {
    ...sheetBase,
    createMutation,
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
