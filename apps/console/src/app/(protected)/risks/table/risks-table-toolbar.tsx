import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { CreditCard as CardIcon, DownloadIcon, LoaderCircle, SearchIcon, Table as TableIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { RISKS_FILTER_FIELDS } from './table-config'
import { Button } from '@repo/ui/button'
import { SelectIsFilterField } from '@/types'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import Menu from '@/components/shared/menu/menu.tsx'
import BulkCSVCreateRiskDialog from '@/components/pages/protected/risks/bulk-csv-create-risk-dialog.tsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { EyeIcon } from 'lucide-react'
import { VisibilityState } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns?: Record<string, boolean>[]
}

const RisksTableToolbar: React.FC<TProps> = ({ onFilterChange, searching, searchTerm, setSearchTerm, handleExport, columnVisibility, setColumnVisibility, mappedColumns }: TProps) => {
  const { programOptions } = useProgramSelect()

  const filterFields = [
    ...RISKS_FILTER_FIELDS,

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
      {mappedColumns && columnVisibility && setColumnVisibility && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button icon={<EyeIcon />} iconPosition="left" variant="outline" size="md" className="ml-auto mr-2">
              Select Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {mappedColumns.map((column, index) => {
              const key = Object.keys(column)[0]
              return (
                <div className="flex items-center gap-x-3">
                  <Checkbox
                    key={`${key}-${index}`}
                    className="capitalize"
                    checked={columnVisibility[key] !== false}
                    onCheckedChange={(value: boolean) => {
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [key]: value,
                      }))
                    }}
                  ></Checkbox>
                  <div>{key}</div>
                </div>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Menu
        content={
          <>
            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleExport}>
              <DownloadIcon size={16} strokeWidth={2} />
              <span>Export</span>
            </div>
            <BulkCSVCreateRiskDialog
              trigger={
                <div className="flex items-center space-x-2">
                  <Upload size={16} strokeWidth={2} />
                  <span>Bulk Upload</span>
                </div>
              }
            />
          </>
        }
      />
    </div>
  )
}

export default RisksTableToolbar
