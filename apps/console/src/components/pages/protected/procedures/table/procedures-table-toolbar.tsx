import React, { useState } from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { FileText, Import, LoaderCircle, SearchIcon, SquarePlus } from 'lucide-react'
import { Input } from '@theopenlane/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import BulkCSVCreateProcedureDialog from '@/components/pages/protected/procedures/create/form/bulk-csv-create-procedure-dialog'
import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import { type VisibilityState } from '@theopenlane/ui/table-types'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { ExportExportFormat, type ProcedureWhereInput } from '@repo/codegen/src/schema'
import { BulkEditProceduresDialog } from '../bulk-edit/bulk-edit-procedures'
import { Button } from '@theopenlane/ui/button'
import CreateProcedureUploadDialog from '../create/form/create-procedure-upload-dialog'
import { useProceduresFilters } from '@/components/pages/protected/procedures/table/table-config.ts'
import { useNotification } from '@/hooks/useNotification'
import { useBulkDeleteProcedures } from '@/lib/graphql-hooks/procedure'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@theopenlane/ui/confirmation-dialog'
import { TableKeyEnum } from '@theopenlane/ui/table-key'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { getBulkActionFailureDescription } from '@/components/shared/crud-base/bulk-action-feedback'
import { type Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import MenuItem from '@/components/shared/menu/menu-item'
import ExportMenuItem from '@/components/shared/export/export-menu-item'

type TProceduresTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: ProcedureWhereInput) => void
  handleCreateNew: () => void
  handleExport: (format?: ExportExportFormat) => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
  handleClearSelectedProcedures: () => void
  selectedProcedures: { id: string }[]
  setSelectedProcedures: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined, session?: Session | null) => boolean
  permission: TPermissionData | undefined
}

const ProceduresTableToolbar: React.FC<TProceduresTableToolbarProps> = ({
  searching,
  searchTerm,
  handleCreateNew,
  setFilters,
  setSearchTerm,
  handleExport,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  exportEnabled,
  handleClearSelectedProcedures,
  selectedProcedures,
  setSelectedProcedures,
  canEdit,
  permission,
}) => {
  const isSearching = useDebounce(searching, 200)
  const filters = useProceduresFilters()
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: bulkDeleteProcedures } = useBulkDeleteProcedures()
  const { data: session } = useSession()

  const handleBulkDelete = async () => {
    if (!selectedProcedures) {
      errorNotification({
        title: 'Missing procedures',
        description: 'Procedures not found.',
      })
      return
    }

    try {
      const result = await bulkDeleteProcedures({ ids: selectedProcedures.map((procedure) => procedure.id) })

      if (result.deleteBulkProcedure.notDeletedIDs.length > 0 || result.deleteBulkProcedure.error) {
        const failedCount = result.deleteBulkProcedure.notDeletedIDs.length

        errorNotification({
          title: 'Some procedures were not deleted.',
          description: getBulkActionFailureDescription({ failedCount, singular: 'item', fallback: result.deleteBulkProcedure.error ?? 'Some procedures were not deleted.' }),
        })
        return
      }

      successNotification({
        title: 'Selected procedures have been successfully deleted.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setSelectedProcedures([])
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <Input
            icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>

        <div className="grow flex flex-row items-center gap-2 justify-end">
          {selectedProcedures.length > 0 ? (
            <>
              {canEdit(permission?.roles, session) && <BulkEditProceduresDialog selectedProcedures={selectedProcedures} setSelectedProcedures={setSelectedProcedures}></BulkEditProceduresDialog>}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsBulkDeleteDialogOpen(true)
                }}
              >
                {selectedProcedures && selectedProcedures.length > 0 ? `Bulk Delete (${selectedProcedures.length})` : 'Bulk Delete'}
              </Button>
              {canEdit(permission?.roles, session) && (
                <>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title={`Delete selected procedures?`}
                    description={<>This action cannot be undone. This will permanently delete selected procedures.</>}
                    confirmationText="Delete"
                    confirmationTextVariant="destructive"
                    showInput={false}
                  />
                  <CancelButton
                    onClick={() => {
                      handleClearSelectedProcedures()
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
                    {hasPermission(permission?.roles, AccessEnum.CanCreateInternalPolicy, session) && (
                      <>
                        <MenuItem
                          icon={<Import size={16} strokeWidth={2} />}
                          onSelect={() => {
                            setIsImportDialogOpen(true)
                            close()
                          }}
                        >
                          Import existing document
                        </MenuItem>
                        <MenuItem
                          icon={<Import size={16} strokeWidth={2} />}
                          onSelect={() => {
                            setIsBulkUploadDialogOpen(true)
                            close()
                          }}
                        >
                          Bulk upload
                        </MenuItem>
                      </>
                    )}
                    <ExportMenuItem label="Export to CSV" onExport={() => handleExport(ExportExportFormat.CSV)} onSelected={close} disabled={!exportEnabled} />
                    <ExportMenuItem
                      label="Export to PDF"
                      icon={<FileText size={16} strokeWidth={2} />}
                      onExport={() => handleExport(ExportExportFormat.PDF)}
                      onSelected={close}
                      disabled={!exportEnabled}
                    />
                  </>
                )}
              />
              {hasPermission(permission?.roles, AccessEnum.CanCreateInternalPolicy, session) && (
                <>
                  <CreateProcedureUploadDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />
                  <BulkCSVCreateProcedureDialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen} />
                </>
              )}
              {mappedColumns && columnVisibility && setColumnVisibility && (
                <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.PROCEDURE} />
              )}
              {filters && <TableFilter filterFields={filters} onFilterChange={setFilters} pageKey={TableKeyEnum.PROCEDURE} />}
              {hasPermission(permission?.roles, AccessEnum.CanCreateProcedure, session) && (
                <Button variant="primary" onClick={handleCreateNew} className="h-8 px-2! pl-3!" icon={<SquarePlus />} iconPosition="left">
                  Create
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ProceduresTableToolbar
