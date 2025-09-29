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

export const generateNavItems = () // canEdit?: boolean
: (NavItem | Separator | NavHeading)[] => [
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
  // {
  //   title: 'Entities',
  //   href: '/entities',
  //   icon: Building,
  // },
  // {
  //   title: 'Assets',
  //   href: '/assets',
  //   icon: ShapesIcon,
  // },
  // {
  //   type: 'separator',
  // },
  // {
  //   title: 'Reporting',
  //   href: '/reporting',
  //   icon: LineChart,
  // },
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
        hidden: false,
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
      {
        title: 'Developers',
        href: '/organization-settings/developers',
      },
      {
        title: 'Audit Logs',
        href: '/organization-settings/logs',
      },
      {
        title: 'Integrations',
        href: '/organization-settings/integrations',
        // hidden: !canEdit,
        hidden: true,
      },
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
      // {
      //   title: 'Alerts & Preferences',
      //   href: '/user-settings/alerts-preferences',
      // },
    ],
  },
  {
    title: 'Trust center',
    hidden: true,
    href: '/trust-center',
    icon: SettingsIcon,
    isChildren: true,
    children: [
      {
        title: 'Settings',
        hidden: true,
        href: '/trust-center/settings',
      },
    ],
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
