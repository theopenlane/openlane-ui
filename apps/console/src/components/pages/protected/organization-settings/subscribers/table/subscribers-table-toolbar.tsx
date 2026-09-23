import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { SUBSCRIBERS_FILTER_FIELDS } from '@/components/pages/protected/organization-settings/subscribers/table/table-config.ts'
import { LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import Menu from '@/components/shared/menu/menu.tsx'
import { type SubscriberWhereInput } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import MenuItem from '@/components/shared/menu/menu-item'
import ExportMenuItem from '@/components/shared/export/export-menu-item'
import { IMPORT_ROUTES } from '@/components/shared/record-import/lib/import-routes'
import { useOpenImport } from '@/components/shared/record-import/lib/use-open-import'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type TProps = {
  onFilterChange: (filters: SubscriberWhereInput) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
}

const SubscribersTableToolbar: React.FC<TProps> = ({ searching, searchTerm, onFilterChange, setSearchTerm, handleExport }) => {
  const openImport = useOpenImport()

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <Input
            icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>
        <Menu
          closeOnSelect={true}
          content={(close) => (
            <>
              <ExportMenuItem onExport={handleExport} onSelected={close} />
              <MenuItem
                icon={<Upload size={16} strokeWidth={2} />}
                onSelect={() => {
                  close()
                  openImport(IMPORT_ROUTES[ObjectTypes.SUBSCRIBER])
                }}
              >
                Bulk Upload
              </MenuItem>
            </>
          )}
        />
        <TableFilter filterFields={SUBSCRIBERS_FILTER_FIELDS} onFilterChange={onFilterChange} pageKey={TableKeyEnum.SUBSCRIBER} />
      </div>
    </>
  )
}

export default SubscribersTableToolbar
