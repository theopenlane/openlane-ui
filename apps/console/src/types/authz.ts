import { type AccessEnum } from '@/lib/authz/enums/access-enum'

export const NON_ENUM_ACCESS_ROLES = ['member', 'owner', 'access'] as const

export type TAccessRole = `${AccessEnum}` | (typeof NON_ENUM_ACCESS_ROLES)[number]

export type TPermissionData = {
  success?: boolean
  organization_id?: string
  roles: TAccessRole[]
}

export type TScopesResponse = {
  success: boolean
  /** Keys are object types (e.g. "control"), values are available permission levels (e.g. ["read", "write", "delete"]) */
  scopes: Record<string, string[]>
}
