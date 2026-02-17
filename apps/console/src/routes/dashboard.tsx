import {
  AlertTriangle,
  Bot,
  Building2,
  DollarSign,
  FileBadge2,
  FileText,
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
  Settings2,
  SettingsIcon,
  ShieldCheck,
  Tag,
  UserCog,
  UserRoundPen,
  UserRoundPlus,
  Users,
  Workflow,
  Megaphone,
  Paintbrush,
  Component,
  LockKeyhole,
  LayoutDashboard,
  ChartLine,
  Globe,
  Server,
  LibraryBig,
  Laptop,
  IdCardLanyardIcon,
} from 'lucide-react'
import { NavHeading, type NavItem, type Separator } from '@/types'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { canEdit } from '@/lib/authz/utils'
import { TPermissionData } from '@/types/authz'
import type { Session } from 'next-auth'
import { hasNoModules } from '@/lib/auth/utils/modules'

export const topNavigationItems = (session: Session | null): (NavItem | Separator | NavHeading)[] => {
  const billingExpired = hasNoModules(session)
  return [
    {
      type: 'separator',
    },
    {
      title: 'Home',
      href: '/dashboard',
      icon: House,
      hidden: session?.user?.isOnboarding || billingExpired,
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: ListChecks,
      hidden: session?.user?.isOnboarding || billingExpired,
    },
    {
      title: 'Compliance',
      plan: PlanEnum.COMPLIANCE_MODULE,
      icon: ShieldCheck,
      href: '/',
      hidden: session?.user?.isOnboarding || billingExpired,
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
      title: 'Registry',
      plan: PlanEnum.COMPLIANCE_MODULE,
      icon: LibraryBig,
      href: '/registry',
      hidden: true,
      // hidden: session?.user?.isOnboarding || billingExpired,
      children: [
        {
          title: 'Assets',
          href: '/registry/assets',
          icon: Laptop,
          hidden: true,
        },
        {
          title: 'Vendors',
          href: '/registry/vendors',
          icon: Building2,
          hidden: true,
        },
        {
          title: 'Personnel',
          href: '/registry/personnel',
          icon: IdCardLanyardIcon,
          hidden: true,
        },
      ],
    },
    {
      title: 'Trust center',
      plan: PlanEnum.TRUST_CENTER_MODULE,
      href: '/trust-center',
      icon: Handshake,
      isChildren: true,
      hidden: session?.user?.isOnboarding || billingExpired,
      children: [
        {
          title: 'Overview',
          href: '/trust-center/overview',
          icon: LayoutDashboard,
        },
        {
          title: 'Branding',
          href: '/trust-center/branding',
          icon: Paintbrush,
        },
        {
          title: 'Domain',
          href: '/trust-center/domain',
          icon: Globe,
        },
        {
          title: 'Documents',
          href: '/trust-center/documents',
          icon: FileText,
        },
        {
          title: 'NDAs',
          href: '/trust-center/NDAs',
          icon: LockKeyhole,
        },
        {
          title: 'Frameworks',
          href: '/trust-center/frameworks',
          icon: ShieldCheck,
        },
        { title: 'Subprocessors', href: '/trust-center/subprocessors', icon: Server },
        { title: 'Updates', href: '/trust-center/updates', icon: Megaphone },
        { title: 'Customer Logos', href: '/trust-center/customer-logos', icon: Component },
        { title: 'Analytics', href: '/trust-center/analytics', icon: ChartLine },
      ],
    },
  ]
}

export const bottomNavigationItems = (session: Session | null, orgPermission?: TPermissionData): (NavItem | Separator | NavHeading)[] => {
  const billingExpired = hasNoModules(session)
  return [
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
          hidden: billingExpired,
          icon: GlobeLock,
        },
        {
          title: 'Custom Data',
          href: '/organization-settings/custom-data',
          hidden: billingExpired,
          icon: Tag,
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
      hidden: session?.user?.isOnboarding || billingExpired,
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
      hidden: session?.user?.isOnboarding || billingExpired,
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
}

export const personalNavigationItems = (): (NavItem | Separator | NavHeading)[] => [
  {
    title: 'User settings',
    href: '/user-settings/profile',
    icon: UserCog,
  },
]
