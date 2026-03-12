'use client'

import React from 'react'
import { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { useCreateBulkCSVFinding, useBulkEditFinding, useBulkDeleteFinding } from '@/lib/graphql-hooks/finding'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFilterFields, visibilityFields } from './table-config'
import { type FindingTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { useFindingSheetConfig } from '../hooks/use-finding-sheet-config'

const FindingPage: React.FC = () => {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const { enumOpts, form, ...sheetConfig } = useFindingSheetConfig(id, isCreate)

  const baseBulkCreateMutation = useCreateBulkCSVFinding()
  const baseBulkDeleteMutation = useBulkDeleteFinding()
  const baseBulkEditMutation = useBulkEditFinding()

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => baseBulkCreateMutation.mutateAsync({ input: params.input }),
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
      await baseBulkDeleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateFindingInput) => {
      await baseBulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default FindingPage
