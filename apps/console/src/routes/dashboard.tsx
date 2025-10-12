import {
  AlertTriangle,
  Bot,
  DollarSign,
  FileBadge2,
  Fingerprint,
  GlobeLock,
  Handshake,
  History,
  House,
  KeyRound,
  ListChecks,
  MailCheck,
  NotebookPen,
  ScrollText,
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
import { TData } from '@/lib/authz/access-api.ts'

export const topNavigationItems = (): (NavItem | Separator | NavHeading)[] => [
  {
    type: 'separator',
  },
  {
    title: 'Home',
    href: '/dashboard',
    icon: House,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: ListChecks,
  },
  {
    title: 'Compliance',
    plan: PlanEnum.COMPLIANCE_MODULE,
    icon: ShieldCheck,
    href: '/',
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
    children: [
      {
        title: 'Settings',
        href: '/trust-center/settings',
        icon: Settings2,
      },
    ],
  },
]

export const bottomNavigationItems = (orgPermission: TData): (NavItem | Separator | NavHeading)[] => [
  {
    title: 'Organization settings',
    href: '/organization-settings',
    icon: SettingsIcon,
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
      },
      {
        title: 'Billing',
        href: '/organization-settings/billing',
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
    children: [
      {
        title: 'Members',
        href: '/organization-settings/members',
        icon: UserRoundPlus,
      },
      {
        title: 'Groups',
        href: '/groups',
        icon: Users,
      },
    ],
  },
  {
    title: 'Developers',
    href: '/developers',
    icon: Bot,
    children: [
      {
        title: 'API Tokens',
        href: '/organization-settings/developers',
        icon: KeyRound,
      },
      {
        title: 'Personal Access Tokens',
        href: '/user-settings/developers',
        icon: KeyRound,
      },
    ],
  },
  {
    title: 'User settings',
    href: '/user-settings/profile',
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
