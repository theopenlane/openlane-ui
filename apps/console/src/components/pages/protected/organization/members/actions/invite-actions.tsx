'use client'

import { MoreHorizontal, RotateCw, Trash2 } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useDeleteOrganizationInviteMutation } from '@repo/codegen/src/schema'
import { type UseQueryExecute } from 'urql'

type InviteActionsProps = {
  inviteId: string
  refetchInvites: UseQueryExecute
}

const ICON_SIZE = 12

export const InviteActions = ({ inviteId, refetchInvites }: InviteActionsProps) => {
  const { actionIcon } = pageStyles()
  const { toast } = useToast()
  const [_, deleteInvite] = useDeleteOrganizationInviteMutation()

  const handleDeleteInvite = async () => {
    const response = await deleteInvite({ deleteInviteId: inviteId })

    if (response.error) {
      toast({
        title: 'There was a problem deleting this invite, please try again',
        variant: 'destructive',
      })
    }

    if (response.data) {
      toast({
        title: 'Invite deleted successfully',
        variant: 'success',
      })
      refetchInvites({
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
          <DropdownMenuItem onSelect={(e) => alert('Coming soon')}>
            <RotateCw width={ICON_SIZE} /> Resend Invite
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDeleteInvite}>
            <Trash2 width={ICON_SIZE} /> Delete Invite
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
