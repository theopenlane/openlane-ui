import { ColumnDef } from '@tanstack/react-table'
import { InviteInviteStatus, InviteRole } from '@repo/codegen/src/schema.ts'
import { Tag } from '@repo/ui/tag'
import { InviteActions } from '../actions/invite-actions'
import { formatDateSince } from '@/utils/date'

export type InviteNode = {
  __typename?: 'Invite' | undefined
  id: string
  recipient: string
  status: InviteInviteStatus
  createdAt?: any
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
          <>{statusLabel}</>
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
