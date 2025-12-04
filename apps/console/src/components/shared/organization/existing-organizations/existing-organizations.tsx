'use client'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { existingOrganizationsStyles } from './existing-organizations.styles'
import { Button } from '@repo/ui/button'
import { Tag } from '@repo/ui/tag'
import { switchOrganization, handleSSORedirect } from '@/lib/user'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useGetAllOrganizationsWithMembers } from '@/lib/graphql-hooks/organization'
import { Organization, OrgMembershipRole } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { useRemoveUserFromOrg } from '@/lib/graphql-hooks/members'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export const ExistingOrganizations = () => {
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState<string | null>(null)
  const { data: sessionData, update: updateSession } = useSession()
  const currentOrg = sessionData?.user.activeOrganizationId
  const { errorNotification, successNotification } = useNotification()
  const queryClient = useQueryClient()
  const { mutateAsync: leaveOrganization } = useRemoveUserFromOrg()

  const { container, orgWrapper, orgInfo, orgSelect, orgTitle } = existingOrganizationsStyles()

  const { data, isFetching, isError } = useGetAllOrganizationsWithMembers({ userID: sessionData?.user.userId })

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

      if (handleSSORedirect(response)) {
        return
      }

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
      requestAnimationFrame(() => {
        queryClient?.clear()
      })
      push('/dashboard')
    }
  }

  const handleLeaveOrganization = async (membershipId: string, orgId: string) => {
    try {
      await leaveOrganization({ deleteOrgMembershipId: membershipId })

      successNotification({
        title: 'Successfully left organization',
      })

      const remainingOrgs = data?.organizations.edges?.filter((org) => org?.node?.id !== orgId) || []

      const nextOrg = remainingOrgs[0]?.node?.id

      if (nextOrg) {
        const response = await switchOrganization({
          target_organization_id: nextOrg,
        })

        if (handleSSORedirect(response)) {
          return
        }

        if (sessionData && response) {
          await updateSession({
            ...response.session,
            user: {
              ...sessionData.user,
              accessToken: response.access_token,
              activeOrganizationId: nextOrg,
              refreshToken: response.refresh_token,
            },
          })
        }
      }

      queryClient.invalidateQueries({
        predicate: (query) => ['memberships', 'organizationsWithMembers', 'groups'].includes(query.queryKey[0] as string),
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setShowLeaveConfirmation(null)
    }
  }

  return (
    <div className={container()}>
      <Panel>
        <PanelHeader heading="Existing organizations" />
        {orgs.map((org) => {
          const role = org?.node?.members?.edges?.[0]?.node?.role ?? 'Owner'
          const membershipId = org?.node?.members?.edges?.[0]?.node?.id

          return (
            <div key={org?.node?.id} className={`${orgWrapper()} group`}>
              <div>
                <Avatar entity={org?.node as Organization} />
              </div>
              <div className={orgInfo()}>
                <div className={orgTitle()}>{org?.node?.displayName}</div>
                <Tag>{role}</Tag>
              </div>
              {currentOrg !== org?.node?.id ? (
                <div className={orgSelect()}>
                  <Button variant="secondary" size="md" onClick={() => handleOrganizationSwitch(org?.node?.id)}>
                    Select
                  </Button>
                </div>
              ) : (
                role.toUpperCase() !== OrgMembershipRole.OWNER && (
                  <div className={orgSelect()}>
                    <Button variant="destructive" size="md" onClick={() => setShowLeaveConfirmation(org?.node?.id || null)}>
                      Leave
                    </Button>
                    <ConfirmationDialog
                      open={showLeaveConfirmation === org?.node?.id}
                      onOpenChange={() => setShowLeaveConfirmation(null)}
                      onConfirm={() => membershipId && handleLeaveOrganization(membershipId, org?.node?.id || '')}
                      title="Leave Organization"
                      description={
                        <>
                          This action cannot be undone. You will be permanently removed from <b>{org?.node?.displayName}</b>.
                        </>
                      }
                    />
                  </div>
                )
              )}
            </div>
          )
        })}
      </Panel>
    </div>
  )
}
