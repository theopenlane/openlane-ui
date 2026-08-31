import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type OrgMembershipExportNode } from '@/lib/graphql-hooks/member'
import { formatDateTime } from '@/utils/date'
import { type TExportColumn } from '@/utils/exportToCSV'
import { getSsoExemptReason, getTfaEnforcedReason } from '../member-status'

type TGetMemberExportColumnsProps = {
  ssoEnforced: boolean
  exemptDomains: string[]
}

export const getMemberExportColumns = ({ ssoEnforced, exemptDomains }: TGetMemberExportColumnsProps): TExportColumn<OrgMembershipExportNode>[] => {
  const ssoColumns: TExportColumn<OrgMembershipExportNode>[] = [
    { label: 'SSO', accessor: (member) => (getSsoExemptReason(member, exemptDomains) ? 'Exempt' : 'Enforced') },
    { label: 'SSO Exempt Reason', accessor: (member) => getSsoExemptReason(member, exemptDomains) ?? '' },
  ]

  return [
    { label: 'Name', accessor: (member) => member.user.displayName },
    { label: 'Email', accessor: (member) => member.user.email },
    { label: 'Role', accessor: (member) => getEnumLabel(member.role) },
    { label: 'Additional Roles', accessor: (member) => (member.additionalRoles ?? []).join('; ') },
    { label: 'Joined', accessor: (member) => formatDateTime(member.createdAt) },
    { label: 'Provider', accessor: (member) => getEnumLabel(member.user.authProvider) },
    ...(ssoEnforced ? ssoColumns : []),
    { label: '2FA', accessor: (member) => (member.tfaEnforced ? 'Enforced' : 'Not enforced') },
    { label: '2FA Reason', accessor: (member) => (member.tfaEnforced ? getTfaEnforcedReason(member) : '') },
  ]
}
