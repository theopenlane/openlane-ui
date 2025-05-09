import { Panel, PanelHeader } from '@repo/ui/panel'
import { existingOrganizationsStyles } from './existing-organizations.styles'
import { Button } from '@repo/ui/button'
import { Tag } from '@repo/ui/tag'
import { switchOrganization } from '@/lib/user'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useGetAllOrganizationsWithMembers } from '@/lib/graphql-hooks/organization'
import { Organization } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'

export const ExistingOrganizations = () => {
  const { data: sessionData, update: updateSession } = useSession()
  const currentOrg = sessionData?.user.activeOrganizationId

  const { container, orgWrapper, orgInfo, orgSelect, orgTitle } = existingOrganizationsStyles()

  const { data, isFetching, isError } = useGetAllOrganizationsWithMembers()

  const { push } = useRouter()

  if (!data || isFetching || isError) {
    return null
  }

  const orgs = data?.organizations.edges?.filter((org) => !org?.node?.personalOrg) || []

  if (orgs.length === 0) {
    return null
  }

  const handleOrganizationSwitch = async (orgId?: string) => {
    if (orgId) {
      const response = await switchOrganization({
        target_organization_id: orgId,
      })

      if (sessionData && response) {
        await updateSession({
          ...response.session,
          user: {
            ...sessionData.user,
            accessToken: response.access_token,
            organization: orgId,
            refreshToken: response.refresh_token,
          },
        })
      }

      push('/dashboard')
    }
  }

  return (
    <div className={container()}>
      <Panel>
        <PanelHeader heading="Existing organizations" />
        {orgs.map((org) => {
          const role = org?.node?.members?.edges?.[0]?.node?.role ?? 'Owner'
          return (
            <div key={org?.node?.id} className={`${orgWrapper()} group`}>
              <div>
                <Avatar entity={org?.node as Organization} />
              </div>
              <div className={orgInfo()}>
                <div className={orgTitle()}>{org?.node?.displayName}</div>
                <Tag>{role}</Tag>
              </div>
              {currentOrg !== org?.node?.id && (
                <div className={orgSelect()}>
                  <Button variant="filled" size="md" onClick={() => handleOrganizationSwitch(org?.node?.id)}>
                    Select
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </Panel>
    </div>
  )
}
