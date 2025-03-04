'use client'
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
import { useNotification } from '@/hooks/useNotification'
import { useUserHasOrganizationDeletePermissions } from '@/lib/authz/utils'
import { useDeleteOrganization, useGetOrganizationNameById } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'

const OrganizationDelete = () => {
  const { successNotification, errorNotification } = useNotification()
  const { push } = useRouter()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteOrganization } = useDeleteOrganization()
  const { data: sessionData, update } = useSession()
  const currentOrgId = sessionData?.user.activeOrganizationId

  const { data: org } = useGetOrganizationNameById(currentOrgId)

  const { data, isLoading, error } = useUserHasOrganizationDeletePermissions(sessionData)

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
    successNotification({
      title: 'Organization successfully deleted',
    })

    requestAnimationFrame(() => {
      queryClient?.invalidateQueries()
    })
    push('/organization')
  }

  if (error || !data?.allowed) {
    return null
  }
  return (
    <Panel>
      <PanelHeader heading="Delete organization" noBorder />
      <Panel align="start" destructive>
        <p className="red">Deleting your organization is irreversible.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="redOutline" type="button" loading={isLoading}>
              Delete this organization
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your organization <b>({org?.organization?.displayName})</b> and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="filled" onClick={clickHandler}>
                  Delete organization
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Panel>
    </Panel>
  )
}

export { OrganizationDelete }
