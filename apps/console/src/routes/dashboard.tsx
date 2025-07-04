import {
  CircleGaugeIcon,
  LayersIcon,
  SettingsIcon,
  UsersRoundIcon,
  UserRoundCogIcon,
  Users,
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
  ListChecks,
  Settings2,
  ScrollText,
  Workflow,
  NotebookPen,
  FileBadge2,
} from 'lucide-react'
import { NavHeading, type NavItem, type Separator } from '@/types'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { isAuditLogViewer } from '@/lib/authz/utils.ts'

export const useNavItems = (): (NavItem | Separator | NavHeading)[] => {
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)

  return [
    {
      title: 'Home',
      href: '/dashboard',
      icon: CircleGaugeIcon,
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: ListChecks,
    },
    {
      type: 'separator',
    },
    {
      title: 'Programs',
      href: '/programs',
      icon: ShieldCheck,
    },
    {
      title: 'Risks',
      href: '/risks',
      icon: AlertTriangle,
    },
    {
      title: 'Controls',
      href: '/controls',
      icon: Settings2,
    },
    {
      title: 'Evidence',
      href: '/evidence',
      icon: Fingerprint,
    },
    {
      title: 'Policies',
      href: '/policies',
      icon: ScrollText,
    },
    {
      title: 'Procedures',
      href: '/procedures',
      icon: Workflow,
    },
    {
      title: 'Questionnaires',
      href: '/questionnaires',
      icon: NotebookPen,
    },
    {
      title: 'Standards',
      href: '/standards',
      icon: FileBadge2,
    },
    {
      type: 'separator',
    },
    {
      title: 'Groups',
      href: '/groups',
      icon: UsersRoundIcon,
    },
    {
      type: 'separator',
    },
    {
      title: 'Organization settings',
      href: '/organization-settings',
      icon: SettingsIcon,
      isChildren: true,
      children: [
        {
          title: 'General Settings',
          href: '/organization-settings/general-settings',
        },
        {
          title: 'Authentication',
          href: '/organization-settings/authentication',
        },
        {
          title: 'Members',
          href: '/organization-settings/members',
        },
        {
          title: 'Subscribers',
          href: '/organization-settings/subscribers',
        },
        {
          title: 'Billing',
          href: '/organization-settings/billing',
        },
        ...(isAuditLogViewer(permission?.roles)
          ? [
              {
                title: 'Audit Logs',
                href: '/organization-settings/logs',
              },
            ]
          : []),
      ],
    },
    {
      type: 'separator',
    },
    {
      title: 'User settings',
      href: '/organization-settings',
      icon: UserRoundCogIcon,
      isChildren: true,
      children: [
        {
          title: 'Profile',
          href: '/user-settings/profile',
        },
        {
          title: 'Developers',
          href: '/user-settings/developers',
        },
      ],
    },
  ]
}

export const PersonalNavItems: (NavItem | Separator | NavHeading)[] = [
  {
    type: 'heading',
    heading: 'Organizations',
  },
  {
    title: 'My organizations',
    href: '/organization',
    icon: LayersIcon,
  },
  {
    type: 'separator',
  },
  {
    type: 'heading',
    heading: 'User settings',
  },
  {
    title: 'My profile',
    href: '/user-settings/profile',
    icon: Users,
  },
]
