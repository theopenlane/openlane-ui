import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { Button } from '@repo/ui/button'
import { DownloadIcon, LoaderCircle, PlusCircle, SearchIcon } from 'lucide-react'
import { PROCEDURES_FILTERABLE_FIELDS } from '@/components/pages/protected/procedures/table/table-config.ts'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import BulkCSVCreateProcedureDialog from '@/components/pages/protected/procedures/create/form/bulk-c-s-v-create-procedure-dialog.tsx'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'

type TProceduresTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, any>) => void
  handleCreateNew: () => void
  handleExport: () => void
}

const ProceduresTableToolbar: React.FC<TProceduresTableToolbarProps> = ({ className, searching, searchTerm, handleCreateNew, setFilters, setSearchTerm, handleExport }) => {
  const isSearching = useDebounce(searching, 200)
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)

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
        {canCreate(permission?.roles, AccessEnum.CanCreateProcedure) && (
          <>
            <Button icon={<PlusCircle />} iconPosition="left" onClick={handleCreateNew}>
              Create new
            </Button>
            <BulkCSVCreateProcedureDialog />
          </>
        )}
      </div>
      <Button onClick={handleExport} icon={<DownloadIcon />} iconPosition="left">
        Export
      </Button>
    </div>
  )
}

export default ProceduresTableToolbar
