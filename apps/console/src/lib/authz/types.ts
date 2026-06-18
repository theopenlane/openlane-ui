import type { TAccessRole } from '@repo/codegen/src/permissions.generated'

export type { TAccessRole }

export type TPermissionData = {
  success?: boolean
  organization_id?: string
  roles: TAccessRole[]
}

export type TScopesResponse = {
  success: boolean
  scopes: Record<string, string[]>
}
