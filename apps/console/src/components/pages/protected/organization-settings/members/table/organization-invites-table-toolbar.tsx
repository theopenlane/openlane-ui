import { TableFilter } from '@/components/shared/table-filter/table-filter'
import React from 'react'
import { INVITES_FILTER_FIELDS } from '@/components/pages/protected/organization-settings/members/table/table-config.ts'
import { InviteWhereInput } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'

type TProps = {
  onFilterChange: (filters: InviteWhereInput) => void
}

const InvitesTableToolbar: React.FC<TProps> = (props: TProps) => {
  return (
    <>
      <div className="flex items-center gap-2 my-2">
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <TableFilter filterFields={INVITES_FILTER_FIELDS} onFilterChange={props.onFilterChange} pageKey={TableKeyEnum.ORG_INVITE} />
        </div>
      </div>
    </>
  )
}

export default InvitesTableToolbar
