import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { CreditCard as CardIcon, DownloadIcon, LoaderCircle, SearchIcon, Table as TableIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { RISKS_FILTER_FIELDS } from './table-config'
import { Button } from '@repo/ui/button'
import { SelectIsFilterField } from '@/types'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
}

const RisksTableToolbar: React.FC<TProps> = ({ onFilterChange, searching, searchTerm, setSearchTerm, handleExport }: TProps) => {
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
      <Button onClick={handleExport} icon={<DownloadIcon />} iconPosition="left">
        Export
      </Button>
    </div>
  )
}

export default RisksTableToolbar
