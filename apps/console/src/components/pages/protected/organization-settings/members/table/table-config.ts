import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { InvitesFilterIcons, MembersFilterIcons } from '@/components/shared/enum-mapper/members-enum'
import { FilterField } from '@/types'
import { InviteInviteStatus, InviteRole, OrgMembershipRole, UserAuthProvider } from '@repo/codegen/src/schema'

const AUTH_PROVIDER_LABELS: Partial<Record<UserAuthProvider, string>> = {
  [UserAuthProvider.CREDENTIALS]: 'Credentials',
  [UserAuthProvider.GITHUB]: 'GitHub',
  [UserAuthProvider.GOOGLE]: 'Google',
  [UserAuthProvider.OIDC]: 'SSO',
  [UserAuthProvider.WEBAUTHN]: 'Passkeys',
}

const INVITE_STATUS_LABELS: Partial<Record<InviteInviteStatus, string>> = {
  [InviteInviteStatus.INVITATION_ACCEPTED]: 'Accepted',
  [InviteInviteStatus.INVITATION_EXPIRED]: 'Expired',
  [InviteInviteStatus.INVITATION_SENT]: 'Outstanding',
  [InviteInviteStatus.APPROVAL_REQUIRED]: 'Approval required',
}

export const MEMBERS_FILTER_FIELDS: FilterField[] = [
  {
    key: 'authProviderIn',
    label: 'Providers',
    type: 'multiselect',
    icon: MembersFilterIcons.Providers,
    options: enumToOptions(UserAuthProvider, AUTH_PROVIDER_LABELS),
  },
  {
    key: 'roleIn',
    label: 'Role',
    type: 'multiselect',
    icon: MembersFilterIcons.Role,
    options: enumToOptions(OrgMembershipRole),
  },
]

export const INVITES_FILTER_FIELDS: FilterField[] = [
  { key: 'createdAt', label: 'Created At', type: 'dateRange', icon: InvitesFilterIcons.CreatedAt },
  {
    key: 'roleIn',
    label: 'Role',
    type: 'multiselect',
    icon: InvitesFilterIcons.Role,
    options: enumToOptions(InviteRole),
  },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: InvitesFilterIcons.Status,
    options: enumToOptions(InviteInviteStatus, INVITE_STATUS_LABELS),
  },
]

export const INVITES_SORT_FIELDS = [
  { key: 'send_attempts', label: 'Send Attempts' },
  { key: 'expires', label: 'Expires' },
  { key: 'STATUS', label: 'Status' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]

export const MEMBERS_SORT_FIELDS = [{ key: 'ROLE', label: 'Role' }]
