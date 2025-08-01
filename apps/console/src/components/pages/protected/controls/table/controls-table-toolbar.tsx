import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useMemo, useState } from 'react'
import { FilterField, SelectFilterField, SelectIsFilterField } from '@/types'
import { CirclePlus, DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { CONTROLS_FILTER_FIELDS } from './table-config'
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
import { BulkEditControlsDialog } from '../shared/bulk-edit-controls'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api'
import { canEdit } from '@/lib/authz/utils.ts'

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
}: TProps) => {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect()
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()
  const groups = useMemo(() => groupOptions || [], [groupOptions])
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false)
  const { standardOptions, isSuccess: isStandardSuccess } = useStandardsSelect({})
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)

  useEffect(() => {
    setIsBulkEditing(selectedControls.length > 0)
  }, [selectedControls])

  useEffect(() => {
    if (filterFields || !isProgramSuccess || !isGroupSuccess || !isStandardSuccess) {
      return
    }

    setFilterFields([
      ...CONTROLS_FILTER_FIELDS,
      {
        key: 'standard',
        label: 'Standard',
        type: 'selectIs',
        options: [
          ...standardOptions,
          {
            value: 'CUSTOM',
            label: 'CUSTOM',
          },
        ],
      },
      {
        key: 'controlOwnerID',
        label: 'Owners',
        type: 'select',
        options: groups.map((group) => ({
          value: group.value,
          label: group.label,
        })),
      } as SelectFilterField,
      {
        key: 'hasProgramsWith',
        label: 'Program Name',
        type: 'selectIs',
        options: programOptions,
      } as SelectIsFilterField,
    ])
  }, [groups, programOptions, filterFields, isGroupSuccess, isProgramSuccess, standardOptions, isStandardSuccess])

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

        <div className="grow flex flex-row items-center gap-2 justify-end">
          {isBulkEditing ? (
            <>
              {canEdit(permission?.roles) && (
                <>
                  <BulkEditControlsDialog setIsBulkEditing={setIsBulkEditing} selectedControls={selectedControls} setSelectedControls={setSelectedControls}></BulkEditControlsDialog>
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
                    <Link href="/controls/create-control">
                      <div className="flex items-center space-x-2 hover:bg-muted">
                        <CirclePlus size={16} strokeWidth={2} />
                        <span>Control</span>
                      </div>
                    </Link>
                    <Link href="/controls/create-subcontrol">
                      <div className="flex items-center space-x-2 hover:bg-muted">
                        <CirclePlus size={16} strokeWidth={2} />
                        <span>Subcontrol</span>
                      </div>
                    </Link>
                  </>
                }
              />
              <Menu
                content={
                  <>
                    <div className={`flex items-center space-x-2 hover:bg-muted cursor-pointer ${!exportEnabled ? 'opacity-50' : ''}`} onClick={handleExport}>
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </div>
                    <BulkCSVCreateControlDialog
                      trigger={
                        <div className="flex items-center space-x-2 hover:bg-muted">
                          <Upload size={16} strokeWidth={2} />
                          <span>Bulk Upload</span>
                        </div>
                      }
                    />
                  </>
                }
              ></Menu>
            </>
          )}
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default ControlsTableToolbar
