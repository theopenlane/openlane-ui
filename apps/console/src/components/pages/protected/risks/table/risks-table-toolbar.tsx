import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useState } from 'react'
import { DownloadIcon, FileText, LoaderCircle, SearchIcon, SquarePlus, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { RISKS_FILTER_FIELDS } from './table-config'
import { FilterField } from '@/types'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import Menu from '@/components/shared/menu/menu.tsx'
import BulkCSVCreateRiskDialog from '@/components/pages/protected/risks/bulk-csv-create-risk-dialog.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { TAccessRole, TData } from '@/types/authz'
import { RiskWhereInput } from '@repo/codegen/src/schema'
import { BulkEditRisksDialog } from '../bulk-edit/bulk-edit-risks'
import { Button } from '@repo/ui/button'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'

type TProps = {
  onFilterChange: (filters: RiskWhereInput) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
  handleCreateNew: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
  handleBulkEdit: () => void
  selectedRisks: { id: string }[]
  setSelectedRisks: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TData | undefined
}

const RisksTableToolbar: React.FC<TProps> = ({
  onFilterChange,
  searching,
  searchTerm,
  setSearchTerm,
  handleExport,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  handleCreateNew,
  exportEnabled,
  handleBulkEdit,
  selectedRisks,
  setSelectedRisks,
  canEdit,
  permission,
}: TProps) => {
  const { programOptions, isSuccess } = useProgramSelect({})
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false)

  useEffect(() => {
    setIsBulkEditing(selectedRisks.length > 0)
  }, [selectedRisks])

  useEffect(() => {
    if (filterFields || !isSuccess) {
      return
    }

    setFilterFields([
      ...RISKS_FILTER_FIELDS,
      {
        key: 'hasProgramsWith',
        label: 'Program Name',
        type: 'select',
        forceKeyOperator: true,
        childrenObjectKey: 'id',
        options: programOptions,
        icon: FileText,
      },
    ])
  }, [programOptions, filterFields, isSuccess])

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <Input
            icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>
        {!isBulkEditing && (
          <Menu
            closeOnSelect={true}
            content={(close) => (
              <>
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
                {canCreate(permission?.roles, AccessEnum.CanCreateRisk) && (
                  <BulkCSVCreateRiskDialog
                    trigger={
                      <div className="flex items-center space-x-2 px-1">
                        <Upload size={16} strokeWidth={2} />
                        <span>Bulk Upload</span>
                      </div>
                    }
                  />
                )}
              </>
            )}
          />
        )}
        {mappedColumns && columnVisibility && setColumnVisibility && (
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
        )}
        {filterFields && <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} pageKey={TableFilterKeysEnum.RISK} />}
        {isBulkEditing ? (
          <>
            {canEdit(permission?.roles) && (
              <>
                <BulkEditRisksDialog setIsBulkEditing={setIsBulkEditing} selectedRisks={selectedRisks} setSelectedRisks={setSelectedRisks}></BulkEditRisksDialog>
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
            {canCreate(permission?.roles, AccessEnum.CanCreateRisk) && (
              <Button variant="outline" onClick={handleCreateNew} className="h-8 !px-2 !pl-3 btn-secondary" icon={<SquarePlus />} iconPosition="left">
                Create
              </Button>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default RisksTableToolbar
