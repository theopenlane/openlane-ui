import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { Button } from '@repo/ui/button'
import { DownloadIcon, LoaderCircle, PlusCircle, SearchIcon } from 'lucide-react'
import { INTERNAL_POLICIES_FILTERABLE_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import BulkCSVCreatePolicyDialog from '@/components/pages/protected/policies/create/form/bulk-csv-create-policy-dialog.tsx'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'

type TPoliciesTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, any>) => void
  handleCreateNew: () => void
  handleExport: () => void
}

const PoliciesTableToolbar: React.FC<TPoliciesTableToolbarProps> = ({ className, searching, searchTerm, handleCreateNew, setFilters, setSearchTerm, handleExport }) => {
  const isSearching = useDebounce(searching, 200)
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={INTERNAL_POLICIES_FILTERABLE_FIELDS} onFilterChange={setFilters} />
        <Input
          icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          variant="searchTable"
        />
      </div>

      <div className="grow flex flex-row items-center gap-2 justify-end">
        {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
          <>
            <Button icon={<PlusCircle />} iconPosition="left" onClick={handleCreateNew}>
              Create new
            </Button>
            <BulkCSVCreatePolicyDialog />
          </>
        )}
      </div>
      <Button onClick={handleExport} icon={<DownloadIcon />} iconPosition="left">
        Export
      </Button>
    </div>
  )
}

export default PoliciesTableToolbar
