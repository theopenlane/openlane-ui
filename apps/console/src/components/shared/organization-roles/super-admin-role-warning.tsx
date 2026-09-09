import { Callout } from '@/components/shared/callout/callout'

export const SuperAdminRoleWarning = () => (
  <Callout variant="warning" compact>
    Super Admin grants full access to the organization. Consider assigning <b>Admin</b> or <b>Member</b> with specific functional roles instead, to follow least privilege.
  </Callout>
)
