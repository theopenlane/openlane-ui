import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { TOKEN_FILTER_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'
import { type PersonalAccessTokenWhereInput } from '@repo/codegen/src/schema'
import PersonalApiKeyDialog from '@/components/pages/protected/developers/personal-access-token-crud-slideout'
import { usePathname } from 'next/navigation'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'

type TProps = {
  onFilterChange: (filters: PersonalAccessTokenWhereInput) => void
}

const TokensTableToolbar: React.FC<TProps> = (props: TProps) => {
  const path = usePathname()
  const isApiTokenPage = path.includes('/api-tokens')
  const { data: permission } = useOrganizationRoles()

  // API tokens are org-scoped; only admin and above can create them
  const canCreateApiToken = !isApiTokenPage || canEdit(permission?.roles)

  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <TableFilter filterFields={TOKEN_FILTER_FIELDS} onFilterChange={props.onFilterChange} pageKey={isApiTokenPage ? TableKeyEnum.API_TOKEN : TableKeyEnum.PERSONAL_ACCESS_TOKEN} />
          {canCreateApiToken && <PersonalApiKeyDialog />}
        </div>
      </div>
    </>
  )
}

export default TokensTableToolbar
