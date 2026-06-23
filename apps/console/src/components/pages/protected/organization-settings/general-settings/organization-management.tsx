'use client'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { useCurrentUserRole } from '@/lib/graphql-hooks/member'
import { TransferOwnership } from './transfer-ownership'
import { OrganizationDelete } from './organization-delete'

type OrganizationManagementProps = {
  onLoadingChange?: (val: boolean) => void
}

const OrganizationManagement = ({ onLoadingChange }: OrganizationManagementProps) => {
  const { role, isLoading } = useCurrentUserRole()

  if (isLoading || role !== OrgMembershipRole.OWNER) {
    return null
  }

  return (
    <Panel>
      <PanelHeader heading="Organization management" noBorder />
      <div className="flex flex-col gap-8">
        <TransferOwnership />
        <OrganizationDelete onLoadingChange={onLoadingChange} />
      </div>
    </Panel>
  )
}

export { OrganizationManagement }
