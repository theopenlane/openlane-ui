import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { TOKEN_FILTER_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'
import { PersonalAccessTokenWhereInput } from '@repo/codegen/src/schema'
import PersonalApiKeyDialog from '@/components/pages/protected/developers/personal-access-token-create-dialog.tsx'
import { usePathname } from 'next/navigation'
import { TableKeyEnum } from '@repo/ui/table-key'

type TProps = {
  onFilterChange: (filters: PersonalAccessTokenWhereInput) => void
}

const TaskTableToolbar: React.FC<TProps> = (props: TProps) => {
  const path = usePathname()

  const isApiTokenPage = path.includes('/api-tokens')

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <TableFilter filterFields={TOKEN_FILTER_FIELDS} onFilterChange={props.onFilterChange} pageKey={isApiTokenPage ? TableKeyEnum.API_TOKEN : TableKeyEnum.PERSONAL_ACCESS_TOKEN} />
          <PersonalApiKeyDialog />
        </div>
      </div>
    </>
  )
}

export default TaskTableToolbar
