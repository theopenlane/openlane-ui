import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { SelectFilterField } from '@/types'
import { DownloadIcon, LoaderCircle, SearchIcon } from 'lucide-react'
import { CONTROLS_FILTER_FIELDS } from './table-config'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  owners?: { value: string; label: string }[]
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  exportToCSV: (fileName: string) => void
}

const ControlsTableToolbar: React.FC<TProps> = ({ onFilterChange, searching, searchTerm, setSearchTerm, owners, exportToCSV }: TProps) => {
  const filterFields = [
    ...CONTROLS_FILTER_FIELDS,
    {
      key: 'ownerID',
      label: 'Owners',
      type: 'select',
      options: owners ?? [{ value: 'owner_1', label: 'Owner 1' }],
    } as SelectFilterField,
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
        <Button onClick={() => exportToCSV('control_list')} icon={<DownloadIcon />} iconPosition="left">
          Export
        </Button>
      </div>
    </div>
  )
}

export default ControlsTableToolbar
