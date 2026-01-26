'use client'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { canDelete } from '@/lib/authz/utils.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { TransferOwnershipDialog } from './transfer-ownership-dialog'

const TransferOwnership = () => {
  const { data } = useOrganizationRoles()

  if (!canDelete(data?.roles)) {
    return null
  }

  return (
    <>
      <Panel>
        <PanelHeader heading="Transfer ownership" noBorder />
        <Panel align="start">
          <TransferOwnershipDialog />
        </Panel>
      </Panel>
    </>
  )
}

export { TransferOwnership }
