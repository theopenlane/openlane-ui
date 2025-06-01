import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { SUBSCRIBERS_FILTER_FIELDS } from '@/components/pages/protected/organization/subscribers/table/table-config.ts'
import { DownloadIcon, LoaderCircle, SearchIcon, Upload } from 'lucide-react'
import { Input } from '@repo/ui/input'
import Menu from '@/components/shared/menu/menu.tsx'
import BulkCSVCreateSubscriberDialog from '@/components/pages/protected/organization/subscribers/bulk-csv-create-subscriber-dialog.tsx'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  searching?: boolean
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  handleExport: () => void
}

const SubscribersTableToolbar: React.FC<TProps> = ({ searching, searchTerm, onFilterChange, setSearchTerm, handleExport }) => {
  return (
    <div className="flex items-center gap-2 my-5">
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={SUBSCRIBERS_FILTER_FIELDS} onFilterChange={onFilterChange} />
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
            <div className="flex items-center space-x-2" onClick={handleExport}>
              <DownloadIcon size={16} strokeWidth={2} />
              <span>Export</span>
            </div>
            <BulkCSVCreateSubscriberDialog
              trigger={
                <div className="flex items-center space-x-2">
                  <Upload size={16} strokeWidth={2} />
                  <span>Bulk Upload</span>
                </div>
              }
            />
          </>
        }
      />
    </div>
  )
}

export default SubscribersTableToolbar
