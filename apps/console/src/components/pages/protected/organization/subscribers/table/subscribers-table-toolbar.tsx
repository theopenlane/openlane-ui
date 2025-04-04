import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { SUBSCRIBERS_FILTER_FIELDS } from '@/components/pages/protected/organization/subscribers/table/table-config.ts'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
}

const SubscribersTableToolbar: React.FC<TProps> = ({ searching, searchTerm, onFilterChange, setSearchTerm }) => {
  return (
    <div className="flex items-center gap-2 my-5">
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={SUBSCRIBERS_FILTER_FIELDS} onFilterChange={onFilterChange} />
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

export default SubscribersTableToolbar
