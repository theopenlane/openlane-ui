import React from 'react'
import { TableFilter } from '@/components/shared/table-filter/table-filter.tsx'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { useDebounce } from '@uidotdev/usehooks'
import { TEMPLATE_FILTER_FIELDS } from '@/components/pages/protected/questionnaire/template/table/table-config.ts'
import { includeQuestionnaireCreation } from '@repo/dally/auth'
import { CreateTemplateButton } from '@/components/pages/protected/questionnaire/template/create.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import { VisibilityState } from '@tanstack/react-table'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TemplateWhereInput } from '@repo/codegen/src/schema'
import { BulkCSVCreateTemplateDialog } from '@/components/pages/protected/questionnaire/dialog/bulk-csv-create-template-dialog'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { Button } from '@repo/ui/button'
import { TableKeyEnum } from '@repo/ui/table-key'

type TTemplateTableToolbarProps = {
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

const TemplateTableToolbar: React.FC<TTemplateTableToolbarProps> = ({
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
  const { data: permission } = useOrganizationRoles()

  const createButton = () => {
    if (includeQuestionnaireCreation == 'true' && canCreate(permission?.roles, AccessEnum.CanCreateTemplate)) {
      return <CreateTemplateButton />
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
                <BulkCSVCreateTemplateDialog
                  trigger={
                    <Button size="sm" variant="transparent" className="px-1 flex items-center justify-start space-x-2">
                      <Upload size={16} strokeWidth={2} />
                      <span>Bulk Upload</span>
                    </Button>
                  }
                />
                <Button size="sm" variant="transparent" className={`px-1 flex items-center justify-start space-x-2`} onClick={handleExport} disabled={!exportEnabled}>
                  <DownloadIcon size={16} strokeWidth={2} />
                  <span>Export</span>
                </Button>
              </>
            }
          />
          {mappedColumns && columnVisibility && setColumnVisibility && (
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.TEMPLATE} />
          )}
          <TableFilter filterFields={TEMPLATE_FILTER_FIELDS} onFilterChange={setFilters} pageKey={TableKeyEnum.TEMPLATE} />
          {createButton()}
        </div>
      </div>
    </>
  )
}

export default TemplateTableToolbar
