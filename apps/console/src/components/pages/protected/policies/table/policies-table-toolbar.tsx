import React, { useState } from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { DownloadIcon, Import, LoaderCircle, SearchIcon, SquarePlus } from 'lucide-react'
import { usePoliciesFilters } from '@/components/pages/protected/policies/table/table-config.ts'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import BulkCSVCreatePolicyDialog from '@/components/pages/protected/policies/create/form/bulk-csv-create-policy-dialog.tsx'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { BulkEditPoliciesDialog } from '../bulk-edit/bulk-edit-policies'
import { Button } from '@repo/ui/button'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import CreatePolicyUploadDialog from '../create/form/create-policy-upload-dialog'
import { TAccessRole, TData } from '@/types/authz'
import Link from 'next/link'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useBulkDeletePolicy } from '@/lib/graphql-hooks/policy'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TPoliciesTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, unknown>) => void
  handleExport: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
  handleClearSelectedPolicies: () => void
  selectedPolicies: { id: string }[]
  setSelectedPolicies: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TData | undefined
}

const PoliciesTableToolbar: React.FC<TPoliciesTableToolbarProps> = ({
  searching,
  searchTerm,
  setFilters,
  setSearchTerm,
  handleExport,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  exportEnabled,
  handleClearSelectedPolicies,
  selectedPolicies,
  setSelectedPolicies,
  canEdit,
  permission,
}) => {
  const isSearching = useDebounce(searching, 200)
  const filterFields = usePoliciesFilters()
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: bulkDeletePolicies } = useBulkDeletePolicy()

  const handleBulkDelete = async () => {
    if (!selectedPolicies) {
      errorNotification({
        title: 'Missing policies',
        description: 'Policies not found.',
      })
      return
    }

    try {
      await bulkDeletePolicies({ ids: selectedPolicies.map((policy) => policy.id) })
      successNotification({
        title: 'Selected policies have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setSelectedPolicies([])
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
          {selectedPolicies.length > 0 ? (
            <>
              {canEdit(permission?.roles) && <BulkEditPoliciesDialog selectedPolicies={selectedPolicies} setSelectedPolicies={setSelectedPolicies}></BulkEditPoliciesDialog>}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsBulkDeleteDialogOpen(true)
                }}
              >
                {selectedPolicies && selectedPolicies.length > 0 ? `Bulk Delete (${selectedPolicies.length})` : 'Bulk Delete'}
              </Button>
              {canEdit(permission?.roles) && (
                <>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title={`Delete selected policies?`}
                    description={<>This action cannot be undone. This will permanently delete selected policies.</>}
                    confirmationText="Delete"
                    confirmationTextVariant="destructive"
                    showInput={false}
                  />
                  <CancelButton
                    onClick={() => {
                      handleClearSelectedPolicies()
                    }}
                  ></CancelButton>
                </>
              )}
            </>
          ) : (
            <>
              <Menu
                closeOnSelect={true}
                content={(close) => (
                  <>
                    {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
                      <CreatePolicyUploadDialog
                        trigger={
                          <div className="flex items-center bg-transparent space-x-2 px-1 cursor-pointer">
                            <Import size={16} strokeWidth={2} />
                            <span>Import existing document</span>
                          </div>
                        }
                      />
                    )}
                    {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
                      <BulkCSVCreatePolicyDialog
                        trigger={
                          <div className="flex items-center bg-transparent space-x-2 px-1">
                            <Import size={16} strokeWidth={2} />
                            <span>Bulk upload</span>
                          </div>
                        }
                      />
                    )}
                    <button
                      className={`px-1 bg-transparent flex items-center space-x-2 cursor-pointer ${!exportEnabled ? 'opacity-50' : ''}`}
                      onClick={() => {
                        handleExport()
                        close()
                      }}
                    >
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </button>
                  </>
                )}
              />

              {mappedColumns && columnVisibility && setColumnVisibility && (
                <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableColumnVisibilityKeysEnum.POLICY} />
              )}
              {filterFields && <TableFilter filterFields={filterFields} onFilterChange={setFilters} pageKey={TableFilterKeysEnum.POLICY} />}
              {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
                <Link href="/policies/create">
                  <Button variant="primary" className="h-8 px-2! pl-3!" icon={<SquarePlus />} iconPosition="left">
                    Create
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default PoliciesTableToolbar
