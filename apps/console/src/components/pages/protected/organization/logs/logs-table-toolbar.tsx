import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { LOGS_FILTER_FIELDS } from '@/components/pages/protected/organization/logs/table-config.ts'

type TProps = {
  onFilterChange: (filters: any) => void
  handleExport?: () => void
}

const LogsTableToolbar: React.FC<TProps> = (props: TProps) => {
  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <TableFilter filterFields={LOGS_FILTER_FIELDS} onFilterChange={props.onFilterChange} />
        </div>

        <div className="grow flex flex-row items-center gap-2 justify-end"></div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default LogsTableToolbar
