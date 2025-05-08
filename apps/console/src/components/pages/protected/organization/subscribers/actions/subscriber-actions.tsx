'use client'

import { Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { useDeleteSubscriber } from '@/lib/graphql-hooks/subscribes'
import { useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type SubscriberActionsProps = {
  subscriberEmail: string
}

const ICON_SIZE = 16

export const SubscriberActions = ({ subscriberEmail }: SubscriberActionsProps) => {
  const { mutateAsync: deleteSubscriber } = useDeleteSubscriber()
  const { successNotification, errorNotification } = useNotification()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteSubscriber = async () => {
    try {
      await deleteSubscriber({ deleteSubscriberEmail: subscriberEmail })
      successNotification({
        title: 'Subscriber deleted successfully',
      })
    } catch {
      errorNotification({
        title: 'There was a problem deleting the subscriber, please try again',
        variant: 'destructive',
      })
    } finally {
      setIsDeleteDialogOpen(false)
    }
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
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently remove the subscriber from the system."
      />
    </>
  )
}
