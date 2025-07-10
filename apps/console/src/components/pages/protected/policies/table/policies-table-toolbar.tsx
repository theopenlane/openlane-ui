import React from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { CirclePlus, DownloadIcon, Import, LoaderCircle, SearchIcon } from 'lucide-react'
import { usePoliciesFilters } from '@/components/pages/protected/policies/table/table-config.ts'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import BulkCSVCreatePolicyDialog from '@/components/pages/protected/policies/create/form/bulk-csv-create-policy-dialog.tsx'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import { CreateBtn } from '@/components/shared/icon-enum/common-enum.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'

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
}) => {
  const isSearching = useDebounce(searching, 200)
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)
  const filterFields = usePoliciesFilters()

  return (
    <>
      <div className="relative flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          {mappedColumns && columnVisibility && setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
          )}
          {filterFields && <TableFilter filterFields={filterFields} onFilterChange={setFilters} />}
          <Input
            icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>

        <div className="grow flex flex-row items-center gap-2 justify-end">
          {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
            <Menu
              trigger={CreateBtn}
              content={
                <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={handleCreateNew}>
                  <CirclePlus size={16} strokeWidth={2} />
                  <span>Policy</span>
                </div>
              }
            />
          )}
          <Menu
            content={
              <>
                {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
                  <BulkCSVCreatePolicyDialog
                    trigger={
                      <div className="flex items-center space-x-2 hover:bg-muted">
                        <Import size={16} strokeWidth={2} />
                        <span>Import existing document</span>
                      </div>
                    }
                  />
                )}
                <div className={`flex items-center space-x-2 hover:bg-muted cursor-pointer ${!exportEnabled ? 'pointer-events-none opacity-50' : ''}`} onClick={handleExport}>
                  <DownloadIcon size={16} strokeWidth={2} />
                  <span>Export</span>
                </div>
              </>
            }
          />
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default PoliciesTableToolbar
