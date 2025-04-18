import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useState } from 'react'
import { SelectFilterField } from '@/types'
import { CreditCard as CardIcon, LoaderCircle, SearchIcon, Table as TableIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { RISKS_FILTER_FIELDS } from './table-config'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
}

const RisksTableToolbar: React.FC<TProps> = ({ onFilterChange, searching, searchTerm, setSearchTerm }: TProps) => {
  return (
    <div className="flex items-center gap-2 my-5">
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={RISKS_FILTER_FIELDS} onFilterChange={onFilterChange} />
        <Input
          icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
        />
      </div>
    </div>
  )
}

export default RisksTableToolbar
