import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { SUBSCRIBERS_FILTER_FIELDS } from '@/components/pages/protected/organization-settings/subscribers/table/table-config.ts'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import Menu from '@/components/shared/menu/menu.tsx'
import BulkCSVCreateSubscriberDialog from '@/components/pages/protected/organization-settings/subscribers/bulk-csv-create-subscriber-dialog.tsx'
import { SubscriberWhereInput } from '@repo/codegen/src/schema'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'
import { Button } from '@repo/ui/button'

type TProps = {
  onFilterChange: (filters: SubscriberWhereInput) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
}

const SubscribersTableToolbar: React.FC<TProps> = ({ searching, searchTerm, onFilterChange, setSearchTerm, handleExport }) => {
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
          content={
            <>
              <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1 justify-start" onClick={handleExport}>
                <DownloadIcon size={16} strokeWidth={2} />
                <span>Export</span>
              </Button>
              <BulkCSVCreateSubscriberDialog
                trigger={
                  <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1 justify-start">
                    <Upload size={16} strokeWidth={2} />
                    <span>Bulk Upload</span>
                  </Button>
                }
              />
            </>
          }
        />
        <TableFilter filterFields={SUBSCRIBERS_FILTER_FIELDS} onFilterChange={onFilterChange} pageKey={TableFilterKeysEnum.SUBSCRIBE} />
      </div>
    </>
  )
}

export default SubscribersTableToolbar
