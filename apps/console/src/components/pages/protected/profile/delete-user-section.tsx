import { useNotification } from '@/hooks/useNotification'
import { useDeleteUser } from '@/lib/graphql-hooks/user'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

type DeleteUserSectionProps = {
  userId?: string
}

const DeleteUserSection: React.FC<DeleteUserSectionProps> = ({ userId }: DeleteUserSectionProps) => {
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
      setIsDialogOpen(true)
      await signOut()
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
      <PanelHeader heading="Delete Account" noBorder></PanelHeader>
      <Panel align="start" destructive>
        <p className="text-red-600">This action is permanent. Your account and all associated organizational access will be permanently removed and cannot be recovered.</p>
        <Button variant="redOutline" type="button" onClick={() => setIsDialogOpen(true)}>
          Delete Account
        </Button>

        <ConfirmationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onConfirm={handleUserDelete}
          confirmationText="Delete"
          title={`Delete Account`}
          description={<>This action is permanent and cannot be undone. You will immediately lose access to all organizations and associated data.</>}
          showInput={true}
        />
      </Panel>
    </Panel>
  )
}

export default DeleteUserSection
