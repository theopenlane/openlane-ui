import {
  BarChart3Icon,
  CircleGaugeIcon,
  FileIcon,
  HandshakeIcon,
  LayersIcon,
  SettingsIcon,
  UsersRoundIcon,
  UserRoundCogIcon,
  Users,
  TriangleAlertIcon,
  FileQuestion,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Fingerprint,
  FileText,
  ClipboardList,
  ListChecks,
  Library,
  ShapesIcon,
  Settings2,
  ScrollText,
  Workflow,
  NotebookPen,
  FileBadge,
  FileBadge2,
  Building,
  LineChart,
} from 'lucide-react'
import { NavHeading, type NavItem, type Separator } from '@/types'

export const NavItems: (NavItem | Separator | NavHeading)[] = [
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
    href: '/programs/evidence',
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
    title: 'Entities',
    href: '/entities',
    icon: Building,
  },
  {
    title: 'Assets',
    href: '/assets',
    icon: ShapesIcon,
  },
  {
    type: 'separator',
  },
  {
    title: 'Reporting',
    href: '/reporting',
    icon: LineChart,
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
      {
        title: 'Alerts & Preferences',
        href: '/user-settings/alerts-preferences',
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
