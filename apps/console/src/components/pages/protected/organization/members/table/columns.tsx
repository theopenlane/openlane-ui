import { ColumnDef } from '@tanstack/react-table'
import { InviteInviteStatus, InviteRole } from '@repo/codegen/src/schema.ts'
import { Tag } from '@repo/ui/tag'
import { InviteActions } from '../actions/invite-actions'
import { formatDateSince } from '@/utils/date'
import { InvitationIconMapper } from '@/components/shared/icon-enum/invitation-enum.tsx'
import { UserRoleIconMapper } from '@/components/shared/icon-enum/user-role-enum.tsx'

export type InviteNode = {
  __typename?: 'Invite' | undefined
  id: string
  recipient: string
  status: InviteInviteStatus
  createdAt?: string
  role: InviteRole
  sendAttempts?: number
}

export const invitesColumns: ColumnDef<InviteNode>[] = [
  {
    accessorKey: 'recipient',
    header: 'Invited user',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ cell }) => {
      const status = cell.getValue() as InviteInviteStatus
      let statusLabel
      switch (status) {
        case InviteInviteStatus.APPROVAL_REQUIRED:
          statusLabel = 'Approval required'
          break
        case InviteInviteStatus.INVITATION_ACCEPTED:
          statusLabel = 'Accepted'
          break
        case InviteInviteStatus.INVITATION_EXPIRED:
          statusLabel = 'Expired'
          break
        case InviteInviteStatus.INVITATION_SENT:
          statusLabel = 'Outstanding'
          break
      }
      return (
        <Tag>
          <div className="flex gap-2 items-center">
            {InvitationIconMapper[status]}
            {statusLabel}
          </div>
        </Tag>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Sent',
    cell: ({ cell }) => formatDateSince(cell.getValue() as string),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ cell }) => {
      const role = cell.getValue() as InviteRole

      return (
        <div className="flex gap-2 items-center">
          {UserRoleIconMapper[role]}
          {role}
        </div>
      )
    },
  },
  {
    accessorKey: 'sendAttempts',
    header: 'Resend Attempts',
    cell: ({ cell }) => `${cell.getValue() || 0}/5`,
  },
  {
    accessorKey: 'id',
    header: '',
    cell: ({ row }) => {
      const invite = row.original
      return <InviteActions inviteId={invite.id} recipient={invite.recipient} role={invite.role} />
    },
  },
]
