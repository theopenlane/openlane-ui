import { UserRoundPen } from 'lucide-react'
import {
  ActivityIcon,
  ArchiveIcon,
  BadgeAlertIcon,
  BlocksIcon,
  BookTextIcon,
  BookmarkIcon,
  BriefcaseBusinessIcon,
  ChartBarDecreasingIcon,
  ChartSplineIcon,
  CircleHelpIcon,
  ClipboardCheckIcon,
  CogIcon,
  ConnectIcon,
  CreditCardIcon,
  EarthIcon,
  FileCheckIcon,
  FilePenLineIcon,
  FileTextIcon,
  FingerprintIcon,
  GaugeIcon,
  GalleryVerticalEndIcon,
  HeartHandshakeIcon,
  HistoryIcon,
  HomeIcon,
  IdCardIcon,
  KeyCircleIcon,
  KeyboardIcon,
  LaptopMinimalCheckIcon,
  LayersIcon,
  LayoutGridIcon,
  LayoutPanelTopIcon,
  LockIcon,
  MailCheckIcon,
  MessageCirclePlusIcon,
  MessageSquareMoreIcon,
  MonitorCogIcon,
  PenToolIcon,
  RouteIcon,
  SatelliteDishIcon,
  ScanTextIcon,
  SearchIcon,
  SendIcon,
  ServerIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  SquareActivityIcon,
  SquarePenIcon,
  TerminalIcon,
  UserRoundCogIcon,
  UserRoundPlusIcon,
  UsersIcon,
  UsersRoundIcon,
  WorkflowIcon,
  WrenchIcon,
} from '@/components/shared/icons/animated'
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
      icon: HomeIcon,
      hidden: session?.user?.isOnboarding || billingExpired,
    },
    {
      title: 'Compliance',
      icon: ShieldCheckIcon,
      href: '/',
      plan: PlanEnum.COMPLIANCE_MODULE,
      hidden: session?.user?.isOnboarding || billingExpired,
      children: [
        {
          title: 'Auditor Dashboard',
          href: '/auditor-dashboard',
          icon: SquareActivityIcon,
          hidden: !isAuditor,
          objectType: ObjectTypes.PROGRAM,
        },
        {
          title: 'Programs',
          href: '/programs',
          icon: ShieldCheckIcon,
          objectType: ObjectTypes.PROGRAM,
        },
        {
          title: 'Controls',
          href: '/controls',
          params: '?tab=report',
          icon: SlidersHorizontalIcon,
          objectType: ObjectTypes.CONTROL,
        },
        {
          title: 'Evidence',
          href: '/evidence',
          icon: FingerprintIcon,
          objectType: ObjectTypes.EVIDENCE,
        },
        {
          title: 'Policies',
          href: '/policies',
          icon: FileTextIcon,
          objectType: ObjectTypes.INTERNAL_POLICY,
        },
        {
          title: 'Procedures',
          href: '/procedures',
          icon: WorkflowIcon,
          objectType: ObjectTypes.PROCEDURE,
        },
        {
          title: 'Standards Catalog',
          href: '/standards',
          icon: FileCheckIcon,
          objectType: ObjectTypes.STANDARD,
        },
      ],
    },
    {
      title: 'Registry',
      icon: LayersIcon,
      href: '/registry',
      plan: [PlanEnum.COMPLIANCE_MODULE, PlanEnum.REGISTRY_MODULE],
      hidden: session?.user?.isOnboarding || billingExpired,
      children: [
        {
          title: 'Platforms',
          href: '/registry/platforms',
          icon: LayoutGridIcon,
          objectType: ObjectTypes.PLATFORM,
        },
        {
          title: 'System Details',
          href: '/registry/system-details',
          icon: MonitorCogIcon,
          objectType: ObjectTypes.SYSTEM_DETAIL,
        },
        {
          title: 'Assets',
          href: '/registry/assets',
          icon: LaptopMinimalCheckIcon,
          objectType: ObjectTypes.ASSET,
        },
        {
          title: 'Vendors',
          href: '/registry/vendors',
          icon: BriefcaseBusinessIcon,
          objectType: ObjectTypes.ENTITY,
        },
        {
          title: 'Personnel',
          href: '/registry/personnel',
          icon: UsersRoundIcon,
          objectType: ObjectTypes.IDENTITY_HOLDER,
        },
        {
          title: 'Contacts',
          href: '/registry/contacts',
          icon: GalleryVerticalEndIcon,
          objectType: ObjectTypes.CONTACT,
        },
      ],
    },
    {
      title: 'Trust Center',
      plan: PlanEnum.TRUST_CENTER_MODULE,
      href: '/trust-center',
      icon: HeartHandshakeIcon,
      isChildren: true,
      hidden: session?.user?.isOnboarding || billingExpired || isAuditor,
      children: [
        {
          title: 'Overview',
          href: '/trust-center/overview',
          icon: LayoutPanelTopIcon,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Branding',
          href: '/trust-center/branding',
          icon: PenToolIcon,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Domain',
          href: '/trust-center/domain',
          icon: EarthIcon,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Documents',
          href: '/trust-center/documents',
          icon: FileTextIcon,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'NDAs',
          href: '/trust-center/NDAs',
          icon: FilePenLineIcon,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Frameworks',
          href: '/trust-center/frameworks',
          icon: ShieldCheckIcon,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        {
          title: 'Controls',
          href: '/trust-center/controls',
          icon: SlidersHorizontalIcon,
          objectType: ObjectTypes.TRUST_CENTER,
        },
        { title: 'Subprocessors', href: '/trust-center/subprocessors', icon: ServerIcon, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'Updates', href: '/trust-center/updates', icon: MessageCirclePlusIcon, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'Subscribers', href: '/trust-center/subscribers', icon: UsersIcon, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'Customer Logos', href: '/trust-center/customer-logos', icon: BlocksIcon, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'FAQs', href: '/trust-center/faqs', icon: CircleHelpIcon, objectType: ObjectTypes.TRUST_CENTER },
        { title: 'Analytics', href: '/trust-center/analytics', icon: ChartSplineIcon, objectType: ObjectTypes.TRUST_CENTER },
      ],
    },
    {
      title: 'Exposure',
      href: '/exposure',
      icon: SatelliteDishIcon,
      plan: [PlanEnum.COMPLIANCE_MODULE, PlanEnum.VULNERABILITY_MANAGEMENT_MODULE, PlanEnum.RISK_MANAGEMENT_ADDON],
      hidden: session?.user?.isOnboarding || billingExpired,
      children: [
        {
          title: 'Overview',
          href: '/exposure/overview',
          icon: LayoutPanelTopIcon,
          objectType: ObjectTypes.FINDING,
        },
        {
          title: 'Triage Queue',
          href: '/exposure/triage',
          icon: ChartBarDecreasingIcon,
          objectType: ObjectTypes.VULNERABILITY,
        },
        {
          title: 'Risks',
          href: '/exposure/risks',
          icon: GaugeIcon,
          objectType: ObjectTypes.RISK,
        },
        {
          title: 'Scans',
          href: '/exposure/scans',
          icon: ScanTextIcon,
          objectType: ObjectTypes.SCAN,
        },
        {
          title: 'Findings',
          href: '/exposure/findings',
          icon: SearchIcon,
          objectType: ObjectTypes.FINDING,
        },
        {
          title: 'Vulnerabilities',
          href: '/exposure/vulnerabilities',
          icon: BadgeAlertIcon,
          objectType: ObjectTypes.VULNERABILITY,
        },
        {
          title: 'Remediations',
          href: '/exposure/remediations',
          icon: WrenchIcon,
          objectType: ObjectTypes.REMEDIATION,
        },
        {
          title: 'Reviews',
          href: '/exposure/reviews',
          icon: MessageSquareMoreIcon,
          objectType: ObjectTypes.REVIEW,
        },
      ],
    },
    {
      title: 'Automation',
      href: '/automation',
      icon: RouteIcon,
      isChildren: true,
      hidden: session?.user?.isOnboarding || billingExpired || isAuditor,
      children: [
        {
          title: 'Tasks',
          href: '/automation/tasks',
          icon: ClipboardCheckIcon,
        },
        {
          title: 'Questionnaires',
          href: '/automation/questionnaires',
          icon: SquarePenIcon,
          objectType: ObjectTypes.ASSESSMENT,
        },
        {
          title: 'Campaigns',
          href: '/automation/campaigns',
          icon: SendIcon,
          objectType: ObjectTypes.CAMPAIGN,
        },
        {
          title: 'Email Templates',
          href: '/automation/email-templates',
          icon: MailCheckIcon,
        },
        {
          title: 'Integrations',
          href: '/automation/integrations',
          icon: ConnectIcon,
        },
        {
          title: 'Workflow Definitions',
          href: '/automation/workflows',
          icon: BookTextIcon,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
        {
          title: 'Workflow Inbox',
          href: '/automation/workflows/inbox',
          icon: ArchiveIcon,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
        {
          title: 'Workflow Instances',
          href: '/automation/workflows/instances',
          icon: ActivityIcon,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
        {
          title: 'Workflow Templates',
          href: '/automation/workflows/templates',
          icon: WorkflowIcon,
          plan: PlanEnum.COMPLIANCE_MODULE,
          hidden: true,
        },
        {
          title: 'Workflow Wizard',
          href: '/automation/workflows/wizard',
          icon: SparklesIcon,
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
      title: 'Organization Settings',
      href: '/organization-settings',
      hidden: session?.user?.isOnboarding || isAuditor,
      icon: CogIcon,
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
          icon: LockIcon,
        },
        {
          title: 'Custom Data',
          href: '/organization-settings/custom-data',
          hidden: billingExpired,
          icon: BookmarkIcon,
        },
        {
          title: 'Subscribers',
          href: '/organization-settings/subscribers',
          icon: MailCheckIcon,
          hidden: true,
        },
        {
          title: 'Billing',
          href: '/organization-settings/billing',
          hidden: !isOwnerOrSuperAdmin(currentUserRole) && !isImpersonation,
          icon: CreditCardIcon,
        },
        {
          title: 'Audit Logs',
          href: '/organization-settings/logs',
          icon: HistoryIcon,
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
          icon: UserRoundPlusIcon,
        },
        {
          title: 'Groups',
          href: '/user-management/groups',
          icon: UsersIcon,
        },
      ],
    },
    {
      title: 'Developers',
      href: '/developers',
      icon: KeyboardIcon,
      hidden: session?.user?.isOnboarding || billingExpired || isAuditor,
      children: [
        {
          title: 'API Tokens',
          href: '/developers/api-tokens',
          icon: TerminalIcon,
        },
        {
          title: 'Personal Access Tokens',
          href: '/developers/personal-access-tokens',
          icon: KeyCircleIcon,
          hidden: isImpersonation,
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
          icon: IdCardIcon,
        },
      ],
      icon: UserRoundCogIcon,
    },
  ]
}

export const personalNavigationItems = (): (NavItem | Separator | NavHeading)[] => [
  {
    title: 'User settings',
    href: '/user-settings/profile',
    icon: UserRoundCogIcon,
  },
]
