import React from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { EVIDENCE_FILTERABLE_FIELDS } from '@/components/pages/protected/evidence/table/table-config.ts'

type TEvidenceTableToolbarProps = {
  className?: string
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, unknown>) => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
}

const EvidenceTableToolbar: React.FC<TEvidenceTableToolbarProps> = ({ searching, searchTerm, setFilters, setSearchTerm, columnVisibility, setColumnVisibility, mappedColumns }) => {
  const isSearching = useDebounce(searching, 200)

  return (
    <>
      <div className="relative flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          {mappedColumns && columnVisibility && setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} />
          )}
          <TableFilter filterFields={EVIDENCE_FILTERABLE_FIELDS} onFilterChange={setFilters} />
          <Input
            icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default EvidenceTableToolbar
