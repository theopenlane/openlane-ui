import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'
import { parseStringArray } from '@/lib/storage/org-persisted-store'
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/storage/safe-local-storage'
import { NON_ENUM_ACCESS_ROLES, type TAccessRole, type TPermissionData } from '@/types/authz'

const ORGANIZATION_ROLES_STORAGE_KEY = 'organization-roles'

const KNOWN_ACCESS_ROLES = new Set<string>([...Object.values(AccessEnum), ...NON_ENUM_ACCESS_ROLES])

const isAccessRole = (value: string): value is TAccessRole => KNOWN_ACCESS_ROLES.has(value)

const storageKey = (userId: string, organizationId: string) => getOrganizationStorageKey(`${ORGANIZATION_ROLES_STORAGE_KEY}:${userId}`, organizationId)

export const readCachedOrganizationRoles = (userId?: string, organizationId?: string): TPermissionData | undefined => {
  if (!userId || !organizationId) return undefined

  const raw = safeGetItem(storageKey(userId, organizationId))
  const roles = raw ? parseStringArray(raw)?.filter(isAccessRole) : undefined

  return roles ? { roles } : undefined
}

export const writeCachedOrganizationRoles = (userId: string | undefined, organizationId: string | undefined, permission: TPermissionData): void => {
  if (!userId || !organizationId) return

  safeSetItem(storageKey(userId, organizationId), JSON.stringify(permission.roles))
}

export const clearCachedOrganizationRoles = (userId: string | undefined, organizationId: string | undefined): void => {
  if (!userId || !organizationId) return

  safeRemoveItem(storageKey(userId, organizationId))
}
