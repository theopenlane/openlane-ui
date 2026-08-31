'use client'

import { MoreHorizontal, RotateCw, Trash2 } from 'lucide-react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useCreateBulkInvite, useDeleteOrganizationInvite } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { type CreateInviteInput, type InputMaybe, type InviteRole } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'

type InviteActionsProps = {
  inviteId: string
  recipient: string
  role: InviteRole
}

const ICON_SIZE = 12

export const InviteActions = ({ inviteId, recipient, role }: InviteActionsProps) => {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteInvite } = useDeleteOrganizationInvite()
  const { mutateAsync: inviteMembers } = useCreateBulkInvite()
  const queryClient = useQueryClient()

  const handleDeleteInvite = async () => {
    try {
      await deleteInvite({ deleteInviteId: inviteId })
      successNotification({
        title: 'Invite deleted successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const resend = async () => {
    const inviteInput: InputMaybe<CreateInviteInput[]> = [
      {
        recipient,
        role,
      },
    ]

    try {
      await inviteMembers({ input: inviteInput })
      successNotification({
        title: 'Invite resent successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="-mr-2" data-testid="invite-actions-trigger">
          <MoreHorizontal className="h-4 w-4 text-brand" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-10">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={resend}>
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
