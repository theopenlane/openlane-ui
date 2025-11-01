import {
  AlertTriangle,
  Bot,
  Building2,
  DollarSign,
  FileBadge2,
  Fingerprint,
  GlobeLock,
  Handshake,
  History,
  House,
  KeyRoundIcon,
  ListChecks,
  MailCheck,
  NotebookPen,
  ScrollText,
  ServerCog,
  Settings,
  Settings2,
  SettingsIcon,
  ShieldCheck,
  UserCog,
  UserRoundPen,
  UserRoundPlus,
  Users,
  Workflow,
} from 'lucide-react'
import { NavHeading, type NavItem, type Separator } from '@/types'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { canEdit } from '@/lib/authz/utils'
import { TData } from '@/types/authz'
import type { Session } from 'next-auth'

export const topNavigationItems = (session?: Session): (NavItem | Separator | NavHeading)[] => [
  {
    type: 'separator',
  },
  {
    title: 'Home',
    href: '/dashboard',
    icon: House,
    hidden: session?.user?.isOnboarding,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: ListChecks,
    hidden: session?.user?.isOnboarding,
  },
  {
    title: 'Compliance',
    plan: PlanEnum.COMPLIANCE_MODULE,
    icon: ShieldCheck,
    href: '/',
    hidden: session?.user?.isOnboarding,
    children: [
      {
        title: 'Programs',
        href: '/programs',
        icon: ShieldCheck,
      },
      {
        title: 'Controls',
        href: '/controls',
        params: '?tab=report',
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
        title: 'Standards Catalog',
        href: '/standards',
        icon: FileBadge2,
      },
      {
        title: 'Questionnaires',
        href: '/questionnaires',
        icon: NotebookPen,
      },
      {
        title: 'Risks',
        href: '/risks',
        icon: AlertTriangle,
      },
    ],
  },
  {
    title: 'Trust center',
    plan: PlanEnum.TRUST_CENTER_MODULE,
    href: '/trust-center',
    icon: Handshake,
    isChildren: true,
    hidden: session?.user?.isOnboarding,
    children: [
      {
        title: 'Settings',
        href: '/trust-center/settings',
        icon: Settings,
      },
    ],
  },
]

export const bottomNavigationItems = (orgPermission?: TData, session?: Session): (NavItem | Separator | NavHeading)[] => [
  {
    title: 'Organization settings',
    href: '/organization-settings',
    hidden: session?.user?.isOnboarding,
    icon: Building2,
    children: [
      {
        title: 'General Settings',
        href: '/organization-settings/general-settings',
        hidden: !canEdit(orgPermission?.roles),
        icon: SettingsIcon,
      },
      {
        title: 'Authentication',
        href: '/organization-settings/authentication',
        icon: GlobeLock,
      },
      {
        title: 'Subscribers',
        href: '/organization-settings/subscribers',
        icon: MailCheck,
        hidden: true,
      },
      {
        title: 'Billing',
        href: '/organization-settings/billing',
        hidden: !canEdit(orgPermission?.roles),
        icon: DollarSign,
      },
      {
        title: 'Audit Logs',
        href: '/organization-settings/logs',
        icon: History,
      },
      {
        title: 'Integrations',
        href: '/organization-settings/integrations',
        // hidden: !canEdit,
        hidden: true,
        icon: Workflow,
      },
    ],
  },
  {
    title: 'User Management',
    href: '/user-management',
    icon: UserRoundPen,
    hidden: session?.user?.isOnboarding,
    children: [
      {
        title: 'Members',
        href: '/user-management/members',
        icon: UserRoundPlus,
      },
      {
        title: 'Groups',
        href: '/user-management/groups',
        icon: Users,
      },
    ],
  },
  {
    title: 'Developers',
    href: '/developers',
    icon: Bot,
    hidden: session?.user?.isOnboarding,
    children: [
      {
        title: 'API Tokens',
        href: '/developers/api-tokens',
        icon: ServerCog,
      },
      {
        title: 'Personal Access Tokens',
        href: '/developers/personal-access-tokens',
        icon: KeyRoundIcon,
      },
    ],
  },
  {
    title: 'User settings',
    href: '/user-settings',
    children: [
      {
        title: 'Profile',
        href: '/user-settings/profile',
        icon: UserRoundPen,
      },
    ],
    icon: UserCog,
  },
]

export const personalNavigationItems = (): (NavItem | Separator | NavHeading)[] => [
  {
    title: 'User settings',
    href: '/user-settings/profile',
    icon: UserCog,
  },
]
