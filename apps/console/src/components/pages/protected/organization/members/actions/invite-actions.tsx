'use client'

import { MoreHorizontal, RotateCw, Trash2 } from 'lucide-react'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useDeleteOrganizationInvite } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'

type InviteActionsProps = {
  inviteId: string
}

const ICON_SIZE = 12

export const InviteActions = ({ inviteId }: InviteActionsProps) => {
  const { actionIcon } = pageStyles()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteInvite } = useDeleteOrganizationInvite()

  const handleDeleteInvite = async () => {
    try {
      await deleteInvite({ deleteInviteId: inviteId })
      successNotification({
        title: 'Invite deleted successfully',
      })
    } catch {
      errorNotification({
        title: 'There was a problem deleting this invite, please try again',
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
