import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useEffect, useMemo, useState } from 'react'
import { FilterField, SelectFilterField, SelectIsFilterField } from '@/types'
import { CirclePlus, DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { CONTROLS_FILTER_FIELDS } from './table-config'
import { Input } from '@repo/ui/input'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import Menu from '@/components/shared/menu/menu.tsx'
import { BulkCSVCreateControlDialog } from '@/components/pages/protected/controls/bulk-csv-create-control-dialog.tsx'
import { CreateBtn } from '@/components/shared/icon-enum/common-enum'
import Link from 'next/link'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { ControlWhereInput } from '@repo/codegen/src/schema'

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
}

const ControlsTableToolbar: React.FC<TProps> = ({ onFilterChange, searching, searchTerm, setSearchTerm, handleExport, columnVisibility, setColumnVisibility, mappedColumns }: TProps) => {
  const { programOptions } = useProgramSelect()
  const { groupOptions } = useGroupSelect()
  const groups = useMemo(() => groupOptions || [], [groupOptions])
  const [filterFields, setFilterFields] = useState<FilterField[] | undefined>(undefined)

  useEffect(() => {
    if (filterFields || !groups || !programOptions) {
      return
    }

    setFilterFields([
      ...CONTROLS_FILTER_FIELDS,
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
  }, [groups, programOptions, filterFields])

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
                <div className="flex items-center space-x-2 hover:bg-muted cursor-pointer" onClick={handleExport}>
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
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default ControlsTableToolbar
