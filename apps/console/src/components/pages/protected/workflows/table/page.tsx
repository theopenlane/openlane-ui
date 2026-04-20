'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { useDeleteWorkflowDefinition } from '@/lib/graphql-hooks/workflow-definition'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { breadcrumbs, getFilterFields, visibilityFields } from './table-config'
import { objectType, objectName, tableKey, orderFieldEnum, defaultSorting, type WorkflowSheetConfig } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import WorkflowsTableToolbar from './workflows-table-toolbar'

const WorkflowDefinitionsPage: React.FC = () => {
  const form = useForm<Record<string, never>>()
  const deleteMutation = useDeleteWorkflowDefinition()
  const { errorNotification } = useNotification()

  const sheetConfig: WorkflowSheetConfig = {
    objectType,
    isFetching: false,
  }

  return (
    <GenericTablePage
      objectType={objectType}
      objectName={objectName}
      tableKey={tableKey}
      orderFieldEnum={orderFieldEnum}
      defaultSorting={defaultSorting}
      defaultVisibility={visibilityFields}
      filterFields={getFilterFields()}
      searchFields={['nameContainsFold', 'descriptionContainsFold']}
      breadcrumbs={breadcrumbs}
      form={form}
      getColumns={getColumns}
      TableComponent={TableComponent}
      ToolbarComponent={WorkflowsTableToolbar}
      sheetConfig={sheetConfig}
      viewEditMode={{ type: 'full-page', route: '/automation/workflows/definitions' }}
      onBulkDelete={async (ids: string[]) => {
        try {
          for (const id of ids) {
            await deleteMutation.mutateAsync({ deleteWorkflowDefinitionId: id })
          }

          return { deletedIDs: ids, notDeletedIDs: [] }
        } catch (error) {
          const errorMessage = parseErrorMessage(error)
          errorNotification({
            title: 'Error',
            description: errorMessage,
          })
          throw error
        }
      }}
    />
  )
}

export default WorkflowDefinitionsPage
