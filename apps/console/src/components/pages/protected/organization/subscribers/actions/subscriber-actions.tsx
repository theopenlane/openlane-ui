'use client'

import { MoreHorizontal, RotateCw, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useDeleteSubscriberMutation } from '@repo/codegen/src/schema'
import { type UseQueryExecute } from 'urql'

type SubscriberActionsProps = {
  subscriberEmail: string
  refetchSubscribers: UseQueryExecute
}

const ICON_SIZE = 12

export const SubscriberActions = ({ subscriberEmail: subscriberEmail, refetchSubscribers: refetechSubscribers }: SubscriberActionsProps) => {
  const { actionIcon } = pageStyles()
  const { successNotification, errorNotification } = useNotification()
  const [_, deleteSubscriber] = useDeleteSubscriberMutation()

  const handleDeleteSubscriber = async () => {
    const response = await deleteSubscriber({ deleteSubscriberEmail: subscriberEmail })

    if (response.error) {
      errorNotification({
        title: 'There was a problem deleting the subscriber, please try again',
      })
    }

    if (response.data) {
      successNotification({
        title: 'Subscriber deleted successfully',
      })
      refetechSubscribers({
        requestPolicy: 'network-only',
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
