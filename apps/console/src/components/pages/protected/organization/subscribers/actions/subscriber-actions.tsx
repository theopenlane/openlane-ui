'use client'

import { MoreHorizontal, RotateCw, Trash2 } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
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
  const { toast } = useToast()
  const [_, deleteSubscriber] = useDeleteSubscriberMutation()

  const handleDeleteSubscriber = async () => {
    const response = await deleteSubscriber({ deleteSubscriberEmail: subscriberEmail })

    if (response.error) {
      toast({
        title: 'There was a problem deleting the subscriber, please try again',
        variant: 'destructive',
      })
    }

    if (response.data) {
      toast({
        title: 'Subscriber deleted successfully',
        variant: 'success',
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
