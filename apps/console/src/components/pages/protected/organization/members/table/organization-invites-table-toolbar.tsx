import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { INVITES_FILTER_FIELDS } from '@/components/pages/protected/organization/members/table/table-config.ts'
import { InviteWhereInput } from '@repo/codegen/src/schema'

type TProps = {
  onFilterChange: (filters: InviteWhereInput) => void
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2">
          <TableFilter filterFields={INVITES_FILTER_FIELDS} onFilterChange={props.onFilterChange} />
        </div>
      </div>
      <div id="datatable-filter-portal" />
    </>
  )
}

export default TaskTableToolbar
