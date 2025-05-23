import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { Button } from '@repo/ui/button'
import { LoaderCircle, PlusIcon, SearchIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { MEMBERS_FILTER_FIELDS } from '@/components/pages/protected/organization/members/table/table-config.ts'

type TMembersTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, any>) => void
  onSetActiveTab: (activeTab: string) => void
}

const MembersTableToolbar: React.FC<TMembersTableToolbarProps> = ({ className, searching, searchTerm, setFilters, setSearchTerm, onSetActiveTab }) => {
  const isSearching = useDebounce(searching, 200)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={MEMBERS_FILTER_FIELDS} onFilterChange={setFilters} />
        <Input
          icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
        />
      </div>
      <Button size="md" icon={<PlusIcon />} iconPosition="left" onClick={() => onSetActiveTab('invites')}>
        Send an invite
      </Button>
    </div>
  )
}

export default MembersTableToolbar
