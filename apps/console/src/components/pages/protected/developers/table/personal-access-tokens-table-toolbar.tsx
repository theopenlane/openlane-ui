import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { TableSort } from '@/components/shared/table-filter/table-sort'
import { TOKEN_FILTER_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'

type TProps = {
  onFilterChange: (filters: Record<string, any>) => void
  onSortChange: (data: any) => void
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  return (
    <div className="flex items-center gap-2 my-5">
      <div className="grow flex flex-row items-center gap-2">
        <TableFilter filterFields={TOKEN_FILTER_FIELDS} onFilterChange={props.onFilterChange} />
        {/*
        <TableSort sortFields={TOKEN_SORT_FIELDS} onSortChange={props.onSortChange} />
        */}
      </div>
    </div>
  )
}

export default TaskTableToolbar
