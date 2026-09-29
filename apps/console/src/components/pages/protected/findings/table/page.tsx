'use client'

import React from 'react'
import { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { useBulkEditFinding, useBulkDeleteFinding } from '@/lib/graphql-hooks/finding'
import { useSearchParams, useRouter } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFilterFields, visibilityFields } from './table-config'
import { type FindingTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { FINDING_INTERNAL_OWNER } from '../finding-responsibility'
import { useFindingSheetConfig } from '../hooks/use-finding-sheet-config'
import TaskDetailsSheet from '../../tasks/create-task/sidebar/task-details-sheet'
import ViewFindingSheet from '../view-finding-sheet'
import { FindingSeverityChart } from '@/components/shared/severity-chart/severity-chart'
import { useSlaQuickFilters } from '@/hooks/useSla'

const DEFAULT_FILTER_VALUES = { open: true }

const FindingPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const scanId = searchParams.get('scanId')

  const { enumOpts, form, ...sheetConfig } = useFindingSheetConfig(null, isCreate)

  const quickFilters = useSlaQuickFilters()

  const handleCloseViewSheet = () => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    newSearchParams.delete('trackRemediation')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const baseBulkDeleteMutation = useBulkDeleteFinding()
  const baseBulkEditMutation = useBulkEditFinding()

  const tableConfig: FindingTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    additionalWhereFilter: scanId ? { hasScansWith: [{ id: scanId }] } : undefined,
    quickFilters,
    searchFields: ['displayNameContainsFold', 'descriptionContainsFold', 'externalIDContainsFold', 'categoryContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids })
      return result.deleteBulkFinding
    },
    onBulkEdit: async (ids: string[], input: UpdateFindingInput) => {
      const result = await baseBulkEditMutation.mutateAsync({ ids, input })
      return result.updateBulkFinding
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    responsibilityFields: { internalOwner: FINDING_INTERNAL_OWNER },
    enumOpts,
    defaultFilterValues: DEFAULT_FILTER_VALUES,
    beforeTable: (
      <>
        <FindingSeverityChart tableKey={tableKey} />
      </>
    ),
  }

  return (
    <>
      <GenericTablePage {...tableConfig} />
      <ViewFindingSheet entityId={isCreate ? null : id} onClose={handleCloseViewSheet} />
      <TaskDetailsSheet queryParamKey="taskId" />
    </>
  )
}

export default FindingPage
