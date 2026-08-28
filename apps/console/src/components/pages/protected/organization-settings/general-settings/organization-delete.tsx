'use client'
import { useSession } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteOrganization } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useOrganization } from '@/hooks/useOrganization'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { switchOrganization, handleSSORedirect } from '@/lib/user'
import { ManagementRow } from './management-row'

const DELETE_ORGANIZATION_DESCRIPTION = 'Permanently delete this organization and all associated data. This action cannot be undone.'

type OrganizationDeleteProps = {
  onLoadingChange?: (val: boolean) => void
}

const OrganizationDelete = ({ onLoadingChange }: OrganizationDeleteProps) => {
  const { successNotification, errorNotification } = useNotification()
  const { push } = useRouter()
  const queryClient = useQueryClient()
  const { mutateAsync: deleteOrganization, isPending } = useDeleteOrganization()
  const { data: sessionData, update } = useSession()
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

  return (
    <>
      <ManagementRow
        icon={<Trash2 className="size-5" />}
        iconClassName="bg-red-500/15 text-red-500"
        title="Delete organization"
        description={DELETE_ORGANIZATION_DESCRIPTION}
        action={
          <Button variant="redOutline" type="button" icon={<Trash2 />} iconPosition="left" onClick={() => setIsDialogOpen(true)}>
            Delete organization
          </Button>
        }
      />

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
    </>
  )
}

export { OrganizationDelete }
