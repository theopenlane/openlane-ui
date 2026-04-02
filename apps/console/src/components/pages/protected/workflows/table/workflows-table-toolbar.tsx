import React, { useState } from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { LoaderCircle, SearchIcon, Wand2, FileCode, SquarePlus } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { useDebounce } from '@uidotdev/usehooks'
import { useRouter } from 'next/navigation'
import { type VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import Menu from '@/components/shared/menu/menu'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteWorkflowDefinition } from '@/lib/graphql-hooks/workflow-definition'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { getFilterFields } from './table-config'
import { tableKey } from './types'

type WorkflowsTableToolbarProps = {
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  onFilterChange: (filters: Record<string, unknown>) => void
  handleExport: () => void
  columnVisibility: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: { accessorKey: string; header: string }[]
  handleClearSelected: () => void
  selectedItems: { id: string }[]
  setSelectedItems: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (roles: TAccessRole[]) => boolean
  permission: TPermissionData | undefined
}

const WorkflowsTableToolbar: React.FC<WorkflowsTableToolbarProps> = ({
  searching,
  searchTerm,
  setSearchTerm,
  onFilterChange,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  handleClearSelected,
  selectedItems,
  setSelectedItems,
  canEdit,
  permission,
}) => {
  const router = useRouter()
  const isSearching = useDebounce(searching, 200)
  const filterFields = getFilterFields()
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const deleteMutation = useDeleteWorkflowDefinition()

  const handleBulkDelete = async () => {
    try {
      for (const item of selectedItems) {
        await deleteMutation.mutateAsync({ deleteWorkflowDefinitionId: item.id })
      }
      successNotification({
        title: `${selectedItems.length} workflow(s) deleted successfully.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setSelectedItems([])
    }
  }

  return (
    <>
      <div className="relative flex items-center gap-2 my-2">
        <Input
          icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
        />

        <div className="grow flex flex-row items-center gap-2 justify-end">
          {selectedItems.length > 0 ? (
            <>
              {canEdit(permission?.roles ?? []) && (
                <>
                  <Button type="button" variant="secondary" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                    {`Bulk Delete (${selectedItems.length})`}
                  </Button>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title="Delete selected workflows?"
                    description="This action cannot be undone. This will permanently delete the selected workflow definitions."
                    confirmationText="Delete"
                    confirmationTextVariant="destructive"
                    showInput={false}
                  />
                  <CancelButton onClick={handleClearSelected} />
                </>
              )}
            </>
          ) : (
            <>
              {mappedColumns && columnVisibility && setColumnVisibility && (
                <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={tableKey} />
              )}
              {filterFields && <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} pageKey={tableKey} />}
              <Menu
                trigger={
                  <Button variant="primary" className="h-8 px-2! pl-3!" icon={<SquarePlus />} iconPosition="left">
                    Create
                  </Button>
                }
                content={
                  <>
                    <button className="flex items-center space-x-2 px-1 cursor-pointer bg-transparent" onClick={() => router.push('/automation/workflows/wizard')}>
                      <Wand2 size={16} strokeWidth={2} />
                      <span>Wizard</span>
                    </button>
                    <button className="flex items-center space-x-2 px-1 cursor-pointer bg-transparent" onClick={() => router.push('/automation/workflows/editor')}>
                      <FileCode size={16} strokeWidth={2} />
                      <span>Editor</span>
                    </button>
                  </>
                }
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default WorkflowsTableToolbar
