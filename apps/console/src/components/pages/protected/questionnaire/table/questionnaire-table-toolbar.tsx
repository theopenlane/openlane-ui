import React from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { QUESTIONNAIRE_FILTER_FIELDS } from '@/components/pages/protected/questionnaire/table/table-config.ts'
import { includeQuestionnaireCreation } from '@repo/dally/auth'
import { CreateDropdown } from '@/components/pages/protected/questionnaire/create.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TemplateWhereInput } from '@repo/codegen/src/schema'
import { BulkCSVCreateTemplatelDialog } from '../dialog/bulk-csv-create-template-dialog'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'

type TQuestionnaireTableToolbarProps = {
  creating: boolean
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  setFilters: (filters: TemplateWhereInput) => void
  columnVisibility?: VisibilityState
  handleExport: () => void
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  exportEnabled: boolean
}

const QuestionnaireTableToolbar: React.FC<TQuestionnaireTableToolbarProps> = ({
  creating,
  searching,
  searchTerm,
  setFilters,
  setSearchTerm,
  columnVisibility,
  setColumnVisibility,
  mappedColumns,
  handleExport,
  exportEnabled,
}) => {
  const isSearching = useDebounce(searching, 200)
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)

  const createDropdown = () => {
    if (includeQuestionnaireCreation == 'true' && canCreate(permission?.roles, AccessEnum.CanCreateTemplate)) {
      return <CreateDropdown />
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
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
          <Menu
            content={
              <>
                <button className={`px-1 bg-transparent flex items-center space-x-2 cursor-pointer ${!exportEnabled ? 'opacity-50' : ''}`} onClick={handleExport}>
                  <DownloadIcon size={16} strokeWidth={2} />
                  <span>Export</span>
                </button>
                <BulkCSVCreateTemplatelDialog
                  trigger={
                    <div className="flex items-center space-x-2 px-1">
                      <Upload size={16} strokeWidth={2} />
                      <span>Bulk Upload</span>
                    </div>
                  }
                />
              </>
            }
          />
          {mappedColumns && columnVisibility && setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
          )}
          <TableFilter filterFields={QUESTIONNAIRE_FILTER_FIELDS} onFilterChange={setFilters} pageKey={TableFilterKeysEnum.QUESTIONNAIRE} />
          {createDropdown()}
        </div>
      </div>
    </>
  )
}

export default QuestionnaireTableToolbar
