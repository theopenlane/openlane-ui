'use client'

import React, { useEffect } from 'react'
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
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { FindingSeverityChart } from '@/components/shared/severity-chart/severity-chart'
import { useSlaQuickFilters } from '@/hooks/useSla'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TBulkEditAssociations } from '@/components/shared/crud-base/dialog/bulk-edit'

const DEFAULT_FILTER_VALUES = { open: true }

const BULK_EDIT_ASSOCIATIONS: TBulkEditAssociations<UpdateFindingInput> = { addAssetIDs: ObjectTypeObjects.ASSET }

const FindingPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const scanId = searchParams.get('scanId')

  const { enumOpts, form, ...sheetConfig } = useFindingSheetConfig(null, isCreate)

  const quickFilters = useSlaQuickFilters('reportedAt')

  useEffect(() => {
    if (id && !isCreate) router.replace(getHrefForObjectType('findings', { id }))
  }, [id, isCreate, router])

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
    viewEditMode: { type: 'full-page', route: '/exposure/findings' },
    onBulkDelete: async (ids: string[]) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids })
      return result.deleteBulkFinding
    },
    onBulkEdit: async (ids: string[], input: UpdateFindingInput) => {
      const result = await baseBulkEditMutation.mutateAsync({ ids, input })
      return result.updateBulkFinding
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    bulkEditAssociations: BULK_EDIT_ASSOCIATIONS,
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
      <TaskDetailsSheet queryParamKey="taskId" />
    </>
  )
}

export default FindingPage
