'use client'

import React from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { useBulkEditRemediation, useBulkDeleteRemediation } from '@/lib/graphql-hooks/remediation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFilterFields, visibilityFields } from './table-config'
import { type RemediationTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { type UpdateRemediationInput } from '@repo/codegen/src/schema'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { RemediationStatusOptions } from '@/components/shared/enum-mapper/remediation-enum'
import RemediationSheet from '../sheet/remediation-sheet'

const RemediationPage: React.FC = () => {
  const { form } = useFormSchema()

  const baseBulkDeleteMutation = useBulkDeleteRemediation()
  const baseBulkEditMutation = useBulkEditRemediation()

  const { enumOptions: environmentOptions } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions } = useCreatableEnumOptions({ field: 'scope' })

  const enumOpts = { environmentOptions, scopeOptions, statusOptions: RemediationStatusOptions }

  const tableConfig: RemediationTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['titleContainsFold', 'summaryContainsFold', 'externalIDContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    renderDetailView: ({ id, isCreate, onClose }) => <RemediationSheet open={isCreate || !!id} remediationId={isCreate ? null : id} onClose={onClose} />,
    onBulkDelete: async (ids: string[]) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids })
      return result.deleteBulkRemediation
    },
    onBulkEdit: async (ids: string[], input: UpdateRemediationInput) => {
      const result = await baseBulkEditMutation.mutateAsync({ ids, input })
      return result.updateBulkRemediation
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default RemediationPage
