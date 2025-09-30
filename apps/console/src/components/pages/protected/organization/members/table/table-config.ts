import { FilterField } from '@/types'
import { InviteInviteStatus, OrderDirection, OrgMembershipRole, UserAuthProvider } from '@repo/codegen/src/schema'
import { Calendar, Tags, UserRound } from 'lucide-react'

export const MEMBERS_FILTER_FIELDS: FilterField[] = [
  {
    key: 'providers',
    label: 'Providers',
    type: 'select',
    icon: UserRound,
    options: [
      { label: 'GitHub', value: UserAuthProvider.GITHUB },
      { label: 'Google', value: UserAuthProvider.GOOGLE },
      { label: 'Credentials', value: UserAuthProvider.CREDENTIALS },
    ],
  },
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    icon: UserRound,
    options: [
      { label: 'Member', value: OrgMembershipRole.MEMBER },
      { label: 'Owner', value: OrgMembershipRole.OWNER },
      { label: 'Admin', value: OrgMembershipRole.ADMIN },
    ],
  },
]

export const INVITES_FILTER_FIELDS: FilterField[] = [
  { key: 'createdAt', label: 'Created At', type: 'date', icon: Calendar },
  { key: 'role', label: 'Role', type: 'text', icon: UserRound },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    icon: Tags,
    options: [
      { label: 'Accepted', value: InviteInviteStatus.INVITATION_ACCEPTED },
      { label: 'Expired', value: InviteInviteStatus.INVITATION_EXPIRED },
      { label: 'Outstanding', value: InviteInviteStatus.INVITATION_SENT },
      { label: 'Approval required', value: InviteInviteStatus.APPROVAL_REQUIRED },
    ],
  },
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

export const MEMBERS_SORT_FIELDS = [{ key: 'ROLE', label: 'Role' }]
