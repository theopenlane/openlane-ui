'use client'

import { MoreHorizontal, RotateCw, Trash2 } from 'lucide-react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { useCreateBulkInvite, useDeleteOrganizationInvite } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { InviteRole, type CreateInviteInput, type InputMaybe } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { useOrgMemberPermissions } from '@/lib/authz/use-org-member-permissions'

type InviteActionsProps = {
  inviteId: string
  recipient: string
  role: InviteRole
}

const ICON_SIZE = 12

export const InviteActions = ({ inviteId, recipient, role }: InviteActionsProps) => {
  const { canManageMembers, canInviteMembers, canInviteAdmins } = useOrgMemberPermissions()
  // Resending re-issues the same invite, so it belongs to whoever may issue an
  // invite at that level — a MEMBER holds can_invite_members and must keep it.
  // Deleting an existing invite is member management, which is a separate grant.
  const canResend = role === InviteRole.ADMIN || role === InviteRole.OWNER || role === InviteRole.SUPER_ADMIN ? canInviteAdmins : canInviteMembers
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

  if (!canResend && !canManageMembers) {
    return null
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
          {canResend && (
            <DropdownMenuItem onSelect={resend}>
              <RotateCw width={ICON_SIZE} /> Resend Invite
            </DropdownMenuItem>
          )}
          {canManageMembers && (
            <DropdownMenuItem onSelect={handleDeleteInvite}>
              <Trash2 width={ICON_SIZE} /> Delete Invite
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
