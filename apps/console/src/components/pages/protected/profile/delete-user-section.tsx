'use client'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteUser } from '@/lib/graphql-hooks/user'
import { useIsOwnerInAnyOrg } from '@/lib/graphql-hooks/organization'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Trash2 } from 'lucide-react'
import { ManagementRow } from '@/components/pages/protected/organization-settings/general-settings/management-row'

const DELETE_USER_DESCRIPTION = 'Permanently delete your account and remove all associated data. This action cannot be undone.'
const OWNER_TOOLTIP = 'You must transfer ownership or delete all organizations you own before deleting your account.'

type DeleteUserSectionProps = {
  userId?: string
}

const DeleteUserSection: React.FC<DeleteUserSectionProps> = ({ userId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteUser } = useDeleteUser()
  const { isOwner, isLoading, isError } = useIsOwnerInAnyOrg(userId)
  const isDeleteDisabled = isOwner || isLoading || isError

  const handleUserDelete = async () => {
    if (!userId) {
      errorNotification({
        title: 'User not found',
        description: 'User not found',
      })
      return
    }
    try {
      await deleteUser({ deleteUserId: userId })
      successNotification({
        title: 'User successfully deleted',
      })
      await signOut()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const deleteButton = (
    <Button
      variant="redOutline"
      type="button"
      icon={<Trash2 />}
      iconPosition="left"
      disabled={isDeleteDisabled}
      className={isDeleteDisabled ? 'cursor-not-allowed border-border text-muted-foreground opacity-50 dark:border-border dark:text-muted-foreground' : undefined}

      onClick={() => setIsDialogOpen(true)}
    >
      Delete account
    </Button>
  )

  return (
    <Panel>
      <PanelHeader heading="Delete Account" noBorder />
      <ManagementRow
        icon={<Trash2 className="size-5" />}
        iconClassName="bg-red-500/15 text-red-500"
        title="Delete Your Account"
        description={DELETE_USER_DESCRIPTION}
        descriptionClassName="max-w-2xl"
        action={
          isOwner ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-not-allowed">{deleteButton}</span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-64">
                  {OWNER_TOOLTIP}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            deleteButton
          )
        }
      />

      <ConfirmationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleUserDelete}
        confirmationText="Delete"
        title="Delete Your Account"
        description={<>This action is permanent and cannot be undone. You will immediately lose access to all organizations and associated data.</>}
        showInput={true}
      />
    </Panel>
  )
}

export default DeleteUserSection
