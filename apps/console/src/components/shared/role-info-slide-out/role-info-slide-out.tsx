'use client'

import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { InfoSlideOut } from '@repo/ui/info-slide-out'
import { Badge } from '@repo/ui/badge'
import { Callout } from '@/components/shared/callout/callout'
import { UserRoleIconMapper } from '@/components/shared/enum-mapper/user-role-enum'
import { toHumanLabel } from '@/utils/strings'

type RoleInfo = {
  role: OrgMembershipRole
  description: string
  capabilities: string[]
  comingSoon?: boolean
}

const ROLE_INFO: RoleInfo[] = [
  {
    role: OrgMembershipRole.OWNER,
    description: 'Complete control over the organization',
    capabilities: [
      'All Admin permissions',
      'Manage billing and subscription',
      'Transfer or delete the organization',
      'Cannot be removed or demoted by other members',
      'Limited to a single user within the organization',
    ],
  },
  {
    role: OrgMembershipRole.SUPER_ADMIN,
    description: 'Full administrative control except organization deletion',
    capabilities: ['All Admin permissions', 'Manage organization-level settings', 'Invite and manage users', 'Access all objects within the organization'],
  },
  {
    role: OrgMembershipRole.ADMIN,
    description: 'Broad access to manage members and resources',
    capabilities: ['Invite and remove members', 'Create and manage groups', 'Read and write access to a subset resources by default'],
  },
  {
    role: OrgMembershipRole.MEMBER,
    description: 'Standard access for day-to-day work',
    capabilities: ['Read only access by default', 'Cannot manage organization settings', 'Can create evidence, tasks, and comments'],
  },
  {
    role: OrgMembershipRole.AUDITOR,
    description: 'Read-only access for compliance and review',
    capabilities: ['Read-only access to a limited set of resources', 'Can write comments, create evidence requests, and tasks', 'Suitable for compliance reviewers and auditors'],
    comingSoon: true,
  },
]

export function RoleInfoSlideOut() {
  return (
    <InfoSlideOut
      title="Organization Roles"
      docsUrl="https://docs.theopenlane.io/docs/platform/security/authorization/overview"
      trigger={(open) => (
        <Callout variant="info" compact>
          Not sure which role to assign?{' '}
          <button type="button" onClick={open} className="underline underline-offset-4 decoration-2 hover:decoration-4 font-medium transition-all">
            Read more about roles
          </button>
        </Callout>
      )}
    >
      <div className="flex flex-col gap-6 pt-2">
        {ROLE_INFO.map(({ role, description, capabilities, comingSoon }) => (
          <div key={role} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{UserRoleIconMapper[role]}</span>
              <h4 className="font-semibold text-sm text-text-header">{toHumanLabel(role)}</h4>
              {comingSoon && (
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                  Coming soon
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            <ul className="flex flex-col gap-1 mt-0.5">
              {capabilities.map((cap) => (
                <li key={cap} className="text-sm text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </InfoSlideOut>
  )
}
