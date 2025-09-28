import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { TOKEN_FILTER_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'
import { PersonalAccessTokenWhereInput } from '@repo/codegen/src/schema'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'

type TProps = {
  onFilterChange: (filters: PersonalAccessTokenWhereInput) => void
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <TableFilter filterFields={TOKEN_FILTER_FIELDS} onFilterChange={props.onFilterChange} pageKey={TableFilterKeysEnum.PERSONAL_ACCESS_TOKEN} />
        </div>
      </div>
    </>
  )
}

export default TaskTableToolbar
