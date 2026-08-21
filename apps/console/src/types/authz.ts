import { type AccessEnum } from '@/lib/authz/enums/access-enum'

export type TAccessRole = `${AccessEnum}` | 'member' | 'owner' | 'access'

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
