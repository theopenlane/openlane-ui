'use client'

import { MoreHorizontal, RotateCw, Trash2 } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useDeleteSubscriber } from '@/lib/graphql-hooks/subscribes'
import { useQueryClient } from '@tanstack/react-query'

type SubscriberActionsProps = {
  subscriberEmail: string
}

const ICON_SIZE = 12

export const SubscriberActions = ({ subscriberEmail: subscriberEmail }: SubscriberActionsProps) => {
  const { actionIcon } = pageStyles()
  const { toast } = useToast()
  const { mutateAsync: deleteSubscriber } = useDeleteSubscriber()

  const handleDeleteSubscriber = async () => {
    await deleteSubscriber({ deleteSubscriberEmail: subscriberEmail })
    try {
      toast({
        title: 'Subscriber deleted successfully',
        variant: 'success',
      })
    } catch {
      toast({
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
