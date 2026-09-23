import { type Session } from 'next-auth'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { type Crumb } from '@/providers/BreadcrumbContext'
import { type TAccessRole } from '@/types/authz'

export type TImportPermission = AccessEnum | 'edit' | null

const SECTIONS = {
  registry: { label: 'Registry', href: '/registry' },
  exposure: { label: 'Exposure', href: '/exposure/overview' },
  automation: { label: 'Automation', href: '/automation' },
  organizationSettings: { label: 'Organization Settings', href: '/organization-settings' },
  userManagement: { label: 'User Management', href: '/user-management' },
} as const satisfies Record<string, Crumb>

export type TImportRoute = {
  href: string
  listHref: string
  listLabel: string
  section?: Crumb
  displayName: string
  displayNamePlural?: string
  permission: TImportPermission
}

export const IMPORT_ROUTES = {
  [ObjectTypes.ACTION_PLAN]: {
    href: '/exposure/risks/action-plans/import',
    listHref: '/exposure/risks',
    listLabel: 'Risks',
    section: SECTIONS.exposure,
    displayName: 'Action Plan',
    permission: 'edit',
  },
  [ObjectTypes.ASSET]: { href: '/registry/assets/import', listHref: '/registry/assets', listLabel: 'Assets', section: SECTIONS.registry, displayName: 'Asset', permission: 'edit' },
  [ObjectTypes.CONTACT]: {
    href: '/registry/contacts/import',
    listHref: '/registry/contacts',
    listLabel: 'Contacts',
    section: SECTIONS.registry,
    displayName: 'Contact',
    permission: AccessEnum.CanCreateContact,
  },
  [ObjectTypes.CONTROL]: { href: '/controls/import', listHref: '/controls', listLabel: 'Controls', displayName: 'Control', permission: null },
  [ObjectTypes.ENTITY]: { href: '/registry/vendors/import', listHref: '/registry/vendors', listLabel: 'Vendors', section: SECTIONS.registry, displayName: 'Vendor', permission: 'edit' },
  [ObjectTypes.EVIDENCE]: { href: '/evidence/import', listHref: '/evidence', listLabel: 'Evidence', displayName: 'Evidence', displayNamePlural: 'Evidence', permission: null },
  [ObjectTypes.FINDING]: { href: '/exposure/findings/import', listHref: '/exposure/findings', listLabel: 'Findings', section: SECTIONS.exposure, displayName: 'Finding', permission: 'edit' },
  [ObjectTypes.GROUP]: {
    href: '/user-management/groups/import',
    listHref: '/user-management/groups',
    listLabel: 'Groups',
    section: SECTIONS.userManagement,
    displayName: 'Group',
    permission: null,
  },
  [ObjectTypes.IDENTITY_HOLDER]: {
    href: '/registry/personnel/import',
    listHref: '/registry/personnel',
    listLabel: 'Personnel',
    section: SECTIONS.registry,
    displayName: 'Personnel',
    displayNamePlural: 'Personnel',
    permission: 'edit',
  },
  [ObjectTypes.INTERNAL_POLICY]: {
    href: '/policies/import',
    listHref: '/policies',
    listLabel: 'Policies',
    displayName: 'Policy',
    displayNamePlural: 'Policies',
    permission: AccessEnum.CanCreateInternalPolicy,
  },
  [ObjectTypes.MAPPED_CONTROL]: {
    href: '/controls/mapped-controls/import',
    listHref: '/controls',
    listLabel: 'Controls',
    displayName: 'Control mapping',
    displayNamePlural: 'Control mappings',
    permission: null,
  },
  [ObjectTypes.PROCEDURE]: { href: '/procedures/import', listHref: '/procedures', listLabel: 'Procedures', displayName: 'Procedure', permission: AccessEnum.CanCreateProcedure },
  [ObjectTypes.REMEDIATION]: {
    href: '/exposure/remediations/import',
    listHref: '/exposure/remediations',
    listLabel: 'Remediations',
    section: SECTIONS.exposure,
    displayName: 'Remediation',
    permission: 'edit',
  },
  [ObjectTypes.REVIEW]: {
    href: '/exposure/reviews/import',
    listHref: '/exposure/reviews',
    listLabel: 'Reviews',
    section: SECTIONS.exposure,
    displayName: 'Review',
    permission: AccessEnum.CanCreateReview,
  },
  [ObjectTypes.RISK]: { href: '/exposure/risks/import', listHref: '/exposure/risks', listLabel: 'Risks', section: SECTIONS.exposure, displayName: 'Risk', permission: AccessEnum.CanCreateRisk },
  [ObjectTypes.SCAN]: { href: '/exposure/scans/import', listHref: '/exposure/scans', listLabel: 'Scans', section: SECTIONS.exposure, displayName: 'Scan', permission: 'edit' },
  [ObjectTypes.SUBSCRIBER]: {
    href: '/organization-settings/subscribers/import',
    listHref: '/organization-settings/subscribers',
    listLabel: 'Subscribers',
    section: SECTIONS.organizationSettings,
    displayName: 'Subscriber',
    permission: null,
  },
  [ObjectTypes.SYSTEM_DETAIL]: {
    href: '/registry/system-details/import',
    listHref: '/registry/system-details',
    listLabel: 'System Details',
    section: SECTIONS.registry,
    displayName: 'System Detail',
    permission: 'edit',
  },
  [ObjectTypes.TASK]: { href: '/automation/tasks/import', listHref: '/automation/tasks', listLabel: 'Tasks', section: SECTIONS.automation, displayName: 'Task', permission: null },
  [ObjectTypes.TEMPLATE]: {
    href: '/automation/questionnaires/templates/import',
    listHref: '/automation/questionnaires/templates',
    listLabel: 'Templates',
    section: SECTIONS.automation,
    displayName: 'Template',
    permission: null,
  },
  [ObjectTypes.VULNERABILITY]: {
    href: '/exposure/vulnerabilities/import',
    listHref: '/exposure/vulnerabilities',
    listLabel: 'Vulnerabilities',
    section: SECTIONS.exposure,
    displayName: 'Vulnerability',
    displayNamePlural: 'Vulnerabilities',
    permission: 'edit',
  },
} as const satisfies Partial<Record<ObjectTypes, TImportRoute>>

export type TImportableObjectType = keyof typeof IMPORT_ROUTES

const IMPORT_ROUTE_BY_TYPE: Partial<Record<ObjectTypes, TImportRoute>> = IMPORT_ROUTES

export const getImportRoute = (entityType: ObjectTypes): TImportRoute | undefined => IMPORT_ROUTE_BY_TYPE[entityType]

export const vendorContactsImportRoute = (vendorId: string, vendorName: string): TImportRoute => ({
  href: `/registry/vendors/${vendorId}/contacts/import`,
  listHref: `/registry/vendors/${vendorId}?tab=contacts`,
  listLabel: vendorName,
  section: SECTIONS.registry,
  displayName: 'Contact',
  permission: 'edit',
})

export const canImportWith = (permission: TImportPermission, roles: TAccessRole[] | undefined, session: Session | null): boolean => {
  if (permission === null) return true
  if (permission === 'edit') return canEdit(roles, session)
  return hasPermission(roles, permission, session)
}

export const RETURN_TO_PARAM = 'returnTo'

export const withReturnTo = (href: string, returnTo?: string | null): string => (returnTo ? `${href}?${new URLSearchParams({ [RETURN_TO_PARAM]: returnTo })}` : href)
