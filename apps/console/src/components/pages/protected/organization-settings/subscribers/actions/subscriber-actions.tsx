'use client'

import { Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteSubscriber } from '@/lib/graphql-hooks/subscriber'
import { useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useSession } from 'next-auth/react'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'

type SubscriberActionsProps = {
  subscriberEmail: string
}

const ICON_SIZE = 16

export const SubscriberActions = ({ subscriberEmail }: SubscriberActionsProps) => {
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  const isDeleteAllowed = hasPermission(orgPermission?.roles, AccessEnum.CanDeleteSubscriber, session)
  const { mutateAsync: deleteSubscriber } = useDeleteSubscriber()
  const { successNotification, errorNotification } = useNotification()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteSubscriber = async () => {
    try {
      await deleteSubscriber({ deleteSubscriberEmail: subscriberEmail })
      successNotification({
        title: 'Subscriber deleted successfully',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  if (!isDeleteAllowed) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Trash2
          size={ICON_SIZE}
          onClick={(e) => {
            e.stopPropagation()
            setIsDeleteDialogOpen(true)
          }}
          className={`cursor-pointer`}
        />
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteSubscriber}
        title={`Delete Subscriber`}
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{subscriberEmail}</b> from the system.
          </>
        }
      />
    </>
  )
}
