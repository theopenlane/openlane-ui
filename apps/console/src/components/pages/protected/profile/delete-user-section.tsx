import { useNotification } from '@/hooks/useNotification'
import { useDeleteUser } from '@/lib/graphql-hooks/user'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useState } from 'react'

type DeleteUserSectionProps = {
  userId?: string
  displayName?: string | undefined
}

const DeleteUserSection: React.FC<DeleteUserSectionProps> = ({ userId, displayName }: DeleteUserSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteUser } = useDeleteUser()

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
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Panel>
      <PanelHeader heading="Delete User" noBorder></PanelHeader>
      <Panel align="start" destructive>
        <p className="text-red-600">Deleting user is irreversible.</p>
        <Button variant="redOutline" type="button" onClick={() => setIsDialogOpen(true)}>
          Delete user
        </Button>

        <ConfirmationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onConfirm={handleUserDelete}
          confirmationText="Delete"
          title={`Delete User ${displayName}`}
          description={
            <>
              This action is irreversible and will permanently delete the user <b>{displayName}</b> and all associated data.
            </>
          }
          showInput={true}
        />
      </Panel>
    </Panel>
  )
}

export default DeleteUserSection
