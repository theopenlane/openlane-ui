'use client'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useSession } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteOrganization } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { canDelete } from '@/lib/authz/utils.ts'
import { useOrganization } from '@/hooks/useOrganization'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { switchOrganization, handleSSORedirect } from '@/lib/user'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

type OrganizationDeleteProps = {
  onLoadingChange?: (val: boolean) => void
}

const OrganizationDelete = ({ onLoadingChange }: OrganizationDeleteProps) => {
  const { successNotification, errorNotification } = useNotification()
  const { push } = useRouter()
  const queryClient = useQueryClient()
  const { mutateAsync: deleteOrganization, isPending } = useDeleteOrganization()
  const { data: sessionData, update } = useSession()
  const { data } = useOrganizationRoles()
  const { currentOrgId, allOrgs } = useOrganization()
  const currentOrganization = allOrgs.filter((org) => org?.node?.id === currentOrgId)[0]?.node

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    onLoadingChange?.(isPending)
  }, [isPending, onLoadingChange])

  const clickHandler = async () => {
    try {
      const response = await deleteOrganization({
        deleteOrganizationId: currentOrgId || '',
      })

      if (response.extensions && sessionData) {
        // there will always be one org id at the very minimum
        const orgID = allOrgs.filter((org) => org?.node?.id !== currentOrganization?.id)[0]?.node?.id as string

        const switchResponse = await switchOrganization({
          target_organization_id: orgID,
        })

        if (handleSSORedirect(switchResponse)) {
          return
        }

        if (switchResponse) {
          await update({
            ...sessionData,
            user: {
              ...sessionData.user,
              accessToken: switchResponse.access_token,
              organization: orgID,
              refreshToken: switchResponse.refresh_token,
            },
          })
        }
      }

      successNotification({
        title: 'Organization successfully deleted',
      })

      requestAnimationFrame(() => {
        queryClient?.invalidateQueries()
      })
      push('/organization')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  if (!canDelete(data?.roles)) {
    return null
  }

  return (
    <Panel>
      <PanelHeader heading="Delete organization" noBorder />
      <Panel align="start" destructive>
        <p className="text-red-600">Deleting your organization is irreversible.</p>
        <Button variant="redOutline" type="button" onClick={() => setIsDialogOpen(true)}>
          Delete this organization
        </Button>

        <ConfirmationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onConfirm={clickHandler}
          confirmationText="Delete"
          title={`Delete Organization ${currentOrganization?.displayName}`}
          description={
            <>
              This action is irreversible and will permanently delete the organization <b>{currentOrganization?.displayName}</b> and all associated data.
            </>
          }
          showInput={true}
        />
      </Panel>
    </Panel>
  )
}

export { OrganizationDelete }
