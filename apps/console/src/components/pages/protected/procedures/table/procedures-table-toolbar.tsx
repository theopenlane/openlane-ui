import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { Button } from '@repo/ui/button'
import { LoaderCircle, PlusCircle, SearchIcon } from 'lucide-react'
import { PROCEDURES_FILTERABLE_FIELDS } from '@/components/pages/protected/procedures/table/table-config.ts'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import BulkCSVCreateProcedureDialog from '@/components/pages/protected/procedures/create/form/bulk-c-s-v-create-procedure-dialog.tsx'

type TProceduresTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, any>) => void
  handleCreateNew: () => void
}

const ProceduresTableToolbar: React.FC<TProceduresTableToolbarProps> = ({ className, searching, searchTerm, handleCreateNew, setFilters, setSearchTerm }) => {
  const isSearching = useDebounce(searching, 200)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={PROCEDURES_FILTERABLE_FIELDS} onFilterChange={setFilters} />
        <Input
          icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
        />
      </div>

      <div className="grow flex flex-row items-center gap-2 justify-end">
        <Button icon={<PlusCircle />} iconPosition="left" onClick={handleCreateNew}>
          Create new
        </Button>
        <BulkCSVCreateProcedureDialog />
      </div>
    </div>
  )
}

export default ProceduresTableToolbar
