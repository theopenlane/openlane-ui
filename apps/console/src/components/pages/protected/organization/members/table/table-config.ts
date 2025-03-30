import { FilterField, SelectFilterField } from '@/types'
import { InviteInviteStatus, OrderDirection } from '@repo/codegen/src/schema'

export const INVITES_FILTER_FIELDS: FilterField[] = [
  { key: 'createdAt', label: 'Created At', type: 'date' },
  { key: 'role', label: 'Role', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Accepted', value: InviteInviteStatus.INVITATION_ACCEPTED },
      { label: 'Expired', value: InviteInviteStatus.INVITATION_EXPIRED },
      { label: 'Outstanding', value: InviteInviteStatus.INVITATION_SENT },
      { label: 'Approval required', value: InviteInviteStatus.APPROVAL_REQUIRED },
    ],
  } as SelectFilterField,
]

export const INVITES_SORT_FIELDS = [
  { key: 'send_attempts', label: 'Send Attempts' },
  { key: 'expires', label: 'Expires' },
  { key: 'STATUS', label: 'Status' },
  {
    key: 'created_at',
    label: 'Created At',
    default: {
      key: 'created_at',
      direction: OrderDirection.DESC,
    },
  },
  { key: 'updated_at', label: 'Updated At' },
]
