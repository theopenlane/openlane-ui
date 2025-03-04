'use client'

import { MoreHorizontal, RotateCw, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useDeleteSubscriber } from '@/lib/graphql-hooks/subscribes'

type SubscriberActionsProps = {
  subscriberEmail: string
}

const ICON_SIZE = 12

export const SubscriberActions = ({ subscriberEmail: subscriberEmail }: SubscriberActionsProps) => {
  const { actionIcon } = pageStyles()
  const { mutateAsync: deleteSubscriber } = useDeleteSubscriber()
  const { successNotification, errorNotification } = useNotification()
  const handleDeleteSubscriber = async () => {
    await deleteSubscriber({ deleteSubscriberEmail: subscriberEmail })
    try {
      successNotification({
        title: 'Subscriber deleted successfully',
      })
    } catch {
      errorNotification({
        title: 'There was a problem deleting the subscriber, please try again',
        variant: 'destructive',
      })
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MoreHorizontal className={actionIcon()} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-10">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleDeleteSubscriber}>
            <Trash2 width={ICON_SIZE} /> Delete Subscriber
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
