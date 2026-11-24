'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { type UpdateControlImplementationInput } from '@repo/codegen/src/schema'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { useBulkDeleteControlImplementation, useBulkEditControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { CONTROL_IMPLEMENTATIONS_HREF, controlImplementationHref } from '@/utils/control-implementation'
import CreateControlImplementationSheet from '../../controls/tabs/implementation/control-implementation-components/create-control-implementation-sheet'
import useFormSchema from '../../controls/tabs/implementation/control-implementation-components/form/use-form-schema'
import { getColumns } from './columns'
import TableComponent from './table'
import { breadcrumbs, buildSearchWhere, bulkEditFieldSchema, filterFields, mapFilterKey, statusOptions, visibilityFields } from './table-config'
import { type ControlImplementationTablePageConfig, defaultSorting, displayName, displayNamePlural, objectName, objectType, orderFieldEnum, tableKey } from './types'

const VIEW_EDIT_MODE = { type: 'full-page', route: CONTROL_IMPLEMENTATIONS_HREF } as const
const ENUM_OPTIONS = { statusOptions }

const ControlImplementationsPage: React.FC = () => {
  const router = useRouter()
  const { form } = useFormSchema()
  const { mutateAsync: bulkDelete } = useBulkDeleteControlImplementation()
  const { mutateAsync: bulkEdit } = useBulkEditControlImplementation()

  const openImplementation = useCallback((id: string) => router.push(controlImplementationHref(id)), [router])

  const tableConfig: ControlImplementationTablePageConfig = {
    objectType,
    objectName,
    displayName,
    displayNamePlural,
    tableKey,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields,
    mapFilterKey,
    searchFields: ['detailsContainsFold'],
    buildSearchWhere,
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    viewEditMode: VIEW_EDIT_MODE,
    createPermission: AccessEnum.CanCreateControlImplementation,
    renderDetailView: ({ isCreate, onClose }) => (
      <CreateControlImplementationSheet
        open={isCreate}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        showControlPicker
        onCreated={openImplementation}
      />
    ),
    onBulkDelete: async (ids: string[]) => (await bulkDelete({ ids })).deleteBulkControlImplementation,
    onBulkEdit: async (ids: string[], input: UpdateControlImplementationInput) => (await bulkEdit({ ids, input })).updateBulkControlImplementation,
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts: ENUM_OPTIONS,
  }

  return <GenericTablePage {...tableConfig} />
}

export default ControlImplementationsPage
