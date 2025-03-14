'use client'

import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useDeleteSubscriber } from '@/lib/graphql-hooks/subscribes'
import { useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type SubscriberActionsProps = {
  subscriberEmail: string
}

const ICON_SIZE = 12

export const SubscriberActions = ({ subscriberEmail }: SubscriberActionsProps) => {
  const { actionIcon } = pageStyles()
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MoreHorizontal className={actionIcon()} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-10">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setIsDeleteDialogOpen(true)
              }}
            >
              <Trash2 width={ICON_SIZE} /> Delete Subscriber
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Subscriber Confirmation Dialog */}
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
