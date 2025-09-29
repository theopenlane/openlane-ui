import React, { useEffect, useState } from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { CirclePlus, DownloadIcon, Import, LoaderCircle, SearchIcon, SquarePlus } from 'lucide-react'
import { usePoliciesFilters } from '@/components/pages/protected/policies/table/table-config.ts'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import BulkCSVCreatePolicyDialog from '@/components/pages/protected/policies/create/form/bulk-csv-create-policy-dialog.tsx'
import { TAccessRole, TData } from '@/lib/authz/access-api.ts'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { BulkEditPoliciesDialog } from '../bulk-edit/bulk-edit-policies'
import { Button } from '@repo/ui/button'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'

type TPoliciesTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, unknown>) => void
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
  selectedPolicies: { id: string }[]
  setSelectedPolicies: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[]) => boolean
  permission: TData
}

const PoliciesTableToolbar: React.FC<TPoliciesTableToolbarProps> = ({
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
  selectedPolicies,
  setSelectedPolicies,
  canEdit,
  permission,
}) => {
  const isSearching = useDebounce(searching, 200)
  const filterFields = usePoliciesFilters()
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false)

  useEffect(() => {
    setIsBulkEditing(selectedPolicies.length > 0)
  }, [selectedPolicies])

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
          {isBulkEditing ? (
            <>
              {canEdit(permission?.roles) && (
                <>
                  <BulkEditPoliciesDialog setIsBulkEditing={setIsBulkEditing} selectedPolicies={selectedPolicies} setSelectedPolicies={setSelectedPolicies}></BulkEditPoliciesDialog>
                  <Button
                    type="button"
                    variant="outline"
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
                      <BulkCSVCreatePolicyDialog
                        trigger={
                          <div className="flex items-center space-x-2 px-1">
                            <Import size={16} strokeWidth={2} />
                            <span>Import existing document</span>
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
                <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
              )}
              {filterFields && <TableFilter filterFields={filterFields} onFilterChange={setFilters} pageKey={TableFilterKeysEnum.POLICY} />}

              {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
                <Button variant="outline" onClick={handleCreateNew} className="h-8 !px-2 !pl-3 btn-secondary" icon={<SquarePlus />} iconPosition="left">
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

export default PoliciesTableToolbar
