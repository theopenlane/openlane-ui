import {
  LayersIcon,
  SettingsIcon,
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
  House,
  UserCog,
  KeyRound,
  UserRoundPlus,
  GlobeLock,
  MailCheck,
  History,
  DollarSign,
  Handshake,
  Bot,
  UserRoundPen,
} from 'lucide-react'
import { NavHeading, type NavItem, type Separator } from '@/types'

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
        href: '/control-report',
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
    hidden: true,
    href: '/trust-center',
    icon: Handshake,
    isChildren: true,
    children: [
      {
        title: 'Settings',
        hidden: true,
        href: '/trust-center/settings',
        icon: Settings2,
      },
    ],
  },
]

export const bottomNavigationItems = (): (NavItem | Separator | NavHeading)[] => [
  {
    title: 'Organization settings',
    href: '/organization-settings',
    icon: SettingsIcon,
    children: [
      {
        title: 'General Settings',
        href: '/organization-settings/general-settings',
        icon: SettingsIcon,
      },
      {
        title: 'Authentication',
        href: '/organization-settings/authentication',
        hidden: true, // the only thing here is domain restricted which currently has a bug
        icon: GlobeLock,
      },
      {
        title: 'Subscribers',
        href: '/user-management/subscribers',
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
    href: '/organization-settings',
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
    href: '/organization-settings',
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
