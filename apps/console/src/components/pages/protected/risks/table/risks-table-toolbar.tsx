import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useState } from 'react'
import { CirclePlus, DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { RISKS_FILTER_FIELDS } from './table-config'
import { FilterField, SelectIsFilterField } from '@/types'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import Menu from '@/components/shared/menu/menu.tsx'
import BulkCSVCreateRiskDialog from '@/components/pages/protected/risks/bulk-csv-create-risk-dialog.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum'
import { TAccessRole, TData } from '@/lib/authz/access-api.ts'
import { TaskIconBtn } from '@/components/shared/enum-mapper/task-enum'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog.tsx'
import { RiskWhereInput } from '@repo/codegen/src/schema'
import { BulkEditRisksDialog } from '../bulk-edit/bulk-edit-risks'
import { Button } from '@repo/ui/button'

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
  canEdit: (accessRole: TAccessRole[]) => boolean
  permission: TData
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
        type: 'selectIs',
        options: programOptions,
      } as SelectIsFilterField,
    ])
  }, [programOptions, filterFields, isSuccess])

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          {mappedColumns && columnVisibility && setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
          )}
          {filterFields && <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} />}
          <Input
            icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>
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
            <Menu
              trigger={CreateBtn}
              content={
                <>
                  {canCreate(permission?.roles, AccessEnum.CanCreateRisk) && (
                    <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={handleCreateNew}>
                      <CirclePlus size={16} strokeWidth={2} />
                      <span>Risk</span>
                    </div>
                  )}
                  <CreateTaskDialog trigger={TaskIconBtn} />
                </>
              }
            />
            <Menu
              closeOnSelect={true}
              content={(close) => (
                <>
                  <div
                    className={`flex items-center space-x-2 hover:bg-muted cursor-pointer ${!exportEnabled ? 'opacity-50' : ''}`}
                    onClick={() => {
                      handleExport()
                      close()
                    }}
                  >
                    <DownloadIcon size={16} strokeWidth={2} />
                    <span>Export</span>
                  </div>
                  {canCreate(permission?.roles, AccessEnum.CanCreateRisk) && (
                    <BulkCSVCreateRiskDialog
                      trigger={
                        <div className="flex items-center space-x-2 hover:bg-muted">
                          <Upload size={16} strokeWidth={2} />
                          <span>Bulk Upload</span>
                        </div>
                      }
                    />
                  )}
                </>
              )}
            />
          </>
        )}
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default RisksTableToolbar
