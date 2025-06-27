import React from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { QUESTIONNAIRE_FILTER_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { includeQuestionnaireCreation } from '@repo/dally/auth'
import { CreateDropdown } from '@/components/pages/protected/questionnaire/create.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'

type TQuestionnaireTableToolbarProps = {
  creating: boolean
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: Record<string, any>) => void
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
}
const createDropdown = () => {
  if (includeQuestionnaireCreation == 'true') {
    return <Menu content={<CreateDropdown />} />
  }
}
const QuestionnaireTableToolbar: React.FC<TQuestionnaireTableToolbarProps> = ({ creating, searching, searchTerm, setFilters, setSearchTerm, columnVisibility, setColumnVisibility, mappedColumns }) => {
  const isSearching = useDebounce(searching, 200)

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <TableFilter filterFields={QUESTIONNAIRE_FILTER_FIELDS} onFilterChange={setFilters} />
          <Input
            icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            disabled={creating}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>
        <div className="grow flex flex-row items-center gap-2 justify-end">
          {mappedColumns && columnVisibility && setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
          )}
          {createDropdown()}
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default QuestionnaireTableToolbar
