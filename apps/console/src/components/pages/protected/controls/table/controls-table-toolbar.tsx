import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { SelectFilterField, SelectIsFilterField } from '@/types'
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

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
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

const ControlsTableToolbar: React.FC<TProps> = ({ onFilterChange, searching, searchTerm, setSearchTerm, owners, handleExport, columnVisibility, setColumnVisibility, mappedColumns }: TProps) => {
  const { programOptions } = useProgramSelect()

  const filterFields = [
    ...CONTROLS_FILTER_FIELDS,
    {
      key: 'ownerID',
      label: 'Owners',
      type: 'select',
      options: owners ?? [{ value: 'owner_1', label: 'Owner 1' }],
    } as SelectFilterField,
    {
      key: 'hasProgramsWith',
      label: 'Program Name',
      type: 'selectIs',
      options: programOptions,
    } as SelectIsFilterField,
  ]

  return (
    <div className="flex items-center gap-2 my-5">
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} />
        <Input
          icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
        />
      </div>

      <div className="grow flex flex-row items-center gap-2 justify-end">
        {mappedColumns && columnVisibility && setColumnVisibility && (
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
        )}
        <Menu
          trigger={CreateBtn}
          content={
            <>
              <Link href="/controls/create-control">
                <div className="flex items-center space-x-2">
                  <CirclePlus size={16} strokeWidth={2} />
                  <span>Control</span>
                </div>
              </Link>
              <Link href="/controls/create-subcontrol">
                <div className="flex items-center space-x-2">
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
              <div className="flex items-center space-x-2 cursor-pointer" onClick={handleExport}>
                <DownloadIcon size={16} strokeWidth={2} />
                <span>Export</span>
              </div>
              <BulkCSVCreateControlDialog
                trigger={
                  <div className="flex items-center space-x-2">
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
  )
}

export default ControlsTableToolbar
