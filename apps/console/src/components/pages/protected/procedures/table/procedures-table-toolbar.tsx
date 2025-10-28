import React, { useEffect, useState } from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { DownloadIcon, Import, LoaderCircle, SearchIcon, SquarePlus } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import BulkCSVCreateProcedureDialog from '@/components/pages/protected/procedures/create/form/bulk-csv-create-procedure-dialog'
import { TAccessRole, TData } from '@/types/authz'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { ProcedureWhereInput } from '@repo/codegen/src/schema'
import { BulkEditProceduresDialog } from '../bulk-edit/bulk-edit-procedures'
import { Button } from '@repo/ui/button'
import CreateProcedureUploadDialog from '../create/form/create-procedure-upload-dialog'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import { useProceduresFilters } from '@/components/pages/protected/procedures/table/table-config.ts'

type TProceduresTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: ProcedureWhereInput) => void
  handleCreateNew: () => void
  handleExport: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
  handleBulkEdit: () => void
  selectedProcedures: { id: string }[]
  setSelectedProcedures: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TData | undefined
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
  handleBulkEdit,
  selectedProcedures,
  setSelectedProcedures,
  canEdit,
  permission,
}) => {
  const isSearching = useDebounce(searching, 200)
  const filters = useProceduresFilters()
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false)

  useEffect(() => {
    setIsBulkEditing(selectedProcedures.length > 0)
  }, [selectedProcedures])

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
          {isBulkEditing ? (
            <>
              {canEdit(permission?.roles) && (
                <>
                  <BulkEditProceduresDialog setIsBulkEditing={setIsBulkEditing} selectedProcedures={selectedProcedures} setSelectedProcedures={setSelectedProcedures}></BulkEditProceduresDialog>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsBulkEditing(false)
                      handleBulkEdit()
                    }}
                  >
                    Cancel
                  </Button>
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
                      <CreateProcedureUploadDialog
                        trigger={
                          <div className="flex items-center bg-transparent space-x-2 px-1">
                            <Import size={16} strokeWidth={2} />
                            <span>Import existing document</span>
                          </div>
                        }
                      />
                    )}
                    {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
                      <BulkCSVCreateProcedureDialog
                        trigger={
                          <div className="flex items-center bg-transparent space-x-2 px-1">
                            <Import size={16} strokeWidth={2} />
                            <span>Bulk upload</span>
                          </div>
                        }
                      />
                    )}
                    <div
                      className={`flex items-center space-x-2 px-1 cursor-pointer ${!exportEnabled ? 'opacity-50' : ''}`}
                      onClick={() => {
                        handleExport()
                        close()
                      }}
                    >
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </div>
                  </>
                )}
              />
            </>
          )}
          {mappedColumns && columnVisibility && setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
          )}
          {filters && <TableFilter filterFields={filters} onFilterChange={setFilters} pageKey={TableFilterKeysEnum.PROCEDURE} />}
          {canCreate(permission?.roles, AccessEnum.CanCreateProcedure) && (
            <Button variant="secondary" onClick={handleCreateNew} className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left">
              Create
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

export default ProceduresTableToolbar
