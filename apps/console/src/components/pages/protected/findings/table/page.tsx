'use client'

import React, { useState } from 'react'
import { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { useCreateBulkCSVFinding, useBulkEditFinding, useBulkDeleteFinding } from '@/lib/graphql-hooks/finding'
import { useSearchParams, useRouter } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFilterFields, visibilityFields } from './table-config'
import { type FindingTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { type UpdateFindingInput, FindingSecurityLevel } from '@repo/codegen/src/schema'
import { useFindingSheetConfig } from '../hooks/use-finding-sheet-config'
import TaskDetailsSheet from '../../tasks/create-task/sidebar/task-details-sheet'
import ViewFindingSheet from '../view-finding-sheet'
import { FindingSeverityChart } from '@/components/shared/severity-chart/severity-chart'

const DEFAULT_FILTER_VALUES = { open: true }

const FindingPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const [selectedSeverity, setSelectedSeverity] = useState<'critical' | 'high' | 'medium' | 'low' | null>(null)

  const { enumOpts, form, ...sheetConfig } = useFindingSheetConfig(null, isCreate)

  const handleCloseViewSheet = () => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    newSearchParams.delete('trackRemediation')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const baseBulkCreateMutation = useCreateBulkCSVFinding()
  const baseBulkDeleteMutation = useBulkDeleteFinding()
  const baseBulkEditMutation = useBulkEditFinding()

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => baseBulkCreateMutation.mutateAsync({ input: params.input }),
  }

  const severityWhereFilter = selectedSeverity
    ? { securityLevelIn: [FindingSecurityLevel[selectedSeverity.toUpperCase() as keyof typeof FindingSecurityLevel]], findingStatusNameIn: ['Open', 'In Progress', 'Triaged'] }
    : undefined

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
      const result = await baseBulkDeleteMutation.mutateAsync({ ids })
      return result.deleteBulkFinding
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateFindingInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
    additionalWhereFilter: severityWhereFilter,
    defaultFilterValues: DEFAULT_FILTER_VALUES,
    beforeTable: (
      <>
        <FindingSeverityChart selectedSeverity={selectedSeverity} onSeveritySelect={setSelectedSeverity} />
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
