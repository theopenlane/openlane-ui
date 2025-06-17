'use client'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useSession } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteOrganization } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canDelete } from '@/lib/authz/utils.ts'
import { useOrganization } from '@/hooks/useOrganization'

const OrganizationDelete = () => {
  const { successNotification, errorNotification } = useNotification()
  const { push } = useRouter()
  const queryClient = useQueryClient()
  const { mutateAsync: deleteOrganization } = useDeleteOrganization()
  const { data: sessionData, update } = useSession()
  const { data } = useOrganizationRole(sessionData)
  const { currentOrgId, allOrgs } = useOrganization()
  const currentOrganization = allOrgs.filter((org) => org?.node?.id === currentOrgId)[0]?.node

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const clickHandler = async () => {
    try {
      const response = await deleteOrganization({
        deleteOrganizationId: currentOrgId || '',
      })

      if (response.extensions && sessionData) {
        await update({
          ...sessionData,
          user: {
            ...sessionData.user,
            accessToken: response.extensions.auth.access_token,
            organization: response.extensions.auth.authorized_organization,
            refreshToken: response.extensions.auth.refresh_token,
          },
        })
      }

      successNotification({
        title: 'Organization successfully deleted',
      })

      requestAnimationFrame(() => {
        queryClient?.invalidateQueries()
      })
      push('/organization')
    } catch (err) {
      errorNotification({
        title: 'Failed to delete organization',
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
