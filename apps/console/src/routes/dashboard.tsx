import {
  AlertTriangle,
  Bot,
  Bug,
  Building2,
  DollarSign,
  FileBadge2,
  FileSearch,
  FileText,
  Fingerprint,
  GlobeLock,
  Handshake,
  History,
  House,
  KeyRoundIcon,
  ListChecks,
  ListOrdered,
  MailCheck,
  MessageSquareText,
  ScanLine,
  Radar,
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
  Wrench,
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
  Route,
  CircleHelp,
  ClipboardPenLine,
  SquareActivity,
  IdCard,
  Sparkles,
  Inbox,
  Activity,
  NotebookPen,
  LayoutGrid,
  Waypoints,
} from 'lucide-react'
import { type NavHeading, type NavItem, type Separator } from '@/types'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { canEdit, isOwnerOrSuperAdmin } from '@/lib/authz/utils'
import { type TPermissionData } from '@/types/authz'
import type { Session } from 'next-auth'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { featureUtil } from '@/lib/subscription-plan/plans'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export const topNavigationItems = (session: Session | null, currentUserRole?: OrgMembershipRole): (NavItem | Separator | NavHeading)[] => {
  const billingExpired = featureUtil.hasNoModules(session)
  const isAuditor = currentUserRole === OrgMembershipRole.AUDITOR
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
      title: 'Compliance',
      icon: ShieldCheck,
      href: '/',
      hidden: session?.user?.isOnboarding || billingExpired,
      children: [
        {
          title: 'Auditor Dashboard',
          href: '/auditor-dashboard',
          icon: SquareActivity,
          hidden: !isAuditor,
          objectType: ObjectTypes.PROGRAM,
        },
        {
          title: 'Programs',
          href: '/programs',
          icon: ShieldCheck,
          objectType: ObjectTypes.PROGRAM,
        },
        {
          title: 'Controls',
          href: '/controls',
          params: '?tab=report',
          icon: Settings2,
          objectType: ObjectTypes.CONTROL,
        },
        {
          title: 'Evidence',
          href: '/evidence',
          icon: Fingerprint,
          objectType: ObjectTypes.EVIDENCE,
        },
        {
          title: 'Policies',
          href: '/policies',
          icon: ScrollText,
          objectType: ObjectTypes.INTERNAL_POLICY,
        },
        {
          title: 'Procedures',
          href: '/procedures',
          icon: Workflow,
          objectType: ObjectTypes.PROCEDURE,
        },
        {
          title: 'Standards Catalog',
          href: '/standards',
          icon: FileBadge2,
          objectType: ObjectTypes.STANDARD,
        },
      ],
    },
    {
      title: 'Registry',
      icon: LibraryBig,
      href: '/registry',
      hidden: session?.user?.isOnboarding || billingExpired,
      children: [
        {
          title: 'Platforms',
          href: '/registry/platforms',
          icon: LayoutGrid,
          objectType: ObjectTypes.PLATFORM,
        },
        {
          title: 'System Details',
          href: '/registry/system-details',
          icon: ServerCog,
          objectType: ObjectTypes.SYSTEM_DETAIL,
        },
        {
          title: 'Assets',
          href: '/registry/assets',
          icon: Laptop,
          objectType: ObjectTypes.ASSET,
        },
        {
          title: 'Vendors',
          href: '/registry/vendors',
          icon: Building2,
          objectType: ObjectTypes.ENTITY,
        },
        {
          title: 'Personnel',
          href: '/registry/personnel',
          icon: IdCardLanyardIcon,
          objectType: ObjectTypes.IDENTITY_HOLDER,
        },
        {
          title: 'Contacts',
          href: '/registry/contacts',
          icon: IdCard,
          objectType: ObjectTypes.CONTACT,
        },
      ],
    },
    {
      title: 'Trust Center',
      plan: PlanEnum.TRUST_CENTER_MODULE,
      href: '/trust-center',
      icon: Handshake,
      isChildren: true,
      hidden: session?.user?.isOnboarding || billingExpired || isAuditor,
      children: [
        {
          title: 'Overview',
          href: '/trust-center/overview',
          icon: LayoutDashboard,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Branding',
          href: '/trust-center/branding',
          icon: Paintbrush,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Domain',
          href: '/trust-center/domain',
          icon: Globe,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Documents',
          href: '/trust-center/documents',
          icon: FileText,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'NDAs',
          href: '/trust-center/NDAs',
          icon: LockKeyhole,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Frameworks',
          href: '/trust-center/frameworks',
          icon: ShieldCheck,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Controls',
          href: '/trust-center/controls',
          icon: Settings2,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        { title: 'Subprocessors', href: '/trust-center/subprocessors', icon: Server, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'Updates', href: '/trust-center/updates', icon: Megaphone, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'Subscribers', href: '/trust-center/subscribers', icon: Users, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'Customer Logos', href: '/trust-center/customer-logos', icon: Component, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'FAQs', href: '/trust-center/faqs', icon: CircleHelp, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'Analytics', href: '/trust-center/analytics', icon: ChartLine, objectType: ObjectTypes.TRUST_CENTER },
      ],
    },
    {
      title: 'Exposure',
      href: '/exposure',
      icon: Radar,
      hidden: session?.user?.isOnboarding || billingExpired,
      children: [
        {
          title: 'Overview',
          href: '/exposure/overview',
          icon: LayoutDashboard,
          objectType: ObjectTypes.FINDING,
        },
        {
          title: 'Triage Queue',
          href: '/exposure/triage',
          icon: ListOrdered,
          objectType: ObjectTypes.VULNERABILITY,
        },
        {
          title: 'Risks',
          href: '/exposure/risks',
          icon: AlertTriangle,
          objectType: ObjectTypes.RISK,
        },
        {
          title: 'Scans',
          href: '/exposure/scans',
          icon: ScanLine,
          objectType: ObjectTypes.SCAN,
        },
        {
          title: 'Findings',
          href: '/exposure/findings',
          icon: FileSearch,
          objectType: ObjectTypes.FINDING,
        },
        {
          title: 'Vulnerabilities',
          href: '/exposure/vulnerabilities',
          icon: Bug,
          objectType: ObjectTypes.VULNERABILITY,
        },
        {
          title: 'Remediations',
          href: '/exposure/remediations',
          icon: Wrench,
          objectType: ObjectTypes.REMEDIATION,
        },
        {
          title: 'Reviews',
          href: '/exposure/reviews',
          icon: MessageSquareText,
          objectType: ObjectTypes.REVIEW,
        },
      ],
    },
    {
      title: 'Automation',
      href: '/automation',
      icon: Route,
      isChildren: true,
      hidden: session?.user?.isOnboarding || billingExpired || isAuditor,
      children: [
        {
          title: 'Tasks',
          href: '/automation/tasks',
          icon: ListChecks,
        },
        {
          title: 'Questionnaires',
          href: '/automation/questionnaires',
          icon: ClipboardPenLine,
          objectType: ObjectTypes.ASSESSMENT,
        },
        {
          title: 'Campaigns',
          href: '/automation/campaigns',
          icon: Megaphone,
          objectType: ObjectTypes.CAMPAIGN,
        },
        {
          title: 'Email Templates',
          href: '/automation/email-templates',
          icon: MailCheck,
        },
        {
          title: 'Integrations',
          href: '/automation/integrations',
          icon: Waypoints,
        },
        {
          title: 'Workflow Definitions',
          href: '/automation/workflows',
          icon: NotebookPen,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
        {
          title: 'Workflow Inbox',
          href: '/automation/workflows/inbox',
          icon: Inbox,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
        {
          title: 'Workflow Instances',
          href: '/automation/workflows/instances',
          icon: Activity,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
        {
          title: 'Workflow Templates',
          href: '/automation/workflows/templates',
          icon: Workflow,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
        {
          title: 'Workflow Wizard',
          href: '/automation/workflows/wizard',
          icon: Sparkles,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
      ],
    },
  ]
}

export const bottomNavigationItems = (session: Session | null, orgPermission?: TPermissionData, currentUserRole?: OrgMembershipRole): (NavItem | Separator | NavHeading)[] => {
  const isImpersonation = session?.user?.isImpersonation
  const billingExpired = featureUtil.hasNoModules(session)
  const isAuditor = currentUserRole === OrgMembershipRole.AUDITOR
  return [
    {
      title: 'Organization settings',
      href: '/organization-settings',
      hidden: session?.user?.isOnboarding || isAuditor,
      icon: Building2,
      children: [
        {
          title: 'General Settings',
          href: '/organization-settings/general-settings',
          hidden: !canEdit(orgPermission?.roles, session),
          icon: SettingsIcon,
        },
        {
          title: 'Authentication',
          href: '/organization-settings/authentication',
          hidden: billingExpired || !canEdit(orgPermission?.roles, session),
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
          hidden: !isOwnerOrSuperAdmin(currentUserRole) && !isImpersonation,
          icon: DollarSign,
        },
        {
          title: 'Audit Logs',
          href: '/organization-settings/logs',
          icon: History,
          hidden: true,
        },
      ],
    },
    {
      title: 'User Management',
      href: '/user-management',
      icon: UserRoundPen,
      hidden: session?.user?.isOnboarding || billingExpired || isAuditor,
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
      hidden: session?.user?.isOnboarding || billingExpired || isAuditor || isImpersonation,
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
      hidden: isImpersonation,
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
