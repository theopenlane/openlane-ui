import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { TableSort } from '@/components/shared/table-filter/table-sort.tsx'
import { Button } from '@repo/ui/button'
import { LoaderCircle, PlusCircle, SearchIcon } from 'lucide-react'
import { INTERNAL_POLICIES_FILTERABLE_FIELDS, INTERNAL_POLICIES_SORTABLE_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'

type TPoliciesTableToolbarProps = {
  className?: string
  creating: boolean
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, any>) => void
  onSortChange: (data: any) => void
  handleCreateNew: () => void
}

const PoliciesTableToolbar: React.FC<TPoliciesTableToolbarProps> = ({ className, creating, searching, searchTerm, handleCreateNew, setFilters, onSortChange, setSearchTerm }) => {
  const isSearching = useDebounce(searching, 200)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={INTERNAL_POLICIES_FILTERABLE_FIELDS} onFilterChange={setFilters} />
        <TableSort sortFields={INTERNAL_POLICIES_SORTABLE_FIELDS} onSortChange={onSortChange} />
        <Input
          icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
        />
      </div>

      <div className="grow flex flex-row items-center gap-2 justify-end">
        <Button icon={<PlusCircle />} iconPosition="left" onClick={handleCreateNew} disabled={creating}>
          Create new
        </Button>
      </div>
    </div>
  )
}

export default PoliciesTableToolbar
