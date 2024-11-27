import {
  BarChart3Icon,
  CircleGaugeIcon,
  FileIcon,
  HandshakeIcon,
  LayersIcon,
  ListChecks,
  SettingsIcon,
  ShapesIcon,
  UserRoundCogIcon,
  Users,
  ShieldCheckIcon,
  TriangleAlertIcon,
  FileQuestion,
} from 'lucide-react'
import { NavHeading, type NavItem, type Separator } from '@/types'

export const NavItems: (NavItem | Separator | NavHeading)[] = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: CircleGaugeIcon,
  },
  {
    title: 'My Tasks',
    href: '/tasks',
    addCount: true,
    icon: ListChecks,
  },
  {
    type: 'separator',
  },
  {
    title: 'Programs',
    href: '/programs',
    icon: ShieldCheckIcon,
    isChildren: true,
    children: [
      {
        title: 'Programs',
        href: '/programs/programs',
      },
      {
        title: 'Controls',
        href: '/programs/controls',
      },
      {
        title: 'Tasks',
        href: '/programs/tasks',
      },
      {
        title: 'Evidence',
        href: '/programs/evidence',
      },
      {
        title: 'Settings',
        href: '/programs/settings',
      }
    ],
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileQuestion,
    isChildren: true,
    children: [
      {
        title: 'Questionnaires',
        href: '/documents/questionnaires',
      },
    ],
  },
  {
    title: 'Policies & Procedures',
    href: '/policies-and-procedures',
    icon: FileIcon,
    isChildren: true,
    children: [
      {
        title: 'Policies',
        href: '/policies-and-procedures/policies',
      },
      {
        title: 'Procedures',
        href: '/policies-and-procedures/procedures',
      },
    ],
  },
  {
    title: 'Risks',
    href: '/risks',
    icon: TriangleAlertIcon,
  },
  {
    title: 'Entities',
    href: '/entities',
    icon: HandshakeIcon,
    isChildren: true,
    children: [
      {
        title: 'Vendors',
        href: '/entities/vendors',
      },
    ],
  },
  {
    title: 'Assets',
    href: '/assets',
    icon: ShapesIcon,
    isChildren: true,
    children: [
      {
        title: 'IP Addresses',
        href: '/assets/ip-addresses',
      },
      {
        title: 'Domains',
        href: '/assets/domains',
      },
      {
        title: 'Servers',
        href: '/assets/servers',
      },
    ],
  },
  {
    title: 'Reporting',
    href: '/reporting',
    icon: BarChart3Icon,
    isChildren: true,
    children: [
      {
        title: 'Compliance',
        href: '/reporting/compliance',
      },
    ],
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
        title: 'Billing & Usage',
        href: '/organization-settings/billing-usage',
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
