'use client'
import { useDeleteOrganizationMutation } from '@repo/codegen/src/schema'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useSession } from 'next-auth/react'

import { Button } from '@repo/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@repo/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { useToast } from '@repo/ui/use-toast'
import { userHasOrganizationDeletePermissions } from '@/lib/authz/utils'
import { useGetOrganizationNameByIdQuery } from '@repo/codegen/src/schema'


const OrganizationDelete = async () => {
  const { toast } = useToast()
  const { push } = useRouter()

  const [{ fetching: isSubmitting }, deleteOrganization] =
    useDeleteOrganizationMutation()
  const { data: sessionData, update } = useSession()
  const currentOrgId = sessionData?.user.organization

  const variables = { organizationId: currentOrgId || '' }
  const [org] = useGetOrganizationNameByIdQuery({ variables })

  // Check if the user has permission to delete the organization
  const { data, error } = await userHasOrganizationDeletePermissions(sessionData)

  // If the user does not have permission to delete the organization, return null
  if (error || !data?.allowed) {
    return null
  }

  const clickHandler = async () => {
    const response = await deleteOrganization({
      deleteOrganizationId: currentOrgId,
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
    toast({
      title: 'Organization successfully deleted',
      variant: 'success',
    })
    push('/organization')
  }

  return (
    <>
      <Panel>
        <PanelHeader heading="Delete organization" noBorder />
        <Panel align="start" destructive>
          <p className="red">Deleting your organization is irreversible.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="redOutline" type="button" loading={isSubmitting}>
                Delete this organization
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your organization <b>({org.data?.organization?.displayName})</b> and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="aquamarine" onClick={clickHandler}>
                    Delete organization
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Panel>
      </Panel>{' '}
    </>
  )
}

export { OrganizationDelete }
