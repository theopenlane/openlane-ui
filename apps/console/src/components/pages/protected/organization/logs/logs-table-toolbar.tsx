import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { LOGS_FILTER_FIELDS } from '@/components/pages/protected/organization/logs/table-config.ts'
import { ChevronDown, DownloadIcon } from 'lucide-react'
import Menu from '@/components/shared/menu/menu.tsx'
import { Button } from '@repo/ui/button'
import { AuditLogWhereInput } from '@repo/codegen/src/schema.ts'
import { WhereCondition } from '@/types'

type TProps = {
  onFilterChange: (filters: AuditLogWhereInput) => void
  handleCSVExport?: () => void
  handleJSONExport?: () => void
}

const LogsTableToolbar: React.FC<TProps> = (props: TProps) => {
  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <TableFilter filterFields={LOGS_FILTER_FIELDS} onFilterChange={(where: WhereCondition) => props.onFilterChange(where as AuditLogWhereInput)} />
        </div>

        <div className="grow flex flex-row items-center gap-2 justify-end">
          <Menu
            trigger={
              <Button variant="outline" className="h-8 !px-2 !pl-3" icon={<ChevronDown />}>
                <DownloadIcon size={14} /> Export
              </Button>
            }
            content={
              <>
                <div className="flex items-center hover:bg-muted cursor-pointer" onClick={props.handleCSVExport}>
                  <span>CSV</span>
                </div>
                <div className="flex items-center hover:bg-muted cursor-pointer" onClick={props.handleJSONExport}>
                  <span>JSON</span>
                </div>
              </>
            }
          />
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default LogsTableToolbar
