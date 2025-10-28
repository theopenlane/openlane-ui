import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useMemo, useState } from 'react'
import { FilterField } from '@/types'
import { CirclePlus, DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { getControlsFilterFields } from './table-config'
import { Input } from '@repo/ui/input'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import Menu from '@/components/shared/menu/menu.tsx'
import { BulkCSVCreateControlDialog } from '@/components/pages/protected/controls/bulk-csv-create-control-dialog.tsx'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum'
import Link from 'next/link'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { ControlWhereInput } from '@repo/codegen/src/schema'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Button } from '@repo/ui/button'
import { BulkEditControlsDialog } from '../bulk-edit/bulk-edit-controls'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import { BulkCSVCloneControlDialog } from '../bulk-csv-clone-control-dialog'
import { TAccessRole, TData } from '@/types/authz'
import { BulkCSVCreateMappedControlDialog } from '../bulk-csv-create-map-control-dialog'
import { ControlControlTypeOptions } from '@/components/shared/enum-mapper/control-enum'

type TProps = {
  onFilterChange: (filters: ControlWhereInput) => void
  owners?: { value: string; label: string }[]
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
  handleBulkEdit: () => void
  selectedControls: { id: string; refCode: string }[]
  setSelectedControls: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TData | undefined
}

const ControlsTableToolbar: React.FC<TProps> = ({
  onFilterChange,
  searching,
  searchTerm,
  setSearchTerm,
  handleExport,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  exportEnabled,
  handleBulkEdit,
  selectedControls,
  setSelectedControls,
  canEdit,
  permission,
}: TProps) => {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect({})
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()
  const groups = useMemo(() => groupOptions || [], [groupOptions])
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false)
  const { standardOptions, isSuccess: isStandardSuccess } = useStandardsSelect({})

  const createControlAllowed = canCreate(permission?.roles, AccessEnum.CanCreateControl)
  const createSubcontrolAllowed = canCreate(permission?.roles, AccessEnum.CanCreateSubcontrol)

  useEffect(() => {
    setIsBulkEditing(selectedControls.length > 0)
  }, [selectedControls])

  useEffect(() => {
    if (filterFields || !isProgramSuccess || !isGroupSuccess || !isStandardSuccess) {
      return
    }
    const fields = getControlsFilterFields(standardOptions, groups, programOptions, ControlControlTypeOptions)
    setFilterFields(fields)
  }, [groups, programOptions, filterFields, isGroupSuccess, isProgramSuccess, standardOptions, isStandardSuccess])

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

        <div className="grow flex flex-row items-center gap-2 justify-end">
          {isBulkEditing ? (
            <>
              {canEdit(permission?.roles) && (
                <>
                  <BulkEditControlsDialog setIsBulkEditing={setIsBulkEditing} selectedControls={selectedControls} setSelectedControls={setSelectedControls}></BulkEditControlsDialog>
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
                    <BulkCSVCloneControlDialog
                      trigger={
                        <div className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Upload From Standard</span>
                        </div>
                      }
                    />
                    <BulkCSVCreateControlDialog
                      trigger={
                        <div className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Upload Custom Controls</span>
                        </div>
                      }
                    />
                    <BulkCSVCreateMappedControlDialog
                      trigger={
                        <div className="flex items-center space-x-2 px-1">
                          <Upload size={16} strokeWidth={2} />
                          <span>Upload Control Mappings</span>
                        </div>
                      }
                    />
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
              {filterFields && <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} pageKey={TableFilterKeysEnum.CONTROL} />}
              {(createControlAllowed || createSubcontrolAllowed) && (
                <Menu
                  trigger={CreateBtn}
                  content={
                    <>
                      {createControlAllowed && (
                        <Link href="/controls/create-control">
                          <div className="flex items-center space-x-2 ">
                            <CirclePlus size={16} strokeWidth={2} />
                            <span>Control</span>
                          </div>
                        </Link>
                      )}
                      {createSubcontrolAllowed && (
                        <Link href="/controls/create-subcontrol">
                          <div className="flex items-center space-x-2 ">
                            <CirclePlus size={16} strokeWidth={2} />
                            <span>Subcontrol</span>
                          </div>
                        </Link>
                      )}
                    </>
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ControlsTableToolbar
