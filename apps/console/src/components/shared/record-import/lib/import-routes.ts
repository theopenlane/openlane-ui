import { type Session } from 'next-auth'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { type Crumb } from '@/providers/BreadcrumbContext'
import { type TAccessRole } from '@/types/authz'
import { pluralizeTypeName, toHumanLabel } from '@/utils/strings'

export type TImportPermission = AccessEnum | 'edit' | null

const SECTIONS = {
  registry: { label: 'Registry', href: '/registry' },
  exposure: { label: 'Exposure', href: '/exposure/overview' },
  automation: { label: 'Automation', href: '/automation' },
  organizationSettings: { label: 'Organization Settings', href: '/organization-settings' },
  userManagement: { label: 'User Management', href: '/user-management' },
} as const satisfies Record<string, Crumb>

type TImportRouteDetails = {
  listHref: string
  listLabel: string
  section?: Crumb
  displayName: string
  displayNamePlural?: string
  permission: TImportPermission
  gate?: ObjectTypes
}

export type TImportRoute = TImportRouteDetails & { href: string }

export const importDisplayNamePlural = ({ displayName, displayNamePlural }: Pick<TImportRoute, 'displayName' | 'displayNamePlural'>): string =>
  displayNamePlural ?? toHumanLabel(pluralizeTypeName(displayName))

const IMPORT_ROUTE_DETAILS = {
  [ObjectTypes.ACTION_PLAN]: {
    listHref: '/exposure/risks',
    listLabel: 'Risks',
    section: SECTIONS.exposure,
    displayName: 'Action Plan',
    permission: 'edit',
    gate: ObjectTypes.RISK,
  },
  [ObjectTypes.ASSET]: { listHref: '/registry/assets', listLabel: 'Assets', section: SECTIONS.registry, displayName: 'Asset', permission: 'edit' },
  [ObjectTypes.CONTACT]: {
    listHref: '/registry/contacts',
    listLabel: 'Contacts',
    section: SECTIONS.registry,
    displayName: 'Contact',
    permission: AccessEnum.CanCreateContact,
  },
  [ObjectTypes.CONTROL]: { listHref: '/controls', listLabel: 'Controls', displayName: 'Control', permission: null },
  [ObjectTypes.ENTITY]: { listHref: '/registry/vendors', listLabel: 'Vendors', section: SECTIONS.registry, displayName: 'Vendor', permission: 'edit' },
  [ObjectTypes.EVIDENCE]: { listHref: '/evidence', listLabel: 'Evidence', displayName: 'Evidence', displayNamePlural: 'Evidence', permission: null },
  [ObjectTypes.FINDING]: { listHref: '/exposure/findings', listLabel: 'Findings', section: SECTIONS.exposure, displayName: 'Finding', permission: 'edit' },
  [ObjectTypes.GROUP]: {
    listHref: '/user-management/groups',
    listLabel: 'Groups',
    section: SECTIONS.userManagement,
    displayName: 'Group',
    permission: null,
  },
  [ObjectTypes.IDENTITY_HOLDER]: {
    listHref: '/registry/personnel',
    listLabel: 'Personnel',
    section: SECTIONS.registry,
    displayName: 'Personnel',
    displayNamePlural: 'Personnel',
    permission: 'edit',
  },
  [ObjectTypes.INTERNAL_POLICY]: {
    listHref: '/policies',
    listLabel: 'Policies',
    displayName: 'Policy',
    displayNamePlural: 'Policies',
    permission: AccessEnum.CanCreateInternalPolicy,
  },
  [ObjectTypes.MAPPED_CONTROL]: {
    listHref: '/controls',
    listLabel: 'Controls',
    displayName: 'Control mapping',
    displayNamePlural: 'Control mappings',
    permission: null,
  },
  [ObjectTypes.PROCEDURE]: { listHref: '/procedures', listLabel: 'Procedures', displayName: 'Procedure', permission: AccessEnum.CanCreateProcedure },
  [ObjectTypes.REMEDIATION]: {
    listHref: '/exposure/remediations',
    listLabel: 'Remediations',
    section: SECTIONS.exposure,
    displayName: 'Remediation',
    permission: 'edit',
  },
  [ObjectTypes.REVIEW]: {
    listHref: '/exposure/reviews',
    listLabel: 'Reviews',
    section: SECTIONS.exposure,
    displayName: 'Review',
    permission: AccessEnum.CanCreateReview,
  },
  [ObjectTypes.RISK]: { listHref: '/exposure/risks', listLabel: 'Risks', section: SECTIONS.exposure, displayName: 'Risk', permission: AccessEnum.CanCreateRisk },
  [ObjectTypes.SCAN]: { listHref: '/exposure/scans', listLabel: 'Scans', section: SECTIONS.exposure, displayName: 'Scan', permission: 'edit' },
  [ObjectTypes.SUBSCRIBER]: {
    listHref: '/organization-settings/subscribers',
    listLabel: 'Subscribers',
    section: SECTIONS.organizationSettings,
    displayName: 'Subscriber',
    permission: null,
  },
  [ObjectTypes.SYSTEM_DETAIL]: {
    listHref: '/registry/system-details',
    listLabel: 'System Details',
    section: SECTIONS.registry,
    displayName: 'System Detail',
    permission: 'edit',
  },
  [ObjectTypes.TASK]: { listHref: '/automation/tasks', listLabel: 'Tasks', section: SECTIONS.automation, displayName: 'Task', permission: null },
  [ObjectTypes.TEMPLATE]: {
    listHref: '/automation/questionnaires/templates',
    listLabel: 'Templates',
    section: SECTIONS.automation,
    displayName: 'Template',
    permission: null,
    gate: ObjectTypes.ASSESSMENT,
  },
  [ObjectTypes.VULNERABILITY]: {
    listHref: '/exposure/vulnerabilities',
    listLabel: 'Vulnerabilities',
    section: SECTIONS.exposure,
    displayName: 'Vulnerability',
    displayNamePlural: 'Vulnerabilities',
    permission: 'edit',
  },
} as const satisfies Partial<Record<ObjectTypes, TImportRouteDetails>>

