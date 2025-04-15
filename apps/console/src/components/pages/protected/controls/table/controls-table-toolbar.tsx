import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React, { useState } from 'react'
import { SelectFilterField } from '@/types'
import { CreditCard as CardIcon, LoaderCircle, SearchIcon, Table as TableIcon } from 'lucide-react'
import { CONTROLS_FILTER_FIELDS } from './table-config'
import { Input } from '@repo/ui/input'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  owners?: { value: string; label: string }[]
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
}

const ControlsTableToolbar: React.FC<TProps> = ({ onFilterChange, searching, searchTerm, setSearchTerm, owners }: TProps) => {
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
    </div>
  )
}

export default ControlsTableToolbar
