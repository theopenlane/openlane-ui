import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { TOKEN_FILTER_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <TableFilter filterFields={TOKEN_FILTER_FIELDS} onFilterChange={props.onFilterChange} />
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default TaskTableToolbar