export type TImportableObjectType = keyof typeof IMPORT_ROUTE_DETAILS

const IMPORT_PATH = '/import'
export const IMPORT_TYPE_PARAM = 'type'
export const IMPORT_VENDOR_PARAM = 'vendorId'

const importHref = (entityType: TImportableObjectType, extra: Record<string, string> = {}): string =>
  `${IMPORT_PATH}?${new URLSearchParams({ [IMPORT_TYPE_PARAM]: entityType.toLowerCase(), ...extra })}`

const IMPORTABLE_TYPES = Object.keys(IMPORT_ROUTE_DETAILS) as TImportableObjectType[]

export const IMPORT_ROUTES = Object.fromEntries(IMPORTABLE_TYPES.map((entityType) => [entityType, { ...IMPORT_ROUTE_DETAILS[entityType], href: importHref(entityType) }])) as Record<
  TImportableObjectType,
  TImportRoute
>

export const resolveImportType = (value: string | undefined): TImportableObjectType | undefined => IMPORTABLE_TYPES.find((entityType) => entityType.toLowerCase() === value?.toLowerCase())

export const getImportRoute = (entityType: ObjectTypes): TImportRoute | undefined => (IMPORT_ROUTES as Partial<Record<ObjectTypes, TImportRoute>>)[entityType]

export const vendorContactsImportRoute = (vendorId: string, vendorName: string): TImportRoute => ({
  href: importHref(ObjectTypes.CONTACT, { [IMPORT_VENDOR_PARAM]: vendorId }),
  listHref: `/registry/vendors/${encodeURIComponent(vendorId)}?tab=contacts`,
  listLabel: vendorName,
  section: SECTIONS.registry,
  displayName: 'Contact',
  permission: 'edit',
  gate: ObjectTypes.ENTITY,
})

export type TImportTarget = { entityType: TImportableObjectType; vendorId?: string; gate: ObjectTypes; title: string }

export const resolveImportTarget = (type: string | undefined, vendorId: string | undefined): TImportTarget | undefined => {
  const entityType = resolveImportType(type)
  if (!entityType) return undefined

  const scopedVendorId = entityType === ObjectTypes.CONTACT ? vendorId : undefined
  const route = scopedVendorId ? vendorContactsImportRoute(scopedVendorId, '') : IMPORT_ROUTES[entityType]
  return { entityType, vendorId: scopedVendorId, gate: route.gate ?? entityType, title: `Import ${importDisplayNamePlural(route)}` }
}

export const canImportWith = (permission: TImportPermission, roles: TAccessRole[] | undefined, session: Session | null): boolean => {
  if (permission === null) return true
  if (permission === 'edit') return canEdit(roles, session)
  return hasPermission(roles, permission, session)
}

export const RETURN_TO_PARAM = 'returnTo'

const URL_BASE = 'http://localhost'

export const withReturnTo = (href: string, returnTo?: string | null): string => {
  if (!returnTo) return href
  const url = new URL(href, URL_BASE)
  url.searchParams.set(RETURN_TO_PARAM, returnTo)
  return `${url.pathname}${url.search}${url.hash}`
}
