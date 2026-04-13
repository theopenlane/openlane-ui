'use client'

import { DataTable } from '@repo/ui/data-table'
import { useEffect, useMemo, useState } from 'react'
import { type WorkflowDefinitionWhereInput, type WorkflowDefinitionOrderField } from '@repo/codegen/src/schema'
import { type WorkflowDefinitionsNodeNonNull, useWorkflowDefinitionsWithFilter, useDeleteWorkflowDefinition } from '@/lib/graphql-hooks/workflow-definition'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { WORKFLOW_SORT_FIELDS } from './table-config'
import { getColumns } from './columns'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { objectName, tableKey } from './types'
import { createRowActionsColumn } from '@/components/shared/crud-base/columns/row-actions-column'
import { Pencil, Trash2 } from 'lucide-react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

const TableComponent = ({
  onSortChange,
  pagination,
  onPaginationChange,
  whereFilter,
  orderByFilter,
  columnVisibility,
  setColumnVisibility,
  selectedItems,
  setSelectedItems,
  canEdit,
  permission,
  defaultSorting,
  onRowClick,
  rowHref,
}: TTableProps<WorkflowDefinitionWhereInput>) => {
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const deleteMutation = useDeleteWorkflowDefinition()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as WorkflowDefinitionOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    workflowDefinitionsNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useWorkflowDefinitionsWithFilter({
    where: whereFilter,
    orderBy,
    pagination,
    enabled: true,
  })

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles),
      }))
    }
  }, [permission?.roles, setColumnVisibility, canEdit])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: `Failed to load ${objectName.toLowerCase()}`,
      })
    }
  }, [isError, errorNotification])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync({ deleteWorkflowDefinitionId: deleteId })
      successNotification({
        title: 'Workflow deleted',
        description: 'The workflow definition was removed successfully.',
      })
    } catch (error) {
      errorNotification({
        title: 'Unable to delete workflow',
        description: error instanceof Error ? error.message : 'Something went wrong.',
      })
    } finally {
      setDeleteId(null)
    }
  }

  const columns = useMemo(
    () => [
      ...getColumns({ userMap: {}, selectedItems, setSelectedItems }),
      createRowActionsColumn<WorkflowDefinitionsNodeNonNull>({
        actions: [
          { label: 'Edit', icon: <Pencil size={16} />, onClick: (row) => router.push(`/automation/workflows/editor?id=${row.id}`) },
          { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => setDeleteId(row.id) },
        ],
      }),
    ],
    [selectedItems, setSelectedItems, router],
  )

  return (
    <>
      <DataTable<WorkflowDefinitionsNodeNonNull, unknown>
        columns={columns}
        sortFields={WORKFLOW_SORT_FIELDS}
        onSortChange={onSortChange}
        data={items}
        loading={fetching}
        defaultSorting={defaultSorting}
        onRowClick={onRowClick}
        rowHref={rowHref}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={{
          totalCount: data?.workflowDefinitions?.totalCount,
          pageInfo: data?.workflowDefinitions?.pageInfo,
          isLoading: isFetching,
        }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={tableKey}
        noResultsText="No workflow definitions yet."
      />

      <ConfirmationDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete workflow"
        description="This action cannot be undone. This workflow definition will be permanently removed."
      />
    </>
  )
}

TableComponent.displayName = 'WorkflowDefinitionsTable'
export default TableComponent
